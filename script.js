const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// UI Elements (DOM)
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const scrollDialog = document.getElementById('scroll-dialog'); 
const startScreen = document.getElementById('start-screen'); 
const scrollHint = document.getElementById('scroll-hint'); 

// Game State
let frames = 0;
let score = 0;
let gameSpeed = 4;
let isGameOver = false;
let hasScroll = false; 
let gameStarted = false; 

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
let bgLayer1 = { x: 0, speedMod: 0.2 }; 
let bgLayer2 = { x: 0, speedMod: 0.5 }; 

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

// --- START GAME LOGIC ---
function startGame(e) {
    if (e) {
        e.stopPropagation(); 
        e.preventDefault();  
    }
    gameStarted = true;
    startScreen.classList.add('hidden');
}

startScreen.addEventListener('mousedown', startGame);
startScreen.addEventListener('touchstart', startGame);


// --- GAMEPLAY INPUT LOGIC ---
function handleInput() {
    if (!gameStarted) return; 

    if (!isGameOver) {
        hen.jump();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameStarted) startGame(); 
        else handleInput();
    }
});

// FIXED: Touchstart logic
document.addEventListener('touchstart', (e) => {
    // 1. Safety Check: Are we touching a button?
    // If target is the restart button OR the petition link...
    if (e.target.id === 'restart-btn' || e.target.closest('.scroll-btn')) {
        // RETURN immediately. Do not prevent default. Let the click happen.
        return; 
    }

    // 2. Otherwise, handle game input
    if (gameStarted) {
        // Prevent default touch behavior (scrolling/zoom) on the CANVAS only
        if (e.cancelable) e.preventDefault(); 
        handleInput();
    }
}, { passive: false }); // Passive false allows us to use preventDefault

document.addEventListener('mousedown', () => {
    if (gameStarted) handleInput();
});

// FIXED: Touchmove logic
document.addEventListener('touchmove', (e) => {
    // Allow scrolling ONLY if we are interacting with the scroll dialog link
    if (e.target.closest('.scroll-btn') || e.target.closest('.scroll-paper')) {
        return;
    }
    // Otherwise lock the screen
    e.preventDefault();
}, { passive: false });

restartBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    resetGame();
});


// --- GAME LOOP & LOGIC ---

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

function drawBackground() {
    if (gameStarted && !isGameOver) {
        bgLayer1.x -= gameSpeed * bgLayer1.speedMod;
        if (bgLayer1.x <= -canvas.width) bgLayer1.x = 0;

        bgLayer2.x -= gameSpeed * bgLayer2.speedMod;
        if (bgLayer2.x <= -canvas.width) bgLayer2.x = 0;
    }
    
    drawFarLayer(bgLayer1.x);
    drawFarLayer(bgLayer1.x + canvas.width);
    
    drawMidLayer(bgLayer2.x);
    drawMidLayer(bgLayer2.x + canvas.width);
}

function drawFarLayer(xOffset) {
    ctx.fillStyle = '#1a1a1a'; 
    ctx.fillRect(xOffset, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#262626'; 
    let boxSize = 20;
    let gap = 5;
    for (let x = 0; x < canvas.width; x += (boxSize + gap)) {
        for (let y = 0; y < canvas.height; y += (boxSize + gap)) {
            ctx.fillRect(xOffset + x, y, boxSize, boxSize);
        }
    }
}

function drawMidLayer(xOffset) {
    let rowHeight = 80;
    for (let y = 0; y < canvas.height - groundHeight; y += rowHeight) {
        ctx.fillStyle = '#4a4a4a'; 
        ctx.fillRect(xOffset, y + rowHeight - 10, canvas.width, 10); 
        ctx.fillStyle = '#3d3d3d';
        ctx.fillRect(xOffset, y + rowHeight - 20, canvas.width, 5);

        ctx.fillStyle = '#4d1f01'; 
        for (let i = 0; i < canvas.width; i += 40) { 
            ctx.fillRect(xOffset + i + 5, y + rowHeight - 35, 30, 20);
            
            ctx.fillStyle = '#5e4c05';
            ctx.fillRect(xOffset + i + 32, y + rowHeight - 30, 5, 5);
            ctx.fillStyle = '#4d1f01'; 
        }
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (let i = 0; i < canvas.width; i += 10) {
            if (i % 60 === 0) {
                ctx.fillStyle = '#2c3e50'; 
                ctx.fillRect(xOffset + i, y, 10, rowHeight);
            } else {
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
    if (!gameStarted) return; 

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Courier';
    
    ctx.textAlign = 'left';
    ctx.fillText(`得分: ${score}`, 10, 30);

    ctx.textAlign = 'right';
    ctx.fillText(`速度: ${gameSpeed.toFixed(1)}`, canvas.width - 10, 30);

    if (hasScroll) {
        ctx.font = '24px serif'; 
        ctx.textAlign = 'right'; 
        ctx.fillText('📜', canvas.width - 140, 30); 
    }
    
    ctx.textAlign = 'left';
}

function gameOver() {
    isGameOver = true;
    finalScoreElement.innerText = "得分: " + score;
    
    if (hasScroll) {
        scrollDialog.classList.remove('hidden'); 
        scrollHint.classList.add('hidden'); 
    } else {
        scrollDialog.classList.add('hidden'); 
        scrollHint.classList.remove('hidden'); 
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
    scrollHint.classList.add('hidden'); 
    gameOverScreen.classList.add('hidden');
    
    gameStarted = true; 
    
    bgLayer1.x = 0;
    bgLayer2.x = 0;
    
    gameLoop();
}

function update() {
    if (!gameStarted) return;

    frames++;
    hen.update();
    handleObstacles();
    updateScroll(); 
    
    if (frames % 240 === 0) gameSpeed += 0.5;
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