// js/deck.js
export const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
export const RANK_VALUES = { // <--- 添加了 export
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'jack': 11, 'queen': 12, 'king': 13, 'ace': 14
};
export const IMAGE_PATH = 'images/';
export const IMAGE_EXT = '.png';


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

export function shuffleDeck(deckToShuffle) {
    const deck = [...deckToShuffle];
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export function dealCards(currentDeck, numCards) {
    if (currentDeck.length < numCards) {
        console.error("Not enough cards in deck to deal.");
        return [];
    }
    return currentDeck.splice(0, numCards);
}
