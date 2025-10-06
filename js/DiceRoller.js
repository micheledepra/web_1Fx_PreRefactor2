/**
 * DiceRoller - Handles dice rolling mechanics for Risk combat system
 * Follows official Risk rules for attack/defense dice rolling and casualty determination
 */
class DiceRoller {
    constructor() {
        // Official Risk rules for maximum dice
        this.MAX_ATTACKER_DICE = 3;
        this.MAX_DEFENDER_DICE = 2;
    }

    /**
     * Validates the number of dice a player can roll based on their army count
     * @param {number} armies - Number of armies in territory
     * @param {string} type - 'attacker' or 'defender'
     * @param {number} requestedDice - Number of dice requested
     * @returns {object} - {valid: boolean, maxAllowed: number, message: string}
     */
    validateDiceCount(armies, type, requestedDice) {
        if (type === 'attacker') {
            const maxAllowed = Math.min(this.MAX_ATTACKER_DICE, armies - 1);
            if (armies <= 1) {
                return {
                    valid: false,
                    maxAllowed: 0,
                    message: "Attacker must have more than 1 army to attack"
                };
            }
            if (requestedDice > maxAllowed) {
                return {
                    valid: false,
                    maxAllowed: maxAllowed,
                    message: `Attacker can roll maximum ${maxAllowed} dice with ${armies} armies`
                };
            }
        } else if (type === 'defender') {
            const maxAllowed = Math.min(this.MAX_DEFENDER_DICE, armies);
            if (armies <= 0) {
                return {
                    valid: false,
                    maxAllowed: 0,
                    message: "Defender must have at least 1 army to defend"
                };
            }
            if (requestedDice > maxAllowed) {
                return {
                    valid: false,
                    maxAllowed: maxAllowed,
                    message: `Defender can roll maximum ${maxAllowed} dice with ${armies} armies`
                };
            }
        }

        return {
            valid: true,
            maxAllowed: requestedDice,
            message: "Valid dice count"
        };
    }

    /**
     * Generates random dice rolls (1-6)
     * @param {number} count - Number of dice to roll
     * @returns {Array<number>} - Array of dice values
     */
    rollDice(count) {
        const rolls = [];
        for (let i = 0; i < count; i++) {
            rolls.push(Math.floor(Math.random() * 6) + 1);
        }
        return rolls;
    }

    /**
     * Sorts dice results in descending order (highest first)
     * @param {Array<number>} dice - Array of dice values
     * @returns {Array<number>} - Sorted dice values
     */
    sortDiceDescending(dice) {
        return [...dice].sort((a, b) => b - a);
    }

    /**
     * Compares dice and determines casualties according to Risk rules
     * @param {Array<number>} attackerDice - Sorted attacker dice
     * @param {Array<number>} defenderDice - Sorted defender dice
     * @returns {object} - Combat result with casualties and comparisons
     */
    compareDiceAndDetermineCasualties(attackerDice, defenderDice) {
        const sortedAttacker = this.sortDiceDescending(attackerDice);
        const sortedDefender = this.sortDiceDescending(defenderDice);
        
        const comparisons = [];
        let attackerLosses = 0;
        let defenderLosses = 0;

        // Compare dice pairs (highest vs highest, second highest vs second highest)
        const numComparisons = Math.min(sortedAttacker.length, sortedDefender.length);
        
        for (let i = 0; i < numComparisons; i++) {
            const attackerDie = sortedAttacker[i];
            const defenderDie = sortedDefender[i];
            
            // Higher roll wins, defender wins ties (official Risk rule)
            const winner = attackerDie > defenderDie ? 'attacker' : 'defender';
            
            comparisons.push({
                attackerDie: attackerDie,
                defenderDie: defenderDie,
                winner: winner
            });

            // One army removed per lost comparison
            if (winner === 'attacker') {
                defenderLosses++;
            } else {
                attackerLosses++;
            }
        }

        return {
            attackerDice: sortedAttacker,
            defenderDice: sortedDefender,
            comparisons: comparisons,
            attackerLosses: attackerLosses,
            defenderLosses: defenderLosses,
            totalComparisons: numComparisons
        };
    }

