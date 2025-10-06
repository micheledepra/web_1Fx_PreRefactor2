document.addEventListener('DOMContentLoaded', function() {
    const numPlayersSelect = document.getElementById('numPlayers');
    const playerInputsContainer = document.getElementById('playerInputs');
    const colorGrid = document.querySelector('.color-grid');
    const errorText = document.getElementById('errorText');
    
    const availableColors = [
        { hex: '#ff4444', name: 'Red' },
        { hex: '#44ff44', name: 'Green' },
        { hex: '#4444ff', name: 'Blue' },
        { hex: '#ffff44', name: 'Yellow' },
        { hex: '#ff44ff', name: 'Magenta' },
        { hex: '#44ffff', name: 'Cyan' }
    ];
    
    let selectedColors = new Map();

    // Pre-assign default colors
    function getDefaultColor(playerNum) {
        return availableColors[(playerNum - 1) % availableColors.length].hex;
    }

    function generatePlayerInputs(count) {
        playerInputsContainer.innerHTML = '';
        selectedColors.clear();
        
        for (let i = 1; i <= count; i++) {
            const div = document.createElement('div');
            div.className = 'player-input';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.name = `player${i}`;
            input.placeholder = `Player ${i} name`;
            input.required = i <= 2; // Only first two players are required
            input.id = `player${i}`;
            
            const colorPickerBtn = document.createElement('div');
            colorPickerBtn.className = 'player-color';
            colorPickerBtn.dataset.player = i;

            // Set default color
            const defaultColor = getDefaultColor(i);
            selectColor(i, defaultColor);
            colorPickerBtn.style.backgroundColor = defaultColor;
            
            colorPickerBtn.addEventListener('click', () => showColorSelection(i));
            
            div.appendChild(input);
            div.appendChild(colorPickerBtn);
            playerInputsContainer.appendChild(div);
        }
        
        updateColorGrid();
    }
    
    function showColorSelection(playerNum) {
        const colorPanel = document.createElement('div');
        colorPanel.className = 'color-selection-panel';
        
        const currentSelectedColor = selectedColors.get(playerNum);
        
        availableColors.forEach(color => {
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.style.backgroundColor = color.hex;
            colorOption.dataset.color = color.hex;
            
            const isUsed = Array.from(selectedColors.values()).includes(color.hex) && 
                          currentSelectedColor !== color.hex;
            
            if (isUsed) {
                colorOption.classList.add('used');
            } else {
                colorOption.addEventListener('click', () => {
                    selectColor(playerNum, color.hex);
                    colorPanel.remove();
                });
            }
            
            const colorName = document.createElement('span');
            colorName.textContent = color.name;
            colorOption.appendChild(colorName);
            colorPanel.appendChild(colorOption);
        });
        
        const playerColor = document.querySelector(`.player-color[data-player="${playerNum}"]`);
        playerColor.appendChild(colorPanel);
        
        // Close panel when clicking outside
        document.addEventListener('click', function closePanel(e) {
            if (!colorPanel.contains(e.target) && e.target !== playerColor) {
                colorPanel.remove();
                document.removeEventListener('click', closePanel);
            }
        });
    }
    
    function selectColor(playerNum, color) {
        const oldColor = selectedColors.get(playerNum);
        if (oldColor === color) return;
        
        selectedColors.set(playerNum, color);
        
        const colorBtn = document.querySelector(`.player-color[data-player="${playerNum}"]`);
        if (colorBtn) {
            colorBtn.style.backgroundColor = color;
            
            // Add transition animation
            colorBtn.style.transition = 'background-color 0.3s ease';
            setTimeout(() => colorBtn.style.transition = '', 300);
        }
        
        updateColorGrid();
        validatePlayerSetup();
    }
    
    function updateColorGrid() {
        const usedColors = Array.from(selectedColors.values());
        
        document.querySelectorAll('.color-option').forEach(option => {
            const color = option.dataset.color;
            const isUsed = usedColors.includes(color);
            
            option.classList.toggle('selected', isUsed);
            if (isUsed) {
                const playerNum = Array.from(selectedColors.entries())
                    .find(([_, c]) => c === color)[0];
                option.setAttribute('title', `Selected by Player ${playerNum}`);
            } else {
                option.removeAttribute('title');
            }
        });
    }
    
    function validatePlayerSetup() {
        const playerCount = parseInt(numPlayersSelect.value);
        errorText.textContent = '';
        
        // Validate player names
        const usedNames = new Set();
        let validSetup = true;
        
        for (let i = 1; i <= playerCount; i++) {
            const nameInput = document.getElementById(`player${i}`);
            const name = nameInput.value.trim();
            
            if (i <= 2 && !name) {
                errorText.textContent = `Player ${i} name is required`;
                nameInput.classList.add('error');
                validSetup = false;
            } else if (name && usedNames.has(name.toLowerCase())) {
                errorText.textContent = `Duplicate player name: ${name}`;
                nameInput.classList.add('error');
                validSetup = false;
            } else {
                nameInput.classList.remove('error');
                if (name) usedNames.add(name.toLowerCase());
            }
        }
        
        // Validate color selection
        const usedColors = new Set(selectedColors.values());
        if (usedColors.size !== selectedColors.size) {
            errorText.textContent = 'Each player must have a unique color';
            validSetup = false;
        }
        
        return validSetup;
    }

    // Generate initial player inputs
    generatePlayerInputs(parseInt(numPlayersSelect.value));

    // Update player inputs when selection changes
    numPlayersSelect.addEventListener('change', function() {
        generatePlayerInputs(parseInt(this.value));
    });

    // Enhance form submission handler
    document.getElementById('playerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validatePlayerSetup()) {
            return;
        }
        
        const playerCount = parseInt(numPlayersSelect.value);
        const players = [];
        const usedNames = new Set();

        // Reset error message
        errorText.textContent = '';

        // Validate and collect player data
        for (let i = 1; i <= playerCount; i++) {
            const nameInput = document.getElementById(`player${i}`);
            const name = nameInput.value.trim();
            const color = selectedColors.get(i);

            // Required check for first two players
            if (i <= 2 && !name) {
                errorText.textContent = `Player ${i} name is required`;
                nameInput.focus();
                return;
            }

            // Skip empty optional players
            if (!name && i > 2) continue;

            // Validate name uniqueness
            if (name && usedNames.has(name.toLowerCase())) {
                errorText.textContent = `Duplicate player name: ${name}`;
                nameInput.focus();
                return;
            }

            if (name) {
                usedNames.add(name.toLowerCase());
                players.push({
                    name,
                    color: color || getDefaultColor(i)
                });
            }
        }

        // Ensure minimum player count
        if (players.length < 2) {
            errorText.textContent = 'At least 2 players are required';
            return;
        }

        // Create URL parameters
        const params = new URLSearchParams();
        params.append('playerCount', players.length);
        
        // Add each player's info to URL parameters
        players.forEach((player, index) => {
            params.append(`player${index + 1}`, player.name);
            params.append(`color${index + 1}`, encodeURIComponent(player.color));
        });

        // Navigate to the game page with parameters
        window.location.href = `risk-map.html?${params.toString()}`;
    });
});