import { useState } from 'react'
import './App.css'
import { Card, Deck } from './objects/Deck.ts'
import Hand from './objects/Hand.ts'
import HandContainer from './components/HandContainer.tsx'
import IntegerInput from './components/IntegerInput.tsx'

const SHOE_SIZE: number = 4; // Number of full decks in a shoe
const STARTING_CHIPS: number = 100;
const BOT_DELAY: number = 500; // How long the agent and dealer wait between each action
const AGENT_BET_PCHIPS: number = 0.5; // The percentage of its chips the agent bets every round
const AGENT_BET_ROUNDUP: number = 10; // The number of chips the agent will round its bet up to, also min bet

export default function App() {
  const [deck, setDeck] = useState<Deck>(new Deck(SHOE_SIZE));

  const [dealerHand, setDealerHand] = useState<Hand>(new Hand(-1));

  const [agentHand, setAgentHand] = useState<Hand>(new Hand(STARTING_CHIPS));
  const [agentBet, setAgentBet] = useState<number>(0);

  const [playerHand, setPlayerHand] = useState<Hand>(new Hand(STARTING_CHIPS));
  const [playerBet, setPlayerBet] = useState<number>(0);
  const [playerBetError, setPlayerBetError] = useState<string>("");

  const [gameOver, setGameOver] = useState<boolean>(false);
  const [roundStarted, setRoundStarted] = useState<boolean>(false);
  const [playerBetInput, setPlayerBetInput] = useState<number>(playerBet);

  function validateBet(bet: number, chips: number): string {
    if (bet > Number.MAX_SAFE_INTEGER) // Check for overflow
      return "Invalid Bet: Overflow";
    else if (bet <= 0) // Check if bet is non-positive
      return "Bet must be positive";
    else if (bet > chips) // Check if bet exceeds chips
      return "Not Enough Chips";
    else  // Valid Bet
      return ""; // No error
  }

  function startRound() {
    // Set player bet
    let betError = validateBet(playerBetInput, playerHand.chips);
    if (betError !== "") { // Invalid bet, break
      setPlayerBetError(betError);
      return;
    }

    // Initialize update hands and bets
    let updateDealerHand = dealerHand.clone();
    let updateAgentHand = agentHand.clone();
    let updatePlayerHand = playerHand.clone();
    let updatePlayerBet;
    let updateAgentBet;

    // Valid bet in playerBetInput
    updatePlayerBet = playerBetInput;
    updatePlayerHand.betChips(updatePlayerBet);

    // Agent Bet
    // Select min between estimated bet and total agent chips
    updateAgentBet = Math.min(agentHand.chips,
      Math.ceil((agentHand.chips * AGENT_BET_PCHIPS) / AGENT_BET_ROUNDUP) * AGENT_BET_ROUNDUP);
    updateAgentHand.betChips(updateAgentBet);

    // Initial Deal
    updateDealerHand.addCard(deck.popCard()); // 1 card for dealer

    updateAgentHand.addCard(deck.popCard()); // 2 cards for agent
    updateAgentHand.addCard(deck.popCard());

    updatePlayerHand.addCard(deck.popCard()); // 2 cards for player
    updatePlayerHand.addCard(deck.popCard()); // 2 cards for player
    
    // Agent makes moves from ./model.json
    // 1 move per AGENT_DELAY milliseconds
    
    // Set the updated hands, bets, and deck
    setDealerHand(updateDealerHand);
    setAgentHand(updateAgentHand); // This triggers agent logic, round starts after
    setPlayerHand(updatePlayerHand);
    
    setAgentBet(updateAgentBet);
    setPlayerBet(updatePlayerBet);

    setDeck(deck);
  }

  function hit(hand: Hand, setHand: React.Dispatch<React.SetStateAction<Hand>>) {
    let updateHand: Hand = hand.clone();

    updateHand.addCard(deck.popCard());
    setHand(updateHand);
    setDeck(deck);
  }

  function endRound() {
    // Set round ended
    setRoundStarted(false); // This triggers dealer logic

    // Trigger dealer logic

    // Deal
    // Give winnings

    // Reset bets to 0

    // Get new deck if necessary
    // if deck > 50% used, replace

    

    // Determine Game Over

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
        <button onClick={() => hit(playerHand, setPlayerHand)} disabled={!roundStarted || playerHand.value > 21}>Hit</button>
        <button onClick={endRound} disabled={!roundStarted}>Stay</button>
        <IntegerInput output={setPlayerBetInput} error={playerBetError} isEditable={!roundStarted} />  
        <button onClick={startRound} disabled={roundStarted || playerBetError != ""}>Bet</button>
      </div>
      <div className="description">
        <p>{deck.length()}</p>
      </div>
    </>
  )
}