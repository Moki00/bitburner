/**
 * Boots the core Bitburner automation engine post-reset.
 * Initializes background daemons, network breach crawlers, target scoring,
 * server fleet management, and automated income generators.
 *
 * @param {NS} ns - Netscript API
 */
export async function main(ns) {
  ns.tprint("[STARTUP] Initializing Bitburner Automation Infrastructure...");

  const processes = [
    { name: "network-auto.js", args: [] }, // Auto-Port & Nuke
    { name: "backdoor-auto.js", args: [] }, // Print backdoor path strings
    { name: "target-finder.js", args: [] }, // Score and select active target
    { name: "cloud-servers.js", args: [] }, // Purchase and scale server RAM
    { name: "workers.js", args: [] }, // Multi-phase HGW thread coordinator
    { name: "ipvgo.js", args: [] }, // IPvGO board automation
    { name: "dnet-worm.js", args: [] }, // Dark Net infiltration and cache looting
  ];

  for (const proc of processes) {
    if (ns.fileExists(proc.name, "home")) {
      if (!ns.isRunning(proc.name, "home")) {
        const pid = ns.run(proc.name, 1, ...proc.args);
        if (pid > 0) {
          ns.tprint(`[STARTUP] Launched ${proc.name} (PID: ${pid})`);
        } else {
          ns.tprint(
            `[STARTUP] Failed to launch ${proc.name} (Check available RAM).`,
          );
        }
      } else {
        ns.tprint(`[STARTUP] ${proc.name} is already running.`);
      }
    } else {
      ns.tprint(`[STARTUP] Missing file: ${proc.name}`);
    }
    await ns.sleep(200);
  }

  ns.tprint("[STARTUP] Complete. Buy Tor 1st!");
}
