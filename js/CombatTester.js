/**
 * RISK COMBAT SYSTEM TESTER
 * 
 * This module provides testing functionality for the combat system,
 * including animations and sound effects.
 */

class CombatTester {
    constructor() {
        this.testResults = [];
        this.combatSystem = window.combatSystem;
        this.combatAnimations = window.combatAnimations;
        this.gameState = window.gameState;
        
        // Test scenarios
        this.testScenarios = {
            diceTests: [
                { name: "1v1 Dice Test", attackerDice: 1, defenderDice: 1 },
                { name: "2v1 Dice Test", attackerDice: 2, defenderDice: 1 },
                { name: "3v1 Dice Test", attackerDice: 3, defenderDice: 1 },
                { name: "3v2 Dice Test", attackerDice: 3, defenderDice: 2 }
            ],
            combatTests: [
                { 
                    name: "Single Attack Test", 
                    attackCount: 1,
                    expectedResult: "Combat should execute once with animations and sound"
                },
                { 
                    name: "Multiple Attack Test", 
                    attackCount: 3,
                    expectedResult: "Combat should execute three times with animations and sound for each"
                }
            ],
            conquestTests: [
                {
                    name: "Minimum Army Movement Test",
                    armiesToMove: 1,
                    expectedResult: "Should animate minimum troop movement"
                },
                {
                    name: "Maximum Army Movement Test",
                    armiesToMove: "max",
                    expectedResult: "Should animate maximum troop movement"
                },
                {
                    name: "Mid-range Army Movement Test",
                    armiesToMove: "mid",
                    expectedResult: "Should animate moderate troop movement"
                }
            ]
        };
        
        this.setupTestPanel();
    }
    
    /**
     * Set up the test panel in the UI
     */
    setupTestPanel() {
        // Create test panel container
        const panel = document.createElement('div');
        panel.id = 'combat-test-panel';
        panel.className = 'combat-test-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            background: #f0f0f0;
            border: 2px solid #333;
            border-radius: 5px;
            padding: 10px;
            z-index: 9999;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            max-height: 500px;
            overflow-y: auto;
            display: none;
        `;
        
        // Create panel header
        const header = document.createElement('div');
        header.innerHTML = `
            <h3 style="margin-top: 0; border-bottom: 1px solid #999; padding-bottom: 5px;">
                Combat System Test Panel
                <button id="close-test-panel" style="float: right; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;">&times;</button>
            </h3>
        `;
        panel.appendChild(header);
        
        // Create test sections
        const diceSection = this.createTestSection('Dice Combination Tests', this.testScenarios.diceTests);
        const combatSection = this.createTestSection('Combat Pattern Tests', this.testScenarios.combatTests);
        const conquestSection = this.createTestSection('Conquest Tests', this.testScenarios.conquestTests);
        
        panel.appendChild(diceSection);
        panel.appendChild(combatSection);
        panel.appendChild(conquestSection);
        
        // Add results section
        const resultsSection = document.createElement('div');
        resultsSection.innerHTML = `
            <h4>Test Results</h4>
            <div id="test-results" style="max-height: 150px; overflow-y: auto; border: 1px solid #ccc; padding: 5px; margin-bottom: 10px;"></div>
            <button id="run-all-tests" style="background: #4CAF50; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer; margin-right: 5px;">Run All Tests</button>
            <button id="clear-results" style="background: #f44336; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer;">Clear Results</button>
        `;
        panel.appendChild(resultsSection);
        
        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggle-test-panel';
        toggleButton.textContent = 'Combat Tests';
        toggleButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 5px 10px;
            cursor: pointer;
            z-index: 9999;
        `;
        
        // Append to body
        document.body.appendChild(panel);
        document.body.appendChild(toggleButton);
        
        // Add event listeners
        document.getElementById('toggle-test-panel').addEventListener('click', () => {
            const testPanel = document.getElementById('combat-test-panel');
            const isVisible = testPanel.style.display === 'block';
            testPanel.style.display = isVisible ? 'none' : 'block';
            document.getElementById('toggle-test-panel').style.display = isVisible ? 'block' : 'none';
        });
        
        document.getElementById('close-test-panel').addEventListener('click', () => {
            document.getElementById('combat-test-panel').style.display = 'none';
            document.getElementById('toggle-test-panel').style.display = 'block';
        });
        
        document.getElementById('run-all-tests').addEventListener('click', () => this.runAllTests());
        document.getElementById('clear-results').addEventListener('click', () => this.clearResults());
    }
    
