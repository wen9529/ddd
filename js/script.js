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

// DEBUG: Log an DOM element to check if they are correctly fetched
console.log("DOM Element Check: aiFrontDiv is", aiFrontDiv);
console.log("DOM Element Check: aiMiddleDiv is", aiMiddleDiv);
console.log("DOM Element Check: aiBackDiv is", aiBackDiv);
console.log("DOM Element Check: player1HandDiv is", player1HandDiv);


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
    if (card.rank === 'back') {
        imageName = `back${IMAGE_EXT}`;
    } else {
        imageName = `${card.rank}_of_${card.suit}${IMAGE_EXT}`;
    }
    cardDiv.style.backgroundImage = `url(${IMAGE_PATH}${imageName})`;
    cardDiv.dataset.cardId = card.id;
    cardDiv.cardData = card;

    if (isInteractive && card.rank !== 'back') {
        cardDiv.addEventListener('click', () => handleCardClick(cardDiv));
    }
    return cardDiv;
}

function renderPlayerHand() {
    if (!player1HandDiv) {
        console.error("Error: player1HandDiv is not found!");
        return;
    }
    player1HandDiv.innerHTML = '';
    const sortedHandForDisplay = sortCards(player1Hand, false).reverse();
    sortedHandForDisplay.forEach(card => {
        player1HandDiv.appendChild(createCardElement(card));
    });
}

function renderPlayerSets() {
    const setDivs = { front: player1FrontDiv, middle: player1MiddleDiv, back: player1BackDiv };
    for (const setName in player1Sets) {
        if (setDivs[setName]) {
            setDivs[setName].innerHTML = '';
            const sortedSetForDisplay = sortCards(player1Sets[setName]).reverse();
            sortedSetForDisplay.forEach(card => {
                setDivs[setName].appendChild(createCardElement(card));
            });
        } else {
            console.error(`Error: Player set div for '${setName}' is not found!`);
        }
    }
    updateConfirmButtonState();
}

function renderAISets(showCards = false) {
    const setDivs = { front: aiFrontDiv, middle: aiMiddleDiv, back: aiBackDiv };
    // console.log("Inside renderAISets. setDivs:", setDivs, "aiCurrentSets:", JSON.parse(JSON.stringify(aiCurrentSets))); // Deep copy for logging

    for (const setName in aiCurrentSets) { // aiCurrentSets should be an object like {front: [], middle: [], back: []}
        const targetDiv = setDivs[setName];
        // console.log(`Processing AI set '${setName}'. Target DIV:`, targetDiv);

        if (targetDiv) { // <<<< KEY MODIFICATION: Check if the div exists
            targetDiv.innerHTML = ''; // This was the line causing error if targetDiv is null
            if (aiCurrentSets[setName] && aiCurrentSets[setName].length > 0) {
                if (showCards) {
                    const sortedSetForDisplay = sortCards(aiCurrentSets[setName]).reverse();
                    sortedSetForDisplay.forEach(card => {
                        targetDiv.appendChild(createCardElement(card, false));
                    });
                } else { // Show card backs during arrangement phase
                    for (let i = 0; i < aiCurrentSets[setName].length; i++) {
                        targetDiv.appendChild(createCardElement({ rank: 'back', suit: '', id: `back-${setName}-${i}` }, false));
                    }
                }
            }
        } else {
            console.error(`Error: AI set div for '${setName}' is undefined or null. Check HTML ID or JS variable.`);
        }
    }
}


// --- Player Interaction Logic ---
function handleCardClick(cardElement) {
    if (gamePhase !== 'arranging' || !cardElement || !cardElement.cardData) return;

    const cardData = cardElement.cardData;
    const parentElement = cardElement.parentElement;

    if (!parentElement) return;

    if (parentElement.classList.contains('hand-display')) {
        if (cardElement.classList.contains('selected')) {
            cardElement.classList.remove('selected');
            selectedCardsFromHand = selectedCardsFromHand.filter(item => item.data.id !== cardData.id);
        } else {
            cardElement.classList.add('selected');
            selectedCardsFromHand.push({ element: cardElement, data: cardData });
        }
    } else if (parentElement.classList.contains('card-set')) {
        const setName = parentElement.dataset.setname;
        if (!setName || !player1Sets[setName]) return;

        player1Sets[setName] = player1Sets[setName].filter(c => c.id !== cardData.id);
        player1Hand.push(cardData);

        clearHandSelections();
        renderPlayerHand();
        renderPlayerSets();
    }
}

function handleSetClick(setName) {
    if (gamePhase !== 'arranging' || selectedCardsFromHand.length === 0 || !player1Sets[setName]) {
         if (gamePhase === 'arranging' && selectedCardsFromHand.length > 0 && !player1Sets[setName]) {
            console.error(`Player set '${setName}' does not exist in player1Sets object.`);
        }
        return;
    }

    const targetSetArray = player1Sets[setName];
    const maxCards = (setName === 'front') ? 3 : 5;
    let cardsMovedCount = 0; // To keep track of how many cards are actually moved in this operation

    const cardsToKeepInHand = [];
    const cardsToMoveToSet = [];

    // First, separate cards to move vs keep (to avoid modifying player1Hand while iterating)
    for (const item of selectedCardsFromHand) {
        if (targetSetArray.length + cardsMovedCount < maxCards) {
            cardsToMoveToSet.push(item.data);
            cardsMovedCount++;
        } else {
            messageArea.textContent = `${setName === 'front' ? '头' : setName === 'middle' ? '中' : '尾'}道最多只能放 ${maxCards} 张牌！`;
            cardsToKeepInHand.push(item.data); // This card stays in hand
        }
    }

    // Add selected cards to the target set
    cardsToMoveToSet.forEach(cardData => {
        targetSetArray.push(cardData);
    });

    // Remove moved cards from player's hand
    const movedCardIds = new Set(cardsToMoveToSet.map(c => c.id));
    player1Hand = player1Hand.filter(card => !movedCardIds.has(card.id));

    clearHandSelections();
    renderPlayerHand();
    renderPlayerSets();
}

