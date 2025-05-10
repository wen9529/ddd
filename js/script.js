// js/script.js
import { createDeck, shuffleDeck, dealCards, IMAGE_PATH, IMAGE_EXT, SUITS } from './deck.js';
import { getHandType, compareHandTypes, sortCards } from './hand.js';
import { aiArrangeCards } from './ai.js';
import { validateArrangement, checkSpecial13CardHands, calculateScores } from './gameLogic.js';

// --- DOM Elements ---
const player1HandDiv = document.getElementById('player1-hand');
const player1FrontDiv = document.getElementById('player1-front');
const player1MiddleDiv = document.getElementById('player1-middle');
const player1BackDiv = document.getElementById('player1-back');

const aiFrontDiv = document.getElementById('ai-front');
const aiMiddleDiv = document.getElementById('ai-middle');
const aiBackDiv = document.getElementById('ai-back');

const startGameButton = document.getElementById('startGameButton');
const confirmArrangementButton = document.getElementById('confirmArrangementButton');
const messageArea = document.getElementById('messageArea');

// --- Game State ---
let fullDeck = [];
let player1Hand = []; // 存放玩家当前手牌数据
let player1Sets = { front: [], middle: [], back: [] }; // 存放玩家各墩牌数据

let aiHand = []; // AI手牌数据
let aiCurrentSets = { front: [], middle: [], back: [] }; // AI摆好的牌墩数据

let selectedCardsFromHand = []; // {element, data}
let gamePhase = 'ended'; // 'dealing', 'arranging', 'scoring', 'ended'

// --- UI Functions ---
function createCardElement(card, isInteractive = true) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    let imageName;
    if (card.rank === 'back') { // 用于显示牌背
        imageName = `back${IMAGE_EXT}`;
    } else {
        imageName = `${card.rank}_of_${card.suit}${IMAGE_EXT}`;
    }
    cardDiv.style.backgroundImage = `url(${IMAGE_PATH}${imageName})`;
    cardDiv.dataset.cardId = card.id; // 存储牌的ID，方便后续操作
    cardDiv.cardData = card; // 将牌数据直接关联到DOM元素

    if (isInteractive && card.rank !== 'back') {
        cardDiv.addEventListener('click', () => handleCardClick(cardDiv));
    }
    return cardDiv;
}

function renderPlayerHand() {
    player1HandDiv.innerHTML = '';
    // 手牌排序显示，方便玩家选择
    const sortedHandForDisplay = sortCards(player1Hand, false).reverse(); // 按点数从大到小，方便看
    sortedHandForDisplay.forEach(card => {
        player1HandDiv.appendChild(createCardElement(card));
    });
}

function renderPlayerSets() {
    const setDivs = { front: player1FrontDiv, middle: player1MiddleDiv, back: player1BackDiv };
    for (const setName in player1Sets) {
        setDivs[setName].innerHTML = '';
        // 牌墩内也排序显示
        const sortedSetForDisplay = sortCards(player1Sets[setName]).reverse();
        sortedSetForDisplay.forEach(card => {
            // 牌墩中的牌也可以点击移回手牌区
            setDivs[setName].appendChild(createCardElement(card));
        });
    }
    updateConfirmButtonState();
}

function renderAISets(showCards = false) {
    const setDivs = { front: aiFrontDiv, middle: aiMiddleDiv, back: aiBackDiv };
    for (const setName in aiCurrentSets) {
        setDivs[setName].innerHTML = '';
        if (showCards && aiCurrentSets[setName].length > 0) {
             const sortedSetForDisplay = sortCards(aiCurrentSets[setName]).reverse();
            sortedSetForDisplay.forEach(card => {
                setDivs[setName].appendChild(createCardElement(card, false)); // AI的牌不可交互
            });
        } else if (aiCurrentSets[setName] && aiCurrentSets[setName].length > 0) { // 摆牌阶段显示牌背
            for (let i = 0; i < aiCurrentSets[setName].length; i++) {
                setDivs[setName].appendChild(createCardElement({ rank: 'back', suit: '', id: `back-${i}` }, false));
            }
        }
    }
}

// --- Player Interaction Logic ---
function handleCardClick(cardElement) {
    if (gamePhase !== 'arranging') return;

    const cardData = cardElement.cardData;
    const parentElement = cardElement.parentElement;

    if (parentElement.classList.contains('hand-display')) { // 点击手牌区的牌
        if (cardElement.classList.contains('selected')) {
            cardElement.classList.remove('selected');
            selectedCardsFromHand = selectedCardsFromHand.filter(item => item.data.id !== cardData.id);
        } else {
            cardElement.classList.add('selected');
            selectedCardsFromHand.push({ element: cardElement, data: cardData });
        }
    } else if (parentElement.classList.contains('card-set')) { // 点击牌墩中的牌，移回手牌
        const setName = parentElement.dataset.setname;
        if (!setName) return;

        // 从牌墩数据中移除
        player1Sets[setName] = player1Sets[setName].filter(c => c.id !== cardData.id);
        // 添加回手牌数据
        player1Hand.push(cardData);

        // 从选中的牌中移除（如果它之前被选中了）
        clearHandSelections();
        // 重新渲染
        renderPlayerHand();
        renderPlayerSets();
    }
}

