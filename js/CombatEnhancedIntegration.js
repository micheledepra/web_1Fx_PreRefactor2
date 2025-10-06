/**
 * RISK COMBAT SYSTEM ENHANCED INTEGRATION
 * 
 * This module adds advanced integration features to the combat system:
 * - Game state tracking and updates
 * - Victory condition checking
 * - Combat statistics tracking
 * - Performance optimization
 */

class CombatStatisticsTracker {
    constructor() {
        // Player statistics
        this.playerStats = {};
        // Territory statistics
        this.territoryStats = {};
        // Global statistics
        this.globalStats = {
            totalBattles: 0,
            totalDiceRolled: 0,
            totalTerritoriesConquered: 0,
            totalArmiesLost: {
                attacker: 0,
                defender: 0
            },
            diceDistribution: {
                1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
            },
            longestBattleRounds: 0,
            fastestConquest: Infinity,
            largestArmyLoss: 0
        };
        
        // Current battle tracking
        this.currentBattle = {
            rounds: 0,
            attackerDiceRolled: 0,
            defenderDiceRolled: 0,
            attackerLosses: 0,
            defenderLosses: 0,
            startTime: null
        };
        
        this.setupStatsDisplay();
    }
    
    /**
     * Initialize player statistics for all players
     */
    initializePlayerStats(players) {
        players.forEach(playerId => {
            this.playerStats[playerId] = {
                battlesInitiated: 0,
                battlesDefended: 0,
                attackerWins: 0,
                defenderWins: 0,
                territoriesConquered: 0,
                territoriesLost: 0,
                armiesLost: 0,
                armiesDefeated: 0,
                diceRolled: 0,
                diceRollAverage: 0,
                totalDiceValue: 0,
                luckIndex: 0 // Positive means luckier than average
            };
        });
    }
    
    /**
     * Set up stats display in UI
     */
    setupStatsDisplay() {
        // Create stats panel container (hidden initially)
        const panel = document.createElement('div');
        panel.id = 'combat-stats-panel';
        panel.className = 'combat-stats-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 350px;
            background: #f0f0f0;
            border: 2px solid #333;
            border-radius: 5px;
            padding: 10px;
            z-index: 9998;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            max-height: 80%;
            overflow-y: auto;
            display: none;
        `;
        
        // Create panel header
        const header = document.createElement('div');
        header.innerHTML = `
            <h3 style="margin-top: 0; border-bottom: 1px solid #999; padding-bottom: 5px;">
                Combat Statistics
                <button id="close-stats-panel" style="float: right; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;">&times;</button>
            </h3>
        `;
        panel.appendChild(header);
        
        // Create stats sections
        const globalStatsSection = document.createElement('div');
        globalStatsSection.innerHTML = `
            <h4>Global Statistics</h4>
            <div id="global-stats-content" class="stats-content">
                <p>No battles recorded yet</p>
            </div>
        `;
        panel.appendChild(globalStatsSection);
        
        const playerStatsSection = document.createElement('div');
        playerStatsSection.innerHTML = `
            <h4>Player Statistics</h4>
            <div id="player-stats-content" class="stats-content">
                <p>No player data available</p>
            </div>
        `;
        panel.appendChild(playerStatsSection);
        
        // Add dice distribution chart container
        const chartSection = document.createElement('div');
        chartSection.innerHTML = `
            <h4>Dice Roll Distribution</h4>
            <div id="dice-distribution-chart" style="height: 150px; background: #fff; border: 1px solid #ccc; padding: 5px; margin-bottom: 10px;">
                <div id="dice-chart-bars" style="display: flex; height: 120px; align-items: flex-end; padding-top: 10px;">
                    <div class="dice-bar" data-value="1" style="flex: 1; margin: 0 3px; background: #4CAF50; position: relative;">
                        <div class="dice-bar-fill" style="width: 100%; height: 0%; background: #4CAF50; position: absolute; bottom: 0;"></div>
                        <div style="position: absolute; bottom: -20px; width: 100%; text-align: center;">1</div>
                    </div>
                    <div class="dice-bar" data-value="2" style="flex: 1; margin: 0 3px; background: #8BC34A; position: relative;">
                        <div class="dice-bar-fill" style="width: 100%; height: 0%; background: #8BC34A; position: absolute; bottom: 0;"></div>
                        <div style="position: absolute; bottom: -20px; width: 100%; text-align: center;">2</div>
                    </div>
                    <div class="dice-bar" data-value="3" style="flex: 1; margin: 0 3px; background: #CDDC39; position: relative;">
                        <div class="dice-bar-fill" style="width: 100%; height: 0%; background: #CDDC39; position: absolute; bottom: 0;"></div>
                        <div style="position: absolute; bottom: -20px; width: 100%; text-align: center;">3</div>
                    </div>
                    <div class="dice-bar" data-value="4" style="flex: 1; margin: 0 3px; background: #FFC107; position: relative;">
                        <div class="dice-bar-fill" style="width: 100%; height: 0%; background: #FFC107; position: absolute; bottom: 0;"></div>
                        <div style="position: absolute; bottom: -20px; width: 100%; text-align: center;">4</div>
                    </div>
                    <div class="dice-bar" data-value="5" style="flex: 1; margin: 0 3px; background: #FF9800; position: relative;">
                        <div class="dice-bar-fill" style="width: 100%; height: 0%; background: #FF9800; position: absolute; bottom: 0;"></div>
                        <div style="position: absolute; bottom: -20px; width: 100%; text-align: center;">5</div>
                    </div>
                    <div class="dice-bar" data-value="6" style="flex: 1; margin: 0 3px; background: #FF5722; position: relative;">
                        <div class="dice-bar-fill" style="width: 100%; height: 0%; background: #FF5722; position: absolute; bottom: 0;"></div>
                        <div style="position: absolute; bottom: -20px; width: 100%; text-align: center;">6</div>
                    </div>
                </div>
            </div>
        `;
        panel.appendChild(chartSection);
        
        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggle-stats-panel';
        toggleButton.textContent = 'Combat Stats';
        toggleButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 5px 10px;
            cursor: pointer;
            z-index: 9998;
        `;
        
        // Append to body
        document.body.appendChild(panel);
        document.body.appendChild(toggleButton);
        
        // Add event listeners
        document.getElementById('toggle-stats-panel').addEventListener('click', () => {
            const statsPanel = document.getElementById('combat-stats-panel');
            const isVisible = statsPanel.style.display === 'block';
            statsPanel.style.display = isVisible ? 'none' : 'block';
            document.getElementById('toggle-stats-panel').style.display = isVisible ? 'block' : 'none';
            
            // Update stats when opening
            if (!isVisible) {
                this.updateStatsDisplay();
            }
        });
        
        document.getElementById('close-stats-panel').addEventListener('click', () => {
            document.getElementById('combat-stats-panel').style.display = 'none';
            document.getElementById('toggle-stats-panel').style.display = 'block';
        });
    }
    
