// ========================================
// Pool Master 3D Pro - Advanced Game Engine
// ========================================

// Global Game State
let gameState = {
    currentScreen: 'loading',
    gameMode: null,
    currentPlayer: 1,
    players: {
        1: {
            name: 'A Salih',
            level: 149,
            vipLevel: 3,
            vipMultiplier: 1.25,
            score: 0,
            remainingBalls: [1, 2, 3, 4, 5, 6, 7],
            coins: 569881935,
            gems: 3157,
            goldBars: 2330
        },
        2: {
            name: 'Surfacehunter',
            level: 52,
            vipLevel: 0,
            vipMultiplier: 1.0,
            score: 0,
            remainingBalls: [9, 10, 11, 12, 13, 14, 15],
            coins: 0,
            gems: 0,
            goldBars: 0
        }
    },
    currentPower: 50,
    aiming: false,
    gameStarted: false,
    turn: 1,
    fouls: 0,
    gameSettings: {
        sound: true,
        music: true,
        difficulty: 'medium',
        showGuidelines: true
    }
};

// 3D Scene Variables
let scene, camera, renderer, world;
let balls = {};
let table, cueStick, aimingLine;
let currentCueBall;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
});

function initializeGame() {
    console.log('🎮 Initializing Pool Master 3D Pro...');
    
    // Initialize 3D Scene
    init3DScene();
    
    // Setup UI
    setupUI();
    
    // Start game
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        gameState.currentScreen = 'main-menu';
        animate();
    }, 3000);
}

function init3DScene() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f2b);
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 2);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 5, 2);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Create Table
    createPoolTable();
    
    // Create Balls
    createPoolBalls();
    
    // Create Cue Stick
    createCueStick();
    
    // Initialize Physics
    initPhysics();
}

function createPoolTable() {
    // Table felt (purple)
    const feltGeometry = new THREE.PlaneGeometry(2.54, 1.27);
    const feltMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xa96bff,
        transparent: true,
        opacity: 0.8
    });
    const felt = new THREE.Mesh(feltGeometry, feltMaterial);
    felt.rotation.x = -Math.PI / 2;
    felt.receiveShadow = true;
    scene.add(felt);
    
    // Table rails
    const railMaterial = new THREE.MeshPhongMaterial({ color: 0x4a2c17 });
    const railThickness = 0.05;
    const railHeight = 0.08;
    
    // Front and back rails
    const frontRail = new THREE.Mesh(
        new THREE.BoxGeometry(2.54, railHeight, railThickness),
        railMaterial
    );
    frontRail.position.set(0, railHeight/2, 0.635 + railThickness/2);
    scene.add(frontRail);
    
    const backRail = frontRail.clone();
    backRail.position.set(0, railHeight/2, -0.635 - railThickness/2);
    scene.add(backRail);
    
    // Side rails
    const leftRail = new THREE.Mesh(
        new THREE.BoxGeometry(railThickness, railHeight, 1.27),
        railMaterial
    );
    leftRail.position.set(-1.27 - railThickness/2, railHeight/2, 0);
    scene.add(leftRail);
    
    const rightRail = leftRail.clone();
    rightRail.position.set(1.27 + railThickness/2, railHeight/2, 0);
    scene.add(rightRail);
    
    // Pockets
    const pocketGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 16);
    const pocketMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    const pocketPositions = [
        [-1.27, 0, -0.635],  // top left
        [0, 0, -0.635],      // top center
        [1.27, 0, -0.635],   // top right
        [-1.27, 0, 0.635],   // bottom left
        [0, 0, 0.635],       // bottom center
        [1.27, 0, 0.635]     // bottom right
    ];
    
    pocketPositions.forEach(pos => {
        const pocket = new THREE.Mesh(pocketGeometry, pocketMaterial);
        pocket.position.set(pos[0], -0.05, pos[2]);
        scene.add(pocket);
    });
}

