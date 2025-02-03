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
    }
};

const REFERENCE_SETTINGS = {
    dpi: 800,
    distance: 50,
    monitorScale: 1.0,
    referenceGame: 'CSGO',
    correctionFactors: {
        VALORANT: 1.0,
        CSGO: 1.0,
        APEX: 0.95,
        OVERWATCH: 0.92,
        FORTNITE: 0.98,
        R6: 1.0,
        COD: 0.97,
        BF: 0.96,
        QUAKE: 1.0
    }
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
        return (360 * 2.54) / (this.sensitivity * gameConfig.yawPerDegree * this.dpi);
    }

    updateValues(sensitivity, dpi, fov, game = null) {
        this.sensitivity = parseFloat(sensitivity) || this.sensitivity;
        this.dpi = parseFloat(dpi) || this.dpi;
        if (game) {
            this.currentGame = game;
            if (!fov) {
                this.fov = GAME_MULTIPLIERS[game].defaultFov;
            }
        }
        if (fov) {
            this.fov = parseFloat(fov);
        }
    }
}

const sensCalc = new SensitivityCalculator();

class SensitivityProfile {
    constructor() {
        this.profiles = this.loadProfiles();
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
            timestamp: Date.now()
        };

        this.profiles[name] = profile;
        this.saveToLocalStorage();
        return profile;
    }

    loadProfile(name) {
        const profile = this.profiles[name];
        if (!profile) return null;

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

        // Mise à jour des valeurs d'entrée et des sliders avec les bons IDs
        const gameSelector = document.getElementById('gameSelector');
        const sensitivitySlider = document.getElementById('sensitivitySlider');
        const sensitivityInput = document.getElementById('sensitivityInput');
        const dpiInput = document.getElementById('dpiInput');
        const fovSlider = document.getElementById('fovSlider');
        const fovInput = document.getElementById('fovInput');

        if (gameSelector) gameSelector.value = profile.game;
        if (sensitivitySlider) sensitivitySlider.value = profile.sensitivity;
        if (sensitivityInput) sensitivityInput.value = profile.sensitivity;
        if (dpiInput) dpiInput.value = profile.dpi;
        if (fovSlider) fovSlider.value = profile.fov;
        if (fovInput) fovInput.value = profile.fov;

        // Mise à jour de la calculatrice de sensibilité
        sensCalc.updateValues(
            profile.sensitivity,
            profile.dpi,
            profile.fov,
            profile.game
        );

        updateCrosshairPreview();
        updateDisplay();
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

    saveToLocalStorage() {
        try {
            localStorage.setItem('sensitivityProfiles', JSON.stringify(this.profiles));
        } catch (error) {
            console.error('Error saving profiles:', error);
        }
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

function addProfileInterface() {
    const profileManager = new SensitivityProfile();

    // Récupération des éléments
    const profileName = document.getElementById('profileName');
    const profileList = document.getElementById('profileList');
    const saveProfileBtn = document.getElementById('saveProfile');
    const loadProfileBtn = document.getElementById('loadProfile');
    const deleteProfileBtn = document.getElementById('deleteProfile');
    const exportProfileBtn = document.getElementById('exportProfile');
    const importProfileBtn = document.getElementById('importProfile');

    function updateProfileList() {
        profileList.innerHTML = '';
        Object.keys(profileManager.profiles).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            profileList.appendChild(option);
        });
    }

    // Sauvegarder un profil
    saveProfileBtn.addEventListener('click', () => {
        const name = profileManager.sanitizeProfileName(profileName.value);
        if (!name) {
            alert('Please enter a valid profile name');
            return;
        }

        const config = {
            game: document.getElementById('gameSelector').value,
            sensitivity: parseFloat(document.getElementById('sensitivitySlider').value),
            dpi: parseInt(document.getElementById('dpiInput').value),
            fov: parseInt(document.getElementById('fovSlider').value)
        };

        try {
            profileManager.saveProfile(name, config);
            updateProfileList();
            profileName.value = '';
        } catch (error) {
            alert('Invalid profile data. Please check your inputs.');
        }
    });

    // Charger un profil
    loadProfileBtn.addEventListener('click', () => {
        const name = profileList.value;
        if (name) {
            profileManager.loadProfile(name);
        }
    });

    // Supprimer un profil
    deleteProfileBtn.addEventListener('click', () => {
        const name = profileList.value;
        if (name && confirm(`Are you sure you want to delete profile "${name}"?`)) {
            if (profileManager.deleteProfile(name)) {
                updateProfileList();
            }
        }
    });

    // Exporter un profil
    exportProfileBtn.addEventListener('click', () => {
        const name = profileList.value;
        const encoded = profileManager.exportProfile(name);
        if (encoded) {
            navigator.clipboard.writeText(encoded)
                .then(() => alert('Profile code copied to clipboard!'))
                .catch(err => console.error('Error copying to clipboard:', err));
        }
    });

    // Importer un profil
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

    // Initialisation
    updateProfileList();
}

