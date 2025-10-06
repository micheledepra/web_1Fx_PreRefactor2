/**
 * Attack Path Visualizer
 * Creates animated SVG arrows between attacking and defending territories
 */

class AttackPathVisualizer {
    constructor() {
        this.arrows = [];
        this.svgContainer = null;
        this.initialize();
    }

    /**
     * Initialize the SVG container for arrows
     */
    initialize() {
        // Check if SVG container already exists
        this.svgContainer = document.getElementById('attack-path-container');
        if (!this.svgContainer) {
            // Create SVG container for arrows
            this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            this.svgContainer.id = 'attack-path-container';
            this.svgContainer.style.position = 'absolute';
            this.svgContainer.style.top = '0';
            this.svgContainer.style.left = '0';
            this.svgContainer.style.width = '100%';
            this.svgContainer.style.height = '100%';
            this.svgContainer.style.pointerEvents = 'none';
            this.svgContainer.style.zIndex = '50';
            
            // Add SVG container to the map container
            const mapContainer = document.querySelector('.map-container');
            if (mapContainer) {
                mapContainer.appendChild(this.svgContainer);
            }
        }
    }

    /**
     * Create an attack path arrow between two territories
     * @param {string} fromTerritory - ID of the attacking territory
     * @param {string} toTerritory - ID of the defending territory
     * @returns {SVGElement} - The created arrow
     */
    createAttackPath(fromTerritory, toTerritory) {
        const fromElement = document.getElementById(fromTerritory);
        const toElement = document.getElementById(toTerritory);
        
        if (!fromElement || !toElement || !this.svgContainer) {
            console.error('Cannot create attack path: Invalid territories or SVG container');
            return null;
        }
        
        // Calculate center points
        const fromRect = fromElement.getBBox();
        const toRect = toElement.getBBox();
        
        const fromCenter = {
            x: fromRect.x + fromRect.width / 2,
            y: fromRect.y + fromRect.height / 2
        };
        
        const toCenter = {
            x: toRect.x + toRect.width / 2,
            y: toRect.y + toRect.height / 2
        };
        
        // Create arrow
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrow.setAttribute('d', `M${fromCenter.x},${fromCenter.y} L${toCenter.x},${toCenter.y}`);
        arrow.setAttribute('stroke', '#ff6600');
        arrow.setAttribute('stroke-width', '3');
        arrow.setAttribute('marker-end', 'url(#arrowhead)');
        arrow.setAttribute('opacity', '0.7');
        arrow.setAttribute('class', 'attack-path-arrow');
        
        // Add animation
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'stroke-dashoffset');
        animate.setAttribute('from', '100');
        animate.setAttribute('to', '0');
        animate.setAttribute('dur', '1s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        arrow.appendChild(animate);
        
        // Add arrowhead marker if it doesn't exist
        if (!document.getElementById('arrowhead')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3.5');
            marker.setAttribute('orient', 'auto');
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
            polygon.setAttribute('fill', '#ff6600');
            
            marker.appendChild(polygon);
            defs.appendChild(marker);
            this.svgContainer.appendChild(defs);
        }
        
        // Add the arrow to the SVG container
        this.svgContainer.appendChild(arrow);
        this.arrows.push({
            id: `${fromTerritory}-to-${toTerritory}`,
            element: arrow,
            from: fromTerritory,
            to: toTerritory
        });
        
        return arrow;
    }

    /**
     * Remove all attack path arrows
     */
    clearAttackPaths() {
        this.arrows.forEach(arrow => {
            if (arrow.element && arrow.element.parentNode) {
                arrow.element.parentNode.removeChild(arrow.element);
            }
        });
        this.arrows = [];
    }
    
    /**
     * Update the position of an existing attack path
     * @param {string} fromTerritory - ID of the attacking territory
     * @param {string} toTerritory - ID of the defending territory
     */
    updateAttackPath(fromTerritory, toTerritory) {
        // Find existing arrow
        const existingArrow = this.arrows.find(arrow => 
            arrow.from === fromTerritory && arrow.to === toTerritory);
        
        if (existingArrow) {
            // Remove existing arrow
            if (existingArrow.element && existingArrow.element.parentNode) {
                existingArrow.element.parentNode.removeChild(existingArrow.element);
            }
            
            // Create new arrow at the updated position
            this.createAttackPath(fromTerritory, toTerritory);
        }
    }
    
    /**
     * Create multiple attack paths for a list of territory pairs
     * @param {Array} pathPairs - Array of objects with fromTerritory and toTerritory
     */
    createMultiplePaths(pathPairs) {
        this.clearAttackPaths();
        pathPairs.forEach(pair => {
            this.createAttackPath(pair.fromTerritory, pair.toTerritory);
        });
    }
}