/** @param {NS} ns */
export async function main(ns) {
  const target = "w0r1d_d43m0n";
  const visited = new Set();
  const queue = [["home"]];

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (current === target) {
      const connectCmd = path.map((hop) => `connect ${hop}`).join("; ");
      ns.tprint(`\n[SUCCESS] Found ${target}!`);
      ns.tprint(`Hops (${path.length - 1}): ${path.join(" -> ")}`);
      ns.tprint(`\nCommand to run:\n${connectCmd}; backdoor\n`);
      return;
    }

    visited.add(current);

    const neighbors = ns.scan(current);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push([...path, neighbor]);
      }
    }
  }

  ns.tprint(
    `[ERROR] ${target} was not found on the network. Verify The Red Pill is installed.`,
  );
}
