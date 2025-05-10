// js/script.js
import { createDeck, shuffleDeck, dealCards } from './gameLogic.js';

const MAX_ROOMS = 5;
const MAX_PLAYERS_PER_ROOM = 4;

// --- Global State ---
let rooms = [];
let currentPlayer = null; // { phoneNumber, password, isAI, isReady }
let currentRoom = null;   // Reference to a room object from the `rooms` array

// --- DOM Elements ---
const registrationArea = document.getElementById('registration-area');
const roomSelectionArea = document.getElementById('room-selection');
const gameArea = document.getElementById('game-area');
const roomsListDiv = document.getElementById('rooms-list');
const playerDisplayArea = document.getElementById('player-display-area');
const gameMessageDiv = document.getElementById('gameMessage');
const registrationMessageDiv = document.getElementById('registrationMessage');
const roomTitleH2 = document.getElementById('room-title');

const registerButton = document.getElementById('registerButton');
const readyButton = document.getElementById('readyButton');
const aiTrusteeButton = document.getElementById('aiTrusteeButton');
const leaveRoomButton = document.getElementById('leaveRoomButton');

// --- Initialization ---
function initializeRooms() {
    rooms = Array.from({ length: MAX_ROOMS }, (_, i) => ({
        id: i + 1,
        name: `房间 ${i + 1}`,
        players: [], // Stores player objects { phoneNumber, isReady, isAI, hand, sets }
        isGameStarted: false,
    }));
    renderRoomSelection();
}

// --- UI Rendering Functions ---
function renderRoomSelection() {
    roomsListDiv.innerHTML = '';
    rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.innerHTML = `
            <h3>${room.name}</h3>
            <p>人数: ${room.players.length} / ${MAX_PLAYERS_PER_ROOM}</p>
            <p>状态: ${room.isGameStarted ? '游戏中' : (room.players.length === MAX_PLAYERS_PER_ROOM ? '已满' : '等待中')}</p>
            <button class="join-room-btn" data-roomid="${room.id}" ${room.players.length === MAX_PLAYERS_PER_ROOM || room.isGameStarted ? 'disabled' : ''}>
                加入房间
            </button>
        `;
        roomsListDiv.appendChild(roomCard);
    });

    // Add event listeners to newly created join buttons
    document.querySelectorAll('.join-room-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const roomId = parseInt(event.target.dataset.roomid);
            joinRoom(roomId);
        });
    });
}

function updatePlayerDisplayAndMessages() {
    if (!currentRoom) {
        playerDisplayArea.innerHTML = '';
        gameMessageDiv.textContent = '请先加入房间并准备开始游戏。';
        return;
    }

    roomTitleH2.textContent = `${currentRoom.name} (${currentRoom.players.length}/${MAX_PLAYERS_PER_ROOM})`;
    playerDisplayArea.innerHTML = ''; // Clear previous player display

    currentRoom.players.forEach(player => {
        const playerInfoDiv = document.createElement('div');
        playerInfoDiv.className = 'player-info';

        let statusText = '';
        let statusClass = '';

        if (player.isAI) {
            statusText = 'AI托管中 - 已准备';
            statusClass = 'status ai ready';
        } else if (player.isReady) {
            statusText = '已准备';
            statusClass = 'status ready';
        } else {
            statusText = '未准备';
            statusClass = 'status not-ready';
        }

        playerInfoDiv.innerHTML = `
            <span class="name">${player.phoneNumber}</span>
            <span class="${statusClass}">${statusText}</span>
        `;

        // Display hand if game has started and hands are dealt
        if (currentRoom.isGameStarted && player.hand && player.hand.length > 0) {
            const handDiv = document.createElement('div');
            handDiv.className = 'hand-display';
            handDiv.innerHTML = player.hand.map(card => `<div class="card">${card.rank}${getSuitSymbol(card.suit)}</div>`).join('');
            playerInfoDiv.appendChild(handDiv);
        }
        playerDisplayArea.appendChild(playerInfoDiv);
    });

    // Update general game message
    if (currentRoom.isGameStarted) {
        gameMessageDiv.textContent = "游戏已开始！请按规则摆牌 (摆牌逻辑未实现)。";
    } else {
        const readyPlayersCount = currentRoom.players.filter(p => p.isReady).length;
        if (currentRoom.players.length < MAX_PLAYERS_PER_ROOM) {
            gameMessageDiv.textContent = `等待更多玩家加入... (${readyPlayersCount}/${currentRoom.players.length} 已准备)`;
        } else {
            gameMessageDiv.textContent = `等待所有玩家准备... (${readyPlayersCount}/${MAX_PLAYERS_PER_ROOM} 已准备)`;
        }
    }
     // Update ready button text based on current player's ready state
    const localPlayerInRoom = currentRoom.players.find(p => p.phoneNumber === currentPlayer.phoneNumber);
    if (localPlayerInRoom) {
        readyButton.textContent = localPlayerInRoom.isReady ? "取消准备" : "准备";
    }
}

