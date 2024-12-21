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
  const [agentMessage, setAgentMessage] = useState<string>("");

  const [playerHand, setPlayerHand] = useState<Hand>(new Hand(STARTING_CHIPS));
  const [playerBet, setPlayerBet] = useState<number>(0);
  const [playerBetError, setPlayerBetError] = useState<string>("");
  const [playerBetInput, setPlayerBetInput] = useState<number>(playerBet);
  const [playerTurn, setPlayerTurn] = useState<boolean>(false);
  const [playerMessage, setPlayerMessage] = useState<string>("");

  const [roundOver, setRoundOver] = useState<boolean>(false);
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

  // UseEffect to trigger agent actions
  useEffect(() => {
    if (agentTurn === true
        && dealerHand.length() === 1
        && agentHand.length() >= 2) { // After initial deal
      // Agent performs actions until stay or undefined
      // 1 action every BOT_DELAY ms
      setTimeout(performAgentAction, BOT_DELAY);
    }
  }, [agentTurn, agentHand, dealerHand]);

  // UseEffect to end round on player bust
  useEffect(() => {
    if (playerHand.value > 21) {
      endRound();
    }
  }, [playerHand]);

  // UseEffect to trigger dealer actions
  useEffect(() => {
    if (dealerTurn) {
      setTimeout(performDealerAction, BOT_DELAY);
    }
  }, [dealerTurn, dealerHand]);

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

  function performDealerAction() {
    if (dealerHand.value < 16) { // Hit until 16 or higher
      hit(dealerHand, setDealerHand);
    } else { // value >= 16, end turn
      setDealerTurn(false);
      scoreRound();
    }
  }

  // Returns 2 if player hand beats dealer hand
  // Returns 1 if tie
  // Returns 0 otherwise
  function compareHands(player: number, dealer: number): number {
    if (player > 21) { // Case 1: player bust, *
      return 0;
    }
    if (player <= 21 && dealer > 21) { // Case 2: player no bust, dealer bust
      return 2;
    }
    if (player <= 21 && dealer <= 21 && player > dealer) { // Case 3: no busts, player > dealer
      return 2;
    }
    if (player <= 21 && dealer <= 21 && dealer > player) { // Case 4: no busts, player < dealer
      return 0;
    }
    // Player == dealer
    return 1;
  }

  function resultMessage(winValue: number): string {
    switch (winValue) {
      case 2:
        return "Win!";
      case 1:
        return "Push";
    }
    return "Lose";
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
    setPlayerTurn(false);
    setDealerTurn(true);
  }

  function scoreRound() {
    // Reward player on win
    let updatePlayerHand = playerHand.clone();
    let playerWinValue = compareHands(playerHand.value, dealerHand.value);
    updatePlayerHand.winChips(playerBet * playerWinValue);

    // Reward agent on win
    let updateAgentHand = agentHand.clone();
    let agentWinValue = compareHands(agentHand.value, dealerHand.value);
    updateAgentHand.winChips(agentBet * agentWinValue);

    // Display messages
    setPlayerMessage(resultMessage(playerWinValue));
    setAgentMessage(resultMessage(agentWinValue));

    // Set hands (new chips)
    setPlayerHand(updatePlayerHand);
    setAgentHand(updateAgentHand);

    // Set round as over
    setRoundOver(true);
  }

  function resetRound() {
    let updateDealerHand = dealerHand.clone();
    let updateAgentHand = agentHand.clone();
    let updatePlayerHand = playerHand.clone();

    // Reset cards
    updateDealerHand = new Hand(dealerHand.chips);
    updateAgentHand = new Hand(agentHand.chips);
    updatePlayerHand = new Hand(playerHand.chips);;

    setDealerHand(updateDealerHand);
    setAgentHand(updateAgentHand);
    setPlayerHand(updatePlayerHand);

    // Reset bets
    setPlayerBet(0);
    setAgentBet(0);

    // Reset Messages
    setPlayerMessage("");
    setAgentMessage("");

    // Set round as not over
    setRoundOver(false);
  }

  return (
    <>
      <div className="game-container">
        <div className="hand-container">
          <HandContainer hand={dealerHand} bet={-1} name={"Dealer"} message={""}/>
        </div>
        <div className="hand-container">
          <HandContainer hand={playerHand} bet={playerBet} name={"Player"} message={playerMessage} />
          <HandContainer hand={agentHand} bet={agentBet} name={"Agent"} message={agentMessage} />
        </div>
        <div className="controls-container">
          <button onClick={() => hit(playerHand, setPlayerHand)} disabled={!playerTurn || playerHand.value > 21}>Hit</button>
          <button onClick={endRound} disabled={!playerTurn}>Stay</button>
          <IntegerInput output={setPlayerBetInput} error={playerBetError} isEditable={!playerTurn} />  
          <button onClick={startRound} disabled={playerTurn || agentTurn || dealerTurn || roundOver}>Bet</button>
          <button onClick={resetRound} disabled={!roundOver}>Next Round</button>
        </div>
      </div>
      <div className="description">
      </div>
    </>
  );
}