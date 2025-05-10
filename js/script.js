// js/script.js
import { createDeck, shuffleDeck, dealCards, compareHandTypes, calculateScores } from './gameLogic.js';

const MAX_ROOMS = 5;
const MAX_PLAYERS_PER_ROOM = 4; // 最大玩家数

// 存储所有房间信息的数组
let rooms = [];

// 当前用户和当前所在的房间
let currentPlayer = null;
let currentRoom = null;

// --- 房间和玩家数据结构 ---
// 每个房间对象包含: id, players[], isFull, isStarted, playersReady[] (用于记录玩家是否完成摆牌)

// players: [], // 房间内的玩家列表
// 初始化房间列表的显示
function initRooms() {
    const roomsContainer = document.getElementById('rooms');
    roomsContainer.innerHTML = '';

    rooms.forEach(room => {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room';
        roomDiv.innerHTML = `
            当前玩家: ${room.players.map(player => player.phoneNumber).join(', ') || '暂无玩家'}<br>
            状态: ${room.isStarted ? '游戏中' : (room.isFull ? '已满' : '等待中')}<br>

            当前人数: ${room.players.length}/${MAX_PLAYERS_PER_ROOM}<br>
            <button ${room.isFull ? 'disabled' : ''} onclick="joinRoom(${room.id})">加入</button>
        `;
        roomsContainer.appendChild(roomDiv);
    });
}

// --- 用户交互函数 ---
// 玩家注册功能

// Register Player
function registerPlayer() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;
    const registrationMessage = document.getElementById('registrationMessage');

    if (phoneNumber && password) {
        currentPlayer = { phoneNumber, password, isAI: false, isReady: false };
        registrationMessage.textContent = '注册成功！';
    } else {
        registrationMessage.textContent = '请输入手机号和密码！';
    }
}

// Create Room - 创建房间
function createRoom() {
    // 添加对 currentPlayer 的检查
    if (!currentPlayer) {
        document.getElementById('messageArea').textContent = '请先注册用户才能创建房间！';
        return;
    }
    const newRoomId = rooms.length > 0 ? Math.max(...rooms.map(room => room.id)) + 1 : 1;
    const newRoom = {
        id: newRoomId,
        players: [],
        isFull: false,
        isStarted: false,
 playersReady: [], // 用于记录玩家是否完成摆牌
    };
    rooms.push(newRoom);
    initRooms(); // 更新房间列表
}

// Join Room - 加入房间
function joinRoom(roomId) {
    // 添加对 currentPlayer 的检查
    // 确保用户已经注册才能加入房间
    if (!currentPlayer) {
        document.getElementById('messageArea').textContent = '请先注册用户！';
        return;
    }
    document.getElementById('messageArea').textContent = ''; // 清空之前的消息

    // 查找目标房间
    currentRoom = rooms.find(room => room.id === roomId);

    if (currentRoom.players.length < MAX_PLAYERS_PER_ROOM) {
        // 将当前玩家添加到房间玩家列表
        currentRoom.players.push(currentPlayer);

        document.getElementById('messageArea').textContent = `成功加入房间 ${currentRoom.id}`;
        // 切换到游戏区域
        document.getElementById('room-selection').style.display = 'none';
        document.getElementById('game-area').style.display = 'block';
        document.getElementById('player-area').innerHTML = `欢迎 ${currentPlayer.phoneNumber} 到房间 ${currentRoom.id}`;

        // TODO: 根据游戏阶段显示不同的界面
        // 在进入房间后隐藏初始游戏区域，准备显示摆牌界面
        document.getElementById('game-area').style.display = 'none';

        initRooms(); // 更新房间列表
    } else {
        document.getElementById('messageArea').textContent = '房间已满，请选择其他房间。';
    }
}

// TODO: 实现离开房间功能
// Leave Room - 离开房间 (可选功能，根据需要添加)
function leaveRoom() {
    if (currentRoom && currentPlayer) {
        currentRoom.players = currentRoom.players.filter(player => player.phoneNumber !== currentPlayer.phoneNumber);
        // 如果房间为空，移除房间 (根据需求决定是否自动移除)
        if (currentRoom.players.length === 0) {
            rooms = rooms.filter(room => room.id !== currentRoom.id);
        }
        currentRoom = null;
        document.getElementById('messageArea').textContent = '已离开房间';
        document.getElementById('room-selection').style.display = 'block';
        document.getElementById('game-area').style.display = 'none';
        initRooms(); // 更新房间列表
    } else {
        document.getElementById('messageArea').textContent = '房间已满，请选择其他房间。';
    }
}

