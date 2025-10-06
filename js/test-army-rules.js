// Test script for army count rules
function testArmyRules() {
    console.log('===== Testing Army Count Rules =====');
    
    // Check if required objects are loaded
    if (typeof territoryPaths === 'undefined') {
        console.error('territoryPaths is not defined! Make sure territory-paths.js is loaded first.');
        return;
    }
    if (typeof mapData === 'undefined') {
        console.error('mapData is not defined! Make sure mapData.js is loaded first.');
        return;
    }
    
    // Test the getInitialArmies method
    console.log('Testing getInitialArmies:');
    const gameState = new GameState(['Player 1', 'Player 2']);
    
    // Test initial army counts for different player counts
    console.log('2 players:', gameState.getInitialArmies(2), 'armies each (should be 40)');
    console.log('3 players:', gameState.getInitialArmies(3), 'armies each (should be 35)');
    console.log('4 players:', gameState.getInitialArmies(4), 'armies each (should be 30)');
    console.log('5 players:', gameState.getInitialArmies(5), 'armies each (should be 25)');
    console.log('6 players:', gameState.getInitialArmies(6), 'armies each (should be 20)');
    
    // Test territory assignment and initial armies
    console.log('\nTesting territory assignment with initial armies:');
    const testState = new GameState(['Player 1', 'Player 2', 'Player 3']);
    testState.assignTerritoriesRandomly();
    
    // Count territories per player
    const playerTerritories = {};
    testState.players.forEach(player => {
        playerTerritories[player] = Object.values(testState.territories)
            .filter(t => t.owner === player).length;
    });
    
    // Verify remaining armies
    console.log('Player territories:', playerTerritories);
    console.log('Initial armies (3 players):', testState.getInitialArmies(3));
    console.log('Remaining armies after territory assignment:');
    testState.players.forEach(player => {
        const expected = testState.getInitialArmies(3) - playerTerritories[player];
        console.log(`${player}: ${testState.remainingArmies[player]} (should be ${expected})`);
    });
    
    // Test reinforcement calculation
    console.log('\nTesting reinforcement calculation:');
    testState.players.forEach(player => {
        const territories = playerTerritories[player];
        const expected = Math.max(3, Math.floor(territories / 3));
        const actual = testState.calculateReinforcements(player);
        console.log(`${player}: ${territories} territories, base reinforcements: ${expected}, actual (with continent bonuses): ${actual}`);
    });
    
    console.log('===== End of Tests =====');
}

// Execute the tests
testArmyRules();