function createPoolBalls() {
    const ballGeometry = new THREE.SphereGeometry(0.028, 32, 32);
    
    // Ball colors
    const ballColors = {
        1: 0xff0000,   // Red
        2: 0xffff00,   // Yellow
        3: 0x0000ff,   // Blue
        4: 0x800080,   // Purple
        5: 0xffa500,   // Orange
        6: 0x008000,   // Green
        7: 0x800000,   // Brown
        8: 0x000000,   // Black
        9: 0xff0000,   // Red stripe
        10: 0xffff00,  // Yellow stripe
        11: 0x0000ff,  // Blue stripe
        12: 0x800080,  // Purple stripe
        13: 0xffa500,  // Orange stripe
        14: 0x008000,  // Green stripe
        15: 0x800000,  // Brown stripe
        'cue': 0xffffff  // White
    };
    
    // Create cue ball
    const cueBallMaterial = new THREE.MeshPhongMaterial({ 
        color: ballColors['cue'],
        shininess: 100
    });
    const cueBall = new THREE.Mesh(ballGeometry, cueBallMaterial);
    cueBall.position.set(0, 0.028, -0.5);
    cueBall.castShadow = true;
    scene.add(cueBall);
    balls['cue'] = cueBall;
    currentCueBall = cueBall;
    
    // Create numbered balls in triangle rack
    const ballPositions = generateBallRack();
    let ballNumber = 1;
    
    ballPositions.forEach((pos, index) => {
        if (ballNumber <= 15) {
            const ballMaterial = new THREE.MeshPhongMaterial({ 
                color: ballColors[ballNumber],
                shininess: 100
            });
            
            // Check if this should be a stripe
            if (ballNumber >= 9) {
                ballMaterial.transparent = true;
                // Create stripe effect
                const stripeGeometry = new THREE.CylinderGeometry(0.028, 0.028, 0.015, 32);
                const stripeMaterial = new THREE.MeshPhongMaterial({ 
                    color: ballColors[ballNumber - 8],
                    shininess: 100
                });
                const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
                stripe.rotation.z = Math.PI / 2;
                ballMaterial.map = stripeMaterial.map;
            }
            
            const ball = new THREE.Mesh(ballGeometry, ballMaterial);
            ball.position.set(pos[0], 0.028, pos[2]);
            ball.castShadow = true;
            ball.userData = { number: ballNumber, isPocketed: false };
            scene.add(ball);
            balls[ballNumber] = ball;
            ballNumber++;
        }
    });
}

function generateBallRack() {
    const positions = [];
    const startX = 0;
    const startZ = 0.2;
    const ballSpacing = 0.06;
    const triangleHeight = ballSpacing * Math.sqrt(3) / 2;
    
    let ballIndex = 0;
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col <= row; col++) {
            const x = startX + (col - row/2) * ballSpacing;
            const z = startZ + row * triangleHeight;
            positions.push([x, 0.028, z]);
            ballIndex++;
        }
    }
    
    return positions;
}

function createCueStick() {
    const cueGeometry = new THREE.CylinderGeometry(0.005, 0.008, 1.5, 16);
    const cueMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513,
        transparent: true,
        opacity: 0.7
    });
    
    cueStick = new THREE.Mesh(cueGeometry, cueMaterial);
    cueStick.position.set(-0.5, 0.05, -0.5);
    cueStick.rotation.x = Math.PI / 4;
    scene.add(cueStick);
    
    // Aiming line
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
    aimingLine = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(aimingLine);
}

function initPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    
    // Create table plane
    const tableShape = new CANNON.Plane();
    const tableBody = new CANNON.Body({ mass: 0 });
    tableBody.addShape(tableShape);
    tableBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(tableBody);
}

function setupUI() {
    // Game mode selection
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.dataset.mode;
            startGame(mode);
        });
    });
    
    // Lucky Chest
    document.querySelector('.lucky-chest')?.addEventListener('click', openLuckyChest);
    
    // Store
    document.querySelector('.store')?.addEventListener('click', openStore);
    
    // Friends panel
    document.querySelector('.nav-item[data-section="friends"]')?.addEventListener('click', toggleFriendsPanel);
    
    // Currency purchase buttons
    document.querySelectorAll('.currency-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openStore();
        });
    });
    
    // Game controls
    setupGameControls();
}

function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', onWindowResize);
    
    // Keyboard controls
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Mouse/touch controls
    if (gameState.currentScreen === 'game') {
        setupGameControls();
    }
}

function startGame(mode) {
    console.log(`🎮 Starting game mode: ${mode}`);
    
    gameState.gameMode = mode;
    gameState.currentScreen = 'match-setup';
    
    // Show match setup screen
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('match-setup').classList.remove('hidden');
    
    // Animate setup screen
    setTimeout(() => {
        startActualGame();
    }, 5000);
}

