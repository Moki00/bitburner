/** @param {NS} ns */
export async function main(ns) {
  const [target, delay] = ns.args;
  if (delay > 0) await ns.sleep(delay);
  await ns.grow(target);
}