    /**
     * Performs a complete combat round with user input dice counts
     * @param {number} attackerArmies - Number of armies attacker has
     * @param {number} defenderArmies - Number of armies defender has  
     * @param {number} attackerDiceCount - Number of dice attacker wants to roll
     * @param {number} defenderDiceCount - Number of dice defender wants to roll (optional, auto-determined if not provided)
     * @returns {object} - Complete combat result
     */
    performCombatRound(attackerArmies, defenderArmies, attackerDiceCount, defenderDiceCount = null) {
        // Validate attacker dice count
        const attackerValidation = this.validateDiceCount(attackerArmies, 'attacker', attackerDiceCount);
        if (!attackerValidation.valid) {
            return {
                success: false,
                error: attackerValidation.message,
                maxAttackerDice: attackerValidation.maxAllowed,
                maxDefenderDice: Math.min(this.MAX_DEFENDER_DICE, defenderArmies)
            };
        }

        // Auto-determine defender dice if not provided (optimal strategy)
        if (defenderDiceCount === null) {
            defenderDiceCount = Math.min(this.MAX_DEFENDER_DICE, defenderArmies);
        }

        // Validate defender dice count
        const defenderValidation = this.validateDiceCount(defenderArmies, 'defender', defenderDiceCount);
        if (!defenderValidation.valid) {
            return {
                success: false,
                error: defenderValidation.message,
                maxAttackerDice: Math.min(this.MAX_ATTACKER_DICE, attackerArmies - 1),
                maxDefenderDice: defenderValidation.maxAllowed
            };
        }

        // Roll dice
        const attackerRolls = this.rollDice(attackerDiceCount);
        const defenderRolls = this.rollDice(defenderDiceCount);

        // Compare and determine casualties
        const combatResult = this.compareDiceAndDetermineCasualties(attackerRolls, defenderRolls);

        // Calculate remaining armies
        const remainingAttackerArmies = attackerArmies - combatResult.attackerLosses;
        const remainingDefenderArmies = defenderArmies - combatResult.defenderLosses;

        return {
            success: true,
            attackerArmies: attackerArmies,
            defenderArmies: defenderArmies,
            attackerDiceCount: attackerDiceCount,
            defenderDiceCount: defenderDiceCount,
            attackerRolls: combatResult.attackerDice,
            defenderRolls: combatResult.defenderDice,
            comparisons: combatResult.comparisons,
            attackerLosses: combatResult.attackerLosses,
            defenderLosses: combatResult.defenderLosses,
            remainingAttackerArmies: remainingAttackerArmies,
            remainingDefenderArmies: remainingDefenderArmies,
            territoryConquered: remainingDefenderArmies <= 0,
            battleComplete: remainingDefenderArmies <= 0 || remainingAttackerArmies <= 1
        };
    }

    /**
     * Gets the maximum number of dice a player can roll
     * @param {number} armies - Number of armies
     * @param {string} type - 'attacker' or 'defender'
     * @returns {number} - Maximum dice count
     */
    getMaxDiceCount(armies, type) {
        if (type === 'attacker') {
            return Math.min(this.MAX_ATTACKER_DICE, Math.max(0, armies - 1));
        } else if (type === 'defender') {
            return Math.min(this.MAX_DEFENDER_DICE, armies);
        }
        return 0;
    }

    /**
     * Creates a formatted result object for UI display
     * @param {object} combatResult - Result from performCombatRound
     * @returns {object} - Formatted result for UI
     */
    formatResultForUI(combatResult) {
        if (!combatResult.success) {
            return {
                success: false,
                error: combatResult.error,
                suggestions: {
                    maxAttackerDice: combatResult.maxAttackerDice,
                    maxDefenderDice: combatResult.maxDefenderDice
                }
            };
        }

        return {
            success: true,
            summary: {
                attackerLost: combatResult.attackerLosses,
                defenderLost: combatResult.defenderLosses,
                territoryConquered: combatResult.territoryConquered,
                battleComplete: combatResult.battleComplete
            },
            details: {
                attackerDice: combatResult.attackerRolls,
                defenderDice: combatResult.defenderRolls,
                comparisons: combatResult.comparisons,
                remainingArmies: {
                    attacker: combatResult.remainingAttackerArmies,
                    defender: combatResult.remainingDefenderArmies
                }
            },
            animation: {
                diceRolls: {
                    attacker: combatResult.attackerRolls,
                    defender: combatResult.defenderRolls
                },
                casualties: {
                    attacker: combatResult.attackerLosses,
                    defender: combatResult.defenderLosses
                }
            }
        };
    }

