/**
 * ColorManager - Centralized color management for the Risk game
 * Handles player colors, territory coloring, and visual state management
 */
class ColorManager {
    constructor() {
        this.playerColors = {};
        this.defaultColors = [
            '#ff4444', // Red
            '#44ff44', // Green
            '#4444ff', // Blue
            '#ffff44', // Yellow
            '#ff44ff', // Magenta
            '#44ffff'  // Cyan
        ];
        this.neutralTerritoryColor = '#F4D03F';
        this.initializeColors();
    }

    /**
     * Initialize player colors from sessionStorage or use defaults
     */
    initializeColors() {
        try {
            const storedPlayers = sessionStorage.getItem('riskPlayers');
            const storedColors = sessionStorage.getItem('riskPlayerColors');
            
            if (storedPlayers && storedColors) {
                const players = JSON.parse(storedPlayers);
                const colors = JSON.parse(storedColors);
                
                players.forEach((player, index) => {
                    this.playerColors[player] = colors[index] || this.defaultColors[index];
                });
            }
        } catch (error) {
            console.warn('Failed to load colors from sessionStorage:', error);
        }
    }

    /**
     * Get color for a specific player
     */
    getPlayerColor(player) {
        return this.playerColors[player] || this.neutralTerritoryColor;
    }

    /**
     * Set color for a player
     */
    setPlayerColor(player, color) {
        this.playerColors[player] = color;
        this.saveColorsToStorage();
    }

    /**
     * Get all player colors
     */
    getAllPlayerColors() {
        return { ...this.playerColors };
    }

    /**
     * Get neutral territory color
     */
    getNeutralColor() {
        return this.neutralTerritoryColor;
    }

