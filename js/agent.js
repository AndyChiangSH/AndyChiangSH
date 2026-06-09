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
    const conversationHistory = [];
    const knowledgeBase = buildKnowledgeBase();
    const bm25State = buildBm25State(knowledgeBase);

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
                link.addEventListener('click', event => {
                    event.preventDefault();
                    jumpToChunk(source);
                });

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
            const rawText = section.textContent || '';

            if (!sectionId || !rawText.trim()) {
                return [];
            }

            return splitTextIntoChunks(rawText, 500, 50).map((chunk, index) => ({
                id: `${sectionId}-chunk-${index + 1}`,
                sectionId,
                sectionTitle: title,
                chunkIndex: index + 1,
                startOffset: chunk.startOffset,
                endOffset: chunk.endOffset,
                href: `#${sectionId}-chunk-${index + 1}`,
                text: chunk.text,
            }));
        });
    }

    function splitTextIntoChunks(text, chunkSize, overlap) {
        const chunks = [];
        const step = Math.max(1, chunkSize - overlap);

        for (let startOffset = 0; startOffset < text.length; startOffset += step) {
            const endOffset = Math.min(text.length, startOffset + chunkSize);
            const chunkText = text.slice(startOffset, endOffset).trim();

            if (chunkText) {
                chunks.push({
                    startOffset,
                    endOffset,
                    text: chunkText,
                });
            }

            if (endOffset >= text.length) {
                break;
            }
        }

        return chunks;
    }

    function normalizeWhitespace(value) {
        return value.replace(/\s+/g, ' ').trim();
    }

    function tokenizeForBm25(value) {
        const matches = value.toLowerCase().match(/[a-z0-9]+(?:'[a-z0-9]+)?/g);
        return matches ? matches : [];
    }

    function buildBm25State(docs) {
        const enrichedDocs = docs.map(doc => {
            const tokens = tokenizeForBm25(`${doc.sectionTitle} ${doc.text}`);
            const termFrequency = new Map();

            tokens.forEach(token => {
                termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
            });

            return {
                ...doc,
                tokens,
                termFrequency,
                length: tokens.length,
            };
        });

        const documentFrequency = new Map();

        enrichedDocs.forEach(doc => {
            new Set(doc.tokens).forEach(token => {
                documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
            });
        });

        const totalLength = enrichedDocs.reduce((sum, doc) => sum + doc.length, 0);

        return {
            docs: enrichedDocs,
            documentFrequency,
            documentCount: enrichedDocs.length || 1,
            averageLength: enrichedDocs.length ? totalLength / enrichedDocs.length : 0,
            k1: 1.2,
            b: 0.75,
        };
    }

    function scoreChunk(doc, queryTokens, bm25State) {
        if (!queryTokens.length || !doc.length || !bm25State.averageLength) {
            return 0;
        }

        let score = 0;

        queryTokens.forEach(token => {
            const termFrequency = doc.termFrequency.get(token) || 0;
            if (!termFrequency) {
                return;
            }

            const documentFrequency = bm25State.documentFrequency.get(token) || 0;
            const idf = Math.log(1 + ((bm25State.documentCount - documentFrequency + 0.5) / (documentFrequency + 0.5)));
            const numerator = termFrequency * (bm25State.k1 + 1);
            const denominator = termFrequency + bm25State.k1 * (1 - bm25State.b + (bm25State.b * doc.length / bm25State.averageLength));

            score += idf * (numerator / denominator);
        });

        return score;
    }

    function retrieveRelevantChunks(question) {
        const queryTokens = tokenizeForBm25(question);

        return bm25State.docs
            .map(doc => ({
                ...doc,
                score: scoreChunk(doc, queryTokens, bm25State),
            }))
            .filter(chunk => chunk.score > 0)
            .sort((left, right) => right.score - left.score)
            .slice(0, 1);
    }

    function buildSourceList(relevantChunks) {
        return relevantChunks.map(chunk => ({
            title: `${chunk.sectionTitle} · Chunk ${chunk.chunkIndex}`,
            href: chunk.href,
            sectionId: chunk.sectionId,
            startOffset: chunk.startOffset,
        }));
    }

    function fallbackUnansweredMessage(question) {
        return 'I cannot answer this question from my website content.';
    }

    function buildOfflineAnswer(question, relevantChunks) {
        const chunk = relevantChunks[0];
        if (!chunk) {
            return fallbackUnansweredMessage(question);
        }

        const sentence = chooseBestSentence(chunk.text, tokenizeForBm25(question));
        if (!sentence || containsChineseCharacters(sentence)) {
            return `The most relevant information is in my ${chunk.sectionTitle} section, but I cannot confidently answer this question from that chunk alone.`;
        }

        return `According to my ${chunk.sectionTitle} section, ${ensureSentenceEnding(sentence)}`;
    }

    function containsChineseCharacters(value) {
        return /[\u4e00-\u9fff]/.test(value);
    }

    async function answerQuestion(question) {
        const relevantChunks = retrieveRelevantChunks(question);
        const sources = buildSourceList(relevantChunks);

        if (!relevantChunks.length || relevantChunks[0].score < 0.15) {
            return {
                answer: fallbackUnansweredMessage(question),
                sources: [],
            };
        }
        return {
            answer: buildOfflineAnswer(question, relevantChunks),
            sources,
        };
    }

    function chooseBestSentence(text, queryTokens) {
        const sentences = text
            .replace(/\s+/g, ' ')
            .split(/(?<=[.!?])\s+/)
            .map(sentence => sentence.trim())
            .filter(Boolean);

        if (!sentences.length) {
            return '';
        }

        let bestSentence = sentences[0];
        let bestScore = -1;

        sentences.forEach(sentence => {
            const normalized = sentence.toLowerCase();
            let score = 0;

            queryTokens.forEach(token => {
                if (normalized.includes(token)) {
                    score += 1;
                }
            });

            if (score > bestScore) {
                bestScore = score;
                bestSentence = sentence;
            }
        });

        return bestSentence;
    }

    function ensureSentenceEnding(sentence) {
        return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
    }

    function jumpToChunk(source) {
        const section = document.getElementById(source.sectionId);
        if (!section) {
            return;
        }

        const range = createRangeAtOffset(section, source.startOffset);
        if (range) {
            const rect = range.getBoundingClientRect();
            const targetTop = window.scrollY + rect.top - 90;
            window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
            return;
        }

        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function createRangeAtOffset(rootElement, targetOffset) {
        const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT);
        let currentOffset = 0;
        let textNode = walker.nextNode();

        while (textNode) {
            const nextOffset = currentOffset + textNode.textContent.length;
            if (targetOffset <= nextOffset) {
                const range = document.createRange();
                range.setStart(textNode, Math.max(0, targetOffset - currentOffset));
                range.collapse(true);
                return range;
            }

            currentOffset = nextOffset;
            textNode = walker.nextNode();
        }

        return null;
    }
});