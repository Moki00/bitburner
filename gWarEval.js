/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const myFaction = ns.gang.getGangInformation().faction;
  const allGang = ns.gang.getAllGangInformation();

  let readyToWar = true;
  let lowestChance = 1.0;
  let toughestRival = "";

  for (const [gangName, gangData] of Object.entries(allGang)) {
    if (gangName === myFaction) continue;
    if (gangData.territory > 0) {
      const winChance = ns.gang.getChanceToWinClash(gangName);
      if (winChance < lowestChance) {
        lowestChance = winChance;
        toughestRival = gangName;
      }
      if (winChance < 0.85) {
        readyToWar = false;
        break;
      }
    }
  }

  ns.gang.setTerritoryWarfare(readyToWar);

  if (readyToWar) {
    ns.tprint(
      "[WAR] Win chance >= 85% against all active rivals! Warfare ENGAGED.",
    );
  } else {
    ns.print(
      `[PEACE] Warfare held. Toughest match: ${toughestRival} (${(lowestChance * 100).toFixed(0)}% win chance)`,
    );
  }
}
