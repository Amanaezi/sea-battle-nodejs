const gameOptionContainer = document.querySelector("#game-option");
const rotateButton = document.querySelector("#rotate");
const gameBoardsContainer = document.querySelector("#game-boards");
const startButton = document.querySelector("#start");
const turn = document.querySelector("#turn");
const info = document.querySelector("#info");
const autoPlaceButton = document.querySelector("#autoPlace");

const multiPlayerButton = document.querySelector("#multiPlayerButton");

multiPlayerButton.addEventListener("click", startMultiPlayer);

let currentPlayer = "user";
let gameMode = "";
let playerNum = 0;
let ready = false;
let enemyReady = false;
let allShipsPlaced = true;
let shotFired = -1;
let angle = 0;
let width = 10;
let gameOver = false;
let humanHits = [];
let enemyHits = [];
humanTurn = true;
let enemySunkShips = [];
let humanSunkShips = [];

function startMultiPlayer() {
  gameMode = "multiPlayer";
  const socket = io();

  // Отримати номер гравця
  socket.on("player-number", (num) => {
    if (num === -1) {
      info.innerHTML = "Sorry, the server is full";
      console.log("playerNum:" + playerNum);
    } else {
      playerNum = parseInt(num);
      if (playerNum === 1) currentPlayer = "enemy";

      console.log("playerNum:" + playerNum);
      // Отримати статус іншого гравця
      socket.emit("check-players");
    }
  });

  // Інший гравець приєднався або від'єднався
  socket.on("player-connection", (num) => {
    console.log(`Player number ${num} has connected or disconnected`);
    playerConnectedOrDisconnected(num);
  });

  // Готовність противника
  socket.on("enemy-ready", (num) => {
    enemyReady = true;
    playerReady(num);

    if (enemyReady) {
      if (currentPlayer === "user") {
        turn.innerHTML = "Your Go";
      }
      if (currentPlayer === "enemy") {
        turn.innerHTML = "Enemy's Go";
      }
    }

    if (ready) playGameMulti(socket);
  });

  // Перевірка статусу гравця
  socket.on("check-players", (players) => {
    players.forEach((p, i) => {
      if (p.connected) playerConnectedOrDisconnected(i);
      if (p.ready) {
        playerReady(i);
        if (i !== playerNum) enemyReady = true;
      }
    });
  });

  // Отримано сповіщення про постріл
  socket.on("fire", (id) => {
    enemyGo(id);
    const square = document.querySelectorAll("#human div")[id];
    socket.emit("fire-reply", square.classList);
    //playGameMulti(socket);
    document.querySelectorAll("#enemy div").forEach((block) => {
      block.addEventListener("click", () => {
        console.log("currentPlayer" + currentPlayer);
        if (ready && enemyReady) {
          shotFired = parseInt(block.id.substring(6));
          console.log("shotFired" + shotFired);
          socket.emit("fire", shotFired);
        }
      });
    });
  });

  // Відповідь на отримане сповіщення про постріл
  socket.on("fire-reply", (classList) => {
    revealSquare(classList);
    playGameMulti(socket);
  });

  // Ліміт часу досягнуто
  socket.on("timeout", () => {
    info.innerHTML = "You have reached the 10 minute limit";
  });

  // Логіка для гри на двох гравців
  function playGameMulti(socket) {
    // if (isGameOver) return;
    if (!ready) {
      ready = true;
      socket.emit("player-ready");
      playerReady(playerNum);
      humanTurn = true;
      info.innerHTML = "Game started";
    }
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`;
    document.querySelector(`${player} .ready span`).classList.toggle("green");
  }

  function revealSquare(classList) {
    if (!gameOver) {
      const enemySquare = document.querySelector(
        `#enemy div[id='block-${shotFired}']`
      );
      console.log("shotFired " + shotFired);
      const obj = Object.values(classList);

      console.log(obj);
      if (obj.includes("taken")) {
        enemySquare.classList.add("boom");
        info.innerHTML = "You hit enemys ship!";
        turn.textContent = "Enemy's Go";
        let classes = Array.from(obj);
        classes = classes.filter(
          (className) =>
            className !== "block" &&
            className !== "boom" &&
            className !== "taken"
        );
        humanHits.push(...classes);
        console.log(humanHits);
        checkScore("human", humanHits, humanSunkShips);
      } else {
        info.textContent = "You missed it";
        turn.textContent = "Enemy's Go";
        enemySquare.classList.add("empty");
      }
      const allBoardBlocks = document.querySelectorAll("#enemy div");
      allBoardBlocks.forEach((block) =>
        block.replaceWith(block.cloneNode(true))
      );
    }
  }

  // Кнопка Start Game для Multi Player
  startButton.addEventListener("click", () => {
    if (allShipsPlaced) playGameMulti(socket);
    else info.innerHTML = "Please place all ships";
  });

  // Прослуховування події пострілу
  document.querySelectorAll("#enemy div").forEach((block) => {
    block.addEventListener("click", () => {
      if (ready && enemyReady) {
        shotFired = parseInt(block.id.substring(6));
        console.log("shotFired" + shotFired);
        socket.emit("fire", shotFired);
      }
    });
  });
}

