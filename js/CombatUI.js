/**
 * RISK COMBAT UI
 * 
 * Handles the user interface aspects of the combat system
 * Connects the core combat logic with the visual elements
 */

/**
 * Combat UI System
 * Manages visual interactions with the combat system
 */
class CombatUI {
    /**
     * Create a new combat UI manager
     * @param {CombatSystem} combatSystem - The combat system instance
     * @param {Object} gameUtils - Game utilities for safe DOM access
     */
    constructor(combatSystem, gameUtils) {
        this.combatSystem = combatSystem;
        this.gameUtils = gameUtils || window.GameUtils;
        this.currentAttackingTerritory = null;
        this.currentDefendingTerritory = null;
        
        console.log('🚀 Initializing CombatUI with super-robust element handling');
        
        // Ultra-robust element getter with advanced creation fallback
        const safeGetElement = (id, warnOnMissing = true) => {
            // First try direct access - fastest method
            let element = document.getElementById(id);
            
            // If element exists, return it immediately
            if (element) return element;
            
            // Element not found directly, try to make the modal visible first
            const attackModal = document.getElementById('attack-modal');
            if (attackModal) {
                // Save original display state
                const originalDisplay = attackModal.style.display;
                
                // Temporarily make visible
                if (originalDisplay === 'none' || originalDisplay === '') {
                    console.log(`🔍 Temporarily showing attack modal to find ${id}`);
                    attackModal.style.display = 'block';
                    
                    // Try again after making visible
                    element = document.getElementById(id);
                    
                    // Restore original state
                    attackModal.style.display = originalDisplay || 'none';
                    
                    // If found, return it
                    if (element) {
                        console.log(`✅ Found ${id} after making modal visible`);
                        return element;
                    }
                }
            }
            
            // Try gameUtils if available
            if (this.gameUtils && typeof this.gameUtils.safeGetElement === 'function') {
                element = this.gameUtils.safeGetElement(id, false); // Don't warn here
                if (element) return element;
            }
            
            // Still not found, perform advanced creation
            if (warnOnMissing) {
                console.warn(`⚠️ CombatUI: Element not found: ${id}, creating robust fallback`);
            }
            
            // Critical combat elements that must exist
            const criticalElements = {
                'attack-modal-attacking-name': { parent: '.attack-territory', className: 'territory-name', text: '-' },
                'attack-modal-attacking-armies': { parent: '.attack-territory', className: 'territory-armies', text: '0 armies' },
                'attack-modal-defending-name': { parent: '.defend-territory', className: 'territory-name', text: 'Select target' },
                'attack-modal-defending-armies': { parent: '.defend-territory', className: 'territory-armies', text: '0 armies' }
            };
            
            // If this is a critical element, create it properly
            if (id in criticalElements) {
                const config = criticalElements[id];
                
                // Find or create parent container first
                let parent = null;
                
                if (config.parent === '.attack-territory' || config.parent === '.defend-territory') {
                    // Find attack modal and selection container
                    const modal = document.getElementById('attack-modal');
                    if (!modal) {
                        console.error('❌ Cannot create element: attack-modal not found');
                        return createPlaceholder(id);
                    }
                    
                    let selection = modal.querySelector('#attack-modal-selection');
                    if (!selection) {
                        // Create selection container
                        const modalContent = modal.querySelector('.modal-content');
                        if (!modalContent) {
                            console.error('❌ Cannot create element: modal-content not found');
                            return createPlaceholder(id);
                        }
                        
                        selection = document.createElement('div');
                        selection.id = 'attack-modal-selection';
                        selection.className = 'attack-selection';
                        modalContent.appendChild(selection);
                    }
                    
                    // Create territory containers if needed
                    if (config.parent === '.attack-territory') {
                        parent = modal.querySelector('.attack-territory');
                        if (!parent) {
                            parent = document.createElement('div');
                            parent.className = 'attack-territory';
                            
                            // Add label
                            const label = document.createElement('div');
                            label.className = 'territory-label';
                            label.textContent = '🗡️ Attacking From';
                            parent.appendChild(label);
                            
                            selection.appendChild(parent);
                            
                            // Add separator if needed
                            if (!selection.querySelector('.attack-vs')) {
                                const separator = document.createElement('div');
                                separator.className = 'attack-vs';
                                separator.textContent = 'VS';
                                selection.appendChild(separator);
                            }
                        }
                    } else {
                        parent = modal.querySelector('.defend-territory');
                        if (!parent) {
                            parent = document.createElement('div');
                            parent.className = 'defend-territory';
                            
                            // Add label
                            const label = document.createElement('div');
                            label.className = 'territory-label';
                            label.textContent = '🛡️ Defending';
                            parent.appendChild(label);
                            
                            selection.appendChild(parent);
                        }
                    }
                } else {
                    // Try to find via selector
                    const parentElements = document.querySelectorAll(config.parent);
                    if (parentElements.length > 0) {
                        parent = parentElements[0];
                    }
                }
                
                // Create the element if we have a parent
                if (parent) {
                    console.log(`🔧 Creating robust element ${id} with proper DOM structure`);
                    element = document.createElement('div');
                    element.id = id;
                    element.className = config.className;
                    element.textContent = config.text;
                    parent.appendChild(element);
                    return element;
                }
            }
            
            // Create simple placeholder element as last resort
            return createPlaceholder(id);
        };
        
        // Create a simple placeholder element
        const createPlaceholder = (id) => {
            console.log(`🔧 Creating simple placeholder for ${id}`);
            const element = document.createElement('div');
            element.id = id;
            element.style.display = 'none';
            element.dataset.placeholder = 'true';
            document.body.appendChild(element);
            return element;
        };
        
        // Make sure modals exist in the DOM
        this.ensureModalsExist();
        
        // Verify that critical elements are available before proceeding
        const attackModal = document.getElementById('attack-modal');
        if (!attackModal) {
            console.error('❌ CombatUI: Critical element "attack-modal" is missing!');
        }
        
        // UI elements with ultra-safe fallback mechanism
        this.elements = {
            // Attack modal elements
            attackModal: safeGetElement('attack-modal', false),
            attackerName: safeGetElement('attack-modal-attacking-name', false),
            attackerArmies: safeGetElement('attack-modal-attacking-armies', false), 
            defenderName: safeGetElement('attack-modal-defending-name', false),
            defenderArmies: safeGetElement('attack-modal-defending-armies', false),
            armyInputSection: gameUtils.safeGetElement('attack-modal-army-input') || document.getElementById('attack-modal-army-input'),
            attackerArmyInput: gameUtils.safeGetElement('attack-modal-attacker-armies-input') || document.getElementById('attack-modal-attacker-armies-input'),
            defenderArmyInput: gameUtils.safeGetElement('attack-modal-defender-armies-input') || document.getElementById('attack-modal-defender-armies-input'),
            executeButton: gameUtils.safeGetElement('attack-modal-execute') || document.getElementById('attack-modal-execute'),
            resultsSection: gameUtils.safeGetElement('attack-modal-results') || document.getElementById('attack-modal-results'),
            attackerLossesDisplay: gameUtils.safeGetElement('attack-modal-attacker-losses') || document.getElementById('attack-modal-attacker-losses'),
            defenderLossesDisplay: gameUtils.safeGetElement('attack-modal-defender-losses') || document.getElementById('attack-modal-defender-losses'),
            battleResult: gameUtils.safeGetElement('attack-modal-battle-result') || document.getElementById('attack-modal-battle-result'),
            continueButton: gameUtils.safeGetElement('attack-modal-continue') || document.getElementById('attack-modal-continue'),
            endButton: gameUtils.safeGetElement('attack-modal-end') || document.getElementById('attack-modal-end'),
            resetButton: gameUtils.safeGetElement('attack-modal-reset') || document.getElementById('attack-modal-reset')
        };
        
        // Conquest elements with fallback mechanism
        this.conquestElements = {
            modal: gameUtils.safeGetElement('unit-transfer-modal') || document.getElementById('unit-transfer-modal'),
            sourceName: gameUtils.safeGetElement('transfer-source-name') || document.getElementById('transfer-source-name'),
            sourceArmies: gameUtils.safeGetElement('transfer-source-armies') || document.getElementById('transfer-source-armies'),
            destName: gameUtils.safeGetElement('transfer-destination-name') || document.getElementById('transfer-destination-name'),
            destArmies: gameUtils.safeGetElement('transfer-destination-armies') || document.getElementById('transfer-destination-armies'),
            slider: gameUtils.safeGetElement('transfer-slider') || document.getElementById('transfer-slider'),
            input: gameUtils.safeGetElement('transfer-input') || document.getElementById('transfer-input'),
            sliderMaxLabel: gameUtils.safeGetElement('slider-max-label') || document.getElementById('slider-max-label'),
            transferRange: gameUtils.safeGetElement('transfer-range') || document.getElementById('transfer-range'),
            previewSource: gameUtils.safeGetElement('preview-source-name') || document.getElementById('preview-source-name'),
            previewSourceArmies: gameUtils.safeGetElement('preview-source-armies') || document.getElementById('preview-source-armies'),
            previewDest: gameUtils.safeGetElement('preview-destination-name') || document.getElementById('preview-destination-name'),
            previewDestArmies: gameUtils.safeGetElement('preview-destination-armies') || document.getElementById('preview-destination-armies')
        };
        
        // Initialize event listeners
        this.initializeEventListeners();
    }
    
