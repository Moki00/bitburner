/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.ui.openTail();

  // 1. Discover all accessible standard servers
  function getEntireNetwork(origin = "home", seen = new Set()) {
    seen.add(origin);
    for (const host of ns.scan(origin)) {
      if (!seen.has(host)) {
        getEntireNetwork(host, seen);
      }
    }
    return seen;
  }

  const allHosts = getEntireNetwork();

  // 2. Discover Darknet nodes via probe and stasis links
  try {
    if (ns.dnet?.probe) {
      const discovered = ns.dnet.probe();
      if (Array.isArray(discovered)) {
        for (const host of discovered) allHosts.add(host);
      }
    }
  } catch (err) {
    ns.print(`probe notice: ${err.message ?? err}`);
  }

  try {
    if (ns.dnet?.getStasisLinkedServers) {
      const linked = ns.dnet.getStasisLinkedServers();
      if (Array.isArray(linked)) {
        for (const host of linked) allHosts.add(host);
      }
    }
  } catch (err) {}

  ns.print(
    `[WORM PURGE] Scanning ${allHosts.size} unique network and Darknet nodes...`,
  );

  let foundInstances = 0;
  let removedFiles = 0;

  for (const host of allHosts) {
    try {
      const processes = ns.ps(host);
      for (const proc of processes) {
        if (proc.filename.toLowerCase().includes("dnetworm")) {
          ns.kill(proc.pid);
          ns.print(
            `[TERMINATED] Killed ${proc.filename} (PID: ${proc.pid}) on ${host}`,
          );
          foundInstances++;
        }
      }

      if (host !== "home" && ns.fileExists("dnetWorm.js", host)) {
        ns.rm("dnetWorm.js", host);
        removedFiles++;
      }
    } catch (err) {
      // Skips nodes requiring deeper PID session auth
    }
  }

  ns.print(
    `[WORM PURGE] Complete. Terminated ${foundInstances} scripts, removed ${removedFiles} files.`,
  );
}
