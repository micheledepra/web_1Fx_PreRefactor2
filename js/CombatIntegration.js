/**
 * RISK COMBAT SYSTEM INTEGRATION
 * 
 * This file integrates the new CombatSystem with the existing game
 * Replaces all redundant attack logic with clean, unified system
 */

// Global combat system instances
let combatSystem = null;
let combatUI = null;

/**
 * Initialize Combat System
 * Called from game initialization
 */
function initializeCombatSystem() {
    try {
        // Initialize combat system with game state - look for game state in multiple possible locations
        const gameState = window.riskUI?.gameState || window.gameState || null;
        
        if (typeof CombatSystem !== 'undefined' && gameState) {
            combatSystem = new CombatSystem(gameState);
            
            // Verify that critical methods are available
            if (typeof combatSystem.validateAttacker !== 'function') {
                console.warn('⚠️ CombatSystem is missing validateAttacker method');
            }
            if (typeof combatSystem.validateAttack !== 'function') {
                console.warn('⚠️ CombatSystem is missing validateAttack method');
            }
            if (typeof combatSystem.getPossibleAttackTargets !== 'function') {
                console.warn('⚠️ CombatSystem is missing getPossibleAttackTargets method');
            }
            
            console.log('✅ Combat System initialized');
        } else {
            console.error('❌ Cannot initialize Combat System: Missing dependencies');
            return false;
        }

        // Initialize combat UI with a delay to ensure DOM elements are ready
        if (typeof CombatUI !== 'undefined' && window.GameUtils) {
            // We'll use a more robust approach for initialization
            const initializeCombatUI = () => {
                // Function to verify the DOM structure
                const verifyDOMStructure = () => {
                    const attackModal = document.getElementById('attack-modal');
                    if (!attackModal) {
                        console.warn('⚠️ Attack modal not found in DOM');
                        return false;
                    }
                    
                    // Ensure modal is visible during checks
                    const originalDisplay = attackModal.style.display;
                    attackModal.style.display = 'flex';
                    
                    // Check if basic structure exists
                    const modalContent = attackModal.querySelector('.modal-content');
                    const attackSelection = attackModal.querySelector('#attack-modal-selection');
                    const attackTerritory = attackModal.querySelector('.attack-territory');
                    const defendTerritory = attackModal.querySelector('.defend-territory');
                    
                    // Restore display state
                    attackModal.style.display = originalDisplay || 'none';
                    
                    // Return true only if all key elements exist
                    return !!(modalContent && attackSelection && attackTerritory && defendTerritory);
                };
                
                // Attempt to initialize with retry mechanism
                const attemptInitialization = (attempt = 0) => {
                    try {
                        console.log(`🔄 Attempting CombatUI initialization (attempt ${attempt + 1})`);
                        
                        // First, verify DOM structure is ready
                        if (!verifyDOMStructure() && attempt < 5) {
                            console.warn(`⏳ DOM structure not ready yet, will retry in ${(attempt + 1) * 200}ms...`);
                            setTimeout(() => attemptInitialization(attempt + 1), (attempt + 1) * 200);
                            return;
                        }
                        
                        // If we've reached max attempts but still not ready, force creation
                        const forceCreation = attempt >= 5;
                        if (forceCreation) {
                            console.warn('⚠️ Max attempts reached, forcing element creation');
                        }
                        
                        // Try using ensureAttackModalElements if available (from game.html pre-initialization)
                        if (window.ensureAttackModalElements && typeof window.ensureAttackModalElements === 'function') {
                            console.log('🔄 Using pre-initialization function from game.html');
                            window.ensureAttackModalElements();
                        }
                        
                        // Also use our local function for extra safety
                        ensureCombatUIElements();
                        
                        // Verify element creation was successful
                        const criticalElements = [
                            'attack-modal-attacking-name',
                            'attack-modal-attacking-armies',
                            'attack-modal-defending-name',
                            'attack-modal-defending-armies'
                        ];
                        
                        // Check if all elements now exist
                        const missingElements = criticalElements.filter(id => !document.getElementById(id));
                        if (missingElements.length > 0) {
                            if (attempt < 5) {
                                console.warn(`⚠️ Elements still missing after creation, retrying... Missing: ${missingElements.join(', ')}`);
                                setTimeout(() => attemptInitialization(attempt + 1), (attempt + 1) * 300);
                                return;
                            } else {
                                console.error(`❌ Failed to create elements after ${attempt + 1} attempts`);
                            }
                        }
                        
                        // Initialize CombatUI
                        combatUI = new CombatUI(combatSystem, window.GameUtils);
                        console.log('✅ Combat UI initialized');
                        
                        // Make combatUI globally available after successful creation
                        window.combatUI = combatUI;
                        
                        // Debug: Check what methods are available on combatUI
                        if (combatUI && typeof combatUI === 'object') {
                            console.log('DEBUG: CombatUI created successfully');
                            console.log('DEBUG: CombatUI methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(combatUI)).filter(name => typeof combatUI[name] === 'function'));
                            console.log('DEBUG: executeAttack method exists:', typeof combatUI.executeAttack === 'function');
                        } else {
                            console.error('DEBUG: CombatUI creation failed - combatUI is:', combatUI);
                        }
                    } catch (e) {
                        console.error('Error initializing CombatUI:', e);
                        if (attempt < 5) {
                            console.warn(`⏳ Retrying in ${(attempt + 1) * 300}ms...`);
                            setTimeout(() => attemptInitialization(attempt + 1), (attempt + 1) * 300);
                        }
                    }
                };
                
                // Start the initialization attempt
                attemptInitialization();
            };
            
            // Start the initialization process
            initializeCombatUI();
        } else {
            console.error('❌ Cannot initialize Combat UI: Missing dependencies');
            return false;
        }
        
        // Helper function to ensure required elements exist
        function ensureCombatUIElements() {
            console.log('🔎 Checking for critical attack modal elements');
            
            // Verify attack modal exists
            const attackModal = document.getElementById('attack-modal');
            if (!attackModal) {
                console.error('❌ Attack modal not found in DOM');
                return false;
            }
            
            // Save original display style of modal
            const originalDisplay = attackModal.style.display;
            
            // Temporarily make the modal visible
            attackModal.style.display = 'flex';
            
            // ULTRA-DIRECT ACCESS: Instead of using selectors, directly manipulate the DOM
            // Find modal content
            const modalContent = attackModal.querySelector('.modal-content');
            if (!modalContent) {
                console.error('❌ Attack modal content not found, creating it');
                const newContent = document.createElement('div');
                newContent.className = 'modal-content attack-modal-content';
                attackModal.appendChild(newContent);
            }
            
            // FORCE CREATE the critical elements to ensure they exist
            const criticalIds = [
                'attack-modal-attacking-name',
                'attack-modal-attacking-armies',
                'attack-modal-defending-name',
                'attack-modal-defending-armies'
            ];
            
            // First check if they exist
            let missing = criticalIds.filter(id => !document.getElementById(id));
            
            if (missing.length > 0) {
                console.warn(`🛠️ Force-creating ${missing.length} missing elements`);
                
                // Get or create attack selection container
                let attackSelection = document.getElementById('attack-modal-selection');
                if (!attackSelection) {
                    attackSelection = document.createElement('div');
                    attackSelection.id = 'attack-modal-selection';
                    attackSelection.className = 'attack-selection';
                    modalContent.appendChild(attackSelection);
                }
                
                // Force create attack territory container
                let attackTerritory = document.querySelector('.attack-territory');
                if (!attackTerritory) {
                    attackTerritory = document.createElement('div');
                    attackTerritory.className = 'attack-territory';
                    attackSelection.appendChild(attackTerritory);
                    
                    // Label
                    const label = document.createElement('div');
                    label.className = 'territory-label';
                    label.textContent = '🗡️ Attacking From';
                    attackTerritory.appendChild(label);
                }
                
                // Add separator if needed
                let separator = attackSelection.querySelector('.attack-vs');
                if (!separator) {
                    separator = document.createElement('div');
                    separator.className = 'attack-vs';
                    separator.textContent = 'VS';
                    attackSelection.appendChild(separator);
                }
                
                // Force create defend territory container
                let defendTerritory = document.querySelector('.defend-territory');
                if (!defendTerritory) {
                    defendTerritory = document.createElement('div');
                    defendTerritory.className = 'defend-territory';
                    attackSelection.appendChild(defendTerritory);
                    
                    // Label
                    const label = document.createElement('div');
                    label.className = 'territory-label';
                    label.textContent = '🛡️ Defending';
                    defendTerritory.appendChild(label);
                }
                
                // FORCE CREATE the critical elements
                if (!document.getElementById('attack-modal-attacking-name')) {
                    const el = document.createElement('div');
                    el.id = 'attack-modal-attacking-name';
                    el.className = 'territory-name';
                    el.textContent = '-';
                    attackTerritory.appendChild(el);
                    console.log('🔧 Force-created element: attack-modal-attacking-name');
                }
                
                if (!document.getElementById('attack-modal-attacking-armies')) {
                    const el = document.createElement('div');
                    el.id = 'attack-modal-attacking-armies';
                    el.className = 'territory-armies';
                    el.textContent = '0 armies';
                    attackTerritory.appendChild(el);
                    console.log('🔧 Force-created element: attack-modal-attacking-armies');
                }
                
                if (!document.getElementById('attack-modal-defending-name')) {
                    const el = document.createElement('div');
                    el.id = 'attack-modal-defending-name';
                    el.className = 'territory-name';
                    el.textContent = 'Select target';
                    defendTerritory.appendChild(el);
                    console.log('🔧 Force-created element: attack-modal-defending-name');
                }
                
                if (!document.getElementById('attack-modal-defending-armies')) {
                    const el = document.createElement('div');
                    el.id = 'attack-modal-defending-armies';
                    el.className = 'territory-armies';
                    el.textContent = '0 armies';
                    defendTerritory.appendChild(el);
                    console.log('🔧 Force-created element: attack-modal-defending-armies');
                }
            }
            
            // Final check to confirm all elements exist
            missing = criticalIds.filter(id => !document.getElementById(id));
            if (missing.length > 0) {
                console.error('❌ Still missing elements after force creation:', missing);
            } else {
                console.log('✅ All critical combat UI elements confirmed');
            }
            
            // Restore original display style
            attackModal.style.display = originalDisplay || 'none';
            
            // Create preview elements
            const previewElements = [
                { id: 'preview-source-armies', parent: '.result-item', className: 'preview-armies', text: '0 armies remaining' },
                { id: 'preview-destination-armies', parent: '.result-item', className: 'preview-armies', text: '1 army total' }
            ];
            
            previewElements.forEach(el => {
                if (!document.getElementById(el.id)) {
                    const parentElements = document.querySelectorAll(el.parent);
                    if (parentElements.length > 0) {
                        const parent = parentElements[0];
                        const newElement = document.createElement('div');
                        newElement.id = el.id;
                        newElement.className = el.className;
                        newElement.textContent = el.text;
                        parent.appendChild(newElement);
                        console.log(`📝 Created missing element: ${el.id}`);
                    }
                }
            });
            
            return true;
        }

        // Integrate with phase manager
        if (window.phaseManager) {
            window.phaseManager.setCombatSystem(combatSystem);
            console.log('✅ Combat System integrated with Phase Manager');
        }

        // Make combat system globally available immediately
        window.combatSystem = combatSystem;
        // Note: combatUI will be made available after its async initialization
        
        // Add a test method to verify access
        window.testCombatUI = function() {
            console.log('Testing CombatUI access:');
            console.log('  - window.combatUI exists:', !!window.combatUI);
            console.log('  - executeAttack exists:', !!(window.combatUI && window.combatUI.executeAttack));
            console.log('  - typeof executeAttack:', typeof window.combatUI?.executeAttack);
            return window.combatUI && typeof window.combatUI.executeAttack === 'function';
        };

        return true;
    } catch (error) {
        console.error('❌ Error initializing Combat System:', error);
        return false;
    }
}

/**
 * Handle territory click during attack phase
 * Replaces all the scattered attack logic
 */
function handleAttackPhaseClick(territoryId) {
    // Check if combatUI is initialized and game is in attack phase
    const gameState = window.gameState || window.riskUI?.gameState;
    if (!combatUI || !gameState || gameState.phase !== 'attack') {
        console.warn('Cannot handle attack: Combat UI not initialized or not in attack phase');
        return;
    }

    try {
        // Check if validateAttacker exists on combatSystem before delegating to UI
        if (combatUI.combatSystem && typeof combatUI.combatSystem.validateAttacker !== 'function') {
            console.warn('validateAttacker method not found on combatSystem - using fallback');
        }
        
        const result = combatUI.handleTerritoryClick(territoryId);
        
        if (result && result.success) {
            updateCombatUI(result);
            const message = getActionMessage(result);
            showCombatMessage(message, 'success');
        } else if (result) {
            showCombatMessage(result.error || 'Invalid selection', 'error');
        } else {
            showCombatMessage('No result from territory selection', 'error');
        }
    } catch (error) {
        console.error('Error handling attack click:', error);
        showCombatMessage('An error occurred during attack selection', 'error');
    }
}

/**
 * Get user-friendly message based on action
 * @param {Object} result - Action result
 * @returns {string} - User message
 */
function getActionMessage(result) {
    switch (result.action) {
        case 'attacker_selected':
            return 'Selected attacking territory. Choose a target.';
        case 'attacker_changed':
            return 'Changed attacking territory. Choose a target.';
        case 'attack_started':
            return 'Attack started. Choose dice count.';
        default:
            return result.message || 'Action successful';
    }
}

/**
 * Execute battle with selected dice
 * Replaces executeAttack, performSimpleCombat, etc.
 */
function executeCombatBattle(attackerDice, defenderDice = null) {
    if (!combatUI) {
        showCombatMessage('Combat system not initialized', 'error');
        return;
    }

    try {
        const result = combatUI.executeBattle(attackerDice, defenderDice);
        
        if (result.success) {
            updateCombatUI(result);
            
            if (result.action === 'territory_conquered') {
                showConquestUI(result);
            } else if (result.action === 'battle_completed') {
                showBattleResult(result);
            }
        } else {
            showCombatMessage(result.error, 'error');
        }
        
        // Update map display
        updateMapDisplay();
        
    } catch (error) {
        console.error('Error executing battle:', error);
        showCombatMessage('An error occurred during battle', 'error');
    }
}

/**
 * Complete territory conquest
 * Replaces scattered conquest logic
 */
function completeTerritoryConquest(armiesToMove) {
    if (!combatSystem) {
        showCombatMessage('Combat system not initialized', 'error');
        return;
    }

    try {
        const result = combatSystem.completeConquest(armiesToMove);
        
        if (result.success) {
            showCombatMessage(
                `Conquered ${result.conqueredTerritory}! Moved ${result.armiesMoved} armies.`,
                'success'
            );
            
            // Check for game-ending conditions
            checkGameEndConditions();
            
            // Update displays
            updateMapDisplay();
            updatePlayerStats();
            
            // End combat
            endCurrentCombat();
            
        } else {
            showCombatMessage(result.error, 'error');
        }
        
    } catch (error) {
        console.error('Error completing conquest:', error);
        showCombatMessage('An error occurred during conquest', 'error');
    }
}

/**
 * End current combat session
 * Cleans up all combat state
 */
function endCurrentCombat() {
    if (combatUI) {
        combatUI.reset();
    }
    
    if (combatSystem) {
        combatSystem.endCombat();
    }
    
    // Hide combat panels
    const combatPanel = document.getElementById('combat-panel');
    if (combatPanel) {
        combatPanel.style.display = 'none';
    }
    
    const conquestPanel = document.getElementById('conquest-panel');
    if (conquestPanel) {
        conquestPanel.style.display = 'none';
    }
    
    showCombatMessage('Combat ended', 'info');
}

/**
 * Update combat UI with new state
 */
function updateCombatUI(result) {
    try {
        const combatPanel = document.getElementById('combat-panel');
        if (!combatPanel) {
            createCombatPanel();
        }
        
        // Update based on action type
        switch (result.action) {
            case 'attacker_selected':
                showAttackerSelected(result.territory);
                break;
                
            case 'defender_selected':
                showDefenderSelected(result.territory, result.combat);
                break;
                
            case 'battle_completed':
                showBattleCompleted(result.result, result.canContinue);
                break;
                
            case 'territory_conquered':
                showTerritoryConquered(result.result);
                break;
        }
        
    } catch (error) {
        console.error('Error updating combat UI:', error);
    }
}

/**
 * Create combat panel HTML
 */
function createCombatPanel() {
    const combatPanel = document.createElement('div');
    combatPanel.id = 'combat-panel';
    combatPanel.className = 'combat-panel';
    combatPanel.innerHTML = `
        <div class="combat-header">
            <h3>COMBAT</h3>
        </div>
        
        <div class="combat-territories">
            <div class="combat-territory attacker" id="combat-attacker">
                <div class="combat-territory-name" id="combat-attacker-name">Select Attacker</div>
                <div class="combat-territory-armies" id="combat-attacker-armies">-</div>
            </div>
            
            <div class="combat-territory defender" id="combat-defender">
                <div class="combat-territory-name" id="combat-defender-name">Select Defender</div>
                <div class="combat-territory-armies" id="combat-defender-armies">-</div>
            </div>
        </div>
        
        <div class="dice-selection" id="dice-selection" style="display: none;">
            <div class="dice-selection-title">Choose Attacker Dice</div>
            <div class="dice-buttons" id="attacker-dice-buttons">
                <!-- Dice buttons will be populated dynamically -->
            </div>
        </div>
        
        <div class="battle-results" id="battle-results" style="display: none;">
            <div class="battle-round" id="battle-round-number">Battle Round 1</div>
            
            <div class="dice-section">
                <div class="dice-section-title">Attacker Dice</div>
                <div class="dice-container" id="battle-dice-attacker"></div>
            </div>
            
            <div class="dice-section">
                <div class="dice-section-title">Defender Dice</div>
                <div class="dice-container" id="battle-dice-defender"></div>
            </div>
            
            <div class="battle-casualties">
                <div class="casualty-report attacker">
                    <div id="battle-casualties-attacker">No casualties</div>
                </div>
                
                <div class="casualty-report defender">
                    <div id="battle-casualties-defender">No casualties</div>
                </div>
            </div>
            
            <div class="remaining-armies">
                <div id="battle-remaining-attacker">0 armies remaining</div>
                <div id="battle-remaining-defender">0 armies remaining</div>
            </div>
        </div>
        
        <div class="combat-actions" id="combat-actions">
            <button class="combat-action-btn" id="continue-battle-btn" onclick="continueBattle()" style="display: none;">
                Continue Battle
            </button>
            <button class="combat-action-btn secondary" id="end-attack-btn" onclick="endCurrentCombat()">
                End Attack
            </button>
        </div>
    `;
    
    // Add to sidebar or appropriate container
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.appendChild(combatPanel);
    }
}