// --- 游戏核心逻辑函数 ---

// Start Game
// 开始游戏，发牌并显示玩家手牌
function startGame() {
    if (!currentRoom || currentRoom.isStarted) {
        alert("游戏已经开始或没有选择房间！");
        document.getElementById('messageArea').textContent = '游戏已经开始或没有选择房间！';
        return;
    }
    // 注释掉需要4名玩家才能开始游戏的限制，方便测试
    // if (currentRoom.players.length < MAX_PLAYERS_PER_ROOM) {
    //     document.getElementById('messageArea').textContent = '需要4名玩家才能开始游戏。';
    //     return;
    // }

    const deck = createDeck();
    shuffleDeck(deck);

    currentRoom.players.forEach(player => {
        player.hand = dealCards(deck, 13);
        player.sets = { front: [], middle: [], back: [] }; // 玩家的摆牌
        player.status = "游戏中"; // 玩家状态
    });

    currentRoom.isStarted = true; // 设置房间为已开始状态
    // renderPlayerHands(); // 游戏开始时不再直接渲染到player-area
    document.getElementById('messageArea').textContent = "游戏开始！请摆牌。";

    // 显示玩家摆牌界面
    document.getElementById('game-area').style.display = 'none'; // 隐藏游戏区域的初始内容
    document.getElementById('player-hand-area').style.display = 'flex'; // 显示玩家手牌区域
    document.getElementById('player-sets-area').style.display = 'flex'; // 显示玩家摆牌区域
}

// TODO: 隐藏摆牌界面
// function hideSetArea() {}

// Render Player Hands - 渲染玩家手牌
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

    // 渲染当前玩家的手牌到摆牌区域
    renderCurrentPlayerHand();
}

// Render Current Player Hand - 渲染当前玩家的手牌到摆牌区域
function renderCurrentPlayerHand() {
    const playerHandArea = document.getElementById('player-hand-area');
    playerHandArea.innerHTML = ''; // 清空之前的内容

    if (currentPlayer && currentPlayer.hand) {
        currentPlayer.hand.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.textContent = `${card.rank} of ${card.suit}`;
            cardDiv.draggable = true; // 使卡牌可拖拽
            cardDiv.dataset.rank = card.rank; // 存储牌面信息
            cardDiv.dataset.suit = card.suit; // 存储花色信息

            // 添加拖拽事件监听器
            cardDiv.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/plain', JSON.stringify({ rank: card.rank, suit: card.suit }));
            });

            playerHandArea.appendChild(cardDiv);
        });
    }

    // 添加放置区域的拖拽事件监听器
    ['front-set', 'middle-set', 'back-set'].forEach(setId => {
        const setArea = document.getElementById(setId);
        setArea.addEventListener('dragover', (event) => {
            event.preventDefault(); // 允许放置
        });

        setArea.addEventListener('drop', (event) => {
            event.preventDefault();
            const cardData = JSON.parse(event.dataTransfer.getData('text/plain'));
            // 在放置区域显示卡牌 (这里只是简单显示，实际需要处理添加到玩家摆牌数据结构)

            // 检查放置区域是否已满
            const maxCards = setId === 'front-set' ? 3 : 5;
 if (setArea.children.length >= maxCards) {
 document.getElementById('messageArea').textContent = `${setId === 'front-set' ? '前墩' : setId === 'middle-set' ? '中墩' : '后墩'}已满！`;
                return;
            }

            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.textContent = `${cardData.rank} of ${cardData.suit}`;
            cardDiv.dataset.rank = cardData.rank;
            cardDiv.dataset.suit = cardData.suit;

            // 从手牌区域移除被拖拽的卡牌 (需要找到对应的卡牌元素并移除)
            const handCards = playerHandArea.children;
            for (let i = 0; i < handCards.length; i++) {
                if (handCards[i].dataset.rank === cardData.rank && handCards[i].dataset.suit === cardData.suit) {
                    playerHandArea.removeChild(handCards[i]);
                    break;
                }
            }
            // 添加到对应的墩
            setArea.appendChild(cardDiv);
        });
    });
}

// Prepare Player - 玩家准备
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

