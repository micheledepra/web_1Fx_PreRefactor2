/**
 * AttackManager.js
 * 
 * Manages attack flow and territory conquest in the Risk game.
 * Coordinates with CombatSystem, TurnManager, and PhaseManager.
 */

class AttackManager {
    /**
     * Creates a new AttackManager instance
     * 
     * @param {GameState} gameState - Game state instance
     * @param {CombatSystem} combatSystem - Combat system for handling battles
     * @param {PhaseManager} phaseManager - Phase manager to validate current phase
     * @param {TurnManager} turnManager - Turn manager for tracking turn state
     * @param {RiskUI} ui - UI instance for updating the interface
     */
    constructor(gameState, combatSystem, phaseManager, turnManager, ui) {
        this.gameState = gameState;
        this.combatSystem = combatSystem;
        this.phaseManager = phaseManager;
        this.turnManager = turnManager;
        this.ui = ui;
        
        this.currentAttack = null;
        this.attackHistory = [];
        this.selectedAttacker = null;
        this.selectedDefender = null;
        
        // Tracking stats for the current turn
        this.turnStats = this.resetTurnStats();
    }

    /**
     * Reset turn statistics
     * @returns {object} - Empty turn stats
     */
    resetTurnStats() {
        return {
            totalAttacks: 0,
            successfulAttacks: 0,
            territoriesConquered: 0,
            armiesLost: 0,
            armiesDestroyed: 0
        };
    }

    /**
     * Clear attack selections
     */
    clearSelections() {
        this.selectedAttacker = null;
        this.selectedDefender = null;
        
        // Update UI to show cleared selections
        if (this.ui) {
            this.ui.clearAttackSelections();
        }
    }

    /**
     * Verify that attacking is allowed in the current phase
     * @returns {boolean} - True if attacks are allowed
     */
    canAttack() {
        // DEPRECATED: Use ValidationManager.validateAttackPhase() instead
        return ValidationManager.validateAttackPhase().valid;
    }

    /**
     * Handle territory selection for attack
     * @param {string} territoryId - ID of selected territory
     * @returns {object} - Result of selection
     */
    selectTerritory(territoryId) {
        // Verify we're in attack phase
        if (!this.canAttack()) {
            return {
                success: false,
                error: 'Not in attack phase',
                phase: this.phaseManager.getCurrentPhase()
            };
        }

        const territory = this.gameState.territories[territoryId];
        if (!territory) {
            return { success: false, error: 'Invalid territory' };
        }

        // Handle territory selection logic
        if (!this.selectedAttacker) {
            // Selecting attacker
            if (territory.owner !== this.gameState.getCurrentPlayer()) {
                return { 
                    success: false, 
                    error: 'You can only attack from your own territories' 
                };
            }

            if (territory.armies < 2) {
                return { 
                    success: false, 
                    error: 'Territory must have at least 2 armies to attack' 
                };
            }

            // Check if this territory has valid attack targets
            const hasValidTargets = territory.neighbors.some(neighborId => {
                const neighbor = this.gameState.territories[neighborId];
                return neighbor && neighbor.owner !== territory.owner;
            });

            if (!hasValidTargets) {
                return {
                    success: false,
                    error: 'No valid attack targets from this territory'
                };
            }

            this.selectedAttacker = territoryId;
            
            if (this.ui) {
                this.ui.highlightAttacker(territoryId);
                this.ui.highlightValidTargets(territoryId);
            }
            
            return {
                success: true,
                message: 'Select a territory to attack',
                attackerSelected: territoryId
            };
        } else {
            // Selecting defender
            if (territoryId === this.selectedAttacker) {
                // Clicked on attacker again - deselect
                this.clearSelections();
                return {
                    success: true,
                    message: 'Attack selection cleared'
                };
            }

            // Validate defender selection
            const attacker = this.gameState.territories[this.selectedAttacker];
            
            if (territory.owner === attacker.owner) {
                return {
                    success: false,
                    error: 'Cannot attack your own territory'
                };
            }

            if (!attacker.neighbors.includes(territoryId)) {
                return {
                    success: false,
                    error: 'Can only attack adjacent territories'
                };
            }

            // Valid defender selected
            this.selectedDefender = territoryId;
            
            if (this.ui) {
                this.ui.highlightDefender(territoryId);
                this.ui.showAttackOptions(this.selectedAttacker, this.selectedDefender);
            }
            
            return {
                success: true,
                message: 'Ready to attack',
                attackerSelected: this.selectedAttacker,
                defenderSelected: this.selectedDefender
            };
        }
    }

