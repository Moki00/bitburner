/** @param {NS} ns */
export async function main(ns) {
  const target = ns.args[0];
  if (!target) {
    ns.tprint("Usage: run dnet-test.js <hostname>");
    return;
  }

  ns.tprint(`--- Diagnosing Darknet Node: ${target} ---`);

  // 1. Inspect raw server details
  try {
    const details = ns.dnet.getServerDetails(target);
    ns.tprint(`Raw details: ${JSON.stringify(details, null, 2)}`);
  } catch (e) {
    ns.tprint(`Could not fetch details: ${e}`);
  }

  // 2. Test Heartbleed log scraping directly
  try {
    const bleed = await ns.dnet.heartbleed(target, { peek: true });
    ns.tprint(`Heartbleed logs:\n${bleed?.logs ?? "(no logs returned)"}`);
  } catch (e) {
    ns.tprint(`Heartbleed failed: ${e}`);
  }

  // 3. Test probe authentication
  try {
    const probeRes = await ns.dnet.authenticate(target, "probe");
    ns.tprint(`Probe Response: ${JSON.stringify(probeRes, null, 2)}`);
  } catch (e) {
    ns.tprint(`Probe failed: ${e}`);
  }
}
