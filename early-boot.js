/** 
 * 
 * early-boot.js requires 17.95GB of RAM to run for 1 thread(s)
  5.00GB | singularity.commitCrime (fn)
  3.00GB | singularity.checkFactionInvitations (fn)
  3.00GB | singularity.joinFaction (fn)
  2.00GB | singularity.purchaseTor (fn)
  1.60GB | baseCost (misc)
  1.00GB | gang.createGang (fn)
  1.00GB | run (fn)
  0.50GB | singularity.getCurrentWork (fn)
  0.50GB | getPlayer (fn)
  0.10GB | getServerMoneyAvailable (fn)
  0.10GB | fileExists (fn)
  0.10GB | isRunning (fn)
  0.05GB | hasTorRouter (fn)
 * 
 * Automated early progression: Shoplift -> Mug -> Homicide -> Gang Unlock
 * @param {NS} ns 
 */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.ui.openTail();

  const isDoingCrime = (crimeName) => {
    const work = ns.singularity.getCurrentWork();
    return work?.type === "CRIME" && work?.crimeType === crimeName;
  };

  // 1. Initial Cash Injection via Shoplifting (skip if already past $250k or have TOR)
  while (ns.getServerMoneyAvailable("home") < 250_000 && !ns.hasTorRouter()) {
    if (!isDoingCrime("Shoplift")) {
      ns.singularity.commitCrime("Shoplift", false);
    }
    await ns.sleep(1000);
  }

  // 3. Train all 4 combat stats simultaneously via Mug (100% success rate)
  ns.tprint("[BOOT] Training Strength, Defense, Dexterity, and Agility via Mug...");

  while (true) {
    const p = ns.getPlayer().skills;
    if (p.strength >= 45 && p.defense >= 35 && p.dexterity >= 35 && p.agility >= 35) {
      break;
    }

    if (!isDoingCrime("Mug")) {
      ns.singularity.commitCrime("Mug", false);
    }

    ns.clearLog();
    ns.print("========== COMBAT TRAINING (MUG) ==========");
    ns.print(`Strength  : ${p.strength} / 45`);
    ns.print(`Defense   : ${p.defense} / 35`);
    ns.print(`Dexterity : ${p.dexterity} / 35`);
    ns.print(`Agility   : ${p.agility} / 35`);
    ns.print(`Karma     : ${ns.heart.break().toFixed(1)}`);
    ns.print("===========================================");

    await ns.sleep(2000);
  }

  // 4. Grind Homicide for Gang Unlock (-54,000 karma)
  ns.tprint("[BOOT] Baseline met! Switching directly to Homicide for -54,000 Karma...");

  while (ns.heart.break() > -54000) {
    // Auto-accept Slum Snakes invitation as soon as it arrives at -9 karma
    const invites = ns.singularity.checkFactionInvitations();
    if (invites.includes("Slum Snakes")) {
      ns.singularity.joinFaction("Slum Snakes");
      ns.tprint("[BOOT] Joined Slum Snakes faction!");
    }

    if (!isDoingCrime("Homicide")) {
      ns.singularity.commitCrime("Homicide", false);
    }

    const currentKarma = ns.heart.break();
    const remaining = Math.abs(-54000 - currentKarma);

    ns.clearLog();
    ns.print("============= KARMA GRIND STATUS =============");
    ns.print(`Karma     : ${currentKarma.toFixed(1)} / -54,000`);
    ns.print(`Progress  : ${((Math.abs(currentKarma) / 54000) * 100).toFixed(2)}%`);
    ns.print(`Remaining : ${remaining.toFixed(0)} karma (~${(remaining / 60).toFixed(1)} mins at 100% rate)`);
    ns.print("==============================================");

    await ns.sleep(2000);
  }

  // 5. Establish Gang
  if (!ns.getPlayer().factions.includes("Slum Snakes")) {
    ns.singularity.joinFaction("Slum Snakes");
  }

  if (!ns.gang.inGang()) {
    if (ns.gang.createGang("Slum Snakes")) {
      ns.tprint("[GANG] Karma target reached, and created Slum Snakes Gang!");
    }
  }

  // 6. Spin up gang management stack
  if (!ns.isRunning("gang.js", "home")) {
    ns.run("gang.js");
    ns.tprint("[GANG] Launched gang.js!");
  }

  // 7.
  if (ns.getPlayer().factions.includes("Slum Snakes")) {
    ns.run("job-finder.js");
    ns.tprint("[END] early-boot.js");
    ns.scriptKill("early-boot.js");
  }
}