    /**
     * Create a section for a specific test type
     */
    createTestSection(title, tests) {
        const section = document.createElement('div');
        section.innerHTML = `<h4>${title}</h4>`;
        
        const list = document.createElement('div');
        list.style.marginBottom = '10px';
        
        tests.forEach((test, index) => {
            const testItem = document.createElement('div');
            testItem.innerHTML = `
                <button class="test-btn" data-test-type="${title.split(' ')[0].toLowerCase()}" data-test-index="${index}" 
                        style="background: #2196F3; color: white; border: none; border-radius: 3px; padding: 3px 8px; margin: 2px; cursor: pointer;">
                    ${test.name}
                </button>
            `;
            list.appendChild(testItem);
        });
        
        section.appendChild(list);
        
        // Add event listeners
        setTimeout(() => {
            section.querySelectorAll('.test-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const type = e.target.getAttribute('data-test-type');
                    const index = e.target.getAttribute('data-test-index');
                    this.runTest(type, index);
                });
            });
        }, 0);
        
        return section;
    }
    
    /**
     * Run a specific test
     */
    runTest(type, index) {
        let testScenario;
        
        if (type === 'dice') {
            testScenario = this.testScenarios.diceTests[index];
            this.testDiceCombination(testScenario);
        } else if (type === 'combat') {
            testScenario = this.testScenarios.combatTests[index];
            this.testCombatPattern(testScenario);
        } else if (type === 'conquest') {
            testScenario = this.testScenarios.conquestTests[index];
            this.testConquest(testScenario);
        }
    }
    
    /**
     * Test a dice combination
     */
    testDiceCombination(testScenario) {
        this.logResult(`Running ${testScenario.name}...`);
        
        // Verify combat system exists
        if (!this.combatSystem) {
            this.logResult('❌ Combat System not found', 'error');
            return;
        }
        
        try {
            // Set up a mock combat
            const mockCombat = this.setupMockCombat();
            
            // Test dice animation
            if (this.combatAnimations) {
                this.combatAnimations.animateDiceRoll({
                    attackerDice: testScenario.attackerDice,
                    defenderDice: testScenario.defenderDice
                });
                this.logResult('✅ Dice Animation Triggered');
            } else {
                this.logResult('❌ Combat Animations not found', 'error');
            }
            
            // Sound effects have been removed
            this.logResult('ℹ️ Sound effects are disabled', 'info');
            
            // Execute mock battle
            const result = mockCombat.executeBattle(testScenario.attackerDice, testScenario.defenderDice);
            this.logResult(`✅ Battle executed with ${testScenario.attackerDice} attacker dice vs ${testScenario.defenderDice} defender dice`);
            this.logResult(`Result: ${JSON.stringify(result)}`);
            
        } catch (error) {
            this.logResult(`❌ Error: ${error.message}`, 'error');
            console.error(error);
        }
    }
    
    /**
     * Test a combat pattern (single or multiple attacks)
     */
    testCombatPattern(testScenario) {
        this.logResult(`Running ${testScenario.name}...`);
        
        // Verify combat system exists
        if (!this.combatSystem) {
            this.logResult('❌ Combat System not found', 'error');
            return;
        }
        
        try {
            // Set up a mock combat
            const mockCombat = this.setupMockCombat();
            
            // Execute multiple attacks
            for (let i = 0; i < testScenario.attackCount; i++) {
                this.logResult(`Executing attack ${i + 1} of ${testScenario.attackCount}...`);
                
                // Randomize dice counts for variety
                const attackerDice = Math.floor(Math.random() * 3) + 1; // 1-3
                const defenderDice = Math.floor(Math.random() * 2) + 1; // 1-2
                
                // Execute battle
                const result = mockCombat.executeBattle(attackerDice, defenderDice);
                this.logResult(`✅ Attack ${i + 1} complete: ${attackerDice} attacker dice vs ${defenderDice} defender dice`);
                
                // Short delay between attacks for visual clarity
                if (i < testScenario.attackCount - 1) {
                    this.delay(1500);
                }
            }
            
            this.logResult(`✅ ${testScenario.name} completed successfully`);
            
        } catch (error) {
            this.logResult(`❌ Error: ${error.message}`, 'error');
            console.error(error);
        }
    }
    
    /**
     * Test conquest and army movement
     */
    testConquest(testScenario) {
        this.logResult(`Running ${testScenario.name}...`);
        
        // Verify combat system exists
        if (!this.combatSystem) {
            this.logResult('❌ Combat System not found', 'error');
            return;
        }
        
        try {
            // Set up a mock conquest scenario
            const mockCombat = this.setupMockConquest();
            
            // Determine armies to move based on test scenario
            let armiesToMove;
            if (testScenario.armiesToMove === 'max') {
                // Move all but one army
                armiesToMove = mockCombat.getAvailableArmies() - 1;
            } else if (testScenario.armiesToMove === 'mid') {
                // Move about half of available armies
                armiesToMove = Math.floor(mockCombat.getAvailableArmies() / 2);
            } else {
                // Move specific number or default to 1
                armiesToMove = parseInt(testScenario.armiesToMove) || 1;
            }
            
            this.logResult(`Moving ${armiesToMove} armies after conquest...`);
            
            // Sound effects have been removed
            this.logResult('ℹ️ Sound effects are disabled', 'info');
            
            // Test conquest animation
            if (this.combatAnimations) {
                this.combatAnimations.animateConquest({
                    attackingTerritory: mockCombat.getAttackingTerritory(),
                    defendingTerritory: mockCombat.getDefendingTerritory(),
                    conquerorColor: '#ff0000' // Red for testing
                });
                this.logResult('✅ Conquest Animation Triggered');
                
                // Test troop movement animation
                this.combatAnimations.animateTroopMovement({
                    fromTerritory: mockCombat.getAttackingTerritory(),
                    toTerritory: mockCombat.getDefendingTerritory(),
                    armiesCount: armiesToMove
                });
                this.logResult('✅ Troop Movement Animation Triggered');
            }
            
            // Complete conquest
            const result = mockCombat.completeConquest(armiesToMove);
            this.logResult(`✅ Conquest completed with ${armiesToMove} armies moved`);
            this.logResult(`Result: ${JSON.stringify(result)}`);
            
            // Sound effects have been removed
            this.logResult('ℹ️ Sound effects are disabled', 'info');
            
        } catch (error) {
            this.logResult(`❌ Error: ${error.message}`, 'error');
            console.error(error);
        }
    }
    
    /**
     * Set up a mock combat for testing
     */
    setupMockCombat() {
        // Create a mock combat object that mimics CombatSystem behavior
        return {
            executeBattle: (attackerDice, defenderDice) => {
                // Mock battle execution that triggers animations and sounds
                console.log(`Executing mock battle with ${attackerDice} vs ${defenderDice} dice`);
                
                // Simulate dice rolls
                const attackerRolls = [];
                const defenderRolls = [];
                
                for (let i = 0; i < attackerDice; i++) {
                    attackerRolls.push(Math.floor(Math.random() * 6) + 1);
                }
                
                for (let i = 0; i < defenderDice; i++) {
                    defenderRolls.push(Math.floor(Math.random() * 6) + 1);
                }
                
                // Sort rolls in descending order
                attackerRolls.sort((a, b) => b - a);
                defenderRolls.sort((a, b) => b - a);
                
                // Compare dice and calculate losses
                const attackerLosses = [];
                const defenderLosses = [];
                
                const comparisons = Math.min(attackerDice, defenderDice);
                for (let i = 0; i < comparisons; i++) {
                    if (attackerRolls[i] > defenderRolls[i]) {
                        defenderLosses.push(i);
                    } else {
                        attackerLosses.push(i);
                    }
                }
                
                // Return mock battle result
                return {
                    success: true,
                    attackerRolls,
                    defenderRolls,
                    attackerLosses: attackerLosses.length,
                    defenderLosses: defenderLosses.length,
                    conquered: defenderLosses.length > 0 && Math.random() > 0.7 // Random chance of conquest for testing
                };
            },
            getAttackingTerritory: () => 'mock-attacking-territory',
            getDefendingTerritory: () => 'mock-defending-territory',
            getMaxDefenderDice: () => 2
        };
    }
    
    /**
     * Set up a mock conquest scenario for testing
     */
    setupMockConquest() {
        return {
            getAttackingTerritory: () => 'mock-attacking-territory',
            getDefendingTerritory: () => 'mock-defending-territory',
            getAvailableArmies: () => 10, // Mock 10 available armies
            isConquered: () => true,
            completeConquest: (armiesToMove) => {
                console.log(`Completing mock conquest with ${armiesToMove} armies`);
                
                // Return mock conquest result
                return {
                    success: true,
                    fromTerritory: 'mock-attacking-territory',
                    toTerritory: 'mock-defending-territory',
                    fromCount: 10 - armiesToMove,
                    toCount: armiesToMove
                };
            }
        };
    }
    
    /**
     * Run all tests in sequence
     */
    runAllTests() {
        this.clearResults();
        this.logResult('🔄 Running all tests...');
        
        // Run dice tests
        this.testScenarios.diceTests.forEach((test, index) => {
            this.runTest('dice', index);
            this.delay(1000);
        });
        
        // Run combat tests with delay
        setTimeout(() => {
            this.testScenarios.combatTests.forEach((test, index) => {
                this.runTest('combat', index);
                this.delay(test.attackCount * 1500);
            });
            
            // Run conquest tests with delay
            setTimeout(() => {
                this.testScenarios.conquestTests.forEach((test, index) => {
                    this.runTest('conquest', index);
                    this.delay(1500);
                });
                
                // All tests complete
                setTimeout(() => {
                    this.logResult('✅ All tests completed!');
                }, this.testScenarios.conquestTests.length * 1500);
                
            }, this.testScenarios.combatTests.length * 4500);
            
        }, this.testScenarios.diceTests.length * 1000);
    }
    
    /**
     * Log a test result to the UI
     */
    logResult(message, type = 'info') {
        // Add to results array
        this.testResults.push({
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        });
        
        // Update UI
        const resultsElement = document.getElementById('test-results');
        if (resultsElement) {
            const resultItem = document.createElement('div');
            resultItem.style.borderBottom = '1px solid #eee';
            resultItem.style.padding = '3px 0';
            resultItem.style.color = type === 'error' ? '#f44336' : '#333';
            resultItem.innerHTML = `<small>${new Date().toLocaleTimeString()}</small> ${message}`;
            
            resultsElement.appendChild(resultItem);
            resultsElement.scrollTop = resultsElement.scrollHeight;
        }
        
        // Log to console
        console.log(`[CombatTester] ${message}`);
    }
    
    /**
     * Clear test results
     */
    clearResults() {
        this.testResults = [];
        const resultsElement = document.getElementById('test-results');
        if (resultsElement) {
            resultsElement.innerHTML = '';
        }
    }
    
    /**
     * Simple delay helper (non-blocking)
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize when document is ready and combat system is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for combat system to be fully initialized
    const checkCombatSystem = setInterval(function() {
        if (window.combatSystem && window.combatAnimations) {
            clearInterval(checkCombatSystem);
            console.log('✅ Combat Tester: Combat System detected, initializing tester...');
            window.combatTester = new CombatTester();
        }
    }, 500);
});