function getSuitSymbol(suit) {
    const symbols = { 'hearts': '♥', 'diamonds': '♦', 'clubs': '♣', 'spades': '♠' };
    return symbols[suit.toLowerCase()] || suit;
}


// --- Player Actions ---
function handleRegister() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const password = document.getElementById('password').value; // Password not used for validation here

    if (!phoneNumber) {
        registrationMessageDiv.textContent = '请输入昵称/手机号。';
        registrationMessageDiv.className = 'message error';
        return;
    }

    currentPlayer = {
        phoneNumber: phoneNumber,
        isAI: false,
        isReady: false // Player is not ready initially
    };
    registrationMessageDiv.textContent = `欢迎, ${phoneNumber}! 请选择一个房间。`;
    registrationMessageDiv.className = 'message success';

    registrationArea.style.display = 'none';
    roomSelectionArea.style.display = 'block';
    renderRoomSelection(); // Refresh room list
}

function joinRoom(roomId) {
    if (!currentPlayer) {
        alert("请先注册！");
        return;
    }

    const roomToJoin = rooms.find(r => r.id === roomId);
    if (!roomToJoin) {
        alert("房间不存在！");
        return;
    }
    if (roomToJoin.players.length >= MAX_PLAYERS_PER_ROOM) {
        alert("房间已满！");
        return;
    }
    if (roomToJoin.isGameStarted) {
        alert("游戏已开始，无法加入！");
        return;
    }

    // Check if player is already in another room or this room
    if (currentRoom && currentRoom.id !== roomToJoin.id) {
        alert("您已在另一个房间，请先离开。"); // Basic check, could be more robust
        return;
    }
    if (roomToJoin.players.some(p => p.phoneNumber === currentPlayer.phoneNumber)) {
         alert("您已在此房间！");
         // Fall through to show game area if rejoining the same visible room
    } else {
        // Add a copy of currentPlayer to the room, ensuring `isReady` is false
        const playerForRoom = { ...currentPlayer, isReady: false, hand: [], sets: {} };
        roomToJoin.players.push(playerForRoom);
    }


    currentRoom = roomToJoin;

    roomSelectionArea.style.display = 'none';
    gameArea.style.display = 'block';

    updatePlayerDisplayAndMessages();
    renderRoomSelection(); // Refresh room list to update player counts for all rooms
}

function handleLeaveRoom() {
    if (!currentRoom || !currentPlayer) return;

    // Remove player from the room
    currentRoom.players = currentRoom.players.filter(p => p.phoneNumber !== currentPlayer.phoneNumber);

    // If player was AI, reset current player's AI state
    if (currentPlayer.isAI) {
        currentPlayer.isAI = false; // No longer AI when leaving
    }
    currentPlayer.isReady = false;


    const roomLeftName = currentRoom.name;
    currentRoom = null; // Player is no longer in any room

    gameArea.style.display = 'none';
    roomSelectionArea.style.display = 'block';
    renderRoomSelection(); // Refresh room list

    alert(`已离开 ${roomLeftName}`);
    gameMessageDiv.textContent = '请先加入房间并准备开始游戏。';
}


