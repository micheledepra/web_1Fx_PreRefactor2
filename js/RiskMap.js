class RiskMap {
    constructor(riskUI) {
        this.riskUI = riskUI;
        this.svg = document.getElementById('risk-map');
        this.mapGroup = this.svg.querySelector('.map-group');
        this.tooltip = document.querySelector('.tooltip');
        this.territoryTooltip = document.querySelector('.territory-tooltip');
        
        // Always recreate the territory tooltip to ensure it's properly initialized
        if (this.territoryTooltip) {
            this.territoryTooltip.remove();
        }
        this.territoryTooltip = document.createElement('div');
        this.territoryTooltip.className = 'territory-tooltip';
        document.querySelector('.map-container').appendChild(this.territoryTooltip);
        
        this.selectedTerritory = null;
        this.scale = 1;
        
        // Map transformation state
        const rect = this.svg.getBoundingClientRect();
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.lastX = this.translateX;
        this.lastY = this.translateY;
        this.minScale = 0.001;
        this.maxScale = 5;

        this.init();
    }

    init() {
        this.setupViewBox();
        this.createTerritoryPaths();
        this.populateContinentList();
        this.setupEventListeners();
    }

    setupViewBox() {
        const container = this.svg.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Set initial viewBox dimensions
        const viewBoxWidth = 1600;
        const viewBoxHeight = 900;
        
        // Calculate scaling factors
        const scaleX = containerWidth / viewBoxWidth;
        const scaleY = containerHeight / viewBoxHeight;
        const scale = Math.min(scaleX, scaleY) * 0.95;
        
        // Set viewBox
        this.svg.setAttribute('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
        
        // Update map group transform
        if (this.mapGroup) {
            const translateX = (containerWidth - (viewBoxWidth * scale)) / 2;
            const translateY = (containerHeight - (viewBoxHeight * scale)) / 2;
            this.mapGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
            
            // Store initial values
            this.initialScale = scale;
            this.initialTranslateX = translateX;
            this.initialTranslateY = translateY;
        }
    }

    createTerritoryPaths() {
        Object.entries(mapData.continents).forEach(([continentId, continent]) => {
            const group = document.getElementById(continentId);
            if (!group) {
                console.error('Continent group not found:', continentId);
                return;
            }

            continent.territories.forEach(territory => {
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute('id', territory);
                path.setAttribute('class', 'territory');
                path.setAttribute('data-name', territory.toUpperCase());
                
                if (territoryPaths && territoryPaths[territory]) {
                    path.setAttribute('d', territoryPaths[territory]);
                } else {
                    console.warn(`No path data for territory: ${territory}`);
                }
                
                group.appendChild(path);
            });
        });
    }

    populateContinentList() {
        const continentList = document.querySelector('.continent-list');
        Object.entries(mapData.continents).forEach(([id, continent]) => {
            const item = document.createElement('div');
            item.className = 'continent-item';
            item.innerHTML = `
                <span>${continent.name}</span>
                <span class="bonus-value">+${continent.captureBonus}</span>
            `;
            item.addEventListener('click', () => this.highlightContinent(id));
            continentList.appendChild(item);
        });
    }

    setupEventListeners() {
        // Territory interactions
        document.querySelectorAll('.territory').forEach(territory => {
            territory.addEventListener('mousemove', (e) => this.handleTerritoryHover(e));
            territory.addEventListener('mouseleave', () => this.hideTooltip());
            territory.addEventListener('click', (e) => this.handleTerritoryClick(e));
        });

        // Map controls
        this.setupMapControls();
    }

    setupMapControls() {
        // Pan/Drag events
        this.svg.addEventListener('mousedown', (e) => this.startDragging(e));
        this.svg.addEventListener('mousemove', (e) => this.handleDrag(e));
        this.svg.addEventListener('mouseup', () => this.stopDragging());
        this.svg.addEventListener('mouseleave', () => this.stopDragging());

        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('reset-zoom').addEventListener('click', () => this.resetZoom());
        document.getElementById('reset-view').addEventListener('click', () => this.resetView());

        // Mouse wheel zoom
        this.svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = 1.1;
            const rect = this.svg.getBoundingClientRect();
            const newScale = e.deltaY > 0 
                ? this.scale / zoomFactor  // Zoom out
                : this.scale * zoomFactor; // Zoom in
            
            // Pass the mouse coordinates for centered zooming
            this.zoomAtPoint(e.clientX, e.clientY, newScale);
        });
    }

    handleTerritoryClick(event) {
        const territory = event.target;
        const territoryName = territory.getAttribute('id');
        if (this.riskUI) {
            this.riskUI.handleTerritoryClick(territoryName);
        }
    }

    handleTerritoryHover(event) {
        const territory = event.target;
        const territoryId = territory.getAttribute('id');
        territory.style.fillOpacity = '0.8';
        this.showTerritoryTooltip(event, territoryId);
    }

    showTerritoryTooltip(event, territoryId) {
        if (!this.territoryTooltip) return;

        const territoryInfo = this.getTerritoryInfo(territoryId);
        const owner = territoryInfo.owner || 'Unclaimed';
        const ownerColor = owner !== 'Unclaimed' ? this.riskUI.getPlayerColor(owner) : '#999';
        
        this.territoryTooltip.innerHTML = `
            <h3>${territoryInfo.name}</h3>
            <p>
                <span>Continent:</span>
                <span>${territoryInfo.continent}</span>
            </p>
            <p>
                <span>Owner:</span>
                <span class="owner" style="color: ${ownerColor}">${owner}</span>
            </p>
            <p>
                <span>Army Size:</span>
                <span class="armies">${territoryInfo.armies} units</span>
            </p>
        `;

        this.territoryTooltip.style.display = 'block';
        
        // Position tooltip right next to the cursor
        const tooltipRect = this.territoryTooltip.getBoundingClientRect();
        const cursorOffset = 3; // Small offset from cursor
        let left = event.clientX + cursorOffset;
        let top = event.clientY + cursorOffset;
        
        // Adjust position if tooltip would go off screen
        if (left + tooltipRect.width > window.innerWidth) {
            left = event.clientX - tooltipRect.width - cursorOffset;
        }
        if (top + tooltipRect.height > window.innerHeight) {
            top = event.clientY - tooltipRect.height - cursorOffset;
        }
        
        // Remove transition for instant following
        this.territoryTooltip.style.transition = 'none';
        this.territoryTooltip.style.left = `${left}px`;
        this.territoryTooltip.style.top = `${top}px`;
    }

    getTerritoryInfo(territoryId) {
        const territory = this.riskUI.gameState.territories[territoryId];
        const continentName = this.getContinent(territoryId);
        
        return {
            name: territoryId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            continent: continentName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            owner: territory ? territory.owner : null,
            armies: territory ? territory.armies : 0
        };
    }

    getContinent(territoryId) {
        for (const [continentId, continent] of Object.entries(mapData.continents)) {
            if (continent.territories.includes(territoryId)) {
                return continent.name;
            }
        }
        return 'Unknown';
    }

    hideTooltip() {
        if (this.territoryTooltip) {
            this.territoryTooltip.style.display = 'none';
        }
    }

    startDragging(event) {
        this.isDragging = true;
        this.startX = event.clientX - this.translateX;
        this.startY = event.clientY - this.translateY;
        this.svg.style.cursor = 'grabbing';
    }

    handleDrag(event) {
        if (!this.isDragging) return;
        
        event.preventDefault();
        const rect = this.svg.getBoundingClientRect();
        const maxOffset = Math.max(rect.width, rect.height);
        const boundary = maxOffset * 0.8;
        
        const newX = event.clientX - this.startX;
        const newY = event.clientY - this.startY;
        
        this.translateX = Math.max(Math.min(newX, boundary), -boundary);
        this.translateY = Math.max(Math.min(newY, boundary), -boundary);
        
        this.updateTransform();
    }

    stopDragging() {
        this.isDragging = false;
        this.lastX = this.translateX;
        this.lastY = this.translateY;
        this.svg.style.cursor = 'grab';
    }

    zoomIn() {
        const newScale = Math.min(this.scale * 1.2, this.maxScale);
        this.scale = newScale;
        this.updateTransform();
    }

    zoomOut() {
        const newScale = this.scale / 1.2;
        this.scale = newScale;
        this.updateTransform();
    }

    zoomAtPoint(clientX, clientY, newScale) {
        // Get current values before zoom
        const oldScale = this.scale;
        
        // Constrain the new scale within bounds
        this.scale = Math.min(Math.max(newScale, this.minScale), this.maxScale);
        
        // Get mouse position relative to SVG
        const rect = this.svg.getBoundingClientRect();
        const mouseX = clientX - rect.left - this.translateX;
        const mouseY = clientY - rect.top - this.translateY;
        
        // Calculate new position to zoom towards mouse
        const scaleDiff = this.scale - oldScale;
        this.translateX -= (mouseX * scaleDiff) / oldScale;
        this.translateY -= (mouseY * scaleDiff) / oldScale;
        
        this.updateTransform();
    }

    resetZoom() {
        this.scale = 0.5;
        const rect = this.svg.getBoundingClientRect();
        this.translateX = rect.width / 130;
        this.translateY = rect.height / 130;
        
        const maxOffset = Math.max(rect.width, rect.height);
        const boundary = maxOffset * 0.5;
        this.translateX = Math.max(Math.min(this.translateX, boundary), -boundary);
        this.translateY = Math.max(Math.min(this.translateY, boundary), -boundary);
        
        this.updateTransform();
    }

    resetView() {
        document.querySelectorAll('.continent').forEach(continent => {
            continent.style.opacity = '1';
        });
        
        if (this.selectedTerritory) {
            this.selectedTerritory.classList.remove('selected');
            this.selectedTerritory = null;
        }
        
        document.querySelector('.territory-info').innerHTML = `
            <h3>Select a territory</h3>
            <p>Click on any territory to view its details</p>
        `;
        
        this.resetZoom();
    }

    updateTransform() {
        if (this.mapGroup) {
            this.mapGroup.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
        }
    }

    highlightContinent(continentId) {
        document.querySelectorAll('.continent').forEach(continent => {
            continent.style.opacity = continent.id === continentId ? '1' : '0.5';
        });
    }
}