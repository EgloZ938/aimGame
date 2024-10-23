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
    size: 5,
    color: '#ffffff',
    thickness: 2,
    gap: 3
};

const defaultConfig = {
    size: 5,
    color: '#ffffff',
    thickness: 2,
    gap: 3
};

const GAME_MULTIPLIERS = {
    VALORANT: {
        yawPerDegree: 0.07,
        pitchPerDegree: 0.07,
        defaultFov: 103,
        fovType: 'vertical'
    },
    CSGO: {
        yawPerDegree: 0.022,
        pitchPerDegree: 0.022,
        defaultFov: 106.26,
        fovType: 'horizontal'
    },
    APEX: {
        yawPerDegree: 0.022,
        pitchPerDegree: 0.022,
        defaultFov: 110,
        fovType: 'horizontal'
    },
    OVERWATCH: {
        yawPerDegree: 0.0066,
        pitchPerDegree: 0.0066,
        defaultFov: 103,
        fovType: 'horizontal'
    },
    FORTNITE: {
        yawPerDegree: 0.05555,
        pitchPerDegree: 0.05555,
        defaultFov: 80,
        fovType: 'horizontal'
    },
    R6: {
        yawPerDegree: 0.00572,
        pitchPerDegree: 0.00572,
        defaultFov: 84,
        fovType: 'vertical'
    },
    COD: {
        yawPerDegree: 0.0555,
        pitchPerDegree: 0.0555,
        defaultFov: 80,
        fovType: 'horizontal'
    },
    BF: {
        yawPerDegree: 0.0555,
        pitchPerDegree: 0.0555,
        defaultFov: 90,
        fovType: 'horizontal'
    },
    QUAKE: {
        yawPerDegree: 0.022,
        pitchPerDegree: 0.022,
        defaultFov: 106,
        fovType: 'horizontal'
    },
    DOOM: {
        yawPerDegree: 0.0439,
        pitchPerDegree: 0.0439,
        defaultFov: 110,
        fovType: 'horizontal'
    },
    DESTINY2: {
        yawPerDegree: 0.0066,
        pitchPerDegree: 0.0066,
        defaultFov: 105,
        fovType: 'horizontal'
    },
    PUBG: {
        yawPerDegree: 0.0066,
        pitchPerDegree: 0.0066,
        defaultFov: 103,
        fovType: 'vertical'
    },
    SPLITGATE: {
        yawPerDegree: 0.0066,
        pitchPerDegree: 0.0066,
        defaultFov: 103,
        fovType: 'horizontal'
    },
    PALADINS: {
        yawPerDegree: 0.0066,
        pitchPerDegree: 0.0066,
        defaultFov: 90,
        fovType: 'horizontal'
    },
    DIABOTICAL: {
        yawPerDegree: 0.022,
        pitchPerDegree: 0.022,
        defaultFov: 106,
        fovType: 'horizontal'
    },
    HALO: {
        yawPerDegree: 0.0066,
        pitchPerDegree: 0.0066,
        defaultFov: 78,
        fovType: 'horizontal'
    },
    WARFRAME: {
        yawPerDegree: 0.0066,
        pitchPerDegree: 0.0066,
        defaultFov: 90,
        fovType: 'horizontal'
    },
    RUST: {
        yawPerDegree: 0.0066,
        pitchPerDegree: 0.0066,
        defaultFov: 90,
        fovType: 'horizontal'
    }
};

const defaultSensitivityConfig = {
    game: 'VALORANT',
    sensitivity: 0.26,
    dpi: 800,
    fov: GAME_MULTIPLIERS['VALORANT'].defaultFov
};

const sensitivityConfig = {
    game: 'VALORANT',
    sensitivity: 0.26,
    dpi: 800,
    fov: GAME_MULTIPLIERS['VALORANT'].defaultFov
};

class SensitivityCalculator {
    constructor() {
        this.currentGame = 'VALORANT';
        this.sensitivity = 0.26;
        this.dpi = 800;
        this.fov = GAME_MULTIPLIERS[this.currentGame].defaultFov;
    }

    calculateCM360() {
        const gameConfig = GAME_MULTIPLIERS[this.currentGame];
        if (!gameConfig) return 0;
        
        const cm360 = (360 * 2.54) / (this.sensitivity * gameConfig.yawPerDegree * this.dpi);
        return cm360;
    }

