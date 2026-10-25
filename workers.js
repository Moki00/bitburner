/**
 * This script requires 5.50GB of RAM to run for 1 thread(s)
  1.60GB | baseCost (misc)
  1.30GB | exec (fn)
  1.00GB | hackAnalyzeThreads (fn)
  0.60GB | scp (fn)
  0.20GB | scan (fn)
  0.10GB | fileExists (fn)
  0.10GB | serverExists (fn)
  0.10GB | getServerMinSecurityLevel (fn)
  0.10GB | getServerMaxMoney (fn)
  0.10GB | getServerSecurityLevel (fn)
  0.10GB | getServerMoneyAvailable (fn)
  0.05GB | hasRootAccess (fn)
  0.05GB | nuke (fn)
  0.05GB | getServerMaxRam (fn)
  0.05GB | getServerUsedRam (fn)
 * 
 * 
 *  @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const workerScripts = ["hack.js", "grow.js", "weaken.js"];
  const scriptRam = 1.75;
  const SAVE_RAM_ON_HOME = 32; // for manual scripts

  function getAllServers(node = "home", visited = new Set()) {
    visited.add(node);
    for (const neighbor of ns.scan(node)) {
      if (!visited.has(neighbor)) {
        getAllServers(neighbor, visited);
      }
    }
    return Array.from(visited);
  }

  while (true) {
    let target = "n00dles";
    if (ns.fileExists("target.txt", "home")) {
      const saved = ns.read("target.txt").trim();
      if (saved.length > 0 && ns.serverExists(saved)) {
        target = saved;
      }
    }

    const minSec = ns.getServerMinSecurityLevel(target);
    const maxMoney = ns.getServerMaxMoney(target);
    const currentSec = ns.getServerSecurityLevel(target);
    const currentMoney = ns.getServerMoneyAvailable(target);

    // Calculate how many hack threads it takes to steal 35% of current money
    // This prevents mega-servers (home / cloud) from draining the target to $0
    let maxHackThreadsForBatch = 1;
    if (currentMoney > 0) {
      const calcThreads = Math.floor(
        ns.hackAnalyzeThreads(target, currentMoney * 0.35),
      );
      if (calcThreads > 0 && isFinite(calcThreads)) {
        maxHackThreadsForBatch = calcThreads;
      }
    }

    let hackAssignedThisCycle = 0;
    let totalHackLaunched = 0;
    let totalGrowLaunched = 0;
    let totalWeakenLaunched = 0;

    const servers = getAllServers();
    const batchId = Date.now();

    for (const server of servers) {
      if (!ns.hasRootAccess(server)) {
        try {
          ns.nuke(server);
        } catch {}
      }
      if (!ns.hasRootAccess(server)) continue;

      if (server !== "home" && !ns.fileExists("hack.js", server)) {
        await ns.scp(workerScripts, server, "home");
      }

      let availableRam =
        ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
      if (server === "home") {
        availableRam = Math.max(0, availableRam - SAVE_RAM_ON_HOME);
      }

      const totalThreads = Math.floor(availableRam / scriptRam);
      if (totalThreads <= 0) continue;

      // Phase 1: Security is elevated (more than +3 above min) -> Weaken
      if (currentSec > minSec + 3) {
        ns.exec("weaken.js", server, totalThreads, target, batchId);
        totalWeakenLaunched += totalThreads;
        continue;
      }

      // Phase 2: Cash is below 75% of max -> Grow + Weaken
      if (currentMoney < maxMoney * 0.75) {
        if (totalThreads === 1) {
          ns.exec("grow.js", server, 1, target, batchId);
          totalGrowLaunched += 1;
        } else {
          const weakenThreads = Math.max(1, Math.floor(totalThreads * 0.15));
          const growThreads = totalThreads - weakenThreads;
          if (growThreads > 0) {
            ns.exec("grow.js", server, growThreads, target, batchId);
            totalGrowLaunched += growThreads;
          }
          if (weakenThreads > 0) {
            ns.exec("weaken.js", server, weakenThreads, target, batchId);
            totalWeakenLaunched += weakenThreads;
          }
        }
        continue;
      }

      // Phase 3: Farm State! Target is prepped; launch capped Hack + Grow + Weaken
      const remainingHackNeeded = Math.max(
        0,
        maxHackThreadsForBatch - hackAssignedThisCycle,
      );

      // Give up to 20% of this server's threads to hack, capped at what is needed for 35% steal
      const hackThreads = Math.min(
        remainingHackNeeded,
        Math.max(1, Math.floor(totalThreads * 0.2)),
      );

      const leftoverThreads = totalThreads - hackThreads;
      const weakenThreads = Math.floor(leftoverThreads * 0.2);
      const growThreads = leftoverThreads - weakenThreads;

      if (hackThreads > 0) {
        ns.exec("hack.js", server, hackThreads, target, batchId);
        hackAssignedThisCycle += hackThreads;
        totalHackLaunched += hackThreads;
      }
      if (growThreads > 0) {
        ns.exec("grow.js", server, growThreads, target, batchId);
        totalGrowLaunched += growThreads;
      }
      if (weakenThreads > 0) {
        ns.exec("weaken.js", server, weakenThreads, target, batchId);
        totalWeakenLaunched += weakenThreads;
      }
    }

    // Live Telemetry in the tail window (run `tail workers.js` to watch)
    ns.clearLog();
    ns.print(`================== WORKERS STATUS ==================`);
    ns.print(`Target       : ${target}`);
    ns.print(
      `Security     : ${currentSec.toFixed(2)} / ${minSec.toFixed(2)} (Thresh: ${(minSec + 3).toFixed(2)})`,
    );
    ns.print(
      `Money        : $${ns.format.number(currentMoney)} / $${ns.format.number(maxMoney)} (${((currentMoney / maxMoney) * 100).toFixed(1)}%)`,
    );
    ns.print(
      `Active Phase : ${
        currentSec > minSec + 3
          ? "PHASE 1 (Weakening Security)"
          : currentMoney < maxMoney * 0.75
            ? "PHASE 2 (Growing Money)"
            : "PHASE 3 (Hacking & Farming!)"
      }`,
    );
    ns.print(`----------------------------------------------------`);
    ns.print(
      `Last Wave    : Hack: ${totalHackLaunched} | Grow: ${totalGrowLaunched} | Weaken: ${totalWeakenLaunched}`,
    );
    ns.print(`====================================================`);

    await ns.sleep(4000);
  }
}
