import "./style.css";
import { GameLogic } from "./game-logic";
import { Swappable } from "@shopify/draggable";
import { apiService } from "./api-service";
import "@fortawesome/fontawesome-free/css/all.min.css";

const imageSources = [
  "king-faisal-3.jpg",
  "king-saud-2.jpg",
  "King-Abdulaziz-5.jpg",
  "king-khalid-3.jpg",
  "king-fahad-2.jpg",
  "king-abdullah-2.jpg",
  "king-salman-2.jpg",
].map((src) => `/images/${src}`);

const welcomeScreen = document.getElementById("welcome-screen");
const gameScreen = document.getElementById("game-screen");
const startButton = document.getElementById("start-game");
const puzzleContainer = document.getElementById("puzzle-container");
const fullImageContainer = document.getElementById("full-image-container");
const levelSpan = document.querySelector("#level span");
const timerSpan = document.querySelector("#timer span");
const scoreSpan = document.querySelector("#score span");
const playerNameInput = document.getElementById("player-name");

function shuffleArray(array) {
  const fakeShuffle = false;
  if (fakeShuffle) {
    [array[0], array[1]] = [array[1], array[0]];
    return array;
  }
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

let game;
let swappable;
let timerInterval;

async function imageBitmapToBlobUrl(imageBitmap) {
  const canvas = document.createElement("canvas");
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("فشل في الحصول على سياق 2D من اللوحة.");
  }

  ctx.drawImage(imageBitmap, 0, 0);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) {
    throw new Error("فشل في تحويل اللوحة إلى Blob.");
  }

  return URL.createObjectURL(blob);
}

async function initializeGame() {
  if (welcomeScreen && gameScreen && startButton && playerNameInput) {
    const header = createHeader();

    const centeredContent = document.createElement("div");
    centeredContent.id = "centered-content";

    centeredContent.appendChild(document.querySelector("h1"));
    centeredContent.appendChild(playerNameInput);
    centeredContent.appendChild(startButton);

    const footer = document.createElement("footer");
    footer.innerHTML = "جميع الحقوق المحفوظة لصالح لمى العجمة.";

    welcomeScreen.innerHTML = "";
    welcomeScreen.appendChild(header);
    welcomeScreen.appendChild(centeredContent);
    welcomeScreen.appendChild(footer);

    gameScreen.insertBefore(header.cloneNode(true), gameScreen.firstChild);

    startButton.addEventListener("click", async () => {
      const playerName = playerNameInput.value.trim();
      if (!playerName) {
        alert("الرجاء إدخال اسمك");
        return;
      }

      try {
        welcomeScreen.style.display = "none";
        gameScreen.style.display = "flex";

        game = new GameLogic(imageSources);
        game.setPlayerName(playerName);
        await game.initialize();
        await startGame();
      } catch (error) {
        console.error("خطأ في بدء اللعبة:", error);
        alert("حدث خطأ أثناء بدء اللعبة. يرجى المحاولة مرة أخرى.");
      }
    });
  }
}

function createHeader() {
  const header = document.createElement("header");
  header.id = "game-header";

  const logoContainer = document.createElement("div");
  logoContainer.id = "logo-container";

  const logo1 = document.createElement("img");
  logo1.src = "/نحلم ونحقق.png";
  logo1.alt = "لوغو نحلم ونحقق";
  logo1.classList.add("logo");

  const logo2 = document.createElement("img");
  logo2.src = "/Royal_Standard_of_Kingdom_of_Saudi_Arabia.svg.png";
  logo2.alt = "العلم الملكي للمملكة العربية السعودية";
  logo2.classList.add("logo");

  const spacer = document.createElement("div");
  spacer.style.flex = "1";

  logoContainer.appendChild(logo2);

  header.appendChild(logoContainer);

  return header;
}

async function startGame() {
  await game.prepareNextLevel();
  renderPuzzle();
  updateGameInfo();
  startTimer();
}

