/**
 * z-buy-install.js
 * Monitors CyberSec until its final augmentation is unlocked and affordable,
 * buys all available augmentations, dumps leftover funds into NeuroFlux, and installs.
 *
 * @param {NS} ns
 */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.ui.openTail();
  ns.ui.resizeTail(600, 320);

  const targetFaction = "CyberSec";
  const startupScript = "startup.js";

  if (!ns.getPlayer().factions.includes(targetFaction)) {
    ns.tprint(`[ERROR] You are not currently a member of ${targetFaction}!`);
    return;
  }

  // 1. Identify CyberSec's highest-rep unowned augmentation
  function getCyberSecTarget() {
    const owned = new Set(ns.singularity.getOwnedAugmentations(true));
    const factionAugs = ns.singularity
      .getAugmentationsFromFaction(targetFaction)
      .filter((aug) => aug !== "NeuroFlux Governor" && !owned.has(aug));

    if (factionAugs.length === 0) return null;

    // Sort descending by rep requirement to find the final milestone
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

  // 2. Loop until the final CyberSec augmentation is unlocked and affordable
  while (true) {
    const target = getCyberSecTarget();

    if (!target) {
      ns.print(
        `[CYBERSEC] All CyberSec augmentations already acquired! Proceeding to buy & install...`,
      );
      break;
    }

    const currentRep = ns.singularity.getFactionRep(targetFaction);
    const currentMoney = ns.getServerMoneyAvailable("home");
    const repMet = currentRep >= target.repReq;
    const moneyMet = currentMoney >= target.price;

    ns.clearLog();
    ns.print("================ CYBERSEC GATE ================");
    ns.print(`Target Aug     : ${target.name}`);
    ns.print(
      `Reputation     : ${ns.format.number(currentRep, 2)} / ${ns.format.number(target.repReq, 2)} (${((currentRep / target.repReq) * 100).toFixed(1)}%)`,
    );
    ns.print(
      `Funds Needed   : $${ns.format.number(currentMoney, 2)} / $${ns.format.number(target.price, 2)}`,
    );
    ns.print(
      `Status         : ${repMet ? "Rep Ready!" : "Grinding Rep..."} | ${moneyMet ? "Funds Ready!" : "Need Cash..."}`,
    );
    ns.print("===============================================");

    if (repMet && moneyMet) {
      ns.tprint(
        `[CYBERSEC] Final augment (${target.name}) ready! Initiating purchase sequence...`,
      );
      break;
    }

    await ns.sleep(5000);
  }

  // 3. Collect and purchase all available augmentations across all joined factions
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

  // Sort highest price first to mitigate the 1.9x compounding cost
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

  // 4. Dump leftover funds into NeuroFlux Governor
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

  // 5. Install and reboot
  ns.tprint(
    `[AUG INSTALL] Successfully purchased ${purchasedCount} augmentations. Resetting into ${startupScript}...`,
  );
  await ns.sleep(2500);
  ns.singularity.installAugmentations(startupScript);
}