    calculateThreeJSSensitivity(cm360) {
        const radiansFor360 = Math.PI * 2;
        const countsFor360 = (cm360 / 2.54) * this.dpi;
        const radiansPerCount = radiansFor360 / countsFor360;
        return radiansPerCount;
    }

    convertFovToVertical(fov, aspect) {
        const gameConfig = GAME_MULTIPLIERS[this.currentGame];
        if (gameConfig.fovType === 'vertical') return fov;
        
        return (2 * Math.atan(Math.tan(fov * Math.PI / 360) / aspect) * 180 / Math.PI);
    }

    updateValues(sensitivity, dpi, fov, game = null) {
        this.sensitivity = parseFloat(sensitivity) || this.sensitivity;
        this.dpi = parseFloat(dpi) || this.dpi;
        this.fov = parseFloat(fov) || this.fov;
        if (game) {
            this.currentGame = game;
            this.fov = GAME_MULTIPLIERS[game].defaultFov;
        }
    }
}

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

const spheres = [];
const sphereRadius = 1.5;
const minDistance = 3;
const targetZ = -15; // Distance fixe des cibles
const boundary = {
    x: { min: -10, max: 10 },
    y: { min: -5, max: 5 }
};

function updateCameraPosition() {
    const fovRad = (camera.fov * Math.PI) / 180;
    const targetDistance = Math.abs(targetZ);
    const viewHeight = 2 * Math.tan(fovRad / 2) * targetDistance;
    const desiredHeight = Math.max(Math.abs(boundary.y.min), Math.abs(boundary.y.max)) * 2;
    const requiredZ = (desiredHeight / 2) / Math.tan(fovRad / 2);
    camera.position.z = Math.min(requiredZ, 10);
}

// Initialisation de la position de la caméra
updateCameraPosition();

let isPaused = false;
let isPointerLocked = false;
let mouseSensitivity = 0.002;
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
            .crosshair-h-left {
                width: ${crosshairConfig.size}px;
                height: ${crosshairConfig.thickness}px;
                top: 50%;
                right: ${crosshairConfig.gap}px;
                transform: translateY(-50%);
            }
            .crosshair-h-right {
                width: ${crosshairConfig.size}px;
                height: ${crosshairConfig.thickness}px;
                top: 50%;
                left: ${crosshairConfig.gap}px;
                transform: translateY(-50%);
            }
            .crosshair-v-top {
                width: ${crosshairConfig.thickness}px;
                height: ${crosshairConfig.size}px;
                left: 50%;
                bottom: ${crosshairConfig.gap}px;
                transform: translateX(-50%);
            }
            .crosshair-v-bottom {
                width: ${crosshairConfig.thickness}px;
                height: ${crosshairConfig.size}px;
                left: 50%;
                top: ${crosshairConfig.gap}px;
                transform: translateX(-50%);
            }
        </style>
        <div class="crosshair-h crosshair-h-left"></div>
        <div class="crosshair-h crosshair-h-right"></div>
        <div class="crosshair-v crosshair-v-top"></div>
        <div class="crosshair-v crosshair-v-bottom"></div>
    `;
}

function updateCrosshairPreview() {
    const preview = document.getElementById('crosshairPreview');
    preview.innerHTML = `
        <style>
            .crosshair-h, .crosshair-v {
                position: absolute;
                background-color: ${crosshairConfig.color};
            }
            .crosshair-h-left {
                width: ${crosshairConfig.size}px;
                height: ${crosshairConfig.thickness}px;
                top: 50%;
                right: ${crosshairConfig.gap}px;
                transform: translateY(-50%);
            }
            .crosshair-h-right {
                width: ${crosshairConfig.size}px;
                height: ${crosshairConfig.thickness}px;
                top: 50%;
                left: ${crosshairConfig.gap}px;
                transform: translateY(-50%);
            }
            .crosshair-v-top {
                width: ${crosshairConfig.thickness}px;
                height: ${crosshairConfig.size}px;
                left: 50%;
                bottom: ${crosshairConfig.gap}px;
                transform: translateX(-50%);
            }
            .crosshair-v-bottom {
                width: ${crosshairConfig.thickness}px;
                height: ${crosshairConfig.size}px;
                left: 50%;
                top: ${crosshairConfig.gap}px;
                transform: translateX(-50%);
            }
        </style>
        <div class="crosshair-h crosshair-h-left"></div>
        <div class="crosshair-h crosshair-h-right"></div>
        <div class="crosshair-v crosshair-v-top"></div>
        <div class="crosshair-v crosshair-v-bottom"></div>
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

