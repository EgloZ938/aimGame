document.getElementById('playButton').addEventListener('click', () => {
    window.location.href = 'game.html';
});

document.getElementById('leaderboardButton').addEventListener('click', () => {
    // À implémenter
    alert('Leaderboard coming soon!');
});

document.getElementById('optionsButton').addEventListener('click', () => {
    // À implémenter
    alert('Options coming soon!');
});

document.getElementById('quitButton').addEventListener('click', () => {
    window.close();
    // Fallback si window.close() ne fonctionne pas
    if (!window.closed) {
        window.location.href = "about:blank";
    }
});

// Gestion des modals
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
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

// Fermer les modals en cliquant à l'extérieur
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        hideAllModals();
    }
});

// Gestion des formulaires
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    // Logique de connexion à implémenter
    console.log('Login submitted');
});

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    // Logique d'inscription à implémenter
    console.log('Register submitted');
});