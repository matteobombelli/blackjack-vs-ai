###############################################################################
#
# Agent is a Monte-Carlo reinforcement-trained statistical model
# 
# Environment: Dealer visible value, player value, player aces
#
# Action Space: Hit, Stay
#
# Value Function: State-action pair, Q(s, a)
#
###############################################################################

##########################
# BLACKJACK FUNCTIONALITY
#########################

# Get a random card
random_card <- function() {
  # Higher likelihood of 10 for J, Q, K
  return(sample(c(2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11), 1))
}

# Add a card to a hand
# Accounts for soft hands with aces
#
# State[2] = player value
# State[3] = ace (1 = NO, 2 = YES)
hit <- function(value, ace) {
  value =  as.numeric(value)
  ace =  as.numeric(ace)
  card = random_card()
  
  # Check if card is ace
  if (card == 11) {
    ace = ace + 1
  }
  
  # Check for bust with ace
  if (value + card > 21 && ace > 1) {
    value = value + card - 10
    ace = ace - 1
  } else {
    value = value + card
  }
  
  return(c(value, ace))
}

# Get a random state
#
# state[1] = dealer
# state[2] = player
# state[3] = ace (1 = NO, 2 = YES)
random_state <- function() {
  
  # Dealer simply gets one card
  dealer = sample(2:11, 1)
  
  # Player gets 2 cards, track ace
  player_1 = sample(2:11, 1)
  player_2 = sample(2:11, 1)
  
  if (player_1 == 11 && player_2 == 11) {
    player = 12
    ace = 2
  } else if (player_1 == 11 || player_2 == 11) {
    player = player_1 + player_2
    ace = 2
  } else {
    player = player_1 + player_2
    ace = 1
  }
  
  return(c(dealer, player, ace))
}

# Get a real state
#
# Difference from random state is cards are dealt with weights to a deck
real_state <- function() {
  
  # Dealer simply gets one card
  dealer = hit(0, 1)[1]
  
  # Player gets 2 cards, track ace
  player_hand = hit(0, 1)
  player_hand = hit(player_hand[1], player_hand[2])
  
  return(c(dealer, player_hand[1], player_hand[2]))
}

# Finalize state
#
# Follows dealer logic (hit until >= 17) to calculate the final
# dealer hand
finalize_dealer <- function(s) {
  # Check for dealer ace
  dealer = s[1]
  if (dealer == 11) {
    dealer_ace = 2
  } else {
    dealer_ace = 1
  }
  
  # dealer_hand[1] = dealer value
  # dealer_hand[2] = dealer ace
  dealer_hand = c(dealer, dealer_ace)
  
  # Dealer hits until 17 or over
  while (dealer_hand[1] < 17) {
    dealer_hand = hit(dealer_hand[1], dealer_hand[2])
  }
  
  s[1] = dealer_hand[1]
  return(s)
}

###########
# TRAINING
###########

