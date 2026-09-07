/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.tprint("[DAEDALUS MONITOR] Watching Hacking level... Target: 2500");

  while (ns.getHackingLevel() < 2500) {
    await ns.sleep(5000);
  }

  // Milestone reached
  ns.tprint("==================================================");
  ns.tprint("!!! HACKING LEVEL 2,500 REACHED !!!");
  ns.tprint("JOIN DAEDALUS NOW AND START HACKING CONTRACTS!");
  ns.tprint("==================================================");

  // 1. Kill the XP grinder
  if (ns.scriptRunning("end-world.js", "home")) {
    ns.scriptKill("end-world.js", "home");
    ns.tprint("[DAEDALUS PREP] Terminated end-world.js XP grinder.");
  }

  // 2. Launch the faction rep sharing engine across your cloud servers
  if (!ns.scriptRunning("factions-need-ram.js", "home")) {
    ns.run("factions-need-ram.js");
    ns.tprint("[DAEDALUS PREP] Launched factions-need-ram.js for rep boost.");
  }
}
