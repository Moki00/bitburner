/** @param {NS} ns */
export async function main(ns) {
  const opponent = "The Black Hand"; // money
  // const opponent = "Illuminati"; // hack
  const boardSize = 5;

  ns.tprint(
    `[IPvGO] Deploying aggressive hunter engine against ${opponent}...`,
  );

  while (true) {
    try {
      ns.go.resetBoardState(opponent, boardSize);
    } catch (e) {}

    let turnRes = null;

    while (true) {
      const board = ns.go.getBoardState();
      const validMoves = ns.go.analysis.getValidMoves();
      const liberties = ns.go.analysis.getLiberties();

      const move = getAggressive5x5Move(board, validMoves, liberties);

      if (move) {
        turnRes = await ns.go.makeMove(move[0], move[1]);
      } else {
        turnRes = await ns.go.passTurn();
      }

      if (turnRes?.type === "gameOver") break;
      await ns.sleep(30);
    }

    ns.print(`[IPvGO] Match ended: ${turnRes?.type}`);
    await ns.sleep(400);
  }
}

/**
 * Aggressive 5x5 Move Selector
 */
function getAggressive5x5Move(board, validMoves, liberties) {
  const size = 5;
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // 1. Instant Capture: Kill any enemy stone in Atari
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (!validMoves[x][y]) continue;
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          if (board[nx][ny] === "O" && liberties[nx][ny] === 1) {
            return [x, y];
          }
        }
      }
    }
  }

  // 2. Rescue Friendly in Atari (only if save grants breathing room)
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (!validMoves[x][y]) continue;
      let savesFriend = false;
      let openSpots = 0;

      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          if (board[nx][ny] === "X" && liberties[nx][ny] === 1)
            savesFriend = true;
          if (board[nx][ny] === ".") openSpots++;
        }
      }

      if (savesFriend && openSpots >= 2) return [x, y];
    }
  }

  // 3. Hunt the Opponent: Target the opponent's first / most isolated stone
  let enemyStones = [];
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (board[x][y] === "O") {
        enemyStones.push({ x, y, lib: liberties[x][y] });
      }
    }
  }

  // Sort enemy stones by lowest liberties first
  enemyStones.sort((a, b) => a.lib - b.lib);

  // Directly attach and suffocate adjacent liberties of their stone
  for (const enemy of enemyStones) {
    for (const [dx, dy] of dirs) {
      const nx = enemy.x + dx;
      const ny = enemy.y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        if (
          validMoves[nx][ny] &&
          !isFatalSelfAtari(board, nx, ny, dirs, size, liberties)
        ) {
          return [nx, ny];
        }
      }
    }
  }

  // 4. Diagonal Pressure (Hane / Cut pressure on enemy corners)
  const diagDirs = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  for (const enemy of enemyStones) {
    for (const [dx, dy] of diagDirs) {
      const nx = enemy.x + dx;
      const ny = enemy.y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        if (
          validMoves[nx][ny] &&
          !isFatalSelfAtari(board, nx, ny, dirs, size, liberties)
        ) {
          return [nx, ny];
        }
      }
    }
  }

  // 5. First-move opening: If no enemy stone exists yet, take Tengen (2, 2)
  if (enemyStones.length === 0 && validMoves[2][2]) {
    return [2, 2];
  }

  // 6. Connect friendly chains aggressively
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (
        !validMoves[x][y] ||
        isFatalSelfAtari(board, x, y, dirs, size, liberties)
      )
        continue;
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (
          nx >= 0 &&
          nx < size &&
          ny >= 0 &&
          ny < size &&
          board[nx][ny] === "X"
        ) {
          return [x, y];
        }
      }
    }
  }

  // 7. Fallback: Any non-fatal valid move
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (
        validMoves[x][y] &&
        !isFatalSelfAtari(board, x, y, dirs, size, liberties)
      ) {
        return [x, y];
      }
    }
  }

  return null;
}

/**
 * Checks if a move results in an immediate suicide/counter-atari,
 * unless it merges with an already healthy friendly chain.
 */
function isFatalSelfAtari(board, x, y, dirs, size, liberties) {
  let openAir = 0;
  let connectsToSafeChain = false;

  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
      if (board[nx][ny] === ".") openAir++;
      if (board[nx][ny] === "X" && liberties[nx][ny] >= 2) {
        connectsToSafeChain = true;
      }
    }
  }

  if (connectsToSafeChain) return false;
  return openAir <= 1;
}
