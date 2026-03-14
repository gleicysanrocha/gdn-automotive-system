
/**
 * GDN Automotive - Authentication Module
 * Handles Login, Logout, and Auth State
 */

const AuthModule = {
    init: () => {
        // Verifica se o Firebase carregou corretamente
        const isFirebaseAvailable = typeof firebase !== 'undefined' && window.auth;

        if (!isFirebaseAvailable) {
            console.warn('Firebase Auth não detectado. Ativando Modo de Emergência (Somente Local).');
            // Se estiver em modo convidado persistente, entra direto
            if (AuthModule.checkGuestSession()) {
                AuthModule.hideLogin();
                if (window.App) window.App.init();
            } else {
                AuthModule.showLogin();
                AuthModule.enableGuestModeUI();
            }
            return;
        }

        window.auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('Usuário autenticado via Firebase:', user.email);
                AuthModule.hideLogin();

                // Sincronização automática ao entrar
                if (window.StorageApp && window.StorageApp.syncCloudToLocal) {
                    console.log('Iniciando sincronização com a nuvem...');
                    await window.StorageApp.syncCloudToLocal();
                }

                if (window.App) window.App.init();
            } else if (AuthModule.checkGuestSession()) {
                console.log('Logado via Modo Local (Convidado)');
                AuthModule.hideLogin();
                if (window.App) window.App.init();
            } else {
                console.log('Aguardando login...');
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

        const guestBtn = document.getElementById('guest-login-btn');
        if (guestBtn) {
            guestBtn.addEventListener('click', AuthModule.handleGuestLogin);
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
            console.error('Erro de login:', error);
            alert('Erro ao entrar: ' + (error.code === 'auth/network-request-failed' ? 'Sem conexão com o banco de dados.' : error.message));
            btn.disabled = false;
            btn.innerHTML = 'Entrar';
        }
    },

    handleGuestLogin: () => {
        const msg = 'Atenção: No Modo Local, seus dados ficam salvos apenas neste navegador.\n\nDeseja continuar sem sincronização online?';
        if (confirm(msg)) {
            sessionStorage.setItem('GDN_GUEST_MODE', 'true');
            localStorage.setItem('GDN_GUEST_PERSIST', 'true'); // Fallback de persistencia
            AuthModule.hideLogin();
            if (window.App) window.App.init();
            alert('Acesso Local liberado!');
        }
    },

    checkGuestSession: () => {
        return sessionStorage.getItem('GDN_GUEST_MODE') === 'true' ||
            localStorage.getItem('GDN_GUEST_PERSIST') === 'true';
    },

    handleLogout: async () => {
        if (confirm('Deseja realmente sair do sistema?')) {
            sessionStorage.removeItem('GDN_GUEST_MODE');
            localStorage.removeItem('GDN_GUEST_PERSIST');
            if (window.auth) await window.auth.signOut();
            window.location.reload();
        }
    },

    enableGuestModeUI: () => {
        const title = document.querySelector('.login-card h2');
        if (title) title.innerHTML = 'Acesso Offline <br><small style="font-size: 0.8rem; color: #ffc107;">Firebase não conectado</small>';

        // Desativa campos de login real pois nao vao funcionar sem firebase
        const loginFields = document.querySelectorAll('#login-form input, #login-form button[type="submit"]');
        loginFields.forEach(f => {
            f.disabled = true;
            f.style.opacity = '0.5';
        });

        const guestBtn = document.getElementById('guest-login-btn');
        if (guestBtn) {
            guestBtn.style.padding = '15px';
            guestBtn.style.fontSize = '1.1rem';
            guestBtn.classList.add('animate-pulse'); // Add a subtle pulse if CSS allows
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
