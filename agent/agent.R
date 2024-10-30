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
  return(sample(2:11, 1))
}

########################
# Get a random state
#
# state[1] = dealer
# state[2] = player
# state[3] = ace
########################
random_state <- function() {
  
  dealer = random_card()
  
  card1 = random_card()
  card2 = random_card()
 
  # Check for ace
  if (card1 == 11 || card2 == 11) {
    ace = 1
  } else {
    ace = 0
  }
  
  # Check for double ace
  if (card1 == 11 && card2 == 11) {
    player = 12
  } else {
    player = card1 + card2
  }
  
  return(c(dealer, player, ace))
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
    ace =  ace + 1
  }
  
  # Check for bust with ace
  if (value + card > 21 && ace > 0) {
    value = value + card - 10
    ace =  ace - 1
  } else {
    value = value + card
  }
  
  return(c(value, ace))
}

########################
# Evaluate state
#
# state[1] = dealer
# state[2] = player
# state[3] = ace
#
# Returns 0 on a tie
# Returns 1 on a player win
# Returns -1 on a dealer win
########################
evaluate_state <- function(state) {
  # If player is bust, dealer wins
  if (state[2] > 21) {
    return(-1)
  }
  
  # Check for dealer ace
  if (state[1] == 11) {
    dealer_ace = 1
  } else {
    dealer_ace = 0
  }
  
  # Hit the dealer at least once to make a full hand
  # dealer[1] = dealer value
  # dealer[2] = dealer ace
  dealer = hit(state[1], dealer_ace)
  
  # Dealer hits until 17 or over
  while (dealer[1] < 17) {
    dealer = hit(dealer[1], dealer[2])
  }
  
  # Player is not bust at this point
  # Calculate winning state by hand comparison
  if (state[2] > dealer[1] || dealer[1] > 21) {
    return(1) # Player > dealer or dealer bust, player win
  } else if (state[2] < dealer[1]) {
    return(-1) # Player < dealer, dealer win
  } else {
    return(0) # Player == dealer, tie
  }
}

########################
# Calculate rewards
########################
# Function to create progressively devalued rewards
create_rewards <- function(reward, devalue, len) {
  # Create a sequence from 0 to (len - 1)
  exponent =  seq(0, len - 1)
  
  # Calculate progressively devalued rewards using vectorized operations
  rewards =  reward * (devalue ^ exponent)
  
  # Reverse the rewards list
  rewards =  rev(rewards)
  
  return(rewards)
}

