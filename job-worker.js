/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.ui.openTail();
  ns.ui.resizeTail(600, 360);

  // Prioritized Faction Milestone Queue
  const factionGoals = [
    { name: "CyberSec", rep: 18750, type: "hacking" },
    { name: "NiteSec", rep: 112500, type: "hacking" },
    { name: "The Black Hand", rep: 100000, type: "hacking" },
    { name: "BitRunners", rep: 500000, type: "hacking" },
    { name: "Daedalus", rep: 2500000, type: "hacking" },
  ];

  // Prioritized Corporate Targets
  const corporateGoals = [
    { name: "Alpha Enterprises", rep: 2000, field: "Software" },
    { name: "Fulcrum Technologies", rep: 250000, field: "Software" },
    { name: "ECorp", rep: 200000, field: "Software" },
    { name: "MegaCorp", rep: 200000, field: "Software" },
  ];

  while (true) {
    const player = ns.getPlayer();
    const ownedAugs = ns.singularity.getOwnedAugmentations(true);

    // Step A: Find the first joined faction that still has unowned augmentations
    let activeFactionTarget = null;

    for (const goal of factionGoals) {
      if (!player.factions.includes(goal.name)) continue;

      // Get faction augmentations, excluding the repeatable NeuroFlux Governor
      const factionAugs = ns.singularity
        .getAugmentationsFromFaction(goal.name)
        .filter((aug) => aug !== "NeuroFlux Governor");

      // Check if any augmentations from this faction are still missing
      const missingAugs = factionAugs.filter((aug) => !ownedAugs.includes(aug));

      if (missingAugs.length > 0) {
        const currentRep = ns.singularity.getFactionRep(goal.name);
        activeFactionTarget = {
          ...goal,
          currentRep,
          missingCount: missingAugs.length,
        };
        break; // Found our current focus faction
      }
    }

    if (activeFactionTarget) {
      ns.singularity.workForFaction(
        activeFactionTarget.name,
        activeFactionTarget.type,
        false,
      );

      ns.clearLog();
      ns.print("=============== FACTION PIPELINE ===============");
      ns.print(`Target Faction:   ${activeFactionTarget.name}`);
      ns.print(`Missing Augs:     ${activeFactionTarget.missingCount}`);
      ns.print(
        `Current Rep:      ${ns.format.number(activeFactionTarget.currentRep, 2)}`,
      );
      ns.print(
        `Goal Rep:         ${ns.format.number(activeFactionTarget.rep, 2)}`,
      );
      ns.print(
        `Progress:         ${((activeFactionTarget.currentRep / activeFactionTarget.rep) * 100).toFixed(1)}%`,
      );
      ns.print(`Hacking Skill:    ${player.skills.hacking}`);
      ns.print("================================================");
    } else {
      // Step B: Advance corporate targets if all joined faction augs are acquired
      let activeCorpTarget = null;
      for (const corp of corporateGoals) {
        try {
          ns.singularity.applyToCompany(corp.name, corp.field);
        } catch {}

        const companyRep = ns.singularity.getCompanyRep(corp.name);
        if (companyRep < corp.rep) {
          activeCorpTarget = { ...corp, companyRep };
          break;
        }
      }

      if (activeCorpTarget) {
        ns.singularity.workForCompany(activeCorpTarget.name, false);

        ns.clearLog();
        ns.print("=============== CORPORATE PIPELINE ===============");
        ns.print(`Target Company:   ${activeCorpTarget.name}`);
        ns.print(
          `Current Rep:      ${ns.format.number(activeCorpTarget.companyRep, 2)}`,
        );
        ns.print(
          `Goal Rep:         ${ns.format.number(activeCorpTarget.rep, 2)}`,
        );
        ns.print(
          `Progress:         ${((activeCorpTarget.companyRep / activeCorpTarget.rep) * 100).toFixed(1)}%`,
        );
        ns.print(`Hacking Skill:    ${player.skills.hacking}`);
        ns.print("==================================================");
      }
    }

    await ns.sleep(15000);
  }
}
