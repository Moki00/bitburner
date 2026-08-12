/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  // Read target from file created by target-finder.js, or default to phantasy
  let target = "harakiri-sushi";
  if (ns.fileExists("target.txt")) {
    target = ns.read("target.txt").trim();
  }

  const workerScripts = ["hack.js", "grow.js", "weaken.js"];
  const scriptRam = 1.75;

  // Helper to discover all connected servers on the network
  function getAllServers(node = "home", visited = new Set()) {
    visited.add(node);
    for (const neighbor of ns.scan(node)) {
      if (!visited.has(neighbor)) {
        getAllServers(neighbor, visited);
      }
    }
    return Array.from(visited);
  }

  const servers = getAllServers();

  for (const server of servers) {
    if (!ns.hasRootAccess(server)) continue;

    // Copy light workers to target host if it's not home
    if (server !== "home") {
      await ns.scp(workerScripts, server, "home");
    }

    // Reserve 32 GB on 'home' for startup/manager scripts
    let availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    if (server === "home") {
      availableRam = Math.max(0, availableRam - 32);
    }

    const threads = Math.floor(availableRam / scriptRam);

    if (threads > 0) {
      // Determine action based on server state
      const currentSec = ns.getServerSecurityLevel(target);
      const minSec = ns.getServerMinSecurityLevel(target);
      const currentMoney = ns.getServerMoneyAvailable(target);
      const maxMoney = ns.getServerMaxMoney(target);

      let chosenScript = "hack.js";

      if (currentSec > minSec + 5) {
        chosenScript = "weaken.js"; // Security too high -> weaken
      } else if (currentMoney < maxMoney * 0.75) {
        chosenScript = "grow.js"; // Money too low -> grow
      }

      // Execute worker with maximum possible threads
      ns.exec(chosenScript, server, threads, target);
      ns.print(
        `Deployed ${threads} threads of ${chosenScript} on ${server} -> targeting ${target}`,
      );
    }
  }
}
