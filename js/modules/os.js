
window.OSModule = {
    sortColumn: 'date',
    sortDirection: 'desc',

    setSort: (col) => {
        if (window.OSModule.sortColumn === col) {
            window.OSModule.sortDirection = window.OSModule.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            window.OSModule.sortColumn = col;
            window.OSModule.sortDirection = 'desc';
        }
        window.OSModule.loadOSList();
    },

    getSortIcon: (col) => {
        if (window.OSModule.sortColumn !== col) {
            return ' <i class="fa-solid fa-sort" style="color: #cbd5e1; font-size: 0.75rem; margin-left: 4px; opacity: 0.6;"></i>';
        }
        if (window.OSModule.sortDirection === 'asc') {
            return ' <i class="fa-solid fa-sort-up" style="color: var(--primary-color); font-size: 0.85rem; margin-left: 4px; vertical-align: middle;"></i>';
        }
        return ' <i class="fa-solid fa-sort-down" style="color: var(--primary-color); font-size: 0.85rem; margin-left: 4px; vertical-align: middle;"></i>';
    },

    render: (container) => {
        container.innerHTML = `
            <div class="card" id="os-list-view">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h3>Ordens de Serviço</h3>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button id="btn-delete-selected-os" class="btn btn-warning hidden" style="background-color: #ffc107; color: #000; font-weight: bold;">
                            <i class="fa-solid fa-trash"></i> Excluir Selecionadas (<span id="selected-os-count">0</span>)
                        </button>
                        <button id="btn-delete-all-os" class="btn btn-outline-danger" style="color: #dc3545; border: 1px solid #dc3545; background: transparent;" title="Excluir todas as Ordens de Serviço do banco">
                            <i class="fa-solid fa-trash-can"></i> Excluir Todas
                        </button>

                        <button id="btn-new-os" class="btn btn-primary">
                            <i class="fa-solid fa-plus"></i> Nova OS
                        </button>
                    </div>
                </div>
                
                <!-- Filtros e Ações em Massa -->
                <div style="background: rgba(255,255,255,0.02); border: 1px solid #334155; border-radius: 8px; padding: 15px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 15px;">
                    <!-- Filtros -->
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                        <span style="font-weight: 600; color: #94a3b8; font-size: 0.9rem; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-filter"></i> Filtrar por:</span>
                        <select id="filter-os-status" class="form-control" style="max-width: 200px; padding: 6px 12px; font-size: 0.85rem; background: #0f172a; color: #fff; border: 1px solid #334155; border-radius: 4px; height: 34px;">
                            <option value="">Todos os Status (Servi&ccedil;o)</option>
                            <option value="Pendente">Pendente</option>
                            <option value="Em Andamento">Em Andamento</option>
                            <option value="Aguardando Peça">Aguardando Pe&ccedil;a</option>
                            <option value="Finalizado">Finalizado</option>
                            <option value="Entregue">Entregue</option>
                        </select>
                        <select id="filter-os-payment" class="form-control" style="max-width: 200px; padding: 6px 12px; font-size: 0.85rem; background: #0f172a; color: #fff; border: 1px solid #334155; border-radius: 4px; height: 34px;">
                            <option value="">Todos os Pagamentos</option>
                            <option value="Pendente">Pendente</option>
                            <option value="Pago">Pago</option>
                            <option value="Pago Parcialmente">Pago Parcialmente</option>
                        </select>
                        <input type="month" id="filter-os-month" class="form-control" style="max-width: 160px; padding: 6px 12px; font-size: 0.85rem; background: #0f172a; color: #fff; border: 1px solid #334155; border-radius: 4px; height: 34px;">
                        <select id="filter-os-nfse" class="form-control" style="max-width: 180px; padding: 6px 12px; font-size: 0.85rem; background: #0f172a; color: #fff; border: 1px solid #334155; border-radius: 4px; height: 34px;">
                            <option value="">Todas as NFS-e</option>
                            <option value="emitida">Com NFS-e (Emitida)</option>
                            <option value="nao_emitida">Sem NFS-e</option>
                        </select>
                        <input type="text" id="filter-os-search" class="form-control" placeholder="Buscar por Cliente, Placa ou N&ordm;..." style="width: 250px; padding: 6px 12px; font-size: 0.85rem; background: #0f172a; color: #fff; border: 1px solid #334155; border-radius: 4px; height: 34px;">
                        <button id="btn-clear-os-filters" class="btn btn-secondary" style="background-color: #475569; color: white; border: none; padding: 0 12px; font-size: 0.85rem; border-radius: 4px; display: flex; align-items: center; gap: 6px; cursor: pointer; height: 34px;"><i class="fa-solid fa-filter-circle-xmark"></i> Limpar Filtros</button>
                    </div>

                    <!-- Ações em Massa -->
                    <div id="bulk-actions-container" class="hidden" style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; border-top: 1px solid #334155; padding-top: 12px;">
                        <span style="font-weight: 600; color: #ffc107; font-size: 0.85rem; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-list-check"></i> A&ccedil;&otilde;es em Lote:</span>
                        
                        <!-- Unified Bulk Update Form -->
                        <div style="display: flex; gap: 8px; align-items: center; background: #1e293b; padding: 4px 8px; border-radius: 6px; border: 1px solid #334155;">
                            <select id="bulk-update-status" class="form-control" style="width: 170px; padding: 4px 8px; font-size: 0.85rem; font-family: inherit; letter-spacing: normal; background: #0f172a; color: #fff; border: 1px solid #334155; border-radius: 4px; height: 32px; box-sizing: border-box;">
                                <option value="">Sem Alterar Servi&ccedil;o</option>
                                <option value="Pendente">Pendente</option>
                                <option value="Em Andamento">Em Andamento</option>
                                <option value="Aguardando Peça">Aguardando Pe&ccedil;a</option>
                                <option value="Finalizado">Finalizado</option>
                                <option value="Entregue">Entregue</option>
                            </select>
                            <select id="bulk-update-payment" class="form-control" style="width: 175px; padding: 4px 8px; font-size: 0.85rem; font-family: inherit; letter-spacing: normal; background: #0f172a; color: #fff; border: 1px solid #334155; border-radius: 4px; height: 32px; box-sizing: border-box;">
                                <option value="">Sem Alterar Pagamento</option>
                                <option value="Pendente">Pendente</option>
                                <option value="Pago">Pago</option>
                                <option value="Pago Parcialmente">Pago Parcialmente</option>
                            </select>
                            <button id="btn-bulk-apply-changes" class="btn" style="background-color: #3b82f6; border: none; color: white; padding: 0 12px; font-size: 0.85rem; font-family: inherit; letter-spacing: normal; border-radius: 4px; height: 32px; font-weight: 500; display: flex; align-items: center; gap: 4px; cursor: pointer; box-sizing: border-box;">Alterar Status</button>
                        </div>

                        <!-- Action Buttons (Standard size and height) -->
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button id="btn-bulk-export-excel" class="btn btn-success" style="background-color: #217346; border: none; color: white; padding: 0 12px; font-size: 0.85rem; font-family: inherit; letter-spacing: normal; border-radius: 4px; height: 32px; display: flex; align-items: center; gap: 6px; cursor: pointer; box-sizing: border-box; font-weight: 500;"><i class="fa-solid fa-file-excel"></i> Baixar Excel (Separados)</button>
                            <button id="btn-bulk-download-pdf" class="btn btn-info" style="background-color: #17a2b8; border: none; color: white; padding: 0 12px; font-size: 0.85rem; font-family: inherit; letter-spacing: normal; border-radius: 4px; height: 32px; display: flex; align-items: center; gap: 6px; cursor: pointer; box-sizing: border-box; font-weight: 500;"><i class="fa-solid fa-file-pdf"></i> Baixar Recibos PDF (Separados)</button>
                            <button id="btn-bulk-print" class="btn btn-primary" style="background-color: #5a35b8; border: none; color: white; padding: 0 12px; font-size: 0.85rem; font-family: inherit; letter-spacing: normal; border-radius: 4px; height: 32px; display: flex; align-items: center; gap: 6px; cursor: pointer; box-sizing: border-box; font-weight: 500;"><i class="fa-solid fa-print"></i> Imprimir Juntos (Lote)</button>
                        </div>
                    </div>
                </div>

                <!-- NFS-e Summary Bar -->
                <div id="os-nfse-summary-bar" style="background: var(--background-light); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px 15px; margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; color: var(--text-color); font-size: 0.9rem;">
                    <div><i class="fa-solid fa-file-invoice" style="color:var(--success-color);"></i> <strong>NFS-e Emitidas:</strong> <span id="os-summary-nfse-count" style="font-weight:bold; color:#28a745;">0</span></div>
                    <div><i class="fa-solid fa-gears" style="color:var(--primary-color);"></i> <strong>Mão de Obra Faturada:</strong> <span id="os-summary-nfse-labor" style="font-weight:bold; color:#28a745;">R$ 0,00</span></div>
                </div>

                <div class="table-responsive" id="os-table-wrapper">
                    <!-- Dynamic table rendered by loadOSList -->
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
                        <div class="form-group">
                            <label class="form-label">Hora Início</label>
                            <input type="time" id="os-start-time" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Previsão Fim</label>
                            <input type="time" id="os-end-time" class="form-control">
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

                    <!-- Section 3.5: Observations -->
                     <h4 class="section-title" style="margin-top: 20px; color: var(--primary-color); border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 15px;">Observações</h4>
                     <div class="form-group">
                          <textarea id="os-observations" class="form-control" rows="3" placeholder="Observações internas, notas ou advertências..."></textarea>
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
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                             <label class="form-label">Técnico Responsável</label>
                             <select id="os-tech-select" class="form-control">
                                 <option value="">Selecione...</option>
                             </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Status do Serviço</label>
                            <select id="os-status" class="form-control">
                                <option value="Pendente">Pendente</option>
                                <option value="Em Andamento">Em Andamento</option>
                                <option value="Aguardando Peça">Aguardando Peça</option>
                                <option value="Finalizado">Finalizado</option>
                                <option value="Entregue">Entregue</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Status do Pagamento</label>
                            <select id="os-payment-status" class="form-control">
                                <option value="Pendente">Pendente</option>
                                <option value="Pago">Pago</option>
                                <option value="Pago Parcialmente">Pago Parcialmente</option>
                            </select>
                        </div>
                    </div>

                    <!-- Campos de Pagamento Parcial -->
                    <div id="os-partial-payment-container" class="hidden" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; border: 1px solid #334155;">
                        <div class="form-group">
                            <label class="form-label">Valor Pago (R$)</label>
                            <input type="number" step="0.01" id="os-val-paid" class="form-control" placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Valor Restante (R$)</label>
                            <input type="text" id="os-val-remaining" class="form-control" readonly style="font-weight: bold; color: #ffc107;">
                        </div>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 15px; margin-top: 30px; border-top: 1px solid #333; padding-top: 20px;">
                        <!-- Actions -->
                        <button type="submit" class="btn btn-primary" style="padding: 12px 25px; font-size: 1.1rem;">
                            <i class="fa-solid fa-save"></i> Salvar OS
                        </button>
                        <button type="button" id="btn-save-and-new-os" class="btn btn-success" style="padding: 12px 25px; font-size: 1.1rem; background-color: #28a745; color: #fff;">
                            <i class="fa-solid fa-file-circle-plus"></i> Salvar e Nova OS
                        </button>
                        <button type="button" id="btn-print-os" class="btn btn-secondary hidden" style="padding: 12px 25px; font-size: 1.1rem; background-color: #6f42c1;">
                            <i class="fa-solid fa-print"></i> Salvar PDF / Imprimir
                        </button>
                        <button type="button" id="btn-nfse-form" class="btn btn-info hidden" style="padding: 12px 25px; font-size: 1.1rem; background-color: #17a2b8; color: #fff;">
                            <i class="fa-solid fa-file-import"></i> Importar Nota Fiscal
                        </button>
                        <button type="button" id="btn-delete-os" class="btn btn-danger hidden" style="padding: 12px 25px; font-size: 1.1rem; background-color: #dc3545; color: #fff;">
                            <i class="fa-solid fa-trash"></i> Excluir OS
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

            <!-- Excel / CSV Import Modal -->
            <div id="excel-import-modal" class="hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;">
                <div class="card" style="width: 100%; max-width: 850px; max-height: 90vh; overflow-y: auto; position: relative;">
                    <button id="close-excel-modal" style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 1.5rem; color: #fff; cursor: pointer;">&times;</button>
                    <h3><i class="fa-solid fa-file-excel" style="color: #107c41;"></i> Importar Planilha de Notas e Ordens</h3>
                    <p class="text-muted">Selecione uma planilha (.xlsx, .xls, .csv) contendo o histórico de notas e serviços.</p>
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #107c41;">
                        <label class="form-label" style="font-weight: bold; color: #fff;">1. Escolha o arquivo da planilha:</label>
                        <input type="file" id="excel-file-input" accept=".xlsx, .xls, .csv" class="form-control" style="margin-top: 5px; background: var(--background-dark); color: #fff;">
                        
                        <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 20px; align-items: center;">
                            <div>
                                <label class="form-label" style="font-size: 0.85rem; font-weight: bold; color: #fff;">Linha do Cabeçalho:</label>
                                <select id="excel-header-row" class="form-control" style="background: var(--background-dark); color: #fff; font-size: 0.85rem; max-width: 250px;">
                                    <option value="auto">Auto-detectar (Ignora títulos agrupados)</option>
                                    <option value="2">Linha 2 (Títulos das Colunas)</option>
                                    <option value="1">Linha 1 (Padrão)</option>
                                </select>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-top: 15px;">
                                <input type="checkbox" id="excel-clear-existing" style="width: 18px; height: 18px; cursor: pointer;">
                                <label for="excel-clear-existing" style="font-size: 0.85rem; color: #ffc107; font-weight: bold; cursor: pointer;">
                                    Substituir todas as OS existentes (Limpar banco antes de importar)
                                </label>
                            </div>
                        </div>

                        <small style="color: var(--text-muted); display: block; margin-top: 8px;">
                            <i class="fa-solid fa-circle-info"></i>
                            A data é detectada <strong>automaticamente</strong>: usa <em>Data de Entrada</em> quando disponível; se não houver, usa <em>Data de Saída</em>; se nenhuma existir, fica <em>sem data</em>.
                        </small>
                    </div>

                    <div id="excel-preview-container" class="hidden" style="margin-top: 20px;">
                        <h4 style="color: var(--primary-color);">2. Registros Encontrados (<span id="excel-count">0</span>)</h4>
                        <div class="table-responsive" style="max-height: 280px; overflow-y: auto; margin-top: 10px; border: 1px solid #444; border-radius: 6px;">
                            <table class="table" style="font-size: 0.85rem;">
                                <thead>
                                    <tr>
                                        <th># OS/Nota</th>
                                        <th>Data</th>
                                        <th>Cliente</th>
                                        <th>Veículo/Placa</th>
                                        <th>Serviço</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th style="width: 60px; text-align: center;">Remover</th>
                                    </tr>
                                </thead>
                                <tbody id="excel-preview-body">
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px;">
                        <button type="button" id="btn-cancel-excel" class="btn btn-secondary">Cancelar</button>
                        <button type="button" id="btn-confirm-excel" class="btn btn-success hidden" style="background-color: #107c41; border-color: #0b5a2f;">
                            <i class="fa-solid fa-cloud-arrow-up"></i> Confirmar e Gerar Ordens de Serviço
                        </button>
                    </div>
                </div>
            </div>
        `;

        OSModule.loadOSList();
        OSModule.bindEvents();
    },

    loadOSList: () => {
        const osList = window.StorageApp.get('os_records') || [];
        const wrapper = document.getElementById('os-table-wrapper');
        if (!wrapper) return;
        
        // Obter valores dos filtros
        const filterStatus = document.getElementById('filter-os-status') ? document.getElementById('filter-os-status').value : '';
        const filterPayment = document.getElementById('filter-os-payment') ? document.getElementById('filter-os-payment').value : '';
        const filterMonth = document.getElementById('filter-os-month') ? document.getElementById('filter-os-month').value : '';
        const filterNfse = document.getElementById('filter-os-nfse') ? document.getElementById('filter-os-nfse').value : '';
        const filterSearch = document.getElementById('filter-os-search') ? document.getElementById('filter-os-search').value.toLowerCase().trim() : '';

        // Filtrar registros
        const filteredList = osList.filter(os => {
            const matchStatus = !filterStatus || os.status === filterStatus;
            const matchPayment = !filterPayment || (os.paymentStatus || 'Pendente') === filterPayment;
            const matchMonth = !filterMonth || (os.date && os.date.startsWith(filterMonth)) || (os.nfseDataEmissao && os.nfseDataEmissao.startsWith(filterMonth));
            const matchNfse = !filterNfse || (filterNfse === 'emitida' && os.nfseStatus === 'emitida') || (filterNfse === 'nao_emitida' && os.nfseStatus !== 'emitida');
            
            let matchSearch = true;
            if (filterSearch) {
                const searchNum = os.number ? os.number.toLowerCase() : '';
                const searchClient = os.clientName ? os.clientName.toLowerCase() : '';
                const searchPlate = os.vehiclePlate ? os.vehiclePlate.toLowerCase() : '';
                matchSearch = searchNum.includes(filterSearch) || 
                              searchClient.includes(filterSearch) || 
                              searchPlate.includes(filterSearch);
            }
            
            return matchStatus && matchPayment && matchMonth && matchNfse && matchSearch;
        });

        // NFS-e Summary calculations
        const periodInvoices = filteredList.filter(os => os.nfseStatus === 'emitida');
        const totalLaborInvoiced = periodInvoices.reduce((sum, os) => {
            return sum + (Number(os.values ? os.values.labor : os.valLabor) || 0);
        }, 0);

        const summaryCount = document.getElementById('os-summary-nfse-count');
        const summaryLabor = document.getElementById('os-summary-nfse-labor');
        
        if (summaryCount) summaryCount.textContent = periodInvoices.length;
        if (summaryLabor) summaryLabor.textContent = `R$ ${totalLaborInvoiced.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (filteredList.length === 0) {
            wrapper.innerHTML = `
                <table class="table">
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;"><input type="checkbox" id="select-all-os" title="Selecionar Todas"></th>
                            <th onclick="window.OSModule.setSort('number')" style="cursor: pointer; user-select: none;">Nº OS${window.OSModule.getSortIcon('number')}</th>
                            <th onclick="window.OSModule.setSort('date')" style="cursor: pointer; user-select: none;">Data${window.OSModule.getSortIcon('date')}</th>
                            <th onclick="window.OSModule.setSort('client')" style="cursor: pointer; user-select: none;">Cliente${window.OSModule.getSortIcon('client')}</th>
                            <th onclick="window.OSModule.setSort('vehicle')" style="cursor: pointer; user-select: none;">Veículo${window.OSModule.getSortIcon('vehicle')}</th>
                            <th onclick="window.OSModule.setSort('parts')" style="cursor: pointer; user-select: none;">Peças${window.OSModule.getSortIcon('parts')}</th>
                            <th onclick="window.OSModule.setSort('machine')" style="cursor: pointer; user-select: none;">Retífica${window.OSModule.getSortIcon('machine')}</th>
                            <th onclick="window.OSModule.setSort('total')" style="cursor: pointer; user-select: none;">Total${window.OSModule.getSortIcon('total')}</th>
                            <th onclick="window.OSModule.setSort('status')" style="cursor: pointer; user-select: none;">Status${window.OSModule.getSortIcon('status')}</th>
                            <th onclick="window.OSModule.setSort('payment')" style="cursor: pointer; user-select: none;">Pagamento${window.OSModule.getSortIcon('payment')}</th>
                            <th>Observação</th>
                            <th>NFS-e</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="13" style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhuma OS registrada.</td></tr>
                    </tbody>
                </table>
            `;
            const selectAllHeader = document.getElementById('select-all-os');
            if (selectAllHeader) selectAllHeader.checked = false;
            window.OSModule.updateSelectedCount();
            return;
        }

        // Sort dynamic list
        const sortedList = [...filteredList];
        sortedList.sort((a, b) => {
            let valA, valB;
            if (window.OSModule.sortColumn === 'number') {
                valA = a.number || '';
                valB = b.number || '';
            } else if (window.OSModule.sortColumn === 'date') {
                valA = a.date ? new Date(a.date).getTime() : 0;
                valB = b.date ? new Date(b.date).getTime() : 0;
            } else if (window.OSModule.sortColumn === 'client') {
                valA = (a.clientName || '').toLowerCase();
                valB = (b.clientName || '').toLowerCase();
            } else if (window.OSModule.sortColumn === 'vehicle') {
                valA = (a.vehicleModel || '').toLowerCase();
                valB = (b.vehicleModel || '').toLowerCase();
            } else if (window.OSModule.sortColumn === 'parts') {
                valA = Number(a.values ? a.values.parts : 0) || 0;
                valB = Number(b.values ? b.values.parts : 0) || 0;
            } else if (window.OSModule.sortColumn === 'machine') {
                valA = Number(a.values ? a.values.machine : 0) || 0;
                valB = Number(b.values ? b.values.machine : 0) || 0;
            } else if (window.OSModule.sortColumn === 'total') {
                valA = Number(a.values ? a.values.total : a.totalVal) || 0;
                valB = Number(b.values ? b.values.total : b.totalVal) || 0;
            } else if (window.OSModule.sortColumn === 'status') {
                valA = (a.status || '').toLowerCase();
                valB = (b.status || '').toLowerCase();
            } else if (window.OSModule.sortColumn === 'payment') {
                valA = (a.paymentStatus || '').toLowerCase();
                valB = (b.paymentStatus || '').toLowerCase();
            }

            if (valA < valB) return window.OSModule.sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return window.OSModule.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        const rowsHtml = sortedList.map(os => {
            // Status do serviço color badge
            let badgeColor = '#6c757d'; // default
            if (os.status === 'Finalizado') badgeColor = '#28a745';
            if (os.status === 'Em Andamento') badgeColor = '#007bff';
            if (os.status === 'Pendente') badgeColor = '#ffc107';
            if (os.status === 'Aguardando Peça') badgeColor = '#fd7e14';
            if (os.status === 'Entregue') badgeColor = '#20c997';

            // Status do pagamento color badge
            const payStatus = os.paymentStatus || 'Pendente';
            let payBadgeColor = '#e0a800'; // amarelo escuro
            if (payStatus === 'Pago') payBadgeColor = '#28a745';
            if (payStatus === 'Pendente') payBadgeColor = '#dc3545';
            if (payStatus === 'Pago Parcialmente') payBadgeColor = '#fd7e14';

            const nfseBadgeHtml = window.NFSeModule ? window.NFSeModule.renderBadge(os) : '';

            // Format date safely
            let formattedDate = '<span style="color: var(--text-muted); font-style: italic;">Sem Data</span>';
            if (os.date) {
                const d = new Date(os.date.includes('T') ? os.date : os.date + 'T00:00:00');
                if (!isNaN(d.getTime())) {
                    formattedDate = d.toLocaleDateString('pt-BR');
                }
            }

            return `
                <tr>
                    <td style="text-align: center;"><input type="checkbox" class="os-checkbox" data-id="${os.id}"></td>
                    <td><strong>#${os.number}</strong></td>
                    <td>${formattedDate}</td>
                    <td>${os.clientName}</td>
                    <td>${os.vehicleModel} <small>(${os.vehiclePlate})</small></td>
                    <td>R$ ${parseFloat(os.values && os.values.parts || 0).toFixed(2)}</td>
                    <td>R$ ${parseFloat(os.values && os.values.machine || 0).toFixed(2)}</td>
                    <td>R$ ${parseFloat(os.values.total).toFixed(2)}</td>
                    <td><span style="background-color: ${badgeColor}20; color: ${badgeColor}; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">${os.status || 'Pendente'}</span></td>
                    <td><span style="background-color: ${payBadgeColor}20; color: ${payBadgeColor}; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">${payStatus}</span></td>
                    <td style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${os.observations ? os.observations.replace(/"/g, '&quot;') : ''}">${os.observations ? (os.observations.length > 30 ? os.observations.substring(0, 30) + '...' : os.observations) : '<span style="color: var(--text-muted);">-</span>'}</td>
                    <td>${nfseBadgeHtml}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm edit-os" data-id="${os.id}" title="Ver/Editar"><i class="fa-solid fa-eye"></i></button>
                        <button class="btn btn-secondary btn-sm print-os-list" data-id="${os.id}" style="background-color: #6f42c1;" title="Imprimir"><i class="fa-solid fa-print"></i></button>
                        ${os.nfseStatus === 'emitida' ? `
                            <button class="btn btn-sm view-nfse" data-id="${os.id}" style="background-color: #28a745; color: #fff;" title="Ver Nota Fiscal"><i class="fa-solid fa-file-invoice"></i></button>
                        ` : `
                            <button class="btn btn-sm emit-nfse" data-id="${os.id}" style="background-color: #17a2b8; color: #fff;" title="Importar Nota Fiscal"><i class="fa-solid fa-file-import"></i></button>
                        `}
                        <button class="btn btn-danger btn-sm delete-os" data-id="${os.id}" style="background-color: #dc3545; color: #fff;" title="Excluir OS"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');

        wrapper.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th style="width: 40px; text-align: center;"><input type="checkbox" id="select-all-os" title="Selecionar Todas"></th>
                        <th onclick="window.OSModule.setSort('number')" style="cursor: pointer; user-select: none;">Nº OS${window.OSModule.getSortIcon('number')}</th>
                        <th onclick="window.OSModule.setSort('date')" style="cursor: pointer; user-select: none;">Data${window.OSModule.getSortIcon('date')}</th>
                        <th onclick="window.OSModule.setSort('client')" style="cursor: pointer; user-select: none;">Cliente${window.OSModule.getSortIcon('client')}</th>
                        <th onclick="window.OSModule.setSort('vehicle')" style="cursor: pointer; user-select: none;">Veículo${window.OSModule.getSortIcon('vehicle')}</th>
                        <th onclick="window.OSModule.setSort('parts')" style="cursor: pointer; user-select: none;">Peças${window.OSModule.getSortIcon('parts')}</th>
                        <th onclick="window.OSModule.setSort('machine')" style="cursor: pointer; user-select: none;">Retífica${window.OSModule.getSortIcon('machine')}</th>
                        <th onclick="window.OSModule.setSort('total')" style="cursor: pointer; user-select: none;">Total${window.OSModule.getSortIcon('total')}</th>
                        <th onclick="window.OSModule.setSort('status')" style="cursor: pointer; user-select: none;">Status${window.OSModule.getSortIcon('status')}</th>
                        <th onclick="window.OSModule.setSort('payment')" style="cursor: pointer; user-select: none;">Pagamento${window.OSModule.getSortIcon('payment')}</th>
                        <th>Observação</th>
                        <th>NFS-e</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="os-list-body">
                    ${rowsHtml}
                </tbody>
            </table>
        `;

        // Checkbox events
        const selectAll = document.getElementById('select-all-os');
        if (selectAll) {
            selectAll.checked = false;
            selectAll.onchange = (e) => {
                const checked = e.target.checked;
                document.querySelectorAll('.os-checkbox').forEach(cb => cb.checked = checked);
                window.OSModule.updateSelectedCount();
            };
        }

        document.querySelectorAll('.os-checkbox').forEach(cb => {
            cb.onchange = () => {
                window.OSModule.updateSelectedCount();
            };
        });

        window.OSModule.updateSelectedCount();

        document.querySelectorAll('.edit-os').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                window.OSModule.editOS(target.getAttribute('data-id'));
            });
        });

        document.querySelectorAll('.print-os-list').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                window.OSModule.printOS(target.getAttribute('data-id'));
            });
        });

        document.querySelectorAll('.emit-nfse').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.target.closest('button');
                const osId = target.getAttribute('data-id');
                if (window.NFSeModule) {
                    await window.NFSeModule.emitirNFSe(osId);
                }
            });
        });

        document.querySelectorAll('.view-nfse').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                const osId = target.getAttribute('data-id');
                if (window.NFSeModule) {
                    window.NFSeModule.showNFSeModal(osId);
                }
            });
        });

        document.querySelectorAll('.delete-os').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                const osId = target.getAttribute('data-id');
                window.OSModule.deleteOS(osId);
            });
        });
    },

    bindEvents: () => {
        // Delete Actions
        const btnDeleteSelected = document.getElementById('btn-delete-selected-os');
        if (btnDeleteSelected) {
            btnDeleteSelected.addEventListener('click', () => {
                OSModule.deleteSelectedOS();
            });
        }

        const btnDeleteAll = document.getElementById('btn-delete-all-os');
        if (btnDeleteAll) {
            btnDeleteAll.addEventListener('click', () => {
                OSModule.deleteAllOS();
            });
        }

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

        // Excel / CSV Import Events
        const btnImportExcel = document.getElementById('btn-import-excel');
        if (btnImportExcel) {
            btnImportExcel.addEventListener('click', () => {
                const modal = document.getElementById('excel-import-modal');
                if (modal) {
                    modal.classList.remove('hidden');
                    const fileInput = document.getElementById('excel-file-input');
                    if (fileInput) fileInput.value = '';
                    document.getElementById('excel-preview-container').classList.add('hidden');
                    document.getElementById('btn-confirm-excel').classList.add('hidden');
                    OSModule.pendingExcelData = [];
                }
            });
        }

        const closeExcelModal = () => {
            const modal = document.getElementById('excel-import-modal');
            if (modal) modal.classList.add('hidden');
        };

        const btnCloseExcel = document.getElementById('close-excel-modal');
        if (btnCloseExcel) btnCloseExcel.addEventListener('click', closeExcelModal);

        const btnCancelExcel = document.getElementById('btn-cancel-excel');
        if (btnCancelExcel) btnCancelExcel.addEventListener('click', closeExcelModal);

        const excelFileInput = document.getElementById('excel-file-input');
        if (excelFileInput) {
            excelFileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    OSModule.processExcelFile(e.target.files[0]);
                }
            });
        }

        const btnConfirmExcel = document.getElementById('btn-confirm-excel');
        if (btnConfirmExcel) {
            btnConfirmExcel.addEventListener('click', () => {
                OSModule.confirmExcelImport();
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

        // Partial Payment triggers
        const payStatusSelect = document.getElementById('os-payment-status');
        if (payStatusSelect) {
            payStatusSelect.addEventListener('change', () => {
                OSModule.togglePartialPaymentFields();
            });
        }

        const valPaidInput = document.getElementById('os-val-paid');
        if (valPaidInput) {
            valPaidInput.addEventListener('input', () => {
                OSModule.calculateRemainingPayment();
            });
        }

        // Form Submit
        const form = document.getElementById('os-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                OSModule.saveOS();
            });
        }

        // Save and New OS
        const btnSaveAndNew = document.getElementById('btn-save-and-new-os');
        if (btnSaveAndNew) {
            btnSaveAndNew.addEventListener('click', () => {
                const frm = document.getElementById('os-form');
                if (frm && frm.checkValidity && !frm.checkValidity()) {
                    frm.reportValidity();
                    return;
                }
                OSModule.saveOS();
                OSModule.showForm(false);
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

        // NFS-e Form Button
        const btnNFSeForm = document.getElementById('btn-nfse-form');
        if (btnNFSeForm) {
            btnNFSeForm.addEventListener('click', async () => {
                const id = document.getElementById('os-id').value;
                if (!id) {
                    alert('Por favor, salve a Ordem de Serviço primeiro antes de emitir a nota fiscal.');
                    return;
                }
                const osRecords = window.StorageApp.get('os_records') || [];
                const os = osRecords.find(o => o.id === id);
                if (os && os.nfseStatus === 'emitida') {
                    if (window.NFSeModule) window.NFSeModule.showNFSeModal(id);
                } else {
                    if (window.NFSeModule) {
                        const ok = await window.NFSeModule.emitirNFSe(id);
                        if (ok) {
                            OSModule.editOS(id);
                        }
                    }
                }
            });
        }

        // Delete Form Button
        const btnDeleteForm = document.getElementById('btn-delete-os');
        if (btnDeleteForm) {
            btnDeleteForm.addEventListener('click', () => {
                const id = document.getElementById('os-id').value;
                if (id) OSModule.deleteOS(id);
            });
        }

        // Filtros de busca e status
        const fStatus = document.getElementById('filter-os-status');
        if (fStatus) fStatus.addEventListener('change', () => OSModule.loadOSList());

        const fPayment = document.getElementById('filter-os-payment');
        if (fPayment) fPayment.addEventListener('change', () => OSModule.loadOSList());

        const fSearch = document.getElementById('filter-os-search');
        if (fSearch) fSearch.addEventListener('input', () => OSModule.loadOSList());

        const fMonth = document.getElementById('filter-os-month');
        if (fMonth) fMonth.addEventListener('change', () => OSModule.loadOSList());

        const fNfse = document.getElementById('filter-os-nfse');
        if (fNfse) fNfse.addEventListener('change', () => OSModule.loadOSList());

        // Ações em massa
        const btnBulkApplyChanges = document.getElementById('btn-bulk-apply-changes');
        if (btnBulkApplyChanges) {
            btnBulkApplyChanges.addEventListener('click', async () => {
                const newStatus = document.getElementById('bulk-update-status').value;
                const newPayment = document.getElementById('bulk-update-payment').value;
                if (!newStatus && !newPayment) {
                    alert('Selecione pelo menos uma alteração (Status de Serviço ou Status de Pagamento).');
                    return;
                }
                const checkedInputs = document.querySelectorAll('.os-checkbox:checked');
                const ids = Array.from(checkedInputs).map(cb => cb.getAttribute('data-id'));
                if (ids.length === 0) {
                    alert('Selecione pelo menos uma OS para alterar.');
                    return;
                }

                let msg = 'Deseja alterar as OSs selecionadas?';
                if (newStatus && newPayment) {
                    msg = `Deseja alterar o Status de Serviço para "${newStatus}" e o Status de Pagamento para "${newPayment}" em ${ids.length} OSs?`;
                } else if (newStatus) {
                    msg = `Deseja alterar o Status de Serviço para "${newStatus}" em ${ids.length} OSs?`;
                } else if (newPayment) {
                    msg = `Deseja alterar o Status de Pagamento para "${newPayment}" em ${ids.length} OSs?`;
                }

                if (confirm(msg)) {
                    let osRecords = window.StorageApp.get('os_records') || [];
                    osRecords = osRecords.map(os => {
                        if (ids.includes(os.id)) {
                            if (newStatus) {
                                os.status = newStatus;
                            }
                            if (newPayment) {
                                os.paymentStatus = newPayment;
                                if (newPayment === 'Pago') {
                                    os.valPaid = Number(os.values ? os.values.total : os.totalVal) || 0;
                                } else if (newPayment === 'Pendente') {
                                    os.valPaid = 0;
                                }
                            }
                        }
                        return os;
                    });
                    await window.StorageApp.save('os_records', osRecords);

                    // Sincroniza com o Financeiro
                    if (newPayment && window.FinancialModule) {
                        for (const id of ids) {
                            const updatedOs = osRecords.find(o => o.id === id);
                            if (updatedOs) {
                                await window.FinancialModule.syncReceivableForOS(updatedOs);
                            }
                        }
                    }

                    alert('Alterações aplicadas com sucesso!');
                    document.getElementById('bulk-update-status').value = '';
                    document.getElementById('bulk-update-payment').value = '';
                    OSModule.loadOSList();
                }
            });
        }

        // Bulk Export Excel (Separados)
        const btnBulkExport = document.getElementById('btn-bulk-export-excel');
        if (btnBulkExport) {
            btnBulkExport.addEventListener('click', () => {
                const checkedInputs = document.querySelectorAll('.os-checkbox:checked');
                const ids = Array.from(checkedInputs).map(cb => cb.getAttribute('data-id'));
                if (ids.length === 0) {
                    alert('Selecione pelo menos uma OS para exportar.');
                    return;
                }
                const osRecords = window.StorageApp.get('os_records') || [];
                const selectedOS = osRecords.filter(os => ids.includes(os.id));
                
                if (typeof XLSX === 'undefined') {
                    alert('Biblioteca do Excel não está carregada. Tente novamente em alguns segundos.');
                    return;
                }

                selectedOS.forEach(os => {
                    const excelData = [{
                        "OS": `#${os.number}`,
                        "Data": os.date ? new Date(os.date).toLocaleDateString('pt-BR') : '-',
                        "Cliente": os.clientName || 'Manual/Avulso',
                        "CPF/CNPJ": os.clientDoc || '-',
                        "Telefone": os.clientPhone || '-',
                        "Veículo": os.vehicleModel || '-',
                        "Ano": os.vehicleYear || '-',
                        "Placa": os.vehiclePlate || '-',
                        "KM": os.vehicleKm || '-',
                        "Peças (R$)": os.values ? os.values.parts || 0 : 0,
                        "Retífica (R$)": os.values ? os.values.machine || 0 : 0,
                        "Mão de Obra (R$)": os.values ? os.values.labor || 0 : 0,
                        "Diversos (R$)": os.values ? os.values.misc || 0 : 0,
                        "Desconto (R$)": os.values ? os.values.discount || 0 : 0,
                        "Total (R$)": os.values ? os.values.total || 0 : 0,
                        "Status Serviço": os.status || 'Pendente',
                        "Status Pagamento": os.paymentStatus || 'Pendente',
                        "Observações": os.observations || '-'
                    }];
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(excelData);
                    XLSX.utils.book_append_sheet(wb, ws, `OS_${os.number}`);
                    XLSX.writeFile(wb, `OS_${os.number}_${os.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
                });
            });
        }

        const btnBulkDownloadPdf = document.getElementById('btn-bulk-download-pdf');
        if (btnBulkDownloadPdf) {
            btnBulkDownloadPdf.addEventListener('click', () => {
                const checkedInputs = document.querySelectorAll('.os-checkbox:checked');
                const ids = Array.from(checkedInputs).map(cb => cb.getAttribute('data-id'));
                if (ids.length === 0) {
                    alert('Selecione pelo menos uma OS para baixar.');
                    return;
                }
                const osRecords = window.StorageApp.get('os_records') || [];
                const selectedOS = osRecords.filter(os => ids.includes(os.id));
                
                let index = 0;
                function downloadNext() {
                    if (index >= selectedOS.length) return;
                    OSModule.downloadSingleOSPDF(selectedOS[index]);
                    index++;
                    setTimeout(downloadNext, 1200);
                }
                downloadNext();
            });
        }

        // Bulk Print Receipts (Juntos)
        const btnBulkPrint = document.getElementById('btn-bulk-print');
        if (btnBulkPrint) {
            btnBulkPrint.addEventListener('click', () => {
                const checkedInputs = document.querySelectorAll('.os-checkbox:checked');
                const ids = Array.from(checkedInputs).map(cb => cb.getAttribute('data-id'));
                if (ids.length === 0) {
                    alert('Selecione pelo menos uma OS para imprimir.');
                    return;
                }
                OSModule.printMultipleOS(ids);
            });
        }

        // Clear OS Filters
        const btnClearFilters = document.getElementById('btn-clear-os-filters');
        if (btnClearFilters) {
            btnClearFilters.addEventListener('click', () => {
                const fStatus = document.getElementById('filter-os-status');
                const fPayment = document.getElementById('filter-os-payment');
                const fMonth = document.getElementById('filter-os-month');
                const fNfse = document.getElementById('filter-os-nfse');
                const fSearch = document.getElementById('filter-os-search');

                if (fStatus) fStatus.value = '';
                if (fPayment) fPayment.value = '';
                if (fMonth) fMonth.value = '';
                if (fNfse) fNfse.value = '';
                if (fSearch) fSearch.value = '';

                OSModule.loadOSList();
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
        if (typeof OSModule.calculateRemainingPayment === 'function') {
            OSModule.calculateRemainingPayment();
        }
        return total;
    },

    togglePartialPaymentFields: () => {
        const select = document.getElementById('os-payment-status');
        const container = document.getElementById('os-partial-payment-container');
        if (select && container) {
            if (select.value === 'Pago Parcialmente') {
                container.classList.remove('hidden');
                OSModule.calculateRemainingPayment();
            } else {
                container.classList.add('hidden');
            }
        }
    },

    calculateRemainingPayment: () => {
        const parts = parseFloat(document.getElementById('val-parts').value) || 0;
        const machine = parseFloat(document.getElementById('val-machine').value) || 0;
        const labor = parseFloat(document.getElementById('val-labor').value) || 0;
        const misc = parseFloat(document.getElementById('val-misc').value) || 0;
        const discount = parseFloat(document.getElementById('val-discount').value) || 0;
        const total = (parts + machine + labor + misc) - discount;

        const valPaidInput = document.getElementById('os-val-paid');
        const valRemainingInput = document.getElementById('os-val-remaining');
        if (valPaidInput && valRemainingInput) {
            const valPaid = parseFloat(valPaidInput.value) || 0;
            const remaining = total - valPaid;
            valRemainingInput.value = remaining.toFixed(2);
        }
    },

    showForm: (isEdit = false) => {
        document.getElementById('os-list-view').classList.add('hidden');
        document.getElementById('os-form-view').classList.remove('hidden');
        document.getElementById('btn-print-os').classList.add('hidden'); // Hide print until saved
        const btnNFSe = document.getElementById('btn-nfse-form');
        if (btnNFSe) btnNFSe.classList.add('hidden');
        const btnDelete = document.getElementById('btn-delete-os');
        if (btnDelete) btnDelete.classList.add('hidden');

        OSModule.loadSelectOptions();

        if (!isEdit) {
            // New OS
            document.getElementById('os-form').reset();
            document.getElementById('os-id').value = '';
            const obsInput = document.getElementById('os-observations');
            if (obsInput) obsInput.value = '';
            document.getElementById('os-form-title').textContent = 'Nova Ordem de Serviço';

            // Default to Select Mode
            document.getElementById('os-manual-client').checked = false;
            OSModule.toggleManualClient(false);

            // Clear partial payment
            const valPaidInput = document.getElementById('os-val-paid');
            if (valPaidInput) valPaidInput.value = '';
            OSModule.togglePartialPaymentFields();

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
            document.getElementById('os-start-time').value = '';
            document.getElementById('os-end-time').value = '';
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
        const date = document.getElementById('os-date').value;
        const numberInput = document.getElementById('os-number');
        let number = numberInput ? numberInput.value.trim() : '';
        if (window.StorageApp && window.StorageApp.formatOSNumber) {
            number = window.StorageApp.formatOSNumber(number, date);
            if (numberInput) numberInput.value = number;
        }
        const startTime = document.getElementById('os-start-time').value;
        const endTime = document.getElementById('os-end-time').value;

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
        const observations = document.getElementById('os-observations') ? document.getElementById('os-observations').value : '';

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
        const paymentStatus = document.getElementById('os-payment-status') ? document.getElementById('os-payment-status').value : 'Pendente';
        const valPaid = paymentStatus === 'Pago Parcialmente' ? (parseFloat(document.getElementById('os-val-paid').value) || 0) : 0;

        const osData = {
            id: id || Date.now().toString(),
            number, date,
            startTime, endTime,
            clientId, clientName, clientDoc, clientPhone, clientAddress, isManual,
            vehicleModel, vehicleYear, vehiclePlate, vehicleKm, vehicleWarranty,
            description,
            observations,
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
            status,
            paymentStatus,
            valPaid
        };

        let osRecords = window.StorageApp.get('os_records') || [];

        if (id) {
            const index = osRecords.findIndex(o => o.id === id);
            // Preserva dados fiscais e financeiros que não fazem parte do formulário da OS.
            if (index !== -1) osRecords[index] = { ...osRecords[index], ...osData };
        } else {
            osRecords.push(osData);
        }

        window.StorageApp.save('os_records', osRecords);
        // Cada OS com valor gera/atualiza uma conta a receber; o pagamento fica separado
        // para não ser perdido ao editar a ordem.
        if (window.FinancialModule) window.FinancialModule.syncReceivableForOS(osData);
        alert('OS Salva com sucesso!');

        // If it was a new OS, update the ID field so subsequent saves updates this record
        // And show print button
        if (!id) {
            document.getElementById('os-id').value = osData.id;
        }
        document.getElementById('btn-print-os').classList.remove('hidden');

        const btnNFSe = document.getElementById('btn-nfse-form');
        if (btnNFSe) {
            btnNFSe.classList.remove('hidden');
            if (osData.nfseStatus === 'emitida') {
                btnNFSe.style.backgroundColor = '#28a745';
                btnNFSe.innerHTML = '<i class="fa-solid fa-file-invoice"></i> Ver DANFSE (PDF)';
            } else {
                btnNFSe.style.backgroundColor = '#17a2b8';
                btnNFSe.innerHTML = '<i class="fa-solid fa-file-invoice-dollar"></i> Emitir NFS-e';
            }
        }

        const btnDelete = document.getElementById('btn-delete-os');
        if (btnDelete) btnDelete.classList.remove('hidden');
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
            document.getElementById('os-start-time').value = os.startTime || '';
            document.getElementById('os-end-time').value = os.endTime || '';

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
            const obsInput = document.getElementById('os-observations');
            if (obsInput) obsInput.value = os.observations || '';

            document.getElementById('val-parts').value = os.values.parts || '';
            document.getElementById('val-machine').value = os.values.machine || '';
            document.getElementById('val-labor').value = os.values.labor || '';
            document.getElementById('val-misc').value = os.values.misc || '';
            document.getElementById('val-discount').value = os.values.discount || '';
            document.getElementById('desc-misc').value = os.values.miscDesc || '';

            document.getElementById('os-tech-select').value = os.techName;
            document.getElementById('os-status').value = os.status || 'Pendente';
            const paySelect = document.getElementById('os-payment-status');
            if (paySelect) {
                paySelect.value = os.paymentStatus || 'Pendente';
            }
            const valPaidInput = document.getElementById('os-val-paid');
            if (valPaidInput) {
                valPaidInput.value = os.valPaid || '';
            }
            OSModule.togglePartialPaymentFields();

            OSModule.calculateTotal();
            document.getElementById('btn-print-os').classList.remove('hidden');

            const btnNFSe = document.getElementById('btn-nfse-form');
            if (btnNFSe) {
                btnNFSe.classList.remove('hidden');
                if (os.nfseStatus === 'emitida') {
                    btnNFSe.style.backgroundColor = '#28a745';
                    btnNFSe.innerHTML = '<i class="fa-solid fa-file-invoice"></i> Ver DANFSE (PDF)';
                } else {
                    btnNFSe.style.backgroundColor = '#17a2b8';
                    btnNFSe.innerHTML = '<i class="fa-solid fa-file-invoice-dollar"></i> Emitir NFS-e';
                }
            }

            const btnDelete = document.getElementById('btn-delete-os');
            if (btnDelete) btnDelete.classList.remove('hidden');
        }
    },

    deleteOS: async (id) => {
        let osRecords = window.StorageApp.get('os_records') || [];
        const os = osRecords.find(o => o.id === id);
        if (!os) return;

        if (confirm(`Tem certeza que deseja EXCLUIR a Ordem de Serviço #${os.number}? Esta ação não poderá ser desfeita.`)) {
            osRecords = osRecords.filter(o => o.id !== id);
            await window.StorageApp.save('os_records', osRecords);
            alert(`OS #${os.number} excluída com sucesso.`);
            
            const currentFormId = document.getElementById('os-id') ? document.getElementById('os-id').value : '';
            if (currentFormId === id) {
                OSModule.hideForm();
            } else {
                OSModule.loadOSList();
            }
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
                                 <span>${new Date(os.date.includes('T') ? os.date : os.date + 'T00:00:00').toLocaleDateString('pt-BR')} ${os.startTime ? ' às ' + os.startTime : ''}</span>
                             </div>
                             ${os.endTime ? `
                             <div class="field-box">
                                 <label>PREVISÃO ENTREGA</label>
                                 <span>${os.endTime}</span>
                             </div>` : ''}
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

                ${os.observations ? `
                <!-- Section: Observations -->
                <section class="section">
                    <h3 class="section-title">OBSERVAÇÕES</h3>
                    <div class="description-content" style="font-style: italic; color: #555;">
                        ${os.observations.replace(/\n/g, '<br>')}
                    </div>
                </section>
                ` : ''}

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
                <title>OS_${os.number}_${os.clientName.replace(/[^a-zA-Z0-9]/g, '_')}</title>
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
    },

    downloadSingleOSPDF: (os) => {
        const parts = parseFloat(os.values.parts) || 0;
        const machine = parseFloat(os.values.machine) || 0;
        const labor = parseFloat(os.values.labor) || 0;
        const discount = parseFloat(os.values.discount) || 0;
        const misc = parseFloat(os.values.misc) || 0;
        const total = parseFloat(os.values.total) || 0;

        const printStyles = `
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
            body { font-family: 'Roboto', sans-serif; font-size: 10px; color: #333; background: #fff; padding: 20px; }
            .print-page { width: 100%; max-width: 210mm; margin: 0 auto; position: relative; z-index: 1; padding: 8mm 10mm; box-sizing: border-box; background: white; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70%; max-width: 500px; z-index: -1; pointer-events: none; opacity: 0.05; display: flex; justify-content: center; align-items: center; }
            .watermark img { width: 100%; height: auto; border-radius: 50%; background: #000; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #1a3c6e; padding-bottom: 8px; }
            .logo-area { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
            .logo-area img { width: 80px; height: 80px; object-fit: cover; border-radius: 50%; border: 2px solid #1a3c6e; background: #000; }
            .header-info { text-align: right; }
            .header-info h1 { font-size: 18px; color: #1a3c6e; margin: 0; font-weight: 700; text-transform: uppercase; }
            .header-info .phone { font-size: 11px; color: #555; margin-top: 2px; }
            .os-title-bar { text-align: center; font-weight: bold; font-size: 13px; color: white; background-color: #1a3c6e; padding: 4px 0; margin-bottom: 10px; border-radius: 4px; }
            .section { margin-bottom: 10px; }
            .section-title { font-size: 11px; font-weight: 700; color: #1a3c6e; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-bottom: 5px; }
            .info-grid { display: flex; gap: 20px; }
            .col { flex: 1; display: flex; flex-direction: column; gap: 4px; }
            .field-box { display: flex; flex-direction: row; align-items: center; border-bottom: 1px dotted #f0f0f0; padding-bottom: 2px; }
            .field-box label { font-size: 9px; color: #666; text-transform: uppercase; font-weight: 500; width: 90px; flex-shrink: 0; }
            .field-box span { font-size: 11px; font-weight: 600; color: #000; }
            .description-content { border: 1px solid #ddd; padding: 8px; min-height: 60px; max-height: 300px; font-size: 10px; line-height: 1.3; overflow: hidden; }
            .values-list { display: flex; flex-direction: column; border: 1px solid #eee; }
            .value-row { display: flex; justify-content: space-between; padding: 3px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
            .value-row:last-child { border-bottom: none; }
            .value-row span:first-child { font-weight: 500; color: #444; }
            .value-row .value { font-weight: bold; color: #000; }
            .value-row.total { background-color: #f0f4f8; border-top: 2px solid #1a3c6e; padding: 8px; font-size: 14px; }
            .value-row.total span { color: #1a3c6e; font-weight: 800; }
            .footer-info-box { border: 1px solid #ccc; padding: 6px 10px; margin-bottom: 15px; color: #555; font-size: 9px; display: flex; justify-content: space-between; background: #f9f9f9; }
            .signatures { display: flex; justify-content: space-between; margin-top: 25px; margin-bottom: 10px; }
            .sig-line { width: 40%; border-top: 1px solid #000; text-align: center; padding-top: 4px; font-size: 10px; color: #444; }
            .terms { margin-top: 10px; font-size: 8.5px; text-align: center; color: #666; font-style: italic; line-height: 1.2; }
        `;

        const htmlContent = `
            <div style="font-family: 'Roboto', sans-serif; background: #fff; color: #333; padding: 10px; width: 750px;">
                <style>${printStyles}</style>
                <div class="print-page">
                    <!-- Watermark Background -->
                    <div class="watermark">
                         <img src="https://gleicysanrocha.github.io/gdn-automotive-system/assets/img/logo.png" alt="GDN Watermark">
                    </div>

                    <header class="header">
                        <div class="logo-area">
                            <img src="https://gleicysanrocha.github.io/gdn-automotive-system/assets/img/logo.png" alt="GDN Serviços Automotivos">
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
                                     <span>${new Date(os.date.includes('T') ? os.date : os.date + 'T00:00:00').toLocaleDateString('pt-BR')} ${os.startTime ? ' às ' + os.startTime : ''}</span>
                                 </div>
                                 ${os.endTime ? '<div class="field-box"><label>PREVISÃO ENTREGA</label><span>' + os.endTime + '</span></div>' : ''}
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

                    ${os.observations ? '<!-- Section: Observations --><section class="section"><h3 class="section-title">OBSERVAÇÕES</h3><div class="description-content" style="font-style: italic; color: #555;">' + os.observations.replace(/\n/g, '<br>') + '</div></section>' : ''}

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
                            ${misc > 0 ? '<div class="value-row"><span>Outros (' + (os.values.miscDesc || '') + ')</span><span class="value">R$ ' + misc.toFixed(2) + '</span></div>' : ''}
                            ${discount > 0 ? '<div class="value-row discount"><span>Desconto</span><span class="value">- R$ ' + discount.toFixed(2) + '</span></div>' : ''}
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
            </div>
        `;

        if (typeof html2pdf === 'undefined') {
            alert('Aguarde o carregamento do gerador de PDFs. Tente novamente em 2 segundos.');
            return;
        }

        const opt = {
            margin: 10,
            filename: `OS_${os.number}_${os.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(htmlContent).set(opt).save();
    },

    printMultipleOS: (ids) => {
        const osRecords = window.StorageApp.get('os_records') || [];
        let combinedHtml = '';

        for (const id of ids) {
            const os = osRecords.find(o => o.id === id);
            if (!os) continue;

            // Ensure values are numbers
            const parts = parseFloat(os.values.parts) || 0;
            const machine = parseFloat(os.values.machine) || 0;
            const labor = parseFloat(os.values.labor) || 0;
            const discount = parseFloat(os.values.discount) || 0;
            const misc = parseFloat(os.values.misc) || 0;
            const total = parseFloat(os.values.total) || 0;

            combinedHtml += `
            <div class="print-page" style="page-break-after: always; position: relative; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px dashed #ccc;">
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
                                 <span>${new Date(os.date.includes('T') ? os.date : os.date + 'T00:00:00').toLocaleDateString('pt-BR')} ${os.startTime ? ' às ' + os.startTime : ''}</span>
                             </div>
                             ${os.endTime ? `
                             <div class="field-box">
                                 <label>PREVISÃO ENTREGA</label>
                                 <span>${os.endTime}</span>
                             </div>` : ''}
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

                ${os.observations ? `
                <!-- Section: Observations -->
                <section class="section">
                    <h3 class="section-title">OBSERVAÇÕES</h3>
                    <div class="description-content" style="font-style: italic; color: #555;">
                        ${os.observations.replace(/\n/g, '<br>')}
                    </div>
                </section>
                ` : ''}

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
                            <span>Outros (${os.values.miscDesc || ''})</span>
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
        }

        const win = window.open('', '', 'width=900,height=700');
        win.document.write(`
            <html>
            <head>
                <title>Recibos OS em Lote</title>
                <link rel="stylesheet" href="css/print.css">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 20px; }
                    @media print {
                        body { padding: 0; }
                        .print-page { page-break-after: always; border-bottom: none !important; margin-bottom: 0 !important; padding-bottom: 0 !important; }
                    }
                </style>
            </head>
            <body>
                ` + combinedHtml + `
                <script>
                    window.onload = function() { setTimeout(() => window.print(), 800); }
                </script>
            </body>
            </html>
        `);
        win.document.close();
    },

    pendingExcelData: [],

    processExcelFile: (file) => {
        if (typeof XLSX === 'undefined') {
            alert('Biblioteca SheetJS (XLSX) não carregada. Verifique sua conexão de internet.');
            return;
        }

        const headerMode = document.getElementById('excel-header-row')?.value || 'auto';

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Read as 2D matrix (array of arrays)
                const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

                if (!matrix || matrix.length === 0) {
                    alert('Nenhum registro encontrado na planilha enviada.');
                    return;
                }

                // 1. Determine header row index
                let headerRowIdx = 1; // Default to row 2 (index 1) for GDN double-header structure
                if (headerMode === 'auto') {
                    for (let r = 0; r < Math.min(matrix.length, 10); r++) {
                        const rowStr = matrix[r].map(c => String(c).toLowerCase()).join(' ');
                        if (rowStr.includes('id o.s') || rowStr.includes('data entr') || (rowStr.includes('cliente') && rowStr.includes('model'))) {
                            headerRowIdx = r;
                            break;
                        }
                    }
                } else if (headerMode === '1') {
                    headerRowIdx = 0;
                }

                const rawHeaders = matrix[headerRowIdx].map(c => String(c).trim());
                const dataRows = matrix.slice(headerRowIdx + 1);

                if (!dataRows || dataRows.length === 0) {
                    alert('Nenhuma linha de dados encontrada abaixo do cabeçalho.');
                    return;
                }

                // Helper to search column value by keyword in header row
                // Pass 1 (exact): prevents short headers like "an" from matching unrelated columns
                // Pass 2 (forward-only): header must CONTAIN the keyword (never the reverse)
                const findValInRow = (rowArray, keys) => {
                    const cleanKeys = keys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));

                    // 1st pass: exact match (handles abbreviated headers like "An", "KM")
                    let colIndex = rawHeaders.findIndex(h => {
                        const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return cleanKeys.some(ck => cleanH === ck);
                    });

                    // 2nd pass: header contains keyword (forward only, avoids false positives)
                    if (colIndex === -1) {
                        colIndex = rawHeaders.findIndex(h => {
                            const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
                            return cleanKeys.some(ck => cleanH.includes(ck));
                        });
                    }

                    if (colIndex !== -1 && rowArray[colIndex] !== undefined) {
                        return rowArray[colIndex];
                    }
                    return '';
                };

                // Normalize spreadsheet status to system values
                const normalizeStatus = (raw) => {
                    const s = String(raw).trim().toLowerCase();
                    if (!s || s === 'undefined' || s === 'null') return 'Concluída';
                    // Numeric or clearly non-status value → default
                    if (/^\d+([.,]\d+)?$/.test(s.trim())) return 'Concluída';
                    if (s.includes('finaliz') || s.includes('conclu') || s.includes('pronto') || s.includes('entregue')) return 'Concluída';
                    if (s.includes('andamento') || s.includes('execu') || s.includes('processo') || s.includes('fazendo')) return 'Em Andamento';
                    if (s.includes('aberto') || s.includes('aberta') || s.includes('aguardando') || s.includes('pendente') || s.includes('novo') || s.includes('nova')) return 'Aberta';
                    // Unknown but non-empty status: keep as-is so user can see original
                    return String(raw).trim() || 'Concluída';
                };

                // Helper to parse dates (returns "" if missing/invalid)
                const parseDateVal = (val) => {
                    if (val === undefined || val === null || val === '') return '';
                    if (val instanceof Date && !isNaN(val)) {
                        return `${val.getFullYear()}-${String(val.getMonth() + 1).padStart(2, '0')}-${String(val.getDate()).padStart(2, '0')}`;
                    }
                    if (typeof val === 'number') {
                        const dateObj = XLSX.SSF.parse_date_code(val);
                        if (dateObj) {
                            const y = dateObj.y;
                            const m = String(dateObj.m).padStart(2, '0');
                            const d = String(dateObj.d).padStart(2, '0');
                            return `${y}-${m}-${d}`;
                        }
                        return '';
                    }
                    const str = String(val).trim();
                    if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return '';

                    // Algumas planilhas devolvem o serial do Excel como texto. Trata-o
                    // como data antes de tentar os formatos DD/MM/AAAA e AAAA-MM-DD.
                    if (/^\d{4,6}(\.\d+)?$/.test(str)) {
                        const dateObj = XLSX.SSF.parse_date_code(Number(str));
                        if (dateObj && dateObj.y >= 1900 && dateObj.y <= 2100) {
                            return `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
                        }
                    }
                    
                    // Match DD/MM/YYYY or YYYY-MM-DD
                    const parts = str.split(/[\/\-\.]/);
                    if (parts.length >= 3) {
                        let day, month, year;
                        if (parts[0].length === 4) {
                            year = parts[0]; month = parts[1]; day = parts[2];
                        } else {
                            day = parts[0]; month = parts[1]; year = parts[2];
                            if (year.length === 2) year = '20' + year;
                        }
                        day = String(day).trim().padStart(2, '0');
                        month = String(month).trim().padStart(2, '0');
                        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                            return `${year}-${month}-${day}`;
                        }
                    }
                    return '';
                };

                // Parse currency/number values
                const parseNumVal = (val) => {
                    if (typeof val === 'number') return val;
                    if (!val) return 0;
                    const cleanStr = String(val).replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
                    return parseFloat(cleanStr) || 0;
                };

                const currentYear = new Date().getFullYear();
                const osRecords = window.StorageApp.get('os_records') || [];

                const parsedList = [];

                dataRows.forEach((row) => {
                    // Check if row is empty
                    const rowText = row.map(c => String(c).trim()).join('');
                    if (!rowText) return;

                    // Mantém o tipo original da célula: datas do Excel chegam como número
                    // serial e precisam ser entregues assim ao parseDateVal.
                    const getCol = (idx) => (row[idx] !== undefined && row[idx] !== null) ? row[idx] : '';
                    const getText = (idx) => String(getCol(idx)).trim();

                    // Always use positional mapping if row has enough columns (GDN format uses 15+ cols)
                    const isPositionalGDN = row.length >= 10 || (matrix[headerRowIdx] && matrix[headerRowIdx].length >= 10);

                    // No layout padrão GDN a coluna A é o identificador. Não fazemos
                    // fallback para outra coluna, pois linhas de formatação/fórmulas sem
                    // ID poderiam ser confundidas com OS e inflar a importação.
                    const rawNum = isPositionalGDN ? getText(0) : String(findValInRow(row, ['id os', 'n os', 'numero os', 'os', 'nota', 'n nota', 'id'])).trim();
                    const rawClient = isPositionalGDN ? getText(3) : String(findValInRow(row, ['cliente', 'nome cliente', 'nome', 'razao social', 'proprietario'])).trim();

                    // Filter out header title rows
                    const numClean = rawNum.toLowerCase().replace(/[^a-z]/g, '');
                    const clientLower = rawClient.toLowerCase();
                    if (clientLower === 'cliente' || numClean === 'idos' || numClean === 'os' || numClean === 'nos' || clientLower.includes('nome do cliente') || rawNum.toLowerCase().includes('id o.s')) {
                        return; // SKIP HEADER TITLE ROW!
                    }

                    // A planilha possui área formatada além dos 94 registros. Para o
                    // layout GDN, apenas linhas com ID numérico são ordens de serviço.
                    // Exemplos aceitos: 064, 64, 2026.064 e OS-064.
                    if (isPositionalGDN && !/(\d)/.test(rawNum)) return;

                    // Date detection: AUTO PRIORITY
                    // 1st: Data de Entrada   2nd: Data de Saída   3rd: leave blank
                    const rawDateEntrada = isPositionalGDN ? getCol(1) : findValInRow(row, ['data entrada', 'dataentr', 'data entr', 'entrada', 'entr']);
                    const rawDateSaida   = isPositionalGDN ? getCol(2) : findValInRow(row, ['data saida', 'datasaida', 'data said', 'datasaid', 'saida', 'said']);

                    let rawDate = '';
                    if (rawDateEntrada) {
                        rawDate = rawDateEntrada;          // Prefer entrada
                    } else if (rawDateSaida) {
                        rawDate = rawDateSaida;            // Fallback to saída
                    }

                    const parsedDate = parseDateVal(rawDate);

                    const rawPhone = isPositionalGDN ? getText(4) : findValInRow(row, ['telefone', 'celular', 'contato', 'whatsapp', 'fone', 'tel', 'cel']);
                    const rawAddress = isPositionalGDN ? getText(5) : findValInRow(row, ['endereco', 'enderec', 'logradouro', 'end']);
                    const rawDoc = isPositionalGDN ? getText(7) : findValInRow(row, ['cpf/cnpj cliente', 'cpf/cnpj', 'cpfcnpj', 'cpf', 'cnpj', 'documento', 'doc']);
                    const rawTech = isPositionalGDN ? getText(6) : findValInRow(row, ['tecnico responsavel', 'tecnicoresp', 'responsavel', 'tecnico', 'resp', 'tech']);
                    const rawVehicle = isPositionalGDN ? getText(8) : findValInRow(row, ['modelo', 'model', 'veiculo', 'carro', 'automovel', 'vei']);
                    const rawPlate = isPositionalGDN ? getText(9) : findValInRow(row, ['placa', 'plac', 'identificacao']);
                    const rawColor = isPositionalGDN ? getText(10) : findValInRow(row, ['cor carro', 'cor']);
                    const rawWarranty = isPositionalGDN ? getText(11) : findValInRow(row, ['garantia', 'garan', 'garant']);
                    const rawYear = isPositionalGDN ? getText(12) : findValInRow(row, ['ano', 'an']);
                    const rawKm = isPositionalGDN ? getText(13) : findValInRow(row, ['km entrada', 'kmentra', 'km entra', 'km', 'quilometragem', 'odometro']);
                    const rawService = isPositionalGDN ? getText(14) : findValInRow(row, ['servico', 'servicos', 'servico realizado', 'descricao', 'detalhes', 'observacao', 'obs']);
                    const rawPartsVal = parseNumVal(isPositionalGDN ? getCol(15) : findValInRow(row, ['valor das pecas', 'valor pecas', 'vl pecas', 'pecas']));
                    const rawMachineVal = parseNumVal(isPositionalGDN ? getCol(16) : findValInRow(row, ['valor da retifica', 'valor retifica', 'vl retifica', 'retifica']));
                    const rawLaborVal = parseNumVal(isPositionalGDN ? getCol(17) : findValInRow(row, ['valor mao de obra', 'mao de obra', 'vl mao de obra', 'mo', 'mao obra']));
                    const rawStatus = isPositionalGDN ? getCol(18) : findValInRow(row, ['status', 'situacao', 'estado']);
                    const rawTotalVal = parseNumVal(isPositionalGDN ? (getCol(20) || getCol(19)) : findValInRow(row, ['valor total', 'total', 'vlr total', 'preco']));

                    const calculatedTotal = rawTotalVal > 0 ? rawTotalVal : (rawPartsVal + rawMachineVal + rawLaborVal);

                    let numStr = rawNum;
                    if (!numStr) {
                        numStr = `${currentYear}.${String(osRecords.length + parsedList.length + 1).padStart(3, '0')}`;
                    }

                    parsedList.push({
                        number: numStr,
                        date: parsedDate,
                        clientName: rawClient || 'Cliente Avulso',
                        clientPhone: String(rawPhone).trim(),
                        clientAddress: String(rawAddress).trim(),
                        clientDoc: String(rawDoc).trim(),
                        techName: String(rawTech).trim(),
                        vehicleModel: String(rawVehicle).trim() || 'Veículo Não Informado',
                        vehiclePlate: String(rawPlate).trim().toUpperCase(),
                        vehicleColor: String(rawColor).trim(),
                        vehicleWarranty: String(rawWarranty).trim() || '3 meses',
                        vehicleYear: String(rawYear).trim(),
                        vehicleKm: String(rawKm).trim(),
                        description: String(rawService).trim() || 'Serviço Importado via Planilha',
                        valParts: rawPartsVal,
                        valMachine: rawMachineVal,
                        valLabor: rawLaborVal,
                        totalVal: calculatedTotal,
                        status: normalizeStatus(rawStatus)
                    });
                });

                OSModule.pendingExcelData = parsedList;
                OSModule.renderExcelPreview();

            } catch (err) {
                console.error('Erro ao ler planilha:', err);
                alert('Erro ao processar planilha. Verifique se o arquivo não está corrompido.');
            }
        };

        reader.readAsArrayBuffer(file);
    },

    renderExcelPreview: () => {
        const tbody = document.getElementById('excel-preview-body');
        const countSpan = document.getElementById('excel-count');
        if (countSpan) countSpan.textContent = OSModule.pendingExcelData.length;
        if (!tbody) return;

        tbody.innerHTML = '';

        if (OSModule.pendingExcelData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Nenhum item pendente para importar.</td></tr>';
            const btnConfirm = document.getElementById('btn-confirm-excel');
            if (btnConfirm) btnConfirm.classList.add('hidden');
            return;
        }

        OSModule.pendingExcelData.forEach((item, idx) => {
            const tr = document.createElement('tr');
            let dateDisplay = item.date ? item.date.split('-').reverse().join('/') : '<em style="color:#aaa;">Sem Data</em>';
            tr.innerHTML = `
                <td><strong>#${item.number}</strong></td>
                <td>${dateDisplay}</td>
                <td>${item.clientName}</td>
                <td>${item.vehicleModel} ${item.vehiclePlate ? `(${item.vehiclePlate})` : ''}</td>
                <td><small>${item.description.substring(0, 35)}${item.description.length > 35 ? '...' : ''}</small></td>
                <td>R$ ${item.totalVal.toFixed(2)}</td>
                <td><span style="background: #28a74520; color: #28a745; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${item.status}</span></td>
                <td style="text-align: center;">
                    <button type="button" class="btn btn-sm btn-danger remove-preview-item" data-idx="${idx}" style="padding: 2px 7px;" title="Remover este item da prévia">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.remove-preview-item').forEach(btn => {
            btn.onclick = (e) => {
                const targetBtn = e.target.closest('button');
                const idx = parseInt(targetBtn.getAttribute('data-idx'));
                OSModule.pendingExcelData.splice(idx, 1);
                OSModule.renderExcelPreview();
            };
        });

        document.getElementById('excel-preview-container').classList.remove('hidden');
        document.getElementById('btn-confirm-excel').classList.remove('hidden');
    },

    confirmExcelImport: async () => {
        if (!OSModule.pendingExcelData || OSModule.pendingExcelData.length === 0) {
            alert('Nenhum dado pendente para importação.');
            return;
        }

        const btn = document.getElementById('btn-confirm-excel');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando importação...';

        try {
            const clearExisting = document.getElementById('excel-clear-existing')?.checked;
            let osRecords = clearExisting ? [] : (window.StorageApp.get('os_records') || []);
            let clients = window.StorageApp.get('clients') || [];
            let newClientsCount = 0;
            let newOSCount = 0;

            OSModule.pendingExcelData.forEach((row, idx) => {
                let clientObj = clients.find(c => c.name.toLowerCase().trim() === row.clientName.toLowerCase().trim());
                if (!clientObj && row.clientName !== 'Cliente Avulso') {
                    clientObj = {
                        id: Date.now().toString() + '_c_' + idx,
                        name: row.clientName,
                        phone: row.clientPhone,
                        document: row.clientDoc,
                        address: row.clientAddress || '',
                        carModel: row.vehicleModel,
                        carPlate: row.vehiclePlate,
                        createdAt: new Date().toISOString()
                    };
                    clients.push(clientObj);
                    newClientsCount++;
                }

                const osData = {
                    id: Date.now().toString() + '_imp_' + idx,
                    number: row.number,
                    date: row.date, // "" if no date
                    startTime: '08:00',
                    endTime: '18:00',
                    clientId: clientObj ? clientObj.id : '',
                    clientName: row.clientName,
                    clientDoc: row.clientDoc || (clientObj ? clientObj.document : ''),
                    clientPhone: row.clientPhone || (clientObj ? clientObj.phone : ''),
                    clientAddress: row.clientAddress || (clientObj ? clientObj.address : ''),
                    isManual: !clientObj,
                    vehicleModel: row.vehicleModel,
                    vehicleYear: row.vehicleYear,
                    vehiclePlate: row.vehiclePlate,
                    vehicleKm: row.vehicleKm,
                    vehicleWarranty: row.vehicleWarranty || '3 meses',
                    description: row.description,
                    values: {
                        parts: row.valParts || 0,
                        machine: row.valMachine || 0,
                        labor: row.valLabor || 0,
                        misc: 0,
                        discount: 0,
                        miscDesc: '',
                        total: row.totalVal
                    },
                    techName: row.techName || '',
                    status: row.status || 'Concluída'
                };

                osRecords.push(osData);
                newOSCount++;
            });

            await window.StorageApp.save('clients', clients);
            await window.StorageApp.save('os_records', osRecords);
            // Importações antigas não trazem pagamento de forma confiável: entram como
            // pendentes e podem ser baixadas, inclusive parcialmente, no Financeiro.
            if (window.FinancialModule) await window.FinancialModule.syncAllOS();

            alert(`Importação concluída com sucesso!\n\n- ${newOSCount} Ordens de Serviço geradas.\n- ${newClientsCount} novos clientes cadastrados.`);

            document.getElementById('excel-import-modal').classList.add('hidden');
            OSModule.pendingExcelData = [];
            OSModule.loadOSList();
        } catch (err) {
            console.error('Erro ao importar ordens:', err);
            alert('Falha ao concluir importação: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Confirmar e Gerar Ordens de Serviço';
        }
    },

    updateSelectedCount: () => {
        const checked = document.querySelectorAll('.os-checkbox:checked');
        const countSpan = document.getElementById('selected-os-count');
        const btnDeleteSelected = document.getElementById('btn-delete-selected-os');

        if (countSpan) countSpan.textContent = checked.length;

        if (btnDeleteSelected) {
            if (checked.length > 0) {
                btnDeleteSelected.classList.remove('hidden');
            } else {
                btnDeleteSelected.classList.add('hidden');
            }
        }
        const bulkContainer = document.getElementById('bulk-actions-container');
        if (bulkContainer) {
            if (checked.length > 0) {
                bulkContainer.classList.remove('hidden');
            } else {
                bulkContainer.classList.add('hidden');
            }
        }
    },

    deleteSelectedOS: async () => {
        const checkedInputs = document.querySelectorAll('.os-checkbox:checked');
        if (checkedInputs.length === 0) return;

        const idsToDelete = Array.from(checkedInputs).map(cb => cb.getAttribute('data-id'));

        if (confirm(`Tem certeza que deseja excluir as ${idsToDelete.length} Ordens de Serviço selecionadas?`)) {
            let osRecords = window.StorageApp.get('os_records') || [];
            osRecords = osRecords.filter(o => !idsToDelete.includes(o.id));
            await window.StorageApp.save('os_records', osRecords);
            alert(`${idsToDelete.length} Ordem(ns) de Serviço excluída(s) com sucesso!`);
            OSModule.loadOSList();
        }
    },

    deleteAllOS: async () => {
        const osRecords = window.StorageApp.get('os_records') || [];
        if (osRecords.length === 0) {
            alert('Não há Nenhuma Ordem de Serviço cadastrada para excluir.');
            return;
        }

        const confirm1 = confirm(`ATENÇÃO!\n\nVocê está prestes a EXCLUIR TODAS as ${osRecords.length} Ordens de Serviço do sistema!\n\nEsta ação é permanente e irreversível. Deseja continuar?`);
        if (confirm1) {
            const confirm2 = prompt('Para confirmar a exclusão de TODAS as Ordens de Serviço, digite a palavra "EXCLUIR":');
            if (confirm2 && confirm2.trim().toUpperCase() === 'EXCLUIR') {
                await window.StorageApp.save('os_records', []);
                alert('Todas as Ordens de Serviço foram excluídas com sucesso!');
                OSModule.loadOSList();
            } else {
                alert('Ação cancelada. A palavra de confirmação digitada foi incorreta.');
            }
        }
    }
};
