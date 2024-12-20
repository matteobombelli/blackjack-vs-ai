import { Card } from './Deck'

export default class Hand {
    cards: Card[];
    value: number;
    usableAce: boolean;
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
        this.usableAce = false;
        this.chips = chips;
    }

    // Clone for copying
    clone(): Hand {
        const newHand = new Hand(this.chips);
        newHand.cards = this.cards;
        newHand.usableAce = this.usableAce;
        newHand.value = this.value;
        return newHand;
    }

    addCard(card: Card) {
        // Replace cardBack if in hand
        // Get index of cardBack
        const cardBackIndex: number = this.cards.findIndex(
            (c: Card) => 
                c.rank === this.cardBack.rank &&
                c.suit === this.cardBack.suit &&
                c.value === this.cardBack.value
        );

        if (cardBackIndex === -1) { // No cardBack in cards[]
            this.cards.push(card);    
        } else { // cardBack in cards[]
            this.cards[cardBackIndex] = card;
        }

        // Adjust value, account for ace
        if (card.rank != "ace") {
            this.value += card.value;
        } else {
            if (!this.usableAce) { // No prev usable ace
                this.value += card.value;
                this.usableAce = true;
            } else { // Prev usable ace
                this.value += 1; // one ace MUST become soft, but we still have usable ace
            }
        }

        // Check if ace needs to be softened
        if (this.value > 21 && this.usableAce) {
            this.value -= 10;
            this.usableAce = false;
        }
    }

    betChips(bet: number) {
        this.chips -= bet;
    }
    

    winChips(winnings: number): Hand {
        const newHand = this.clone(); // Create a new instance
        newHand.chips += winnings; // Update chips in the new instance
        return newHand; // Return the updated instance
    }
    

    // Resets hand cards and value
    resetCards() {
        this.cards = [];
        this.value = 0;
    }
}