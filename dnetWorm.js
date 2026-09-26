/**
 * Worms through the Dark Net, cracks authentications, and harvests cache loot.
 *
 * @param {NS} ns - Netscript API
 */
export async function main(ns) {
  ns.disableLog("ALL");

  const scriptName = ns.getScriptName();
  ns.print(`This Script is ${scriptName}`);
  const currentHost = ns.getHostname();

  if (currentHost === "home") {
    ns.ui.openTail();
    ns.print("Tail open on Home.");
  }

  while (true) {
    // 1. Probe DarkNet neighbors
    let neighbors = [];
    try {
      neighbors = ns.dnet.probe();
    } catch (err) {
      ns.print(`Probe Error: ${err?.message ?? err}`);
    }

    for (const host of neighbors) {
      let details = null;
      try {
        details = ns.dnet.getServerDetails(host);
      } catch (err) {
        ns.print(`Details Error: ${err?.message ?? err}`);
        continue;
      }

      if (!details || !details.isOnline || !details.isConnectedToCurrentServer)
        continue;

      let authSuccess = details.hasSession;

      // 2. Solve and Authenticate
      if (!authSuccess) {
        ns.print(`No authSuccess on ${host}, attempting solver...`);
        authSuccess = await solvePassword(ns, host, details);
      }

      // 3. Propagate worm if authenticated and not already running
      if (authSuccess) {
        try {
          if (!ns.fileExists(scriptName, host)) {
            await ns.scp(scriptName, host, currentHost);
          }
          if (!ns.scriptRunning(scriptName, host)) {
            const freeRam =
              ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
            const reqRam = ns.getScriptRam(scriptName);

            if (freeRam >= reqRam) {
              ns.exec(scriptName, host, 1);
              ns.print(`[PROPAGATED] Launched worker thread on ${host}`);
            }
          }
        } catch (err) {
          ns.print(`Propagate Error: ${err?.message ?? err}`);
        }
      }
    }

    // 4. Free blocked RAM on current server
    if (currentHost !== "home") {
      try {
        await ns.dnet.memoryReallocation();
      } catch (err) {
        ns.print(`Mem Reallocate Error: ${err?.message ?? err}`);
      }
    }

    // 5. Open discovered .cache loot files
    const files = ns.ls(currentHost, ".cache");
    for (const file of files) {
      try {
        await ns.dnet.openCache(file);
        ns.print(`[DARKNET LOOT] Opened cache file: ${file} on ${currentHost}`);
      } catch (err) {
        ns.print(`Open Cache Error: ${err?.message ?? err}`);
      }
    }

    await ns.sleep(5000);
  }
}

/**
 * Roman numeral converter
 */
function romanToInt(roman) {
  if (!roman || typeof roman !== "string") return null;
  const clean = roman.toUpperCase().replace(/[^IVXLCDM]/g, "");
  if (!clean) return null;

  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < clean.length; i++) {
    const curr = map[clean[i]];
    const nxt = map[clean[i + 1]];
    if (nxt > curr) {
      total += nxt - curr;
      i++;
    } else {
      total += curr;
    }
  }
  return total > 0 ? String(total) : null;
}

/**
 * Bulls & Cows feedback evaluator
 */
function evaluateScore(guess, candidate) {
  let exact = 0;
  let misplaced = 0;
  const g = guess.split("");
  const c = candidate.split("");

  for (let i = 0; i < g.length; i++) {
    if (g[i] === c[i]) {
      exact++;
      g[i] = null;
      c[i] = null;
    }
  }
  for (let i = 0; i < g.length; i++) {
    if (g[i] !== null) {
      const idx = c.indexOf(g[i]);
      if (idx !== -1) {
        misplaced++;
        c[idx] = null;
      }
    }
  }
  return { exact, misplaced };
}

/**
 * Updated solvePassword function
 */
