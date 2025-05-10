// js/hand.js
const HAND_TYPES_STRENGTH = {
    HIGH_CARD: 0,
    ONE_PAIR: 1,
    TWO_PAIR: 2,
    THREE_OF_A_KIND: 3,
    STRAIGHT: 4,
    FLUSH: 5,
    FULL_HOUSE: 6,
    FOUR_OF_A_KIND: 7,
    STRAIGHT_FLUSH: 8,
    DRAGON: 9,
    THREE_STRAIGHTS: 10,
    THREE_FLUSHES: 11,
};

export function isFlush(cards) {
    if (cards.length === 0) return false;
    const firstSuit = cards[0].suit;
    return cards.every(card => card.suit === firstSuit);
}

export function isStraight(cards) {
    // 判断是否为顺子
}

export function getHandType(cardSet) {
    // 判断牌型并返回
}

export function compareHandTypes(handTypeA, handTypeB) {
    // 比较两种牌型的逻辑
}
