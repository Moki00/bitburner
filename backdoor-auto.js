/** @param {NS} ns */
export async function main(ns) {
  const myHack = ns.getHackingLevel();
  ns.tprint(`=== Pending Backdoors (Hacking: ${myHack}) ===`);

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

        // Ignore home, darkweb, and player-owned servers
        if (
          neighbor === "home" ||
          neighbor === "darkweb" ||
          neighbor.startsWith("cloud-") ||
          neighbor.startsWith("a") ||
          neighbor.startsWith("q") ||
          neighbor.startsWith("w")
        )
          continue;

        const server = ns.getServer(neighbor);
        const reqHack = server.requiredHackingSkill;

        // Strictly check: Must be rooted, skill met, and NOT backdoored
        if (
          server.hasAdminRights &&
          myHack >= reqHack &&
          !server.backdoorInstalled
        ) {
          const path = getPath(neighbor, parentMap);
          const connectCmd =
            path.map((node) => `connect ${node}`).join("; ") + "; backdoor;";

          ns.tprint(`[NEEDS BACKDOOR] ${neighbor} (Req: ${reqHack})`);
          ns.tprint(`   ${connectCmd}\n`);
          found++;
        }
      }
    }
  }

  if (found === 0) {
    ns.tprint("All accessible servers are already backdoored!");
  }
}
