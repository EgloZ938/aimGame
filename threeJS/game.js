import * as THREE from 'three';

const gameStats = {
    hits: 0,
    totalShots: 0,
    score: 0,
    timeLeft: 60,
    accuracy: 0,
    bestStreak: 0,
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

const REFERENCE_SETTINGS = {
    dpi: 800,
    distance: 50, // Distance moyenne de l'écran en cm
    monitorScale: 1.0, // Facteur d'échelle du moniteur
    referenceGame: 'CSGO', // Jeu de référence pour la normalisation
    // Facteurs de correction spécifiques par jeu (basés sur des tests empiriques)
    correctionFactors: {
        VALORANT: 1.0,
        CSGO: 1.0,
        APEX: 0.95,
        OVERWATCH: 0.92,
        FORTNITE: 0.98,
        R6: 1.0,
        COD: 0.97,
        BF: 0.96,
        QUAKE: 1.0,
        DOOM: 0.94,
        DESTINY2: 0.93,
        PUBG: 0.96,
        SPLITGATE: 0.95,
        PALADINS: 0.94,
        DIABOTICAL: 1.0,
        HALO: 0.92,
        WARFRAME: 0.93,
        RUST: 0.95
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
        const gameConfig = GAME_MULTIPLIERS[this.currentGame];
        if (!gameConfig) return 0;

        if (cm360 <= 0 || this.dpi <= 0) {
            console.warn('Invalid cm360 or DPI value');
            return 0;
        }

        // 1. Conversion de cm/360 en counts/360
        const countsFor360 = (cm360 / 2.54) * this.dpi;

        // 2. Conversion basique en radians par pixel
        const radiansFor360 = Math.PI * 2;
        let radiansPerCount = radiansFor360 / countsFor360;

        // 3. Compensation FOV uniquement si nécessaire
        let fovCompensation = 1.0;
        const aspectRatio = window.innerWidth / window.innerHeight;

        if (gameConfig.fovType === 'horizontal') {
            const verticalFov = this.convertFovToVertical(this.fov, aspectRatio);
            const defaultVerticalFov = this.convertFovToVertical(gameConfig.defaultFov, aspectRatio);

            // Compensation FOV simplifiée
            fovCompensation = Math.tan((this.fov * Math.PI / 360)) /
                Math.tan((gameConfig.defaultFov * Math.PI / 360));
        }

        // 4. Facteur de correction pour le jeu
        const gameCorrection = REFERENCE_SETTINGS.correctionFactors[this.currentGame];

        // Calcul final simplifié
        return radiansPerCount * fovCompensation * gameCorrection;
    }

    convertFovToVertical(horizontalFov, aspectRatio) {
        const horizontalRadians = (horizontalFov * Math.PI) / 180;
        const verticalRadians = 2 * Math.atan(Math.tan(horizontalRadians / 2) / aspectRatio);
        return (verticalRadians * 180) / Math.PI;
    }

    updateValues(sensitivity, dpi, fov, game = null) {
        this.sensitivity = parseFloat(sensitivity) || this.sensitivity;
        this.dpi = parseFloat(dpi) || this.dpi;

        if (game) {
            this.currentGame = game;
            // N'utiliser le FOV par défaut que si aucun FOV personnalisé n'est défini
            if (!fov) {
                this.fov = GAME_MULTIPLIERS[game].defaultFov;
            }
        }

        if (fov) {
            this.fov = parseFloat(fov);
        }
    }
}

let globalSensCalc = new SensitivityCalculator();

function testSensitivityAccuracy() {
    // Configuration initiale (exemple avec Valorant)
    const sensCalc = new SensitivityCalculator();
    sensCalc.updateValues(0.26, 800, 103, 'VALORANT');

    // Calculer cm/360
    const cm360 = sensCalc.calculateCM360();
    console.log(`cm/360: ${cm360}`);

    // Test physique : déplacer la souris de X pixels et vérifier l'angle
    let totalRotation = 0;
    const pixelsFor360 = (cm360 / 2.54) * sensCalc.dpi;
    console.log(`Pixels nécessaires pour un 360: ${pixelsFor360}`);

    // Simuler un mouvement de souris
    const mouseMovement = 100; // pixels
    const expectedRotation = (mouseMovement / pixelsFor360) * 360;
    const actualRotation = (mouseMovement * sensCalc.calculateThreeJSSensitivity(cm360)) * (180 / Math.PI);

    console.log(`Rotation attendue: ${expectedRotation}°`);
    console.log(`Rotation actuelle: ${actualRotation}°`);
    console.log(`Différence: ${Math.abs(expectedRotation - actualRotation)}°`);
}

class SensitivityProfile {
    constructor() {
        this.profiles = this.loadProfiles();
        this.favoriteProfile = localStorage.getItem('favoriteProfile');
    }

    saveProfile(name, config) {
        const profile = {
            name,
            // Paramètres de sensibilité
            game: config.game,
            sensitivity: config.sensitivity,
            dpi: config.dpi,
            fov: config.fov,
            monitorDistance: REFERENCE_SETTINGS.distance,
            // Paramètres du crosshair
            crosshair: {
                size: crosshairConfig.size,
                color: crosshairConfig.color,
                thickness: crosshairConfig.thickness,
                gap: crosshairConfig.gap
            },
            isFavorite: false,
            timestamp: Date.now()
        };

        this.profiles[name] = profile;
        this.saveToLocalStorage();
        return profile;
    }

    loadProfile(name) {
        const profile = this.profiles[name];
        if (!profile) return null;

        // Charger les paramètres de distance
        REFERENCE_SETTINGS.distance = profile.monitorDistance || 50;

        // Charger les paramètres du crosshair
        if (profile.crosshair) {
            Object.assign(crosshairConfig, profile.crosshair);
            // Mettre à jour l'interface du crosshair
            const colorPicker = document.getElementById('colorPicker');
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

            // Mettre à jour tous les contrôles
            if (colorPicker) colorPicker.value = profile.crosshair.color;
            Object.keys(sliders).forEach(key => {
                if (sliders[key]) sliders[key].value = profile.crosshair[key];
                if (inputs[key]) inputs[key].value = profile.crosshair[key];
            });
        }

        // Mise à jour des valeurs d'entrée et des sliders
        const sensitivitySlider = document.getElementById('sensitivitySlider');
        const fovSlider = document.getElementById('fovSlider');
        const sensitivityInput = document.getElementById('gameSensitivity');
        const fovInput = document.getElementById('fovInput');

        if (sensitivitySlider && sensitivityInput) {
            sensitivitySlider.value = profile.sensitivity;
            sensitivityInput.value = profile.sensitivity;
        }

        if (fovSlider && fovInput) {
            fovSlider.value = profile.fov;
            fovInput.value = profile.fov;
        }

        // Mise à jour de la configuration de sensibilité
        tempSensitivityConfig = {
            game: profile.game,
            sensitivity: profile.sensitivity,
            dpi: profile.dpi,
            fov: profile.fov
        };

        // Mise à jour des valeurs par défaut
        defaultSensitivityConfig.game = profile.game;
        defaultSensitivityConfig.sensitivity = profile.sensitivity;
        defaultSensitivityConfig.dpi = profile.dpi;
        defaultSensitivityConfig.fov = profile.fov;

        // Mise à jour du calculator
        globalSensCalc.updateValues(
            profile.sensitivity,
            profile.dpi,
            profile.fov,
            profile.game
        );

        // Mise à jour de la sensibilité effective du jeu
        const cm360 = globalSensCalc.calculateCM360();
        mouseSensitivity = globalSensCalc.calculateThreeJSSensitivity(cm360);

        updateCrosshair();
        updateCrosshairPreview();
        return profile;
    }

    exportProfile(name) {
        const profile = this.profiles[name];
        if (!profile) return null;

        return btoa(JSON.stringify(profile));
    }

    importProfile(encodedProfile) {
        try {
            const profile = JSON.parse(atob(encodedProfile));
            if (!profile.name || !profile.game) {
                throw new Error('Invalid profile format');
            }

            this.profiles[profile.name] = profile;
            this.saveToLocalStorage();
            return profile;
        } catch (error) {
            console.error('Error importing profile:', error);
            return null;
        }
    }

    loadProfiles() {
        try {
            const saved = localStorage.getItem('sensitivityProfiles');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading profiles:', error);
            return {};
        }
    }

    setFavorite(name) {
        if (!this.profiles[name]) return false;

        // Retire le statut favori de tous les profils
        Object.keys(this.profiles).forEach(profileName => {
            this.profiles[profileName].isFavorite = false;
        });

        // Définit le nouveau favori
        this.profiles[name].isFavorite = true;
        this.favoriteProfile = name;

        // Sauvegarde dans le localStorage
        localStorage.setItem('favoriteProfile', name);
        this.saveToLocalStorage();
        return true;
    }

    loadFavoriteProfile() {
        if (this.favoriteProfile && this.profiles[this.favoriteProfile]) {
            return this.loadProfile(this.favoriteProfile);
        }
        return null;
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('sensitivityProfiles', JSON.stringify(this.profiles));
        } catch (error) {
            console.error('Error saving profiles:', error);
        }
    }

    validateProfile(profile) {
        // Validation des champs de sensibilité
        const requiredFields = ['name', 'game', 'sensitivity', 'dpi', 'fov'];
        const isValid = requiredFields.every(field => {
            if (field === 'name') return typeof profile[field] === 'string' && profile[field].length > 0;
            if (field === 'game') return profile[field] in GAME_MULTIPLIERS;
            return typeof profile[field] === 'number' && !isNaN(profile[field]);
        });

        if (!isValid) throw new Error('Invalid profile format');

        // Validation des champs du crosshair
        if (profile.crosshair) {
            const requiredCrosshairFields = ['size', 'color', 'thickness', 'gap'];
            const isCrosshairValid = requiredCrosshairFields.every(field => {
                if (field === 'color') return typeof profile.crosshair[field] === 'string';
                return typeof profile.crosshair[field] === 'number' && !isNaN(profile.crosshair[field]);
            });
            if (!isCrosshairValid) throw new Error('Invalid crosshair format');
        }

        return true;
    }

    deleteProfile(name) {
        if (this.profiles[name]) {
            delete this.profiles[name];
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    sanitizeProfileName(name) {
        return name.trim().replace(/[^a-zA-Z0-9-_ ]/g, '');
    }
}

class GameHistory {
    constructor() {
        this.loadHistory();
    }

    loadHistory() {
        this.history = JSON.parse(localStorage.getItem('gameHistory')) || [];
        this.highScore = this.history.length > 0
            ? Math.max(...this.history.map(game => game.score))
            : 0;
    }

    saveGame(gameStats) {
        const gameResult = {
            timestamp: Date.now(),
            score: gameStats.score,
            accuracy: Math.round((gameStats.hits / gameStats.totalShots) * 100),
            hits: gameStats.hits,
            totalShots: gameStats.totalShots,
            streak: gameStats.bestStreak
        };

        this.history.push(gameResult);
        // Garder seulement les 10 dernières parties
        if (this.history.length > 10) {
            this.history = this.history.slice(-10);
        }

        this.highScore = Math.max(this.highScore, gameResult.score);
        localStorage.setItem('gameHistory', JSON.stringify(this.history));
    }
}

// Création de l'instance du gestionnaire d'historique
const gameHistory = new GameHistory();

function showGameOverModal(stats) {
    // Sauvegarder le résultat
    gameHistory.saveGame(stats);

    // Mettre à jour les statistiques dans le modal
    document.getElementById('finalScore').textContent = stats.score;
    document.getElementById('highScore').textContent = gameHistory.highScore;
    document.getElementById('finalAccuracy').textContent = `${Math.round((stats.hits / stats.totalShots) * 100)}%`;
    document.getElementById('finalHits').textContent = stats.hits;
    document.getElementById('finalShots').textContent = stats.totalShots;
    document.getElementById('finalStreak').textContent = stats.bestStreak;

    if (document.exitPointerLock) {
        document.exitPointerLock();
    } else if (document.mozExitPointerLock) {
        document.mozExitPointerLock();
    } else if (document.webkitExitPointerLock) {
        document.webkitExitPointerLock();
    }

    // Créer le graphique
    createPerformanceChart();

    // S'assurer que le modal est caché au début
    const modal = document.getElementById('gameOverModal');
    modal.classList.remove('hidden');

    // Configuration des boutons
    document.getElementById('restartGameButton').onclick = async () => {
        modal.classList.add('hidden');
        await resetGame();
        isPaused = false;  // S'assurer que le jeu n'est plus en pause
        // Ne pas appeler togglePause() ici car nous voulons juste démarrer le jeu
    };

    document.getElementById('quitGameButton').onclick = () => {
        window.location.href = './';
    };
}

function createPerformanceChart() {
    const chartContainer = document.getElementById('scoreChart');
    chartContainer.innerHTML = ''; // Nettoyer le conteneur

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    chartContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    const data = gameHistory.history.map((game, index) => ({
        x: `Game ${index + 1}`,
        score: game.score,
        accuracy: game.accuracy
    }));

    const chartData = {
        labels: data.map(d => d.x),
        datasets: [
            {
                label: 'Score',
                data: data.map(d => d.score),
                borderColor: '#4488ff',
                backgroundColor: 'rgba(68, 136, 255, 0.1)',
                tension: 0.3,
                fill: true
            }
        ]
    };

    const chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false  // Cache la légende
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const gameIndex = context.dataIndex;
                            const game = data[gameIndex];
                            return [
                                `Score: ${game.score}`,
                                `Accuracy: ${game.accuracy}%`
                            ];
                        }
                    },
                    backgroundColor: '#1a1a3a',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            }
        }
    });
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
const minDistance = 3.5;
const targetZ = -17.5; // Distance fixe des cibles
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


