/**
 * CombatManager - Risk Board Game Combat Management System
 * 
 * This class implements official Risk combat rules with a modified battle resolution system
 * where battle outcomes are determined by user input rather than dice rolling.
 * 
 * @class CombatManager
 * @version 1.0.0
 * 
 * @example
 * // Initialize combat manager with game state
 * const combatManager = new CombatManager(gameState);
 * 
 * // Initiate combat between territories
 * const result = combatManager.initiateCombat('Alaska', 'Kamchatka');
 * if (result.success) {
 *   console.log('Combat initiated successfully');
 * }
 * 
 * // Present battle options to user (in your UI)
 * const options = combatManager.getBattleOptions();
 * console.log(`Attacker has ${options.attackerArmies} armies`);
 * console.log(`Defender has ${options.defenderArmies} armies`);
 * 
 * // User selects battle outcome
 * const battleResult = combatManager.processBattleResult({
 *   attackerRemainingArmies: 4,  // User input: armies attacker has after battle
 *   defenderRemainingArmies: 1   // User input: armies defender has after battle
 * });
 * 
 * if (battleResult.territoryConquered) {
 *   // Handle territory occupation
 *   combatManager.occupyTerritory(3); // Move 3 armies to conquered territory
 * }
 */
class CombatManager {
    /**
     * Creates a new CombatManager instance
     * @param {Object} gameState - The game state object containing territories and players
     * @param {Object} gameState.territories - Map of territory IDs to territory objects
     * @param {Function} gameState.getCurrentPlayer - Function to get current player
     */
    constructor(gameState) {
        if (!gameState) {
            throw new Error('CombatManager requires a valid game state object');
        }
        
        this.gameState = gameState;
        this.activeCombat = null;
        
        /**
         * Official Risk combat rules constants
         * @readonly
         */
        this.RULES = Object.freeze({
            MIN_ARMIES_TO_ATTACK: 2,        // Must have at least 2 armies to attack (1 stays behind)
            MIN_ARMIES_TO_LEAVE: 1,         // Must leave at least 1 army in attacking territory
            MAX_ATTACKING_DICE: 3,          // Maximum 3 dice for attacker
            MAX_DEFENDING_DICE: 2,          // Maximum 2 dice for defender
            MIN_ARMIES_TO_OCCUPY: 1         // Minimum armies to occupy conquered territory
        });
    }
    
