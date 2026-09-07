# Bitburner Automation Framework

Modular Netscript (NS2) automation suite designed for rapid node progression, hands-free RAM scaling, and BitNode completion. File naming is optimized with unique prefixes for fast terminal tab-completion.

---

## Quick Reference

| Command                    | Purpose                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `run startup.js`           | Boots background daemons (`network-auto.js`, `cloud-servers.js`, `workers.js`, `ipvgo.js`).         |
| `run target-finder.js`     | Analyzes network servers and writes the best target to `target.txt`.                                |
| `run any-backdoor.js`      | Discovers all rooted, unbackdoored servers and prints direct connection chains.                     |
| `run backdoor-auto.js`     | Scans for critical story and faction servers to backdoor.                                           |
| `run factions-need-ram.js` | Kills worker threads and redirects network RAM to `share-ram-with-factions.js`.                     |
| `run end-world.js`         | Launches a multi-million-thread weaken barrage on low-security nodes for Hacking 2,500.             |
| `run augment-time.js`      | Liquidates assets, resets `target.txt`, and terminates the fleet prior to installing augmentations. |
| `run kill-network.js`      | Emergency shutdown for all user scripts across every rooted machine.                                |

---

## Core Architecture

### 1. Orchestration & Fleet Management

- **`startup.js`**: Central bootloader initializing core background routines.
- **`network-auto.js`**: Automatically breaches open ports, applies NUKE root access, and alerts on newly affordable darkweb software.
- **`cloud-servers.js`**: Automatically purchases and iteratively upgrades a 25-server fleet up to 64 TB each, while protecting critical reserve cash buffers.
- **`kill-network.js`**: Traverses the network graph and issues termination signals to clean up RAM.

### 2. Income & Infiltration

- **`workers.js`**: Three-phase adaptive orchestrator that splits thread allocations between `hack.js`, `grow.js`, and `weaken.js` based on target health.
- **`target-finder.js`**: Evaluates maximum money against minimum security, writing the highest-scoring target to `target.txt`.
- **`ipvgo.js`**: Autonomous engine running 5x5 board capture against NPC factions for passive income and reputation.
- **`dnet-worm.js`**: Scans, maps, and targets dark net infrastructure.

### 3. Faction & Backdoor Utilities

- **`any-backdoor.js`**: Graph crawler displaying direct `connect; backdoor;` terminal strings for any eligible target without backdoors installed.
- **`backdoor-auto.js`**: Targeted backdoor route finder focusing on high-priority faction servers.
- **`factions-need-ram.js`**: Faction rep booster. Kills active `workers.js` threads and deploys `share-ram-with-factions.js` across the entire fleet.
- **`share-ram-with-factions.js`**: Dedicated 4.0 GB worker running continuous `ns.share()` loops.

### 4. Endgame & Reset Routines

- **`end-world.js`**: High-velocity XP farm utilizing `Formulas.exe` to isolate rapid-cycle servers and grind player hacking levels to 2,500+.
- **`augment-time.js`**: Pre-reset checklist script that sells active stock positions, resets `target.txt` to `n00dles`, and flushes running processes.

### 5. Worker Payloads (Foreign Execution)

- **`hack.js`**: Base `ns.hack()` payload.
- **`grow.js`**: Base `ns.grow()` payload.
- **`weaken.js`**: Base `ns.weaken()` payload.

---

## State Files

- **`target.txt`**: Local plaintext file holding the hostname of the active primary target.
