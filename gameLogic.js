import {
  DEFAULT_BOARD,
  UTF_CODES,
  MOVE_RULES,
  TURN_NAME,
} from "./gameConstants.js";

import { display } from "./script.js";

export let board;
let turn, selected, validMoves, canAttack, captured, check;
// turn is 0 for white, 1 for black

export function handleBoardClick(event) {
  if (!selected) {
    if (event.target.dataset.symbol === "") return;
    select(event.target);
    return;
  }
  let target;
  board.find((row) =>
    row.find((cell) => {
      if (cell.element === event.target) {
        target = cell;
        return true;
      }
      return false;
    })
  );
  if (
    validMoves.some((move) => move === target) ||
    canAttack.some((move) => move === target)
  ) {
    move(selected, target);
    turn ^= 1;
  }
  deselect();
}

function move(source, target) {
  if (target.element.dataset.name) {
    captured[turn].push(target.element.dataset.name);
  }
  target.element.dataset.symbol = source.element.dataset.symbol;
  target.element.dataset.name = source.element.dataset.name;
  source.element.dataset.symbol = "";
  source.element.dataset.name = "";
}

function checkKing(source, target) {
  let tempBoard, king;
  tempBoard = board.map((row) =>
    row.map((cell) => ({
      ...cell,
      element: cell.element.cloneNode(true),
    }))
  );
  const tempSource = tempBoard[source.x][source.y];
  const tempTarget = tempBoard[target.x][target.y];
  tempTarget.element.dataset.symbol = tempSource.element.dataset.symbol;
  tempTarget.element.dataset.name = tempSource.element.dataset.name;
  tempSource.element.dataset.symbol = "";
  tempSource.element.dataset.name = "";
  tempBoard.find((row) =>
    row.find((cell) => {
      if (cell.element.dataset.name === TURN_NAME[turn] + "_KING") {
        king = cell;
        return true;
      }
      return false;
    })
  );
  for (let key in MOVE_RULES) {
    const color = TURN_NAME[turn];
    const type = key;
    const delta =
      type === "PAWN" ? MOVE_RULES[type].attack : MOVE_RULES[type].delta;
    const direction = color === MOVE_RULES[type].invert ? -1 : 1;
    const maxMoves = MOVE_RULES[type].unlimited ? 8 : 1;
    for (let del of delta) {
      let nextX, nextY;
      if (key === "KING") {
        nextX = tempTarget.x;
        nextY = tempTarget.y;
      } else {
        nextX = king.x;
        nextY = king.y;
      }
      for (let x = 0; x < maxMoves; x++) {
        nextX += direction * del[0];
        nextY += direction * del[1];
        if (!checkValidCell(nextX, nextY)) break;
        const next = tempBoard[nextX][nextY];
        const [nextColor, nextType] = getColorType(next.element);
        if (!nextColor) continue;
        if (color !== nextColor && nextType === type) {
          console.log(false);
        }
        break;
      }
    }
  }
  return true;
}

function select(element) {
  if (getColorType(element)[0] !== TURN_NAME[turn]) return;
  board.find((row) =>
    row.find((cell) => {
      if (cell.element === element) {
        selected = cell;
        return true;
      }
      return false;
    })
  );
  calculateMoves();
  element.classList.add("selected");
  validMoves.forEach((cell) => cell.element.classList.add("move"));
  canAttack.forEach((cell) => cell.element.classList.add("danger"));
}

function calculateMoves() {
  const [color, type] = getColorType(selected.element);
  const delta = MOVE_RULES[type].delta;
  const direction = color === MOVE_RULES[type].invert ? -1 : 1;
  const maxMoves = MOVE_RULES[type].unlimited
    ? 8
    : type === "PAWN" &&
      ((color === "WHITE" && selected.x === 6) ||
        (color === "BLACK" && selected.x === 1))
    ? 2
    : 1;
  for (let del of delta) {
    let nextX = selected.x;
    let nextY = selected.y;
    for (let x = 0; x < maxMoves; x++) {
      nextX += direction * del[0];
      nextY += direction * del[1];
      if (!checkValidCell(nextX, nextY)) break;
      const next = board[nextX][nextY];
      const nextColor = getColorType(next.element)[0];
      if (nextColor === color) break;
      if (!checkKing(selected, next)) continue;
      if (!nextColor) {
        validMoves.push(next);
      } else if (color !== nextColor) {
        canAttack.push(next);
        break;
      }
    }
  }
  if (type === "PAWN") {
    canAttack = [];
    for (let del of MOVE_RULES[type].attack) {
      const nextX = selected.x + direction * del[0];
      const nextY = selected.y + direction * del[1];
      if (!checkValidCell(nextX, nextY)) continue;
      const next = board[nextX][nextY];
      const nextColor = getColorType(next.element)[0];
      if (nextColor && color !== nextColor) {
        canAttack.push(next);
      }
    }
  }
}

function checkValidCell(x, y) {
  return x >= 0 && y >= 0 && x < 8 && y < 8;
}

function getColorType(element) {
  return element.dataset.name.split("_");
}

function deselect() {
  selected.element.classList.remove("selected");
  validMoves.forEach((cell) => cell.element.classList.remove("move"));
  canAttack.forEach((cell) => cell.element.classList.remove("danger"));
  selected = null;
  validMoves = [];
  canAttack = [];
}

export function resetGame() {
  check = false;
  turn = Math.floor(Math.random() * 2);
  selected = null;
  validMoves = [];
  canAttack = [];
  captured = [[], []];
  board = DEFAULT_BOARD.map((row, x) =>
    row.map((cell, y) => {
      const element = document.createElement("div");
      element.className = "cell";
      element.dataset.name = cell;
      element.dataset.symbol = UTF_CODES[cell] ?? "";
      return { element, x, y };
    })
  );
  display();
}
