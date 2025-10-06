/**
 * RiskUI Attack Interface
 * 
 * Extends the RiskUI class with methods for handling attack UI interactions
 * To be added to the existing RiskUI.js file
 */

/**
 * Clear attack selections in UI
 */
RiskUI.prototype.clearAttackSelections = function() {
    // Remove highlighting from all territories
    document.querySelectorAll('.territory').forEach(path => {
        path.classList.remove('attacker-selected', 'defender-selected', 'valid-target');
    });
    
    // Hide attack UI panels if they exist
    const attackPanel = document.getElementById('attack-panel');
    if (attackPanel) {
        attackPanel.style.display = 'none';
    }
    
    // Hide combat UI if it exists
    this.hideCombatUI();
};

/**
 * Highlight attacking territory
 * @param {string} territoryId - ID of attacking territory
 */
RiskUI.prototype.highlightAttacker = function(territoryId) {
    // Clear previous selections
    document.querySelectorAll('.territory').forEach(path => {
        path.classList.remove('attacker-selected');
    });
    
    // Highlight selected attacker
    const path = document.getElementById(territoryId);
    if (path) {
        path.classList.add('attacker-selected');
    }
    
    // Show attacker info
    const territory = this.gameState.territories[territoryId];
    if (territory) {
        // Update territory info panel
        const infoPanel = document.querySelector('.territory-info');
        if (infoPanel) {
            infoPanel.innerHTML = `
                <h3>${this.formatTerritoryName(territoryId)}</h3>
                <p>Attacking with ${territory.armies} armies</p>
                <p>Click on an adjacent enemy territory to attack</p>
            `;
        }
    }
};

/**
 * Format territory ID into display name
 * @param {string} territoryId - Territory ID like "north-africa"
 * @returns {string} - Formatted name like "North Africa"
 */
