/**
 * FortificationManager - Handles army movement during fortify phase
 * Manages territory selection, pathfinding, and army movement with visual feedback
 */
class FortificationManager {
    constructor() {
        this.gameState = null;
        this.territoryVisualManager = null;
        this.selectedSourceTerritory = null;
        this.selectedDestinationTerritory = null;
        this.validDestinations = [];
        this.hasUsedFortification = false;
        this.fortificationModal = null;
        
        this.createFortificationModal();
    }

    /**
     * Initialize the FortificationManager with game dependencies
     */
    initializeGame(gameState, territoryVisualManager) {
        this.gameState = gameState;
        this.territoryVisualManager = territoryVisualManager;
    }

    /**
     * Start fortification phase for current player
     */
    startFortificationPhase() {
        this.hasUsedFortification = false;
        this.clearSelection();
        this.highlightValidSources();
        this.showFortificationInstructions();
    }

    /**
     * Handle territory click during fortify phase
     */
    handleTerritoryClick(territoryId) {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const territory = this.gameState.territories[territoryId];

        if (!territory || territory.owner !== currentPlayer) {
            return null;
        }

        // If no source selected yet, try to select as source
        if (!this.selectedSourceTerritory) {
            return this.selectSourceTerritory(territoryId);
        }

        // If source is selected, try to select as destination
        if (this.selectedSourceTerritory && !this.selectedDestinationTerritory) {
            return this.selectDestinationTerritory(territoryId);
        }

        // If both selected, deselect and start over
        this.clearSelection();
        return this.selectSourceTerritory(territoryId);
    }

    /**
     * Select source territory for fortification
     */
    selectSourceTerritory(territoryId) {
        const territory = this.gameState.territories[territoryId];
        const currentPlayer = this.gameState.getCurrentPlayer();

        // Validate source territory
        if (territory.owner !== currentPlayer || territory.armies <= 1) {
            return {
                type: 'fortify-invalid-source',
                message: territory.armies <= 1 ? 
                    'Cannot move from territory with only 1 army' : 
                    'Territory not owned by current player'
            };
        }

        this.selectedSourceTerritory = territoryId;
        this.validDestinations = this.findValidDestinations(territoryId);

        // Update visual feedback
        this.territoryVisualManager.highlightTerritory(territoryId, 'selected-source');
        this.highlightValidDestinations();

        return {
            type: 'fortify-source-selected',
            territory: territoryId,
            validDestinations: this.validDestinations
        };
    }

    /**
     * Select destination territory for fortification
     */
    selectDestinationTerritory(territoryId) {
        if (!this.validDestinations.includes(territoryId)) {
            return {
                type: 'fortify-invalid-destination',
                message: 'Territory not reachable through your territories'
            };
        }

        this.selectedDestinationTerritory = territoryId;
        this.territoryVisualManager.highlightTerritory(territoryId, 'selected-destination');

        // Show movement interface
        this.showMovementInterface();

        return {
            type: 'fortify-destination-selected',
            source: this.selectedSourceTerritory,
            destination: territoryId
        };
    }

    /**
     * Find valid destination territories using pathfinding
     */
    findValidDestinations(sourceId) {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const visited = new Set();
        const queue = [sourceId];
        const validDestinations = [];

        visited.add(sourceId);

        while (queue.length > 0) {
            const currentId = queue.shift();
            const currentTerritory = this.gameState.territories[currentId];

            // Check all neighbors
            for (const neighborId of currentTerritory.neighbors) {
                if (visited.has(neighborId)) continue;

                const neighbor = this.gameState.territories[neighborId];
                
                // If neighbor is owned by current player
                if (neighbor.owner === currentPlayer) {
                    visited.add(neighborId);
                    queue.push(neighborId);
                    
                    // If it's not the source territory, it's a valid destination
                    if (neighborId !== sourceId) {
                        validDestinations.push(neighborId);
                    }
                }
            }
        }

        return validDestinations;
    }

