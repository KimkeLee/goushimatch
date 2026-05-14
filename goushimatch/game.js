const GRID_SIZE = 8;
const TILE_TYPES = 5;
const MIN_MATCH = 3;
const GAME_TIME = 60;

let grid = [];
let selectedTile = null;
let score = 0;
let combo = 0;
let timeLeft = GAME_TIME;
let isProcessing = false;
let isGameOver = false;
let timer = null;

const gridElement = document.getElementById('grid');
const scoreElement = document.getElementById('score');
const timeElement = document.getElementById('time');
const comboElement = document.getElementById('combo');
const specialNoticeElement = document.getElementById('specialNotice');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const finalRestartBtn = document.getElementById('finalRestartBtn');
const timePanel = document.querySelector('.time-panel');
const bgm = document.getElementById('bgm');
const clearSound = document.getElementById('clearSound');
const specialSound = document.getElementById('specialSound');

function initGame() {
    grid = [];
    selectedTile = null;
    score = 0;
    combo = 0;
    timeLeft = GAME_TIME;
    isProcessing = false;
    isGameOver = false;
    
    updateScore();
    updateTime();
    updateCombo();
    hideGameOver();
    
    for (let row = 0; row < GRID_SIZE; row++) {
        grid[row] = [];
        for (let col = 0; col < GRID_SIZE; col++) {
            let tileType;
            do {
                tileType = Math.floor(Math.random() * TILE_TYPES);
            } while (wouldCreateMatch(row, col, tileType));
            grid[row][col] = tileType;
        }
    }
    
    renderGrid();
    startTimer();
    startBGM();
}

function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        updateTime();
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function updateTime() {
    timeElement.textContent = timeLeft;
    
    if (timeLeft <= 10) {
        timePanel.classList.add('warning');
    } else {
        timePanel.classList.remove('warning');
    }
}

function endGame() {
    isGameOver = true;
    if (timer) clearInterval(timer);
    finalScoreElement.textContent = score;
    gameOverElement.classList.add('show');
}

function hideGameOver() {
    gameOverElement.classList.remove('show');
}

function wouldCreateMatch(row, col, tileType) {
    let horizontalCount = 1;
    let verticalCount = 1;
    
    for (let c = col - 1; c >= 0; c--) {
        if (!grid[row] || grid[row][c] !== tileType) break;
        horizontalCount++;
    }
    for (let c = col + 1; c < GRID_SIZE; c++) {
        if (!grid[row] || grid[row][c] !== tileType) break;
        horizontalCount++;
    }
    
    for (let r = row - 1; r >= 0; r--) {
        if (!grid[r] || grid[r][col] !== tileType) break;
        verticalCount++;
    }
    for (let r = row + 1; r < GRID_SIZE; r++) {
        if (!grid[r] || grid[r][col] !== tileType) break;
        verticalCount++;
    }
    
    return horizontalCount >= MIN_MATCH || verticalCount >= MIN_MATCH;
}

function renderGrid() {
    gridElement.innerHTML = '';
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.row = row;
            tile.dataset.col = col;
            
            const img = document.createElement('img');
            img.src = `assets/tile${grid[row][col]}.png`;
            img.alt = `Tile ${grid[row][col]}`;
            
            tile.appendChild(img);
            tile.addEventListener('click', handleTileClick);
            gridElement.appendChild(tile);
        }
    }
}

function handleTileClick(event) {
    if (isProcessing || isGameOver) return;
    
    const tile = event.currentTarget;
    const row = parseInt(tile.dataset.row);
    const col = parseInt(tile.dataset.col);
    
    if (!selectedTile) {
        selectedTile = { row, col };
        tile.classList.add('selected');
    } else {
        const prevTile = document.querySelector('.tile.selected');
        prevTile?.classList.remove('selected');
        
        const isAdjacent = (Math.abs(row - selectedTile.row) === 1 && col === selectedTile.col) ||
                           (Math.abs(col - selectedTile.col) === 1 && row === selectedTile.row);
        
        if (isAdjacent) {
            swapTiles(selectedTile.row, selectedTile.col, row, col);
        }
        
        selectedTile = null;
    }
}

async function swapTiles(row1, col1, row2, col2) {
    isProcessing = true;
    
    const temp = grid[row1][col1];
    grid[row1][col1] = grid[row2][col2];
    grid[row2][col2] = temp;
    
    updateTileDisplay(row1, col1);
    updateTileDisplay(row2, col2);
    
    await delay(200);
    
    const matches = findMatches();
    
    if (matches.length === 0) {
        grid[row2][col2] = grid[row1][col1];
        grid[row1][col1] = temp;
        
        updateTileDisplay(row1, col1);
        updateTileDisplay(row2, col2);
        isProcessing = false;
    } else {
        combo = 0;
        await processMatches();
    }
}

function updateTileDisplay(row, col) {
    const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (tile) {
        let img = tile.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            tile.appendChild(img);
        }
        img.src = `assets/tile${grid[row][col]}.png`;
        img.alt = `Tile ${grid[row][col]}`;
        tile.classList.remove('matched', 'falling', 'new', 'selected');
    }
}

