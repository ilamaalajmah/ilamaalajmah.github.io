import {
  calculateGridSize,
  loadAndSortImages,
  sliceImage,
} from "./utils/image-processing";
import { apiService } from "./api-service";
import allocatePointsPerLevel from "./utils/score-allocation";

export class GameLogic {
  constructor(imageSources) {
    this.imageSources = imageSources;
    this.sortedImages = [];
    this.gameState = this.initializeGameState();
    this.pointAllocation = allocatePointsPerLevel(imageSources.length);
    this.timerInterval = null;
    this.playerName = "";
    this.MAX_TOTAL_SCORE = 1000;
    this.MIN_SCORE_PERCENTAGE = 0.2;
  }

  initializeGameState() {
    return {
      currentLevel: 0,
      currentImage: "",
      gridSize: { horizontal: 0, vertical: 0 },
      slices: [],
      shuffledIndices: [],
      startTime: 0,
      elapsedTime: 0,
      score: 0,
    };
  }

  async initialize() {
    this.sortedImages = await loadAndSortImages(this.imageSources);
    await this.prepareNextLevel();
  }

  async prepareNextLevel() {
    const currentImage = this.sortedImages[this.gameState.currentLevel];
    this.gameState.currentImage = currentImage.src;
    this.gameState.gridSize = calculateGridSize(
      this.gameState.currentLevel,
      this.sortedImages.length,
      currentImage.width,
      currentImage.height,
    );

    this.gameState.slices = await this.sliceImage(currentImage);
    this.startTimer();
  }

  async sliceImage(imageInfo) {
    return sliceImage(imageInfo, this.gameState.gridSize);
  }


  startTimer() {
    this.gameState.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.gameState.elapsedTime = Date.now() - this.gameState.startTime;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  calculateScore() {
    const currentLevel = this.gameState.currentLevel;
    const baseScoreForLevel = this.pointAllocation[currentLevel];

    const gracePeriod = 10000 * (currentLevel + 1);

    const decayFactor = 0.10;
    const decayTime = Math.max(0, this.gameState.elapsedTime - gracePeriod);
    const timeFactor = Math.exp(-decayFactor * (decayTime / 1000));

    const rawScore = Math.ceil(baseScoreForLevel * timeFactor);

    const minScore = Math.ceil(baseScoreForLevel * this.MIN_SCORE_PERCENTAGE);

    return Math.max(rawScore, minScore);
  }

  getCurrentLevelScore() {
    return this.calculateScore();
  }

  completeLevel() {
    this.stopTimer();
    const levelScore = this.getCurrentLevelScore();
    this.gameState.score = Math.min(
      this.gameState.score + levelScore,
      this.MAX_TOTAL_SCORE,
    );
    this.gameState.currentLevel++;
  }

  getTotalScore() {
    return Math.min(this.gameState.score, this.MAX_TOTAL_SCORE);
  }

  getMaxTotalScore() {
    return this.MAX_TOTAL_SCORE;
  }

  resetGame() {
    this.stopTimer();
    this.gameState = this.initializeGameState();
  }

  setPlayerName(name) {
    this.playerName = name;
  }

  async completeGame() {
    this.stopTimer();
    const finalScore = this.gameState.score;
    const duration = this.gameState.elapsedTime;

    await apiService.createSubmission({
      name: this.playerName,
      score: finalScore,
      date: new Date().toISOString(),
      duration: duration,
    });
  }

  getGameState() {
    return { ...this.gameState };
  }

}