    /**
     * Show movement interface modal
     */
    showMovementInterface() {
        const sourceTerritory = this.gameState.territories[this.selectedSourceTerritory];
        const destinationTerritory = this.gameState.territories[this.selectedDestinationTerritory];
        const maxMovableArmies = sourceTerritory.armies - 1;

        // Update modal content
        document.getElementById('fortify-source-name').textContent = this.formatTerritoryName(this.selectedSourceTerritory);
        document.getElementById('fortify-destination-name').textContent = this.formatTerritoryName(this.selectedDestinationTerritory);
        document.getElementById('fortify-source-armies').textContent = sourceTerritory.armies;
        document.getElementById('fortify-destination-armies').textContent = destinationTerritory.armies;
        document.getElementById('fortify-max-movable').textContent = maxMovableArmies;

        // Set up army count controls
        const armyInput = document.getElementById('fortify-army-count');
        const armySlider = document.getElementById('fortify-army-slider');
        
        armyInput.max = maxMovableArmies;
        armyInput.value = 1;
        armySlider.max = maxMovableArmies;
        armySlider.value = 1;

        // Show modal
        this.fortificationModal.style.display = 'block';
    }

    /**
     * Execute army movement
     */
    executeFortification(armyCount) {
        if (this.hasUsedFortification) {
            return {
                type: 'fortify-already-used',
                message: 'You can only fortify once per turn'
            };
        }

        const sourceTerritory = this.gameState.territories[this.selectedSourceTerritory];
        const destinationTerritory = this.gameState.territories[this.selectedDestinationTerritory];

        // Validate army count
        if (armyCount < 1 || armyCount >= sourceTerritory.armies) {
            return {
                type: 'fortify-invalid-count',
                message: 'Invalid army count'
            };
        }

        // Execute movement
        sourceTerritory.armies -= armyCount;
        destinationTerritory.armies += armyCount;

        // Mark fortification as used
        this.hasUsedFortification = true;

        // Update visuals
        this.territoryVisualManager.updateTerritoryVisual(this.selectedSourceTerritory, sourceTerritory);
        this.territoryVisualManager.updateTerritoryVisual(this.selectedDestinationTerritory, destinationTerritory);

        // Clear selection and close modal
        this.clearSelection();
        this.fortificationModal.style.display = 'none';

        return {
            type: 'fortify-complete',
            source: this.selectedSourceTerritory,
            destination: this.selectedDestinationTerritory,
            armiesMoved: armyCount,
            sourceArmiesLeft: sourceTerritory.armies,
            destinationArmiesNew: destinationTerritory.armies
        };
    }

    /**
     * Skip fortification phase
     */
    skipFortification() {
        this.hasUsedFortification = true;
        this.clearSelection();
        
        return {
            type: 'fortify-skipped'
        };
    }

    /**
     * Check if fortification phase can be completed
     */
    canCompleteFortification() {
        return this.hasUsedFortification;
    }

    /**
     * Clear all selections and highlights
     */
    clearSelection() {
        this.selectedSourceTerritory = null;
        this.selectedDestinationTerritory = null;
        this.validDestinations = [];
        this.territoryVisualManager.clearAllHighlights();
        
        if (this.fortificationModal) {
            this.fortificationModal.style.display = 'none';
        }
    }

