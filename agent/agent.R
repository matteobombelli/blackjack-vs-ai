#########################################################
#
# Agent is a Monte-Carlo reinforcement-trained statistical model
# 
# Environment: Dealer visible value, player value, player aces
#
# Action Space: Hit, Stay
#
# Value Function: State-action pair, Q(s, a)
#
#########################################################
######################
# Get a random card
######################
random_card <- function() {
  # Higher likelihood of 10 for J, Q, K
  return(sample(c(2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11), 1))
}

######################
# Add a card to a hand
#
# State[2] = player value
# State[3] = ace
######################
hit <- function(value, ace) {
  value =  as.numeric(value)
  ace =  as.numeric(ace)
  card = random_card()
  
  # Check if card is ace
  if (card == 11) {
    ace = ace + 1
  }
  
  # Check for bust with ace
  if (value + card > 21 && ace > 0) {
    value = value + card - 10
    ace = ace - 1
  } else {
    value = value + card
  }
  
  return(c(value, ace))
}

########################
# Get a random state
#
# state[1] = dealer
# state[2] = player
# state[3] = ace
########################
random_state <- function() {
  
  # Dealer simply gets one card
  dealer = hit(0, 0)[1]
  
  # Player gets 2 cards, track ace
  player_hand = hit(0, 0)
  player_hand = hit(player_hand[1], player_hand[2])
  
  return(c(dealer, player_hand[1], player_hand[2]))
}

########################
# Finalize state
########################
finalize_state <- function(state) {
  # Check for dealer ace
  dealer = state[1]
  if (dealer == 11) {
    dealer_ace = 1
  } else {
    dealer_ace = 0
  }
  
  # Hit the dealer at least once to make a full hand
  # dealer_hand[1] = dealer value
  # dealer_hand[2] = dealer ace
  dealer_hand = hit(dealer, dealer_ace)
  
  # Dealer hits until 17 or over
  while (dealer_hand[1] < 17) {
    dealer_hand = hit(dealer_hand[1], dealer_hand[2])
  }
  
  state[1] = dealer_hand[1]
  
  return(state)
}

########################
# Evaluate state
#
# state[1] = dealer
# state[2] = player
# state[3] = ace
#
# Returns 1 on a player win
# Returns 0 on a tie
# Returns -1 on a player loss
########################
evaluate_state <- function(state) {
  # If player is bust, dealer wins
  dealer = state[1]
  player = state[2]
  
  # Player bust = loss
  if (player > 21) {
    return(-1)
  }
  
  # Only dealer bust = win
  if (player <= 21 && dealer > 21) {
    return(1)
  }
  
  # No busts and player > dealer = win
  if (player > dealer) {
    return(1)
  }
  
  # No busts and player < dealer = lose
  if (player < dealer) {
    return(-1)
  }
  
  # Else, player == dealer = tie
  return(0)

}

########################
# Calculate rewards
########################
# Function to create progressively devalued rewards
create_rewards <- function(reward, gamma, len) {
  # Create a sequence from 0 to (len - 1)
  exponent =  seq(0, len - 1)
  
  # Calculate progressively devalued rewards using vectorized operations
  rewards =  reward * (gamma ^ exponent)
  
  # Reverse the rewards list
  rewards =  rev(rewards)
  
  return(rewards)
}

#################
# Value function
#################
Q <- function(state_actions, gamma) {
  # Calculate reward via final state
  len = nrow(state_actions)
  reward = evaluate_state(finalize_state(state_actions[len, c(1:3)]))
  
  # Return progressively devalued list of rewards
  # Correlates to indices on state_actions
  rewards = create_rewards(reward, gamma, len)
  
  return(rewards)
}

