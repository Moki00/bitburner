/**
 * Worms through the Dark Net, cracks authentications, and harvests cache loot.
 *
 * @param {NS} ns - Netscript API
 */
export async function main(ns) {
  const scriptName = ns.getScriptName();
  const currentHost = ns.getHostname();

  while (true) {
    // 1. Probe immediate Dark Net neighbors
    let neighbors = [];
    try {
      neighbors = ns.dnet.probe();
    } catch (e) {}

    for (const host of neighbors) {
      const details = ns.dnet.getServerDetails(host);
      if (!details.isOnline || !details.isConnectedToCurrentServer) continue;

      let authSuccess = details.hasSession;

      // 2. Solve and Authenticate
      if (!authSuccess) {
        authSuccess = await solvePassword(ns, host, details);
      }

      // 3. Propagate worm if authenticated and not already running
      if (authSuccess) {
        if (!ns.fileExists(scriptName, host)) {
          await ns.scp(scriptName, host, currentHost);
        }
        if (!ns.scriptRunning(scriptName, host)) {
          ns.exec(scriptName, host, 1);
        }
      }
    }

    // 4. Free blocked RAM on current server
    try {
      await ns.dnet.memoryReallocation();
    } catch (e) {}

    // 5. Open discovered .cache loot files
    const files = ns.ls(currentHost, ".cache");
    for (const file of files) {
      try {
        await ns.dnet.openCache(file);
        ns.tprint(
          `[DARKNET LOOT] Opened cache file: ${file} on ${currentHost}`,
        );
      } catch (e) {}
    }

    await ns.sleep(5000);
  }
}

/**
 * Solves Darknet password models using positional feedback and defaults
 *
 * @param {NS} ns - Netscript API
 * @param {string} host - Target Dark Net machine
 * @param {object} details - Target server specs and state
 */
