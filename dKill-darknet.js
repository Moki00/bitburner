/** @param {NS} ns */
export async function main(ns) {
  const wormFiles = ["dnetWorm.js", "dnet-worm.js"];
  const visited = new Set();
  const queue = ["home"];
  let killed = 0;
  let deleted = 0;

  ns.tprint("[PURGE] Sweeping network mesh to wipe all worm scripts...");

  while (queue.length > 0) {
    const current = queue.shift();
    visited.add(current);

    let neighbors = [];
    try {
      neighbors = [...ns.scan(current), ...(ns.dnet?.probe() || [])];
    } catch (e) {
      neighbors = ns.scan(current);
    }

    for (const host of neighbors) {
      if (!visited.has(host)) {
        visited.add(host);
        queue.push(host);

        if (host !== "home") {
          const processes = ns.ps(host);
          for (const p of processes) {
            if (wormFiles.includes(p.filename)) {
              ns.kill(p.pid);
              killed++;
            }
          }
          for (const file of wormFiles) {
            if (ns.fileExists(file, host)) {
              ns.rm(file, host);
              deleted++;
            }
          }
        }
      }
    }
  }

  ns.tprint(`[PURGE COMPLETE] Killed: ${killed} | Deleted: ${deleted}`);
}
