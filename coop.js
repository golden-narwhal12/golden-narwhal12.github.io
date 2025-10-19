// Cooperative Game state
let gameState = {
    team: {
        score: 0,
        words: [],
        selectedTiles: []
    },
    settings: {
        minWordLength: 3,
        gameLength: 4,
        startingTiles: 8,
        tileRate: 10,
        maxPool: 20,
    },
    poolTiles: [],
    usedWords: new Set(),
    timeRemaining: 300, // 5 minutes default
    totalTime: 300,
    gameActive: false,
    tileAddInterval: null,
    timerInterval: null,
    progressInterval: null,
    currentTileRate: 5000,
    nextTileTime: 0,
    lastTileTime: 0,
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
    const modal = document.getElementById('customAlertModal');
    const closeBtn = modal.querySelector('.alert-close-btn');
    const okBtn = modal.querySelector('.alert-ok-btn');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    okBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
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
    letterBag = createLetterBag();
    
    for (let i = 0; i < gameState.settings.startingTiles; i++) {
        addTileToPool();
    }
    
    updateTileCounter();
    startGame();
}

// Add a random tile to the pool
function addTileToPool() {
    if (gameState.poolTiles.length >= gameState.settings.maxPool) {
        // Game over condition - tile overflow
        loseGame();
        return;
    }
    
    if (letterBag.length === 0) {
        letterBag = createLetterBag();
    }
    
    const randomIndex = Math.floor(Math.random() * letterBag.length);
    const letter = letterBag.splice(randomIndex, 1)[0];
    
    const tileId = 'tile-' + Date.now() + '-' + Math.random();
    gameState.poolTiles.push({
        id: tileId,
        letter: letter,
        selected: false
    });
    
    renderPool();
    updateTileCounter();
}

// Update tile counter with color coding
function updateTileCounter() {
    const counter = document.getElementById('tileCounter');
    const currentTiles = gameState.poolTiles.length;
    const maxTiles = gameState.settings.maxPool;
    
    counter.textContent = `${currentTiles}/${maxTiles}`;
    
    // Remove all color classes
    counter.classList.remove('safe', 'warning', 'danger');
    
    // Add appropriate color class
    const percentage = currentTiles / maxTiles;
    if (percentage < 0.5) {
        counter.classList.add('safe');
    } else if (percentage < 0.8) {
        counter.classList.add('warning');
    } else {
        counter.classList.add('danger');
    }
}

