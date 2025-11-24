const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// UI Elements (DOM)
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const scrollDialog = document.getElementById('scroll-dialog'); 

// Game State
let frames = 0;
let score = 0;
let gameSpeed = 4;
let isGameOver = false;
let hasScroll = false; 

// Physics Constants
const GRAVITY = 0.6;
const JUMP_STRENGTH = 12; 
let groundHeight = 50; 

// Obstacles Management
let obstacles = [];
let spawnTimer = 0; 

// The Scroll Item
let scrollItem = null; 

// Parallax Background State
let bgLayer1 = { x: 0, speedMod: 0.2 }; // Far Wall (Slowest)
let bgLayer2 = { x: 0, speedMod: 0.5 }; // Mid Layer (Cages)

// The Main Character
const hen = {
    x: 0, 
    y: 0, 
    width: 40,
    height: 40,
    dy: 0,
    grounded: false,
    color: '#D35400', // Bright Burnt Orange (Hero)
    
    draw: function() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Beak
        ctx.fillStyle = '#F1C40F';
        ctx.fillRect(this.x + 30, this.y + 10, 15, 10);
        // Eye
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 25, this.y + 5, 5, 5);
        // Wing Detail
        ctx.fillStyle = '#A04000';
        ctx.fillRect(this.x + 10, this.y + 20, 20, 10);
    },
    
    update: function() {
        this.dy += GRAVITY;
        this.y += this.dy;

        if (this.y + this.height > canvas.height - groundHeight) {
            this.y = canvas.height - groundHeight - this.height; 
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
        y: canvas.height - groundHeight - 40, 
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
        }
    }
    obstacles = obstacles.filter(obs => !obs.markedForDeletion);
}

function updateScroll() {
    if (score >= 6 && !hasScroll && !scrollItem) {
        if (Math.random() < 0.005) { 
            scrollItem = {
                x: canvas.width,
                y: canvas.height - groundHeight - 30,
                width: 30,
                height: 30
            };
        }
    }

    if (scrollItem) {
        scrollItem.x -= gameSpeed;

        if (
            hen.x < scrollItem.x + scrollItem.width &&
            hen.x + hen.width > scrollItem.x &&
            hen.y < scrollItem.y + scrollItem.height &&
            hen.y + hen.height > scrollItem.y
        ) {
            hasScroll = true;
            scrollItem = null; 
        }
        else if (scrollItem.x + scrollItem.width < 0) {
            scrollItem = null;
        }
    }
}

// --- UPDATED PARALLAX ---
function drawBackground() {
    bgLayer1.x -= gameSpeed * bgLayer1.speedMod;
    if (bgLayer1.x <= -canvas.width) bgLayer1.x = 0;
    
    drawFarLayer(bgLayer1.x);
    drawFarLayer(bgLayer1.x + canvas.width);

    bgLayer2.x -= gameSpeed * bgLayer2.speedMod;
    if (bgLayer2.x <= -canvas.width) bgLayer2.x = 0;
    
    drawMidLayer(bgLayer2.x);
    drawMidLayer(bgLayer2.x + canvas.width);
}

function drawFarLayer(xOffset) {
    // Background: Dark Gloom
    ctx.fillStyle = '#1a1a1a'; 
    ctx.fillRect(xOffset, 0, canvas.width, canvas.height);
    
    // Pattern: A tight grid of small "boxes" to look like distant stacks
    ctx.fillStyle = '#262626'; // Slightly lighter than background
    let boxSize = 20;
    let gap = 5;
    
    for (let x = 0; x < canvas.width; x += (boxSize + gap)) {
        for (let y = 0; y < canvas.height; y += (boxSize + gap)) {
            // Draw small rectangles representing distant cages
            ctx.fillRect(xOffset + x, y, boxSize, boxSize);
        }
    }
}

