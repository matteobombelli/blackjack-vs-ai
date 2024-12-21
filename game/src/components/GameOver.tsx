import '../App.css'
import Hand from '../objects/Hand';

type GameOverProps = {
    winner: string;
    highscore: number;
    visible: boolean;
    reset: () => void;
};

export default function ChipBalance({ winner, highscore, visible, reset }: GameOverProps) {
    if (visible) {
        return(
            <>
                <div className="game-over">
                    <h1>Game Over</h1>
                    <p>{`Highscore: ${winner} with ${highscore} chips`}</p>
                    <button onClick={reset}>Reset</button>
                </div>
            </>
        );
    }
}