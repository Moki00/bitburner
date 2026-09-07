/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.tprint("==========================================");
  ns.tprint("[PRE-RESET] PREPARING FOR AUGMENTATION RESET");
  ns.tprint("==========================================");

  // 1. Reset target.txt back to n00dles so next run starts clean
  await ns.write("target.txt", "n00dles", "w");
  ns.tprint("[1/3] target.txt reset to 'n00dles'.");

  // 2. Liquidate Stock Market Positions (if TIX API owned)
  try {
    const symbols = ns.stock.getSymbols();
    for (const sym of symbols) {
      const pos = ns.stock.getPosition(sym);
      if (pos[0] > 0) {
        ns.stock.sellStock(sym, pos[0]);
        ns.tprint(`[2/3] Sold ${pos[0]} shares of ${sym}`);
      }
    }
  } catch (e) {
    ns.tprint("[2/3] Stock liquidator skipped (TIX API not active).");
  }

  // 3. Kill all running scripts across the entire network
  ns.tprint("[3/3] Killing all running scripts across network...");
  ns.run("kill-network.js");

  ns.tprint("==========================================");
  ns.tprint("READY! Buy your augmentations now and click INSTALL.");
  ns.tprint("==========================================");
}
