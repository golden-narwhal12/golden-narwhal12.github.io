// Update game timer
function updateTimer() {
    gameState.timeRemaining--;
    
    if (gameState.timeRemaining <= 0) {
        endGame();
        return;
    }
    
    // Update overall game timer display
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    document.getElementById('timer').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

}// Game state
let gameState = {
    player1: {
        score: 0,
        words: [],
        selectedTiles: []
    },
    player2: {
        score: 0,
        words: [],
        selectedTiles: []
    },
    poolTiles: [],
    usedWords: new Set(),
    timeRemaining: 300, // 5 minutes default
    totalTime: 300,
    gameActive: false,
    tileAddInterval: null,
    timerInterval: null,
    progressInterval: null, // Separate interval for progress bar
    currentTileRate: 5000, // Start at 5 seconds
    nextTileTime: 0, // Track when next tile will be added
    lastTileTime: 0, // Track when last tile was added
    settings: {
        minWordLength: 4,
        gameLength: 5,
        startingTiles: 12,
        tileRate: 5,
        maxPool: 30
    }
};

// Scrabble-like letter distribution
const letterDistribution = {
    'A': 9, 'B': 2, 'C': 2, 'D': 4, 'E': 12, 'F': 2, 'G': 3, 'H': 2,
    'I': 9, 'J': 1, 'K': 1, 'L': 4, 'M': 2, 'N': 6, 'O': 8, 'P': 2,
    'Q': 1, 'R': 6, 'S': 4, 'T': 6, 'U': 4, 'V': 2, 'W': 2, 'X': 1,
    'Y': 2, 'Z': 1
};

// Create letter pool based on distribution
function createLetterBag() {
    let bag = [];
    for (let letter in letterDistribution) {
        for (let i = 0; i < letterDistribution[letter]; i++) {
            bag.push(letter);
        }
    }
    return bag;
}

let letterBag = createLetterBag();

// Custom Alert System
function setupCustomAlert() {
    // Create modal HTML if it doesn't exist
    if (!document.getElementById('customAlertModal')) {
        const modalHTML = `
            <div id="customAlertModal" class="alert-modal-overlay" style="display: none;">
                <div class="alert-modal-content">
                    <button class="alert-close-btn">&times;</button>
                    <div class="alert-message"></div>
                    <button class="alert-ok-btn">OK</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add modal styles
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .alert-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.3);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                animation: fadeIn 0.2s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .alert-modal-content {
                background: white;
                border: 2px solid #d3d6da;
                padding: 30px;
                padding-top: 40px;
                min-width: 300px;
                max-width: 500px;
                position: relative;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                animation: slideIn 0.2s ease;
            }
            
            @keyframes slideIn {
                from { 
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .alert-close-btn {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 24px;
                color: #787c7e;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.15s ease;
            }
            
            .alert-close-btn:hover {
                color: #121213;
            }
            
            .alert-message {
                font-size: 16px;
                color: #121213;
                line-height: 1.5;
                margin-bottom: 20px;
                text-align: center;
                white-space: pre-line;
            }
            
            .alert-ok-btn {
                display: block;
                margin: 0 auto;
                padding: 10px 30px;
                background: white;
                border: 2px solid #121213;
                color: #121213;
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            
            .alert-ok-btn:hover {
                background: #121213;
                color: white;
            }
            
            .alert-ok-btn:active {
                transform: scale(0.98);
            }
        `;
        document.head.appendChild(styleSheet);
        
        // Setup event listeners
        const modal = document.getElementById('customAlertModal');
        const closeBtn = modal.querySelector('.alert-close-btn');
        const okBtn = modal.querySelector('.alert-ok-btn');
        
        // Close on X button click
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close on OK button click
        okBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close on overlay click (outside modal content)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// Custom alert function
function customAlert(message) {
    const modal = document.getElementById('customAlertModal');
    const messageElement = modal.querySelector('.alert-message');
    messageElement.textContent = message;
    modal.style.display = 'flex';
}

// Custom confirm function
function customConfirm(message, callback) {
    const modal = document.getElementById('customAlertModal');
    const messageElement = modal.querySelector('.alert-message');
    const okBtn = modal.querySelector('.alert-ok-btn');
    
    messageElement.textContent = message;
    modal.style.display = 'flex';
    
    // Create Yes/No buttons for confirm
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '15px';
    buttonContainer.style.justifyContent = 'center';
    
    const yesBtn = document.createElement('button');
    yesBtn.className = 'alert-ok-btn';
    yesBtn.textContent = 'YES';
    yesBtn.style.margin = '0';
    
    const noBtn = document.createElement('button');
    noBtn.className = 'alert-ok-btn';
    noBtn.textContent = 'NO';
    noBtn.style.margin = '0';
    noBtn.style.background = '#787c7e';
    noBtn.style.borderColor = '#787c7e';
    noBtn.style.color = 'white';
    
    // Add hover effect for No button
    noBtn.addEventListener('mouseenter', () => {
        noBtn.style.background = '#5a5e60';
        noBtn.style.borderColor = '#5a5e60';
    });
    noBtn.addEventListener('mouseleave', () => {
        noBtn.style.background = '#787c7e';
        noBtn.style.borderColor = '#787c7e';
    });
    
    okBtn.style.display = 'none';
    okBtn.parentNode.appendChild(buttonContainer);
    buttonContainer.appendChild(noBtn);
    buttonContainer.appendChild(yesBtn);
    
    const cleanup = () => {
        buttonContainer.remove();
        okBtn.style.display = 'block';
    };
    
    const handleYes = () => {
        modal.style.display = 'none';
        cleanup();
        callback(true);
    };
    
    const handleNo = () => {
        modal.style.display = 'none';
        cleanup();
        callback(false);
    };
    
    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);
    
    // Also handle closing with X or clicking outside
    const closeBtn = modal.querySelector('.alert-close-btn');
    const handleClose = () => {
        modal.style.display = 'none';
        cleanup();
        callback(false);
    };
    
    closeBtn.onclick = handleClose;
    modal.onclick = (e) => {
        if (e.target === modal) {
            handleClose();
        }
    };
}

// Initialize game on page load
window.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initializeGame();
    setupCustomAlert();
});

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
        gameState.settings = JSON.parse(savedSettings);
        gameState.timeRemaining = gameState.settings.gameLength * 60;
        gameState.totalTime = gameState.settings.gameLength * 60;
        gameState.currentTileRate = gameState.settings.tileRate * 1000;
    }
}

