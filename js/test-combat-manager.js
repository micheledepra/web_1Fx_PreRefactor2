/**
 * CombatManager Test Suite
 * 
 * Comprehensive tests for the CombatManager class
 * Tests all core functionality including combat initiation, battle processing,
 * validation, and territory occupation.
 */

// Mock game state for testing
function createMockGameState() {
    return {
        currentPlayer: 'Player 1',
        territories: {
            'Alaska': {
                id: 'Alaska',
                owner: 'Player 1',
                armies: 5,
                neighbors: ['Kamchatka', 'NorthwestTerritory', 'Alberta']
            },
            'Kamchatka': {
                id: 'Kamchatka',
                owner: 'Player 2',
                armies: 3,
                neighbors: ['Alaska', 'Yakutsk', 'Japan', 'Mongolia']
            },
            'NorthwestTerritory': {
                id: 'NorthwestTerritory',
                owner: 'Player 1',
                armies: 2,
                neighbors: ['Alaska', 'Alberta', 'Greenland']
            },
            'Alberta': {
                id: 'Alberta',
                owner: 'Player 1',
                armies: 1,
                neighbors: ['Alaska', 'NorthwestTerritory', 'Ontario']
            }
        },
        getCurrentPlayer: function() {
            return this.currentPlayer;
        }
    };
}

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function assert(condition, testName, errorMessage) {
    if (condition) {
        testResults.passed++;
        testResults.tests.push({ name: testName, passed: true });
        console.log('✅ PASS:', testName);
        return true;
    } else {
        testResults.failed++;
        testResults.tests.push({ name: testName, passed: false, error: errorMessage });
        console.error('❌ FAIL:', testName);
        console.error('   Error:', errorMessage);
        return false;
    }
}

function assertEquals(actual, expected, testName) {
    return assert(
        actual === expected,
        testName,
        `Expected ${expected}, but got ${actual}`
    );
}

function assertNotNull(value, testName) {
    return assert(
        value !== null && value !== undefined,
        testName,
        'Value is null or undefined'
    );
}

// Test Suite
function runCombatManagerTests() {
    console.log('='.repeat(60));
    console.log('COMBAT MANAGER TEST SUITE');
    console.log('='.repeat(60));
    
    // Test 1: Constructor
    testConstructor();
    
    // Test 2: Combat Initiation
    testCombatInitiation();
    
    // Test 3: Attack Validation
    testAttackValidation();
    
    // Test 4: Battle Options
    testBattleOptions();
    
    // Test 5: Battle Processing
    testBattleProcessing();
    
    // Test 6: Battle Result Validation
    testBattleResultValidation();
    
    // Test 7: Territory Occupation
    testTerritoryOccupation();
    
    // Test 8: Combat Completion
    testCombatCompletion();
    
    // Test 9: Multiple Rounds
    testMultipleRounds();
    
    // Test 10: Attackable Targets
    testAttackableTargets();
    
    // Print summary
    printTestSummary();
}

function testConstructor() {
    console.log('\n--- Test Group: Constructor ---');
    
    try {
        const gameState = createMockGameState();
        const manager = new CombatManager(gameState);
        
        assert(manager !== null, 'Constructor creates instance');
        assert(manager.gameState === gameState, 'Constructor stores game state');
        assert(manager.activeCombat === null, 'Constructor initializes with no active combat');
        assert(manager.RULES.MIN_ARMIES_TO_ATTACK === 2, 'Constructor sets correct MIN_ARMIES_TO_ATTACK');
        
    } catch (error) {
        assert(false, 'Constructor handles valid game state', error.message);
    }
    
    // Test invalid constructor
    try {
        const manager = new CombatManager(null);
        assert(false, 'Constructor rejects null game state', 'Should throw error');
    } catch (error) {
        assert(true, 'Constructor rejects null game state');
    }
}

function testCombatInitiation() {
    console.log('\n--- Test Group: Combat Initiation ---');
    
    const gameState = createMockGameState();
    const manager = new CombatManager(gameState);
    
    // Test valid combat initiation
    const result = manager.initiateCombat('Alaska', 'Kamchatka');
    
    assert(result.success === true, 'Valid combat initiation succeeds');
    assertNotNull(result.combat, 'Combat initiation returns combat state');
    assertNotNull(manager.activeCombat, 'Active combat is created');
    
    if (manager.activeCombat) {
        assertEquals(manager.activeCombat.attackingTerritoryId, 'Alaska', 'Attacking territory ID is set');
        assertEquals(manager.activeCombat.defendingTerritoryId, 'Kamchatka', 'Defending territory ID is set');
        assertEquals(manager.activeCombat.initialAttackerArmies, 5, 'Initial attacker armies recorded');
        assertEquals(manager.activeCombat.initialDefenderArmies, 3, 'Initial defender armies recorded');
        assertEquals(manager.activeCombat.totalAttackerLosses, 0, 'Total attacker losses initialized to 0');
        assertEquals(manager.activeCombat.totalDefenderLosses, 0, 'Total defender losses initialized to 0');
        assertEquals(manager.activeCombat.conquered, false, 'Conquered flag initialized to false');
    }
}

