/**
 * CombatAnimations.js
 * 
 * Handles all visual animations for the RISK game combat system:
 * - Dice rolling with physics effects
 * - Army removal animations
 * - Territory conquest color change effects
 * - Troop movement animations after conquest
 */

class CombatAnimations {
    constructor() {
        // Configuration settings
        this.config = {
            diceRollDuration: 1000, // ms
            diceRotations: 3, // number of full rotations
            armyRemovalDuration: 800, // ms
            conquestTransitionDuration: 1500, // ms
            troopMovementDuration: 1200 // ms
        };
        
        // Container for active animations
        this.activeAnimations = {
            dice: [],
            armies: [],
            territories: [],
            troops: []
        };
        
        // Initialize animation system
        this.init();
    }
    
    /**
     * Initialize the animation system
     */
    init() {
        // Create container for dice rolling animations if it doesn't exist
        this.diceContainer = document.getElementById('dice-animation-container');
        if (!this.diceContainer) {
            this.diceContainer = document.createElement('div');
            this.diceContainer.id = 'dice-animation-container';
            this.diceContainer.className = 'dice-animation-container';
            document.body.appendChild(this.diceContainer);
        }
        
        console.log('Combat animation system initialized');
    }
    
    /**
     * Animate dice rolling with physics effects
     * @param {Array} attackerValues - Array of dice values for attacker (1-6)
     * @param {Array} defenderValues - Array of dice values for defender (1-6)
     * @param {Function} onComplete - Callback function when animation completes
     * @returns {Promise} - Promise that resolves when animation completes
     */
    animateDiceRoll(attackerValues, defenderValues, onComplete = null) {
        return new Promise((resolve) => {
            // Clear any existing dice animations
            this.clearDiceAnimations();
            
            // Create and animate attacker dice
            const attackerDice = this.createDice(attackerValues, 'attacker');
            
            // Create and animate defender dice
            const defenderDice = this.createDice(defenderValues, 'defender');
            
            // Track all dice for animation
            const allDice = [...attackerDice, ...defenderDice];
            
            // Apply initial physics state
            allDice.forEach(die => {
                this.applyPhysicsInitialState(die);
            });
            
            // Show dice container
            this.diceContainer.style.display = 'flex';
            
            // Trigger roll animation
            setTimeout(() => {
                allDice.forEach(die => {
                    this.rollDie(die);
                });
                
                // Hide animation after completion
                setTimeout(() => {
                    // Show final values
                    allDice.forEach(die => {
                        this.showFinalDieValue(die);
                    });
                    
                    // Compare dice and show winners/losers
                    this.highlightDiceResults(attackerDice, defenderDice);
                    
                    // Execute completion callback if provided
                    if (typeof onComplete === 'function') {
                        onComplete();
                    }
                    
                    // Resolve the promise
                    resolve();
                    
                }, this.config.diceRollDuration);
            }, 50);  // Small delay for animation to start properly
        });
    }
    
    /**
     * Create animated dice elements
     * @param {Array} values - Array of dice values
     * @param {String} player - 'attacker' or 'defender'
     * @returns {Array} - Array of dice DOM elements
     */
    createDice(values, player) {
        const dice = [];
        const isAttacker = player === 'attacker';
        const side = isAttacker ? 'left' : 'right';
        const color = isAttacker ? '#3498db' : '#e74c3c';
        
        values.forEach((value, index) => {
            // Create die element
            const die = document.createElement('div');
            die.className = `animated-die ${player}-die`;
            die.dataset.value = value;
            die.dataset.index = index;
            die.dataset.player = player;
            
            // Create die faces (showing ?)
            for (let i = 1; i <= 6; i++) {
                const face = document.createElement('div');
                face.className = `die-face die-face-${i}`;
                face.textContent = i;
                die.appendChild(face);
            }
            
            // Add question mark face for initial state
            const questionFace = document.createElement('div');
            questionFace.className = 'die-face die-face-question';
            questionFace.textContent = '?';
            die.appendChild(questionFace);
            
            // Position die
            die.style.cssText = `
                position: relative;
                margin: 5px;
                color: ${color};
                border-color: ${color};
            `;
            
            // Add to container
            this.diceContainer.appendChild(die);
            dice.push(die);
            
            // Track animation
            this.activeAnimations.dice.push(die);
        });
        
        return dice;
    }
    
