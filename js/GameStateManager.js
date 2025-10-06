/**
 * RISK GAME STATE MANAGER
 * 
 * Single source of truth for all game state access
 * Eliminates inconsistent data access patterns across the codebase
 */

class GameStateManager {
    /**
     * Get the primary game state object
     * @returns {Object} - The game state
     */
    static getGameState() {
        // Priority order: riskUI > window.gameState > combatSystem
        return window.riskUI?.gameState || 
               window.gameState || 
               window.combatSystem?.gameState || 
               null;
    }

    /**
     * Get a territory by ID
     * @param {string} territoryId - Territory identifier
     * @returns {Object|null} - Territory object or null if not found
     */
    static getTerritory(territoryId) {
        const gameState = this.getGameState();
        return gameState?.territories?.[territoryId] || null;
    }

    /**
     * Update a territory's data
     * @param {string} territoryId - Territory identifier
     * @param {Object} updates - Properties to update
     * @returns {boolean} - Success status
     */
    static updateTerritory(territoryId, updates) {
        const gameState = this.getGameState();
        const territory = gameState?.territories?.[territoryId];
        
        if (!territory) {
            console.error(`Territory not found: ${territoryId}`);
            return false;
        }

        // Apply updates
        Object.assign(territory, updates);
        
        // Trigger UI updates
        this.notifyTerritoryChanged(territoryId, territory);
        
        return true;
    }

    /**
     * Get current player
     * @returns {string|null} - Current player ID
     */
    static getCurrentPlayer() {
        const gameState = this.getGameState();
        return gameState?.getCurrentPlayer?.() || gameState?.currentPlayer || null;
    }

    /**
     * Get current game phase
     * @returns {string|null} - Current phase
     */
    static getCurrentPhase() {
        const gameState = this.getGameState();
        return gameState?.phase || null;
    }

    /**
     * Validate territory ownership
     * @param {string} territoryId - Territory to check
     * @param {string} playerId - Player to check against (optional, defaults to current player)
     * @returns {boolean} - Whether player owns territory
     */
    static validateOwnership(territoryId, playerId = null) {
        const territory = this.getTerritory(territoryId);
        const player = playerId || this.getCurrentPlayer();
        return territory?.owner === player;
    }

    /**
     * Get all territories owned by a player
     * @param {string} playerId - Player ID (optional, defaults to current player)
     * @returns {Array} - Array of territory objects
     */
    static getPlayerTerritories(playerId = null) {
        const gameState = this.getGameState();
        const player = playerId || this.getCurrentPlayer();
        
        if (!gameState?.territories || !player) return [];
        
        return Object.values(gameState.territories).filter(territory => territory.owner === player);
    }

    /**
     * Get neighbors of a territory
     * @param {string} territoryId - Territory ID
     * @returns {Array} - Array of neighbor territory IDs
     */
    static getTerritoryNeighbors(territoryId) {
        const territory = this.getTerritory(territoryId);
        return territory?.neighbors || [];
    }

    /**
     * Check if two territories are adjacent
     * @param {string} territory1Id - First territory
     * @param {string} territory2Id - Second territory
     * @returns {boolean} - Whether territories are neighbors
     */
    static areTerritoriesAdjacent(territory1Id, territory2Id) {
        const neighbors = this.getTerritoryNeighbors(territory1Id);
        return neighbors.includes(territory2Id);
    }

    /**
     * Update territory army count
     * @param {string} territoryId - Territory ID
     * @param {number} newArmyCount - New army count
     * @returns {boolean} - Success status
     */
    static updateTerritoryArmies(territoryId, newArmyCount) {
        if (newArmyCount < 0) {
            console.error(`Invalid army count: ${newArmyCount}`);
            return false;
        }
        
        return this.updateTerritory(territoryId, { armies: newArmyCount });
    }

    /**
     * Transfer territory ownership
     * @param {string} territoryId - Territory ID
     * @param {string} newOwner - New owner player ID
     * @param {number} armies - Army count for new owner
     * @returns {boolean} - Success status
     */
    static transferTerritoryOwnership(territoryId, newOwner, armies = 1) {
        const result = this.updateTerritory(territoryId, { 
            owner: newOwner, 
            armies: armies 
        });
        
        if (result) {
            console.log(`Territory ${territoryId} transferred to ${newOwner} with ${armies} armies`);
        }
        
        return result;
    }

    /**
     * Notify UI systems of territory changes
     * @param {string} territoryId - Changed territory
     * @param {Object} territory - Territory data
     */
    static notifyTerritoryChanged(territoryId, territory) {
        // Update visual elements
        this.updateTerritoryVisuals(territoryId, territory);
        
        // Trigger any registered callbacks
        if (window.onTerritoryChanged) {
            window.onTerritoryChanged(territoryId, territory);
        }
    }

    /**
     * Update territory visual elements
     * @param {string} territoryId - Territory ID
     * @param {Object} territory - Territory data
     */
    static updateTerritoryVisuals(territoryId, territory) {
        // Update army count display
        const armyElement = document.getElementById(`${territoryId}-armies`);
        if (armyElement) {
            armyElement.textContent = `${territory.armies} armies`;
        }

        // Update territory color for owner
        const territoryElement = document.getElementById(territoryId);
        if (territoryElement && window.playerColors && territory.owner) {
            const playerIndex = parseInt(territory.owner.replace('Player ', '')) - 1;
            const color = window.playerColors[playerIndex];
            if (color) {
                territoryElement.style.fill = color;
            }
        }
    }

    /**
     * Debug: Log current game state
     */
    static debugGameState() {
        const gameState = this.getGameState();
        console.log('GameStateManager Debug:', {
            gameStateSource: gameState === window.riskUI?.gameState ? 'riskUI' : 
                           gameState === window.gameState ? 'window' : 
                           gameState === window.combatSystem?.gameState ? 'combatSystem' : 'unknown',
            currentPlayer: this.getCurrentPlayer(),
            currentPhase: this.getCurrentPhase(),
            territoryCount: gameState?.territories ? Object.keys(gameState.territories).length : 0
        });
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.GameStateManager = GameStateManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameStateManager;
}