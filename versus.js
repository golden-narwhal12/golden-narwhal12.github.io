// Game state
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
    settings: {
        minWordLength: 3,
        gameLength: 3,
        startingTiles: 8,
        tileRate: 30,
        maxPool: 20,
    },
    poolTiles: [],
    usedWords: new Set(),
    timeRemaining: 0, 
    totalTime: 0,
    gameActive: false,
    tileAddInterval: null,
    timerInterval: null,
    progressInterval: null,
    currentTileRate: 0,
    nextTileTime: 0,
    lastTileTime: 0,
};

// letter distribution
const letterDistribution = {
    'A': 9, 'B': 3, 'C': 2, 'D': 4, 'E': 10, 'F': 2, 'G': 3, 'H': 2,
    'I': 9, 'J': 1, 'K': 1, 'L': 4, 'M': 2, 'N': 6, 'O': 8, 'P': 2,
    'Q': 1, 'R': 6, 'S': 5, 'T': 6, 'U': 4, 'V': 2, 'W': 2, 'X': 1,
    'Y': 3, 'Z': 1
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
    setupCustomAlert();
    checkAndShowTutorial();
});

// Check if tutorial should be shown
function checkAndShowTutorial() {
    const tutorialSeen = localStorage.getItem('versusModeTutorialSeen');
    if (!tutorialSeen) {
        showTutorial();
    } else {
        initializeGame();
    }
}

// Show tutorial
function showTutorial() {
    const modal = document.getElementById('tutorialModal');
    const messageElement = document.getElementById('tutorialMessage');
    
    messageElement.innerHTML = `
        <p style="text-align: center; line-height: 1.7;">
            - This is an unconventional game in which <b>you are always looking to help your opponent.</b> At the end of the game, you want them to have more points than you. Players have to accept this paradoxical premise in order to play. It's okay to be confused, it makes the game more fun!
            - Suppose Player A sees the letters <i>R, E, A, T, D, O, S, I</i> in the pool. They might notice the word READ can be formed- <b>but they can only create it if their opponent says the word aloud.</b> So, player A will ask <b>one question</b> to player B, such as "What do you do to books?" If Player B says "READ" in their response, Player A can then create the word READ using the letters from the pool, giving player B the points for that word. 
            - In this exchange, player A is interested in helping player B score points, and player B is naturally interested in answering player A's question. <b>The game only works if both plauyers are aligned with this goal.</b>
            - The strategy comes in when choosing which words to form. Players should try to form words that are easy for their opponent to say aloud in response to their question, while also trying to maximize the points they give to their opponent. <b>Longer words and words made later in the game are worth more points!</b>
            - Players can also <b>give tiles from their own words to their opponent</b> to help them form new words. To do this, players can click on tiles in their own words to select them, and then click the "GIVE WORD" button to give those tiles to their opponent.
            - The game continues until the timer runs out. <b>The player with the higher score at the end wins!</b>
        </p>
    `;
    
    modal.style.display = 'flex';
}

// Close tutorial
function closeTutorial() {
    const modal = document.getElementById('tutorialModal');
    modal.style.display = 'none';
    
    localStorage.setItem('versusModeTutorialSeen', 'true');
    
    if (!gameState.gameActive && gameState.timeRemaining === 0) {
        initializeGame();
    }
}

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
        selectedBy: { player1: false, player2: false }
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
    timeBar.style.transition = 'width 0.1s linear';
    
    gameState.progressInterval = setInterval(() => {
        const now = Date.now();
        const timeUntilNextTile = Math.max(0, gameState.nextTileTime - now);
        const percentage = (timeUntilNextTile / gameState.currentTileRate) * 100;
        timeBar.style.width = percentage + '%';
    }, 100);
    
    scheduleTileAddition();
}

// Schedule tile addition with exponentially increasing frequency
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
        
        if (tile.selectedBy.player1 && tile.selectedBy.player2) {
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
        const index = gameState.player1.selectedTiles.findIndex(t => t.id === tileId && t.source === 'pool');
        if (index > -1) gameState.player1.selectedTiles.splice(index, 1);
        gameState.player2.selectedTiles.push({
            id: tileId,
            letter: tile.letter,
            source: 'pool'
        });
    } else if (!tile.selectedBy.player1 && tile.selectedBy.player2) {
        tile.selectedBy.player1 = true;
        gameState.player1.selectedTiles.push({
            id: tileId,
            letter: tile.letter,
            source: 'pool'
        });
    } else {
        tile.selectedBy.player1 = false;
        tile.selectedBy.player2 = false;
        let index = gameState.player1.selectedTiles.findIndex(t => t.id === tileId && t.source === 'pool');
        if (index > -1) gameState.player1.selectedTiles.splice(index, 1);
        index = gameState.player2.selectedTiles.findIndex(t => t.id === tileId && t.source === 'pool');
        if (index > -1) gameState.player2.selectedTiles.splice(index, 1);
    }
    
    renderPool();
    updatePreview('player1');
    updatePreview('player2');
}

