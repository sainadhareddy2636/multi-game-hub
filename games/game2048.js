const boardElement = document.getElementById('game-board');
let board = [];
let score = 0;
let timer = 0;
let timerInterval;
let previousBoards = []; // for undo

// ------------------ New Game ------------------
function newGame() {
    board = Array(4).fill(0).map(() => Array(4).fill(0));
    score = 0;
    previousBoards = [];
    document.getElementById('score').innerText = `Score: ${score}`;
    startTimer();
    spawnTile();
    spawnTile();
    renderBoard();
}

// ------------------ Render Board ------------------
function renderBoard() {
    boardElement.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            if (board[i][j] !== 0) {
                tile.classList.add(`tile-${board[i][j]}`);
                tile.innerText = board[i][j];
            }
            boardElement.appendChild(tile);
        }
    }
}

// ------------------ Spawn Tile ------------------
function spawnTile() {
    const empty = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (board[i][j] === 0) empty.push([i, j]);
    if (empty.length === 0) return;
    const [x, y] = empty[Math.floor(Math.random() * empty.length)];
    board[x][y] = Math.random() < 0.9 ? 2 : 4;
}

// ------------------ Timer ------------------
function startTimer() {
    clearInterval(timerInterval);
    timer = 0;
    document.getElementById('timer').innerText = `Time: 0s`;
    timerInterval = setInterval(() => {
        timer++;
        document.getElementById('timer').innerText = `Time: ${timer}s`;
    }, 1000);
}

// ------------------ Save Board for Undo ------------------
function saveBoard() {
    previousBoards.push(JSON.parse(JSON.stringify(board)));
    if (previousBoards.length > 5) previousBoards.shift(); // keep last 5 moves
}

// ------------------ Undo ------------------
function undo() {
    if (previousBoards.length > 0) {
        board = previousBoards.pop();
        renderBoard();
    }
}

// ------------------ Move & Merge Logic ------------------
function move(direction) {
    saveBoard();
    let moved = false;

    function slide(row) {
        const arr = row.filter(n => n !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                score += arr[i];
                arr[i + 1] = 0;
            }
        }
        return arr.filter(n => n !== 0).concat(Array(4 - arr.filter(n => n !== 0).length).fill(0));
    }

    if (direction === 'ArrowLeft') {
        for (let i = 0; i < 4; i++) {
            const newRow = slide(board[i]);
            if (board[i].toString() !== newRow.toString()) moved = true;
            board[i] = newRow;
        }
    }

    if (direction === 'ArrowRight') {
        for (let i = 0; i < 4; i++) {
            const newRow = slide(board[i].slice().reverse()).reverse();
            if (board[i].toString() !== newRow.toString()) moved = true;
            board[i] = newRow;
        }
    }

    if (direction === 'ArrowUp') {
        for (let j = 0; j < 4; j++) {
            const col = slide(board.map(row => row[j]));
            for (let i = 0; i < 4; i++) {
                if (board[i][j] !== col[i]) moved = true;
                board[i][j] = col[i];
            }
        }
    }

    if (direction === 'ArrowDown') {
        for (let j = 0; j < 4; j++) {
            const col = slide(board.map(row => row[j]).reverse()).reverse();
            for (let i = 0; i < 4; i++) {
                if (board[i][j] !== col[i]) moved = true;
                board[i][j] = col[i];
            }
        }
    }

    if (moved) {
        spawnTile();
        renderBoard();
        document.getElementById('score').innerText = `Score: ${score}`;
        checkWin();
        checkGameOver();
    }
}

// ------------------ Keyboard Controls ------------------
document.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        move(e.key);
    }
});

// ------------------ Touch Controls ------------------
let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
});
document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) move('ArrowRight');
        else if (dx < -30) move('ArrowLeft');
    } else {
        if (dy > 30) move('ArrowDown');
        else if (dy < -30) move('ArrowUp');
    }
});

// ------------------ Win Detection ------------------
function checkWin() {
    for (let row of board) if (row.includes(2048)) {
        launchConfetti();
        boardElement.classList.add('won');
        setTimeout(() => alert(`🎉 You Win! Score: ${score} 🎉`), 500);
        return;
    }
}

// ------------------ Game Over Detection ------------------
function checkGameOver() {
    if (board.flat().includes(0)) return;
    // Check if any merge is possible
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const val = board[i][j];
            if ((i < 3 && board[i + 1][j] === val) || (j < 3 && board[i][j + 1] === val)) return;
        }
    }
    setTimeout(() => alert(`💀 Game Over! Score: ${score} 💀`), 200);
}

// ------------------ Confetti ------------------
function launchConfetti() {
    for (let i = 0; i < 50; i++) {
        const c = document.createElement('div');
        c.classList.add('confetti');
        c.style.left = Math.random() * 100 + '%';
        c.style.backgroundColor = `hsl(${Math.random() * 360},70%,60%)`;
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 3000);
    }
}

// ------------------ Start Initial Game ------------------
newGame();
// Undo with 'U' key
document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'u') undo();
});
const toggleBtn = document.getElementById('toggle-controls');
const controlsInfo = document.getElementById('controls-info');
toggleBtn.addEventListener('click', () => {
    controlsInfo.classList.toggle('closed'); // toggle collapsed class
    if (controlsInfo.classList.contains('closed')) {
        toggleBtn.innerText = 'Show Controls';
    } else {
        toggleBtn.innerText = 'Hide Controls';
    }
});


