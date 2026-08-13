/** @param {NS} ns */
export async function main(ns) {
  const worker = "hack-light.js";
  const target = "phantasy";

  // Recursively find all connected servers on the network
  function getAllServers(node = "home", visited = new Set()) {
    visited.add(node);
    for (const neighbor of ns.scan(node)) {
      if (!visited.has(neighbor)) {
        getAllServers(neighbor, visited);
      }
    }
    return Array.from(visited);
  }

  const yellow = "\u001b[33m";
  const blue = "\u001b[34m";
  const magenta = "\u001b[35m";
  const cyan = "\u001b[36m";
  const reset = "\u001b[0m";

  const hosts = getAllServers();

  for (let host of hosts) {
    // Open ports
    if (ns.fileExists("BruteSSH.exe", "home")) ns.brutessh(host);
    if (ns.fileExists("FTPCrack.exe", "home")) ns.ftpcrack(host);
    if (ns.fileExists("relaySMTP.exe", "home")) ns.relaysmtp(host);
    if (ns.fileExists("HTTPWorm.exe", "home")) ns.httpworm(host);
    if (ns.fileExists("SQLInject.exe", "home")) ns.sqlinject(host);

    // Root
    if (!ns.hasRootAccess(host)) {
      try {
        ns.nuke(host);
      } catch (e) {}
    }

    // Deploy
    if (ns.hasRootAccess(host)) {
      if (host !== "home") {
        await ns.scp(worker, host, "home");
      }
      ns.scriptKill(worker, host);

      let maxRam = ns.getServerMaxRam(host);
      let usedRam = ns.getServerUsedRam(host);
      let freeRam = maxRam - usedRam;

      if (host === "home") {
        freeRam = Math.max(0, freeRam - 888); // Reserve RAM on home for scripts
      }

      let scriptRam = ns.getScriptRam(worker);
      let threads = Math.floor(freeRam / scriptRam);

      if (threads > 0) {
        ns.exec(worker, host, threads, target);
        ns.tprint(
          `Deployed ${yellow}${threads}${reset} threads on ${magenta}${host}${reset} -> targeting ${cyan}${target}`,
        );
      }
    }
  }
}