function drawMidLayer(xOffset) {
    let rowHeight = 80;
    
    for (let y = 0; y < canvas.height - groundHeight; y += rowHeight) {
        
        // 1. The Shelf/Floor
        ctx.fillStyle = '#4a4a4a'; 
        ctx.fillRect(xOffset, y + rowHeight - 10, canvas.width, 10); 
        
        // 2. The Feeding Trough
        ctx.fillStyle = '#3d3d3d';
        ctx.fillRect(xOffset, y + rowHeight - 20, canvas.width, 5);

        // --- NEW: The Trapped Hens ---
        // We draw these BEFORE the bars so they look trapped
        ctx.fillStyle = '#4d1f01'; // Darker Orange than our Hero
        for (let i = 0; i < canvas.width; i += 40) { // Every 40px
            // Draw a rounded bird shape
            ctx.fillRect(xOffset + i + 5, y + rowHeight - 35, 30, 20);
            
            // Beak detail (very small, implies direction)
            ctx.fillStyle = '#5e4c05';
            ctx.fillRect(xOffset + i + 32, y + rowHeight - 30, 5, 5);
            ctx.fillStyle = '#4d1f01'; // Reset for next bird body
        }

        // 3. Vertical Bars & Dividers (The Cage)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < canvas.width; i += 10) {
            if (i % 60 === 0) {
                // Thick Support Beam
                ctx.fillStyle = '#2c3e50'; 
                ctx.fillRect(xOffset + i, y, 10, rowHeight);
            } else {
                // Thin Cage Wire
                ctx.beginPath();
                ctx.moveTo(xOffset + i, y);
                ctx.lineTo(xOffset + i, y + rowHeight - 20);
                ctx.stroke();
            }
        }
    }
}

function drawScroll() {
    if (scrollItem) {
        ctx.fillStyle = '#FFD700'; 
        ctx.fillRect(scrollItem.x, scrollItem.y, scrollItem.width, scrollItem.height);
        
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Courier';
    
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);

    ctx.textAlign = 'right';
    ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}`, canvas.width - 10, 30);

    if (hasScroll) {
        ctx.font = '24px serif'; 
        ctx.textAlign = 'right'; 
        ctx.fillText('📜', canvas.width - 140, 30); 
    }
    
    ctx.textAlign = 'left';
}

function gameOver() {
    isGameOver = true;
    finalScoreElement.innerText = "Score: " + score;
    
    if (hasScroll) {
        scrollDialog.classList.remove('hidden'); 
    } else {
        scrollDialog.classList.add('hidden'); 
    }
    
    gameOverScreen.classList.remove('hidden');
}

function resetGame() {
    hen.y = canvas.height - groundHeight - hen.height;
    hen.dy = 0;
    obstacles = [];
    spawnTimer = 0;
    frames = 0;
    score = 0;
    gameSpeed = 4;
    isGameOver = false;
    
    hasScroll = false;
    scrollItem = null;
    scrollDialog.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    bgLayer1.x = 0;
    bgLayer2.x = 0;
    
    gameLoop();
}

function update() {
    frames++;
    hen.update();
    handleObstacles();
    updateScroll(); 
    
    if (frames % 300 === 0) gameSpeed += 1.0;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground(); 
    
    // Floor
    ctx.fillStyle = '#222';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    
    // Floor Line
    ctx.strokeStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - groundHeight);
    ctx.lineTo(canvas.width, canvas.height - groundHeight);
    ctx.stroke();

    drawObstacles(); 
    drawScroll();    
    hen.draw();
    drawUI();       
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

    if (canvas.height > canvas.width) {
        groundHeight = canvas.height / 3;
    } else {
        groundHeight = 50;
    }
    
    hen.x = (canvas.width / 2) - (hen.width / 2);
    hen.y = canvas.height - groundHeight - hen.height;
    
    obstacles.forEach(obs => {
        obs.y = canvas.height - groundHeight - obs.height;
    });

    if (scrollItem) {
        scrollItem.y = canvas.height - groundHeight - scrollItem.height;
    }
}
window.addEventListener('resize', resize);

resize();
gameLoop();