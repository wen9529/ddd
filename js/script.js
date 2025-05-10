// js/script.js
import { createDeck, shuffleDeck, dealCards, getHandType, compareHandTypes, calculateScores } from './gameLogic.js';

// --- Game State ---
const players = [];
const playerCount = 4; // Total players
let gamePhase = 'lobby'; // Current phase (lobby, dealing, arranging, scoring, ended)

// --- Initialize Players ---
function initializePlayers() {
    for (let i = 1; i <= playerCount; i++) {
        players.push({
            id: `player${i}`,
            name: `玩家 ${i}`,
            hand: [],
            sets: { front: [], middle: [], back: [] },
            isReady: false,
            score: 0,
            status: "等待准备..."
        });
        updatePlayerStatus(players[i - 1]);
    }
}

// --- Update Player Status ---
function updatePlayerStatus(player) {
    const statusElement = document.getElementById(`${player.id}-status`);
    if (statusElement) {
        statusElement.textContent = `${player.name}: ${player.status}`;
    }
}

// --- Handle Ready Click ---
function handleReadyClick() {
    const localPlayer = players[0]; // Assume player 1 is local
    localPlayer.isReady = !localPlayer.isReady;
    localPlayer.status = localPlayer.isReady ? "已准备" : "等待准备";
    updatePlayerStatus(localPlayer);
    checkIfAllReadyAndStart();
}

// --- Check if All Players are Ready ---
function checkIfAllReadyAndStart() {
    const allReady = players.every(player => player.isReady);
    if (allReady && gamePhase === 'lobby') {
        startGame();
    }
}

// --- Start Game ---
function startGame() {
    gamePhase = 'dealing';
    const messageArea = document.getElementById('messageArea');
    messageArea.textContent = "发牌中...";

    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);

    players.forEach(player => {
        player.hand = dealCards(shuffledDeck, 13);
        player.sets = { front: [], middle: [], back: [] };
        player.status = "游戏中";
        updatePlayerStatus(player);
    });

    renderPlayerHands();
    gamePhase = 'arranging';
}

// --- Render Player Hands ---
function renderPlayerHands() {
    players.forEach(player => {
        const handDisplay = document.getElementById(`${player.id}-hand`);
        if (handDisplay) {
            handDisplay.innerHTML = player.hand.map(card => createCardElement(card)).join('');
        }
    });
}

// --- Create Card Element ---
function createCardElement(card) {
    return `<div class="card">${card.rank} of ${card.suit}</div>`;
}

// --- Event Listeners ---
document.getElementById('readyButton').addEventListener('click', handleReadyClick);

// --- Initialize Players on Load ---
initializePlayers();