    /**
     * Simulate multiple combat rounds to predict odds
     * @param {number} attackerArmies - Attacker army count
     * @param {number} defenderArmies - Defender army count
     * @param {number} simulations - Number of simulations to run
     * @returns {object} - Simulation results with win probabilities
     */
    simulateCombatOdds(attackerArmies, defenderArmies, simulations = 1000) {
        let attackerWins = 0;
        let defenderWins = 0;
        let totalBattles = 0;

        for (let sim = 0; sim < simulations; sim++) {
            let attArmies = attackerArmies;
            let defArmies = defenderArmies;

            while (attArmies > 1 && defArmies > 0) {
                const attDice = Math.min(3, attArmies - 1);
                const defDice = Math.min(2, defArmies);
                
                const result = this.performCombatRound(attArmies, defArmies, attDice, defDice);
                
                attArmies = result.remainingAttackerArmies;
                defArmies = result.remainingDefenderArmies;
                totalBattles++;
            }

            if (defArmies === 0) {
                attackerWins++;
            } else {
                defenderWins++;
            }
        }

        return {
            attackerWinProbability: (attackerWins / simulations * 100).toFixed(1),
            defenderWinProbability: (defenderWins / simulations * 100).toFixed(1),
            averageBattles: (totalBattles / simulations).toFixed(1),
            simulationsRun: simulations
        };
    }

    /**
     * Get detailed dice statistics for a set of rolls
     * @param {number[]} dice - Array of dice values
     * @returns {object} - Statistical analysis
     */
    getDiceStatistics(dice) {
        if (!dice || dice.length === 0) return null;

        const sum = dice.reduce((a, b) => a + b, 0);
        const average = sum / dice.length;
        const sorted = [...dice].sort((a, b) => a - b);
        
        return {
            count: dice.length,
            sum: sum,
            average: average.toFixed(2),
            highest: Math.max(...dice),
            lowest: Math.min(...dice),
            median: dice.length % 2 === 0 
                ? (sorted[dice.length/2 - 1] + sorted[dice.length/2]) / 2
                : sorted[Math.floor(dice.length/2)],
            distribution: this.getDiceDistribution(dice)
        };
    }

    /**
     * Get distribution of dice values (1-6)
     * @param {number[]} dice - Array of dice values
     * @returns {object} - Count of each dice value
     */
    getDiceDistribution(dice) {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        dice.forEach(die => {
            if (die >= 1 && die <= 6) {
                distribution[die]++;
            }
        });
        return distribution;
    }

    /**
     * Validate army counts for combat
     * @param {number} attackerArmies - Attacker armies
     * @param {number} defenderArmies - Defender armies
     * @returns {object} - Validation result
     */
    validateArmiesForCombat(attackerArmies, defenderArmies) {
        const errors = [];

        if (attackerArmies < 2) {
            errors.push("Attacker must have at least 2 armies to attack");
        }

        if (defenderArmies < 1) {
            errors.push("Defender must have at least 1 army to defend");
        }

        if (!Number.isInteger(attackerArmies) || !Number.isInteger(defenderArmies)) {
            errors.push("Army counts must be whole numbers");
        }

        if (attackerArmies < 0 || defenderArmies < 0) {
            errors.push("Army counts cannot be negative");
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            maxAttackerDice: errors.length === 0 ? Math.min(3, attackerArmies - 1) : 0,
            maxDefenderDice: errors.length === 0 ? Math.min(2, defenderArmies) : 0
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiceRoller;
}