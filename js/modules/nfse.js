/**
 * MÃ³dulo de Nota Fiscal de ServiÃ§o EletrÃ´nica (NFS-e)
 * GDN ServiÃ§os Automotivos
 */

window.NFSeModule = {
    // Retorna as configuraÃ§Ãµes fiscais salvas ou padrÃµes
    getFiscalSettings: () => {
        const settings = window.StorageApp.get('storeSettings') || {};
        return {
            name: settings.name || 'GDN ServiÃ§os Automotivos',
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

    // Valida se a OS possui todos os campos necessÃ¡rios para emissÃ£o da NFS-e
    validateOSForNFSe: (os, client) => {
        const errors = [];

        const valLabor = parseFloat((os.values ? os.values.labor : os.valLabor) || 0);
        if (valLabor <= 0) {
            errors.push('A OS nÃ£o possui valor de MÃ£o de Obra / ServiÃ§o tributÃ¡vel (valor R$ 0,00).');
        }

        const doc = (client ? (client.document || client.cpf || client.cnpj) : os.clientDoc) || '';
        if (!doc || doc.trim().length < 11) {
            errors.push('O cliente nÃ£o possui CPF/CNPJ vÃ¡lido cadastrado (mÃ­nimo 11 dÃ­gitos).');
        }

        const clientName = (client ? client.name : (os.clientName || os.clientNameManual)) || '';
        if (!clientName || clientName.trim() === '') {
            errors.push('Nome do cliente Ã© obrigatÃ³rio para emissÃ£o de nota fiscal.');
        }

        const address = (client ? client.address : os.clientAddress) || '';
        if (!address || address.trim() === '') {
            errors.push('EndereÃ§o do cliente Ã© obrigatÃ³rio para a NFS-e.');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    // Gera a estrutura do Payload JSON para envio Ã  API da NFS-e
    buildPayload: (os, client, fiscalSettings) => {
        const valLabor = parseFloat((os.values ? os.values.labor : os.valLabor) || 0);
        const aliquota = fiscalSettings.aliquotaIss / 100;
        const valorIss = valLabor * aliquota;

        const doc = (client ? (client.document || client.cpf || client.cnpj) : (os.clientDoc || '')).replace(/\D/g, '');
        const clientName = client ? client.name : (os.clientName || os.clientNameManual || 'Cliente Avulso');
        const clientAddress = client ? client.address : (os.clientAddress || '');
        const clientEmail = client ? client.email : '';
        const clientPhone = client ? client.phone : (os.clientPhone || '');

        return {
            ambiente: fiscalSettings.nfseEnvironment,
            prestador: {
                cnpj: (fiscalSettings.cnpj || '').replace(/\D/g, ''),
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
                    cidade: 'SÃ£o Paulo',
                    uf: 'SP'
                }
            },
            servico: {
                item_lista_servico: fiscalSettings.codigoServico,
                discriminacao: `ServiÃ§os automotivos referentes Ã  O.S. NÂº ${os.number || os.id}.\nVeÃ­culo: ${os.vehicleModel || os.model || ''} - Placa: ${os.vehiclePlate || os.plate || ''}\nDescriÃ§Ã£o: ${os.description || 'ManutenÃ§Ã£o e reparaÃ§Ã£o mecÃ¢nica.'}`,
                valor_servicos: valLabor,
                aliquota_iss: fiscalSettings.aliquotaIss,
                valor_iss: parseFloat(valorIss.toFixed(2)),
                iss_retido: false
            },
            referencia_os: os.id
        };
    },

    // Redireciona para exibir a modal de importaÃ§Ã£o
    emitirNFSe: async (osId) => {
        window.NFSeModule.showImportModal(osId);
        return true;
    },

    // Abre a modal para importaÃ§Ã£o do arquivo da nota fiscal emitida
    showImportModal: (osId) => {
        const osRecords = window.StorageApp.get('os_records') || [];
        const osIndex = osRecords.findIndex(o => o.id == osId);
        if (osIndex === -1) {
            alert('Ordem de ServiÃ§o nÃ£o encontrada.');
            return;
        }
        const os = osRecords[osIndex];

        const modalHtml = `
            <div id="nfse-import-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 15px;">
                <div style="background: #1e293b; color: #fff; width: 100%; max-width: 500px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); font-family: 'Outfit', 'Inter', Arial, sans-serif; overflow: hidden; border: 1px solid #334155;">
                    
                    <!-- Header -->
                    <div style="background: #0f172a; padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155;">
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #38bdf8; display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid fa-file-import"></i> Importar Nota Fiscal
                        </h3>
                        <button id="close-import-modal-btn" style="background: transparent; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='#f1f5f9'" onmouseout="this.style.color='#94a3b8'">&times;</button>
                    </div>

                    <!-- Body -->
                    <form id="nfse-import-form" style="padding: 25px; display: flex; flex-direction: column; gap: 20px;">
                        <div>
                            <p style="margin: 0 0 15px 0; color: #94a3b8; font-size: 0.9rem; line-height: 1.5;">
                                Anexe a nota fiscal correspondente Ã  <strong>O.S. NÂº ${os.number || os.id}</strong>.
                            </p>
                        </div>

                        <!-- NÃºmero da Nota -->
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="font-size: 0.875rem; font-weight: 500; color: #cbd5e1;">NÃºmero da Nota Fiscal</label>
                            <input type="text" id="import-nfse-number" placeholder="Ex: 2026093" required style="background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 10px 12px; color: #fff; font-size: 0.95rem; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#38bdf8'" onblur="this.style.borderColor='#334155'">
                        </div>

                        <!-- Seletor de Arquivo -->
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="font-size: 0.875rem; font-weight: 500; color: #cbd5e1;">Arquivo da Nota (PDF, XML, Imagens)</label>
                            <div style="position: relative; border: 2px dashed #334155; border-radius: 8px; padding: 25px; text-align: center; background: #0f172a; cursor: pointer; transition: border-color 0.2s;" id="dropzone" onmouseover="this.style.borderColor='#38bdf8'" onmouseout="this.style.borderColor='#334155'">
                                <input type="file" id="import-nfse-file" accept=".pdf,.xml,.png,.jpg,.jpeg" required style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;">
                                <i class="fa-solid fa-cloud-arrow-up" style="font-size: 2rem; color: #64748b; margin-bottom: 10px; display: block;"></i>
                                <span id="file-label" style="font-size: 0.875rem; color: #94a3b8; display: block;">Arrastar arquivo ou clique para selecionar</span>
                                <span style="font-size: 0.75rem; color: #64748b; display: block; margin-top: 5px;">PDF, XML ou Imagens de atÃ© 5MB</span>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px;">
                            <button type="button" id="cancel-import-btn" style="background: #334155; color: #cbd5e1; border: none; border-radius: 6px; padding: 10px 18px; font-weight: 500; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#334155'">
                                Cancelar
                            </button>
                            <button type="submit" style="background: #38bdf8; color: #0f172a; border: none; border-radius: 6px; padding: 10px 22px; font-weight: bold; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#0ea5e9'" onmouseout="this.style.background='#38bdf8'">
                                <i class="fa-solid fa-check"></i> Salvar Nota
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Insere a modal no DOM
        const existing = document.getElementById('nfse-import-modal-overlay');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const fileInput = document.getElementById('import-nfse-file');
        const fileLabel = document.getElementById('file-label');
        const dropzone = document.getElementById('dropzone');

        // Mostra o nome do arquivo selecionado
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                fileLabel.textContent = e.target.files[0].name;
                fileLabel.style.color = '#38bdf8';
                dropzone.style.borderColor = '#38bdf8';
            } else {
                fileLabel.textContent = 'Arrastar arquivo ou clique para selecionar';
                fileLabel.style.color = '#94a3b8';
                dropzone.style.borderColor = '#334155';
            }
        });

        // Eventos para fechar a modal
        const removeModal = () => document.getElementById('nfse-import-modal-overlay').remove();
        document.getElementById('close-import-modal-btn').addEventListener('click', removeModal);
        document.getElementById('cancel-import-btn').addEventListener('click', removeModal);

        // SubmissÃ£o do Form
        document.getElementById('nfse-import-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = fileInput.files[0];
            const nfseNumber = document.getElementById('import-nfse-number').value.trim();

            if (!file) {
                alert('Selecione um arquivo.');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64Data = event.target.result;

                // Atualiza o registro da OS
                osRecords[osIndex].nfseStatus = 'emitida';
                osRecords[osIndex].nfseNumero = nfseNumber;
                osRecords[osIndex].nfseDataEmissao = new Date().toISOString();
                osRecords[osIndex].nfseFileBase64 = base64Data;
                osRecords[osIndex].nfseFileName = file.name;
                osRecords[osIndex].nfseFileType = file.type;

                await window.StorageApp.save('os_records', osRecords);
                alert('Nota Fiscal importada com sucesso!');
                removeModal();

                // Recarrega listagem e visualizaÃ§Ã£o da OS aberta se aplicÃ¡vel
                if (window.OSModule) {
                    if (typeof window.OSModule.loadOSList === 'function') {
                        window.OSModule.loadOSList();
                    }
                    // Se estiver com o formulÃ¡rio de ediÃ§Ã£o aberto para esta OS, atualiza o botÃ£o
                    const formId = document.getElementById('os-id') ? document.getElementById('os-id').value : '';
                    if (formId === osId && typeof window.OSModule.editOS === 'function') {
                        window.OSModule.editOS(osId);
                    }
                }
            };
            reader.readAsDataURL(file);
        });
    },

    // Cancela / Remove a NFS-e importada
    cancelarNFSe: async (osId) => {
        if (!confirm('Tem certeza que deseja remover o arquivo da Nota Fiscal importada desta OS?')) {
            return false;
        }

        const osRecords = window.StorageApp.get('os_records') || [];
        const osIndex = osRecords.findIndex(o => o.id == osId);
        if (osIndex === -1) return false;

        // Limpa os campos da NFS-e
        osRecords[osIndex].nfseStatus = 'nao_emitida';
        delete osRecords[osIndex].nfseNumero;
        delete osRecords[osIndex].nfseDataEmissao;
        delete osRecords[osIndex].nfseFileBase64;
        delete osRecords[osIndex].nfseFileName;
        delete osRecords[osIndex].nfseFileType;

        await window.StorageApp.save('os_records', osRecords);
        alert('Nota Fiscal removida com sucesso.');

        if (window.OSModule) {
            if (typeof window.OSModule.loadOSList === 'function') {
                window.OSModule.loadOSList();
            }
            const formId = document.getElementById('os-id') ? document.getElementById('os-id').value : '';
            if (formId === osId && typeof window.OSModule.editOS === 'function') {
                window.OSModule.editOS(osId);
            }
        }
        return true;
    },

    // Retorna HTML da Badge de Status da NFS-e
    renderBadge: (os) => {
        const status = os.nfseStatus || 'nao_emitida';
        switch (status) {
            case 'emitida':
                return `<span class="badge" style="background-color: #28a745; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold;" title="Nota Fiscal Importada NÂº ${os.nfseNumero || ''}">
                    <i class="fa-solid fa-file-invoice"></i> NÂº ${os.nfseNumero || 'OK'}
                </span>`;
            default:
                return `<span class="badge" style="background-color: #f8f9fa; color: #6c757d; border: 1px dashed #ccc; padding: 3px 6px; border-radius: 4px; font-size: 0.75rem;">
                    Sem Nota
                </span>`;
        }
    },

    // Exibe Modal de VisualizaÃ§Ã£o/GestÃ£o da Nota Fiscal Importada
    showNFSeModal: (osId) => {
        const osRecords = window.StorageApp.get('os_records') || [];
        const os = osRecords.find(o => o.id == osId);
        if (!os || !os.nfseFileBase64) {
            alert('Arquivo de Nota Fiscal nÃ£o localizado para esta OS.');
            return;
        }

        const dataEmissao = os.nfseDataEmissao ? new Date(os.nfseDataEmissao).toLocaleString('pt-BR') : '-';

        const modalHtml = `
            <div id="nfse-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 15px;">
                <div style="background: #1e293b; color: #fff; width: 100%; max-width: 550px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); font-family: 'Outfit', 'Inter', Arial, sans-serif; overflow: hidden; border: 1px solid #334155;">
                    
                    <!-- Header -->
                    <div style="background: #0f172a; padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155;">
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #38bdf8; display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid fa-file-invoice"></i> Nota Fiscal Importada
                        </h3>
                        <button id="close-nfse-modal" style="background: transparent; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='#f1f5f9'" onmouseout="this.style.color='#94a3b8'">&times;</button>
                    </div>

                    <!-- Details -->
                    <div style="padding: 25px; display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; flex-direction: column; gap: 5px; border-bottom: 1px solid #334155; padding-bottom: 15px;">
                            <span style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Ordem de ServiÃ§o</span>
                            <span style="font-size: 1.05rem; font-weight: 500;">O.S. NÂº ${os.number || os.id} - Cliente: ${os.clientName || 'Manual/NÃ£o informado'}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border-bottom: 1px solid #334155; padding-bottom: 15px;">
                            <div style="display: flex; flex-direction: column; gap: 5px;">
                                <span style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">NÃºmero da Nota</span>
                                <span style="font-size: 1rem; font-weight: 500; color: #38bdf8;">${os.nfseNumero || 'NÃ£o informado'}</span>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 5px;">
                                <span style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Data de ImportaÃ§Ã£o</span>
                                <span style="font-size: 1rem; font-weight: 500;">${dataEmissao}</span>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 5px; border-bottom: 1px solid #334155; padding-bottom: 15px;">
                            <span style="font-size: 0.8rem; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Nome do Arquivo</span>
                            <span style="font-size: 0.95rem; word-break: break-all; color: #94a3b8;"><i class="fa-solid fa-paperclip"></i> ${os.nfseFileName || 'nota-fiscal.pdf'}</span>
                        </div>
                    </div>

                    <!-- Footer Actions -->
                    <div style="background: #0f172a; padding: 20px; border-top: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
                        <button id="cancel-nfse-btn" style="background: #ef4444; color: #fff; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: background 0.2s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                            <i class="fa-solid fa-trash"></i> Excluir Nota
                        </button>
                        <div style="display: flex; gap: 10px;">
                            <button id="view-nfse-file-btn" style="background: #38bdf8; color: #0f172a; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: background 0.2s; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='#0ea5e9'" onmouseout="this.style.background='#38bdf8'">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> Visualizar Arquivo
                            </button>
                            <button id="close-modal-btn" style="background: #334155; color: #cbd5e1; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#334155'">
                                Fechar
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        `;

        // Inserir modal no DOM
        const existing = document.getElementById('nfse-modal-overlay');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Bind events
        const closeModal = () => document.getElementById('nfse-modal-overlay').remove();
        document.getElementById('close-nfse-modal').addEventListener('click', closeModal);
        document.getElementById('close-modal-btn').addEventListener('click', closeModal);
        
        // Abertura do Arquivo Base64 em nova aba
        document.getElementById('view-nfse-file-btn').addEventListener('click', () => {
            try {
                const base64Data = os.nfseFileBase64;
                const contentType = os.nfseFileType || 'application/pdf';
                const fileName = os.nfseFileName || 'nota-fiscal';
                
                const base64Parts = base64Data.split(';base64,');
                const rawData = base64Parts.length > 1 ? base64Parts[1] : base64Data;
                const byteCharacters = atob(rawData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: contentType });
                const fileURL = URL.createObjectURL(blob);
                
                const win = window.open(fileURL, '_blank');
                if (!win || win.closed || typeof win.closed === 'undefined') {
                    // Fallback para download caso popup seja bloqueado
                    const a = document.createElement('a');
                    a.href = fileURL;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            } catch (e) {
                console.error("Erro ao abrir arquivo:", e);
                alert("Falha ao processar e abrir o arquivo.");
            }
        });

        // Evento Excluir Nota
        document.getElementById('cancel-nfse-btn').addEventListener('click', async () => {
            const ok = await window.NFSeModule.cancelarNFSe(os.id);
            if (ok) {
                closeModal();
            }
        });
    }
};