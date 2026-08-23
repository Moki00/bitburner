/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const targetName = ns.args[0] || "phantasy";
  const offset = 100; // 100ms safety window between hits

  const player = ns.getPlayer();
  let server = ns.getServer(targetName);

  // Set server state to theoretical max to calculate optimal ratios
  server.hackDifficulty = server.minDifficulty;
  server.moneyAvailable = server.moneyMax;

  // Calculate exact thread ratios using Formulas API
  const hackPercent = ns.formulas.hacking.hackPercent(server, player);
  const hackThreads = Math.max(1, Math.floor(0.2 / hackPercent)); // Steal 20%

  // Calculate exact growth threads to restore stolen 20%
  const targetMoneyAfterHack = server.moneyMax * 0.8;
  const growThreads = ns.formulas.hacking.growThreads(
    server,
    player,
    server.moneyMax,
    1,
  );

  // Calculate weaken threads to counter security spikes (+0.002 per hack thread, +0.004 per grow thread)
  const weaken1Threads = Math.ceil((hackThreads * 0.002) / 0.05);
  const weaken2Threads = Math.ceil((growThreads * 0.004) / 0.05);

  // Get exact execution timings
  const tWeaken = ns.formulas.hacking.weakenTime(server, player);
  const tGrow = ns.formulas.hacking.growTime(server, player);
  const tHack = ns.formulas.hacking.hackTime(server, player);

  // Calculate delays so actions land sequentially: Hack -> Weaken1 -> Grow -> Weaken2
  const delayHack = tWeaken - tHack;
  const delayWeaken1 = 0;
  const delayGrow = tWeaken - tGrow + offset;
  const delayWeaken2 = offset * 2;

  ns.tprint(`[Formulas Batcher] Configured for ${targetName}:`);
  ns.tprint(
    `   Threads: Hack ${hackThreads} | Weaken1 ${weaken1Threads} | Grow ${growThreads} | Weaken2 ${weaken2Threads}`,
  );

  // Deployment Loop across Purchased Servers
  const cloudServers = ns.getPurchasedServers();
  for (const host of cloudServers) {
    await ns.scp(["hack.js", "weaken.js", "grow.js"], host, "home");

    // Dispatch batch
    ns.exec("hack.js", host, hackThreads, targetName, delayHack);
    ns.exec("weaken.js", host, weaken1Threads, targetName, delayWeaken1);
    ns.exec("grow.js", host, growThreads, targetName, delayGrow);
    ns.exec("weaken.js", host, weaken2Threads, targetName, delayWeaken2);
  }
}
