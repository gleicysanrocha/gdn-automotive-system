
window.OSModule = {
    render: (container) => {
        container.innerHTML = `
            <div class="card" id="os-list-view">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>Ordens de Serviço</h3>
                    <div style="display: flex; gap: 10px;">
                        <button id="btn-import-whatsapp" class="btn btn-secondary" style="background-color: #25d366; border-color: #128c7e;">
                            <i class="fa-brands fa-whatsapp"></i> Importar WhatsApp
                        </button>
                        <button id="btn-new-os" class="btn btn-primary">
                            <i class="fa-solid fa-plus"></i> Nova OS
                        </button>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Nº OS</th>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Veículo</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="os-list-body">
                            <!-- JS Populated -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Form View (Hidden by default) -->
            <div id="os-form-view" class="card hidden">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 id="os-form-title">Nova Ordem de Serviço</h3>
                    <button id="btn-back-os" class="btn btn-secondary">
                        <i class="fa-solid fa-arrow-left"></i> Voltar
                    </button>
                </div>

                <form id="os-form">
                    <input type="hidden" id="os-id">
                    
                    <!-- Section 1: Client Info -->
                    <h4 class="section-title" style="margin-top: 0; color: var(--primary-color); border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 15px;">
                        Informações do Cliente
                         <label style="float: right; font-size: 0.9rem; font-weight: normal; cursor: pointer;">
                            <input type="checkbox" id="os-manual-client"> Cliente Manual / Avulso
                        </label>
                    </h4>
                    <div style="display: grid; grid-template-columns: 100px 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label class="form-label">Nº OS *</label>
                            <input type="text" id="os-number" class="form-control" style="font-weight: bold;" placeholder="Ex: 2026.001">
                        </div>
                         <div class="form-group">
                            <label class="form-label">Data do Serviço</label>
                            <input type="date" id="os-date" class="form-control" required>
                        </div>
                         <!-- Client Select Wrapper -->
                        <div class="form-group" id="group-client-select">
                            <label class="form-label">Cliente *</label>
                            <select id="os-client-select" class="form-control">
                                <option value="">Selecione um cliente...</option>
                            </select>
                        </div>
                         <!-- Client Name Input (Hidden by default) -->
                         <div class="form-group hidden" id="group-client-name-manual">
                            <label class="form-label">Nome do Cliente *</label>
                            <input type="text" id="os-client-name-manual" class="form-control" placeholder="Nome do cliente">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label class="form-label">CPF / CNPJ</label>
                            <input type="text" id="os-client-doc" class="form-control" readonly>
                        </div>
                        <div class="form-group">
                             <label class="form-label">Telefone</label>
                             <input type="text" id="os-client-phone" class="form-control" readonly>
                        </div>
                         <div class="form-group">
                             <label class="form-label">Endereço</label>
                             <input type="text" id="os-client-address" class="form-control" readonly>
                        </div>
                    </div>

                    <!-- Section 2: Vehicle Info -->
                    <h4 class="section-title" style="margin-top: 20px; color: var(--primary-color); border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 15px;">Informações do Veículo</h4>
                    <div style="display: grid; grid-template-columns: 1fr 100px 1fr 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label class="form-label">Modelo *</label>
                            <input type="text" id="os-model" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Ano</label>
                            <input type="text" id="os-year" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Placa *</label>
                            <input type="text" id="os-plate" class="form-control" required>
                        </div>
                        <div class="form-group">
                             <label class="form-label">KM</label>
                             <input type="text" id="os-km" class="form-control">
                        </div>
                         <div class="form-group">
                             <label class="form-label">Garantia (Meses)</label>
                             <input type="number" id="os-warranty" class="form-control" placeholder="3">
                        </div>
                    </div>

                    <!-- Section 3: Details -->
                     <h4 class="section-title" style="margin-top: 20px; color: var(--primary-color); border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 15px;">Descrição Detalhada</h4>
                     <div class="form-group">
                         <textarea id="os-description" class="form-control" rows="5" placeholder="Descreva os serviços realizados..."></textarea>
                     </div>

                     <!-- Section 4: Values -->
                    <h4 class="section-title" style="margin-top: 20px; color: var(--primary-color); border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 15px;">Valores (R$)</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                        <div class="form-group">
                            <label class="form-label">Peças</label>
                            <input type="number" step="0.01" id="val-parts" class="form-control calc-input" placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Retífica</label>
                            <input type="number" step="0.01" id="val-machine" class="form-control calc-input" placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mão de Obra</label>
                            <input type="number" step="0.01" id="val-labor" class="form-control calc-input" placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Desconto (-)</label>
                            <input type="number" step="0.01" id="val-discount" class="form-control calc-input" placeholder="0.00" style="color: #ff6b6b;">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 15px; margin-top: 10px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                        <div class="form-group">
                             <label class="form-label">Descrição Diversos (Opcional)</label>
                             <input type="text" id="desc-misc" class="form-control" placeholder="Ex: Taxa de lavagem">
                        </div>
                         <div class="form-group">
                            <label class="form-label">Valor Diversos (+)</label>
                            <input type="number" step="0.01" id="val-misc" class="form-control calc-input" placeholder="0.00">
                        </div>
                    </div>

                    <div style="margin-top: 15px; text-align: right;">
                        <h2 style="color: var(--success-color);">Total: R$ <span id="os-total-display">0.00</span></h2>
                    </div>

                    <!-- Section 5: General -->
                    <h4 class="section-title" style="margin-top: 20px; color: var(--primary-color); border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 15px;">Informações Gerais</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                             <label class="form-label">Técnico Responsável</label>
                             <select id="os-tech-select" class="form-control">
                                 <option value="">Selecione...</option>
                             </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <select id="os-status" class="form-control">
                                <option value="Aberta">Aberta</option>
                                <option value="Em Andamento">Em Andamento</option>
                                <option value="Aguardando Peças">Aguardando Peças</option>
                                <option value="Concluída">Concluída</option>
                                <option value="Cancelada">Cancelada</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 15px; margin-top: 30px; border-top: 1px solid #333; padding-top: 20px;">
                        <!-- Actions -->
                        <button type="submit" class="btn btn-primary" style="padding: 12px 25px; font-size: 1.1rem;">
                            <i class="fa-solid fa-save"></i> Salvar OS
                        </button>
                        <button type="button" id="btn-print-os" class="btn btn-secondary hidden" style="padding: 12px 25px; font-size: 1.1rem; background-color: #6f42c1;">
                            <i class="fa-solid fa-print"></i> Salvar PDF / Imprimir
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Hidden Print Container -->
            <div id="print-container" class="hidden"></div>

            <!-- WhatsApp Import Modal -->
            <div id="whatsapp-import-modal" class="hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="card" style="width: 100%; max-width: 600px; position: relative;">
                    <button id="close-import-modal" style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 1.5rem; color: #fff; cursor: pointer;">&times;</button>
                    <h3><i class="fa-brands fa-whatsapp"></i> Importar do WhatsApp</h3>
                    <p class="text-muted">Cole o texto recebido ou use o modelo abaixo.</p>
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; margin-top: 10px; border-left: 4px solid #25d366;">
                        <button id="btn-copy-template" class="btn btn-secondary btn-sm" style="float: right; padding: 2px 8px; font-size: 0.7rem;">
                            <i class="fa-solid fa-copy"></i> Copiar Modelo
                        </button>
                        <small style="display: block; color: var(--text-muted); font-size: 0.75rem;"><strong>Dica:</strong> Use este modelo para garantir 100% de acerto:</small>
                        <code id="message-template" style="font-size: 0.75rem; color: #aaa;">Data: ${new Date().toLocaleDateString('pt-BR')}<br>Nome: <br>Veiculo: <br>Ano: <br>Placa: <br>KM: <br>Serviço: <br>Peças: <br>Mão de obra: </code>
                    </div>

                    <textarea id="whatsapp-text" class="form-control" rows="8" placeholder="Cole o texto aqui..." style="margin-top: 15px; font-family: monospace;"></textarea>
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                        <button id="btn-process-whatsapp" class="btn btn-primary">Processar Texto</button>
                    </div>
                </div>
            </div>
        `;

        OSModule.loadOSList();
        OSModule.bindEvents();
    },

    loadOSList: () => {
        const osList = window.StorageApp.get('os_records') || [];
        const tbody = document.getElementById('os-list-body');

        if (!tbody) return;
        tbody.innerHTML = '';

        if (osList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Nenhuma OS registrada.</td></tr>';
            return;
        }

        // Sort by newest first
        osList.sort((a, b) => new Date(b.date) - new Date(a.date));

        osList.forEach(os => {
            const tr = document.createElement('tr');

            // Status color badge
            let badgeColor = '#6c757d'; // default
            if (os.status === 'Concluída') badgeColor = '#28a745';
            if (os.status === 'Em Andamento') badgeColor = '#007bff';
            if (os.status === 'Aberta') badgeColor = '#ffc107';

            tr.innerHTML = `
                <td><strong>#${os.number}</strong></td>
                <td>${new Date(os.date).toLocaleDateString('pt-BR')}</td>
                <td>${os.clientName}</td>
                <td>${os.vehicleModel} <small>(${os.vehiclePlate})</small></td>
                <td>R$ ${parseFloat(os.values.total).toFixed(2)}</td>
                <td><span style="background-color: ${badgeColor}20; color: ${badgeColor}; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">${os.status}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm edit-os" data-id="${os.id}" title="Ver/Editar"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn btn-secondary btn-sm print-os-list" data-id="${os.id}" style="background-color: #6f42c1;" title="Imprimir"><i class="fa-solid fa-print"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.edit-os').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                OSModule.editOS(target.getAttribute('data-id'));
            });
        });

        document.querySelectorAll('.print-os-list').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                OSModule.printOS(target.getAttribute('data-id'));
            });
        });
    },

    bindEvents: () => {
        // Toggle New OS
        const btnNew = document.getElementById('btn-new-os');
        if (btnNew) {
            btnNew.addEventListener('click', () => {
                OSModule.showForm();
            });
        }

        const btnImport = document.getElementById('btn-import-whatsapp');
        if (btnImport) {
            btnImport.addEventListener('click', () => {
                document.getElementById('whatsapp-import-modal').classList.remove('hidden');
            });
        }

        const btnCloseImport = document.getElementById('close-import-modal');
        if (btnCloseImport) {
            btnCloseImport.addEventListener('click', () => {
                document.getElementById('whatsapp-import-modal').classList.add('hidden');
            });
        }

        const btnCopyTemplate = document.getElementById('btn-copy-template');
        if (btnCopyTemplate) {
            btnCopyTemplate.addEventListener('click', () => {
                const template = `Data: ${new Date().toLocaleDateString('pt-BR')}\nNome: \nVeiculo: \nAno: \nPlaca: \nKM: \nServiço: \nPeças: \nMão de obra: `;
                navigator.clipboard.writeText(template).then(() => {
                    alert('Modelo copiado! Envie WhatsApp para seu cliente ou técnico.');
                });
            });
        }

        const btnProcess = document.getElementById('btn-process-whatsapp');
        if (btnProcess) {
            btnProcess.addEventListener('click', () => {
                OSModule.processWhatsAppImport();
            });
        }

        const btnBack = document.getElementById('btn-back-os');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                OSModule.hideForm();
            });
        }

        // Manual Client Toggle
        const manualCheck = document.getElementById('os-manual-client');
        if (manualCheck) {
            manualCheck.addEventListener('change', (e) => {
                OSModule.toggleManualClient(e.target.checked);
            });
        }

        // Client Select Change
        const clientSelect = document.getElementById('os-client-select');
        if (clientSelect) {
            clientSelect.addEventListener('change', (e) => {
                OSModule.fillClientData(e.target.value);
            });
        }

        // Calculations
        document.querySelectorAll('.calc-input').forEach(input => {
            input.addEventListener('input', OSModule.calculateTotal);
        });

        // Form Submit
        const form = document.getElementById('os-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                OSModule.saveOS();
            });
        }

        // Print
        const btnPrint = document.getElementById('btn-print-os');
        if (btnPrint) {
            btnPrint.addEventListener('click', () => {
                const id = document.getElementById('os-id').value;
                if (id) OSModule.printOS(id);
            });
        }
    },

    toggleManualClient: (isManual) => {
        const selectGroup = document.getElementById('group-client-select');
        const manualGroup = document.getElementById('group-client-name-manual');

        const docInput = document.getElementById('os-client-doc');
        const phoneInput = document.getElementById('os-client-phone');
        const addressInput = document.getElementById('os-client-address');
        const select = document.getElementById('os-client-select');
        const nameInput = document.getElementById('os-client-name-manual');

        if (isManual) {
            selectGroup.classList.add('hidden');
            manualGroup.classList.remove('hidden');
            select.removeAttribute('required');
            nameInput.setAttribute('required', 'true');
            docInput.removeAttribute('readonly');
            phoneInput.removeAttribute('readonly');
            addressInput.removeAttribute('readonly');

            if (select.value !== '') {
                select.value = '';
                docInput.value = '';
                phoneInput.value = '';
                addressInput.value = '';
                document.getElementById('os-model').value = '';
                document.getElementById('os-plate').value = '';
            }
        } else {
            selectGroup.classList.remove('hidden');
            manualGroup.classList.add('hidden');
            select.setAttribute('required', 'true');
            nameInput.removeAttribute('required');
            docInput.setAttribute('readonly', 'true');
            phoneInput.setAttribute('readonly', 'true');
            addressInput.setAttribute('readonly', 'true');
            nameInput.value = '';
        }
    },

    loadSelectOptions: () => {
        // Clients
        const clients = window.StorageApp.get('clients') || [];
        const clientSelect = document.getElementById('os-client-select');
        clientSelect.innerHTML = '<option value="">Selecione um cliente...</option>';
        clients.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            clientSelect.appendChild(opt);
        });

        // Technicians
        const techs = window.StorageApp.get('technicians') || [];
        const techSelect = document.getElementById('os-tech-select');
        techSelect.innerHTML = '<option value="">Selecione...</option>';
        techs.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.name; // Storing name for simplicity in OS record
            opt.textContent = t.name;
            techSelect.appendChild(opt);
        });
    },

    fillClientData: (clientId) => {
        const clients = window.StorageApp.get('clients') || [];
        const client = clients.find(c => c.id === clientId);

        if (client) {
            document.getElementById('os-client-doc').value = client.document || '';
            document.getElementById('os-client-phone').value = client.phone || '';
            document.getElementById('os-client-address').value = client.address || '';

            // Auto fill vehicle if empty
            if (!document.getElementById('os-model').value) document.getElementById('os-model').value = client.carModel || '';
            if (!document.getElementById('os-plate').value) document.getElementById('os-plate').value = client.carPlate || '';
        } else {
            // Clear
            document.getElementById('os-client-doc').value = '';
            document.getElementById('os-client-phone').value = '';
            document.getElementById('os-client-address').value = '';
        }
    },

    calculateTotal: () => {
        const parts = parseFloat(document.getElementById('val-parts').value) || 0;
        const machine = parseFloat(document.getElementById('val-machine').value) || 0;
        const labor = parseFloat(document.getElementById('val-labor').value) || 0;
        const misc = parseFloat(document.getElementById('val-misc').value) || 0;
        const discount = parseFloat(document.getElementById('val-discount').value) || 0;

        const total = (parts + machine + labor + misc) - discount;

        document.getElementById('os-total-display').textContent = total.toFixed(2);
        return total;
    },

    showForm: (isEdit = false) => {
        document.getElementById('os-list-view').classList.add('hidden');
        document.getElementById('os-form-view').classList.remove('hidden');
        document.getElementById('btn-print-os').classList.add('hidden'); // Hide print until saved

        OSModule.loadSelectOptions();

        if (!isEdit) {
            // New OS
            document.getElementById('os-form').reset();
            document.getElementById('os-id').value = '';
            document.getElementById('os-form-title').textContent = 'Nova Ordem de Serviço';

            // Default to Select Mode
            document.getElementById('os-manual-client').checked = false;
            OSModule.toggleManualClient(false);

            // Generate next number
            const osList = window.StorageApp.get('os_records') || [];
            const currentYear = new Date().getFullYear();

            // Filter OS records for the current year and find the highest number
            const yearPrefix = currentYear.toString();
            const yearRecords = osList.filter(o => o.number && o.number.startsWith(yearPrefix));

            let nextNum;
            if (yearRecords.length > 0) {
                // Extract sequences, handles both old numeric and new YYYY.NNN formats
                const sequences = yearRecords.map(o => {
                    const parts = o.number.split('.');
                    return parts.length > 1 ? parseInt(parts[1]) : 0;
                });
                const maxSeq = Math.max(...sequences, 0);
                nextNum = `${yearPrefix}.${(maxSeq + 1).toString().padStart(3, '0')}`;
            } else {
                nextNum = `${yearPrefix}.001`;
            }

            document.getElementById('os-number').value = nextNum;
            document.getElementById('os-date').valueAsDate = new Date();
            document.getElementById('os-total-display').textContent = '0.00';
        }
    },

    processWhatsAppImport: () => {
        let text = document.getElementById('whatsapp-text').value;
        if (!text.trim()) {
            alert('Por favor, cole o texto do WhatsApp.');
            return;
        }

        // Show form first to receive data
        OSModule.showForm();

        // Refined Regex Patterns (Maximum flexibility)
        const patterns = {
            client: /(?:cliente|nome|propriet[aá]rio)\s*[:\-]?\s*([^\n\r]+)/i,
            model: /(?:ve[íi]culo|carro|modelo|veiculo)\s*[:\-]?\s*([^\n\r]+)/i,
            plate: /(?:placa|identifica[çc][ãa]o)\s*[:\-]?\s*([A-Z]{3}[-]?[0-9][A-Z0-9][0-9]{2}|[A-Z]{3}[-]?[0-9]{4})/i,
            year: /(?:ano)\s*[:\-]?\s*(\d{4})/i,
            date: /(?:data)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})/i,
            phone: /(?:telefone|whatsapp|celular|contato)\s*[:\-]?\s*([^\n\r]+)/i,
            km: /(?:km|quilometragem)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:km|quilometragem)/i,
            parts: /(?:pe[çc]as?|materiais|produtos)\s*[:\-]?\s*[R$]*\s*(\d+(?:[.,]\d{2})?)/i,
            labor: /(?:m[ãa]o de obra|servi[çc]o valor|trabalho|mo)\s*[:\-]?\s*[R$]*\s*(\d+(?:[.,]\d{2})?)/i,
            service: /(?:servi[çc]o|descri[çc][ãa]o)\s*[:\-]?\s*/i // For line cleanup only
        };

        const matches = {};
        let lines = text.split(/\r?\n/);
        let usedLineIndexes = new Set();

        // Process each pattern
        for (const key in patterns) {
            // Check all lines to see which one matches this pattern
            lines.forEach((line, index) => {
                const match = line.match(patterns[key]);
                if (match && !usedLineIndexes.has(index)) {
                    matches[key] = (match[1] || match[2] || '').trim();
                    usedLineIndexes.add(index);
                }
            });
        }

        // Fill Form
        if (matches.client) {
            const clients = window.StorageApp.get('clients') || [];
            const searchName = matches.client.toLowerCase().trim();

            const foundClient = clients.find(c => {
                const regName = c.name.toLowerCase().trim();
                return regName === searchName || regName.includes(searchName) || searchName.includes(regName);
            });

            if (foundClient) {
                document.getElementById('os-manual-client').checked = false;
                OSModule.toggleManualClient(false);
                document.getElementById('os-client-select').value = foundClient.id;
                OSModule.fillClientData(foundClient.id);
            } else {
                document.getElementById('os-manual-client').checked = true;
                OSModule.toggleManualClient(true);
                document.getElementById('os-client-name-manual').value = matches.client;
            }
        }

        if (matches.phone && !document.getElementById('os-client-phone').value) {
            document.getElementById('os-client-phone').value = matches.phone;
        }

        if (matches.model) document.getElementById('os-model').value = matches.model;
        if (matches.plate) document.getElementById('os-plate').value = matches.plate.toUpperCase();
        if (matches.year) document.getElementById('os-year').value = matches.year;
        if (matches.km) document.getElementById('os-km').value = matches.km.replace(/[.]/g, '').replace(',', '');

        // Date handling
        if (matches.date) {
            // Try to convert DD/MM/YYYY to YYYY-MM-DD
            const parts = matches.date.split(/[\/\-]/);
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                let year = parts[2];
                if (year.length === 2) year = '20' + year;
                document.getElementById('os-date').value = `${year}-${month}-${day}`;
            }
        }

        // Values
        if (matches.parts) document.getElementById('val-parts').value = matches.parts.replace(',', '.');
        if (matches.labor) document.getElementById('val-labor').value = matches.labor.replace(',', '.');

        OSModule.calculateTotal();

        // Build cleaned description using only unused lines
        const cleanedDescription = lines
            .filter((_, index) => !usedLineIndexes.has(index))
            .join('\n')
            .trim();

        document.getElementById('os-description').value = cleanedDescription;

        // Close modal
        document.getElementById('whatsapp-import-modal').classList.add('hidden');
        document.getElementById('whatsapp-text').value = '';

        alert('Dados processados! Verifique e complete as informações.');
    },

    hideForm: () => {
        document.getElementById('os-form-view').classList.add('hidden');
        document.getElementById('os-list-view').classList.remove('hidden');
        OSModule.loadOSList();
    },

    saveOS: () => {
        const id = document.getElementById('os-id').value;
        const number = document.getElementById('os-number').value;
        const date = document.getElementById('os-date').value;

        const isManual = document.getElementById('os-manual-client').checked;

        let clientId = null;
        let clientName = '';

        if (isManual) {
            clientId = 'MANUAL';
            clientName = document.getElementById('os-client-name-manual').value;
        } else {
            clientId = document.getElementById('os-client-select').value;
            clientName = document.getElementById('os-client-select').options[document.getElementById('os-client-select').selectedIndex].text;
        }

        const clientDoc = document.getElementById('os-client-doc').value;
        const clientPhone = document.getElementById('os-client-phone').value;
        const clientAddress = document.getElementById('os-client-address').value;

        // Vehicle Info
        const vehicleModel = document.getElementById('os-model').value;
        const vehicleYear = document.getElementById('os-year').value;
        const vehiclePlate = document.getElementById('os-plate').value;
        const vehicleKm = document.getElementById('os-km').value;
        const vehicleWarranty = document.getElementById('os-warranty').value;

        // Details
        const description = document.getElementById('os-description').value;

        // Values
        const valParts = parseFloat(document.getElementById('val-parts').value) || 0;
        const valMachine = parseFloat(document.getElementById('val-machine').value) || 0;
        const valLabor = parseFloat(document.getElementById('val-labor').value) || 0;
        const valMisc = parseFloat(document.getElementById('val-misc').value) || 0;
        const valDiscount = parseFloat(document.getElementById('val-discount').value) || 0;
        const descMisc = document.getElementById('desc-misc').value;
        const total = OSModule.calculateTotal();

        // General
        const techName = document.getElementById('os-tech-select').value;
        const status = document.getElementById('os-status').value;

        const osData = {
            id: id || Date.now().toString(),
            number, date,
            clientId, clientName, clientDoc, clientPhone, clientAddress, isManual,
            vehicleModel, vehicleYear, vehiclePlate, vehicleKm, vehicleWarranty,
            description,
            values: {
                parts: valParts,
                machine: valMachine,
                labor: valLabor,
                misc: valMisc,
                discount: valDiscount,
                miscDesc: descMisc,
                total: total
            },
            techName,
            status
        };

        let osRecords = window.StorageApp.get('os_records') || [];

        if (id) {
            const index = osRecords.findIndex(o => o.id === id);
            if (index !== -1) osRecords[index] = osData;
        } else {
            osRecords.push(osData);
        }

        window.StorageApp.save('os_records', osRecords);
        alert('OS Salva com sucesso!');

        // If it was a new OS, update the ID field so subsequent saves updates this record
        // And show print button
        if (!id) {
            document.getElementById('os-id').value = osData.id;
        }
        document.getElementById('btn-print-os').classList.remove('hidden');
    },

    editOS: (id) => {
        const osRecords = window.StorageApp.get('os_records') || [];
        const os = osRecords.find(o => o.id === id);

        if (os) {
            OSModule.showForm(true);
            document.getElementById('os-form-title').textContent = `Editar OS #${os.number}`;

            // Populate Fields
            document.getElementById('os-id').value = os.id;
            document.getElementById('os-number').value = os.number;
            document.getElementById('os-date').value = os.date;

            // Handle Manual vs Select
            const manualCheck = document.getElementById('os-manual-client');
            manualCheck.checked = !!os.isManual;
            OSModule.toggleManualClient(!!os.isManual);

            if (os.isManual) {
                document.getElementById('os-client-name-manual').value = os.clientName;
            } else {
                const clientSelect = document.getElementById('os-client-select');
                clientSelect.value = os.clientId;
            }

            document.getElementById('os-client-doc').value = os.clientDoc;
            document.getElementById('os-client-phone').value = os.clientPhone;
            document.getElementById('os-client-address').value = os.clientAddress;

            document.getElementById('os-model').value = os.vehicleModel;
            document.getElementById('os-year').value = os.vehicleYear;
            document.getElementById('os-plate').value = os.vehiclePlate;
            document.getElementById('os-km').value = os.vehicleKm;
            document.getElementById('os-warranty').value = os.vehicleWarranty;

            document.getElementById('os-description').value = os.description;

            document.getElementById('val-parts').value = os.values.parts || '';
            document.getElementById('val-machine').value = os.values.machine || '';
            document.getElementById('val-labor').value = os.values.labor || '';
            document.getElementById('val-misc').value = os.values.misc || '';
            document.getElementById('val-discount').value = os.values.discount || '';
            document.getElementById('desc-misc').value = os.values.miscDesc || '';

            document.getElementById('os-tech-select').value = os.techName;
            document.getElementById('os-status').value = os.status;

            OSModule.calculateTotal();
            document.getElementById('btn-print-os').classList.remove('hidden');
        }
    },

    printOS: (id) => {
        const osRecords = window.StorageApp.get('os_records') || [];
        const os = osRecords.find(o => o.id === id);
        if (!os) return;

        // Ensure values are numbers
        const parts = parseFloat(os.values.parts) || 0;
        const machine = parseFloat(os.values.machine) || 0;
        const labor = parseFloat(os.values.labor) || 0;
        const discount = parseFloat(os.values.discount) || 0;
        const misc = parseFloat(os.values.misc) || 0;
        const total = parseFloat(os.values.total) || 0;

        const printContent = `
            <div class="print-page">
                <!-- Watermark Background -->
                <div class="watermark">
                     <img src="assets/img/logo.png" alt="GDN Watermark">
                </div>

                <header class="header">
                    <div class="logo-area">
                        <img src="assets/img/logo.png" alt="GDN Serviços Automotivos">
                    </div>
                    <div class="header-info">
                        <h1>GDN SERVIÇOS AUTOMOTIVOS</h1>
                        <p class="phone">Tel: (11) 94857-9072</p>
                    </div>
                </header>

                <div class="os-title-bar">
                    ORDEM DE SERVIÇO Nº OS-${os.number}
                </div>

                <!-- Section: Client Info -->
                <section class="section">
                    <h3 class="section-title">INFORMAÇÕES DO CLIENTE</h3>
                    <div class="info-grid two-columns">
                        <div class="col">
                            <div class="field-box">
                                <label>NÚMERO DA OS</label>
                                <span>OS-${os.number}</span>
                            </div>
                            <div class="field-box">
                                <label>STATUS</label>
                                <span>${os.status}</span>
                            </div>
                            <div class="field-box">
                                <label>CLIENTE</label>
                                <span>${os.clientName}</span>
                            </div>
                            <div class="field-box">
                                <label>ENDEREÇO</label>
                                <span>${os.clientAddress || '-'}</span>
                            </div>
                        </div>
                        <div class="col">
                            <div class="field-box">
                                <label>DATA DO SERVIÇO</label>
                                <span>${new Date(os.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div class="field-box">
                                <label>TÉCNICO RESPONSÁVEL</label>
                                <span>${os.techName || '-'}</span>
                            </div>
                            <div class="field-box">
                                <label>CPF/CNPJ</label>
                                <span>${os.clientDoc || '-'}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Section: Vehicle Info -->
                <section class="section">
                    <h3 class="section-title">INFORMAÇÕES DO VEÍCULO</h3>
                    <div class="info-grid two-columns vehicle-grid">
                        <div class="col">
                            <div class="field-box">
                                <label>MODELO</label>
                                <span>${os.vehicleModel}</span>
                            </div>
                            <div class="field-box">
                                <label>PLACA</label>
                                <span>${os.vehiclePlate}</span>
                            </div>
                             <div class="field-box">
                                <label>GARANTIA</label>
                                <span>${os.vehicleWarranty ? os.vehicleWarranty + ' meses' : '-'}</span>
                            </div>
                        </div>
                        <div class="col">
                             <div class="field-box">
                                <label>ANO</label>
                                <span>${os.vehicleYear || '-'}</span>
                            </div>
                            <div class="field-box">
                                <label>KM</label>
                                <span>${os.vehicleKm || '-'}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Section: Description -->
                <section class="section">
                    <h3 class="section-title">DESCRIÇÃO DO SERVIÇO</h3>
                    <div class="description-content">
                        ${os.description ? os.description.replace(/\n/g, '<br>') : '-'}
                    </div>
                </section>

                <!-- Section: Values -->
                <section class="section">
                    <h3 class="section-title">VALORES</h3>
                    <div class="values-list">
                        <div class="value-row">
                            <span>Valor das Peças</span>
                            <span class="value">R$ ${parts.toFixed(2)}</span>
                        </div>
                        <div class="value-row">
                            <span>Valor da Retífica</span>
                            <span class="value">R$ ${machine.toFixed(2)}</span>
                        </div>
                        <div class="value-row">
                            <span>Valor da Mão de Obra</span>
                            <span class="value">R$ ${labor.toFixed(2)}</span>
                        </div>
                        ${misc > 0 ? `
                        <div class="value-row">
                            <span>Outros (${os.values.miscDesc})</span>
                            <span class="value">R$ ${misc.toFixed(2)}</span>
                        </div>` : ''}
                        ${discount > 0 ? `
                        <div class="value-row discount">
                            <span>Desconto</span>
                            <span class="value">- R$ ${discount.toFixed(2)}</span>
                        </div>` : ''}
                        <div class="value-row total">
                            <span>VALOR TOTAL</span>
                            <span class="value">R$ ${total.toFixed(2)}</span>
                        </div>
                    </div>
                </section>

                <!-- Section: Footer Info -->
                <div class="footer-info-box">
                        <span><strong>CONTATO</strong> Tel: (11) 94857-9072</span>
                        <span><strong>PAGAMENTO</strong> PIX: 56.306.502/0001-08</span>
                </div>

                <!-- Signatures -->
                <div class="signatures">
                    <div class="sig-line">
                        Assinatura do Cliente
                    </div>
                    <div class="sig-line">
                        Assinatura do Responsável
                    </div>
                </div>
                
                 <p class="terms">
                    Declaro ter conferido o veículo e os serviços realizados. A garantia cobre apenas peças e serviços descritos nesta OS.
                </p>
            </div>
        `;

        const win = window.open('', '', 'width=900,height=700');
        win.document.write(`
            <html>
            <head>
                <title>OS-${os.number}</title>
                <link rel="stylesheet" href="css/print.css">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                </style>
            </head>
            <body>
                ${printContent}
                <script>
                    window.onload = function() { setTimeout(() => window.print(), 500); }
                </script>
            </body>
            </html>
        `);
        win.document.close();
    }
};
