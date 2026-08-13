/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

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

    const servers = getAllServers();

    for (const server of servers) {
      // Root
      if (!ns.hasRootAccess(server)) {
        try {
          ns.nuke(server);
        } catch (e) {}
      }

      if (server !== "home") {
        await ns.scp(workerScripts, server, "home");
      }

      let availableRam =
        ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
      if (server === "home") {
        availableRam = Math.max(0, availableRam - 128); // Keep 128GB free for other scripts on home
      }

      const threads = Math.floor(availableRam / scriptRam);

      if (threads > 0) {
        const currentSec = ns.getServerSecurityLevel(target);
        const minSec = ns.getServerMinSecurityLevel(target);
        const currentMoney = ns.getServerMoneyAvailable(target);
        const maxMoney = ns.getServerMaxMoney(target);

        let chosenScript = "hack.js";

        if (currentSec > minSec + 5) {
          chosenScript = "weaken.js";
        } else if (currentMoney < maxMoney * 0.75) {
          chosenScript = "grow.js";
        }

        ns.exec(chosenScript, server, threads, target);
      }
    }

    await ns.sleep(5000); // Pulse every 5 seconds
  }
}
