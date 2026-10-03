/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.ui.openTail();
  ns.ui.resizeTail(660, 420);

  // Ranked from highest payout and faction value down to entry-level
  const employerPriority = [
    "ECorp",
    "MegaCorp",
    "Fulcrum Technologies",
    "KuaiGong International",
    "Blade Industries",
    "Four Sigma",
    "Clarke Incorporated",
    "Bachman & Associates",
    "NWO",
    "OmniTek Incorporated",
    "Alpha Enterprises", // High early wages & Sector-12 base
    "Rho Construction",
    "Aevum Police Headquarters",
    "Omega Software",
    "FoodNStuff",
  ];

  const careerTracks = ["Software", "IT", "Network Engineer"];

  while (true) {
    // 1. Check and claim promotions across all companies
    for (const company of employerPriority) {
      for (const track of careerTracks) {
        try {
          if (ns.singularity.applyToCompany(company, track)) {
            ns.tprint(`[PROMOTION] Advanced in ${company} (${track})!`);
          }
        } catch {}
      }
    }

    // Pull current player state after processing promotions
    const player = ns.getPlayer();
    const activeJobs = player.jobs;

    // 2. Select the highest priority company where you hold a position
    let bestEmployer = null;
    for (const company of employerPriority) {
      if (activeJobs[company]) {
        bestEmployer = company;
        break;
      }
    }

    // 3. Clock into your best job automatically
    if (bestEmployer) {
      ns.singularity.workForCompany(bestEmployer, false);
    }

    // 4. Telemetry Dashboard
    ns.clearLog();
    ns.print("=============== CAREER MONITOR ===============");
    ns.print(`Hacking Skill:    ${player.skills.hacking}`);
    ns.print(`Active Employer:  ${bestEmployer || "None"}`);
    ns.print(
      `Current Title:    ${bestEmployer ? activeJobs[bestEmployer] : "Unemployed"}`,
    );
    ns.print(`----------------------------------------------`);
    ns.print("All Active Positions:");
    for (const [comp, title] of Object.entries(activeJobs)) {
      ns.print(`  * ${comp.padEnd(26)}: ${title}`);
    }
    ns.print("==============================================");

    await ns.sleep(15000);
  }
}
