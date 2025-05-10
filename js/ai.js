// js/ai.js
import { getHandType, compareHandTypes, sortCards } from './hand.js';
import { shuffleDeck as shuffleArray } from './deck.js'; // 重命名导入以避免与牌组混淆

/**
 * 基础AI摆牌逻辑
 * @param {Array} hand - AI的13张手牌
 * @returns {Object} - { front: [cards], middle: [cards], back: [cards] }
 */
export function aiArrangeCards(hand) {
    let bestArrangement = null;
    let bestScore = -Infinity; // 用于评估摆牌好坏，但此基础版AI不真正评估

    // 简单的贪心策略：尝试将最好的牌放到尾道，其次中道，最次头道
    // 为了避免倒水，这是一个非常简化的尝试，实际AI会复杂得多
    // 这个函数的目标是返回一个不倒水的牌组

    let attempts = 0;
    const maxAttempts = 100; // 防止无限循环

    while(attempts < maxAttempts) {
        const shuffledHand = shuffleArray(hand); // 每次尝试都打乱一下，增加多样性

        const potentialBack = sortCards(shuffledHand.slice(0, 5)).reverse(); // 尝试取最好的5张
        const potentialMiddle = sortCards(shuffledHand.slice(5, 10)).reverse();
        const potentialFront = sortCards(shuffledHand.slice(10, 13)).reverse();

        const frontType = getHandType(potentialFront);
        const middleType = getHandType(potentialMiddle);
        const backType = getHandType(potentialBack);

        if (compareHandTypes(middleType, frontType) >= 0 && compareHandTypes(backType, middleType) >= 0) {
             // 找到了一个不倒水的组合
            return {
                front: potentialFront,
                middle: potentialMiddle,
                back: potentialBack,
                types: { front: frontType, middle: middleType, back: backType } // 同时返回牌型
            };
        }
        attempts++;
    }

    // 如果尝试多次后仍未找到不倒水的组合（理论上不大可能，除非牌极差或逻辑问题）
    // 则返回一个基础的排序组合，可能倒水，但至少有牌
    console.warn("AI failed to find non-daoshui arrangement after multiple attempts, returning basic sort.");
    const sortedHand = sortCards(hand).reverse();
    const finalBack = sortedHand.slice(0, 5);
    const finalMiddle = sortedHand.slice(5, 10);
    const finalFront = sortedHand.slice(10, 13);

    return {
        front: finalFront,
        middle: finalMiddle,
        back: finalBack,
        types: {
            front: getHandType(finalFront),
            middle: getHandType(finalMiddle),
            back: getHandType(finalBack)
        }
    };
}