function isLocked() {
    return document.pointerLockElement || 
           document.mozPointerLockElement || 
           document.webkitPointerLockElement;
}

async function resetGame() {
    // Désactiver les boutons pendant le reset
    disableButton('restartButton');
    disableButton('resumeButton');
    disableButton('optionsButton'); // Désactivons aussi le bouton options pendant la transition

    try {
        if (isPointerLocked) {
            const wasLocked = isLocked();
            
            if (wasLocked) {
                try {
                    await Promise.race([
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000)), // Augmenté à 2s
                        new Promise(resolve => {
                            function checkLock() {
                                if (!isLocked()) {
                                    resolve();
                                } else {
                                    setTimeout(checkLock, 50); // Vérifie plus fréquemment
                                }
                            }
                            
                            if (document.exitPointerLock) {
                                document.exitPointerLock();
                            } else if (document.mozExitPointerLock) {
                                document.mozExitPointerLock();
                            } else if (document.webkitExitPointerLock) {
                                document.webkitExitPointerLock();
                            }
                            
                            checkLock();
                        })
                    ]);
                } catch (error) {
                    console.warn('Timeout lors de la sortie du Pointer Lock, continuation...');
                }
            }
            
            // Augmentons le délai d'attente après la sortie du Pointer Lock
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Reset du jeu...
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
        
        // Attente supplémentaire avant de réactiver les boutons
        await new Promise(resolve => setTimeout(resolve, 500));
        
    } catch (error) {
        console.error('Erreur lors du reset du jeu:', error);
        updateStats();
    } finally {
        // Délai plus long avant de réactiver les boutons
        setTimeout(() => {
            enableButton('restartButton');
            enableButton('resumeButton');
            enableButton('optionsButton');
        }, 1000);
    }
}

function togglePause() {
    disableButton('restartButton');
    disableButton('resumeButton');
    disableButton('optionsButton');

    isPaused = !isPaused;
    const pauseMenu = document.getElementById('pauseMenu');
    const optionsMenu = document.getElementById('optionsMenu');

    if (isPaused) {
        pauseMenu.classList.remove('hidden');
        optionsMenu.classList.add('hidden');
        if (isPointerLocked) {
            try {
                if (document.exitPointerLock) {
                    document.exitPointerLock();
                } else if (document.mozExitPointerLock) {
                    document.mozExitPointerLock();
                } else if (document.webkitExitPointerLock) {
                    document.webkitExitPointerLock();
                }
            } catch (error) {
                console.error('Erreur lors de la sortie du Pointer Lock:', error);
            }
        }
        // Attendre avant de réactiver les boutons
        setTimeout(() => {
            enableButton('restartButton');
            enableButton('resumeButton');
            enableButton('optionsButton');
        }, 1000);
    } else {
        pauseMenu.classList.add('hidden');
        optionsMenu.classList.add('hidden');
        // Attendre avant de demander le Pointer Lock
        setTimeout(() => {
            requestPointerLockWithFallback();
            // Réactiver les boutons après la demande de Pointer Lock
            setTimeout(() => {
                enableButton('restartButton');
                enableButton('resumeButton');
                enableButton('optionsButton');
            }, 1000);
        }, 500);
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
    rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));

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
    updateCameraPosition();
}

