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
    if (!roomsContainer) {
        console.error("Rooms container not found!");
        return;
    }
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
    const phoneNumberInput = document.getElementById('phoneNumber');
    const passwordInput = document.getElementById('password');
    const registrationMessage = document.getElementById('registrationMessage');

    if (!phoneNumberInput || !passwordInput || !registrationMessage) {
        console.error("Registration form elements not found!");
        return;
    }

    const phoneNumber = phoneNumberInput.value;
    const password = passwordInput.value;

    if (phoneNumber && password) {
        currentPlayer = { phoneNumber, password, isAI: false };
        registrationMessage.textContent = '注册成功！请选择房间。';
        registrationMessage.style.color = 'green';
        // Optionally hide registration form and show room selection if not already visible
        // document.getElementById('registration-area').style.display = 'none';
        // document.getElementById('room-selection').style.display = 'block';
        initRooms(); // Re-initialize rooms to update button states if needed
    } else {
        registrationMessage.textContent = '请输入手机号和密码！';
        registrationMessage.style.color = 'red';
    }
}

// Join Room - Expose to global scope for inline HTML onclick
window.joinRoom = function(roomId) {
    if (!currentPlayer) {
        alert("请先注册或登录！");
        const registrationMessage = document.getElementById('registrationMessage');
        if (registrationMessage) {
            registrationMessage.textContent = '请先注册才能加入房间！';
            registrationMessage.style.color = 'red';
        }
        return;
    }

    const roomToJoin = rooms.find(r => r.id === roomId);
    if (!roomToJoin) {
        console.error(`Room with id ${roomId} not found.`);
        alert("无法找到房间。");
        return;
    }
    currentRoom = roomToJoin;


    if (currentRoom.players.length < MAX_PLAYERS_PER_ROOM) {
        // Prevent adding the same player multiple times
        if (currentRoom.players.some(p => p.phoneNumber === currentPlayer.phoneNumber)) {
            alert(`您已在此房间 ${currentRoom.id}`);
        } else {
            currentRoom.players.push(currentPlayer);
        }

        if (currentRoom.players.length >= MAX_PLAYERS_PER_ROOM) {
            currentRoom.isFull = true;
        }
        alert(`成功加入房间 ${currentRoom.id}`);

        const roomSelectionDiv = document.getElementById('room-selection');
        const gameAreaDiv = document.getElementById('game-area');
        const playerAreaDiv = document.getElementById('player-area');

        if (roomSelectionDiv) roomSelectionDiv.style.display = 'none';
        if (gameAreaDiv) gameAreaDiv.style.display = 'block';
        if (playerAreaDiv) playerAreaDiv.innerHTML = `欢迎 ${currentPlayer.phoneNumber} 到房间 ${currentRoom.id}`;

        initRooms(); // Refresh room list to show updated player count / disabled state
        // Consider rendering hands or other game elements here if game is in progress or starting
        // renderPlayerHands(); 
    } else {
        alert('房间已满，请选择其他房间。');
    }
}

// Start Game
function startGame() {
    if (!currentRoom || currentRoom.players.length === 0) {
        alert("没有玩家在房间或未选择房间！");
        return;
    }
    // For simplicity, let's assume game starts if at least one player is in the room.
    // You might want to enforce currentRoom.players.length === MAX_PLAYERS_PER_ROOM

    const deck = createDeck();
    shuffleDeck(deck);

    currentRoom.players.forEach(player => {
        player.hand = dealCards(deck, 13);
        player.sets = { front: [], middle: [], back: [] }; // Reset sets
        player.status = "游戏中";
    });

    renderPlayerHands(); // Make sure this function exists and works
    const messageArea = document.getElementById('messageArea');
    if (messageArea) messageArea.textContent = "游戏开始！请摆牌。";
}

// Render Player Hands
function renderPlayerHands() {
    const playerArea = document.getElementById('player-area');
    if (!playerArea || !currentRoom) return;

    // Clear previous content but keep the welcome message or structure
    playerArea.innerHTML = `欢迎 ${currentPlayer.phoneNumber} 到房间 ${currentRoom.id}<br>`; 

    currentRoom.players.forEach(player => {
        const playerHandDivId = `player-${player.phoneNumber}-hand`;
        let playerDiv = document.getElementById(playerHandDivId);
        if (!playerDiv) {
            playerDiv = document.createElement('div');
            playerDiv.id = playerHandDivId;
            playerDiv.className = 'player-hand-display'; // Add a class for styling
            playerArea.appendChild(playerDiv);
        }

        const handHTML = player.hand.map(card => `<div class="card">${card.rank || 'N/A'} of ${card.suit || 'N/A'}</div>`).join('');
        playerDiv.innerHTML = `<strong>${player.phoneNumber}:</strong> ${handHTML}`;
    });
}

// AI Trustee
function aiTrustee() {
    if (!currentPlayer) {
        alert("请先注册或登录！");
        return;
    }
    currentPlayer.isAI = true; // Mark current player as AI controlled
    alert('托管给 AI，AI 将为你自动摆牌（此功能待实现）。');
    // Future: Implement AI card arrangement logic here
}

// --- Event Listeners ---
// Wrap in DOMContentLoaded to ensure elements are available
document.addEventListener('DOMContentLoaded', () => {
    const registerButton = document.getElementById('registerButton');
    if (registerButton) {
        registerButton.addEventListener('click', registerPlayer);
    } else {
        console.error("Element with ID 'registerButton' not found.");
    }

    const startGameButton = document.getElementById('startGameButton');
    if (startGameButton) {
        startGameButton.addEventListener('click', startGame);
    } else {
        // This is the problematic line from the error
        console.error("Element with ID 'startGameButton' not found. This might be causing the 'addEventListener' error.");
    }

    const aiTrusteeButton = document.getElementById('aiTrusteeButton');
    if (aiTrusteeButton) {
        aiTrusteeButton.addEventListener('click', aiTrustee);
    } else {
        console.error("Element with ID 'aiTrusteeButton' not found.");
    }

    // Initialize Rooms on Load
    initRooms();
});
