/**
 * ValidationManager - Centralized validation logic for RISK game
 * Consolidates all validation functions to eliminate duplication and establish single source of truth
 * Uses GameStateManager for consistent data access
 */
class ValidationManager {
    // Constants for validation rules
    static MIN_ATTACKING_ARMIES = 2;
    static MIN_ARMIES_TO_LEAVE = 1;
    static MIN_DEFENDING_ARMIES = 1;

    /**
     * Validates if an attack between two territories is legal
     * @param {string} fromTerritory - Attacking territory ID
     * @param {string} toTerritory - Defending territory ID
     * @returns {object} - {valid: boolean, reason?: string}
     */
    static validateAttack(fromTerritory, toTerritory) {
        const gameState = GameStateManager.getGameState();
        const from = GameStateManager.getTerritory(fromTerritory);
        const to = GameStateManager.getTerritory(toTerritory);

        // Territory existence validation
        if (!from || !to) {
            return { valid: false, reason: 'Invalid territory' };
        }

        // Current player ownership validation
        const currentPlayer = gameState.getCurrentPlayer();
        if (from.owner !== currentPlayer) {
            return { valid: false, reason: 'Can only attack from your own territories' };
        }

        // Different ownership validation
        if (from.owner === to.owner) {
            return { valid: false, reason: 'Cannot attack your own territory' };
        }

        // Army count validation
        if (from.armies < this.MIN_ATTACKING_ARMIES) {
            return { valid: false, reason: 'Must have at least 2 armies to attack' };
        }

        // Adjacency validation
        if (!from.neighbors || !from.neighbors.includes(toTerritory)) {
            return { valid: false, reason: 'Can only attack adjacent territories' };
        }

        return { valid: true };
    }

    /**
     * Validates if a territory can be used as an attacker
     * @param {string} territoryId - Territory ID to validate
     * @returns {object} - {valid: boolean, reason?: string}
     */
    static validateAttacker(territoryId) {
        const gameState = GameStateManager.getGameState();
        const territory = GameStateManager.getTerritory(territoryId);

        // Territory existence validation
        if (!territory) {
            return { valid: false, reason: 'Invalid territory' };
        }

        // Current player ownership validation
        const currentPlayer = gameState.getCurrentPlayer();
        if (territory.owner !== currentPlayer) {
            return { valid: false, reason: 'Can only attack from your own territories' };
        }

        // Army count validation
        if (territory.armies < this.MIN_ATTACKING_ARMIES) {
            return { valid: false, reason: 'Must have at least 2 armies to attack' };
        }

        // Check if there are any valid attack targets
        const hasValidTargets = this.getValidAttackTargets(territoryId).length > 0;
        if (!hasValidTargets) {
            return { valid: false, reason: 'No valid attack targets from this territory' };
        }

        return { valid: true };
    }

    /**
     * Get all valid attack targets for a territory
     * @param {string} territoryId - Source territory ID
     * @returns {string[]} - Array of valid target territory IDs
     */
    static getValidAttackTargets(territoryId) {
        const territory = GameStateManager.getTerritory(territoryId);
        if (!territory || !territory.neighbors) {
            return [];
        }

        return territory.neighbors.filter(neighbor => 
            this.validateAttack(territoryId, neighbor).valid
        );
    }

    /**
     * Validates if attacking is allowed in the current game phase
     * @returns {object} - {valid: boolean, reason?: string}
     */
    static validateAttackPhase() {
        const gameState = GameStateManager.getGameState();
        const currentPhase = gameState.currentPhase || gameState.phase;
        
        if (currentPhase !== 'attack') {
            return { valid: false, reason: 'Not in attack phase' };
        }

        return { valid: true };
    }

