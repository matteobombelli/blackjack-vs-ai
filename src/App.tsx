import { useState, useEffect, useRef } from 'react'
import './App.css'
import { Deck } from './objects/Deck.ts'
import Hand from './objects/Hand.ts'
import HandContainer from './components/HandContainer.tsx'
import IntegerInput from './components/IntegerInput.tsx'
import GameOver from './components/GameOver.tsx'

const SHOE_SIZE: number = 4; // Number of full decks in a shoe
const SHOE_MIN_CAPACITY = 0.5;
const STARTING_CHIPS: number = 100;
const BOT_DELAY: number = 750; // How long the agent and dealer wait between each action
const AGENT_BET_PCHIPS: number = 0.5; // The percentage of its chips the agent bets every round
const AGENT_BET_ROUNDUP: number = 10; // The number of chips the agent will round its bet up to, also min bet

type ActionTuple = {
  Dealer: number;
  Player: number;
  Ace: number;
  Action: number;
};

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}  

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

  const [roundStarted, setRoundStarted] = useState<boolean>(false);
  const [roundOver, setRoundOver] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [highscore, setHighscore] = useState<number>(0);
  const [winner, setWinner] = useState<string>("");

  // Audio references
  const cardSound = useRef<HTMLAudioElement | null>(null);
  const chipSound = useRef<HTMLAudioElement | null>(null);

  // Load audio on mount
  useEffect(() => {
    cardSound.current = new Audio('../cardSound.mp3'); // Replace with actual file path
    chipSound.current = new Audio('../chipSound.mp3'); // Replace with actual file path
  }, []);

  // Helper function to play audio
  const playSound = (audio: HTMLAudioElement | null) => {
    if (audio) {
      audio.currentTime = 0; // Reset to start if already playing
      audio.play().catch((err) => console.error('Error playing sound:', err));
    }
  };

  // Load ./model.json into modelActions[] on component mount
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
    let updateDeck: Deck = deck.clone();
    
    playSound(cardSound.current);
    updateHand.addCard(updateDeck.popCard());
    setHand(updateHand);
    setDeck(updateDeck);
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

  // Helper function to compare hands
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

  async function startRound() {
    // Set player bet
    let betError = validateBet(playerBetInput, playerHand.chips);
    if (betError !== "") { // Invalid bet, break
      setPlayerBetError(betError);

      return;
    }

    // Set round started
    setRoundStarted(true);

    // Initialize update hands and bets
    let updateDeck: Deck = deck.clone()
    let updateDealerHand: Hand = dealerHand.clone();
    let updateAgentHand: Hand = agentHand.clone();
    let updatePlayerHand: Hand = playerHand.clone();
    let updatePlayerBet: number;
    let updateAgentBet: number;

    // Valid bet in playerBetInput
    updatePlayerBet = playerBetInput;
    updatePlayerHand.betChips(updatePlayerBet);

    // Agent Bet
    // Select min between estimated bet and total agent chips
    updateAgentBet = Math.min(agentHand.chips,
      Math.ceil((agentHand.chips * AGENT_BET_PCHIPS) / AGENT_BET_ROUNDUP) * AGENT_BET_ROUNDUP);
    updateAgentHand.betChips(updateAgentBet);

    // Initial Deal
    updateDealerHand.addCard(updateDeck.popCard()); // 1 card for dealer

    updateAgentHand.addCard(updateDeck.popCard()); // 2 cards for agent
    updateAgentHand.addCard(updateDeck.popCard());

    updatePlayerHand.addCard(updateDeck.popCard()); // 2 cards for player
    updatePlayerHand.addCard(updateDeck.popCard()); // 2 cards for player
    
    // Set the updated hands, bets, and deck
    await delay(BOT_DELAY);
    playSound(chipSound.current);
    setAgentBet(updateAgentBet);
    setPlayerBet(updatePlayerBet);
    
    await delay(BOT_DELAY);
    playSound(cardSound.current);
    setDealerHand(updateDealerHand);
    await delay(BOT_DELAY);
    playSound(cardSound.current);
    setAgentHand(updateAgentHand);
    await delay(BOT_DELAY);
    playSound(cardSound.current);
    setPlayerHand(updatePlayerHand);

    setDeck(updateDeck);
      
    // Start agent's turn
    setAgentTurn(true);
  }

  function endRound() {
    setPlayerTurn(false);
    setDealerTurn(true);
  }

  function scoreRound() {
    // Reward player on win
    let updatePlayerHand: Hand = playerHand.clone();
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
    setRoundStarted(false);
    playSound(chipSound.current);

    // Capture highscores & update winner
    if (updateAgentHand.chips > highscore) {
      setHighscore(updateAgentHand.chips);
      setWinner("Agent");
    } else if (updatePlayerHand.chips > highscore) {
      setHighscore(updatePlayerHand.chips);
      setWinner("Player");
    }
    
    // Check for GameOver
    if (updatePlayerHand.chips <= 0 || updateAgentHand.chips <= 0) { // Game over
      setGameOver(true);
    }
  }

  function resetRound() {
    // Check if deck is < SHOE_MIN_CAPACITY
    if (deck.length() < SHOE_SIZE * 52 * SHOE_MIN_CAPACITY) {
      setDeck(new Deck(SHOE_SIZE)); // Get new deck
    }

    // Reset cards
    let updateDealerHand: Hand = new Hand(dealerHand.chips);
    let updateAgentHand: Hand = new Hand(agentHand.chips);
    let updatePlayerHand: Hand = new Hand(playerHand.chips);

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
    playSound(cardSound.current);
  }

  function restartGame() {
    setDeck(new Deck(SHOE_SIZE));
    setDealerHand(new Hand(-1));
    setAgentHand(new Hand(STARTING_CHIPS));
    setPlayerHand(new Hand(STARTING_CHIPS));
  
    setPlayerBet(0);
    setAgentBet(0);
    setPlayerBetInput(0);
  
    setPlayerMessage("");
    setAgentMessage("");
    setHighscore(0);
    setWinner("");
  
    setRoundStarted(false);
    setRoundOver(false);
    setGameOver(false);
    setPlayerTurn(false);
    setDealerTurn(false);
    setAgentTurn(false);
  
    playSound(cardSound.current);
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
          <IntegerInput output={setPlayerBetInput} error={playerBetError} isEditable={!playerTurn} reset={gameOver} />  
          <button onClick={startRound} disabled={roundStarted || roundOver}>Bet</button>
          <button onClick={resetRound} disabled={!roundOver || gameOver}>Next Round</button>
        </div>
        <GameOver winner={winner} highscore={highscore} visible={gameOver} reset={restartGame} />
      </div>
      <div className="description">
      </div>
    </>
  );
}