#################
# Assign rewards to policy
#
# Policy is a 4 array
# Policy is the size of every state * every action
#
# Assigns the reward to the state and action
#################
assign_reward <- function(policy, policy_visits, state_action, reward) {
  # Convert the state_action row to numeric
  indices = as.numeric(state_action)
  
  # Increment visits count
  policy_visits[indices[1], indices[2], indices[3] + 1, indices[4]] =
    policy_visits[indices[1], indices[2], indices[3] + 1, indices[4]] + 1
  
  # Calculate new mean
  new_mean = (policy[indices[1], indices[2], indices[3] + 1, indices[4]] + reward) / policy_visits[indices[1], indices[2], indices[3] + 1, indices[4]]
  
  # Assign the reward to the appropriate position in the policy
  policy[indices[1], indices[2], indices[3] + 1, indices[4]] = new_mean
  
  return(list(policy = policy, policy_visits = policy_visits))
}

####################
# Evaluate policy
#
# n is the number of sample states
####################
evaluate_policy <- function(policy, n) {
  wins =  0
  ties =  0
  losses =  0
  for (i in 1:n) {
    # Get a random state
    state = random_state()
    
    # Perform actions on the state until player chooses to stay
    action = which.max(policy[state[1], state[2], state[3] + 1, ])
    
    while (action == 2 && state[2] < 22) { # action 2 signifies hit
      hit_value = hit(state[2], state[3])
      state[2] = hit_value[1]
      state[3] = hit_value[2]
      action = which.max(policy[state[1], state[2], state[3] + 1, ])
    }
    
    # Evaluate the state and tally wins/ties/losses
    state_value = evaluate_state(finalize_state(state))
    if (state_value == 1) {
      wins = wins + 1
    } else if (state_value == 0) {
      ties = ties + 1
    } else {
      losses = losses + 1
    }
  }
  
  return(c(wins / n, ties / n, losses / n))
}

######################
# Train policy
#
# policy and policy visits track policy data
#
# n_episodes is the number of episodes to train over
#
# gamma is the devalue coefficient for each step an action is removed
# from a result
#
# epsilon_start is the starting chance to explore vs exploit
# epsilon_min is the value epsilon_start will linearly decay to over training
######################
monte_carlo_training <- function(policy, policy_visits, n_episodes, gamma, 
                                 epsilon_start, epsilon_min) {
  # Linear epsilon decay
  epsilon_decay = (epsilon_start - epsilon_min) / n_episodes
  
  # Loop episodes
  while (n_episodes > 0) {
    # Reduce epsilon over time
    epsilon = max(epsilon_min, n_episodes * epsilon_decay)
    
    # Get a random state
    state = random_state()
    
    # Randomly explore or exploit based on epsilon
    if (runif(1) > epsilon) {
      action = which.max(policy[state[1], state[2], state[3] + 1, ])
    } else {
      action = sample(1:2, 1)
    }
    
    # Get state actions list
    state_actions = data.frame()
    # Record first state action
    state_actions = rbind(state_actions, c(state, action))
    # While action is to hit
    while (state[2] < 22 && action == 2) {
      
      # Hit player and update state
      hit_value = hit(state[2], state[3])
      state[2] = hit_value[1]
      state[3] = hit_value[2]
      
      # Randomly explore or exploit based on epsilon constant
      if (runif(1) > epsilon) {
        action = which.max(policy[state[1], state[2], state[3] + 1, ])
      } else {
        action = sample(1:2, 1)
      }
      
      # Record state action
      state_actions = rbind(state_actions, c(state, action))
    }
    
    # Calculate and apply rewards to policy
    rewards = Q(state_actions, gamma)
    for (k in seq(1:nrow(state_actions))) {
      updated_policy = assign_reward(policy, policy_visits, state_actions[k, ], rewards[k])
      policy = updated_policy$policy
      policy_visits = updated_policy$policy_visits
    }
    
    n_episodes = n_episodes - 1
  }
  
  return(policy)
}

###########################
# Plot results
###########################
# Load necessary libraries
library(ggplot2)

