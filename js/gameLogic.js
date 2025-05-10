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

// Helper function to get numerical value of a rank
function rankValue(rank) {
    // Handle cases with different rank representations (e.g., 'J' vs 'jack')
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', 'jack', 'queen', 'king', 'ace'];
    const lowerCaseRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];
    const index = ranks.indexOf(rank.toUpperCase());
    if (index !== -1) return index + 2;
    return lowerCaseRanks.indexOf(rank.toLowerCase()) + 2; // '2' is 2, 'ace' is 14
}

// Helper function to check for sequential ranks (for Straight)
function isSequential(ranks) {
    // Sort ranks for checking
    const sortedRanks = [...ranks].sort((a, b) => a - b);

    // Handle Ace-5 straight (A, 2, 3, 4, 5) specifically for 5 cards
    if (sortedRanks.length === 5) {
        const isAceFiveStraight = sortedRanks[0] === 2 && sortedRanks[1] === 3 && sortedRanks[2] === 4 && sortedRanks[3] === 5 && sortedRanks[4] === 14;
        if (isAceFiveStraight) {
            return true;
        }
    }

    // Check for general sequential order
     for (let i = 0; i < sortedRanks.length - 1; i++) {
        // A straight cannot have duplicate ranks. This check needs refinement.
        if (sortedRanks[i + 1] !== sortedRanks[i] + 1 && sortedRanks[i + 1] !== sortedRanks[i]) {
             // If the next rank is not the current rank + 1 and not the same rank, it's not a straight
             return false;
        }
    }
    return true;
}

