class RiskUI {
    constructor() {
        this.gameState = null;
        this.turnManager = null;
        this.phaseManager = null;
        this.selectedTerritory = null;
        this.mapHandler = null;
        this.gameUI = null;
        this.toggleBtn = null;
        
        // Initialize new visual management systems
        this.colorManager = new ColorManager();
        this.territoryVisualManager = new TerritoryVisualManager(this.colorManager);
        this.enhancedTooltip = new EnhancedTooltip(this.colorManager, this.territoryVisualManager);
        
        try {
            this.reinforcementManager = new ReinforcementManager();
            this.fortificationManager = new FortificationManager();
            console.log('Managers created successfully');
        } catch (error) {
            console.error('Error creating managers:', error);
            this.reinforcementManager = null;
            this.fortificationManager = null;
        }
        
        // Initialize attack logic - will be set when game state is available
        this.attackLogic = null;
        
        // Create UI toggle button
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.className = 'toggle-ui-btn';
        this.toggleBtn.textContent = '☰';
        document.body.appendChild(this.toggleBtn);
        
        // Create game UI structure
        this.gameUI = document.createElement('div');
        this.gameUI.className = 'game-ui';
        
        // Initialize UI elements from existing game.html structure
        this.initializeUIElements();
        
    }

    initializeUIElements() {
        // Connect to existing game.html UI elements instead of creating new ones
        this.endTurnButton = document.querySelector('.end-turn-btn');
        this.playerInfo = document.querySelector('#current-player-name');
        this.territoryInfo = document.querySelector('.territory-info');
        
        // Connect to continent list in game.html
        this.continentList = document.querySelector('.continent-list');
        
        // Clean up any existing territory indicator elements from previous sessions
        this.cleanupTerritoryIndicators();
        
        // Validate critical UI elements
        if (!this.continentList) {
            console.warn('Continent list not found in game.html');
        }
        
        // Remove the toggle button and game UI since we're using game.html structure
        if (this.toggleBtn) {
            this.toggleBtn.remove();
            this.toggleBtn = null;
        }
        if (this.gameUI) {
            this.gameUI.remove();
            this.gameUI = null;
        }
        
        // Initialize other UI elements from game.html
        this.phaseIndicators = document.querySelectorAll('.phase-btn');
        
        console.log('RiskUI initialized with existing game.html structure');
    }

    cleanupTerritoryIndicators() {
        // Remove any existing territory indicator elements from previous sessions
        const existingIndicators = document.querySelectorAll('[id$="-indicators"]');
        existingIndicators.forEach(indicator => {
            indicator.remove();
        });
        
        // Also remove any loose territory-name or army-indicator elements
        const existingNames = document.querySelectorAll('.territory-name');
        const existingArmyIndicators = document.querySelectorAll('.army-indicator');
        existingNames.forEach(el => el.remove());
        existingArmyIndicators.forEach(el => el.remove());
        
        // Remove any SVG text elements showing army counts
        const existingArmyTexts = document.querySelectorAll('[id$="-armies"]');
        existingArmyTexts.forEach(el => el.remove());
        
        // Also remove any elements with class 'army-count'
        const existingArmyCounts = document.querySelectorAll('.army-count');
        existingArmyCounts.forEach(el => el.remove());
        
        // Remove any background circles that were used for army count display
        const existingBgCircles = document.querySelectorAll('[id$="-armies-bg"]');
        existingBgCircles.forEach(el => el.remove());
        
        console.log('Cleaned up existing territory indicators and army count displays');
    }

    initGame(players, colors = []) {
        this.gameState = new GameState(players, colors);
        this.turnManager = new TurnManager(this.gameState);
        
        // Update color manager with game state colors
        Object.entries(this.gameState.playerColors).forEach(([player, color]) => {
            this.colorManager.setPlayerColor(player, color);
        });
        
        // Initialize continent panel now that gameState is ready
        this.initContinentPanel();
        
        // Initialize ReinforcementManager
        if (this.reinforcementManager) {
            this.reinforcementManager.initializeGame(this.gameState, this.territoryVisualManager);
        } else {
            console.error('ReinforcementManager is null, attempting to recreate...');
            try {
                this.reinforcementManager = new ReinforcementManager();
                this.reinforcementManager.initializeGame(this.gameState, this.territoryVisualManager);
            } catch (error) {
                console.error('Failed to create ReinforcementManager:', error);
                throw new Error('ReinforcementManager initialization failed');
            }
        }
        
        // Initialize FortificationManager
        if (this.fortificationManager) {
            this.fortificationManager.initializeGame(this.gameState, this.territoryVisualManager);
        } else {
            console.error('FortificationManager is null, attempting to recreate...');
            try {
                this.fortificationManager = new FortificationManager();
                this.fortificationManager.initializeGame(this.gameState, this.territoryVisualManager);
            } catch (error) {
                console.error('Failed to create FortificationManager:', error);
                throw new Error('FortificationManager initialization failed');
            }
        }

        // Initialize PhaseManager
        this.phaseManager = new PhaseManager(this.gameState, this);
        this.phaseManager.syncWithGameState();
        console.log('PhaseManager initialized');

        // Initialize AttackLogic
        try {
            this.attackLogic = new AttackLogic(this.gameState);
            console.log('AttackLogic initialized');
        } catch (error) {
            console.error('Failed to create AttackLogic:', error);
            this.attackLogic = null;
        }

        // Connect managers to TurnManager
        this.turnManager.setReinforcementManager(this.reinforcementManager);
        this.turnManager.setFortificationManager(this.fortificationManager);
        
        this.setupEventHandlers();
        
        // Initial visual update
        this.updateAllTerritoryVisuals();
        
        this.updateUI({
            type: 'initial-setup',
            players,
            currentPlayer: this.gameState.getCurrentPlayer(),
            playerColors: this.gameState.playerColors
        });
    }