// Initialize the game
function initializeGame() {
    // Reset letter bag
    letterBag = createLetterBag();
    
    // Add starting tiles
    for (let i = 0; i < gameState.settings.startingTiles; i++) {
        addTileToPool();
    }
    
    // Start game timers
    startGame();
}

// Add a random tile to the pool
function addTileToPool() {
    if (gameState.poolTiles.length >= gameState.settings.maxPool) return;
    if (letterBag.length === 0) {
        letterBag = createLetterBag(); // Refill if empty
    }
    
    const randomIndex = Math.floor(Math.random() * letterBag.length);
    const letter = letterBag.splice(randomIndex, 1)[0];
    
    const tileId = 'tile-' + Date.now() + '-' + Math.random();
    gameState.poolTiles.push({
        id: tileId,
        letter: letter,
        selectedBy: { player1: false, player2: false }
    });
    
    renderPool();
}

// Start the game
function startGame() {
    gameState.gameActive = true;
    
    // Initialize tile timing
    gameState.lastTileTime = Date.now();
    gameState.nextTileTime = gameState.lastTileTime + gameState.currentTileRate;
    
    // Start timer
    gameState.timerInterval = setInterval(() => {
        updateTimer();
    }, 1000);
    
    // Remove CSS transition for smoother JavaScript animation
    const timeBar = document.getElementById('timeBarFill');
    timeBar.style.transition = 'smooth none';
    
    // Also update progress bar more frequently for smooth animation
    gameState.progressInterval = setInterval(() => {
        // Update time bar to show countdown until next tile
        const now = Date.now();
        const timeUntilNextTile = Math.max(0, gameState.nextTileTime - now);
        const percentage = (timeUntilNextTile / gameState.currentTileRate) * 100;
        timeBar.style.width = percentage + '%';
    }, 100);
    
    // Start tile addition with increasing frequency
    scheduleTileAddition();
}

// Schedule tile addition with exponentially increasing frequency
function scheduleTileAddition() {
    if (!gameState.gameActive) return;
    
    // Record when this tile addition was scheduled
    gameState.lastTileTime = Date.now();
    gameState.nextTileTime = gameState.lastTileTime + gameState.currentTileRate;
    
    gameState.tileAddInterval = setTimeout(() => {
        addTileToPool();
        
        // Decrease interval (increase frequency) as game progresses
        const progress = 1 - (gameState.timeRemaining / gameState.totalTime);
        gameState.currentTileRate = Math.max(
            1000, // Minimum 1 second between tiles
            gameState.settings.tileRate * 1000 * Math.pow(0.5, progress * 2)
        );
        
        scheduleTileAddition();
    }, gameState.currentTileRate);
}



