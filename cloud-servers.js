/** @param {NS} ns */
export async function main(ns) {
  const MAX_RAM = 1024; // HARD CAP: 1024 GB (1 TB). Won't touch anything higher.
  const RESERVE_RATIO = 0.5; // Keep at least 50% of your cash untouched

  const limit = ns.cloud.getServerLimit();

  while (true) {
    const servers = ns.cloud.getServerNames();

    // 1. Determine the actual lowest RAM tier currently among your servers
    let lowestRam = MAX_RAM;
    if (servers.length < limit) {
      lowestRam = 8;
    } else {
      for (const host of servers) {
        const r = ns.getServerMaxRam(host);
        if (r < lowestRam) lowestRam = r;
      }
    }

    // If everything is already at or above MAX_RAM, idle safely
    if (servers.length === limit && lowestRam >= MAX_RAM) {
      ns.print(
        `[CLOUD] All servers are at or above ${MAX_RAM} GB cap. Idling...`,
      );
      await ns.sleep(60000);
      continue;
    }

    const targetRam = Math.min(
      MAX_RAM,
      servers.length < limit ? 8 : lowestRam * 2,
    );

    // 2. Buy missing servers up to 25
    if (servers.length < limit) {
      const cost = ns.getPurchasedServerCost(targetRam);
      const spendable =
        ns.getServerMoneyAvailable("home") * (1 - RESERVE_RATIO);

      if (spendable >= cost) {
        const hostname = ns.purchaseServer(
          `cloud-${servers.length + 1}`,
          targetRam,
        );
        if (hostname) {
          ns.print(`[CLOUD] Purchased ${hostname} with ${targetRam} GB RAM`);
        }
      }
    }
    // 3. Upgrade existing servers to targetRam
    else {
      for (const host of servers) {
        const curRam = ns.getServerMaxRam(host);

        if (curRam < targetRam) {
          const upgradeCost = ns.getPurchasedServerUpgradeCost(host, targetRam);
          const spendable =
            ns.getServerMoneyAvailable("home") * (1 - RESERVE_RATIO);

          if (spendable >= upgradeCost) {
            if (ns.upgradePurchasedServer(host, targetRam)) {
              ns.print(
                `[CLOUD] Upgraded ${host}: ${curRam} GB -> ${targetRam} GB`,
              );
            }
          }
        }
      }
    }

    await ns.sleep(5000); // 5-second pulse
  }
}
