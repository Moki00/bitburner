/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

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
    let newRoots = 0; // Track new roots in this pass

    for (const server of servers) {
      if (
        server === "home" ||
        server.startsWith("cloud-") ||
        ns.hasRootAccess(server)
      )
        continue;

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

      const reqPorts = ns.getServerNumPortsRequired(server);

      if (openPorts >= reqPorts) {
        try {
          ns.nuke(server);
          ns.tprint(`[AUTO-ROOT] Successfully NUKE'd ${server}!`);
          newRoots++;
        } catch (e) {}
      }
    }

    // TRIGGER: If any new servers were nuked, fire backdoor-auto.js!
    if (newRoots > 0 && ns.fileExists("backdoor-auto.js", "home")) {
      if (!ns.isRunning("backdoor-auto.js", "home")) {
        ns.run("backdoor-auto.js");
      }
    }

    await ns.sleep(10000); // 10-second pulse
  }
}
