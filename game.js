import * as THREE from 'three';

const gameStats = {
    hits: 0,
    totalShots: 0,
    score: 0,
    timeLeft: 60,
    accuracy: 0,
    streak: 0,
    multiplier: 1,
    basePoints: 100,
    maxMultiplier: 5,
    streakThreshold: 5,
    missPenalty: 50
};

const crosshairConfig = {
    size: 20,
    color: '#00ff00',
    thickness: 2
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.background = new THREE.Color(0x121212);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

camera.position.set(0, 0, 5);

const spheres = [];
const sphereRadius = 1.2;
const minDistance = 3;
const targetZ = -15;
const boundary = {
    x: { min: -10, max: 10 },
    y: { min: -5, max: 5 }
};

let isPaused = false;
let isPointerLocked = false;
const mouseSensitivity = 0.002;
let rotationX = 0;
let rotationY = 0;

const crosshair = document.createElement('div');
crosshair.style.position = 'fixed';
crosshair.style.top = '50%';
crosshair.style.left = '50%';
crosshair.style.pointerEvents = 'none';
document.body.appendChild(crosshair);

function updateCrosshair() {
    const halfSize = crosshairConfig.size / 2;
    crosshair.innerHTML = `
        <style>
            .crosshair-h, .crosshair-v {
                position: absolute;
                background-color: ${crosshairConfig.color};
            }
            .crosshair-h {
                width: ${crosshairConfig.size}px;
                height: ${crosshairConfig.thickness}px;
                top: 50%;
                left: -${halfSize}px;
                transform: translateY(-50%);
            }
            .crosshair-v {
                width: ${crosshairConfig.thickness}px;
                height: ${crosshairConfig.size}px;
                left: 50%;
                top: -${halfSize}px;
                transform: translateX(-50%);
            }
        </style>
        <div class="crosshair-h"></div>
        <div class="crosshair-v"></div>
    `;
}

function updateCrosshairPreview() {
    const preview = document.getElementById('crosshairPreview');
    const halfSize = crosshairConfig.size / 2;
    preview.innerHTML = `
        <style>
            .crosshair-h, .crosshair-v {
                position: absolute;
                background-color: ${crosshairConfig.color};
            }
            .crosshair-h {
                width: ${crosshairConfig.size}px;
                height: ${crosshairConfig.thickness}px;
                top: 50%;
                left: -${halfSize}px;
                transform: translateY(-50%);
            }
            .crosshair-v {
                width: ${crosshairConfig.thickness}px;
                height: ${crosshairConfig.size}px;
                left: 50%;
                top: -${halfSize}px;
                transform: translateX(-50%);
            }
        </style>
        <div class="crosshair-h"></div>
        <div class="crosshair-v"></div>
    `;
}

function calculateScore() {
    if (gameStats.streak < gameStats.streakThreshold) {
        return gameStats.basePoints;
    }
    const multiplierIncrease = Math.min(
        (gameStats.streak - gameStats.streakThreshold) * 0.2,
        gameStats.maxMultiplier - 1
    );
    gameStats.multiplier = 1 + multiplierIncrease;
    return Math.round(gameStats.basePoints * gameStats.multiplier);
}

function updateStats() {
    document.getElementById('score').textContent = gameStats.score;
    document.getElementById('accuracy').textContent = 
        gameStats.totalShots > 0 
            ? Math.round((gameStats.hits / gameStats.totalShots) * 100) + '%' 
            : '0%';
    
    const minutes = Math.floor(gameStats.timeLeft / 60);
    const seconds = gameStats.timeLeft % 60;
    document.getElementById('timer').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function createSphere() {
    const geometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff,
        shininess: 60,
        specular: 0x444444
    });
    return new THREE.Mesh(geometry, material);
}

function getRandomPosition() {
    return {
        x: Math.random() * (boundary.x.max - boundary.x.min) + boundary.x.min,
        y: Math.random() * (boundary.y.max - boundary.y.min) + boundary.y.min,
        z: targetZ
    };
}

function isValidPosition(position) {
    for (const sphere of spheres) {
        const distance = Math.sqrt(
            Math.pow(position.x - sphere.position.x, 2) +
            Math.pow(position.y - sphere.position.y, 2)
        );
        if (distance < minDistance) return false;
    }
    return true;
}

function addNewSphere() {
    let position;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        position = getRandomPosition();
        attempts++;
        if (attempts > maxAttempts) break;
    } while (!isValidPosition(position));

    if (attempts <= maxAttempts) {
        const sphere = createSphere();
        sphere.position.set(position.x, position.y, position.z);
        scene.add(sphere);
        spheres.push(sphere);
    }
}

function resetGame() {
    gameStats.hits = 0;
    gameStats.totalShots = 0;
    gameStats.score = 0;
    gameStats.timeLeft = 60;
    gameStats.accuracy = 0;
    gameStats.streak = 0;
    gameStats.multiplier = 1;

    spheres.forEach(sphere => scene.remove(sphere));
    spheres.length = 0;

    for (let i = 0; i < 3; i++) {
        addNewSphere();
    }

    updateStats();
}

