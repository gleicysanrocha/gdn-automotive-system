
// Main Application Logic
const App = {
    init: () => {
        App.bindEvents();
        App.handleLocation();
    },

    bindEvents: () => {
        // Navigation clicks
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                // Update UI immediately for responsiveness
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Hash change listener for routing
        window.addEventListener('hashchange', App.handleLocation);
        window.addEventListener('load', App.handleLocation);
    },

    handleLocation: () => {
        // If no hash, default to dashboard
        if (!window.location.hash) {
            window.location.hash = '#dashboard';
            return;
        }

        const route = window.location.hash.slice(1);

        App.updateTitle(route);
        App.renderContent(route);
    },

    updateTitle: (route) => {
        const titles = {
            'dashboard': 'Dashboard',
            'clients': 'Gestão de Clientes',
            'technicians': 'Técnicos',
            'os': 'Ordens de Serviço',
            'financial': 'Relatório Financeiro',
            'settings': 'Configurações do Sistema'
        };
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = titles[route] || 'GDN Automotive';

        // Sync Sidebar & Mobile Nav
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('href') === `#${route}`) {
                el.classList.add('active');
            }
        });
    },

    renderContent: (route) => {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = ''; // Clear current content

        switch (route) {
            case 'clients':
                if (window.ClientModule) {
                    window.ClientModule.render(contentArea);
                } else {
                    contentArea.innerHTML = '<p class="text-danger">Erro ao carregar módulo de Clientes.</p>';
                }
                break;
            case 'technicians':
                console.log('Navegando para Técnicos...');
                if (window.TechnicianModule) {
                    try {
                        window.TechnicianModule.render(contentArea);
                    } catch (e) {
                        console.error('Erro crítico na renderização de Técnicos:', e);
                        contentArea.innerHTML = `<div class="card"><p class="text-danger">Erro ao renderizar técnicos: ${e.message}</p><button onclick="location.reload()" class="btn btn-secondary">Recarregar Página</button></div>`;
                    }
                } else {
                    console.error('Objeto window.TechnicianModule não encontrado.');
                    contentArea.innerHTML = `
                        <div class="card" style="text-align: center; padding: 40px;">
                            <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: #ffc107; margin-bottom: 20px;"></i>
                            <h3 class="text-danger">Módulo de Técnicos não carregado</h3>
                            <p>O navegador não conseguiu carregar o arquivo de técnicos. Isso pode ser cache antigo.</p>
                            <div style="margin-top: 20px;">
                                <button onclick="location.reload()" class="btn btn-primary" style="margin-right: 10px;">Tentar Recarregar</button>
                                <button onclick="alert('Pressione Ctrl+F5 no teclado')" class="btn btn-outline-info">Como Limpar Cache?</button>
                            </div>
                        </div>
                    `;
                }
                break;
            case 'os':
                if (window.OSModule) {
                    window.OSModule.render(contentArea);
                } else {
                    contentArea.innerHTML = '<p class="text-danger">Erro ao carregar módulo de OS.</p>';
                }
                break;
            case 'financial':
                if (window.FinancialModule) {
                    window.FinancialModule.render(contentArea);
                } else {
                    contentArea.innerHTML = '<p class="text-danger">Erro ao carregar módulo Financeiro.</p>';
                }
                break;
            case 'settings':
                if (window.SettingsModule) {
                    window.SettingsModule.render(contentArea);
                } else {
                    contentArea.innerHTML = '<p class="text-danger">Erro ao carregar módulo de Configurações.</p>';
                }
                break;
            case 'dashboard':
            default:
                App.renderDashboard(contentArea);
                break;
        }
    },

    renderDashboard: (container) => {
        const clients = (window.StorageApp && window.StorageApp.get('clients')) || [];
        const osRecords = (window.StorageApp && window.StorageApp.get('os_records')) || [];

        // Basic Monthly Stats
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonthOS = osRecords.filter(os => {
            const d = new Date(os.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const revenue = thisMonthOS.reduce((acc, os) => acc + (parseFloat(os.values.total) || 0), 0);

        container.innerHTML = `
            <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
                <div class="card stat-card" style="border-bottom: 4px solid var(--primary-color);">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <p class="text-muted">Faturamento (Mês)</p>
                            <h2 style="font-size: 1.8rem; font-weight: 700; color: var(--primary-color);">R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                        </div>
                        <i class="fa-solid fa-money-bill-trend-up" style="font-size: 2rem; opacity: 0.2;"></i>
                    </div>
                </div>
                <div class="card stat-card" style="border-bottom: 4px solid var(--success-color);">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <p class="text-muted">OS Concluídas</p>
                            <h2 style="font-size: 1.8rem; font-weight: 700; color: var(--success-color);">${thisMonthOS.filter(o => o.status === 'Concluída').length}</h2>
                        </div>
                        <i class="fa-solid fa-circle-check" style="font-size: 2rem; opacity: 0.2;"></i>
                    </div>
                </div>
                <div class="card stat-card" style="border-bottom: 4px solid var(--accent-color);">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <p class="text-muted">Total de Clientes</p>
                            <h2 style="font-size: 1.8rem; font-weight: 700; color: var(--accent-color);">${clients.length}</h2>
                        </div>
                        <i class="fa-solid fa-users" style="font-size: 2rem; opacity: 0.2;"></i>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 20px;">
                <div class="card">
                    <h3><i class="fa-solid fa-chart-line"></i> Desempenho Mensal (OS)</h3>
                    <div style="height: 300px; position: relative;">
                        <canvas id="main-chart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <h3>Acesso Rápido</h3>
                    <div class="quick-actions" style="display: flex; flex-direction: column; gap: 10px;">
                        <a href="#os" class="btn btn-primary" style="justify-content: center; padding: 15px;"><i class="fa-solid fa-plus"></i> Nova OS</a>
                        <a href="#clients" class="btn btn-secondary" style="justify-content: center; padding: 15px;"><i class="fa-solid fa-user-plus"></i> Novo Cliente</a>
                        <a href="#financial" class="btn btn-secondary" style="justify-content: center; padding: 15px; background: #6f42c1;"><i class="fa-solid fa-sack-dollar"></i> Financeiro</a>
                    </div>
                </div>
            </div>
        `;

        App.renderMainChart(osRecords);
    },

    renderMainChart: (osRecords) => {
        const ctx = document.getElementById('main-chart');
        if (!ctx) return;

        // Last 6 months labels
        const labels = [];
        const data = [];
        const date = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
            labels.push(d.toLocaleDateString('pt-BR', { month: 'short' }));

            const count = osRecords.filter(os => {
                const osD = new Date(os.date);
                return osD.getMonth() === d.getMonth() && osD.getFullYear() === d.getFullYear();
            }).length;
            data.push(count);
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ordens de Serviço',
                    data: data,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#007bff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    },

    init: () => {
        console.log('App init check');
        
        // Verifica se a tela de login tá ativa antes de rodar o app principal
        const loginOverlay = document.getElementById('login-overlay');
        if (loginOverlay && loginOverlay.style.display !== 'none') {
             console.log('App initiation halted: Login layer is visible.');
             return; 
        }

        console.log('App initialized.');
        
        // Load default content
        App.loadContent('dashboard');

        // Bind events
        App.bindNavigation();
        
        if (window.ClientsModule) window.ClientsModule.init();
        if (window.TechniciansModule) window.TechniciansModule.init();
        if (window.FinancialModule) window.FinancialModule.init();
        
        // Initialize AI Bot
        if (window.AIModule) window.AIModule.init();

        // Apply settings changes
        if (window.SettingsModule) window.SettingsModule.applySettings();
    }
};

// Start App
window.addEventListener('DOMContentLoaded', () => {
    // Initialize Auth first
    if (window.AuthModule) {
        AuthModule.init();
    }

    try {
        App.init();
    } catch (e) {
        console.error('App init error:', e);
    }

    // Apply store settings on load
    try {
        if (window.SettingsModule) {
            window.SettingsModule.applySettings();
        }
    } catch (e) {
        console.error('Settings init error:', e);
    }
});
