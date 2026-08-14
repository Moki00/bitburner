/** @param {NS} ns */
export async function main(ns) {
  const shareScript = "share-ram-factions.js";
  const scriptRam = ns.getScriptRam(shareScript);
  const reserveRam = 32;

  // Kill old instances running on home
  ns.scriptKill(shareScript, "home");

  // Calculate maximum threads based on free RAM on home
  const freeRam =
    ns.getServerMaxRam("home") - ns.getServerUsedRam("home") - reserveRam;
  const threads = Math.floor(freeRam / scriptRam);

  if (threads > 0) {
    ns.run(shareScript, threads);
    ns.tprint(
      `SUCCESS: Running ${shareScript} on home with ${threads} threads.`,
    );
  } else {
    ns.tprint(
      `ERROR: Not enough RAM on home to launch even 1 thread of ${shareScript}.`,
    );
  }
}
