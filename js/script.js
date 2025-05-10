// js/script.js
import { createDeck, shuffleDeck, dealCards } from './gameLogic.js';

const MAX_ROOMS = 5;
const MAX_PLAYERS_PER_ROOM = 4;

let rooms = Array.from({ length: MAX_ROOMS }, (_, i) => ({
    id: i + 1,
    players: [],
    isFull: false,
    isStarted: false,
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
        currentPlayer = { phoneNumber, password, isAI: false, isReady: false };
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
        renderPlayerHands(); // 在进入房间后显示玩家手牌
    } else {
        alert('房间已满，请选择其他房间。');
    }
}

// Start Game
function startGame() {
    if (!currentRoom || currentRoom.isStarted) {
        alert("游戏已经开始或没有选择房间！");
        return;
    }
    if (currentRoom.players.length < MAX_PLAYERS_PER_ROOM) {
        alert("需要4名玩家才能开始游戏。");
        return;
    }

    const deck = createDeck();
    shuffleDeck(deck);

    currentRoom.players.forEach(player => {
        player.hand = dealCards(deck, 13);
        player.sets = { front: [], middle: [], back: [] };
        player.status = "游戏中";
    });

    currentRoom.isStarted = true; // 设置房间为已开始状态
    renderPlayerHands();
    document.getElementById('messageArea').textContent = "游戏开始！请摆牌。";
}

// Render Player Hands
function renderPlayerHands() {
    const playerArea = document.getElementById('player-area');
    playerArea.innerHTML = ''; // 清空之前的内容

    currentRoom.players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'sets-display';
        playerDiv.innerHTML = `<strong>${player.phoneNumber}:</strong> `;

        const handHTML = player.hand.map(card => `<div class="card">${card.rank} of ${card.suit}</div>`).join('');
        playerDiv.innerHTML += `<div class="card-set">${handHTML}</div>`;
        playerArea.appendChild(playerDiv);
    });
}

// Prepare Player
function preparePlayer() {
    if (!currentPlayer) return;

    currentPlayer.isReady = !currentPlayer.isReady; // 切换准备状态
    const statusMessage = currentPlayer.isReady ? "你已准备好！" : "你未准备！";
    document.getElementById('messageArea').textContent = statusMessage;

    // 检查是否所有玩家都准备好
    if (currentRoom.players.every(player => player.isReady)) {
        startGame(); // 所有玩家准备后开始游戏
    }
}

// AI Trustee
function aiTrustee() {
    if (!currentPlayer) {
        alert("请先注册或登录！");
        return;
    }

    // 如果选择托管给 AI，标记当前玩家为 AI
    currentPlayer.isAI = true; 
    alert('托管给 AI，AI 将为你自动摆牌（此功能待实现）。');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerButton').addEventListener('click', registerPlayer);
    document.getElementById('startGameButton').addEventListener('click', startGame);
    document.getElementById('aiTrusteeButton').addEventListener('click', aiTrustee);
    document.getElementById('readyButton').addEventListener('click', preparePlayer);

    // Initialize Rooms on Load
    initRooms();
});
window.joinRoom = joinRoom; // Expose joinRoom to global scope
