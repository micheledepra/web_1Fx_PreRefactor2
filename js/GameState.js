class GameState {
    static SESSION_KEY = 'risk_game_state';
    
    constructor(players, colors = []) {
        // Try to restore existing game state
        const savedState = GameState.loadFromSession();
        if (savedState) {
            Object.assign(this, savedState);
            return;
        }

        // Initialize new game state
        this.players = players;
        this.territories = {};
        this.currentPlayerIndex = 0;
        this.phase = 'initial-setup';
        this.turnNumber = 1;
        this.armiesPerTurn = 3;
        this.reinforcements = {}; // For regular turn reinforcements
        this.remainingArmies = {}; // For deployment armies (initial and turn-based)
        this.playerColors = {};
        this.lastUpdate = Date.now();
        this.initialDeploymentComplete = false; // Track initial deployment phase completion
        this.continentBonuses = {
            'north-america': 5,
            'south-america': 2,
            'europe': 5,
            'africa': 3,
            'asia': 7,
            'australia': 2
        };
        
        // Initialize player colors
        this.players.forEach((player, index) => {
            this.playerColors[player] = colors[index] || this.getDefaultColor(index);
        });
        
        // Initialize territory ownership and armies
        Object.keys(territoryPaths).forEach(territory => {
            this.territories[territory] = {
                owner: null,
                armies: 0,
                neighbors: [] // Neighbors will be initialized from territory paths
            };
        });
        
        // Initialize neighbors from territory paths
        Object.entries(territoryPaths).forEach(([territory, data]) => {
            if (data.neighbors) {
                this.territories[territory].neighbors = data.neighbors;
            }
        });

        // Initialize remaining armies with initial army counts according to official Risk rules
        const initialArmies = this.getInitialArmies(players.length);
        console.log(`Initializing game with ${players.length} players - ${initialArmies} armies per player`);
        this.players.forEach(player => {
            this.remainingArmies[player] = initialArmies;
            this.reinforcements[player] = 0; // No reinforcements until regular turns begin
        });
    }

    getDefaultColor(index) {
        const defaultColors = [
            '#ff4444', // Red
            '#44ff44', // Green
            '#4444ff', // Blue
            '#ffff44', // Yellow
            '#ff44ff', // Magenta
            '#44ffff'  // Cyan
        ];
        return defaultColors[index % defaultColors.length];
    }

    getInitialArmies(numPlayers) {
        // Official Risk board game rules for initial army count based on player count:
        // - 2 players: 40 armies each
        // - 3 players: 35 armies each
        // - 4 players: 30 armies each
        // - 5 players: 25 armies each
        // - 6 players: 20 armies each
        switch(numPlayers) {
            case 2: return 40;
            case 3: return 35;
            case 4: return 30;
            case 5: return 25;
            case 6: return 20;
            default: return 30; // Default to 4-player rules
        }
    }

    calculateReinforcements(player) {
        // Official Risk rules for reinforcements:
        // 1. Base reinforcements: 1 army per 3 territories owned (rounded down), with a minimum of 3
        const territoriesOwned = Object.values(this.territories)
            .filter(t => t.owner === player).length;
        let reinforcements = Math.max(3, Math.floor(territoriesOwned / 3));

        // 2. Add continent bonuses if player controls entire continent
        reinforcements += this.calculateContinentBonuses(player);

        // 3. Card sets are handled separately in the game UI
        
        return reinforcements;
    }

    calculateContinentBonuses(player) {
        let bonus = 0;
        const continents = {
            'north-america': ['alaska', 'northwest-territory', 'greenland', 'quebec', 'ontario', 'alberta', 'western-united-states', 'eastern-united-states', 'central-america'],
            'south-america': ['venezuela', 'peru', 'brazil', 'argentina'],
            'europe': ['iceland', 'scandinavia', 'great-britain', 'northern-europe', 'southern-europe', 'ukraine', 'western-europe'],
            'africa': ['north-africa', 'egypt', 'congo', 'east-africa', 'south-africa', 'madagascar'],
            'asia': ['ural', 'siberia', 'yakutsk', 'kamchatka', 'irkutsk', 'mongolia', 'japan', 'afghanistan', 'china', 'middle-east', 'india', 'siam'],
            'australia': ['indonesia', 'new-guinea', 'western-australia', 'eastern-australia']
        };

        for (const [continent, territories] of Object.entries(continents)) {
            if (territories.every(territory => 
                this.territories[territory] && 
                this.territories[territory].owner === player
            )) {
                bonus += this.continentBonuses[continent];
            }
        }
        return bonus;
    }

    setPhase(newPhase) {
        this.phase = newPhase;
        if (newPhase === 'deploy') {
            this.reinforcements[this.getCurrentPlayer()] = 
                this.calculateReinforcements(this.getCurrentPlayer());
        }
    }

    assignTerritoriesRandomly() {
        // Official Risk rules for initial territory assignment:
        // 1. Territories are randomly distributed equally among players
        // 2. Each territory starts with 1 army
        // 3. Players take turns placing remaining armies on their territories
        
        const territoryList = Object.keys(this.territories);
        const territoriesPerPlayer = Math.floor(territoryList.length / this.players.length);
        const extraTerritories = territoryList.length % this.players.length;
        
        // Shuffle territories randomly for fair distribution
        for (let i = territoryList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [territoryList[i], territoryList[j]] = [territoryList[j], territoryList[i]];
        }
        
        let currentIndex = 0;
        
        // Initialize remainingArmies for initial placement phase
        this.remainingArmies = {};
        const initialArmies = this.getInitialArmies(this.players.length);
        
        // Assign territories to players
        this.players.forEach((player, playerIndex) => {
            // Calculate how many territories this player should get
            // (some players get an extra territory if there's an uneven number)
            const playerTerritories = territoriesPerPlayer + (playerIndex < extraTerritories ? 1 : 0);
            
            // Assign territories to this player
            for (let i = 0; i < playerTerritories; i++) {
                const territory = territoryList[currentIndex++];
                this.territories[territory].owner = player;
                this.territories[territory].armies = 1; // Start with 1 army per territory
            }
            
            // Set remaining armies for initial placement
            // (total initial armies minus the one army already placed on each territory)
            this.remainingArmies[player] = initialArmies - playerTerritories;
        });
        
        // Set phase to initial placement for the remaining armies
        this.phase = 'initial-placement';
    }

    calculateInitialArmies(playerCount) {
        // This is a duplicate method that should use getInitialArmies instead
        // for consistency and to follow DRY principles
        return this.getInitialArmies(playerCount);
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.checkPhaseCompletion();
        return this.getCurrentPlayer();
    }

    checkPhaseCompletion() {
        if (this.phase === 'initial-placement') {
            const allTroopsPlaced = this.players.every(player => 
                this.remainingArmies[player] === 0
            );
            
            if (allTroopsPlaced) {
                this.phase = 'deploy';
                this.initialDeploymentComplete = true;
                // Calculate reinforcements for the first regular turn
                this.remainingArmies[this.getCurrentPlayer()] = this.calculateReinforcements(this.getCurrentPlayer());
            }
        } else if (this.phase === 'deploy' && this.initialDeploymentComplete) {
            // Check if all players have finished their initial deployment round
            const allPlayersFinishedDeployment = this.players.every(player => 
                this.remainingArmies[player] === 0
            );
            
            if (allPlayersFinishedDeployment) {
                // Transition to regular game turns - start with reinforcement phase
                this.phase = 'reinforce';
                this.turnNumber = 1;
                this.currentPlayerIndex = 0; // Reset to first player for regular turns
                this.remainingArmies[this.getCurrentPlayer()] = this.calculateReinforcements(this.getCurrentPlayer());
            }
        }
    }

    // Check if the initial deployment phase (where all players deploy starting armies) is complete
    isInitialDeploymentComplete() {
        return this.initialDeploymentComplete && 
               this.players.every(player => this.remainingArmies[player] === 0);
    }

    // Start regular turn for current player
    startRegularTurn() {
        this.phase = 'reinforce';
        this.remainingArmies[this.getCurrentPlayer()] = this.calculateReinforcements(this.getCurrentPlayer());
    }

    getTerritoriesOwnedByPlayer(player) {
        return Object.entries(this.territories)
            .filter(([_, data]) => data.owner === player)
            .map(([name]) => name);
    }

    // Duplicate methods removed - using the implementations above

    isValidAttack(fromTerritory, toTerritory) {
        const from = this.territories[fromTerritory];
        const to = this.territories[toTerritory];

        return from && to && 
               from.owner === this.getCurrentPlayer() &&
               from.owner !== to.owner &&
               from.armies > 1 &&
               from.neighbors.includes(toTerritory);
    }

    isValidFortify(fromTerritory, toTerritory) {
        const from = this.territories[fromTerritory];
        const to = this.territories[toTerritory];

        return from && to &&
               from.owner === this.getCurrentPlayer() &&
               to.owner === this.getCurrentPlayer() &&
               from.armies > 1 &&
               this.areConnected(fromTerritory, toTerritory);
    }

    areConnected(territory1, territory2) {
        // Breadth-first search to find if territories are connected through owned territories
        const player = this.territories[territory1].owner;
        const visited = new Set();
        const queue = [territory1];

        while (queue.length > 0) {
            const current = queue.shift();
            if (current === territory2) return true;
            
            if (!visited.has(current)) {
                visited.add(current);
                const neighbors = this.territories[current].neighbors;
                for (const neighbor of neighbors) {
                    if (this.territories[neighbor].owner === player) {
                        queue.push(neighbor);
                    }
                }
            }
        }
        return false;
    }

    moveArmies(fromTerritory, toTerritory, count) {
        const from = this.territories[fromTerritory];
        const to = this.territories[toTerritory];

        if (from.armies <= count) {
            throw new Error('Must leave at least one army in territory');
        }

        from.armies -= count;
        to.armies += count;
    }

    resolveCombat(attackerDice, defenderDice) {
        // Sort dice in descending order
        attackerDice.sort((a, b) => b - a);
        defenderDice.sort((a, b) => b - a);

        const losses = { attacker: 0, defender: 0 };
        const comparisons = Math.min(attackerDice.length, defenderDice.length);

        for (let i = 0; i < comparisons; i++) {
            if (attackerDice[i] > defenderDice[i]) {
                losses.defender++;
            } else {
                losses.attacker++;
            }
        }

        return losses;
    }

    nextPhase() {
        switch (this.phase) {
            case 'setup':
                if (Object.values(this.territories).every(t => t.owner !== null)) {
                    this.phase = 'deploy';
                }
                break;
            case 'deploy':
                this.phase = 'attack';
                break;
            case 'attack':
                this.phase = 'fortify';
                break;
            case 'fortify':
                this.phase = 'deploy';
                this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
                if (this.currentPlayerIndex === 0) {
                    this.turnNumber++;
                }
                // Calculate new reinforcements for the next player
                const nextPlayer = this.getCurrentPlayer();
                this.remainingArmies[nextPlayer] = this.calculateReinforcements(nextPlayer);
                break;
        }
    }

    checkVictory() {
        const ownedTerritories = {};
        Object.values(this.territories).forEach(territory => {
            if (territory.owner) {
                ownedTerritories[territory.owner] = (ownedTerritories[territory.owner] || 0) + 1;
            }
        });

        const totalTerritories = Object.keys(this.territories).length;
        for (const [player, count] of Object.entries(ownedTerritories)) {
            if (count === totalTerritories) {
                return player;
            }
        }
        return null;
    }

    // Save current state to session storage
    saveToSession() {
        const state = {
            players: this.players,
            territories: this.territories,
            currentPlayerIndex: this.currentPlayerIndex,
            phase: this.phase,
            turnNumber: this.turnNumber,
            armiesPerTurn: this.armiesPerTurn,
            reinforcements: this.reinforcements,
            remainingArmies: this.remainingArmies,
            playerColors: this.playerColors,
            continentBonuses: this.continentBonuses,
            initialDeploymentComplete: this.initialDeploymentComplete,
            lastUpdate: Date.now()
        };
        sessionStorage.setItem(GameState.SESSION_KEY, JSON.stringify(state));
    }

    // Load state from session storage
    static loadFromSession() {
        const savedState = sessionStorage.getItem(GameState.SESSION_KEY);
        if (!savedState) return null;
        return JSON.parse(savedState);
    }

    // Clear saved game state
    static clearSavedGame() {
        sessionStorage.removeItem(GameState.SESSION_KEY);
    }

    // Clear saved game state
    static clearSavedGame() {
        sessionStorage.removeItem(GameState.SESSION_KEY);
    }

    // Get neighbors of a territory
    getNeighbors(territoryId) {
        const territory = this.territories[territoryId];
        return territory ? territory.neighbors || [] : [];
    }

    // Check if there's a saved game
    static hasSavedGame() {
        return !!sessionStorage.getItem(GameState.SESSION_KEY);
    }
}

// Make GameState available globally
window.GameState = GameState;