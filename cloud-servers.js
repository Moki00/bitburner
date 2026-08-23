/** @param {NS} ns */
export async function main(ns) {
  const MIN_RAM = 2; // 2GB start
  const limit = ns.cloud.getServerLimit();

  // Defines the next EXE threshold, its cost, and the RAM ceiling it unlocks
  const progGates = [
    { file: "BruteSSH.exe", cost: 500_000, cap: 2 },
    { file: "FTPCrack.exe", cost: 1_500_000, cap: 8 },
    { file: "relaySMTP.exe", cost: 5_000_000, cap: 32 },
    { file: "HTTPWorm.exe", cost: 30_000_000, cap: 128 },
    { file: "SQLInject.exe", cost: 250_000_000, cap: 512 },
  ];

  function getProgressionState() {
    for (const gate of progGates) {
      if (!ns.fileExists(gate.file, "home")) {
        // Next EXE is not owned yet: lock RAM to previous tier and protect EXE cost
        return {
          maxRam: gate.cap,
          walletBuffer: gate.cost,
          nextExe: gate.file,
        };
      }
    }
    // All 5 port openers owned
    return {
      maxRam: 1024,
      walletBuffer: 0,
      nextExe: "ALL_OWNED",
    };
  }

  function getSpendable(walletBuffer) {
    const money = ns.getServerMoneyAvailable("home");
    if (money <= walletBuffer) return 0;
    return (money - walletBuffer) * 0.5; // Only spend 50% of surplus
  }

  function getMaxAffordableRam(budget, cap) {
    let ram = MIN_RAM;
    while (ram * 2 <= cap && ns.cloud.getServerCost(ram * 2) <= budget) {
      ram *= 2;
    }
    return ram;
  }

  while (true) {
    const state = getProgressionState();
    const servers = ns.cloud.getServerNames();
    const spendable = getSpendable(state.walletBuffer);

    // 1. Buy initial servers up to limit (25)
    if (servers.length < limit) {
      if (spendable >= ns.cloud.getServerCost(MIN_RAM)) {
        const targetRam = getMaxAffordableRam(spendable, state.maxRam);
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

    // 2. Find the lowest RAM server in current fleet
    let minRam = state.maxRam;
    let targetHost = null;

    for (const host of servers) {
      const ram = ns.getServerMaxRam(host);
      if (ram < minRam) {
        minRam = ram;
        targetHost = host;
      }
    }

    // 3. Check if all servers hit the dynamic progression cap
    if (!targetHost || minRam >= state.maxRam) {
      ns.print(
        `[CLOUD GATE] Waiting on ${state.nextExe}. Cloud fleet capped at ${state.maxRam} GB.`,
      );
      await ns.sleep(15000);
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
