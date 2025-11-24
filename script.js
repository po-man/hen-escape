const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game State
let frames = 0;
let score = 0;
let gameSpeed = 5;
let isGameOver = false;

// Physics Constants
const GRAVITY = 0.6;
const JUMP_STRENGTH = 12; 
const GROUND_HEIGHT = 50; 

// The Main Character
const hen = {
    x: 0, // Will be set in resize()
    y: 0, 
    width: 40,
    height: 40,
    dy: 0,
    grounded: false,
    color: '#D35400',
    
    draw: function() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Beak (Facing Right)
        ctx.fillStyle = '#F1C40F';
        ctx.fillRect(this.x + 30, this.y + 10, 15, 10);
        // Eye
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 25, this.y + 5, 5, 5);
    },
    
    update: function() {
        // 1. Apply Gravity
        this.dy += GRAVITY;

        // 2. Apply Velocity
        this.y += this.dy;

        // 3. Check Floor
        if (this.y + this.height > canvas.height - GROUND_HEIGHT) {
            this.y = canvas.height - GROUND_HEIGHT - this.height; 
            this.dy = 0; 
            this.grounded = true; 
        } else {
            this.grounded = false;
        }
    },
    
    jump: function() {
        if (this.grounded) {
            this.dy = -JUMP_STRENGTH;
            this.grounded = false;
        }
    }
};

// Input Handling
function handleInput() {
    hen.jump();
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') handleInput();
});
document.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    handleInput();
});
document.addEventListener('mousedown', () => handleInput());

function resetGame() {
    hen.y = canvas.height - hen.height - GROUND_HEIGHT;
    hen.dy = 0;
    frames = 0;
    score = 0;
    gameSpeed = 5;
    isGameOver = false;
    gameLoop();
}

function update() {
    frames++;
    hen.update();
    
    // Speed Ramping
    if (frames % 1000 === 0) gameSpeed += 0.5;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = '#333'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Floor
    ctx.fillStyle = '#222';
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
    ctx.strokeStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - GROUND_HEIGHT);
    ctx.lineTo(canvas.width, canvas.height - GROUND_HEIGHT);
    ctx.stroke();

    // Hen
    hen.draw();
    
    // UI Debug (Moved to Right Side)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Semi-transparent
    ctx.font = '16px Courier';
    ctx.textAlign = 'right'; // Align text to the right
    ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}`, canvas.width - 10, 30);
    ctx.textAlign = 'left'; // Reset alignment for other things
}

function gameLoop() {
    if (isGameOver) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialization
function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    
    // CENTER THE HEN
    hen.x = (canvas.width / 2) - (hen.width / 2);
    
    // Keep hen on ground during resize
    hen.y = canvas.height - hen.height - GROUND_HEIGHT;
}
window.addEventListener('resize', resize);

// Start
resize();
gameLoop();