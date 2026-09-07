/** @param {NS} ns */
export async function main(ns) {
  const workerScripts = ["hack.js", "grow.js", "weaken.js"];
  const scriptRam = 1.75;

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
    if (ns.fileExists("target.txt")) {
      target = ns.read("target.txt").trim();
    }

    const currentSec = ns.getServerSecurityLevel(target);
    const minSec = ns.getServerMinSecurityLevel(target);
    const currentMoney = ns.getServerMoneyAvailable(target);
    const maxMoney = ns.getServerMaxMoney(target);

    const servers = getAllServers();
    const batchId = Date.now();

    for (const server of servers) {
      if (!ns.hasRootAccess(server)) {
        try {
          ns.nuke(server);
        } catch (e) {}
      }

      if (!ns.hasRootAccess(server)) continue;

      if (server !== "home") {
        await ns.scp(workerScripts, server, "home");
      }

      let availableRam =
        ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
      if (server === "home") {
        availableRam = Math.max(0, availableRam - 128);
      }

      const totalThreads = Math.floor(availableRam / scriptRam);
      if (totalThreads <= 0) continue;

      // Phase 1: Security is elevated, focus strictly on weakening
      if (currentSec > minSec + 2) {
        ns.exec("weaken.js", server, totalThreads, target, batchId);
        continue;
      }

      // Phase 2: Cash is low, grow money while keeping security flat
      if (currentMoney < maxMoney * 0.9) {
        const weakenThreads = Math.max(1, Math.floor(totalThreads * 0.15));
        const growThreads = totalThreads - weakenThreads;

        if (growThreads > 0) {
          ns.exec("grow.js", server, growThreads, target, batchId);
        }
        if (weakenThreads > 0) {
          ns.exec("weaken.js", server, weakenThreads, target, batchId);
        }
        continue;
      }

      // Phase 3: Farm state, split into a 10% Hack, 75% Grow, 15% Weaken ratio
      const hackThreads = Math.max(1, Math.floor(totalThreads * 0.1));
      const weakenThreads = Math.max(1, Math.floor(totalThreads * 0.15));
      const growThreads = totalThreads - hackThreads - weakenThreads;

      if (hackThreads > 0) {
        ns.exec("hack.js", server, hackThreads, target, batchId);
      }
      if (growThreads > 0) {
        ns.exec("grow.js", server, growThreads, target, batchId);
      }
      if (weakenThreads > 0) {
        ns.exec("weaken.js", server, weakenThreads, target, batchId);
      }
    }

    await ns.sleep(5000);
  }
}
