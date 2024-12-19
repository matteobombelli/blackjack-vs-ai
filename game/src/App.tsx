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
  const [playerHand, setPlayerHand] = useState<Hand>(new Hand());
  const [playerBet, setPlayerBet] = useState<number>(0);  
  const [playerBetError, setPlayerBetError] = useState<string>("");

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
    let newPlayerHand = playerHand.clone();
    newPlayerHand.winChips(100);
    setPlayerHand(newPlayerHand);
  }

  return (
    <>
      <HandContainer hand={playerHand} bet={playerBet} name={"Player"}/> 
      <br />
      <IntegerInput output={validateBet} error={playerBetError}/>  
      <button onClick={startRound}>Bet</button>
    </>
  )
}
