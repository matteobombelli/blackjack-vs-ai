import shuffle from './shuffle'

export type Card = {
    suit: string;
    rank: string;
    value: number;
};

export class Deck {
    deck: Card[]; // Array to store the shuffled deck

    constructor(size: number) {
        // Initialize deck with shuffled cards
        // size = # full decks
        this.deck = shuffle(this.createDeck(size))
    }

    // Populates a deck with size = # of full standard decks
    createDeck(size: number): Card[] {
        const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
        const ranks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
        const values: { [key: string]: number } = {
            'ace': 11, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
            '10': 10, 'jack': 10, 'queen': 10, 'king': 10 
        };

        let deck: Card[] = [];

        for (let i: number = 0; i < size; i++) {
            for (let suit of suits) {
                for (let rank of ranks) {
                    deck.push({ rank, suit, value: values[rank] })
                }
            }
        }
        
        return deck;
    }
    
    // Pops the first card in the deck
    // Throws error if deck is empty
    popCard(): Card {
        if (this.isEmpty()) // Empty Deck, throw error
            throw new Error("The deck is empty, no card to pop!");

        const topCard: Card = this.deck[0]; // Get first card
        this.deck = this.deck.slice(1)
        return topCard;
    }

    length(): number {
        return this.deck.length;
    }

    isEmpty(): boolean {
        return this.deck.length <= 0;
    }
}

export default Deck;