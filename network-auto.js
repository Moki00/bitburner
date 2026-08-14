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

  // Darkweb items list & prices
  const darkwebItems = [
    { name: "DeepscanV1.exe", cost: 500_000 },
    { name: "AutoLink.exe", cost: 1_000_000 },
    { name: "FTPCrack.exe", cost: 1_500_000 },
    { name: "relaySMTP.exe", cost: 5_000_000 },
    { name: "DeepscanV2.exe", cost: 25_000_000 },
    { name: "HTTPWorm.exe", cost: 30_000_000 },
    { name: "DarkscapeNavigator.exe", cost: 50_000_000 },
    { name: "SQLInject.exe", cost: 250_000_000 },
    { name: "Formulas.exe", cost: 5_000_000_000 },
  ];

  const alertedItems = new Set();

  while (true) {
    const servers = getAllServers();
    const money = ns.getServerMoneyAvailable("home");
    let newRoots = 0;

    // 1. Check if can buy programs
    for (const item of darkwebItems) {
      if (
        !ns.fileExists(item.name, "home") &&
        !alertedItems.has(item.name) &&
        money >= item.cost
      ) {
        ns.tprint(
          `[AFFORDABLE] You can now buy ${item.name} ($${ns.format.number(item.cost)})! Type: buy ${item.name}`,
        );
        alertedItems.add(item.name);
      }
    }

    // 2. Nuke servers
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
        } catch (e) {}
      }
    }

    // TRIGGER: If any new servers were nuked, run backdoor-auto.js
    if (newRoots > 0) {
      if (!ns.isRunning("backdoor-auto.js", "home")) {
        ns.run("backdoor-auto.js");
      }
    }

    // Pulse every 10 seconds
    await ns.sleep(10000);
  }
}
