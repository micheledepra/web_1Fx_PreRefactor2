/**
 * Enhanced Attack UI - JavaScript Controller
 * Handles the attack UI interactions, animations, and game state updates
 */

// Initialize attack controller when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeAttackUI();
});

/**
 * Initialize the attack UI components
 */
function initializeAttackUI() {
    // Create a global attackController object
    window.attackController = {
        // State variables
        selectedAttacker: null,
        selectedDefender: null,
        attackerDice: 1,
        defenderDice: 1,
        battleInProgress: false,
        conqueringTerritory: false,
        battleHistory: [],
        armiesToMove: 1,
        attackPaths: [],
        
        // References to UI elements
        attackModal: document.getElementById('enhanced-attack-modal'),
        attackerOptions: document.getElementById('attacker-dice-options'),
        defenderOptions: document.getElementById('defender-dice-options'),
        diceResults: document.getElementById('dice-results'),
        conquestNotification: document.getElementById('conquest-notification'),
        armyMovement: document.getElementById('army-movement'),
        armySlider: document.getElementById('armies-to-move-slider'),
        
        // Main action buttons
        rollButton: document.getElementById('btn-roll'),
        retreatButton: document.getElementById('btn-retreat'),
        continueButton: document.getElementById('btn-continue'),
        completeButton: document.getElementById('btn-complete'),
        
        /**
         * Initialize event listeners
         */
        init: function() {
            // Close button
            document.getElementById('attack-modal-close').addEventListener('click', () => {
                this.closeModal();
            });
            
            // Attach dice selection events
            if (this.attackerOptions) {
                const attackerDice = this.attackerOptions.querySelectorAll('.dice-option');
                attackerDice.forEach(die => {
                    die.addEventListener('click', () => {
                        if (die.classList.contains('disabled')) return;
                        
                        // Remove selected from all dice
                        attackerDice.forEach(d => d.classList.remove('selected'));
                        // Select this die
                        die.classList.add('selected');
                        this.attackerDice = parseInt(die.getAttribute('data-dice'));
                    });
                });
            }
            
            if (this.defenderOptions) {
                const defenderDice = this.defenderOptions.querySelectorAll('.dice-option');
                defenderDice.forEach(die => {
                    die.addEventListener('click', () => {
                        if (die.classList.contains('disabled')) return;
                        
                        // Remove selected from all dice
                        defenderDice.forEach(d => d.classList.remove('selected'));
                        // Select this die
                        die.classList.add('selected');
                        this.defenderDice = parseInt(die.getAttribute('data-dice'));
                    });
                });
            }
            
            // Army movement slider
            if (this.armySlider) {
                this.armySlider.addEventListener('input', () => {
                    this.updateArmyMovement();
                });
            }
            
            // Action buttons
            if (this.rollButton) {
                this.rollButton.addEventListener('click', () => {
                    this.executeBattle();
                });
            }
            
            if (this.retreatButton) {
                this.retreatButton.addEventListener('click', () => {
                    this.endBattle();
                });
            }
            
            if (this.continueButton) {
                this.continueButton.addEventListener('click', () => {
                    this.continueBattle();
                });
            }
            
            if (this.completeButton) {
                this.completeButton.addEventListener('click', () => {
                    this.completeConquest();
                });
            }
            
            console.log('Enhanced Attack UI initialized');
        },
        
        /**
         * Open the attack modal with given territories
         * @param {string} attackerId - ID of attacking territory
         * @param {string} defenderId - ID of defending territory
         */
        openModal: function(attackerId, defenderId) {
            // Get territory data from game state
            const gameState = window.riskGame?.gameState || window.gameState;
            if (!gameState) {
                console.error('Game state not available');
                return;
            }
            
            const attacker = gameState.territories[attackerId];
            const defender = gameState.territories[defenderId];
            
            if (!attacker || !defender) {
                console.error('Invalid territories');
                return;
            }
            
            this.selectedAttacker = attackerId;
            this.selectedDefender = defenderId;
            this.battleInProgress = false;
            this.conqueringTerritory = false;
            this.battleHistory = [];
            
            // Update UI with territory information
            this.updateTerritoryInfo(attacker, defender);
            this.updateDiceOptions(attacker.armies, defender.armies);
            this.resetBattleUI();
            
            // Show the modal
            if (this.attackModal) {
                this.attackModal.classList.add('active');
            }
            
            // Draw the attack path on the map
            this.drawAttackPath(attackerId, defenderId);
            
            // Clear any existing log entries
            const logContainer = document.getElementById('battle-log-entries');
            if (logContainer) {
                logContainer.innerHTML = '<div class="battle-log-entry"><div class="battle-log-round">Battle started</div></div>';
            }
        },
        
        /**
         * Update territory information in the UI
         */
        updateTerritoryInfo: function(attacker, defender) {
            // Update attacker info
            document.getElementById('attacking-territory-name').textContent = this.formatTerritoryName(this.selectedAttacker);
            document.getElementById('attacking-territory-owner').textContent = attacker.owner;
            document.getElementById('attacking-territory-armies').textContent = attacker.armies;
            
            // Update defender info
            document.getElementById('defending-territory-name').textContent = this.formatTerritoryName(this.selectedDefender);
            document.getElementById('defending-territory-owner').textContent = defender.owner;
            document.getElementById('defending-territory-armies').textContent = defender.armies;
            
            // Update army movement elements if they exist
            if (document.getElementById('source-territory-name')) {
                document.getElementById('source-territory-name').textContent = this.formatTerritoryName(this.selectedAttacker);
            }
            
            if (document.getElementById('target-territory-name')) {
                document.getElementById('target-territory-name').textContent = this.formatTerritoryName(this.selectedDefender);
            }
        },
        
        /**
         * Update dice options based on army counts
         */
        updateDiceOptions: function(attackerArmies, defenderArmies) {
            // Attacker can use 1 to min(3, armies-1) dice
            const maxAttackerDice = Math.min(3, attackerArmies - 1);
            
            // Enable/disable attacker dice options
            const attackerOptions = document.querySelectorAll('#attacker-dice-options .dice-option');
            attackerOptions.forEach(option => {
                const diceCount = parseInt(option.getAttribute('data-dice'));
                if (diceCount > maxAttackerDice) {
                    option.classList.add('disabled');
                } else {
                    option.classList.remove('disabled');
                }
                
                // Select highest dice count by default
                if (diceCount === maxAttackerDice) {
                    option.classList.add('selected');
                    this.attackerDice = diceCount;
                } else {
                    option.classList.remove('selected');
                }
            });
            
            // Defender can use 1 to min(2, armies) dice
            const maxDefenderDice = Math.min(2, defenderArmies);
            
            // Enable/disable defender dice options
            const defenderOptions = document.querySelectorAll('#defender-dice-options .dice-option');
            defenderOptions.forEach(option => {
                const diceCount = parseInt(option.getAttribute('data-dice'));
                if (diceCount > maxDefenderDice) {
                    option.classList.add('disabled');
                } else {
                    option.classList.remove('disabled');
                }
                
                // Select highest dice count by default
                if (diceCount === maxDefenderDice) {
                    option.classList.add('selected');
                    this.defenderDice = diceCount;
                } else {
                    option.classList.remove('selected');
                }
            });
        },
        
        /**
         * Reset battle UI to initial state
         */
        resetBattleUI: function() {
            // Hide battle results
            if (this.diceResults) {
                this.diceResults.classList.remove('active');
            }
            
            // Hide conquest notification
            if (this.conquestNotification) {
                this.conquestNotification.classList.remove('active');
            }
            
            // Hide army movement controls
            if (this.armyMovement) {
                this.armyMovement.style.display = 'none';
            }
            
            // Show roll button, hide continue button
            this.rollButton.style.display = 'block';
            this.continueButton.style.display = 'none';
            this.completeButton.style.display = 'none';
        },
        
        /**
         * Execute a battle round
         */
        executeBattle: function() {
            // Get territory data
            const gameState = window.riskGame?.gameState || window.gameState;
            if (!gameState) {
                console.error('Game state not available');
                return;
            }
            
            const attacker = gameState.territories[this.selectedAttacker];
            const defender = gameState.territories[this.selectedDefender];
            
            if (!attacker || !defender) {
                console.error('Invalid territories');
                return;
            }
            
            // Use the CombatSystem if available, otherwise use fallback
            const combatSystem = window.riskGame?.combatSystem;
            let battleResult;
            
            if (combatSystem) {
                // Use CombatSystem for battle resolution
                if (!this.battleInProgress) {
                    combatSystem.initiateCombat(this.selectedAttacker, this.selectedDefender);
                    this.battleInProgress = true;
                }
                
                battleResult = combatSystem.executeBattle(this.attackerDice, this.defenderDice);
                
                // If battle was successful, use the result
                if (!battleResult.success) {
                    console.error('Battle execution failed:', battleResult.error);
                    return;
                }
                
                battleResult = battleResult.result;
            } else {
                // Fallback battle resolution
                battleResult = this.resolveBattleFallback(attacker, defender);
            }
            
            // Show dice results
            this.showBattleResults(battleResult);
            
            // Add to battle history
            this.battleHistory.push(battleResult);
            
            // Add to battle log
            this.addBattleLog(battleResult);
            
            // Update territory information
            this.updateTerritoryInfo(attacker, defender);
            
            // Check for conquest
            if (defender.armies <= 0) {
                this.handleConquest();
            } else {
                // Update dice options for next round
                this.updateDiceOptions(attacker.armies, defender.armies);
                
                // Show continue button, hide roll button
                this.rollButton.style.display = 'none';
                this.continueButton.style.display = 'block';
            }
        },
        
        /**
         * Show battle results in the UI
         */
        showBattleResults: function(result) {
            // Make dice results visible
            if (this.diceResults) {
                this.diceResults.classList.add('active');
            }
            
            // Update attacker dice display
            const attackerDisplay = document.getElementById('attacker-dice-display');
            if (attackerDisplay) {
                attackerDisplay.innerHTML = '';
                
                // Create dice elements
                result.attackerRolls.forEach((roll, index) => {
                    const die = document.createElement('div');
                    die.className = 'die attacker rolling';
                    die.textContent = roll;
                    
                    // Add winner/loser class after animation completes
                    setTimeout(() => {
                        die.classList.remove('rolling');
                        if (result.comparisons && result.comparisons[index] && result.comparisons[index].attackerWins) {
                            die.classList.add('winner');
                        } else if (result.comparisons && result.comparisons[index]) {
                            die.classList.add('loser');
                        }
                    }, 600);
                    
                    attackerDisplay.appendChild(die);
                });
            }
            
            // Update defender dice display
            const defenderDisplay = document.getElementById('defender-dice-display');
            if (defenderDisplay) {
                defenderDisplay.innerHTML = '';
                
                // Create dice elements
                result.defenderRolls.forEach((roll, index) => {
                    const die = document.createElement('div');
                    die.className = 'die defender rolling';
                    die.textContent = roll;
                    
                    // Add winner/loser class after animation completes
                    setTimeout(() => {
                        die.classList.remove('rolling');
                        if (result.comparisons && result.comparisons[index] && !result.comparisons[index].attackerWins) {
                            die.classList.add('winner');
                        } else if (result.comparisons && result.comparisons[index]) {
                            die.classList.add('loser');
                        }
                    }, 600);
                    
                    defenderDisplay.appendChild(die);
                });
            }
            
            // Update battle status
            const battleStatus = document.getElementById('battle-status');
            if (battleStatus) {
                if (result.conquered) {
                    battleStatus.textContent = 'Victory! Territory conquered!';
                } else if (result.attackerLosses > result.defenderLosses) {
                    battleStatus.textContent = 'Defender has the advantage!';
                } else if (result.attackerLosses < result.defenderLosses) {
                    battleStatus.textContent = 'Attacker has the advantage!';
                } else {
                    battleStatus.textContent = 'Even battle...';
                }
            }
            
            // Update casualties
            document.getElementById('attacker-casualties').textContent = result.attackerLosses;
            document.getElementById('defender-casualties').textContent = result.defenderLosses;
        },
        
        /**
         * Handle territory conquest
         */
        handleConquest: function() {
            this.conqueringTerritory = true;
            
            // Show conquest notification
            if (this.conquestNotification) {
                this.conquestNotification.classList.add('active');
            }
            
            // Get territory data
            const gameState = window.riskGame?.gameState || window.gameState;
            const attacker = gameState.territories[this.selectedAttacker];
            
            // Update army movement controls
            if (this.armyMovement) {
                this.armyMovement.style.display = 'block';
                
                // Configure slider
                const maxMovable = attacker.armies - 1; // Must leave at least 1 army
                this.armySlider.min = 1;
                this.armySlider.max = maxMovable;
                this.armySlider.value = Math.max(1, Math.min(3, maxMovable)); // Default to 3 or max possible
                
                // Update max armies label
                document.getElementById('max-armies-label').textContent = `${maxMovable} (max)`;
                
                // Initial update of army movement display
                this.updateArmyMovement();
            }
            
            // Show complete button, hide roll and continue buttons
            this.rollButton.style.display = 'none';
            this.continueButton.style.display = 'none';
            this.completeButton.style.display = 'block';
        },
        
        /**
         * Update army movement UI
         */
        updateArmyMovement: function() {
            const armiesToMove = parseInt(this.armySlider.value);
            this.armiesToMove = armiesToMove;
            
            // Get territory data
            const gameState = window.riskGame?.gameState || window.gameState;
            const attacker = gameState.territories[this.selectedAttacker];
            
            // Update display
            document.getElementById('armies-to-move-display').textContent = armiesToMove;
            document.getElementById('source-remaining').textContent = attacker.armies - armiesToMove;
            document.getElementById('target-new').textContent = armiesToMove;
        },
        
        /**
         * Continue to the next battle round
         */
        continueBattle: function() {
            // Reset battle results UI
            if (this.diceResults) {
                this.diceResults.classList.remove('active');
            }
            
            // Show roll button, hide continue button
            this.rollButton.style.display = 'block';
            this.continueButton.style.display = 'none';
        },
        
        /**
         * Complete the conquest of a territory
         */
        completeConquest: function() {
            // Use CombatSystem if available, otherwise use fallback
            const combatSystem = window.riskGame?.combatSystem;
            
            if (combatSystem) {
                const result = combatSystem.completeConquest(this.armiesToMove);
                if (!result.success) {
                    console.error('Conquest completion failed:', result.error);
                    return;
                }
            } else {
                // Fallback conquest completion
                this.completeConquestFallback();
            }
            
            // Close the modal
            this.closeModal();
            
            // Show success notification
            this.showSuccessNotification(`You conquered ${this.formatTerritoryName(this.selectedDefender)}!`);
        },
        
        /**
         * End the current battle without conquering
         */
        endBattle: function() {
            // If using CombatSystem, end combat
            const combatSystem = window.riskGame?.combatSystem;
            if (combatSystem && this.battleInProgress) {
                combatSystem.endCombat();
            }
            
            // Close the modal
            this.closeModal();
            
            // Clear attack paths
            this.clearAttackPaths();
        },
        
        /**
         * Close the attack modal
         */
        closeModal: function() {
            // Hide modal
            if (this.attackModal) {
                this.attackModal.classList.remove('active');
            }
            
            // Clear selections
            this.clearTerritoryHighlights();
            
            // Clear attack paths
            this.clearAttackPaths();
            
            // Reset state
            this.selectedAttacker = null;
            this.selectedDefender = null;
            this.battleInProgress = false;
            this.conqueringTerritory = false;
        },
        
        /**
         * Draw an attack path between territories
         */
        drawAttackPath: function(attackerId, defenderId) {
            // Get SVG map
            const map = document.getElementById('risk-map');
            if (!map) return;
            
            // Get territory elements
            const attacker = document.getElementById(attackerId);
            const defender = document.getElementById(defenderId);
            if (!attacker || !defender) return;
            
            // Get territory centers
            const attackerRect = attacker.getBBox();
            const defenderRect = defender.getBBox();
            
            const attackerCenter = {
                x: attackerRect.x + attackerRect.width / 2,
                y: attackerRect.y + attackerRect.height / 2
            };
            
            const defenderCenter = {
                x: defenderRect.x + defenderRect.width / 2,
                y: defenderRect.y + defenderRect.height / 2
            };
            
            // Create path element
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'attack-path');
            path.setAttribute('d', `M${attackerCenter.x},${attackerCenter.y} L${defenderCenter.x},${defenderCenter.y}`);
            
            // Add to map
            map.appendChild(path);
            
            // Store path reference for later removal
            this.attackPaths.push(path);
        },
        
        /**
         * Clear all attack paths
         */
        clearAttackPaths: function() {
            this.attackPaths.forEach(path => {
                if (path.parentNode) {
                    path.parentNode.removeChild(path);
                }
            });
            
            this.attackPaths = [];
        },
        
        /**
         * Clear territory highlights
         */
        clearTerritoryHighlights: function() {
            // Remove highlighting from all territories
            const territories = document.querySelectorAll('.territory');
            territories.forEach(territory => {
                territory.classList.remove('attack-source', 'attack-target', 'attack-selected', 'defend-selected');
            });
        },
        
        /**
         * Add entry to battle log
         */
        addBattleLog: function(battleResult) {
            const logContainer = document.getElementById('battle-log-entries');
            if (!logContainer) return;
            
            const round = this.battleHistory.length;
            
            const logEntry = document.createElement('div');
            logEntry.className = 'battle-log-entry';
            
            // Create log entry content
            let html = `<div class="battle-log-round">Round ${round}</div>`;
            
            html += `<div class="battle-log-dice">Attacker rolled: ${battleResult.attackerRolls.join(', ')}</div>`;
            html += `<div class="battle-log-dice">Defender rolled: ${battleResult.defenderRolls.join(', ')}</div>`;
            
            html += `<div class="battle-log-result">`;
            html += `Attacker lost ${battleResult.attackerLosses} armies, `;
            html += `Defender lost ${battleResult.defenderLosses} armies`;
            html += `</div>`;
            
            if (battleResult.conquered) {
                html += `<div class="battle-log-conquest">Territory conquered!</div>`;
            }
            
            logEntry.innerHTML = html;
            
            // Add to log container
            logContainer.appendChild(logEntry);
            
            // Scroll to bottom
            logContainer.scrollTop = logContainer.scrollHeight;
        },
        
        /**
         * Show a success notification
         */
        showSuccessNotification: function(message) {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = 'success-notification';
            notification.textContent = message;
            
            // Style the notification
            Object.assign(notification.style, {
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                zIndex: '1000',
                fontWeight: 'bold',
                animation: 'fade-in 0.3s forwards'
            });
            
            // Add to document
            document.body.appendChild(notification);
            
            // Remove after a delay
            setTimeout(() => {
                notification.style.animation = 'fade-out 0.3s forwards';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        },
        
        /**
         * Format territory ID into a readable name
         */
        formatTerritoryName: function(territoryId) {
            if (!territoryId) return '';
            
            return territoryId
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        },
        
        /**
         * Fallback battle resolution method
         * Used when CombatSystem is not available
         */
        resolveBattleFallback: function(attacker, defender) {
            // Roll dice
            const attackerRolls = [];
            for (let i = 0; i < this.attackerDice; i++) {
                attackerRolls.push(Math.floor(Math.random() * 6) + 1);
            }
            
            const defenderRolls = [];
            for (let i = 0; i < this.defenderDice; i++) {
                defenderRolls.push(Math.floor(Math.random() * 6) + 1);
            }
            
            // Sort dice in descending order
            attackerRolls.sort((a, b) => b - a);
            defenderRolls.sort((a, b) => b - a);
            
            // Compare dice and determine casualties
            let attackerLosses = 0;
            let defenderLosses = 0;
            const comparisons = [];
            
            const pairs = Math.min(attackerRolls.length, defenderRolls.length);
            for (let i = 0; i < pairs; i++) {
                const attackerWins = attackerRolls[i] > defenderRolls[i];
                comparisons.push({
                    attackerDie: attackerRolls[i],
                    defenderDie: defenderRolls[i],
                    attackerWins: attackerWins
                });
                
                if (attackerWins) {
                    defenderLosses++;
                } else {
                    attackerLosses++;
                }
            }
            
            // Update army counts
            attacker.armies -= attackerLosses;
            defender.armies -= defenderLosses;
            
            // Check for conquest
            const conquered = defender.armies <= 0;
            if (conquered) {
                // Change ownership, but don't move armies yet
                defender.owner = attacker.owner;
            }
            
            // Return battle result
            return {
                round: this.battleHistory.length + 1,
                attackerDice: this.attackerDice,
                defenderDice: this.defenderDice,
                attackerRolls: attackerRolls,
                defenderRolls: defenderRolls,
                attackerLosses: attackerLosses,
                defenderLosses: defenderLosses,
                attackerArmiesRemaining: attacker.armies,
                defenderArmiesRemaining: defender.armies,
                conquered: conquered,
                comparisons: comparisons
            };
        },
        
        /**
         * Fallback conquest completion
         * Used when CombatSystem is not available
         */
        completeConquestFallback: function() {
            // Get territory data
            const gameState = window.riskGame?.gameState || window.gameState;
            const attacker = gameState.territories[this.selectedAttacker];
            const defender = gameState.territories[this.selectedDefender];
            
            // Move armies
            attacker.armies -= this.armiesToMove;
            defender.armies = this.armiesToMove;
            
            // Defender already has ownership changed in battle resolution
            console.log(`Conquest completed: ${this.selectedAttacker} -> ${this.selectedDefender} with ${this.armiesToMove} armies`);
        }
    };
    
    // Initialize attack controller
    window.attackController.init();
    
    // Add Material Icons if not already loaded
    if (!document.querySelector('link[href*="material-icons"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
        document.head.appendChild(link);
    }
    
    // Add CSS if not already loaded
    if (!document.querySelector('link[href*="enhanced-attack.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/enhanced-attack.css';
        document.head.appendChild(link);
    }
    
    // Load enhanced attack modal HTML
    loadEnhancedAttackModal();
}

/**
 * Load the enhanced attack modal HTML
 */
function loadEnhancedAttackModal() {
    fetch('enhanced-attack-modal.html')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const modal = doc.querySelector('#enhanced-attack-modal');
            const defs = doc.querySelector('svg');
            
            if (modal) {
                document.body.appendChild(modal);
            }
            
            if (defs) {
                document.body.appendChild(defs);
            }
            
            console.log('Enhanced attack modal loaded');
        })
        .catch(error => {
            console.error('Failed to load enhanced attack modal:', error);
            
            // Create a minimal version of the modal as fallback
            const modal = document.createElement('div');
            modal.id = 'enhanced-attack-modal';
            modal.className = 'enhanced-attack-modal';
            modal.innerHTML = `
                <div class="attack-modal-container">
                    <div class="attack-modal-header">
                        <h2>Battle Commander</h2>
                        <button id="attack-modal-close" class="attack-modal-close">&times;</button>
                    </div>
                    <div class="attack-modal-body">
                        <p>Failed to load enhanced attack modal.</p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        });
}

/**
 * Highlight valid attack sources on the map
 */
function highlightValidAttackSources() {
    // Get game state
    const gameState = window.riskGame?.gameState || window.gameState;
    if (!gameState) return;
    
    // Get current player
    const currentPlayer = gameState.getCurrentPlayer();
    
    // Clear existing highlights
    clearTerritoryHighlights();
    
    // Loop through territories
    Object.entries(gameState.territories).forEach(([territoryId, territory]) => {
        const element = document.getElementById(territoryId);
        if (!element) return;
        
        // Check if it's a valid attack source
        if (territory.owner === currentPlayer && territory.armies > 1) {
            element.classList.add('attack-source');
            
            // Add click event
            element.addEventListener('click', () => handleAttackSourceClick(territoryId));
        }
    });
}

/**
 * Highlight valid attack targets from a source territory
 */
function highlightValidAttackTargets(sourceId) {
    // Get game state
    const gameState = window.riskGame?.gameState || window.gameState;
    if (!gameState) return;
    
    // Get source territory
    const source = gameState.territories[sourceId];
    if (!source) return;
    
    // Get current player
    const currentPlayer = gameState.getCurrentPlayer();
    
    // Clear existing target highlights
    document.querySelectorAll('.territory').forEach(element => {
        element.classList.remove('attack-target');
    });
    
    // Highlight source as selected
    const sourceElement = document.getElementById(sourceId);
    if (sourceElement) {
        sourceElement.classList.add('attack-selected');
    }
    
    // Loop through neighbors
    if (source.neighbors) {
        source.neighbors.forEach(neighborId => {
            const neighbor = gameState.territories[neighborId];
            const element = document.getElementById(neighborId);
            
            // Check if it's a valid attack target
            if (neighbor && element && neighbor.owner !== currentPlayer) {
                element.classList.add('attack-target');
                
                // Add click event
                element.addEventListener('click', () => handleAttackTargetClick(sourceId, neighborId));
            }
        });
    }
}

/**
 * Clear all territory highlights
 */
function clearTerritoryHighlights() {
    document.querySelectorAll('.territory').forEach(element => {
        element.classList.remove('attack-source', 'attack-target', 'attack-selected', 'defend-selected');
    });
}

/**
 * Handle click on attack source territory
 */
function handleAttackSourceClick(territoryId) {
    // First check if we're in attack phase
    const gameState = window.riskGame?.gameState || window.gameState;
    if (!gameState || gameState.phase !== 'attack') return;
    
    highlightValidAttackTargets(territoryId);
}

/**
 * Handle click on attack target territory
 */
function handleAttackTargetClick(sourceId, targetId) {
    // First check if we're in attack phase
    const gameState = window.riskGame?.gameState || window.gameState;
    if (!gameState || gameState.phase !== 'attack') return;
    
    // Highlight defender
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
        targetElement.classList.add('defend-selected');
    }
    
    // Open attack modal
    if (window.attackController) {
        window.attackController.openModal(sourceId, targetId);
    }
}

// Export functions for global use
window.highlightValidAttackSources = highlightValidAttackSources;
window.highlightValidAttackTargets = highlightValidAttackTargets;
window.clearTerritoryHighlights = clearTerritoryHighlights;