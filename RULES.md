# Risk Digital Game Rules

This document outlines the official game rules implemented in this Risk digital game.

## Initial Setup

### Army Allocation

At the beginning of the game, each player receives a specific number of armies based on the total number of players:

| Number of Players | Initial Armies per Player |
|-------------------|---------------------------|
| 2 players         | 40 armies                 |
| 3 players         | 35 armies                 |
| 4 players         | 30 armies                 |
| 5 players         | 25 armies                 |
| 6 players         | 20 armies                 |

### Territory Assignment

1. Territories are randomly distributed equally among all players
2. Each territory starts with 1 army placed on it
3. Players take turns placing their remaining armies on their own territories

## Game Phases

The game consists of three phases that repeat each turn:

1. **Deploy (Reinforcement) Phase**: Place new armies on your territories
2. **Attack Phase**: Attack adjacent enemy territories
3. **Fortify Phase**: Move armies between your connected territories

## Reinforcement Rules

At the beginning of each turn, the player receives new armies to deploy:

1. **Territory Count**: 1 army for every 3 territories owned (minimum of 3 armies)
2. **Continent Bonus**: Additional armies for controlling entire continents:
   - North America: 5 armies
   - South America: 2 armies
   - Europe: 5 armies
   - Africa: 3 armies
   - Asia: 7 armies
   - Australia: 2 armies
3. **Card Sets**: Additional armies for turning in matching card sets (not implemented in current version)

## Attack Rules

1. Player may attack any adjacent enemy territory from their own territory
2. The attacking territory must have at least 2 armies
3. Attacker may use up to 3 dice (must have more armies than dice used)
4. Defender may use up to 2 dice (must have at least as many armies as dice used)
5. Dice are compared highest to highest, second highest to second highest
6. Defender wins ties
7. Each lost comparison results in losing 1 army
8. If defender loses all armies, attacker must move at least as many armies as dice used into the conquered territory

## Fortify Rules

1. At the end of a turn, a player may move armies from one of their territories to another connected territory
2. Territories must be connected through a chain of territories owned by the same player
3. At least 1 army must remain on the source territory
4. Player can only make one fortify move per turn

## Winning the Game

The game is won by the player who eliminates all other players by capturing all territories.