# CombatManager API Documentation

## Overview

The `CombatManager` class provides a complete combat management system for Risk board game implementations. It follows official Risk rules with one key modification: battle outcomes are determined by user input rather than dice rolling.

## Quick Start

```javascript
// Initialize with game state
const combatManager = new CombatManager(gameState);

// Start combat
const result = combatManager.initiateCombat('Alaska', 'Kamchatka');

// Process battle with user-selected outcome
const battleResult = combatManager.processBattleResult({
    attackerRemainingArmies: 4,
    defenderRemainingArmies: 2
});

// Handle conquest if needed
if (battleResult.territoryConquered) {
    combatManager.occupyTerritory(3);
}

// End combat
combatManager.endCombat();
```

## Constructor

### `new CombatManager(gameState)`

Creates a new CombatManager instance.

**Parameters:**
- `gameState` (Object) - Game state object containing:
  - `territories` (Object) - Map of territory IDs to territory objects
  - `getCurrentPlayer()` (Function) - Returns current player ID

**Throws:**
- Error if gameState is null or invalid

**Example:**
```javascript
const manager = new CombatManager({
    territories: {
        'Alaska': { owner: 'Player1', armies: 5, neighbors: ['Kamchatka'] }
    },
    getCurrentPlayer: () => 'Player1'
});
```

## Core Methods

### `initiateCombat(attackingTerritoryId, defendingTerritoryId)`

Starts a new combat session between two territories.

**Parameters:**
- `attackingTerritoryId` (string) - ID of attacking territory
- `defendingTerritoryId` (string) - ID of defending territory

**Returns:** `Object`
```javascript
{
    success: boolean,
    combat?: Object,    // Combat state if successful
    error?: string      // Error message if failed
}
```

**Validation Rules:**
- Attacker must have at least 2 armies
- Territories must be adjacent
- Territories must have different owners
- Attacker must own attacking territory

**Example:**
```javascript
const result = manager.initiateCombat('Alaska', 'Kamchatka');
if (result.success) {
    console.log('Combat started!', result.combat);
} else {
    console.error(result.error);
}
```

### `processBattleResult(battleResult)`

Processes a user-selected battle outcome and updates game state.

**Parameters:**
- `battleResult` (Object)
  - `attackerRemainingArmies` (number) - Armies attacker has after battle
  - `defenderRemainingArmies` (number) - Armies defender has after battle

**Returns:** `Object`
```javascript
{
    success: boolean,
    attackerLosses?: number,
    defenderLosses?: number,
    attackerRemainingArmies?: number,
    defenderRemainingArmies?: number,
    totalAttackerLosses?: number,
    totalDefenderLosses?: number,
    territoryConquered?: boolean,
    combatComplete?: boolean,
    roundsCompleted?: number,
    error?: string
}
```

**Validation Rules:**
- Attacker must keep at least 1 army
- Defender can have 0 armies (eliminated)
- At least one side must lose armies
- Maximum 2 armies lost per side per round (except defender elimination)
- Cannot exceed current army counts

**Example:**
```javascript
const result = manager.processBattleResult({
    attackerRemainingArmies: 4,  // Lost 1 army
    defenderRemainingArmies: 2   // Lost 1 army
});

console.log(`Attacker lost ${result.attackerLosses} armies`);
console.log(`Defender lost ${result.defenderLosses} armies`);
if (result.territoryConquered) {
    console.log('Territory conquered!');
}
```

### `occupyTerritory(armiesToMove)`

Handles territory occupation after conquest.

**Parameters:**
- `armiesToMove` (number) - Number of armies to move to conquered territory

**Returns:** `Object`
```javascript
{
    success: boolean,
    attackingTerritory?: { id: string, armies: number },
    defendingTerritory?: { id: string, armies: number, owner: string },
    error?: string
}
```

**Validation Rules:**
- Must have active combat with conquest
- Must move at least 1 army
- Must leave at least 1 army in attacking territory

