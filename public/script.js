const gameOptionContainer = document.querySelector("#game-option");
const rotateButton = document.querySelector("#rotate");
const gameBoardsContainer = document.querySelector("#game-boards");
const startButton = document.querySelector("#start");
const turn = document.querySelector("#turn");
const info = document.querySelector("#info");
const autoPlaceButton = document.querySelector("#autoPlace");

let angle = 0;
let width = 10;

let gameOver = false;
let humanTurn = true;

let humanHits = [];
let computerHits = [];

let computerSunkShips = [];
let humanSunkShips = [];

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
createBoard("pink", "computer");

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
let notDropped = false;

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
        if (user === "computer") generate(user, ship);
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

ships.forEach((ship) => generate("computer", ship));

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
    highlight(event.target.id.substr(6), ship);
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

function highlight(startIndex, ship) {
    const allBoardBlocks = document.querySelectorAll("#human div");
    let isHorisontal = angle === 0;
    const { shipBlocks, notTaken } = getValidity(
        allBoardBlocks,
        isHorisontal,
        startIndex,
        ship
    );
    if (notTaken) {
        shipBlocks.forEach((shipBlock) => {
            shipBlock.classList.add("hover");
            setTimeout(() => shipBlock.classList.remove("hover"), 500);
        });
    }
}

let firstturn = true;

function computerGo() {
    if (!gameOver) {
        turn.textContent = "Computers Go!";
        if (firstturn) {
            info.textContent = "Computers is thinking...";
        }
        else {
            firstturn = true;
        }

        setTimeout(() => {
            let rand = Math.floor(Math.random() * width * width);
            const allBoardsBlocks = document.querySelectorAll("#human div");

            if (
                allBoardsBlocks[rand].classList.contains("taken") &&
                allBoardsBlocks[rand].classList.contains("boom")
            ) {
                computerGo();
                return;
            } else if (
                allBoardsBlocks[rand].classList.contains("taken") &&
                !allBoardsBlocks[rand].classList.contains("boom")
            ) {
                allBoardsBlocks[rand].classList.add("boom");
                info.textContent = "Computer hit your ship!";
                let classes = Array.from(allBoardsBlocks[rand].classList);
                classes = classes.filter(
                    (className) =>
                        className !== "block" &&
                        className !== "boom" &&
                        className !== "taken"
                );
                computerHits.push(...classes);
                console.log(computerHits);
                checkScore("computer", computerHits, computerSunkShips);
                info.textContent = "Computer hit your ship and continue the turn...";
                firstturn = false;
                computerGo();
            } else {
                info.textContent = "Nothing hit";
                allBoardsBlocks[rand].classList.add("empty");
            }
        }, 3000);
        setTimeout(() => {
            humanTurn = true;
            turn.textContent = "Your Go!";
            info.textContent = "Your turn!";
            const allBoardBlocks = document.querySelectorAll("#computer div");
            allBoardBlocks.forEach((block) =>
                block.addEventListener("click", handleClick)
            );
        }, 6000);
    }
}

function handleClick(event) {
    if (!gameOver) {

        if (event.target.classList.contains("boom")) {
            return;
        }

        if (event.target.classList.contains("taken")) {
            event.target.classList.add("boom");
            info.innerHTML = "You hit computer's ship!";
            let classes = Array.from(event.target.classList);
            classes = classes.filter(
                (className) =>
                    className !== "block" && className !== "boom" && className !== "taken"
            );
            humanHits.push(...classes);
            console.log(humanHits);
            checkScore("human", humanHits, humanSunkShips);
            if (humanTurn && !gameOver) {
                const allBoardBlocks = document.querySelectorAll("#computer div");
                allBoardBlocks.forEach((block) =>
                    block.addEventListener("click", handleClick)
                );
            }
        } else {
            info.textContent = "You missed it";
            event.target.classList.add("empty");
            humanTurn = false;
            const allBoardBlocks = document.querySelectorAll("#computer div");
            allBoardBlocks.forEach((block) => block.replaceWith(block.cloneNode(true)));
            setTimeout(computerGo, 2000);
        }
    }
}



function startGame() {
    if (gameOptionContainer.children.length != 0) {
        info.innerHTML = "Place all your ships!";
    } else {
        info.innerHTML = "Congrat!";

        const allBoardBlocks = document.querySelectorAll("#computer div");
        allBoardBlocks.forEach((block) =>
            block.addEventListener("click", handleClick)
        );
    }
    humanTurn = true;
    turn.textContent = "You Go!";
    info.textContent = "The game has started!";
}

startButton.addEventListener("click", startGame);

function checkScore(user, userHits, userSunkShips) {
    function checkShip(shipName, shipLength) {
        const hitsForThisShip = userHits.filter((storedShipName) => storedShipName === shipName);
        if (hitsForThisShip.length === shipLength) {
            if (user === "human") {
                info.textContent = `You sunk the computer's ${shipName}`;
                humanHits = userHits.filter((storedShipName) => storedShipName != shipName);
            }
            if (user === "computer") {
                info.textContent = `Computer sunk your ${shipName}`;
                computerHits = userHits.filter((storedShipName) => storedShipName != shipName);
            }
            userSunkShips.push(shipName);
        }
    }

    ships.forEach((ship) => checkShip(ship.name, ship.length));

    console.log("userHits", user, userHits);
    console.log("userSunkShips", user, userSunkShips);

    if (humanSunkShips.length === ships.length) {
        info.textContent = "You won!";
        gameOver = true;
    }
    if (computerSunkShips.length === ships.length) {
        info.textContent = "Computer won!";
        gameOver = true;
    }
}