RiskUI.prototype.formatTerritoryName = function(territoryId) {
    if (!territoryId) return '';
    
    return territoryId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Highlight valid attack targets from selected territory
 * @param {string} attackerId - ID of attacking territory
 */
RiskUI.prototype.highlightValidTargets = function(attackerId) {
    // Clear previous targets
    document.querySelectorAll('.territory').forEach(path => {
        path.classList.remove('valid-target');
    });
    
    // Get attacker territory
    const attacker = this.gameState.territories[attackerId];
    if (!attacker || !attacker.neighbors) return;
    
    // Highlight each valid neighbor
    attacker.neighbors.forEach(neighborId => {
        const neighbor = this.gameState.territories[neighborId];
        if (neighbor && neighbor.owner !== attacker.owner) {
            const path = document.getElementById(neighborId);
            if (path) {
                path.classList.add('valid-target');
            }
        }
    });
};

/**
 * Highlight defending territory
 * @param {string} territoryId - ID of defending territory
 */
RiskUI.prototype.highlightDefender = function(territoryId) {
    // Clear previous selections
    document.querySelectorAll('.territory').forEach(path => {
        path.classList.remove('defender-selected');
    });
    
    // Highlight selected defender
    const path = document.getElementById(territoryId);
    if (path) {
        path.classList.add('defender-selected');
    }
    
    // Show defender info
    const territory = this.gameState.territories[territoryId];
    if (territory) {
        // Update territory info panel
        const infoPanel = document.querySelector('.territory-info');
        if (infoPanel) {
            const existingContent = infoPanel.innerHTML;
            infoPanel.innerHTML = `
                ${existingContent}
                <div class="defender-info">
                    <h4>${this.formatTerritoryName(territoryId)}</h4>
                    <p>Defended by ${territory.owner} with ${territory.armies} armies</p>
                </div>
            `;
        }
    }
};

/**
 * Show attack options UI
 * @param {string} attackerId - Attacking territory ID
 * @param {string} defenderId - Defending territory ID
 */
RiskUI.prototype.showAttackOptions = function(attackerId, defenderId) {
    // Get territories
    const attacker = this.gameState.territories[attackerId];
    const defender = this.gameState.territories[defenderId];
    if (!attacker || !defender) return;
    
    // Find or create attack panel
    let attackPanel = document.getElementById('attack-panel');
    if (!attackPanel) {
        attackPanel = document.createElement('div');
        attackPanel.id = 'attack-panel';
        attackPanel.className = 'attack-panel';
        document.body.appendChild(attackPanel);
    }
    
    // Calculate max dice
    const maxAttackerDice = Math.min(3, attacker.armies - 1);
    const maxDefenderDice = Math.min(2, defender.armies);
    
    // Create panel content
    attackPanel.innerHTML = `
        <h3>Attack!</h3>
        <div class="battle-territories">
            <div class="battle-territory attacker">
                <h4>${this.formatTerritoryName(attackerId)}</h4>
                <p>${attacker.armies} armies</p>
            </div>
            <div class="battle-direction">→</div>
            <div class="battle-territory defender">
                <h4>${this.formatTerritoryName(defenderId)}</h4>
                <p>${defender.armies} armies</p>
            </div>
        </div>
        <div class="dice-selection">
            <div class="attacker-dice">
                <h5>Attacker Dice</h5>
                <div class="dice-options">
                    ${this.createDiceOptions(maxAttackerDice, 'attacker')}
                </div>
            </div>
            <div class="defender-dice">
                <h5>Defender Dice</h5>
                <div class="dice-options">
                    ${this.createDiceOptions(maxDefenderDice, 'defender')}
                </div>
            </div>
        </div>
        <div class="attack-buttons">
            <button id="start-attack-btn" class="attack-btn">Attack</button>
            <button id="cancel-attack-btn" class="cancel-btn">Cancel</button>
        </div>
    `;
    
    // Show the panel
    attackPanel.style.display = 'block';
    
    // Set up event listeners
    document.getElementById('start-attack-btn').addEventListener('click', () => {
        const attackerDice = document.querySelector('input[name="attacker-dice"]:checked').value;
        const defenderDice = document.querySelector('input[name="defender-dice"]:checked').value;
        
        // Initialize attack in the AttackManager
        if (this.attackManager) {
            const attackResult = this.attackManager.initiateAttack();
            if (attackResult.success) {
                // Execute first battle
                this.attackManager.executeBattle(parseInt(attackerDice), parseInt(defenderDice));
            }
        }
    });
    
    document.getElementById('cancel-attack-btn').addEventListener('click', () => {
        if (this.attackManager) {
            this.attackManager.clearSelections();
        }
    });
    
    // Select highest dice count by default
    const attackerRadios = document.querySelectorAll('input[name="attacker-dice"]');
    const defenderRadios = document.querySelectorAll('input[name="defender-dice"]');
    
    if (attackerRadios.length > 0) {
        attackerRadios[0].checked = true;
    }
    
    if (defenderRadios.length > 0) {
        defenderRadios[0].checked = true;
    }
};

/**
 * Create dice selection radio buttons
 * @param {number} maxDice - Maximum number of dice
 * @param {string} side - 'attacker' or 'defender'
 * @returns {string} - HTML for dice options
 */
RiskUI.prototype.createDiceOptions = function(maxDice, side) {
    let options = '';
    
    for (let i = maxDice; i > 0; i--) {
        options += `
            <label class="dice-option">
                <input type="radio" name="${side}-dice" value="${i}">
                <span class="dice-count">${i}</span>
            </label>
        `;
    }
    
    return options;
};

/**
 * Show the combat UI with battle results
 * @param {object} combat - Combat state
 */
RiskUI.prototype.showCombatUI = function(combat) {
    // Hide attack options panel
    const attackPanel = document.getElementById('attack-panel');
    if (attackPanel) {
        attackPanel.style.display = 'none';
    }
    
    // Find or create combat UI
    let combatUI = document.getElementById('combat-ui');
    if (!combatUI) {
        combatUI = document.createElement('div');
        combatUI.id = 'combat-ui';
        combatUI.className = 'combat-ui';
        document.body.appendChild(combatUI);
    }
    
    // Get territories
    const attacker = this.gameState.territories[combat.attackingTerritory];
    const defender = this.gameState.territories[combat.defendingTerritory];
    
    // Create combat UI content
    combatUI.innerHTML = `
        <h3>Combat</h3>
        <div class="battle-territories">
            <div class="battle-territory attacker">
                <h4>${this.formatTerritoryName(combat.attackingTerritory)}</h4>
                <p>${attacker.armies} armies</p>
            </div>
            <div class="battle-direction">⚔️</div>
            <div class="battle-territory defender">
                <h4>${this.formatTerritoryName(combat.defendingTerritory)}</h4>
                <p>${defender.armies} armies</p>
            </div>
        </div>
        <div id="battle-history" class="battle-history"></div>
        <div class="combat-options">
            ${combat.canContinue ? `
                <div class="dice-selection">
                    <div class="attacker-dice">
                        <h5>Attacker Dice</h5>
                        <div class="dice-options">
                            ${this.createDiceOptions(combat.maxAttackerDice, 'combat-attacker')}
                        </div>
                    </div>
                    <div class="defender-dice">
                        <h5>Defender Dice</h5>
                        <div class="dice-options">
                            ${this.createDiceOptions(combat.maxDefenderDice, 'combat-defender')}
                        </div>
                    </div>
                </div>
                <button id="continue-attack-btn" class="attack-btn">Roll Dice</button>
            ` : ''}
            ${combat.conquered ? `
                <div class="conquest-options">
                    <h5>Territory Conquered!</h5>
                    <p>Move armies to conquered territory:</p>
                    <input type="range" id="armies-to-move" min="1" max="${attacker.armies - 1}" value="${attacker.armies - 1}">
                    <span id="armies-to-move-value">${attacker.armies - 1}</span>
                    <button id="complete-conquest-btn" class="attack-btn">Complete Conquest</button>
                </div>
            ` : ''}
            <button id="end-combat-btn" class="cancel-btn">End Combat</button>
        </div>
    `;
    
    // Show the combat UI
    combatUI.style.display = 'block';
    
    // Update battle history
    this.updateBattleHistory(combat.battleHistory);
    
    // Set up event listeners
    if (combat.canContinue) {
        document.getElementById('continue-attack-btn').addEventListener('click', () => {
            const attackerDice = document.querySelector('input[name="combat-attacker-dice"]:checked').value;
            const defenderDice = document.querySelector('input[name="combat-defender-dice"]:checked').value;
            
            if (this.attackManager) {
                this.attackManager.executeBattle(parseInt(attackerDice), parseInt(defenderDice));
            }
        });
        
        // Select highest dice count by default
        const attackerRadios = document.querySelectorAll('input[name="combat-attacker-dice"]');
        const defenderRadios = document.querySelectorAll('input[name="combat-defender-dice"]');
        
        if (attackerRadios.length > 0) {
            attackerRadios[0].checked = true;
        }
        
        if (defenderRadios.length > 0) {
            defenderRadios[0].checked = true;
        }
    }
    
    if (combat.conquered) {
        const armiesInput = document.getElementById('armies-to-move');
        const armiesValue = document.getElementById('armies-to-move-value');
        
        armiesInput.addEventListener('input', () => {
            armiesValue.textContent = armiesInput.value;
        });
        
        document.getElementById('complete-conquest-btn').addEventListener('click', () => {
            const armiesToMove = parseInt(armiesInput.value);
            
            if (this.attackManager) {
                this.attackManager.completeConquest(armiesToMove);
            }
        });
    }
    
    document.getElementById('end-combat-btn').addEventListener('click', () => {
        if (this.attackManager) {
            this.attackManager.endAttack();
        }
    });
};

/**
 * Update the combat UI with new battle results
 * @param {object} result - Battle result
 */
RiskUI.prototype.updateCombatUI = function(result) {
    if (!result || !result.success) return;
    
    // Update battle history
    if (result.result) {
        const combat = this.attackManager.combatSystem.getCurrentCombat();
        if (combat && combat.battleHistory) {
            this.updateBattleHistory(combat.battleHistory);
        }
    }
    
    // If combat UI exists, update it
    const combatUI = document.getElementById('combat-ui');
    if (!combatUI) return;
    
    // Get current combat state
    const combat = this.attackManager.combatSystem.getCurrentCombat();
    if (!combat) return;
    
    // Get territories
    const attacker = this.gameState.territories[combat.attackingTerritory];
    const defender = this.gameState.territories[combat.defendingTerritory];
    
    // Update territory army counts
    const attackerDiv = combatUI.querySelector('.battle-territory.attacker p');
    const defenderDiv = combatUI.querySelector('.battle-territory.defender p');
    
    if (attackerDiv) {
        attackerDiv.textContent = `${attacker.armies} armies`;
    }
    
    if (defenderDiv) {
        defenderDiv.textContent = `${defender.armies} armies`;
    }
    
    // Update combat options based on current state
    const combatOptions = combatUI.querySelector('.combat-options');
    if (combatOptions) {
        // Clear existing options
        combatOptions.innerHTML = '';
        
        // Add appropriate options
        if (combat.canContinue) {
            // Continue battle options
            combatOptions.innerHTML += `
                <div class="dice-selection">
                    <div class="attacker-dice">
                        <h5>Attacker Dice</h5>
                        <div class="dice-options">
                            ${this.createDiceOptions(combat.maxAttackerDice, 'combat-attacker')}
                        </div>
                    </div>
                    <div class="defender-dice">
                        <h5>Defender Dice</h5>
                        <div class="dice-options">
                            ${this.createDiceOptions(combat.maxDefenderDice, 'combat-defender')}
                        </div>
                    </div>
                </div>
                <button id="continue-attack-btn" class="attack-btn">Roll Dice</button>
            `;
        }
        
        if (combat.conquered) {
            // Conquest options
            combatOptions.innerHTML += `
                <div class="conquest-options">
                    <h5>Territory Conquered!</h5>
                    <p>Move armies to conquered territory:</p>
                    <input type="range" id="armies-to-move" min="1" max="${attacker.armies - 1}" value="${attacker.armies - 1}">
                    <span id="armies-to-move-value">${attacker.armies - 1}</span>
                    <button id="complete-conquest-btn" class="attack-btn">Complete Conquest</button>
                </div>
            `;
        }
        
        // Always add end combat button
        combatOptions.innerHTML += `
            <button id="end-combat-btn" class="cancel-btn">End Combat</button>
        `;
        
        // Set up event listeners again
        this.setupCombatEventListeners();
    }
};

/**
 * Set up event listeners for combat UI
 */
RiskUI.prototype.setupCombatEventListeners = function() {
    const continueBtn = document.getElementById('continue-attack-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            const attackerDice = document.querySelector('input[name="combat-attacker-dice"]:checked').value;
            const defenderDice = document.querySelector('input[name="combat-defender-dice"]:checked').value;
            
            if (this.attackManager) {
                this.attackManager.executeBattle(parseInt(attackerDice), parseInt(defenderDice));
            }
        });
        
        // Select highest dice count by default
        const attackerRadios = document.querySelectorAll('input[name="combat-attacker-dice"]');
        const defenderRadios = document.querySelectorAll('input[name="combat-defender-dice"]');
        
        if (attackerRadios.length > 0) {
            attackerRadios[0].checked = true;
        }
        
        if (defenderRadios.length > 0) {
            defenderRadios[0].checked = true;
        }
    }
    
    const conquestBtn = document.getElementById('complete-conquest-btn');
    if (conquestBtn) {
        const armiesInput = document.getElementById('armies-to-move');
        const armiesValue = document.getElementById('armies-to-move-value');
        
        if (armiesInput && armiesValue) {
            armiesInput.addEventListener('input', () => {
                armiesValue.textContent = armiesInput.value;
            });
        }
        
        conquestBtn.addEventListener('click', () => {
            const armiesToMove = parseInt(document.getElementById('armies-to-move').value);
            
            if (this.attackManager) {
                this.attackManager.completeConquest(armiesToMove);
            }
        });
    }
    
    const endBtn = document.getElementById('end-combat-btn');
    if (endBtn) {
        endBtn.addEventListener('click', () => {
            if (this.attackManager) {
                this.attackManager.endAttack();
            }
        });
    }
};

