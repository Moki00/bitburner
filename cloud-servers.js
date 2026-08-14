/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const MAX_RAM = 1024; // Cap upgrades at 1024 GB (1TB) to prevent infinite cash drain
  const RESERVE_MONEY_RATIO = 0.5; // Always keep 50% of your current money safe

  let targetRam = 8;
  const limit = ns.getPurchasedServerLimit();

  while (true) {
    const servers = ns.getPurchasedServers();

    // 1. Buy initial servers if under 25 limit
    if (servers.length < limit) {
      const cost = ns.getPurchasedServerCost(targetRam);
      const availableMoney =
        ns.getServerMoneyAvailable("home") * (1 - RESERVE_MONEY_RATIO);

      if (availableMoney >= cost) {
        const hostname = ns.purchaseServer(
          `cloud-${servers.length + 1}`,
          targetRam,
        );
        if (hostname) {
          ns.print(`[CLOUD] Bought ${hostname} (${targetRam} GB)`);
        }
      }
    } else {
      // 2. Check if all servers meet current target RAM
      let allAtTarget = true;

      for (const host of servers) {
        const curRam = ns.getServerMaxRam(host);

        if (curRam < targetRam) {
          allAtTarget = false;
          const cost = ns.getPurchasedServerUpgradeCost(host, targetRam);
          const availableMoney =
            ns.getServerMoneyAvailable("home") * (1 - RESERVE_MONEY_RATIO);

          if (availableMoney >= cost) {
            if (ns.upgradePurchasedServer(host, targetRam)) {
              ns.print(`[CLOUD] Upgraded ${host} to ${targetRam} GB`);
            }
          }
        }
      }

      // If all servers are upgraded to target, increase target (up to MAX_RAM)
      if (allAtTarget) {
        if (targetRam >= MAX_RAM) {
          ns.print(`[CLOUD] All servers reached cap of ${MAX_RAM} GB. Idle.`);
          await ns.sleep(60000);
          continue;
        }
        targetRam = Math.min(MAX_RAM, targetRam * 2);
        ns.print(`[CLOUD] Target RAM increased to ${targetRam} GB.`);
      }
    }

    await ns.sleep(5000);
  }
}
