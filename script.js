const UTF_CODES = {
  WHITE_KING: "\u2654",
  WHITE_QUEEN: "\u2655",
  WHITE_ROOK: "\u2656",
  WHITE_BISHOP: "\u2657",
  WHITE_KNIGHT: "\u2658",
  WHITE_PAWN: "\u2659",
  BLACK_KING: "\u265A",
  BLACK_QUEEN: "\u265B",
  BLACK_ROOK: "\u265C",
  BLACK_BISHOP: "\u265D",
  BLACK_KNIGHT: "\u265E",
  BLACK_PAWN: "\u265F",
};
const DEFAULT_BOARD = [
  [
    "BLACK_ROOK",
    "BLACK_KNIGHT",
    "BLACK_BISHOP",
    "BLACK_QUEEN",
    "BLACK_KING",
    "BLACK_BISHOP",
    "BLACK_KNIGHT",
    "BLACK_ROOK",
  ],
  [
    "BLACK_PAWN",
    "BLACK_PAWN",
    "BLACK_PAWN",
    "BLACK_PAWN",
    "BLACK_PAWN",
    "BLACK_PAWN",
    "BLACK_PAWN",
    "BLACK_PAWN",
  ],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  [
    "WHITE_PAWN",
    "WHITE_PAWN",
    "WHITE_PAWN",
    "WHITE_PAWN",
    "WHITE_PAWN",
    "WHITE_PAWN",
    "WHITE_PAWN",
    "WHITE_PAWN",
  ],
  [
    "WHITE_ROOK",
    "WHITE_KNIGHT",
    "WHITE_BISHOP",
    "WHITE_QUEEN",
    "WHITE_KING",
    "WHITE_BISHOP",
    "WHITE_KNIGHT",
    "WHITE_ROOK",
  ],
];
const TURN_NAME = ["WHITE", "BLACK"];

const boardElement = document.querySelector(".board");
document.addEventListener("click", handleClick);

let board = [];
let turn = 1; // turn is 0 for white, 1 for black
let selected = null;
let validMoves = [];
let canAttach = [];

reset();
// flip();

function handleClick(event) {
  if (!selected) {
    if (event.target.dataset.symbol === "") return;
    select(event.target);
    return;
  }
  if (selected == event.target) {
    deselect();
    return;
  }
}

function select(element) {
  if (element.dataset.name.split("_")[0] !== TURN_NAME[turn]) return;
  selected = element;
  calculate(selected);
  element.classList.add("selected");
  validMoves.forEach((cell) => cell.classList.add("move"));
  canAttach.forEach((cell) => cell.classList.add("danger"));
}

function calculateMoves(element) {}

function deselect() {
  selected.classList.remove("selected");
  validMoves.forEach((cell) => cell.classList.remove("move"));
  canAttach.forEach((cell) => cell.classList.remove("danger"));
  selected = null;
  validMoves = [];
  canAttach = [];
}

function reset() {
  board = DEFAULT_BOARD.map((row) =>
    row.map((cell) => {
      const cellElement = document.createElement("div");
      cellElement.className = "cell";
      cellElement.dataset.name = cell;
      cellElement.dataset.symbol = UTF_CODES[cell] ?? "";
      return cellElement;
    })
  );
  display();
}

function display() {
  boardElement.innerHTML = "";
  board.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "row";
    row.forEach((cell) => rowElement.appendChild(cell));
    boardElement.appendChild(rowElement);
  });
}

function flip() {
  board.forEach((row) => row.reverse());
  board.reverse();
  display();
}
