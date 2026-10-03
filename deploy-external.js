/** This script requires 4.10GB of RAM to run for 1 thread
  1.60GB | baseCost (misc)
  1.30GB | exec (fn)
  0.60GB | scp (fn)
  0.50GB | killall (fn)
  0.05GB | hasRootAccess (fn)
  0.05GB | getServerMaxRam (fn) */

/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const script = "target-finder.js";

  // Dynamically find any rooted host with at least 16 GB of RAM
  const candidates = [
    "foodnstuff",
    "joesguns",
    "sigma-cosmetics",
    "hong-fang-tea",
  ];
  const remoteHost = candidates.find(
    (h) => ns.hasRootAccess(h) && ns.getServerMaxRam(h) >= 16,
  );

  if (!remoteHost) {
    ns.tprint("[FAIL] No rooted 16 GB host available to take the load!");
    return;
  }

  // 1. Copy the file to the remote server
  await ns.scp(script, remoteHost, "home");

  // 3. Launch on remote host
  ns.killall(remoteHost);
  const pid = ns.exec(script, remoteHost, 1);

  if (pid > 0) {
    ns.tprint(`[SUCCESS] Running ${script} on ${remoteHost} (PID: ${pid}).`);
    ns.tprint(`Check available memory on home with 'free'`);
  } else {
    ns.tprint(`[FAIL] Could not launch ${script} on ${remoteHost}.`);
  }
}