#################
# Value function
#################
Q <- function(state_actions, devalue) {
  # Calculate reward via final state
  len = nrow(state_actions)
  reward = evaluate_state(state_actions[len, c(1:3)])
  
  # Return progressively devalued list of rewards
  # Correlates to indices on state_actions
  rewards = create_rewards(reward, devalue, len)
  
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
assign_reward <- function(policy, state_action, reward) {
  # Convert the state_action row to numeric
  indices = as.numeric(state_action)
  
  # Assign the reward to the appropriate position in the policy
  policy[indices[1], indices[2], indices[3] + 1, indices[4]] = 
    reward + policy[indices[1], indices[2], indices[3] + 1, indices[4]]
  
  return(policy)
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
  while (n > 0) {
    # Get a random state
    state = random_state()
    
    # Perform actions on the state until player chooses to stay
    hit_total_reward = policy[state[1], state[2], state[3] + 1, 2]
    stay_total_reward = policy[state[1], state[2], state[3] + 1, 1]
    
    while (hit_total_reward > stay_total_reward && state[2] < 21) {
      hit_value = hit(state[2], state[3])
      state[2] = hit_value[1]
      state[3] = hit_value[2]
      hit_total_reward = policy[state[1], state[2], state[3] + 1, 2]
      stay_total_reward = policy[state[1], state[2], state[3] + 1, 1]
    }
    
    # Evaluate the state and tally wins/ties/losses
    state_value = evaluate_state(state)
    if (state_value == 1) {
      wins = wins + 1
    } else if (state_value == 0) {
      ties = ties + 1
    } else {
      losses = losses + 1
    }
    
    n = n - 1
  }
  
  # Return wins, ties, losses %
  total = wins + ties + losses
  return(c(wins / total, ties / total, losses / total))
}

######################
# Train policy
#
# n is the maximum number of sample states and the number of testing samples
# m is the number of sample states between each accuracy test
# q is the number of accuracy tests that see no growth before we end the
# loop prematurely
#
# Devalue is the coefficient to lesser reward previous actions
#
# min_improvement is the minimum variance ratio needed to keep the iterating
#
# print = TRUE will print status messages every test
######################
monte_carlo_training <- function(policy, n, m, q, min_variation, devalue, print = FALSE) {
  improving = TRUE
  i = 1
  q = 5
  accuracy = as.list(rep(0, q))
  j = 0
  while (j < n && improving ==TRUE) {
    # Get a random state
    state = random_state()
    
    # Perform random actions on the state until the agent stays or hits 21
    # or busts
    state_actions = data.frame()
    action = sample(1:2, 1)
    state_actions = rbind(state_actions, c(state, action))
    while (state[2] <= 21 && action == 2) {
      
      hit_value = hit(state[2], state[3])
      state[2] = hit_value[1]
      state[3] = hit_value[2]
      action = sample(1:2, 1)
      state_actions = rbind(state_actions, c(state, action))
    }
    
    # Calculate and apply rewards to policy
    rewards = Q(state_actions, devalue)
    for (k in seq(1:nrow(state_actions))) {
      policy = assign_reward(policy, state_actions[k, ], rewards[k])
    }
    
    # Test the accuracy of the policy
    if (j %% m == 0 && j > 0) {
      accuracy[[i]] = evaluate_policy(policy, n)
      
      # Get first column (win %)
      accuracy_matrix =  do.call(rbind, accuracy)
      accuracy_history = accuracy_matrix[, 1]
      
      # Calculate the averages for the first column (win %)
      average = mean(accuracy_history)
      
      # Calculate the tolerance range around the average
      tolerance = min_variation * average
      lower_bound =  average - tolerance
      upper_bound =  average + tolerance
      
      # Check if any win % is outside the tolerance
      improving = FALSE
      for (win_p in accuracy_history) {
        if (win_p <= lower_bound || win_p >= upper_bound) {
          improving = TRUE
          break
        }
      }
      
      # Print status messages
      if (print) {
        print(accuracy[[i]])
      }
      
      i =  (i %% q) + 1
    }
    
    j = j + 1
  }
  
  return(policy)
}

###################
# Train policy
###################
# Initialize a 4D array policy with dimensions 11 x 32 x 2 x 2
policy <- array(0, dim = c(11, 32, 2, 2))

# max 100000 samples (also test samples), 5000 per iteration, 10 iteration history,
# minimum variance of 1% in history, devalue rewards to 90% per step,
# print test results at each iteration
policy <- monte_carlo_training(policy, 100000, 5000, 10, 0.01, 0.3, TRUE)

###########################
# Plot results
###########################
# Load necessary libraries
library(ggplot2)
library(reshape2)

# Create a function to generate a data frame for the policy
create_policy_dataframe <- function(policy) {
  data <- data.frame()
  
  # Loop through all states and actions to create a data frame
  for (dealer in 2:11) {
    for (player in 4:21) {
      for (ace in 0:1) {
        # Get the action with the highest value for the given state
        action <- which.max(policy[dealer, player, ace + 1, ])
        # Store the dealer, player, ace, and action in the data frame
        data <- rbind(data, data.frame(Dealer = dealer, Player = player, Ace = ace, Action = action))
      }
    }
  }
  
  # Convert Action to descriptive labels
  data$Action <- ifelse(data$Action == 1, "Stay", "Hit")
  
  return(data)
}

# Generate the policy data frame
policy_df <- create_policy_dataframe(policy)

# Plot for states with an ace
plot_with_ace <- ggplot(policy_df[policy_df$Ace == 1, ], aes(x = Dealer, y = Player, fill = Action)) +
  geom_tile(color = "white") +
  scale_fill_manual(values = c("Hit" = "red", "Stay" = "blue")) +
  labs(title = "Blackjack Policy Graph (With Ace)",
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
  labs(title = "Blackjack Policy Graph (Without Ace)",
       x = "Dealer's Visible Value",
       y = "Player's Value",
       fill = "Action") +
  theme_minimal() +
  theme(panel.grid.major = element_blank(),
        panel.grid.minor = element_blank())

# Display the plots
print(plot_with_ace)
print(plot_without_ace)