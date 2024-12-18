import shuffle from './shuffle'

export type Card = {
    rank: string;
    suit: string;
    value: number;
};

type DeckProps = {
    size: number; // Number of full decks
};

export class Deck {
    deck: Card[]; // Array to store the shuffled deck

    constructor(props: DeckProps) {
        // Initialize deck with shuffled cards
        // size = # full decks
        this.deck = shuffle(this.createDeck(props.size))
    }

    // Populates a deck with size = # of full standard decks
    createDeck(size: number): Card[] {
        const suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const values: { [key: string]: number } = {
            'A': 11, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
            '10': 10, 'J': 10, 'Q': 10, 'K': 10 
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
    // Returns null if deck is empty
    popCard(): Card | null {
        if (this.deck.length > 0) { // At least one card in deck
            const topCard: Card = this.deck[0]; // Get first card
            this.deck = this.deck.slice(1)
            return topCard;
        }
        return null; // Deck empty, return null
    }
}

export default Deck;