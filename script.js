const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const levelEl = document.getElementById('level');
const speedEl = document.getElementById('speed');
const gameModeEl = document.getElementById('game-mode');
const playerSelectEl = document.getElementById('player-select');
const gameOverEl = document.getElementById('game-over');
const restartBtn = document.getElementById('restart');
const newGameBtn = document.getElementById('new-game');
const upBtn = document.getElementById('up');
const downBtn = document.getElementById('down');
const leftBtn = document.getElementById('left');
const rightBtn = document.getElementById('right');

const gridSize = 20;
const canvasSize = Math.min(800, window.innerWidth * 0.9);
canvas.width = canvasSize;
canvas.height = canvasSize;

let snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
let food = {};
let direction = 'right';
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let level = 1;
let baseSpeed = 150;
let gameSpeed = baseSpeed;
let gameMode = 'no-walls';
let gameInterval;
let gameOver = false;
let maze = [];
let snakeColorHue = 200; // Initial hue for snake color
let currentPlayerIndex = 0; // Index of the currently playing person

const playerScores = [
    { name: 'Ramjan Khan', score: 0 },
    { name: 'Oishik Khan', score: 0 },
    { name: 'Siron Khan', score: 0 },
    { name: 'Abdullah Khan', score: 0 },
    { name: 'Talha Khan', score: 0 },
];

// Populate player select dropdown
playerScores.forEach((player, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = player.name;
    playerSelectEl.appendChild(option);
});

playerSelectEl.addEventListener('change', (event) => {
    currentPlayerIndex = parseInt(event.target.value);
    score = playerScores[currentPlayerIndex].score;
    scoreEl.textContent = score;
    highScoreEl.textContent = localStorage.getItem('highScore') || 0;
});

const mazes = {
    maze: [
        {x: 2, y: 2}, {x: 3, y: 2}, {x: 4, y: 2}, {x: 5, y: 2},
        {x: 14, y: 2}, {x: 15, y: 2}, {x: 16, y: 2}, {x: 17, y: 2},
        {x: 2, y: 17}, {x: 3, y: 17}, {x: 4, y: 17}, {x: 5, y: 17},
        {x: 14, y: 17}, {x: 15, y: 17}, {x: 16, y: 17}, {x: 17, y: 17},
        {x: 2, y: 3}, {x: 2, y: 4}, {x: 2, y: 5},
        {x: 17, y: 3}, {x: 17, y: 4}, {x: 17, y: 5},
        {x: 2, y: 14}, {x: 2, y: 15}, {x: 2, y: 16},
        {x: 17, y: 14}, {x: 17, y: 15}, {x: 17, y: 16},
    ]
};

function main() {
    if (gameOver) {
        gameOverEl.classList.remove('hidden');
        return;
    }

    gameInterval = setTimeout(() => {
        requestAnimationFrame(main);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMaze();
        drawFood();
        moveSnake();
        drawSnake();
        drawLiveScores();
    }, gameSpeed);
}

function drawLiveScores() {
    ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.font = '1.2em Orbitron';
    ctx.textAlign = 'left';
    let yOffset = 30;
    // Sort playerScores by score in descending order
    playerScores.sort((a, b) => b.score - a.score);
    playerScores.forEach((player, index) => {
        if (index === currentPlayerIndex) {
            ctx.fillStyle = '#00ffff'; // Highlight color
            ctx.font = 'bold 1.3em Orbitron';
        } else {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
            ctx.font = '1.2em Orbitron';
        }
        ctx.fillText(`${player.name}: ${player.score}`, 10, yOffset + (index * 25));
    });
}

function drawSnake() {
    const opacity = 0.7 + Math.sin(Date.now() / 150) * 0.2; // Oscillates between 0.5 and 0.9
    snake.forEach((segment, index) => {
        if (index === 0) {
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.fillRect(segment.x * gridSize - 2, segment.y * gridSize - 2, gridSize + 4, gridSize + 4);
        } else {
            ctx.fillStyle = `hsla(${snakeColorHue}, 100%, 50%, ${opacity})`;
            ctx.shadowColor = `hsl(${snakeColorHue}, 100%, 50%)`;
            ctx.shadowBlur = 10;
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        }
    });
    ctx.shadowBlur = 0;
}