function clearHandSelections() {
    if (player1HandDiv) {
        player1HandDiv.querySelectorAll('.card.selected').forEach(el => el.classList.remove('selected'));
    }
    selectedCardsFromHand = [];
}

function updateConfirmButtonState() {
    if (!confirmArrangementButton) {
        console.error("Error: confirmArrangementButton not found!");
        return;
    }
    const totalSetCards = (player1Sets.front?.length || 0) + (player1Sets.middle?.length || 0) + (player1Sets.back?.length || 0);
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
    if (!messageArea || !startGameButton || !confirmArrangementButton) {
        console.error("Crucial UI elements missing, cannot start game.");
        return;
    }
    gamePhase = 'dealing';
    messageArea.textContent = "正在发牌...";
    startGameButton.textContent = "重新开始";
    confirmArrangementButton.style.display = 'none';
    confirmArrangementButton.disabled = true;

    fullDeck = createDeck();
    fullDeck = shuffleDeck(fullDeck);

    player1Hand = dealCards(fullDeck, 13);
    aiHand = dealCards(fullDeck, 13);

    player1Sets = { front: [], middle: [], back: [] };
    clearHandSelections();
    renderPlayerHand();
    renderPlayerSets();

    aiCurrentSets = aiArrangeCards(aiHand); // AI arranges cards
    // console.log("AI arranged sets in startGame:", JSON.parse(JSON.stringify(aiCurrentSets)));
    renderAISets(false); // Render AI sets (initially with backs)

    const playerSpecialHand = checkSpecial13CardHands(player1Hand);
    if (playerSpecialHand) {
        messageArea.innerHTML = `玩家拿到特殊牌型: <strong>${playerSpecialHand.typeName}</strong>! <br>本局按特殊牌型计分。`;
        // Consider ending game or specific scoring here
    }
    const aiSpecialHand = checkSpecial13CardHands(aiHand);
    if (aiSpecialHand) {
        messageArea.innerHTML += `<br>AI拿到特殊牌型: <strong>${aiSpecialHand.typeName}</strong>!`;
        // Consider ending game or specific scoring here
    }

    if (!playerSpecialHand && !aiSpecialHand) {
        messageArea.textContent = "请摆牌。点击手牌选择，再点击目标牌墩（头/中/尾）放置。";
    }
    gamePhase = 'arranging';
    updateConfirmButtonState();
}

function confirmArrangement() {
    if (gamePhase !== 'arranging' || !messageArea || !confirmArrangementButton) return;

    const validationMessage = validateArrangement(player1Sets);
    if (validationMessage !== true) {
        messageArea.textContent = `摆牌无效: ${validationMessage}。请调整。`;
        return;
    }

    gamePhase = 'scoring';
    confirmArrangementButton.disabled = true;
    messageArea.innerHTML = "正在比牌和计分...<br>";

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

    renderAISets(true); // Show AI's actual cards

    const scoreResults = calculateScores(playerSetsData, aiCurrentSets); // aiCurrentSets already has types

    messageArea.innerHTML += `
        玩家: 头-${playerSetsData.types.front.typeName}, 中-${playerSetsData.types.middle.typeName}, 尾-${playerSetsData.types.back.typeName}<br>
        AI: 头-${aiCurrentSets.types.front.typeName}, 中-${aiCurrentSets.types.middle.typeName}, 尾-${aiCurrentSets.types.back.typeName}<hr>
    `;
    scoreResults.messages.forEach(msg => messageArea.innerHTML += `${msg}<br>`);

    gamePhase = 'ended';
    if (startGameButton) startGameButton.textContent = "开始新一局";
}


// --- Event Listeners ---
if (startGameButton) startGameButton.addEventListener('click', startGame);
if (confirmArrangementButton) confirmArrangementButton.addEventListener('click', confirmArrangement);

if (player1FrontDiv) player1FrontDiv.addEventListener('click', () => handleSetClick('front'));
if (player1MiddleDiv) player1MiddleDiv.addEventListener('click', () => handleSetClick('middle'));
if (player1BackDiv) player1BackDiv.addEventListener('click', () => handleSetClick('back'));

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // It's good practice to ensure DOM is fully loaded, though modules defer by default.
    // You can add any game initialization logic here if needed,
    // but startGameButton click is the main entry point now.
    if (!player1HandDiv || !player1FrontDiv || !player1MiddleDiv || !player1BackDiv ||
        !aiFrontDiv || !aiMiddleDiv || !aiBackDiv ||
        !startGameButton || !confirmArrangementButton || !messageArea) {
        console.error("One or more critical DOM elements are missing. Check HTML IDs and script.js element fetching.");
        if (messageArea) messageArea.textContent = "错误：游戏界面元素加载失败，请检查控制台！";
    } else {
        console.log("All critical DOM elements seem to be loaded.");
    }
});