/**
 * Create conquest panel for army transfer
 */
function createConquestPanel() {
    const conquestPanel = document.createElement('div');
    conquestPanel.id = 'conquest-panel';
    conquestPanel.className = 'conquest-panel';
    conquestPanel.innerHTML = `
        <div class="conquest-title">🏆 TERRITORY CONQUERED! 🏆</div>
        
        <div class="army-transfer-section">
            <p>Choose how many armies to move to the conquered territory:</p>
            
            <div class="army-transfer-controls">
                <span>1</span>
                <input type="range" class="army-slider" id="conquest-army-slider" 
                       min="1" max="1" value="1" oninput="updateArmyCount(this.value)">
                <span id="conquest-max-armies">1</span>
            </div>
            
            <div class="army-count-display" id="conquest-army-count">1</div>
        </div>
        
        <div class="combat-actions">
            <button class="combat-action-btn" onclick="confirmConquest()">
                Move Armies & Conquer
            </button>
        </div>
    `;
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.appendChild(conquestPanel);
    }
}

/**
 * Show attacker selected state
 */
function showAttackerSelected(territoryId) {
    const territory = gameState.territories[territoryId];
    const attackerName = document.getElementById('combat-attacker-name');
    const attackerArmies = document.getElementById('combat-attacker-armies');
    
    if (attackerName) attackerName.textContent = territoryId;
    if (attackerArmies) attackerArmies.textContent = `${territory.armies} armies`;
    
    const combatPanel = document.getElementById('combat-panel');
    if (combatPanel) {
        combatPanel.style.display = 'block';
    }
}

