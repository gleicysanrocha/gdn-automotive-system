
// Store Settings Module
const SettingsModule = {
    render: (container) => {
        const settings = window.StorageApp.get('storeSettings') || {
            name: 'GDN Serviços Automotivos',
            cnpj: '',
            address: '',
            phone: '',
            logo: 'assets/img/logo.png'
        };

        container.innerHTML = `
            <div class="settings-container animate-fade-in">
                <div class="card">
                    <h2><i class="fa-solid fa-gears"></i> Configurações da Loja</h2>
                    <p class="text-muted">Gerencie as informações básicas da sua oficina e o logotipo do sistema.</p>
                    
                    <form id="settings-form" class="mt-4">
                        <div class="settings-layout" style="display: grid; grid-template-columns: 1fr 300px; gap: 30px;">
                            <div class="settings-fields">
                                <div class="form-group">
                                    <label for="store-name">Nome da Oficina</label>
                                    <input type="text" id="store-name" class="form-control" value="${settings.name}" required>
                                </div>
                                <div class="form-group">
                                    <label for="store-cnpj">CNPJ</label>
                                    <input type="text" id="store-cnpj" class="form-control" value="${settings.cnpj}" placeholder="00.000.000/0000-00">
                                </div>
                                <div class="form-group">
                                    <label for="store-address">Endereço Completo</label>
                                    <input type="text" id="store-address" class="form-control" value="${settings.address}">
                                </div>
                                <div class="form-group">
                                    <label for="store-phone">Telefone / WhatsApp</label>
                                    <input type="text" id="store-phone" class="form-control" value="${settings.phone}">
                                </div>
                            </div>

                            <div class="settings-logo-section">
                                <label>Logotipo da Empresa</label>
                                <div class="logo-preview-container" style="background: #f8f9fa; border: 2px dashed #ddd; border-radius: 8px; padding: 20px; text-align: center; margin-top: 5px;">
                                    <img id="logo-preview" src="${settings.logo}" alt="Logo Preview" style="max-width: 100%; max-height: 150px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">
                                    <input type="file" id="logo-upload" accept="image/*" style="display: none;">
                                    <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('logo-upload').click()">
                                        <i class="fa-solid fa-upload"></i> Alterar Logo
                                    </button>
                                    <p class="text-muted mt-2" style="font-size: 0.8rem;">Recomendado: 200x200px (PNG ou JPG)</p>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions mt-4" style="border-top: 1px solid #eee; padding-top: 20px;">
                            <button type="submit" class="btn btn-primary">
                                <i class="fa-solid fa-save"></i> Salvar Alterações
                            </button>
                        </div>
                    </form>
                </div>

                <div class="card mt-4">
                    <h2><i class="fa-solid fa-cloud-arrow-up"></i> Segurança e Backup</h2>
                    <p class="text-muted">Gerencie a sincronização em nuvem e backups manuais.</p>
                    
                    <div class="backup-actions mt-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="backup-box" style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #eee;">
                            <h4>Backup Manual</h4>
                            <p style="font-size: 0.85rem; margin-bottom: 15px;">Baixe todos os seus dados em um arquivo JSON para segurança extra.</p>
                            <button type="button" id="btn-export-backup" class="btn btn-secondary w-100">
                                <i class="fa-solid fa-download"></i> Exportar JSON
                            </button>
                            <button type="button" id="btn-trigger-import" class="btn btn-outline-secondary w-100 mt-2">
                                <i class="fa-solid fa-upload"></i> Importar JSON
                            </button>
                            <input type="file" id="import-backup-file" accept=".json" style="display: none;">
                        </div>

                        <div class="sync-box" style="background: #e7f3ff; padding: 20px; border-radius: 8px; border: 1px solid #b3d7ff;">
                            <h4>Sincronização em Nuvem</h4>
                            <p style="font-size: 0.85rem; margin-bottom: 15px;">Forçar sincronização com o banco de dados da nuvem (Firebase).</p>
                            <button type="button" id="btn-sync-cloud" class="btn btn-primary w-100">
                                <i class="fa-solid fa-rotate"></i> Sincronizar Agora
                            </button>
                            <p id="sync-status" class="mt-2" style="font-size: 0.75rem; text-align: center; color: var(--primary-color); font-weight: 600;"></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        SettingsModule.bindEvents();
    },

    bindEvents: () => {
        const form = document.getElementById('settings-form');
        const logoUpload = document.getElementById('logo-upload');
        const logoPreview = document.getElementById('logo-preview');

        // Logo Upload Preview
        logoUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    logoPreview.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Form Submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const updatedSettings = {
                name: document.getElementById('store-name').value,
                cnpj: document.getElementById('store-cnpj').value,
                address: document.getElementById('store-address').value,
                phone: document.getElementById('store-phone').value,
                logo: logoPreview.src // Base64 if changed
            };

            window.StorageApp.save('storeSettings', updatedSettings);

            // Apply changes immediately to layout
            SettingsModule.applySettings(updatedSettings);

            alert('Configurações salvas com sucesso!');
        });

        // Export Backup
        document.getElementById('btn-export-backup').addEventListener('click', () => {
            const allData = {};
            Object.keys(localStorage).forEach(key => {
                if (key.includes('GDN_AUTO_')) {
                    allData[key] = localStorage.getItem(key);
                }
            });

            const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_gdn_os_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        });

        // Import Backup
        const importInput = document.getElementById('import-backup-file');
        document.getElementById('btn-trigger-import').addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (confirm('Isso irá substituir os dados atuais. Deseja continuar?')) {
                        Object.keys(data).forEach(key => {
                            localStorage.setItem(key, data[key]);
                        });
                        alert('Backup restaurado com sucesso! O sistema irá reiniciar.');
                        window.location.reload();
                    }
                } catch (err) {
                    alert('Erro ao importar arquivo. Verifique se o formato está correto.');
                }
            };
            reader.readAsText(file);
        });

        // Force Cloud Sync
        document.getElementById('btn-sync-cloud').addEventListener('click', async () => {
            const btn = document.getElementById('btn-sync-cloud');
            const status = document.getElementById('sync-status');

            try {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...';
                status.textContent = 'Baixando dados da nuvem...';

                await window.StorageApp.syncCloudToLocal();

                status.textContent = 'Sincronização concluída!';
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (err) {
                alert('Erro na sincronização: ' + err.message);
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Sincronizar Agora';
                status.textContent = '';
            }
        });
    },

    applySettings: (settings) => {
        if (!settings) settings = window.StorageApp.get('storeSettings');
        if (!settings) return;

        // Update sidebar logo
        const sidebarLogo = document.querySelector('.brand img');
        if (sidebarLogo) {
            sidebarLogo.src = settings.logo;
        }

        // Update page title if needed
        document.title = settings.name;
    }
};

// Expose to window
window.SettingsModule = SettingsModule;
