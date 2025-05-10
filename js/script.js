// js/script.js
import { createDeck, shuffleDeck, dealCards } from './deck.js';
import { getHandType, compareHandTypes } from './hand.js';
import { startNewGame } from './gameLogic.js';
import { aiEvaluateHand } from './ai.js';

const startGameButton = document.getElementById('startGameButton');
const confirmArrangementButton = document.getElementById('confirmArrangementButton');
const messageArea = document.getElementById('messageArea');

startGameButton.addEventListener('click', startNewGame);
confirmArrangementButton.addEventListener('click', () => {
    // 确认摆牌逻辑
});
