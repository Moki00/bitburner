/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  const worker = "weaken.js";
  const scriptRam = ns.getScriptRam(worker);
  const target = "joesguns";

  function scanNetwork(node = "home", visited = new Set()) {
    visited.add(node);
    for (const neighbor of ns.scan(node)) {
      if (!visited.has(neighbor)) {
        scanNetwork(neighbor, visited);
      }
    }
    return Array.from(visited);
  }

  // Discover fleet and distribute worker payload once
  const fleet = scanNetwork().filter((s) => ns.hasRootAccess(s));
  for (const host of fleet) {
    if (host !== "home") {
      await ns.scp(worker, host, "home");
    }
  }

  ns.tprint(`[XP SIEGE] High and fast throughput engaged against ${target}...`);

  while (true) {
    for (const host of fleet) {
      let freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
      if (host === "home") {
        freeRam = Math.max(0, freeRam - 64);
      }

      const threads = Math.floor(freeRam / scriptRam);
      if (threads > 0) {
        const tag = `${host}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        ns.exec(worker, host, threads, target, tag);
      }
    }

    await ns.sleep(500);
  }
}