function setupOptionsMenu() {
    // Configuration des sliders et inputs du crosshair
    const sliders = {
        size: document.getElementById('sizeSlider'),
        thickness: document.getElementById('thicknessSlider'),
        gap: document.getElementById('gapSlider')
    };
    
    const inputs = {
        size: document.getElementById('sizeInput'),
        thickness: document.getElementById('thicknessInput'),
        gap: document.getElementById('gapInput')
    };
    
    const colorPicker = document.getElementById('colorPicker');

    // Initialisation de la calculatrice de sensibilité
    const sensCalc = new SensitivityCalculator();
    
    // Récupération des éléments de sensibilité
    const gameSelector = document.getElementById('gameSelector');
    const sensitivitySlider = document.getElementById('sensitivitySlider');
    const sensInput = document.getElementById('gameSensitivity');
    const dpiInput = document.getElementById('mouseDPI');
    const fovSlider = document.getElementById('fovSlider');
    const fovInput = document.getElementById('fovInput');
    const cm360Display = document.getElementById('cm360Value');

    function updateValue(key, value, isNumber = true) {
        const min = sliders[key].min;
        const max = sliders[key].max;
        const step = sliders[key].step || 1;
        
        let newValue = isNumber ? parseFloat(value) : value;
        newValue = Math.min(Math.max(newValue, parseFloat(min)), parseFloat(max));
        
        if (step !== 1) {
            newValue = Math.round(newValue / step) * step;
        }
        
        sliders[key].value = newValue;
        inputs[key].value = newValue;
        crosshairConfig[key] = newValue;
        
        updateCrosshairPreview();
        updateCrosshair();
    }

    function updateDisplay() {
        const cm360 = sensCalc.calculateCM360();
        cm360Display.textContent = `${cm360.toFixed(3)} cm/360°`;
        
        // Calculer la sensibilité précise pour Three.js
        mouseSensitivity = sensCalc.calculateThreeJSSensitivity(cm360);
        
        // Convertir le FOV selon le type (horizontal/vertical)
        const verticalFov = sensCalc.convertFovToVertical(
            sensCalc.fov,
            camera.aspect
        );
        
        // Mettre à jour le FOV de la caméra
        camera.fov = verticalFov;
        camera.updateProjectionMatrix();
        
        // Ajuster la position de la caméra en fonction du nouveau FOV
        updateCameraPosition();
    }

    // Gestion des événements pour le crosshair
    Object.keys(sliders).forEach(key => {
        sliders[key].addEventListener('input', (e) => {
            updateValue(key, e.target.value);
        });

        inputs[key].addEventListener('input', (e) => {
            updateValue(key, e.target.value);
        });

        inputs[key].addEventListener('blur', (e) => {
            updateValue(key, e.target.value);
        });

        inputs[key].addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                updateValue(key, e.target.value);
                e.target.blur();
            }
        });
    });

    colorPicker.addEventListener('input', (e) => {
        crosshairConfig.color = e.target.value;
        updateCrosshairPreview();
        updateCrosshair();
    });

    // Gestion du changement de jeu
    gameSelector.addEventListener('change', () => {
        const selectedGame = gameSelector.value;
        sensCalc.updateValues(
            sensInput.value,
            dpiInput.value,
            fovInput.value,
            selectedGame
        );
        
        // Mettre à jour le FOV avec la valeur par défaut du jeu
        const defaultFov = GAME_MULTIPLIERS[selectedGame].defaultFov;
        fovSlider.value = defaultFov;
        fovInput.value = defaultFov;
        
        updateDisplay();
    });

    // Gestion des événements de sensibilité
    sensitivitySlider.addEventListener('input', () => {
        sensInput.value = sensitivitySlider.value;
        sensCalc.updateValues(sensitivitySlider.value, dpiInput.value, fovInput.value);
        updateDisplay();
    });

    sensInput.addEventListener('input', () => {
        sensitivitySlider.value = sensInput.value;
        sensCalc.updateValues(sensInput.value, dpiInput.value, fovInput.value);
        updateDisplay();
    });

    // Gestion des événements de FOV
    fovSlider.addEventListener('input', () => {
        fovInput.value = fovSlider.value;
        sensCalc.updateValues(sensInput.value, dpiInput.value, fovSlider.value);
        updateDisplay();
    });

    fovInput.addEventListener('input', () => {
        fovSlider.value = fovInput.value;
        sensCalc.updateValues(sensInput.value, dpiInput.value, fovInput.value);
        updateDisplay();
    });

    // Gestion du DPI
    dpiInput.addEventListener('input', () => {
        sensCalc.updateValues(sensInput.value, dpiInput.value, fovInput.value);
        updateDisplay();
    });

    // Boutons du menu
    document.getElementById('saveOptionsButton').addEventListener('click', () => {
        Object.keys(crosshairConfig).forEach(key => {
            defaultConfig[key] = crosshairConfig[key];
        });

        defaultSensitivityConfig.game = sensitivityConfig.game;
        defaultSensitivityConfig.sensitivity = sensitivityConfig.sensitivity;
        defaultSensitivityConfig.dpi = sensitivityConfig.dpi;
        defaultSensitivityConfig.fov = sensitivityConfig.fov;
    
        toggleOptionsMenu();
    });
    
    document.getElementById('backOptionsButton').addEventListener('click', () => {
        Object.keys(defaultConfig).forEach(key => {
            if (key !== 'color') {
                sliders[key].value = defaultConfig[key];
                inputs[key].value = defaultConfig[key];
                crosshairConfig[key] = defaultConfig[key];
            } else {
                colorPicker.value = defaultConfig[key];
                crosshairConfig[key] = defaultConfig[key];
            }
        });
        
        gameSelector.value = defaultSensitivityConfig.game;
        sensitivitySlider.value = defaultSensitivityConfig.sensitivity;
        sensInput.value = defaultSensitivityConfig.sensitivity;
        dpiInput.value = defaultSensitivityConfig.dpi;
        fovSlider.value = defaultSensitivityConfig.fov;
        fovInput.value = defaultSensitivityConfig.fov;
        
        sensitivityConfig.game = defaultSensitivityConfig.game;
        sensitivityConfig.sensitivity = defaultSensitivityConfig.sensitivity;
        sensitivityConfig.dpi = defaultSensitivityConfig.dpi;
        sensitivityConfig.fov = defaultSensitivityConfig.fov;
        
        updateCrosshairPreview();
        updateCrosshair();
        updateDisplay();
        toggleOptionsMenu();
    });

    // Initialisation
    Object.keys(sliders).forEach(key => {
        updateValue(key, crosshairConfig[key]);
    });
    colorPicker.value = crosshairConfig.color;
    updateDisplay();
}

