/** @param {NS} ns */
export async function main(ns) {
  const scriptName = ns.getScriptName();

  while (true) {
    // 1. Probe immediate darknet neighbors
    const neighbors = ns.dnet.probe();

    for (const host of neighbors) {
      const details = ns.dnet.getServerDetails(host);
      if (!details.isOnline || !details.isConnectedToCurrentServer) continue;

      let authSuccess = details.hasSession;

      // 2. Solve and Authenticate
      if (!authSuccess) {
        authSuccess = await solvePassword(ns, host, details);
      }

      // 3. Replicate and propagate worm
      if (authSuccess) {
        await ns.scp(scriptName, host, ns.getHostname());
        ns.exec(scriptName, host, 1, "--tail");
      }
    }

    // 4. Free blocked RAM on the current server
    try {
      await ns.dnet.memoryReallocation();
    } catch (e) {}

    // 5. Open any discovered .cache loot files
    const files = ns.ls(ns.getHostname(), ".cache");
    for (const file of files) {
      try {
        await ns.dnet.openCache(file);
        ns.tprint(
          `[DARKNET LOOT] Opened cache file: ${file} on ${ns.getHostname()}`,
        );
      } catch (e) {}
    }

    await ns.sleep(5000);
  }
}

/**
 * Solves common Darknet password models
 * @param {NS} ns
 * @param {string} host
 * @param {object} details
 */
async function solvePassword(ns, host, details) {
  // Model 1: ZeroLogon (No password)
  if (details.modelId === "ZeroLogon" || details.passwordLength === 0) {
    const res = await ns.dnet.authenticate(host, "");
    return res.success;
  }

  // Model 2: Factory Defaults / Unset Passwords
  const commonDefaults = [
    "0000",
    "1234",
    "admin",
    "password",
    "000000",
    "123456",
  ];
  for (const pw of commonDefaults) {
    const res = await ns.dnet.authenticate(host, pw);
    if (res.success) {
      ns.tprint(`[DARKNET AUTH] Cracked ${host} with password: "${pw}"`);
      return true;
    }
  }

  // Model 3: Inspect Logs via Heartbleed if stuck
  try {
    const bleed = await ns.dnet.heartbleed(host, { peek: true });
    if (bleed && bleed.logs) {
      ns.print(`[HEARTBLEED] ${host}: ${bleed.logs}`);
    }
  } catch (e) {}

  return false;
}
