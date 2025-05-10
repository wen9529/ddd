// js/script.js
import { createDeck, shuffleDeck, dealCards, arrangeAICards } from './gameLogic.js'; // Добавим arrangeAICards

const MAX_ROOMS = 5;
const MAX_PLAYERS_PER_ROOM = 4;

// --- Global State (ВАЖНО: это состояние локально для каждой вкладки браузера) ---
let rooms = [];
let currentPlayer = null; // { phoneNumber, password, isAI, isReady }
let currentRoom = null;   // Ссылка на объект комнаты из массива `rooms`

// --- DOM Elements ---
// (Оставим как в предыдущей версии, предполагая, что все ID в HTML корректны)
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
        name: `Комната ${i + 1}`,
        players: [], // Хранит объекты игроков { phoneNumber, isReady, isAI, hand, sets }
        isGameStarted: false,
    }));
    console.log("Комнаты инициализированы:", JSON.parse(JSON.stringify(rooms)));
    renderRoomSelection();
}

// --- UI Rendering Functions ---
function renderRoomSelection() {
    if (!roomsListDiv) {
        console.error("Элемент roomsListDiv не найден!");
        return;
    }
    roomsListDiv.innerHTML = '';
    rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.innerHTML = `
            <h3>${room.name}</h3>
            <p>Игроков: ${room.players.length} / ${MAX_PLAYERS_PER_ROOM}</p>
            <p>Статус: ${room.isGameStarted ? 'В игре' : (room.players.length === MAX_PLAYERS_PER_ROOM ? 'Полная' : 'Ожидание')}</p>
            <button class="join-room-btn" data-roomid="${room.id}" ${room.players.length === MAX_PLAYERS_PER_ROOM || room.isGameStarted ? 'disabled' : ''}>
                Войти
            </button>
        `;
        roomsListDiv.appendChild(roomCard);
    });

    document.querySelectorAll('.join-room-btn').forEach(button => {
        button.removeEventListener('click', handleJoinRoomButtonClick); // Предотвращаем двойное назначение
        button.addEventListener('click', handleJoinRoomButtonClick);
    });
}

function handleJoinRoomButtonClick(event) {
    const roomId = parseInt(event.target.dataset.roomid);
    joinRoom(roomId);
}

