import {
  DEFAULT_BOARD,
  UTF_CODES,
  TURN_NAME,
  PAWN_PROMOTION,
} from "./gameConstants.js";

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

const boardElement = document.querySelector(".board");
const capturedElements = document.querySelectorAll(".captured");
const modalElement = document.querySelector(".modal");
const gameStatusElement = document.querySelector(".game-status");
const gameControls = document.querySelector(".game-controls");

boardElement.addEventListener("click", handleBoardClick);
modalElement.addEventListener("click", handleModalClick);
gameControls.addEventListener("click", handleControlsClick);
window.addEventListener("resize", handleWindowResize);

// turn is 0 for white, 1 for black
// flip is false for rendering white at bottom
let board,
  turn,
  captured,
  selected,
  history,
  flip,
  flipEveryMove = false,
  check,
  canMove,
  gameStatus,
  waitForPromotion;

resetGame();

function handleBoardClick(event) {
  // if pawn has to be promoted, ignore board clicks
  if (waitForPromotion) return;

  if (!event.target.dataset.x) return;

  // get x, y coordinate of the clicked cell
  const cellXY = {
    x: parseInt(event.target.dataset.x),
    y: parseInt(event.target.dataset.y),
  };

  // if no piece is selected, select this piece and highlight valid moves / attacks
  if (!selected) selected = select(board, turn, cellXY, history);
  // if already a piece is selected, either make a move to this cell or deselect the previous piece.
  else {
    const cell = board[cellXY.x][cellXY.y];

    // if same piece is clicked, deselect the piece
    if (selected.x === cellXY.x && selected.y === cellXY.y) {
      selected = deselect(board);
    }

    // if a valid move / attack is selected make the move
    else if (cell.validMove || cell.validAttack) {
      if (cell.validAttack) {
        captured[turn].push(
          cell.name !== "" ? cell.name : TURN_NAME[turn ^ 1] + "_PAWN"
        );
      }

      // if move is complete change turn, else pawn needs to be promoted
      if (move(board, selected, cellXY, history)) {
        turn ^= 1;
        displayGameStatus();
      }
      // change pawn promotion flag and display modal
      else {
        waitForPromotion = true;
        selected = select(board, turn, cellXY, history);
      }
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
  waitForPromotion = false;
  turn ^= 1;
  promotePawn(board, name);
  displayGameStatus();
  displayBoard();
}

function handleControlsClick(event) {
  if (event.target.classList.contains("flip")) flipBoard();
  else if (event.target.classList.contains("flip-every-move"))
    flipCheckBox(event);
  else if (event.target.classList.contains("undo")) undo();
  else if (event.target.classList.contains("reset")) resetGame();
}

function handleWindowResize() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
  displayModal();
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

  // white will move first
  turn = 0;

  // orient the board as per the turn
  flip = false;
  waitForPromotion = false;

  // empty captured and selected variables
  captured = [[], []];
  selected = null;
  history = [];

  handleWindowResize();
  // display the new board and game status
  displayGameStatus();
  displayBoard();
}

function flipBoard() {
  flip = !flip;
  displayBoard();
}

function flipCheckBox(event) {
  flipEveryMove = event.target.checked;
  // orient the board as per turn
  if (flipEveryMove) flip = turn ? true : false;
  displayBoard();
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
  // check if there are any possible moves
  canMove = canPlayerMove(board, turn, history);

  // check if the king is in check status
  check = !checkKing(board, turn, { x: 0, y: 0 }, { x: 0, y: 0 });

  selected = deselect(board);
  if (flipEveryMove) flip = turn ? true : false;

  if (turn) gameStatus = "Black's Turn";
  else gameStatus = "White's Turn";

  // if king is in check, add in status
  if (check && canMove) gameStatus += " - Check";
  // if king is in check and there are no moves left, other player won
  else if (check && !canMove)
    gameStatus = turn === 0 ? "Black Won..!!" : "White Won..!!";
  // if king is not in check and no moves left, stale mate / draw
  else if (!check && !canMove) gameStatus = "Draw..!!";

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
  cellElement.dataset.symbol = UTF_CODES[cell.name] ?? "";
  cellElement.dataset.x = x;
  cellElement.dataset.y = y;
  if (cell.selected || cell.validMove) cellElement.classList.add("highlight");
  if (cell.validAttack || cell.check) cellElement.classList.add("danger");
  return cellElement;
}

function createSmallCellElement(item) {
  const smallCellElement = document.createElement("div");
  smallCellElement.className = "cell small";
  smallCellElement.dataset.symbol = UTF_CODES[item] ?? "";
  return smallCellElement;
}

function createPromotionElement(option) {
  const promotionElement = document.createElement("div");
  const name = TURN_NAME[turn] + "_" + option;
  promotionElement.className = "cell";
  promotionElement.dataset.symbol = UTF_CODES[name];
  promotionElement.dataset.name = name;
  return promotionElement;
}
