// Initialize the game once all resources are loaded
function initializeGame() {
    // Create UI instance
    const ui = new RiskUI();
    
    // Initialize game with players
    ui.initGame(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
    
    return ui;
}

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        loadScript('js/mapData.js'),
        loadScript('js/territory-paths.js'),
        loadScript('js/GameState.js'),
        loadScript('js/TurnManager.js'),
        loadScript('js/RiskUI.js')
    ])
    .then(() => {
        // Verify that required objects are loaded
        if (typeof mapData === 'undefined') {
            throw new Error('mapData not loaded');
        }
        if (typeof territoryPaths === 'undefined') {
            throw new Error('territoryPaths not loaded');
        }
        
        // Initialize the game
        window.riskGame = initializeGame();
    })
    .catch(error => {
        console.error('Failed to initialize game:', error);
        document.querySelector('.map-container').innerHTML = `
            <div style="color: red; padding: 20px;">
                Error loading game data. Please refresh the page.
            </div>
        `;
    });
});