function updatePlayerDisplayAndMessages() {
    if (!currentRoom) {
        if (playerDisplayArea) playerDisplayArea.innerHTML = '';
        if (gameMessageDiv) gameMessageDiv.textContent = 'Пожалуйста, войдите в комнату и приготовьтесь.';
        return;
    }

    console.log(`[${currentPlayer?.phoneNumber || 'N/A'}] Обновление отображения для комнаты ${currentRoom.id}. Игроки в комнате:`, JSON.parse(JSON.stringify(currentRoom.players)));

    if (roomTitleH2) roomTitleH2.textContent = `${currentRoom.name} (${currentRoom.players.length}/${MAX_PLAYERS_PER_ROOM})`;
    if (playerDisplayArea) playerDisplayArea.innerHTML = '';

    currentRoom.players.forEach(player => {
        const playerInfoDiv = document.createElement('div');
        playerInfoDiv.className = 'player-info';

        let statusText = '';
        let statusClass = 'status';

        if (player.isAI) {
            statusText = 'AI - Готов';
            statusClass += ' ai ready';
        } else if (player.isReady) {
            statusText = 'Готов';
            statusClass += ' ready';
        } else {
            statusText = 'Не готов';
            statusClass += ' not-ready';
        }

        playerInfoDiv.innerHTML = `
            <span class="name">${player.phoneNumber}</span>
            <span class="${statusClass}">${statusText}</span>
        `;

        if (currentRoom.isGameStarted && player.hand && player.hand.length > 0) {
            const handDiv = document.createElement('div');
            handDiv.className = 'hand-display';
            handDiv.innerHTML = player.hand.map(card => `<div class="card">${card.rank}${getSuitSymbol(card.suit)}</div>`).join('');
            playerInfoDiv.appendChild(handDiv);
        }
        if (playerDisplayArea) playerDisplayArea.appendChild(playerInfoDiv);
    });

    if (!gameMessageDiv) return;

    if (currentRoom.isGameStarted) {
        gameMessageDiv.textContent = "Игра началась! Расставьте карты (логика расстановки не реализована).";
    } else {
        const readyPlayersCount = currentRoom.players.filter(p => p.isReady).length;
        if (currentRoom.players.length < MAX_PLAYERS_PER_ROOM) {
            gameMessageDiv.textContent = `Ожидание игроков... (${currentRoom.players.length}/${MAX_PLAYERS_PER_ROOM} в комнате, ${readyPlayersCount} готовы)`;
        } else { // Комната полная (4 игрока)
            if (readyPlayersCount < MAX_PLAYERS_PER_ROOM) {
                gameMessageDiv.textContent = `Ожидание готовности всех игроков... (${readyPlayersCount}/${MAX_PLAYERS_PER_ROOM} готовы)`;
            } else {
                // Это состояние не должно долго длиться, так как игра должна начаться
                gameMessageDiv.textContent = `Все готовы! Игра начинается...`;
            }
        }
    }

    const localPlayerInRoom = currentRoom.players.find(p => p.phoneNumber === currentPlayer.phoneNumber);
    if (localPlayerInRoom && readyButton) {
        readyButton.textContent = localPlayerInRoom.isReady ? "Отменить готовность" : "Готов";
        readyButton.disabled = currentRoom.isGameStarted || (localPlayerInRoom.isAI && currentRoom.isGameStarted); // AI не может отменить готовность, если игра не идет
         aiTrusteeButton.disabled = currentRoom.isGameStarted;
    } else if (readyButton) {
        readyButton.textContent = "Готов"; // По умолчанию, если игрок не в комнате
    }
}


function getSuitSymbol(suit) {
    const symbols = { 'hearts': '♥', 'diamonds': '♦', 'clubs': '♣', 'spades': '♠', // Eng
                      'Hearts': '♥', 'Diamonds': '♦', 'Clubs': '♣', 'Spades': '♠' }; // Eng Capitalized
    return symbols[suit] || suit.charAt(0);
}


// --- Player Actions ---
function handleRegister() {
    const phoneNumberInput = document.getElementById('phoneNumber');
    const registrationMessage = document.getElementById('registrationMessage');

    if (!phoneNumberInput || !registrationMessage) {
        console.error("Элементы формы регистрации не найдены!");
        return;
    }
    const phoneNumber = phoneNumberInput.value.trim();

    if (!phoneNumber) {
        registrationMessage.textContent = 'Введите имя/телефон.';
        registrationMessage.className = 'message error';
        return;
    }

    currentPlayer = {
        phoneNumber: phoneNumber,
        isAI: false,
        isReady: false
    };
    console.log("Игрок зарегистрирован:", JSON.parse(JSON.stringify(currentPlayer)));
    registrationMessage.textContent = `Добро пожаловать, ${phoneNumber}! Выберите комнату.`;
    registrationMessage.className = 'message success';

    if (registrationArea) registrationArea.style.display = 'none';
    if (roomSelectionArea) roomSelectionArea.style.display = 'block';
    renderRoomSelection();
}