async function solvePassword(ns, host, details) {
  // Model 1: ZeroLogon
  if (details.modelId === "ZeroLogon" || details.passwordLength === 0) {
    const res = await ns.dnet.authenticate(host, "");
    return res.success || res.code === 200;
  }

  // Model 2: Dedicated CloudBlare Handler
  if (
    details.modelId?.includes("CloudBlare") ||
    details.modelId === "CloudBlare(tm)"
  ) {
    // 1. Check if Heartbleed or probe has the raw captcha data
    let captchaRaw = details.data || "";
    if (!captchaRaw) {
      const probe = await ns.dnet.authenticate(host, "probe");
      if (probe.success || probe.code === 200) return true;
      captchaRaw = probe.data;
    }

    if (typeof captchaRaw === "string") {
      const pin = captchaRaw.replace(/\D/g, "");
      if (pin.length > 0) {
        const res = await ns.dnet.authenticate(host, pin);
        if (res.success || res.code === 200) {
          ns.tprint(`[DARKNET CAPTCHA] Solved ${host} with PIN: "${pin}"`);
          return true;
        }
      }
    }
  }

  // Model 3: Direct Message Leak Solver (Catches "The password is ...", DeskMemo, etc.)
  const probe = await ns.dnet.authenticate(host, "probe");
  if (probe.success || probe.code === 200) return true;

  // Dynamic CloudBlare catch if modelId was missed
  if (probe.data && typeof probe.data === "string") {
    const pin = probe.data.replace(/\D/g, "");
    if (
      pin.length === (details.passwordLength || pin.length) &&
      pin.length > 0
    ) {
      const res = await ns.dnet.authenticate(host, pin);
      if (res.success || res.code === 200) {
        ns.tprint(
          `[DARKNET CAPTCHA] Solved ${host} via data fallback: "${pin}"`,
        );
        return true;
      }
    }
  }

  if (probe.message) {
    // 1. Explicit phrase match
    const explicitMatch = probe.message.match(
      /(?:password is|PIN is|set to)\s+([^\s\.\,]+)/i,
    );
    if (explicitMatch) {
      const leakedVal = explicitMatch[1];
      const res = await ns.dnet.authenticate(host, leakedVal);
      if (res.success || res.code === 200) {
        ns.tprint(
          `[DARKNET LEAK] Cracked ${host} with leaked key: "${leakedVal}"`,
        );
        return true;
      }
    }

    // 2. Numeric fallback (grabs standalone numbers like 444, 450, 708)
    const numMatch = probe.message.match(/\b\d{3,6}\b/);
    if (numMatch) {
      const leakedPin = numMatch[0];
      const res = await ns.dnet.authenticate(host, leakedPin);
      if (res.success || res.code === 200) {
        ns.tprint(
          `[DARKNET MEMO] Cracked ${host} with memo PIN: "${leakedPin}"`,
        );
        return true;
      }
    }
  }

  // Model 4: Factori-Os
  if (
    details.modelId?.includes("Factor i") ||
    details.modelId === "Factori-Os"
  ) {
    let candidates = [];
    for (let i = 1; i <= 100; i++) candidates.push(i);

    const testDivisors = [2, 3, 4, 5, 7, 8, 9, 11, 13, 16];

    for (const div of testDivisors) {
      const res = await ns.dnet.authenticate(host, String(div));

      if (res.success || res.code === 200) {
        ns.tprint(
          `[DARKNET AUTH] Solved ${host} (Exact Factor Match): "${div}"`,
        );
        return true;
      }

      if (res.data === true) {
        candidates = candidates.filter((n) => n % div === 0);
      } else if (res.data === false) {
        candidates = candidates.filter((n) => n % div !== 0);
      }

      if (candidates.length <= 3) {
        for (const candidate of candidates) {
          const testRes = await ns.dnet.authenticate(host, String(candidate));
          if (testRes.success || testRes.code === 200) {
            ns.tprint(
              `[DARKNET AUTH] Solved ${host} Factori-Os: "${candidate}"`,
            );
            return true;
          }
          await ns.sleep(50);
        }
        break;
      }
      await ns.sleep(50);
    }
  }

  // Model 5: Factory Defaults & In-Loop Feedback Parsing
  const commonDefaults = [
    "0000",
    "1234",
    "admin",
    "password",
    "000000",
    "123456",
    "letmein",
    "qwerty",
    "111111",
    "iloveyou",
    "welcome",
    "monkey",
    "abc123",
    "561",
    "654321",
  ];
  for (const pw of commonDefaults) {
    const res = await ns.dnet.authenticate(host, pw);
    if (res.success || res.code === 200) {
      ns.tprint(`[DARKNET AUTH] Cracked ${host} with default: "${pw}"`);
      return true;
    }
    if (res.data && typeof res.data === "string") {
      const pin = res.data.replace(/\D/g, "");
      if (pin.length > 0) {
        const pinRes = await ns.dnet.authenticate(host, pin);
        if (pinRes.success || pinRes.code === 200) {
          ns.tprint(`[DARKNET CAPTCHA] Solved ${host} via loop data: "${pin}"`);
          return true;
        }
      }
    }
    if (res.message) {
      const match = res.message.match(/password is\s+([^\s\.\,]+)/i);
      if (match) {
        const leaked = match[1];
        const leakRes = await ns.dnet.authenticate(host, leaked);
        if (leakRes.success || leakRes.code === 200) {
          ns.tprint(
            `[DARKNET AUTH] Cracked ${host} via feedback leak: "${leaked}"`,
          );
          return true;
        }
      }
    }
  }

  // Model 6: Positional 5-digit PIN
  const pinLength = details.passwordLength || 5;
  if (pinLength === 5) {
    let knownDigits = ["0", "0", "0", "0", "0"];

    for (let digit = 0; digit <= 9; digit++) {
      const candidate = knownDigits
        .map((d, i) => (knownDigits[i] === "0" ? String(digit) : d))
        .join("");
      const res = await ns.dnet.authenticate(host, candidate);

      if (res.success || res.code === 200) {
        ns.tprint(`[DARKNET AUTH] Solved ${host} PIN: "${candidate}"`);
        return true;
      }

      if (res.data && Array.isArray(res.data)) {
        res.data.forEach((status, idx) => {
          if (status === "yes") {
            knownDigits[idx] = String(digit);
          }
        });
      }
      await ns.sleep(50);
    }
  }

  // Model 7: Heartbleed Fallback
  try {
    const bleed = await ns.dnet.heartbleed(host, { peek: true });
    if (bleed && bleed.logs) {
      ns.print(`[HEARTBLEED] ${host}: ${bleed.logs}`);
    }
  } catch (e) {}

  return false;
}
