// js/script.js
import { createDeck, shuffleDeck, dealCards } from './gameLogic.js';

const MAX_ROOMS = 5;
const MAX_PLAYERS_PER_ROOM = 4;

let rooms = Array.from({ length: MAX_ROOMS }, (_, i) => ({
    id: i + 1,
    players: [],
    isFull: false
}));

let currentPlayer = null;
let currentRoom = null;

// Initialize Room UI
function initRooms() {
    const roomsContainer = document.getElementById('rooms');
    roomsContainer.innerHTML = '';

    rooms.forEach(room => {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room';
        roomDiv.innerHTML = `
            <strong>房间 ${room.id}</strong><br>
            当前人数: ${room.players.length}/${MAX_PLAYERS_PER_ROOM}<br>
            <button ${room.isFull ? 'disabled' : ''} onclick="joinRoom(${room.id})">加入</button>
        `;
        roomsContainer.appendChild(roomDiv);
    });
}

// Register Player
function registerPlayer() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;
    const registrationMessage = document.getElementById('registrationMessage');

    if (phoneNumber && password) {
        currentPlayer = { phoneNumber, password, isAI: false };
        registrationMessage.textContent = '注册成功！';
        initRooms();
    } else {
        registrationMessage.textContent = '请输入手机号和密码！';
    }
}

// Join Room
function joinRoom(roomId) {
    currentRoom = rooms[roomId - 1];

    if (currentRoom.players.length < MAX_PLAYERS_PER_ROOM) {
        currentRoom.players.push(currentPlayer);
        if (currentRoom.players.length === MAX_PLAYERS_PER_ROOM) {
            currentRoom.isFull = true;
        }
        alert(`成功加入房间 ${currentRoom.id}`);
        document.getElementById('room-selection').style.display = 'none';
        document.getElementById('game-area').style.display = 'block';
        document.getElementById('player-area').innerHTML = `欢迎 ${currentPlayer.phoneNumber} 到房间 ${currentRoom.id}`;
        renderPlayerHands(); // 增加渲染玩家手牌
    } else {
        alert('房间已满，请选择其他房间。');
    }
}

// Start Game
function startGame() {
    const deck = createDeck();
    shuffleDeck(deck);

    currentRoom.players.forEach(player => {
        player.hand = dealCards(deck, 13);
        player.sets = { front: [], middle: [], back: [] };
        player.status = "游戏中";
    });

    renderPlayerHands();
    document.getElementById('messageArea').textContent = "游戏开始！";
}

// Render Player Hands
function renderPlayerHands() {
    const playerArea = document.getElementById('player-area');
    playerArea.innerHTML = '';

    currentRoom.players.forEach(player => {
        const handDisplay = document.createElement('div');
        handDisplay.className = 'sets-display';
        handDisplay.innerHTML = `<div class="card-set" id="${player.phoneNumber}-hand"></div>`;
        playerArea.appendChild(handDisplay);

        const hand = player.hand.map(card => `<div class="card">${card.rank} of ${card.suit}</div>`).join('');
        document.getElementById(`${player.phoneNumber}-hand`).innerHTML = hand;
    });
}

// AI Trustee
function aiTrustee() {
    currentPlayer.isAI = true; // 标记当前玩家为 AI
    alert('托管给 AI，AI 将为你自动摆牌。');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerButton').addEventListener('click', registerPlayer);
    document.getElementById('startGameButton').addEventListener('click', startGame);
    document.getElementById('aiTrusteeButton').addEventListener('click', aiTrustee);

    // Initialize Rooms on Load
    initRooms();
});

window.joinRoom = joinRoom; // Expose joinRoom to global scope
