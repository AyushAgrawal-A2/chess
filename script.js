const boardElement = document.querySelector(".board");
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
document.addEventListener("click", handleClick);

let board = [];

reset();
flip();

function handleClick(event) {}

function reset() {
  turnWhite = true;
  board = DEFAULT_BOARD.map((row) => row.map((cell) => cell));
  display();
}

function display() {
  boardElement.innerHTML = "";
  board.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "row";
    row.forEach((cell) => {
      const cellElement = document.createElement("div");
      cellElement.className = "cell";
      cellElement.dataset.symbol = UTF_CODES[cell] ?? "";
      rowElement.appendChild(cellElement);
    });
    boardElement.appendChild(rowElement);
  });
}

function flip() {
  board.forEach((row) => row.reverse());
  board.reverse();
  display();
}
