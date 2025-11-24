const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// UI Elements (DOM)
const scoreElement = document.getElementById('score-val');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const petitionMessage = document.getElementById('petition-message');
// Note: We are ignoring the HTML 'item-slot' now and drawing it on Canvas instead.

// Game State
let frames = 0;
let score = 0;
let gameSpeed = 5;
let isGameOver = false;
let hasScroll = false; // Track if we collected the item

// Physics Constants
const GRAVITY = 0.6;
const JUMP_STRENGTH = 12; 
const GROUND_HEIGHT = 50; 

// Obstacles Management
let obstacles = [];
let spawnTimer = 0; 

// The Scroll Item
let scrollItem = null; // Object when active, null when inactive

// The Main Character
const hen = {
    x: 0, 
    y: 0, 
    width: 40,
    height: 40,
    dy: 0,
    grounded: false,
    color: '#D35400', 
    
    draw: function() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Beak
        ctx.fillStyle = '#F1C40F';
        ctx.fillRect(this.x + 30, this.y + 10, 15, 10);
        // Eye
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 25, this.y + 5, 5, 5);
    },
    
    update: function() {
        this.dy += GRAVITY;
        this.y += this.dy;

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
    if (!isGameOver) {
        hen.jump();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') handleInput();
});
document.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    handleInput();
});
document.addEventListener('mousedown', () => handleInput());

restartBtn.addEventListener('click', () => {
    resetGame();
});

function spawnObstacle() {
    obstacles.push({
        x: canvas.width, 
        y: canvas.height - GROUND_HEIGHT - 40, 
        width: 40,
        height: 40,
        markedForDeletion: false
    });
}

function handleObstacles() {
    spawnTimer--;
    if (spawnTimer <= 0) {
        spawnObstacle();
        spawnTimer = 60 + Math.random() * 90; 
    }

    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;

        // Collision Check (Hen vs Cage)
        if (
            hen.x < obs.x + obs.width &&
            hen.x + hen.width > obs.x &&
            hen.y < obs.y + obs.height &&
            hen.y + hen.height > obs.y
        ) {
            gameOver();
        }

        if (obs.x + obs.width < 0) {
            obs.markedForDeletion = true;
            score++;
            scoreElement.innerText = score;
        }
    }
    obstacles = obstacles.filter(obs => !obs.markedForDeletion);
}

// Logic Only: Move the scroll and check collision
function updateScroll() {
    // 1. Spawn Logic: Only if score > 10, no scroll yet, and random chance
    if (score >= 10 && !hasScroll && !scrollItem) {
        if (Math.random() < 0.005) { // 0.5% chance per frame
            scrollItem = {
                x: canvas.width,
                y: canvas.height - GROUND_HEIGHT - 110, // In the air! Requires Jump.
                width: 30,
                height: 30
            };
        }
    }

    // 2. Update Scroll Position & Collision
    if (scrollItem) {
        scrollItem.x -= gameSpeed;

        // Collision Check (Hen vs Scroll)
        if (
            hen.x < scrollItem.x + scrollItem.width &&
            hen.x + hen.width > scrollItem.x &&
            hen.y < scrollItem.y + scrollItem.height &&
            hen.y + hen.height > scrollItem.y
        ) {
            // COLLECTED!
            hasScroll = true;
            scrollItem = null; // Remove from screen
        }
        
        // Remove if off screen
        else if (scrollItem.x + scrollItem.width < 0) {
            scrollItem = null;
        }
    }
}

// Drawing Only: Render the flying scroll
function drawScroll() {
    if (scrollItem) {
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.fillRect(scrollItem.x, scrollItem.y, scrollItem.width, scrollItem.height);
        
        // Add a "?" mark on it
        ctx.fillStyle = '#000';
        ctx.font = '20px Courier';
        ctx.textAlign = 'left';
        ctx.fillText('?', scrollItem.x + 8, scrollItem.y + 22);
    }
}

function drawObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        ctx.fillStyle = '#95a5a6'; 
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        
        // Detail (Cage Bars preserved)
        ctx.strokeStyle = '#2c3e50'; 
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        ctx.beginPath();
        ctx.moveTo(obs.x + 13, obs.y); 
        ctx.lineTo(obs.x + 13, obs.y + obs.height);
        ctx.moveTo(obs.x + 26, obs.y); 
        ctx.lineTo(obs.x + 26, obs.y + obs.height);
        ctx.stroke();
    }
}

function drawUI() {
    // 1. Speed Display (Top Right)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '16px Courier';
    ctx.textAlign = 'right';
    ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}`, canvas.width - 10, 30);

    // 2. Scroll Collection Status (Left of Speed)
    if (hasScroll) {
        ctx.font = '24px serif'; // Use serif for the scroll icon
        ctx.textAlign = 'right'; 
        // Position it 140px to the left of the right edge (next to speed)
        ctx.fillText('📜', canvas.width - 140, 30); 
    }
    
    // Reset Alignment
    ctx.textAlign = 'left';
}

function gameOver() {
    isGameOver = true;
    finalScoreElement.innerText = "Score: " + score;
    
    // Check if player collected the scroll
    if (hasScroll) {
        petitionMessage.classList.remove('hidden'); 
    } else {
        petitionMessage.classList.add('hidden'); 
    }
    
    gameOverScreen.classList.remove('hidden');
}

function resetGame() {
    hen.y = canvas.height - hen.height - GROUND_HEIGHT;
    hen.dy = 0;
    obstacles = [];
    spawnTimer = 0;
    frames = 0;
    score = 0;
    gameSpeed = 5;
    isGameOver = false;
    
    // Reset Scroll State
    hasScroll = false;
    scrollItem = null;
    petitionMessage.classList.add('hidden');
    
    scoreElement.innerText = "0";
    gameOverScreen.classList.add('hidden');
    
    gameLoop();
}

function update() {
    frames++;
    hen.update();
    handleObstacles();
    updateScroll(); // Logic only
    
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

    drawObstacles(); // Bars are safe
    drawScroll();    // NEW: Drawn after clearRect!
    hen.draw();
    drawUI();        // NEW: Handles speed and item slot
}

function gameLoop() {
    if (isGameOver) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    hen.x = (canvas.width / 2) - (hen.width / 2);
    hen.y = canvas.height - hen.height - GROUND_HEIGHT;
}
window.addEventListener('resize', resize);

resize();
gameLoop();