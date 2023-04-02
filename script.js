import { handleBoardClick, resetGame, board } from "./gameLogic.js";

const boardElement = document.querySelector(".board");
boardElement.addEventListener("click", handleBoardClick);
let flip = false;

resetGame();

export function display() {
  boardElement.innerHTML = "";
  if (!flip) {
    board.forEach((row) => {
      const rowElement = document.createElement("div");
      rowElement.className = "row";
      row.forEach((cell) => rowElement.appendChild(cell.element));
      boardElement.appendChild(rowElement);
    });
  } else {
    board
      .slice()
      .reverse()
      .forEach((row) => {
        const rowElement = document.createElement("div");
        rowElement.className = "row";
        row
          .slice()
          .reverse()
          .forEach((cell) => rowElement.appendChild(cell.element));
        boardElement.appendChild(rowElement);
      });
  }
}
