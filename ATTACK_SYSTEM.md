# Attack Manager and Territory Conquest System

This document describes the implementation of the attack flow and territory conquest logic for the Risk Digital game.

## Overview

The attack system is implemented through several coordinated components:

1. **AttackManager**: Coordinates the attack flow, territory conquest, and army movement
2. **CombatSystem**: Handles the core combat mechanics, dice rolling, and battle resolution
3. **RiskUI Extensions**: Provides UI components for attack visualization and user interaction
4. **Integration**: Connects all systems together with the existing game components

## Components

### AttackManager.js

The primary coordinator of the attack flow. It:

- Validates attack source and target territories
- Handles multiple combat rounds within a single attack
- Manages territory conquest when defender has no armies left
- Controls army movement after successful conquest
- Tracks attack results for UI and end-of-turn reporting
- Interfaces with `TurnManager` and `PhaseManager` to validate phases and update game state

Key methods:
- `selectTerritory()`: Handles territory selection for attacking/defending
- `initiateAttack()`: Starts a new attack between selected territories
- `executeBattle()`: Runs a battle round with specified dice
- `completeConquest()`: Finalizes a conquest with army movement
- `endAttack()`: Cancels current attack
- `endPhase()`: Completes attack phase and awards cards

### RiskUI.AttackExtension.js

Extends the RiskUI class with methods for the attack interface:

- Territory highlighting (attacker, defender, valid targets)
- Attack options display (dice selection)
- Combat UI for battle rounds
- Conquest completion interface
- Battle history visualization

Key methods:
- `highlightAttacker()`, `highlightDefender()`: Visual territory selection
- `showAttackOptions()`: Display attack dice selection
- `showCombatUI()`: Show the combat interface
- `updateBattleHistory()`: Display battle results
- `showConquestResult()`: Territory conquest notification

### AttackManager.integration.js

Integrates the Attack Manager into the existing game system:
- Creates CSS styles for attack UI
- Connects AttackManager to UI event handlers
- Overrides territory click handling during attack phase
- Adds phase button handlers

## Game Flow

1. **Selection Phase**:
   - Player clicks on their territory with 2+ armies
   - Valid attack targets are highlighted
   - Player selects target territory

2. **Combat Initiation**:
   - Attack options displayed
   - Player selects dice count
   - First battle executed when Attack button pressed

3. **Battle Resolution**:
   - Dice are rolled and compared
   - Casualties determined and applied
   - Battle history updated
   - Player decides to continue or end attack

4. **Territory Conquest**:
   - If defender loses all armies, territory is conquered
   - Player selects how many armies to move (minimum 1)
   - Territory ownership changes
   - Card awarded if first conquest of turn

5. **Phase Completion**:
   - Player continues attacking or ends phase
   - Cards awarded if territories were conquered
   - Game moves to Fortification phase

## Integration with Existing Systems

The AttackManager integrates with:

1. **PhaseManager**: Validates that attacks only occur during attack phase
2. **TurnManager**: Updates turn state when territories change ownership
3. **GameState**: Updates territory data and player statistics
4. **CombatSystem**: Uses for core combat mechanics and rules enforcement

## UI Components

1. **Territory Highlighting**: Visual indicators for attackers and defenders
2. **Attack Panel**: Dice selection interface
3. **Combat UI**: Battle results and history
4. **Notifications**: Territory conquest and card earned messages

## Design Principles

1. **Separation of Concerns**:
   - AttackManager: Logic and flow control
   - CombatSystem: Core battle mechanics
   - UI Extensions: Visual presentation

2. **Consistent Game Rules**:
   - Follows official Risk rules for attacks and conquests
   - Enforces minimum army requirements
   - Implements proper dice comparison rules

3. **User Experience**:
   - Clear visual feedback
   - Comprehensive battle history
   - Intuitive territory selection

## Usage Example

```javascript
// Typical attack flow
const ui = window.riskGame;

// 1. Player clicks on territories
// These are handled by the override in AttackManager.integration.js
// which calls attackManager.selectTerritory()

// 2. Player starts attack (via UI button)
// This triggers:
ui.attackManager.initiateAttack();

// 3. Execute battle rounds
ui.attackManager.executeBattle(3, 2); // Attacker uses 3 dice, defender uses 2

// 4. Complete conquest if successful
ui.attackManager.completeConquest(3); // Move 3 armies to conquered territory

// 5. End attack phase
ui.attackManager.endPhase();
```