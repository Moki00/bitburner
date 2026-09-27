/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  const MAX_NODES = 12; // Cap node count to prevent over-investing late game
  const SPEND_RATIO = 0.15; // Never spend more than 15% of available funds at once

  while (true) {
    const numNodes = ns.hacknet.numNodes();
    const money = ns.getServerMoneyAvailable("home");
    const budget = money * SPEND_RATIO;

    let bestAction = null;
    let lowestCost = Infinity;

    // 1. Evaluate purchasing a new node
    if (numNodes < MAX_NODES) {
      const purchaseCost = ns.hacknet.getPurchaseNodeCost();
      if (purchaseCost < lowestCost) {
        lowestCost = purchaseCost;
        bestAction = { type: "purchase" };
      }
    }

    // 2. Scan every node for the cheapest available upgrade
    for (let i = 0; i < numNodes; i++) {
      const levelCost = ns.hacknet.getLevelUpgradeCost(i, 1);
      if (levelCost < lowestCost) {
        lowestCost = levelCost;
        bestAction = { type: "level", node: i, amount: 1 };
      }

      const ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
      if (ramCost < lowestCost) {
        lowestCost = ramCost;
        bestAction = { type: "ram", node: i, amount: 1 };
      }

      const coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
      if (coreCost < lowestCost) {
        lowestCost = coreCost;
        bestAction = { type: "core", node: i, amount: 1 };
      }
    }

    // 3. Execute the best action if within budget
    if (bestAction && lowestCost <= budget) {
      switch (bestAction.type) {
        case "purchase": {
          const newNodeIndex = ns.hacknet.purchaseNode();
          if (newNodeIndex !== -1) {
            ns.print(
              `[HACKNET] Bought node-${newNodeIndex} for $${ns.format.number(lowestCost)}`,
            );
          }
          break;
        }
        case "level":
          if (ns.hacknet.upgradeLevel(bestAction.node, bestAction.amount)) {
            ns.print(
              `[HACKNET] Upgraded node-${bestAction.node} Level for $${ns.format.number(lowestCost)}`,
            );
          }
          break;
        case "ram":
          if (ns.hacknet.upgradeRam(bestAction.node, bestAction.amount)) {
            ns.print(
              `[HACKNET] Upgraded node-${bestAction.node} RAM for $${ns.format.number(lowestCost)}`,
            );
          }
          break;
        case "core":
          if (ns.hacknet.upgradeCore(bestAction.node, bestAction.amount)) {
            ns.print(
              `[HACKNET] Upgraded node-${bestAction.node} Core for $${ns.format.number(lowestCost)}`,
            );
          }
          break;
      }
    }

    await ns.sleep(3000);
  }
}
