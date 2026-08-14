/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  // Check if Singularity API (Source-File 4) is unlocked
  if (!ns.singularity) {
    ns.print(
      "[BUY-PROGRAMS] Singularity API not unlocked (Requires Source-File 4). Buy programs manually via Darkweb.",
    );
    return;
  }

  const programs = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySMTP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe",
  ];

  // Attempt to buy missing programs
  for (const prog of programs) {
    if (!ns.fileExists(prog, "home")) {
      try {
        if (ns.singularity.purchaseProgram(prog)) {
          ns.tprint(`[BUY-PROGRAMS] Purchased ${prog}!`);
        }
      } catch (e) {
        // Not enough money or TOR router missing
      }
    }
  }
}