    /**
     * Record the start of a new battle
     */
    startBattle(attackingPlayerId, defendingPlayerId, attackingTerritory, defendingTerritory) {
        this.currentBattle = {
            rounds: 0,
            attackerDiceRolled: 0,
            defenderDiceRolled: 0,
            attackerLosses: 0,
            defenderLosses: 0,
            startTime: Date.now(),
            attackingPlayerId,
            defendingPlayerId,
            attackingTerritory,
            defendingTerritory
        };
        
        // Increment battle counts for players
        if (this.playerStats[attackingPlayerId]) {
            this.playerStats[attackingPlayerId].battlesInitiated++;
        }
        if (this.playerStats[defendingPlayerId]) {
            this.playerStats[defendingPlayerId].battlesDefended++;
        }
    }
    
    /**
     * Record a battle round
     */
    recordBattleRound(attackerDice, defenderDice, attackerRolls, defenderRolls, attackerLosses, defenderLosses) {
        this.currentBattle.rounds++;
        this.currentBattle.attackerDiceRolled += attackerDice;
        this.currentBattle.defenderDiceRolled += defenderDice;
        this.currentBattle.attackerLosses += attackerLosses;
        this.currentBattle.defenderLosses += defenderLosses;
        
        // Update global stats
        this.globalStats.totalBattles++;
        this.globalStats.totalDiceRolled += (attackerDice + defenderDice);
        this.globalStats.totalArmiesLost.attacker += attackerLosses;
        this.globalStats.totalArmiesLost.defender += defenderLosses;
        
        // Update player stats
        const attackingPlayerId = this.currentBattle.attackingPlayerId;
        const defendingPlayerId = this.currentBattle.defendingPlayerId;
        
        if (this.playerStats[attackingPlayerId]) {
            const attackerStats = this.playerStats[attackingPlayerId];
            attackerStats.diceRolled += attackerDice;
            attackerStats.armiesLost += attackerLosses;
            
            // Track dice values
            attackerRolls.forEach(roll => {
                this.globalStats.diceDistribution[roll]++;
                attackerStats.totalDiceValue += roll;
            });
            
            // Update dice average
            attackerStats.diceRollAverage = attackerStats.totalDiceValue / attackerStats.diceRolled;
        }
        
        if (this.playerStats[defendingPlayerId]) {
            const defenderStats = this.playerStats[defendingPlayerId];
            defenderStats.diceRolled += defenderDice;
            defenderStats.armiesLost += defenderLosses;
            
            // Track dice values
            defenderRolls.forEach(roll => {
                this.globalStats.diceDistribution[roll]++;
                defenderStats.totalDiceValue += roll;
            });
            
            // Update dice average
            defenderStats.diceRollAverage = defenderStats.totalDiceValue / defenderStats.diceRolled;
        }
        
        // Track round winners
        if (attackerLosses < defenderLosses && this.playerStats[attackingPlayerId]) {
            this.playerStats[attackingPlayerId].attackerWins++;
            this.playerStats[attackingPlayerId].armiesDefeated += defenderLosses;
        }
        
        if (defenderLosses < attackerLosses && this.playerStats[defendingPlayerId]) {
            this.playerStats[defendingPlayerId].defenderWins++;
            this.playerStats[defendingPlayerId].armiesDefeated += attackerLosses;
        }
    }
    
