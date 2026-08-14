/** @param {NS} ns */
export async function main(ns) {
  // Target server passed in as a command-line argument
  const target = ns.args[0] || "joesguns";

  while (true) {
    let currentSec = ns.getServerSecurityLevel(target);
    let minSec = ns.getServerMinSecurityLevel(target);
    let currentMoney = ns.getServerMoneyAvailable(target);
    let maxMoney = ns.getServerMaxMoney(target);

    if (currentSec > minSec + 5) {
      await ns.weaken(target);
    } else if (currentMoney < maxMoney * 0.75) {
      await ns.grow(target);
    } else {
      await ns.hack(target);
    }
  }
}
