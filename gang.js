/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.ui.openTail();
  const ASCEND_THRESHOLD = 2.6;
  const PERCENTAGE_OF_FUNDS_FOR_EQUIPMENT = 0.5;

  if (!ns.gang.inGang()) {
    ns.tprint("[GANG] Join a gang first!");
    return;
  }

  while (true) {
    const myGang = ns.gang.getGangInformation();
    const isHackingGang = myGang.isHacking;
    const allGang = ns.gang.getAllGangInformation();

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
    const spendLimit = availableFunds * PERCENTAGE_OF_FUNDS_FOR_EQUIPMENT;

    // 2. Clash Engagement Evaluation (Runs once per cycle outside member loop)
    let readyToWar = true;
    if (allGang[myGang.faction].territory < 1.0) {
      for (const [gangName, gangData] of Object.entries(allGang)) {
        if (gangName === myGang.faction) continue;
        if (gangData.territory > 0) {
          const winChance = ns.gang.getChanceToWinClash(gangName);
          if (winChance < 0.85) {
            readyToWar = false;
            break;
          }
        }
      }
      ns.gang.setTerritoryWarfare(readyToWar);
    } else {
      ns.gang.setTerritoryWarfare(false);
    }

    // 3. Equipment Upgrades and Ascension
    for (const member of members) {
      const memberInfo = ns.gang.getMemberInformation(member);

      // Auto-Ascend Check
      const ascResult = ns.gang.getAscensionResult(member);
      if (ascResult) {
        const threshold = isHackingGang
          ? ascResult.hack
          : (ascResult.str + ascResult.def + ascResult.dex + ascResult.agi) / 4;
        if (threshold >= ASCEND_THRESHOLD) {
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

    // 4. Dynamic Task Routing
    const powerBuilders = ["Moki", "Mike", "Rioz"];

    for (const member of members) {
      const memberInfo = ns.gang.getMemberInformation(member);

      // Manage Wanted Level
      if (myGang.wantedPenalty < 0.85 && myGang.wantedLevel > 1) {
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

        if (combatAvg < 150) {
          ns.gang.setMemberTask(member, "Train Combat");
        } else if (memberInfo.cha < 100) {
          ns.gang.setMemberTask(member, "Train Charisma");
        } else if (combatAvg < 500) {
          if (memberInfo.cha >= 200) {
            ns.gang.setMemberTask(member, "Run a Con");
          } else {
            ns.gang.setMemberTask(member, "Strongarm Civilians");
          }
        } else if (combatAvg < 1200) {
          ns.gang.setMemberTask(member, "Threaten & Blackmail");
        } else {
          // Phase 4: Territory builders vs revenue generators
          if (myGang.territory < 1.0 && powerBuilders.includes(member)) {
            ns.gang.setMemberTask(member, "Territory Warfare");
          } else {
            ns.gang.setMemberTask(member, "Traffick Illegal Arms");
          }
        }
      }
    }

    // 5. Gang Overview and Territory Telemetry Log
    ns.print("========================================");
    ns.print(
      `[GANG OVERVIEW]\n` +
        `Respect: ${ns.format.number(myGang.respect)} (+${ns.format.number(myGang.respectGainRate)}/sec)\n` +
        `Money: ${ns.format.number(myGang.moneyGainRate)}/s\n` +
        `Wanted: ${ns.format.number(myGang.wantedLevel)} (+${ns.format.number(myGang.wantedLevelGainRate)}/s)\n` +
        `Penalty: ${(-(1 - myGang.wantedPenalty) * 100).toFixed(2)}% | Efficiency: ${(myGang.wantedPenalty * 100).toFixed(1)}%\n` +
        `Efficiency: ${(myGang.wantedPenalty * 100).toFixed(1)}% (Lost:${((1 - myGang.wantedPenalty) * 100).toFixed(1)}%) \n` +
        `Territory: ${(allGang[myGang.faction].territory * 100).toFixed(2)}% | Power: ${allGang[myGang.faction].power.toFixed(1)} | War: ${readyToWar}`,
    );
    ns.print("========================================");

    await ns.sleep(5000);
  }
}
