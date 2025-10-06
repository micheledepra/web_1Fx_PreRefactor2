/**
 * Enhanced Tooltip System for Risk Game
 * Shows territory information, ownership, armies, and available actions
 */
class EnhancedTooltip {
    constructor(colorManager, territoryVisualManager) {
        this.colorManager = colorManager;
        this.territoryVisualManager = territoryVisualManager;
        this.tooltip = null;
        this.isVisible = false;
        this.currentTerritory = null;
        this.gameState = null;
        this.currentPlayer = null;
        this.currentPhase = null;
        
        this.createTooltipElement();
        this.setupEventListeners();
    }

    /**
     * Create the tooltip DOM element
     */
    createTooltipElement() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'enhanced-tooltip';
        this.tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            pointer-events: none;
            z-index: 10000;
            display: none;
            min-width: 220px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.1);
        `;
        document.body.appendChild(this.tooltip);
    }

    /**
     * Set game context for tooltip information
     */
    setGameContext(gameState, currentPlayer, currentPhase) {
        this.gameState = gameState;
        this.currentPlayer = currentPlayer;
        this.currentPhase = currentPhase;
    }

    /**
     * Show tooltip for a territory
     */
    showTooltip(territoryId, event) {
        if (!this.gameState || !territoryId) return;

        this.currentTerritory = territoryId;
        const territoryData = this.gameState.territories[territoryId];
        
        if (!territoryData) return;

        const visualInfo = this.territoryVisualManager.getTerritoryVisualInfo(
            territoryId, 
            territoryData, 
            this.currentPlayer, 
            this.currentPhase
        );

        this.tooltip.innerHTML = this.generateTooltipContent(territoryId, territoryData, visualInfo);
        this.positionTooltip(event);
        
        this.tooltip.style.display = 'block';
        this.isVisible = true;

        // Add fade-in animation
        setTimeout(() => {
            this.tooltip.style.opacity = '1';
            this.tooltip.style.transform = 'translateY(0)';
        }, 10);
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (!this.isVisible) return;

        this.tooltip.style.opacity = '0';
        this.tooltip.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            this.tooltip.style.display = 'none';
            this.isVisible = false;
            this.currentTerritory = null;
        }, 200);
    }

    /**
     * Generate tooltip HTML content
     */
    generateTooltipContent(territoryId, territoryData, visualInfo) {
        const territoryName = this.formatTerritoryName(territoryId);
        const continent = this.getContinent(territoryId);
        
        let content = `
            <div class="tooltip-header" style="
                font-weight: bold; 
                font-size: 16px; 
                margin-bottom: 8px; 
                border-bottom: 1px solid rgba(255,255,255,0.3); 
                padding-bottom: 6px;
                color: #fff;
            ">
                ${territoryName}
            </div>
        `;

        // Owner information
        if (territoryData.owner) {
            const ownerColor = visualInfo.playerColor;
            const isCurrentPlayer = territoryData.owner === this.currentPlayer;
            content += `
                <div class="tooltip-row" style="display: flex; justify-content: space-between; margin: 6px 0;">
                    <span style="color: #ccc;">Owner:</span>
                    <span style="color: ${ownerColor}; font-weight: bold;">
                        ${territoryData.owner} ${isCurrentPlayer ? '(You)' : ''}
                    </span>
                </div>
            `;
        } else {
            content += `
                <div class="tooltip-row" style="display: flex; justify-content: space-between; margin: 6px 0;">
                    <span style="color: #ccc;">Owner:</span>
                    <span style="color: #999; font-style: italic;">Unoccupied</span>
                </div>
            `;
        }

        // Army count
        content += `
            <div class="tooltip-row" style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span style="color: #ccc;">Armies:</span>
                <span style="color: #FFC107; font-weight: bold;">${territoryData.armies}</span>
            </div>
        `;

        // Continent information
        if (continent) {
            content += `
                <div class="tooltip-row" style="display: flex; justify-content: space-between; margin: 6px 0;">
                    <span style="color: #ccc;">Continent:</span>
                    <span style="color: #81C784;">${continent}</span>
                </div>
            `;
        }

        // Available actions based on current phase
        const actions = this.getAvailableActions(visualInfo);
        if (actions.length > 0) {
            content += `
                <div class="tooltip-actions" style="
                    margin-top: 10px; 
                    padding-top: 8px; 
                    border-top: 1px solid rgba(255,255,255,0.2);
                ">
                    <div style="color: #4CAF50; font-weight: bold; margin-bottom: 4px;">Available Actions:</div>
                    ${actions.map(action => `
                        <div style="color: #E0E0E0; font-size: 12px; margin: 2px 0;">
                            • ${action}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Phase-specific tips
        const tips = this.getPhaseSpecificTips(visualInfo);
        if (tips.length > 0) {
            content += `
                <div class="tooltip-tips" style="
                    margin-top: 8px; 
                    padding-top: 6px; 
                    border-top: 1px solid rgba(255,255,255,0.1);
                ">
                    ${tips.map(tip => `
                        <div style="color: #FFB74D; font-size: 11px; margin: 2px 0; font-style: italic;">
                            💡 ${tip}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return content;
    }

    /**
     * Get available actions for the territory
     */
    getAvailableActions(visualInfo) {
        const actions = [];
        const { availableActions } = visualInfo;

        if (availableActions.canDeploy) {
            actions.push('Deploy reinforcements');
        }
        if (availableActions.canAttackFrom) {
            actions.push('Attack from here');
        }
        if (availableActions.canFortifyFrom) {
            actions.push('Move armies from here');
        }
        if (availableActions.canFortifyTo) {
            actions.push('Move armies to here');
        }

        return actions;
    }

    /**
     * Get phase-specific tips
     */
    getPhaseSpecificTips(visualInfo) {
        const tips = [];
        
        switch (this.currentPhase) {
            case 'deploy':
                if (visualInfo.isOwned) {
                    tips.push('Click to deploy reinforcements');
                } else {
                    tips.push('You can only deploy on your own territories');
                }
                break;
                
            case 'attack':
                if (visualInfo.isOwned && visualInfo.armies > 1) {
                    tips.push('Click to select as attacking territory');
                } else if (visualInfo.isOwned) {
                    tips.push('Need more than 1 army to attack');
                } else {
                    tips.push('Enemy territory - can be attacked');
                }
                break;
                
            case 'fortify':
                if (visualInfo.isOwned && visualInfo.armies > 1) {
                    tips.push('Click to move armies from here');
                } else if (visualInfo.isOwned) {
                    tips.push('Can receive armies from other territories');
                } else {
                    tips.push('Cannot fortify enemy territories');
                }
                break;
        }

        return tips;
    }

    /**
     * Position tooltip near the cursor
     */
    positionTooltip(event) {
        const margin = 15;
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        let x = event.clientX + margin;
        let y = event.clientY - tooltipRect.height - margin;

        // Adjust if tooltip would go off-screen
        if (x + tooltipRect.width > window.innerWidth) {
            x = event.clientX - tooltipRect.width - margin;
        }
        if (y < 0) {
            y = event.clientY + margin;
        }

        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = y + 'px';
        this.tooltip.style.opacity = '0';
        this.tooltip.style.transform = 'translateY(-10px)';
        this.tooltip.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    }

    /**
     * Format territory name for display
     */
    formatTerritoryName(territoryId) {
        return territoryId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Get continent name for territory
     */
    getContinent(territoryId) {
        const continentMap = {
            // North America
            'alaska': 'North America',
            'alberta': 'North America',
            'central-america': 'North America',
            'eastern-united-states': 'North America',
            'greenland': 'North America',
            'northwest-territory': 'North America',
            'ontario': 'North America',
            'quebec': 'North America',
            'western-united-states': 'North America',
            
            // South America
            'argentina': 'South America',
            'brazil': 'South America',
            'peru': 'South America',
            'venezuela': 'South America',
            
            // Europe
            'great-britain': 'Europe',
            'iceland': 'Europe',
            'northern-europe': 'Europe',
            'scandinavia': 'Europe',
            'southern-europe': 'Europe',
            'ukraine': 'Europe',
            'western-europe': 'Europe',
            
            // Africa
            'congo': 'Africa',
            'east-africa': 'Africa',
            'egypt': 'Africa',
            'madagascar': 'Africa',
            'north-africa': 'Africa',
            'south-africa': 'Africa',
            
            // Asia
            'afghanistan': 'Asia',
            'china': 'Asia',
            'india': 'Asia',
            'irkutsk': 'Asia',
            'japan': 'Asia',
            'kamchatka': 'Asia',
            'middle-east': 'Asia',
            'mongolia': 'Asia',
            'siam': 'Asia',
            'siberia': 'Asia',
            'ural': 'Asia',
            'yakutsk': 'Asia',
            
            // Australia
            'eastern-australia': 'Australia',
            'indonesia': 'Australia',
            'new-guinea': 'Australia',
            'western-australia': 'Australia'
        };
        
        return continentMap[territoryId.toLowerCase()] || 'Unknown';
    }

    /**
     * Setup event listeners for mouse tracking
     */
    setupEventListeners() {
        document.addEventListener('mousemove', (event) => {
            if (this.isVisible) {
                this.positionTooltip(event);
            }
        });
    }

    /**
     * Update tooltip if currently visible
     */
    updateTooltip() {
        if (this.isVisible && this.currentTerritory) {
            const event = { clientX: 0, clientY: 0 }; // Will be repositioned on next mouse move
            this.showTooltip(this.currentTerritory, event);
        }
    }

    /**
     * Destroy tooltip
     */
    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedTooltip };
}