    /**
     * Make sure all required modal elements exist in the DOM
     * This function ensures the HTML structure is correct
     */
    ensureModalsExist() {
        // Check if attack modal exists
        let attackModal = document.getElementById('attack-modal');
        if (!attackModal) {
            console.log('Attack modal not found, ensuring it exists');
            this.createAttackModal();
        } else {
            // Save original display style
            const originalDisplay = attackModal.style.display;
            
            // Temporarily make modal visible to ensure all elements are accessible
            if (originalDisplay === 'none' || originalDisplay === '') {
                console.log('🔍 CombatUI: Temporarily making attack-modal visible for initialization');
                attackModal.style.display = 'flex';
            }
            
            // Check for specific elements in attack modal and create if missing
            this.ensureAttackModalElements();
            
            // Restore original display style
            if (originalDisplay === 'none' || originalDisplay === '') {
                console.log('🔍 CombatUI: Restoring attack-modal to hidden state');
                attackModal.style.display = originalDisplay || 'none';
            }
        }
        
        // Check if unit transfer modal exists
        let transferModal = document.getElementById('unit-transfer-modal');
        if (!transferModal) {
            console.log('Transfer modal not found, ensuring it exists');
            this.createTransferModal();
        } else {
            // Save original display style
            const originalDisplay = transferModal.style.display;
            
            // Temporarily make modal visible to ensure all elements are accessible
            if (originalDisplay === 'none' || originalDisplay === '') {
                console.log('🔍 CombatUI: Temporarily making transfer-modal visible for initialization');
                transferModal.style.display = 'flex';
            }
            
            // Check for specific elements in transfer modal and create if missing
            this.ensureTransferModalElements();
            
            // Restore original display style
            if (originalDisplay === 'none' || originalDisplay === '') {
                console.log('🔍 CombatUI: Restoring transfer-modal to hidden state');
                transferModal.style.display = originalDisplay || 'none';
            }
        }
    }
    
    /**
     * Ensure all attack modal elements exist
     */
    ensureAttackModalElements() {
        const attackModal = document.getElementById('attack-modal');
        if (!attackModal) return; // Can't add elements if modal doesn't exist
        
        const modalContent = attackModal.querySelector('.modal-content');
        if (!modalContent) return;
        
        // Check and create attacker name
        if (!document.getElementById('attack-modal-attacking-name')) {
            const attackSelection = modalContent.querySelector('.attack-selection');
            if (attackSelection) {
                const attackerDiv = attackSelection.querySelector('.attacker');
                if (attackerDiv && !attackerDiv.querySelector('#attack-modal-attacking-name')) {
                    const nameDiv = document.createElement('div');
                    nameDiv.id = 'attack-modal-attacking-name';
                    nameDiv.className = 'territory-name';
                    nameDiv.textContent = '-';
                    attackerDiv.appendChild(nameDiv);
                }
            }
        }
        
        // Check and create attacker armies
        if (!document.getElementById('attack-modal-attacking-armies')) {
            const attackSelection = modalContent.querySelector('.attack-selection');
            if (attackSelection) {
                const attackerDiv = attackSelection.querySelector('.attacker');
                if (attackerDiv && !attackerDiv.querySelector('#attack-modal-attacking-armies')) {
                    const armiesDiv = document.createElement('div');
                    armiesDiv.id = 'attack-modal-attacking-armies';
                    armiesDiv.className = 'territory-armies';
                    armiesDiv.textContent = '0 armies';
                    attackerDiv.appendChild(armiesDiv);
                }
            }
        }
        
        // Check and create defender name
        if (!document.getElementById('attack-modal-defending-name')) {
            const attackSelection = modalContent.querySelector('.attack-selection');
            if (attackSelection) {
                const defenderDiv = attackSelection.querySelector('.defender');
                if (defenderDiv && !defenderDiv.querySelector('#attack-modal-defending-name')) {
                    const nameDiv = document.createElement('div');
                    nameDiv.id = 'attack-modal-defending-name';
                    nameDiv.className = 'territory-name';
                    nameDiv.textContent = 'Select target';
                    defenderDiv.appendChild(nameDiv);
                }
            }
        }
        
        // Check and create defender armies
        if (!document.getElementById('attack-modal-defending-armies')) {
            const attackSelection = modalContent.querySelector('.attack-selection');
            if (attackSelection) {
                const defenderDiv = attackSelection.querySelector('.defender');
                if (defenderDiv && !defenderDiv.querySelector('#attack-modal-defending-armies')) {
                    const armiesDiv = document.createElement('div');
                    armiesDiv.id = 'attack-modal-defending-armies';
                    armiesDiv.className = 'territory-armies';
                    armiesDiv.textContent = '0 armies';
                    defenderDiv.appendChild(armiesDiv);
                }
            }
        }
        
        // Check and create end button
        if (!document.getElementById('attack-modal-end')) {
            const resultsSection = modalContent.querySelector('.combat-results');
            if (resultsSection) {
                const endBtn = document.createElement('button');
                endBtn.id = 'attack-modal-end';
                endBtn.className = 'attack-btn';
                endBtn.style.background = '#6c757d';
                endBtn.textContent = 'End Attack';
                endBtn.addEventListener('click', () => this.endAttack());
                resultsSection.appendChild(endBtn);
            }
        }
        
        // Check and create reset button
        if (!document.getElementById('attack-modal-reset')) {
            const modalContent = attackModal.querySelector('.modal-content');
            if (modalContent) {
                const resetBtn = document.createElement('button');
                resetBtn.id = 'attack-modal-reset';
                resetBtn.className = 'attack-btn';
                resetBtn.style.display = 'none';
                resetBtn.style.background = '#ffc107';
                resetBtn.style.color = '#000';
                resetBtn.style.marginTop = '10px';
                resetBtn.textContent = 'New Attack';
                resetBtn.addEventListener('click', () => this.resetAttack());
                modalContent.appendChild(resetBtn);
            }
        }
    }
    
    /**
     * Ensure all transfer modal elements exist
     */
    ensureTransferModalElements() {
        const transferModal = document.getElementById('unit-transfer-modal');
        if (!transferModal) return; // Can't add elements if modal doesn't exist
        
        const modalContent = transferModal.querySelector('.modal-content');
        if (!modalContent) return;
        
        // Check and create source name
        if (!document.getElementById('transfer-source-name')) {
            const sourceDiv = modalContent.querySelector('.transfer-territory.source');
            if (sourceDiv) {
                const nameDiv = document.createElement('div');
                nameDiv.id = 'transfer-source-name';
                nameDiv.className = 'territory-name';
                nameDiv.textContent = 'Attacking Territory';
                sourceDiv.appendChild(nameDiv);
            }
        }
        
        // Check and create source armies
        if (!document.getElementById('transfer-source-armies')) {
            const sourceDiv = modalContent.querySelector('.transfer-territory.source');
            if (sourceDiv) {
                const armiesDiv = document.createElement('div');
                armiesDiv.id = 'transfer-source-armies';
                armiesDiv.className = 'territory-armies';
                armiesDiv.textContent = '0 armies';
                sourceDiv.appendChild(armiesDiv);
            }
        }
        
        // Check and create destination name
        if (!document.getElementById('transfer-destination-name')) {
            const destDiv = modalContent.querySelector('.transfer-territory.destination');
            if (destDiv) {
                const nameDiv = document.createElement('div');
                nameDiv.id = 'transfer-destination-name';
                nameDiv.className = 'territory-name';
                nameDiv.textContent = 'Conquered Territory';
                destDiv.appendChild(nameDiv);
            }
        }
        
        // Check and create destination armies
        if (!document.getElementById('transfer-destination-armies')) {
            const destDiv = modalContent.querySelector('.transfer-territory.destination');
            if (destDiv) {
                const armiesDiv = document.createElement('div');
                armiesDiv.id = 'transfer-destination-armies';
                armiesDiv.className = 'territory-armies';
                armiesDiv.textContent = '1 army (minimum)';
                destDiv.appendChild(armiesDiv);
            }
        }
        
        // Check and create preview source name
        if (!document.getElementById('preview-source-name')) {
            const previewDiv = modalContent.querySelector('.transfer-result');
            if (previewDiv) {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                
                const nameSpan = document.createElement('span');
                nameSpan.id = 'preview-source-name';
                nameSpan.textContent = 'Attacking Territory';
                
                const colonSpan = document.createTextNode(': ');
                
                const armiesSpan = document.createElement('span');
                armiesSpan.id = 'preview-source-armies';
                armiesSpan.textContent = '0 armies remaining';
                
                resultItem.appendChild(nameSpan);
                resultItem.appendChild(colonSpan);
                resultItem.appendChild(armiesSpan);
                previewDiv.appendChild(resultItem);
            }
        }
        
        // Check and create preview destination name
        if (!document.getElementById('preview-destination-name')) {
            const previewDiv = modalContent.querySelector('.transfer-result');
            if (previewDiv) {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                
                const nameSpan = document.createElement('span');
                nameSpan.id = 'preview-destination-name';
                nameSpan.textContent = 'Conquered Territory';
                
                const colonSpan = document.createTextNode(': ');
                
                const armiesSpan = document.createElement('span');
                armiesSpan.id = 'preview-destination-armies';
                armiesSpan.textContent = '1 army total';
                
                resultItem.appendChild(nameSpan);
                resultItem.appendChild(colonSpan);
                resultItem.appendChild(armiesSpan);
                previewDiv.appendChild(resultItem);
            }
        }
    }
    
