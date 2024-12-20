import { useState, useEffect } from 'react'
import './App.css'
import { Card, Deck } from './objects/Deck.ts'
import Hand from './objects/Hand.ts'
import HandContainer from './components/HandContainer.tsx'
import IntegerInput from './components/IntegerInput.tsx'

const SHOE_SIZE: number = 4; // Number of full decks in a shoe
const STARTING_CHIPS: number = 100;
const BOT_DELAY: number = 1000; // How long the agent and dealer wait between each action
const AGENT_BET_PCHIPS: number = 0.5; // The percentage of its chips the agent bets every round
const AGENT_BET_ROUNDUP: number = 10; // The number of chips the agent will round its bet up to, also min bet

type ActionTuple = {
  Dealer: number;
  Player: number;
  Ace: number;
  Action: number;
};

export default function App() {
  const [deck, setDeck] = useState<Deck>(new Deck(SHOE_SIZE));

  const [dealerHand, setDealerHand] = useState<Hand>(new Hand(-1));
  const [dealerTurn, setDealerTurn] = useState<boolean>(false);

  const [agentHand, setAgentHand] = useState<Hand>(new Hand(STARTING_CHIPS));
  const [agentBet, setAgentBet] = useState<number>(0);
  const [agentTurn, setAgentTurn] = useState<boolean>(false);
  const [modelActions, setModelActions] = useState<ActionTuple[]>([]);

  const [playerHand, setPlayerHand] = useState<Hand>(new Hand(STARTING_CHIPS));
  const [playerBet, setPlayerBet] = useState<number>(0);
  const [playerBetError, setPlayerBetError] = useState<string>("");
  const [playerBetInput, setPlayerBetInput] = useState<number>(playerBet);
  const [playerTurn, setPlayerTurn] = useState<boolean>(false);

  const [gameOver, setGameOver] = useState<boolean>(false);

  // Function to load ./model.json into modelActions[] on component mount
  useEffect(() => {
    const loadData = async () => {
      const response = await fetch('../model.json');
      const data: ActionTuple[] = await response.json();
      setModelActions(data);
    };
    
    loadData();
  }, []);

  // Function to trigger agent actions
  useEffect(() => { // Perform agent actions
    if (agentTurn == true
        && dealerHand.length() == 1
        && agentHand.length() >= 2) { // After initial deal
      // Agent performs actions until stay or undefined
      // 1 action every BOT_DELAY ms
      setTimeout(performAgentAction, BOT_DELAY);
    }
  }, [agentTurn, agentHand, dealerHand]);

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

  function hit(hand: Hand, setHand: React.Dispatch<React.SetStateAction<Hand>>) {
    let updateHand: Hand = hand.clone();

    updateHand.addCard(deck.popCard());
    setHand(updateHand);
    setDeck(deck);
  }

  function performAgentAction() {
    enum Action {
      HIT = 2,
      STAY = 1,
      NULL = 0,
    }

    let ace: number = agentHand.usableAce ? 1 : 0;
    const entry: ActionTuple | undefined = modelActions.find(item => 
      item.Dealer === dealerHand.value && item.Player === agentHand.value && item.Ace === ace
    )
    const action: Action = entry ? entry.Action : Action.NULL;

    if (action === Action.HIT) { // Hit and continue loop
      hit(agentHand, setAgentHand);
    } else { // Stop loop
      setAgentTurn(false); // End agent turn
      setPlayerTurn(true); // Go to player turn
    }
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
    
    // Set the updated hands, bets, and deck
    setDealerHand(updateDealerHand);
    setAgentHand(updateAgentHand);
    setPlayerHand(updatePlayerHand);
    
    setAgentBet(updateAgentBet);
    setPlayerBet(updatePlayerBet);

    setDeck(deck);
      
    // Start agent's turn
    setAgentTurn(true);
  }

  function endRound() {
    // Set round ended
    setPlayerTurn(false); // This triggers dealer logic

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
        <button onClick={() => hit(playerHand, setPlayerHand)} disabled={!playerTurn || playerHand.value > 21}>Hit</button>
        <button onClick={endRound} disabled={!playerTurn}>Stay</button>
        <IntegerInput output={setPlayerBetInput} error={playerBetError} isEditable={!playerTurn} />  
        <button onClick={startRound} disabled={playerTurn || playerBetError != ""}>Bet</button>
      </div>
      <div className="description">
        <p>{agentHand.value}</p>
      </div>
    </>
  )
}