// Update game timer
function updateTimer() {
    gameState.timeRemaining--;
    
    if (gameState.timeRemaining <= 0) {
        endGame();
        return;
    }
    
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    document.getElementById('timer').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Start the game
function startGame() {
    gameState.gameActive = true;
    
    gameState.lastTileTime = Date.now();
    gameState.nextTileTime = gameState.lastTileTime + gameState.currentTileRate;
    
    gameState.timerInterval = setInterval(() => {
        updateTimer();
    }, 1000);
    
    const timeBar = document.getElementById('timeBarFill');
    timeBar.style.transition = 'smooth none';
    
    gameState.progressInterval = setInterval(() => {
        const now = Date.now();
        const timeUntilNextTile = Math.max(0, gameState.nextTileTime - now);
        const percentage = (timeUntilNextTile / gameState.currentTileRate) * 100;
        timeBar.style.width = percentage + '%';
    }, 100);
    
    scheduleTileAddition();
}

// Schedule tile addition
function scheduleTileAddition() {
    if (!gameState.gameActive) return;
    
    gameState.lastTileTime = Date.now();
    gameState.nextTileTime = gameState.lastTileTime + gameState.currentTileRate;
    
    gameState.tileAddInterval = setTimeout(() => {
        addTileToPool();
        
        const progress = 1 - (gameState.timeRemaining / gameState.totalTime);
        gameState.currentTileRate = Math.max(
            1000,
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
        
        if (tile.selected) {
            tileDiv.classList.add('selected');
        }
        
        tileDiv.textContent = tile.letter;
        tileDiv.onclick = () => togglePoolTile(tile.id);
        poolElement.appendChild(tileDiv);
    });
}

// Toggle pool tile selection
function togglePoolTile(tileId) {
    const tile = gameState.poolTiles.find(t => t.id === tileId);
    if (!tile) return;
    
    tile.selected = !tile.selected;
    
    if (tile.selected) {
        gameState.team.selectedTiles.push({
            id: tileId,
            letter: tile.letter,
            source: 'pool'
        });
    } else {
        const index = gameState.team.selectedTiles.findIndex(t => t.id === tileId);
        if (index > -1) {
            gameState.team.selectedTiles.splice(index, 1);
        }
    }
    
    renderPool();
    updatePreview();
}

// Toggle word tile selection for extension
function toggleWordTile(wordIndex, tileIndex) {
    const word = gameState.team.words[wordIndex];
    if (!word) return;
    
    const tile = word.tiles[tileIndex];
    
    // Initialize selected state if not present
    if (tile.selected === undefined) {
        tile.selected = false;
    }
    
    tile.selected = !tile.selected;
    
    if (tile.selected) {
        gameState.team.selectedTiles.push({
            letter: tile.letter,
            source: 'word',
            wordIndex: wordIndex,
            tileIndex: tileIndex
        });
    } else {
        const index = gameState.team.selectedTiles.findIndex(
            t => t.source === 'word' && t.wordIndex === wordIndex && t.tileIndex === tileIndex
        );
        if (index > -1) {
            gameState.team.selectedTiles.splice(index, 1);
        }
    }
    
    renderTeamWords();
    updatePreview();
}

// Update selected tiles preview
function updatePreview() {
    const previewElement = document.getElementById('team-preview');
    previewElement.innerHTML = '';
    
    gameState.team.selectedTiles.forEach(tile => {
        const tileDiv = document.createElement('div');
        tileDiv.className = 'preview-tile';
        if (tile.source === 'word') {
            tileDiv.classList.add('from-opponent');
        }
        tileDiv.textContent = tile.letter;
        previewElement.appendChild(tileDiv);
    });
}

// Attempt to create a word
function attemptAction() {
    const selectedTiles = gameState.team.selectedTiles;
    if (selectedTiles.length < gameState.settings.minWordLength) {
        customAlert(`Words must be at least ${gameState.settings.minWordLength} letters!`);
        return;
    }
    
    const word = selectedTiles.map(t => t.letter).join('').toUpperCase();
    
    if (gameState.usedWords.has(word)) {
        customAlert('This word has already been created!');
        return;
    }
    
    // Check if this is a word extension
    const wordTiles = selectedTiles.filter(t => t.source === 'word');
    let isExtension = false;
    let extendedWordIndex = -1;
    let originalPoints = 0;
    
    if (wordTiles.length > 0) {
        // This is a word extension - verify all tiles from one word are used
        const wordGroups = {};
        wordTiles.forEach(t => {
            const key = t.wordIndex;
            if (!wordGroups[key]) {
                wordGroups[key] = [];
            }
            wordGroups[key].push(t);
        });
        
        if (Object.keys(wordGroups).length > 1) {
            customAlert('You can only extend one word at a time!');
            return;
        }
        
        const wordIndex = parseInt(Object.keys(wordGroups)[0]);
        const extendedWord = gameState.team.words[wordIndex];
        
        // Check if ALL tiles from the extended word are selected
        if (wordGroups[wordIndex].length !== extendedWord.tiles.length) {
            customAlert('You must use all tiles from the word you\'re extending!');
            return;
        }
        
        isExtension = true;
        extendedWordIndex = wordIndex;
        originalPoints = extendedWord.points;
    }
    
    // Calculate points
    const basePoints = Math.floor(Math.pow(word.length, 1.1));
    const points = isExtension ? basePoints + 1 : basePoints;
    
    // Add word to team's collection
    const newWord = {
        word: word,
        tiles: selectedTiles.map(t => ({
            letter: t.letter,
            stolen: false,
            selected: false
        })),
        points: points,
        xExtension: isExtension
    };
    
    gameState.team.words.push(newWord);
    gameState.team.score += points;
    gameState.usedWords.add(word);
    
    // Handle word extension - remove the original word
    if (isExtension) {
        const extendedWord = gameState.team.words[extendedWordIndex];
        gameState.team.score -= extendedWord.points; // Remove original points
        gameState.team.words.splice(extendedWordIndex, 1); // Remove original word
        gameState.usedWords.delete(extendedWord.word); // Remove from used words
    }
    
    // Remove used tiles from pool
    const poolTiles = selectedTiles.filter(t => t.source === 'pool');
    poolTiles.forEach(tile => {
        const index = gameState.poolTiles.findIndex(t => t.id === tile.id);
        if (index > -1) {
            gameState.poolTiles.splice(index, 1);
        }
    });
    
    // Clear selection
    gameState.team.selectedTiles = [];
    
    // Clear selection states
    gameState.poolTiles.forEach(tile => {
        tile.selected = false;
    });
    
    gameState.team.words.forEach(word => {
        word.tiles.forEach(tile => {
            tile.selected = false;
        });
    });
    
    renderPool();
    renderTeamWords();
    updateScore();
    updatePreview();
    updateTileCounter();
}

// Render team words
function renderTeamWords() {
    const wordsElement = document.getElementById('team-words');
    wordsElement.innerHTML = '';
    
    gameState.team.words.forEach((word, wordIndex) => {
        const wordContainer = document.createElement('div');
        wordContainer.className = 'word-container';
        
        word.tiles.forEach((tile, tileIndex) => {
            const tileDiv = document.createElement('div');
            tileDiv.className = 'word-tile';
            
            if (tile.selected) {
                tileDiv.classList.add('selected');
            }
            
            // Make word tiles clickable for extension
            tileDiv.style.cursor = 'pointer';
            tileDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleWordTile(wordIndex, tileIndex);
            });
            
            tileDiv.textContent = tile.letter;
            wordContainer.appendChild(tileDiv);
        });
        
        const pointsDiv = document.createElement('div');
        pointsDiv.className = 'word-points';
        if (word.isExtension) {
            pointsDiv.classList.add('steal-bonus');
        }
        pointsDiv.textContent = word.points + 'pts';
        wordContainer.appendChild(pointsDiv);
        
        wordsElement.appendChild(wordContainer);
    });
}

