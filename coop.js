// Cooperative Game state
let gameState = {
    team: {
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
    progressInterval: null,
    currentTileRate: 5000,
    nextTileTime: 0,
    lastTileTime: 0,
    settings: {
        minWordLength: 3,
        gameLength: 4,
        startingTiles: 8,
        tileRate: 10,
        maxPool: 20,
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
    
    startGame();
}

// Add a random tile to the pool
function addTileToPool() {
    if (gameState.poolTiles.length >= gameState.settings.maxPool) return;
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

// Update selected tiles preview
function updatePreview() {
    const previewElement = document.getElementById('team-preview');
    previewElement.innerHTML = '';
    
    gameState.team.selectedTiles.forEach(tile => {
        const tileDiv = document.createElement('div');
        tileDiv.className = 'preview-tile';
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
    
    const points = Math.floor(Math.pow(word.length, 1.1));
    
    const newWord = {
        word: word,
        tiles: selectedTiles.map(t => ({
            letter: t.letter,
            stolen: false
        })),
        points: points,
        isSteal: false
    };
    
    gameState.team.words.push(newWord);
    gameState.team.score += points;
    gameState.usedWords.add(word);
    
    const poolTiles = selectedTiles.filter(t => t.source === 'pool');
    poolTiles.forEach(tile => {
        const index = gameState.poolTiles.findIndex(t => t.id === tile.id);
        if (index > -1) {
            gameState.poolTiles.splice(index, 1);
        }
    });
    
    gameState.team.selectedTiles = [];
    
    gameState.poolTiles.forEach(tile => {
        tile.selected = false;
    });
    
    renderPool();
    renderTeamWords();
    updateScore();
    updatePreview();
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
            tileDiv.textContent = tile.letter;
            wordContainer.appendChild(tileDiv);
        });
        
        const pointsDiv = document.createElement('div');
        pointsDiv.className = 'word-points';
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

// End the game
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