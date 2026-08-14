/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const MAX_RAM = 1024; // HARD CAP: 1024 GB (1 TB) per server. Change to 2048 only if swimming in trillions.
  const RESERVE_BUFFER = 0.8; // Keep 80% of your cash untouched for Augmentations!

  let targetRam = 8;
  const limit = ns.getPurchasedServerLimit();

  ns.print(`[CLOUD] Manager started. Max RAM Cap: ${MAX_RAM} GB.`);

  while (true) {
    const servers = ns.getPurchasedServers();
    const myMoney = ns.getServerMoneyAvailable("home");
    const spendableMoney = myMoney * (1 - RESERVE_BUFFER);

    // 1. Purchase missing servers up to limit (25)
    if (servers.length < limit) {
      const cost = ns.getPurchasedServerCost(targetRam);
      if (spendableMoney >= cost) {
        const hostname = ns.purchaseServer(
          `cloud-${servers.length + 1}`,
          targetRam,
        );
        if (hostname) {
          ns.tprint(`[CLOUD] Purchased server: ${hostname} (${targetRam} GB)`);
        }
      }
    } else {
      // 2. Upgrade existing servers tier by tier
      let allAtTarget = true;

      for (const host of servers) {
        const curRam = ns.getServerMaxRam(host);

        if (curRam < targetRam) {
          allAtTarget = false;
          const upgradeCost = ns.getPurchasedServerUpgradeCost(host, targetRam);

          if (spendableMoney >= upgradeCost) {
            if (ns.upgradePurchasedServer(host, targetRam)) {
              ns.print(`[CLOUD] Upgraded ${host} to ${targetRam} GB`);
            }
          }
        }
      }

      // 3. When every server reaches current tier, bump to next tier (up to MAX_RAM)
      if (allAtTarget) {
        if (targetRam >= MAX_RAM) {
          ns.print(
            `[CLOUD] All 25 servers reached MAX CAP (${MAX_RAM} GB). Sleeping...`,
          );
          await ns.sleep(60000); // Check once a minute
          continue;
        }
        targetRam = Math.min(MAX_RAM, targetRam * 2);
        ns.tprint(
          `[CLOUD] All servers at ${targetRam / 2} GB. Target increased to ${targetRam} GB.`,
        );
      }
    }

    await ns.sleep(10000); // Pulse every 10 seconds
  }
}
