import { DEFAULT_BOARD, UTF_CODES, TURN_NAME } from "./gameConstants.js";
import {
  select,
  deselect,
  move,
  checkKing,
  canPlayerMove,
  getKing,
} from "./gameLogic.js";

const boardElement = document.querySelector(".board");
const gameStatusElement = document.querySelector(".game-status");
const resetButtonElement = document.querySelector(".reset");
const flipButtonElement = document.querySelector(".flip");
const flipCheckBoxElement = document.querySelector(".flip-every-move");
boardElement.addEventListener("click", handleBoardClick);
resetButtonElement.addEventListener("click", resetGame);
flipButtonElement.addEventListener("click", flipBoard);
flipCheckBoxElement.addEventListener("change", flipCheckBox);

// turn is 0 for white, 1 for black
let board, turn, captured, selected;

// flip is false for rendering white at bottom
let flip = true,
  flipEveryMove = false,
  check,
  canMove,
  gameStatus;

resetGame();

function handleBoardClick(event) {
  const cellXY = {
    x: parseInt(event.target.dataset.x),
    y: parseInt(event.target.dataset.y),
  };
  if (!selected) {
    if (!event.target.dataset.symbol) return;
    selected = select(board, turn, cellXY);
  } else {
    const cell = board[cellXY.x][cellXY.y];
    if (selected.x === cellXY.x && selected.y === cellXY.y) {
      selected = deselect(board);
    } else if (cell.validMove || cell.validAttack) {
      move(board, selected, cellXY);
      selected = deselect(board);
      turn ^= 1;
      if (flipEveryMove) flip = turn ? true : false;
      if (cell.validAttack) captured[turn].push(cell.name);
      displayGameStatus();
    } else if (event.target.dataset.symbol) {
      deselect(board);
      selected = select(board, turn, cellXY);
    } else selected = deselect(board);
  }
  displayBoard();
}

function resetGame() {
  board = DEFAULT_BOARD.map((row) =>
    row.map((cell) => ({
      name: cell,
      color: cell.split("_")[0] ?? null,
      type: cell.split("_")[1] ?? null,
      selected: false,
      validMove: false,
      validAttack: false,
    }))
  );
  turn = Math.floor(Math.random() * 2);
  flip = turn ? true : false;
  captured = [[], []];
  selected = null;
  displayGameStatus();
  displayBoard();
}

function flipBoard() {
  if (flipEveryMove) return;
  flip = !flip;
  displayBoard();
}

function flipCheckBox(event) {
  flipEveryMove = event.target.checked;
  if (flipEveryMove) flip = turn ? true : false;
  displayBoard();
}

function displayGameStatus() {
  canMove = canPlayerMove(board, turn);
  check = !checkKing(board, turn, { x: 0, y: 0 }, { x: 0, y: 0 });
  if (turn) gameStatus = "Black's Turn";
  else gameStatus = "White's Turn";
  if (check && canMove) gameStatus += " / Check";
  else if (check && !canMove)
    gameStatus = turn === 0 ? "Black Won..!!" : "White Won..!!";
  else if (!check && !canMove) gameStatus = "Draw..!!";
  gameStatusElement.textContent = gameStatus;
}

function displayBoard() {
  if (check) {
    const { x: kingX, y: kingY } = getKing(board, turn);
    board[kingX][kingY].validAttack = true;
  }
  boardElement.innerHTML = "";
  if (!flip) {
    board.forEach((row, x) => {
      const rowElement = createRowElement();
      row.forEach((cell, y) =>
        rowElement.appendChild(createCellElement(cell, x, y))
      );
      boardElement.appendChild(rowElement);
    });
  } else {
    board
      .slice()
      .reverse()
      .forEach((row, x) => {
        const rowElement = createRowElement();
        row
          .slice()
          .reverse()
          .forEach((cell, y) =>
            rowElement.appendChild(createCellElement(cell, 7 - x, 7 - y))
          );
        boardElement.appendChild(rowElement);
      });
  }
}

function createRowElement() {
  const rowElement = document.createElement("div");
  rowElement.className = "row";
  return rowElement;
}

function createCellElement(cell, x, y) {
  const cellElement = document.createElement("div");
  cellElement.className = "cell";
  cellElement.dataset.symbol = UTF_CODES[cell.name] ?? "";
  cellElement.dataset.x = x;
  cellElement.dataset.y = y;
  if (cell.selected) cellElement.classList.add("selected");
  if (cell.validMove) cellElement.classList.add("move");
  if (cell.validAttack) cellElement.classList.add("danger");
  return cellElement;
}