function startActualGame() {
    gameState.currentScreen = 'game';
    gameState.gameStarted = true;
    
    // Hide setup, show game
    document.getElementById('match-setup').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    // Update UI
    updateGameUI();
    
    console.log('🎮 Game started!');
}

function openLuckyChest() {
    const modal = document.getElementById('lucky-chest-modal');
    if (modal) {
        modal.classList.remove('hidden');
        setupLuckyChest();
    }
}

function setupLuckyChest() {
    const chestItems = document.querySelectorAll('.chest-item');
    chestItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            if (!item.classList.contains('flipped')) {
                item.classList.add('flipped');
                showReward(item.dataset.reward);
            }
        });
    });
}

function showReward(reward) {
    let rewardMessage = '';
    let coins = 0;
    
    switch (reward) {
        case 'coins':
            coins = Math.floor(Math.random() * 100) + 50;
            rewardMessage = `تهانينا! حصلت على ${coins} عملة ذهبية!`;
            gameState.players[1].coins += coins;
            break;
        case 'double':
            rewardMessage = 'مكافأة مضاعفة! ستحصل على ضعف المكافآت القادمة';
            break;
        case 'quintuple':
            rewardMessage = 'مكافأة خماسية! ستحصل على 5 أضعاف المكافآت القادمة';
            break;
        case 'gold':
            coins = Math.floor(Math.random() * 10) + 5;
            rewardMessage = `مكافأة ذهبية خاصة! ${coins} سبائك ذهبية!`;
            gameState.players[1].goldBars += coins;
            break;
    }
    
    // Show notification
    showNotification(rewardMessage, 'success');
    
    // Update currency display
    updateCurrencyDisplay();
}

function openStore() {
    const modal = document.getElementById('store-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function toggleFriendsPanel() {
    const panel = document.getElementById('friends-panel');
    if (panel) {
        panel.classList.toggle('hidden');
        panel.classList.toggle('open');
    }
}

function setupGameControls() {
    // Power control
    const powerIndicator = document.getElementById('power-indicator');
    if (powerIndicator) {
        // Update power display
        powerIndicator.style.height = (gameState.currentPower * 2) + 'px';
    }
    
    // Aiming controls
    if (currentCueBall) {
        setupAimingControls();
    }
    
    // Turn indicator
    updateTurnIndicator();
}

function setupAimingControls() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children);
        
        if (intersects.length > 0 && !gameState.aiming) {
            const point = intersects[0].point;
            updateAimingLine(point);
        }
    }
    
    function onMouseClick(event) {
        if (gameState.aiming) {
            shootBall();
        } else {
            startAiming();
        }
    }
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);
}

function updateAimingLine(targetPoint) {
    if (!currentCueBall || !aimingLine) return;
    
    const start = currentCueBall.position.clone();
    const end = targetPoint.clone();
    
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    aimingLine.geometry.dispose();
    aimingLine.geometry = geometry;
    
    // Update cue stick position
    if (cueStick) {
        const direction = new THREE.Vector3().subVectors(start, end).normalize();
        cueStick.position.copy(start);
        cueStick.lookAt(start.clone().add(direction));
    }
}

function startAiming() {
    gameState.aiming = true;
    if (aimingLine) {
        aimingLine.visible = true;
    }
    if (cueStick) {
        cueStick.visible = true;
    }
}

function shootBall() {
    if (!currentCueBall || !gameState.aiming) return;
    
    const force = gameState.currentPower / 100;
    const direction = new THREE.Vector3()
        .subVectors(currentCueBall.position, aimingLine.geometry.attributes.position.array.slice(-3))
        .normalize();
    
    // Apply physics force
    if (world) {
        const velocity = new CANNON.Vec3(
            direction.x * force * 10,
            0,
            direction.z * force * 10
        );
        // This would need proper physics body setup for the cue ball
    }
    
    // Visual feedback
    showNotification('كرة مُضربة!', 'info');
    
    // Reset aiming
    gameState.aiming = false;
    if (aimingLine) {
        aimingLine.visible = false;
    }
}

