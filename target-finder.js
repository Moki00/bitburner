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

  let lastHack = 0;

  while (true) {
    const myHack = ns.getHackingLevel();

    // Re-evaluate whenever hacking increases by 20+ levels or on initial startup
    if (myHack - lastHack >= 20 || lastHack === 0) {
      lastHack = myHack;

      const servers = getAllServers();
      let bestTarget = null;
      let maxScore = 0;

      let fallbackTarget = "n00dles";
      let fallbackScore = 0;

      for (const server of servers) {
        if (
          !ns.hasRootAccess(server) ||
          server === "home" ||
          server.startsWith("cloud-")
        ) {
          continue;
        }

        const reqHack = ns.getServerRequiredHackingLevel(server);
        const maxMoney = ns.getServerMaxMoney(server);
        const minSecurity = ns.getServerMinSecurityLevel(server);
        const growth = ns.getServerGrowth(server);

        if (maxMoney <= 0) continue;

        const estHackTimeMinSec = Math.max(
          2.0,
          (minSecurity * 150) / Math.max(1, myHack),
        );
        const score = (maxMoney * growth) / (minSecurity * estHackTimeMinSec);

        // Fallback: Best rooted server within reach, ignoring strict filters
        if (reqHack <= myHack && score > fallbackScore) {
          fallbackScore = score;
          fallbackTarget = server;
        }

        // Strict Production Filters
        if (reqHack > myHack * 0.7) continue;
        if (myHack > 100 && maxMoney < 20_000_000) continue;
        if (estHackTimeMinSec > 180) continue;

        if (score > maxScore) {
          maxScore = score;
          bestTarget = server;
        }
      }

      const finalTarget = bestTarget ?? fallbackTarget;
      const finalScore = bestTarget ? maxScore : fallbackScore;
      const currentSavedTarget = ns.read("target.txt");

      const magenta = "\u001b[35m";
      const reset = "\u001b[0m";

      if (finalTarget !== currentSavedTarget) {
        await ns.write("target.txt", finalTarget, "w");
        ns.tprint(
          `Target set to: ${magenta}${finalTarget}${reset} (Score: $${ns.format.number(finalScore)})`,
        );
      }

      if (myHack > 2500) {
        ns.tprint(
          "[TARGET-FINDER] Endgame hacking threshold cleared. Exiting daemon.",
        );
        break;
      }
    }

    // ALWAYS sleep outside the if block so the loop pulses every 30 seconds
    await ns.sleep(30000);
  }
}
