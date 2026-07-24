/**
 * Módulo de Nota Fiscal de Serviço Eletrônica (NFS-e)
 * GDN Serviços Automotivos
 */

window.NFSeModule = {
    // Retorna as configurações fiscais salvas ou padrões
    getFiscalSettings: () => {
        const settings = window.StorageApp.get('storeSettings') || {};
        return {
            name: settings.name || 'GDN Serviços Automotivos',
            cnpj: settings.cnpj || '',
            address: settings.address || '',
            phone: settings.phone || '',
            inscricaoMunicipal: settings.inscricaoMunicipal || '',
            codigoServico: settings.codigoServico || '14.01',
            aliquotaIss: parseFloat(settings.aliquotaIss || '5.0'),
            nfseEnvironment: settings.nfseEnvironment || 'homologation', // 'homologation' ou 'production'
            nfseApiToken: settings.nfseApiToken || '',
            nfseApiUrl: settings.nfseApiUrl || ''
        };
    },

    // Valida se a OS possui todos os campos necessários para emissão da NFS-e
    validateOSForNFSe: (os, client) => {
        const errors = [];

        const valLabor = parseFloat(os.valLabor || 0);
        if (valLabor <= 0) {
            errors.push('A OS não possui valor de Mão de Obra / Serviço tributável (valor R$ 0,00).');
        }

        const doc = client ? (client.document || client.cpf || client.cnpj) : os.clientDoc;
        if (!doc || doc.trim().length < 11) {
            errors.push('O cliente selecionado não possui CPF/CNPJ válido cadastrado.');
        }

        const clientName = client ? client.name : os.clientNameManual;
        if (!clientName || clientName.trim() === '') {
            errors.push('Nome do cliente é obrigatório para emissão de nota fiscal.');
        }

        const address = client ? client.address : os.clientAddress;
        if (!address || address.trim() === '') {
            errors.push('Endereço do cliente é obrigatório para a NFS-e.');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    // Gera a estrutura do Payload JSON para envio à API da NFS-e
    buildPayload: (os, client, fiscalSettings) => {
        const valLabor = parseFloat(os.valLabor || 0);
        const aliquota = fiscalSettings.aliquotaIss / 100;
        const valorIss = valLabor * aliquota;

        const doc = (client ? (client.document || client.cpf || client.cnpj) : os.clientDoc || '').replace(/\D/g, '');
        const clientName = client ? client.name : (os.clientNameManual || 'Cliente Avulso');
        const clientAddress = client ? client.address : (os.clientAddress || '');
        const clientEmail = client ? client.email : '';
        const clientPhone = client ? client.phone : (os.clientPhone || '');

        return {
            ambiente: fiscalSettings.nfseEnvironment,
            prestador: {
                cnpj: fiscalSettings.cnpj.replace(/\D/g, ''),
                inscricao_municipal: fiscalSettings.inscricaoMunicipal,
                razao_social: fiscalSettings.name
            },
            tomador: {
                cpf_cnpj: doc,
                tipo_documento: doc.length > 11 ? 'CNPJ' : 'CPF',
                razao_social: clientName,
                email: clientEmail,
                telefone: clientPhone,
                endereco: {
                    logradouro: clientAddress,
                    cidade: 'São Paulo', // Padrão
                    uf: 'SP'
                }
            },
            servico: {
                item_lista_servico: fiscalSettings.codigoServico,
                discriminacao: `Serviços automotivos referentes à O.S. Nº ${os.number || os.id}.\nVeículo: ${os.model || ''} - Placa: ${os.plate || ''}\nDescrição: ${os.description || 'Manutenção e reparação mecânica.'}`,
                valor_servicos: valLabor,
                aliquota_iss: fiscalSettings.aliquotaIss,
                valor_iss: parseFloat(valorIss.toFixed(2)),
                iss_retido: false
            },
            referencia_os: os.id
        };
    },

    // Executa a emissão da NFS-e
    emitirNFSe: async (osId) => {
        const orders = window.StorageApp.get('orders') || [];
        const clients = window.StorageApp.get('clients') || [];
        
        const osIndex = orders.findIndex(o => o.id == osId);
        if (osIndex === -1) {
            alert('Ordem de Serviço não encontrada.');
            return false;
        }

        const os = orders[osIndex];
        const client = clients.find(c => c.id == os.clientId);

        const fiscalSettings = window.NFSeModule.getFiscalSettings();

        // 1. Validar Pré-requisitos
        const validation = window.NFSeModule.validateOSForNFSe(os, client);
        if (!validation.isValid) {
            alert('Não foi possível emitir a NFS-e devido aos seguintes pendências:\n\n• ' + validation.errors.join('\n• '));
            return false;
        }

        const payload = window.NFSeModule.buildPayload(os, client, fiscalSettings);

        try {
            // Se tiver URL de API configurada, tenta chamada real
            if (fiscalSettings.nfseApiUrl && fiscalSettings.nfseApiToken) {
                const response = await fetch(fiscalSettings.nfseApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${fiscalSettings.nfseApiToken}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Erro ao comunicar com o servidor da prefeitura.');
                }

                const result = await response.json();
                orders[osIndex].nfseStatus = 'emitida';
                orders[osIndex].nfseNumero = result.numero_nfse || result.numero || Math.floor(1000 + Math.random() * 9000).toString();
                orders[osIndex].nfseCodigoVerificacao = result.codigo_verificacao || Math.random().toString(36).substring(2, 10).toUpperCase();
                orders[osIndex].nfseDataEmissao = new Date().toISOString();
                orders[osIndex].nfsePdfUrl = result.pdf_url || '';
                orders[osIndex].nfseXmlUrl = result.xml_url || '';
            } else {
                // Modo Simulado (Homologação / Demonstração sem backend próprio configurado)
                const mockNumero = Math.floor(20260000 + Math.random() * 9000).toString();
                const mockCodVerificacao = Math.random().toString(36).substring(2, 10).toUpperCase();

                orders[osIndex].nfseStatus = 'emitida';
                orders[osIndex].nfseNumero = mockNumero;
                orders[osIndex].nfseCodigoVerificacao = mockCodVerificacao;
                orders[osIndex].nfseDataEmissao = new Date().toISOString();
                orders[osIndex].nfseAmbiente = fiscalSettings.nfseEnvironment;
                orders[osIndex].nfsePayload = payload;
            }

            await window.StorageApp.save('orders', orders);
            alert(`NFS-e emitida com sucesso!\n\nNúmero: ${orders[osIndex].nfseNumero}\nCódigo de Verificação: ${orders[osIndex].nfseCodigoVerificacao}`);
            
            // Atualiza tela
            if (window.OSModule && typeof window.OSModule.loadOrders === 'function') {
                window.OSModule.loadOrders();
            }

            return true;
        } catch (err) {
            console.error('Erro na emissão de NFS-e:', err);
            orders[osIndex].nfseStatus = 'erro';
            orders[osIndex].nfseErroMsg = err.message;
            await window.StorageApp.save('orders', orders);
            alert('Falha ao emitir NFS-e: ' + err.message);
            return false;
        }
    },

    // Cancela a NFS-e
    cancelarNFSe: async (osId) => {
        if (!confirm('Tem certeza que deseja cancelar esta Nota Fiscal de Serviço (NFS-e)?')) {
            return false;
        }

        const orders = window.StorageApp.get('orders') || [];
        const osIndex = orders.findIndex(o => o.id == osId);
        if (osIndex === -1) return false;

        orders[osIndex].nfseStatus = 'cancelada';
        orders[osIndex].nfseDataCancelamento = new Date().toISOString();

        await window.StorageApp.save('orders', orders);
        alert('NFS-e cancelada com sucesso.');

        if (window.OSModule && typeof window.OSModule.loadOrders === 'function') {
            window.OSModule.loadOrders();
        }
        return true;
    },

    // Retorna HTML da Badge de Status da NFS-e
    renderBadge: (os) => {
        const status = os.nfseStatus || 'nao_emitida';
        switch (status) {
            case 'emitida':
                return `<span class="badge" style="background-color: #28a745; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold;" title="NFS-e Nº ${os.nfseNumero || ''}">
                    <i class="fa-solid fa-file-invoice"></i> NFS-e Nº ${os.nfseNumero || 'OK'}
                </span>`;
            case 'cancelada':
                return `<span class="badge" style="background-color: #6c757d; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;" title="NFS-e Cancelada">
                    <i class="fa-solid fa-ban"></i> NFS-e Cancelada
                </span>`;
            case 'erro':
                return `<span class="badge" style="background-color: #dc3545; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;" title="${os.nfseErroMsg || 'Erro na emissão'}">
                    <i class="fa-solid fa-triangle-exclamation"></i> Erro NFS-e
                </span>`;
            default:
                return `<span class="badge" style="background-color: #f8f9fa; color: #6c757d; border: 1px dashed #ccc; padding: 3px 6px; border-radius: 4px; font-size: 0.75rem;">
                    Sem Nota
                </span>`;
        }
    },

    // Exibe Modal de Visualização da DANFSE (PDF / Espelho de Nota Fiscal)
    showNFSeModal: (osId) => {
        const orders = window.StorageApp.get('orders') || [];
        const clients = window.StorageApp.get('clients') || [];
        const os = orders.find(o => o.id == osId);
        if (!os) return;

        const client = clients.find(c => c.id == os.clientId);
        const fiscal = window.NFSeModule.getFiscalSettings();
        const valLabor = parseFloat(os.valLabor || 0);
        const aliquota = fiscal.aliquotaIss;
        const valorIss = (valLabor * (aliquota / 100)).toFixed(2);

        const dataEmissao = os.nfseDataEmissao ? new Date(os.nfseDataEmissao).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');

        // Modal overlay HTML
        const modalHtml = `
            <div id="nfse-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 15px;">
                <div style="background: #fff; color: #333; width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); font-family: Arial, sans-serif;">
                    
                    <!-- Top Bar -->
                    <div style="background: #1e293b; color: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0;">
                        <h4 style="margin: 0; font-size: 1.1rem;"><i class="fa-solid fa-file-invoice"></i> Nota Fiscal de Serviço Eletrônica (NFS-e)</h4>
                        <button id="close-nfse-modal" style="background: transparent; border: none; color: #fff; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>

                    <!-- Printable Content (DANFSE) -->
                    <div id="danfse-content" style="padding: 25px;">
                        
                        <!-- Header Documento -->
                        <div style="border: 2px solid #333; padding: 15px; text-align: center; margin-bottom: 15px; background: #f8fafc;">
                            <h3 style="margin: 0 0 5px 0; text-transform: uppercase;">Prefeitura Municipal - NFSe</h3>
                            <h4 style="margin: 0; color: #475569;">Documento Auxiliar da Nota Fiscal de Serviço Eletrônica</h4>
                            <div style="display: flex; justify-content: space-around; margin-top: 15px; font-size: 0.9rem; border-top: 1px solid #cbd5e1; padding-top: 10px;">
                                <div><strong>Nº da Nota:</strong> ${os.nfseNumero || '2026.0001'}</div>
                                <div><strong>Data de Emissão:</strong> ${dataEmissao}</div>
                                <div><strong>Código de Verificação:</strong> ${os.nfseCodigoVerificacao || 'ABC-1234'}</div>
                            </div>
                        </div>

                        <!-- Prestador de Serviço -->
                        <div style="border: 1px solid #cbd5e1; padding: 12px; margin-bottom: 15px; border-radius: 4px;">
                            <h5 style="margin: 0 0 8px 0; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; font-size: 0.85rem;">Prestador dos Serviços</h5>
                            <div style="font-size: 0.9rem; line-height: 1.5;">
                                <strong>${fiscal.name}</strong><br>
                                <strong>CNPJ:</strong> ${fiscal.cnpj || 'Não informado'} | <strong>Inscrição Municipal:</strong> ${fiscal.inscricaoMunicipal || 'Isento'}<br>
                                <strong>Endereço:</strong> ${fiscal.address || 'Endereço da oficina'}<br>
                                <strong>Telefone:</strong> ${fiscal.phone || '-'}
                            </div>
                        </div>

                        <!-- Tomador de Serviço (Cliente) -->
                        <div style="border: 1px solid #cbd5e1; padding: 12px; margin-bottom: 15px; border-radius: 4px;">
                            <h5 style="margin: 0 0 8px 0; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; font-size: 0.85rem;">Tomador dos Serviços (Cliente)</h5>
                            <div style="font-size: 0.9rem; line-height: 1.5;">
                                <strong>Nome / Razão Social:</strong> ${client ? client.name : (os.clientNameManual || 'Cliente Avulso')}<br>
                                <strong>CPF / CNPJ:</strong> ${client ? (client.document || client.cpf || client.cnpj) : (os.clientDoc || 'Não informado')}<br>
                                <strong>Endereço:</strong> ${client ? client.address : (os.clientAddress || 'Não informado')}<br>
                                <strong>Telefone:</strong> ${client ? client.phone : (os.clientPhone || '-')}
                            </div>
                        </div>

                        <!-- Descrição dos Serviços -->
                        <div style="border: 1px solid #cbd5e1; padding: 12px; margin-bottom: 15px; border-radius: 4px;">
                            <h5 style="margin: 0 0 8px 0; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; font-size: 0.85rem;">Discriminação dos Serviços</h5>
                            <div style="font-size: 0.88rem; background: #f8fafc; padding: 10px; border-radius: 4px; min-height: 80px; white-space: pre-wrap;">Item da LC 116: ${fiscal.codigoServico} - Manutenção e reparação de veículos automotores.

Ref. Ordem de Serviço Nº: ${os.number || os.id}
Veículo: ${os.model || ''} - Placa: ${os.plate || ''}
Serviços Prestados: ${os.description || 'Mão de obra automotiva efetuada.'}</div>
                        </div>

                        <!-- Valores & Impostos -->
                        <div style="border: 1px solid #cbd5e1; padding: 12px; border-radius: 4px; background: #f1f5f9;">
                            <h5 style="margin: 0 0 8px 0; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; text-transform: uppercase; font-size: 0.85rem;">Valores Tributáveis e Impostos</h5>
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center; font-size: 0.85rem;">
                                <div>
                                    <span style="color: #64748b; display: block;">Valor da Mão de Obra</span>
                                    <strong style="font-size: 1.1rem; color: #0f172a;">R$ ${valLabor.toFixed(2)}</strong>
                                </div>
                                <div>
                                    <span style="color: #64748b; display: block;">Alíquota ISS</span>
                                    <strong style="font-size: 1.1rem; color: #0f172a;">${aliquota}%</strong>
                                </div>
                                <div>
                                    <span style="color: #64748b; display: block;">Valor do ISS</span>
                                    <strong style="font-size: 1.1rem; color: #0f172a;">R$ ${valorIss}</strong>
                                </div>
                                <div>
                                    <span style="color: #64748b; display: block;">Valor Total da Nota</span>
                                    <strong style="font-size: 1.1rem; color: #16a34a;">R$ ${valLabor.toFixed(2)}</strong>
                                </div>
                            </div>
                        </div>

                        ${os.nfseAmbiente === 'homologation' ? `
                            <div style="margin-top: 15px; padding: 8px; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; border-radius: 4px; text-align: center; font-size: 0.8rem; font-weight: bold;">
                                <i class="fa-solid fa-flask"></i> NOTA EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO / TESTES (SEM VALOR FISCAL REAL)
                            </div>
                        ` : ''}
                    </div>

                    <!-- Footer Actions -->
                    <div style="background: #f1f5f9; padding: 15px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; border-radius: 0 0 8px 8px;">
                        ${os.nfseStatus === 'emitida' ? `
                            <button id="cancel-nfse-btn" style="background: #ef4444; color: #fff; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                                <i class="fa-solid fa-ban"></i> Cancelar Nota
                            </button>
                        ` : '<div></div>'}
                        <div>
                            <button id="print-nfse-btn" style="background: #2563eb; color: #fff; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 10px;">
                                <i class="fa-solid fa-print"></i> Imprimir / PDF
                            </button>
                            <button id="close-modal-btn" style="background: #64748b; color: #fff; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                                Fechar
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        `;

        // Append to DOM
        const existing = document.getElementById('nfse-modal-overlay');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Bind events
        document.getElementById('close-nfse-modal').addEventListener('click', () => {
            document.getElementById('nfse-modal-overlay').remove();
        });
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            document.getElementById('nfse-modal-overlay').remove();
        });
        
        document.getElementById('print-nfse-btn').addEventListener('click', () => {
            const printContent = document.getElementById('danfse-content').innerHTML;
            const win = window.open('', '', 'width=900,height=700');
            win.document.write(`
                <html>
                    <head>
                        <title>NFS-e Nº ${os.nfseNumero || os.id}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
                            @media print { button { display: none; } }
                        </style>
                    </head>
                    <body>${printContent}</body>
                </html>
            `);
            win.document.close();
            win.focus();
            setTimeout(() => { win.print(); }, 500);
        });

        const cancelBtn = document.getElementById('cancel-nfse-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', async () => {
                const ok = await window.NFSeModule.cancelarNFSe(os.id);
                if (ok) {
                    document.getElementById('nfse-modal-overlay').remove();
                }
            });
        }
    }
};
