/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const workerScripts = ["hack.js", "grow.js", "weaken.js"];
  const scriptRam = 1.75;
  const SAVE_RAM_ON_HOME = 32; // Reserve enough headroom on home for Singularity scripts

  function getAllServers(node = "home", visited = new Set()) {
    visited.add(node);
    for (const neighbor of ns.scan(node)) {
      if (!visited.has(neighbor)) {
        getAllServers(neighbor, visited);
      }
    }
    return Array.from(visited);
  }

  while (true) {
    let target = "n00dles";
    if (ns.fileExists("target.txt", "home")) {
      const saved = ns.read("target.txt").trim();
      if (saved.length > 0 && ns.serverExists(saved)) {
        target = saved;
      }
    }

    const minSec = ns.getServerMinSecurityLevel(target);
    const maxMoney = ns.getServerMaxMoney(target);
    const servers = getAllServers();
    const batchId = Date.now();

    for (const server of servers) {
      if (!ns.hasRootAccess(server)) {
        try {
          ns.nuke(server);
        } catch {}
      }
      if (!ns.hasRootAccess(server)) continue;

      // 1. Copy worker scripts only if missing
      if (server !== "home" && !ns.fileExists("hack.js", server)) {
        await ns.scp(workerScripts, server, "home");
      }

      // 2. Determine usable RAM
      let availableRam =
        ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
      if (server === "home") {
        availableRam = Math.max(0, availableRam - SAVE_RAM_ON_HOME);
      }

      const totalThreads = Math.floor(availableRam / scriptRam);
      if (totalThreads <= 0) continue;

      // Sample target state per host to catch mid-batch shifts
      const currentSec = ns.getServerSecurityLevel(target);
      const currentMoney = ns.getServerMoneyAvailable(target);

      // Phase 1: Security elevated -> Weaken only
      if (currentSec > minSec + 2) {
        ns.exec("weaken.js", server, totalThreads, target, batchId);
        continue;
      }

      // Phase 2: Money low -> Grow with Weaken stabilization
      if (currentMoney < maxMoney * 0.9) {
        if (totalThreads === 1) {
          ns.exec("grow.js", server, 1, target, batchId);
        } else {
          const weakenThreads = Math.max(1, Math.floor(totalThreads * 0.15));
          const growThreads = totalThreads - weakenThreads;
          if (growThreads > 0)
            ns.exec("grow.js", server, growThreads, target, batchId);
          if (weakenThreads > 0)
            ns.exec("weaken.js", server, weakenThreads, target, batchId);
        }
        continue;
      }

      // Phase 3: Farm State (Safe thread partitioning)
      if (totalThreads < 5) {
        // Low RAM hosts focus on hacking
        ns.exec("hack.js", server, totalThreads, target, batchId);
      } else {
        const hackThreads = Math.max(1, Math.floor(totalThreads * 0.1));
        const weakenThreads = Math.max(1, Math.floor(totalThreads * 0.15));
        const growThreads = Math.max(
          0,
          totalThreads - hackThreads - weakenThreads,
        );

        if (hackThreads > 0)
          ns.exec("hack.js", server, hackThreads, target, batchId);
        if (growThreads > 0)
          ns.exec("grow.js", server, growThreads, target, batchId);
        if (weakenThreads > 0)
          ns.exec("weaken.js", server, weakenThreads, target, batchId);
      }
    }

    await ns.sleep(5000);
  }
}