function playerConnectedOrDisconnected(num) {
  let player = `.p${parseInt(num) + 1}`;
  document.querySelector(`${player} .connected span`).classList.toggle("green");
  if (parseInt(num) === playerNum)
    document.querySelector(player).style.fontWeight = "bold";
}
function rotate() {
  const optionShips = Array.from(gameOptionContainer.children);
  angle = angle === 0 ? 90 : 0;
  optionShips.forEach(
    (optionShip) => (optionShip.style.transform = `rotate(${angle}deg)`)
  );
}

autoPlaceButton.addEventListener("click", autoPlaceShips);
rotateButton.addEventListener("click", rotate);


function createBoard(color, user) {
  const gameBoard = document.createElement("div");
  gameBoard.classList.add("game-board");
  gameBoard.style.background = color;
  gameBoard.id = user;
  gameBoardsContainer.append(gameBoard);
  for (let i = 0; i < width * width; i++) {
    const block = document.createElement("div");
    block.classList.add("block");
    block.id = `block-${i}`;
    gameBoard.append(block);
  }
}

createBoard("tan", "human");
createBoard("pink", "enemy");

class Ship {
  constructor(name, length) {
    this.name = name;
    this.length = length;
  }
}

const ships = [
  new Ship("deck-one", 1),
  new Ship("deck-one", 1),
  new Ship("deck-one", 1),
  new Ship("deck-one", 1),
  new Ship("deck-two", 2),
  new Ship("deck-two", 2),
  new Ship("deck-two", 2),
  new Ship("deck-three", 3),
  new Ship("deck-three", 3),
  new Ship("deck-four", 4)
];

let isHorisontal = true;
let autospawn = false;
let notDropped;

function generate(user, ship, startId) {
  const allBoardBlocks = document.querySelectorAll(`#${user} .block`);
  let randomBoolean = Math.random() < 0.5;
  isHorisontal = user === "human" ? angle === 0 : randomBoolean;
  let randomStartIndex = Math.floor(Math.random() * width * width);
  let startIndex = startId ? startId.substr(6) : randomStartIndex;
  let validStart = isHorisontal
    ? startIndex % width <= width - ship.length
      ? startIndex
      : width * Math.floor(startIndex / width) + (width - ship.length)
    : startIndex <= width * width - width * ship.length
      ? startIndex
      : width * width - width * ship.length;
  let shipBlocks = [];

  for (let i = 0; i < ship.length; i++) {
    if (isHorisontal) {
      shipBlocks.push(allBoardBlocks[Number(validStart) + i]);
    } else {
      shipBlocks.push(allBoardBlocks[Number(validStart) + i * width]);
    }
  }

  const adjacentBlocks = [];
  shipBlocks.forEach((block) => {
    const blockIndex = Array.from(allBoardBlocks).indexOf(block);
    const leftBlock = allBoardBlocks[blockIndex - 1];
    const rightBlock = allBoardBlocks[blockIndex + 1];
    const topBlock = allBoardBlocks[blockIndex - width];
    const bottomBlock = allBoardBlocks[blockIndex + width];
    const topLeftBlock = allBoardBlocks[blockIndex - width - 1];
    const topRightBlock = allBoardBlocks[blockIndex - width + 1];
    const bottomLeftBlock = allBoardBlocks[blockIndex + width - 1];
    const bottomRightBlock = allBoardBlocks[blockIndex + width + 1];

    if (leftBlock) adjacentBlocks.push(leftBlock);
    if (rightBlock) adjacentBlocks.push(rightBlock);
    if (topBlock) adjacentBlocks.push(topBlock);
    if (bottomBlock) adjacentBlocks.push(bottomBlock);
    if (topLeftBlock) adjacentBlocks.push(topLeftBlock);
    if (topRightBlock) adjacentBlocks.push(topRightBlock);
    if (bottomLeftBlock) adjacentBlocks.push(bottomLeftBlock);
    if (bottomRightBlock) adjacentBlocks.push(bottomRightBlock);
  });

  const notTaken = shipBlocks.every(
    (shipBlock) => !shipBlock.classList.contains("taken")
  );

  const notAdjacentTaken = adjacentBlocks.every(
    (block) => !block.classList.contains("taken")
  );

  if (notTaken && notAdjacentTaken) {
    shipBlocks.forEach((shipBlock) => {
      shipBlock.classList.add(ship.name);
      shipBlock.classList.add("taken");
    });
  } else {
    if (user === "enemy") generate(user, ship);
    if (user === "human") {
      if (autospawn) {
        generate(user, ship);
      }
      else {
        notDropped = true
        info.textContent = "Invalid placement. Try again.";
      }
    }
  }
}