**Example:**
```javascript
if (battleResult.territoryConquered) {
    const result = manager.occupyTerritory(3);
    if (result.success) {
        console.log('Territory occupied with 3 armies');
    }
}
```

### `endCombat()`

Ends the current combat session and returns summary.

**Returns:** `Object`
```javascript
{
    success: boolean,
    attackingTerritory?: string,
    defendingTerritory?: string,
    totalAttackerLosses?: number,
    totalDefenderLosses?: number,
    roundsCompleted?: number,
    territoryConquered?: boolean,
    error?: string
}
```

**Example:**
```javascript
const summary = manager.endCombat();
console.log(`Combat ended after ${summary.roundsCompleted} rounds`);
console.log(`Attacker lost ${summary.totalAttackerLosses} armies total`);
```

## Validation Methods

### `validateAttack(attackingTerritoryId, defendingTerritoryId)`

Validates whether an attack is legal.

**Returns:** `Object`
```javascript
{
    valid: boolean,
    error?: string
}
```

**Example:**
```javascript
const validation = manager.validateAttack('Alaska', 'Kamchatka');
if (!validation.valid) {
    alert(validation.error);
}
```

### `validateBattleResult(battleResult)`

Validates a battle result before processing.

**Returns:** `Object`
```javascript
{
    valid: boolean,
    error?: string
}
```

**Example:**
```javascript
const validation = manager.validateBattleResult({
    attackerRemainingArmies: 4,
    defenderRemainingArmies: 2
});
if (validation.valid) {
    manager.processBattleResult(battleResult);
}
```

## Query Methods

### `getBattleOptions()`

Gets current battle options including army counts and max dice.

**Returns:** `Object | null`
```javascript
{
    attackingTerritoryId: string,
    defendingTerritoryId: string,
    attackerArmies: number,
    defenderArmies: number,
    attackerOwner: string,
    defenderOwner: string,
    maxAttackingDice: number,  // Based on attacker armies
    maxDefendingDice: number,  // Based on defender armies
    canContinue: boolean
}
```

**Example:**
```javascript
const options = manager.getBattleOptions();
if (options) {
    console.log(`Attacker: ${options.attackerArmies} armies`);
    console.log(`Can use up to ${options.maxAttackingDice} dice`);
}
```

### `getCombatState()`

Gets current combat state.

**Returns:** `Object | null`
```javascript
{
    attackingTerritoryId: string,
    defendingTerritoryId: string,
    attackerArmies: number,
    defenderArmies: number,
    initialAttackerArmies: number,
    initialDefenderArmies: number,
    totalAttackerLosses: number,
    totalDefenderLosses: number,
    roundsCompleted: number,
    conquered: boolean
}
```

**Example:**
```javascript
const state = manager.getCombatState();
if (state) {
    console.log(`Round ${state.roundsCompleted}`);
    console.log(`Total losses: ${state.totalAttackerLosses + state.totalDefenderLosses}`);
}
```

### `getAttackableTargets(territoryId)`

Gets list of territories that can be attacked from a given territory.

**Parameters:**
- `territoryId` (string) - Territory to check from

**Returns:** `Array<string>` - Array of attackable territory IDs

**Example:**
```javascript
const targets = manager.getAttackableTargets('Alaska');
console.log('Can attack:', targets); // ['Kamchatka']
```

### `requiresCompletion()`

Checks if combat requires completion (conquest pending).

**Returns:** `boolean`

**Example:**
```javascript
if (manager.requiresCompletion()) {
    showConquestDialog();
}
```

## Constants

### `RULES`

Read-only object containing game rule constants:

```javascript
{
    MIN_ARMIES_TO_ATTACK: 2,      // Need 2+ armies to attack
    MIN_ARMIES_TO_LEAVE: 1,       // Must leave 1 army behind
    MAX_ATTACKING_DICE: 3,        // Max 3 dice for attacker
    MAX_DEFENDING_DICE: 2,        // Max 2 dice for defender
    MIN_ARMIES_TO_OCCUPY: 1       // Must move at least 1 army on conquest
}
```