    setupEventHandlers() {
        // Initialize territory click handlers with enhanced tooltip system
        Object.keys(territoryPaths).forEach(territory => {
            const path = document.getElementById(territory);
            if (path) {
                path.addEventListener('click', () => this.handleTerritoryClick(territory));
                path.addEventListener('mouseover', (event) => this.handleTerritoryHover(territory, event));
                path.addEventListener('mouseout', () => this.handleTerritoryHoverEnd());
            }
        });

        // Button handlers
        const endTurnBtn = document.getElementById('end-turn');
        if (endTurnBtn) {
            endTurnBtn.addEventListener('click', () => this.handleEndTurn());
        }

        const clearSelectionBtn = document.getElementById('clear-selection');
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => this.clearSelection());
        }

        const skipFortificationBtn = document.getElementById('skip-fortification');
        if (skipFortificationBtn) {
            skipFortificationBtn.addEventListener('click', () => this.handleSkipFortification());
        }

        // UI toggle handlers
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => {
                this.gameUI.classList.toggle('collapsed');
                this.toggleBtn.textContent = this.gameUI.classList.contains('collapsed') ? '☰' : '×';
            });
        }
    }

    handleTerritoryClick(territory) {
        if (!this.gameState || !this.turnManager || !this.phaseManager) return;

        const currentPhase = this.phaseManager.getCurrentPhase();
        const currentPlayer = this.gameState.getCurrentPlayer();
        const territoryData = this.gameState.territories[territory];
        
        if (!territoryData) return;

        // Check if interaction is allowed in current phase
        let actionType = this.determineActionType(territory, currentPhase);
        if (!this.phaseManager.canInteractWithTerritory(territory, actionType)) {
            this.showPhaseRestrictionMessage(currentPhase, actionType);
            return;
        }

        // Handle different phases
        if (currentPhase === 'deploy') {
            if (territoryData.owner === currentPlayer) {
                // Use TurnManager for deployment to get proper result handling
                const result = this.turnManager.handleTerritoryClick(territory);
                if (result) {
                    this.updateUI(result);
                }
                // Update phase progress after deployment
                setTimeout(() => this.phaseManager.updatePhaseProgress(), 100);
            }
        } else if (currentPhase === 'reinforce') {
            if (territoryData.owner === currentPlayer) {
                // Use TurnManager for reinforcement to get proper result handling
                const result = this.turnManager.handleTerritoryClick(territory);
                if (result) {
                    this.updateUI(result);
                }
                // Update phase progress after reinforcement
                setTimeout(() => this.phaseManager.updatePhaseProgress(), 100);
            }
        } else if (currentPhase === 'attack') {
            this.handleAttackPhaseClick(territory);
        } else if (currentPhase === 'fortify') {
            const result = this.fortificationManager.handleTerritoryClick(territory);
            if (result) {
                this.updateUI(result);
                // Update phase progress after fortification
                setTimeout(() => this.phaseManager.updatePhaseProgress(), 100);
            }
        } else {
            // Handle other phases through turn manager
            const result = this.turnManager.handleTerritoryClick(territory);
            if (result) {
                this.updateUI(result);
            }
        }
    }

    determineActionType(territory, currentPhase) {
        const territoryData = this.gameState.territories[territory];
        const currentPlayer = this.gameState.getCurrentPlayer();

        switch (currentPhase) {
            case 'deploy':
                return 'deploy';
            case 'reinforce':
                return 'reinforce';
            case 'attack':
                if (territoryData.owner === currentPlayer) {
                    return 'select_source';
                } else {
                    return 'attack';
                }
            case 'fortify':
                return 'fortify';
            default:
                return 'general';
        }
    }

    handleAttackPhaseClick(territory) {
        // Check if we have the attack system functions available
        if (typeof selectAttackingTerritory === 'function' && typeof selectDefendingTerritory === 'function') {
            const territoryData = this.gameState.territories[territory];
            const currentPlayer = this.gameState.getCurrentPlayer();
            
            // If no attacking territory selected yet, try to select this as attacking territory
            if (!window.attackState || !window.attackState.attackingTerritory) {
                if (territoryData.owner === currentPlayer && territoryData.armies > 1) {
                    selectAttackingTerritory(territory);
                    return;
                }
            }
            // If attacking territory is selected, try to select this as defending territory
            else if (!window.attackState.defendingTerritory) {
                if (territoryData.owner !== currentPlayer) {
                    selectDefendingTerritory(territory);
                    return;
                }
            }
        }
        
        // Fallback to original attack logic
        const result = this.turnManager.handleTerritoryClick(territory);
        if (result) {
            this.updateUI(result);
        }
    }

    showPhaseRestrictionMessage(currentPhase, actionType) {
        const messages = {
            'deploy': {
                'deploy': 'You can only deploy armies to your own territories during the Deploy phase.'
            },
            'reinforce': {
                'reinforce': 'You can only deploy reinforcement armies to your own territories during the Reinforce phase.'
            },
            'attack': {
                'select_source': 'You can only attack from your own territories with more than 1 army.',
                'attack': 'You can only attack adjacent enemy territories.'
            },
            'fortify': {
                'fortify': 'You can only move armies between your own connected territories during the Fortify phase.'
            }
        };

        const message = messages[currentPhase]?.[actionType] || 
                       `This action is not allowed during the ${currentPhase} phase.`;

        this.showNotification(message, 'warning');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `phase-notification ${type}`;
        notification.textContent = message;
        
        const colors = {
            'info': '#2196F3',
            'warning': '#ff9800',
            'error': '#f44336',
            'success': '#4CAF50'
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10001;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    onPhaseChange(oldPhase, newPhase) {
        console.log(`Phase changed from ${oldPhase} to ${newPhase}`);
        
        // Update end turn button styling
        const endTurnBtn = document.getElementById('end-turn');
        if (endTurnBtn) {
            endTurnBtn.className = `end-turn-btn phase-${newPhase}`;
            
            // Update button text based on phase
            const phaseButtons = {
                'deploy': 'Continue to Attack',
                'attack': 'Continue to Fortify', 
                'fortify': 'End Turn'
            };
            
            if (phaseButtons[newPhase]) {
                endTurnBtn.textContent = phaseButtons[newPhase];
            }
        }

        // Update player stats
        this.updatePlayerStats();

        // Clear any existing territory selections
        this.clearSelection();

        // Update UI based on new phase
        this.updateAllTerritoryVisuals();
    }

    updatePlayerStats() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const territories = Object.values(this.gameState.territories)
            .filter(t => t.owner === currentPlayer).length;
        const reinforcements = this.gameState.reinforcements[currentPlayer] || 0;

        const territoryCountEl = document.getElementById('territory-count');
        const reinforcementCountEl = document.getElementById('reinforcement-count');

        if (territoryCountEl) {
            territoryCountEl.textContent = territories;
        }

        if (reinforcementCountEl) {
            reinforcementCountEl.textContent = reinforcements;
        }
    }

    handleTerritoryHover(territory, event) {
        if (!this.gameState || !this.turnManager) return;
        
        // Update tooltip context
        this.enhancedTooltip.setGameContext(
            this.gameState,
            this.gameState.getCurrentPlayer(),
            this.turnManager.currentPhase
        );
        
        // Show enhanced tooltip
        this.enhancedTooltip.showTooltip(territory, event);
        
        // Add hover highlighting
        this.territoryVisualManager.highlightTerritory(territory, 'hover');
    }

    handleTerritoryHoverEnd() {
        // Hide enhanced tooltip
        this.enhancedTooltip.hideTooltip();
        
        // Remove hover highlighting
        this.territoryVisualManager.clearAllHighlights();
    }

    // Add method to clear territory selection
    clearSelection() {
        this.selectedTerritory = null;
        this.territoryVisualManager.clearAllHighlights();
        
        const clearBtn = document.getElementById('clear-selection');
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
    }

    // Update all territory visuals
    updateAllTerritoryVisuals() {
        if (!this.gameState) return;
        
        Object.entries(this.gameState.territories).forEach(([territoryId, territoryData]) => {
            this.territoryVisualManager.updateTerritoryVisual(territoryId, territoryData);
        });
    }

    // Update specific territory visual
    updateTerritoryVisual(territoryId, highlightType = null) {
        if (!this.gameState || !this.gameState.territories[territoryId]) return;
        
        const territoryData = this.gameState.territories[territoryId];
        this.territoryVisualManager.updateTerritoryVisual(territoryId, territoryData, highlightType);
    }

    getContinent(territory) {
        const continentMap = {
            // North America
            'Alaska': 'North America',
            'Alberta': 'North America',
            'Central America': 'North America',
            'Eastern United States': 'North America',
            'Greenland': 'North America',
            'Northwest Territory': 'North America',
            'Ontario': 'North America',
            'Quebec': 'North America',
            'Western United States': 'North America',
            
            // South America
            'Argentina': 'South America',
            'Brazil': 'South America',
            'Peru': 'South America',
            'Venezuela': 'South America',
            
            // Europe
            'Great Britain': 'Europe',
            'Iceland': 'Europe',
            'Northern Europe': 'Europe',
            'Scandinavia': 'Europe',
            'Southern Europe': 'Europe',
            'Ukraine': 'Europe',
            'Western Europe': 'Europe',
            
            // Africa
            'Congo': 'Africa',
            'East Africa': 'Africa',
            'Egypt': 'Africa',
            'Madagascar': 'Africa',
            'North Africa': 'Africa',
            'South Africa': 'Africa',
            
            // Asia
            'Afghanistan': 'Asia',
            'China': 'Asia',
            'India': 'Asia',
            'Irkutsk': 'Asia',
            'Japan': 'Asia',
            'Kamchatka': 'Asia',
            'Middle East': 'Asia',
            'Mongolia': 'Asia',
            'Siam': 'Asia',
            'Siberia': 'Asia',
            'Ural': 'Asia',
            'Yakutsk': 'Asia',
            
            // Australia
            'Eastern Australia': 'Australia',
            'Indonesia': 'Australia',
            'New Guinea': 'Australia',
            'Western Australia': 'Australia'
        };
        return continentMap[territory] || 'Unknown';
    }

    getTerritoriesInContinent(continent) {
        const continentTerritories = {
            'North America': [
                'Alaska', 'Alberta', 'Central America', 'Eastern United States',
                'Greenland', 'Northwest Territory', 'Ontario', 'Quebec', 'Western United States'
            ],
            'South America': [
                'Argentina', 'Brazil', 'Peru', 'Venezuela'
            ],
            'Europe': [
                'Great Britain', 'Iceland', 'Northern Europe', 'Scandinavia',
                'Southern Europe', 'Ukraine', 'Western Europe'
            ],
            'Africa': [
                'Congo', 'East Africa', 'Egypt', 'Madagascar',
                'North Africa', 'South Africa'
            ],
            'Asia': [
                'Afghanistan', 'China', 'India', 'Irkutsk', 'Japan',
                'Kamchatka', 'Middle East', 'Mongolia', 'Siam', 'Siberia',
                'Ural', 'Yakutsk'
            ],
            'Australia': [
                'Eastern Australia', 'Indonesia', 'New Guinea', 'Western Australia'
            ]
        };

        return continentTerritories[continent] || [];
    }

    initContinentPanel() {
        if (!this.continentList || !this.gameState) return;
        
        // The continent items already exist in game.html, just update their status
        console.log('Continent panel initialized with existing game.html structure');
        
        // Update the continent panel with current game state
        this.updateContinentPanel();
    }

    getContinentControlStatus(continent) {
        const territories = this.getTerritoriesInContinent(continent);
        const owners = new Set();
        let mainOwner = null;
        let allOwned = true;
        
        territories.forEach(territory => {
            const territoryData = this.gameState.territories[territory];
            if (territoryData && territoryData.owner) {
                owners.add(territoryData.owner);
                if (!mainOwner) mainOwner = territoryData.owner;
            } else {
                allOwned = false;
            }
        });
        
        if (!allOwned) {
            return { class: 'uncontrolled', text: 'Uncontrolled' };
        } else if (owners.size === 1) {
            const ownerName = this.gameState.players[mainOwner];
            return { class: 'controlled', text: `Controlled by ${ownerName}` };
        } else {
            return { class: 'contested', text: 'Contested' };
        }
    }

    updateContinentPanel() {
        // Update continent control status
        if (!this.continentList) {
            console.warn('Continent list not available for update');
            return;
        }
        
        const continentItems = this.continentList.querySelectorAll('.continent-item');
        continentItems.forEach(item => {
            if (!item) return;
            
            const continent = item.dataset.continent;
            if (!continent) return;
            
            const status = this.getContinentControlStatus(continent);
            const controlDiv = item.querySelector('.continent-control');
            
            if (controlDiv) {
                controlDiv.className = `continent-control ${status.class}`;
                controlDiv.textContent = status.text;
            }
        });
    }

    handleEndTurn() {
        if (this.phaseManager) {
            // Try to advance phase through PhaseManager
            const success = this.phaseManager.advancePhase();
            if (success) {
                this.updateUI({
                    type: 'phase-change',
                    phase: this.phaseManager.getCurrentPhase(),
                    currentPlayer: this.gameState.getCurrentPlayer()
                });
            }
        } else {
            // Fallback to old system
            const result = this.turnManager.endPhase();
            this.updateUI(result);
        }
    }

    handleSkipFortification() {
        if (this.fortificationManager) {
            const result = this.fortificationManager.skipFortification();
            this.updateUI(result);
            // Advance to next turn
            this.turnManager.advancePhase();
        }
    }

    handleAttackButton() {
        this.gameState.phase = 'attack';
        this.selectedTerritory = null;
        this.updatePhaseDisplay('attack');
        this.updateButtonStates();
    }

    handleFortifyButton() {
        this.gameState.phase = 'fortify';
        this.selectedTerritory = null;
        this.updatePhaseDisplay('fortify');
        this.updateButtonStates();
    }

    updateUI(result) {
        if (!result) return;

        this.clearHighlights();
        
        // Update phase indicators and turn information
        this.updatePhaseIndicators(this.turnManager.getCurrentPhase());
        this.updateTurnInfo();
        this.updatePlayerInfo();
        this.updateContinentPanel(); // Update continent control status
        this.updateAttackPanelVisibility(); // Update attack panel visibility

        // Save game state after each update
        if (this.gameState) {
            this.gameState.saveToSession();
        }

        switch (result.type) {
            case 'initial-setup':
                this.updateTerritoryInfo('Initial Setup: Players take turns claiming territories');
                break;
                
            case 'territory-claim':
                this.updateTerritoryOwner(result.territory, result.owner);
                this.updateTerritoryInfo(`${result.owner} claimed ${result.territory}`);
                break;
                
            case 'initial-placement':
                this.updateTerritoryArmies(result.territory, result.armies);
                this.updateTerritoryInfo(
                    `${result.owner} placed troops in ${result.territory} (${result.remainingArmies} remaining)`
                );
                break;
                
            case 'deploy':
                this.updateTerritoryArmies(result.territory, result.armies);
                this.updatePlayerInfo();
                this.updateReinforcementCounter();
                
                // Show deployment message
                if (result.message) {
                    this.updateTerritoryInfo(result.message);
                }
                
                if (result.newPhase) {
                    this.updatePhaseDisplay(result.newPhase);
                }
                break;
                
            case 'attack-select':
                this.highlightTerritory(result.territory, 'selected');
                result.validTargets.forEach(target => {
                    this.highlightTerritory(target, 'valid-target');
                });
                this.updateTerritoryInfo(
                    `Select territory to attack from ${result.territory} (max ${result.maxDice} dice)`
                );
                break;
                
            case 'attack-resolve':
                this.updateTerritoryArmies(result.attackingTerritory, result.newAttackerArmies);
                this.updateTerritoryArmies(result.defendingTerritory, result.newDefenderArmies);
                if (result.territoryConquered) {
                    this.updateTerritoryOwner(result.defendingTerritory, result.newDefenderOwner);
                }
                this.showBattleResults(result);
                break;
                
            case 'attack-invalid':
                this.updateTerritoryInfo(result.reason);
                break;
                
            case 'fortify-select':
                this.highlightTerritory(result.territory, 'selected');
                result.validTargets.forEach(target => {
                    this.highlightTerritory(target, 'valid-target');
                });
                this.updateTerritoryInfo(`Select territory to fortify from ${result.territory}`);
                break;
                
            case 'fortify-resolve':
                this.updateTerritoryArmies(result.fromTerritory, result.newFromArmies);
                this.updateTerritoryArmies(result.toTerritory, result.newToArmies);
                this.updateTerritoryInfo(
                    `Moved ${result.armiesMoved} armies from ${result.fromTerritory} to ${result.toTerritory}`
                );
                break;
                
            case 'phase-change':
                this.updatePhaseDisplay(result.newPhase);
                this.updatePlayerInfo();
                break;
        }

        // Check for victory after every update
        const victor = this.gameState.checkVictory();
        if (victor) {
            this.showVictoryScreen(victor);
        }

        this.updateButtonStates();
    }

    updatePhaseDisplay(phase) {
        // Update phase indicators
        this.phaseIndicators.forEach(indicator => {
            indicator.classList.remove('active');
            if (indicator.dataset.phase === phase) {
                indicator.classList.add('active');
            }
        });

        // Update phase info
        const phaseNameElement = document.querySelector('.current-phase-name');
        const phaseInstructionsElement = document.querySelector('.phase-instructions');
        
        if (phaseNameElement && phaseInstructionsElement) {
            const phaseInfo = this.getPhaseInfo(phase);
            phaseNameElement.textContent = phaseInfo.name;
            phaseInstructionsElement.textContent = phaseInfo.instructions;
        }

        // Clear all territory highlights when phase changes
        this.territoryVisualManager.clearAllHighlights();
    }

    getPhaseInfo(phase) {
        const phaseInfoMap = {
            'deploy': {
                name: 'Deploy Phase',
                instructions: 'Click on your territories to deploy reinforcements'
            },
            'attack': {
                name: 'Attack Phase',
                instructions: 'Select your territory to attack from, then select enemy target'
            },
            'fortify': {
                name: 'Fortify Phase',
                instructions: 'Move armies between your connected territories'
            },
            'initial-setup': {
                name: 'Initial Setup',
                instructions: 'Claim territories by clicking on unclaimed areas'
            },
            'initial-placement': {
                name: 'Initial Placement',
                instructions: 'Place your remaining armies on your territories'
            }
        };
        
        return phaseInfoMap[phase] || { name: 'Unknown Phase', instructions: '' };
    }

    updatePlayerInfo() {
        if (this.playerInfo) {
            let currentPlayer = this.gameState.getCurrentPlayer();
            if (!currentPlayer) currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex] || 'Player 1';
            // Use remainingArmies for active deployment count, not reinforcements
            const reinforcements = this.gameState.remainingArmies ? this.gameState.remainingArmies[currentPlayer] || 0 : 0;
            const territories = this.countTerritoriesOwnedByPlayer(currentPlayer);
            const phaseName = this.gameState.phase ? this.gameState.phase.charAt(0).toUpperCase() + this.gameState.phase.slice(1) : 'Deploy';
            const playerColor = this.gameState.playerColors ? this.gameState.playerColors[currentPlayer] : this.getPlayerColor(currentPlayer);
            
            this.playerInfo.innerHTML = `
                <div class="current-turn-info">
                    <div class="player-color-indicator" style="background-color: ${playerColor}"></div>
                    <div class="turn-details">
                        <div class="current-player"><span style="color: ${playerColor}">${currentPlayer}</span></div>
                        <div class="current-phase">${phaseName} Phase</div>
                    </div>
                </div>
                <div class="player-stats">
                    <div>Territories: <strong>${territories}</strong></div>
                    <div>Reinforcements: <strong>${reinforcements}</strong></div>
                </div>
            `;
        }
        
        // Also update the territory count in the game UI
        if (this.territoryCountElement && this.gameState) {
            const currentPlayer = this.gameState.getCurrentPlayer();
            const territories = this.countTerritoriesOwnedByPlayer(currentPlayer);
            this.territoryCountElement.textContent = territories;
        }

        // Update the dedicated reinforcement counter
        this.updateReinforcementCounter();
    }

    updateReinforcementCounter() {
        const reinforcementCounter = document.getElementById('reinforcement-counter');
        if (reinforcementCounter && this.gameState) {
            const currentPlayer = this.gameState.getCurrentPlayer();
            const remaining = this.gameState.remainingArmies ? this.gameState.remainingArmies[currentPlayer] || 0 : 0;
            reinforcementCounter.textContent = remaining;
            
            // Update reinforcement info display
            const reinforcementInfo = document.getElementById('reinforcement-info');
            if (reinforcementInfo) {
                if (remaining > 0) {
                    reinforcementInfo.innerHTML = `
                        <div class="reinforcement-status">Ready to deploy</div>
                        <div class="reinforcement-instruction">Click on your territories to deploy armies</div>
                    `;
                } else {
                    reinforcementInfo.innerHTML = `
                        <div class="reinforcement-status">All reinforcements deployed!</div>
                        <div class="reinforcement-instruction">Waiting for other players to finish deploying</div>
                    `;
                }
            }
        }
    }

    countTerritoriesOwnedByPlayer(player) {
        return Object.values(this.gameState.territories)
            .filter(territory => territory.owner === player)
            .length;
    }

    updateButtonStates() {
        const currentPhase = this.gameState.phase;
        const currentPlayer = this.gameState.getCurrentPlayer();
        const reinforcements = this.gameState.reinforcements ? this.gameState.reinforcements[currentPlayer] || 0 : 0;

        if (this.endTurnButton) {
            this.endTurnButton.disabled = reinforcements > 0 || 
                                        currentPhase === 'initial-setup' || 
                                        currentPhase === 'initial-placement';
        }

        if (this.attackButton) {
            this.attackButton.disabled = currentPhase !== 'deploy' || reinforcements > 0;
        }

        if (this.fortifyButton) {
            this.fortifyButton.disabled = currentPhase !== 'attack';
        }
    }

    updateTerritoryInfo(message) {
        if (this.territoryInfo) {
            this.territoryInfo.innerHTML = message;
            this.territoryInfo.style.display = message ? 'block' : 'none';
        }
    }

    updateTerritoryOwner(territory, owner) {
        const path = document.getElementById(territory);
        if (path) {
            path.style.fill = this.getPlayerColor(owner);
        }
    }

    getNeighborArmyStrength(territory) {
        const neighbors = this.gameState.getNeighbors(territory);
        let maxEnemyArmies = 0;
        
        neighbors.forEach(neighbor => {
            const neighborData = this.gameState.territories[neighbor];
            if (neighborData && neighborData.owner !== this.gameState.territories[territory].owner) {
                maxEnemyArmies = Math.max(maxEnemyArmies, neighborData.armies);
            }
        });
        
        return maxEnemyArmies;
    }

    updateBorderIndicators(territory) {
        const territoryPath = document.getElementById(territory);
        if (!territoryPath) return;

        const territoryData = this.gameState.territories[territory];
        const neighbors = this.gameState.getNeighbors(territory);
        let hasConflict = false;
        let isSecure = true;

        neighbors.forEach(neighbor => {
            const neighborData = this.gameState.territories[neighbor];
            if (neighborData && neighborData.owner !== territoryData.owner) {
                hasConflict = true;
                if (neighborData.armies >= territoryData.armies) {
                    isSecure = false;
                }
            }
        });

        territoryPath.classList.remove('border-conflict', 'border-secure');
        if (hasConflict) {
            territoryPath.classList.add(isSecure ? 'border-secure' : 'border-conflict');
        }
    }

    updateStrategicIndicators(territory) {
        // Strategic indicators visual display removed to clean up map
        // Strategic calculations can still be done internally if needed for AI or game logic
        // but won't be displayed on the map
        return;
    }

    calculateStrategicValue(territory) {
        const territoryData = this.gameState.territories[territory];
        const continent = this.getContinent(territory);
        const neighbors = this.gameState.getNeighbors(territory);
        
        // Check for continent completion opportunity
        const continentTerritories = this.gameState.getTerritoriesInContinent(continent);
        const ownedInContinent = continentTerritories.filter(t => 
            this.gameState.territories[t].owner === territoryData.owner
        ).length;
        
        if (ownedInContinent >= continentTerritories.length - 2) {
            return {
                type: 'opportunity',
                description: 'Near continent control'
            };
        }
        
        // Check for defensive importance
        const enemyNeighbors = neighbors.filter(n => 
            this.gameState.territories[n].owner !== territoryData.owner
        ).length;
        
        if (enemyNeighbors >= 3) {
            return {
                type: 'risk',
                description: 'Multiple enemy borders'
            };
        }
        
        // Check for strategic position
        const isChokePoint = neighbors.length <= 2 && 
            neighbors.some(n => this.gameState.territories[n].owner !== territoryData.owner);
        
        if (isChokePoint) {
            return {
                type: 'value',
                description: 'Strategic choke point'
            };
        }
        
        return 0;
    }

    updateTerritoryArmies(territory, armies) {
        const container = document.querySelector('.map-container');
        const path = document.getElementById(territory);
        if (!path || !container) return;

        // Get territory data
        const territoryData = this.gameState.territories[territory];
        const owner = territoryData ? territoryData.owner : null;
        const isCurrentPlayer = owner === this.gameState.getCurrentPlayer();

        // Note: Visual territory name and army indicators removed to clean up map display
        // The game state still tracks territories and armies properly
        
        // Update border indicators (if needed for gameplay)
        this.updateBorderIndicators(territory);
        
        // Update strategic indicators (if needed for current player)
        if (isCurrentPlayer) {
            this.updateStrategicIndicators(territory);
        }
    }

    highlightTerritory(territory, className) {
        const path = document.getElementById(territory);
        if (path) {
            path.classList.add(className);
        }
    }

    clearHighlights() {
        document.querySelectorAll('.territory').forEach(territory => {
            territory.classList.remove('selected', 'valid-target');
        });
    }

    showBattleResults(result) {
        if (this.battleInfo && this.battleResults) {
            this.battleResults.innerHTML = `
                <p>Attacker rolled: ${result.attackerDice.join(', ')}</p>
                <p>Defender rolled: ${result.defenderDice.join(', ')}</p>
                <p>Attacker lost: ${result.attackerLosses} armies</p>
                <p>Defender lost: ${result.defenderLosses} armies</p>
                ${result.territoryConquered ? '<p>Territory conquered!</p>' : ''}
            `;
            this.battleInfo.style.display = 'block';
            setTimeout(() => {
                this.battleInfo.style.display = 'none';
            }, 3000);
        }
    }

    showVictoryScreen(victor) {
        const overlay = document.createElement('div');
        overlay.className = 'victory-overlay';
        overlay.innerHTML = `
            <div class="victory-modal">
                <h2>${victor} Wins!</h2>
                <p>Congratulations on conquering the world!</p>
                <button onclick="location.reload()">Play Again</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    getPlayerColor(player) {
        // Use colors from GameState (which were selected by user) or ColorManager
        if (this.gameState && this.gameState.playerColors && this.gameState.playerColors[player]) {
            return this.gameState.playerColors[player];
        }
        
        // Fallback to ColorManager
        if (this.colorManager) {
            return this.colorManager.getPlayerColor(player);
        }
        
        // Last resort fallback
        const colors = [
            '#ff4444', // Red
            '#44ff44', // Green
            '#4444ff', // Blue
            '#ffff44', // Yellow
            '#ff44ff', // Magenta
            '#44ffff'  // Cyan
        ];
        
        const playerIndex = this.gameState ? this.gameState.players.indexOf(player) : 0;
        return colors[playerIndex] || '#888888';
    }
    updatePhaseIndicators(currentPhase) {
        if (!this.phaseIndicators) {
            this.phaseIndicators = document.querySelectorAll('.phase-item');
        }
        this.phaseIndicators.forEach(indicator => {
            indicator.classList.remove('active');
            if (indicator.dataset.phase === currentPhase) {
                indicator.classList.add('active');
            }
        });

        // Update territory info with phase-specific instructions
        const phaseInstructions = {
            'deploy': 'Deploy Phase: Place your reinforcement armies',
            'attack': 'Attack Phase: Select a territory to attack from',
            'fortify': 'Fortify Phase: Move armies between your territories'
        };
        if (phaseInstructions[currentPhase]) {
            this.updateTerritoryInfo(phaseInstructions[currentPhase]);
        }

        // Update button visibility based on phase
        this.updateButtonVisibility(currentPhase);
    }

    updateButtonVisibility(currentPhase) {
        const skipFortificationBtn = document.getElementById('skip-fortification');
        const clearSelectionBtn = document.getElementById('clear-selection');
        
        if (skipFortificationBtn) {
            if (currentPhase === 'fortify') {
                skipFortificationBtn.style.display = 'inline-block';
            } else {
                skipFortificationBtn.style.display = 'none';
            }
        }
        
        if (clearSelectionBtn) {
            if (currentPhase === 'fortify' || currentPhase === 'attack') {
                clearSelectionBtn.style.display = 'inline-block';
            } else {
                clearSelectionBtn.style.display = 'none';
            }
        }
    }

    updateTurnInfo() {
        if (!this.turnCounter) {
            this.turnCounter = document.getElementById('turn-number');
        }
        if (!this.reinforcementCount) {
            this.reinforcementCount = document.getElementById('reinforcement-count');
        }
        if (this.turnCounter && this.turnManager) {
            this.turnCounter.textContent = this.turnManager.getTurnNumber();
        }
        if (this.reinforcementCount && this.gameState) {
            const reinforcements = this.gameState.reinforcements[this.gameState.getCurrentPlayer()] || 0;
            this.reinforcementCount.textContent = reinforcements;
        }
    }

    showReinforcementModal(territory, maxReinforcements, callback) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <h3>Deploy Reinforcements to ${territory}</h3>
            <p>Available reinforcements: ${maxReinforcements}</p>
            <input type="range" min="1" max="${maxReinforcements}" value="1" id="reinforcement-slider">
            <span id="reinforcement-value">1</span>
            <div class="modal-buttons">
                <button id="deploy-btn">Deploy</button>
                <button id="cancel-btn">Cancel</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Setup event listeners
        const slider = modal.querySelector('#reinforcement-slider');
        const valueDisplay = modal.querySelector('#reinforcement-value');
        const deployBtn = modal.querySelector('#deploy-btn');
        const cancelBtn = modal.querySelector('#cancel-btn');

        slider.addEventListener('input', () => {
            valueDisplay.textContent = slider.value;
        });

        deployBtn.addEventListener('click', () => {
            const amount = parseInt(slider.value);
            document.body.removeChild(overlay);
            if (callback) callback(amount);
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    }

    // Update attack panel visibility based on current phase
    updateAttackPanelVisibility() {
        if (typeof window.updateAttackPanelVisibility === 'function') {
            window.updateAttackPanelVisibility();
        }
    }
}