    /**
     * Start a new attack
     * @returns {object} - Result of attack initiation
     */
    initiateAttack() {
        // Verify selections and phase
        if (!this.canAttack()) {
            return {
                success: false,
                error: 'Not in attack phase'
            };
        }

        if (!this.selectedAttacker || !this.selectedDefender) {
            return {
                success: false,
                error: 'Must select attacking and defending territories'
            };
        }

        // Delegate to combat system
        const result = this.combatSystem.initiateCombat(
            this.selectedAttacker, 
            this.selectedDefender
        );

        if (!result.success) {
            return result;
        }

        // Store the current attack
        this.currentAttack = result.combat;
        
        // Update statistics
        this.turnStats.totalAttacks++;
        
        if (this.ui) {
            this.ui.showCombatUI(this.currentAttack);
        }
        
        return {
            success: true,
            message: 'Attack initiated',
            combat: this.currentAttack
        };
    }

    /**
     * Execute a battle round
     * @param {number} attackerDice - Number of attacker dice
     * @param {number} defenderDice - Number of defender dice (optional)
     * @returns {object} - Battle result
     */
    executeBattle(attackerDice, defenderDice = null) {
        if (!this.currentAttack) {
            return { 
                success: false, 
                error: 'No active attack' 
            };
        }

        const result = this.combatSystem.executeBattle(attackerDice, defenderDice);
        
        if (!result.success) {
            return result;
        }

        // Update statistics
        this.turnStats.armiesLost += result.result.attackerLosses;
        this.turnStats.armiesDestroyed += result.result.defenderLosses;
        
        // If territory conquered, increment counter
        if (result.conquered && !this.turnStats.territoriesConquered) {
            this.turnStats.territoriesConquered++;
            this.turnStats.successfulAttacks++;
        }
        
        // Update UI
        if (this.ui) {
            this.ui.updateCombatUI(result);
        }
        
        return result;
    }

    /**
     * Complete conquest after successful attack
     * @param {number} armiesToMove - Number of armies to move to conquered territory
     * @returns {object} - Result of conquest completion
     */
    completeConquest(armiesToMove) {
        if (!this.currentAttack || !this.combatSystem.getCurrentCombat()?.conquered) {
            return {
                success: false,
                error: 'No territory has been conquered'
            };
        }

        const result = this.combatSystem.completeConquest(armiesToMove);
        
        if (!result.success) {
            return result;
        }

        // Record the conquest in attack history
        const attackRecord = {
            ...this.combatSystem.getCurrentCombat(),
            armiesMoved: armiesToMove,
            timestamp: new Date().toISOString()
        };
        
        this.attackHistory.push(attackRecord);
        
        // Check if player has conquered a continent
        this.checkContinentConquest(result.conqueredTerritory);
        
        // Update UI
        if (this.ui) {
            this.ui.showConquestResult(result);
            this.ui.updateTerritoryOwnership(result.conqueredTerritory);
            
            // If player received a card, notify them
            if (this.turnStats.territoriesConquered === 1) {
                this.ui.showCardEarned();
            }
        }
        
        // Clear the current attack and selections
        this.currentAttack = null;
        this.clearSelections();
        
        return {
            ...result,
            cardEarned: this.turnStats.territoriesConquered === 1
        };
    }