// 牌型判断逻辑
export function getHandType(hand) {
    if (!hand || hand.length === 0) {
        // Handle invalid hand size
        return { type: "Invalid", value: 0 };
    }

    const sortedHand = [...hand].sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
    const ranks = sortedHand.map(card => rankValue(card.rank));
    const suits = sortedHand.map(card => card.suit);
    const isFlush = suits.every(suit => suit === suits[0]);

    // Count rank occurrences
    const rankCounts = ranks.reduce((counts, rank) => {
        counts[rank] = (counts[rank] || 0) + 1;
        return counts;
    }, {});

    const counts = Object.values(rankCounts).sort((a, b) => b - a);


    const isStraight = isSequential(ranks);

    // --- Special Hand Types (13 cards) ---
    if (hand.length === 13) {
        // 一条龙 (Straight Flush of all 13 cards)
        if (isStraight && isFlush && ranks[0] === 2 && ranks[12] === 14) {
             return { type: "一条龙", value: 100 }; // Assign a high value for scoring
        }

        // 三同花 (Three Flushes)
        // This requires splitting the 13 cards into 3 flushes (3, 5, 5)
        // A proper check would involve trying to partition the hand into 3 flushes (3, 5, 5)
        const uniqueSuits = new Set(suits);
        // Basic check: can we partition the hand into 3, 5, 5 where each partition is a flush?
        // This is a placeholder and requires actual partition logic.
        // If a valid three flush partition exists, return it.
        // For a simplified version, we'll skip a full check here.

        // 六对子 (Six Pairs and one kicker)
        if (counts.length === 7 && counts.every(count => count === 2 || count === 1)) {
             if (counts.filter(count => count === 2).length === 6 && counts.filter(count => count === 1).length === 1) {
                  // Check if there's a Four of a Kind among the six pairs (for the optional "免摆" rule)
                 const hasFourOfAKind = counts.includes(4);
                 return { type: "六对子", value: 60, hasFourOfAKind: hasFourOfAKind }; // Include info about Four of a Kind
             }
        }

        // 三顺子 (Three Straights)
        // This requires splitting the 13 cards into 3 straights (3, 5, 5)
        // A true implementation needs to verify if a valid 3, 5, 5 straight partition exists.
         let canFormThreeStraights = false;
         // Basic check: if there are multiple sequences of at least 3
         // This is not a definitive check for three straights.
         // A proper check would involve trying to partition the hand into three straights.
         // For this simplified version, we will skip a full check here.

        // If a hand is a special type, return it immediately
        if (isStraight && isFlush && ranks[0] === 2 && ranks[12] === 14) {
            return { type: "一条龙", value: 100 };
        }

        if (counts.length === 7 && counts.every(count => count === 2 || count === 1)) {
             if (counts.filter(count => count === 2).length === 6 && counts.filter(count => count === 1).length === 1) {
                  const hasFourOfAKind = counts.includes(4);
                 return { type: "六对子", value: 60, hasFourOfAKind: hasFourOfAKind };
             }
        }

    }

    // --- Regular Hand Types (3 or 5 cards) ---
    // Ensure hand length is correct for regular hand types

    // Handle 3-card hand (front set)
    if (hand.length === 3) {
        if (counts[0] === 3) {
            return { type: "Three of a Kind", value: ranks[0] }; // Value is rank of the three
        } else if (counts[0] === 2) {
             const pairRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 2));
             const kicker = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 1));
             return { type: "Pair", value: pairRank * 100 + kicker };
        } else {
            // High Card for 3 cards
             return { type: "High Card", value: ranks[2] * 100 + ranks[1] * 10 + ranks[0] };
        }
    }
     // Handle 5-card hand (middle and back sets)
    // Check for specific hand types
    if (hand.length === 5) {
        if (isStraight && isFlush) {
            return { type: "Straight Flush", value: ranks[4] };
        } else if (counts[0] === 4) {
            const fourOfAKindRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 4));
            return { type: "Four of a Kind", value: fourOfAKindRank };
        } else if (counts[0] === 3 && counts[1] === 2) {
            const threeOfAKindRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 3));
            const pairRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 2));
            return { type: "Full House", value: threeOfAKindRank * 100 + pairRank }; // Simple value combination
        } else if (isFlush) {
            return { type: "Flush", value: ranks[4] }; // Value is highest card
        } else if (isStraight) {
            // isSequential already handles Ace-5 for 5 cards
            return { type: "Straight", value: ranks[4] }; // Value is highest card
        } else if (counts[0] === 3) {
            const threeOfAKindRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 3));
            return { type: "Three of a Kind", value: threeOfAKindRank };
        } else if (counts[0] === 2 && counts[1] === 2) {
            const pairs = Object.keys(rankCounts).filter(rank => rankCounts[rank] === 2).map(Number).sort((a, b) => b - a);
            const kicker = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 1));
            return { type: "Two Pair", value: pairs[0] * 10000 + pairs[1] * 100 + kicker }; // Value combination
        } else if (counts[0] === 2) {
            const pairRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 2));
            const kickers = Object.keys(rankCounts).filter(rank => rankCounts[rank] === 1).map(Number).sort((a, b) => b - a);
            return { type: "Pair", value: pairRank * 10000 + kickers[0] * 100 + kickers[1] * 10 + kickers[2] }; // Value combination
        } else {
            // High Card for 5 cards
            return { type: "High Card", value: ranks[4] * 1000000 + ranks[3] * 10000 + ranks[2] * 100 + ranks[1] * 10 + ranks[0] }; // Value based on all card ranks
        }
    } else if (counts[0] === 4) {
        // This part seems misplaced, should be part of 5-card check or handled differently
        const fourOfAKindRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 4));
        return { type: "Four of a Kind", value: fourOfAKindRank };
    } else if (counts[0] === 3 && counts[1] === 2) {
        const threeOfAKindRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 3));
        const pairRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 2));
        return { type: "Full House", value: threeOfAKindRank * 100 + pairRank };
    } else if (counts[0] === 2 && counts[1] === 2) {
        const pairs = Object.keys(rankCounts).filter(rank => rankCounts[rank] === 2).map(Number).sort((a, b) => b - a);
        const kicker = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 1));
        return { type: "Two Pair", value: pairs[0] * 100 + pairs[1] * 10 + kicker };
    } else if (counts[0] === 2) { // Single pair
    } else {
         return { type: "High Card", value: ranks[ranks.length - 1] }; // Basic High Card for other lengths
    }
}

// 比较牌型
export function compareHandTypes(type1, type2) {
    const typeOrder = [
        "Invalid",         // Lowest priority
        "三顺子",
        "六对子",
        "三同花",
        "一条龙",          // Highest special type
        "High Card",
        "Pair",
        "Two Pair",
        "Three of a Kind",
        "Straight",
        "Flush",
        "Full House",
        "Four of a Kind",
        "Straight Flush",
    ];

    // Handle Invalid type comparison
    if (type1.type === "Invalid" || type2.type === "Invalid") {
        return 0; // Invalid hands don't compete
    }

    const type1Index = typeOrder.indexOf(type1.type);
    const type2Index = typeOrder.indexOf(type2.type);

    if (type1Index > type2Index) {
        return 1; // type1 wins this set
    } else if (type1Index < type2Index) {
        return -1; // type2 wins this set
    } else {
        // Same hand type, compare values - This is where tie-breaking logic for specific types goes.
        // For now, a simple value comparison is used, which might not be accurate for all types.

        // Special handling for ties in special hands (as per your rule): they are considered ties.
        if (["一条龙", "三同花", "六对子", "三顺子"].includes(type1.type)) {
             return 0; // Special hands of the same type are ties
        }
        // Note: Value comparison logic needs to be robust for all hand types
        if (type1.value > type2.value) {
            return 1;
        } else if (type1.value < type2.value) {
            return -1;
        } else {
            return 0; // Tie for this set
        }
    }
}

