// js/deck.js
const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
const RANK_VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'jack': 11, 'queen': 12, 'king': 13, 'ace': 14 // Ace通常为14
};

export function createDeck() {
    const newDeck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            newDeck.push({
                suit: suit,
                rank: rank,
                value: RANK_VALUES[rank],
                id: `${rank}_of_${suit}`
            });
        }
    }
    return newDeck;
}

export function shuffleDeck(deck) {
    let currentIndex = deck.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [deck[currentIndex], deck[randomIndex]] = [
            deck[randomIndex], deck[currentIndex]];
    }
    return deck;
}

export function dealCards(deck, numCards) {
    return deck.splice(0, numCards);
}
