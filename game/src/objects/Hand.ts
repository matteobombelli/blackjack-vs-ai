import { Card } from './Deck'

export default class Hand {
    cards: Card[];
    value: number;
    chips: number;
    
    constructor() {
        this.cards = [];
        this.value = 0;
        this.chips = 0;
    }

    addCard(card: Card) {
        this.cards.push(card);
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