import { DEFAULT_BOARD, TURN_NAME, PAWN_PROMOTION } from "./gameConstants.js";

import {
  select,
  deselect,
  move,
  checkKing,
  canPlayerMove,
  getKing,
  undoMove,
  promotePawn,
} from "./gameLogic.js";
import { PIECE, getMove, parseLocation } from "./botLogic.js";

const boardElement = document.querySelector(".board");
const capturedElements = document.querySelectorAll(".captured");
const modalElement = document.querySelector(".modal");
const gameStatusElement = document.querySelector(".game-status");
const gameControls = document.querySelector(".game-controls");
const audioElements = document.querySelectorAll("audio");

boardElement.addEventListener("click", handleBoardClick);
modalElement.addEventListener("click", handleModalClick);
gameControls.addEventListener("click", handleControlsClick);
window.addEventListener("resize", handleWindowResize);

// turn is 0 for white, 1 for black
// flip is false for rendering white at bottom
let board,
  turn,
  bot,
  captured,
  selected,
  history,
  flip,
  check,
  canMove,
  gameStatus,
  waitForPromotion,
  start,
  timeoutID;

resetGame();

function handleWindowResize() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
  displayBoard();
}

function startGame() {
  start = true;
  displayGameStatus();
  displayBoard();
}

function handleControlsClick(event) {
  if (event.target.classList.contains("undo")) undo();
  else if (event.target.classList.contains("reset")) resetGame();
}

// user interactions
function handleBoardClick(event) {
  if (!start) startGame();
  if (turn === bot) return;
  // if pawn has to be promoted, ignore board clicks
  if (waitForPromotion) return;

  if (!event.target.dataset.x) return;

  // get x, y coordinate of the clicked cell
  const cellXY = {
    x: parseInt(event.target.dataset.x),
    y: parseInt(event.target.dataset.y),
  };
  const cell = board[cellXY.x][cellXY.y];

  // if no piece is selected, select this piece and highlight valid moves / attacks
  if (!selected) selected = select(board, turn, cellXY, history);
  // if already a piece is selected, either make a move to this cell or deselect the previous piece.
  else {
    // if same piece is clicked, deselect the piece
    if (selected.x === cellXY.x && selected.y === cellXY.y) {
      selected = deselect(board);
    }

    // if a valid move / attack is selected make the move
    else if (cell.validMove || cell.validAttack) {
      executeMove(cellXY);
    }

    // if any other piece is clicked, select this piece
    else selected = select(board, turn, cellXY, history);
  }
  // render the changed board to display
  displayBoard();
}

function handleModalClick(event) {
  if (!waitForPromotion) return;
  const name = event.target.dataset.name;
  if (!name) return;
  promote(name);
}

// bot simulated interactions
function botMove() {
  if (turn !== bot) return;
  const nextMove = getMove(board, turn, history);
  const source = parseLocation(nextMove.from);
  selected = select(board, turn, source, history);
  const target = parseLocation(nextMove.to);
  executeMove(target);
  if (nextMove.promotion) {
    const name = TURN_NAME[turn] + "_" + PIECE[nextMove.promotion];
    promote(name);
  }
  displayBoard();
}

// piece movement
function executeMove(target) {
  const targetElement = board[target.x][target.y];
  if (targetElement.validAttack) {
    captured[turn].push(
      targetElement.name !== ""
        ? targetElement.name
        : TURN_NAME[turn ^ 1] + "_PAWN"
    );
    audioElements[1].play();
  }

  // if move is complete change turn, else pawn needs to be promoted
  if (move(board, selected, target, history)) {
    changeTurn();
    displayGameStatus();
    if (!targetElement.validAttack) audioElements[0].play();
  }
  // change pawn promotion flag and display modal
  else {
    waitForPromotion = true;
    selected = select(board, turn, target, history);
  }
}

// pawn promotion
function promote(name) {
  waitForPromotion = false;
  promotePawn(board, selected, name);
  changeTurn();
  audioElements[0].play();
  displayGameStatus();
  displayBoard();
}

function resetGame() {
  // make a new board from DEFAULT_BOARD
  board = DEFAULT_BOARD.map((row) =>
    row.map((cell) => ({
      name: cell,
      color: cell.split("_")[0] ?? null,
      type: cell.split("_")[1] ?? null,
      moved: false,
      selected: false,
      validMove: false,
      validAttack: false,
    }))
  );

  turn = 0; // white will move first
  bot = Math.floor(Math.random() * 2);
  flip = bot == 0; // orient the board as per the turn
  waitForPromotion = false;
  captured = [[], []]; // empty captured and selected variables
  selected = null;
  history = [];
  start = false;
  gameStatus = "Click to start...";

  handleWindowResize();
  // display the new board and game status
  displayGameStatus();
  displayBoard();
}

