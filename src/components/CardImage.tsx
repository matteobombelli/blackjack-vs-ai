import { Card } from '../objects/Deck'
import '../App.css'

type CardImageProps = {
    card: Card;
};

export default function CardImage({ card }: CardImageProps) {
    const target = `${import.meta.env.BASE_URL}cards/${card.rank}_of_${card.suit}.png`;
    return <img className="card" src={target} alt="" />;
}
