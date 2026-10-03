/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  ns.ui.openTail();

  if (!ns.gang.inGang()) {
    ns.tprint("[GANG] Join a gang first!");
    return;
  }

  let loopCounter = 0;

  while (true) {
    const myGang = ns.gang.getGangInformation();
    const isHackingGang = myGang.isHacking;
    const allGang = ns.gang.getAllGangInformation();

    // 1. Auto-Recruit up to 12 members
    if (ns.gang.canRecruitMember()) {
      const nextIndex = ns.gang.getMemberNames().length + 1;
      const newName =
        nextIndex < 10 ? `agent-00${nextIndex}` : `agent-0${nextIndex}`;
      if (ns.gang.recruitMember(newName)) {
        ns.tprint(`[RECRUIT] Enlisted gang member: ${newName}`);
      }
    }

    const members = ns.gang.getMemberNames();
    const gearList = ns.gang.getEquipmentNames();
    const availableFunds = ns.getServerMoneyAvailable("home");
    const ASCEND_THRESHOLD = members.length < 12 ? 1.4 : 1.6;
    const PERCENTAGE_OF_FUNDS_FOR_EQUIPMENT = 0.05;
    const spendLimit = availableFunds * PERCENTAGE_OF_FUNDS_FOR_EQUIPMENT;

    // 2. Clash Engagement Check (Fire helper every 60 seconds)
    if (loopCounter % 12 === 0 && allGang[myGang.faction].territory < 1.0) {
      if (!ns.isRunning("gang-war-eval.js", "home")) {
        ns.run("gang-war-eval.js");
      }
    }

    // 3. Equipment Upgrades and Ascension
    for (const member of members) {
      const memberInfo = ns.gang.getMemberInformation(member);

      // Ascend Check
      const ascResult = ns.gang.getAscensionResult(member);
      if (ascResult) {
        const threshold = isHackingGang
          ? ascResult.hack
          : (ascResult.str + ascResult.def + ascResult.dex + ascResult.agi) / 4;
        if (
          threshold >= ASCEND_THRESHOLD &&
          !ns.isRunning("gAscend.js", "home")
        ) {
          ns.run("gAscend.js", 1, member);
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
          !memberInfo.upgrades.includes(item) &&
          !ns.isRunning("gBuyGangEquipment.js", "home")
        ) {
          ns.run("gBuyGangEquipment.js", 1, member, item);
        }
      }
    }

    // 4. Dynamic Task Routing
    // Dynamically assign the first 3 agents to territory duty once strong enough
    const powerBuilders = ["agent-008", "agent-009", "agent-010"];

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
          if (myGang.territory < 1.0 && powerBuilders.includes(member)) {
            ns.gang.setMemberTask(member, "Territory Warfare");
          } else {
            ns.gang.setMemberTask(member, "Traffick Illegal Arms");
          }
        }
      }
    }

    // 5. Gang Overview and Territory Telemetry Log
    ns.clearLog();
    ns.print("========================================");
    ns.print(
      `[GANG OVERVIEW]\n` +
        `Respect:   ${ns.format.number(myGang.respect, 1)} (+${ns.format.number(myGang.respectGainRate, 1)}/sec)\n` +
        `Money:     $${ns.format.number(myGang.moneyGainRate, 1)}/s\n` +
        `Wanted:    ${ns.format.number(myGang.wantedLevel, 1)} (Penalty: ${(-(1 - myGang.wantedPenalty) * 100).toFixed(1)}%)\n` +
        `Efficiency: ${(myGang.wantedPenalty * 100).toFixed(1)}%\n` +
        `Territory: ${(allGang[myGang.faction].territory * 100).toFixed(1)}% | Power: ${allGang[myGang.faction].power.toFixed(1)} | War: ${myGang.territoryWarfareEngaged}`,
    );
    ns.print("========================================");

    loopCounter++;
    await ns.sleep(5000);
  }
}
