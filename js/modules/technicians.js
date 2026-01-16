
window.TechnicianModule = {
    render: (container) => {
        container.innerHTML = `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>Lista de Técnicos</h3>
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
                        <input type="text" id="tech-name" class="form-control" required>
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
                        <button type="submit" class="btn btn-success">Salvar</button>
                        <button type="button" id="btn-cancel-tech" class="btn btn-secondary">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        TechnicianModule.loadTechnicians();
        TechnicianModule.bindEvents();
    },

    loadTechnicians: () => {
        const techs = window.StorageApp.get('technicians') || [];
        const tbody = document.getElementById('tech-list');
        tbody.innerHTML = '';

        if (techs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Nenhum técnico cadastrado.</td></tr>';
            return;
        }

        techs.forEach(tech => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tech.name}</td>
                <td><span style="background: rgba(0,123,255,0.2); color: #00bfff; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">${tech.role}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm edit-tech" data-id="${tech.id}" style="padding: 5px 10px; font-size: 0.8rem;">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-danger btn-sm delete-tech" data-id="${tech.id}" style="padding: 5px 10px; font-size: 0.8rem;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Re-attach event listeners
        document.querySelectorAll('.edit-tech').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                TechnicianModule.editTechnician(id);
            });
        });

        document.querySelectorAll('.delete-tech').forEach(btn => {
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
        document.getElementById('tech-form-container').classList.remove('hidden');
        document.getElementById('btn-add-tech').classList.add('hidden');
        document.getElementById('form-title-tech').textContent = isEdit ? 'Editar Técnico' : 'Novo Técnico';
        document.getElementById('tech-form-container').scrollIntoView({ behavior: 'smooth' });
    },

    hideForm: () => {
        document.getElementById('tech-form-container').classList.add('hidden');
        document.getElementById('btn-add-tech').classList.remove('hidden');
        document.getElementById('tech-form').reset();
        document.getElementById('tech-id').value = '';
    },

    saveTechnician: () => {
        const id = document.getElementById('tech-id').value;
        const name = document.getElementById('tech-name').value;
        const role = document.getElementById('tech-role').value;

        let techs = window.StorageApp.get('technicians') || [];

        if (id) {
            // Update
            const index = techs.findIndex(t => t.id === id);
            if (index !== -1) {
                techs[index] = { ...techs[index], name, role };
            }
        } else {
            // Create
            const newTech = {
                id: Date.now().toString(),
                name,
                role,
                createdAt: new Date().toISOString()
            };
            techs.push(newTech);
        }

        window.StorageApp.save('technicians', techs);
        TechnicianModule.hideForm();
        TechnicianModule.loadTechnicians();
        alert('Técnico salvo com sucesso!');
    },

    editTechnician: (id) => {
        const techs = window.StorageApp.get('technicians') || [];
        const tech = techs.find(t => t.id === id);
        if (tech) {
            document.getElementById('tech-id').value = tech.id;
            document.getElementById('tech-name').value = tech.name;
            document.getElementById('tech-role').value = tech.role;

            TechnicianModule.showForm(true);
        }
    },

    deleteTechnician: (id) => {
        let techs = window.StorageApp.get('technicians') || [];
        techs = techs.filter(t => t.id !== id);
        window.StorageApp.save('technicians', techs);
        TechnicianModule.loadTechnicians();
    }
};
