/** @param {NS} ns */
export async function main(ns) {
  const member = ns.args[0];
  if (member && ns.gang.ascendMember(member)) {
    ns.tprint(`[ASCEND] Successfully ascended ${member}`);
  }
}
