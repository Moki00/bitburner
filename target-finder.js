/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const playerHackLevel = ns.getHackingLevel();

  // Recursive network crawler
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
  let bestTarget = "n00dles";
  let maxScore = 0;

  for (const server of servers) {
    // Skip unrooted servers, player servers, home, and servers we lack hacking level for
    if (!ns.hasRootAccess(server)) continue;
    if (
      server.startsWith("cloud-") ||
      server === "home" ||
      server === "darkweb"
    )
      continue;

    const reqHack = ns.getServerRequiredHackingLevel(server);
    // Focus targets around or below current hacking skill (ideally <= half for speed/consistency)
    if (reqHack > playerHackLevel) continue;

    const maxMoney = ns.getServerMaxMoney(server);
    const minSec = ns.getServerMinSecurityLevel(server);

    if (maxMoney <= 0) continue;

    // Score calculation: High max money and low min security yield higher returns
    // Dividing required hacking level avoids choosing high-security servers that take too long to hack
    const score = maxMoney / minSec / Math.max(1, reqHack);

    if (score > maxScore) {
      maxScore = score;
      bestTarget = server;
    }
  }

  // Save optimal target to target.txt
  await ns.write("target.txt", bestTarget, "w");
  ns.tprint(
    `[Target Finder] Optimal target set to: ${bestTarget} (Score: ${Math.round(maxScore)})`,
  );
}
