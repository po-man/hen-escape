const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game State
let frames = 0;
let score = 0;
let gameSpeed = 5; // Initial speed
let isGameOver = false;
let hasScroll = false;

// Input Handling
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
});
document.addEventListener('touchstart', () => jump());
document.addEventListener('mousedown', () => jump());

function jump() {
    if (isGameOver) resetGame();
    console.log("Jump command received");
    // TODO: Add jump logic in next stage
}

function resetGame() {
    console.log("Game Reset");
    // TODO: Reset variables
    gameLoop();
}

function update() {
    // TODO: Update Hen, Obstacles, Background
    frames++;
    // Speed Ramping Logic (Simple)
    if (frames % 1000 === 0) gameSpeed += 0.5;
}

function draw() {
    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Placeholder Visuals
    ctx.fillStyle = '#888'; // Factory Wall color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '20px Courier';
    ctx.fillText('Hen Escape - Ready', 50, 50);
}

function gameLoop() {
    if (isGameOver) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialization
function resize() {
    // Resizes canvas to fit the CSS container
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resize);

// Start
resize();
gameLoop();