# Function to create a data frame for the policy and generate plots
create_policy_plots <- function(policy, name) {
  # Generate the policy data frame
  policy_df <- data.frame()
  
  for (dealer in 2:11) {
    for (player in 4:21) {
      for (ace in 0:1) {
        action <- which.max(policy[dealer, player, ace + 1, ])
        policy_df <- rbind(policy_df, data.frame(Dealer = dealer, Player = player, Ace = ace, Action = action))
      }
    }
  }
  
  # Convert Action to descriptive labels
  policy_df$Action <- ifelse(policy_df$Action == 1, "Stay", "Hit")
  
  # Plot for states with an ace
  plot_with_ace <- ggplot(policy_df[policy_df$Ace == 1, ], aes(x = Dealer, y = Player, fill = Action)) +
    geom_tile(color = "white") +
    scale_fill_manual(values = c("Hit" = "red", "Stay" = "blue")) +
    labs(title = paste("Blackjack", name, "Policy Graph (With Ace)"),
         x = "Dealer's Visible Value",
         y = "Player's Value",
         fill = "Action") +
    theme_minimal() +
    theme(panel.grid.major = element_blank(),
          panel.grid.minor = element_blank())
  
  # Plot for states without an ace
  plot_without_ace <- ggplot(policy_df[policy_df$Ace == 0, ], aes(x = Dealer, y = Player, fill = Action)) +
    geom_tile(color = "white") +
    scale_fill_manual(values = c("Hit" = "red", "Stay" = "blue")) +
    labs(title = paste("Blackjack", name, "Policy Graph (Without Ace)"),
         x = "Dealer's Visible Value",
         y = "Player's Value",
         fill = "Action") +
    theme_minimal() +
    theme(panel.grid.major = element_blank(),
          panel.grid.minor = element_blank())
  
  return(list(policy_df = policy_df, plot_with_ace = plot_with_ace, plot_without_ace = plot_without_ace))
}

###################
# Train policies
###################
# Function to train policies with different parameters
train_policy <- function(policy_name, train = TRUE, n_episodes = 100000, 
                         eval_games = 100000, gamma = 1, epsilon_start = 1, 
                         epsilon_end = 1) {
  # Initialize the policy and policy visits array
  policy <- array(0, dim = c(11, 32, 2, 2))
  visits <- array(0, dim = c(11, 32, 2, 2))
  
  # Train the policy (optional)
  if (train ==  TRUE) {
    print(paste("Training", policy_name))
    policy <- monte_carlo_training(policy, visits, n_episodes, gamma, epsilon_start, epsilon_end)
  }
  
  # Display the policy
  # Generate plots for the policy
  results = create_policy_plots(policy, policy_name)
  plot_with_ace = results$plot_with_ace
  plot_without_ace = results$plot_without_ace
  
  # Evaluate the policy win rate
  win_rate = evaluate_policy(policy, eval_games)[1]
  
  # Display the plots and print the win rate
  print(plot_with_ace)
  print(plot_without_ace)
  print(paste(policy_name, "win rate:", win_rate))
  
  return(policy)
}

# Function to convert policy to a data frame
policy_to_dataframe <- function(policy) {
  # Initialize an empty data frame
  policy_df <- data.frame()
  
  # Iterate through each combination of dealer value, player value, and ace presence
  for (dealer in 2:11) {                # Dealer values from 2 to 11
    for (player in 4:21) {              # Player values from 4 to 21
      for (ace in 0:1) {                # Ace presence: 0 (no ace), 1 (ace present)
        # Extract Q-values for both actions (Hit and Stay)
        hit_value = policy[dealer, player, ace + 1, 2]  # Q-value for Hit
        stay_value = policy[dealer, player, ace + 1, 1] # Q-value for Stay
        
        # Append to the data frame
        policy_df <- rbind(policy_df, data.frame(
          Dealer = dealer,
          Player = player,
          Ace = ace,
          HitValue = hit_value,
          StayValue = stay_value
        ))
      }
    }
  }
  
  return(policy_df)
}


##############################
# Main
##############################
policyA <- train_policy("A", n_episodes = 50000, eval_games = 10000, gamma = 1, epsilon_start = 0.2, epsilon_end = 0.2)

# Create the policy data frame for policyA
policyA_df <- policy_to_dataframe(policyA)