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
const modalElement = document.querySelector(".modal");
const gameStatusElement = document.querySelector(".game-status");
const resetButtonElement = document.querySelector(".reset");
const flipButtonElement = document.querySelector(".flip");
const flipCheckBoxElement = document.querySelector(".flip-every-move");
const undoButtonElement = document.querySelector(".undo");
const capturedElements = document.querySelectorAll(".captured");

boardElement.addEventListener("click", handleBoardClick);
modalElement.addEventListener("click", handleModalClick);
resetButtonElement.addEventListener("click", resetGame);
flipButtonElement.addEventListener("click", flipBoard);
flipCheckBoxElement.addEventListener("change", flipCheckBox);
undoButtonElement.addEventListener("click", undo);

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
  if (!selected) {
    if (!event.target.dataset.symbol) return;
    selected = select(board, turn, cellXY, history);
  }
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
      if (move(board, selected, cellXY, history)) turn ^= 1;
      else {
        // change pawn promotion flag and display modal
        waitForPromotion = true;
        displayModal();
      }
      selected = deselect(board);
      displayGameStatus();
    }
    // if any other piece is clicked, select this piece
    else if (event.target.dataset.symbol) {
      selected = select(board, turn, cellXY, history);
    }
    // empty cell is clicked which is not a valid move, deselect the previous piece
    else selected = deselect(board);
  }
  // render the changed board to display
  displayBoard();
}

function handleModalClick(event) {
  if (!waitForPromotion) return;
  if (!event.target.dataset.name) return;
  promotePawn(board, event.target.dataset.name);
  waitForPromotion = false;
  removeModal();
  turn ^= 1;
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
  // select first turn randomly
  turn = Math.floor(Math.random() * 2);
  // orient the board as per the turn
  flip = turn ? true : false;
  waitForPromotion = false;
  // empty captured and selected variables
  captured = [[], []];
  selected = null;
  history = [];
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
  if (prevMove.attack) captured[turn].pop();
  undoMove(board, prevMove);
  selected = deselect(board);
  displayGameStatus();
  displayBoard();
}

function displayGameStatus() {
  // check if there are any possible moves
  canMove = canPlayerMove(board, turn, history);
  // check if the king is in check status
  check = !checkKing(board, turn, { x: 0, y: 0 }, { x: 0, y: 0 });
  if (flipEveryMove) flip = turn ? true : false;
  if (turn) gameStatus = "Black's Turn";
  else gameStatus = "White's Turn";
  // if king is in check, add in status
  if (check && canMove) gameStatus += " / Check";
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
    board[kingX][kingY].validAttack = true;
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
  captured.forEach((group, i) =>
    group.forEach((item) => {
      const smallCellElement = createSmallCellElement(item);
      if (flip) capturedElements[i].appendChild(smallCellElement);
      else capturedElements[i ^ 1].appendChild(smallCellElement);
    })
  );
}

function displayModal() {
  modalElement.innerHTML = "";
  PAWN_PROMOTION.forEach((option) =>
    modalElement.append(createPromotionElement(option))
  );
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
  if (cell.selected) cellElement.classList.add("selected");
  if (cell.validMove) cellElement.classList.add("move");
  if (cell.validAttack) cellElement.classList.add("danger");
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