// Render the tile pool
function renderPool() {
    const poolElement = document.getElementById('tilePool');
    poolElement.innerHTML = '';
    
    gameState.poolTiles.forEach(tile => {
        const tileDiv = document.createElement('div');
        tileDiv.className = 'game-tile';
        
        // Show selection state for both players
        if (tile.selectedBy.player1 && tile.selectedBy.player2) {
            // Both players selected - show split coloring or special state
            tileDiv.style.background = 'linear-gradient(135deg, #538d4e 50%, #c9b458 50%)';
            tileDiv.style.color = 'white';
            tileDiv.style.borderColor = '#121213';
        } else if (tile.selectedBy.player1) {
            tileDiv.style.background = '#538d4e';
            tileDiv.style.color = 'white';
            tileDiv.style.borderColor = '#538d4e';
        } else if (tile.selectedBy.player2) {
            tileDiv.style.background = '#c9b458';
            tileDiv.style.color = 'white';
            tileDiv.style.borderColor = '#c9b458';
        }
        
        tileDiv.textContent = tile.letter;
        tileDiv.onclick = () => togglePoolTile(tile.id);
        poolElement.appendChild(tileDiv);
    });
}

// Toggle pool tile selection for both players
function togglePoolTile(tileId) {
    const tile = gameState.poolTiles.find(t => t.id === tileId);
    if (!tile) return;
    
    // Determine which player is clicking based on position or use both
    // For simplicity, we'll toggle for both players independently
    // In practice, you might want to detect which side of the screen was touched
    
    // For now, let's make it so clicking cycles through states:
    // Neither -> Player1 -> Player2 -> Both -> Neither
    if (!tile.selectedBy.player1 && !tile.selectedBy.player2) {
        tile.selectedBy.player1 = true;
        gameState.player1.selectedTiles.push({
            id: tileId,
            letter: tile.letter,
            source: 'pool'
        });
    } else if (tile.selectedBy.player1 && !tile.selectedBy.player2) {
        tile.selectedBy.player1 = false;
        tile.selectedBy.player2 = true;
        // Remove from player1, add to player2
        const index = gameState.player1.selectedTiles.findIndex(t => t.id === tileId && t.source === 'pool');
        if (index > -1) gameState.player1.selectedTiles.splice(index, 1);
        gameState.player2.selectedTiles.push({
            id: tileId,
            letter: tile.letter,
            source: 'pool'
        });
    } else if (!tile.selectedBy.player1 && tile.selectedBy.player2) {
        tile.selectedBy.player1 = true;
        // Add to player1 (player2 already has it)
        gameState.player1.selectedTiles.push({
            id: tileId,
            letter: tile.letter,
            source: 'pool'
        });
    } else {
        // Both selected -> deselect both
        tile.selectedBy.player1 = false;
        tile.selectedBy.player2 = false;
        // Remove from both players
        let index = gameState.player1.selectedTiles.findIndex(t => t.id === tileId && t.source === 'pool');
        if (index > -1) gameState.player1.selectedTiles.splice(index, 1);
        index = gameState.player2.selectedTiles.findIndex(t => t.id === tileId && t.source === 'pool');
        if (index > -1) gameState.player2.selectedTiles.splice(index, 1);
    }
    
    renderPool();
    updatePreview('player1');
    updatePreview('player2');
}

// Toggle opponent word tile selection
function toggleOpponentTile(clickingPlayer, ownerPlayer, wordIndex, tileIndex) {
    const word = gameState[ownerPlayer].words[wordIndex];
    if (!word || word.tiles[tileIndex].stolen) return;
    
    const tile = word.tiles[tileIndex];
    
    // Initialize selectedBy if not present
    if (!tile.selectedBy) {
        tile.selectedBy = { player1: false, player2: false };
    }
    
    if (tile.selectedBy[clickingPlayer]) {
        // Deselect
        tile.selectedBy[clickingPlayer] = false;
        const index = gameState[clickingPlayer].selectedTiles.findIndex(
            t => t.source === 'opponent' && t.wordIndex === wordIndex && t.tileIndex === tileIndex
        );
        if (index > -1) {
            gameState[clickingPlayer].selectedTiles.splice(index, 1);
        }
    } else {
        // Select
        tile.selectedBy[clickingPlayer] = true;
        gameState[clickingPlayer].selectedTiles.push({
            letter: tile.letter,
            source: 'opponent',
            wordIndex: wordIndex,
            tileIndex: tileIndex,
            ownerPlayer: ownerPlayer
        });
    }
    
    renderPlayerWords();
    updatePreview(clickingPlayer);
}

