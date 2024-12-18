    import { Card } from './Deck'

    type HandProps = {
        chips: number;
        FirstCard: Card;
        SecondCard: Card;
    };

    export class Hand {
        hand: Card[];
        value: number;
        chips: number;
        
        constructor(props: HandProps) {
            this.hand = [props.FirstCard, props.SecondCard];
            this.value = props.FirstCard.value + props.FirstCard.value;
            this.chips = props.chips;
        }

        addCard(card: Card) {
            this.hand.push(card);
            this.value = this.value + card.value
        }

        // Removes an amount of chips 'bet' from chips
        // Returns true if valid bet, false if invalid bet
        betChips(bet: number): boolean {
            if (bet < this.chips) {
                this.chips -= bet;
                return true;
            }
            return false;
        }

        winChips(winnings: number) {
            this.chips += winnings;
        }
    }