# Reward function
#
# Returns a reward based on the state
#
# state[1] = dealer
# state[2] = player
# state[3] = ace
#
# Returns 1 on a player win
# Returns 0 on a tie
# Returns -1 on a player loss
R <- function(s) {
  # If player is bust, dealer wins
  dealer = s[1]
  player = s[2]
  
  # Player bust = loss
  if (player > 21) {
    return(-1)
  }
  
  # Only dealer bust = win
  if (dealer > 21) {
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

# Returns function
#
# Map is a 4D array of state-actions
#
# Adds a constant 'add' to the s, a on the map
#
# Returns the updated map and the new total return for the s, a
Returns <- function(s, a, map, add = 0) {
  
  map[s[1], s[2], s[3], a] = map[s[1], s[2], s[3], a] + add
  return = map[s[1], s[2], s[3], a]
  
  return(list(map = map, return = return))
}

# Visits function
#
# Map is a 4D array of state-actions
#
# if visited == TRUE, adds 1 to the s, a
#
# Returns the updated map and the new total visits for the s, a
N <- function(s, a, map, visited = FALSE) {
  
  add = ifelse(visited, 1, 0)
  map[s[1], s[2], s[3], a] = map[s[1], s[2], s[3], a] + add
  visits = map[s[1], s[2], s[3], a]
  
  return(list(map = map, visit = visits))
}

# Value function
#
# Map is a 4D array of state-actions
#
# if update == TRUE
# Updates the expected value for each s, a based on the total return
# and number of visits
#
# else
# Makes no changes to the map
#
# Returns the updated map and the new moving average for the s, a
Q <- function(s, a, map, return = 1, visits = 1, update = FALSE) {
  
  if (update) {
    map[s[1], s[2], s[3], a] = return / visits
  }
  
  expected_value = map[s[1], s[2], s[3], a]
  
  return(list(map = map, value = expected_value))
}

# Training function
#
# n_episodes = # of training episodes
# gamma = reward decay function
# epsilon_start = 0-1 probability to explore, decays by 1% each visit
# *epsilon decays exponentially
# 
# Returns a policy as a 4D array of actions based on the state
monte_carlo_BJ <- function(n_episodes = 50000, gamma = 1, epsilon_start = 1) { 
  # Initialize
  # visible dealer card (max=11), player value (max=21), player ace (T/F),
  # action (hit/stay)
  policy <- array(0, dim = c(11, 21, 2))
  returns <- array(0, dim = c(11, 21, 2, 2))
  visits <- array(0, dim = c(11, 21, 2, 2))
  expected_values <- array(0, dim = c(11, 21, 2, 2))
  
  # For each episode
  for (episode in seq(1, n_episodes)) {
    
    # Generate an episode
    episode = list()
    s = random_state() # Random state
    while (s[2] < 22) {
      # Calculate the average visits for both actions (1 and 2)
      visit_count1 = visits[s[1], s[2], s[3], 1]
      visit_count2 = visits[s[1], s[2], s[3], 2]
      avg_visits = (visit_count1 + visit_count2) / 2
      
      # Calculate epsilon with average visit count
      epsilon = epsilon_start * (100 / (100 + avg_visits))
      
      # Explore vs Exploit action based on epsilon
      a = ifelse(runif(1) > epsilon && policy[s[1], s[2], s[3]] != 0, 
                 policy[s[1], s[2], s[3]], sample(1:2, 1))
      # Append state and action to episode
      episode = append(episode, list(c(s, a)))
      
      if (a == 2) { # hit, modify state
        hit_s = hit(s[2], s[3])
        s[2] = hit_s[1]
        s[3] = hit_s[2]
      } else { # stay, end episode early
        break;
      }
    }
    # Append final state for evaluation
    episode = append(episode, list(c(s, 0)))
    
    # For each step of episode
    # Emphasize value of final state, winning overall matters more
    final_result = R(finalize_dealer(episode[[length(episode)]]))
    G = 0
    for (t in seq(from = length(episode) - 1, to = 1, by = -1)) {
      # t, t-1, t-2, ...
      # t is the last step of the episode, t-1 second last, etc.
      
      # Initialize s, a
      s = episode[[t]][1:3]
      a = episode[[t]][4]
      # Get a result for the last state
      last_s = episode[[t + 1]][1:3]
      last_s = finalize_dealer(last_s)
      # Get Reward as average of total rewards over episode so far, devalued by gamma
      G = ((gamma * G) + R(last_s)) / (length(episode) - t)
      # Add reward to returns[s, a]
      return_values = Returns(s, a, returns, add = G)
      returns = return_values$map
      return = return_values$return
      # Update expected values
      visits_values = N(s, a, visits, visited = TRUE)
      visits = visits_values$map
      visit = visits_values$visit
      
      expected_values = Q(s, a, expected_values, return = return, visits = visit, 
                          update = TRUE)$map
      
      # Update policy to be greatest expected value
      stay_expected = expected_values[s[1], s[2], s[3], 1]
      hit_expected = expected_values[s[1], s[2], s[3], 2]
      
      if (stay_expected > hit_expected) {
        policy_action = 1
      } else if (hit_expected > stay_expected) {
        policy_action = 2
      } else {
        # Break ties randomly
        policy_action = sample(1:2, 1)
      }
      
      policy[s[1], s[2], s[3]] = policy_action
    }
  }
  
  return(policy)
}

###########
# PLOT
###########

# Function to convert policy to a data frame
policy_to_dataframe <- function(policy) {
  # Initialize vectors to store the data
  dealer_values <- c()
  player_values <- c()
  ace_values <- c()
  actions <- c()
  
  # Iterate through each combination of dealer value, player value, and ace presence
  for (dealer in 2:11) {                # Dealer values from 2 to 11
    for (player in 4:21) {              # Player values from 4 to 21
      for (ace in 1:2) {                # Ace presence: 1 (no ace), 2 (ace present)
        # Extract action
        action = policy[dealer, player, ace]
        
        # Append to vectors
        dealer_values <- c(dealer_values, dealer)
        player_values <- c(player_values, player)
        ace_values <- c(ace_values, ace - 1)  # 0 for no ace, 1 for ace present
        actions <- c(actions, action)
      }
    }
  }
  
  # Combine vectors into a data frame
  policy_df <- data.frame(
    Dealer = dealer_values,
    Player = player_values,
    Ace = ace_values,
    Action = actions
  )
  
  return(policy_df)
}

# Load necessary libraries
library(ggplot2)
library(reshape2)

# Function to create heat maps of the policy for both ace and no ace
heat_map_policy <- function(policy_df, name) {
  # Ensure Action is a factor with appropriate levels
  policy_df$Action <- factor(policy_df$Action, levels = c(0, 1, 2), labels = c("No Data", "Stay", "Hit"))
  
  # Create a heat map for the case where ace is present
  policy_ace <- policy_df[policy_df$Ace == 1, ]  # 1 for Ace Present
  
  # Create a heat map for the case where ace is not present
  policy_no_ace <- policy_df[policy_df$Ace == 0, ]  # 0 for No Ace
  
  # Function to plot individual heat map
  plot_heat_map <- function(data, title) {
    if (nrow(data) == 0) {
      warning("No data available for this heat map: ", title)
      return(NULL)
    }
    
    ggplot(data, aes(x = Dealer, y = Player)) +
      geom_tile(aes(fill = Action), color = "white") +  # Use fill for the Action
      scale_fill_manual(values = c("No Data" = "darkgray", "Stay" = "blanchedalmond", 
                                   "Hit" = "navy"),
                        name = "Action") +
      theme_minimal() +
      labs(title = title,
           x = "Dealer Value",  # Update x-axis label
           y = "Player Value") +  # Update y-axis label
      theme(axis.text.x = element_text(angle = 45, hjust = 1))
  }
  
  # Plot for the case where ace is present
  label = paste("Policy", name, "(Ace)")
  p1 <- plot_heat_map(policy_ace, label)
  
  # Plot for the case where ace is not present
  label = paste("Policy", name, "(No Ace)")
  p2 <- plot_heat_map(policy_no_ace, label)
  
  # Display the plots
  print(p1)
  print(p2)
}

##########
# EVALUATE
##########

# Evaluate policy
#
# n is the number of sample states
evaluate_policy <- function(policy, n_tests = 50000) {
  wins <- 0
  
  for (test in 1:n_tests) {
    # Start with a real state
    s <- real_state()
    dealer_value <- s[1]
    player_value <- s[2]
    player_ace <- s[3]
    
    # Play the game using the policy
    while (player_value < 22) {
      action <- policy[dealer_value, player_value, player_ace]
      
      if (action == 2) {  # Hit
        hit_s <- hit(player_value, player_ace)
        player_value <- hit_s[1]
        player_ace <- hit_s[2]
      } else {  # Stay
        break
      }
    }
    
    # Evaluate the final state after dealer's turn
    final_state <- finalize_dealer(c(dealer_value, player_value, player_ace))
    reward <- R(final_state)
    
    if (reward == 1) {
      wins <- wins + 1  # Increment wins if the player won
    }
  }
  
  # Calculate win rate
  win_rate <- wins / n_tests
  return(win_rate)
}

#######
# MAIN
#######
# Random policy for winrate comparison
rand_policy <- array(sample(1:2, size = 11 * 21 * 2, replace = TRUE), 
                dim = c(11, 21, 2))

# Test different policies
n_tests <- 50000

# Random policy
rand_win_rate <- evaluate_policy(rand_policy, n_tests)
cat("Win rate of random policy over", n_tests, "games is:", rand_win_rate, "\n")

# Trained policies
training_rounds <- 10

n_episodes <- 1000
sum_win_rate <- 0
for (i in seq(1:training_rounds)) {
  policy <- monte_carlo_BJ(n_episodes = n_episodes, gamma = 1, epsilon_start = 1)
  win_rate <- evaluate_policy(policy, n_tests)
  sum_win_rate <- sum_win_rate + win_rate
}
policy_df <- policy_to_dataframe(policy)
heat_map_policy(policy_df, toString(n_episodes))
avg_win_rate <- sum_win_rate / training_rounds
cat("Average win rate of policy trained on", n_episodes, "episodes over", n_tests, "games is:", avg_win_rate, "\n")

n_episodes <- 10000
sum_win_rate <- 0
for (i in seq(1:training_rounds)) {
  policy <- monte_carlo_BJ(n_episodes = n_episodes, gamma = 1, epsilon_start = 1)
  win_rate <- evaluate_policy(policy, n_tests)
  sum_win_rate <- sum_win_rate + win_rate
}
policy_df <- policy_to_dataframe(policy)
heat_map_policy(policy_df, toString(n_episodes))
avg_win_rate <- sum_win_rate / training_rounds
cat("Average win rate of policy trained on", n_episodes, "episodes over", n_tests, "games is:", avg_win_rate, "\n")

n_episodes <- 50000
sum_win_rate <- 0
for (i in seq(1:training_rounds)) {
  policy <- monte_carlo_BJ(n_episodes = n_episodes, gamma = 1, epsilon_start = 1)
  win_rate <- evaluate_policy(policy, n_tests)
  sum_win_rate <- sum_win_rate + win_rate
}
policy_df <- policy_to_dataframe(policy)
heat_map_policy(policy_df, toString(n_episodes))
avg_win_rate <- sum_win_rate / training_rounds
cat("Average win rate of policy trained on", n_episodes, "episodes over", n_tests, "games is:", avg_win_rate, "\n")

n_episodes <- 100000
sum_win_rate <- 0
for (i in seq(1:training_rounds)) {
  policy <- monte_carlo_BJ(n_episodes = n_episodes, gamma = 1, epsilon_start = 1)
  win_rate <- evaluate_policy(policy, n_tests)
  sum_win_rate <- sum_win_rate + win_rate
}
policy_df <- policy_to_dataframe(policy)
heat_map_policy(policy_df, toString(n_episodes))
avg_win_rate <- sum_win_rate / training_rounds
cat("Average win rate of policy trained on", n_episodes, "episodes over", n_tests, "games is:", avg_win_rate, "\n")

n_episodes <- 250000
sum_win_rate <- 0
for (i in seq(1:training_rounds)) {
  policy <- monte_carlo_BJ(n_episodes = n_episodes, gamma = 1, epsilon_start = 1)
  win_rate <- evaluate_policy(policy, n_tests)
  sum_win_rate <- sum_win_rate + win_rate
}
policy_df <- policy_to_dataframe(policy)
heat_map_policy(policy_df, toString(n_episodes))
avg_win_rate <- sum_win_rate / training_rounds
cat("Average win rate of policy trained on", n_episodes, "episodes over", n_tests, "games is:", avg_win_rate, "\n")

##################
# Export
##################
library(jsonlite)

export_policy <- function(policy_df) {
  x <- toJSON(policy_df)
  write(x, "model.json")
}
