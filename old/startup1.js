/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.tprint("Starting Master Controller...");

  // Initial target evaluation
  if (ns.fileExists("target-finder.js", "home")) {
    ns.run("target-finder.js");
    await ns.sleep(1000);
  }

  // Initial Auto-Nuke scan
  if (ns.fileExists("network-auto.js", "home")) {
    ns.run("network-auto.js");
    await ns.sleep(1000);
  }

  // Main execution loop
  let loopCount = 0;
  while (true) {
    // Re-evaluate optimal target every 6 minutes (every 2 loops)
    if (loopCount % 2 === 0 && ns.fileExists("target-finder.js", "home")) {
      ns.run("target-finder.js");
      await ns.sleep(1000);
    }

    // Deploy or update workers
    if (
      !ns.isRunning("workers.js", "home") &&
      ns.fileExists("workers.js", "home")
    ) {
      ns.run("workers.js");
    }

    loopCount++;
    await ns.sleep(180000); // 3-minute pulse
  }
}