function setupPointerLock() {

    function checkPointerLockSupport() {
        return 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;
    }

    const element = document.body;
    let pointerLockTimeout;

    const havePointerLock = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;

    if (!havePointerLock) {
        alert('Votre navigateur ne supporte pas le Pointer Lock API. Le jeu pourrait ne pas fonctionner correctement.');
        return;
    }

    // Définition de requestPointerLockWithFallback dans la portée globale
    window.requestPointerLockWithFallback = function() {
        try {
            // Vérifiez si le document est visible
            if (document.hidden) {
                return;
            }
    
            // Ajoutez une vérification des permissions pour Chrome
            if ('permissions' in navigator) {
                navigator.permissions.query({ name: 'pointerLock' })
                    .then(permissionStatus => {
                        if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
                            requestPointerLockWithVendorPrefixes();
                        }
                    })
                    .catch(() => {
                        // Si la requête de permission échoue, essayez quand même
                        requestPointerLockWithVendorPrefixes();
                    });
            } else {
                requestPointerLockWithVendorPrefixes();
            }
        } catch (error) {
            console.error('Erreur lors de la demande de Pointer Lock:', error);
            retryPointerLock();
        }
    };

    function requestPointerLockWithVendorPrefixes() {
        if (document.pointerLockElement || 
            document.mozPointerLockElement || 
            document.webkitPointerLockElement) {
            // Déjà verrouillé
            return;
        }

        const element = document.body;
        try {
            if (element.requestPointerLock) {
                element.requestPointerLock();
            } else if (element.mozRequestPointerLock) {
                element.mozRequestPointerLock();
            } else if (element.webkitRequestPointerLock) {
                element.webkitRequestPointerLock();
            }
        } catch (error) {
            console.error('Erreur lors de la demande de Pointer Lock:', error);
            retryPointerLock();
        }
    }

    function retryPointerLock() {
        clearTimeout(pointerLockTimeout);
        pointerLockTimeout = setTimeout(() => {
            if (!isPointerLocked && !isPaused && !document.hidden) {
                requestPointerLockWithFallback();
            }
        }, 100);
    }

    function handlePointerLockChange() {
        const lockElement = document.pointerLockElement ||
            document.mozPointerLockElement ||
            document.webkitPointerLockElement;
    
        const wasLocked = isPointerLocked;
        isPointerLocked = lockElement === element;
    
        // Gestion spéciale pour Chrome/Safari qui peuvent perdre le lock lors du changement d'onglet
        if (wasLocked && !isPointerLocked) {
            if (document.hidden) {
                // Le document n'est plus visible (changement d'onglet)
                document.addEventListener('visibilitychange', function onVisibilityChange() {
                    if (!document.hidden && !isPaused) {
                        requestPointerLockWithFallback();
                    }
                    document.removeEventListener('visibilitychange', onVisibilityChange);
                });
            } else if (!isPaused) {
                clearTimeout(pointerLockTimeout);
                togglePause();
            }
        }
    }

    function handlePointerLockError(e) {
        console.error('Erreur Pointer Lock:', e);
        isPointerLocked = false;
        
        if (!isPaused) {
            togglePause();
        }
        
        if (!(e instanceof SecurityError)) {
            let retryCount = 0;
            const maxRetries = 3;
            
            function attemptRetry() {
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(() => {
                        if (!isPointerLocked && !isPaused && !document.hidden) {
                            console.log(`Tentative de récupération ${retryCount}/${maxRetries}`);
                            retryPointerLock();
                        }
                    }, 1000 * retryCount); // Délai croissant entre les tentatives
                }
            }
            
            attemptRetry();
        }
    }

    // Écouteurs d'événements
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mozpointerlockchange', handlePointerLockChange);
    document.addEventListener('webkitpointerlockchange', handlePointerLockChange);
    
    document.addEventListener('pointerlockerror', handlePointerLockError);
    document.addEventListener('mozpointerlockerror', handlePointerLockError);
    document.addEventListener('webkitpointerlockerror', handlePointerLockError);

    // Click handler
    document.addEventListener('click', () => {
        if (!isPointerLocked && !isPaused) {
            requestPointerLockWithFallback();
        }
    });

    window.addEventListener('beforeunload', () => {
        if (isPointerLocked) {
            document.exitPointerLock();
        }
    });

    if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'pointerLock' })
            .then(permissionStatus => {
                permissionStatus.onchange = () => {
                    if (permissionStatus.state === 'denied') {
                        console.warn('Permission Pointer Lock refusée');
                        isPointerLocked = false;
                        if (!isPaused) {
                            togglePause();
                        }
                    }
                };
            })
            .catch(error => {
                console.warn('Erreur lors de la vérification des permissions:', error);
            });
    }
}

