/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.tprint("==========================================");
  ns.tprint("[PRE-RESET] PREPARING FOR AUGMENTATION RESET");
  ns.tprint("==========================================");

  // 1. Reset target.txt back to beginner target
  await ns.write("target.txt", "n00dles", "w");
  ns.tprint("[1/4] target.txt reset to 'n00dles'.");

  // 2. Liquidate Stocks (Long and Short positions)
  try {
    if (ns.stock.hasTIXAPIAccess()) {
      for (const sym of ns.stock.getSymbols()) {
        const [shares, , shortShares] = ns.stock.getPosition(sym);
        if (shares > 0) {
          ns.stock.sellStock(sym, shares);
          ns.tprint(`[2/4] Sold ${shares} long shares of ${sym}`);
        }
        if (shortShares > 0) {
          ns.stock.sellShort(sym, shortShares);
          ns.tprint(`[2/4] Liquidated ${shortShares} short shares of ${sym}`);
        }
      }
    }
  } catch (e) {
    ns.tprint("[2/4] Stock liquidation skipped (no TIX access).");
  }

  // 3. Inline Network Scrape and Kill (No auxiliary file needed)
  function getAllServers(node = "home", visited = new Set()) {
    visited.add(node);
    for (const neighbor of ns.scan(node)) {
      if (!visited.has(neighbor)) {
        getAllServers(neighbor, visited);
      }
    }
    return Array.from(visited);
  }

  const allServers = getAllServers();
  let scriptsKilled = 0;

  for (const host of allServers) {
    if (host === "home") {
      // Kill other processes on home, sparing this pre-reset script
      const procs = ns.ps("home");
      for (const proc of procs) {
        if (proc.pid !== ns.pid) {
          ns.kill(proc.pid);
          scriptsKilled++;
        }
      }
    } else {
      ns.killall(host);
      scriptsKilled++;
    }
  }
  ns.tprint(
    `[3/4] Terminated active scripts across ${allServers.length} nodes.`,
  );

  // 4. Verification and Reset Execution
  ns.tprint("==========================================");
  ns.tprint(
    `[4/4] Wallet Ready: $${ns.format.number(ns.getServerMoneyAvailable("home"))}`,
  );
  ns.tprint(
    "Run 'buy-augs.js', then launch: ns.singularity.installAugmentations('bootstrap.js')",
  );
  ns.tprint("==========================================");
}
