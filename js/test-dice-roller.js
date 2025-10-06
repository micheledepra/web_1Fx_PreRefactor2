/**
 * DICE ROLLER TEST SUITE
 * Tests the enhanced DiceRoller for Risk combat system
 */

// Load DiceRoller
function testDiceRoller() {
    console.log("🎲 TESTING ENHANCED DICE ROLLER 🎲");
    console.log("=" .repeat(50));
    
    const diceRoller = new DiceRoller();
    
    // Test 1: Basic dice rolling
    console.log("\n📍 Test 1: Basic Dice Rolling");
    const basicRolls = diceRoller.rollDice(3);
    console.log(`Rolled 3 dice: [${basicRolls.join(', ')}]`);
    console.log(`All values 1-6: ${basicRolls.every(d => d >= 1 && d <= 6)}`);
    
    // Test 2: Dice sorting
    console.log("\n📍 Test 2: Dice Sorting");
    const unsorted = [3, 6, 1, 4, 2];
    const sorted = diceRoller.sortDiceDescending(unsorted);
    console.log(`Unsorted: [${unsorted.join(', ')}]`);
    console.log(`Sorted:   [${sorted.join(', ')}]`);
    
    // Test 3: Dice comparison
    console.log("\n📍 Test 3: Dice Comparison (Official Risk Rules)");
    const attackerDice = [6, 4, 2];
    const defenderDice = [5, 3];
    const comparison = diceRoller.compareDiceAndDetermineCasualties(attackerDice, defenderDice);
    console.log(`Attacker: [${attackerDice.join(', ')}]`);
    console.log(`Defender: [${defenderDice.join(', ')}]`);
    console.log(`Comparisons:`, comparison.comparisons);
    console.log(`Attacker losses: ${comparison.attackerLosses}`);
    console.log(`Defender losses: ${comparison.defenderLosses}`);
    
    // Test 4: Army validation
    console.log("\n📍 Test 4: Army Validation");
    const validAttack = diceRoller.validateArmiesForCombat(5, 3);
    const invalidAttack = diceRoller.validateArmiesForCombat(1, 3);
    console.log(`5 vs 3 armies - Valid: ${validAttack.valid}`);
    console.log(`1 vs 3 armies - Valid: ${invalidAttack.valid}, Errors: ${invalidAttack.errors}`);
    
    // Test 5: Full combat round
    console.log("\n📍 Test 5: Full Combat Round");
    const combatResult = diceRoller.performCombatRound(5, 3, 3, 2);
    console.log(`Combat: 5 attacker armies vs 3 defender armies`);
    console.log(`Result:`, combatResult.success ? 'Success' : combatResult.error);
    if (combatResult.success) {
        console.log(`Attacker rolled: [${combatResult.attackerRolls.join(', ')}]`);
        console.log(`Defender rolled: [${combatResult.defenderRolls.join(', ')}]`);
        console.log(`Attacker lost: ${combatResult.attackerLosses} armies`);
        console.log(`Defender lost: ${combatResult.defenderLosses} armies`);
        console.log(`Territory conquered: ${combatResult.territoryConquered}`);
    }
    
    // Test 6: Combat odds simulation
    console.log("\n📍 Test 6: Combat Odds Simulation");
    const odds = diceRoller.simulateCombatOdds(10, 5, 100);
    console.log(`10 vs 5 armies (100 simulations):`);
    console.log(`Attacker win probability: ${odds.attackerWinProbability}%`);
    console.log(`Defender win probability: ${odds.defenderWinProbability}%`);
    console.log(`Average battles per war: ${odds.averageBattles}`);
    
    // Test 7: Dice statistics
    console.log("\n📍 Test 7: Dice Statistics");
    const testDice = [6, 5, 4, 3, 2, 1, 6, 5];
    const stats = diceRoller.getDiceStatistics(testDice);
    console.log(`Dice: [${testDice.join(', ')}]`);
    console.log(`Statistics:`, stats);
    
    // Test 8: Maximum dice validation
    console.log("\n📍 Test 8: Maximum Dice Counts");
    console.log(`Attacker with 10 armies: max ${diceRoller.getMaxDiceCount(10, 'attacker')} dice`);
    console.log(`Attacker with 2 armies: max ${diceRoller.getMaxDiceCount(2, 'attacker')} dice`);
    console.log(`Defender with 5 armies: max ${diceRoller.getMaxDiceCount(5, 'defender')} dice`);
    console.log(`Defender with 1 army: max ${diceRoller.getMaxDiceCount(1, 'defender')} dice`);
    
    console.log("\n" + "=" .repeat(50));
    console.log("✅ ALL DICE ROLLER TESTS COMPLETED!");
    console.log("🎯 Official Risk Rules Implemented:");
    console.log("   • Max 3 attacker dice, 2 defender dice");
    console.log("   • Defender wins ties");
    console.log("   • Dice compared highest to lowest");
    console.log("   • Army validation enforced");
    console.log("   • Combat odds simulation available");
}

// Run tests when page loads
if (typeof window !== 'undefined') {
    window.testDiceRoller = testDiceRoller;
    console.log("🧪 DiceRoller test available: Run testDiceRoller() in console");
}

// Auto-run if DiceRoller is available
if (typeof DiceRoller !== 'undefined') {
    // Run tests after a short delay to ensure everything is loaded
    setTimeout(testDiceRoller, 1000);
}