# CombatManager - Usage Examples and Integration Guide

## Overview

The `CombatManager` class provides a clean, well-documented API for implementing Risk board game combat with user-determined battle outcomes instead of dice rolling.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Complete Combat Flow](#complete-combat-flow)
3. [Error Handling](#error-handling)
4. [Advanced Scenarios](#advanced-scenarios)
5. [Integration with Game UI](#integration-with-game-ui)
6. [API Reference](#api-reference)

## Basic Usage

### Initialization

```javascript
// Create a CombatManager instance with your game state
const combatManager = new CombatManager(gameState);

// gameState should have:
// - territories: object mapping territory IDs to territory objects
// - getCurrentPlayer(): function that returns current player ID
```

### Starting Combat

```javascript
// Initiate combat between two territories
const result = combatManager.initiateCombat('Alaska', 'Kamchatka');

if (result.success) {
    console.log('Combat initiated!');
    console.log('Combat state:', result.combat);
} else {
    console.error('Cannot attack:', result.error);
}
```

### Processing a Battle Round

```javascript
// User selects battle outcome
const battleResult = combatManager.processBattleResult({
    attackerRemainingArmies: 4,  // Attacker has 4 armies after battle
    defenderRemainingArmies: 2   // Defender has 2 armies after battle
});

if (battleResult.success) {
    console.log(`Attacker lost: ${battleResult.attackerLosses} armies`);
    console.log(`Defender lost: ${battleResult.defenderLosses} armies`);
    
    if (battleResult.territoryConquered) {
        console.log('Territory conquered!');
    }
}
```

## Complete Combat Flow

Here's a complete example of a combat sequence from start to finish:

```javascript
// Step 1: Initialize combat manager
const combatManager = new CombatManager(gameState);

// Step 2: Check what territories can be attacked
const attackableTargets = combatManager.getAttackableTargets('Alaska');
console.log('Can attack:', attackableTargets); // ['Kamchatka', 'NorthwestTerritory', ...]

// Step 3: Initiate combat
const initiateResult = combatManager.initiateCombat('Alaska', 'Kamchatka');
if (!initiateResult.success) {
    console.error('Combat failed:', initiateResult.error);
    return;
}

// Step 4: Get battle options (present to user)
const options = combatManager.getBattleOptions();
console.log(`Attacker: ${options.attackerArmies} armies (max ${options.maxAttackingDice} dice)`);
console.log(`Defender: ${options.defenderArmies} armies (max ${options.maxDefendingDice} dice)`);

// Step 5: User determines battle outcome
// In UI, user would select or input remaining armies
const battleResult = combatManager.processBattleResult({
    attackerRemainingArmies: options.attackerArmies - 1,  // Attacker loses 1
    defenderRemainingArmies: options.defenderArmies - 1   // Defender loses 1
});

console.log('Battle result:', battleResult);

// Step 6: Continue or complete combat
if (battleResult.territoryConquered) {
    // Step 6a: Handle conquest
    const occupyResult = combatManager.occupyTerritory(3); // Move 3 armies
    
    if (occupyResult.success) {
        console.log('Territory occupied!');
        console.log('Attacking territory now has:', occupyResult.attackingTerritory.armies);
        console.log('Conquered territory now has:', occupyResult.defendingTerritory.armies);
    }
    
    // Step 7: End combat
    const summary = combatManager.endCombat();
    console.log('Combat Summary:', summary);
    
} else if (battleResult.combatComplete) {
    // Combat ended without conquest
    const summary = combatManager.endCombat();
    console.log('Combat ended. No territory conquered.');
    
} else {
    // Combat can continue - repeat from Step 4
    console.log('Combat continues...');
}
```

## Error Handling

The CombatManager provides comprehensive error handling:

```javascript
// Example 1: Invalid attack validation
const result = combatManager.initiateCombat('Alaska', 'Brazil');
if (!result.success) {
    // result.error will contain: "Territories must be adjacent to attack"
    console.error(result.error);
}

// Example 2: Insufficient armies
const result2 = combatManager.initiateCombat('Alaska', 'Kamchatka');
if (!result2.success) {
    // result2.error might be: "Attacking territory must have at least 2 armies"
    console.error(result2.error);
}

// Example 3: Invalid battle result
const battleResult = combatManager.processBattleResult({
    attackerRemainingArmies: 0,  // Invalid - must leave at least 1
    defenderRemainingArmies: 5
});
if (!battleResult.success) {
    // battleResult.error: "Attacker must have at least 1 army remaining"
    console.error(battleResult.error);
}

// Example 4: Try-catch for unexpected errors
try {
    const result = combatManager.initiateCombat('Alaska', 'Kamchatka');
} catch (error) {
    console.error('Unexpected error:', error.message);
}
```

## Advanced Scenarios

### Scenario 1: Multiple Battle Rounds

```javascript
// Initiate combat
combatManager.initiateCombat('Alaska', 'Kamchatka');

// Round 1
let battleResult = combatManager.processBattleResult({
    attackerRemainingArmies: 4,
    defenderRemainingArmies: 2
});
console.log(`Round 1: Attacker lost ${battleResult.attackerLosses}, Defender lost ${battleResult.defenderLosses}`);

// Round 2 (if combat continues)
if (!battleResult.combatComplete) {
    battleResult = combatManager.processBattleResult({
        attackerRemainingArmies: 3,
        defenderRemainingArmies: 0  // Territory conquered
    });
    console.log(`Round 2: Territory conquered!`);
}

// Check total losses
const state = combatManager.getCombatState();
console.log(`Total attacker losses: ${state.totalAttackerLosses}`);
console.log(`Total defender losses: ${state.totalDefenderLosses}`);
console.log(`Rounds completed: ${state.roundsCompleted}`);
```

### Scenario 2: Querying Combat State

```javascript
// During combat, check current state
const state = combatManager.getCombatState();

if (state) {
    console.log('Combat in progress:');
    console.log(`  From: ${state.attackingTerritoryId} (${state.attackerArmies} armies)`);
    console.log(`  To: ${state.defendingTerritoryId} (${state.defenderArmies} armies)`);
    console.log(`  Round: ${state.roundsCompleted}`);
    console.log(`  Conquered: ${state.conquered}`);
} else {
    console.log('No active combat');
}
```

### Scenario 3: Validating Before User Input

```javascript
// Before presenting battle options, validate the attack
const validation = combatManager.validateAttack('Alaska', 'Kamchatka');

if (validation.valid) {
    // Proceed with combat
    combatManager.initiateCombat('Alaska', 'Kamchatka');
} else {
    // Show error to user
    alert(`Cannot attack: ${validation.error}`);
}

// Similarly, validate battle results before processing
const testResult = {
    attackerRemainingArmies: userInputAttacker,
    defenderRemainingArmies: userInputDefender
};

const battleValidation = combatManager.validateBattleResult(testResult);

if (battleValidation.valid) {
    // Process the battle
    combatManager.processBattleResult(testResult);
} else {
    // Show error to user
    alert(`Invalid battle result: ${battleValidation.error}`);
}
```

## Integration with Game UI

### Example: HTML Button Click Handler

```javascript
// HTML:
// <button onclick="handleAttackClick()">Attack</button>
// <button onclick="handleBattleClick()">Execute Battle</button>

let selectedAttacker = null;
let selectedDefender = null;

function handleTerritoryClick(territoryId) {
    if (!selectedAttacker) {
        // First click - select attacker
        selectedAttacker = territoryId;
        console.log('Attacker selected:', territoryId);
    } else {
        // Second click - select defender and initiate combat
        selectedDefender = territoryId;
        
        const result = combatManager.initiateCombat(selectedAttacker, selectedDefender);
        if (result.success) {
            showBattleDialog();
        } else {
            alert(result.error);
            selectedAttacker = null;
        }
    }
}

function showBattleDialog() {
    const options = combatManager.getBattleOptions();
    
    document.getElementById('attacker-armies').textContent = options.attackerArmies;
    document.getElementById('defender-armies').textContent = options.defenderArmies;
    document.getElementById('battle-dialog').style.display = 'block';
}

function handleBattleClick() {
    const attackerRemaining = parseInt(document.getElementById('attacker-remaining').value);
    const defenderRemaining = parseInt(document.getElementById('defender-remaining').value);
    
    const result = combatManager.processBattleResult({
        attackerRemainingArmies: attackerRemaining,
        defenderRemainingArmies: defenderRemaining
    });
    
    if (result.success) {
        showBattleResult(result);
        
        if (result.territoryConquered) {
            showConquestDialog();
        } else if (result.combatComplete) {
            combatManager.endCombat();
            hideBattleDialog();
        }
    } else {
        alert(result.error);
    }
}

function showBattleResult(result) {
    const message = `Battle Result:\n` +
                   `Attacker lost: ${result.attackerLosses} armies\n` +
                   `Defender lost: ${result.defenderLosses} armies\n` +
                   `${result.territoryConquered ? 'TERRITORY CONQUERED!' : ''}`;
    
    document.getElementById('battle-result').textContent = message;
}
```

### Example: React Component Integration

```javascript
function CombatComponent({ gameState }) {
    const [combatManager] = useState(() => new CombatManager(gameState));
    const [battleOptions, setBattleOptions] = useState(null);
    const [battleResult, setBattleResult] = useState(null);
    
    const handleInitiateCombat = (attackerId, defenderId) => {
        const result = combatManager.initiateCombat(attackerId, defenderId);
        
        if (result.success) {
            setBattleOptions(combatManager.getBattleOptions());
        } else {
            alert(result.error);
        }
    };
    
    const handleProcessBattle = (attackerRemaining, defenderRemaining) => {
        const result = combatManager.processBattleResult({
            attackerRemainingArmies: attackerRemaining,
            defenderRemainingArmies: defenderRemaining
        });
        
        if (result.success) {
            setBattleResult(result);
            
            if (result.territoryConquered || result.combatComplete) {
                // Handle combat completion
            } else {
                // Update options for next round
                setBattleOptions(combatManager.getBattleOptions());
            }
        } else {
            alert(result.error);
        }
    };
    
    return (
        <div>
            {battleOptions && (
                <BattleDialog 
                    options={battleOptions}
                    onBattle={handleProcessBattle}
                />
            )}
            {battleResult && (
                <BattleResultDisplay result={battleResult} />
            )}
        </div>
    );
}
```

## API Reference

### Constructor

**`new CombatManager(gameState)`**
- **Parameters:**
  - `gameState` (Object): Game state with territories and getCurrentPlayer function
- **Throws:** Error if gameState is invalid

### Methods

**`initiateCombat(attackingTerritoryId, defendingTerritoryId)`**
- Starts a new combat session between two territories
- **Returns:** `{success: boolean, combat?: Object, error?: string}`

**`validateAttack(attackingTerritoryId, defendingTerritoryId)`**
- Validates if an attack is legal
- **Returns:** `{valid: boolean, error?: string}`

**`getBattleOptions()`**
- Gets current battle options including army counts and max dice
- **Returns:** `Object` with battle options or `null`

**`processBattleResult(battleResult)`**
- Processes user-selected battle outcome
- **Parameters:** `{attackerRemainingArmies: number, defenderRemainingArmies: number}`
- **Returns:** `{success: boolean, attackerLosses?: number, defenderLosses?: number, ...}`

**`validateBattleResult(battleResult)`**
- Validates a battle result before processing
- **Returns:** `{valid: boolean, error?: string}`

**`occupyTerritory(armiesToMove)`**
- Handles territory occupation after conquest
- **Parameters:** `armiesToMove` (number)
- **Returns:** `{success: boolean, ...}`

**`endCombat()`**
- Ends current combat session
- **Returns:** `{success: boolean, ...}` with combat summary

**`getCombatState()`**
- Gets current combat state
- **Returns:** `Object` with state or `null`

**`requiresCompletion()`**
- Checks if combat requires completion (conquest)
- **Returns:** `boolean`

**`getAttackableTargets(territoryId)`**
- Gets list of territories that can be attacked from given territory
- **Returns:** `Array<string>` of territory IDs

### Constants

**`RULES`** (readonly object)
- `MIN_ARMIES_TO_ATTACK`: 2
- `MIN_ARMIES_TO_LEAVE`: 1
- `MAX_ATTACKING_DICE`: 3
- `MAX_DEFENDING_DICE`: 2
- `MIN_ARMIES_TO_OCCUPY`: 1

## Notes on User Input Battle Resolution

Unlike traditional Risk where dice determine outcomes, this system allows users to select battle results. The system validates that:

1. **Casualties occur**: At least one side must lose armies
2. **Reasonable losses**: Maximum 2 armies lost per side per round (official Risk rule)
3. **Attacker survival**: Attacker must keep at least 1 army
4. **No army creation**: Remaining armies cannot exceed starting armies

This approach maintains the strategic elements of Risk while giving players full control over battle outcomes, useful for:
- Teaching the game
- Testing strategies
- Implementing custom game modes
- Accessibility features

## License

This code is part of the Risk board game implementation project.