function togglePause() {
    isPaused = !isPaused;
    
    const pauseMenu = document.getElementById('pauseMenu');
    const optionsMenu = document.getElementById('optionsMenu');
    
    if (isPaused) {
        pauseMenu.classList.remove('hidden');
        optionsMenu.classList.add('hidden');
        if (isPointerLocked) {
            document.exitPointerLock();
        }
    } else {
        pauseMenu.classList.add('hidden');
        optionsMenu.classList.add('hidden');
        if (!isPointerLocked) {
            document.body.requestPointerLock();
        }
    }
}

function toggleOptionsMenu() {
    const optionsMenu = document.getElementById('optionsMenu');
    const pauseMenu = document.getElementById('pauseMenu');
    
    if (optionsMenu.classList.contains('hidden')) {
        pauseMenu.classList.add('hidden');
        optionsMenu.classList.remove('hidden');
        updateCrosshairPreview();
    } else {
        optionsMenu.classList.add('hidden');
        pauseMenu.classList.remove('hidden');
    }
}

function handlePointerLockChange() {
    isPointerLocked = document.pointerLockElement === document.body || 
                      document.mozPointerLockElement === document.body;
    
    if (!isPointerLocked && !isPaused) {
        togglePause();
    }
}

function handleMouseMove(event) {
    if (!isPointerLocked || isPaused) return;

    rotationY -= event.movementX * mouseSensitivity;
    rotationX -= event.movementY * mouseSensitivity;
    rotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotationX));

    camera.rotation.order = 'YXZ';
    camera.rotation.x = rotationX;
    camera.rotation.y = rotationY;
}

function onMouseClick(event) {
    if (!isPointerLocked || isPaused) return;

    const mouse = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(spheres);
    
    gameStats.totalShots++;

    if (intersects.length > 0) {
        const clickedSphere = intersects[0].object;
        scene.remove(clickedSphere);
        spheres.splice(spheres.indexOf(clickedSphere), 1);
        addNewSphere();
        
        gameStats.hits++;
        gameStats.streak++;
        gameStats.score += calculateScore();
    } else {
        gameStats.streak = 0;
        gameStats.multiplier = 1;
        gameStats.score = Math.max(0, gameStats.score - gameStats.missPenalty);
    }

    updateStats();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupPointerLock() {
    const element = document.body;

    document.addEventListener('click', () => {
        if (!isPointerLocked && !isPaused) {
            element.requestPointerLock();
        }
    });

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mozpointerlockchange', handlePointerLockChange);
}

function setupOptionsMenu() {
    const sizeSlider = document.getElementById('sizeSlider');
    const thicknessSlider = document.getElementById('thicknessSlider');
    const colorPicker = document.getElementById('colorPicker');
    const sizeValue = document.getElementById('sizeValue');
    const thicknessValue = document.getElementById('thicknessValue');

    sizeSlider.value = crosshairConfig.size;
    thicknessSlider.value = crosshairConfig.thickness;
    colorPicker.value = crosshairConfig.color;
    sizeValue.textContent = crosshairConfig.size;
    thicknessValue.textContent = crosshairConfig.thickness;

    sizeSlider.addEventListener('input', () => {
        crosshairConfig.size = parseInt(sizeSlider.value);
        sizeValue.textContent = sizeSlider.value;
        updateCrosshairPreview();
        updateCrosshair();
    });

    thicknessSlider.addEventListener('input', () => {
        crosshairConfig.thickness = parseFloat(thicknessSlider.value);
        thicknessValue.textContent = thicknessSlider.value;
        updateCrosshairPreview();
        updateCrosshair();
    });

    colorPicker.addEventListener('input', () => {
        crosshairConfig.color = colorPicker.value;
        updateCrosshairPreview();
        updateCrosshair();
    });

    document.getElementById('saveOptionsButton').addEventListener('click', () => {
        toggleOptionsMenu();
    });

    document.getElementById('backOptionsButton').addEventListener('click', () => {
        toggleOptionsMenu();
    });
}

function setupEventListeners() {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', onMouseClick);
    window.addEventListener('resize', onWindowResize);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isPointerLocked) {
            event.preventDefault();
            togglePause();
        }
    });

    document.getElementById('resumeButton').addEventListener('click', () => {
        if (isPaused) {
            togglePause();
        }
    });

    document.getElementById('restartButton').addEventListener('click', () => {
        if (isPaused) {
            resetGame();
            togglePause();
        }
    });

    document.getElementById('optionsButton').addEventListener('click', toggleOptionsMenu);

    document.getElementById('quitButton').addEventListener('click', () => {
        if (confirm("Voulez-vous vraiment quitter ?")) {
            window.location.reload();
        }
    });
}

function startTimer() {
    setInterval(() => {
        if (!isPaused && gameStats.timeLeft > 0) {
            gameStats.timeLeft--;
            updateStats();
            
            if (gameStats.timeLeft === 0) {
                togglePause();
                alert(`Game Over!\nScore final: ${gameStats.score}\nPrécision: ${
                    Math.round((gameStats.hits / gameStats.totalShots) * 100)}%`);
            }
        }
    }, 1000);
}

function animate() {
    requestAnimationFrame(animate);
    if (!isPaused) {
        renderer.render(scene, camera);
    }
}

function init() {
    setupPointerLock();
    setupOptionsMenu();
    setupEventListeners();
    updateCrosshair();

    for (let i = 0; i < 3; i++) {
        addNewSphere();
    }

    startTimer();
    animate();
}

init();