    /**
     * Record a conquest
     */
    recordConquest(armiesToMove) {
        this.globalStats.totalTerritoriesConquered++;
        
        // Calculate battle duration
        const duration = (Date.now() - this.currentBattle.startTime) / 1000; // in seconds
        
        // Update global stats for records
        if (this.currentBattle.rounds > this.globalStats.longestBattleRounds) {
            this.globalStats.longestBattleRounds = this.currentBattle.rounds;
        }
        
        if (duration < this.globalStats.fastestConquest) {
            this.globalStats.fastestConquest = duration;
        }
        
        const totalLosses = this.currentBattle.attackerLosses + this.currentBattle.defenderLosses;
        if (totalLosses > this.globalStats.largestArmyLoss) {
            this.globalStats.largestArmyLoss = totalLosses;
        }
        
        // Update player stats for conquest
        const attackingPlayerId = this.currentBattle.attackingPlayerId;
        const defendingPlayerId = this.currentBattle.defendingPlayerId;
        
        if (this.playerStats[attackingPlayerId]) {
            this.playerStats[attackingPlayerId].territoriesConquered++;
        }
        
        if (this.playerStats[defendingPlayerId]) {
            this.playerStats[defendingPlayerId].territoriesLost++;
        }
        
        // Update territory stats
        const defendingTerritory = this.currentBattle.defendingTerritory;
        if (!this.territoryStats[defendingTerritory]) {
            this.territoryStats[defendingTerritory] = {
                conquests: 0,
                totalBattles: 0,
                armiesLost: 0
            };
        }
        
        this.territoryStats[defendingTerritory].conquests++;
        this.territoryStats[defendingTerritory].totalBattles += this.currentBattle.rounds;
        this.territoryStats[defendingTerritory].armiesLost += this.currentBattle.defenderLosses;
        
        // Update stats display
        this.updateStatsDisplay();
    }
    
    /**
     * Calculate luck indices for all players
     * Compares their actual dice average against expected average (3.5)
     */
    calculateLuckIndices() {
        const expectedAverage = 3.5; // Average roll of a fair 6-sided die
        
        Object.keys(this.playerStats).forEach(playerId => {
            const playerStat = this.playerStats[playerId];
            if (playerStat.diceRolled > 0) {
                // Calculate luck as percentage difference from expected
                const actualAverage = playerStat.diceRollAverage;
                playerStat.luckIndex = ((actualAverage - expectedAverage) / expectedAverage) * 100;
            }
        });
    }
    