// Update selected tiles preview
function updatePreview(player) {
    const previewElement = document.getElementById(player + '-preview');
    previewElement.innerHTML = '';
    
    gameState[player].selectedTiles.forEach(tile => {
        const tileDiv = document.createElement('div');
        tileDiv.className = 'preview-tile';
        if (tile.source === 'opponent') {
            tileDiv.classList.add('from-opponent');
        }
        tileDiv.textContent = tile.letter;
        previewElement.appendChild(tileDiv);
    });
}

// Attempt to create a word or steal
function attemptAction(playerNum) {
    const player = 'player' + playerNum;
    
    const selectedTiles = gameState[player].selectedTiles;
    if (selectedTiles.length < gameState.settings.minWordLength) {
        customAlert(`Words must be at least ${gameState.settings.minWordLength} letters!`);
        return;
    }
    
    // Create word string
    const word = selectedTiles.map(t => t.letter).join('').toUpperCase();
    
    // Check if word already used
    if (gameState.usedWords.has(word)) {
        customAlert('This word has already been created!');
        return;
    }
    
    // Check if this is a steal
    const opponentTiles = selectedTiles.filter(t => t.source === 'opponent');
    let isSteal = false;
    let stolenWordIndex = -1;
    let opponentPlayer = null;
    
    if (opponentTiles.length > 0) {
        // This is a steal - verify all tiles from a word are used
        const wordGroups = {};
        opponentTiles.forEach(t => {
            const key = `${t.ownerPlayer}-${t.wordIndex}`;
            if (!wordGroups[key]) {
                wordGroups[key] = [];
            }
            wordGroups[key].push(t);
        });
        
        if (Object.keys(wordGroups).length > 1) {
            customAlert('You can only steal from one word at a time!');
            return;
        }
        
        const groupKey = Object.keys(wordGroups)[0];
        const [owner, wordIdx] = groupKey.split('-');
        opponentPlayer = owner;
        stolenWordIndex = parseInt(wordIdx);
        
        const stolenWord = gameState[opponentPlayer].words[stolenWordIndex];
        
        // Check if all non-stolen tiles from the stolen word are selected
        const activeTilesInWord = stolenWord.tiles.filter(t => !t.stolen).length;
        if (wordGroups[groupKey].length !== activeTilesInWord) {
            customAlert('You must use all tiles from the word you\'re stealing!');
            return;
        }
        
        isSteal = true;
    }
    
    // Calculate points
    const basePoints = Math.floor(Math.pow(word.length, 1.1));
    const points = isSteal ? basePoints + 1 : basePoints;
    
    // Add word to player's collection
    const newWord = {
        word: word,
        tiles: selectedTiles.map(t => ({
            letter: t.letter,
            stolen: false,
            selectedBy: { player1: false, player2: false }
        })),
        points: points,
        isSteal: isSteal
    };
    
    gameState[player].words.push(newWord);
    gameState[player].score += points;
    gameState.usedWords.add(word);
    
    // Handle stealing
    if (isSteal) {
        const stolenWord = gameState[opponentPlayer].words[stolenWordIndex];
        
        // Mark all tiles in the stolen word as stolen
        stolenWord.tiles.forEach(tile => {
            tile.stolen = true;
            if (tile.selectedBy) {
                tile.selectedBy.player1 = false;
                tile.selectedBy.player2 = false;
            }
        });
        
        // Deduct points from opponent
        gameState[opponentPlayer].score -= stolenWord.points;
    }
    
    // Remove used tiles from pool
    const poolTiles = selectedTiles.filter(t => t.source === 'pool');
    poolTiles.forEach(tile => {
        const index = gameState.poolTiles.findIndex(t => t.id === tile.id);
        if (index > -1) {
            gameState.poolTiles.splice(index, 1);
        }
    });
    
    // Clear selection for this player only
    gameState[player].selectedTiles = [];
    
    // Also clear the visual selection states for this player
    gameState.poolTiles.forEach(tile => {
        tile.selectedBy[player] = false;
    });
    
    // Clear selections from opponent words
    ['player1', 'player2'].forEach(p => {
        gameState[p].words.forEach(word => {
            word.tiles.forEach(tile => {
                if (tile.selectedBy) {
                    tile.selectedBy[player] = false;
                }
            });
        });
    });
    
    // Update displays
    renderPool();
    renderPlayerWords();
    updateScores();
    updatePreview(player);
}

