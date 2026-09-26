/** @param {NS} ns */
export async function main(ns) {
  ns.tprint(ns.cloud.getServerLimit());
  ns.tprint(ns.cloud.getServerNames());
  ns.tprint(ns.cloud.getRamLimit("cloud-01"));
}