function testAttackValidation() {
    console.log('\n--- Test Group: Attack Validation ---');
    
    const gameState = createMockGameState();
    const manager = new CombatManager(gameState);
    
    // Test valid attack
    let validation = manager.validateAttack('Alaska', 'Kamchatka');
    assert(validation.valid === true, 'Valid attack passes validation');
    
    // Test non-existent attacker
    validation = manager.validateAttack('NonExistent', 'Kamchatka');
    assert(validation.valid === false, 'Non-existent attacker fails validation');
    assert(validation.error.includes('does not exist'), 'Non-existent attacker error message');
    
    // Test non-existent defender
    validation = manager.validateAttack('Alaska', 'NonExistent');
    assert(validation.valid === false, 'Non-existent defender fails validation');
    
    // Test insufficient armies
    validation = manager.validateAttack('Alberta', 'NorthwestTerritory');
    assert(validation.valid === false, 'Insufficient armies fails validation');
    assert(validation.error.includes('at least 2 armies'), 'Insufficient armies error message');
    
    // Test non-adjacent territories
    // Alaska and Kamchatka are actually neighbors, but let's test with truly non-adjacent ones
    // We need to add a non-adjacent enemy territory to our mock
    gameState.territories['Brazil'] = {
        id: 'Brazil',
        owner: 'Player 2',
        armies: 3,
        neighbors: ['Venezuela', 'Peru']
    };
    validation = manager.validateAttack('Alaska', 'Brazil');
    assert(validation.valid === false, 'Non-adjacent territories fail validation');
    assert(validation.error && validation.error.includes('adjacent'), 'Non-adjacent error message');
    
    // Test same owner
    validation = manager.validateAttack('Alaska', 'NorthwestTerritory');
    assert(validation.valid === false, 'Same owner fails validation');
    assert(validation.error.includes('own territory'), 'Same owner error message');
}

function testBattleOptions() {
    console.log('\n--- Test Group: Battle Options ---');
    
    const gameState = createMockGameState();
    const manager = new CombatManager(gameState);
    
    // Test without active combat
    let options = manager.getBattleOptions();
    assert(options === null, 'No options without active combat');
    
    // Test with active combat
    manager.initiateCombat('Alaska', 'Kamchatka');
    options = manager.getBattleOptions();
    
    assertNotNull(options, 'Options returned with active combat');
    
    if (options) {
        assertEquals(options.attackerArmies, 5, 'Correct attacker army count');
        assertEquals(options.defenderArmies, 3, 'Correct defender army count');
        assertEquals(options.attackingTerritoryId, 'Alaska', 'Correct attacking territory ID');
        assertEquals(options.defendingTerritoryId, 'Kamchatka', 'Correct defending territory ID');
        
        // Max dice calculation
        // Attacker: min(3, 5-1) = 3
        assertEquals(options.maxAttackingDice, 3, 'Correct max attacking dice');
        // Defender: min(2, 3) = 2
        assertEquals(options.maxDefendingDice, 2, 'Correct max defending dice');
        
        assert(options.canContinue === true, 'Combat can continue');
    }
}

function testBattleProcessing() {
    console.log('\n--- Test Group: Battle Processing ---');
    
    const gameState = createMockGameState();
    const manager = new CombatManager(gameState);
    
    // Test without active combat
    let result = manager.processBattleResult({
        attackerRemainingArmies: 4,
        defenderRemainingArmies: 2
    });
    assert(result.success === false, 'Battle processing fails without active combat');
    
    // Test with active combat
    manager.initiateCombat('Alaska', 'Kamchatka');
    
    result = manager.processBattleResult({
        attackerRemainingArmies: 4,  // Lost 1
        defenderRemainingArmies: 2   // Lost 1
    });
    
    assert(result.success === true, 'Valid battle processing succeeds');
    assertEquals(result.attackerLosses, 1, 'Correct attacker losses calculated');
    assertEquals(result.defenderLosses, 1, 'Correct defender losses calculated');
    assertEquals(result.attackerRemainingArmies, 4, 'Correct attacker remaining armies');
    assertEquals(result.defenderRemainingArmies, 2, 'Correct defender remaining armies');
    assert(result.territoryConquered === false, 'Territory not conquered with defender armies > 0');
    assertEquals(result.roundsCompleted, 1, 'Round counter incremented');
    
    // Verify armies updated in game state
    assertEquals(gameState.territories.Alaska.armies, 4, 'Attacker armies updated in game state');
    assertEquals(gameState.territories.Kamchatka.armies, 2, 'Defender armies updated in game state');
}

