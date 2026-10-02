/** @param {NS} ns */
export async function main(ns) {
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

  ns.tprint("---------------- CRIME STATS ANALYSIS ----------------");
  for (const crime of crimes) {
    const stats = ns.singularity.getCrimeStats(crime);
    const chance = (ns.singularity.getCrimeChance(crime) * 100).toFixed(1);
    const karmaPerSec = (stats.karma / (stats.time / 1000)).toFixed(2);

    ns.tprint(
      `${crime.padEnd(17)} | ` +
        `Time: ${(stats.time / 1000).toFixed(1)}s | ` +
        `Karma: -${stats.karma} (${karmaPerSec}/s) | ` +
        `Success: ${chance.padStart(5)}% | ` +
        `Money: $${ns.format.number(stats.money)} |` +
        `agiExp:${stats.agility_exp} and agiSuccessWeight: ${stats.agility_success_weight}`,
    );
  }
}