    /**
     * Validates if a territory can be used for fortification
     * @param {string} fromTerritory - Source territory ID
     * @param {string} toTerritory - Target territory ID
     * @returns {object} - {valid: boolean, reason?: string}
     */
    static validateFortify(fromTerritory, toTerritory) {
        const gameState = GameStateManager.getGameState();
        const from = GameStateManager.getTerritory(fromTerritory);
        const to = GameStateManager.getTerritory(toTerritory);

        // Territory existence validation
        if (!from || !to) {
            return { valid: false, reason: 'Invalid territory' };
        }

        // Current player ownership validation for both territories
        const currentPlayer = gameState.getCurrentPlayer();
        if (from.owner !== currentPlayer || to.owner !== currentPlayer) {
            return { valid: false, reason: 'Can only fortify between your own territories' };
        }

        // Army count validation
        if (from.armies <= this.MIN_ARMIES_TO_LEAVE) {
            return { valid: false, reason: 'Must leave at least 1 army in source territory' };
        }

        // Connectivity validation (territories must be connected through owned territories)
        if (!this.areConnected(fromTerritory, toTerritory)) {
            return { valid: false, reason: 'Territories must be connected through your territories' };
        }

        return { valid: true };
    }

    /**
     * Check if two territories are connected through player-owned territories
     * @param {string} fromTerritory - Source territory ID
     * @param {string} toTerritory - Target territory ID
     * @returns {boolean} - True if connected
     */
    static areConnected(fromTerritory, toTerritory) {
        const gameState = GameStateManager.getGameState();
        const currentPlayer = gameState.getCurrentPlayer();
        const visited = new Set();
        const queue = [fromTerritory];

        while (queue.length > 0) {
            const current = queue.shift();
            if (current === toTerritory) {
                return true;
            }

            if (visited.has(current)) {
                continue;
            }
            visited.add(current);

            const territory = GameStateManager.getTerritory(current);
            if (territory && territory.owner === currentPlayer && territory.neighbors) {
                territory.neighbors.forEach(neighbor => {
                    const neighborTerritory = GameStateManager.getTerritory(neighbor);
                    if (neighborTerritory && neighborTerritory.owner === currentPlayer && !visited.has(neighbor)) {
                        queue.push(neighbor);
                    }
                });
            }
        }

        return false;
    }

    /**
     * Validates army input for direct combat system
     * @param {number} currentArmies - Current army count
     * @param {number} remainingArmies - Proposed remaining armies
     * @param {string} type - 'attacker' or 'defender'
     * @returns {object} - {valid: boolean, reason?: string}
     */
    static validateArmyInput(currentArmies, remainingArmies, type = 'attacker') {
        // Cannot gain armies
        if (remainingArmies > currentArmies) {
            return { valid: false, reason: 'Cannot have more armies after battle than before' };
        }

        // Cannot have negative armies
        if (remainingArmies < 0) {
            return { valid: false, reason: 'Cannot have negative armies' };
        }

        // Attacker-specific validation
        if (type === 'attacker') {
            // Must leave at least 1 army in territory
            if (remainingArmies < this.MIN_ARMIES_TO_LEAVE) {
                return { valid: false, reason: 'Must leave at least 1 army in attacking territory' };
            }

            // Must have at least 2 armies to attack
            if (currentArmies < this.MIN_ATTACKING_ARMIES) {
                return { valid: false, reason: 'Attacker must have at least 2 armies to attack' };
            }
        }

        return { valid: true };
    }

    /**
     * Comprehensive attack validation combining all checks
     * @param {string} fromTerritory - Attacking territory ID
     * @param {string} toTerritory - Defending territory ID  
     * @returns {object} - {valid: boolean, reason?: string}
     */
    static validateCompleteAttack(fromTerritory, toTerritory) {
        // Phase validation
        const phaseCheck = this.validateAttackPhase();
        if (!phaseCheck.valid) {
            return phaseCheck;
        }

        // Attack validation
        const attackCheck = this.validateAttack(fromTerritory, toTerritory);
        if (!attackCheck.valid) {
            return attackCheck;
        }

        return { valid: true };
    }
}