// js/gameLogic.js

export function createDeck() {
    const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
    const deck = [];

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank, id: `${rank}_of_${suit}` });
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

export function getHandType(hand) {
    // Implement evaluation of hand types
    return "Some Hand Type"; // Placeholder
}

export function compareHandTypes(type1, type2) {
    // Implement hand type comparison logic
    return 0; // 0 if equal, positive if type1 wins, negative if type2 wins
}

export function calculateScores(players) {
    // Implement scoring logic for players
}