    /**
     * Apply physics-based initial state to dice
     * @param {HTMLElement} die - Dice DOM element
     */
    applyPhysicsInitialState(die) {
        // Random initial position offset
        const xOffset = Math.random() * 20 - 10;
        const yOffset = Math.random() * 20 - 30;
        
        // Apply transform
        die.style.transform = `translate(${xOffset}px, ${yOffset}px) scale(0.8)`;
        die.style.opacity = '0';
        
        // Trigger animation
        setTimeout(() => {
            die.style.transition = 'all 0.3s ease-out';
            die.style.transform = 'translate(0, 0) scale(1)';
            die.style.opacity = '1';
        }, 50 + Math.random() * 100);
    }
    
    /**
     * Animate die rolling
     * @param {HTMLElement} die - Dice DOM element
     */
    rollDie(die) {
        // Get random rotation values for physics effect
        const rotX = 360 * this.config.diceRotations + Math.random() * 360;
        const rotY = 360 * this.config.diceRotations + Math.random() * 360;
        const rotZ = Math.random() * 360;
        
        // Apply the rolling animation
        die.style.transition = `transform ${this.config.diceRollDuration / 1000}s cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
        die.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
        
        // Hide question mark face
        setTimeout(() => {
            const questionFace = die.querySelector('.die-face-question');
            if (questionFace) {
                questionFace.style.display = 'none';
            }
        }, this.config.diceRollDuration * 0.5);
    }
    
    /**
     * Show the final value of a die after rolling
     * @param {HTMLElement} die - Dice DOM element 
     */
    showFinalDieValue(die) {
        const value = die.dataset.value;
        
        // Reset transform to show the correct face
        die.style.transition = 'transform 0.5s ease-out';
        die.style.transform = 'rotateX(0) rotateY(0) rotateZ(0)';
        
        // Add or update the value display
        let valueDisplay = die.querySelector('.die-value-display');
        if (!valueDisplay) {
            valueDisplay = document.createElement('div');
            valueDisplay.className = 'die-value-display';
            die.appendChild(valueDisplay);
        }
        
        valueDisplay.textContent = value;
        valueDisplay.style.display = 'flex';
    }
    
    /**
     * Highlight dice results (winners and losers)
     * @param {Array} attackerDice - Array of attacker dice elements 
     * @param {Array} defenderDice - Array of defender dice elements
     */
    highlightDiceResults(attackerDice, defenderDice) {
        // Sort dice by value (highest first)
        const sortedAttackerDice = [...attackerDice].sort((a, b) => 
            parseInt(b.dataset.value) - parseInt(a.dataset.value)
        );
        
        const sortedDefenderDice = [...defenderDice].sort((a, b) => 
            parseInt(b.dataset.value) - parseInt(a.dataset.value)
        );
        
        // Compare each pair of dice
        const comparisons = Math.min(sortedAttackerDice.length, sortedDefenderDice.length);
        
        for (let i = 0; i < comparisons; i++) {
            const attackDie = sortedAttackerDice[i];
            const defendDie = sortedDefenderDice[i];
            
            const attackValue = parseInt(attackDie.dataset.value);
            const defendValue = parseInt(defendDie.dataset.value);
            
            if (attackValue > defendValue) {
                // Attacker wins
                attackDie.classList.add('winner-die');
                defendDie.classList.add('loser-die');
            } else {
                // Defender wins
                defendDie.classList.add('winner-die');
                attackDie.classList.add('loser-die');
            }
        }
    }
    
    /**
     * Clear any active dice animations
     */
    clearDiceAnimations() {
        // Remove all dice elements
        while (this.diceContainer.firstChild) {
            this.diceContainer.removeChild(this.diceContainer.firstChild);
        }
        
        // Clear tracked animations
        this.activeAnimations.dice = [];
    }
    
    /**
     * Animate army removal when casualties occur
     * @param {String} territoryId - ID of territory losing armies
     * @param {Number} count - Number of armies to remove
     * @returns {Promise} - Promise that resolves when animation completes
     */
    animateArmyRemoval(territoryId, count) {
        return new Promise((resolve) => {
            const territory = document.getElementById(territoryId);
            if (!territory) {
                resolve();
                return;
            }
            
            const territoryRect = territory.getBoundingClientRect();
            const centerX = territoryRect.left + territoryRect.width / 2;
            const centerY = territoryRect.top + territoryRect.height / 2;
            
            // Create army indicators that will fade away
            for (let i = 0; i < count; i++) {
                const armyIndicator = document.createElement('div');
                armyIndicator.className = 'army-removal-indicator';
                
                // Position randomly around territory center
                const angle = Math.random() * Math.PI * 2;
                const distance = 20 + Math.random() * 20;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;
                
                armyIndicator.style.cssText = `
                    position: absolute;
                    left: ${x}px;
                    top: ${y}px;
                    transform: translate(-50%, -50%);
                    z-index: 100;
                    animation: armyRemoval ${this.config.armyRemovalDuration / 1000}s ease-out;
                `;
                
                document.body.appendChild(armyIndicator);
                this.activeAnimations.armies.push(armyIndicator);
                
                // Remove after animation completes
                setTimeout(() => {
                    document.body.removeChild(armyIndicator);
                    const index = this.activeAnimations.armies.indexOf(armyIndicator);
                    if (index > -1) {
                        this.activeAnimations.armies.splice(index, 1);
                    }
                }, this.config.armyRemovalDuration);
            }
            
            // Add explosion effect at territory center
            const explosion = document.createElement('div');
            explosion.className = 'explosion-effect';
            explosion.style.cssText = `
                position: absolute;
                left: ${centerX}px;
                top: ${centerY}px;
                transform: translate(-50%, -50%);
                z-index: 99;
            `;
            
            document.body.appendChild(explosion);
            
            // Remove explosion after animation
            setTimeout(() => {
                document.body.removeChild(explosion);
                resolve();
            }, this.config.armyRemovalDuration);
        });
    }
    
    /**
     * Animate territory conquest with color change effect
     * @param {String} territoryId - ID of conquered territory
     * @param {String} fromColor - Original color (hex or CSS color)
     * @param {String} toColor - New owner's color (hex or CSS color)
     * @returns {Promise} - Promise that resolves when animation completes
     */
    animateConquest(territoryId, fromColor, toColor) {
        return new Promise((resolve) => {
            const territory = document.getElementById(territoryId);
            if (!territory) {
                resolve();
                return;
            }
            
            // Save original fill
            const originalFill = territory.getAttribute('fill') || fromColor;
            
            // Create conquest overlay
            const territoryRect = territory.getBoundingClientRect();
            const svgRect = document.getElementById('risk-map').getBoundingClientRect();
            
            // Position relative to SVG
            const left = territoryRect.left - svgRect.left;
            const top = territoryRect.top - svgRect.top;
            
            // Create wave effect overlay
            const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            overlay.setAttribute('x', left);
            overlay.setAttribute('y', top);
            overlay.setAttribute('width', territoryRect.width);
            overlay.setAttribute('height', 0); // Start with no height
            overlay.setAttribute('fill', toColor);
            overlay.setAttribute('fill-opacity', '0.7');
            overlay.setAttribute('class', 'conquest-animation');
            
            // Add to map
            const mapContainer = document.querySelector('.map-group');
            mapContainer.appendChild(overlay);
            this.activeAnimations.territories.push(overlay);
            
            // Apply "wave" animation
            let progress = 0;
            const duration = this.config.conquestTransitionDuration;
            const startTime = performance.now();
            
            const animateFrame = (timestamp) => {
                const elapsed = timestamp - startTime;
                progress = Math.min(elapsed / duration, 1);
                
                // Wave animation (grows from bottom to top)
                overlay.setAttribute('height', territoryRect.height * progress);
                overlay.setAttribute('y', top + territoryRect.height * (1 - progress));
                
                if (progress < 1) {
                    requestAnimationFrame(animateFrame);
                } else {
                    // Animation complete, change territory color
                    territory.setAttribute('fill', toColor);
                    
                    // Add flash effect
                    territory.classList.add('conquest-flash');
                    setTimeout(() => {
                        territory.classList.remove('conquest-flash');
                    }, 500);
                    
                    // Remove overlay
                    mapContainer.removeChild(overlay);
                    const index = this.activeAnimations.territories.indexOf(overlay);
                    if (index > -1) {
                        this.activeAnimations.territories.splice(index, 1);
                    }
                    
                    resolve();
                }
            };
            
            requestAnimationFrame(animateFrame);
        });
    }
    
    /**
     * Animate troop movement after conquest
     * @param {String} fromTerritoryId - Source territory ID
     * @param {String} toTerritoryId - Destination territory ID
     * @param {Number} count - Number of troops to move
     * @returns {Promise} - Promise that resolves when animation completes
     */
    animateTroopMovement(fromTerritoryId, toTerritoryId, count) {
        return new Promise((resolve) => {
            const fromTerritory = document.getElementById(fromTerritoryId);
            const toTerritory = document.getElementById(toTerritoryId);
            
            if (!fromTerritory || !toTerritory) {
                resolve();
                return;
            }
            
            const fromRect = fromTerritory.getBoundingClientRect();
            const toRect = toTerritory.getBoundingClientRect();
            
            const startX = fromRect.left + fromRect.width / 2;
            const startY = fromRect.top + fromRect.height / 2;
            const endX = toRect.left + toRect.width / 2;
            const endY = toRect.top + toRect.height / 2;
            
            // Create moving army indicators
            for (let i = 0; i < Math.min(count, 10); i++) { // Limit to 10 visual indicators
                const delay = i * 100; // Stagger the movement
                
                const troopIndicator = document.createElement('div');
                troopIndicator.className = 'troop-movement-indicator';
                
                // Add small random offset for natural movement
                const offsetX = Math.random() * 20 - 10;
                const offsetY = Math.random() * 20 - 10;
                
                troopIndicator.style.cssText = `
                    position: absolute;
                    left: ${startX + offsetX}px;
                    top: ${startY + offsetY}px;
                    transform: translate(-50%, -50%);
                    z-index: 100;
                `;
                
                document.body.appendChild(troopIndicator);
                this.activeAnimations.troops.push(troopIndicator);
                
                // Animate movement
                setTimeout(() => {
                    troopIndicator.style.transition = `all ${this.config.troopMovementDuration / 1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
                    troopIndicator.style.left = `${endX + offsetX}px`;
                    troopIndicator.style.top = `${endY + offsetY}px`;
                }, delay);
                
                // Remove after animation completes
                setTimeout(() => {
                    document.body.removeChild(troopIndicator);
                    const index = this.activeAnimations.troops.indexOf(troopIndicator);
                    if (index > -1) {
                        this.activeAnimations.troops.splice(index, 1);
                    }
                }, this.config.troopMovementDuration + delay + 100);
            }
            
            // Resolve after all animations complete
            setTimeout(resolve, this.config.troopMovementDuration + (count * 100) + 100);
        });
    }
    
    /**
     * Stop all active animations
     */
    stopAllAnimations() {
        // Clear dice animations
        this.clearDiceAnimations();
        
        // Remove army indicators
        this.activeAnimations.armies.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.activeAnimations.armies = [];
        
        // Remove territory animations
        this.activeAnimations.territories.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.activeAnimations.territories = [];
        
        // Remove troop movement indicators
        this.activeAnimations.troops.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.activeAnimations.troops = [];
    }
}

// Create global instance
window.combatAnimations = new CombatAnimations();