    /**
     * Update the stats display in the UI
     */
    updateStatsDisplay() {
        // Calculate luck indices
        this.calculateLuckIndices();
        
        // Update global stats
        const globalStatsContent = document.getElementById('global-stats-content');
        if (globalStatsContent) {
            globalStatsContent.innerHTML = `
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 3px; font-weight: bold;">Total Battles:</td>
                        <td style="padding: 3px;">${this.globalStats.totalBattles}</td>
                    </tr>
                    <tr>
                        <td style="padding: 3px; font-weight: bold;">Dice Rolled:</td>
                        <td style="padding: 3px;">${this.globalStats.totalDiceRolled}</td>
                    </tr>
                    <tr>
                        <td style="padding: 3px; font-weight: bold;">Territories Conquered:</td>
                        <td style="padding: 3px;">${this.globalStats.totalTerritoriesConquered}</td>
                    </tr>
                    <tr>
                        <td style="padding: 3px; font-weight: bold;">Armies Lost:</td>
                        <td style="padding: 3px;">Attackers: ${this.globalStats.totalArmiesLost.attacker} | Defenders: ${this.globalStats.totalArmiesLost.defender}</td>
                    </tr>
                    <tr>
                        <td style="padding: 3px; font-weight: bold;">Longest Battle:</td>
                        <td style="padding: 3px;">${this.globalStats.longestBattleRounds} rounds</td>
                    </tr>
                    <tr>
                        <td style="padding: 3px; font-weight: bold;">Fastest Conquest:</td>
                        <td style="padding: 3px;">${this.globalStats.fastestConquest === Infinity ? 'N/A' : this.globalStats.fastestConquest.toFixed(2) + ' seconds'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 3px; font-weight: bold;">Largest Army Loss:</td>
                        <td style="padding: 3px;">${this.globalStats.largestArmyLoss} armies</td>
                    </tr>
                </table>
            `;
        }
        
        // Update player stats
        const playerStatsContent = document.getElementById('player-stats-content');
        if (playerStatsContent) {
            let playerStatsHtml = '<table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">';
            playerStatsHtml += `
                <tr style="background-color: #e0e0e0;">
                    <th style="padding: 5px; text-align: left;">Player</th>
                    <th style="padding: 5px; text-align: center;">Territories<br>Conquered</th>
                    <th style="padding: 5px; text-align: center;">Battles<br>Won/Lost</th>
                    <th style="padding: 5px; text-align: center;">Avg.<br>Roll</th>
                    <th style="padding: 5px; text-align: center;">Luck<br>Index</th>
                </tr>
            `;
            
            // Get game state for player info
            const gameState = window.gameState || window.GameState;
            
            Object.keys(this.playerStats).forEach((playerId, index) => {
                const stats = this.playerStats[playerId];
                const playerName = gameState?.players?.[playerId]?.name || `Player ${playerId}`;
                const playerColor = gameState?.players?.[playerId]?.color || '#333333';
                
                // Only show players with data
                if (stats.diceRolled > 0) {
                    const luckColor = stats.luckIndex > 0 ? '#4CAF50' : (stats.luckIndex < 0 ? '#f44336' : '#333');
                    
                    playerStatsHtml += `
                        <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                            <td style="padding: 5px; border-bottom: 1px solid #ddd;">
                                <span style="display: inline-block; width: 12px; height: 12px; background-color: ${playerColor}; margin-right: 5px;"></span>
                                ${playerName}
                            </td>
                            <td style="padding: 5px; text-align: center; border-bottom: 1px solid #ddd;">
                                ${stats.territoriesConquered}
                            </td>
                            <td style="padding: 5px; text-align: center; border-bottom: 1px solid #ddd;">
                                ${stats.attackerWins + stats.defenderWins}/${stats.battlesInitiated + stats.battlesDefended - stats.attackerWins - stats.defenderWins}
                            </td>
                            <td style="padding: 5px; text-align: center; border-bottom: 1px solid #ddd;">
                                ${stats.diceRollAverage.toFixed(2)}
                            </td>
                            <td style="padding: 5px; text-align: center; border-bottom: 1px solid #ddd; color: ${luckColor}; font-weight: bold;">
                                ${stats.luckIndex.toFixed(1)}%
                            </td>
                        </tr>
                    `;
                }
            });
            
            playerStatsHtml += '</table>';
            
            if (Object.values(this.playerStats).some(stats => stats.diceRolled > 0)) {
                playerStatsContent.innerHTML = playerStatsHtml;
            } else {
                playerStatsContent.innerHTML = '<p>No player data available yet</p>';
            }
        }
        
        // Update dice distribution chart
        this.updateDiceDistributionChart();
    }
    
    /**
     * Update the dice distribution chart
     */
    updateDiceDistributionChart() {
        const totalRolls = Object.values(this.globalStats.diceDistribution).reduce((sum, val) => sum + val, 0);
        
        if (totalRolls > 0) {
            // Calculate percentages for each dice value
            const dicePercentages = {};
            
            for (let i = 1; i <= 6; i++) {
                dicePercentages[i] = (this.globalStats.diceDistribution[i] / totalRolls) * 100;
            }
            
            // Update chart bars
            for (let i = 1; i <= 6; i++) {
                const barFill = document.querySelector(`.dice-bar[data-value="${i}"] .dice-bar-fill`);
                if (barFill) {
                    barFill.style.height = `${dicePercentages[i]}%`;
                    barFill.setAttribute('title', `${this.globalStats.diceDistribution[i]} rolls (${dicePercentages[i].toFixed(1)}%)`);
                }
            }
        }
    }
}

/**
 * Combat Victory Checker
 * Monitors game state for victory conditions and triggers appropriate animations/sounds
 */
class VictoryConditionChecker {
    constructor(gameState, combatAnimations) {
        this.gameState = gameState;
        this.combatAnimations = combatAnimations;
        this.previousOwnership = {};
        this.victoryThreshold = 0.75; // Control 75% of territories to win
        this.initialCheck = true;
        
        // Initialize territory ownership snapshot
        this.updateOwnershipSnapshot();
    }
    
    /**
     * Update the territory ownership snapshot
     */
    updateOwnershipSnapshot() {
        if (!this.gameState || !this.gameState.territories) return;
        
        // Create a snapshot of current territory ownership
        Object.keys(this.gameState.territories).forEach(territoryId => {
            this.previousOwnership[territoryId] = this.gameState.territories[territoryId].owner;
        });
        
        // Calculate total territory count on first check
        if (this.initialCheck) {
            this.totalTerritoryCount = Object.keys(this.gameState.territories).length;
            this.initialCheck = false;
        }
    }
    