let draggedShip;

const optionShips = Array.from(gameOptionContainer.children);

optionShips.forEach((optionShip) =>
  optionShip.addEventListener("dragstart", dragStart)
);

const allUserBlocks = document.querySelectorAll("#human div");
allUserBlocks.forEach((userBlock) => {
  userBlock.addEventListener("dragover", dragOver);
  userBlock.addEventListener("drop", dropShip);
});

function autoPlaceShips() {
  const allUserBlocks = document.querySelectorAll("#human div");
  allUserBlocks.forEach((block) => block.classList.remove("taken", "deck-one", "deck-two", "deck-three", "deck-four"));

  autospawn = true;
  ships.forEach((ship) => generate("human", ship));
  autospawn = false;

  const optionShips = Array.from(gameOptionContainer.children);
  optionShips.forEach((optionShip) => optionShip.remove());
}


function dragStart(event) {
  draggedShip = event.target;
  notDropped = false;
}

function dragOver(event) {
  event.preventDefault();
  const ship = ships[draggedShip.id.substr(5)];
}

function dropShip(event) {
  const startID = event.target.id;
  const ship = ships[draggedShip.id.substr(5)];
  generate("human", ship, startID);
  if (!notDropped) {
    draggedShip.remove();
    if (!gameOptionContainer.querySelector(".ship")) allShipsPlaced = true;
  }
}

function enemyGo(square) {
  if (!gameOver) {
    turn.textContent = "enemys Go!";

    const allBoardsBlocks = document.querySelectorAll("#human div");
    const targetSquare = allBoardsBlocks[square];

    if (
      targetSquare.classList.contains("empty") ||
      targetSquare.classList.contains("boom")
    ) {
      enemyGo();
      return;
    } else if (targetSquare.classList.contains("taken")) {
      targetSquare.classList.add("boom");
      info.textContent = "Enemy hit your ship!";
      let classes = Array.from(targetSquare.classList);
      classes = classes.filter(
        (className) =>
          className !== "block" && className !== "boom" && className !== "taken"
      );
      enemyHits.push(...classes);
      console.log(enemyHits);
      checkScore("enemy", enemyHits, enemySunkShips);
    } else {
      info.textContent = "Nothing hit";
      targetSquare.classList.add("empty");
    }
    humanTurn = true;
    turn.textContent = "Your Go!";
  }
}

function handleClick(event) {
  if (!gameOver) {

    if (event.target.classList.contains("boom")) {
      return;
    }

    if (event.target.classList.contains("taken")) {
      event.target.classList.add("boom");
      info.innerHTML = "You hit enemy's ship!";
      let classes = Array.from(event.target.classList);
      classes = classes.filter(
        (className) =>
          className !== "block" && className !== "boom" && className !== "taken"
      );
      humanHits.push(...classes);
      console.log(humanHits);
      checkScore("human", humanHits, humanSunkShips);
    } else {
      info.textContent = "You missed it";
      event.target.classList.add("empty");
      humanTurn = false;
    }
  }
}


function checkScore(user, userHits, userSunkShips) {
  function checkShip(shipName, shipLength) {
    const hitsForThisShip = userHits.filter((storedShipName) => storedShipName === shipName);
    if (hitsForThisShip.length === shipLength) {
      if (user === "human") {
        info.textContent = `You sunk the enemy's ${shipName}`;
        humanHits = userHits.filter((storedShipName) => storedShipName != shipName);
      }
      if (user === "enemy") {
        info.textContent = `enemy sunk your ${shipName}`;
        computerHits = userHits.filter((storedShipName) => storedShipName != shipName);
      }
      userSunkShips.push(shipName);
    }
  }

  let totalShipSquares = 0;
  ships.forEach(ship => totalShipSquares += ship.length);

  if (userHits.length === totalShipSquares) {
    if (user === "human") {
      info.textContent = "You won!";
    }
    else {
      info.textContent = "You lose!";
    }
    gameOver = true;
  }

  console.log("userHits", user, userHits);
  console.log("userSunkShips", user, userSunkShips);
}
