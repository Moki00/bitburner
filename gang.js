/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  if (!ns.gang.inGang()) {
    ns.tprint("[GANG] Join a gang first!");
    return;
  }

  while (true) {
    const gangInfo = ns.gang.getGangInformation();
    const isHackingGang = gangInfo.isHacking;

    // 1. Auto-Recruit up to 12 members
    if (ns.gang.canRecruitMember()) {
      const nextIndex = ns.gang.getMemberNames().length + 1;
      const newName = `agent-${nextIndex}`;
      if (ns.gang.recruitMember(newName)) {
        ns.tprint(`[RECRUIT] Enlisted gang member: ${newName}`);
      }
    }

    const members = ns.gang.getMemberNames();
    const gearList = ns.gang.getEquipmentNames();
    const availableFunds = ns.getServerMoneyAvailable("home");
    const spendLimit = availableFunds * 0.8; // Reserve 20% buffer

    // 2. Equipment Upgrades
    for (const member of members) {
      const memberInfo = ns.gang.getMemberInformation(member);

      // Auto-Ascend Check
      const ascResult = ns.gang.getAscensionResult(member);
      if (ascResult) {
        const threshold = isHackingGang
          ? ascResult.hack
          : (ascResult.str + ascResult.def + ascResult.dex + ascResult.agi) / 4;
        if (threshold >= 1.6) {
          ns.gang.ascendMember(member);
          ns.gang.setMemberTask(
            member,
            isHackingGang ? "Train Hacking" : "Train Combat",
          );
          ns.print(`[ASCEND] Ascended ${member} and reset task to Training.`);
        }
      }

      // Purchase relevant gear
      for (const item of gearList) {
        const itemType = ns.gang.getEquipmentType(item);
        const cost = ns.gang.getEquipmentCost(item);

        const isRelevant = isHackingGang
          ? ["Rootkit", "Augmentation"].includes(itemType)
          : ["Weapon", "Armor", "Vehicle", "Augmentation"].includes(itemType);

        if (
          isRelevant &&
          cost <= spendLimit &&
          !memberInfo.upgrades.includes(item)
        ) {
          ns.gang.purchaseEquipment(member, item);
        }
      }
    }

    // 3. Dynamic Task Routing
    for (const member of members) {
      const memberInfo = ns.gang.getMemberInformation(member);

      // Manage Wanted Level
      if (gangInfo.wantedPenalty < 0.85 && gangInfo.wantedLevel > 1) {
        ns.gang.setMemberTask(
          member,
          isHackingGang ? "Ethical Hacking" : "Vigilante Justice",
        );
        continue;
      }

      if (isHackingGang) {
        // Hacking Gang
        if (memberInfo.hack < 200) {
          ns.gang.setMemberTask(member, "Train Hacking");
        } else if (memberInfo.hack < 800) {
          ns.gang.setMemberTask(member, "Ransomware");
        } else if (memberInfo.hack < 2000) {
          ns.gang.setMemberTask(member, "Identity Theft");
        } else {
          ns.gang.setMemberTask(member, "Money Laundering");
        }
      } else {
        // Combat Gang
        const combatAvg =
          (memberInfo.str + memberInfo.def + memberInfo.dex + memberInfo.agi) /
          4;

        // Phase 1: Foundational training
        if (combatAvg < 150) {
          ns.gang.setMemberTask(member, "Train Combat");
        } else if (memberInfo.cha < 100) {
          // Bring Charisma up to standard so respect tasks don't flop
          ns.gang.setMemberTask(member, "Train Charisma");
        } else if (combatAvg < 500) {
          // Phase 2: High Respect & Low Heat Mid-Tier Jobs
          if (memberInfo.cha >= 200) {
            ns.gang.setMemberTask(member, "Run a Con");
          } else {
            ns.gang.setMemberTask(member, "Strongarm Civilians");
          }
        } else if (combatAvg < 1200) {
          // Phase 3: Respect & Revenue Hybrid
          ns.gang.setMemberTask(member, "Threaten & Blackmail");
        } else {
          // Phase 4: Territory and End-Game Revenue
          if (gangInfo.territory < 1.0 && gangInfo.territoryWarfareEngaged) {
            ns.gang.setMemberTask(member, "Territory Warfare");
          } else {
            ns.gang.setMemberTask(member, "Traffick Illegal Arms");
          }
        }
      }
    }

    ns.print("========================================");
    ns.print(
      `[GANG OVERVIEW]\n` +
        `Respect: ${ns.format.number(gangInfo.respect)} (+${ns.format.number(gangInfo.respectGainRate)}/sec) \n` +
        `Money: ${ns.format.number(gangInfo.moneyGainRate)}/s \n` +
        `Wanted: ${ns.format.number(gangInfo.wantedLevel)} (+${ns.format.number(gangInfo.wantedLevelGainRate)}/s) \n` +
        // `Penalty: ${((1 - gangInfo.wantedPenalty) * 100).toFixed(2)}%`,
        //how to do new line?
        `Penalty: ${gangInfo.wantedPenalty.toFixed(2)}% \n`,
      `Efficiency: ${(gangInfo.wantedPenalty * 100).toFixed(1)}\% (Lost:${((1 - gangInfo.wantedPenalty) * 100).toFixed(1)}% \n)`,
    );
    ns.print("========================================");

    await ns.sleep(5000);
  }
}
