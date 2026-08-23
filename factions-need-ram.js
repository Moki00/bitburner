/** @param {NS} ns */
export async function main(ns) {
  const shareScript = "share-ram-with-factions.js";
  const scriptRam = 4.0; // ns.share() scripts cost 4.0 GB
  const HOME_RESERVE_RAM = 32; // GB free on home for terminal

  if (ns.scriptRunning("workers.js", "home")) {
    ns.scriptKill("workers.js", "home");
    ns.tprint("Terminated workers.js for Faction RAM");
  }

  function getAllServers(node = "home", visited = new Set()) {
    visited.add(node);
    for (const neighbor of ns.scan(node)) {
      if (!visited.has(neighbor)) {
        getAllServers(neighbor, visited);
      }
    }
    return Array.from(visited);
  }

  // Ensure worker script exists on home
  if (!ns.fileExists(shareScript, "home")) {
    await ns.write(
      shareScript,
      "/** @param {NS} ns */\nexport async function main(ns) { while(true) { await ns.share(); } }",
      "w",
    );
  }

  const copiedServers = new Set();
  const workerScripts = ["hack.js", "grow.js", "weaken.js"];

  ns.tprint("Clearing worker threads across fleet");

  while (true) {
    const servers = getAllServers();

    for (const server of servers) {
      if (!ns.hasRootAccess(server)) continue;

      for (const script of workerScripts) {
        if (ns.scriptRunning(script, server)) {
          ns.scriptKill(script, server);
        }
      }

      // Copy script once per server
      if (server !== "home" && !copiedServers.has(server)) {
        await ns.scp(shareScript, server, "home");
        copiedServers.add(server);
      }

      let availableRam =
        ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

      // Reserve space on home
      if (server === "home") {
        availableRam = Math.max(0, availableRam - HOME_RESERVE_RAM);
      }

      const threads = Math.floor(availableRam / scriptRam);

      if (threads > 0) {
        ns.exec(shareScript, server, threads);
        ns.print(`[SHARE] Launched ${threads} threads on ${server}`);
      }
    }

    await ns.sleep(10000); // Check for newly freed or upgraded RAM every 10s
  }
}
