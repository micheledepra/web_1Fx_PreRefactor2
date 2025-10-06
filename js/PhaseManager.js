class PhaseManager {
    constructor(gameState, ui, combatSystem = null) {
        this.gameState = gameState;
        this.ui = ui;
        this.combatSystem = combatSystem; // New combat system integration
        this.currentPhase = gameState.phase || 'initial-setup';
        this.phaseRequirements = {
            'initial-setup': () => this.isInitialSetupComplete(),
            'initial-placement': () => this.isInitialPlacementComplete(),
            'deploy': () => this.isDeployPhaseComplete(),
            'reinforce': () => this.isReinforcePhaseComplete(),
            'attack': () => true, // Attack phase can always be skipped
            'fortify': () => this.isFortifyPhaseComplete()
        };
        
        this.phaseSequence = ['reinforce', 'attack', 'fortify'];
        this.initialPhaseSequence = ['deploy', 'attack', 'fortify'];
        this.setupPhaseUI();
    }

    /**
     * Set combat system instance
     * @param {CombatSystem} combatSystem - Combat system instance
     */
    setCombatSystem(combatSystem) {
        this.combatSystem = combatSystem;
    }

    setupPhaseUI() {
        // Create phase indicator UI elements
        this.createPhaseIndicator();
        this.createPhaseButtons();
        this.updatePhaseDisplay();
    }

    createPhaseIndicator() {
        // Find or create phase indicator container
        let phaseContainer = document.getElementById('phase-indicator');
        if (!phaseContainer) {
            phaseContainer = document.createElement('div');
            phaseContainer.id = 'phase-indicator';
            phaseContainer.className = 'phase-indicator';
            
            // Insert after the reinforcement panel
            const reinforcementPanel = document.getElementById('reinforcement-panel');
            if (reinforcementPanel) {
                reinforcementPanel.parentNode.insertBefore(phaseContainer, reinforcementPanel.nextSibling);
            } else {
                // Fallback: add to sidebar
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    sidebar.insertBefore(phaseContainer, sidebar.firstChild);
                }
            }
        }

        phaseContainer.innerHTML = `
            <div class="phase-header">
                <h3>Current Phase</h3>
            </div>
            <div class="phase-name" id="phase-name">Deploy</div>
            <div class="phase-description" id="phase-description">
                Deploy your reinforcement armies to your territories
            </div>
            <div class="phase-progress" id="phase-progress">
                <div class="phase-progress-bar">
                    <div class="phase-progress-fill" id="phase-progress-fill"></div>
                </div>
                <div class="phase-progress-text" id="phase-progress-text">0 of 3 armies deployed</div>
            </div>
        `;
    }

    createPhaseButtons() {
        // Create phase control buttons
        let buttonContainer = document.getElementById('phase-buttons');
        if (!buttonContainer) {
            buttonContainer = document.createElement('div');
            buttonContainer.id = 'phase-buttons';
            buttonContainer.className = 'phase-buttons';
            
            // Add to controls section
            const controls = document.querySelector('.controls');
            if (controls) {
                controls.appendChild(buttonContainer);
            }
        }

        buttonContainer.innerHTML = `
            <button class="btn phase-btn" id="next-phase-btn" disabled>
                Next Phase
            </button>
            <button class="btn phase-btn secondary" id="skip-phase-btn" style="display: none;">
                Skip Phase
            </button>
        `;

        // Add event listeners
        document.getElementById('next-phase-btn').addEventListener('click', () => {
            this.advancePhase();
        });

        document.getElementById('skip-phase-btn').addEventListener('click', () => {
            this.skipPhase();
        });
    }

    getCurrentPhase() {
        return this.currentPhase;
    }

    setPhase(newPhase) {
        const oldPhase = this.currentPhase;
        this.currentPhase = newPhase;
        this.gameState.phase = newPhase;
        
        console.log(`Phase changed from ${oldPhase} to ${newPhase}`);
        
        this.updatePhaseDisplay();
        this.updatePhaseRestrictions();
        this.onPhaseChange(oldPhase, newPhase);
    }

    // Method to sync with game state phase (for initial setup)
    syncWithGameState() {
        if (this.gameState.phase !== this.currentPhase) {
            this.currentPhase = this.gameState.phase;
            this.updatePhaseDisplay();
            this.updatePhaseRestrictions();
        }
    }

    advancePhase() {
        if (!this.canAdvancePhase()) {
            this.showPhaseRequirementMessage();
            return false;
        }

        // Determine which phase sequence to use
        const useInitialSequence = !this.gameState.initialDeploymentComplete;
        const sequence = useInitialSequence ? this.initialPhaseSequence : this.phaseSequence;
        const currentIndex = sequence.indexOf(this.currentPhase);
        
        if (currentIndex === -1) {
            // Handle special transition phases
            if (this.currentPhase === 'initial-setup') {
                this.setPhase('initial-placement');
            } else if (this.currentPhase === 'initial-placement') {
                this.setPhase('deploy');
                this.calculateReinforcements();
            } else if (this.currentPhase === 'deploy' && this.gameState.isInitialDeploymentComplete()) {
                // Transition from initial deployment to regular game
                this.setPhase('reinforce');
                this.calculateReinforcements();
            }
        } else {
            // Handle normal game phases
            const nextIndex = (currentIndex + 1) % sequence.length;
            if (nextIndex === 0) {
                // End turn and start new turn
                this.endTurn();
            } else {
                this.setPhase(sequence[nextIndex]);
            }
        }
        
        return true;
    }

    skipPhase() {
        if (this.canSkipPhase()) {
            this.advancePhase();
        }
    }

    canAdvancePhase() {
        const requirement = this.phaseRequirements[this.currentPhase];
        return requirement ? requirement() : false;
    }

    canSkipPhase() {
        // Only certain phases can be skipped
        return this.currentPhase === 'attack' || this.currentPhase === 'fortify';
    }

    updatePhaseDisplay() {
        const phaseNameEl = document.getElementById('phase-name');
        const phaseDescriptionEl = document.getElementById('phase-description');
        const nextPhaseBtn = document.getElementById('next-phase-btn');
        const skipPhaseBtn = document.getElementById('skip-phase-btn');

        if (!phaseNameEl || !phaseDescriptionEl) return;

        const phaseInfo = this.getPhaseInfo(this.currentPhase);
        
        phaseNameEl.textContent = phaseInfo.name;
        phaseNameEl.className = `phase-name phase-${this.currentPhase}`;
        phaseDescriptionEl.textContent = phaseInfo.description;

        // Update progress
        this.updatePhaseProgress();

        // Update buttons
        if (nextPhaseBtn) {
            nextPhaseBtn.disabled = !this.canAdvancePhase();
            nextPhaseBtn.textContent = phaseInfo.buttonText;
        }

        if (skipPhaseBtn) {
            skipPhaseBtn.style.display = this.canSkipPhase() ? 'block' : 'none';
        }

        // Update main end turn button
        const endTurnBtn = document.getElementById('end-turn');
        if (endTurnBtn) {
            endTurnBtn.disabled = !this.canAdvancePhase();
            endTurnBtn.textContent = phaseInfo.buttonText;
            endTurnBtn.className = `end-turn-btn phase-${this.currentPhase}`;
        }
    }

    updatePhaseProgress() {
        const progressFill = document.getElementById('phase-progress-fill');
        const progressText = document.getElementById('phase-progress-text');
        
        if (!progressFill || !progressText) return;

        let progress = 0;
        let progressMessage = '';

        switch (this.currentPhase) {
            case 'deploy':
                const currentPlayer = this.gameState.getCurrentPlayer();
                const totalReinforcements = this.gameState.reinforcements[currentPlayer] || 0;
                const remainingArmies = this.gameState.remainingArmies[currentPlayer] || 0;
                const deployed = totalReinforcements - remainingArmies;
                progress = totalReinforcements > 0 ? (deployed / totalReinforcements) * 100 : 100;
                progressMessage = `${deployed} of ${totalReinforcements} armies deployed`;
                break;
                
            case 'attack':
                progressMessage = 'Attack adjacent enemy territories or skip';
                progress = 0; // Attack progress is not measurable
                break;
                
            case 'fortify':
                if (this.ui.fortificationManager && this.ui.fortificationManager.hasUsedFortification) {
                    progress = 100;
                    progressMessage = 'Fortification completed';
                } else {
                    progress = 0;
                    progressMessage = 'Move armies between your territories or skip';
                }
                break;
                
            default:
                progress = 0;
                progressMessage = 'Phase in progress...';
        }

        progressFill.style.width = `${progress}%`;
        progressText.textContent = progressMessage;
    }

    updatePhaseRestrictions() {
        // Update territory highlighting and interaction rules
        this.clearAllHighlights();
        
        switch (this.currentPhase) {
            case 'deploy':
                this.highlightOwnTerritories();
                break;
            case 'attack':
                this.highlightAttackSources();
                break;
            case 'fortify':
                this.highlightFortificationSources();
                break;
        }
    }

    getPhaseInfo(phase) {
        const phaseData = {
            'initial-setup': {
                name: 'Initial Setup',
                description: 'Players take turns claiming territories',
                buttonText: 'Continue'
            },
            'initial-placement': {
                name: 'Initial Placement',
                description: 'Place your remaining armies on your territories',
                buttonText: 'Continue'
            },
            'deploy': {
                name: 'Deploy',
                description: 'Deploy your initial armies to your territories',
                buttonText: 'Continue to Attack'
            },
            'reinforce': {
                name: 'Reinforce',
                description: 'Deploy your reinforcement armies to your territories',
                buttonText: 'Continue to Attack'
            },
            'attack': {
                name: 'Attack',
                description: 'Attack adjacent enemy territories to expand your empire',
                buttonText: 'Continue to Fortify'
            },
            'fortify': {
                name: 'Fortify',
                description: 'Move armies between your connected territories',
                buttonText: 'End Turn'
            }
        };

        return phaseData[phase] || {
            name: 'Unknown',
            description: 'Unknown phase',
            buttonText: 'Continue'
        };
    }

    // Phase requirement checkers
    isInitialSetupComplete() {
        return Object.values(this.gameState.territories).every(t => t.owner !== null);
    }

    isInitialPlacementComplete() {
        return this.gameState.players.every(player => 
            (this.gameState.remainingArmies[player] || 0) === 0
        );
    }

    isDeployPhaseComplete() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        return (this.gameState.remainingArmies[currentPlayer] || 0) === 0;
    }

    isReinforcePhaseComplete() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        return (this.gameState.remainingArmies[currentPlayer] || 0) === 0;
    }

    isFortifyPhaseComplete() {
        // Fortify is complete if used or if no valid moves available
        if (this.ui.fortificationManager) {
            return this.ui.fortificationManager.hasUsedFortification || 
                   !this.ui.fortificationManager.hasValidFortificationMoves();
        }
        return true;
    }

    // Territory validation methods
    canInteractWithTerritory(territoryId, action) {
        const territory = this.gameState.territories[territoryId];
        const currentPlayer = this.gameState.getCurrentPlayer();

        switch (this.currentPhase) {
            case 'deploy':
                return territory.owner === currentPlayer && action === 'deploy';
                
            case 'reinforce':
                return territory.owner === currentPlayer && action === 'reinforce';
                
            case 'attack':
                if (action === 'select_source') {
                    return territory.owner === currentPlayer && territory.armies > 1;
                } else if (action === 'attack') {
                    return territory.owner !== currentPlayer;
                }
                return false;
                
            case 'fortify':
                return territory.owner === currentPlayer && action === 'fortify';
                
            default:
                return true;
        }
    }

    // UI highlighting methods
    clearAllHighlights() {
        document.querySelectorAll('.territory').forEach(territory => {
            territory.classList.remove(
                'highlight-own', 'highlight-attackable', 'highlight-fortifiable',
                'highlight-valid-source', 'highlight-valid-target'
            );
        });
    }

    highlightOwnTerritories() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        Object.entries(this.gameState.territories).forEach(([territoryId, territory]) => {
            if (territory.owner === currentPlayer) {
                const element = document.getElementById(territoryId);
                if (element) {
                    element.classList.add('highlight-own');
                }
            }
        });
    }

    highlightAttackSources() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        Object.entries(this.gameState.territories).forEach(([territoryId, territory]) => {
            if (territory.owner === currentPlayer && territory.armies > 1) {
                // Check if this territory can attack any adjacent enemy territory
                const hasValidTargets = territory.neighbors.some(neighborId => {
                    const neighbor = this.gameState.territories[neighborId];
                    return neighbor && neighbor.owner !== currentPlayer;
                });
                
                if (hasValidTargets) {
                    const element = document.getElementById(territoryId);
                    if (element) {
                        element.classList.add('highlight-attackable');
                    }
                }
            }
        });
    }

    highlightFortificationSources() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        Object.entries(this.gameState.territories).forEach(([territoryId, territory]) => {
            if (territory.owner === currentPlayer && territory.armies > 1) {
                const element = document.getElementById(territoryId);
                if (element) {
                    element.classList.add('highlight-fortifiable');
                }
            }
        });
    }

    // Event handlers
    onPhaseChange(oldPhase, newPhase) {
        // Notify other systems about phase changes
        if (this.ui) {
            this.ui.onPhaseChange && this.ui.onPhaseChange(oldPhase, newPhase);
        }

        // Phase-specific initialization
        switch (newPhase) {
            case 'deploy':
                this.calculateReinforcements();
                break;
            case 'attack':
                // Initialize attack phase with combat system
                this.initializeAttackPhase();
                break;
            case 'fortify':
                if (this.ui.fortificationManager) {
                    this.ui.fortificationManager.startFortificationPhase();
                }
                break;
        }
        
        // Update attack panel visibility for all phase changes
        if (typeof window.updateAttackPanelVisibility === 'function') {
            window.updateAttackPanelVisibility();
        }
    }

    calculateReinforcements() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const reinforcements = this.gameState.calculateReinforcements(currentPlayer);
        this.gameState.reinforcements[currentPlayer] = reinforcements;
        this.gameState.remainingArmies[currentPlayer] = reinforcements;
        
        // Update UI
        this.updatePhaseProgress();
    }

    endTurn() {
        // Reset phase-specific states
        if (this.ui.fortificationManager) {
            this.ui.fortificationManager.resetForNewTurn();
        }
        
        // Move to next player
        this.gameState.nextPlayer();
        
        // Start new turn with appropriate phase
        if (this.gameState.initialDeploymentComplete) {
            this.setPhase('reinforce');
        } else {
            this.setPhase('deploy');
        }
        
        // Calculate reinforcements for new turn
        this.calculateReinforcements();
        
        // Update turn counter if we've completed a full round
        if (this.gameState.currentPlayerIndex === 0) {
            this.gameState.turnNumber = (this.gameState.turnNumber || 1) + 1;
        }
    }

    showPhaseRequirementMessage() {
        const messages = {
            'deploy': 'You must deploy all your initial armies before continuing.',
            'reinforce': 'You must deploy all your reinforcement armies before continuing.',
            'attack': 'You can skip the attack phase if you don\'t want to attack.',
            'fortify': 'You can skip fortification or move armies between your territories.'
        };

        const message = messages[this.currentPhase] || 'Complete the current phase requirements to continue.';
        
        // Show a temporary message (you can enhance this with a proper notification system)
        const notification = document.createElement('div');
        notification.className = 'phase-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff9800;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10001;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Initialize attack phase with combat system
     */
    initializeAttackPhase() {
        // Clear any previous combat state
        if (this.combatSystem) {
            this.combatSystem.endCombat();
        }

        // Update UI for attack phase
        if (typeof window.updateAttackPanelVisibility === 'function') {
            window.updateAttackPanelVisibility();
        }

        // Initialize combat UI if available
        if (window.combatUI) {
            window.combatUI.reset();
        }

        // Set up attack phase help text
        const helpText = 'Click a territory you control with 2+ armies to start attacking, then click an adjacent enemy territory.';
        if (this.ui && this.ui.showMessage) {
            this.ui.showMessage(helpText);
        }
    }

    /**
     * Handle attack phase end
     */
    endAttackPhase() {
        // Clean up combat state
        if (this.combatSystem) {
            this.combatSystem.endCombat();
        }

        // Clear combat UI
        if (window.combatUI) {
            window.combatUI.reset();
        }

        // Hide attack panels
        if (typeof window.updateAttackPanelVisibility === 'function') {
            window.updateAttackPanelVisibility();
        }
    }
}