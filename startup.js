/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.tprint("[STARTUP] Initializing Bitburner Automation Infrastructure...");

  const processes = [
    { name: "network-auto.js", args: [] }, // Auto-Port Cracker & Nuke
    { name: "backdoor-auto.js", args: [] }, // must copy script manually in terminal
    { name: "target-finder.js", args: [] },
    { name: "cloud-servers.js", args: [] }, // Purchaser
    { name: "workers.js", args: [] }, // Distributed Worker Deployment
  ];

  for (const proc of processes) {
    if (ns.fileExists(proc.name, "home")) {
      if (!ns.isRunning(proc.name, "home")) {
        ns.run(proc.name, 1, ...proc.args);
        ns.tprint(`[STARTUP] Launched ${proc.name}`);
      } else {
        ns.tprint(`[STARTUP] ${proc.name} is already running.`);
      }
    }
    await ns.sleep(200);
  }

  ns.tprint("[STARTUP] Buy Tor 1st!");
}