let tempSensitivityConfig = {
    game: defaultSensitivityConfig.game,
    sensitivity: defaultSensitivityConfig.sensitivity,
    dpi: defaultSensitivityConfig.dpi,
    fov: defaultSensitivityConfig.fov
};

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

function addProfileInterface() {
    const profileManager = new SensitivityProfile();

    // Récupération des éléments existants
    const profileName = document.getElementById('profileName');
    const profileList = document.getElementById('profileList');
    const saveProfileBtn = document.getElementById('saveProfile');
    const loadProfileBtn = document.getElementById('loadProfile');
    const exportProfileBtn = document.getElementById('exportProfile');
    const importProfileBtn = document.getElementById('importProfile');
    const deleteProfileBtn = document.getElementById('deleteProfile');
    const setFavoriteBtn = document.getElementById('setFavoriteProfile');

    function updateProfileList() {
        const profileList = document.getElementById('profileList');
        profileList.innerHTML = '';

        Object.keys(profileManager.profiles).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            if (profileManager.profiles[name].isFavorite) {
                option.textContent += ' ★';
            }
            profileList.appendChild(option);
        });
    }

    // Gestionnaire pour la sauvegarde
    saveProfileBtn.addEventListener('click', () => {
        const name = profileManager.sanitizeProfileName(profileName.value);

        if (!name) {
            alert('Please enter a valid profile name');
            return;
        }

        const config = {
            game: document.getElementById('gameSelector').value,
            sensitivity: parseFloat(document.getElementById('gameSensitivity').value),
            dpi: parseInt(document.getElementById('mouseDPI').value),
            fov: parseInt(document.getElementById('fovInput').value)
        };

        try {
            profileManager.validateProfile({ name, ...config });
            profileManager.saveProfile(name, config);
            updateProfileList();
            profileName.value = '';
        } catch (error) {
            alert('Invalid profile data. Please check your inputs.');
        }
    });

    // Gestionnaire pour le chargement
    loadProfileBtn.addEventListener('click', () => {
        const name = profileList.value;
        const profile = profileManager.loadProfile(name);
        if (!profile) return;

        document.getElementById('gameSelector').value = profile.game;
        document.getElementById('gameSensitivity').value = profile.sensitivity;
        document.getElementById('mouseDPI').value = profile.dpi;
        document.getElementById('fovInput').value = profile.fov;

        updateDisplay();
        updateCrosshair();
    });

    // Gestionnaire pour l'exportation
    exportProfileBtn.addEventListener('click', () => {
        const name = profileList.value;
        const encoded = profileManager.exportProfile(name);
        if (encoded) {
            navigator.clipboard.writeText(encoded)
                .then(() => alert('Profile code copied to clipboard!'))
                .catch(err => console.error('Error copying to clipboard:', err));
        }
    });

    // Gestionnaire pour l'importation
    importProfileBtn.addEventListener('click', () => {
        const code = prompt('Enter profile code:');
        if (code) {
            try {
                const profile = profileManager.importProfile(code);
                if (profile) {
                    updateProfileList();
                    alert('Profile imported successfully!');
                } else {
                    throw new Error('Invalid profile data');
                }
            } catch (error) {
                alert('Failed to import profile. Invalid or corrupted data.');
            }
        }
    });

    // Gestionnaire pour la suppression
    deleteProfileBtn.addEventListener('click', () => {
        const name = profileList.value;
        if (name && confirm(`Are you sure you want to delete profile "${name}"?`)) {
            if (profileManager.deleteProfile(name)) {
                updateProfileList();
                profileName.value = '';
            }
        }
    });

    // Gestionnaire pour le bouton "Set as Favorite"
    setFavoriteBtn.addEventListener('click', () => {
        const selectedProfile = profileList.value;
        if (selectedProfile) {
            profileManager.setFavorite(selectedProfile);
            updateProfileList(); // Met à jour la liste pour afficher l'étoile
        }
    });

    // Chargement initial de la liste des profils
    updateProfileList();
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
    // Création de la géométrie avec subdivision suffisante pour une hitbox précise
    const geometry = new THREE.SphereGeometry(
        sphereRadius,  // rayon
        32,           // segments horizontaux
        32,           // segments verticaux
        0,            // phi start
        Math.PI * 2,  // phi length
        0,            // theta start
        Math.PI       // theta length (important pour la couverture complète)
    );

    const material = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        shininess: 60,
        specular: 0x444444,
        // Assure que le matériau n'interfère pas avec le raycasting
        transparent: false,
        opacity: 1
    });

    const sphere = new THREE.Mesh(geometry, material);

    // Ajout d'une propriété pour la détection de collision
    sphere.userData.isTarget = true;

    return sphere;
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
    document.getElementById('gameOverModal').classList.add('hidden');
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
        gameStats.bestStreak = 0;
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

    // Récupérer les mouvements avec support multi-navigateur
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    // Calculer le facteur de correction DPI (par rapport à la base de 800 DPI)
    const dpiScaling = globalSensCalc.dpi / 800;

    // Appliquer la sensibilité avec une précision accrue, en tenant compte du DPI
    rotationY -= movementX * mouseSensitivity * dpiScaling;
    rotationX -= movementY * mouseSensitivity * dpiScaling;

    // Limiter la rotation verticale à 90 degrés
    rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));

    // Assurer une rotation fluide
    camera.rotation.order = 'YXZ';
    camera.rotation.x = rotationX;
    camera.rotation.y = rotationY;
}

