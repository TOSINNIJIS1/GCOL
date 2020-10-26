import random

score = {
    'wins': 0,
    'ties': 0,
    'losses': 0
}

welcome_message = 'Welcome to Rock, Paper, Scissors!'
historical_data_message = 'Wins: %s, Ties: %s, Losses: %s'
quit_message = 'Thanks for playing Rock, Paper, Scissors!'
win_message = 'Congratulations, you won'
loss_message = 'Sorry, you lost!'
tie_message = 'it was a tie.'

historical_data = get_historical_data()
score['wins'] = historical_data['wins']
score['ties'] = historical_data['ties']
score['losses'] = historical_data['losses']

choice_options = {
    1: 'rock',
    2: 'paper',
    3: 'scissors',
    9: 'quit'
}

computer_choice = random.randint(1,2)
user_choice = None