// Confirm Sets - 玩家确认摆牌
function confirmSets() {
    if (!currentPlayer || !currentRoom) {
        document.getElementById('messageArea').textContent = '请先加入房间！';
        return;
    }

    const frontSetDiv = document.getElementById('front-set');
    const middleSetDiv = document.getElementById('middle-set');
    const backSetDiv = document.getElementById('back-set');

    // 检查玩家是否摆满13张牌到三个墩中
    if (frontSetDiv.children.length !== 3 || middleSetDiv.children.length !== 5 || backSetDiv.children.length !== 5) {
        document.getElementById('messageArea').textContent = '请将所有13张牌摆放到前、中、后三个墩中！';
        return;
    }

    // 收集玩家的摆牌结果
    const playerSets = {
        front: Array.from(frontSetDiv.children).map(cardDiv => ({ rank: cardDiv.dataset.rank, suit: cardDiv.dataset.suit })),
        middle: Array.from(middleSetDiv.children).map(cardDiv => ({ rank: cardDiv.dataset.rank, suit: cardDiv.dataset.suit })),
        back: Array.from(backSetDiv.children).map(cardDiv => ({ rank: cardDiv.dataset.rank, suit: cardDiv.dataset.suit })),
    };

    // 将玩家的摆牌结果存储到 currentPlayer 对象中
    currentPlayer.sets = playerSets;
    currentPlayer.isReady = true; // 标记玩家已完成摆牌

    document.getElementById('messageArea').textContent = '您已完成摆牌，等待其他玩家...';
    document.getElementById('confirmSetsButton').disabled = true; // 禁用确认按钮

    // 检查是否所有玩家都已完成摆牌
    const allPlayersReadyForSets = currentRoom.players.every(player => player.isReady);

    if (allPlayersReadyForSets) {
 document.getElementById('messageArea').textContent = '所有玩家已完成摆牌，开始比较牌型！';
        // TODO: 进入牌型比较和计分阶段
        // hideSetArea(); // 隐藏摆牌区域
        // Show all players' sets and compare
        startShowdown();
    }
}

// AI Trustee - AI 托管
function aiTrustee() {
    if (!currentPlayer) {
        document.getElementById('messageArea').textContent = '请先注册或登录！';
        return;
    }

    if (!currentPlayer.hand || currentPlayer.hand.length === 0) {
        document.getElementById('messageArea').textContent = '您没有手牌可供托管！';
        return;
    }

    document.getElementById('messageArea').textContent = 'AI 正在为你自动摆牌...';
    // 调用 gameLogic.js 中的 aiTrustee 函数进行摆牌
    const aiSets = aiTrustee(currentPlayer.hand);

    // 将 AI 摆牌结果显示在玩家摆牌区域 (这部分需要更复杂的DOM操作来更新界面)
    // 简单的做法是直接存储结果并标记玩家已完成摆牌
    currentPlayer.sets = aiSets;
    currentPlayer.isReady = true; // 标记玩家已完成摆牌

    document.getElementById('messageArea').textContent = 'AI 已为你完成摆牌，等待其他玩家...';
    document.getElementById('confirmSetsButton').disabled = true; // 禁用确认按钮

    // 检查是否所有玩家都已完成摆牌
    const allPlayersReadyForSets = currentRoom.players.every(player => player.isReady);

    if (allPlayersReadyForSets) {
        document.getElementById('messageArea').textContent = '所有玩家已完成摆牌，开始比较牌型！';
        startShowdown();
    }
}

// Show AI Suggestion - 显示 AI 建议
function showAISuggestion() {
    if (!currentPlayer) {
        document.getElementById('messageArea').textContent = '请先注册或登录！';
        return;
    }

    if (!currentPlayer.hand || currentPlayer.hand.length === 0) {
        document.getElementById('messageArea').textContent = '您没有手牌可供建议！';
        return;
    }

    document.getElementById('messageArea').textContent = 'AI 正在生成摆牌建议...';

    // 调用 gameLogic.js 中的逻辑生成建议 (这里可以复用 aiTrustee 或创建一个新的建议函数)
    // 假设 aiTrustee 也能用于生成建议
    const aiSuggestedSets = aiTrustee(currentPlayer.hand);

    // 在界面上显示 AI 的建议 (这部分需要更复杂的DOM操作来显示建议的牌型)
    // 可以在 messageArea 或一个新的区域显示
    let suggestionHTML = '<br>AI 建议摆牌：<br>';
    suggestionHTML += `前墩: ${aiSuggestedSets.front.map(card => `${card.rank}${card.suit}`).join(', ')}<br>`;
    suggestionHTML += `中墩: ${aiSuggestedSets.middle.map(card => `${card.rank}${card.suit}`).join(', ')}<br>`;
    suggestionHTML += `后墩: ${aiSuggestedSets.back.map(card => `${card.rank}${card.suit}`).join(', ')}<br>`;

    document.getElementById('messageArea').innerHTML += suggestionHTML;
}