function updateCrosshairPreview() {
    const preview = document.getElementById('crosshairPreview');
    if (!preview) return;

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

function updateDisplay() {
    const cm360 = sensCalc.calculateCM360();
    const cm360Display = document.getElementById('cm360Value');
    if (cm360Display) {
        cm360Display.textContent = `${cm360.toFixed(2)} cm/360°`;
    }
}

function setupOptionsMenu() {
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
    const gameSelector = document.getElementById('gameSelector');
    const sensitivitySlider = document.getElementById('sensitivitySlider');
    const sensitivityInput = document.getElementById('sensitivityInput');
    const dpiInput = document.getElementById('dpiInput');
    const fovSlider = document.getElementById('fovSlider');
    const fovInput = document.getElementById('fovInput');

    function updateValue(key, value) {
        const min = sliders[key].min;
        const max = sliders[key].max;
        const step = sliders[key].step || 1;

        let newValue = parseFloat(value);
        newValue = Math.min(Math.max(newValue, parseFloat(min)), parseFloat(max));

        if (step !== 1) {
            newValue = Math.round(newValue / step) * step;
        }

        sliders[key].value = newValue;
        inputs[key].value = newValue;
        crosshairConfig[key] = newValue;

        updateCrosshairPreview();
        // Suppression de la sauvegarde automatique ici
    }

    Object.keys(sliders).forEach(key => {
        sliders[key].addEventListener('input', (e) => {
            updateValue(key, e.target.value);
        });

        inputs[key].addEventListener('input', (e) => {
            updateValue(key, e.target.value);
        });
    });

    colorPicker.addEventListener('input', (e) => {
        crosshairConfig.color = e.target.value;
        updateCrosshairPreview();
        // Suppression de la sauvegarde automatique ici
    });

    gameSelector.addEventListener('change', () => {
        sensCalc.updateValues(
            sensitivityInput.value,
            dpiInput.value,
            fovInput.value,
            gameSelector.value
        );
        updateDisplay();
        // Suppression de la sauvegarde automatique ici
    });

    sensitivitySlider.addEventListener('input', () => {
        sensitivityInput.value = sensitivitySlider.value;
        sensCalc.updateValues(sensitivitySlider.value, dpiInput.value);
        updateDisplay();
    });

    sensitivityInput.addEventListener('input', () => {
        sensitivitySlider.value = sensitivityInput.value;
        sensCalc.updateValues(sensitivityInput.value, dpiInput.value);
        updateDisplay();
    });

    dpiInput.addEventListener('input', () => {
        sensCalc.updateValues(sensitivityInput.value, dpiInput.value);
        updateDisplay();
    });

    fovSlider.addEventListener('input', () => {
        fovInput.value = fovSlider.value;
        sensCalc.updateValues(
            sensitivityInput.value,
            dpiInput.value,
            fovSlider.value,
            gameSelector.value
        );
        updateDisplay();
    });

    fovInput.addEventListener('input', () => {
        fovSlider.value = fovInput.value;
        sensCalc.updateValues(
            sensitivityInput.value,
            dpiInput.value,
            fovInput.value,
            gameSelector.value
        );
        updateDisplay();
    });

    document.getElementById('saveOptionsButton').addEventListener('click', () => {
        // Sauvegarde de tous les paramètres lors du clic sur Save
        localStorage.setItem('crosshairConfig', JSON.stringify(crosshairConfig));

        const config = {
            game: document.getElementById('gameSelector').value,
            sensitivity: document.getElementById('sensitivitySlider').value,
            dpi: document.getElementById('dpiInput').value,
            fov: document.getElementById('fovSlider').value
        };
        localStorage.setItem('sensitivityConfig', JSON.stringify(config));
        hideModal(optionsModal);
    });

    document.getElementById('resetOptionsButton').addEventListener('click', () => {
        Object.keys(defaultConfig).forEach(key => {
            crosshairConfig[key] = defaultConfig[key];
            if (sliders[key]) sliders[key].value = defaultConfig[key];
            if (inputs[key]) inputs[key].value = defaultConfig[key];
        });
        colorPicker.value = defaultConfig.color;
        updateCrosshairPreview();

        gameSelector.value = 'VALORANT';
        sensitivitySlider.value = 0.26;
        sensitivityInput.value = 0.26;
        dpiInput.value = 800;
        fovSlider.value = GAME_MULTIPLIERS['VALORANT'].defaultFov;
        fovInput.value = GAME_MULTIPLIERS['VALORANT'].defaultFov;

        sensCalc.updateValues(0.26, 800, GAME_MULTIPLIERS['VALORANT'].defaultFov, 'VALORANT');
        updateDisplay();
    });
}

document.getElementById('playButton').addEventListener('click', () => {
    window.location.href = 'game.html';
});

document.getElementById('leaderboardButton').addEventListener('click', () => {
    alert('Leaderboard coming soon!');
});

document.getElementById('optionsButton').addEventListener('click', () => {
    showModal(optionsModal);
    updateCrosshairPreview();
    updateDisplay();
});

document.getElementById('quitButton').addEventListener('click', () => {
    window.close();
    if (!window.closed) {
        window.location.href = "about:blank";
    }
});

const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const optionsModal = document.getElementById('optionsModal');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');
const closeButtons = document.querySelectorAll('.close-button');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');

function showModal(modal) {
    modal.classList.add('active');
}

function hideModal(modal) {
    modal.classList.remove('active');
}

function hideAllModals() {
    loginModal.classList.remove('active');
    registerModal.classList.remove('active');
    optionsModal.classList.remove('active');
}

loginButton.addEventListener('click', () => showModal(loginModal));
registerButton.addEventListener('click', () => showModal(registerModal));

closeButtons.forEach(button => {
    button.addEventListener('click', () => hideAllModals());
});

switchToRegister.addEventListener('click', () => {
    hideModal(loginModal);
    showModal(registerModal);
});

switchToLogin.addEventListener('click', () => {
    hideModal(registerModal);
    showModal(loginModal);
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        hideAllModals();
    }
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Login submitted');
});

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Register submitted');
});

