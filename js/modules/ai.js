/**
 * GDN Automotive - AI Module (Google Gemini)
 */

const AIModule = {
    init: () => {
        AIModule.renderChatFloatingButton();
        AIModule.renderChatWindow();
        AIModule.bindEvents();
    },

    getApiKey: () => {
        const settings = window.StorageApp.get('storeSettings');
        return settings ? settings.aiApiKey : '';
    },

    renderChatFloatingButton: () => {
        if (document.getElementById('ai-fab')) return;

        const btn = document.createElement('button');
        btn.id = 'ai-fab';
        btn.className = 'ai-fab animate-fade-in';
        btn.innerHTML = '<i class="fa-solid fa-robot"></i>';
        btn.title = "Assistente de Diagnóstico (IA)";
        document.body.appendChild(btn);
    },

    renderChatWindow: () => {
        if (document.getElementById('ai-chat-window')) return;

        const chatHTML = `
            <div id="ai-chat-window" class="ai-chat-window hidden">
                <div class="ai-chat-header">
                    <h4><i class="fa-solid fa-brain"></i> Mecânico IA</h4>
                    <button id="ai-chat-close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div id="ai-chat-body" class="ai-chat-body">
                    <div class="ai-msg ai">
                        Olá! Sou seu Assistente de Diagnóstico Automotivo. 
                        Qual o sintoma do carro ou código de falha (DTC) que você quer analisar hoje?
                    </div>
                </div>
                <div class="ai-chat-input-area">
                    <input type="text" id="ai-chat-input" placeholder="Digite o problema ex: P0300, falha ao acelerar...">
                    <button id="ai-chat-send"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', chatHTML);
    },

    bindEvents: () => {
        const fab = document.getElementById('ai-fab');
        const chatWindow = document.getElementById('ai-chat-window');
        const closeBtn = document.getElementById('ai-chat-close');
        const sendBtn = document.getElementById('ai-chat-send');
        const inputBox = document.getElementById('ai-chat-input');
        const chatBody = document.getElementById('ai-chat-body');

        // Toggle chat
        fab.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
            if(!chatWindow.classList.contains('hidden')){
                 inputBox.focus();
            }
        });

        closeBtn.addEventListener('click', () => {
            chatWindow.classList.add('hidden');
        });

        // Send message
        const sendMessage = async () => {
            const text = inputBox.value.trim();
            if(!text) return;

            const apiKey = AIModule.getApiKey();
            if(!apiKey) {
                alert("Por favor, configure sua Chave de API do Gemini nas Configurações do sistema para usar a IA.");
                window.location.hash = '#settings';
                chatWindow.classList.add('hidden');
                return;
            }

            // Append User message
            AIModule.appendMessage(text, 'user');
            inputBox.value = '';
            
            // Show typing...
            const typingId = 'typing-' + Date.now();
            AIModule.appendMessage('<i class="fa-solid fa-ellipsis fa-fade"></i> Pensando...', 'ai', typingId);

            // Fetch Gemini
            const response = await AIModule.askGemini(text, apiKey);
            
            // Remove typing and add real response
            const typingEl = document.getElementById(typingId);
            if(typingEl) typingEl.remove();

            AIModule.appendMessage(response, 'ai');
        };

        sendBtn.addEventListener('click', sendMessage);
        inputBox.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') sendMessage();
        });
    },

    appendMessage: (html, type, id = '') => {
        const chatBody = document.getElementById('ai-chat-body');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'ai-msg ' + type;
        if(id) msgDiv.id = id;
        
        // Formata quebra de linha
        msgDiv.innerHTML = html.replace(/\n/g, '<br>');
        
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    },

    askGemini: async (promptText, apiKey) => {
        try {
            const systemPrompt = "Você é um mecânico mestre e engenheiro automotivo altamente experiente. Seu papel é auxiliar outros mecânicos com diagnósticos rápidos de sintomas e códigos OBD-II (DTCs). Seja direto, profissional e sempre traga possíveis causas ordenadas da mais comum para a menos comum. Em caso de diagnóstico de peças, sugira testes práticos.";
            
            const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
            
            const payload = {
                contents: [
                    { role: "user", parts: [{ text: systemPrompt + "\\n\\nProblema do cliente/Erro: " + promptText }] }
                ],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 500
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if(!response.ok) {
                const errorData = await response.json();
                console.error("Gemini Error:", errorData);
                return "Erro ao contatar a inteligência artificial. Verifique se sua Chave de API está correta nas configurações e se possui cotas. Erro: " + (errorData.error?.message || "Desconhecido");
            }

            const data = await response.json();
            if(data.candidates && data.candidates[0].content.parts[0].text) {
                return data.candidates[0].content.parts[0].text;
            } else {
                return "A IA não conseguiu entender a solicitação.";
            }

        } catch(e) {
            console.error("AI fetch error:", e);
            return "Erro de conexão com o servidor de IA. Verifique sua internet.";
        }
    }
};

window.AIModule = AIModule;
