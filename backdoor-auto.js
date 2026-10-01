// This script requires 7.95GB of RAM to run for 1 thread(s)
//   2.00GB | getServer (fn)
//   2.00GB | singularity.connect (fn)
//   2.00GB | singularity.installBackdoor (fn)
//   1.60GB | baseCost (misc)
//   0.20GB | scan (fn)
//   0.10GB | fileExists (fn)
//   0.05GB | getHackingLevel (fn)

/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const CRITICAL_SERVERS = new Set([
    "n00dles",
    "CSEC",
    "avmnite-02h",
    "I.I.I.I",
    "run4theh111z",
    "fulcrumassets",
    "icarus",
    "The-Cave",
    "w0r1d_d43m0n",
  ]);

  function getPath(target, parentMap) {
    let path = [target];
    let curr = target;
    while (curr !== "home") {
      curr = parentMap.get(curr);
      path.unshift(curr);
    }
    return path;
  }

  while (true) {
    const myHack = ns.getHackingLevel();

    // Dynamically include active target from target.txt
    if (ns.fileExists("target.txt", "home")) {
      const activeTarget = ns.read("target.txt").trim();
      if (activeTarget) CRITICAL_SERVERS.add(activeTarget);
    }

    const queue = ["home"];
    const visited = new Set(["home"]);
    const parentMap = new Map();

    while (queue.length > 0) {
      const current = queue.shift();

      for (const neighbor of ns.scan(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parentMap.set(neighbor, current);
          queue.push(neighbor);

          if (CRITICAL_SERVERS.has(neighbor)) {
            const server = ns.getServer(neighbor);

            if (
              server.hasAdminRights &&
              !server.backdoorInstalled &&
              myHack >= server.requiredHackingSkill
            ) {
              // Exclude w0r1d_d43m0n from auto-backdooring if you want manual control of the reset
              if (neighbor === "w0r1d_d43m0n") {
                ns.tprint("[ALERT] w0r1d_d43m0n is ready to backdoor!");
                continue;
              }

              const path = getPath(neighbor, parentMap);
              for (const node of path) {
                ns.singularity.connect(node);
              }

              ns.print(`[BACKDOOR] Installing backdoor at ${neighbor}...`);
              await ns.singularity.installBackdoor();
              ns.tprint(`[BACKDOOR] Successfully backdoored ${neighbor}!`);
              ns.singularity.connect("home");
            }
          }
        }
      }
    }

    await ns.sleep(20000); // 20k ms = 20 seconds
  }
}