    /**
     * Create the attack modal if it doesn't exist
     */
    createAttackModal() {
        // Attack modal already exists in the HTML, this is just a fallback
        // No need to implement as the HTML structure is already present
    }
    
    /**
     * Create the transfer modal if it doesn't exist
     */
    createTransferModal() {
        // Transfer modal already exists in the HTML, this is just a fallback
        // No need to implement as the HTML structure is already present
    }
    
    /**
     * Initialize event listeners for combat UI
     */
    initializeEventListeners() {
        // Make sure these elements exist before attaching listeners
        if (this.elements.executeButton) {
            this.elements.executeButton.addEventListener('click', () => this.executeAttack());
        }
        
        if (this.elements.continueButton) {
            this.elements.continueButton.addEventListener('click', () => this.continueAttack());
        }
        
        if (this.elements.endButton) {
            this.elements.endButton.addEventListener('click', () => this.endAttack());
        }
        
        if (this.elements.resetButton) {
            this.elements.resetButton.addEventListener('click', () => this.resetAttack());
        }
        
        // Conquest modal events
        if (this.conquestElements.slider) {
            this.conquestElements.slider.addEventListener('input', () => this.updateTransferPreview());
        }
        
        if (this.conquestElements.input) {
            this.conquestElements.input.addEventListener('input', () => this.updateTransferFromInput());
        }
    }
    
    /**
     * Start a new attack between two territories
     * @param {string} attackingTerritoryId - Attacking territory ID
     * @param {string} defendingTerritoryId - Defending territory ID
     * @returns {boolean} - Whether the attack was started
     */
    /**
     * Update window.transferState with current territory information
     * This helps ensure proper conquest state recovery
     * @private
     */
    _updateTransferState(attackingTerritoryId, defendingTerritoryId) {
        // Update global transfer state for integration with legacy code
        if (typeof window !== 'undefined') {
            // Create transferState if it doesn't exist
            if (!window.transferState) {
                window.transferState = {};
            }
            
            // Update territory information
            window.transferState.sourceTerritory = attackingTerritoryId;
            window.transferState.destinationTerritory = defendingTerritoryId;
            
            // Set initial transfer values
            const attackingTerritory = this.combatSystem.gameState.territories[attackingTerritoryId];
            if (attackingTerritory) {
                window.transferState.maxTransfer = Math.max(1, attackingTerritory.armies - 1);
                window.transferState.minTransfer = 1;
                window.transferState.currentTransfer = 1;
            }
            
            console.log('🔄 Updated window.transferState:', window.transferState);
        }
    }
    
    startAttack(attackingTerritoryId, defendingTerritoryId) {
        // Start combat in the combat system
        const result = this.combatSystem.startCombat(attackingTerritoryId, defendingTerritoryId);
        
        if (!result.success) {
            console.error('Failed to start attack:', result.error);
            return false;
        }
        
        // Store current combat info
        const combat = result.combat;
        this.currentAttackingTerritory = combat.attackingTerritory || combat.attackingTerritoryId;
        this.currentDefendingTerritory = combat.defendingTerritory || combat.defendingTerritoryId;
        
        // Update transfer state for conquest recovery
        this._updateTransferState(this.currentAttackingTerritory, this.currentDefendingTerritory);
        
        console.log('DEBUG: startAttack storing territories:', {
            currentAttackingTerritory: this.currentAttackingTerritory,
            currentDefendingTerritory: this.currentDefendingTerritory,
            combatKeys: Object.keys(combat)
        });
        
        // Update UI with combat info
        this.updateAttackModalInfo(combat);
        
        // Show attack modal
        if (this.elements.attackModal) {
            this.elements.attackModal.style.display = 'flex';
        }
        
        return true;
    }
    
    /**
     * Update attack modal with current combat info
     * @param {Object} combat - Current combat state
     */
    updateAttackModalInfo(combat) {
        // Use GameStateManager for consistent data access
        const attackingTerritory = GameStateManager.getTerritory(combat.attackingTerritory);
        const defendingTerritory = GameStateManager.getTerritory(combat.defendingTerritory);
        
        if (!attackingTerritory || !defendingTerritory) {
            console.error('Territory not found:', {
                attacking: combat.attackingTerritory,
                defending: combat.defendingTerritory
            });
            return;
        }
        
        // Update territory names and armies with safe checks
        if (this.elements.attackerName) {
            this.elements.attackerName.textContent = attackingTerritory.name || combat.attackingTerritory;
        }
        
        if (this.elements.attackerArmies) {
            console.log(`DEBUG: Setting attacker armies display to: ${attackingTerritory.armies} armies`);
            this.elements.attackerArmies.textContent = `${attackingTerritory.armies} armies`;
        }
        
        if (this.elements.defenderName) {
            this.elements.defenderName.textContent = defendingTerritory.name || combat.defendingTerritory;
        }
        
        if (this.elements.defenderArmies) {
            console.log(`DEBUG: Setting defender armies display to: ${defendingTerritory.armies} armies`);
            this.elements.defenderArmies.textContent = `${defendingTerritory.armies} armies`;
        }

        // FORCE UPDATE: Override any other systems that might set mock values
        // Use setTimeout to ensure this runs after any competing updates
        setTimeout(() => {
            if (this.elements.attackerArmies) {
                this.elements.attackerArmies.textContent = `${attackingTerritory.armies} armies`;
                console.log(`DEBUG: Force-updated attacker armies to: ${attackingTerritory.armies} armies`);
            }
            if (this.elements.defenderArmies) {
                this.elements.defenderArmies.textContent = `${defendingTerritory.armies} armies`;
                console.log(`DEBUG: Force-updated defender armies to: ${defendingTerritory.armies} armies`);
            }
        }, 100); // Small delay to override competing systems
        
        // Show army input section
        if (this.elements.armyInputSection) {
            this.elements.armyInputSection.style.display = 'block';
        }
        
        // Set default values and max/min for army inputs
        // These represent "remaining armies after battle" - what the user wants left after the fight
        if (this.elements.attackerArmyInput) {
            this.elements.attackerArmyInput.min = 1; // Must leave at least 1 army (attacker cannot lose all)
            this.elements.attackerArmyInput.max = attackingTerritory.armies - 1; // Cannot exceed armies-1 (must leave 1 for territory)
            // Default: suggest losing 1 army (reasonable battle outcome)
            this.elements.attackerArmyInput.value = Math.max(1, attackingTerritory.armies - 1);
        }
        
        if (this.elements.defenderArmyInput) {
            this.elements.defenderArmyInput.min = 0; // Defender can lose all armies (conquest)
            this.elements.defenderArmyInput.max = defendingTerritory.armies; // Cannot have more than current
            // Default: suggest losing 1 army (reasonable battle outcome) 
            this.elements.defenderArmyInput.value = Math.max(0, defendingTerritory.armies - 1);
        }
        
        // Show execute button
        if (this.elements.executeButton) {
            this.elements.executeButton.style.display = 'block';
        }
        
        // Hide results section
        if (this.elements.resultsSection) {
            this.elements.resultsSection.style.display = 'none';
        }
    }
    
