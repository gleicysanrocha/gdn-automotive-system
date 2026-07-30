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
        
        let paidAmount = Number(existing.paidAmount) || 0;
        let payments = existing.payments || [];
        let status = existing.status || 'pending';

        if (os.paymentStatus === 'Pago') {
            paidAmount = amount;
            status = 'paid';
            if (payments.length === 0 && amount > 0) {
                payments = [{
                    id: `pay_auto_${Date.now()}`,
                    amount: amount,
                    date: os.date || new Date().toISOString().slice(0, 10),
                    createdAt: new Date().toISOString()
                }];
            }
        } else if (os.paymentStatus === 'Pago Parcialmente') {
            const osValPaid = Number(os.valPaid) || 0;
            paidAmount = osValPaid;
            status = paidAmount >= amount && amount > 0 ? 'paid' : 'pending';
            if (payments.length === 0 && osValPaid > 0) {
                payments = [{
                    id: `pay_auto_${Date.now()}`,
                    amount: osValPaid,
                    date: os.date || new Date().toISOString().slice(0, 10),
                    createdAt: new Date().toISOString()
                }];
            } else if (payments.length > 0 && osValPaid > 0) {
                const autoPay = payments.find(p => p.id.startsWith('pay_auto_'));
                if (autoPay) {
                    autoPay.amount = osValPaid;
                }
            }
        } else {
            payments = payments.filter(p => !p.id.startsWith('pay_auto_'));
            paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
            status = paidAmount >= amount && amount > 0 ? 'paid' : (existing.status === 'cancelled' ? 'cancelled' : 'pending');
        }

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
            payments,
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
                    <div class="card" style="border-radius: var(--card-radius); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; background: #ffffff;">
                        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom: 20px;">
                            <h4 style="margin: 0; font-size: 1.15rem; font-weight: 600; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
                                <i class="fa-solid fa-list-check" style="color: var(--primary-color);"></i> Contas a receber
                            </h4>
                            <span class="text-muted" style="font-size: 0.85rem;"><i class="fa-solid fa-info-circle"></i> Clique em “Receber” para baixa total ou parcial.</span>
                        </div>
                        <div class="table-responsive">
                            <table class="table" style="vertical-align: middle; border-collapse: separate; border-spacing: 0 8px; width: 100%;">
                                <thead>
                                    <tr style="background: transparent;">
                                        <th style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">OS / Cliente</th>
                                        <th style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">Vencimento</th>
                                        <th style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">Valor</th>
                                        <th style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">Saldo</th>
                                        <th style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">Situação</th>
                                        <th style="border: none; padding-bottom: 12px; width: 150px;"></th>
                                    </tr>
                                </thead>
                                <tbody id="fin-receivables-body">
                                </tbody>
                            </table>
                        </div>
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

        // Sincroniza de volta com o registro da OS
        if (account.osId) {
            const osRecords = window.StorageApp.get('os_records') || [];
            const osIndex = osRecords.findIndex(o => o.id === account.osId);
            if (osIndex !== -1) {
                const os = osRecords[osIndex];
                if (account.status === 'paid') {
                    os.paymentStatus = 'Pago';
                    os.valPaid = account.amount;
                } else {
                    os.paymentStatus = 'Pago Parcialmente';
                    os.valPaid = account.paidAmount;
                }
                await window.StorageApp.save('os_records', osRecords);
            }
        }

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
            
            let statusBadge = '';
            if (item.status === 'paid') {
                statusBadge = `<span class="badge" style="background: rgba(40, 167, 69, 0.1); color: #28a745; border: 1px solid rgba(40, 167, 69, 0.2); padding: 5px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 4px; min-width: 95px; justify-content: center;"><i class="fa-solid fa-circle-check"></i> Pago</span>`;
            } else if (overdueItem) {
                statusBadge = `<span class="badge" style="background: rgba(220, 53, 69, 0.1); color: #dc3545; border: 1px solid rgba(220, 53, 69, 0.2); padding: 5px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 4px; min-width: 95px; justify-content: center;"><i class="fa-solid fa-triangle-exclamation"></i> Vencido</span>`;
            } else if (item.paidAmount > 0) {
                statusBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.1); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.2); padding: 5px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 4px; min-width: 95px; justify-content: center;"><i class="fa-solid fa-chart-pie"></i> Parcial</span>`;
            } else {
                statusBadge = `<span class="badge" style="background: rgba(234, 179, 8, 0.1); color: #ca8a04; border: 1px solid rgba(234, 179, 8, 0.2); padding: 5px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 4px; min-width: 95px; justify-content: center;"><i class="fa-solid fa-clock"></i> Pendente</span>`;
            }

            return `<tr style="background: #ffffff; transition: background 0.2s ease;" onmouseover="this.style.background='#f8fafc';" onmouseout="this.style.background='#ffffff';">
                <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                    <span class="badge" style="background: rgba(0, 123, 255, 0.08); color: #007bff; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-family: monospace; font-size: 0.85rem; border: 1px solid rgba(0, 123, 255, 0.15);">#${item.osNumber}</span>
                    <div style="font-weight: 600; color: var(--text-color); margin-top: 6px; font-size: 0.95rem;">${item.clientName}</div>
                </td>
                <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                    ${overdueItem ? `<span style="color: var(--danger-color); font-weight: 600; display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem;"><i class="fa-regular fa-clock"></i> ${FinancialModule.dateLabel(item.dueDate)}</span>` : `<span style="color: var(--text-muted); font-weight: 500; display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem;"><i class="fa-regular fa-calendar"></i> ${FinancialModule.dateLabel(item.dueDate)}</span>`}
                </td>
                <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; font-weight: 600; color: var(--text-color); font-size: 0.95rem;">
                    ${FinancialModule.currency(item.amount)}
                </td>
                <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                    ${remaining > 0 ? `<span style="font-weight: bold; color: ${overdueItem ? 'var(--danger-color)' : '#d97706'}; font-size: 0.95rem;">${FinancialModule.currency(remaining)}</span>` : `<span style="color: var(--text-muted); font-size: 0.9rem;">-</span>`}
                </td>
                <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                    ${statusBadge}
                </td>
                <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; text-align: right;">
                    ${item.status === 'paid' ? `<span style="color: var(--success-color); font-weight: bold; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 4px; padding-right: 10px;"><i class="fa-solid fa-check"></i> Completo</span>` : `<button class="btn btn-sm btn-success" style="background-color: #28a745; border-color: #28a745; border-radius: 6px; font-weight: bold; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(40, 167, 69, 0.15); transition: all 0.2s; cursor: pointer; border: none; color: white;" onmouseover="this.style.backgroundColor='#218838'; this.style.transform='translateY(-1px)';" onmouseout="this.style.backgroundColor='#28a745'; this.style.transform='none';" onclick="FinancialModule.registerPayment('${item.id}')"><i class="fa-solid fa-hand-holding-dollar"></i> Receber</button>`}
                </td>
            </tr>`;
        }).join('') || '<tr><td colspan="6" style="padding: 30px; text-align: center; color: #94a3b8;"><i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #cbd5e1;"></i> Nenhuma conta a receber neste período.</td></tr>';
        document.getElementById('fin-expenses-list').innerHTML = expenses.map(item => `<div style="display:flex;justify-content:space-between;gap:8px;margin:8px 0;"><span>${item.desc}<br><small>${FinancialModule.dateLabel(item.date)}</small></span><span style="white-space:nowrap;color:var(--danger-color)">${FinancialModule.currency(item.value)} <button class="btn btn-sm" onclick="FinancialModule.deleteExpense('${item.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button></span></div>`).join('') || 'Sem despesas neste período.';
    }
};
