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

    // Deduplicate augs across shared factions, keeping the valid entry
    const uniqueMap = new Map();
    for (const item of candidates) {
      if (!uniqueMap.has(item.aug)) {
        uniqueMap.set(item.aug, item);
      }
    }

    // Sort descending by CURRENT cost to get maximum efficiency from the 1.9x curve
    const sorted = Array.from(uniqueMap.values()).sort(
      (a, b) => b.cost - a.cost,
    );

    // Find the most expensive augmentation we can afford right now
    const money = ns.getServerMoneyAvailable("home");
    const nextBest = sorted.find((item) => money >= item.cost);

    if (!nextBest) {
      // Cannot afford any remaining available augmentations
      break;
    }

    if (ns.singularity.purchaseAugmentation(nextBest.faction, nextBest.aug)) {
      ns.tprint(
        `[BOUGHT AUG] ${nextBest.aug} from ${nextBest.faction} for $${ns.format.number(nextBest.cost)}`,
      );
      purchasedCount++;
    } else {
      break;
    }
  }

  // 2. Dump All Remaining Cash into NeuroFlux Governor using Highest-Rep Faction
  const validFactions = TARGET_FACTIONS.filter((f) =>
    ns.getPlayer().factions.includes(f),
  );

  if (validFactions.length > 0) {
    // Pick faction with highest reputation
    validFactions.sort(
      (a, b) =>
        ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a),
    );
    const bestRepFaction = validFactions[0];

    while (
      ns.getServerMoneyAvailable("home") >=
        ns.singularity.getAugmentationPrice("NeuroFlux Governor") &&
      ns.singularity.getFactionRep(bestRepFaction) >=
        ns.singularity.getAugmentationRepReq("NeuroFlux Governor")
    ) {
      const nfgCost = ns.singularity.getAugmentationPrice("NeuroFlux Governor");
      if (
        ns.singularity.purchaseAugmentation(
          bestRepFaction,
          "NeuroFlux Governor",
        )
      ) {
        ns.tprint(
          `[BOUGHT NFG] NeuroFlux Governor upgraded via ${bestRepFaction} for $${ns.format.number(nfgCost)}`,
        );
        purchasedCount++;
      } else {
        break;
      }
    }
  }

  ns.tprint("--------------------------------------------------");
  ns.tprint(
    `[PURCHASE COMPLETE] Total augmentations secured: ${purchasedCount}`,
  );
}