function findMatches() {
    const matches = new Set();
    
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const tileType = grid[row][col];
            if (tileType === -1) continue;
            
            let horizontalMatch = [{ row, col }];
            let c = col + 1;
            while (c < GRID_SIZE && grid[row][c] === tileType) {
                horizontalMatch.push({ row, col: c });
                c++;
            }
            
            if (horizontalMatch.length >= MIN_MATCH) {
                horizontalMatch.forEach(pos => matches.add(`${pos.row},${pos.col}`));
            }
            
            let verticalMatch = [{ row, col }];
            let r = row + 1;
            while (r < GRID_SIZE && grid[r][col] === tileType) {
                verticalMatch.push({ row: r, col });
                r++;
            }
            
            if (verticalMatch.length >= MIN_MATCH) {
                verticalMatch.forEach(pos => matches.add(`${pos.row},${pos.col}`));
            }
        }
    }
    
    return Array.from(matches).map(pos => {
        const [row, col] = pos.split(',').map(Number);
        return { row, col };
    });
}

async function processMatches() {
    let matches = findMatches();
    
    while (matches.length > 0) {
        combo++;
        updateCombo();
        
        matches.forEach(pos => {
            const tile = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
            tile.classList.add('matched');
        });
        
        playClearSound();
        
        let matchScore = matches.length * 10 * combo;
        if (matches.length >= 5) {
            matchScore *= 2;
            showSpecialNotice('超级消除!');
        }
        score += matchScore;
        updateScore();
        
        await delay(300);
        
        matches.forEach(pos => {
            grid[pos.row][pos.col] = -1;
            const tile = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
            tile.innerHTML = '';
        });
        
        await dropTiles();
        await fillEmptySpaces();
        
        if (combo >= 3) {
            createSpecialTile();
        }
        
        matches = findMatches();
    }
    
    combo = 0;
    updateCombo();
    isProcessing = false;
}

function createSpecialTile() {
    const filledCells = [];
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] !== -1) {
                filledCells.push({ row, col });
            }
        }
    }
    
    if (filledCells.length > 0) {
        const randomCell = filledCells[Math.floor(Math.random() * filledCells.length)];
        showSpecialNotice('获得特殊道具!');
    }
}

function showSpecialNotice(text) {
    specialNoticeElement.textContent = text;
    specialNoticeElement.style.display = 'block';
    setTimeout(() => {
        specialNoticeElement.style.display = 'none';
    }, 800);
}

async function dropTiles() {
    let dropped = false;
    
    for (let col = 0; col < GRID_SIZE; col++) {
        let writeRow = GRID_SIZE - 1;
        
        for (let readRow = GRID_SIZE - 1; readRow >= 0; readRow--) {
            if (grid[readRow][col] !== -1) {
                if (readRow !== writeRow) {
                    grid[writeRow][col] = grid[readRow][col];
                    grid[readRow][col] = -1;
                    
                    const targetTile = document.querySelector(`[data-row="${writeRow}"][data-col="${col}"]`);
                    const sourceTile = document.querySelector(`[data-row="${readRow}"][data-col="${col}"]`);
                    
                    targetTile.classList.add('falling');
                    updateTileDisplay(writeRow, col);
                    
                    sourceTile.innerHTML = '';
                    sourceTile.classList.remove('falling', 'new', 'matched');
                    
                    dropped = true;
                }
                writeRow--;
            }
        }
    }
    
    if (dropped) {
        await delay(250);
        document.querySelectorAll('.falling').forEach(t => t.classList.remove('falling'));
    }
}

async function fillEmptySpaces() {
    let filled = false;
    
    for (let col = 0; col < GRID_SIZE; col++) {
        for (let row = 0; row < GRID_SIZE; row++) {
            if (grid[row][col] === -1) {
                let tileType;
                let attempts = 0;
                do {
                    tileType = Math.floor(Math.random() * TILE_TYPES);
                    attempts++;
                } while (wouldCreateMatchAfterFill(row, col, tileType) && attempts < 10);
                
                grid[row][col] = tileType;
                
                const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                tile.classList.add('new');
                updateTileDisplay(row, col);
                
                filled = true;
            }
        }
    }
    
    if (filled) {
        await delay(300);
        document.querySelectorAll('.new').forEach(t => t.classList.remove('new'));
    }
}

function wouldCreateMatchAfterFill(row, col, tileType) {
    let horizontalCount = 1;
    let verticalCount = 1;
    
    for (let c = col - 1; c >= 0; c--) {
        if (grid[row][c] !== tileType) break;
        horizontalCount++;
    }
    for (let c = col + 1; c < GRID_SIZE; c++) {
        if (grid[row][c] !== tileType) break;
        horizontalCount++;
    }
    
    for (let r = row - 1; r >= 0; r--) {
        if (grid[r][col] !== tileType) break;
        verticalCount++;
    }
    for (let r = row + 1; r < GRID_SIZE; r++) {
        if (grid[r][col] !== tileType) break;
        verticalCount++;
    }
    
    return horizontalCount >= MIN_MATCH || verticalCount >= MIN_MATCH;
}

function updateScore() {
    scoreElement.textContent = score;
}

function updateCombo() {
    if (combo > 1) {
        comboElement.textContent = `${combo}x COMBO!`;
    } else {
        comboElement.textContent = '';
    }
}

function startBGM() {
    bgm.volume = 0.3;
    bgm.play().catch(() => {});
}

function playClearSound() {
    clearSound.volume = 0.5;
    clearSound.currentTime = 0;
    clearSound.play().catch(() => {});
}

function playSpecialSound() {
    specialSound.volume = 0.5;
    specialSound.currentTime = 0;
    specialSound.play().catch(() => {});
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

restartBtn.addEventListener('click', initGame);
finalRestartBtn.addEventListener('click', initGame);

document.addEventListener('DOMContentLoaded', initGame);