function calibrateSensitivity() {
    const testDistance = 20; // cm
    let startX = 0;
    let calibrationActive = false;

    window.addEventListener('mousedown', () => {
        if (calibrationActive) {
            startX = event.screenX;
        }
    });

    window.addEventListener('mouseup', () => {
        if (calibrationActive) {
            const deltaX = Math.abs(event.screenX - startX);
            const dpi = (deltaX * 2.54) / testDistance;
            // Mettre à jour le DPI et recalculer la sensibilité
        }
    });
}

function addScalingOption() {
    const scalingSlider = document.createElement('input');
    scalingSlider.type = 'range';
    scalingSlider.min = '0.1';
    scalingSlider.max = '2.0';
    scalingSlider.step = '0.1';
    scalingSlider.value = '1.0';

    scalingSlider.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value);
        mouseSensitivity *= scale;
    });
}

const precisionTest = {
    targetAngle: 180, // degrés
    startRotation: 0,
    tolerance: 5, // degrés

    start() {
        this.startRotation = camera.rotation.y;
    },

    check() {
        const currentRotation = (camera.rotation.y - this.startRotation) * (180 / Math.PI);
        const difference = Math.abs(currentRotation - this.targetAngle);
        return difference <= this.tolerance;
    }
};

function addMonitorDistanceOption() {
    // Ajouter un slider dans le menu options
    const distanceSlider = document.createElement('input');
    distanceSlider.type = 'range';
    distanceSlider.min = '30';
    distanceSlider.max = '70';
    distanceSlider.value = '50';
    distanceSlider.step = '1';

    distanceSlider.addEventListener('input', (e) => {
        monitorDistance = parseInt(e.target.value);
        updateDisplay(); // Recalculer la sensibilité
    });
}

