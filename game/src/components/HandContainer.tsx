import Hand from '../objects/Hand.ts'
import CardImage from './CardImage.tsx'
import ChipBalance from './ChipBalance.tsx'
import '../App.css'

type HandContainerProps = {
    hand: Hand;
    bet: number;
    name: string;
};

export default function HandContainer( { hand, bet, name }: HandContainerProps) {
    return(
    <>
        <div className="hand">
            { bet == -1 ? null : <ChipBalance chipCount={bet} /> }
            <br />
            { hand.cards.map((card, index) => 
                <CardImage key={`${index}`} card={card} />)}
            <br />
            { hand.chips == -1 ? null : <ChipBalance chipCount={hand.chips} /> }
            <br />
            <h1>{name}</h1>
        </div>
    </>
    );
}