/**
 * z-buy-install.js
 * Automatically detects the faction you are currently working for,
 * tracks its highest unowned augmentation, waits until it is unlocked and affordable,
 * purchases all eligible augmentations across your factions, sinks leftover cash
 * into NeuroFlux Governor, and installs augmentations with a reboot into startup.js.
 *
 * @param {NS} ns
 */
export async function main(ns) {
  ns.disableLog("ALL");

  // Helper: Find highest-rep unowned augmentation for a given faction
  function getFactionTarget(factionName) {
    const owned = new Set(ns.singularity.getOwnedAugmentations(true));
    const factionAugs = ns.singularity
      .getAugmentationsFromFaction(factionName)
      .filter((aug) => aug !== "NeuroFlux Governor" && !owned.has(aug));

    if (factionAugs.length === 0) return null;

    factionAugs.sort(
      (a, b) =>
        ns.singularity.getAugmentationRepReq(b) -
        ns.singularity.getAugmentationRepReq(a),
    );

    const topAug = factionAugs[0];
    return {
      name: topAug,
      repReq: ns.singularity.getAugmentationRepReq(topAug),
      price: ns.singularity.getAugmentationPrice(topAug),
    };
  }

  // 1. Monitor loop: dynamically check current faction work
  while (true) {
    const work = ns.singularity.getCurrentWork();

    // Catches if not working for a faction
    if (work?.type !== "FACTION") {
      ns.clearLog();
      ns.tprint("=============== AUTO BUY & INSTALL ===============");
      ns.tprint("Change working for a faction.");
      ns.tprint("==================================================");
      await ns.sleep(5000);
      break;
    }

    const currentFaction = work.factionName;
    const target = getFactionTarget(currentFaction);

    // If all unique augmentations for this faction are already bought/installed
    if (!target) {
      ns.clearLog();
      ns.tprint("=============== AUTO BUY & INSTALL ===============");
      ns.tprint(`Faction : ${currentFaction}`);
      ns.tprint("Status  : All unique augmentations acquired!");
      ns.tprint("Ready to buy and reboot if funds permit.");
      ns.tprint("==================================================");
      break;
    }

    const currentRep = ns.singularity.getFactionRep(currentFaction);
    const currentMoney = ns.getServerMoneyAvailable("home");
    const repMet = currentRep >= target.repReq;
    const moneyMet = currentMoney >= target.price;

    ns.clearLog();
    ns.tprint("=============== AUTO BUY & INSTALL ===============");
    ns.tprint(`Active Faction : ${currentFaction}`);
    ns.tprint(`Target Aug     : ${target.name}`);
    ns.tprint(
      `Reputation     : ${ns.format.number(currentRep, 2)} / ${ns.format.number(target.repReq, 2)} (${((currentRep / target.repReq) * 100).toFixed(1)}%)`,
    );
    ns.tprint(
      `Target Cost    : $${ns.format.number(currentMoney, 2)} / $${ns.format.number(target.price, 2)}`,
    );
    ns.tprint(
      `Status         : ${repMet ? "Rep Ready!" : "Grinding Rep..."} | ${moneyMet ? "Funds Ready!" : "Need Cash..."}`,
    );
    ns.tprint("==================================================");

    if (repMet && moneyMet) {
      ns.tprint(
        `[INSTALL-MANAGER] Final augment for ${currentFaction} (${target.name}) ready! Starting checkout...`,
      );
      break;
    }

    await ns.sleep(4000);
  }

  // 2. Discover and sort all unowned augmentations across all joined factions
  const ownedAugs = new Set(ns.singularity.getOwnedAugmentations(true));
  const playerFactions = ns.getPlayer().factions;
  const candidates = [];

  for (const faction of playerFactions) {
    const factionRep = ns.singularity.getFactionRep(faction);
    const factionAugs = ns.singularity.getAugmentationsFromFaction(faction);

    for (const aug of factionAugs) {
      if (aug === "NeuroFlux Governor") continue;
      if (ownedAugs.has(aug)) continue;

      const repReq = ns.singularity.getAugmentationRepReq(aug);
      if (factionRep < repReq) continue;

      const prereqs = ns.singularity.getAugmentationPrereq(aug);
      const hasPrereqs = prereqs.every((req) => ownedAugs.has(req));
      if (!hasPrereqs) continue;

      const price = ns.singularity.getAugmentationPrice(aug);

      if (!candidates.some((c) => c.name === aug)) {
        candidates.push({ name: aug, faction: faction, price: price });
      }
    }
  }

  // Sort descending by price to beat the 1.9x compounding cost multiplier
  candidates.sort((a, b) => b.price - a.price);

  let purchasedCount = 0;
  for (const item of candidates) {
    const currentPrice = ns.singularity.getAugmentationPrice(item.name);
    if (ns.getServerMoneyAvailable("home") >= currentPrice) {
      if (ns.singularity.purchaseAugmentation(item.faction, item.name)) {
        ns.tprint(
          `[AUG BUY] Purchased ${item.name} from ${item.faction} for $${ns.format.number(currentPrice)}`,
        );
        ownedAugs.add(item.name);
        purchasedCount++;
      }
    }
  }

  // 3. Dump remaining balance into NeuroFlux Governor
  let boughtNeuroFlux = true;
  while (boughtNeuroFlux) {
    boughtNeuroFlux = false;
    for (const faction of playerFactions) {
      const price = ns.singularity.getAugmentationPrice("NeuroFlux Governor");
      const repReq = ns.singularity.getAugmentationRepReq("NeuroFlux Governor");
      const factionRep = ns.singularity.getFactionRep(faction);
      const money = ns.getServerMoneyAvailable("home");

      if (money >= price && factionRep >= repReq) {
        if (
          ns.singularity.purchaseAugmentation(faction, "NeuroFlux Governor")
        ) {
          ns.tprint(
            `[AUG BUY] Leveled NeuroFlux Governor via ${faction} for $${ns.format.number(price)}`,
          );
          purchasedCount++;
          boughtNeuroFlux = true;
          break;
        }
      }
    }
  }

  // 4. Install augmentations and reboot directly into startup.js
  if (purchasedCount > 0) {
    ns.tprint(
      `[AUG INSTALL] Successfully purchased ${purchasedCount} augmentations. Installing and rebooting with startup.js...`,
    );
    await ns.sleep(2500);
    ns.singularity.installAugmentations("startup.js");
  } else {
    ns.tprint(
      `[AUG INSTALL] No augmentations were purchased. Aborting install to prevent unnecessary reset.`,
    );
  }
}
