/**
 * Integrate AttackManager into the game
 * This script should be included after all other game scripts
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Make sure this runs after the main initialization
    setTimeout(() => {
        // Check if game is initialized
        if (!window.riskGame) {
            console.error('Game not initialized, cannot setup AttackManager');
            return;
        }
        
        // Add required CSS
        addAttackStyles();
        
        // Add the AttackManager integration
        integrateAttackManager();
    }, 100); // Small delay to ensure main init is complete
});

/**
 * Add AttackManager CSS styles to the page
 */
function addAttackStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Attack selection styles */
        .territory.attacker-selected {
            stroke: #ff9900 !important;
            stroke-width: 3px !important;
            stroke-dasharray: none !important;
            animation: pulse 1.5s infinite;
        }
        
        .territory.defender-selected {
            stroke: #ff0000 !important;
            stroke-width: 3px !important;
            stroke-dasharray: none !important;
            animation: pulse-fast 1s infinite;
        }
        
        .territory.valid-target {
            stroke: #ff4444 !important;
            stroke-width: 2px !important;
            stroke-dasharray: 5, 3 !important;
            cursor: pointer;
        }
        
        /* Attack panel styles */
        .attack-panel {
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 320px;
            background-color: rgba(30, 30, 30, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: none;
        }
        
        .battle-territories {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .battle-territory {
            flex: 1;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
        }
        
        .battle-territory.attacker {
            background-color: rgba(0, 128, 255, 0.3);
        }
        
        .battle-territory.defender {
            background-color: rgba(255, 0, 0, 0.3);
        }
        
        .battle-direction {
            padding: 0 10px;
            font-size: 1.5em;
        }
        
        .dice-selection {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        
        .attacker-dice, .defender-dice {
            flex: 1;
            text-align: center;
        }
        
        .dice-options {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 5px;
        }
        
        .dice-option {
            display: inline-block;
            position: relative;
            width: 30px;
            height: 30px;
            border: 1px solid #666;
            border-radius: 5px;
            cursor: pointer;
        }
        
        .dice-option input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
        }
        
        .dice-count {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .dice-option input:checked + .dice-count {
            background-color: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
        }
        
        .attack-buttons {
            display: flex;
            justify-content: space-between;
            gap: 10px;
        }
        
        .attack-btn, .cancel-btn {
            flex: 1;
            padding: 8px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        
        .attack-btn {
            background-color: #ff4444;
            color: white;
        }
        
        .cancel-btn {
            background-color: #444;
            color: white;
        }
        
        /* Combat UI styles */
        .combat-ui {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            max-width: 90vw;
            max-height: 80vh;
            background-color: rgba(30, 30, 30, 0.95);
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
            z-index: 1001;
            display: none;
            overflow-y: auto;
        }
        
        .battle-history {
            max-height: 200px;
            overflow-y: auto;
            margin-bottom: 15px;
            padding: 10px;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 5px;
        }
        
        .battle-round {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #555;
        }
        
        .battle-round:last-child {
            border-bottom: none;
        }
        
        .dice-results {
            display: flex;
            justify-content: space-between;
        }
        
        .attacker-result, .defender-result {
            flex: 1;
            padding: 5px;
        }
        
        .attacker-result {
            border-left: 3px solid #0088ff;
        }
        
        .defender-result {
            border-left: 3px solid #ff4444;
        }
        
        .battle-status {
            margin-top: 5px;
            font-weight: bold;
        }
        
        .conquest-options {
            background-color: rgba(0, 128, 0, 0.2);
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        
        .conquest-options input[type="range"] {
            width: 100%;
            margin: 10px 0;
        }
        
        /* Notifications */
        .conquest-notification, .card-notification, .message-notification {
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 128, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
            z-index: 1002;
            text-align: center;
            animation: fade-in 0.5s;
        }
        
        .card-notification {
            background-color: rgba(128, 0, 128, 0.9);
        }
        
        .message-notification {
            background-color: rgba(0, 0, 128, 0.9);
        }
        
        .fade-out {
            animation: fade-out 1s forwards;
        }
        
        /* Animations */
        @keyframes pulse {
            0% { stroke-opacity: 1; }
            50% { stroke-opacity: 0.5; }
            100% { stroke-opacity: 1; }
        }
        
        @keyframes pulse-fast {
            0% { stroke-opacity: 1; }
            50% { stroke-opacity: 0.6; }
            100% { stroke-opacity: 1; }
        }
        
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes fade-out {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    
    document.head.appendChild(styleElement);
}

/**
 * Integrate AttackManager into the game
 */
function integrateAttackManager() {
    const ui = window.riskGame;
    
    // Check for required components
    if (!ui) {
        console.error('UI not available');
        return;
    }
    
    if (!ui.gameState) {
        console.error('GameState not available');
        return;
    }
    
    if (!ui.phaseManager) {
        console.error('PhaseManager not available');
        return;
    }
    
    if (!ui.turnManager) {
        console.error('TurnManager not available');
        return;
    }
    
    // Check if CombatSystem exists, create it if not
    if (!ui.combatSystem) {
        console.log('Creating CombatSystem...');
        ui.combatSystem = new CombatSystem(ui.gameState);
    }
    
    // Create AttackManager
    console.log('Creating AttackManager...');
    ui.attackManager = new AttackManager(
        ui.gameState,
        ui.combatSystem,
        ui.phaseManager, 
        ui.turnManager,
        ui
    );
    
    // Connect AttackManager to PhaseManager
    if (ui.phaseManager) {
        // Store original handleTerritoryClick method to chain it
        const originalHandleTerritoryClick = ui.handleTerritoryClick;
        
        // Override handleTerritoryClick to integrate AttackManager during attack phase
        ui.handleTerritoryClick = function(territoryId) {
            // Check if in attack phase
            if (ui.phaseManager.getCurrentPhase() === 'attack') {
                return ui.attackManager.selectTerritory(territoryId);
            } else {
                // Use original method for other phases
                return originalHandleTerritoryClick.call(ui, territoryId);
            }
        };
        
        console.log('AttackManager integration complete');
    }
    
    // Add phase button handler to AttackManager
    const skipAttackBtn = document.getElementById('skip-attack');
    if (skipAttackBtn) {
        skipAttackBtn.addEventListener('click', () => {
            if (ui.attackManager && ui.phaseManager.getCurrentPhase() === 'attack') {
                ui.attackManager.endPhase();
            }
        });
    }
}