function moveSnake() {
    const head = { x: snake[0].x, y: snake[0].y };

    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    if (gameMode === 'no-walls') {
        if (head.x < 0) head.x = canvasSize / gridSize - 1;
        if (head.x >= canvasSize / gridSize) head.x = 0;
        if (head.y < 0) head.y = canvasSize / gridSize - 1;
        if (head.y >= canvasSize / gridSize) head.y = 0;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        updateLevel();
        generateFood();
        snakeColorHue = (snakeColorHue + 30) % 360; // Change hue by 30 degrees
        // Update current player's score
        playerScores[0].score = score; // Assuming the first player in the array is the current player
        playerScores.sort((a, b) => b.score - a.score); // Sort by score descending
    } else {
        snake.pop();
    }

    checkCollision();
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };

    if (snake.some(segment => segment.x === food.x && segment.y === food.y) || 
        (gameMode === 'maze' && maze.some(wall => wall.x === food.x && wall.y === food.y))) {
        generateFood();
    }
}

function drawFood() {
    const hue = (Date.now() / 10) % 360;
    const scale = 0.8 + Math.sin(Date.now() / 200) * 0.2; // Oscillates between 0.6 and 1.0
    const scaledSize = gridSize * scale;
    const offset = (gridSize - scaledSize) / 2;

    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    ctx.shadowBlur = 15;
    ctx.fillRect(food.x * gridSize + offset, food.y * gridSize + offset, scaledSize, scaledSize);
    ctx.shadowBlur = 0;
}

function drawMaze() {
    if (gameMode !== 'maze') return;
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    maze.forEach(wall => {
        ctx.fillRect(wall.x * gridSize, wall.y * gridSize, gridSize, gridSize);
    });
    ctx.shadowBlur = 0;
}

function checkCollision() {
    const head = snake[0];

    if (gameMode === 'classic' && (head.x < 0 || head.x >= canvasSize / gridSize || head.y < 0 || head.y >= canvasSize / gridSize)) {
        return endGame();
    }

    if (gameMode === 'maze' && maze.some(wall => wall.x === head.x && wall.y === head.y)) {
        return endGame();
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return endGame();
        }
    }
}

function endGame() {
    gameOver = true;
    clearTimeout(gameInterval);
    // Update the score for the current player
    playerScores[currentPlayerIndex].score = score;
    playerScores.sort((a, b) => b.score - a.score); // Sort after updating score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreEl.textContent = highScore;
    }
}

function startGame() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    direction = 'right';
    score = playerScores[currentPlayerIndex].score; // Load score for selected player
    level = 1;
    scoreEl.textContent = score;
    levelEl.textContent = level;
    gameOver = false;
    gameOverEl.classList.add('hidden');
    gameMode = gameModeEl.value;
    baseSpeed = parseInt(speedEl.value);
    gameSpeed = baseSpeed;

    if (gameMode === 'maze') {
        maze = mazes.maze;
    } else {
        maze = [];
    }

    generateFood();
    clearTimeout(gameInterval);
    main();
}

function updateLevel() {
    const newLevel = Math.floor(score / 5) + 1;
    if (newLevel > level) {
        level = newLevel;
        levelEl.textContent = level;
        gameSpeed = baseSpeed - (level - 1) * 10;
    }
}

function changeDirection(event) {
    const key = event.key;
    const goingUp = direction === 'up';
    const goingDown = direction === 'down';
    const goingLeft = direction === 'left';
    const goingRight = direction === 'right';

    if ((key === 'ArrowUp' || key.toLowerCase() === 'w') && !goingDown) direction = 'up';
    else if ((key === 'ArrowDown' || key.toLowerCase() === 's') && !goingUp) direction = 'down';
    else if ((key === 'ArrowLeft' || key.toLowerCase() === 'a') && !goingRight) direction = 'left';
    else if ((key === 'ArrowRight' || key.toLowerCase() === 'd') && !goingLeft) direction = 'right';
}

let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

function handleTouchMove(event) {
    if (!touchStartX || !touchStartY) {
        return;
    }

    let touchEndX = event.touches[0].clientX;
    let touchEndY = event.touches[0].clientY;

    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0 && direction !== 'left') {
            direction = 'right';
        } else if (direction !== 'right') {
            direction = 'left';
        }
    } else {
        if (diffY > 0 && direction !== 'up') {
            direction = 'down';
        } else if (direction !== 'down') {
            direction = 'up';
        }
    }

    touchStartX = 0;
    touchStartY = 0;
}

document.addEventListener('keydown', changeDirection);
document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);

restartBtn.addEventListener('click', startGame);
newGameBtn.addEventListener('click', startGame);

upBtn.addEventListener('click', () => { if (!gameOver && direction !== 'down') direction = 'up'; });
downBtn.addEventListener('click', () => { if (!gameOver && direction !== 'up') direction = 'down'; });
leftBtn.addEventListener('click', () => { if (!gameOver && direction !== 'right') direction = 'left'; });
rightBtn.addEventListener('click', () => { if (!gameOver && direction !== 'left') direction = 'right'; });

highScoreEl.textContent = highScore;
startGame();