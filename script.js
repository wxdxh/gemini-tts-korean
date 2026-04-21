// Logic for TTS Playground

document.addEventListener('DOMContentLoaded', () => {
    // 0. Render Cards from tags_data.js
    const showcaseGallery = document.getElementById('showcase-gallery');
    
    function renderCards(langCode = 'ko-KR') {
        showcaseGallery.innerHTML = '';
        if (!ttsTagsData[langCode]) return;
        ttsTagsData[langCode].forEach(item => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.category = item.category;
            card.innerHTML = `
                <div class="card-header">
                    <span class="tag-chip">${item.tag}</span>
                    <h3>${item.description}</h3>
                </div>
                <div class="card-body">
                    <p class="description">${
                        langCode === 'ko-KR' ? `이 태그는 [${item.tag}] 효과를 적용합니다.` :
                        langCode === 'en-US' ? `This tag applies the [${item.tag}] effect.` :
                        langCode === 'ja-JP' ? `このタグは[${item.tag}]効果を適用します。` :
                        langCode === 'zh-CN' ? `此标签应用 [${item.tag}] 效果。` :
                        `This tag applies the [${item.tag}] effect.`
                    }</p>
                    <div class="sample-text-area">
                        <span class="text">${item.sample.replace(/\[([a-zA-Z0-9\s]+)\]/g, '<span class="highlighted-tag">[$1]</span>')}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="listen-btn" data-id="${item.tag}-sample" data-lang="${langCode}">
                        <i data-lucide="play"></i>
                        <span>듣기</span>
                    </button>
                    <button class="download-btn" data-id="${item.tag}-download" data-lang="${langCode}">
                        <i data-lucide="download"></i>
                        <span>다운로드</span>
                    </button>
                </div>
            `;
            showcaseGallery.appendChild(card);
        });
        // Re-initialize Lucide icons for new elements
        lucide.createIcons();
        
        // Add event listeners to new buttons
        addListenEventListeners();
        addDownloadEventListeners();
    }
    
    renderCards('ko-KR');

    // 1. Navigation / View Switching
    const navButtons = document.querySelectorAll('.main-nav button');
    const sectionShowcase = document.getElementById('section-showcase');
    const sectionEditor = document.getElementById('section-editor');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const targetId = btn.id;
            
            if (targetId.startsWith('nav-showcase-')) {
                sectionShowcase.classList.remove('hidden');
                sectionEditor.classList.add('hidden');
                
                const lang = targetId.replace('nav-showcase-', '');
                let langCode = 'ko-KR';
                if (lang === 'en') langCode = 'en-US';
                else if (lang === 'jp') langCode = 'ja-JP';
                else if (lang === 'cn') langCode = 'zh-CN';
                
                renderCards(langCode);
            } else if (targetId === 'nav-editor') {
                sectionEditor.classList.remove('hidden');
                sectionShowcase.classList.add('hidden');
            }
        });
    });

    // 2. Showcase Filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
 
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
 
            const filter = btn.dataset.filter;
            const cards = document.querySelectorAll('.card'); // Query dynamically
 
            cards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // 3. Tag Insertion & Autocomplete
    const ttsInput = document.getElementById('tts-input');
    const rawOutputPreview = document.getElementById('raw-output-preview');
    const autocompleteList = document.getElementById('autocomplete-list');

    // Speed range listener
    const speedRange = document.getElementById('speed-range');
    const speedValue = document.getElementById('speed-value');
    if (speedRange && speedValue) {
        speedRange.addEventListener('input', (e) => {
            speedValue.textContent = `${e.target.value}x`;
        });
    }

    // Helper to get cursor coordinates in textarea
    function getCaretCoordinates(element, position) {
        const div = document.createElement('div');
        const style = window.getComputedStyle(element);
        for (const prop of style) {
            div.style[prop] = style[prop];
        }
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.whiteSpace = 'pre-wrap';
        
        const text = element.value.substring(0, position);
        div.textContent = text;
        
        const span = document.createElement('span');
        span.textContent = element.value.substring(position, position + 1) || '.';
        div.appendChild(span);
        
        document.body.appendChild(div);
        const { offsetTop, offsetLeft } = span;
        document.body.removeChild(div);
        
        return { top: offsetTop, left: offsetLeft };
    }

    ttsInput.addEventListener('input', (e) => {
        const text = e.target.value;
        rawOutputPreview.textContent = text;
        
        const cursorPosition = ttsInput.selectionStart;
        const textBeforeCursor = text.slice(0, cursorPosition);
        
        const lastBracketIndex = textBeforeCursor.lastIndexOf('[');
        
        if (lastBracketIndex !== -1) {
            const query = textBeforeCursor.slice(lastBracketIndex + 1);
            if (!query.includes(' ') && !query.includes(']')) {
                showAutocomplete(query, lastBracketIndex);
                return;
            }
        }
        
        hideAutocomplete();
    });

    function showAutocomplete(query, bracketIndex) {
        autocompleteList.innerHTML = '';
        autocompleteList.classList.remove('hidden');
        
        // Position dropdown near cursor
        const coords = getCaretCoordinates(ttsInput, bracketIndex);
        autocompleteList.style.top = `${ttsInput.offsetTop + coords.top + 20}px`;
        autocompleteList.style.left = `${ttsInput.offsetLeft + coords.left}px`;
        autocompleteList.style.width = '300px'; // Fixed width for floating
        
        // Use ko-KR tags as source
        const tags = ttsTagsData['ko-KR'] || [];
        const filteredTags = tags.filter(item => 
            item.tag.toLowerCase().includes(query.toLowerCase())
        );
        
        if (filteredTags.length === 0) {
            hideAutocomplete();
            return;
        }
        
        filteredTags.forEach(item => {
            const div = document.createElement('div');
            div.innerHTML = `
                <div class="tag-header">
                    <span class="tag-name">[${item.tag}]</span>
                    <span class="tag-category">${item.category}</span>
                </div>
                <div class="tag-desc">${item.description}</div>
            `;
            div.addEventListener('click', () => {
                insertSelectedTag(item.tag, bracketIndex);
            });
            autocompleteList.appendChild(div);
        });
    }

    function hideAutocomplete() {
        autocompleteList.classList.add('hidden');
    }

    function insertSelectedTag(tag, bracketIndex) {
        const text = ttsInput.value;
        const cursorPosition = ttsInput.selectionStart;
        
        // Replace from bracketIndex to cursorPosition with tag (which includes brackets)
        const newText = text.slice(0, bracketIndex) + tag + text.slice(cursorPosition);
        ttsInput.value = newText;
        ttsInput.focus();
        
        // Move cursor after the inserted tag
        const newCursorPos = bracketIndex + tag.length;
        ttsInput.selectionStart = newCursorPos;
        ttsInput.selectionEnd = newCursorPos;
        
        rawOutputPreview.textContent = newText;
        hideAutocomplete();
    }

    function insertTag(tag) {
        const text = ttsInput.value;
        const cursorPosition = ttsInput.selectionStart;
        
        const newText = text.slice(0, cursorPosition) + tag + text.slice(cursorPosition);
        ttsInput.value = newText;
        ttsInput.focus();
        
        ttsInput.selectionStart = cursorPosition + tag.length;
        ttsInput.selectionEnd = cursorPosition + tag.length;
        
        rawOutputPreview.textContent = newText;
        hideAutocomplete();
    }

    const tagItems = document.querySelectorAll('.tag-item');
    tagItems.forEach(item => {
        item.addEventListener('click', () => {
            const tag = item.getAttribute('data-tag');
            insertTag(tag);
        });
    });

    // 4. Audio Generation (Mock Implementation)
    const generateBtn = document.getElementById('generate-btn');


    generateBtn.addEventListener('click', () => {
        const text = ttsInput.value;
        if (!text) {
            alert('텍스트를 입력해주세요.');
            return;
        }
        
        showLoadingState(generateBtn, true);
        
        const url = '/api/generateAudio';
        const languageCode = document.getElementById('language-select').value;
        const modelName = document.getElementById('model-select').value;
        const name = document.getElementById('voice-select').value;
        const speakingRate = parseFloat(document.getElementById('speed-range').value);
        
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, languageCode, modelName, name, speakingRate })
        })
        .then(res => res.json())
        .then(data => {
            showLoadingState(generateBtn, false);
            if (data.audioContent) {
                const audio = new Audio(`data:audio/wav;base64,${data.audioContent}`);
                audio.play();
            } else {
                alert('음성 생성에 실패했습니다.');
                console.error(data);
            }
        })
        .catch(err => {
            showLoadingState(generateBtn, false);
            alert('에러가 발생했습니다.');
            console.error(err);
        });
    });

    function addListenEventListeners() {
        const listenButtons = document.querySelectorAll('.listen-btn');
        listenButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.closest('.card').querySelector('.sample-text-area span').textContent;
                
                showLoadingState(btn, true);
                
                const url = '/api/generateAudio';
                const languageCode = btn.getAttribute('data-lang') || 'ko-KR';
                const modelName = document.getElementById('showcase-model-select').value;
                const name = document.getElementById('showcase-voice-select').value;
                
                fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, languageCode, modelName, name })
                })
                .then(res => res.json())
                .then(data => {
                    showLoadingState(btn, false);
                    if (data.audioContent) {
                        const audio = new Audio(`data:audio/wav;base64,${data.audioContent}`);
                        audio.play();
                    } else {
                        alert('음성 생성에 실패했습니다.');
                        console.error(data);
                    }
                })
                .catch(err => {
                    showLoadingState(btn, false);
                    alert('에러가 발생했습니다.');
                    console.error(err);
                });
            });
        });
    }

    function addDownloadEventListeners() {
        const downloadButtons = document.querySelectorAll('.download-btn');
        downloadButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.closest('.card').querySelector('.sample-text-area span').textContent;
                
                showLoadingState(btn, true);
                
                const url = '/api/generateAudio';
                const languageCode = btn.getAttribute('data-lang') || 'ko-KR';
                const modelName = document.getElementById('showcase-model-select').value;
                const name = document.getElementById('showcase-voice-select').value;
                
                fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, languageCode, modelName, name })
                })
                .then(res => res.json())
                .then(data => {
                    showLoadingState(btn, false);
                    if (data.audioContent) {
                        const blob = new Blob([Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))], { type: 'audio/wav' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `tts_${text.substring(0, 10)}.wav`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    } else {
                        alert('음성 생성에 실패했습니다.');
                        console.error(data);
                    }
                })
                .catch(err => {
                    showLoadingState(btn, false);
                    alert('에러가 발생했습니다.');
                    console.error(err);
                });
            });
        });
    }

    // 5. Dynamic Tag Toolbar
    const tagsContainer = document.querySelector('.tags-container');
    const toolbarFilterBtns = document.querySelectorAll('.editor-toolbar .filter-btn');

    function renderToolbarTags(category = 'all') {
        if (!tagsContainer) return;
        tagsContainer.innerHTML = '';
        
        // We use the Korean data as a baseline for tags, as the tag strings themselves are universal.
        const allTags = ttsTagsData['ko-KR'] || [];
        
        allTags.forEach(item => {
            if (category === 'all' || item.category === category) {
                const btn = document.createElement('button');
                btn.className = 'tag-item';
                btn.setAttribute('data-tag', item.tag);
                // Extract description from Korean data
                const desc = item.description || item.tag;
                btn.textContent = `${item.tag} ${desc}`;
                
                btn.addEventListener('click', () => {
                    insertTag(item.tag);
                });
                
                tagsContainer.appendChild(btn);
            }
        });
    }

    // Add event listeners for toolbar filter buttons
    toolbarFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toolbarFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            renderToolbarTags(filter);
        });
    });

    // Initial render
    renderToolbarTags('all');

    function showLoadingState(element, isLoading) {
        if (isLoading) {
            element.classList.add('loading');
            const span = element.querySelector('span');
            if (span) span.textContent = '생성 중...';
        } else {
            element.classList.remove('loading');
            const span = element.querySelector('span');
            if (span) span.textContent = element.id === 'generate-btn' ? '음성 생성' : '듣기';
        }
    }
});
