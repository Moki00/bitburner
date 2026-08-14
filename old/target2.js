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
    // NUKE if no root access yet
    if (!ns.hasRootAccess(server)) {
      try {
        ns.nuke(server);
      } catch (e) {}
    }
    if (!ns.hasRootAccess(server)) continue; // skip unrooted servers

    const reqHack = ns.getServerRequiredHackingLevel(server);
    const maxMoney = ns.getServerMaxMoney(server);

    // Skip targets with no money or required hacking > half your level (to keep cycle times reasonable)
    if (maxMoney <= 0 || reqHack > myHack) continue;

    const minSec = ns.getServerMinSecurityLevel(server);
    const growth = ns.getServerGrowth(server);
    const hackTime = ns.getHackTime(server);
    const hackChance = ns.hackAnalyzeChance(server);

    // SMARTER SCORE FORMULA:
    // Takes Max Money, Growth Rate, and Chance to Hack, weighed against Min Security & Time
    const score = (maxMoney * growth * hackChance) / (minSec * hackTime);

    if (score > maxScore) {
      maxScore = score;
      bestTarget = server;
    }
  }

  const magenta = "\u001b[35m";
  const reset = "\u001b[0m";

  // Save optimal target to target.txt
  await ns.write("target.txt", bestTarget, "w");
  ns.tprint(
    `Target set to: ${magenta}${bestTarget} ${reset}(Score: $${Math.round(maxScore)})`,
  );
}
