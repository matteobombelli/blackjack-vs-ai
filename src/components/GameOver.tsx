import '../App.css'

type GameOverProps = {
    winner: string;
    highscore: number;
    lastStanding: string;
    visible: boolean;
    reset: () => void;
};

export default function ChipBalance({ winner, highscore, lastStanding, visible, reset }: GameOverProps) {
    if (visible) {
        return(
            <>
                <div className="game-over">
                    <h1>Game Over</h1>
                    <p>{`Highscore: ${winner} with ${highscore} chips`}</p>
                    <p>{`Last Standing: ${lastStanding}`}</p>
                    <button onClick={reset}>New Game</button>
                </div>
            </>
        );
    }
}