**Example:**
```javascript
console.log(`Need ${manager.RULES.MIN_ARMIES_TO_ATTACK} armies to attack`);
```

## Complete Combat Flow Example

```javascript
// 1. Create manager
const manager = new CombatManager(gameState);

// 2. Check what can be attacked
const targets = manager.getAttackableTargets('Alaska');
console.log('Available targets:', targets);

// 3. Validate attack before starting
const validation = manager.validateAttack('Alaska', 'Kamchatka');
if (!validation.valid) {
    alert(validation.error);
    return;
}

// 4. Initiate combat
const initResult = manager.initiateCombat('Alaska', 'Kamchatka');
if (!initResult.success) {
    console.error(initResult.error);
    return;
}

// 5. Get battle options for UI
const options = manager.getBattleOptions();
displayBattleDialog(options);

// 6. Process battle rounds
while (true) {
    // User selects outcome
    const userSelection = await getUserBattleInput();
    
    const result = manager.processBattleResult({
        attackerRemainingArmies: userSelection.attackerRemaining,
        defenderRemainingArmies: userSelection.defenderRemaining
    });
    
    if (!result.success) {
        alert(result.error);
        continue;
    }
    
    displayBattleResult(result);
    
    // Check if combat is complete
    if (result.territoryConquered) {
        // Handle conquest
        const armyCount = await getUserArmyTransfer();
        const occupyResult = manager.occupyTerritory(armyCount);
        
        if (occupyResult.success) {
            updateTerritoryDisplay(occupyResult);
        }
        break;
    }
    
    if (result.combatComplete) {
        // Combat ended without conquest
        break;
    }
    
    // Continue to next round
    const continueAttack = await askUserToContinue();
    if (!continueAttack) {
        break;
    }
}

// 7. End combat and get summary
const summary = manager.endCombat();
console.log('Combat Summary:', summary);
displayCombatSummary(summary);
```

## Error Handling

All methods return objects with `success` flags and optional `error` messages:

```javascript
const result = manager.initiateCombat('Alaska', 'Kamchatka');

if (!result.success) {
    // Handle error
    console.error('Combat failed:', result.error);
    showErrorMessage(result.error);
} else {
    // Proceed with combat
    processCombat(result.combat);
}
```

Common error messages:
- `"Attacking territory must have at least 2 armies"`
- `"Territories must be adjacent to attack"`
- `"Cannot attack your own territory"`
- `"Attacker must have at least 1 army remaining"`
- `"At least one side must lose armies in a battle"`
- `"Territory has not been conquered"`

## Integration with Existing Systems

The CombatManager integrates seamlessly with existing Risk game implementations:

```javascript
// In your game initialization
class RiskGame {
    constructor() {
        this.gameState = new GameState();
        this.combatManager = new CombatManager(this.gameState);
    }
    
    handleAttack(fromTerritory, toTerritory) {
        const result = this.combatManager.initiateCombat(fromTerritory, toTerritory);
        
        if (result.success) {
            this.showCombatUI();
        } else {
            this.showError(result.error);
        }
    }
}
```

## Browser and Node.js Support

The CombatManager works in both browser and Node.js environments:

**Browser:**
```html
<script src="js/CombatManager.js"></script>
<script>
    const manager = new CombatManager(gameState);
</script>
```

**Node.js:**
```javascript
const CombatManager = require('./js/CombatManager.js');
const manager = new CombatManager(gameState);
```

## Testing

Comprehensive tests are included in `test-combat-manager.js`:

- Constructor validation
- Combat initiation
- Attack validation
- Battle options
- Battle processing
- Battle result validation
- Territory occupation
- Combat completion
- Multiple battle rounds
- Attackable targets

Run tests by opening `test-combat-manager.html` in a browser.

## License

This code is part of the Risk board game implementation project.