/**
 * Update battle history display
 * @param {object[]} history - Array of battle results
 */
RiskUI.prototype.updateBattleHistory = function(history) {
    const historyElement = document.getElementById('battle-history');
    if (!historyElement || !history) return;
    
    // Create HTML for battle history
    let html = '<h4>Battle Log</h4>';
    
    history.forEach((battle, index) => {
        html += `
            <div class="battle-round">
                <h5>Round ${battle.round}</h5>
                <div class="dice-results">
                    <div class="attacker-result">
                        <p>Attacker: ${battle.attackerRolls.join(', ')}</p>
                        <p>Lost ${battle.attackerLosses} armies</p>
                    </div>
                    <div class="defender-result">
                        <p>Defender: ${battle.defenderRolls.join(', ')}</p>
                        <p>Lost ${battle.defenderLosses} armies</p>
                    </div>
                </div>
                <p class="battle-status">
                    Status: ${battle.conquered ? 'Territory Conquered!' : 'Battle Continues'}
                </p>
            </div>
        `;
    });
    
    // Update the history element
    historyElement.innerHTML = html;
    
    // Scroll to bottom
    historyElement.scrollTop = historyElement.scrollHeight;
};

/**
 * Hide the combat UI
 */
RiskUI.prototype.hideCombatUI = function() {
    const combatUI = document.getElementById('combat-ui');
    if (combatUI) {
        combatUI.style.display = 'none';
    }
};