function addExtraEventListeners() {
    // Gestion de la perte de focus
    window.addEventListener('blur', () => {
        if (isPointerLocked && !isPaused) {
            togglePause();
        }
    });

    // Gestion du changement de visibilité
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && isPointerLocked && !isPaused) {
            togglePause();
        }
    });

    // Gestion de la sortie de la fenêtre
    document.addEventListener('mouseleave', () => {
        if (isPointerLocked && !isPaused) {
            togglePause();
        }
    });

    // Gestion du redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
        if (isPointerLocked && !isPaused) {
            // Petit délai pour laisser la fenêtre se stabiliser
            setTimeout(() => {
                if (!document.hidden) {
                    requestPointerLockWithFallback();
                }
            }, 100);
        }
    });

    // Gestion des erreurs de contexte
    window.addEventListener('error', (e) => {
        console.error('Erreur globale:', e);
        if (isPointerLocked && !isPaused) {
            togglePause();
        }
    });

    // Gestion de la perte de connexion
    window.addEventListener('offline', () => {
        if (isPointerLocked && !isPaused) {
            togglePause();
        }
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
        if (isPaused && !document.getElementById('resumeButton').classList.contains('disabled')) {
            togglePause();
        }
    });

    document.getElementById('restartButton').addEventListener('click', async () => {
        if (isPaused && !document.getElementById('restartButton').classList.contains('disabled')) {
            await resetGame();
            await new Promise(resolve => setTimeout(resolve, 100));
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
                alert(`Game Over!\nScore final: ${gameStats.score}\nPrécision: ${Math.round((gameStats.hits / gameStats.totalShots) * 100)}%`);
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

function checkDeviceSupport() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        alert('Ce jeu nécessite une souris et un clavier pour fonctionner correctement.');
        return false;
    }
    return true;
}

function disableButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        const originalText = button.textContent;
        
        button.classList.add('disabled');
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        
        let dots = 0;
        const loadingInterval = setInterval(() => {
            if (!button.classList.contains('disabled')) {
                clearInterval(loadingInterval);
                button.textContent = originalText;
                return;
            }
            
            dots = (dots + 1) % 4;
            button.textContent = originalText + '.'.repeat(dots);
        }, 400); // Ralenti à 400ms
        
        // Animation plus longue
        setTimeout(() => {
            clearInterval(loadingInterval);
            if (button.classList.contains('disabled')) {
                button.textContent = originalText;
            }
        }, 2000); // Augmenté à 2s
    }
}

function enableButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.classList.remove('disabled');
        button.style.pointerEvents = 'auto';
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

function init() {
    setupPointerLock();
    setupOptionsMenu();
    setupEventListeners();
    addExtraEventListeners();
    updateCrosshair();
    if (!checkDeviceSupport()) return;

    for (let i = 0; i < 3; i++) {
        addNewSphere();
    }

    startTimer();
    animate();
}

init();