function handleSetClick(setName) {
    if (gamePhase !== 'arranging' || selectedCardsFromHand.length === 0) return;

    const targetSetArray = player1Sets[setName];
    const maxCards = (setName === 'front') ? 3 : 5;

    let cardsToMoveCount = 0;
    for (const item of selectedCardsFromHand) {
        if (targetSetArray.length + cardsToMoveCount < maxCards) {
            targetSetArray.push(item.data);
            player1Hand = player1Hand.filter(card => card.id !== item.data.id);
            cardsToMoveCount++;
        } else {
            messageArea.textContent = `${setName === 'front' ? '头' : setName === 'middle' ? '中' : '尾'}道最多只能放 ${maxCards} 张牌！`;
            break; // 不再移动更多牌到这个墩
        }
    }

    clearHandSelections();
    renderPlayerHand();
    renderPlayerSets();
}

function clearHandSelections() {
    player1HandDiv.querySelectorAll('.card.selected').forEach(el => el.classList.remove('selected'));
    selectedCardsFromHand = [];
}

function updateConfirmButtonState() {
    const totalSetCards = player1Sets.front.length + player1Sets.middle.length + player1Sets.back.length;
    if (totalSetCards === 13 && gamePhase === 'arranging') {
        confirmArrangementButton.style.display = 'inline-block';
        confirmArrangementButton.disabled = false;
    } else {
        confirmArrangementButton.style.display = 'none';
        confirmArrangementButton.disabled = true;
    }
}

// --- Game Flow ---
function startGame() {
    gamePhase = 'dealing';
    messageArea.textContent = "正在发牌...";
    startGameButton.textContent = "重新开始";
    confirmArrangementButton.style.display = 'none';
    confirmArrangementButton.disabled = true;


    fullDeck = createDeck();
    fullDeck = shuffleDeck(fullDeck);

    player1Hand = dealCards(fullDeck, 13);
    aiHand = dealCards(fullDeck, 13);

    // 重置玩家牌墩数据和显示
    player1Sets = { front: [], middle: [], back: [] };
    clearHandSelections();
    renderPlayerHand();
    renderPlayerSets();

    // AI摆牌 (内部逻辑，暂时不显示其过程)
    aiCurrentSets = aiArrangeCards(aiHand); // AI直接摆好
    renderAISets(false); // AI摆牌阶段显示牌背

    // 检查13张特殊牌型
    const playerSpecialHand = checkSpecial13CardHands(player1Hand);
    if (playerSpecialHand) {
        messageArea.innerHTML = `玩家拿到特殊牌型: <strong>${playerSpecialHand.typeName}</strong>! <br>本局直接按特殊牌型计分 (计分逻辑待细化)。`;
        // TODO: 实现特殊13张牌型的直接计分和结束
        // renderAISets(true); // 显示AI的牌
        // gamePhase = 'ended';
        // return;
    }
    const aiSpecialHand = checkSpecial13CardHands(aiHand);
     if (aiSpecialHand) {
        messageArea.innerHTML += `<br>AI拿到特殊牌型: <strong>${aiSpecialHand.typeName}</strong>!`;
        // renderAISets(true);
        // gamePhase = 'ended';
        // return;
    }


    messageArea.textContent = "请摆牌。点击手牌选择，再点击目标牌墩（头/中/尾）放置。";
    gamePhase = 'arranging';
    updateConfirmButtonState(); // 初始时不应该显示确认按钮，除非是特殊情况
}

function confirmArrangement() {
    if (gamePhase !== 'arranging') return;

    const validationMessage = validateArrangement(player1Sets);
    if (validationMessage !== true) {
        messageArea.textContent = `摆牌无效: ${validationMessage}。请调整。`;
        return;
    }

    gamePhase = 'scoring';
    confirmArrangementButton.disabled = true;
    messageArea.innerHTML = "正在比牌和计分...<br>";

    // 玩家牌型数据
    const playerSetsData = {
        front: [...player1Sets.front],
        middle: [...player1Sets.middle],
        back: [...player1Sets.back],
        types: {
            front: getHandType(player1Sets.front),
            middle: getHandType(player1Sets.middle),
            back: getHandType(player1Sets.back)
        }
    };

    // AI牌型数据已在aiArrangeCards中生成
    // aiCurrentSets 已经包含了 types

    renderAISets(true); // 摊牌，显示AI的真实牌面

    const scoreResults = calculateScores(playerSetsData, aiCurrentSets);

    // 显示牌型信息
    messageArea.innerHTML += `
        玩家: 头-${playerSetsData.types.front.typeName}, 中-${playerSetsData.types.middle.typeName}, 尾-${playerSetsData.types.back.typeName}<br>
        AI: 头-${aiCurrentSets.types.front.typeName}, 中-${aiCurrentSets.types.middle.typeName}, 尾-${aiCurrentSets.types.back.typeName}<hr>
    `;
    scoreResults.messages.forEach(msg => messageArea.innerHTML += `${msg}<br>`);

    gamePhase = 'ended';
    startGameButton.textContent = "开始新一局";
}


// --- Event Listeners ---
startGameButton.addEventListener('click', startGame);
confirmArrangementButton.addEventListener('click', confirmArrangement);

player1FrontDiv.addEventListener('click', () => handleSetClick('front'));
player1MiddleDiv.addEventListener('click', () => handleSetClick('middle'));
player1BackDiv.addEventListener('click', () => handleSetClick('back'));

// --- Initial Setup ---
// (Optional: Add any initial welcome message or setup if needed)