function testBattleResultValidation() {
    console.log('\n--- Test Group: Battle Result Validation ---');
    
    const gameState = createMockGameState();
    const manager = new CombatManager(gameState);
    manager.initiateCombat('Alaska', 'Kamchatka');
    
    // Test valid result
    let validation = manager.validateBattleResult({
        attackerRemainingArmies: 4,
        defenderRemainingArmies: 2
    });
    assert(validation.valid === true, 'Valid battle result passes validation');
    
    // Test attacker with 0 armies
    validation = manager.validateBattleResult({
        attackerRemainingArmies: 0,
        defenderRemainingArmies: 3
    });
    assert(validation.valid === false, 'Attacker with 0 armies fails validation');
    assert(validation.error.includes('at least 1 army'), 'Attacker 0 armies error message');
    
    // Test negative defender armies
    validation = manager.validateBattleResult({
        attackerRemainingArmies: 4,
        defenderRemainingArmies: -1
    });
    assert(validation.valid === false, 'Negative defender armies fails validation');
    
    // Test exceeding current armies
    validation = manager.validateBattleResult({
        attackerRemainingArmies: 10,
        defenderRemainingArmies: 3
    });
    assert(validation.valid === false, 'Exceeding attacker armies fails validation');
    
    validation = manager.validateBattleResult({
        attackerRemainingArmies: 5,
        defenderRemainingArmies: 10
    });
    assert(validation.valid === false, 'Exceeding defender armies fails validation');
    
    // Test no casualties
    validation = manager.validateBattleResult({
        attackerRemainingArmies: 5,
        defenderRemainingArmies: 3
    });
    assert(validation.valid === false, 'No casualties fails validation');
    assert(validation.error && validation.error.toLowerCase().includes('at least one side must lose'), 'No casualties error message');
    
    // Test too many losses (>2 per round)
    validation = manager.validateBattleResult({
        attackerRemainingArmies: 2,  // Lost 3
        defenderRemainingArmies: 3
    });
    assert(validation.valid === false, 'Attacker losing >2 armies fails validation');
    
    validation = manager.validateBattleResult({
        attackerRemainingArmies: 5,
        defenderRemainingArmies: 0   // Lost 3 (but OK if eliminated)
    });
    assert(validation.valid === true, 'Defender can lose all armies when eliminated');
}

function testTerritoryOccupation() {
    console.log('\n--- Test Group: Territory Occupation ---');
    
    const gameState = createMockGameState();
    const manager = new CombatManager(gameState);
    
    // Test without active combat
    let result = manager.occupyTerritory(3);
    assert(result.success === false, 'Occupation fails without active combat');
    
    // Test without conquest
    manager.initiateCombat('Alaska', 'Kamchatka');
    result = manager.occupyTerritory(3);
    assert(result.success === false, 'Occupation fails without conquest');
    
    // Conquer territory
    manager.processBattleResult({
        attackerRemainingArmies: 4,
        defenderRemainingArmies: 0  // Conquered
    });
    
    // Test valid occupation
    result = manager.occupyTerritory(3);
    assert(result.success === true, 'Valid occupation succeeds');
    assertEquals(gameState.territories.Alaska.armies, 1, 'Correct armies remain in attacking territory');
    assertEquals(gameState.territories.Kamchatka.armies, 3, 'Correct armies moved to conquered territory');
    assertEquals(gameState.territories.Kamchatka.owner, 'Player 1', 'Territory ownership transferred');
    
    // Reset for more tests
    gameState.territories.Alaska.armies = 5;
    gameState.territories.Kamchatka.armies = 3;
    gameState.territories.Kamchatka.owner = 'Player 2';
    manager.activeCombat = null;
    
    manager.initiateCombat('Alaska', 'Kamchatka');
    manager.processBattleResult({
        attackerRemainingArmies: 4,
        defenderRemainingArmies: 0
    });
    
    // Test insufficient armies to move
    result = manager.occupyTerritory(0);
    assert(result.success === false, 'Occupation with 0 armies fails');
    
    // Test leaving no armies
    result = manager.occupyTerritory(4);
    assert(result.success === false, 'Occupation leaving 0 armies fails');
}