    /**
     * Highlight valid source territories
     */
    highlightValidSources() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        
        Object.entries(this.gameState.territories).forEach(([territoryId, territory]) => {
            if (territory.owner === currentPlayer && territory.armies > 1) {
                this.territoryVisualManager.highlightTerritory(territoryId, 'valid-source');
            }
        });
    }

    /**
     * Highlight valid destination territories
     */
    highlightValidDestinations() {
        this.validDestinations.forEach(territoryId => {
            this.territoryVisualManager.highlightTerritory(territoryId, 'valid-destination');
        });
    }

    /**
     * Show fortification instructions
     */
    showFortificationInstructions() {
        // This could be integrated with the game UI to show instructions
        console.log('Fortification Phase: Select a territory to move armies from (must have >1 army)');
    }

    /**
     * Format territory name for display
     */
    formatTerritoryName(territoryId) {
        return territoryId.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Create fortification modal
     */
    createFortificationModal() {
        this.fortificationModal = document.createElement('div');
        this.fortificationModal.className = 'fortification-modal';
        this.fortificationModal.innerHTML = `
            <div class="fortification-modal-content">
                <div class="fortification-header">
                    <h3>Move Armies</h3>
                    <button class="close-btn" id="close-fortification-modal">&times;</button>
                </div>
                
                <div class="fortification-info">
                    <div class="movement-path">
                        <div class="territory-info source">
                            <h4>From: <span id="fortify-source-name">Territory</span></h4>
                            <p>Current armies: <span id="fortify-source-armies">0</span></p>
                        </div>
                        
                        <div class="movement-arrow">→</div>
                        
                        <div class="territory-info destination">
                            <h4>To: <span id="fortify-destination-name">Territory</span></h4>
                            <p>Current armies: <span id="fortify-destination-armies">0</span></p>
                        </div>
                    </div>
                    
                    <div class="movement-constraints">
                        <p>Maximum armies you can move: <span id="fortify-max-movable">0</span></p>
                        <p class="constraint-note">Must leave at least 1 army in source territory</p>
                    </div>
                </div>
                
                <div class="fortification-controls">
                    <label for="fortify-army-count">Armies to move:</label>
                    <div class="army-input-group">
                        <button type="button" id="decrease-fortify-armies">-</button>
                        <input type="number" id="fortify-army-count" min="1" value="1">
                        <button type="button" id="increase-fortify-armies">+</button>
                    </div>
                    <input type="range" id="fortify-army-slider" min="1" value="1" class="army-slider">
                </div>
                
                <div class="fortification-preview">
                    <h4>After Movement:</h4>
                    <p><span id="preview-source-name">Source</span>: <span id="preview-source-armies">0</span> armies</p>
                    <p><span id="preview-destination-name">Destination</span>: <span id="preview-destination-armies">0</span> armies</p>
                </div>
                
                <div class="fortification-actions">
                    <button type="button" id="cancel-fortification" class="secondary-btn">Cancel</button>
                    <button type="button" id="confirm-fortification" class="primary-btn">Move Armies</button>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.appendChild(this.fortificationModal);

        // Set up event listeners
        this.setupModalEventListeners();
    }

    /**
     * Set up event listeners for the fortification modal
     */
    setupModalEventListeners() {
        // Close modal
        document.getElementById('close-fortification-modal').addEventListener('click', () => {
            this.fortificationModal.style.display = 'none';
        });

        document.getElementById('cancel-fortification').addEventListener('click', () => {
            this.fortificationModal.style.display = 'none';
        });

        // Army count controls
        const armyInput = document.getElementById('fortify-army-count');
        const armySlider = document.getElementById('fortify-army-slider');
        const decreaseBtn = document.getElementById('decrease-fortify-armies');
        const increaseBtn = document.getElementById('increase-fortify-armies');

        // Sync input and slider
        armyInput.addEventListener('input', () => {
            armySlider.value = armyInput.value;
            this.updatePreview();
        });

        armySlider.addEventListener('input', () => {
            armyInput.value = armySlider.value;
            this.updatePreview();
        });

        // +/- buttons
        decreaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(armyInput.value);
            if (currentValue > 1) {
                armyInput.value = currentValue - 1;
                armySlider.value = armyInput.value;
                this.updatePreview();
            }
        });

        increaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(armyInput.value);
            const maxValue = parseInt(armyInput.max);
            if (currentValue < maxValue) {
                armyInput.value = currentValue + 1;
                armySlider.value = armyInput.value;
                this.updatePreview();
            }
        });

        // Confirm fortification
        document.getElementById('confirm-fortification').addEventListener('click', () => {
            const armyCount = parseInt(armyInput.value);
            const result = this.executeFortification(armyCount);
            
            // Dispatch result to game system
            if (window.riskUI) {
                window.riskUI.updateUI(result);
            }
        });

        // Update preview on initial load
        setTimeout(() => this.updatePreview(), 100);
    }

    /**
     * Update movement preview
     */
    updatePreview() {
        if (!this.selectedSourceTerritory || !this.selectedDestinationTerritory) return;

        const armyCount = parseInt(document.getElementById('fortify-army-count').value) || 1;
        const sourceTerritory = this.gameState.territories[this.selectedSourceTerritory];
        const destinationTerritory = this.gameState.territories[this.selectedDestinationTerritory];

        document.getElementById('preview-source-name').textContent = this.formatTerritoryName(this.selectedSourceTerritory);
        document.getElementById('preview-destination-name').textContent = this.formatTerritoryName(this.selectedDestinationTerritory);
        document.getElementById('preview-source-armies').textContent = sourceTerritory.armies - armyCount;
        document.getElementById('preview-destination-armies').textContent = destinationTerritory.armies + armyCount;
    }

    /**
     * Reset fortification state for new turn
     */
    resetForNewTurn() {
        this.hasUsedFortification = false;
        this.clearSelection();
    }
}