// 比较玩家之间的摆牌结果
export function comparePlayerHands(playerHand1, playerHand2) {
    // playerHand1 and playerHand2 are objects like { front: [], middle: [], back: [] }
    const results = { player1Wins: 0, player2Wins: 0 };

    // Compare back set
    const backComparison = compareHandTypes(getHandType(playerHand1.back), getHandType(playerHand2.back));
    if (backComparison > 0) results.player1Wins++;
    else if (backComparison < 0) results.player2Wins++;

    // Compare middle set
    const middleComparison = compareHandTypes(getHandType(playerHand1.middle), getHandType(playerHand2.middle));
    if (middleComparison > 0) results.player1Wins++;
    else if (middleComparison < 0) results.player2Wins++;

    // Compare front set
    const frontComparison = compareHandTypes(getHandType(playerHand1.front), getHandType(playerHand2.front));
    if (frontComparison > 0) results.player1Wins++;
    else if (frontComparison < 0) results.player2Wins++;

    return results; // { player1Wins, player2Wins, ties }
}

// Scoring points for each hand type winning a set (this is a basic example)
const SET_WIN_POINTS = {
    "High Card": 1, "Pair": 1, "Two Pair": 1, "Three of a Kind": 1,
    "Straight": 1, "Flush": 1, "Full House": 1, "Four of a Kind": 1, "Straight Flush": 1,
    "三顺子": 5, "六对子": 6, "三同花": 8, "一条龙": 10
};

// 计分逻辑
export function calculateScores(players) { // players is an array of player objects with hand sets
    const scores = {};
    players.forEach(player => {
        scores[player.phoneNumber] = 0;
    });

    // Compare each pair of players
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const player1 = players[i];
            const player2 = players[j];

            // Ensure players have their hands set
            if (!player1.sets || !player2.sets) {
                console.error("Players do not have their hands set for scoring.");
                continue;
            }

            const comparisonResults = comparePlayerHands(player1.sets, player2.sets);

            // --- Scoring based on set wins ---
            // For each set, award points to the winner based on the winning hand type

            const sets = ['front', 'middle', 'back'];
            sets.forEach(set => {
                const p1HandType = getHandType(player1.sets[set]);
                const p2HandType = getHandType(player2.sets[set]);
                const setComparison = compareHandTypes(p1HandType, p2HandType);

                if (setComparison > 0) { // Player 1 wins this set
                     scores[player1.phoneNumber] += (SET_WIN_POINTS[p1HandType.type] || 1); // Default 1 point if type not in map
                     scores[player2.phoneNumber] -= (SET_WIN_POINTS[p1HandType.type] || 1);
                } else if (setComparison < 0) { // Player 2 wins this set
                     scores[player1.phoneNumber] -= (SET_WIN_POINTS[p2HandType.type] || 1);
                     scores[player2.phoneNumber] += (SET_WIN_POINTS[p2HandType.type] || 1);
                }
                // If setComparison is 0 (tie), no points are exchanged for this set.
            });

            // --- Scoring for Special Hands ("免摆") ---
            // If a player has a "免摆" hand, they win against all other players for a fixed score.
            const p1SpecialHand = getHandType(player1.sets.back).type; // Assuming special hands are checked from the full 13 cards before splitting
            const p2SpecialHand = getHandType(player2.sets.back).type;

            const specialTypes = ["一条龙", "三同花", "六对子", "三顺子"];

            if (specialTypes.includes(p1SpecialHand) && !specialTypes.includes(p2SpecialHand)) {
                 scores[player1.phoneNumber] += (SET_WIN_POINTS[p1SpecialHand] || 0); // Add bonus points for the special hand
                 scores[player2.phoneNumber] -= (SET_WIN_POINTS[p1SpecialHand] || 0);
            } else if (!specialTypes.includes(p1SpecialHand) && specialTypes.includes(p2SpecialHand)) {
                 scores[player1.phoneNumber] -= (SET_WIN_POINTS[p2SpecialHand] || 0);
                 scores[player2.phoneNumber] += (SET_WIN_POINTS[p2SpecialHand] || 0);
            }
            // If both have special hands of the same type, they tie and no extra points are exchanged beyond the set comparison (which should be a tie for special hands).
        }
    }

    // Return scores as an array of objects
    return Object.keys(scores).map(phoneNumber => ({
        player: phoneNumber,
        score: scores[phoneNumber]
    }));
}

