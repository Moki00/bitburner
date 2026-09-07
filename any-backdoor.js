/** @param {NS} ns */
export async function main(ns) {
  const myHack = ns.getHackingLevel();
  const AnyServer = new Set([]);

  // 2. Add active farm target from target.txt
  if (ns.fileExists("target.txt")) {
    const activeTarget = ns.read("target.txt").trim();
    if (activeTarget) AnyServer.add(activeTarget);
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

        const reqHack = ns.getServerRequiredHackingLevel(neighbor);
        const server = ns.getServer(neighbor);

        // Filter: Must be rooted, hackable, and not backdoored yet
        if (
          ns.hasRootAccess(neighbor) &&
          myHack >= reqHack &&
          !server.backdoorInstalled &&
          !neighbor.includes("cloud")
        ) {
          const path = getPath(neighbor, parentMap);
          const connectCmd =
            path.map((node) => `connect ${node}`).join("; ") + "; backdoor;";

          ns.tprint(`[BACKDOOR] ${neighbor} (Req: ${reqHack})`);
          ns.tprint(`    ${connectCmd}\n`);
          found++;
        }
      }
    }
  }

  if (found === 0) {
    ns.tprint("No backdoors available");
  }
}