    /**
     * Initiates combat between two territories
     * Validates that the attack is legal according to Risk rules
     * 
     * @param {string} attackingTerritoryId - ID of the attacking territory
     * @param {string} defendingTerritoryId - ID of the defending territory
     * @returns {Object} Result object with success flag and error message if failed
     * 
     * @example
     * const result = combatManager.initiateCombat('Alaska', 'Kamchatka');
     * if (!result.success) {
     *   console.error(result.error);
     * }
     */
    initiateCombat(attackingTerritoryId, defendingTerritoryId) {
        // Validate the attack
        const validation = this.validateAttack(attackingTerritoryId, defendingTerritoryId);
        
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error
            };
        }
        
        // Create new combat instance
        this.activeCombat = {
            attackingTerritoryId,
            defendingTerritoryId,
            attackingTerritory: this.gameState.territories[attackingTerritoryId],
            defendingTerritory: this.gameState.territories[defendingTerritoryId],
            initialAttackerArmies: this.gameState.territories[attackingTerritoryId].armies,
            initialDefenderArmies: this.gameState.territories[defendingTerritoryId].armies,
            totalAttackerLosses: 0,
            totalDefenderLosses: 0,
            roundsCompleted: 0,
            conquered: false
        };
        
        return {
            success: true,
            combat: this.getCombatState()
        };
    }
    
    /**
     * Validates whether an attack is legal according to Risk rules
     * 
     * @param {string} attackingTerritoryId - ID of the attacking territory
     * @param {string} defendingTerritoryId - ID of the defending territory
     * @returns {Object} Validation result with valid flag and error message if invalid
     * 
     * @example
     * const validation = combatManager.validateAttack('Alaska', 'Kamchatka');
     * if (!validation.valid) {
     *   alert(validation.error);
     * }
     */
    validateAttack(attackingTerritoryId, defendingTerritoryId) {
        // Check if territories exist
        const attacker = this.gameState.territories[attackingTerritoryId];
        const defender = this.gameState.territories[defendingTerritoryId];
        
        if (!attacker) {
            return {
                valid: false,
                error: `Attacking territory '${attackingTerritoryId}' does not exist`
            };
        }
        
        if (!defender) {
            return {
                valid: false,
                error: `Defending territory '${defendingTerritoryId}' does not exist`
            };
        }
        
        // Check if attacker has enough armies
        if (attacker.armies < this.RULES.MIN_ARMIES_TO_ATTACK) {
            return {
                valid: false,
                error: `Attacking territory must have at least ${this.RULES.MIN_ARMIES_TO_ATTACK} armies (currently has ${attacker.armies})`
            };
        }
        
        // Check if territories are adjacent
        if (!attacker.neighbors || !attacker.neighbors.includes(defendingTerritoryId)) {
            return {
                valid: false,
                error: 'Territories must be adjacent to attack'
            };
        }
        
        // Check if territories have different owners
        if (attacker.owner === defender.owner) {
            return {
                valid: false,
                error: 'Cannot attack your own territory'
            };
        }
        
        // Check if attacker owns the attacking territory
        const currentPlayer = this.gameState.getCurrentPlayer ? this.gameState.getCurrentPlayer() : null;
        if (currentPlayer && attacker.owner !== currentPlayer) {
            return {
                valid: false,
                error: 'You can only attack from territories you own'
            };
        }
        
        return { valid: true };
    }
    
    /**
     * Gets battle options for the current combat
     * This presents the user with current army counts and available options
     * 
     * @returns {Object|null} Battle options or null if no active combat
     * 
     * @example
     * const options = combatManager.getBattleOptions();
     * console.log(`Attacker: ${options.attackerArmies} armies`);
     * console.log(`Defender: ${options.defenderArmies} armies`);
     * console.log(`Max attacking dice: ${options.maxAttackingDice}`);
     */
    getBattleOptions() {
        if (!this.activeCombat) {
            return null;
        }
        
        const attacker = this.activeCombat.attackingTerritory;
        const defender = this.activeCombat.defendingTerritory;
        
        // Calculate maximum dice based on army counts
        // Attacker can use up to 3 dice but must have more armies than dice used
        const maxAttackingDice = Math.min(
            this.RULES.MAX_ATTACKING_DICE,
            attacker.armies - 1  // Must leave at least 1 army
        );
        
        // Defender can use up to 2 dice and must have at least as many armies as dice
        const maxDefendingDice = Math.min(
            this.RULES.MAX_DEFENDING_DICE,
            defender.armies
        );
        
        return {
            attackingTerritoryId: this.activeCombat.attackingTerritoryId,
            defendingTerritoryId: this.activeCombat.defendingTerritoryId,
            attackerArmies: attacker.armies,
            defenderArmies: defender.armies,
            attackerOwner: attacker.owner,
            defenderOwner: defender.owner,
            maxAttackingDice,
            maxDefendingDice,
            canContinue: attacker.armies > this.RULES.MIN_ARMIES_TO_LEAVE && defender.armies > 0
        };
    }
    
    /**
     * Processes a user-selected battle result
     * This is the core method that replaces dice rolling with user input
     * 
     * @param {Object} battleResult - The battle result selected by the user
     * @param {number} battleResult.attackerRemainingArmies - Armies attacker has after battle
     * @param {number} battleResult.defenderRemainingArmies - Armies defender has after battle
     * @returns {Object} Result object with battle outcome details
     * 
     * @example
     * const result = combatManager.processBattleResult({
     *   attackerRemainingArmies: 4,
     *   defenderRemainingArmies: 1
     * });
     * 
     * if (result.success) {
     *   console.log(`Attacker lost ${result.attackerLosses} armies`);
     *   console.log(`Defender lost ${result.defenderLosses} armies`);
     *   if (result.territoryConquered) {
     *     console.log('Territory conquered!');
     *   }
     * }
     */
    processBattleResult(battleResult) {
        if (!this.activeCombat) {
            return {
                success: false,
                error: 'No active combat session'
            };
        }
        
        const { attackerRemainingArmies, defenderRemainingArmies } = battleResult;
        
        // Validate the battle result
        const validation = this.validateBattleResult(battleResult);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error
            };
        }
        
        const attacker = this.activeCombat.attackingTerritory;
        const defender = this.activeCombat.defendingTerritory;
        
        // Calculate losses
        const attackerLosses = attacker.armies - attackerRemainingArmies;
        const defenderLosses = defender.armies - defenderRemainingArmies;
        
        // Update army counts
        attacker.armies = attackerRemainingArmies;
        defender.armies = defenderRemainingArmies;
        
        // Update total losses
        this.activeCombat.totalAttackerLosses += attackerLosses;
        this.activeCombat.totalDefenderLosses += defenderLosses;
        this.activeCombat.roundsCompleted++;
        
        // Check if territory was conquered
        const territoryConquered = defenderRemainingArmies === 0;
        this.activeCombat.conquered = territoryConquered;
        
        // Check if combat is complete
        const combatComplete = territoryConquered || attackerRemainingArmies <= this.RULES.MIN_ARMIES_TO_LEAVE;
        
        return {
            success: true,
            attackerLosses,
            defenderLosses,
            attackerRemainingArmies,
            defenderRemainingArmies,
            totalAttackerLosses: this.activeCombat.totalAttackerLosses,
            totalDefenderLosses: this.activeCombat.totalDefenderLosses,
            territoryConquered,
            combatComplete,
            roundsCompleted: this.activeCombat.roundsCompleted
        };
    }
    
    /**
     * Validates a user-selected battle result
     * Ensures the result is legal according to Risk rules
     * 
     * @param {Object} battleResult - The battle result to validate
     * @param {number} battleResult.attackerRemainingArmies - Armies attacker has after battle
     * @param {number} battleResult.defenderRemainingArmies - Armies defender has after battle
     * @returns {Object} Validation result
     * 
     * @example
     * const validation = combatManager.validateBattleResult({
     *   attackerRemainingArmies: 0,  // Invalid - must have at least 1
     *   defenderRemainingArmies: 3
     * });
     * console.log(validation.error); // "Attacker must have at least 1 army remaining"
     */
    validateBattleResult(battleResult) {
        if (!this.activeCombat) {
            return {
                valid: false,
                error: 'No active combat session'
            };
        }
        
        const { attackerRemainingArmies, defenderRemainingArmies } = battleResult;
        const attacker = this.activeCombat.attackingTerritory;
        const defender = this.activeCombat.defendingTerritory;
        
        // Validate inputs are numbers
        if (typeof attackerRemainingArmies !== 'number' || isNaN(attackerRemainingArmies)) {
            return {
                valid: false,
                error: 'Attacker remaining armies must be a valid number'
            };
        }
        
        if (typeof defenderRemainingArmies !== 'number' || isNaN(defenderRemainingArmies)) {
            return {
                valid: false,
                error: 'Defender remaining armies must be a valid number'
            };
        }
        
        // Validate attacker has at least 1 army remaining
        if (attackerRemainingArmies < this.RULES.MIN_ARMIES_TO_LEAVE) {
            return {
                valid: false,
                error: `Attacker must have at least ${this.RULES.MIN_ARMIES_TO_LEAVE} army remaining`
            };
        }
        
        // Validate defender has at least 0 armies (can be eliminated)
        if (defenderRemainingArmies < 0) {
            return {
                valid: false,
                error: 'Defender cannot have negative armies'
            };
        }
        
        // Validate remaining armies don't exceed current armies
        if (attackerRemainingArmies > attacker.armies) {
            return {
                valid: false,
                error: `Attacker cannot have more armies than current count (${attacker.armies})`
            };
        }
        
        if (defenderRemainingArmies > defender.armies) {
            return {
                valid: false,
                error: `Defender cannot have more armies than current count (${defender.armies})`
            };
        }
        
        // Validate that at least one side loses armies per Risk rules
        // In a battle, casualties must occur
        const attackerLosses = attacker.armies - attackerRemainingArmies;
        const defenderLosses = defender.armies - defenderRemainingArmies;
        
        if (attackerLosses === 0 && defenderLosses === 0) {
            return {
                valid: false,
                error: 'At least one side must lose armies in a battle'
            };
        }
        
        // Validate losses are reasonable for a single battle round
        // In standard Risk, maximum 2 armies can be lost per side in one battle
        if (attackerLosses > 2) {
            return {
                valid: false,
                error: 'Attacker cannot lose more than 2 armies in a single battle round'
            };
        }
        
        if (defenderLosses > 2 && defenderRemainingArmies > 0) {
            // Allow defender to lose all armies if being eliminated
            return {
                valid: false,
                error: 'Defender cannot lose more than 2 armies in a single battle round (unless eliminated)'
            };
        }
        
        return { valid: true };
    }
    
    /**
     * Handles territory occupation after conquest
     * Moves armies from attacking territory to conquered territory
     * 
     * @param {number} armiesToMove - Number of armies to move to conquered territory
     * @returns {Object} Result object with success flag
     * 
     * @example
     * if (battleResult.territoryConquered) {
     *   const result = combatManager.occupyTerritory(3);
     *   if (result.success) {
     *     console.log('Territory occupied successfully');
     *   }
     * }
     */
    occupyTerritory(armiesToMove) {
        if (!this.activeCombat) {
            return {
                success: false,
                error: 'No active combat session'
            };
        }
        
        if (!this.activeCombat.conquered) {
            return {
                success: false,
                error: 'Territory has not been conquered'
            };
        }
        
        const attacker = this.activeCombat.attackingTerritory;
        const defender = this.activeCombat.defendingTerritory;
        
        // Validate armies to move
        if (typeof armiesToMove !== 'number' || isNaN(armiesToMove)) {
            return {
                success: false,
                error: 'Armies to move must be a valid number'
            };
        }
        
        if (armiesToMove < this.RULES.MIN_ARMIES_TO_OCCUPY) {
            return {
                success: false,
                error: `Must move at least ${this.RULES.MIN_ARMIES_TO_OCCUPY} army to conquered territory`
            };
        }
        
        if (armiesToMove >= attacker.armies) {
            return {
                success: false,
                error: `Must leave at least ${this.RULES.MIN_ARMIES_TO_LEAVE} army in attacking territory`
            };
        }
        
        // Transfer armies and ownership
        attacker.armies -= armiesToMove;
        defender.armies = armiesToMove;
        defender.owner = attacker.owner;
        
        return {
            success: true,
            attackingTerritory: {
                id: this.activeCombat.attackingTerritoryId,
                armies: attacker.armies
            },
            defendingTerritory: {
                id: this.activeCombat.defendingTerritoryId,
                armies: defender.armies,
                owner: defender.owner
            }
        };
    }
    
    /**
     * Ends the current combat session
     * Cleans up active combat state
     * 
     * @returns {Object} Summary of the completed combat
     * 
     * @example
     * const summary = combatManager.endCombat();
     * console.log(`Combat ended. Attacker lost ${summary.totalAttackerLosses} armies`);
     */
    endCombat() {
        if (!this.activeCombat) {
            return {
                success: false,
                error: 'No active combat session'
            };
        }
        
        const summary = {
            success: true,
            attackingTerritory: this.activeCombat.attackingTerritoryId,
            defendingTerritory: this.activeCombat.defendingTerritoryId,
            totalAttackerLosses: this.activeCombat.totalAttackerLosses,
            totalDefenderLosses: this.activeCombat.totalDefenderLosses,
            roundsCompleted: this.activeCombat.roundsCompleted,
            territoryConquered: this.activeCombat.conquered
        };
        
        this.activeCombat = null;
        
        return summary;
    }
    
    /**
     * Gets the current state of active combat
     * 
     * @returns {Object|null} Current combat state or null if no active combat
     * 
     * @example
     * const state = combatManager.getCombatState();
     * if (state) {
     *   console.log(`Round ${state.roundsCompleted}: Attacker has ${state.attackerArmies} armies`);
     * }
     */
    getCombatState() {
        if (!this.activeCombat) {
            return null;
        }
        
        return {
            attackingTerritoryId: this.activeCombat.attackingTerritoryId,
            defendingTerritoryId: this.activeCombat.defendingTerritoryId,
            attackerArmies: this.activeCombat.attackingTerritory.armies,
            defenderArmies: this.activeCombat.defendingTerritory.armies,
            initialAttackerArmies: this.activeCombat.initialAttackerArmies,
            initialDefenderArmies: this.activeCombat.initialDefenderArmies,
            totalAttackerLosses: this.activeCombat.totalAttackerLosses,
            totalDefenderLosses: this.activeCombat.totalDefenderLosses,
            roundsCompleted: this.activeCombat.roundsCompleted,
            conquered: this.activeCombat.conquered
        };
    }
    
    /**
     * Checks if combat completion is required
     * (territory conquered or attacker cannot continue)
     * 
     * @returns {boolean} True if combat must be completed
     */
    requiresCompletion() {
        if (!this.activeCombat) {
            return false;
        }
        
        return this.activeCombat.conquered;
    }
    
    /**
     * Gets list of territories that can be attacked from a given territory
     * 
     * @param {string} territoryId - ID of territory to check
     * @returns {Array<string>} Array of attackable territory IDs
     * 
     * @example
     * const targets = combatManager.getAttackableTargets('Alaska');
     * console.log(`Can attack: ${targets.join(', ')}`);
     */
    getAttackableTargets(territoryId) {
        const territory = this.gameState.territories[territoryId];
        
        if (!territory || territory.armies < this.RULES.MIN_ARMIES_TO_ATTACK) {
            return [];
        }
        
        if (!territory.neighbors || territory.neighbors.length === 0) {
            return [];
        }
        
        // Filter neighbors to only include enemy territories
        return territory.neighbors.filter(neighborId => {
            const neighbor = this.gameState.territories[neighborId];
            return neighbor && neighbor.owner !== territory.owner;
        });
    }
}

// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
    window.CombatManager = CombatManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatManager;
}
