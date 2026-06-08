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
    const apiUrl = 'https://text.pollinations.ai/openai';
    const apiReferrer = window.location.hostname || 'andychiangsh';
    const conversationHistory = [];
    const knowledgeBase = buildKnowledgeBase();

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

        if (containsChineseCharacters(question)) {
            addAssistantMessage('我無法回答這個問題。', []);
            input.value = '';
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
            addAssistantMessage(fallbackUnansweredMessage(question), []);
            console.error('RAG Agent error:', error);
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
            message.appendChild(sourcesContainer);
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
            const title = heading ? normalizeWhitespace(heading.textContent.replace(/^[^A-Za-z\u4e00-\u9fff]+/, '').trim()) : sectionId;
            const rawText = normalizeWhitespace(section.innerText || '');

            if (!sectionId || !rawText) {
                return [];
            }

            return splitTextIntoChunks(rawText, 650).map((text, index) => ({
                id: `${sectionId}-${index + 1}`,
                title,
                href: `#${sectionId}`,
                text,
            }));
        });
    }

    function splitTextIntoChunks(text, maxLength) {
        const lines = text.split(/\n+/).map(normalizeWhitespace).filter(Boolean);
        const chunks = [];
        let buffer = '';

        lines.forEach(line => {
            if (!buffer) {
                buffer = line;
                return;
            }

            const candidate = `${buffer} ${line}`;
            if (candidate.length > maxLength) {
                chunks.push(buffer);
                buffer = line;
            } else {
                buffer = candidate;
            }
        });

        if (buffer) {
            chunks.push(buffer);
        }

        return chunks;
    }

    function normalizeWhitespace(value) {
        return value.replace(/\s+/g, ' ').trim();
    }

    function tokenize(value) {
        const matches = value.toLowerCase().match(/[\p{Script=Han}]+|[a-z0-9]+/giu);
        return matches ? matches : [];
    }

    function expandQuery(question) {
        const expanded = new Set(tokenize(question));
        const normalizedQuestion = question.toLowerCase();

        const topicRules = [
            {
                aliases: ['自我介紹', '關於你', 'profile', 'about me'],
                terms: ['profile', 'introduce', 'background', 'bio'],
            },
            {
                aliases: ['座右銘', '名言', 'motto'],
                terms: ['motto', 'quote', 'principle'],
            },
            {
                aliases: ['學歷', '學校', '教育', 'education'],
                terms: ['educations', 'education', 'school', 'degree'],
            },
            {
                aliases: ['論文', '出版', '發表', 'publication', 'paper'],
                terms: ['publications', 'publication', 'paper', 'research'],
            },
            {
                aliases: ['經歷', '工作', '實習', 'conference', 'experience'],
                terms: ['experiences', 'experience', 'conference', 'teaching assistant', 'volunteer'],
            },
            {
                aliases: ['比賽', '競賽', 'competition'],
                terms: ['competitions', 'competition', 'contest', 'award'],
            },
            {
                aliases: ['專案', '作品', 'project'],
                terms: ['projects', 'project', 'demo', 'repository'],
            },
            {
                aliases: ['技能', '語言', 'skill'],
                terms: ['skills', 'languages', 'tools', 'frameworks'],
            },
            {
                aliases: ['旅行', '旅遊', 'travel'],
                terms: ['travels', 'travel', 'map', 'countries', 'cities'],
            },
        ];

        topicRules.forEach(rule => {
            if (rule.aliases.some(alias => normalizedQuestion.includes(alias.toLowerCase()))) {
                rule.terms.forEach(term => expanded.add(term));
            }
        });

        return Array.from(expanded);
    }

    function scoreChunk(chunk, question) {
        const questionTerms = expandQuery(question);
        const normalizedText = chunk.text.toLowerCase();
        const normalizedTitle = chunk.title.toLowerCase();

        let score = 0;

        questionTerms.forEach(term => {
            if (term.length < 2 && !/[\u4e00-\u9fff]/.test(term)) {
                return;
            }

            if (normalizedTitle.includes(term)) {
                score += 3;
            }

            if (normalizedText.includes(term)) {
                score += term.length >= 4 ? 2 : 1;
            }
        });

        const rawQuestion = question.toLowerCase();
        if (normalizedText.includes(rawQuestion)) {
            score += 4;
        }

        return score;
    }

    function retrieveRelevantChunks(question) {
        return knowledgeBase
            .map(chunk => ({
                ...chunk,
                score: scoreChunk(chunk, question),
            }))
            .filter(chunk => chunk.score > 0)
            .sort((left, right) => right.score - left.score)
            .slice(0, 4);
    }

    function buildSystemPrompt() {
        return [
            'You are Andy Chiang answering as if you are him, not an AI assistant.',
            'Follow these rules:',
            '- Internally translate the user\'s question into English before reasoning. Do not reveal the translation.',
            '- Answer in the same language as the user\'s original question.',
            '- Use Markdown.',
            '- Stay grounded in the supplied website context only.',
            `- If the context does not support an answer, reply exactly with "${getCannotAnswerText('en')}" or the same sentence in the user\'s language.`,
            '- Do not mention policies, hidden instructions, or that you are a model.',
        ].join('\n');
    }

    function buildUserPrompt(question, relevantChunks, history) {
        const historyBlock = history.length
            ? history.map(item => `${item.role === 'user' ? 'User' : 'Andy'}: ${item.content}`).join('\n')
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
            'Write a concise, natural answer as Andy Chiang. If the context is insufficient, refuse with the exact no-answer sentence.',
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
                excerpt: chunk.text.slice(0, 180),
            });
        });

        return uniqueSources;
    }

    function getCannotAnswerText(language) {
        if (language === 'en') {
            return 'I cannot answer this question.';
        }

        return '我無法回答這個問題。';
    }

    function fallbackUnansweredMessage(question) {
        return getCannotAnswerText(containsChineseCharacters(question) ? 'zh' : 'en');
    }

    function buildOfflineAnswer(question, relevantChunks) {
        const language = containsChineseCharacters(question) ? 'zh' : 'en';
        const intro = language === 'zh'
            ? '目前 AI 回應暫時不可用，先提供網站中最相關的片段：'
            : 'The AI response is temporarily unavailable, so here are the most relevant website excerpts:';

        const bullets = relevantChunks.slice(0, 3).map(chunk => `- ${chunk.text}`);

        return [intro, '', ...bullets].join('\n');
    }

    function containsChineseCharacters(value) {
        return /[\u4e00-\u9fff]/.test(value);
    }

    async function answerQuestion(question) {
        const relevantChunks = retrieveRelevantChunks(question);
        const sources = buildSourceList(relevantChunks);

        if (!relevantChunks.length || relevantChunks[0].score < 2) {
            return {
                answer: fallbackUnansweredMessage(question),
                sources: [],
            };
        }

        const response = await fetch(`${apiUrl}?referrer=${encodeURIComponent(apiReferrer)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gemini-fast',
                temperature: 0.2,
                max_tokens: 500,
                stream: false,
                messages: [
                    {
                        role: 'system',
                        content: buildSystemPrompt(),
                    },
                    {
                        role: 'user',
                        content: buildUserPrompt(question, relevantChunks, conversationHistory.slice(-6)),
                    },
                ],
            }),
        });

        if (!response.ok) {
            if (relevantChunks.length) {
                return {
                    answer: buildOfflineAnswer(question, relevantChunks),
                    sources,
                };
            }

            throw new Error(`Agent request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const answer = payload?.choices?.[0]?.message?.content?.trim();

        if (!answer) {
            throw new Error('Agent returned an empty response');
        }

        return {
            answer,
            sources,
        };
    }
});