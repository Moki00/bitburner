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
    if (!ns.hasRootAccess(server)) continue;

    const reqHack = ns.getServerRequiredHackingLevel(server);
    const maxMoney = ns.getServerMaxMoney(server);

    // Filter 1: Must have money and be hackable
    if (maxMoney <= 0 || reqHack > myHack) continue;

    // Filter 2: Ignore low-tier beginner servers if Hacking skill > 100
    if (myHack > 100 && maxMoney < 10000000) continue;

    const minSec = ns.getServerMinSecurityLevel(server);
    const growth = ns.getServerGrowth(server);

    // Evaluate based on MINIMUM security (ideal primed state)
    // Formula: (Max Money * Growth Rate) / Min Security
    const score = (maxMoney * growth) / minSec;

    if (score > maxScore) {
      maxScore = score;
      bestTarget = server;
    }
  }

  // Write winning target to target.txt
  await ns.write("target.txt", bestTarget, "w");

  ns.tprint(`==========================================`);
  ns.tprint(`[TARGET-FINDER] Target Updated: ${bestTarget}`);
  ns.tprint(
    `[TARGET-FINDER] Max Money: $${ns.formatNumber(ns.getServerMaxMoney(bestTarget))}`,
  );
  ns.tprint(`[TARGET-FINDER] Growth Rate: ${ns.getServerGrowth(bestTarget)}`);
  ns.tprint(`==========================================`);
}