function testCombatCompletion() {
    console.log('\n--- Test Group: Combat Completion ---');
    
    const gameState = createMockGameState();
    const manager = new CombatManager(gameState);
    
    // Test ending without combat
    let result = manager.endCombat();
    assert(result.success === false, 'End combat fails without active combat');
    
    // Start and end combat
    manager.initiateCombat('Alaska', 'Kamchatka');
    manager.processBattleResult({
        attackerRemainingArmies: 4,
        defenderRemainingArmies: 2
    });
    
    result = manager.endCombat();
    assert(result.success === true, 'End combat succeeds');
    assertEquals(result.attackingTerritory, 'Alaska', 'Summary has attacking territory');
    assertEquals(result.defendingTerritory, 'Kamchatka', 'Summary has defending territory');
    assertEquals(result.totalAttackerLosses, 1, 'Summary has total attacker losses');
    assertEquals(result.totalDefenderLosses, 1, 'Summary has total defender losses');
    assertEquals(result.roundsCompleted, 1, 'Summary has rounds completed');
    assert(manager.activeCombat === null, 'Active combat cleared after end');
}

function testMultipleRounds() {
    console.log('\n--- Test Group: Multiple Battle Rounds ---');
    
    const gameState = createMockGameState();
    const manager = new CombatManager(gameState);
    
    manager.initiateCombat('Alaska', 'Kamchatka');
    
    // Round 1
    let result = manager.processBattleResult({
        attackerRemainingArmies: 4,
        defenderRemainingArmies: 2
    });
    assertEquals(result.roundsCompleted, 1, 'Round 1 completed');
    assertEquals(result.totalAttackerLosses, 1, 'Total attacker losses after round 1');
    assertEquals(result.totalDefenderLosses, 1, 'Total defender losses after round 1');
    
    // Round 2
    result = manager.processBattleResult({
        attackerRemainingArmies: 3,
        defenderRemainingArmies: 1
    });
    assertEquals(result.roundsCompleted, 2, 'Round 2 completed');
    assertEquals(result.totalAttackerLosses, 2, 'Total attacker losses after round 2');
    assertEquals(result.totalDefenderLosses, 2, 'Total defender losses after round 2');
    
    // Round 3 - conquest
    result = manager.processBattleResult({
        attackerRemainingArmies: 2,
        defenderRemainingArmies: 0
    });
    assertEquals(result.roundsCompleted, 3, 'Round 3 completed');
    assert(result.territoryConquered === true, 'Territory conquered in round 3');
    assertEquals(result.totalAttackerLosses, 3, 'Total attacker losses after conquest');
    assertEquals(result.totalDefenderLosses, 3, 'Total defender losses after conquest');
}

function testAttackableTargets() {
    console.log('\n--- Test Group: Attackable Targets ---');
    
    const gameState = createMockGameState();
    const manager = new CombatManager(gameState);
    
    // Test territory with valid targets
    let targets = manager.getAttackableTargets('Alaska');
    assert(targets.length === 1, 'Alaska has 1 attackable target (Kamchatka)');
    assert(targets.includes('Kamchatka'), 'Kamchatka is attackable from Alaska');
    
    // Test territory with insufficient armies
    targets = manager.getAttackableTargets('Alberta');
    assert(targets.length === 0, 'Alberta has no attackable targets (insufficient armies)');
    
    // Test territory with no enemy neighbors
    targets = manager.getAttackableTargets('NorthwestTerritory');
    assert(targets.length === 0, 'NorthwestTerritory has no enemy neighbors');
    
    // Test non-existent territory
    targets = manager.getAttackableTargets('NonExistent');
    assert(targets.length === 0, 'Non-existent territory returns empty array');
}

function printTestSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
        console.log('\nFailed Tests:');
        testResults.tests.filter(t => !t.passed).forEach(test => {
            console.log(`  ❌ ${test.name}`);
            if (test.error) {
                console.log(`     ${test.error}`);
            }
        });
    }
    
    console.log('='.repeat(60));
}

// Auto-run tests if loaded in browser
if (typeof window !== 'undefined' && typeof CombatManager !== 'undefined') {
    console.log('CombatManager detected. Running tests...\n');
    runCombatManagerTests();
} else if (typeof window !== 'undefined') {
    console.log('⚠️ CombatManager not loaded. Tests will run once CombatManager.js is loaded.');
    // Try to run after a short delay
    setTimeout(() => {
        if (typeof CombatManager !== 'undefined') {
            runCombatManagerTests();
        }
    }, 1000);
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runCombatManagerTests,
        createMockGameState
    };
}
