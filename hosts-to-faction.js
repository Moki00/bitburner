/** @param {NS} ns */
export async function main(ns) {
  const shareScript = "share-ram-factions.js";
  const scriptRam = ns.getScriptRam(shareScript);

  // Helper to recursively discover all connected nodes
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

    // Stop current share scripts on target server
    ns.scriptKill(shareScript, server);

    // Copy script if it's not home
    if (server !== "home") {
      await ns.scp(shareScript, server, "home");
    }

    const freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    const threads = Math.floor(freeRam / scriptRam);

    if (threads > 0) {
      ns.exec(shareScript, server, threads);
      ns.print(`Deployed ${threads} share threads on ${server}`);
    }
  }
}