function joinRoom(roomId) {
    if (!currentPlayer) {
        alert("Сначала зарегистрируйтесь!");
        return;
    }
    console.log(`[${currentPlayer.phoneNumber}] Попытка войти в комнату ID: ${roomId}`);

    const roomToJoin = rooms.find(r => r.id === roomId);
    if (!roomToJoin) {
        alert("Комната не существует!");
        console.error(`Комната с ID ${roomId} не найдена в массиве rooms:`, rooms);
        return;
    }
    if (roomToJoin.players.length >= MAX_PLAYERS_PER_ROOM && !roomToJoin.players.some(p => p.phoneNumber === currentPlayer.phoneNumber)) {
        alert("Комната полна!");
        return;
    }
    if (roomToJoin.isGameStarted) {
        alert("Игра уже началась, вход невозможен!");
        return;
    }

    // Если игрок уже в этой комнате (например, обновил страницу или переключился)
    if (roomToJoin.players.some(p => p.phoneNumber === currentPlayer.phoneNumber)) {
        console.log(`[${currentPlayer.phoneNumber}] Уже в комнате ${roomToJoin.name}`);
    } else {
        const playerForRoom = { ...currentPlayer, isReady: false, hand: [], sets: {} };
        roomToJoin.players.push(playerForRoom);
        console.log(`[${currentPlayer.phoneNumber}] Вошел в комнату ${roomToJoin.name}. Игроки сейчас:`, JSON.parse(JSON.stringify(roomToJoin.players)));
    }

    currentRoom = roomToJoin; // Устанавливаем текущую комнату для этого клиента

    if (roomSelectionArea) roomSelectionArea.style.display = 'none';
    if (gameArea) gameArea.style.display = 'block';

    updatePlayerDisplayAndMessages();
    renderRoomSelection(); // Обновить список комнат (счетчики игроков)
}

function handleLeaveRoom() {
    if (!currentRoom || !currentPlayer) return;
    console.log(`[${currentPlayer.phoneNumber}] Покидает комнату ${currentRoom.name}`);

    currentRoom.players = currentRoom.players.filter(p => p.phoneNumber !== currentPlayer.phoneNumber);

    if (currentPlayer.isAI) {
        currentPlayer.isAI = false; 
    }
    currentPlayer.isReady = false;

    const roomLeftName = currentRoom.name;
    currentRoom = null; 

    if (gameArea) gameArea.style.display = 'none';
    if (roomSelectionArea) roomSelectionArea.style.display = 'block';
    renderRoomSelection(); 

    alert(`Вы покинули комнату ${roomLeftName}`);
    if (gameMessageDiv) gameMessageDiv.textContent = 'Пожалуйста, войдите в комнату и приготовьтесь.';
}


function handleReadyToggle() {
    if (!currentRoom || !currentPlayer) {
        alert("Сначала войдите в комнату!");
        return;
    }

    const playerInRoom = currentRoom.players.find(p => p.phoneNumber === currentPlayer.phoneNumber);
    if (!playerInRoom) {
        console.error(`[${currentPlayer.phoneNumber}] Не найден в списке игроков текущей комнаты!`, currentRoom.players);
        alert("Произошла ошибка, перезайдите в комнату.");
        return;
    }

    if (playerInRoom.isAI) {
        alert("AI всегда готов и не может изменить статус вручную.");
        return;
    }

    playerInRoom.isReady = !playerInRoom.isReady;
    console.log(`[${currentPlayer.phoneNumber}] Статус готовности изменен на: ${playerInRoom.isReady}`);

    updatePlayerDisplayAndMessages(); // Обновить отображение немедленно
    checkAndStartGame(); // Затем проверить, можно ли начать игру
}

