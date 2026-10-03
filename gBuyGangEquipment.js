/** @param {NS} ns */
export async function main(ns) {
  const member = ns.args[0];
  const item = ns.args[1];
  if (member && item) {
    ns.gang.purchaseEquipment(member, item);
  }
}