function changeTurn() {
  turn ^= 1;
  selected = deselect(board);
}

function undo() {
  if (history.length === 0) return;
  const prevMove = history.pop();
  turn = prevMove.sourceElement.color === "WHITE" ? 0 : 1;
  waitForPromotion = false;
  if (prevMove.attack) captured[turn].pop();
  undoMove(board, prevMove);
  displayGameStatus();
  displayBoard();
}

function displayGameStatus() {
  if (start) {
    // check if there are any possible moves
    canMove = canPlayerMove(board, turn, history);

    // check if the king is in check status
    check = !checkKing(board, turn, { x: 0, y: 0 }, { x: 0, y: 0 });

    selected = deselect(board);

    if (turn) gameStatus = "Black's Turn";
    else gameStatus = "White's Turn";

    // if king is in check, add in status
    if (check && canMove) gameStatus += " - Check";
    // if king is in check and there are no moves left, other player won
    else if (check && !canMove) {
      gameStatus = turn === 0 ? "Black Won..!!" : "White Won..!!";
      audioElements[2].play();
    }
    // if king is not in check and no moves left, stale mate / draw
    else if (!check && !canMove) {
      gameStatus = "Draw..!!";
      audioElements[2].play();
    }
  }
  gameStatusElement.textContent = gameStatus;
}

function displayBoard() {
  // if king is in check, add danger attribute to display
  if (check) {
    const { x: kingX, y: kingY } = getKing(board, turn);
    board[kingX][kingY].check = true;
  }

  // clear display
  boardElement.innerHTML = "";
  capturedElements.forEach(
    (capturedElement) => (capturedElement.innerHTML = "")
  );

  // render new display, as per the flip orientation
  board.forEach((row, x) => {
    const rowElement = createRowElement();
    row.forEach((cell, y) => {
      if (flip) {
        rowElement.prepend(createCellElement(cell, x, y));
      } else {
        rowElement.append(createCellElement(cell, x, y));
      }
    });
    if (flip) {
      boardElement.prepend(rowElement);
    } else {
      boardElement.append(rowElement);
    }
  });

  // render captured pieces, as per the flip orientation
  captured.forEach((group, i) =>
    group.forEach((item) => {
      const smallCellElement = createSmallCellElement(item);
      if (flip) capturedElements[i].appendChild(smallCellElement);
      else capturedElements[i ^ 1].appendChild(smallCellElement);
    })
  );
  displayModal();
  if (start) {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => botMove(), 1000);
  }
}

function displayModal() {
  removeModal();
  if (!waitForPromotion) return;
  PAWN_PROMOTION.forEach((option) =>
    modalElement.append(createPromotionElement(option))
  );
  const { top, bottom, left, right } = boardElement.getBoundingClientRect();
  const x = (top + bottom) / 2;
  const y = (left + right) / 2;
  modalElement.style.top = `${x}px`;
  modalElement.style.left = `${y}px`;
}

function removeModal() {
  modalElement.innerHTML = "";
}

function createRowElement() {
  const rowElement = document.createElement("div");
  rowElement.className = "row";
  return rowElement;
}

function createCellElement(cell, x, y) {
  const cellElement = document.createElement("div");
  cellElement.className = "cell";
  if (cell.name) {
    const path = `assets/image/pieces/${cell.name}.png`;
    cellElement.style.backgroundImage = `url(${path})`;
  }
  cellElement.dataset.x = x;
  cellElement.dataset.y = y;
  if (cell.selected || cell.validMove) cellElement.classList.add("highlight");
  if (cell.validAttack || cell.check) cellElement.classList.add("danger");
  return cellElement;
}

function createSmallCellElement(name) {
  const smallCellElement = document.createElement("div");
  smallCellElement.className = "cell small";
  const path = `assets/image/pieces/${name}.png`;
  smallCellElement.style.backgroundImage = `url(${path})`;
  return smallCellElement;
}

function createPromotionElement(option) {
  const promotionElement = document.createElement("div");
  const name = TURN_NAME[turn] + "_" + option;
  promotionElement.className = "cell";
  const path = `assets/image/pieces/${name}.png`;
  promotionElement.style.backgroundImage = `url(${path})`;
  promotionElement.dataset.name = name;
  return promotionElement;
}
