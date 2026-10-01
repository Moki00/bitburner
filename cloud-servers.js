// This script requires 5.85GB of RAM to run for 1 thread(s)
//   2.25GB | cloud.purchaseServer (fn)
//   1.60GB | baseCost (misc)
//   1.05GB | cloud.getServerNames (fn)
//   0.25GB | cloud.getServerCost (fn)
//   0.25GB | cloud.upgradeServer (fn)
//   0.10GB | fileExists (fn)
//   0.10GB | getServerMoneyAvailable (fn)
//   0.10GB | cloud.getServerUpgradeCost (fn)
//   0.05GB | cloud.getServerLimit (fn)
//   0.05GB | getHackingLevel (fn)
//   0.05GB | getServerMaxRam (fn)

/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const MIN_RAM = 4;
  const SERVER_LIMIT = ns.cloud.getServerLimit();

  const progGates = [
    { file: "BruteSSH.exe", cost: 500_000, cap: 8 },
    { file: "FTPCrack.exe", cost: 1_500_000, cap: 32 },
    { file: "relaySMTP.exe", cost: 5_000_000, cap: 64 },
    { file: "HTTPWorm.exe", cost: 30_000_000, cap: 128 },
    { file: "SQLInject.exe", cost: 250_000_000, cap: 256 },
  ];

  function getDynamicMaxRam() {
    const hackLevel = ns.getHackingLevel();
    if (hackLevel >= 6000) {
      return 1024 * 128; // 128 TB
    }
    if (hackLevel >= 2500) {
      return 1024 * 64; // 64 TB
    }
    if (hackLevel >= 1000) {
      return 1024 * 4; // 4 TB
    }
    if (hackLevel >= 500) {
      return 1024 * 2; // 2 TB
    }
    return 512;
  }

  function getProgressionState() {
    for (const gate of progGates) {
      if (!ns.fileExists(gate.file, "home")) {
        return {
          maxRam: gate.cap,
          walletBuffer: gate.cost,
          nextExe: gate.file,
        };
      }
    }

    return {
      maxRam: getDynamicMaxRam(),
      walletBuffer: 0,
      nextExe: "ALL_OWNED",
    };
  }

  function getSpendableBudget() {
    const money = ns.getServerMoneyAvailable("home");
    const hackLevel = ns.getHackingLevel();

    // Preserve $100b liquid reserve if approaching Daedalus requirements
    let liquidReserve = 5_000_000;
    if (hackLevel >= 2000 && money >= 50_000_000_000) {
      liquidReserve = 100_000_000_000;
    }

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
    const spendable = getSpendableBudget();

    // 1. Buy initial servers up to limit (25)
    if (servers.length < SERVER_LIMIT) {
      if (spendable >= ns.cloud.getServerCost(MIN_RAM)) {
        const targetRam = getMaxAffordableRam(spendable, state.maxRam);
        const name = `cloud-${String(servers.length + 1).padStart(2, "0")}`;
        const hostname = ns.cloud.purchaseServer(name, targetRam);

        if (hostname) {
          ns.tprint(
            `[CLOUD BUY] ${hostname} (${targetRam} GB) for $${ns.format.number(
              ns.cloud.getServerCost(targetRam),
            )}`,
          );
        }
      }
      await ns.sleep(3000);
      continue;
    }

    // 2. Locate the server with the lowest RAM in the fleet
    let minRam = state.maxRam;
    let targetHost = null;

    for (const host of servers) {
      const ram = ns.getServerMaxRam(host);
      if (ram < minRam) {
        minRam = ram;
        targetHost = host;
      }
    }

    // 3. Confirm whether all servers meet the current progression cap
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
        ns.tprint(
          `[CLOUD UPGRADE] ${targetHost}: ${minRam} GB -> ${nextRam} GB for $${ns.format.number(
            upgradeCost,
          )}`,
        );
      }
    }

    await ns.sleep(3000);
  }
}