// Render player words
function renderPlayerWords() {
    ['player1', 'player2'].forEach(player => {
        const wordsElement = document.getElementById(player + '-words');
        wordsElement.innerHTML = '';
        
        gameState[player].words.forEach((word, wordIndex) => {
            const wordContainer = document.createElement('div');
            wordContainer.className = 'word-container';
            
            word.tiles.forEach((tile, tileIndex) => {
                const tileDiv = document.createElement('div');
                tileDiv.className = 'word-tile';
                
                if (tile.stolen) {
                    tileDiv.classList.add('stolen');
                } else {
                    // Check if selected by either player
                    if (tile.selectedBy) {
                        if (tile.selectedBy.player1 || tile.selectedBy.player2) {
                            tileDiv.classList.add('selected');
                        }
                    }
                    
                    // Make tiles clickable for both players to steal
                    tileDiv.style.cursor = 'pointer';
                    
                    // Player 1 click handler
                    if (player === 'player2') { // Player 1 can steal from Player 2
                        tileDiv.addEventListener('click', (e) => {
                            e.stopPropagation();
                            toggleOpponentTile('player1', 'player2', wordIndex, tileIndex);
                        });
                    }
                    
                    // Player 2 click handler
                    if (player === 'player1') { // Player 2 can steal from Player 1
                        tileDiv.addEventListener('click', (e) => {
                            e.stopPropagation();
                            toggleOpponentTile('player2', 'player1', wordIndex, tileIndex);
                        });
                    }
                }
                
                tileDiv.textContent = tile.letter;
                wordContainer.appendChild(tileDiv);
            });
            
            // Add points display
            const pointsDiv = document.createElement('div');
            pointsDiv.className = 'word-points';
            if (word.isSteal) {
                pointsDiv.classList.add('steal-bonus');
            }
            pointsDiv.textContent = word.points + 'pts';
            wordContainer.appendChild(pointsDiv);
            
            wordsElement.appendChild(wordContainer);
        });
    });
}

// Update scores
function updateScores() {
    document.getElementById('player1-score').textContent = gameState.player1.score;
    document.getElementById('player2-score').textContent = gameState.player2.score;
}

// End game early
function endGameEarly() {
    customConfirm('Are you sure you want to end the game?', (confirmed) => {
        if (confirmed) {
            endGame();
        }
    });
}

// End the game
function endGame() {
    gameState.gameActive = false;
    
    // Clear intervals
    clearInterval(gameState.timerInterval);
    clearInterval(gameState.progressInterval);
    clearTimeout(gameState.tileAddInterval);
    
    // Determine winner
    const winner = gameState.player1.score > gameState.player2.score ? 'PLAYER A' :
                   gameState.player2.score > gameState.player1.score ? 'PLAYER B' : 'TIE';
    
    // Show results
    const message = winner === 'TIE' ? 
        `It's a tie! Both players scored ${gameState.player1.score} points!` :
        `${winner} WINS!\n\nFinal Scores:\nPlayer A: ${gameState.player1.score}\nPlayer B: ${gameState.player2.score}`;
    
    // Create a custom end game modal with better styling
    const endGameModal = document.createElement('div');
    endGameModal.className = 'alert-modal-overlay';
    endGameModal.style.display = 'flex';
    endGameModal.innerHTML = `
        <div class="alert-modal-content" style="text-align: center;">
            <div style="font-size: 24px; font-weight: 700; margin-bottom: 20px; color: #121213; letter-spacing: 0.1em;">
                ${winner === 'TIE' ? 'IT\'S A TIE!' : winner + ' WINS!'}
            </div>
            <div style="font-size: 18px; margin-bottom: 30px; color: #121213;">
                <div style="margin-bottom: 15px;">Final Scores:</div>
                <div style="display: flex; justify-content: space-around; max-width: 300px; margin: 0 auto;">
                    <div>
                        <div style="font-size: 14px; color: #787c7e; margin-bottom: 5px;">PLAYER A</div>
                        <div style="font-size: 32px; font-weight: 700; color: ${gameState.player1.score > gameState.player2.score ? '#538d4e' : '#121213'};">
                            ${gameState.player1.score}
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 14px; color: #787c7e; margin-bottom: 5px;">PLAYER B</div>
                        <div style="font-size: 32px; font-weight: 700; color: ${gameState.player2.score > gameState.player1.score ? '#538d4e' : '#121213'};">
                            ${gameState.player2.score}
                        </div>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="alert-ok-btn" onclick="window.location.href='index.html'">MAIN MENU</button>
                <button class="alert-ok-btn" style="background: #538d4e; border-color: #538d4e; color: white;" onclick="location.reload()">PLAY AGAIN</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(endGameModal);
    
    // Allow clicking outside to go to main menu
    endGameModal.addEventListener('click', (e) => {
        if (e.target === endGameModal) {
            window.location.href = 'index.html';
        }
    });
}