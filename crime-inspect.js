// This script requires 11.60GB of RAM to run for 1 thread(s)
//   5.00GB | singularity.getCrimeStats (fn)
//   5.00GB | singularity.getCrimeChance (fn)
//   1.60GB | baseCost (misc)

/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const crimes = [
    "Shoplift",
    "Rob Store",
    "Mug",
    "Larceny",
    "Deal Drugs",
    "Bond Forgery",
    "Traffick Arms",
    "Homicide",
    "Grand Theft Auto",
    "Kidnap",
    "Assassination",
    "Heist",
  ];

  const karma = ns.heart.break();
  const remaining = Math.min(0, -54000 - karma);
  const homicidesLeft = Math.ceil(remaining / -3);
  const hoursLeft = ((homicidesLeft * 3) / 3600).toFixed(1);

  let bestKarmaCrime = "";
  let maxKarmaRate = -1;

  let bestMoneyCrime = "";
  let maxMoneyRate = -1;

  let bestCombatCrime = "";
  let maxCombatExpRate = -1;

  let homChance = 0;
  let homKarmaRate = 0;
  let homCombatExpPerStat = 0;

  let report = `# COMPREHENSIVE CRIME ANALYSIS & OPTIMIZATION REPORT\n\n`;
  report += `| Crime            | Time   | Chance | Money      | Cash/s    | Karma/s | Stat EXP/s (Guaranteed) |\n`;
  report += `| :--------------- | :----- | :----- | :--------- | :-------- | :------ | :---------------------- |\n`;

  for (const name of crimes) {
    const stats = ns.singularity.getCrimeStats(name);

    const timeSec = stats.time / 1000;
    const rawChance = ns.singularity.getCrimeChance(name);
    const chancePct = (rawChance * 100).toFixed(1) + "%";

    const cashPerSec = (stats.money * rawChance) / timeSec;
    const karmaPerSec = (stats.karma * rawChance) / timeSec;

    // Bitburner awards full EXP even on failed crimes
    const totalCombatExp =
      stats.strength_exp +
      stats.defense_exp +
      stats.dexterity_exp +
      stats.agility_exp;
    const combatExpRate = totalCombatExp / timeSec;

    if (karmaPerSec > maxKarmaRate) {
      maxKarmaRate = karmaPerSec;
      bestKarmaCrime = name;
    }

    if (cashPerSec > maxMoneyRate) {
      maxMoneyRate = cashPerSec;
      bestMoneyCrime = name;
    }

    if (combatExpRate > maxCombatExpRate) {
      maxCombatExpRate = combatExpRate;
      bestCombatCrime = name;
    }

    if (name === "Homicide") {
      homChance = rawChance * 100;
      homKarmaRate = karmaPerSec;
      homCombatExpPerStat = stats.strength_exp / timeSec;
    }

    const moneyFormatted = "$" + ns.format.number(stats.money);
    const expMoneyFormatted = "$" + ns.format.number(cashPerSec) + "/s";
    const expKarmaFormatted = karmaPerSec.toFixed(3);
    const expRateClean = combatExpRate.toFixed(2) + " comb/s";

    report += `| ${name.padEnd(16)} | ${(timeSec.toFixed(1) + "s").padEnd(6)} | ${chancePct.padEnd(6)} | ${moneyFormatted.padEnd(10)} | ${expMoneyFormatted.padEnd(9)} | ${expKarmaFormatted.padEnd(7)} | ${expRateClean.padEnd(23)} |\n`;
  }

  await ns.write("crime-stats.txt", report, "w");

  // Output terminal report once and exit
  ns.tprint(`================== Karma ==================`);
  ns.tprint(`  Have:    ${karma.toFixed(0)}`);
  ns.tprint(`  Need:    ${remaining.toFixed(0)}`);
  ns.tprint(`  ${homicidesLeft.toLocaleString()} Homicides to do`);
  ns.tprint(`  ${hoursLeft} hours until gang unlock`);
  ns.tprint(`-----------------------------------------`);
  ns.tprint(`================== HOMICIDE ==================`);
  ns.tprint(`__Success Chance: ${homChance.toFixed(0)}%`);
  ns.tprint(`__Karma Gain:     ${homKarmaRate.toFixed(2)}/s`);
  ns.tprint(
    `__Combat EXP:     ${homCombatExpPerStat.toFixed(2)}/s per stat (guaranteed)`,
  );
  ns.tprint(`-----------------------------------------`);
  ns.tprint(`================== Best ==================`);
  ns.tprint(
    `__Best Karma:     ${bestKarmaCrime} (${maxKarmaRate.toFixed(2)}/s)`,
  );
  ns.tprint(
    `__Best Cash:      ${bestMoneyCrime} ($${ns.format.number(maxMoneyRate)}/s)`,
  );
  ns.tprint(
    `__Best Training:  ${bestCombatCrime} (${maxCombatExpRate.toFixed(2)} /s)`,
  );
  ns.tprint(`=========================================`);
  ns.tprint(`Full breakdown written to crime-stats.txt`);
  ns.tprint(`=========================================`);
}
