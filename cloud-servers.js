/** @param {NS} ns */
export async function main(ns) {
  const MIN_RAM = 2;
  const limit = ns.cloud.getServerLimit();

  const progGates = [
    { file: "BruteSSH.exe", cost: 500_000, cap: 8 },
    { file: "FTPCrack.exe", cost: 1_500_000, cap: 32 },
    { file: "relaySMTP.exe", cost: 5_000_000, cap: 64 },
    { file: "HTTPWorm.exe", cost: 30_000_000, cap: 128 },
    { file: "SQLInject.exe", cost: 250_000_000, cap: 256 },
  ];

  function getProgressionState() {
    for (const gate of progGates) {
      if (!ns.fileExists(gate.file, "home")) {
        return {
          maxRam: gate.cap,
          walletBuffer: gate.cost,
          nextExe: gate.file,
          isBlocked: false, // Don't block buying cloud servers
          // isBlocked: true, // Block cloud servers until files exists
        };
      }
    }

    // All programs owned: upgrade servers to 65,536 GB (64 TB)
    return {
      maxRam: 1024 * 64,
      walletBuffer: 0, // not end of world
      // walletBuffer: 100_000_000_000, // $100b for end with 30 augments and 2500 hack
      nextExe: "ALL_OWNED",
      isBlocked: false,
    };
  }

  function getSpendable(state) {
    // Stop spending if waiting on an unbought EXE file
    if (state.isBlocked) return 0;

    const money = ns.getServerMoneyAvailable("home");
    const liquidReserve = 5_000_000;
    if (money <= liquidReserve) return 0;
    return (money - liquidReserve) * 0.5;
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
    const spendable = getSpendable(state);

    if (state.isBlocked) {
      ns.tprint(
        `[CLOUD HOLD] Paused. Awaiting purchase of ${state.nextExe} ($${ns.format.number(state.walletBuffer)}).`,
      );
      await ns.sleep(5000);
      continue;
    }

    // 1. Buy initial servers up to limit (25)
    if (servers.length < limit) {
      if (spendable >= ns.cloud.getServerCost(MIN_RAM)) {
        ns.print(`trying to buy ${MIN_RAM}`);
        const targetRam = getMaxAffordableRam(spendable, state.maxRam);
        const name = `cloud-${String(servers.length + 1).padStart(2, "0")}`;
        const hostname = ns.cloud.purchaseServer(name, targetRam);

        if (hostname) {
          ns.tprint(
            `[CLOUD BUY] ${hostname} (${targetRam} GB) for $${ns.format.number(ns.cloud.getServerCost(targetRam))}`,
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
      ns.print(`[CLOUD CAP] Fleet capped at ${state.maxRam} GB.`);
      await ns.sleep(15000);
      continue;
    }

    // 4. Upgrade the weakest server
    const nextRam = minRam * 2;
    const upgradeCost = ns.cloud.getServerUpgradeCost(targetHost, nextRam);

    if (spendable >= upgradeCost) {
      if (ns.cloud.upgradeServer(targetHost, nextRam)) {
        ns.print(
          `[CLOUD UPGRADE] ${targetHost}: ${minRam} GB -> ${nextRam} GB for $${ns.format.number(upgradeCost)}`,
        );
      }
    }

    await ns.sleep(3000);
  }
}
