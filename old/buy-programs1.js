/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const primaryPrograms = [
    { name: "BruteSSH.exe", cost: 500000 },
    { name: "FTPCrack.exe", cost: 1500000 },
    { name: "relaySMTP.exe", cost: 5000000 },
    { name: "HTTPWorm.exe", cost: 30000000 },
    { name: "SQLInject.exe", cost: 250000000 },
  ];

  const secondaryPrograms = [
    { name: "DeepscanV1.exe", cost: 500000 },
    { name: "DeepscanV2.exe", cost: 25000000 },
    { name: "AutoLink.exe", cost: 1000000 },
  ];

  while (true) {
    // Buy TOR Router (costs 200k)
    if (ns.getPlayer().money >= 200000) {
      ns.Singularity.purchaseTor();
    }

    // Buy primary port openers
    for (let prog of primaryPrograms) {
      if (
        !ns.fileExists(prog.name, "home") &&
        ns.getPlayer().money >= prog.cost
      ) {
        if (ns.purchaseProgram(prog.name)) {
          ns.tprint(`Automated Purchase: ${prog.name}`);
        }
      }
    }

    // Check if all primary programs exist on home
    const allPrimaryBought = primaryPrograms.every((p) =>
      ns.fileExists(p.name, "home"),
    );

    // Buy secondary tools only after primary openers are owned
    if (allPrimaryBought) {
      for (let prog of secondaryPrograms) {
        if (
          !ns.fileExists(prog.name, "home") &&
          ns.getPlayer().money >= prog.cost
        ) {
          if (ns.purchaseProgram(prog.name)) {
            ns.tprint(`Automated Purchase: ${prog.name}`);
          }
        }
      }
    }

    await ns.sleep(10000);
  }
}
