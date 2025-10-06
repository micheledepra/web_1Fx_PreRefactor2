class AttackLogic {
    constructor(gameState) {
        this.gameState = gameState;
        this.directCombat = new DirectCombat(); // Use direct army input system
    }

    validateAttack(fromTerritory, toTerritory) {
        // DEPRECATED: Use ValidationManager.validateAttack() instead
        return ValidationManager.validateAttack(fromTerritory, toTerritory);
    }

    // Method replaced with direct combat approach
    determineArmyCounts(attackerArmies, defenderArmies) {
        // Determine remaining armies based on combat rules
        return {
            remainingAttackerArmies: attackerArmies - 1,  // Default to losing 1 army
            remainingDefenderArmies: Math.max(0, defenderArmies - 1)  // Default to losing 1 army or all if only had 1
        };
    }

    resolveBattle(attackingTerritory, defendingTerritory, attackerRemainingArmies, defenderRemainingArmies) {
        // Get territories
        const attacker = this.gameState.territories[attackingTerritory];
        const defender = this.gameState.territories[defendingTerritory];
        
        // If no remaining armies specified, use default values
        if (attackerRemainingArmies === undefined) {
            attackerRemainingArmies = attacker.armies - 1;
        }
        if (defenderRemainingArmies === undefined) {
            defenderRemainingArmies = Math.max(0, defender.armies - 1);
        }

        // Calculate losses
        const attackerLosses = attacker.armies - attackerRemainingArmies;
        const defenderLosses = defender.armies - defenderRemainingArmies;
        
        // Validate inputs
        if (attackerRemainingArmies < 1) {
            console.error("Invalid attacker remaining armies: must be at least 1");
            return { success: false, error: "Attacker must have at least 1 army remaining" };
        }
        
        if (attackerRemainingArmies > attacker.armies) {
            console.error("Invalid attacker remaining armies: cannot exceed current armies");
            return { success: false, error: "Remaining armies cannot exceed current armies" };
        }
        
        if (defenderRemainingArmies < 0) {
            console.error("Invalid defender remaining armies: cannot be negative");
            return { success: false, error: "Defender armies cannot be negative" };
        }
        
        if (defenderRemainingArmies > defender.armies) {
            console.error("Invalid defender remaining armies: cannot exceed current armies");
            return { success: false, error: "Remaining armies cannot exceed current armies" };
        }
        
        const losses = {
            attacker: attackerLosses,
            defender: defenderLosses
        };

        // Apply losses
        attacker.armies = attackerRemainingArmies;
        defender.armies = defenderRemainingArmies;

        // Check if territory is conquered
        if (defender.armies === 0) {
            losses.territoryConquered = true;
            defender.owner = attacker.owner;
            // Default move is 1 army
            defender.armies = 1;
            attacker.armies -= 1;
        }

        return losses;
    }

    getMaxAttackingDice(territory) {
        const armies = this.gameState.territories[territory].armies;
        return Math.min(3, armies - 1);
    }

    getMaxDefendingDice(territory) {
        const armies = this.gameState.territories[territory].armies;
        return Math.min(2, armies);
    }

    canContinueAttacking(fromTerritory) {
        const territory = this.gameState.territories[fromTerritory];
        if (!territory || territory.armies <= 1) {
            return false;
        }

        // Check if there are any valid targets
        return territory.neighbors.some(neighbor => {
            const neighborTerritory = this.gameState.territories[neighbor];
            return neighborTerritory.owner !== territory.owner;
        });
    }

    getPossibleAttackTargets(fromTerritory) {
        const territory = this.gameState.territories[fromTerritory];
        if (!territory || territory.armies <= 1) {
            return [];
        }

        return territory.neighbors.filter(neighbor => {
            const neighborTerritory = this.gameState.territories[neighbor];
            return neighborTerritory.owner !== territory.owner;
        });
    }

    moveTroopsAfterConquest(fromTerritory, toTerritory, amount) {
        const from = this.gameState.territories[fromTerritory];
        const to = this.gameState.territories[toTerritory];

        if (amount >= from.armies) {
            throw new Error('Must leave at least one army in attacking territory');
        }

        if (amount < 1) {
            throw new Error('Must move at least one army to conquered territory');
        }

        from.armies -= amount;
        to.armies += amount;

        return {
            fromCount: from.armies,
            toCount: to.armies
        };
    }
}