    /**
     * Check for ownership changes and victory conditions
     * @returns {object|null} Victory result if a player has won, null otherwise
     */
    checkForVictory() {
        if (!this.gameState || !this.gameState.territories) return null;
        
        // Count territories per player
        const territoryCounts = {};
        let territoryChanges = [];
        
        // Check for ownership changes and count territories
        Object.keys(this.gameState.territories).forEach(territoryId => {
            const currentOwner = this.gameState.territories[territoryId].owner;
            
            // Count territories by owner
            if (!territoryCounts[currentOwner]) {
                territoryCounts[currentOwner] = 0;
            }
            territoryCounts[currentOwner]++;
            
            // Check for ownership change
            const previousOwner = this.previousOwnership[territoryId];
            if (previousOwner && previousOwner !== currentOwner) {
                territoryChanges.push({
                    territoryId,
                    previousOwner,
                    currentOwner
                });
            }
        });
        
        // Check victory conditions
        let victoryResult = null;
        
        Object.keys(territoryCounts).forEach(playerId => {
            const territoryPercentage = territoryCounts[playerId] / this.totalTerritoryCount;
            
            // Check if player has reached victory threshold
            if (territoryPercentage >= this.victoryThreshold) {
                victoryResult = {
                    winner: playerId,
                    territoriesControlled: territoryCounts[playerId],
                    totalTerritories: this.totalTerritoryCount,
                    percentage: territoryPercentage
                };
            }
        });
        
        // Update ownership snapshot for next check
        this.updateOwnershipSnapshot();
        
        return {
            victoryResult,
            territoryChanges,
            territoryCounts
        };
    }
    
    /**
     * Perform victory celebration
     */
    celebrateVictory(victoryResult) {
        if (!victoryResult) return;
        
        console.log(`🏆 Victory! Player ${victoryResult.winner} has won the game!`);
        
        // Sound effects have been removed
        
        // Show victory animation/modal
        this.showVictoryModal(victoryResult);
    }
    