/**
 * Show defender selected state and enable dice selection
 */
function showDefenderSelected(territoryId, combatState) {
    const territory = gameState.territories[territoryId];
    const defenderName = document.getElementById('combat-defender-name');
    const defenderArmies = document.getElementById('combat-defender-armies');
    
    if (defenderName) defenderName.textContent = territoryId;
    if (defenderArmies) defenderArmies.textContent = `${territory.armies} armies`;
    
    // Show dice selection
    const diceSelection = document.getElementById('dice-selection');
    if (diceSelection) {
        diceSelection.style.display = 'block';
        createDiceButtons(combatState.maxAttackerDice);
    }
}

/**
 * Create dice selection buttons
 */
function createDiceButtons(maxDice) {
    const buttonsContainer = document.getElementById('attacker-dice-buttons');
    if (!buttonsContainer) return;
    
    buttonsContainer.innerHTML = '';
    
    for (let i = 1; i <= maxDice; i++) {
        const button = document.createElement('button');
        button.className = 'dice-button';
        button.textContent = i;
        button.onclick = () => executeCombatBattle(i);
        buttonsContainer.appendChild(button);
    }
}

/**
 * Show battle results
 */
function showBattleCompleted(battleResult, canContinue) {
    const battleResults = document.getElementById('battle-results');
    if (battleResults) {
        battleResults.style.display = 'block';
    }
    
    const continueBtn = document.getElementById('continue-battle-btn');
    if (continueBtn) {
        continueBtn.style.display = canContinue ? 'block' : 'none';
    }
    
    // Update dice selection for next round
    if (canContinue) {
        const combat = combatSystem.getCurrentCombat();
        if (combat) {
            createDiceButtons(combat.maxAttackerDice);
        }
    } else {
        const diceSelection = document.getElementById('dice-selection');
        if (diceSelection) {
            diceSelection.style.display = 'none';
        }
    }
}

