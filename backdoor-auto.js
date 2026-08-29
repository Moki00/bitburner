/** @param {NS} ns */
export async function main(ns) {
  const myHack = ns.getHackingLevel();

  // 1. Define the ONLY static servers worth backdooring
  const CRITICAL_SERVERS = new Set([
    "CSEC", // CyberSec
    "avmnite-02h", // NiteSec
    "I.I.I.I", // The Black Hand
    "run4theh111z", // BitRunners
    "fulcrumassets", // Fulcrum Secret Technologies
    "The-Cave", // Daedalus
    "w0r1d_d3m0n", // Victory / Red Pill
  ]);

  // 2. Add your active farm target from target.txt (if it exists)
  if (ns.fileExists("target.txt")) {
    const activeTarget = ns.read("target.txt").trim();
    if (activeTarget) CRITICAL_SERVERS.add(activeTarget);
  }

  ns.tprint(`=== Backdoor Targets (Hack: ${myHack}) ===`);

  function getPath(target, parentMap) {
    let path = [target];
    let curr = target;
    while (curr !== "home") {
      curr = parentMap.get(curr);
      path.unshift(curr);
    }
    return path;
  }

  const queue = ["home"];
  const visited = new Set(["home"]);
  const parentMap = new Map();
  let found = 0;

  while (queue.length > 0) {
    const current = queue.shift();

    for (const neighbor of ns.scan(current)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap.set(neighbor, current);
        queue.push(neighbor);

        // Evaluate backdoor status if in critical list
        if (CRITICAL_SERVERS.has(neighbor)) {
          const reqHack = ns.getServerRequiredHackingLevel(neighbor);
          const server = ns.getServer(neighbor);

          // Filter: Must be rooted, hackable, and not backdoored yet
          if (
            ns.hasRootAccess(neighbor) &&
            myHack >= reqHack &&
            !server.backdoorInstalled
          ) {
            const path = getPath(neighbor, parentMap);
            const connectCmd =
              path.map((node) => `connect ${node}`).join("; ") + "; backdoor;";

            ns.tprint(`[IMPORTANT BACKDOOR] ${neighbor} (Req: ${reqHack})`);
            ns.tprint(`    ${connectCmd}\n`);
            found++;
          }
        }
      }
    }
  }

  if (found === 0) {
    ns.tprint("No important backdoors available");
  }
}
