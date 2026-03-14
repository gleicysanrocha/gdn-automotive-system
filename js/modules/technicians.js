console.log('Script js/modules/technicians.js: Carregando...');

const TechnicianModule = {
    render: (container) => {
        console.log('TechnicianModule.render: Iniciando renderização no container', container);
        container.innerHTML = `
            <div class="card animate-fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3><i class="fa-solid fa-user-gear"></i> Lista de Técnicos</h3>
                    <button id="btn-add-tech" class="btn btn-primary">
                        <i class="fa-solid fa-plus"></i> Adicionar Técnico
                    </button>
                </div>
                
                <div class="table-responsive">
                    <table class="table" id="tech-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Especialidade/Cargo</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="tech-list">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal / Form Container -->
            <div id="tech-form-container" class="card hidden">
                <h3 id="form-title-tech">Novo Técnico</h3>
                <form id="tech-form">
                    <input type="hidden" id="tech-id">
                    
                    <div class="form-group">
                        <label class="form-label">Nome Completo</label>
                        <input type="text" id="tech-name" class="form-control" placeholder="Ex: João Silva" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Especialidade / Cargo</label>
                        <select id="tech-role" class="form-control">
                            <option value="Mecânico Geral">Mecânico Geral</option>
                            <option value="Eletricista">Eletricista</option>
                            <option value="Funileiro">Funileiro</option>
                            <option value="Pintor">Pintor</option>
                            <option value="Auxiliar">Auxiliar</option>
                            <option value="Gerente">Gerente</option>
                        </select>
                    </div>
                   
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="submit" class="btn btn-success" id="btn-save-tech">
                            <i class="fa-solid fa-save"></i> Salvar
                        </button>
                        <button type="button" id="btn-cancel-tech" class="btn btn-secondary">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        TechnicianModule.loadTechnicians();
        TechnicianModule.bindEvents();
    },

    loadTechnicians: () => {
        console.log('TechnicianModule.loadTechnicians: Buscando dados...');
        const techs = (window.StorageApp && window.StorageApp.get('technicians')) || [];
        const tbody = document.getElementById('tech-list');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (techs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Nenhum técnico cadastrado.</td></tr>';
            return;
        }

        techs.forEach(tech => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tech.name}</td>
                <td><span style="background: rgba(0,123,255,0.1); color: var(--primary-color); border: 1px solid rgba(0,123,255,0.2); padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">${tech.role}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm edit-tech" data-id="${tech.id}" style="padding: 5px 10px; font-size: 0.8rem;" title="Editar">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-danger btn-sm delete-tech" data-id="${tech.id}" style="padding: 5px 10px; font-size: 0.8rem;" title="Excluir">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Event Listeners for actions
        tbody.querySelectorAll('.edit-tech').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                TechnicianModule.editTechnician(id);
            });
        });

        tbody.querySelectorAll('.delete-tech').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (confirm('Tem certeza que deseja excluir este técnico?')) {
                    TechnicianModule.deleteTechnician(id);
                }
            });
        });
    },

    bindEvents: () => {
        const btnAdd = document.getElementById('btn-add-tech');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                TechnicianModule.showForm();
            });
        }

        const btnCancel = document.getElementById('btn-cancel-tech');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                TechnicianModule.hideForm();
            });
        }

        const form = document.getElementById('tech-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                TechnicianModule.saveTechnician();
            });
        }
    },

    showForm: (isEdit = false) => {
        const container = document.getElementById('tech-form-container');
        const btnAdd = document.getElementById('btn-add-tech');
        if (container) container.classList.remove('hidden');
        if (btnAdd) btnAdd.classList.add('hidden');

        const titleEl = document.getElementById('form-title-tech');
        if (titleEl) titleEl.textContent = isEdit ? 'Editar Técnico' : 'Novo Técnico';
        if (container) container.scrollIntoView({ behavior: 'smooth' });
    },

    hideForm: () => {
        const container = document.getElementById('tech-form-container');
        const btnAdd = document.getElementById('btn-add-tech');
        if (container) container.classList.add('hidden');
        if (btnAdd) btnAdd.classList.remove('hidden');

        const form = document.getElementById('tech-form');
        if (form) form.reset();
        const idField = document.getElementById('tech-id');
        if (idField) idField.value = '';
    },

    saveTechnician: async () => {
        const idField = document.getElementById('tech-id');
        const nameField = document.getElementById('tech-name');
        const roleField = document.getElementById('tech-role');

        if (!idField || !nameField || !roleField) return;

        const id = idField.value;
        const name = nameField.value;
        const role = roleField.value;
        const btn = document.getElementById('btn-save-tech');

        if (!name.trim()) {
            alert('Por favor, preencha o nome do técnico.');
            return;
        }

        let techs = (window.StorageApp && window.StorageApp.get('technicians')) || [];

        try {
            if (btn) btn.disabled = true;

            if (id) {
                // Atualizar
                const index = techs.findIndex(t => t.id === id);
                if (index !== -1) {
                    techs[index] = { ...techs[index], name, role };
                }
            } else {
                // Criar novo
                const newTech = {
                    id: Date.now().toString(),
                    name,
                    role,
                    createdAt: new Date().toISOString()
                };
                techs.push(newTech);
            }

            const success = await window.StorageApp.save('technicians', techs);

            if (success) {
                TechnicianModule.hideForm();
                TechnicianModule.loadTechnicians();
                console.log('Técnico salvo com sucesso.');
            } else {
                throw new Error('Falha ao salvar no Storage.');
            }
        } catch (error) {
            console.error('Erro ao salvar técnico:', error);
            alert('Erro ao salvar técnico. Tente novamente.');
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    editTechnician: (id) => {
        const techs = (window.StorageApp && window.StorageApp.get('technicians')) || [];
        const tech = techs.find(t => t.id === id);
        if (tech) {
            document.getElementById('tech-id').value = tech.id;
            document.getElementById('tech-name').value = tech.name;
            document.getElementById('tech-role').value = tech.role;

            TechnicianModule.showForm(true);
        }
    },

    deleteTechnician: async (id) => {
        try {
            let techs = (window.StorageApp && window.StorageApp.get('technicians')) || [];
            techs = techs.filter(t => t.id !== id);
            const success = await window.StorageApp.save('technicians', techs);
            if (success) {
                TechnicianModule.loadTechnicians();
            }
        } catch (error) {
            console.error('Erro ao excluir técnico:', error);
            alert('Erro ao excluir técnico.');
        }
    }
};

window.TechnicianModule = TechnicianModule;
console.log('Script js/modules/technicians.js: Carregado com sucesso conforme window.TechnicianModule', window.TechnicianModule);
