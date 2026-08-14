/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const target = ns.args[0] || "phantasy";
  const offset = 200; // Spacing between impacts in ms

  // Copy worker scripts to all purchased cloud servers
  const servers = ns.getPurchasedServers();
  for (const server of servers) {
    await ns.scp(
      ["hack.js", "weaken.js", "grow.js", "weaken.js"],
      server,
      "home",
    );
  }

  while (true) {
    // 1. Verify target is primed (Min Security & Max Money)
    const curSec = ns.getServerSecurityLevel(target);
    const minSec = ns.getServerMinSecurityLevel(target);
    const curMoney = ns.getServerMoneyAvailable(target);
    const maxMoney = ns.getServerMaxMoney(target);

    if (curSec > minSec || curMoney < maxMoney) {
      ns.print(`[WARN] ${target} is not primed. Waiting for preparation...`);
      await ns.sleep(5000);
      continue;
    }

    // 2. Fetch execution times
    const tWeaken = ns.getWeakenTime(target);
    const tGrow = ns.getGrowTime(target);
    const tHack = ns.getHackTime(target);

    // 3. Calculate delays so actions land in sequence (H -> W1 -> G -> W2)
    const delayHack = tWeaken - tHack;
    const delayWeaken1 = 0; // Weaken takes the longest, used as baseline
    const delayGrow = tWeaken - tGrow + offset;
    const delayWeaken2 = offset * 2;

    // 4. Thread Calculations (Targeting 10% steal per batch)
    const hackThreads = Math.max(
      1,
      Math.floor(ns.hackAnalyzeThreads(target, maxMoney * 0.1)),
    );
    const weaken1Threads = Math.ceil((hackThreads * 0.002) / 0.05);
    const growThreads = Math.ceil(ns.growthAnalyze(target, 1 / 0.9));
    const weaken2Threads = Math.ceil((growThreads * 0.004) / 0.05);

    // 5. Dispatch batch across available cloud RAM
    let batchDeployed = false;
    for (const host of servers) {
      const freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
      const reqRam =
        (hackThreads + weaken1Threads + growThreads + weaken2Threads) * 1.75;

      if (freeRam >= reqRam) {
        ns.exec("hack.js", host, hackThreads, target, delayHack);
        ns.exec("weaken.js", host, weaken1Threads, target, delayWeaken1);
        ns.exec("grow.js", host, growThreads, target, delayGrow);
        ns.exec("weaken.js", host, weaken2Threads, target, delayWeaken2);

        ns.print(`[BATCH LAUNCHED] ${target} via ${host}`);
        batchDeployed = true;
        break;
      }
    }

    const magenta = "\u001b[35m";
    const reset = "\u001b[0m";

    if (!batchDeployed) {
      ns.print(
        `${magenta}[WARN] Insufficient RAM to deploy full batch on any host. Waiting for memory to clear...${reset}`,
      );
      await ns.sleep(1000); // Sleep longer to let running batches finish and free RAM
      continue;
    }

    // Delay next batch launch by spacing window
    await ns.sleep(offset * 4);
  }
}
