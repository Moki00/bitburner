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

  const myHack = ns.getHackingLevel();
  const servers = getAllServers();
  let bestTarget = "n00dles";
  let maxScore = 0;

  for (const server of servers) {
    if (
      !ns.hasRootAccess(server) ||
      server === "home" ||
      server.startsWith("cloud-")
    )
      continue;

    const reqHack = ns.getServerRequiredHackingLevel(server);
    const maxMoney = ns.getServerMaxMoney(server);

    // Filter 1: Must have a real money pool
    if (maxMoney <= 0) continue;

    // Filter 2: Only target servers within your power bracket
    if (reqHack > myHack * 0.7) continue;

    // Filter 3: Hard floor to ignore beginner crumbs once Hack > 100
    if (myHack > 100 && maxMoney < 20_000_000) continue;

    const minSec = ns.getServerMinSecurityLevel(server);
    const growth = ns.getServerGrowth(server);

    // Bitburner true minimum-security hack time scaling:
    // Base time is heavily dictated by base difficulty (minSec)
    const estHackTimeMinSec = Math.max(2.0, (minSec * 150) / myHack);

    // Avoid massive 5+ minute servers for standard worker fleets
    if (estHackTimeMinSec > 180) continue;

    // Projected theoretical yield rate:
    // (Max Money * Growth Multiplier) / (Min Security * Prepped Cycle Time)
    const score = (maxMoney * growth) / (minSec * estHackTimeMinSec);

    if (score > maxScore) {
      maxScore = score;
      bestTarget = server;
    }
  }

  const magenta = "\u001b[35m";
  const reset = "\u001b[0m";

  await ns.write("target.txt", bestTarget, "w");
  ns.tprint(
    `Target set to: ${magenta}${bestTarget}${reset} (Score: $${ns.format.number(maxScore)})`,
  );
}
