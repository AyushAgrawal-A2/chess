import { MOVE_RULES, TURN_NAME } from "./gameConstants.js";

export function select(board, turn, cellXY) {
  const cell = getElement(board, cellXY);
  if (!cell.name || cell.color !== TURN_NAME[turn]) return null;
  const { validMoves, validAttacks } = calculateMoves(board, turn, cellXY);
  cell.selected = true;
  validMoves.forEach(({ x, y }) => (board[x][y].validMove = true));
  validAttacks.forEach(({ x, y }) => (board[x][y].validAttack = true));
  return cellXY;
}

export function deselect(board) {
  board.forEach((row) =>
    row.forEach((cell) => {
      cell.selected = false;
      cell.validMove = false;
      cell.validAttack = false;
    })
  );
  return null;
}

export function move(board, source, target) {
  const sourceElement = getElement(board, source);
  board[target.x][target.y] = { ...sourceElement };
  sourceElement.name = "";
  sourceElement.color = "";
  sourceElement.type = "";
}

export function calculateMoves(board, turn, cellXY) {
  const validMoves = [],
    validAttacks = [];
  const cell = getElement(board, cellXY);
  if (!cell.name || cell.color !== TURN_NAME[turn])
    return { validMoves, validAttacks };
  const { color, type } = cell;
  const direction = color === MOVE_RULES[type].invert ? -1 : 1;
  const maxMoves = MOVE_RULES[type].unlimited
    ? 8
    : type === "PAWN" &&
      ((color === "WHITE" && cellXY.x === 6) ||
        (color === "BLACK" && cellXY.x === 1))
    ? 2
    : 1;
  for (let del of MOVE_RULES[type].delta) {
    for (let x = 0, nextX = cellXY.x, nextY = cellXY.y; x < maxMoves; x++) {
      nextX += direction * del[0];
      nextY += direction * del[1];
      if (invalidCell(nextX, nextY)) break;
      const nextColor = board[nextX][nextY].color;
      if (nextColor === color) break;
      if (!checkKing(board, turn, cellXY, { x: nextX, y: nextY })) continue;
      if (!nextColor) {
        validMoves.push({ x: nextX, y: nextY });
      } else if (color !== nextColor) {
        validAttacks.push({ x: nextX, y: nextY });
        break;
      }
    }
  }
  if (type === "PAWN") {
    validAttacks.length = 0;
    for (let del of MOVE_RULES[type].attack) {
      const nextX = cellXY.x + direction * del[0];
      const nextY = cellXY.y + direction * del[1];
      if (invalidCell(nextX, nextY)) continue;
      const nextColor = board[nextX][nextY].color;
      if (nextColor && color !== nextColor) {
        validAttacks.push({ x: nextX, y: nextY });
      }
    }
  }
  return { validMoves, validAttacks };
}

export function checkKing(board, turn, source, target) {
  //create a duplicate board
  const tempBoard = board.map((row) => row.map((cell) => ({ ...cell })));

  //make the move in duplicate board
  move(tempBoard, source, target);

  //find current player's king
  const kingXY = getKing(board, turn);

  //search if any piece can attack king
  for (let key in MOVE_RULES) {
    const color = TURN_NAME[turn];
    const type = key;
    const delta =
      type === "PAWN" ? MOVE_RULES[type].attack : MOVE_RULES[type].delta;
    const direction = color === MOVE_RULES[type].invert ? -1 : 1;
    const maxMoves = MOVE_RULES[type].unlimited ? 8 : 1;
    for (let del of delta) {
      for (let x = 0, nextX = kingXY.x, nextY = kingXY.y; x < maxMoves; x++) {
        nextX += direction * del[0];
        nextY += direction * del[1];
        if (invalidCell(nextX, nextY)) break;
        const { color: nextColor, type: nextType } = tempBoard[nextX][nextY];
        if (!nextColor) continue;
        if (nextColor !== color && nextType === type) return false;
        break;
      }
    }
  }
  return true;
}

export function canPlayerMove(board, turn) {
  //for each check if there is a possible move
  return board.some((row, x) =>
    row.some((_, y) => {
      const { validMoves, validAttacks } = calculateMoves(board, turn, {
        x,
        y,
      });
      return validMoves.length + validAttacks.length > 0;
    })
  );
}

export function getKing(board, turn) {
  let x, y;
  board.find((row, r) =>
    row.find((cell, c) => {
      if (cell.name === TURN_NAME[turn] + "_KING") {
        x = r;
        y = c;
        return true;
      }
      return false;
    })
  );
  return { x, y };
}

function getElement(board, { x, y }) {
  return board[x][y];
}

function invalidCell(x, y) {
  return x < 0 || y < 0 || x > 7 || y > 7;
}
