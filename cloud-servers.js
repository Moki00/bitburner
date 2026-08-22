/** @param {NS} ns */
export async function main(ns) {
  // --- Configuration ---
  const RAM = 256;
  const MIN_RAM = 8;
  const MULTIPLIER = 4;
  const MAX_RAM = RAM * MULTIPLIER; // 1024 GB (1 TB) Hard Cap
  const MIN_WALLET_BUFFER = 500_000; // Keeps $500k untouched
  const RESERVE_RATIO = 0.5; // Only spend 50% of funds above buffer

  const limit = ns.cloud.getServerLimit();

  function getSpendable() {
    const money = ns.getServerMoneyAvailable("home");
    if (money <= MIN_WALLET_BUFFER) return 0;
    return (money - MIN_WALLET_BUFFER) * (1 - RESERVE_RATIO);
  }

  function getMaxAffordableRam(budget) {
    let ram = MIN_RAM;
    while (ram * 2 <= MAX_RAM && ns.cloud.getServerCost(ram * 2) <= budget) {
      ram *= 2;
    }
    return ram;
  }

  while (true) {
    const servers = ns.cloud.getServerNames();
    let spendable = getSpendable();

    // 1. Buy new servers up to the limit (25)
    if (servers.length < limit) {
      if (spendable >= ns.cloud.getServerCost(MIN_RAM)) {
        const targetRam = getMaxAffordableRam(spendable);
        const name = `cloud-${String(servers.length + 1).padStart(2, "0")}`;
        const hostname = ns.cloud.purchaseServer(name, targetRam);

        if (hostname) {
          ns.print(
            `[CLOUD BUY] ${hostname} (${targetRam} GB) for $${ns.format.number(
              ns.cloud.getServerCost(targetRam),
            )}`,
          );
        }
      }
      await ns.sleep(3000);
      continue;
    }

    // 2. Find the single lowest RAM server
    let minRam = MAX_RAM;
    let targetHost = null;

    for (const host of servers) {
      const ram = ns.getServerMaxRam(host);
      if (ram < minRam) {
        minRam = ram;
        targetHost = host;
      }
    }

    // 3. Idle if all servers hit the target cap
    if (!targetHost || minRam >= MAX_RAM) {
      ns.print(`[CLOUD IDLE] All ${limit} servers at or above ${MAX_RAM} GB.`);
      await ns.sleep(30000);
      continue;
    }

    // 4. Upgrade the weakest server
    const nextRam = minRam * 2;
    const upgradeCost = ns.cloud.getServerUpgradeCost(targetHost, nextRam);

    if (spendable >= upgradeCost) {
      if (ns.cloud.upgradeServer(targetHost, nextRam)) {
        ns.print(
          `[CLOUD UPGRADE] ${targetHost}: ${minRam} GB -> ${nextRam} GB for $${ns.format.number(
            upgradeCost,
          )}`,
        );
      }
    }

    await ns.sleep(3000);
  }
}
