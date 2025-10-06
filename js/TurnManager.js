class TurnManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.selectedTerritory = null;
        this.diceResults = null;
        this.lastAttackResult = null;
        this.attackLogic = new AttackLogic(gameState);
        this.directCombat = new DirectCombat(); // Direct army input system
        this.turnNumber = 1;
        this.currentPhase = 'initial-setup';
        this.reinforcementManager = null;
        this.fortificationManager = null;
    }

    setReinforcementManager(reinforcementManager) {
        this.reinforcementManager = reinforcementManager;
    }

    setFortificationManager(fortificationManager) {
        this.fortificationManager = fortificationManager;
    }

    // Phase management
    getCurrentPhase() {
        return this.currentPhase;
    }

    advancePhase() {
        switch(this.currentPhase) {
            case 'initial-setup':
                if (this.isInitialSetupComplete()) {
                    this.currentPhase = 'initial-placement';
                    this.gameState.phase = 'initial-placement';
                }
                break;
            case 'initial-placement':
                if (this.isInitialPlacementComplete()) {
                    this.currentPhase = 'deploy';
                    this.gameState.phase = 'deploy';
                    this.calculateReinforcements();
                }
                break;
            case 'deploy':
                // Check if this is initial deployment or regular deployment
                if (!this.gameState.initialDeploymentComplete) {
                    // Still in initial deployment phase - check if all players finished
                    const allPlayersFinishedInitialDeployment = this.gameState.players.every(player => 
                        (this.gameState.remainingArmies[player] || 0) === 0
                    );
                    
                    if (allPlayersFinishedInitialDeployment) {
                        // Transition to regular game turns
                        this.currentPhase = 'reinforce';
                        this.gameState.phase = 'reinforce';
                        this.gameState.currentPlayerIndex = 0; // Start with first player
                        this.gameState.turnNumber = 1;
                        this.calculateReinforcements();
                    }
                } else {
                    // Regular deployment phase - move to attack
                    this.currentPhase = 'attack';
                    this.gameState.phase = 'attack';
                }
                break;
            case 'reinforce':
                // After reinforcement, move to attack phase
                this.currentPhase = 'attack';
                this.gameState.phase = 'attack';
                break;
            case 'attack':
                this.currentPhase = 'fortify';
                this.gameState.phase = 'fortify';
                // Initialize fortification phase
                if (this.fortificationManager) {
                    this.fortificationManager.startFortificationPhase();
                }
                break;
            case 'fortify':
                // Check if fortification is complete (used or skipped)
                const fortifyComplete = this.fortificationManager ? 
                    this.fortificationManager.canCompleteFortification() : true;
                
                if (fortifyComplete) {
                    this.endTurn();
                }
                break;
        }
        return this.currentPhase;
    }

    handleTerritoryClick(territory) {
        switch (this.gameState.phase) {
            case 'initial-setup':
                return this.handleInitialSetupClick(territory);
            case 'initial-placement':
                return this.handleInitialPlacementClick(territory);
            case 'deploy':
                return this.handleDeployClick(territory);
            case 'reinforce':
                return this.handleReinforceClick(territory);
            case 'attack':
                return this.handleAttackClick(territory);
            case 'fortify':
                return this.handleFortifyClick(territory);
            default:
                return null;
        }
    }

    handleInitialSetupClick(territory) {
        const territoryData = this.gameState.territories[territory];
        if (!territoryData.owner) {
            territoryData.owner = this.gameState.getCurrentPlayer();
            territoryData.armies = 1;
            this.gameState.remainingArmies[this.gameState.getCurrentPlayer()]--;
            
            // Check if all territories are assigned
            const allAssigned = Object.values(this.gameState.territories)
                .every(t => t.owner !== null);
            
            if (allAssigned) {
                this.gameState.phase = 'initial-placement';
            } else {
                this.gameState.nextPlayer();
            }

            return {
                type: 'territory-claim',
                territory,
                owner: territoryData.owner,
                nextPlayer: this.gameState.getCurrentPlayer()
            };
        }
        return null;
    }

    handleInitialPlacementClick(territory) {
        const territoryData = this.gameState.territories[territory];
        const currentPlayer = this.gameState.getCurrentPlayer();
        const remainingArmies = this.gameState.remainingArmies[currentPlayer];

        if (territoryData.owner === currentPlayer && remainingArmies > 0) {
            territoryData.armies++;
            this.gameState.remainingArmies[currentPlayer]--;

            // Check if current player has finished placing troops
            if (this.gameState.remainingArmies[currentPlayer] === 0) {
                // Move to next player
                this.gameState.nextPlayer();
                
                // Check if all players have finished initial placement
                const allFinished = this.gameState.players.every(player => 
                    this.gameState.remainingArmies[player] === 0
                );
                
                if (allFinished) {
                    this.gameState.phase = 'deploy';
                    // Initialize reinforcements for first player
                    this.gameState.remainingArmies[this.gameState.getCurrentPlayer()] = 
                        this.gameState.calculateReinforcements(this.gameState.getCurrentPlayer());
                }
            }

            return {
                type: 'initial-placement',
                territory,
                owner: territoryData.owner,
                armies: territoryData.armies,
                remainingArmies: this.gameState.remainingArmies[currentPlayer],
                nextPlayer: this.gameState.getCurrentPlayer()
            };
        }
        return null;
    }

    isInitialSetupComplete() {
        return Object.values(this.gameState.territories).every(t => t.owner !== null);
    }

    isInitialPlacementComplete() {
        return this.gameState.players.every(player => 
            this.gameState.remainingArmies[player] === 0
        );
    }

    endTurn() {
        // Reset fortification state for new turn
        if (this.fortificationManager) {
            this.fortificationManager.resetForNewTurn();
        }
        
        // Move to next player
        const nextPlayer = this.gameState.nextPlayer();
        if (nextPlayer === 0) { // Full round completed
            this.turnNumber++;
            this.gameState.turnNumber = this.turnNumber;
        }
        
        // Start new turn with reinforcement phase (for regular game) or deploy phase (for initial)
        if (this.gameState.initialDeploymentComplete) {
            this.currentPhase = 'reinforce';
            this.gameState.phase = 'reinforce';
        } else {
            this.currentPhase = 'deploy';
            this.gameState.phase = 'deploy';
        }
        
        this.calculateReinforcements();
    }

    getTurnNumber() {
        return this.turnNumber;
    }

    getRemainingArmies() {
        return this.gameState.remainingArmies[this.gameState.getCurrentPlayer()];
    }

    calculateReinforcements() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const reinforcements = this.gameState.calculateReinforcements ? 
            this.gameState.calculateReinforcements(currentPlayer) :
            Math.max(3, Math.floor(Object.values(this.gameState.territories).filter(t => t.owner === currentPlayer).length / 3));
        
        this.gameState.remainingArmies[currentPlayer] = reinforcements;
        return reinforcements;
    }

    handleDeployClick(territory) {
        const territoryData = this.gameState.territories[territory];
        const currentPlayer = this.gameState.getCurrentPlayer();
        const remainingArmies = this.gameState.remainingArmies[currentPlayer];

        // Prevent deployment if no armies remaining (no negative reinforcements)
        if (territoryData.owner === currentPlayer && remainingArmies > 0) {
            territoryData.armies++;
            this.gameState.remainingArmies[currentPlayer]--;

            const result = {
                type: 'deploy',
                territory,
                armies: territoryData.armies,
                remaining: this.gameState.remainingArmies[currentPlayer]
            };

            // Check if current player has finished deploying
            if (this.gameState.remainingArmies[currentPlayer] === 0) {
                // Check if ALL players have finished their deployment
                const allPlayersFinished = this.gameState.players.every(player => 
                    this.gameState.remainingArmies[player] === 0
                );
                
                if (allPlayersFinished) {
                    // All players have deployed all reinforcements - advance to attack phase
                    this.gameState.phase = 'attack';
                    result.newPhase = 'attack';
                    result.message = 'All players have deployed their reinforcements. Attack phase begins!';
                } else {
                    // Move to next player who still has reinforcements to deploy
                    this.gameState.nextPlayer();
                    result.nextPlayer = this.gameState.getCurrentPlayer();
                    result.message = `${currentPlayer} finished deploying. ${this.gameState.getCurrentPlayer()}'s turn to deploy.`;
                }
            }

            return result;
        }
        return null;
    }

    handleReinforceClick(territory) {
        const territoryData = this.gameState.territories[territory];
        const currentPlayer = this.gameState.getCurrentPlayer();
        const remainingArmies = this.gameState.remainingArmies[currentPlayer];

        // Only allow reinforcement on territories owned by current player
        if (territoryData.owner === currentPlayer && remainingArmies > 0) {
            territoryData.armies++;
            this.gameState.remainingArmies[currentPlayer]--;

            const result = {
                type: 'reinforce',
                territory,
                armies: territoryData.armies,
                remaining: this.gameState.remainingArmies[currentPlayer]
            };

            // Check if current player has finished reinforcing
            if (this.gameState.remainingArmies[currentPlayer] === 0) {
                result.reinforceComplete = true;
                result.message = `${currentPlayer} finished reinforcing. Click 'Next Phase' to begin attack phase.`;
            }

            return result;
        }
        return null;
    }

    handleAttackClick(territory) {
        if (!this.selectedTerritory) {
            // First click - select attacking territory
            if (this.attackLogic.canContinueAttacking(territory)) {
                this.selectedTerritory = territory;
                const validTargets = this.attackLogic.getPossibleAttackTargets(territory);
                return {
                    type: 'attack-select',
                    territory,
                    validTargets,
                    maxDice: this.attackLogic.getMaxAttackingDice(territory)
                };
            }
        } else {
            // Second click - select target territory
            const validation = this.attackLogic.validateAttack(this.selectedTerritory, territory);
            if (validation.valid) {
                // Get max dice counts for both sides
                const maxAttackerDice = this.attackLogic.getMaxAttackingDice(this.selectedTerritory);
                const maxDefenderDice = this.attackLogic.getMaxDefendingDice(territory);
                
                // For now, always use maximum dice (can be made configurable)
                const result = this.attackLogic.resolveBattle(
                    this.selectedTerritory,
                    territory,
                    maxAttackerDice,
                    maxDefenderDice
                );

                const attackResult = {
                    type: 'attack-resolve',
                    attackingTerritory: this.selectedTerritory,
                    defendingTerritory: territory,
                    attackerDice: result.attackerDice,
                    defenderDice: result.defenderDice,
                    attackerLosses: result.attacker,
                    defenderLosses: result.defender,
                    territoryConquered: result.territoryConquered
                };

                this.lastAttackResult = attackResult;
                this.selectedTerritory = null;
                return attackResult;
            } else {
                // Invalid target - deselect
                this.selectedTerritory = null;
                return {
                    type: 'attack-invalid',
                    reason: validation.reason
                };
            }
        }
        return null;
    }

    handleFortifyClick(territory) {
        if (!this.selectedTerritory) {
            // First click - select source territory
            if (this.canFortifyFrom(territory)) {
                this.selectedTerritory = territory;
                return {
                    type: 'fortify-select',
                    territory,
                    validTargets: this.getValidFortifyTargets(territory)
                };
            }
        } else {
            // Second click - select destination territory
            if (this.gameState.isValidFortify(this.selectedTerritory, territory)) {
                const result = this.resolveFortify(this.selectedTerritory, territory);
                this.selectedTerritory = null;
                return result;
            } else {
                // Invalid target - deselect
                this.selectedTerritory = null;
                return {
                    type: 'fortify-cancel'
                };
            }
        }
        return null;
    }

    canAttackFrom(territory) {
        // DEPRECATED: Use ValidationManager.validateAttacker() instead
        return ValidationManager.validateAttacker(territory).valid;
    }

    getValidAttackTargets(territory) {
        // DEPRECATED: Use ValidationManager.getValidAttackTargets() instead
        return ValidationManager.getValidAttackTargets(territory);
    }

    canFortifyFrom(territory) {
        const territoryData = this.gameState.territories[territory];
        return territoryData.owner === this.gameState.getCurrentPlayer() &&
               territoryData.armies > 1 &&
               this.getValidFortifyTargets(territory).length > 0;
    }

    getValidFortifyTargets(territory) {
        return this.gameState.territories[territory].neighbors.filter(neighbor =>
            this.gameState.isValidFortify(territory, neighbor)
        );
    }

    resolveAttack(attackingTerritory, defendingTerritory) {
        const attacker = this.gameState.territories[attackingTerritory];
        const defender = this.gameState.territories[defendingTerritory];

        // Determine number of dice
        const attackerDice = Math.min(3, attacker.armies - 1);
        const defenderDice = Math.min(2, defender.armies);

        // Roll dice using centralized DiceRoller
        const attackerRolls = this.diceRoller.rollDice(attackerDice);
        const defenderRolls = this.diceRoller.rollDice(defenderDice);

        // Resolve combat
        const losses = this.gameState.resolveCombat(attackerRolls, defenderRolls);

        // Apply losses
        attacker.armies -= losses.attacker;
        defender.armies -= losses.defender;

        // Check if territory is conquered
        let conquered = false;
        if (defender.armies === 0) {
            defender.owner = attacker.owner;
            defender.armies = attackerDice;
            attacker.armies -= attackerDice;
            conquered = true;
        }

        return {
            type: 'attack-resolve',
            attackingTerritory,
            defendingTerritory,
            attackerDice: attackerRolls,
            defenderDice: defenderRolls,
            attackerLosses: losses.attacker,
            defenderLosses: losses.defender,
            conquered,
            newAttackerArmies: attacker.armies,
            newDefenderArmies: defender.armies,
            newDefenderOwner: defender.owner
        };
    }

    resolveFortify(fromTerritory, toTerritory) {
        const from = this.gameState.territories[fromTerritory];
        const to = this.gameState.territories[toTerritory];
        
        // Move half of armies by default
        const armiesToMove = Math.floor((from.armies - 1) / 2);
        this.gameState.moveArmies(fromTerritory, toTerritory, armiesToMove);
        
        // End fortification phase
        this.gameState.nextPhase();

        return {
            type: 'fortify-resolve',
            fromTerritory,
            toTerritory,
            armiesMoved: armiesToMove,
            newFromArmies: from.armies,
            newToArmies: to.armies
        };
    }

    endPhase() {
        this.selectedTerritory = null;
        this.gameState.nextPhase();
        return {
            type: 'phase-change',
            newPhase: this.gameState.phase,
            currentPlayer: this.gameState.getCurrentPlayer(),
            reinforcements: this.gameState.remainingArmies[this.gameState.getCurrentPlayer()]
        };
    }
}