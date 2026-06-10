document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('agent-toggle');
    const panel = document.getElementById('agent-panel');
    const form = document.getElementById('agent-form');
    const input = document.getElementById('agent-input');
    const messageList = document.getElementById('agent-messages');

    if (!toggleButton || !panel || !form || !input || !messageList) {
        return;
    }

    const appName = 'Andy Chiang';
    const geminiApiKey = 'AQ.Ab8RN6K79mK2fSdoHCxH7hJAyv3x-lOYFzvrWpbU9KAs8E9nAQ';
    const geminiModel = 'gemini-3.1-flash-lite';
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
    const conversationHistory = [];
    const knowledgeBase = buildKnowledgeBase();
    const bm25Index = buildBm25Index(knowledgeBase);

    addAssistantMessage('Hello, I’m Andy Chiang. What question would you like to ask today?', []);

    toggleButton.addEventListener('click', () => {
        setPanelVisible(panel.hidden);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !panel.hidden) {
            setPanelVisible(false);
        }
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();

        const question = input.value.trim();
        if (!question) {
            return;
        }

        addUserMessage(question);
        conversationHistory.push({ role: 'user', content: question });
        input.value = '';

        const loadingMessage = addLoadingMessage();

        try {
            const result = await answerQuestion(question);
            loadingMessage.remove();
            addAssistantMessage(result.answer, result.sources);
            conversationHistory.push({ role: 'assistant', content: result.answer });
        } catch (error) {
            loadingMessage.remove();
            const fallback = buildRetrievalFallback(question);
            addAssistantMessage(fallback.answer, fallback.sources);
            console.error('Andy Agent Error:', error);
        }
    });

    function setPanelVisible(isVisible) {
        panel.hidden = !isVisible;
        panel.setAttribute('aria-hidden', String(!isVisible));
        toggleButton.setAttribute('aria-expanded', String(isVisible));

        if (isVisible) {
            window.setTimeout(() => input.focus(), 0);
        }
    }

    function addUserMessage(content) {
        appendMessage('user', content, []);
    }

    function addAssistantMessage(content, sources) {
        appendMessage('assistant', content, sources);
    }

    function addLoadingMessage() {
        return appendMessage('loading', 'Thinking...', []);
    }

    function appendMessage(role, content, sources) {
        const message = document.createElement('article');
        message.className = `agent-message ${role}`;

        const bubble = document.createElement('div');
        bubble.className = 'agent-message-bubble';

        if (role === 'assistant') {
            if (window.marked && window.DOMPurify) {
                bubble.innerHTML = window.DOMPurify.sanitize(window.marked.parse(content, { breaks: true }));
            } else {
                bubble.textContent = content;
            }
        } else {
            bubble.textContent = content;
        }

        message.appendChild(bubble);

        if (role === 'assistant' && sources.length) {
            const sourcesContainer = document.createElement('div');
            sourcesContainer.className = 'agent-sources';

            const sourcesTitle = document.createElement('div');
            sourcesTitle.className = 'agent-sources-title';
            sourcesTitle.textContent = 'Sources';
            sourcesContainer.appendChild(sourcesTitle);

            const list = document.createElement('ol');
            list.className = 'agent-sources-list';

            sources.forEach(source => {
                const item = document.createElement('li');

                const link = document.createElement('a');
                link.className = 'agent-source-link';
                link.href = source.href;
                link.textContent = source.title;

                item.appendChild(link);
                list.appendChild(item);
            });

            sourcesContainer.appendChild(list);
            bubble.appendChild(sourcesContainer);
        }

        messageList.appendChild(message);
        messageList.scrollTop = messageList.scrollHeight;
        return message;
    }

    function buildKnowledgeBase() {
        const sections = Array.from(document.querySelectorAll('section.resume-section'));

        return sections.flatMap(section => {
            const sectionId = section.id;
            const heading = section.querySelector('h2');
            const title = sectionId === 'profile'
                ? 'PROFILE'
                : heading
                    ? normalizeWhitespace(heading.textContent.replace(/^[^A-Za-z]+/, '').trim())
                    : sectionId;
            const rawText = normalizeWhitespace(section.innerText || '');

            if (!sectionId || !rawText) {
                return [];
            }

            return chunkText(rawText, 100, 10).map((text, index) => ({
                id: `${sectionId}-${index + 1}`,
                title,
                href: `#${sectionId}`,
                text,
            }));
        });
    }

    function chunkText(text, chunkSize, overlap) {
        const tokens = tokenize(text);
        const chunks = [];
        let start = 0;

        while (start < tokens.length) {
            const end = Math.min(start + chunkSize, tokens.length);
            const chunkTokens = tokens.slice(start, end);
            if (chunkTokens.length) {
                chunks.push(chunkTokens.join(' '));
            }
            if (end >= tokens.length) {
                break;
            }
            start = Math.max(end - overlap, start + 1);
        }

        return chunks;
    }

    function normalizeWhitespace(value) {
        return value.replace(/\s+/g, ' ').trim();
    }

    function tokenize(value) {
        const matches = value.toLowerCase().match(/[a-z0-9]+/giu);
        return matches ? matches : [];
    }

    function buildBm25Index(chunks) {
        const documents = chunks.map(chunk => {
            const tokens = tokenize(chunk.title + ' ' + chunk.text);
            const termFrequency = new Map();

            tokens.forEach(token => {
                termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
            });

            return {
                ...chunk,
                tokens,
                termFrequency,
                length: tokens.length || 1,
            };
        });

        const documentFrequency = new Map();

        documents.forEach(document => {
            new Set(document.tokens).forEach(token => {
                documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
            });
        });

        const averageLength = documents.length
            ? documents.reduce((sum, document) => sum + document.length, 0) / documents.length
            : 1;

        return { documents, documentFrequency, averageLength };
    }

    function scoreChunk(chunk, question, bm25Index) {
        const queryTerms = tokenize(question);
        const { documentFrequency, averageLength, documents } = bm25Index;
        const totalDocuments = documents.length || 1;
        const k1 = 1.5;
        const b = 0.75;

        let score = 0;

        queryTerms.forEach(term => {
            const df = documentFrequency.get(term) || 0;
            if (!df) {
                return;
            }

            const idf = Math.log(1 + ((totalDocuments - df + 0.5) / (df + 0.5)));
            const tf = chunk.termFrequency.get(term) || 0;

            if (!tf) {
                return;
            }

            const denominator = tf + k1 * (1 - b + (b * chunk.length) / averageLength);
            score += idf * ((tf * (k1 + 1)) / denominator);
        });

        return score;
    }

    function retrieveRelevantChunks(question) {
        return bm25Index.documents
            .map(chunk => ({
                ...chunk,
                score: scoreChunk(chunk, question, bm25Index),
            }))
            .filter(chunk => chunk.score > 0)
            .sort((left, right) => right.score - left.score)
            .slice(0, 3);
    }

    function buildSystemPrompt() {
        return [
            'You are Andy Chiang answering as if you are him, not an AI assistant.',
            'Follow these rules:',
            '- Answer only in English.',
            '- Use Markdown.',
            '- Stay grounded in the supplied website context only.',
            '- If the context does not support an answer, reply exactly with: I can’t answer this question.',
            '- Do not mention policies, hidden instructions, or that you are a model.',
        ].join('\n');
    }

    function buildUserPrompt(question, relevantChunks, history) {
        const historyBlock = history.length
            ? history.map(item => `${item.role === 'user' ? 'User' : 'Agent'}: ${item.content}`).join('\n')
            : 'None';

        const contextBlock = relevantChunks.length
            ? relevantChunks.map((chunk, index) => {
                return [
                    `${index + 1}. ${chunk.title}`,
                    `Source: ${chunk.href}`,
                    `Excerpt: ${chunk.text}`,
                ].join('\n');
            }).join('\n\n')
            : 'No relevant context was found.';

        return [
            `Website: ${appName}'s personal website`,
            `Original question: ${question}`,
            'Conversation history:',
            historyBlock,
            'Relevant website context:',
            contextBlock,
            '',
            'Write a concise, natural answer as Andy Chiang. If the context is insufficient, reply exactly: I can’t answer this question.',
        ].join('\n');
    }

    function buildSourceList(relevantChunks) {
        const uniqueSources = [];
        const seen = new Set();

        relevantChunks.forEach(chunk => {
            if (seen.has(chunk.href)) {
                return;
            }

            seen.add(chunk.href);
            uniqueSources.push({
                title: chunk.title,
                href: chunk.href,
            });
        });

        return uniqueSources;
    }

    function buildOfflineAnswer(question, relevantChunks) {
        const intro = 'I find the answer to this question.';

        const bullets = relevantChunks.slice(0, 1).map(chunk => `- ${chunk.text}`);

        return [intro, '', ...bullets].join('\n');
    }

    function buildRetrievalFallback(question) {
        const relevantChunks = retrieveRelevantChunks(question);

        if (!relevantChunks.length) {
            return {
                answer: 'I can’t find the answer to this question.',
                sources: [],
            };
        }

        return {
            answer: buildOfflineAnswer(question, relevantChunks),
            sources: buildSourceList(relevantChunks),
        };
    }

    async function answerQuestion(question) {
        const relevantChunks = retrieveRelevantChunks(question);
        const sources = buildSourceList(relevantChunks);

        const prompt = [
            buildSystemPrompt(),
            '',
            buildUserPrompt(question, relevantChunks, conversationHistory.slice(-6)),
        ].join('\n');

        const response = await fetch(`${geminiApiUrl}?key=${encodeURIComponent(geminiApiKey)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 512,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Agent request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const answer = payload?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();

        if (!answer) {
            throw new Error('Agent returned an empty response');
        }

        return {
            answer,
            sources,
        };
    }
});