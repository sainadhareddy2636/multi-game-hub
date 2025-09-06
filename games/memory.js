const board = document.getElementById('memory-board');
const attemptsEl = document.getElementById('attempts');
const matchesEl = document.getElementById('matches');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');

let firstCard = null;
let secondCard = null;
let attempts = 0;
let matches = 0;
let timer = 0;
let timerInterval;

// Emojis to use as cards (8 pairs for 4x4 grid)
const emojis = ['🍎','🍌','🍇','🍓','🍉','🍒','🥝','🍍'];

function shuffleArray(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

function startGame() {
    clearInterval(timerInterval);
    timer = 0;
    timerInterval = setInterval(() => {
        timer++;
        timerEl.innerText = `Time: ${timer}s`;
    }, 1000);

    attempts = 0;
    matches = 0;
    attemptsEl.innerText = `Attempts: ${attempts}`;
    matchesEl.innerText = `Matches: ${matches}`;

    const cardValues = shuffleArray([...emojis, ...emojis]); // duplicate for pairs
    board.innerHTML = '';

    cardValues.forEach(emoji => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.value = emoji;
        card.innerText = emoji;
        card.addEventListener('click', flipCard);
        board.appendChild(card);
    });
}

function flipCard(e) {
    const card = e.target;
    if (card.classList.contains('flipped')) return;

    card.classList.add('flipped');

    if (!firstCard) {
        firstCard = card;
    } else {
        secondCard = card;
        attempts++;
        attemptsEl.innerText = `Attempts: ${attempts}`;

        if (firstCard.dataset.value === secondCard.dataset.value) {
            matches++;
            matchesEl.innerText = `Matches: ${matches}`;
            firstCard = null;
            secondCard = null;

            if (matches === emojis.length) {
                clearInterval(timerInterval);
                setTimeout(() => alert(`🎉 You Won! Attempts: ${attempts}, Time: ${timer}s 🎉`), 300);
            }
        } else {
            setTimeout(() => {
                firstCard.classList.remove('flipped');
                secondCard.classList.remove('flipped');
                firstCard = null;
                secondCard = null;
            }, 800);
        }
    }
}

restartBtn.addEventListener('click', startGame);

// Start game on load
startGame();
