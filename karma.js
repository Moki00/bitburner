/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.ui.openTail();
  while (true) {
    const karma = ns.heart.break();
    const remaining = Math.min(0, -54000 - karma);
    const homicidesLeft = Math.ceil(remaining / -3);
    const hoursLeft = ((homicidesLeft * 3) / 3600).toFixed(1);

    ns.clearLog();
    ns.print(`[KARMA TRACKER]`);
    ns.print(`Current:    ${karma.toFixed(0)}`);
    ns.print(`Remaining:  ${remaining.toFixed(0)}`);
    ns.print(`Kills Left: ${homicidesLeft.toLocaleString()}`);
    ns.print(`ETA:        ${hoursLeft} hours`);

    if (karma <= -54000) {
      ns.tprint("[GANG UNLOCKED] Karma threshold reached!");
      break;
    }
    await ns.sleep(5000);
  }
}
