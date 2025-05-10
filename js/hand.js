// js/hand.js
import { RANK_VALUES } from './deck.js';

export const HAND_TYPES_STRENGTH = {
    HIGH_CARD: 0,       // 乌龙
    ONE_PAIR: 1,        // 一对
    TWO_PAIR: 2,        // 两对
    THREE_OF_A_KIND: 3, // 三条
    STRAIGHT: 4,        // 顺子
    FLUSH: 5,           // 同花
    FULL_HOUSE: 6,      // 葫芦
    FOUR_OF_A_KIND: 7, // 铁支
    STRAIGHT_FLUSH: 8, // 同花顺
    // 特殊13张牌型 (这些的比较逻辑不同，通常直接判定胜负或大量加分)
    DRAGON: 20, // 一条龙 (A-K) - 给一个很高的strength值
    // ... 更多特殊牌型
};

function getRankValueForSort(rank, aceLow = false) {
    if (aceLow && rank === 'ace') return 1; // A2345顺子中A为1
    return RANK_VALUES[rank];
}

export function sortCards(cards, aceLow = false) {
    return [...cards].sort((a, b) => { // 创建副本排序
        const valA = getRankValueForSort(a.rank, aceLow);
        const valB = getRankValueForSort(b.rank, aceLow);
        return valA - valB; // 从小到大排序
    });
}

export function isFlush(cards) {
    if (!cards || cards.length < 1) return false;
    const firstSuit = cards[0].suit;
    return cards.every(card => card.suit === firstSuit);
}

export function isStraight(cards) {
    if (!cards || cards.length !== 5) return false;
    const sortedByValue = sortCards(cards);

    // 检查普通顺子 K Q J 10 9 ... 或 A K Q J 10
    let straight = true;
    for (let i = 0; i < sortedByValue.length - 1; i++) {
        if (sortedByValue[i+1].value !== sortedByValue[i].value + 1) {
            straight = false;
            break;
        }
    }
    if (straight) return true;

    // 检查特殊顺子 A 2 3 4 5 (此时A作为1)
    const sortedAceLow = sortCards(cards, true);
    if (
        sortedAceLow[0].rank === 'ace' &&
        sortedAceLow[1].rank === '2' &&
        sortedAceLow[2].rank === '3' &&
        sortedAceLow[3].rank === '4' &&
        sortedAceLow[4].rank === '5'
    ) {
        return true;
    }
    return false;
}

function getRankCounts(cards) {
    const counts = {};
    cards.forEach(card => {
        counts[card.rank] = (counts[card.rank] || 0) + 1;
    });
    return counts;
}

