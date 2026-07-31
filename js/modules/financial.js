/**
 * Financeiro: despesas e contas a receber vinculadas às Ordens de Serviço.
 * A chave fin_receivables é independente da OS para preservar o histórico
 * de pagamentos, mesmo quando o valor da OS é alterado posteriormente.
 */
window.FinancialModule = {
    sortColumn: 'dueDate',
    sortDirection: 'desc',
    cashFlowChart: null,
    categoriesChart: null,
    activeTab: 'receivables',

    setSort: (col) => {
        if (window.FinancialModule.sortColumn === col) {
            window.FinancialModule.sortDirection = window.FinancialModule.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            window.FinancialModule.sortColumn = col;
            window.FinancialModule.sortDirection = 'desc';
        }
        window.FinancialModule.updateReport();
    },

    getSortIcon: (col) => {
        if (window.FinancialModule.sortColumn !== col) {
            return ' <i class="fa-solid fa-sort" style="color: #cbd5e1; font-size: 0.75rem; margin-left: 4px; opacity: 0.6;"></i>';
        }
        if (window.FinancialModule.sortDirection === 'asc') {
            return ' <i class="fa-solid fa-sort-up" style="color: var(--primary-color); font-size: 0.85rem; margin-left: 4px; vertical-align: middle;"></i>';
        }
        return ' <i class="fa-solid fa-sort-down" style="color: var(--primary-color); font-size: 0.85rem; margin-left: 4px; vertical-align: middle;"></i>';
    },

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
                    date: os.date || window.FinancialModule.today(),
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
                    date: os.date || window.FinancialModule.today(),
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
            issueDate: os.date || window.FinancialModule.today(),
            dueDate: existing.dueDate || os.dueDate || os.date || window.FinancialModule.today(),
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
            .map(os => window.FinancialModule.receivableFromOS(os, byOS.get(os.id)));
        const orphaned = stored.filter(item => !item.osId || !osRecords.some(os => os.id === item.osId));
        return [...migrated, ...orphaned];
    },

    /** Pode ser chamado pelo módulo de OS ao salvar ou importar uma ordem. */
    syncReceivableForOS: async (os) => {
        if (!os?.id) return;
        const receivables = window.StorageApp.get('fin_receivables') || [];
        const index = receivables.findIndex(item => item.osId === os.id);
        const previous = index >= 0 ? receivables[index] : {};
        const account = window.FinancialModule.receivableFromOS(os, previous);
        if (index >= 0) receivables[index] = account;
        else receivables.push(account);
        await window.StorageApp.save('fin_receivables', receivables);
    },

    syncAllOS: async () => {
        const records = window.FinancialModule.getReceivables();
        await window.StorageApp.save('fin_receivables', records);
        window.FinancialModule.updateReport();
    },

    render: (container) => {
        const current = new Date();
        container.innerHTML = `
            <div class="financial-container">
                <!-- Header Card -->
                <div class="card" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
                    <div>
                        <h3><i class="fa-solid fa-money-bill-transfer"></i> Gestão Financeira Profissional</h3>
                        <p class="text-muted">Acompanhe fluxo de caixa, DRE, exportações e notas fiscais emitidas no mês.</p>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                        <input id="fin-period" class="form-control" type="month" value="${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}" style="width:auto;">
                        <button id="btn-sync-finance" class="btn btn-secondary btn-sm"><i class="fa-solid fa-rotate"></i> Sincronizar OS</button>
                        <button id="btn-export-excel" class="btn btn-sm btn-success" style="background-color: #217346; border-color: #1e6b3f; color:white; font-weight:bold;"><i class="fa-solid fa-file-excel"></i> Exportar Excel</button>
                        <button id="btn-generate-dre" class="btn btn-sm btn-primary" style="font-weight:bold;"><i class="fa-solid fa-file-invoice-dollar"></i> Gerar DRE</button>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:15px; margin-bottom:20px;">
                    <div class="card" style="border-left:5px solid #6c757d;"><p class="text-muted">Faturamento Total Recebido</p><h2 id="fin-received">R$ 0,00</h2><small id="fin-received-count"></small></div>
                    <div class="card" style="border-left:5px solid var(--success-color);"><p class="text-muted">Minha Mão de Obra Recebida</p><h2 id="fin-labor-received">R$ 0,00</h2><small id="fin-labor-ratio"></small></div>
                    <div class="card" style="border-left:5px solid #fd7e14;"><p class="text-muted">Custos de Terceiros (Peças/Retífica)</p><h2 id="fin-outsourced-received">R$ 0,00</h2><small id="fin-outsourced-ratio"></small></div>
                    <div class="card" style="border-left:5px solid var(--danger-color);"><p class="text-muted">Lucro Real (M.O. - Despesas)</p><h2 id="fin-cash-result">R$ 0,00</h2><small id="fin-expense-summary"></small></div>
                </div>

                <!-- Charts Section -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 20px;">
                    <div class="card" style="position: relative; min-height: 280px; display:flex; flex-direction:column; justify-content:space-between;">
                        <h4 style="margin-bottom:10px;"><i class="fa-solid fa-chart-column"></i> Entradas vs Saídas</h4>
                        <div style="flex-grow:1; position: relative; height: 180px;"><canvas id="fin-chart-cashflow"></canvas></div>
                    </div>
                    <div class="card" style="position: relative; min-height: 280px; display:flex; flex-direction:column; justify-content:space-between;">
                        <h4 style="margin-bottom:10px;"><i class="fa-solid fa-chart-pie"></i> Despesas por Categoria</h4>
                        <div style="flex-grow:1; position: relative; height: 180px;"><canvas id="fin-chart-categories"></canvas></div>
                    </div>
                </div>

                <!-- Tables and Expense Form Section -->
                <div style="display:grid; grid-template-columns:minmax(0, 2fr) minmax(300px, 1fr); gap:20px;">
                    <div class="card" style="border-radius: var(--card-radius); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; background: #ffffff;">
                        <!-- Tab Header Navigation -->
                        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom: 20px; border-bottom:1px solid var(--border-color); padding-bottom:12px;">
                            <div style="display:flex; gap:12px;">
                                <button id="tab-receivables" class="btn btn-sm" style="font-weight:bold; background:var(--primary-color); color:white; border:none; padding: 6px 14px; border-radius:6px; cursor:pointer;">Contas a Receber</button>
                                <button id="tab-invoices" class="btn btn-sm" style="font-weight:bold; background:#e9ecef; color:var(--text-color); border:none; padding: 6px 14px; border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:6px;">Notas Fiscais (NFS-e) <span id="fin-invoice-count-badge" class="badge" style="background:#6c757d; color:white; font-size:0.75rem; padding: 2px 6px; border-radius:10px;">0</span></button>
                            </div>
                            <span id="tab-helper-text" class="text-muted" style="font-size: 0.85rem;"><i class="fa-solid fa-info-circle"></i> Clique em “Receber” para baixa total ou parcial.</span>
                        </div>
                        
                        <!-- Table wrappers -->
                        <div class="table-responsive" id="receivables-table-wrapper">
                            <!-- Contas a receber content -->
                        </div>
                        <div class="table-responsive hidden" id="invoices-table-wrapper">
                            <!-- Notas fiscais content -->
                        </div>
                    </div>
                    
                    <div class="card">
                        <h4><i class="fa-solid fa-plus-circle"></i> Nova despesa</h4>
                        <form id="expense-form">
                            <div class="form-group">
                                <label class="form-label">Descrição</label>
                                <input id="exp-desc" class="form-control" placeholder="Combustível, Aluguel, etc." required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Categoria</label>
                                <select id="exp-category" class="form-control" required>
                                    <option value="Peças">Peças</option>
                                    <option value="Mão de Obra">Mão de Obra</option>
                                    <option value="Aluguel/Infraestrutura">Aluguel/Infraestrutura</option>
                                    <option value="Luz/Água/Internet">Luz/Água/Internet</option>
                                    <option value="Impostos/Taxas">Impostos/Taxas</option>
                                    <option value="Ferramentas/Equipamentos">Ferramentas/Equipamentos</option>
                                    <option value="Marketing/Anúncios">Marketing/Anúncios</option>
                                    <option value="Outros" selected>Outros</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Valor (R$)</label>
                                <input id="exp-val" type="number" min="0.01" step="0.01" class="form-control" placeholder="0.00" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Data</label>
                                <input id="exp-date" type="date" class="form-control" required>
                            </div>
                            <button class="btn btn-danger" style="width:100%;justify-content:center;"><i class="fa-solid fa-plus"></i> Lançar despesa</button>
                        </form>
                        <hr style="margin:20px 0;">
                        <h4>Despesas do período</h4>
                        <div id="fin-expenses-list" class="text-muted"></div>
                    </div>
                </div>
            </div>`;
        document.getElementById('exp-date').value = window.FinancialModule.today();
        window.FinancialModule.bindEvents();
        window.FinancialModule.updateReport();
    },

    bindEvents: () => {
        document.getElementById('fin-period').addEventListener('change', window.FinancialModule.updateReport);
        document.getElementById('btn-sync-finance').addEventListener('click', window.FinancialModule.syncAllOS);
        document.getElementById('btn-export-excel').addEventListener('click', window.FinancialModule.exportToExcel);
        document.getElementById('btn-generate-dre').addEventListener('click', window.FinancialModule.generateDRE);
        document.getElementById('expense-form').addEventListener('submit', window.FinancialModule.saveExpense);

        // Bind tab buttons
        document.getElementById('tab-receivables').onclick = () => {
            window.FinancialModule.activeTab = 'receivables';
            document.getElementById('tab-receivables').style.background = 'var(--primary-color)';
            document.getElementById('tab-receivables').style.color = 'white';
            document.getElementById('tab-invoices').style.background = '#e9ecef';
            document.getElementById('tab-invoices').style.color = 'var(--text-color)';
            
            document.getElementById('receivables-table-wrapper').classList.remove('hidden');
            document.getElementById('invoices-table-wrapper').classList.add('hidden');
            document.getElementById('tab-helper-text').innerHTML = '<i class="fa-solid fa-info-circle"></i> Clique em “Receber” para baixa total ou parcial.';
        };

        document.getElementById('tab-invoices').onclick = () => {
            window.FinancialModule.activeTab = 'invoices';
            document.getElementById('tab-invoices').style.background = 'var(--primary-color)';
            document.getElementById('tab-invoices').style.color = 'white';
            document.getElementById('tab-receivables').style.background = '#e9ecef';
            document.getElementById('tab-receivables').style.color = 'var(--text-color)';
            
            document.getElementById('receivables-table-wrapper').classList.add('hidden');
            document.getElementById('invoices-table-wrapper').classList.remove('hidden');
            document.getElementById('tab-helper-text').innerHTML = '<i class="fa-solid fa-file-invoice"></i> Controle mensal de NFS-e emitidas.';
        };
    },

    saveExpense: async (event) => {
        event.preventDefault();
        const expenses = window.StorageApp.get('fin_expenses') || [];
        expenses.push({ 
            id: `exp_${Date.now()}`, 
            desc: document.getElementById('exp-desc').value.trim(), 
            category: document.getElementById('exp-category').value,
            value: Number(document.getElementById('exp-val').value), 
            date: document.getElementById('exp-date').value, 
            type: 'expense' 
        });
        await window.StorageApp.save('fin_expenses', expenses);
        event.target.reset(); 
        document.getElementById('exp-date').value = window.FinancialModule.today(); 
        window.FinancialModule.updateReport();
    },

    deleteExpense: async (id) => {
        if (!confirm('Excluir esta despesa?')) return;
        await window.StorageApp.save('fin_expenses', (window.StorageApp.get('fin_expenses') || []).filter(item => item.id !== id));
        window.FinancialModule.updateReport();
    },

    exportToExcel: () => {
        const period = document.getElementById('fin-period')?.value || 'Relatorio';
        const receivables = window.FinancialModule.getReceivables().filter(item => item.status !== 'cancelled');
        const expenses = window.StorageApp.get('fin_expenses') || [];
        const osRecords = window.StorageApp.get('os_records') || [];
        const osMap = new Map(osRecords.map(os => [os.id, os]));

        // Recebiveis data
        const recData = receivables.map(item => {
            const os = osMap.get(item.osId);
            const labor = os && os.values ? Number(os.values.labor) || 0 : 0;
            const parts = os && os.values ? Number(os.values.parts) || 0 : 0;
            const machine = os && os.values ? Number(os.values.machine) || 0 : 0;

            return {
                "OS": `#${item.osNumber}`,
                "Cliente": item.clientName,
                "Data Emissão": window.FinancialModule.dateLabel(item.issueDate),
                "Vencimento": window.FinancialModule.dateLabel(item.dueDate),
                "Valor Total": item.amount,
                "Mão de Obra (Parte Oficina)": labor,
                "Peças (Terceiros)": parts,
                "Retífica (Terceiros)": machine,
                "Valor Pago": item.paidAmount,
                "Saldo Restante": Math.max(0, item.amount - item.paidAmount),
                "Situação": item.status === 'paid' ? 'Pago' : (item.paidAmount > 0 ? 'Parcial' : 'Pendente')
            };
        });

        // Despesas data
        const expData = expenses.map(item => ({
            "Descrição": item.desc,
            "Categoria": item.category || 'Outros',
            "Data": window.FinancialModule.dateLabel(item.date),
            "Valor": item.value
        }));

        if (typeof XLSX === 'undefined') {
            alert('Aguarde o carregamento do gerador de arquivos XLSX do Excel.');
            return;
        }

        const wb = XLSX.utils.book_new();
        const wsRec = XLSX.utils.json_to_sheet(recData);
        const wsExp = XLSX.utils.json_to_sheet(expData);

        XLSX.utils.book_append_sheet(wb, wsRec, "Contas a Receber");
        XLSX.utils.book_append_sheet(wb, wsExp, "Despesas");

        XLSX.writeFile(wb, `Relatorio_Financeiro_${period}.xlsx`);
    },

    generateDRE: () => {
        const period = document.getElementById('fin-period')?.value || '';
        const receivables = window.FinancialModule.getReceivables().filter(item => item.status !== 'cancelled');
        const expenses = (window.StorageApp.get('fin_expenses') || []).filter(item => item.date?.startsWith(period));
        const periodPayments = receivables.flatMap(item => (item.payments || []).map(payment => ({ ...payment, account: item }))).filter(payment => payment.date?.startsWith(period));
        const osRecords = window.StorageApp.get('os_records') || [];
        const osMap = new Map(osRecords.map(os => [os.id, os]));

        let totalReceived = 0;
        let totalLaborReceived = 0;
        let totalPartsReceived = 0;
        let totalMachineReceived = 0;
        let totalMiscReceived = 0;

        periodPayments.forEach(payment => {
            const os = osMap.get(payment.account.osId);
            totalReceived += payment.amount;

            if (os && os.values) {
                const total = Number(os.values.total) || 1;
                const labor = Number(os.values.labor) || 0;
                const parts = Number(os.values.parts) || 0;
                const machine = Number(os.values.machine) || 0;
                const misc = Number(os.values.misc) || 0;

                totalLaborReceived += payment.amount * (labor / total);
                totalPartsReceived += payment.amount * (parts / total);
                totalMachineReceived += payment.amount * (machine / total);
                totalMiscReceived += payment.amount * (misc / total);
            } else {
                totalLaborReceived += payment.amount;
            }
        });

        const totalExpenses = expenses.reduce((sum, e) => sum + e.value, 0);
        const netResult = (totalLaborReceived + totalMiscReceived) - totalExpenses;

        // Expenses breakdown by category
        const categoriesMap = {};
        expenses.forEach(e => {
            const cat = e.category || 'Outros';
            categoriesMap[cat] = (categoriesMap[cat] || 0) + e.value;
        });

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>DRE - Gestão Financeira GDN</title>
                <style>
                    body { font-family: 'Exo 2', 'Roboto', sans-serif; padding: 30px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                    .title { font-size: 24px; font-weight: bold; margin: 0; }
                    .subtitle { font-size: 14px; color: #666; margin: 5px 0 0 0; }
                    .table-dre { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    .table-dre th, .table-dre td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
                    .table-dre th { background-color: #f8f9fa; font-weight: bold; }
                    .section-header { font-weight: bold; background-color: #e9ecef; }
                    .total-row { font-weight: bold; font-size: 16px; border-top: 2px solid #333; border-bottom: 2px solid #333; }
                    .positive { color: #28a745; }
                    .negative { color: #dc3545; }
                    .bold-text { font-weight: bold; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="margin-bottom:20px; text-align:right;">
                    <button onclick="window.print()" style="padding: 8px 16px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Imprimir DRE</button>
                </div>
                <div class="header">
                    <div class="title">Demonstrativo de Resultado (DRE)</div>
                    <div class="subtitle">Período de Referência: ${period} | Emissor: GDN Serviços Automotivos</div>
                </div>
                
                <table class="table-dre">
                    <thead>
                        <tr>
                            <th>Conta / Categoria</th>
                            <th style="text-align: right;">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="section-header">
                            <td colspan="2">1. RECEITAS DE CAIXA (Faturamento Bruto)</td>
                        </tr>
                        <tr>
                            <td>Mão de Obra Recebida (Oficina)</td>
                            <td style="text-align: right;" class="positive">R$ ${totalLaborReceived.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Diversos/Outros Serviços Recebidos</td>
                            <td style="text-align: right;" class="positive">R$ ${totalMiscReceived.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Peças Recebidas (Terceiros)</td>
                            <td style="text-align: right; color:#777;">R$ ${totalPartsReceived.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Retífica Recebida (Terceiros)</td>
                            <td style="text-align: right; color:#777;">R$ ${totalMachineReceived.toFixed(2)}</td>
                        </tr>
                        <tr class="total-row">
                            <td>RECEITA BRUTA TOTAL RECEBIDA</td>
                            <td style="text-align: right;" class="positive">R$ ${totalReceived.toFixed(2)}</td>
                        </tr>
                        
                        <tr class="section-header" style="margin-top: 15px;">
                            <td colspan="2">2. (-) CUSTOS DE TERCEIROS (Repasses deduzidos)</td>
                        </tr>
                        <tr>
                            <td>Dedução - Repasse de Peças</td>
                            <td style="text-align: right; color: #dc3545;">R$ -${totalPartsReceived.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Dedução - Repasse de Retífica</td>
                            <td style="text-align: right; color: #dc3545;">R$ -${totalMachineReceived.toFixed(2)}</td>
                        </tr>
                        <tr class="total-row" style="background-color: #f1f5f9;">
                            <td>RECEITA LÍQUIDA DA OFICINA (Sua Mão de Obra)</td>
                            <td style="text-align: right; color: #28a745;">R$ ${(totalLaborReceived + totalMiscReceived).toFixed(2)}</td>
                        </tr>

                        <tr class="section-header" style="margin-top: 15px;">
                            <td colspan="2">3. (-) DESPESAS E CUSTOS ADMINISTRATIVOS</td>
                        </tr>
                        ${Object.keys(categoriesMap).map(cat => `
                            <tr>
                                <td>Despesa - ${cat}</td>
                                <td style="text-align: right;" class="negative">R$ -${categoriesMap[cat].toFixed(2)}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="2">Nenhuma despesa lançada</td></tr>'}
                        <tr class="total-row">
                            <td>TOTAL DE DESPESAS</td>
                            <td style="text-align: right;" class="negative">R$ -${totalExpenses.toFixed(2)}</td>
                        </tr>
                        
                        <tr class="total-row" style="background-color: #e2e8f0; font-size:18px;">
                            <td>RESULTADO LÍQUIDO DO PERÍODO (Sobra no Bolso)</td>
                            <td style="text-align: right;" class="${netResult >= 0 ? 'positive' : 'negative'}">R$ ${netResult.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    registerPayment: async (id) => {
        const receivables = window.FinancialModule.getReceivables();
        const account = receivables.find(item => item.id === id);
        if (!account || account.status === 'paid') return;
        const remaining = account.amount - account.paidAmount;
        const response = prompt(`Saldo em aberto: ${window.FinancialModule.currency(remaining)}\nInforme o valor recebido:`, remaining.toFixed(2));
        if (response === null) return;
        const amount = Number(String(response).replace(',', '.'));
        if (!Number.isFinite(amount) || amount <= 0 || amount > remaining + 0.001) return alert('Informe um valor maior que zero e até o saldo em aberto.');
        const date = prompt('Data do recebimento (AAAA-MM-DD):', window.FinancialModule.today());
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

        window.FinancialModule.updateReport();
    },

    updateCharts: (received, spent, categoryBreakdown) => {
        if (typeof Chart === 'undefined') return;

        // Destroy previous charts if they exist
        if (window.FinancialModule.cashFlowChart) {
            window.FinancialModule.cashFlowChart.destroy();
        }
        if (window.FinancialModule.categoriesChart) {
            window.FinancialModule.categoriesChart.destroy();
        }

        // Cash Flow chart (Entradas x Saídas)
        const ctxFlow = document.getElementById('fin-chart-cashflow')?.getContext('2d');
        if (ctxFlow) {
            window.FinancialModule.cashFlowChart = new Chart(ctxFlow, {
                type: 'bar',
                data: {
                    labels: ['Entradas (Recebido)', 'Saídas (Despesas)'],
                    datasets: [{
                        label: 'Valores do Período',
                        data: [received, spent],
                        backgroundColor: ['#28a745', '#dc3545'],
                        borderRadius: 6,
                        maxBarThickness: 50
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toLocaleString('pt-BR');
                                }
                            }
                        }
                    }
                }
            });
        }

        // Categories Doughnut Chart
        const ctxCats = document.getElementById('fin-chart-categories')?.getContext('2d');
        if (ctxCats) {
            const labels = Object.keys(categoryBreakdown);
            const data = Object.values(categoryBreakdown);
            
            if (labels.length === 0) {
                labels.push('Sem despesas');
                data.push(0);
            }

            window.FinancialModule.categoriesChart = new Chart(ctxCats, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            '#007bff', '#6f42c1', '#fd7e14', '#e83e8c', '#20c997', '#ffc107', '#17a2b8', '#6c757d'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                font: { size: 10 }
                            }
                        }
                    }
                }
            });
        }
    },

    updateReport: () => {
        const period = document.getElementById('fin-period')?.value;
        if (!period) return;
        const today = window.FinancialModule.today();
        const receivables = window.FinancialModule.getReceivables().filter(item => item.status !== 'cancelled');
        const expenses = (window.StorageApp.get('fin_expenses') || []).filter(item => item.date?.startsWith(period));
        const periodPayments = receivables.flatMap(item => (item.payments || []).map(payment => ({ ...payment, account: item }))).filter(payment => payment.date?.startsWith(period));
        
        const osRecords = window.StorageApp.get('os_records') || [];
        const osMap = new Map(osRecords.map(os => [os.id, os]));

        const totalReceived = periodPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const open = receivables.reduce((sum, item) => sum + Math.max(0, item.amount - item.paidAmount), 0);
        const overdue = receivables.filter(item => item.status !== 'paid' && item.dueDate && item.dueDate < today).reduce((sum, item) => sum + item.amount - item.paidAmount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

        // Calcular a parcela correspondente a Mão de Obra e Terceiros para os valores recebidos
        let laborReceived = 0;
        let outsourcedReceived = 0;

        periodPayments.forEach(payment => {
            const os = osMap.get(payment.account.osId);
            if (os && os.values) {
                const total = Number(os.values.total) || 1;
                const labor = Number(os.values.labor) || 0;
                const misc = Number(os.values.misc) || 0;
                const parts = Number(os.values.parts) || 0;
                const machine = Number(os.values.machine) || 0;

                // Fração da OS correspondente ao que fica com a oficina
                const laborFraction = (labor + misc) / total;
                const outsourcedFraction = (parts + machine) / total;

                laborReceived += payment.amount * laborFraction;
                outsourcedReceived += payment.amount * outsourcedFraction;
            } else {
                // Caso não tenha o vínculo completo da OS, assume 100% como mão de obra
                laborReceived += payment.amount;
            }
        });
        
        document.getElementById('fin-received').textContent = window.FinancialModule.currency(totalReceived);
        document.getElementById('fin-received-count').textContent = `${periodPayments.length} recebimento(s)`;
        
        // Mão de Obra Recebida
        document.getElementById('fin-labor-received').textContent = window.FinancialModule.currency(laborReceived);
        const laborRatio = totalReceived > 0 ? ((laborReceived / totalReceived) * 100).toFixed(0) : 0;
        document.getElementById('fin-labor-ratio').textContent = `${laborRatio}% do faturamento`;

        // Repasses
        document.getElementById('fin-outsourced-received').textContent = window.FinancialModule.currency(outsourcedReceived);
        const outsourcedRatio = totalReceived > 0 ? ((outsourcedReceived / totalReceived) * 100).toFixed(0) : 0;
        document.getElementById('fin-outsourced-ratio').textContent = `${outsourcedRatio}% do faturamento`;

        // Lucro Real (Minha Mão de Obra - Despesas)
        const netProfit = laborReceived - totalExpenses;
        document.getElementById('fin-cash-result').textContent = window.FinancialModule.currency(netProfit);
        document.getElementById('fin-expense-summary').textContent = `${window.FinancialModule.currency(totalExpenses)} em despesas no período`;

        // Calculate Category Breakdown
        const categoryBreakdown = {};
        expenses.forEach(e => {
            const cat = e.category || 'Outros';
            categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + e.value;
        });

        // Update Charts (usamos a mão de obra recebida como as entradas reais da oficina nos gráficos)
        window.FinancialModule.updateCharts(laborReceived, totalExpenses, categoryBreakdown);

        // --- POPULA CONTAS A RECEBER TAB ---
        const wrapper = document.getElementById('receivables-table-wrapper');
        if (wrapper) {
            const visible = receivables.filter(item => item.issueDate?.startsWith(period) || item.dueDate?.startsWith(period) || item.status !== 'paid');
            
            const sorted = [...visible];
            sorted.sort((a, b) => {
                let valA, valB;
                if (window.FinancialModule.sortColumn === 'osNumber') {
                    valA = a.osNumber || '';
                    valB = b.osNumber || '';
                } else if (window.FinancialModule.sortColumn === 'dueDate') {
                    valA = a.dueDate || '';
                    valB = b.dueDate || '';
                } else if (window.FinancialModule.sortColumn === 'amount') {
                    valA = a.amount || 0;
                    valB = b.amount || 0;
                } else if (window.FinancialModule.sortColumn === 'remaining') {
                    valA = Math.max(0, a.amount - a.paidAmount);
                    valB = Math.max(0, b.amount - b.paidAmount);
                } else if (window.FinancialModule.sortColumn === 'status') {
                    valA = a.status === 'paid' ? 3 : (a.dueDate && a.dueDate < today ? 0 : (a.paidAmount > 0 ? 1 : 2));
                    valB = b.status === 'paid' ? 3 : (b.dueDate && b.dueDate < today ? 0 : (b.paidAmount > 0 ? 1 : 2));
                }
                
                if (valA < valB) return window.FinancialModule.sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return window.FinancialModule.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });

            const rowsHtml = sorted.map(item => {
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

                // Detalhamento de Mão de Obra e Terceiros na linha
                const os = osMap.get(item.osId);
                const laborVal = os && os.values ? Number(os.values.labor) || 0 : item.amount;
                const partsVal = os && os.values ? Number(os.values.parts) || 0 : 0;
                const machineVal = os && os.values ? Number(os.values.machine) || 0 : 0;
                const breakdownText = `Mão de Obra: R$ ${laborVal.toFixed(2)} | Peças: R$ ${partsVal.toFixed(2)} | Retífica: R$ ${machineVal.toFixed(2)}`;

                return `<tr style="background: #ffffff; transition: background 0.2s ease;" onmouseover="this.style.background='#f8fafc';" onmouseout="this.style.background='#ffffff';">
                    <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                        <span class="badge" style="background: rgba(0, 123, 255, 0.08); color: #007bff; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-family: monospace; font-size: 0.85rem; border: 1px solid rgba(0, 123, 255, 0.15);">#${item.osNumber}</span>
                        <div style="font-weight: 600; color: var(--text-color); margin-top: 6px; font-size: 0.95rem;">${item.clientName}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${breakdownText}</div>
                    </td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                        ${overdueItem ? `<span style="color: var(--danger-color); font-weight: 600; display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem;"><i class="fa-regular fa-clock"></i> ${window.FinancialModule.dateLabel(item.dueDate)}</span>` : `<span style="color: var(--text-muted); font-weight: 500; display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem;"><i class="fa-regular fa-calendar"></i> ${window.FinancialModule.dateLabel(item.dueDate)}</span>`}
                    </td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; font-weight: 600; color: var(--text-color); font-size: 0.95rem;">
                        ${window.FinancialModule.currency(item.amount)}
                    </td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                        ${remaining > 0 ? `<span style="font-weight: bold; color: ${overdueItem ? 'var(--danger-color)' : '#d97706'}; font-size: 0.95rem;">${window.FinancialModule.currency(remaining)}</span>` : `<span style="color: var(--text-muted); font-size: 0.9rem;">-</span>`}
                    </td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                        ${statusBadge}
                    </td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; text-align: right;">
                        ${item.status === 'paid' ? `<span style="color: var(--success-color); font-weight: bold; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 4px; padding-right: 10px;"><i class="fa-solid fa-check"></i> Completo</span>` : `<button class="btn btn-sm btn-success" style="background-color: #28a745; border-color: #28a745; border-radius: 6px; font-weight: bold; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(40, 167, 69, 0.15); transition: all 0.2s; cursor: pointer; border: none; color: white;" onmouseover="this.style.backgroundColor='#218838'; this.style.transform='translateY(-1px)';" onmouseout="this.style.backgroundColor='#28a745'; this.style.transform='none';" onclick="window.FinancialModule.registerPayment('${item.id}')"><i class="fa-solid fa-hand-holding-dollar"></i> Receber</button>`}
                    </td>
                </tr>`;
            }).join('') || `<tr><td colspan="6" style="padding: 30px; text-align: center; color: #94a3b8;"><i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #cbd5e1;"></i> Nenhuma conta a receber neste período.</td></tr>`;

            wrapper.innerHTML = `
                <table class="table" style="vertical-align: middle; border-collapse: separate; border-spacing: 0 8px; width: 100%;">
                    <thead>
                        <tr style="background: transparent;">
                            <th onclick="window.FinancialModule.setSort('osNumber')" style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600; cursor: pointer; user-select: none;">OS / Cliente (Detalhamento)${window.FinancialModule.getSortIcon('osNumber')}</th>
                            <th onclick="window.FinancialModule.setSort('dueDate')" style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600; cursor: pointer; user-select: none;">Vencimento${window.FinancialModule.getSortIcon('dueDate')}</th>
                            <th onclick="window.FinancialModule.setSort('amount')" style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600; cursor: pointer; user-select: none;">Valor${window.FinancialModule.getSortIcon('amount')}</th>
                            <th onclick="window.FinancialModule.setSort('remaining')" style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600; cursor: pointer; user-select: none;">Saldo${window.FinancialModule.getSortIcon('remaining')}</th>
                            <th onclick="window.FinancialModule.setSort('status')" style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600; cursor: pointer; user-select: none;">Situação${window.FinancialModule.getSortIcon('status')}</th>
                            <th style="border: none; padding-bottom: 12px; width: 150px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            `;
        }

        // --- POPULA NOTAS FISCAIS TAB ---
        const invoiceWrapper = document.getElementById('invoices-table-wrapper');
        const periodInvoices = osRecords.filter(os => {
            return os.nfseStatus === 'emitida' && os.nfseDataEmissao && os.nfseDataEmissao.startsWith(period);
        });

        // Atualiza a badge numérica da tab
        const invoiceCountBadge = document.getElementById('fin-invoice-count-badge');
        if (invoiceCountBadge) {
            invoiceCountBadge.textContent = periodInvoices.length;
        }

        if (invoiceWrapper) {
            const fiscalSettings = window.NFSeModule ? window.NFSeModule.getFiscalSettings() : { aliquotaIss: 5 };
            const aliq = fiscalSettings.aliquotaIss / 100;

            let periodInvoicedSum = 0;
            let periodIssSum = 0;

            const invoiceRowsHtml = periodInvoices.map(os => {
                const laborVal = os.values ? Number(os.values.labor) || 0 : Number(os.valLabor) || 0;
                const issEst = laborVal * aliq;

                periodInvoicedSum += laborVal;
                periodIssSum += issEst;

                const dataNota = os.nfseDataEmissao ? new Date(os.nfseDataEmissao).toLocaleDateString('pt-BR') : '-';

                return `<tr style="background: #ffffff; transition: background 0.2s ease;" onmouseover="this.style.background='#f8fafc';" onmouseout="this.style.background='#ffffff';">
                    <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                        <span class="badge" style="background: rgba(40, 167, 69, 0.08); color: #28a745; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-family: monospace; font-size: 0.85rem; border: 1px solid rgba(40, 167, 69, 0.15);"><i class="fa-solid fa-file-invoice"></i> Nº ${os.nfseNumero || 'OK'}</span>
                    </td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                        <span class="badge" style="background: rgba(0, 123, 255, 0.08); color: #007bff; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-family: monospace; font-size: 0.85rem; border: 1px solid rgba(0, 123, 255, 0.15);">#${os.number}</span>
                    </td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; color: var(--text-color); font-weight: 500;">
                        ${os.clientName || 'Cliente Avulso'}
                    </td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; color: var(--text-muted);">
                        ${dataNota}
                    </td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; font-weight: 600; color: var(--text-color);">
                        ${window.FinancialModule.currency(laborVal)}
                    </td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; font-weight: 600; color: var(--danger-color);">
                        ${window.FinancialModule.currency(issEst)}
                    </td>
                    <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; text-align: right;">
                        <button class="btn btn-sm btn-primary" style="background-color: var(--primary-color); border: none; border-radius: 6px; font-weight: bold; padding: 6px 14px; color: white; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;" onclick="window.NFSeModule.showNFSeModal('${os.id}')"><i class="fa-solid fa-eye"></i> Ver PDF</button>
                    </td>
                </tr>`;
            }).join('') || `<tr><td colspan="7" style="padding: 30px; text-align: center; color: #94a3b8;"><i class="fa-solid fa-file-excel" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #cbd5e1;"></i> Nenhuma NFS-e importada neste período.</td></tr>`;

            invoiceWrapper.innerHTML = `
                <div style="background: #f8fafc; border-radius: 8px; padding: 12px 15px; margin-bottom: 15px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; border: 1px solid #e2e8f0;">
                    <div style="font-size:0.9rem;"><strong>Total Faturado em Notas:</strong> <span style="color:var(--success-color); font-weight:bold; font-size:1.05rem;">${window.FinancialModule.currency(periodInvoicedSum)}</span></div>
                    <div style="font-size:0.9rem;"><strong>ISS Estimado (${fiscalSettings.aliquotaIss}%):</strong> <span style="color:var(--danger-color); font-weight:bold; font-size:1.05rem;">${window.FinancialModule.currency(periodIssSum)}</span></div>
                </div>
                <table class="table" style="vertical-align: middle; border-collapse: separate; border-spacing: 0 8px; width: 100%;">
                    <thead>
                        <tr style="background: transparent;">
                            <th style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">Nº Nota</th>
                            <th style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">OS</th>
                            <th style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">Cliente</th>
                            <th style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">Data Emissão</th>
                            <th style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">Valor de Serviço</th>
                            <th style="border: none; padding-bottom: 12px; color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">ISS (${fiscalSettings.aliquotaIss}%)</th>
                            <th style="border: none; padding-bottom: 12px; width: 120px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoiceRowsHtml}
                    </tbody>
                </table>
            `;
        }

        // --- POPULA DESPESAS LIST ---
        document.getElementById('fin-expenses-list').innerHTML = expenses.map(item => `
            <div style="display:flex;justify-content:space-between;gap:8px;margin:8px 0;padding-bottom:8px;border-bottom:1px solid #f1f5f9;">
                <span>
                    <strong>${item.desc}</strong> <small style="background:#e2e8f0;padding:2px 5px;border-radius:4px;font-size:0.75rem;">${item.category || 'Outros'}</small><br>
                    <small>${window.FinancialModule.dateLabel(item.date)}</small>
                </span>
                <span style="white-space:nowrap;color:var(--danger-color);font-weight:bold;">
                    ${window.FinancialModule.currency(item.value)} 
                    <button class="btn btn-sm" style="padding:2px 6px;margin-left:5px;background:none;border:none;cursor:pointer;color:var(--text-muted);" onclick="window.FinancialModule.deleteExpense('${item.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </span>
            </div>
        `).join('') || 'Sem despesas neste período.';
    }
};
