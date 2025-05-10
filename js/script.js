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
        currentPlayer = { phoneNumber, password };
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
    } else {
        alert('房间已满，请选择其他房间。');
    }
}

// Start Game
function startGame() {
    // 发牌给所有玩家（简单处理，仅为当前房间的玩家）
    const deck = createDeck();
    shuffleDeck(deck);
    const playersHands = currentRoom.players.map(player => dealCards(deck, 13));
    console.log('发牌结果:', playersHands);
    alert('游戏开始！');
}

// AI Trustee
function aiTrustee() {
    alert('托管给 AI，AI 将为你摆牌。');
}

// Event Listeners
document.getElementById('registerButton').addEventListener('click', registerPlayer);
document.getElementById('startGameButton').addEventListener('click', startGame);
document.getElementById('aiTrusteeButton').addEventListener('click', aiTrustee);

// Initialize Rooms on Load
window.onload = initRooms;
window.joinRoom = joinRoom; // Expose joinRoom to global scope
