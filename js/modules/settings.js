
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