// AI Trustee function - Basic implementation
export function aiTrustee(hand) {
    // Sort hand by rank value
    const sortedHand = [...hand].sort((a, b) => rankValue(a.rank) - rankValue(b.rank));

    let remainingCards = [...sortedHand];
    const frontSet = [];
    const middleSet = [];
    const backSet = [];

    // Check for special "免摆" hands first
    const specialHand = getHandType(sortedHand);
    if (["一条龙", "三同花", "六对子", "三顺子"].includes(specialHand.type)) {
        // If a special hand is found, the AI "免摆" and the entire hand is the special hand.
        return { front: [], middle: [], back: [], specialHand: specialHand.type }; // Indicate a special hand and no need to split
    }

    // Simple rule-based AI: prioritize stronger hands in back and middle
    // Try to form the strongest hand in the back (5 cards)
    // This is a very basic approach, a real AI would explore many combinations

    // Example: try to find a straight or flush in the remaining cards
    const fiveCardHands = generateCombinations(remainingCards, 5);
    let bestBackSet = null;
    let bestBackHandType = { type: "Invalid", value: 0 };

    for (const hand of fiveCardHands) {
        const handType = getHandType(hand);
        if (compareHandTypes(handType, bestBackHandType) > 0) {
            bestBackHandType = handType;
            bestBackSet = hand;
        }
    }

    if (bestBackSet) {
        backSet.push(...bestBackSet);
        remainingCards = remainingCards.filter(card => !bestBackSet.includes(card));
    } else {
        // If no strong 5-card hand, just take the highest 5 cards for the back
        backSet.push(...remainingCards.slice(-5));
        remainingCards = remainingCards.slice(0, -5);
    }

    // Try to form the strongest hand in the middle (5 cards from remaining 8)
    const fiveCardMiddleHands = generateCombinations(remainingCards, 5);
    let bestMiddleSet = null;
    let bestMiddleHandType = { type: "Invalid", value: 0 };

    for (const hand of fiveCardMiddleHands) {
        // Ensure middle set is stronger than or equal to back set (in Thirteen Water rules)
        // This check is simplified and needs proper rule implementation
        const handType = getHandType(hand);
         // Rule in Thirteen Water: front <= middle <= back (in terms of hand strength)
        if (compareHandTypes(handType, bestMiddleHandType) > 0) {
             // Additional check based on Thirteen Water rules: middle > back
             if (compareHandTypes(handType, getHandType(backSet)) <= 0) {
                 bestMiddleHandType = handType;
                 bestMiddleSet = hand;
             }
        }
    }
    if (bestMiddleSet) {
        if (compareHandTypes(getHandType(bestMiddleSet), getHandType(backSet)) >= 0) {
             middleSet.push(...bestMiddleSet);
             remainingCards = remainingCards.filter(card => !bestMiddleSet.includes(card));
        }
    } else {
        // If no suitable 5-card hand for middle, just take the next 5 cards
         middleSet.push(...remainingCards.slice(-5));
         remainingCards = remainingCards.slice(0, -5);
    }

    // The remaining 3 cards go to the front set
    frontSet.push(...remainingCards);

    // --- Validation based on Thirteen Water rules (front < middle < back) ---
    // This is a crucial validation step based on actual game rules.
    const frontType = getHandType(frontSet);
    const middleType = getHandType(middleSet);
    const backType = getHandType(backSet);

    // If the AI's initial attempt results in an invalid order (front > middle or middle > back), try a simpler split.
    // A more sophisticated AI would use a different search strategy.
    if (compareHandTypes(frontType, middleType) > 0 || compareHandTypes(middleType, backType) > 0) {
        console.warn("AI created an invalid hand order (front > middle or middle > back). Attempting a simpler split.");
        // Fallback: simply split the sorted hand into 3, 5, 5
         const simpleFront = sortedHand.slice(0, 3);
         const simpleMiddle = sortedHand.slice(3, 8);
         const simpleBack = sortedHand.slice(8, 13);
         return { front: simpleFront, middle: simpleMiddle, back: simpleBack }; // Return invalid split as a last resort? Or try another approach?
    }

    return { front: frontSet, middle: middleSet, back: backSet };
}

// Helper function to generate combinations
function generateCombinations(arr, k) {
    const result = [];
    function f(start, currentCombination) {
        if (currentCombination.length === k) {
            result.push([...currentCombination]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            currentCombination.push(arr[i]);
            f(i + 1, currentCombination);
            currentCombination.pop();
        }
    }
    f(0, []);
    return result;
}

// The AI logic is a basic greedy approach and needs significant
// improvement for a truly "smart" player.