/**
 * Show conquest result
 * @param {object} result - Conquest result
 */
RiskUI.prototype.showConquestResult = function(result) {
    if (!result || !result.success) return;
    
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'conquest-notification';
    notification.innerHTML = `
        <h3>Territory Conquered!</h3>
        <p>${this.formatTerritoryName(result.conqueredTerritory)} is now yours!</p>
        <p>Moved ${result.armiesMoved} armies</p>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after a delay
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 1000);
    }, 2000);
    
    // Hide combat UI
    this.hideCombatUI();
};

/**
 * Update territory ownership visuals
 * @param {string} territoryId - Territory ID
 */
RiskUI.prototype.updateTerritoryOwnership = function(territoryId) {
    const territory = this.gameState.territories[territoryId];
    if (!territory) return;
    
    // Update map visuals
    this.updateTerritoryVisuals();
};

/**
 * Show card earned notification
 */
RiskUI.prototype.showCardEarned = function() {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'card-notification';
    notification.innerHTML = `
        <h3>Card Earned!</h3>
        <p>You've earned a territory card for conquering a territory this turn.</p>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after a delay
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 1000);
    }, 3000);
};

/**
 * Show a message to the player
 * @param {string} message - Message to show
 */
RiskUI.prototype.showMessage = function(message) {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'message-notification';
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after a delay
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 1000);
    }, 3000);
};