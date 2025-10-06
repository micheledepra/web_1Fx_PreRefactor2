/**
 * Enhanced Attack UI - Integration with existing Risk game
 * This file integrates the enhanced attack UI with the existing game components
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait for game to initialize
    const gameInitInterval = setInterval(function() {
        if (window.riskGame) {
            clearInterval(gameInitInterval);
            integrateEnhancedAttackUI();
        }
    }, 500);
});

/**
 * Integrate enhanced attack UI with existing game
 */
function integrateEnhancedAttackUI() {
    const riskGame = window.riskGame;
    const phaseManager = riskGame?.phaseManager;
    const gameState = riskGame?.gameState;
    
    if (!riskGame || !phaseManager || !gameState) {
        console.error('Required game components not found');
        return;
    }
    
    // Initialize Attack Path Visualizer if not already initialized
    if (!window.attackPathVisualizer) {
        window.attackPathVisualizer = new AttackPathVisualizer();
        console.log('Attack Path Visualizer initialized');
    }
    
    // Add global helper for getting valid attack targets
    window.getValidAttackTargets = function(territory) {
        if (!gameState || !territory || !gameState.territories[territory]) {
            return [];
        }
        
        return gameState.territories[territory].neighbors.filter(neighbor =>
            gameState.isValidAttack(territory, neighbor)
        );
    };
    
    // Store original methods we need to override
    const originalSetPhase = phaseManager.setPhase.bind(phaseManager);
    
    // Override phase transition to add attack highlighting
    phaseManager.setPhase = function(phase) {
        // Call original method
        const result = originalSetPhase(phase);
        
        // If entering attack phase, highlight valid attack sources
        if (phase === 'attack') {
            setTimeout(() => {
                if (window.highlightValidAttackSources) {
                    window.highlightValidAttackSources();
                }
            }, 100);
        } else {
            // If leaving attack phase, clear highlights
            if (window.clearTerritoryHighlights) {
                window.clearTerritoryHighlights();
            }
        }
        
        return result;
    };
    
    // Add event listener for territory clicks during attack phase
    const territories = document.querySelectorAll('.territory');
    territories.forEach(territory => {
        territory.addEventListener('click', function() {
            const territoryId = this.id;
            if (!territoryId) return;
            
            // Only process in attack phase
            if (gameState.phase !== 'attack') return;
            
            const territory = gameState.territories[territoryId];
            if (!territory) return;
            
            const currentPlayer = gameState.getCurrentPlayer();
            
            // If clicking on own territory with > 1 army
            if (territory.owner === currentPlayer && territory.armies > 1) {
                // Clear any existing attack paths
                if (window.attackPathVisualizer) {
                    window.attackPathVisualizer.clearAttackPaths();
                }
                
                // Highlight valid attack targets
                if (window.highlightValidAttackTargets) {
                    window.highlightValidAttackTargets(territoryId);
                    
                    // Create potential attack paths to all valid targets
                    if (window.attackPathVisualizer && window.getValidAttackTargets) {
                        const validTargets = window.getValidAttackTargets(territoryId);
                        if (validTargets && validTargets.length) {
                            const pathPairs = validTargets.map(target => ({
                                fromTerritory: territoryId,
                                toTerritory: target
                            }));
                            window.attackPathVisualizer.createMultiplePaths(pathPairs);
                        }
                    }
                }
            }
        });
    });
    
    // Override the existing attack button handler
    if (window.openAttackModal) {
        const originalOpenAttackModal = window.openAttackModal;
        
        window.openAttackModal = function() {
            // Check if enhanced attack UI is available
            if (window.attackController) {
                // Use enhanced attack UI
                if (window.attackState && window.attackState.attackingTerritory && window.attackState.defendingTerritory) {
                    // Clear existing attack paths and create a single focused path
                    if (window.attackPathVisualizer) {
                        window.attackPathVisualizer.clearAttackPaths();
                        window.attackPathVisualizer.createAttackPath(
                            window.attackState.attackingTerritory,
                            window.attackState.defendingTerritory
                        );
                    }
                    
                    window.attackController.openModal(
                        window.attackState.attackingTerritory,
                        window.attackState.defendingTerritory
                    );
                }
            } else {
                // Fall back to original attack modal
                originalOpenAttackModal();
            }
        };
    }
    
    // Override attack phase buttons
    const startAttackBtn = document.getElementById('start-attack-btn');
    const endAttackBtn = document.getElementById('end-attack-btn');
    const skipAttackBtn = document.getElementById('skip-attack-btn');
    
    if (startAttackBtn) {
        startAttackBtn.addEventListener('click', function() {
            // Highlight valid attack sources when entering attack phase
            setTimeout(() => {
                if (window.highlightValidAttackSources) {
                    window.highlightValidAttackSources();
                }
            }, 100);
        });
    }
    
    if (endAttackBtn || skipAttackBtn) {
        const endPhaseHandler = function() {
            // Clear highlights when leaving attack phase
            if (window.clearTerritoryHighlights) {
                window.clearTerritoryHighlights();
            }
            
            // Clear any attack path visualizations
            if (window.attackPathVisualizer) {
                window.attackPathVisualizer.clearAttackPaths();
            }
        };
        
        if (endAttackBtn) endAttackBtn.addEventListener('click', endPhaseHandler);
        if (skipAttackBtn) skipAttackBtn.addEventListener('click', endPhaseHandler);
    }
    
    console.log('Enhanced Attack UI successfully integrated');
}

/**
 * Load the enhanced attack UI stylesheet
 */
function loadEnhancedAttackStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/enhanced-attack.css';
    document.head.appendChild(link);
}

// Load enhanced attack styles
loadEnhancedAttackStyles();