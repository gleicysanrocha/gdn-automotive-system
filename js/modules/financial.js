/**
 * Financeiro: despesas e contas a receber vinculadas às Ordens de Serviço.
 * A chave fin_receivables é independente da OS para preservar o histórico
 * de pagamentos, mesmo quando o valor da OS é alterado posteriormente.
 */
window.FinancialModule = {
    currency: (value) => `R$ ${(Number(value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,

    dateLabel: (value) => {
        if (!value) return '-';
        const parts = String(value).split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
    },

    today: () => new Date().toISOString().slice(0, 10),

    /** Cria uma conta pendente para uma OS antiga quando ela ainda não foi migrada. */
    receivableFromOS: (os, existing = {}) => {
        const amount = Number(os.values?.total ?? os.totalVal) || 0;
        const paidAmount = Math.min(Number(existing.paidAmount) || 0, amount);
        const status = paidAmount >= amount && amount > 0 ? 'paid' : (existing.status === 'cancelled' ? 'cancelled' : 'pending');
        return {
            id: existing.id || `rec_${os.id}`,
            osId: os.id,
            osNumber: os.number || os.id,
            clientName: os.clientName || 'Cliente avulso',
            issueDate: os.date || FinancialModule.today(),
            dueDate: existing.dueDate || os.dueDate || os.date || FinancialModule.today(),
            amount,
            paidAmount,
            status,
            payments: existing.payments || [],
            createdAt: existing.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    getReceivables: () => {
        const stored = window.StorageApp.get('fin_receivables') || [];
        const byOS = new Map(stored.map(item => [item.osId, item]));
        const osRecords = window.StorageApp.get('os_records') || [];
        const migrated = osRecords
            .filter(os => os.id && (Number(os.values?.total ?? os.totalVal) || 0) > 0)
            .map(os => FinancialModule.receivableFromOS(os, byOS.get(os.id)));
        const orphaned = stored.filter(item => !item.osId || !osRecords.some(os => os.id === item.osId));
        return [...migrated, ...orphaned];
    },

    /** Pode ser chamado pelo módulo de OS ao salvar ou importar uma ordem. */
    syncReceivableForOS: async (os) => {
        if (!os?.id) return;
        const receivables = window.StorageApp.get('fin_receivables') || [];
        const index = receivables.findIndex(item => item.osId === os.id);
        const previous = index >= 0 ? receivables[index] : {};
        const account = FinancialModule.receivableFromOS(os, previous);
        if (index >= 0) receivables[index] = account;
        else receivables.push(account);
        await window.StorageApp.save('fin_receivables', receivables);
    },

    syncAllOS: async () => {
        const records = FinancialModule.getReceivables();
        await window.StorageApp.save('fin_receivables', records);
        FinancialModule.updateReport();
    },

    render: (container) => {
        const current = new Date();
        container.innerHTML = `
            <div class="financial-container">
                <div class="card" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
                    <div><h3><i class="fa-solid fa-money-bill-transfer"></i> Gestão Financeira</h3><p class="text-muted">Recebimentos reais, pendências e despesas.</p></div>
                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                        <input id="fin-period" class="form-control" type="month" value="${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}" style="width:auto;">
                        <button id="btn-sync-finance" class="btn btn-secondary btn-sm"><i class="fa-solid fa-rotate"></i> Sincronizar OS</button>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:15px; margin-bottom:20px;">
                    <div class="card" style="border-left:5px solid var(--success-color);"><p class="text-muted">Recebido no período</p><h2 id="fin-received">R$ 0,00</h2><small id="fin-received-count"></small></div>
                    <div class="card" style="border-left:5px solid #f0ad4e;"><p class="text-muted">A receber</p><h2 id="fin-open">R$ 0,00</h2><small id="fin-open-count"></small></div>
                    <div class="card" style="border-left:5px solid var(--danger-color);"><p class="text-muted">Vencido</p><h2 id="fin-overdue">R$ 0,00</h2><small id="fin-overdue-count"></small></div>
                    <div class="card" style="border-left:5px solid var(--primary-color);"><p class="text-muted">Resultado de caixa</p><h2 id="fin-cash-result">R$ 0,00</h2><small id="fin-expense-summary"></small></div>
                </div>
                <div style="display:grid; grid-template-columns:minmax(0, 2fr) minmax(280px, 1fr); gap:20px;">
                    <div class="card">
                        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap;"><h4>Contas a receber</h4><span class="text-muted">Clique em “Receber” para baixa total ou parcial.</span></div>
                        <div class="table-responsive"><table class="table"><thead><tr><th>OS / Cliente</th><th>Vencimento</th><th>Valor</th><th>Saldo</th><th>Situação</th><th></th></tr></thead><tbody id="fin-receivables-body"></tbody></table></div>
                    </div>
                    <div class="card"><h4><i class="fa-solid fa-plus-circle"></i> Nova despesa</h4>
                        <form id="expense-form"><div class="form-group"><label class="form-label">Descrição</label><input id="exp-desc" class="form-control" required></div>
                        <div class="form-group"><label class="form-label">Valor (R$)</label><input id="exp-val" type="number" min="0.01" step="0.01" class="form-control" required></div>
                        <div class="form-group"><label class="form-label">Data</label><input id="exp-date" type="date" class="form-control" required></div>
                        <button class="btn btn-danger" style="width:100%;justify-content:center;"><i class="fa-solid fa-plus"></i> Lançar despesa</button></form>
                        <hr style="margin:20px 0;"><h4>Despesas do período</h4><div id="fin-expenses-list" class="text-muted"></div>
                    </div>
                </div>
            </div>`;
        document.getElementById('exp-date').value = FinancialModule.today();
        FinancialModule.bindEvents();
        FinancialModule.updateReport();
    },

    bindEvents: () => {
        document.getElementById('fin-period').addEventListener('change', FinancialModule.updateReport);
        document.getElementById('btn-sync-finance').addEventListener('click', FinancialModule.syncAllOS);
        document.getElementById('expense-form').addEventListener('submit', FinancialModule.saveExpense);
    },

    saveExpense: async (event) => {
        event.preventDefault();
        const expenses = window.StorageApp.get('fin_expenses') || [];
        expenses.push({ id: `exp_${Date.now()}`, desc: document.getElementById('exp-desc').value.trim(), value: Number(document.getElementById('exp-val').value), date: document.getElementById('exp-date').value, type: 'expense' });
        await window.StorageApp.save('fin_expenses', expenses);
        event.target.reset(); document.getElementById('exp-date').value = FinancialModule.today(); FinancialModule.updateReport();
    },

    deleteExpense: async (id) => {
        if (!confirm('Excluir esta despesa?')) return;
        await window.StorageApp.save('fin_expenses', (window.StorageApp.get('fin_expenses') || []).filter(item => item.id !== id));
        FinancialModule.updateReport();
    },

    registerPayment: async (id) => {
        const receivables = FinancialModule.getReceivables();
        const account = receivables.find(item => item.id === id);
        if (!account || account.status === 'paid') return;
        const remaining = account.amount - account.paidAmount;
        const response = prompt(`Saldo em aberto: ${FinancialModule.currency(remaining)}\nInforme o valor recebido:`, remaining.toFixed(2));
        if (response === null) return;
        const amount = Number(String(response).replace(',', '.'));
        if (!Number.isFinite(amount) || amount <= 0 || amount > remaining + 0.001) return alert('Informe um valor maior que zero e até o saldo em aberto.');
        const date = prompt('Data do recebimento (AAAA-MM-DD):', FinancialModule.today());
        if (!date) return;
        account.paidAmount = Number((account.paidAmount + amount).toFixed(2));
        account.payments.push({ id: `pay_${Date.now()}`, amount, date, createdAt: new Date().toISOString() });
        account.status = account.paidAmount >= account.amount ? 'paid' : 'pending';
        await window.StorageApp.save('fin_receivables', receivables);
        FinancialModule.updateReport();
    },

    updateReport: () => {
        const period = document.getElementById('fin-period')?.value;
        if (!period) return;
        const today = FinancialModule.today();
        const receivables = FinancialModule.getReceivables().filter(item => item.status !== 'cancelled');
        const expenses = (window.StorageApp.get('fin_expenses') || []).filter(item => item.date?.startsWith(period));
        const periodPayments = receivables.flatMap(item => (item.payments || []).map(payment => ({ ...payment, account: item }))).filter(payment => payment.date?.startsWith(period));
        const received = periodPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const open = receivables.reduce((sum, item) => sum + Math.max(0, item.amount - item.paidAmount), 0);
        const overdue = receivables.filter(item => item.status !== 'paid' && item.dueDate && item.dueDate < today).reduce((sum, item) => sum + item.amount - item.paidAmount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
        document.getElementById('fin-received').textContent = FinancialModule.currency(received);
        document.getElementById('fin-received-count').textContent = `${periodPayments.length} recebimento(s)`;
        document.getElementById('fin-open').textContent = FinancialModule.currency(open);
        document.getElementById('fin-open-count').textContent = `${receivables.filter(item => item.status !== 'paid').length} conta(s) pendente(s)`;
        document.getElementById('fin-overdue').textContent = FinancialModule.currency(overdue);
        document.getElementById('fin-overdue-count').textContent = `${receivables.filter(item => item.status !== 'paid' && item.dueDate && item.dueDate < today).length} conta(s) vencida(s)`;
        document.getElementById('fin-cash-result').textContent = FinancialModule.currency(received - totalExpenses);
        document.getElementById('fin-expense-summary').textContent = `${FinancialModule.currency(totalExpenses)} em despesas no período`;

        const body = document.getElementById('fin-receivables-body');
        const visible = receivables.filter(item => item.issueDate?.startsWith(period) || item.dueDate?.startsWith(period) || item.status !== 'paid');
        body.innerHTML = visible.map(item => {
            const remaining = Math.max(0, item.amount - item.paidAmount);
            const overdueItem = item.status !== 'paid' && item.dueDate && item.dueDate < today;
            const label = item.status === 'paid' ? 'Pago' : overdueItem ? 'Vencido' : item.paidAmount > 0 ? 'Parcial' : 'Pendente';
            const color = item.status === 'paid' ? 'var(--success-color)' : overdueItem ? 'var(--danger-color)' : '#b7791f';
            return `<tr><td><strong>#${item.osNumber}</strong><br><small>${item.clientName}</small></td><td>${FinancialModule.dateLabel(item.dueDate)}</td><td>${FinancialModule.currency(item.amount)}</td><td>${FinancialModule.currency(remaining)}</td><td><span style="color:${color};font-weight:bold;">${label}</span></td><td>${item.status === 'paid' ? '-' : `<button class="btn btn-sm btn-success" onclick="FinancialModule.registerPayment('${item.id}')">Receber</button>`}</td></tr>`;
        }).join('') || '<tr><td colspan="6" class="text-center text-muted">Nenhuma conta a receber.</td></tr>';
        document.getElementById('fin-expenses-list').innerHTML = expenses.map(item => `<div style="display:flex;justify-content:space-between;gap:8px;margin:8px 0;"><span>${item.desc}<br><small>${FinancialModule.dateLabel(item.date)}</small></span><span style="white-space:nowrap;color:var(--danger-color)">${FinancialModule.currency(item.value)} <button class="btn btn-sm" onclick="FinancialModule.deleteExpense('${item.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button></span></div>`).join('') || 'Sem despesas neste período.';
    }
};