/**
 * Show territory conquered state
 */
function showTerritoryConquered(battleResult) {
    // Hide combat panel
    const combatPanel = document.getElementById('combat-panel');
    if (combatPanel) {
        combatPanel.style.display = 'none';
    }
    
    // Show conquest panel
    let conquestPanel = document.getElementById('conquest-panel');
    if (!conquestPanel) {
        createConquestPanel();
        conquestPanel = document.getElementById('conquest-panel');
    }
    
    if (conquestPanel) {
        conquestPanel.style.display = 'block';
        
        // Set up army slider
        const attacker = gameState.territories[combatSystem.currentCombat.attackingTerritoryId];
        const maxMovable = attacker.armies - 1;
        
        const slider = document.getElementById('conquest-army-slider');
        const maxLabel = document.getElementById('conquest-max-armies');
        
        if (slider) {
            slider.max = maxMovable;
            slider.value = 1;
        }
        
        if (maxLabel) {
            maxLabel.textContent = maxMovable;
        }
        
        updateArmyCount(1);
    }
}

/**
 * Update army count display for conquest
 */
function updateArmyCount(count) {
    const display = document.getElementById('conquest-army-count');
    if (display) {
        display.textContent = count;
    }
}

/**
 * Confirm conquest with selected army count
 */
function confirmConquest() {
    const slider = document.getElementById('conquest-army-slider');
    if (slider) {
        const armyCount = parseInt(slider.value);
        completeTerritoryConquest(armyCount);
    }
}