// Toggle own word tile selection for giving to opponent
function toggleOwnWordTile(player, wordIndex, tileIndex) {
    const word = gameState[player].words[wordIndex];
    if (!word || word.tiles[tileIndex].stolen) return;
    
    const tile = word.tiles[tileIndex];
    
    if (!tile.selectedBy) {
        tile.selectedBy = { player1: false, player2: false };
    }
    
    if (tile.selectedBy[player]) {
        tile.selectedBy[player] = false;
        const index = gameState[player].selectedTiles.findIndex(
            t => t.source === 'own' && t.wordIndex === wordIndex && t.tileIndex === tileIndex
        );
        if (index > -1) {
            gameState[player].selectedTiles.splice(index, 1);
        }
    } else {
        tile.selectedBy[player] = true;
        gameState[player].selectedTiles.push({
            letter: tile.letter,
            source: 'own',
            wordIndex: wordIndex,
            tileIndex: tileIndex,
            ownerPlayer: player
        });
    }
    
    renderPlayerWords();
    updatePreview(player);
}

// Update selected tiles preview
function updatePreview(player) {
    const previewElement = document.getElementById(player + '-preview');
    previewElement.innerHTML = '';
    
    gameState[player].selectedTiles.forEach(tile => {
        const tileDiv = document.createElement('div');
        tileDiv.className = 'preview-tile';
        if (tile.source === 'own') {
            tileDiv.classList.add('from-opponent');
        }
        tileDiv.textContent = tile.letter;
        previewElement.appendChild(tileDiv);
    });
}

// Attempt to create a word or give word to opponent
function attemptAction(playerNum) {
    const player = 'player' + playerNum;
    const opponent = playerNum === 1 ? 'player2' : 'player1';
    
    const selectedTiles = gameState[player].selectedTiles;
    if (selectedTiles.length < gameState.settings.minWordLength) {
        customAlert(`Words must be at least ${gameState.settings.minWordLength} letters!`);
        return;
    }
    
    const word = selectedTiles.map(t => t.letter).join('').toUpperCase();
    
    if (gameState.usedWords.has(word)) {
        customAlert('This word has already been created!');
        return;
    }
    
    const ownWordTiles = selectedTiles.filter(t => t.source === 'own');
    let isExtension = false;
    let extendedWordIndex = -1;
    
    if (ownWordTiles.length > 0) {
        const wordGroups = {};
        ownWordTiles.forEach(t => {
            const key = `${t.ownerPlayer}-${t.wordIndex}`;
            if (!wordGroups[key]) {
                wordGroups[key] = [];
            }
            wordGroups[key].push(t);
        });
        
        if (Object.keys(wordGroups).length > 1) {
            customAlert('You can only extend one word at a time!');
            return;
        }
        
        const groupKey = Object.keys(wordGroups)[0];
        const [owner, wordIdx] = groupKey.split('-');
        extendedWordIndex = parseInt(wordIdx);
        
        const extendedWord = gameState[player].words[extendedWordIndex];
        
        const activeTilesInWord = extendedWord.tiles.filter(t => !t.stolen).length;
        if (wordGroups[groupKey].length !== activeTilesInWord) {
            customAlert('You must use all tiles from the word you\'re extending!');
            return;
        }
        
        isExtension = true;
    }

    // Calculate points with time bonus
    const timeElapsedMinutes = (gameState.totalTime - gameState.timeRemaining) / 60;
    const basePoints = Math.floor(Math.pow(word.length, 1.1)) + Math.floor(timeElapsedMinutes);
    const points = isExtension ? basePoints + 1 : basePoints;
    
    const newWord = {
        word: word,
        tiles: selectedTiles.map(t => ({
            letter: t.letter,
            stolen: false,
            selectedBy: { player1: false, player2: false }
        })),
        points: points,
        isExtension: isExtension
    };
    
    gameState[opponent].words.push(newWord);
    gameState[opponent].score += points;
    gameState.usedWords.add(word);
    
    if (isExtension) {
        const extendedWord = gameState[player].words[extendedWordIndex];
        
        extendedWord.tiles.forEach(tile => {
            tile.stolen = true;
            if (tile.selectedBy) {
                tile.selectedBy.player1 = false;
                tile.selectedBy.player2 = false;
            }
        });
        
        gameState[player].score -= extendedWord.points;
    }
    
    const poolTiles = selectedTiles.filter(t => t.source === 'pool');
    poolTiles.forEach(tile => {
        const index = gameState.poolTiles.findIndex(t => t.id === tile.id);
        if (index > -1) {
            gameState.poolTiles.splice(index, 1);
        }
    });
    
    gameState[player].selectedTiles = [];
    
    gameState.poolTiles.forEach(tile => {
        tile.selectedBy[player] = false;
    });
    
    gameState[player].words.forEach(word => {
        word.tiles.forEach(tile => {
            if (tile.selectedBy) {
                tile.selectedBy[player] = false;
            }
        });
    });
    
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
                    if (tile.selectedBy && tile.selectedBy[player]) {
                        tileDiv.classList.add('selected');
                    }
                    
                    tileDiv.style.cursor = 'pointer';
                    tileDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        toggleOwnWordTile(player, wordIndex, tileIndex);
                    });
                }
                
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
    
    clearInterval(gameState.timerInterval);
    clearInterval(gameState.progressInterval);
    clearTimeout(gameState.tileAddInterval);
    
    const winner = gameState.player1.score > gameState.player2.score ? 'PLAYER A' :
                   gameState.player2.score > gameState.player1.score ? 'PLAYER B' : 'TIE';
    
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
    
    endGameModal.addEventListener('click', (e) => {
        if (e.target === endGameModal) {
            window.location.href = 'index.html';
        }
    });
}