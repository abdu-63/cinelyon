(function () {
    const toggleBtn = document.getElementById('cinelyon-chat-toggle');
    const panel = document.getElementById('cinelyon-chat-panel');
    const closeBtn = document.getElementById('cinelyon-chat-close');
    const messages = document.getElementById('cinelyon-chat-messages');
    const suggestions = document.getElementById('cinelyon-chat-suggestions');
    const form = document.getElementById('cinelyon-chat-form');
    const input = document.getElementById('cinelyon-chat-input');
    const sendBtn = document.getElementById('cinelyon-chat-send');

    if (!toggleBtn || !panel || !messages || !form || !input || !sendBtn) {
        return;
    }

    const endpoint = window._cinelyonChatbot?.endpoint || '/api/chat';
    let isOpen = false;

    function addMessage(role, text, isTyping = false) {
        const bubble = document.createElement('div');
        bubble.className = `cinelyon-chat-message ${role}${isTyping ? ' typing' : ''}`;
        bubble.textContent = text;
        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
        return bubble;
    }

    function openPanel() {
        isOpen = true;
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        toggleBtn.classList.add('active');

        if (messages.children.length === 0) {
            addMessage(
                'bot',
                "Salut 👋 Je suis CinéBot. Je peux t'aider à trouver un film, un cinéma ou une idée pour ce soir à Lyon."
            );
        }

        input.focus();
    }

    function closePanel() {
        isOpen = false;
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
        toggleBtn.classList.remove('active');
    }

    async function sendMessage(forcedText) {
        const text = (forcedText || input.value).trim();
        if (!text) {
            return;
        }

        input.value = '';
        addMessage('user', text);
        if (suggestions) {
            suggestions.style.display = 'none';
        }

        sendBtn.disabled = true;
        const typing = addMessage('bot', 'CinéBot réfléchit…', true);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: text }),
            });

            const data = await response.json();
            typing.remove();

            const reply = (data && data.reply) || "Je n'ai pas réussi à répondre cette fois.";
            addMessage('bot', reply);
        } catch (error) {
            typing.remove();
            addMessage('bot', "Je n'arrive pas à joindre le service pour l'instant. Réessaie dans un instant.");
        } finally {
            sendBtn.disabled = false;
            input.focus();
        }
    }

    toggleBtn.addEventListener('click', () => {
        if (isOpen) {
            closePanel();
        } else {
            openPanel();
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closePanel);
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        sendMessage();
    });

    document.querySelectorAll('.cinelyon-chat-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            openPanel();
            sendMessage(chip.dataset.chatPrompt || '');
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isOpen) {
            closePanel();
        }
    });
})();
