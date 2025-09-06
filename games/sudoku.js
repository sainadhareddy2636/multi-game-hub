const boardElement = document.getElementById('sudoku-board');
let board = Array(81).fill(0);
let fixedCells = Array(81).fill(false);
let moveStack = [];
let timer = 0;
let timerInterval;
let mistakes = 0;
let maxMistakes = 3;
let hintCount = 3;
let boardSolution = [];
let selectedDifficulty = '';

// ------------------ Start Game ------------------
function startGame(difficulty){
    selectedDifficulty = difficulty;
    document.getElementById('difficulty-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    newGame();
}

// ------------------ New Game ------------------
function newGame(){
    moveStack = [];
    mistakes = 0;
    hintCount = 3;
    document.getElementById('mistakes').innerText = `Mistakes: ${mistakes}`;
    document.getElementById('hint-count').innerText = hintCount;
    const {puzzle, solution} = generateSudoku(selectedDifficulty);
    boardSolution = solution;
    createBoard(puzzle);
}

// ------------------ Board Rendering ------------------
function createBoard(puzzleArr){
    boardElement.innerHTML = '';
    board = Array(81).fill(0);
    fixedCells = Array(81).fill(false);
    for(let i=0;i<81;i++){
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        if(puzzleArr[i] !==0){
            cell.innerText = puzzleArr[i];
            cell.classList.add('fixed');
            fixedCells[i] = true;
            board[i] = puzzleArr[i];
        }
        cell.addEventListener('click', ()=>selectCell(i));
        boardElement.appendChild(cell);
    }
    startTimer();
}

// ------------------ Cell Selection ------------------
function selectCell(index){
    document.querySelectorAll('.cell').forEach(c=>c.classList.remove('selected','highlight'));
    const row=Math.floor(index/9);
    const col=index%9;
    document.querySelectorAll('.cell').forEach((c,i)=>{
        const r=Math.floor(i/9);
        const cIndex=i%9;
        if(r===row || cIndex===col || (Math.floor(r/3)===Math.floor(row/3) && Math.floor(cIndex/3)===Math.floor(col/3))){
            c.classList.add('highlight');
        }
    });
    document.querySelector(`.cell[data-index='${index}']`).classList.add('selected');
}

// ------------------ Keyboard Input ------------------
document.addEventListener('keydown', e=>{
    const selected=document.querySelector('.cell.selected');
    if(!selected) return;
    const index=selected.dataset.index;
    if(fixedCells[index]) return;
    if(e.key>=1 && e.key<=9){ makeMove(index,parseInt(e.key)); }
    else if(e.key==='Backspace'||e.key==='0'){ makeMove(index,0); }
});

// ------------------ Moves & Undo ------------------
function makeMove(index,value){
    moveStack.push({index,prev:board[index]});
    board[index]=value;
    const cell=document.querySelector(`.cell[data-index='${index}']`);
    cell.innerText=value===0?'':value;
    checkMistake(index);
    checkWin();
}

function undo(){
    const last=moveStack.pop();
    if(last){
        board[last.index]=last.prev;
        const cell=document.querySelector(`.cell[data-index='${last.index}']`);
        cell.innerText=last.prev===0?'':last.prev;
        cell.classList.remove('wrong');
    }
}

// ------------------ Mistakes ------------------
function checkMistake(index){
    const cell=document.querySelector(`.cell[data-index='${index}']`);
    if(board[index]!==0 && board[index]!==boardSolution[index]){
        cell.classList.add('wrong');
        mistakes++;
        document.getElementById('mistakes').innerText=`Mistakes: ${mistakes}`;
        if(mistakes>=maxMistakes){
            alert('Game Over! Too many mistakes.');
            startGame(selectedDifficulty);
        }
    } else { cell.classList.remove('wrong'); }
}

// ------------------ Hints ------------------
function showHint(){
    if(hintCount<=0) return;
    const emptyCells=board.map((v,i)=>v===0?i:null).filter(i=>i!==null);
    if(emptyCells.length===0) return;
    const hintIndex=emptyCells[Math.floor(Math.random()*emptyCells.length)];
    const cell=document.querySelector(`.cell[data-index='${hintIndex}']`);
    cell.innerText=boardSolution[hintIndex];
    board[hintIndex]=boardSolution[hintIndex];
    cell.classList.add('hinted');
    hintCount--;
    document.getElementById('hint-count').innerText=hintCount;
}

// ------------------ Timer ------------------
function startTimer(){
    clearInterval(timerInterval);
    timer=0;
    document.getElementById('timer').innerText=`Time: 0s`;
    timerInterval=setInterval(()=>{
        timer++;
        document.getElementById('timer').innerText=`Time: ${timer}s`;
    },1000);
}

// ------------------ Win Detection ------------------
function checkWin(){
    if(board.every((v,i)=>v===boardSolution[i])){
        clearInterval(timerInterval);
        document.getElementById('sudoku-board').classList.add('completed');
        launchConfetti();
        setTimeout(()=>{
            alert(`🎉 Congratulations! You solved the Sudoku in ${timer} seconds! 🎉`);
            startGame(selectedDifficulty);
        },500);
    }
}

// ------------------ Confetti ------------------
function launchConfetti(){
    const confettiCount=100;
    for(let i=0;i<confettiCount;i++){
        const confetti=document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left=Math.random()*100+'%';
        confetti.style.backgroundColor=`hsl(${Math.random()*360},70%,60%)`;
        confetti.style.animationDuration=(Math.random()*2+3)+'s';
        document.body.appendChild(confetti);
        setTimeout(()=>confetti.remove(),5000);
    }
}

// ------------------ Sudoku Generator ------------------
function generateSudoku(difficulty='easy'){
    const board=Array.from({length:9},()=>Array(9).fill(0));
    fillBoard(board);
    const solution=board.map(row=>row.slice());
    let removeCount=difficulty==='easy'?35:difficulty==='medium'?45:55;
    while(removeCount>0){
        const row=Math.floor(Math.random()*9);
        const col=Math.floor(Math.random()*9);
        if(board[row][col]!==0){ board[row][col]=0; removeCount--; }
    }
    return {puzzle:board.flat(),solution:solution.flat()};
}

function fillBoard(board){
    for(let row=0;row<9;row++){
        for(let col=0;col<9;col++){
            if(board[row][col]===0){
                const numbers=shuffle([1,2,3,4,5,6,7,8,9]);
                for(const num of numbers){
                    if(isSafe(board,row,col,num)){
                        board[row][col]=num;
                        if(fillBoard(board)) return true;
                        board[row][col]=0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function isSafe(board,row,col,num){
    for(let i=0;i<9;i++){ if(board[row][i]===num||board[i][col]===num) return false; }
    const startRow=row-row%3, startCol=col-col%3;
    for(let i=0;i<3;i++) for(let j=0;j<3;j++) if(board[startRow+i][startCol+j]===num) return false;
    return true;
}

function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }
