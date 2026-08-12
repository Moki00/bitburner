/** @param {NS} ns */
export async function main(ns) {
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
  let count = 0;

  for (const server of servers) {
    if (server !== "home" && ns.hasRootAccess(server)) {
      ns.killall(server);
      count++;
    }
  }

  ns.tprint(
    `SUCCESS: Killed all running scripts across ${count} remote hosts.`,
  );
}
