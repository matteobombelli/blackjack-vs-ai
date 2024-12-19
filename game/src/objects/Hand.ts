import { Card } from './Deck'

export default class Hand {
    cards: Card[];
    value: number;
    chips: number;
    private readonly cardBack: Card = {
        rank: "none",
        suit: "none",
        value: 0,
    };
    
    // Default Constructor
    constructor(chips: number) {
        this.cards = [this.cardBack, this.cardBack];
        this.value = 0;
        this.chips = chips;
    }

    // Clone for copying
    clone(): Hand {
        const newHand = new Hand(this.chips);
        newHand.cards = this.cards;
        newHand.value = this.value;
        return newHand;
    }

    addCard(card: Card) {
        // Replace cardBack if in hand
        if (this.cards.includes(this.cardBack)) {
            let index = this.cards.indexOf(this.cardBack);
            this.cards[index] = card;
        } else {
            this.cards.push(card);
        }
        
        this.value += card.value;
    }
    
    // Returns true if valid bet, false if invalid bet
    // If valid bet, subtract chips by bet
    betChips(bet: number): boolean {
        if (bet < this.chips) { // Valid Bet
            this.chips -= bet;
            return true;
        }
        return false;
    }

    winChips(winnings: number) {
        this.chips += winnings;
    }

    // Resets hand cards and value
    resetCards() {
        this.cards = [];
        this.value = 0;
    }
}