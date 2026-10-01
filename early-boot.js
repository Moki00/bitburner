/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  // 1. Initial Cash Injection via Shoplifting
  while (ns.getServerMoneyAvailable("home") < 250_000) {
    if (!ns.singularity.isBusy()) {
      ns.singularity.commitCrime("Shoplift", false);
    }
    await ns.sleep(1000);
  }

  // 2. Buy Tor Router as soon as we have $200k
  if (!ns.hasTorRouter()) {
    ns.singularity.purchaseTor();
    ns.tprint("[BOOT] Tor Router purchased!");
  }

  // 3. Train foundational combat stats to 35+ at Iron Gym
  const stats = ["strength", "defense", "dexterity", "agility"];
  for (const stat of stats) {
    while (ns.getPlayer().skills[stat] < 35) {
      ns.singularity.gymWorkout("Iron Gym", stat, false);
      await ns.sleep(2000);
    }
  }

  // 4. Grind Homicide for Gang Unlock (-54k karma) and rapid cash
  ns.tprint("[BOOT] Combat baseline met. Grinding Homicide for Slum Snakes...");
  while (ns.heart.break() > -54000) {
    if (!ns.singularity.isBusy()) {
      ns.singularity.commitCrime("Homicide", false);
    }
    await ns.sleep(1000);
  }

  ns.tprint("[BOOT] Karma at -54,000! Initializing Slum Snakes...");
  if (!ns.gang.inGang()) {
    ns.gang.createGang("Slum Snakes");
  }

  // Launch gang engine once unlocked
  if (ns.fileExists("gang.js", "home") && !ns.isRunning("gang.js", "home")) {
    ns.run("gang.js");
  }
}
