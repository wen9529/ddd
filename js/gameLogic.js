// js/gameLogic.js
import { createDeck, shuffleDeck, dealCards } from './deck.js';
import { getHandType, compareHandTypes } from './hand.js';

let deck = [];
let player1Hand = [];
let player1Sets = { front: [], middle: [], back: [] }; // 玩家摆好的牌墩
let aiSets = { front: [], middle: [], back: [] }; // AI的牌墩

export function startNewGame() {
    deck = createDeck();
    deck = shuffleDeck(deck);
    player1Hand = dealCards(deck, 13);
    // AI 同样获取手牌并处理...
}

// 检查玩家的摆牌逻辑
export function checkArrangement() {
    // 检查逻辑
}

// 计分与比较函数
export function scoreComparison(playerSets, aiSets) {
    // 计分逻辑...
}
