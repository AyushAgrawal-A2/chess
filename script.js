import { DEFAULT_BOARD, UTF_CODES, TURN_NAME } from "./gameConstants.js";
import {
  select,
  deselect,
  move,
  checkKing,
  getCoordinates,
  canPlayerMove,
} from "./gameLogic.js";

const boardElement = document.querySelector(".board");
boardElement.addEventListener("click", handleBoardClick);

// turn is 0 for white, 1 for black
let board, turn, captured, selected;

// flip is false for rendering white at bottom
let flip = false;

resetGame();

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
  captured = [[], []];
  selected = null;
  displayBoard();
}

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
      if (cell.validAttack) captured[turn].push(cell.name);
    } else if (event.target.dataset.symbol) {
      deselect(board);
      selected = select(board, turn, cellXY);
    } else selected = deselect(board);
  }
  displayBoard();
}

function displayBoard() {
  const check = !checkKing(board, turn, { x: 0, y: 0 }, { x: 0, y: 0 });
  const moves = canPlayerMove(board, turn);
  if (check) {
    const kingXY = getCoordinates(
      board,
      (cell) => cell.name === TURN_NAME[turn] + "_KING"
    );
    board[kingXY.x][kingXY.y].validAttack = true;
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
      .forEach((row) => {
        const rowElement = createRowElement();
        row
          .slice()
          .reverse()
          .forEach((cell) =>
            rowElement.appendChild(createCellElement(cell, x, y))
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