async function solvePassword(ns, host, details) {
  let cracked = false;

  async function testAuth(candidate) {
    if (!candidate || cracked) return false;
    const clean = String(candidate).trim();
    if (!clean) return false;

    try {
      const res = await ns.dnet.authenticate(host, clean);
      if (res?.success || res?.code === 200) {
        ns.print(`[DARKNET CRACKED] ${host} unlocked with: "${clean}"`);
        cracked = true;
        return true;
      }

      if (res?.message) {
        const leak = res.message.match(
          /(?:password|pin|key|code|passcode)\s+(?:is|uses|set to|=)\s+([^\s\.\,]+)/i,
        );
        if (leak && leak[1] !== clean) {
          const retry = await ns.dnet.authenticate(host, leak[1]);
          if (retry?.success || retry?.code === 200) {
            ns.print(
              `[DARKNET LEAK CRACK] ${host} unlocked with: "${leak[1]}"`,
            );
            cracked = true;
            return true;
          }
        }
      }
    } catch (e) {}
    await ns.sleep(30);
    return false;
  }

  // Model 1: Roman Numeral Solver (BellaCuore)
  if (
    details.modelId === "BellaCuore" ||
    details.passwordHint?.includes("number '")
  ) {
    const rawMatch =
      details.passwordHint?.match(/number\s+['"]([IVXLCDM]+)['"]/i) ||
      (details.data && String(details.data).match(/[IVXLCDM]+/i));

    if (rawMatch) {
      const arabic = romanToInt(rawMatch[1] || rawMatch[0]);
      if (arabic && (await testAuth(arabic))) return true;
    }
  }

  // Model 2: Bulls & Cows Solver (DeepGreen)
  if (details.modelId === "DeepGreen") {
    const len = details.passwordLength || 3;
    const maxVal = Math.pow(10, len);
    let candidates = [];
    for (let i = 0; i < maxVal; i++) {
      candidates.push(String(i).padStart(len, "0"));
    }

    while (candidates.length > 0) {
      const guess = candidates[0];
      const res = await ns.dnet.authenticate(host, guess);
      if (res?.success || res?.code === 200) {
        ns.print(`[DARKNET CRACKED] DeepGreen ${host} solved with: "${guess}"`);
        return true;
      }

      let exact = null;
      let misplaced = null;

      // Extract from res.data (e.g., "1,0")
      if (typeof res?.data === "string" && res.data.includes(",")) {
        const parts = res.data.split(",").map(Number);
        exact = parts[0];
        misplaced = parts[1];
      } else if (res?.message) {
        const match = res.message.match(
          /(\d+)\s+symbol.*match exactly.*and\s+(\d+)\s+symbol/i,
        );
        if (match) {
          exact = parseInt(match[1], 10);
          misplaced = parseInt(match[2], 10);
        }
      }

      if (exact === null || misplaced === null) {
        break; // Feedback format unrecognized, abort loop
      }

      // Eliminate candidates that do not yield the identical match profile
      candidates = candidates.filter((cand) => {
        const score = evaluateScore(guess, cand);
        return score.exact === exact && score.misplaced === misplaced;
      });

      await ns.sleep(35);
    }
    return false;
  }

  // Model 3: Direct passwordHint inspection
  if (details.passwordHint) {
    const hintMatch =
      details.passwordHint.match(
        /(?:password|pin|key|code|passcode)\s+(?:is|uses|set to|=)\s+([^\s\.\,]+)/i,
      ) || details.passwordHint.match(/(?:set to|is)\s+([^\s\.\,]+)/i);

    if (hintMatch && (await testAuth(hintMatch[1]))) return true;

    const hintNum = details.passwordHint.match(/\b\d{2,8}\b/);
    if (hintNum && (await testAuth(hintNum[0]))) return true;
  }

  // Model 4: ZeroLogon
  if (details.modelId === "ZeroLogon" || details.passwordLength === 0) {
    if (await testAuth("")) return true;
  }

  // Model 5: Initial Probe Request
  const probe = await ns.dnet.authenticate(host, "probe");
  if (probe?.success || probe?.code === 200) return true;

  if (probe?.message) {
    const memoMatch = probe.message.match(
      /(?:password|pin|key|code|passcode)\s+(?:is|uses|set to|=)\s+([^\s\.\,]+)/i,
    );
    if (memoMatch && (await testAuth(memoMatch[1]))) return true;
  }

  if (
    probe?.data !== undefined &&
    probe?.data !== null &&
    probe?.data !== false
  ) {
    const directData = String(probe.data).replace(/\D/g, "");
    if (directData.length > 0 && (await testAuth(directData))) return true;
  }

  // Model 6: Heartbleed Logs
  try {
    const bleed = await ns.dnet.heartbleed(host, { peek: true });
    const logs = bleed?.logs ?? "";
    if (logs) {
      const memoMatch = logs.match(
        /(?:key|pin|password|passcode)\s+(?:is|uses|set to|=)\s+([^\s\.\,\n\r]+)/i,
      );
      if (memoMatch && (await testAuth(memoMatch[1]))) return true;

      const groogleMatch = logs.match(/groogle:([a-zA-Z0-9]+)/i);
      if (groogleMatch && (await testAuth(groogleMatch[1]))) return true;

      const logNumbers = logs.match(/\b\d{2,8}\b/g);
      if (logNumbers) {
        for (const num of logNumbers) {
          if (await testAuth(num)) return true;
        }
      }
    }
  } catch (e) {}

  // Model 7: Factori-Os
  if (
    details.modelId?.includes("Factor i") ||
    details.modelId === "Factori-Os"
  ) {
    let candidates = Array.from({ length: 100 }, (_, i) => i + 1);
    const testDivisors = [2, 3, 4, 5, 7, 8, 9, 11, 13, 16];

    for (const div of testDivisors) {
      const res = await ns.dnet.authenticate(host, String(div));
      if (res?.success || res?.code === 200) return true;

      if (res?.data === true)
        candidates = candidates.filter((n) => n % div === 0);
      else if (res?.data === false)
        candidates = candidates.filter((n) => n % div !== 0);

      if (candidates.length <= 3) {
        for (const candidate of candidates) {
          if (await testAuth(String(candidate))) return true;
        }
        break;
      }
      await ns.sleep(30);
    }
  }

  // Model 8: Positional 5-digit PIN
  const pinLength = details.passwordLength || 5;
  if (pinLength === 5) {
    let knownDigits = ["0", "0", "0", "0", "0"];

    for (let digit = 0; digit <= 9; digit++) {
      const candidate = knownDigits
        .map((d, i) => (knownDigits[i] === "0" ? String(digit) : d))
        .join("");

      try {
        const res = await ns.dnet.authenticate(host, candidate);
        if (res?.success || res?.code === 200) {
          ns.print(`[DARKNET AUTH] Solved ${host} PIN: "${candidate}"`);
          return true;
        }

        if (Array.isArray(res?.data)) {
          res.data.forEach((status, idx) => {
            if (status === "yes") {
              knownDigits[idx] = String(digit);
            }
          });
        }
      } catch (e) {}

      await ns.sleep(35);
    }
  }

  // Model 9: Common Factory Defaults
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
    "max",
    "coco",
    "bella",
    "charlie",
    "luna",
  ];

  for (const pw of commonDefaults) {
    if (await testAuth(pw)) return true;
  }

  return false;
}