function handleReadyToggle() {
    if (!currentRoom || !currentPlayer) {
        alert("请先加入房间！");
        return;
    }

    const playerInRoom = currentRoom.players.find(p => p.phoneNumber === currentPlayer.phoneNumber);
    if (!playerInRoom) {
        console.error("当前玩家未在房间列表中找到！");
        return;
    }

    // If player is AI controlled, they cannot manually un-ready
    if (playerInRoom.isAI) {
        alert("AI托管中，无法手动更改准备状态。AI始终为准备状态。");
        return;
    }

    playerInRoom.isReady = !playerInRoom.isReady;
    currentPlayer.isReady = playerInRoom.isReady; // Sync with global currentPlayer if needed

    updatePlayerDisplayAndMessages();
    checkAndStartGame();
}

function handleAiTrusteeToggle() {
    if (!currentRoom || !currentPlayer) {
        alert("请先加入房间才能使用AI托管！");
        return;
    }

    const playerInRoom = currentRoom.players.find(p => p.phoneNumber === currentPlayer.phoneNumber);
    if (!playerInRoom) {
        console.error("当前玩家未在房间列表中找到！");
        return;
    }

    playerInRoom.isAI = !playerInRoom.isAI; // Toggle AI status
    currentPlayer.isAI = playerInRoom.isAI; // Sync

    if (playerInRoom.isAI) {
        playerInRoom.isReady = true; // AI is always ready
        alert(`${playerInRoom.phoneNumber} 已切换为AI托管，并自动准备。`);
    } else {
        // Player took back control, their ready state might change based on previous manual action
        // For simplicity, let's set to not ready, they can click "Ready" again.
        playerInRoom.isReady = false;
        alert(`${playerInRoom.phoneNumber} 已取消AI托管。请手动准备。`);
    }
    currentPlayer.isReady = playerInRoom.isReady;


    updatePlayerDisplayAndMessages();
    checkAndStartGame(); // AI becoming ready might trigger game start
}

// --- Game Logic Flow ---
function checkAndStartGame() {
    if (!currentRoom || currentRoom.isGameStarted) return;

    if (currentRoom.players.length === MAX_PLAYERS_PER_ROOM &&
        currentRoom.players.every(p => p.isReady === true)) {
        startGame();
    } else {
        // Update message if game didn't start
        updatePlayerDisplayAndMessages();
    }
}

function startGame() {
    if (!currentRoom || currentRoom.isGameStarted) return; // Should be redundant due to checkAndStartGame

    console.log(`房间 ${currentRoom.name} 开始游戏!`);
    currentRoom.isGameStarted = true;

    const deck = createDeck();
    shuffleDeck(deck);

    currentRoom.players.forEach(player => {
        player.hand = dealCards(deck, 13);
        player.sets = { front: [], middle: [], back: [] }; // Initialize sets
    });

    updatePlayerDisplayAndMessages(); // This will now show hands
    renderRoomSelection(); // Update room status in the main list
    readyButton.disabled = true; // Disable ready button once game starts
    aiTrusteeButton.disabled = true; // Optionally disable AI toggle during game
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    initializeRooms(); // Setup rooms data structure

    registerButton.addEventListener('click', handleRegister);
    readyButton.addEventListener('click', handleReadyToggle);
    aiTrusteeButton.addEventListener('click', handleAiTrusteeToggle);
    leaveRoomButton.addEventListener('click', handleLeaveRoom);

    // Initial UI state
    registrationArea.style.display = 'block';
    roomSelectionArea.style.display = 'none';
    gameArea.style.display = 'none';
});
