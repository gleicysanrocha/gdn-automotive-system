
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

        // Sync Sidebar
        document.querySelectorAll('.nav-item').forEach(el => {
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
                if (window.TechnicianModule) {
                    window.TechnicianModule.render(contentArea);
                } else {
                    contentArea.innerHTML = '<p class="text-danger">Erro ao carregar módulo de Técnicos.</p>';
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
    }
};

// Start App
window.addEventListener('DOMContentLoaded', () => {
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
