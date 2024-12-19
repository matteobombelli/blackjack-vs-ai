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

  // Ensure betting is valid
  function handleBet() {
    
  }

  return (
    <>
      <IntegerInput />
      <button onClick={handleBet}>Make Bet</button>
      <br />
      <HandContainer hand={playerHand} bet={playerBet} name={"Player"}/> 
    </>
  )
}
