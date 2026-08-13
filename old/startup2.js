/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.tprint("Starting Master Pipeline...");

  // 1. Run Auto-Nuke & Backdoor Finder
  if (ns.fileExists("backdoor-auto.js", "home")) {
    ns.run("backdoor-auto.js");
  }

  // 2. Start Cloud Server Manager
  if (
    ns.fileExists("cloud-servers.js", "home") &&
    !ns.isRunning("cloud-servers.js", "home")
  ) {
    ns.run("cloud-servers.js");
  }

  // 3. Start Target Finder
  if (
    ns.fileExists("target-finder.js", "home") &&
    !ns.isRunning("target-finder.js", "home")
  ) {
    ns.run("target-finder.js");
  }

  // 4. Start Workers Loop
  if (
    ns.fileExists("workers.js", "home") &&
    !ns.isRunning("workers.js", "home")
  ) {
    ns.run("workers.js");
  }
}
