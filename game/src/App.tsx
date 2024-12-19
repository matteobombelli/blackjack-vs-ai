import { useState } from 'react'
import './App.css'
import { Deck } from './objects/Deck.ts'
import Hand from './objects/Hand.ts'
import HandContainer from './components/HandContainer.tsx'
import IntegerInput from './components/IntegerInput.tsx'

const SHOE_SIZE: number = 7; // Number of full decks in a shoe
const STARTING_CHIPS: number = 100;

export default function App() {
  const [deck, setDeck] = useState<Deck>(new Deck(SHOE_SIZE));

  const [dealerHand, setDealerHand] = useState<Hand>(new Hand(STARTING_CHIPS));

  const [playerHand, setPlayerHand] = useState<Hand>(new Hand(STARTING_CHIPS));
  const [playerBet, setPlayerBet] = useState<number>(0); 
  const [playerBetError, setPlayerBetError] = useState<string>("");

  const [agentHand, setAgentHand] = useState<Hand>(new Hand(-1));
  const [agentBet, setAgentBet] = useState<number>(0);

  const [roundStarted, setRoundStarted] = useState<boolean>(false);

  function validateBet(bet: number) {
      if (bet > Number.MAX_SAFE_INTEGER) { // Check for overflow
      setPlayerBetError("Invalid Bet: Overflow");
    } else if (bet <= 0) { // Check if bet is non-positive
      setPlayerBetError("Best must be positive");
    } else if (bet > playerHand.chips) { // Check if bet exceeds chips
      setPlayerBetError("Not Enough Chips");
    } else { // Valid Bet
      setPlayerBetError(""); // Remove error
      setPlayerBet(bet); // Set bet
    }
  }

  function startRound() {
    // Check player bet is valid
    if (playerBetError != "") {
      setPlayerBetError("Invalid Bet, cannot start round");
      return;
    }
    
    // Initial Deal

    // Agent makes moves from ./model.json

    // Set round as started
    setRoundStarted(true);
  }

  function hit(hand: Hand, setter: React.Dispatch<React.SetStateAction<Hand>>) {

  }

  function endRound() {

    // Set round as not started
    setRoundStarted(false);
  }

  return (
    <>
      <div className="hand-container">
        <HandContainer hand={dealerHand} bet={-1} name={"Dealer"}/>
      </div>
      <div className="hand-container">
        <HandContainer hand={playerHand} bet={playerBet} name={"Player"}/>
        <HandContainer hand={agentHand} bet={agentBet} name={"Agent"}/>
      </div>
      <div className="controls-container">
        <button onClick={() => hit(playerHand, setPlayerHand)} disabled={!roundStarted}>Hit</button>
        <button onClick={endRound} disabled={!roundStarted}>Stay</button>
        <IntegerInput output={validateBet} error={playerBetError} isEditable={!roundStarted} />  
        <button onClick={startRound} disabled={roundStarted}>Bet</button>
      </div>
    </>
  )
}