    /**
     * Show victory modal
     */
    showVictoryModal(victoryResult) {
        // Create modal if it doesn't exist yet
        let victoryModal = document.getElementById('victory-modal');
        
        if (!victoryModal) {
            victoryModal = document.createElement('div');
            victoryModal.id = 'victory-modal';
            victoryModal.className = 'modal victory-modal';
            victoryModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            
            const modalContent = document.createElement('div');
            modalContent.className = 'victory-modal-content';
            modalContent.style.cssText = `
                background-color: #fff;
                padding: 30px;
                border-radius: 10px;
                max-width: 80%;
                text-align: center;
                box-shadow: 0 0 30px rgba(255,215,0,0.6);
                border: 3px solid gold;
                animation: victoryPulse 2s infinite;
            `;
            
            // Add CSS animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes victoryPulse {
                    0% { box-shadow: 0 0 30px rgba(255,215,0,0.6); }
                    50% { box-shadow: 0 0 50px rgba(255,215,0,0.9); }
                    100% { box-shadow: 0 0 30px rgba(255,215,0,0.6); }
                }
                
                @keyframes victoryFadeIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                .victory-modal-content {
                    animation: victoryFadeIn 1s ease-out;
                }
            `;
            document.head.appendChild(style);
            
            victoryModal.appendChild(modalContent);
            document.body.appendChild(victoryModal);
        }
        
        // Get player name and color
        const winner = this.gameState.players[victoryResult.winner];
        const playerName = winner ? winner.name : `Player ${victoryResult.winner}`;
        const playerColor = winner ? winner.color : '#333';
        
        // Update modal content
        const modalContent = victoryModal.querySelector('.victory-modal-content');
        modalContent.innerHTML = `
            <h1 style="color: #d4af37; margin-top: 0; font-size: 48px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">VICTORY!</h1>
            <h2 style="margin-bottom: 30px; color: ${playerColor};">${playerName} has conquered the world!</h2>
            <div style="margin: 20px 0;">
                <p style="font-size: 18px;">
                    <strong>${playerName}</strong> controls ${victoryResult.territoriesControlled} out of ${victoryResult.totalTerritories} territories
                    (${(victoryResult.percentage * 100).toFixed(1)}%)
                </p>
            </div>
            <div style="margin-top: 40px;">
                <button id="victory-close-btn" style="padding: 10px 30px; font-size: 18px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Continue Game
                </button>
            </div>
        `;
        
        // Show modal
        victoryModal.style.display = 'flex';
        
        // Add event listener to close button
        document.getElementById('victory-close-btn').addEventListener('click', () => {
            victoryModal.style.display = 'none';
        });
    }
}

/**
 * Combat Performance Optimizer
 * Ensures animations and sound effects don't impact game performance
 */
class CombatPerformanceOptimizer {
    constructor() {
        this.fpsHistory = [];
        this.isMonitoring = false;
        this.lowPerformanceThreshold = 30; // FPS threshold for low performance
        this.performanceMode = this.getPerformancePreference();
        
        // Performance settings
        this.settings = {
            animations: true,
            animationQuality: 'high', // high, medium, low
            sounds: true,
            soundQuality: 'high', // high, medium, low
            dynamicOptimization: true
        };
    }
    
    /**
     * Get performance preference from localStorage
     */
    getPerformancePreference() {
        try {
            const savedMode = localStorage.getItem('riskCombatPerformanceMode');
            return savedMode || 'auto'; // auto, high, low
        } catch (e) {
            return 'auto';
        }
    }
    
    /**
     * Save performance preference to localStorage
     */
    savePerformancePreference(mode) {
        try {
            localStorage.setItem('riskCombatPerformanceMode', mode);
            this.performanceMode = mode;
        } catch (e) {
            console.warn('Failed to save performance preference:', e);
        }
    }
    
    /**
     * Start monitoring FPS
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.lastTimestamp = performance.now();
        this.frameCount = 0;
        this.monitoringInterval = setInterval(() => this.calculateFPS(), 1000);
        
        // Request animation frame to count frames
        const countFrame = (timestamp) => {
            if (!this.isMonitoring) return;
            
            this.frameCount++;
            requestAnimationFrame(countFrame);
        };
        
        requestAnimationFrame(countFrame);
    }
    
    /**
     * Stop monitoring FPS
     */
    stopMonitoring() {
        this.isMonitoring = false;
        clearInterval(this.monitoringInterval);
    }
    
    /**
     * Calculate current FPS
     */
    calculateFPS() {
        const now = performance.now();
        const elapsed = now - this.lastTimestamp;
        const fps = (this.frameCount * 1000) / elapsed;
        
        // Store in history (keep last 5 readings)
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > 5) {
            this.fpsHistory.shift();
        }
        
        // Reset for next reading
        this.lastTimestamp = now;
        this.frameCount = 0;
        
        // Check if optimization is needed
        if (this.settings.dynamicOptimization) {
            this.checkForOptimization();
        }
    }
    
    /**
     * Get average FPS from recent history
     */
    getAverageFPS() {
        if (this.fpsHistory.length === 0) return 60;
        return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    }
    
    /**
     * Check if optimization is needed
     */
    checkForOptimization() {
        const averageFPS = this.getAverageFPS();
        
        // If FPS is too low, optimize
        if (averageFPS < this.lowPerformanceThreshold) {
            this.optimizeForPerformance();
        } else if (averageFPS > 55 && this.isInLowPerformanceMode()) {
            // If FPS is good and we're in low performance mode, we can try to restore quality
            this.restoreQuality();
        }
    }
    
    /**
     * Check if we're in low performance mode
     */
    isInLowPerformanceMode() {
        return this.settings.animationQuality !== 'high' || this.settings.soundQuality !== 'high';
    }
    
    /**
     * Optimize for performance
     */
    optimizeForPerformance() {
        // Step down quality level
        if (this.settings.animationQuality === 'high') {
            this.settings.animationQuality = 'medium';
            console.log('Reducing animation quality to medium for better performance');
        } else if (this.settings.animationQuality === 'medium') {
            this.settings.animationQuality = 'low';
            console.log('Reducing animation quality to low for better performance');
        } else if (this.settings.animations) {
            // As a last resort, disable animations entirely
            this.settings.animations = false;
            console.log('Disabling animations for better performance');
        }
        
        // Apply settings to animations and sound systems
        this.applySettings();
    }
    
    /**
     * Restore quality settings
     */
    restoreQuality() {
        // Step up quality level
        if (!this.settings.animations) {
            this.settings.animations = true;
            this.settings.animationQuality = 'low';
            console.log('Re-enabling animations at low quality');
        } else if (this.settings.animationQuality === 'low') {
            this.settings.animationQuality = 'medium';
            console.log('Increasing animation quality to medium');
        } else if (this.settings.animationQuality === 'medium') {
            this.settings.animationQuality = 'high';
            console.log('Increasing animation quality to high');
        }
        
        // Apply settings to animations and sound systems
        this.applySettings();
    }
    
    /**
     * Apply current settings to animation and sound systems
     */
    applySettings() {
        // Apply to animations
        if (window.combatAnimations) {
            window.combatAnimations.setEnabled(this.settings.animations);
            window.combatAnimations.setQuality(this.settings.animationQuality);
        }
        
        // Apply to sounds
        // Sound effects have been removed
    }
    
    /**
     * Create performance settings panel
     */
    createSettingsPanel() {
        // Create settings panel container
        const panel = document.createElement('div');
        panel.id = 'combat-performance-panel';
        panel.className = 'combat-performance-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 300px;
            background: #f0f0f0;
            border: 2px solid #333;
            border-radius: 5px;
            padding: 10px;
            z-index: 9997;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            display: none;
        `;
        
        // Create panel content
        panel.innerHTML = `
            <h3 style="margin-top: 0; border-bottom: 1px solid #999; padding-bottom: 5px;">
                Combat Performance Settings
                <button id="close-performance-panel" style="float: right; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;">&times;</button>
            </h3>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Performance Mode</label>
                <select id="performance-mode-select" style="width: 100%; padding: 5px;">
                    <option value="auto" ${this.performanceMode === 'auto' ? 'selected' : ''}>Auto-detect (Recommended)</option>
                    <option value="high" ${this.performanceMode === 'high' ? 'selected' : ''}>High Quality</option>
                    <option value="medium" ${this.performanceMode === 'medium' ? 'selected' : ''}>Medium Quality</option>
                    <option value="low" ${this.performanceMode === 'low' ? 'selected' : ''}>Low Quality</option>
                </select>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" id="animations-checkbox" ${this.settings.animations ? 'checked' : ''}>
                    Enable Combat Animations
                </label>
                
                <div id="animation-quality-container" style="margin-left: 20px; ${this.settings.animations ? '' : 'display: none;'}">
                    <label style="display: block; margin-bottom: 5px;">Animation Quality:</label>
                    <div style="display: flex; gap: 10px;">
                        <label>
                            <input type="radio" name="animation-quality" value="high" ${this.settings.animationQuality === 'high' ? 'checked' : ''}>
                            High
                        </label>
                        <label>
                            <input type="radio" name="animation-quality" value="medium" ${this.settings.animationQuality === 'medium' ? 'checked' : ''}>
                            Medium
                        </label>
                        <label>
                            <input type="radio" name="animation-quality" value="low" ${this.settings.animationQuality === 'low' ? 'checked' : ''}>
                            Low
                        </label>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" id="sounds-checkbox" ${this.settings.sounds ? 'checked' : ''}>
                    Enable Combat Sounds
                </label>
                
                <div id="sound-quality-container" style="margin-left: 20px; ${this.settings.sounds ? '' : 'display: none;'}">
                    <label style="display: block; margin-bottom: 5px;">Sound Quality:</label>
                    <div style="display: flex; gap: 10px;">
                        <label>
                            <input type="radio" name="sound-quality" value="high" ${this.settings.soundQuality === 'high' ? 'checked' : ''}>
                            High
                        </label>
                        <label>
                            <input type="radio" name="sound-quality" value="medium" ${this.settings.soundQuality === 'medium' ? 'checked' : ''}>
                            Medium
                        </label>
                        <label>
                            <input type="radio" name="sound-quality" value="low" ${this.settings.soundQuality === 'low' ? 'checked' : ''}>
                            Low
                        </label>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" id="dynamic-optimization-checkbox" ${this.settings.dynamicOptimization ? 'checked' : ''}>
                    Dynamic Performance Optimization
                </label>
                <small style="color: #666; display: block; margin-top: 5px;">
                    Automatically adjusts quality based on your device performance
                </small>
            </div>
            
            <div id="fps-display" style="margin-top: 10px; font-family: monospace; background: #333; color: #0f0; padding: 5px; border-radius: 3px;">
                FPS: ${this.getAverageFPS().toFixed(1)}
            </div>
            
            <div style="margin-top: 15px; text-align: center;">
                <button id="apply-performance-settings" style="padding: 8px 20px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    Apply Settings
                </button>
            </div>
        `;
        
        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggle-performance-panel';
        toggleButton.textContent = 'Performance';
        toggleButton.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: #ff9800;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 5px 10px;
            cursor: pointer;
            z-index: 9997;
        `;
        
        // Append to body
        document.body.appendChild(panel);
        document.body.appendChild(toggleButton);
        
        // Add event listeners
        this.addSettingsPanelListeners();
        
        // Start updating FPS display
        setInterval(() => {
            const fpsDisplay = document.getElementById('fps-display');
            if (fpsDisplay) {
                fpsDisplay.innerText = `FPS: ${this.getAverageFPS().toFixed(1)}`;
            }
        }, 1000);
        
        // Start monitoring FPS
        this.startMonitoring();
    }
    
    /**
     * Add event listeners to settings panel
     */
    addSettingsPanelListeners() {
        // Toggle panel visibility
        document.getElementById('toggle-performance-panel').addEventListener('click', () => {
            const panel = document.getElementById('combat-performance-panel');
            const isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';
            document.getElementById('toggle-performance-panel').style.display = isVisible ? 'block' : 'none';
        });
        
        // Close panel button
        document.getElementById('close-performance-panel').addEventListener('click', () => {
            document.getElementById('combat-performance-panel').style.display = 'none';
            document.getElementById('toggle-performance-panel').style.display = 'block';
        });
        
        // Animations checkbox
        document.getElementById('animations-checkbox').addEventListener('change', (e) => {
            const container = document.getElementById('animation-quality-container');
            container.style.display = e.target.checked ? 'block' : 'none';
        });
        
        // Sounds checkbox
        document.getElementById('sounds-checkbox').addEventListener('change', (e) => {
            const container = document.getElementById('sound-quality-container');
            container.style.display = e.target.checked ? 'block' : 'none';
        });
        
        // Apply settings button
        document.getElementById('apply-performance-settings').addEventListener('click', () => {
            // Get values from form
            this.settings.animations = document.getElementById('animations-checkbox').checked;
            this.settings.sounds = document.getElementById('sounds-checkbox').checked;
            this.settings.animationQuality = document.querySelector('input[name="animation-quality"]:checked').value;
            this.settings.soundQuality = document.querySelector('input[name="sound-quality"]:checked').value;
            this.settings.dynamicOptimization = document.getElementById('dynamic-optimization-checkbox').checked;
            
            // Save performance mode
            this.savePerformancePreference(document.getElementById('performance-mode-select').value);
            
            // Apply settings
            this.applySettings();
            
            // Close panel
            document.getElementById('combat-performance-panel').style.display = 'none';
            document.getElementById('toggle-performance-panel').style.display = 'block';
            
            // Show confirmation
            alert('Combat performance settings applied!');
        });
    }
}

/**
 * Initialize combat enhancements when document is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Wait for combat system to be fully initialized
    const checkCombatSystem = setInterval(function() {
        if (window.combatSystem && window.combatAnimations && window.gameState) {
            clearInterval(checkCombatSystem);
            console.log('✅ Combat Enhancements: Combat System detected, initializing advanced integrations...');
            
            // Initialize statistics tracking
            window.combatStatistics = new CombatStatisticsTracker();
            
            // Initialize player stats for all players
            const players = Object.keys(window.gameState.players);
            window.combatStatistics.initializePlayerStats(players);
            
            // Initialize victory condition checking
            window.victoryChecker = new VictoryConditionChecker(
                window.gameState,
                window.combatAnimations
            );
            
            // Initialize performance optimizer
            window.performanceOptimizer = new CombatPerformanceOptimizer();
            window.performanceOptimizer.createSettingsPanel();
            
            // Apply initial performance settings
            window.performanceOptimizer.applySettings();
            
            // Enhance combat system with statistics tracking
            enhanceCombatSystemWithStatistics();
            
            console.log('✅ Combat Enhancements: Advanced integrations initialized successfully');
        }
    }, 500);
});

/**
 * Enhance combat system with statistics tracking
 */
function enhanceCombatSystemWithStatistics() {
    // Store original methods
    const originalStartCombat = window.combatSystem.startCombat;
    const originalExecuteBattle = window.combatSystem.executeBattle;
    const originalCompleteConquest = window.combatSystem.completeConquest;
    const originalEndCombat = window.combatSystem.endCombat;
    
    // Enhance startCombat to track battle statistics
    window.combatSystem.startCombat = function(attackingTerritoryId, defendingTerritoryId) {
        const result = originalStartCombat.call(this, attackingTerritoryId, defendingTerritoryId);
        
        if (result.success) {
            // Start tracking statistics for this battle
            const attackingTerritory = this.gameState.territories[attackingTerritoryId];
            const defendingTerritory = this.gameState.territories[defendingTerritoryId];
            
            window.combatStatistics.startBattle(
                attackingTerritory.owner,
                defendingTerritory.owner,
                attackingTerritoryId,
                defendingTerritoryId
            );
        }
        
        return result;
    };
    
    // Enhance executeBattle to track combat statistics
    window.combatSystem.executeBattle = function(attackerDice, defenderDice = null) {
        // Execute original battle logic
        const result = originalExecuteBattle.call(this, attackerDice, defenderDice);
        
        // Track statistics if battle was successful
        if (result.success) {
            window.combatStatistics.recordBattleRound(
                result.attackerRolls.length,
                result.defenderRolls.length,
                result.attackerRolls,
                result.defenderRolls,
                result.attackerLosses,
                result.defenderLosses
            );
            
            // Check for victory conditions after each battle
            const victoryCheck = window.victoryChecker.checkForVictory();
            if (victoryCheck && victoryCheck.victoryResult) {
                window.victoryChecker.celebrateVictory(victoryCheck.victoryResult);
            }
        }
        
        return result;
    };
    
    // Enhance completeConquest to track conquest statistics
    window.combatSystem.completeConquest = function(armiesToMove) {
        // Execute original conquest logic
        const result = originalCompleteConquest.call(this, armiesToMove);
        
        // Track statistics if conquest was successful
        if (result.success) {
            window.combatStatistics.recordConquest(armiesToMove);
            
            // Check for victory conditions after conquest
            const victoryCheck = window.victoryChecker.checkForVictory();
            if (victoryCheck && victoryCheck.victoryResult) {
                window.victoryChecker.celebrateVictory(victoryCheck.victoryResult);
            }
        }
        
        return result;
    };
    
    // Enhance endCombat to finalize statistics
    window.combatSystem.endCombat = function() {
        originalEndCombat.call(this);
        
        // Update statistics display when combat ends
        if (window.combatStatistics) {
            window.combatStatistics.updateStatsDisplay();
        }
    };
}