const loadSavedSettings = () => {
    const savedCrosshair = localStorage.getItem('crosshairConfig');
    if (savedCrosshair) {
        Object.assign(crosshairConfig, JSON.parse(savedCrosshair));
        const configCrosshair = JSON.parse(savedCrosshair);
        document.getElementById('sizeSlider').value = configCrosshair.size;
        document.getElementById('sizeInput').value = configCrosshair.size;
        document.getElementById('thicknessSlider').value = configCrosshair.thickness;
        document.getElementById('thicknessInput').value = configCrosshair.thickness;
        document.getElementById('gapSlider').value = configCrosshair.gap;
        document.getElementById('gapInput').value = configCrosshair.gap;
        document.getElementById('colorPicker').value = configCrosshair.color;
    }

    const savedSensitivity = localStorage.getItem('sensitivityConfig');
    if (savedSensitivity) {
        const config = JSON.parse(savedSensitivity);
        document.getElementById('gameSelector').value = config.game;
        document.getElementById('sensitivitySlider').value = config.sensitivity;
        document.getElementById('sensitivityInput').value = config.sensitivity;
        document.getElementById('dpiInput').value = config.dpi;
        document.getElementById('fovSlider').value = config.fov;
        document.getElementById('fovInput').value = config.fov;

        // Mettre à jour la calculatrice avec les valeurs chargées
        sensCalc.updateValues(
            config.sensitivity,
            config.dpi,
            config.fov,
            config.game
        );
    }
}

function init() {
    setupOptionsMenu();
    loadSavedSettings();
    addProfileInterface();
    updateCrosshairPreview();
    updateDisplay();
}

init();