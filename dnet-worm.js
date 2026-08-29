/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");
  const scriptName = ns.getScriptName();
  const currentHost = ns.getHostname();

  while (true) {
    let neighbors = [];
    try {
      neighbors = ns.dnet.probe();
    } catch (e) {}

    for (const host of neighbors) {
      let details;
      try {
        details = ns.dnet.getServerDetails(host);
      } catch (e) {
        continue;
      }

      if (!details?.isOnline || !details?.isConnectedToCurrentServer) continue;

      let authSuccess = details.hasSession;

      // 1. Solve and Authenticate
      if (!authSuccess) {
        authSuccess = await solvePassword(ns, host, details);
      }

      // 2. Propagate worm instance
      if (authSuccess) {
        if (!ns.fileExists(scriptName, host)) {
          await ns.scp(scriptName, host, currentHost);
        }
        if (!ns.scriptRunning(scriptName, host)) {
          ns.exec(scriptName, host, 1);
        }
      }
    }

    // 3. Free blocked RAM on current host
    try {
      await ns.dnet.memoryReallocation();
    } catch (e) {}

    // 4. Open any discovered .cache loot containers
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
 * Universal Dark Net Defense Solver
 * @param {NS} ns
 * @param {string} host
 * @param {object} details
 */
async function solvePassword(ns, host, details) {
  const model = details.modelId || "";
  const pwLen = details.passwordLength || 0;

  // Model 1: ZeroLogon
  if (model === "ZeroLogon" || pwLen === 0) {
    const res = await ns.dnet.authenticate(host, "");
    return res.success || res.code === 200;
  }

  // Model 2: CloudBlare (Noise/Captcha Solver)
  if (model.includes("CloudBlare")) {
    const probe = await ns.dnet.authenticate(host, "probe");
    if (probe.data && typeof probe.data === "string") {
      const captchaDigits = probe.data.replace(/\D/g, "");
      if (captchaDigits.length > 0) {
        const authRes = await ns.dnet.authenticate(host, captchaDigits);
        if (authRes.success || authRes.code === 200) {
          ns.tprint(
            `[DARKNET CAPTCHA] Solved ${host} with PIN: "${captchaDigits}"`,
          );
          return true;
        }
      }
    }
  }

  // Model 3: DeskMemo (Plaintext Note Leaks)
  if (model.includes("DeskMemo")) {
    const probe = await ns.dnet.authenticate(host, "probe");
    const memoText = probe.message || "";
    const match = memoText.match(/\b\d{1,6}\b/);
    if (match) {
      const res = await ns.dnet.authenticate(host, match[0]);
      if (res.success || res.code === 200) {
        ns.tprint(
          `[DARKNET MEMO] Cracked ${host} with leaked PIN: "${match[0]}"`,
        );
        return true;
      }
    }
  }

  // Model 4: AccountsManager / Binary Search (Higher / Lower Feedback)
  if (model.includes("AccountsManager") || pwLen === 1) {
    let low = 0;
    let high = pwLen === 1 ? 10 : 100;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const res = await ns.dnet.authenticate(host, String(mid));

      if (res.success || res.code === 200) {
        ns.tprint(`[DARKNET HI-LO] Cracked ${host} with value: "${mid}"`);
        return true;
      }

      const feedback = String(res.data || res.message || "").toLowerCase();
      if (feedback.includes("higher")) {
        low = mid + 1;
      } else if (feedback.includes("lower")) {
        high = mid - 1;
      } else {
        low++;
      }
      await ns.sleep(50);
    }
  }

  // Model 5: Factori-Os (Divisibility Reduction)
  if (model.includes("Factori")) {
    let candidates = Array.from({ length: 100 }, (_, i) => i + 1);
    const testDivisors = [2, 3, 4, 5, 7, 8, 9, 11, 13, 16];

    for (const div of testDivisors) {
      const res = await ns.dnet.authenticate(host, String(div));
      if (res.success || res.code === 200) {
        ns.tprint(`[DARKNET FACTOR] Solved ${host}: "${div}"`);
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
            ns.tprint(`[DARKNET FACTOR] Solved ${host}: "${candidate}"`);
            return true;
          }
          await ns.sleep(50);
        }
        break;
      }
      await ns.sleep(50);
    }
  }

  // Model 6: Positional 5-Digit PIN (Mastermind Feedback)
  if (pwLen === 5) {
    let knownDigits = ["0", "0", "0", "0", "0"];

    for (let digit = 0; digit <= 9; digit++) {
      const candidate = knownDigits
        .map((d, i) => (knownDigits[i] === "0" ? String(digit) : d))
        .join("");
      const res = await ns.dnet.authenticate(host, candidate);

      if (res.success || res.code === 200) {
        ns.tprint(`[DARKNET PIN] Solved ${host}: "${candidate}"`);
        return true;
      }

      if (res.data && Array.isArray(res.data)) {
        res.data.forEach((status, idx) => {
          if (status === "yes") knownDigits[idx] = String(digit);
        });
      }
      await ns.sleep(50);
    }
  }

  // Model 7: Defaults (Filtered by Known Length)
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
  ];
  for (const pw of commonDefaults) {
    if (pwLen > 0 && pw.length !== pwLen) continue;
    const res = await ns.dnet.authenticate(host, pw);
    if (res.success || res.code === 200) {
      ns.tprint(`[DARKNET AUTH] Cracked ${host} with default: "${pw}"`);
      return true;
    }
  }

  // Model 8: Heartbleed Fallback
  try {
    const bleed = await ns.dnet.heartbleed(host, { peek: true });
    if (bleed?.logs) {
      ns.print(`[HEARTBLEED] ${host}: ${bleed.logs}`);
    }
  } catch (e) {}

  return false;
}
