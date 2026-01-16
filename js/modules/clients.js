
window.ClientModule = {
    render: (container) => {
        container.innerHTML = `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>Lista de Clientes</h3>
                    <button id="btn-add-client" class="btn btn-primary">
                        <i class="fa-solid fa-plus"></i> Adicionar Cliente
                    </button>
                </div>
                
                <!-- Search -->
                <div class="form-group">
                    <input type="text" id="search-client" class="form-control" placeholder="Buscar por nome, CPF ou placa...">
                </div>

                <div class="table-responsive">
                    <table class="table" id="clients-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>CPF/CNPJ</th>
                                <th>Telefone</th>
                                <th>Veículo</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="clients-list">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal / Form Container -->
            <div id="client-form-container" class="card hidden">
                <h3 id="form-title">Novo Cliente</h3>
                <form id="client-form">
                    <input type="hidden" id="client-id">
                    
                    <div class="form-group">
                        <label class="form-label">Nome Completo</label>
                        <input type="text" id="client-name" class="form-control" required>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label class="form-label">CPF / CNPJ</label>
                            <input type="text" id="client-document" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Telefone / WhatsApp</label>
                            <input type="text" id="client-phone" class="form-control" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Endereço</label>
                        <input type="text" id="client-address" class="form-control">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                         <div class="form-group">
                            <label class="form-label">Modelo do Veículo</label>
                            <input type="text" id="client-car-model" class="form-control" placeholder="Ex: Fiat Uno">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Placa</label>
                            <input type="text" id="client-car-plate" class="form-control" placeholder="ABC-1234">
                        </div>
                    </div>
                   
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="submit" class="btn btn-success">Salvar</button>
                        <button type="button" id="btn-cancel-client" class="btn btn-secondary">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        ClientModule.loadClients();
        ClientModule.bindEvents();
    },

    loadClients: () => {
        const clients = window.StorageApp.get('clients') || [];
        const tbody = document.getElementById('clients-list');
        tbody.innerHTML = '';

        if (clients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhum cliente cadastrado.</td></tr>';
            return;
        }

        clients.forEach(client => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${client.name}</td>
                <td>${client.document || '-'}</td>
                <td>${client.phone}</td>
                <td>${client.carModel} <small class="text-muted">(${client.carPlate})</small></td>
                <td>
                    <button class="btn btn-secondary btn-sm edit-client" data-id="${client.id}" style="padding: 5px 10px; font-size: 0.8rem;">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-danger btn-sm delete-client" data-id="${client.id}" style="padding: 5px 10px; font-size: 0.8rem;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Re-attach event listeners
        document.querySelectorAll('.edit-client').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                ClientModule.editClient(id);
            });
        });

        document.querySelectorAll('.delete-client').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (confirm('Tem certeza que deseja excluir este cliente?')) {
                    ClientModule.deleteClient(id);
                }
            });
        });
    },

    bindEvents: () => {
        // Toggle Form
        const btnAdd = document.getElementById('btn-add-client');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                ClientModule.showForm();
            });
        }

        const btnCancel = document.getElementById('btn-cancel-client');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                ClientModule.hideForm();
            });
        }

        // Search
        const searchInput = document.getElementById('search-client');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('#clients-list tr');
                rows.forEach(row => {
                    const text = row.innerText.toLowerCase();
                    row.style.display = text.includes(term) ? '' : 'none';
                });
            });
        }

        // Submit Form
        const form = document.getElementById('client-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                ClientModule.saveClient();
            });
        }
    },

    showForm: (isEdit = false) => {
        document.getElementById('client-form-container').classList.remove('hidden');
        document.getElementById('btn-add-client').classList.add('hidden');
        document.getElementById('form-title').textContent = isEdit ? 'Editar Cliente' : 'Novo Cliente';
        document.getElementById('client-form-container').scrollIntoView({ behavior: 'smooth' });
    },

    hideForm: () => {
        document.getElementById('client-form-container').classList.add('hidden');
        document.getElementById('btn-add-client').classList.remove('hidden');
        document.getElementById('client-form').reset();
        document.getElementById('client-id').value = '';
    },

    saveClient: () => {
        const id = document.getElementById('client-id').value;
        const name = document.getElementById('client-name').value;
        const documentVal = document.getElementById('client-document').value;
        const phone = document.getElementById('client-phone').value;
        const address = document.getElementById('client-address').value;
        const carModel = document.getElementById('client-car-model').value;
        const carPlate = document.getElementById('client-car-plate').value;

        let clients = window.StorageApp.get('clients') || [];

        if (id) {
            // Update
            const index = clients.findIndex(c => c.id === id);
            if (index !== -1) {
                clients[index] = { ...clients[index], name, document: documentVal, phone, address, carModel, carPlate };
            }
        } else {
            // Create
            const newClient = {
                id: Date.now().toString(),
                name,
                document: documentVal,
                phone,
                address,
                carModel,
                carPlate,
                createdAt: new Date().toISOString()
            };
            clients.push(newClient);
        }

        window.StorageApp.save('clients', clients);
        ClientModule.hideForm();
        ClientModule.loadClients();
        alert('Cliente salvo com sucesso!');
    },

    editClient: (id) => {
        const clients = window.StorageApp.get('clients') || [];
        const client = clients.find(c => c.id === id);
        if (client) {
            document.getElementById('client-id').value = client.id;
            document.getElementById('client-name').value = client.name;
            document.getElementById('client-document').value = client.document || '';
            document.getElementById('client-phone').value = client.phone;
            document.getElementById('client-address').value = client.address || '';
            document.getElementById('client-car-model').value = client.carModel || '';
            document.getElementById('client-car-plate').value = client.carPlate || '';

            ClientModule.showForm(true);
        }
    },

    deleteClient: (id) => {
        let clients = window.StorageApp.get('clients') || [];
        clients = clients.filter(c => c.id !== id);
        window.StorageApp.save('clients', clients);
        ClientModule.loadClients();
    }
};