export function getHandType(cardSet) {
    if (!cardSet || cardSet.length === 0) return { typeName: "无牌", strength: -1, highCards: [], kickerCards: [], originalCards: [] };

    const sortedSetDesc = sortCards(cardSet).reverse(); // 从大到小排序，方便取大牌
    const highCardValues = sortedSetDesc.map(c => c.value);

    // 头道 (3张)
    if (cardSet.length === 3) {
        const counts = getRankCounts(cardSet);
        const uniqueRanks = Object.keys(counts);

        if (uniqueRanks.some(rank => counts[rank] === 3)) {
            return { typeName: "三条", strength: HAND_TYPES_STRENGTH.THREE_OF_A_KIND, highCards: [sortedSetDesc[0].value], kickerCards: [], originalCards: cardSet };
        }
        if (uniqueRanks.some(rank => counts[rank] === 2)) {
            const pairRank = RANK_VALUES[uniqueRanks.find(rank => counts[rank] === 2)];
            const kickerRank = RANK_VALUES[uniqueRanks.find(rank => counts[rank] === 1)];
            return { typeName: "一对", strength: HAND_TYPES_STRENGTH.ONE_PAIR, highCards: [pairRank], kickerCards: [kickerRank], originalCards: cardSet };
        }
        return { typeName: "乌龙", strength: HAND_TYPES_STRENGTH.HIGH_CARD, highCards: highCardValues, kickerCards: [], originalCards: cardSet };
    }

    // 中道或尾道 (5张)
    if (cardSet.length === 5) {
        const flush = isFlush(cardSet);
        const straight = isStraight(cardSet); // isStraight内部会处理A2345

        let straightHighCardValue = -1;
        if (straight) {
            // 如果是A2345顺，最大牌是5，否则是sortedSetDesc[0].value
            const aceLowStraight = sortCards(cardSet, true);
            if (aceLowStraight[0].rank === 'ace' && aceLowStraight[4].rank === '5') {
                straightHighCardValue = RANK_VALUES['5'];
            } else {
                straightHighCardValue = sortedSetDesc[0].value;
            }
        }

        if (straight && flush) {
            return { typeName: "同花顺", strength: HAND_TYPES_STRENGTH.STRAIGHT_FLUSH, highCards: [straightHighCardValue], kickerCards: [], originalCards: cardSet };
        }

        const counts = getRankCounts(cardSet);
        const uniqueRanks = Object.keys(counts);

        if (uniqueRanks.some(rank => counts[rank] === 4)) {
            const fourRank = RANK_VALUES[uniqueRanks.find(rank => counts[rank] === 4)];
            const kickerRank = RANK_VALUES[uniqueRanks.find(rank => counts[rank] === 1)];
            return { typeName: "铁支", strength: HAND_TYPES_STRENGTH.FOUR_OF_A_KIND, highCards: [fourRank], kickerCards: [kickerRank || -1], originalCards: cardSet };
        }

        const threeKindRankStr = uniqueRanks.find(rank => counts[rank] === 3);
        const pairRanksStr = uniqueRanks.filter(rank => counts[rank] === 2);

        if (threeKindRankStr && pairRanksStr.length > 0) { // 葫芦
            return { typeName: "葫芦", strength: HAND_TYPES_STRENGTH.FULL_HOUSE, highCards: [RANK_VALUES[threeKindRankStr]], kickerCards: [RANK_VALUES[pairRanksStr[0]]], originalCards: cardSet };
        }
        if (flush) {
            return { typeName: "同花", strength: HAND_TYPES_STRENGTH.FLUSH, highCards: highCardValues, kickerCards: [], originalCards: cardSet };
        }
        if (straight) {
            return { typeName: "顺子", strength: HAND_TYPES_STRENGTH.STRAIGHT, highCards: [straightHighCardValue], kickerCards: [], originalCards: cardSet };
        }
        if (threeKindRankStr) {
            const kickers = sortedSetDesc.filter(c => c.rank !== threeKindRankStr).map(c => c.value).slice(0, 2);
            return { typeName: "三条", strength: HAND_TYPES_STRENGTH.THREE_OF_A_KIND, highCards: [RANK_VALUES[threeKindRankStr]], kickerCards: kickers, originalCards: cardSet };
        }
        if (pairRanksStr.length === 2) { // 两对
            const pVals = pairRanksStr.map(r => RANK_VALUES[r]).sort((a,b) => b-a);
            const kickerRank = RANK_VALUES[uniqueRanks.find(rank => counts[rank] === 1)];
            return { typeName: "两对", strength: HAND_TYPES_STRENGTH.TWO_PAIR, highCards: pVals, kickerCards: [kickerRank || -1], originalCards: cardSet };
        }
        if (pairRanksStr.length === 1) { // 一对
            const kickers = sortedSetDesc.filter(c => c.rank !== pairRanksStr[0]).map(c => c.value).slice(0, 3);
            return { typeName: "一对", strength: HAND_TYPES_STRENGTH.ONE_PAIR, highCards: [RANK_VALUES[pairRanksStr[0]]], kickerCards: kickers, originalCards: cardSet };
        }
        return { typeName: "乌龙", strength: HAND_TYPES_STRENGTH.HIGH_CARD, highCards: highCardValues, kickerCards: [], originalCards: cardSet };
    }
    return { typeName: "未知牌数", strength: -1, highCards: [], kickerCards: [], originalCards: cardSet };
}

export function compareHandTypes(handTypeA, handTypeB) {
    if (handTypeA.strength !== handTypeB.strength) {
        return handTypeA.strength - handTypeB.strength;
    }
    // 强度相同，比较主要牌点数
    for (let i = 0; i < handTypeA.highCards.length; i++) {
        if (i >= handTypeB.highCards.length) return 1; // A 的比较牌更多
        if (handTypeA.highCards[i] !== handTypeB.highCards[i]) {
            return handTypeA.highCards[i] - handTypeB.highCards[i];
        }
    }
    // 主要牌点数相同，比较次要牌（Kicker）
    for (let i = 0; i < handTypeA.kickerCards.length; i++) {
        if (i >= handTypeB.kickerCards.length) return 1;
        if (handTypeA.kickerCards[i] !== handTypeB.kickerCards[i]) {
            return handTypeA.kickerCards[i] - handTypeB.kickerCards[i];
        }
    }
    return 0; // 完全相同
}