    /**
     * Execute an attack with the user-specified army values
     */
    executeAttack() {
        console.log('DEBUG: executeAttack called');
        console.log('DEBUG: currentAttackingTerritory:', this.currentAttackingTerritory);
        console.log('DEBUG: currentDefendingTerritory:', this.currentDefendingTerritory);
        
        // Get army input values
        console.log('DEBUG: attackerArmyInput element:', this.elements.attackerArmyInput);
        console.log('DEBUG: defenderArmyInput element:', this.elements.defenderArmyInput);
        
        const attackerRemainingArmies = parseInt(this.elements.attackerArmyInput?.value || 0);
        const defenderRemainingArmies = parseInt(this.elements.defenderArmyInput?.value || 0);
        
        console.log('DEBUG: parsed army values:', {
            attackerRemainingArmies,
            defenderRemainingArmies
        });
        
        // Use stored territory IDs from when combat was started
        const attackingTerritoryId = this.currentAttackingTerritory;
        const defendingTerritoryId = this.currentDefendingTerritory;
        
        console.log('DEBUG: Using stored territory IDs:', {
            attackingTerritoryId,
            defendingTerritoryId
        });
        
        if (!attackingTerritoryId || !defendingTerritoryId) {
            console.error('Missing territory IDs for combat');
            return;
        }
        
        const attackingTerritory = this.combatSystem.gameState.territories[attackingTerritoryId];
        const defendingTerritory = this.combatSystem.gameState.territories[defendingTerritoryId];
        
        console.log('DEBUG: executeAttack values:', {
            attackingTerritory: attackingTerritory?.id || attackingTerritoryId,
            attackingTerritoryName: attackingTerritory?.name,
            currentAttackerArmies: attackingTerritory?.armies,
            inputAttackerRemaining: attackerRemainingArmies,
            defendingTerritory: defendingTerritory?.id || defendingTerritoryId,
            defendingTerritoryName: defendingTerritory?.name,
            currentDefenderArmies: defendingTerritory?.armies,
            inputDefenderRemaining: defenderRemainingArmies
        });
        
        // Execute battle with direct army input - with multiple fallbacks
        let result;
        
        try {
            // Try different method names that might exist in the combat system
            if (typeof this.combatSystem.executeBattle === 'function') {
                result = this.combatSystem.executeBattle(attackerRemainingArmies, defenderRemainingArmies);
            } else if (typeof this.combatSystem.processDirectCombat === 'function') {
                console.log('🔄 Using processDirectCombat as fallback for executeBattle');
                result = this.combatSystem.processDirectCombat(attackerRemainingArmies, defenderRemainingArmies);
            } else if (typeof this.combatSystem.processCombat === 'function') {
                console.log('🔄 Using processCombat as fallback for executeBattle');
                result = this.combatSystem.processCombat(attackerRemainingArmies, defenderRemainingArmies);
            } else {
                // Create a mock result
                console.warn('⚠️ No combat execution method found, using direct territory update');
                
                // Directly update territories in the game state
                if (attackingTerritory && defendingTerritory) {
                    const wasConquered = defenderRemainingArmies <= 0;
                    const attackerLosses = attackingTerritory.armies - attackerRemainingArmies;
                    const defenderLosses = defendingTerritory.armies - defenderRemainingArmies;
                    
                    // Update army counts in local reference
                    attackingTerritory.armies = attackerRemainingArmies;
                    
                    // Ensure GameStateManager is updated too for consistency
                    if (typeof GameStateManager !== 'undefined' && GameStateManager.updateTerritory) {
                        GameStateManager.updateTerritory(attackingTerritoryId, { 
                            armies: attackerRemainingArmies 
                        });
                    }
                    
                    if (wasConquered) {
                        // Handle conquest
                        defendingTerritory.armies = 0;
                        
                        // In conquest, we need to update ownership too
                        if (typeof GameStateManager !== 'undefined' && GameStateManager.updateTerritory) {
                            GameStateManager.updateTerritory(defendingTerritoryId, {
                                armies: 0,
                                owner: attackingTerritory.owner
                            });
                        }
                        
                        // Update window.transferState for later transfer
                        this._updateTransferState(attackingTerritoryId, defendingTerritoryId);
                        
                        result = {
                            success: true,
                            result: {
                                territoryConquered: true,
                                conquered: true,
                                attackerLosses: attackerLosses,
                                defenderLosses: defenderLosses,
                                attackerRemaining: attackerRemainingArmies,
                                defenderRemaining: 0
                            }
                        };
                    } else {
                        // Normal attack result
                        defendingTerritory.armies = defenderRemainingArmies;
                        
                        // Ensure GameStateManager is updated
                        if (typeof GameStateManager !== 'undefined' && GameStateManager.updateTerritory) {
                            GameStateManager.updateTerritory(defendingTerritoryId, {
                                armies: defenderRemainingArmies
                            });
                        }
                        
                        result = {
                            success: true,
                            result: {
                                territoryConquered: false,
                                conquered: false,
                                attackerLosses: attackerLosses,
                                defenderLosses: defenderLosses,
                                attackerRemaining: attackerRemainingArmies,
                                defenderRemaining: defenderRemainingArmies
                            }
                        };
                    }
                    
                    // Make sure the map visuals update
                    if (typeof window.updateTerritoryDisplay === 'function') {
                        window.updateTerritoryDisplay(attackingTerritoryId);
                        window.updateTerritoryDisplay(defendingTerritoryId);
                    } else if (window.RiskMap && typeof window.RiskMap.updateTerritoryDisplay === 'function') {
                        window.RiskMap.updateTerritoryDisplay(attackingTerritoryId);
                        window.RiskMap.updateTerritoryDisplay(defendingTerritoryId);
                    }
                } else {
                    throw new Error('Could not find territory objects for direct update');
                }
            }
        } catch (error) {
            console.error('❌ Failed to execute battle:', error);
            result = { 
                success: false, 
                error: 'Battle execution failed: ' + error.message 
            };
        }
        
        if (!result || !result.success) {
            alert('Invalid army values: ' + (result?.error || 'Unknown error'));
            console.error('Failed to execute battle:', result?.error || 'Unknown error');
            return;
        }
        
        // Update UI with battle results
        this.showBattleResults(result.result);
    }
    
