/**
 * RISK COMBAT ANIMATIONS
 * 
 * This module integrates animations with the combat system
 */

// Global instance
let combatAnimations = null;

/**
 * Initialize Combat Animations
 * Called from game initialization
 */
function initializeCombatEnhancements() {
    try {
        // Initialize combat animations
        if (typeof CombatAnimations !== 'undefined') {
            combatAnimations = new CombatAnimations();
            console.log('✅ Combat Animations initialized');
        } else {
            console.error('❌ Cannot initialize Combat Animations: Missing dependencies');
            return false;
        }

        // Integrate with combat system
        if (window.combatSystem) {
            integrateCombatAnimations();
            console.log('✅ Combat Enhancements integrated with Combat System');
        }

        // Make globally available
        window.combatAnimations = combatAnimations;

        return true;
    } catch (error) {
        console.error('❌ Error initializing Combat Enhancements:', error);
        return false;
    }
}

/**
 * Integrate animations with the combat system
 */
function integrateCombatAnimations() {
    // Store original methods to enhance them
    const originalExecuteBattle = window.combatSystem.executeBattle;
    const originalCompleteConquest = window.combatSystem.completeConquest;
    
    // Enhance executeBattle with animations
    window.combatSystem.executeBattle = function(attackerDice, defenderDice = null) {
        // Start dice animation
        combatAnimations.animateDiceRoll({
            attackerDice: attackerDice,
            defenderDice: defenderDice || window.combatSystem.currentCombat.getMaxDefenderDice()
        });
        
        // Execute the original battle logic
        const result = originalExecuteBattle.call(this, attackerDice, defenderDice);
        
        // If successful, animate casualties
        if (result.success) {
            // Animate army removal for attacker and defender
            combatAnimations.animateArmyRemoval({
                attackerTerritory: window.combatSystem.currentCombat.getAttackingTerritory(),
                defenderTerritory: window.combatSystem.currentCombat.getDefendingTerritory(),
                attackerLosses: result.attackerLosses,
                defenderLosses: result.defenderLosses
            });
            
            // If territory is conquered, handle conquest animations
            if (result.conquered) {
                combatAnimations.animateConquest({
                    attackingTerritory: window.combatSystem.currentCombat.getAttackingTerritory(),
                    defendingTerritory: window.combatSystem.currentCombat.getDefendingTerritory(),
                    conquerorColor: window.gameState.players[window.gameState.getCurrentPlayer()].color
                });
            }
        }
        
        return result;
    };
    
    // Enhance completeConquest with animations
    window.combatSystem.completeConquest = function(armiesToMove) {
        const result = originalCompleteConquest.call(this, armiesToMove);
        
        if (result.success) {
            // Animate troop movement after conquest
            combatAnimations.animateTroopMovement({
                fromTerritory: result.fromTerritory,
                toTerritory: result.toTerritory,
                armiesCount: armiesToMove
            });
        }
        
        return result;
    };
    
    // Simplified combat end event
    const originalEndCombat = window.combatSystem.endCombat;
    window.combatSystem.endCombat = function() {
        // Execute original end combat
        originalEndCombat.call(this);
    };
}

// Initialize when document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // We'll wait until the combat system is initialized first
    const checkCombatSystem = setInterval(function() {
        if (window.combatSystem && window.combatUI) {
            clearInterval(checkCombatSystem);
            initializeCombatEnhancements();
        }
    }, 100);
});