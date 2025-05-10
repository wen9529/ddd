// js/gameLogic.js

export function createDeck() {
    const SUITS = ['Clubs', 'Diamonds', 'Hearts', 'Spades']; // Capitalized for consistency
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank });
        }
    }
    return deck;
}

export function shuffleDeck(deck) {
    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck; // Technically modifies in place, but returning is fine
}

export function dealCards(deck, numCards) {
    // Deals from the "top" (end) of the deck if shuffled, or "start" if not.
    // Splice modifies the original deck.
    if (deck.length < numCards) {
        console.warn("Not enough cards in deck to deal!");
        return deck.splice(0, deck.length);
    }
    return deck.splice(0, numCards);
}

// --- Placeholder for Advanced Game Logic ---
// (牌型判断、比牌、计分等逻辑需要在这里详细实现)

export function getHandType(hand) {
    // TODO: Implement detailed hand type evaluation (e.g., Straight, Flush, Full House)
    // This is a complex part of Thirteen Waters
    console.warn("getHandType a.k.a. 十三水牌型判断逻辑未实现");
    if (hand.length === 3) return "头道牌型";
    if (hand.length === 5) return "中/尾道牌型";
    return "未知牌型";
}

export function compareHands(handA, handB,道) { // 道 can be 'front', 'middle', 'back'
    // TODO: Implement comparison based on Thirteen Waters rules
    console.warn("compareHands a.k.a. 比牌逻辑未实现");
    return 0; // 0 for tie, 1 if handA wins, -1 if handB wins
}

export function calculateScores(room) {
    // TODO: Implement scoring based on comparisons between all players for each 道
    console.warn("calculateScores a.k.a. 计分逻辑未实现");
    room.players.forEach(p => {
        p.score = (p.score || 0) + Math.floor(Math.random() * 5 - 2); // Random placeholder
    });
}

// AI logic for arranging cards (very basic placeholder)
export function arrangeAICards(player) {
    if (!player.hand || player.hand.length !== 13) return;
    // TODO: Implement actual AI logic to arrange cards into front, middle, back
    // This is a very complex AI task for optimal play.
    // For now, just a simple split:
    player.sets.front = player.hand.slice(0, 3);
    player.sets.middle = player.hand.slice(3, 8);
    player.sets.back = player.hand.slice(8, 13);
    console.log(`${player.phoneNumber} (AI) has arranged cards (basic split).`);
}
