import Hand from '../objects/Hand.ts'
import CardImage from './CardImage.tsx'
import ChipBalance from './ChipBalance.tsx'
import '../App.css'

type HandContainerProps = {
    hand: Hand;
    bet: number;
    name: string;
    message: string;
};

export default function HandContainer( { hand, bet, name, message }: HandContainerProps) {
    return(
    <>
        <div className="hand">
            { bet == -1 ? null : <ChipBalance chipCount={bet} /> }
            <div className="cards">
                { hand.cards.map((card, index) => 
                <CardImage key={`${index}`} card={card} />)}
            </div>
            { hand.chips == -1 ? null : <ChipBalance chipCount={hand.chips} /> }
            <h1>{name}</h1>
            <p>{message}</p>
        </div>
    </>
    );
}