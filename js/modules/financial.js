
window.FinancialModule = {
    render: (container) => {
        const currentDate = new Date();
        const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const currentYear = currentDate.getFullYear().toString();

        container.innerHTML = `
            <div class="financial-container">
                <!-- Filters & Header -->
                <div class="card" style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                        <div>
                            <h3><i class="fa-solid fa-money-bill-transfer"></i> Gestão Financeira</h3>
                            <p class="text-muted">Acompanhe seu faturamento e lance despesas.</p>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <select id="fin-month" class="form-control" style="width: auto;">
                                <option value="01" ${currentMonth === '01' ? 'selected' : ''}>Janeiro</option>
                                <option value="02" ${currentMonth === '02' ? 'selected' : ''}>Fevereiro</option>
                                <option value="03" ${currentMonth === '03' ? 'selected' : ''}>Março</option>
                                <option value="04" ${currentMonth === '04' ? 'selected' : ''}>Abril</option>
                                <option value="05" ${currentMonth === '05' ? 'selected' : ''}>Maio</option>
                                <option value="06" ${currentMonth === '06' ? 'selected' : ''}>Junho</option>
                                <option value="07" ${currentMonth === '07' ? 'selected' : ''}>Julho</option>
                                <option value="08" ${currentMonth === '08' ? 'selected' : ''}>Agosto</option>
                                <option value="09" ${currentMonth === '09' ? 'selected' : ''}>Setembro</option>
                                <option value="10" ${currentMonth === '10' ? 'selected' : ''}>Outubro</option>
                                <option value="11" ${currentMonth === '11' ? 'selected' : ''}>Novembro</option>
                                <option value="12" ${currentMonth === '12' ? 'selected' : ''}>Dezembro</option>
                            </select>
                            <input type="number" id="fin-year" class="form-control" style="width: 100px;" value="${currentYear}">
                        </div>
                    </div>
                </div>

                <!-- Metrics Grid -->
                <div class="financial-summary-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 20px;">
                    <div class="card" style="border-left: 5px solid var(--primary-color);">
                        <p class="text-muted" style="margin-bottom: 5px;">Receita Bruta (OS)</p>
                        <h2 id="fin-total-revenue" style="color: var(--primary-color);">R$ 0,00</h2>
                        <small id="fin-revenue-count">0 ordens</small>
                    </div>
                    <div class="card" style="border-left: 5px solid var(--danger-color);">
                        <p class="text-muted" style="margin-bottom: 5px;">Despesas Totais</p>
                        <h2 id="fin-total-expenses" style="color: var(--danger-color);">R$ 0,00</h2>
                        <small id="fin-expenses-count">0 lançamentos</small>
                    </div>
                    <div class="card" style="border-left: 5px solid var(--success-color);">
                        <p class="text-muted" style="margin-bottom: 5px;">Lucro Líquido</p>
                        <h2 id="fin-total-profit" style="color: var(--success-color);">R$ 0,00</h2>
                        <small id="fin-profit-margin">Margem: 0%</small>
                    </div>
                </div>

                <!-- Charts Area -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="card">
                        <h4>Faturamento vs Despesas</h4>
                        <div style="height: 250px;"><canvas id="chart-revenue-expense"></canvas></div>
                    </div>
                    <div class="card">
                        <h4>Distribuição de Receita</h4>
                        <div style="height: 250px;"><canvas id="chart-revenue-pie"></canvas></div>
                    </div>
                </div>

                <!-- Expenses & List -->
                <div style="display: grid; grid-template-columns: 350px 1fr; gap: 20px;">
                    <div class="card">
                        <h4><i class="fa-solid fa-plus-circle"></i> Novo Gasto</h4>
                        <form id="expense-form">
                            <div class="form-group">
                                <label class="form-label">Descrição</label>
                                <input type="text" id="exp-desc" class="form-control" placeholder="Ex: Aluguel" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Valor (R$)</label>
                                <input type="number" step="0.01" id="exp-val" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Categoria</label>
                                <select id="exp-cat" class="form-control">
                                    <option value="Fixo">Fixo (Aluguel, Luz, etc)</option>
                                    <option value="Peças">Compra de Peças</option>
                                    <option value="Marketing">Marketing / Divulgação</option>
                                    <option value="Equipamentos">Equipamentos / Ferramentas</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Data</label>
                                <input type="date" id="exp-date" class="form-control" required>
                            </div>
                            <button type="submit" class="btn btn-danger" style="width: 100%; justify-content: center;">
                                <i class="fa-solid fa-plus"></i> Lançar Despesa
                            </button>
                        </form>
                    </div>

                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h4>Histórico do Período</h4>
                            <button id="btn-export-pdf" class="btn btn-secondary btn-sm" style="background: #333;"><i class="fa-solid fa-file-pdf"></i> Exportar</button>
                        </div>
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Descrição</th>
                                        <th>Data</th>
                                        <th>Valor</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody id="fin-history-body"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('exp-date').valueAsDate = new Date();
        FinancialModule.bindEvents();
        FinancialModule.updateReport();
    },

    bindEvents: () => {
        document.getElementById('fin-month').addEventListener('change', FinancialModule.updateReport);
        document.getElementById('fin-year').addEventListener('input', FinancialModule.updateReport);
        document.getElementById('expense-form').addEventListener('submit', FinancialModule.saveExpense);
        document.getElementById('btn-export-pdf').addEventListener('click', () => alert('Funcionalidade de PDF sendo preparada para a próxima atualização!'));
    },

    saveExpense: (e) => {
        e.preventDefault();
        const expense = {
            id: Date.now().toString(),
            desc: document.getElementById('exp-desc').value,
            value: parseFloat(document.getElementById('exp-val').value),
            category: document.getElementById('exp-cat').value,
            date: document.getElementById('exp-date').value,
            type: 'expense'
        };

        const expenses = window.StorageApp.get('fin_expenses') || [];
        expenses.push(expense);
        window.StorageApp.save('fin_expenses', expenses);

        document.getElementById('expense-form').reset();
        document.getElementById('exp-date').valueAsDate = new Date();
        FinancialModule.updateReport();
    },

    deleteExpense: (id) => {
        if (!confirm('Excluir este lançamento?')) return;
        let expenses = window.StorageApp.get('fin_expenses') || [];
        expenses = expenses.filter(e => e.id !== id);
        window.StorageApp.save('fin_expenses', expenses);
        FinancialModule.updateReport();
    },

    updateReport: () => {
        const month = document.getElementById('fin-month').value;
        const year = document.getElementById('fin-year').value;

        const osRecords = window.StorageApp.get('os_records') || [];
        const expenses = window.StorageApp.get('fin_expenses') || [];

        const filteredOS = osRecords.filter(os => {
            const d = new Date(os.date);
            return (d.getMonth() + 1).toString().padStart(2, '0') === month && d.getFullYear().toString() === year;
        });

        const filteredExp = expenses.filter(exp => {
            const d = new Date(exp.date);
            return (d.getMonth() + 1).toString().padStart(2, '0') === month && d.getFullYear().toString() === year;
        });

        // Totals
        const totalRevenue = filteredOS.reduce((acc, os) => acc + (parseFloat(os.values.total) || 0), 0);
        const totalExp = filteredExp.reduce((acc, exp) => acc + exp.value, 0);
        const profit = totalRevenue - totalExp;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        // UI Updates
        document.getElementById('fin-total-revenue').textContent = `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('fin-revenue-count').textContent = `${filteredOS.length} ordens de serviço`;

        document.getElementById('fin-total-expenses').textContent = `R$ ${totalExp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('fin-expenses-count').textContent = `${filteredExp.length} lançamentos de gasto`;

        document.getElementById('fin-total-profit').textContent = `R$ ${profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('fin-profit-margin').textContent = `Margem Líquida: ${margin.toFixed(1)}%`;
        document.getElementById('fin-total-profit').style.color = profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)';

        // History Table
        const historyBody = document.getElementById('fin-history-body');
        const allEvents = [
            ...filteredOS.map(os => ({ id: os.id, desc: `OS #${os.number} - ${os.clientName}`, value: parseFloat(os.values.total), date: os.date, type: 'revenue' })),
            ...filteredExp.map(exp => ({ ...exp, value: exp.value * -1 }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        historyBody.innerHTML = allEvents.map(ev => `
            <tr>
                <td><span class="badge" style="background: ${ev.type === 'revenue' ? 'var(--success-color)' : 'var(--danger-color)'}; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">${ev.type === 'revenue' ? 'OS' : 'GASTO'}</span></td>
                <td>${ev.desc}</td>
                <td>${new Date(ev.date).toLocaleDateString('pt-BR')}</td>
                <td style="color: ${ev.type === 'revenue' ? 'var(--success-color)' : 'var(--danger-color)'}; font-weight: bold;">R$ ${Math.abs(ev.value).toFixed(2)}</td>
                <td>${ev.type === 'expense' ? `<button class="btn btn-sm" onclick="FinancialModule.deleteExpense('${ev.id}')" style="color: var(--danger-color); padding: 0;"><i class="fa-solid fa-trash"></i></button>` : '-'}</td>
            </tr>
        `).join('');

        if (allEvents.length === 0) historyBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Vazio.</td></tr>';

        // Render Charts
        FinancialModule.renderCharts(filteredOS, filteredExp);
    },

    renderCharts: (os, exp) => {
        // Bar Chart
        const ctxBar = document.getElementById('chart-revenue-expense');
        if (ctxBar) {
            new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: ['Faturamento', 'Despesas'],
                    datasets: [{
                        data: [
                            os.reduce((acc, o) => acc + (parseFloat(o.values.total) || 0), 0),
                            exp.reduce((acc, e) => acc + e.value, 0)
                        ],
                        backgroundColor: ['rgba(0, 123, 255, 0.6)', 'rgba(220, 53, 69, 0.6)']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }

        // Pie Chart
        const parts = os.reduce((acc, o) => acc + (parseFloat(o.values.parts) || 0), 0);
        const labor = os.reduce((acc, o) => acc + (parseFloat(o.values.labor) || 0), 0);
        const others = os.reduce((acc, o) => acc + (parseFloat(o.values.total) || 0) - (parseFloat(o.values.parts) || 0) - (parseFloat(o.values.labor) || 0), 0);

        const ctxPie = document.getElementById('chart-revenue-pie');
        if (ctxPie) {
            new Chart(ctxPie, {
                type: 'doughnut',
                data: {
                    labels: ['Peças', 'Mão de Obra', 'Outros'],
                    datasets: [{
                        data: [parts, labor, others],
                        backgroundColor: ['#ffc107', '#6f42c1', '#17a2b8']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
};