function updateGameUI() {
    // Update player info
    const player1Panel = document.querySelector('.player-panel.left');
    const player2Panel = document.querySelector('.player-panel.right');
    
    if (player1Panel) {
        const name = player1Panel.querySelector('.player-name');
        const level = player1Panel.querySelector('.player-level');
        
        if (name) name.textContent = gameState.players[1].name;
        if (level) level.textContent = gameState.players[1].level;
    }
    
    if (player2Panel) {
        const name = player2Panel.querySelector('.player-name');
        const level = player2Panel.querySelector('.player-level');
        
        if (name) name.textContent = gameState.players[2].name;
        if (level) level.textContent = gameState.players[2].level;
    }
    
    // Update score
    const scoreDisplay = document.querySelector('.score');
    if (scoreDisplay) {
        scoreDisplay.textContent = `${gameState.players[1].score}-${gameState.players[2].score}`;
    }
    
    // Update currency display
    updateCurrencyDisplay();
}

function updateCurrencyDisplay() {
    const currencyElements = document.querySelectorAll('.currency-amount');
    if (currencyElements.length >= 3) {
        // Gems
        currencyElements[0].textContent = gameState.players[1].gems;
        // Gold Coins
        currencyElements[1].textContent = gameState.players[1].coins.toLocaleString();
        // Gold Bars
        currencyElements[2].textContent = gameState.players[1].goldBars;
    }
}

function updateTurnIndicator() {
    const turnIndicator = document.querySelector('.turn-indicator');
    if (turnIndicator) {
        turnIndicator.textContent = `دور اللاعب ${gameState.currentPlayer}`;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function onKeyDown(event) {
    switch (event.key) {
        case ' ':
            event.preventDefault();
            if (gameState.currentScreen === 'game' && !gameState.aiming) {
                startAiming();
            } else if (gameState.aiming) {
                shootBall();
            }
            break;
        case 'ArrowUp':
            gameState.currentPower = Math.min(100, gameState.currentPower + 5);
            updatePowerDisplay();
            break;
        case 'ArrowDown':
            gameState.currentPower = Math.max(0, gameState.currentPower - 5);
            updatePowerDisplay();
            break;
        case 'Escape':
            if (gameState.currentScreen === 'game') {
                // Pause game or show menu
                showNotification('تم الضغط على ESC', 'info');
            }
            break;
    }
}

function onKeyUp(event) {
    if (event.key === ' ' && gameState.aiming) {
        shootBall();
    }
}

function updatePowerDisplay() {
    const powerIndicator = document.getElementById('power-indicator');
    if (powerIndicator) {
        powerIndicator.style.height = (gameState.currentPower * 2) + 'px';
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update 3D scene
    if (renderer && scene && camera) {
        // Rotate subtle animations for 3D elements
        if (cueStick && !gameState.aiming) {
            cueStick.rotation.y += 0.01;
        }
        
        renderer.render(scene, camera);
    }
    
    // Update game state
    if (gameState.currentScreen === 'game') {
        updateGameLogic();
    }
}

function updateGameLogic() {
    // Check for ball pockets
    checkPocketedBalls();
    
    // Check game end conditions
    checkGameEnd();
    
    // Update turn if needed
    // This would be expanded based on physics and game rules
}

// AI Player Implementation
class AIPlayer {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.settings = CONFIG.ai[difficulty] || CONFIG.ai.medium;
        this.thinking = false;
    }
    
    async makeMove() {
        if (this.thinking) return;
        
        this.thinking = true;
        
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, this.settings.thinkTime));
        
        // Calculate best shot
        const shot = this.calculateBestShot();
        
        if (shot) {
            executeShot(shot);
        }
        
        this.thinking = false;
    }
    
    calculateBestShot() {
        const availableBalls = this.getAvailableBalls();
        
        if (availableBalls.length === 0) return null;
        
        // Simple AI: choose closest ball to pocket
        let bestBall = availableBalls[0];
        let bestDistance = Infinity;
        
        availableBalls.forEach(ball => {
            const distance = this.calculateDistanceToPocket(ball);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestBall = ball;
            }
        });
        
        return {
            ball: bestBall,
            power: this.calculateOptimalPower(bestBall),
            accuracy: this.settings.accuracy
        };
    }
    
    getAvailableBalls() {
        // Get balls that haven't been pocketed yet
        return Object.keys(balls)
            .filter(key => key !== 'cue' && !balls[key].userData.isPocketed)
            .map(key => balls[key]);
    }
    
    calculateDistanceToPocket(ball) {
        // Simplified distance calculation to nearest pocket
        const pockets = [
            [-1.27, -0.635], [0, -0.635], [1.27, -0.635],
            [-1.27, 0.635], [0, 0.635], [1.27, 0.635]
        ];
        
        let minDistance = Infinity;
        pockets.forEach(pocket => {
            const distance = Math.sqrt(
                Math.pow(ball.position.x - pocket[0], 2) + 
                Math.pow(ball.position.z - pocket[1], 2)
            );
            minDistance = Math.min(minDistance, distance);
        });
        
        return minDistance;
    }
    
    calculateOptimalPower(ball) {
        // Calculate power based on distance to pocket
        const distance = this.calculateDistanceToPocket(ball);
        return Math.min(100, Math.max(20, distance * 50));
    }
}