function handleAiTrusteeToggle() {
    if (!currentRoom || !currentPlayer) {
        alert("Сначала войдите в комнату для использования AI!");
        return;
    }

    const playerInRoom = currentRoom.players.find(p => p.phoneNumber === currentPlayer.phoneNumber);
    if (!playerInRoom) {
        console.error(`[${currentPlayer.phoneNumber}] AI Toggle: Не найден в комнате!`);
        return;
    }

    playerInRoom.isAI = !playerInRoom.isAI;
    currentPlayer.isAI = playerInRoom.isAI; // Синхронизация с глобальным currentPlayer (для этой вкладки)

    if (playerInRoom.isAI) {
        playerInRoom.isReady = true; // AI всегда готов
        alert(`${playerInRoom.phoneNumber} переключен на AI и автоматически готов.`);
        console.log(`[${currentPlayer.phoneNumber}] Переключен на AI. Готов: ${playerInRoom.isReady}`);
    } else {
        // Игрок вернул контроль, его статус готовности может быть сброшен
        playerInRoom.isReady = false; // Пусть нажмет "Готов" снова
        alert(`${playerInRoom.phoneNumber} отменил AI. Пожалуйста, подтвердите готовность.`);
        console.log(`[${currentPlayer.phoneNumber}] Отменил AI. Готов: ${playerInRoom.isReady}`);
    }
     currentPlayer.isReady = playerInRoom.isReady;


    updatePlayerDisplayAndMessages();
    checkAndStartGame();
}

// --- Game Logic Flow ---
function checkAndStartGame() {
    if (!currentRoom || currentRoom.isGameStarted) {
        // console.log("Проверка начала игры: комната не существует или игра уже идет.");
        return;
    }

    const totalPlayersInRoom = currentRoom.players.length;
    const readyPlayersCount = currentRoom.players.filter(p => p.isReady).length;

    console.log(`[${currentPlayer?.phoneNumber || 'N/A'}] Проверка начала игры в комнате ${currentRoom.id}: Всего игроков ${totalPlayersInRoom}, Готовых ${readyPlayersCount}`);

    if (totalPlayersInRoom === MAX_PLAYERS_PER_ROOM && readyPlayersCount === MAX_PLAYERS_PER_ROOM) {
        console.log(`[${currentPlayer?.phoneNumber || 'N/A'}] Условия для начала игры выполнены в комнате ${currentRoom.id}!`);
        startGame();
    } else {
        console.log(`[${currentPlayer?.phoneNumber || 'N/A'}] Условия для начала игры НЕ выполнены.`);
        // Сообщение обновится через updatePlayerDisplayAndMessages, если оно вызывается после этой проверки
    }
}

function startGame() {
    if (!currentRoom || currentRoom.isGameStarted) return; 

    console.log(`!!! [${currentPlayer?.phoneNumber || 'N/A'}] ИГРА НАЧИНАЕТСЯ в комнате ${currentRoom.name} !!!`);
    currentRoom.isGameStarted = true;

    const deck = createDeck();
    shuffleDeck(deck);

    currentRoom.players.forEach(player => {
        player.hand = dealCards(deck, 13);
        player.sets = { front: [], middle: [], back: [] }; 
        if (player.isAI) {
            arrangeAICards(player); // AI сразу расставляет карты (простая логика)
            console.log(`AI ${player.phoneNumber} расставил карты.`);
        }
    });

    updatePlayerDisplayAndMessages(); 
    renderRoomSelection(); 
    if (readyButton) readyButton.disabled = true; 
    if (aiTrusteeButton) aiTrusteeButton.disabled = true;
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Проверка наличия всех основных элементов перед назначением слушателей
    if (!registerButton) console.error("Кнопка 'registerButton' не найдена!");
    if (!readyButton) console.error("Кнопка 'readyButton' не найдена!");
    if (!aiTrusteeButton) console.error("Кнопка 'aiTrusteeButton' не найдена!");
    if (!leaveRoomButton) console.error("Кнопка 'leaveRoomButton' не найдена!");

    initializeRooms(); 

    if (registerButton) registerButton.addEventListener('click', handleRegister);
    if (readyButton) readyButton.addEventListener('click', handleReadyToggle);
    if (aiTrusteeButton) aiTrusteeButton.addEventListener('click', handleAiTrusteeToggle);
    if (leaveRoomButton) leaveRoomButton.addEventListener('click', handleLeaveRoom);

    if (registrationArea) registrationArea.style.display = 'block';
    if (roomSelectionArea) roomSelectionArea.style.display = 'none';
    if (gameArea) gameArea.style.display = 'none';
});
