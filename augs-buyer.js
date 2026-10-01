/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const TARGET_FACTIONS = [
    "CyberSec",
    "NiteSec",
    "The Black Hand",
    "BitRunners",
    "Fulcrum Secret Technologies",
    "Daedalus",
    "Illuminati",
    "The Syndicate",
    "Netburners",
    "Slum Snakes",
  ];

  let purchasedCount = 0;

  // 1. Dynamic Purchasing Loop for Standard Augmentations
  while (true) {
    const ownedAugs = new Set(ns.singularity.getOwnedAugmentations(true));
    const playerFactions = ns.getPlayer().factions;
    const candidates = [];

    for (const faction of TARGET_FACTIONS) {
      if (!playerFactions.includes(faction)) continue;

      const factionAugs = ns.singularity.getAugmentationsFromFaction(faction);
      const factionRep = ns.singularity.getFactionRep(faction);

      for (const aug of factionAugs) {
        if (aug === "NeuroFlux Governor" || ownedAugs.has(aug)) continue;

        const reqRep = ns.singularity.getAugmentationRepReq(aug);
        const prereqs = ns.singularity.getAugmentationPrereq(aug);
        const hasPrereqs = prereqs.every((p) => ownedAugs.has(p));

        if (factionRep >= reqRep && hasPrereqs) {
          const cost = ns.singularity.getAugmentationPrice(aug);
          candidates.push({ aug, faction, cost });
        }
      }
    }

    if (candidates.length === 0) break;

    const uniqueMap = new Map();
    for (const item of candidates) {
      if (!uniqueMap.has(item.aug)) {
        uniqueMap.set(item.aug, item);
      }
    }

    const sorted = Array.from(uniqueMap.values()).sort(
      (a, b) => b.cost - a.cost,
    );

    const money = ns.getServerMoneyAvailable("home");
    const nextBest = sorted.find((item) => money >= item.cost);

    if (!nextBest) break;

    if (ns.singularity.purchaseAugmentation(nextBest.faction, nextBest.aug)) {
      ns.tprint(
        `[BOUGHT AUG] ${nextBest.aug} from ${nextBest.faction} for $${ns.format.number(nextBest.cost)}`,
      );
      purchasedCount++;
    } else {
      break;
    }
  }

  // 2. Dump All Remaining Cash into NeuroFlux Governor across ANY eligible joined faction
  while (true) {
    const money = ns.getServerMoneyAvailable("home");
    const nfgCost = ns.singularity.getAugmentationPrice("NeuroFlux Governor");
    const nfgRepReq =
      ns.singularity.getAugmentationRepReq("NeuroFlux Governor");

    if (money < nfgCost) break;

    // Find any joined faction that has enough reputation for the next level
    const playerFactions = ns.getPlayer().factions;
    const eligibleFaction = playerFactions.find(
      (f) => ns.singularity.getFactionRep(f) >= nfgRepReq,
    );

    if (!eligibleFaction) {
      ns.print(
        `[NFG STOP] Insufficient reputation across all factions for next NFG level (${ns.format.number(nfgRepReq)} rep needed).`,
      );
      break;
    }

    if (
      ns.singularity.purchaseAugmentation(eligibleFaction, "NeuroFlux Governor")
    ) {
      ns.tprint(
        `[BOUGHT NFG] NeuroFlux Governor upgraded via ${eligibleFaction} for $${ns.format.number(nfgCost)}`,
      );
      purchasedCount++;
    } else {
      break;
    }
  }

  ns.tprint("--------------------------------------------------");
  ns.tprint(
    `[PURCHASE COMPLETE] Total augmentations secured: ${purchasedCount}`,
  );
}