    /**
     * Show battle results in the UI
     * @param {Object} result - Battle result
     */
    showBattleResults(result) {
        // Safety check for result object
        if (!result) {
            console.error('❌ Invalid battle result received in showBattleResults');
            return;
        }
        
        console.log('🎲 Showing battle results:', result);
        
        // Capture the territory IDs before displaying results
        const attackingTerritoryId = this.attackingTerritoryId || this.currentAttackingTerritory || this.combatSystem.currentAttackingTerritory;
        const defendingTerritoryId = this.defendingTerritoryId || this.currentDefendingTerritory || this.combatSystem.currentDefendingTerritory;
        
        if (!attackingTerritoryId || !defendingTerritoryId) {
            console.warn('⚠️ Missing territory IDs in showBattleResults. Unable to fully update display.');
        } else {
            console.log('🔄 Battle territories:', { attacker: attackingTerritoryId, defender: defendingTerritoryId });
        }
        
        // Hide army input section and execute button
        if (this.elements.armyInputSection) {
            this.elements.armyInputSection.style.display = 'none';
        }
        
        if (this.elements.executeButton) {
            this.elements.executeButton.style.display = 'none';
        }
        
        // Show results section
        if (this.elements.resultsSection) {
            this.elements.resultsSection.style.display = 'block';
        }
        
        // Format attacker and defender losses for consistent display
        const attackerLosses = Array.isArray(result.attackerLosses) 
            ? result.attackerLosses.length 
            : (typeof result.attackerLosses === 'number' ? result.attackerLosses : 0);
        
        const defenderLosses = Array.isArray(result.defenderLosses) 
            ? result.defenderLosses.length 
            : (typeof result.defenderLosses === 'number' ? result.defenderLosses : 0);
        
        // Display losses
        if (this.elements.attackerLossesDisplay) {
            this.elements.attackerLossesDisplay.textContent = `Lost ${attackerLosses} armies`;
        }
        
        if (this.elements.defenderLossesDisplay) {
            this.elements.defenderLossesDisplay.textContent = `Lost ${defenderLosses} armies`;
        }
        
        // Display battle result text
        let resultText = `Attacker lost ${attackerLosses} armies. Defender lost ${defenderLosses} armies.`;
        
        if (result.conquered || result.territoryConquered) {
            resultText += '<br><strong>🏆 Territory conquered!</strong>';
        }
        
        this.gameUtils.safeUpdateElement(this.elements.battleResult, 'innerHTML', resultText);
        
        // Update territory armies - safely handle potential null combat state
        let attackingTerritory, defendingTerritory;
        
        try {
            // Try to get territory information from the combat system
            const combat = this.combatSystem.currentCombat && typeof this.combatSystem.currentCombat.getState === 'function' 
                ? this.combatSystem.currentCombat.getState()
                : null;
                
            // If we have combat state, use those territory IDs
            if (combat && combat.attackingTerritory && combat.defendingTerritory) {
                // Store territory IDs in case we need to recover later
                this.currentAttackingTerritory = combat.attackingTerritory;
                this.currentDefendingTerritory = combat.defendingTerritory;
                console.log('📝 Retrieved territory IDs from combat state:', { attacker: combat.attackingTerritory, defender: combat.defendingTerritory });
            }
            
            // Get territory objects using the IDs we have
            if (attackingTerritoryId && defendingTerritoryId) {
                // Try getting territories from gameState first
                if (this.combatSystem && this.combatSystem.gameState && this.combatSystem.gameState.territories) {
                    attackingTerritory = this.combatSystem.gameState.territories[attackingTerritoryId];
                    defendingTerritory = this.combatSystem.gameState.territories[defendingTerritoryId];
                }
                
                // If that didn't work, try GameStateManager
                if ((!attackingTerritory || !defendingTerritory) && typeof GameStateManager !== 'undefined') {
                    attackingTerritory = attackingTerritory || GameStateManager.getTerritory(attackingTerritoryId);
                    defendingTerritory = defendingTerritory || GameStateManager.getTerritory(defendingTerritoryId);
                }
                
                console.log('🏰 Retrieved territories:', {
                    attacker: attackingTerritory ? { id: attackingTerritory.id, name: attackingTerritory.name, armies: attackingTerritory.armies } : null,
                    defender: defendingTerritory ? { id: defendingTerritory.id, name: defendingTerritory.name, armies: defendingTerritory.armies } : null
                });
            }
        } catch (error) {
            console.warn('⚠️ Error getting territory information:', error);
            
            // Fallback to stored territory IDs if available
            if (!attackingTerritory && !defendingTerritory && this.currentAttackingTerritory && this.currentDefendingTerritory) {
                console.log('🔄 Falling back to stored territory IDs:', { attacker: this.currentAttackingTerritory, defender: this.currentDefendingTerritory });
                
                // Try getting territories from GameStateManager
                if (typeof GameStateManager !== 'undefined') {
                    attackingTerritory = GameStateManager.getTerritory(this.currentAttackingTerritory);
                    defendingTerritory = GameStateManager.getTerritory(this.currentDefendingTerritory);
                }
                
                // If that didn't work, try game state
                if ((!attackingTerritory || !defendingTerritory) && this.combatSystem && this.combatSystem.gameState) {
                    attackingTerritory = attackingTerritory || this.combatSystem.gameState.territories[this.currentAttackingTerritory];
                    defendingTerritory = defendingTerritory || this.combatSystem.gameState.territories[this.currentDefendingTerritory];
                }
            }
        }
        
        // Update UI elements if we have territory information
        if (attackingTerritory && defendingTerritory) {
            console.log('🔄 Synchronizing territories with UI and GameState');
            
            // Ensure correct territory states based on battle result
            if (typeof result.attackerRemaining === 'number') {
                attackingTerritory.armies = result.attackerRemaining;
            }
            
            if (typeof result.defenderRemaining === 'number') {
                defendingTerritory.armies = result.defenderRemaining;
            }
            
            // If territory was conquered, update ownership
            if (result.conquered || result.territoryConquered) {
                defendingTerritory.owner = attackingTerritory.owner;
                defendingTerritory.ownerId = attackingTerritory.ownerId || attackingTerritory.owner;
                console.log('🏆 Territory conquered! Updated ownership:', {
                    territory: defendingTerritory.id,
                    newOwner: defendingTerritory.owner
                });
            }
            
            // Ensure GameStateManager is updated with our state
            if (typeof GameStateManager !== 'undefined' && GameStateManager.updateTerritory) {
                GameStateManager.updateTerritory(attackingTerritory.id, { 
                    armies: attackingTerritory.armies 
                });
                
                // If conquered, update ownership
                if (result.conquered || result.territoryConquered) {
                    GameStateManager.updateTerritory(defendingTerritory.id, {
                        armies: defendingTerritory.armies,
                        owner: attackingTerritory.owner,
                        ownerId: attackingTerritory.ownerId || attackingTerritory.owner
                    });
                } else {
                    GameStateManager.updateTerritory(defendingTerritory.id, {
                        armies: defendingTerritory.armies
                    });
                }
            }
            
            // Update UI display
            this.gameUtils.safeUpdateElement(this.elements.attackerArmies, 'textContent', `${attackingTerritory.armies} armies`);
            this.gameUtils.safeUpdateElement(this.elements.defenderArmies, 'textContent', `${defendingTerritory.armies} armies`);
            
            // Show continue button if territory not conquered and attacker can continue
            if (!(result.conquered || result.territoryConquered) && attackingTerritory.armies > 1) {
                this.gameUtils.safeToggleDisplay(this.elements.continueButton, true);
            } else {
                this.gameUtils.safeToggleDisplay(this.elements.continueButton, false);
            }
            
            // Make sure transfer state is updated for downstream systems
            this._updateTransferState(attackingTerritory.id, defendingTerritory.id);
            
            // Ensure map visuals are updated
            this._updateMapDisplay(attackingTerritory.id, defendingTerritory.id);
        }
        
        // Update map display directly even if we didn't have complete territory data
        if ((attackingTerritoryId || this.currentAttackingTerritory) && (defendingTerritoryId || this.currentDefendingTerritory)) {
            const attId = attackingTerritoryId || this.currentAttackingTerritory;
            const defId = defendingTerritoryId || this.currentDefendingTerritory;
            this._updateMapDisplay(attId, defId);
        }
        
        // Show reset button
        if (this.elements.resetButton) {
            this.elements.resetButton.style.display = 'block';
        }
        
        // Handle conquest
        if (result.conquered || result.territoryConquered) {
            console.log('🏆 Territory conquered! Showing conquest modal');
            this.showConquestModal();
        }
    }
    
