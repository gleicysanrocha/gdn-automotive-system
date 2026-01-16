
/**
 * GDN Automotive - Authentication Module
 * Handles Login, Logout, and Auth State
 */

const AuthModule = {
    init: () => {
        if (!window.auth) return;

        window.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User logged in:', user.email);
                AuthModule.hideLogin();
                // If App is already initialized, we might need to refresh data from Cloud
                if (window.App) window.App.init();
            } else {
                console.log('No user logged in.');
                AuthModule.showLogin();
            }
        });

        AuthModule.bindEvents();
    },

    bindEvents: () => {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', AuthModule.handleLogin);
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', AuthModule.handleLogout);
        }
    },

    handleLogin: async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        const btn = e.target.querySelector('button');

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
            await window.auth.signInWithEmailAndPassword(email, pass);
        } catch (error) {
            console.error('Login error:', error);
            alert('Erro ao entrar: ' + error.message);
            btn.disabled = false;
            btn.innerHTML = 'Entrar';
        }
    },

    handleLogout: async () => {
        if (confirm('Deseja realmente sair?')) {
            await window.auth.signOut();
            window.location.reload();
        }
    },

    showLogin: () => {
        const loginOverlay = document.getElementById('login-overlay');
        if (loginOverlay) {
            loginOverlay.style.display = 'flex';
        }
        document.body.classList.add('logged-out');
    },

    hideLogin: () => {
        const loginOverlay = document.getElementById('login-overlay');
        if (loginOverlay) {
            loginOverlay.style.display = 'none';
        }
        document.body.classList.remove('logged-out');
    }
};

window.AuthModule = AuthModule;
