// js/gameLogic.js
import { getHandType, compareHandTypes, HAND_TYPES_STRENGTH } from './hand.js';

export function validateArrangement(sets) {
    if (sets.front.length !== 3 || sets.middle.length !== 5 || sets.back.length !== 5) {
        return "牌墩数量错误";
    }

    const frontType = getHandType(sets.front);
    const middleType = getHandType(sets.middle);
    const backType = getHandType(sets.back);

    if (compareHandTypes(middleType, frontType) < 0) return "倒水 (中道小于头道)";
    if (compareHandTypes(backType, middleType) < 0) return "倒水 (尾道小于中道)";

    return true; // 合法
}

// 检查13张特殊牌型
export function checkSpecial13CardHands(fullHand) {
    if (fullHand.length !== 13) return null;

    const uniqueRanks = new Set(fullHand.map(c => c.rank));
    if (uniqueRanks.size === 13) { // 所有牌的点数都不同
        return { typeName: "一条龙", strength: HAND_TYPES_STRENGTH.DRAGON, points: 13 }; // 假设基础分13
    }
    // 更多特殊牌型，如三同花顺等可以在此添加
    // 例如：
    // const isThreeStraightFlushes = ... (判断逻辑)
    // if (isThreeStraightFlushes) return { typeName: "三同花顺", strength: ..., points: ...};

    return null; // 没有13张特殊牌型
}


export function calculateScores(playerSetsData, aiSetsData) {
    const results = {
        playerScore: 0,
        messages: [],
        playerSetTypes: playerSetsData.types,
        aiSetTypes: aiSetsData.types
    };

    // 1. 检查玩家是否倒水 (理论上在确认摆牌时已检查，这里可作双重保险或用于特殊规则)
    const playerValidation = validateArrangement(playerSetsData);
    if (playerValidation !== true) {
        results.messages.push(`玩家: ${playerValidation}！AI 赢得所有道。`);
        results.playerScore = -6; // 假设倒水输很多，例如输掉全垒打的分数
        return results;
    }
    // AI倒水的情况 (简单AI已尽量避免，但复杂AI或规则可能需要处理)
    // const aiValidation = validateArrangement(aiSetsData);
    // if (aiValidation !== true) { ... }

    let playerRoundWins = 0; // 玩家在本局赢的道数

    // 比较头道
    const frontComparison = compareHandTypes(results.playerSetTypes.front, results.aiSetTypes.front);
    if (frontComparison > 0) { playerRoundWins++; results.messages.push("头道: 玩家胜!"); }
    else if (frontComparison < 0) { results.messages.push("头道: AI胜!"); }
    else { results.messages.push("头道: 平!"); }

    // 比较中道
    const middleComparison = compareHandTypes(results.playerSetTypes.middle, results.aiSetTypes.middle);
    if (middleComparison > 0) { playerRoundWins++; results.messages.push("中道: 玩家胜!"); }
    else if (middleComparison < 0) { results.messages.push("中道: AI胜!"); }
    else { results.messages.push("中道: 平!"); }

    // 比较尾道
    const backComparison = compareHandTypes(results.playerSetTypes.back, results.aiSetTypes.back);
    if (backComparison > 0) { playerRoundWins++; results.messages.push("尾道: 玩家胜!"); }
    else if (backComparison < 0) { results.messages.push("尾道: AI胜!"); }
    else { results.messages.push("尾道: 平!"); }

    // 基础计分：赢一道+1分，输一道-1分
    results.playerScore = playerRoundWins - (3 - playerRoundWins); // (赢的道数 - 输的道数)

    // 特殊计分：打枪/全垒打
    // 全垒打 (Scoop): 赢三道
    if (playerRoundWins === 3) {
        results.messages.push("<strong>玩家全垒打!</strong> 得分翻倍。");
        results.playerScore = 6; // 例如基础3分变6分
    } else if (playerRoundWins === 0 && (frontComparison !==0 || middleComparison !==0 || backComparison !==0 )) { // AI全垒打 (玩家一道未赢且至少一道输了)
        results.messages.push("<strong>AI全垒打!</strong> 失分翻倍。");
        results.playerScore = -6;
    }
    // TODO: 实现 "打枪" (赢两道) 的逻辑，通常也是分数加倍或有额外奖励

    // TODO: 特殊牌型额外加分 (冲三、铁支在中尾道、同花顺等)
    // 例如：如果尾道是同花顺，额外加5分
    // if (results.playerSetTypes.back.strength === HAND_TYPES_STRENGTH.STRAIGHT_FLUSH) {
    //     results.messages.push("玩家尾道同花顺，额外加分!");
    //     results.playerScore += 5; // 示例额外分数
    // }
    // if (results.aiSetTypes.back.strength === HAND_TYPES_STRENGTH.STRAIGHT_FLUSH) {
    //     results.messages.push("AI尾道同花顺，额外扣分!");
    //     results.playerScore -= 5;
    // }
    // ... 类似逻辑用于中道铁支等

    results.messages.push(`总得分: 玩家 ${results.playerScore > 0 ? '+' : ''}${results.playerScore}`);
    return results;
}
