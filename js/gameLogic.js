// js/gameLogic.js

export function createDeck() {
    const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
    const deck = [];

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank });
        }
    }
    return deck;
}

export function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export function dealCards(deck, numCards) {
    return deck.splice(0, numCards);
}

// 牌型判断逻辑（示例）
// 这里你可以添加具体的牌型逻辑。
export function getHandType(hand) {
    // 这里可实现不同牌型的判断
    return "普通牌型"; // 仅为示例
}

// 比较牌型
export function compareHandTypes(type1, type2) {
    // 这里需要根据实际的牌型定义进行比较
    return 0; // 0 平局，正数 当前牌型胜，负数 对手胜
}

// 计分逻辑
export function calculateScores(players) {
    const scores = players.map(player => ({
        player,
        score: Math.floor(Math.random() * 10) // 随机生成分数示例，以后可以替换为具体逻辑
    }));
    return scores;
}
