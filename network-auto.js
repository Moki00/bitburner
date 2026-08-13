//Runs on a 10-second loop.
//Crawls all servers, opens available ports using owned .exe files, and calls ns.nuke().

/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  // Recursively map all servers across the network
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
    const servers = getAllServers();
    let newRoots = 0;

    for (const server of servers) {
      // Skip home, player-purchased cloud servers, and already rooted servers
      if (
        server === "home" ||
        server.startsWith("cloud-") ||
        ns.hasRootAccess(server)
      )
        continue;

      // Count owned port openers and open ports on target
      let openPorts = 0;

      if (ns.fileExists("BruteSSH.exe", "home")) {
        ns.brutessh(server);
        openPorts++;
      }
      if (ns.fileExists("FTPCrack.exe", "home")) {
        ns.ftpcrack(server);
        openPorts++;
      }
      if (ns.fileExists("relaySMTP.exe", "home")) {
        ns.relaysmtp(server);
        openPorts++;
      }
      if (ns.fileExists("HTTPWorm.exe", "home")) {
        ns.httpworm(server);
        openPorts++;
      }
      if (ns.fileExists("SQLInject.exe", "home")) {
        ns.sqlinject(server);
        openPorts++;
      }

      // Check required ports vs open ports
      const reqPorts = ns.getServerNumPortsRequired(server);

      if (openPorts >= reqPorts) {
        try {
          ns.nuke(server);
          ns.tprint(`[AUTO-ROOT] Successfully NUKE'd ${server}!`);
          newRoots++;
        } catch (e) {
          // Player hacking skill may still be below requirement
        }
      }
    }

    // Pulse every 10 seconds
    await ns.sleep(10000);
  }
}