// Game Utility Functions
function checkPocketedBalls() {
    Object.keys(balls).forEach(ballKey => {
        const ball = balls[ballKey];
        if (ballKey !== 'cue' && !ball.userData.isPocketed) {
            // Check if ball is in pocket area
            const pockets = [
                [-1.27, -0.635], [0, -0.635], [1.27, -0.635],
                [-1.27, 0.635], [0, 0.635], [1.27, 0.635]
            ];
            
            pockets.forEach(pocket => {
                const distance = Math.sqrt(
                    Math.pow(ball.position.x - pocket[0], 2) + 
                    Math.pow(ball.position.z - pocket[1], 2)
                );
                
                if (distance < 0.1) {
                    pocketBall(ballKey);
                }
            });
        }
    });
}

function pocketBall(ballKey) {
    const ball = balls[ballKey];
    if (ball) {
        ball.userData.isPocketed = true;
        ball.visible = false;
        
        // Update player score
        const player = gameState.currentPlayer;
        if (gameState.players[player].remainingBalls.includes(ball.userData.number)) {
            gameState.players[player].remainingBalls = 
                gameState.players[player].remainingBalls.filter(n => n !== ball.userData.number);
            gameState.players[player].score++;
        }
        
        showNotification(`كرة رقم ${ball.userData.number} في الجيب!`, 'success');
        updateGameUI();
    }
}

function checkGameEnd() {
    // Check if all balls of one player are pocketed
    Object.keys(gameState.players).forEach(playerKey => {
        const player = gameState.players[playerKey];
        if (player.remainingBalls.length === 0) {
            // Player wins if they pocketed all their balls AND the 8-ball
            const eightBallPocketed = balls[8]?.userData.isPocketed;
            if (eightBallPocketed) {
                endGame(parseInt(playerKey));
            }
        }
    });
    
    // Check if 8-ball was pocketed early
    if (balls[8]?.userData.isPocketed) {
        const player = gameState.currentPlayer;
        if (gameState.players[player].remainingBalls.length > 0) {
            // Foul - early 8-ball
            showNotification('خطأ! تم إيداع الكرة الثمانية مبكراً!', 'error');
            // Add foul logic here
        }
    }
}

function endGame(winner) {
    gameState.gameStarted = false;
    
    const winnerName = gameState.players[winner].name;
    showNotification(`🎉 ${winnerName} فاز في اللعبة!`, 'success');
    
    // Award coins
    const winReward = Math.floor(Math.random() * 1000) + 500;
    gameState.players[1].coins += winReward;
    showNotification(`+${winReward} عملة ذهبية`, 'success');
    
    // Return to main menu after delay
    setTimeout(() => {
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        gameState.currentScreen = 'main-menu';
        updateCurrencyDisplay();
    }, 3000);
}

// Event Handler Setup
document.addEventListener('click', (event) => {
    // Close modals when clicking outside
    if (event.target.classList.contains('modal')) {
        event.target.classList.add('hidden');
    }
    
    // Close friends panel
    if (event.target.classList.contains('panel-close')) {
        event.target.closest('.side-panel').classList.add('hidden');
    }
    
    // Lucky chest close
    if (event.target.classList.contains('modal-close')) {
        event.target.closest('.modal').classList.add('hidden');
    }
});

// Initialize CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('🎮 Pool Master 3D Pro loaded successfully!');