/**
 * Continue battle (for multiple rounds)
 */
function continueBattle() {
    // Simply show dice selection again
    const diceSelection = document.getElementById('dice-selection');
    if (diceSelection) {
        diceSelection.style.display = 'block';
    }
    
    const battleResults = document.getElementById('battle-results');
    if (battleResults) {
        battleResults.style.display = 'none';
    }
}

/**
 * Show combat status messages
 */
function showCombatMessage(message, type = 'info') {
    // Remove existing message
    const existingMessage = document.getElementById('combat-status-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.id = 'combat-status-message';
    messageDiv.className = `combat-status ${type}`;
    messageDiv.textContent = message;
    
    // Add to combat panel or sidebar
    const combatPanel = document.getElementById('combat-panel');
    const sidebar = document.querySelector('.sidebar');
    
    if (combatPanel && combatPanel.style.display !== 'none') {
        combatPanel.insertBefore(messageDiv, combatPanel.firstChild);
    } else if (sidebar) {
        sidebar.insertBefore(messageDiv, sidebar.firstChild);
    }
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

/**
 * TERRITORY CLICK HANDLER INTEGRATION
 * Replace the existing territory click handlers
 */
function handleTerritoryClick(territoryId) {
    const currentPhase = gameState.phase;
    
    switch (currentPhase) {
        case 'attack':
            handleAttackPhaseClick(territoryId);
            break;
            
        case 'reinforce':
            if (window.reinforcementManager) {
                window.reinforcementManager.handleTerritoryClick(territoryId);
            }
            break;
            
        case 'fortify':
            if (window.fortificationManager) {
                window.fortificationManager.handleTerritoryClick(territoryId);
            }
            break;
            
        default:
            console.log('Territory clicked in phase:', currentPhase);
            break;
    }
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.initializeCombatSystem = initializeCombatSystem;
    window.handleAttackPhaseClick = handleAttackPhaseClick;
    window.executeCombatBattle = executeCombatBattle;
    window.completeTerritoryConquest = completeTerritoryConquest;
    window.endCurrentCombat = endCurrentCombat;
    window.handleTerritoryClick = handleTerritoryClick;
    window.updateArmyCount = updateArmyCount;
    window.confirmConquest = confirmConquest;
    window.continueBattle = continueBattle;
}