async function renderPuzzle() {
  if (!puzzleContainer) {
    console.error("لم يتم العثور على puzzleContainer");
    return;
  }

  if (swappable) {
    swappable.destroy();
  }

  puzzleContainer.querySelectorAll(".puzzle-piece").forEach((piece) =>
    piece.remove()
  );
  const gameState = game.getGameState();
  const { gridSize, slices } = gameState;

  puzzleContainer.style.display = "grid";
  puzzleContainer.style.gridTemplateColumns =
    `repeat(${gridSize.horizontal}, 1fr)`;
  puzzleContainer.style.gridTemplateRows = `repeat(${gridSize.vertical}, 1fr)`;

  const sliceElements = [];

  for (
    const [slotIndex, [sliceIndex, slice]] of shuffleArray([
      ...slices.entries(),
    ]).entries()
  ) {
    const pieceElement = document.createElement("div");
    pieceElement.classList.add("puzzle-piece");
    pieceElement.dataset.index = sliceIndex.toString();

    const contentDiv = document.createElement("div");
    contentDiv.style.position = "relative";
    contentDiv.style.width = "100%";
    contentDiv.style.height = "100%";

    const img = document.createElement("img");

    const puzzleContainerStyles = getComputedStyle(puzzleContainer.parentElement);

    const containerWidth = parseFloat(puzzleContainerStyles.width);
    const containerHeight = parseFloat(puzzleContainerStyles.height);
    const gridColumns = game.getGameState().gridSize.horizontal;
    const gridRows = game.getGameState().gridSize.vertical;

    const pieceWidth = containerWidth / gridColumns;
    const pieceHeight = containerHeight / gridRows;

    const scaleFactorWidth = pieceWidth / slice.width;
    const scaleFactorHeight = pieceHeight / slice.height;
    const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);

    const scaledWidth = slice.width * scaleFactor;
    const scaledHeight = slice.height * scaleFactor;

    img.width = scaledWidth;
    img.height = scaledHeight;
    contentDiv.style.height = `${scaledHeight}px`;
    img.draggable = false;

    img.src = await imageBitmapToBlobUrl(slice);
    img.style.width = `${scaledWidth}px`;
    img.style.height = `${scaledHeight}px`;

    contentDiv.appendChild(img);

    const indexDiv = document.createElement("div");
    indexDiv.textContent = sliceIndex.toString();
    indexDiv.style.position = "absolute";
    indexDiv.style.top = "50%";
    indexDiv.style.left = "50%";
    indexDiv.style.transform = "translate(-50%, -50%)";
    indexDiv.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
    indexDiv.style.padding = "2px 5px";
    indexDiv.style.borderRadius = "3px";
    indexDiv.style.fontSize = "12px";
    indexDiv.style.fontWeight = "bold";

    contentDiv.style.setProperty("height", `${scaledHeight}px`);
    contentDiv.style.setProperty("width", `${scaledWidth}px`);

    pieceElement.style.height = `${scaledHeight}px`;
    pieceElement.style.width = `${scaledWidth}px`;
    pieceElement.style.border = `1px solid gray`;

    pieceElement.appendChild(contentDiv);

    sliceElements.push(pieceElement);
  }

  for (const element of sliceElements) {
    puzzleContainer.appendChild(element);
  }

  swappable = new Swappable(puzzleContainer, {
    draggable: ".puzzle-piece",
    delay: 0,
    mirror: {
      appendTo: puzzleContainer,
      constrainDimensions: true,
    },
  });

  swappable.on("swappable:stop", () => {
    setTimeout(() => {
      if (checkSolution()) {
        passLevel();
      }
    }, 100);
  });
}

function checkSolution() {
  const pieces = Array.from(
    puzzleContainer.querySelectorAll(
      ".puzzle-piece:not(.draggable-mirror):not(.draggable-source--is-dragging):not(.draggable--over)",
    ),
  );

  return pieces.every((piece, index) => {
    return parseInt(piece.dataset.index) === index;
  });
}

function updateGameInfo() {
  const gameState = game.getGameState();
  if (levelSpan) {
    levelSpan.textContent = (gameState.currentLevel + 1).toString();
  }
  if (scoreSpan) scoreSpan.textContent = gameState.score.toString();
}

function startTimer() {
  timerInterval = setInterval(() => {
    const gameState = game.getGameState();
    const seconds = Math.floor(gameState.elapsedTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (timerSpan) {
      timerSpan.textContent = `${minutes.toString().padStart(2, "0")}:${
        remainingSeconds.toString().padStart(2, "0")
      }`;
    }
  }, 100);
}

function passLevel() {
  game.completeLevel();

  if (game.getGameState().currentLevel < imageSources.length) {
    game.prepareNextLevel().then(() => {
      renderPuzzle();
      updateGameInfo();
    });
  } else {
    setTimeout(() => {
      endGame();
    }, 1000);
  }
}

async function endGame() {
  clearInterval(timerInterval);
  if (swappable) {
    swappable.destroy();
  }

  await game.completeGame();
  const gameState = game.getGameState();
  const leaderboard = await apiService.getLeaderboard();

  const gameOverScreen = document.createElement("div");
  gameOverScreen.id = "game-over-screen";
  gameOverScreen.innerHTML = `
    ${createHeader().outerHTML}
    <div class="game-over-content">
      <h2>انتهت اللعبة!</h2>
      <p>مجموع نقاطك النهائي: ${gameState.score}</p>
      <h3>لوحة المتصدرين</h3>
      <div class="leaderboard-container">
        <table class="leaderboard">
          <thead>
            <tr>
              <th>المركز</th>
              <th>الاسم</th>
              <th>النقاط</th>
              <th>الوقت</th>
            </tr>
          </thead>
          <tbody>
            ${
    leaderboard
      .map(
        (entry, index) => `
              <tr class="${index < 3 ? `top-${index + 1}` : ""}">
                <td>
                  ${
          index === 0
            ? '<i class="fas fa-crown gold"></i>'
            : index === 1
            ? '<i class="fas fa-crown silver"></i>'
            : index === 2
            ? '<i class="fas fa-crown bronze"></i>'
            : index + 1
        }
                </td>
                <td>${entry.name}</td>
                <td>${entry.score}</td>
                <td>${formatDuration(entry.duration)}</td>
              </tr>
            `,
      )
      .join("")
  }
          </tbody>
        </table>
      </div>
      <button id="restart-game">إعادة اللعب</button>
    </div>
  `;

  document.getElementById("app").innerHTML = "";
  document.getElementById("app").appendChild(gameOverScreen);

  const restartButton = document.getElementById("restart-game");
  if (restartButton) {
    restartButton.addEventListener("click", () => {
      location.reload();
    });
  }
}

function formatDuration(duration) {
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

window.addEventListener("load", initializeGame);