// Update score
function updateScore() {
    document.getElementById('team-score').textContent = gameState.team.score;
}

// End game early
function endGameEarly() {
    customConfirm('Are you sure you want to end the game?', (confirmed) => {
        if (confirmed) {
            endGame();
        }
    });
}

// Lose game due to tile overflow
function loseGame() {
    gameState.gameActive = false;
    
    clearInterval(gameState.timerInterval);
    clearInterval(gameState.progressInterval);
    clearTimeout(gameState.tileAddInterval);
    
    const finalScore = gameState.team.score;
    
    const loseModal = document.createElement('div');
    loseModal.className = 'alert-modal-overlay';
    loseModal.style.display = 'flex';
    loseModal.innerHTML = `
        <div class="alert-modal-content" style="text-align: center;">
            <div style="font-size: 24px; font-weight: 700; margin-bottom: 20px; color: #ff6b6b; letter-spacing: 0.1em;">
                YOU LOST!
            </div>
            <div style="font-size: 16px; margin-bottom: 15px; color: #787c7e;">
                The tile pool overflowed
            </div>
            <div style="font-size: 18px; margin-bottom: 30px; color: #121213;">
                <div style="margin-bottom: 15px;">Final Score:</div>
                <div style="font-size: 32px; font-weight: 700; color: #121213;">
                    ${finalScore}
                </div>
            </div>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="alert-ok-btn" onclick="window.location.href='index.html'">MAIN MENU</button>
                <button class="alert-ok-btn" style="background: #538d4e; border-color: #538d4e; color: white;" onclick="location.reload()">TRY AGAIN</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(loseModal);
    
    loseModal.addEventListener('click', (e) => {
        if (e.target === loseModal) {
            window.location.href = 'index.html';
        }
    });
}

// End the game normally (time up or early end)
function endGame() {
    gameState.gameActive = false;
    
    clearInterval(gameState.timerInterval);
    clearInterval(gameState.progressInterval);
    clearTimeout(gameState.tileAddInterval);
    
    const finalScore = gameState.team.score;
    
    const endGameModal = document.createElement('div');
    endGameModal.className = 'alert-modal-overlay';
    endGameModal.style.display = 'flex';
    endGameModal.innerHTML = `
        <div class="alert-modal-content" style="text-align: center;">
            <div style="font-size: 24px; font-weight: 700; margin-bottom: 20px; color: #121213; letter-spacing: 0.1em;">
                GAME OVER!
            </div>
            <div style="font-size: 18px; margin-bottom: 30px; color: #121213;">
                <div style="margin-bottom: 15px;">Score:</div>
                <div style="font-size: 48px; font-weight: 700; color: #538d4e;">
                    ${finalScore}
                </div>
            </div>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="alert-ok-btn" onclick="window.location.href='index.html'">MAIN MENU</button>
                <button class="alert-ok-btn" style="background: #538d4e; border-color: #538d4e; color: white;" onclick="location.reload()">PLAY AGAIN</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(endGameModal);
    
    endGameModal.addEventListener('click', (e) => {
        if (e.target === endGameModal) {
            window.location.href = 'index.html';
        }
    });
}