    /**
     * End current attack without conquering
     * @returns {object} - Result of ending the attack
     */
    endAttack() {
        if (!this.currentAttack) {
            return {
                success: false,
                error: 'No active attack'
            };
        }

        // Record the attack in history
        const attackRecord = {
            ...this.combatSystem.getCurrentCombat(),
            ended: true,
            timestamp: new Date().toISOString()
        };
        
        this.attackHistory.push(attackRecord);
        
        // End the attack in combat system
        this.combatSystem.endCombat();
        this.currentAttack = null;
        
        // Clear selections
        this.clearSelections();
        
        if (this.ui) {
            this.ui.hideCombatUI();
        }
        
        return {
            success: true,
            message: 'Attack ended'
        };
    }

    /**
     * Check if a player has conquered a continent after taking a territory
     * @param {string} territoryId - Newly conquered territory
     * @returns {object|null} - Continent conquest result or null
     */
    checkContinentConquest(territoryId) {
        const territory = this.gameState.territories[territoryId];
        if (!territory) return null;

        const player = territory.owner;
        const continent = this.getContinentForTerritory(territoryId);
        
        if (!continent) return null;
        
        // Check if player owns all territories in continent
        const continentTerritories = this.getTerritoriesInContinent(continent);
        const ownsAll = continentTerritories.every(t => 
            this.gameState.territories[t].owner === player
        );
        
        if (ownsAll) {
            return {
                continentConquered: true,
                continent: continent,
                player: player,
                bonus: this.gameState.continentBonuses[continent]
            };
        }
        
        return null;
    }

    /**
     * Get continent for a territory
     * @param {string} territoryId - Territory ID
     * @returns {string|null} - Continent name or null
     */
    getContinentForTerritory(territoryId) {
        // This should match your map data structure
        // Looking for the continent that contains this territory
        for (const [continent, territories] of Object.entries(mapData.continents)) {
            if (territories.includes(territoryId)) {
                return continent;
            }
        }
        return null;
    }

    /**
     * Get all territories in a continent
     * @param {string} continent - Continent name
     * @returns {string[]} - Array of territory IDs
     */
    getTerritoriesInContinent(continent) {
        return mapData.continents[continent] || [];
    }

    /**
     * Check if player can end attack phase
     * @returns {boolean} - True if player can end attack phase
     */
    canEndPhase() {
        // Always allow ending the attack phase
        return true;
    }

    /**
     * End attack phase
     * @returns {object} - Result of ending the phase
     */
    endPhase() {
        if (!this.canAttack()) {
            return {
                success: false,
                error: 'Not in attack phase'
            };
        }

        // Make sure no attack is in progress
        if (this.currentAttack) {
            this.endAttack();
        }

        // Clear any selections
        this.clearSelections();
        
        // Check if player earned a card
        const earnedCard = this.turnStats.territoriesConquered > 0;
        
        // Provide card to player if they conquered at least one territory
        if (earnedCard) {
            this.awardCard();
        }
        
        // Ask phase manager to advance
        const result = this.phaseManager.advancePhase();
        
        // Reset turn stats for next time
        const stats = { ...this.turnStats };
        this.turnStats = this.resetTurnStats();
        
        return {
            success: true,
            message: 'Attack phase ended',
            stats: stats,
            cardEarned: earnedCard
        };
    }

    /**
     * Award a territory card to the current player
     */
    awardCard() {
        // This would connect to a card system to award a card
        const currentPlayer = this.gameState.getCurrentPlayer();
        console.log(`Awarding a card to ${currentPlayer}`);
        
        // In a real implementation, you would:
        // 1. Draw a card from the deck
        // 2. Add it to the player's hand
        // 3. Update the UI
        
        // Placeholder for when you implement the card system
        if (this.ui) {
            this.ui.showMessage(`${currentPlayer} earned a territory card!`);
        }
    }

    /**
     * Get attack history for the current turn
     * @returns {object[]} - Array of attack records
     */
    getAttackHistory() {
        return this.attackHistory;
    }

    /**
     * Get statistics for the current turn's attacks
     * @returns {object} - Attack statistics
     */
    getTurnStats() {
        return { ...this.turnStats };
    }
}