// Start Showdown - 开始摊牌和比较
function startShowdown() {
    if (!currentRoom) return;

    document.getElementById('messageArea').textContent = '开始比较牌型和计算分数...';

    // 隐藏摆牌界面
    document.getElementById('player-hand-area').style.display = 'none';
    document.getElementById('player-sets-area').style.display = 'none';

    // TODO: 显示所有玩家的摆牌结果
    renderAllPlayersSets();

    // 进行牌型比较和计算分数
    const scores = calculateScores(currentRoom.players);

    // 显示游戏结果
    displayGameResult(scores);

    // 游戏结束处理
    endGame();
}

// Render All Players Sets - 显示所有玩家的摆牌结果
function renderAllPlayersSets() {
    // TODO: 实现显示所有玩家摆牌的界面逻辑
    const gameArea = document.getElementById('game-area'); // 使用现有的 game-area 或者添加新的区域
    gameArea.innerHTML = '<h3>所有玩家摆牌结果：</h3>';

    currentRoom.players.forEach(player => {
        const playerSetsDiv = document.createElement('div');
        playerSetsDiv.innerHTML = `<strong>${player.phoneNumber} 的摆牌:</strong><br>`;
        playerSetsDiv.innerHTML += `前墩: ${player.sets.front.map(card => `${card.rank}${card.suit}`).join(', ')}<br>`;
        playerSetsDiv.innerHTML += `中墩: ${player.sets.middle.map(card => `${card.rank}${card.suit}`).join(', ')}<br>`;
        playerSetsDiv.innerHTML += `后墩: ${player.sets.back.map(card => `${card.rank}${card.suit}`).join(', ')}<br><br>`;
        gameArea.appendChild(playerSetsDiv);
    });
    // 显示 game-area
    gameArea.style.display = 'block';
    // 隐藏玩家区域的欢迎信息
    document.getElementById('player-area').style.display = 'none';
}

// --- 事件监听器 ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerButton').addEventListener('click', registerPlayer);
    document.getElementById('startGameButton').addEventListener('click', startGame);
    document.getElementById('aiTrusteeButton').addEventListener('click', aiTrustee);
    document.getElementById('readyButton').addEventListener('click', preparePlayer);
    document.getElementById('createRoomButton').addEventListener('click', createRoom); // 添加创建房间按钮的事件监听器
 document.getElementById('aiSuggestionButton').addEventListener('click', showAISuggestion); // 添加 AI 建议按钮的事件监听器
    // document.getElementById('confirmSetsButton').addEventListener('click', confirmSets); // 添加确认摆牌按钮的事件监听器

    // TODO: 为摆牌区域的确认按钮添加事件监听器 (confirmSetsButton 应该在 index.html 的摆牌界面中)

    // TODO: 为重新开始和返回房间按钮添加事件监听器 (这些按钮需要在 index.html 中添加)

    // 初始创建一些房间
    if (rooms.length === 0) {
        for (let i = 1; i <= MAX_ROOMS; i++) {
            rooms.push({ id: i, players: [], isFull: false, isStarted: false, playersReady: [] });
        }
    }

    // Initialize Rooms on Load
    initRooms();
});

// TODO: 在 index.html 中添加显示游戏结果的区域
// Display Game Result - 显示游戏结果
function displayGameResult(scores) {
    document.getElementById('messageArea').textContent = '游戏结果：';
    const resultArea = document.createElement('div');
    resultArea.innerHTML = '<h3>得分详情：</h3>';
    scores.forEach(score => {
        resultArea.innerHTML += `<p>${score.player}: ${score.score} 分</p>`;
    });
    document.getElementById('game-area').appendChild(resultArea); // 在游戏区域显示结果
}

// End Game - 游戏结束处理
function endGame() {
    // TODO: 添加重新开始游戏和返回房间的按钮
    document.getElementById('messageArea').textContent += ' 游戏结束。';
    // 显示重新开始和返回房间的按钮
    // document.getElementById('restartGameButton').style.display = 'block';
    // document.getElementById('returnToRoomButton').style.display = 'block';
}

window.joinRoom = joinRoom; // Expose joinRoom to global scope
window.confirmSets = confirmSets; // Expose confirmSets to global scope for button onclick
window.leaveRoom = leaveRoom; // Expose leaveRoom if needed for a button