    /**
     * Update map display with new territory state
     * @private
     * @param {string} attackingTerritoryId - ID of attacking territory
     * @param {string} defendingTerritoryId - ID of defending territory
     */
    _updateMapDisplay(attackingTerritoryId, defendingTerritoryId) {
        console.log('🔄 Updating map display for territories:', { attacker: attackingTerritoryId, defender: defendingTerritoryId });
        
        // Try multiple ways to update the map display
        
        // Method 1: Direct territory update function
        if (typeof window.updateTerritoryDisplay === 'function') {
            console.log('✅ Using window.updateTerritoryDisplay');
            window.updateTerritoryDisplay(attackingTerritoryId);
            window.updateTerritoryDisplay(defendingTerritoryId);
            return;
        }
        
        // Method 2: RiskMap class
        if (window.RiskMap) {
            if (typeof window.RiskMap.updateTerritoryDisplay === 'function') {
                console.log('✅ Using RiskMap.updateTerritoryDisplay');
                window.RiskMap.updateTerritoryDisplay(attackingTerritoryId);
                window.RiskMap.updateTerritoryDisplay(defendingTerritoryId);
                return;
            } else if (typeof window.RiskMap.updateTerritory === 'function') {
                console.log('✅ Using RiskMap.updateTerritory');
                window.RiskMap.updateTerritory(attackingTerritoryId);
                window.RiskMap.updateTerritory(defendingTerritoryId);
                return;
            }
        }
        
        // Method 3: RiskUI class
        if (window.riskUI) {
            if (typeof window.riskUI.updateTerritoryDisplay === 'function') {
                console.log('✅ Using riskUI.updateTerritoryDisplay');
                window.riskUI.updateTerritoryDisplay(attackingTerritoryId);
                window.riskUI.updateTerritoryDisplay(defendingTerritoryId);
                return;
            } else if (typeof window.riskUI.updateAllTerritories === 'function') {
                console.log('✅ Using riskUI.updateAllTerritories');
                window.riskUI.updateAllTerritories();
                return;
            }
        }
        
        // Method 4: Update territory functions via GameStateManager
        if (GameStateManager && typeof GameStateManager.refreshTerritoryDisplay === 'function') {
            console.log('✅ Using GameStateManager.refreshTerritoryDisplay');
            GameStateManager.refreshTerritoryDisplay(attackingTerritoryId);
            GameStateManager.refreshTerritoryDisplay(defendingTerritoryId);
            return;
        }
        
        // Method 5: DOM direct manipulation as last resort
        try {
            console.log('⚠️ Attempting direct DOM manipulation for territory display');
            // Try to find territory elements by ID and update them
            const attackerElement = document.querySelector(`[data-territory-id="${attackingTerritoryId}"]`);
            const defenderElement = document.querySelector(`[data-territory-id="${defendingTerritoryId}"]`);
            
            // Find and update army count elements
            if (attackerElement) {
                const attackerArmyEl = attackerElement.querySelector('.army-count');
                if (attackerArmyEl) {
                    const territory = this.combatSystem.gameState.territories[attackingTerritoryId];
                    if (territory) {
                        attackerArmyEl.textContent = territory.armies;
                    }
                }
            }
            
            if (defenderElement) {
                const defenderArmyEl = defenderElement.querySelector('.army-count');
                if (defenderArmyEl) {
                    const territory = this.combatSystem.gameState.territories[defendingTerritoryId];
                    if (territory) {
                        defenderArmyEl.textContent = territory.armies;
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Unable to update map display through DOM:', error);
        }
    }
    
    /**
     * Display dice rolls in the UI
     * @param {HTMLElement} container - Container element
     * @param {Array} rolls - Array of dice values
     */
    displayDiceRolls(container, rolls) {
        if (!container) return;
        
        container.innerHTML = '';
        
        rolls.forEach(roll => {
            const diceEl = document.createElement('span');
            diceEl.className = 'dice-value';
            diceEl.textContent = roll;
            diceEl.style.margin = '0 5px';
            diceEl.style.padding = '3px 8px';
            diceEl.style.background = '#f0f0f0';
            diceEl.style.borderRadius = '3px';
            container.appendChild(diceEl);
        });
    }
    
    /**
     * Continue the attack with new army input
     */
    continueAttack() {
        // Hide results section and reset button
        if (this.elements.resultsSection) {
            this.elements.resultsSection.style.display = 'none';
        }
        
        if (this.elements.resetButton) {
            this.elements.resetButton.style.display = 'none';
        }
        
        // Show army input section and execute button
        if (this.elements.armyInputSection) {
            this.elements.armyInputSection.style.display = 'block';
        }
        
        if (this.elements.executeButton) {
            this.elements.executeButton.style.display = 'block';
        }
        
        // Update army input fields based on current armies
        const combat = this.combatSystem.currentCombat.getState();
        const attackingTerritory = this.combatSystem.gameState.territories[combat.attackingTerritory];
        const defendingTerritory = this.combatSystem.gameState.territories[combat.defendingTerritory];
        
        // Set default values and max/min for army inputs
        if (this.elements.attackerArmyInput) {
            this.elements.attackerArmyInput.min = 1; // Must leave at least 1 army
            this.elements.attackerArmyInput.max = attackingTerritory.armies - 1;
            this.elements.attackerArmyInput.value = attackingTerritory.armies - 1; // Default to 1 army loss
        }
        
        if (this.elements.defenderArmyInput) {
            this.elements.defenderArmyInput.min = 0; // Defender can lose all armies
            this.elements.defenderArmyInput.max = defendingTerritory.armies;
            this.elements.defenderArmyInput.value = Math.max(0, defendingTerritory.armies - 1); // Default to 1 army loss
        }
    }
    
    /**
     * End the current attack
     */
    endAttack() {
        // Store territory IDs before ending combat
        const attackingTerritoryId = this.currentAttackingTerritory;
        const defendingTerritoryId = this.currentDefendingTerritory;
        
        console.log('🛑 Ending attack between territories:', { 
            attacker: attackingTerritoryId, 
            defender: defendingTerritoryId 
        });
        
        // Ensure final map update before closing
        if (attackingTerritoryId && defendingTerritoryId) {
            try {
                // Force a final territory sync with the game state
                if (GameStateManager) {
                    console.log('🔄 Final game state synchronization');
                    const attackerState = GameStateManager.getTerritory(attackingTerritoryId);
                    const defenderState = GameStateManager.getTerritory(defendingTerritoryId);
                    
                    if (attackerState && defenderState) {
                        // Final update of the map visuals
                        this._updateMapDisplay(attackingTerritoryId, defendingTerritoryId);
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error during final map update:', error);
            }
        }
        
        // Close attack modal
        if (this.elements.attackModal) {
            this.elements.attackModal.style.display = 'none';
        }
        
        // End combat in the combat system
        this.combatSystem.endCombat();
        
        // Final check for map state consistency
        try {
            if (window.riskUI && typeof window.riskUI.updateAllTerritories === 'function') {
                console.log('🔄 Final map refresh via riskUI.updateAllTerritories');
                window.riskUI.updateAllTerritories();
            } else if (GameStateManager && typeof GameStateManager.refreshAllTerritories === 'function') {
                console.log('🔄 Final map refresh via GameStateManager.refreshAllTerritories');
                GameStateManager.refreshAllTerritories();
            }
        } catch (error) {
            console.warn('⚠️ Error during final map refresh:', error);
        }
        
        // Reset current territories
        this.currentAttackingTerritory = null;
        this.currentDefendingTerritory = null;
        
        console.log('✅ Attack ended successfully');
    }
    
    /**
     * Reset attack selection to start a new attack
     */
    resetAttack() {
        // Hide results section
        if (this.elements.resultsSection) {
            this.elements.resultsSection.style.display = 'none';
        }
        
        // End combat and restart modal
        this.combatSystem.endCombat();
        
        // Reset current territories
        this.currentAttackingTerritory = null;
        this.currentDefendingTerritory = null;
        
        // Close modal
        if (this.elements.attackModal) {
            this.elements.attackModal.style.display = 'none';
        }
    }
    
    /**
     * Show conquest modal for army transfer
     */
    showConquestModal() {
        console.log('🏆 Showing conquest modal for army transfer');
        
        // Get combat info
        let combat = this.combatSystem.currentCombat;
        let attackingTerritoryId, defendingTerritoryId;
        
        // If we don't have combat info, attempt to recover from stored IDs
        if (!combat || !combat.isConquered()) {
            console.warn('⚠️ No active conquest in combat system, attempting recovery');
            
            // Try to recover from stored territory IDs
            if (this.currentAttackingTerritory && this.currentDefendingTerritory) {
                console.log('🛠️ Recovering from stored territory IDs');
                attackingTerritoryId = this.currentAttackingTerritory;
                defendingTerritoryId = this.currentDefendingTerritory;
            }
            // Try to recover from window.transferState as a last resort
            else if (window.transferState && window.transferState.sourceTerritory && window.transferState.destinationTerritory) {
                console.log('🛠️ Recovering from window.transferState');
                attackingTerritoryId = window.transferState.sourceTerritory;
                defendingTerritoryId = window.transferState.destinationTerritory;
            } else {
                console.error('❌ Cannot show conquest modal: No territory information available');
                return;
            }
        } else {
            // Normal path: Get territory IDs from combat system
            attackingTerritoryId = combat.getAttackingTerritory();
            defendingTerritoryId = combat.getDefendingTerritory();
        }
        
        // Get territory objects
        const attackingTerritory = GameStateManager.getTerritory(attackingTerritoryId);
        const defendingTerritory = GameStateManager.getTerritory(defendingTerritoryId);
        
        if (!attackingTerritory || !defendingTerritory) {
            console.error('❌ Cannot show conquest modal: Territory objects not found');
            return;
        }
        
        // Important: Update transfer state for downstream systems
        this._updateTransferState(attackingTerritoryId, defendingTerritoryId);
        
        // Set territory names and armies
        this.gameUtils.safeUpdateElement(this.conquestElements.sourceName, 'textContent', attackingTerritory.name || attackingTerritoryId);
        this.gameUtils.safeUpdateElement(this.conquestElements.sourceArmies, 'textContent', `${attackingTerritory.armies} armies`);
        this.gameUtils.safeUpdateElement(this.conquestElements.destName, 'textContent', defendingTerritory.name || defendingTerritoryId);
        this.gameUtils.safeUpdateElement(this.conquestElements.destArmies, 'textContent', `${defendingTerritory.armies} army (minimum)`);
        
        // Set slider range
        const maxArmies = attackingTerritory.armies - 1;
        
        if (this.conquestElements.slider) {
            this.conquestElements.slider.min = 1;
            this.conquestElements.slider.max = maxArmies;
            this.conquestElements.slider.value = 1;
        }
        
        if (this.conquestElements.input) {
            this.conquestElements.input.min = 1;
            this.conquestElements.input.max = maxArmies;
            this.conquestElements.input.value = 1;
        }
        
        this.gameUtils.safeUpdateElement(this.conquestElements.sliderMaxLabel, 'textContent', maxArmies.toString());
        this.gameUtils.safeUpdateElement(this.conquestElements.transferRange, 'textContent', `You can transfer 1-${maxArmies} armies`);
        
        // Set up window.transferState for compatibility with game.html transfer functions
        if (typeof window !== 'undefined' && window.transferState) {
            window.transferState.sourceTerritory = combat.getAttackingTerritory();
            window.transferState.destinationTerritory = combat.getDefendingTerritory();
            window.transferState.maxTransfer = maxArmies;
            window.transferState.minTransfer = 1;
            window.transferState.currentTransfer = 1;
        }
        
        // Update preview
        this.updateTransferPreview();
        
        // Show conquest modal
        if (this.conquestElements.modal) {
            this.conquestElements.modal.style.display = 'flex';
        }
    }
    
    /**
     * Update transfer preview based on slider value
     */
    updateTransferPreview() {
        if (!this.conquestElements.slider) return;
        
        const transferAmount = parseInt(this.conquestElements.slider.value);
        this.updateTransferPreviewWithValue(transferAmount);
        
        // Sync input with slider
        if (this.conquestElements.input) {
            this.conquestElements.input.value = transferAmount;
        }
    }
    
    /**
     * Update transfer preview based on input value
     */
    updateTransferFromInput() {
        if (!this.conquestElements.input) return;
        
        const transferAmount = parseInt(this.conquestElements.input.value);
        const maxArmies = parseInt(this.conquestElements.input.max);
        const validAmount = Math.max(1, Math.min(maxArmies, transferAmount));
        
        this.updateTransferPreviewWithValue(validAmount);
        
        // Sync slider with input if value changed
        if (transferAmount !== validAmount) {
            this.conquestElements.input.value = validAmount;
        }
        
        if (this.conquestElements.slider) {
            this.conquestElements.slider.value = validAmount;
        }
    }
    
    /**
     * Update transfer preview with a specific value
     * @param {number} transferAmount - Number of armies to transfer
     */
    updateTransferPreviewWithValue(transferAmount) {
        const combat = this.combatSystem.currentCombat;
        
        if (!combat || !combat.isConquered()) return;
        
        const attackingTerritory = this.combatSystem.gameState.territories[combat.getAttackingTerritory()];
        const defendingTerritory = this.combatSystem.gameState.territories[combat.getDefendingTerritory()];
        
        // Update window.transferState for compatibility
        if (typeof window !== 'undefined' && window.transferState) {
            window.transferState.currentTransfer = transferAmount;
        }
        
        // Calculate remaining armies
        const sourceRemaining = attackingTerritory.armies - transferAmount;
        const destTotal = defendingTerritory.armies + transferAmount;
        
        // Update preview
        this.gameUtils.safeUpdateElement(this.conquestElements.previewSource, 'textContent', attackingTerritory.name || combat.getAttackingTerritory());
        this.gameUtils.safeUpdateElement(this.conquestElements.previewSourceArmies, 'textContent', `${sourceRemaining} armies remaining`);
        this.gameUtils.safeUpdateElement(this.conquestElements.previewDest, 'textContent', defendingTerritory.name || combat.getDefendingTerritory());
        this.gameUtils.safeUpdateElement(this.conquestElements.previewDestArmies, 'textContent', `${destTotal} armies total`);
    }
    
    /**
     * Confirm army transfer after conquest
     */
    confirmTransfer() {
        console.log('🔄 CombatUI.confirmTransfer called');
        
        try {
            // Get transfer amount from slider or input with fallback
            let transferAmount = parseInt(this.conquestElements.slider?.value || 
                                         this.conquestElements.input?.value || 
                                         window.transferState?.currentTransfer || 1);
            
            // Validate transfer amount is a reasonable number
            if (isNaN(transferAmount) || transferAmount < 1) {
                console.warn('⚠️ Invalid transfer amount, using default of 1');
                transferAmount = 1;
            }
            
            console.log(`📊 Transfer amount: ${transferAmount}`);
            
            // Validate combat system state
            if (!this.combatSystem) {
                console.error('❌ Combat system not available');
                throw new Error('Combat system not available');
            }
            
            if (!this.combatSystem.currentCombat) {
                console.error('❌ No active combat instance');
                throw new Error('No active combat instance');
            }
            
            // Get territories to validate transfer is possible
            let sourceTerritory, destTerritory;
            
            try {
                const sourceId = this.combatSystem.currentCombat.getAttackingTerritory();
                const destId = this.combatSystem.currentCombat.getDefendingTerritory();
                
                sourceTerritory = this.combatSystem.gameState.territories[sourceId];
                destTerritory = this.combatSystem.gameState.territories[destId];
                
                // Validate we have enough armies
                if (sourceTerritory.armies <= transferAmount) {
                    console.warn(`⚠️ Not enough armies (${sourceTerritory.armies}) for requested transfer (${transferAmount}), adjusting`);
                    transferAmount = Math.max(1, sourceTerritory.armies - 1);
                }
            } catch (e) {
                console.warn('⚠️ Could not validate transfer:', e);
                // We'll proceed anyway and let the combat system handle it
            }
            
            // Complete conquest in combat system
            const result = this.combatSystem.completeConquest(transferAmount);
            
            if (!result || !result.success) {
                console.error('❌ Failed to complete conquest:', result?.error || 'Unknown error');
                throw new Error(result?.error || 'Failed to complete conquest');
            }
            
            console.log('✅ Conquest completed successfully');
            
            // Close conquest modal
            if (this.conquestElements.modal) {
                this.conquestElements.modal.style.display = 'none';
            }
            
            // Close attack modal
            this.endAttack();
            
            return result;
        } catch (error) {
            console.error('❌ Error during transfer confirmation:', error);
            
            // Always close modals on error
            if (this.conquestElements && this.conquestElements.modal) {
                this.conquestElements.modal.style.display = 'none';
            }
            if (this.elements && this.elements.attackModal) {
                this.elements.attackModal.style.display = 'none';
            }
            
            // Make sure we're not leaving a stuck state
            if (this.combatSystem) {
                this.combatSystem.currentCombat = null;
            }
            
            return { success: false, error: error.message || 'Transfer confirmation failed' };
        }
    }
    
    /**
     * Use minimum army transfer (1 army)
     */
    cancelTransfer() {
        console.log('🔄 Using minimum transfer of 1 army');
        
        // Use completeConquest method with minimum armies (1)
        // This will handle all the recovery logic if needed
        const result = this.completeConquest(1);
        
        if (!result || !result.success) {
            console.error('❌ Failed to complete minimum transfer:', result?.error || 'Unknown error');
            
            // Still close modals even on error
            if (this.conquestElements.modal) {
                this.conquestElements.modal.style.display = 'none';
            }
            this.endAttack();
            
            return;
        }
        
        console.log('✅ Minimum transfer completed successfully');
        
        // Close conquest modal
        if (this.conquestElements.modal) {
            this.conquestElements.modal.style.display = 'none';
        }
        
        // Close attack modal
        this.endAttack();
    }
    
    /**
     * Complete conquest with specified army count
     * Legacy wrapper method for compatibility
     * @param {number} armyCount - Number of armies to transfer (optional)
     * @returns {Object} Result of transfer operation
     */
    completeConquest(armyCount = null) {
        console.log('🔄 CombatUI.completeConquest called with armyCount:', armyCount);
        
        try {
            // First attempt: Use active combat system state
            if (this.combatSystem && this.combatSystem.currentCombat && typeof this.combatSystem.currentCombat.isConquered === 'function') {
                const isConquered = this.combatSystem.currentCombat.isConquered();
                if (isConquered) {
                    console.log('✅ Using active combat state for conquest');
                    if (armyCount !== null && this.conquestElements.slider) {
                        this.conquestElements.slider.value = armyCount;
                    }
                    return this.confirmTransfer();
                }
            }
            
            // First alternate attempt: Check if transfer modal is visible with data
            if (document.getElementById('unit-transfer-modal') && 
                window.getComputedStyle(document.getElementById('unit-transfer-modal')).display !== 'none') {
                console.log('✅ Found visible transfer modal, using its current state');
                if (armyCount !== null) {
                    // Try to update transfer amount
                    const transferInput = document.getElementById('transfer-input');
                    const transferSlider = document.getElementById('transfer-slider');
                    if (transferInput) transferInput.value = armyCount;
                    if (transferSlider) transferSlider.value = armyCount;
                }
                
                // Use window's confirm transfer directly
                if (typeof window.confirmTransfer === 'function') {
                    return window.confirmTransfer();
                }
            }
            
            console.warn('⚠️ No active conquest state available, trying recovery methods');
            
            // Second attempt: Try to recover from stored territory IDs
            let sourceTerritory = null;
            let destTerritory = null;
            let sourceId = null;
            let destId = null;
            
            // Method 1: Try window.transferState
            if (window.transferState && window.transferState.sourceTerritory && window.transferState.destinationTerritory) {
                console.log('🛠️ Attempting recovery from window.transferState');
                sourceId = window.transferState.sourceTerritory;
                destId = window.transferState.destinationTerritory;
                sourceTerritory = GameStateManager.getTerritory(sourceId);
                destTerritory = GameStateManager.getTerritory(destId);
            }
            // Method 2: Try stored instance variables
            else if (this.currentAttackingTerritory && this.currentDefendingTerritory) {
                console.log('🛠️ Attempting recovery from stored territory IDs');
                sourceId = this.currentAttackingTerritory;
                destId = this.currentDefendingTerritory;
                sourceTerritory = GameStateManager.getTerritory(sourceId);
                destTerritory = GameStateManager.getTerritory(destId);
            }
            
            // Verify we have valid territories
            if (!sourceTerritory || !destTerritory) {
                console.error('❌ Recovery failed: Could not find valid territories');
                
                // Last-ditch effort: Try to close modals anyway
                if (this.conquestElements.modal) {
                    this.conquestElements.modal.style.display = 'none';
                }
                if (this.elements.attackModal) {
                    this.elements.attackModal.style.display = 'none';
                }
                
                return { success: false, error: 'Could not find territories for conquest' };
            }
            
            console.log('🛠️ Creating mock combat for recovery with territories:', {
                source: sourceId,
                destination: destId,
                sourceArmies: sourceTerritory.armies,
                destArmies: destTerritory.armies
            });
            
            // Ensure valid army count
            if (armyCount === null || isNaN(armyCount) || armyCount < 1) {
                armyCount = Math.min(Math.floor(sourceTerritory.armies / 2), 1);
                console.log(`🔢 Using calculated army count: ${armyCount}`);
            }
            
            // Validate army count
            if (sourceTerritory.armies <= armyCount) {
                console.warn(`⚠️ Not enough armies! Adjusting from ${armyCount} to ${sourceTerritory.armies - 1}`);
                armyCount = Math.max(1, sourceTerritory.armies - 1);
            }
            
            // Create mock combat for the transfer
            const mockCombat = {
                attackingTerritoryId: sourceId,
                defendingTerritoryId: destId,
                conquered: true,
                attackingTerritory: sourceId,
                defendingTerritory: destId,
                isConquered: function() { return true; },
                getAttackingTerritory: function() { return this.attackingTerritoryId; },
                getDefendingTerritory: function() { return this.defendingTerritoryId; },
                getState: function() { 
                    return {
                        attackingTerritory: this.attackingTerritoryId,
                        defendingTerritory: this.defendingTerritoryId,
                        conquered: true
                    };
                },
                completeConquest: function(armies) {
                    if (!sourceTerritory || !destTerritory) {
                        return { success: false, error: 'Territory not found in recovery' };
                    }
                    
                    // Validate army count again to be safe
                    if (sourceTerritory.armies <= armies) {
                        const adjustedArmies = Math.max(1, sourceTerritory.armies - 1);
                        console.warn(`⚠️ Adjusting armies from ${armies} to ${adjustedArmies}`);
                        armies = adjustedArmies;
                    }
                    
                    // Execute transfer
                    sourceTerritory.armies -= armies;
                    destTerritory.armies = armies;
                    destTerritory.owner = sourceTerritory.owner;
                    
                    console.log('✅ Manual conquest completed:', {
                        sourceTerritory: sourceTerritory.name || sourceId,
                        sourceArmiesRemaining: sourceTerritory.armies,
                        destTerritory: destTerritory.name || destId,
                        destArmiesTransferred: armies
                    });
                    
                    return { success: true };
                }
            };
            
            // Temporarily set this as current combat in the combat system
            this.combatSystem.currentCombat = mockCombat;
            
            // Update UI elements with current values
            if (this.conquestElements.slider) {
                this.conquestElements.slider.min = 1;
                this.conquestElements.slider.max = sourceTerritory.armies - 1;
                this.conquestElements.slider.value = armyCount;
            }
            if (this.conquestElements.input) {
                this.conquestElements.input.min = 1;
                this.conquestElements.input.max = sourceTerritory.armies - 1;
                this.conquestElements.input.value = armyCount;
            }
            
            // Execute transfer
            console.log('🔄 Executing recovery conquest with army count:', armyCount);
            const result = this.confirmTransfer();
            
            // Clean up after ourselves
            this.combatSystem.currentCombat = null;
            
            return result;
        } catch (error) {
            console.error('❌ Error during conquest recovery:', error);
            
            // Always close modals on error
            if (this.conquestElements && this.conquestElements.modal) {
                this.conquestElements.modal.style.display = 'none';
            }
            if (this.elements && this.elements.attackModal) {
                this.elements.attackModal.style.display = 'none';
            }
            
            return { success: false, error: 'Conquest failed: ' + error.message };
        }
        
        // Normal execution path when combat system is valid
        if (armyCount !== null && this.conquestElements.slider) {
            this.conquestElements.slider.value = armyCount;
        }
        
        return this.confirmTransfer();
    }
    
    /**
     * Handle territory click for attack phase
     * @param {string} territoryId - Clicked territory ID
     * @returns {object} - Result with success/error information
     */
    handleTerritoryClick(territoryId) {
        try {
            // Check if combatSystem is properly initialized
            if (!this.combatSystem) {
                return { success: false, error: 'Combat system not initialized' };
            }
            
            // Check if validateAttacker method exists
            if (typeof this.combatSystem.validateAttacker !== 'function') {
                console.error('validateAttacker method not found on combatSystem');
                // Fall back to using validateAttack if available
                if (typeof this.combatSystem.validateAttack === 'function') {
                    return this.handleTerritoryClickFallback(territoryId);
                }
                return { success: false, error: 'Combat validation not available' };
            }
            
            // If no attacking territory selected yet, check if this is a valid attacker
            if (!this.currentAttackingTerritory) {
                const validation = this.combatSystem.validateAttacker(territoryId);
                
                if (validation.valid) {
                    this.currentAttackingTerritory = territoryId;
                    // Highlight attacking territory and potential targets
                    this.highlightAttackingTerritory(territoryId);
                    return { success: true, action: 'attacker_selected', territory: territoryId };
                } else {
                    return { success: false, error: validation.reason || 'Invalid attacker' };
                }
            }
            // If attacking territory already selected, check if this is a valid target
            else if (this.currentAttackingTerritory !== territoryId) {
                const validation = this.combatSystem.validateAttack(this.currentAttackingTerritory, territoryId);
                
                if (validation.valid) {
                    // Start attack between territories
                    const attackResult = this.startAttack(this.currentAttackingTerritory, territoryId);
                    return { success: attackResult, action: 'attack_started' };
                } else {
                    // Check if new territory is a valid attacker
                    const newAttackerValidation = this.combatSystem.validateAttacker(territoryId);
                    
                    if (newAttackerValidation.valid) {
                        // Switch to new attacking territory
                        this.currentAttackingTerritory = territoryId;
                        this.highlightAttackingTerritory(territoryId);
                        return { success: true, action: 'attacker_changed', territory: territoryId };
                    } else {
                        return { success: false, error: validation.reason || 'Invalid target' };
                    }
                }
            }
        } catch (err) {
            console.error('Error in handleTerritoryClick:', err);
            return { success: false, error: 'An error occurred during territory selection' };
        }
        
        return { success: false, error: 'No valid action for this territory' };
    }
    
    /**
     * Fallback handler for territory clicks when validateAttacker is not available
     * Uses validateAttack as an alternative way to determine valid attackers
     * @param {string} territoryId - Clicked territory ID
     * @returns {object} - Result with success/error information
     */
    handleTerritoryClickFallback(territoryId) {
        try {
            const territory = this.combatSystem.gameState.territories[territoryId];
            
            // Basic validation that we can do without validateAttacker
            if (!territory) {
                return { success: false, error: 'Invalid territory' };
            }
            
            const currentPlayer = this.combatSystem.gameState.getCurrentPlayer();
            
            // If no attacking territory selected yet
            if (!this.currentAttackingTerritory) {
                // Check if territory belongs to current player
                if (territory.owner !== currentPlayer) {
                    return { success: false, error: 'Can only attack from your own territories' };
                }
                
                // Check if territory has enough armies to attack
                if (territory.armies < 2) {
                    return { success: false, error: 'Must have at least 2 armies to attack' };
                }
                
                // Check if territory has any valid neighbors to attack
                const hasValidTargets = territory.neighbors && territory.neighbors.some(neighborId => {
                    const neighbor = this.combatSystem.gameState.territories[neighborId];
                    return neighbor && neighbor.owner !== currentPlayer;
                });
                
                if (!hasValidTargets) {
                    return { success: false, error: 'No valid attack targets from this territory' };
                }
                
                // Valid attacker
                this.currentAttackingTerritory = territoryId;
                this.highlightAttackingTerritory(territoryId);
                return { success: true, action: 'attacker_selected', territory: territoryId };
            }
            // If attacking territory already selected
            else if (this.currentAttackingTerritory !== territoryId) {
                const validation = this.combatSystem.validateAttack(this.currentAttackingTerritory, territoryId);
                
                if (validation.valid) {
                    // Start attack between territories
                    const attackResult = this.startAttack(this.currentAttackingTerritory, territoryId);
                    return { success: attackResult, action: 'attack_started' };
                } else {
                    // Check if new territory could be a valid attacker
                    if (territory.owner === currentPlayer && territory.armies >= 2) {
                        // Check if has valid targets
                        const hasValidTargets = territory.neighbors && territory.neighbors.some(neighborId => {
                            const neighbor = this.combatSystem.gameState.territories[neighborId];
                            return neighbor && neighbor.owner !== currentPlayer;
                        });
                        
                        if (hasValidTargets) {
                            // Switch to new attacking territory
                            this.currentAttackingTerritory = territoryId;
                            this.highlightAttackingTerritory(territoryId);
                            return { success: true, action: 'attacker_changed', territory: territoryId };
                        }
                    }
                    
                    return { success: false, error: validation.reason || 'Invalid target' };
                }
            }
            
            return { success: false, error: 'No valid action for this territory' };
        } catch (err) {
            console.error('Error in handleTerritoryClickFallback:', err);
            return { success: false, error: 'An error occurred during territory selection' };
        }
    }
    
    /**
     * Highlight attacking territory and its potential targets
     * @param {string} territoryId - Attacking territory ID
     */
    highlightAttackingTerritory(territoryId) {
        // Implementation would depend on the map visualization system
        console.log(`Highlighting attacking territory: ${territoryId}`);
        
        try {
            let targets = [];
            
            // Try different methods to get possible attack targets
            if (typeof this.combatSystem.getPossibleAttackTargets === 'function') {
                targets = this.combatSystem.getPossibleAttackTargets(territoryId);
            } else if (typeof this.combatSystem.getAttackableTerritoriesFrom === 'function') {
                targets = this.combatSystem.getAttackableTerritoriesFrom(territoryId);
            } else {
                // Fallback: Find targets manually using game state
                const territory = this.combatSystem.gameState.territories[territoryId];
                const currentPlayer = this.combatSystem.gameState.getCurrentPlayer();
                
                if (territory && territory.neighbors && Array.isArray(territory.neighbors)) {
                    targets = territory.neighbors.filter(neighborId => {
                        const neighbor = this.combatSystem.gameState.territories[neighborId];
                        return neighbor && neighbor.owner !== currentPlayer;
                    });
                }
            }
            
            if (targets && Array.isArray(targets)) {
                console.log(`Potential targets: ${targets.join(', ')}`);
            } else {
                console.log('No valid targets found or targets not in expected format');
            }
        } catch (error) {
            console.warn('⚠️ Error highlighting attack targets:', error.message);
            // Continue execution, this is just a visual enhancement
        }
    }
    
    /**
     * Clear all attack highlights
     */
    clearAttackHighlights() {
        // Implementation would depend on the map visualization system
        console.log('Clearing attack highlights');
    }
}