    /**
     * Get color with opacity for highlighting
     */
    getColorWithOpacity(player, opacity = 0.7) {
        const color = this.getPlayerColor(player);
        // Convert hex to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    /**
     * Get contrasting text color (black or white) for a given background color
     */
    getContrastingTextColor(backgroundColor) {
        // Convert hex to RGB
        const r = parseInt(backgroundColor.slice(1, 3), 16);
        const g = parseInt(backgroundColor.slice(3, 5), 16);
        const b = parseInt(backgroundColor.slice(5, 7), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    /**
     * Save colors to sessionStorage
     */
    saveColorsToStorage() {
        try {
            const players = Object.keys(this.playerColors);
            const colors = players.map(player => this.playerColors[player]);
            sessionStorage.setItem('riskPlayers', JSON.stringify(players));
            sessionStorage.setItem('riskPlayerColors', JSON.stringify(colors));
        } catch (error) {
            console.warn('Failed to save colors to sessionStorage:', error);
        }
    }

    /**
     * Get phase-specific highlighting colors
     */
    getPhaseColors() {
        return {
            selected: '#FFD700',      // Gold for selected territory
            validTarget: '#4CAF50',   // Green for valid targets
            invalidTarget: '#F44336', // Red for invalid targets
            ownTerritory: '#2196F3',  // Blue for own territories
            hover: '#FF9800',         // Orange for hover
            'valid-source': '#4CAF50',       // Green for valid fortify sources
            'valid-destination': '#2196F3',  // Blue for valid fortify destinations
            'selected-source': '#FF9800',    // Orange for selected source
            'selected-destination': '#E91E63' // Pink for selected destination
        };
    }
}

/**
 * TerritoryVisualManager - Handles visual representation of territories
 */
class TerritoryVisualManager {
    constructor(colorManager) {
        this.colorManager = colorManager;
        this.armyCountElements = new Map();
        this.highlightStates = new Map();
        this.phaseColors = this.colorManager.getPhaseColors();
    }

    /**
     * Update territory color based on ownership
     */
    updateTerritoryColor(territoryId, owner) {
        const territoryElement = document.getElementById(territoryId);
        if (!territoryElement) return;

        const color = owner ? 
            this.colorManager.getPlayerColor(owner) : 
            this.colorManager.getNeutralColor();
        
        territoryElement.style.fill = color;
        territoryElement.setAttribute('data-owner', owner || '');
    }

    /**
     * Update or create army count indicator on territory
     */
    updateArmyCount(territoryId, armyCount, owner) {
        this.removeArmyCount(territoryId);
        
        if (armyCount <= 0) return;

        const territoryElement = document.getElementById(territoryId);
        if (!territoryElement) return;

        // Get territory center
        const bbox = territoryElement.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;

        // Create background circle
        const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        bgCircle.setAttribute("id", `${territoryId}-army-bg`);
        bgCircle.setAttribute("cx", centerX);
        bgCircle.setAttribute("cy", centerY);
        bgCircle.setAttribute("r", "12");
        bgCircle.setAttribute("fill", "rgba(0, 0, 0, 0.7)");
        bgCircle.setAttribute("stroke", "#fff");
        bgCircle.setAttribute("stroke-width", "1");
        bgCircle.style.pointerEvents = "none";

        // Create text element
        const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textElement.setAttribute("id", `${territoryId}-army-count`);
        textElement.setAttribute("x", centerX);
        textElement.setAttribute("y", centerY);
        textElement.setAttribute("text-anchor", "middle");
        textElement.setAttribute("dominant-baseline", "middle");
        textElement.setAttribute("fill", "#fff");
        textElement.setAttribute("font-size", "12");
        textElement.setAttribute("font-weight", "bold");
        textElement.style.pointerEvents = "none";
        textElement.textContent = armyCount > 999 ? `${Math.floor(armyCount/1000)}K` : armyCount.toString();

        // Add to SVG
        const svgElement = territoryElement.closest('svg');
        if (svgElement) {
            svgElement.appendChild(bgCircle);
            svgElement.appendChild(textElement);
            
            this.armyCountElements.set(territoryId, {
                background: bgCircle,
                text: textElement
            });
        }
    }

    /**
     * Remove army count indicator
     */
    removeArmyCount(territoryId) {
        const elements = this.armyCountElements.get(territoryId);
        if (elements) {
            elements.background.remove();
            elements.text.remove();
            this.armyCountElements.delete(territoryId);
        }
    }

    /**
     * Highlight territory for specific phase
     */
    highlightTerritory(territoryId, highlightType, active = true) {
        const territoryElement = document.getElementById(territoryId);
        if (!territoryElement) return;

        if (!active) {
            this.clearHighlight(territoryId);
            return;
        }

        const color = this.phaseColors[highlightType] || this.phaseColors.hover;
        territoryElement.style.stroke = color;
        territoryElement.style.strokeWidth = "3";
        territoryElement.classList.add(`highlight-${highlightType}`);
        
        this.highlightStates.set(territoryId, highlightType);
    }

    /**
     * Clear highlight from territory
     */
    clearHighlight(territoryId) {
        const territoryElement = document.getElementById(territoryId);
        if (!territoryElement) return;

        territoryElement.style.stroke = "#333";
        territoryElement.style.strokeWidth = "1";
        
        // Remove all highlight classes
        const classList = territoryElement.classList;
        for (let i = classList.length - 1; i >= 0; i--) {
            if (classList[i].startsWith('highlight-')) {
                classList.remove(classList[i]);
            }
        }
        
        this.highlightStates.delete(territoryId);
    }

    /**
     * Clear all highlights
     */
    clearAllHighlights() {
        this.highlightStates.forEach((_, territoryId) => {
            this.clearHighlight(territoryId);
        });
    }

    /**
     * Update territory visual state (color, army count, highlighting)
     */
    updateTerritoryVisual(territoryId, territoryData, highlightType = null) {
        this.updateTerritoryColor(territoryId, territoryData.owner);
        this.updateArmyCount(territoryId, territoryData.armies, territoryData.owner);
        
        if (highlightType) {
            this.highlightTerritory(territoryId, highlightType);
        }
    }

    /**
     * Get territory visual information for tooltips
     */
    getTerritoryVisualInfo(territoryId, territoryData, currentPlayer, currentPhase) {
        const isOwned = territoryData.owner === currentPlayer;
        const hasArmies = territoryData.armies > 0;
        const canDeploy = isOwned && currentPhase === 'deploy';
        const canAttackFrom = isOwned && territoryData.armies > 1 && currentPhase === 'attack';
        const canFortifyFrom = isOwned && territoryData.armies > 1 && currentPhase === 'fortify';
        const canFortifyTo = isOwned && currentPhase === 'fortify';

        return {
            territoryId,
            owner: territoryData.owner,
            armies: territoryData.armies,
            playerColor: territoryData.owner ? this.colorManager.getPlayerColor(territoryData.owner) : null,
            isOwned,
            hasArmies,
            availableActions: {
                canDeploy,
                canAttackFrom,
                canFortifyFrom,
                canFortifyTo
            }
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ColorManager, TerritoryVisualManager };
}