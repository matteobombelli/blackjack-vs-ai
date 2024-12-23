import { Card } from '../objects/Deck'
import '../App.css'

type CardImageProps = {
    card: Card;
};

export default function CardImage({ card }: CardImageProps) {
    let target: string = "../cards/" + card.rank + "_of_" + card.suit + ".png";
    return(<img className="card" src={target} alt=""/>);
}