function onMouseClick(event) {
    if (!isPointerLocked || isPaused) return;

    // Création d'un vecteur normalisé pour le raycaster
    const mouse = new THREE.Vector2(0, 0);  // Centre de l'écran
    const raycaster = new THREE.Raycaster();

    // Configuration précise du raycaster
    raycaster.near = 0.1;
    raycaster.far = 1000;
    raycaster.params.Points.threshold = 0.1;

    // Mise à jour du raycaster avec la position de la caméra
    raycaster.setFromCamera(mouse, camera);

    // Détection des intersections avec toutes les sphères
    const intersects = raycaster.intersectObjects(spheres, false);

    gameStats.totalShots++;

    // Vérification des collisions
    if (intersects.length > 0 && intersects[0].object.userData.isTarget) {
        const clickedSphere = intersects[0].object;
        scene.remove(clickedSphere);
        spheres.splice(spheres.indexOf(clickedSphere), 1);
        addNewSphere();

        gameStats.hits++;
        gameStats.streak++;
        gameStats.bestStreak = Math.max(gameStats.bestStreak, gameStats.streak);
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
    const sensCalc = globalSensCalc;

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
        tempSensitivityConfig.game = selectedGame;

        // Mettre à jour le FOV avec la valeur par défaut du jeu seulement dans la preview
        const defaultFov = GAME_MULTIPLIERS[selectedGame].defaultFov;
        fovSlider.value = defaultFov;
        fovInput.value = defaultFov;
        tempSensitivityConfig.fov = defaultFov;

        // Mise à jour temporaire pour la preview
        sensCalc.updateValues(
            tempSensitivityConfig.sensitivity,
            tempSensitivityConfig.dpi,
            tempSensitivityConfig.fov,
            tempSensitivityConfig.game
        );

        updateDisplay();
    });

    // Gestion des événements de sensibilité
    sensitivitySlider.addEventListener('input', () => {
        sensInput.value = sensitivitySlider.value;
        tempSensitivityConfig.sensitivity = parseFloat(sensitivitySlider.value);

        // Mise à jour temporaire pour la preview
        sensCalc.updateValues(
            tempSensitivityConfig.sensitivity,
            tempSensitivityConfig.dpi,
            tempSensitivityConfig.fov,
            tempSensitivityConfig.game
        );
        updateDisplay();
    });

    sensInput.addEventListener('input', () => {
        sensitivitySlider.value = sensInput.value;
        tempSensitivityConfig.sensitivity = parseFloat(sensInput.value);

        // Mise à jour temporaire pour la preview
        sensCalc.updateValues(
            tempSensitivityConfig.sensitivity,
            tempSensitivityConfig.dpi,
            tempSensitivityConfig.fov,
            tempSensitivityConfig.game
        );
        updateDisplay();
    });

    // Gestion des événements de FOV
    fovSlider.addEventListener('input', () => {
        fovInput.value = fovSlider.value;
        tempSensitivityConfig.fov = parseFloat(fovSlider.value);

        // Mise à jour temporaire pour la preview
        sensCalc.updateValues(
            tempSensitivityConfig.sensitivity,
            tempSensitivityConfig.dpi,
            tempSensitivityConfig.fov,
            tempSensitivityConfig.game
        );
        updateDisplay();
    });

    fovInput.addEventListener('input', () => {
        fovSlider.value = fovInput.value;
        tempSensitivityConfig.fov = parseFloat(fovInput.value);

        // Mise à jour temporaire pour la preview
        sensCalc.updateValues(
            tempSensitivityConfig.sensitivity,
            tempSensitivityConfig.dpi,
            tempSensitivityConfig.fov,
            tempSensitivityConfig.game
        );
        updateDisplay();
    });

    // Gestion du DPI
    dpiInput.addEventListener('input', () => {
        tempSensitivityConfig.dpi = parseFloat(dpiInput.value);

        // Mise à jour temporaire pour la preview
        sensCalc.updateValues(
            tempSensitivityConfig.sensitivity,
            tempSensitivityConfig.dpi,
            tempSensitivityConfig.fov,
            tempSensitivityConfig.game
        );
        updateDisplay();
    });

    // Boutons du menu
    document.getElementById('saveOptionsButton').addEventListener('click', () => {
        // Sauvegarder les paramètres du crosshair
        Object.keys(crosshairConfig).forEach(key => {
            defaultConfig[key] = crosshairConfig[key];
        });

        // Sauvegarder les paramètres de sensibilité
        defaultSensitivityConfig.game = tempSensitivityConfig.game;
        defaultSensitivityConfig.sensitivity = tempSensitivityConfig.sensitivity;
        defaultSensitivityConfig.dpi = tempSensitivityConfig.dpi;
        defaultSensitivityConfig.fov = tempSensitivityConfig.fov;

        // Appliquer les changements définitivement
        sensCalc.updateValues(
            tempSensitivityConfig.sensitivity,
            tempSensitivityConfig.dpi,
            tempSensitivityConfig.fov,
            tempSensitivityConfig.game
        );

        toggleOptionsMenu();
    });

    document.getElementById('backOptionsButton').addEventListener('click', () => {
        // Restaurer les paramètres du crosshair
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

        // Restaurer les paramètres de sensibilité temporaires
        tempSensitivityConfig = {
            game: defaultSensitivityConfig.game,
            sensitivity: defaultSensitivityConfig.sensitivity,
            dpi: defaultSensitivityConfig.dpi,
            fov: defaultSensitivityConfig.fov
        };

        // Restaurer les valeurs d'affichage
        gameSelector.value = defaultSensitivityConfig.game;
        sensitivitySlider.value = defaultSensitivityConfig.sensitivity;
        sensInput.value = defaultSensitivityConfig.sensitivity;
        dpiInput.value = defaultSensitivityConfig.dpi;
        fovSlider.value = defaultSensitivityConfig.fov;
        fovInput.value = defaultSensitivityConfig.fov;

        // Restaurer les valeurs réelles
        sensCalc.updateValues(
            defaultSensitivityConfig.sensitivity,
            defaultSensitivityConfig.dpi,
            defaultSensitivityConfig.fov,
            defaultSensitivityConfig.game
        );

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
    window.requestPointerLockWithFallback = function () {
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
            window.location.href = './';
        }
    });
}

function startTimer() {
    setInterval(() => {
        if (!isPaused && gameStats.timeLeft > 0) {
            gameStats.timeLeft--;
            updateStats();

            if (gameStats.timeLeft === 0) {
                isPaused = true;
                showGameOverModal(gameStats);
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

        // Désactivation du bouton
        button.classList.add('disabled');
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';

        // Sécurité pour s'assurer que le texte reste intact
        setTimeout(() => {
            if (button.classList.contains('disabled')) {
                button.textContent = originalText;
            }
        }, 2000);
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

    const profileManager = new SensitivityProfile();

    const favoriteProfile = profileManager.loadFavoriteProfile();
    if (favoriteProfile) {
        profileManager.loadProfile(favoriteProfile.name);
    }

    setupEventListeners();
    addProfileInterface();
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