document.addEventListener('DOMContentLoaded', () => {
    const editorContent = document.getElementById('editor-content');

    // Set focus to editor on load
    editorContent.focus();

    // Preserve selection to insert text at cursor position
    let savedSelection = null;

    // Save selection when editor loses focus or keyup/mouseup
    const saveSelection = () => {
        if (window.getSelection) {
            const sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                // Ensure selection is inside editor
                let node = sel.anchorNode;
                let isInsideEditor = false;
                while (node) {
                    if (node && node.classList && node.classList.contains('editor-content')) {
                        isInsideEditor = true;
                        break;
                    }
                    node = node.parentNode;
                }

                if (isInsideEditor) {
                    savedSelection = sel.getRangeAt(0);
                }
            }
        }
    };

    editorContent.addEventListener('keyup', saveSelection);
    editorContent.addEventListener('mouseup', saveSelection);
    editorContent.addEventListener('focus', saveSelection);

    // Restore selection
    const restoreSelection = () => {
        if (savedSelection) {
            if (window.getSelection) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(savedSelection);
            }
        } else {
            // Default to end of active editor if no selection
            if (typeof currentActiveEditor !== 'undefined' && currentActiveEditor) {
                const range = document.createRange();
                range.selectNodeContents(currentActiveEditor);
                range.collapse(false); // false means to the end
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                currentActiveEditor.focus();
            }
        }
    };

    // Function to insert HTML at cursor
    window.insertHTMLAtCursor = (html) => {
        restoreSelection();
        const sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            let range = sel.getRangeAt(0);
            range.deleteContents();

            // Create a temporary element to hold the HTML
            const el = document.createElement("div");
            el.innerHTML = html;
            const frag = document.createDocumentFragment();
            let node, lastNode;

            while ((node = el.firstChild)) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);

            // Preserve the selection
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
        saveSelection();
    };

    // Function to insert text at cursor
    window.insertTextAtCursor = (text) => {
        restoreSelection();
        const sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(text);
            range.insertNode(textNode);

            // Move cursor after inserted text
            range.setStartAfter(textNode);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
        saveSelection();
    };

    // Keyboard configuration
    const keyboardConfig = {
        numbers: ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠', '.', ','],
        letters: ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ص', 'ع', 'ف', 'ق', 'ر', 'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ'],
        symbols: ['+', '-', '×', '÷', '=', '≠', '≈', '<', '>', '≤', '≥', '٪', '°', '(', ')', '[', ']', '{', '}', '!', 'π', '∞', '∠', '∆'],
        mathStructs: [
            { label: 'كسر', html: '&nbsp;<span class="math-fraction" contenteditable="false"><span class="math-num" contenteditable="true">بسط</span><span class="math-den" contenteditable="true">مقام</span></span>&nbsp;' },
            { label: 'جذر', html: '&nbsp;<span class="math-sqrt" contenteditable="false"><span class="math-sqrt-symbol">√</span><span class="math-sqrt-content" contenteditable="true">س</span></span>&nbsp;' },
            { label: 'أس', html: '<sup contenteditable="true">2</sup>' },
            { label: 'أسفل', html: '<sub contenteditable="true">1</sub>' }
        ],
        shapes: [
            { label: 'مساحة فارغة', html: '<br><span class="empty-space-box" contenteditable="false"></span><br>' },
            { label: 'مسافة', action: 'space', wide: true },
            { label: 'سطر جديد', action: 'enter', wide: true }
        ]
    };

    // Prevent default mousedown to avoid losing focus from the editor
    const attachKeyboardEvent = (btn, action) => {
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            action();
        });
    };

    // Initialize keyboard
    const renderKeyboard = () => {
        // Render Numbers
        const numbersPanel = document.getElementById('numbers');
        keyboardConfig.numbers.forEach(num => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = num;
            attachKeyboardEvent(btn, () => insertTextAtCursor(num));
            numbersPanel.appendChild(btn);
        });
        // Add common actions to numbers
        addCommonActions(numbersPanel);

        // Render Letters
        const lettersPanel = document.getElementById('letters');
        keyboardConfig.letters.forEach(letter => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = letter;
            attachKeyboardEvent(btn, () => insertTextAtCursor(letter));
            lettersPanel.appendChild(btn);
        });
        addCommonActions(lettersPanel);

        // Render Symbols
        const symbolsPanel = document.getElementById('symbols');
        keyboardConfig.symbols.forEach(symbol => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = symbol;
            attachKeyboardEvent(btn, () => insertTextAtCursor(symbol));
            symbolsPanel.appendChild(btn);
        });
        addCommonActions(symbolsPanel);

        // Render Math Structs
        const mathPanel = document.getElementById('math-structs');
        keyboardConfig.mathStructs.forEach(struct => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = struct.label;
            attachKeyboardEvent(btn, () => insertHTMLAtCursor(struct.html));
            mathPanel.appendChild(btn);
        });
        addCommonActions(mathPanel);

        // Render Shapes
        const shapesPanel = document.getElementById('shapes');
        keyboardConfig.shapes.forEach(shape => {
            const btn = document.createElement('button');
            btn.className = 'key-btn' + (shape.wide ? ' wide' : '');
            btn.textContent = shape.label;
            attachKeyboardEvent(btn, () => {
                if (shape.html) insertHTMLAtCursor(shape.html);
                if (shape.action === 'space') insertTextAtCursor(' ');
                if (shape.action === 'enter') insertHTMLAtCursor('<br>');
            });
            shapesPanel.appendChild(btn);
        });
    };

    const addCommonActions = (panel) => {
        const spaceBtn = document.createElement('button');
        spaceBtn.className = 'key-btn wide';
        spaceBtn.textContent = 'مسافة';
        attachKeyboardEvent(spaceBtn, () => insertTextAtCursor(' '));
        panel.appendChild(spaceBtn);

        const enterBtn = document.createElement('button');
        enterBtn.className = 'key-btn wide';
        enterBtn.textContent = 'سطر جديد';
        attachKeyboardEvent(enterBtn, () => insertHTMLAtCursor('<br>'));
        panel.appendChild(enterBtn);

        const backspaceBtn = document.createElement('button');
        backspaceBtn.className = 'key-btn wide';
        backspaceBtn.textContent = 'مسح (⌫)';
        backspaceBtn.style.color = 'red';
        attachKeyboardEvent(backspaceBtn, () => {
            restoreSelection();
            document.execCommand('delete', false, null);
            saveSelection();
        });
        panel.appendChild(backspaceBtn);
    };

    renderKeyboard();


    // --- Pagination Logic & Multi-page Save/Load ---
    const addPageBtn = document.createElement('button');
    addPageBtn.className = 'btn';
    addPageBtn.style.backgroundColor = '#28a745';
    addPageBtn.style.color = 'white';
    addPageBtn.style.marginRight = '10px';
    addPageBtn.textContent = 'إضافة صفحة';

    addPageBtn.addEventListener('click', () => {
        const editorArea = document.querySelector('.editor-area');
        const firstPage = document.querySelector('.a4-paper');
        const newPage = firstPage.cloneNode(true);

        // Clear content of new page
        const newContent = newPage.querySelector('.editor-content');
        newContent.innerHTML = '';
        newContent.id = 'editor-content-' + Date.now();

        // Add page break class for PDF
        newPage.style.pageBreakBefore = 'always';

        editorArea.appendChild(newPage);

        // Update listeners
        bindEventsToContent(newContent);
        const newHeaders = newPage.querySelectorAll('.paper-header [contenteditable="true"]');
        newHeaders.forEach(el => el.addEventListener('input', saveAllPages));

        saveAllPages();
        newContent.focus();
    });

    // Dynamic focus handling for multi-page
    let currentActiveEditor = document.getElementById('editor-content');

    const bindEventsToContent = (contentEl) => {
        contentEl.addEventListener('keyup', saveSelection);
        contentEl.addEventListener('mouseup', saveSelection);
        contentEl.addEventListener('focus', () => {
            currentActiveEditor = contentEl;
            saveSelection();
        });
        contentEl.addEventListener('input', () => {
            checkAutoPagination(contentEl);
            saveAllPages();
        });
    };

    const checkAutoPagination = (contentEl) => {
        if (contentEl.scrollHeight > 1000) {
            contentEl.style.borderBottom = "2px dashed red";
        } else {
            contentEl.style.borderBottom = "none";
        }
    };

    bindEventsToContent(document.getElementById('editor-content'));

    const saveAllPages = () => {
        const pages = document.querySelectorAll('.a4-paper');
        const data = [];
        pages.forEach(page => {
            const content = page.querySelector('.editor-content').innerHTML;
            const headers = Array.from(page.querySelectorAll('.paper-header [contenteditable="true"]')).map(el => el.innerHTML);
            data.push({ content, headers });
        });
        localStorage.setItem('mathExamPages', JSON.stringify(data));
    };

    const loadAllPages = () => {
        const savedData = localStorage.getItem('mathExamPages');
        if (savedData) {
            const data = JSON.parse(savedData);
            const editorArea = document.querySelector('.editor-area');

            const existingPages = document.querySelectorAll('.a4-paper');
            const template = existingPages[0].cloneNode(true);
            editorArea.innerHTML = ''; // Clear all

            data.forEach((pageData, index) => {
                const newPage = template.cloneNode(true);
                const contentEl = newPage.querySelector('.editor-content');
                contentEl.innerHTML = pageData.content;
                contentEl.id = index === 0 ? 'editor-content' : 'editor-content-' + Date.now();

                const headerEls = newPage.querySelectorAll('.paper-header [contenteditable="true"]');
                if (pageData.headers && pageData.headers.length === headerEls.length) {
                    headerEls.forEach((el, i) => {
                        el.innerHTML = pageData.headers[i];
                    });
                }

                if (index > 0) newPage.style.pageBreakBefore = 'always';

                bindEventsToContent(contentEl);
                headerEls.forEach(el => el.addEventListener('input', saveAllPages));

                editorArea.appendChild(newPage);
            });
            currentActiveEditor = document.querySelector('.editor-content');
        }
    };

    // Load initial pages
    loadAllPages();

    // Attach event listeners to headers on first load (if not loaded from storage)
    document.querySelectorAll('.paper-header [contenteditable="true"]').forEach(el => el.addEventListener('input', saveAllPages));

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn';
    resetBtn.style.backgroundColor = '#dc3545';
    resetBtn.style.color = 'white';
    resetBtn.style.marginRight = '10px';
    resetBtn.textContent = 'اختبار جديد (مسح)';
    resetBtn.addEventListener('click', () => {
        if(confirm('هل أنت متأكد من مسح الاختبار الحالي وبدء واحد جديد؟')) {
            localStorage.removeItem('mathExamPages');
            location.reload();
        }
    });

    const toolbar = document.querySelector('.toolbar');
    toolbar.appendChild(resetBtn);
    toolbar.appendChild(addPageBtn);


    // Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            // Add active class to clicked
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // PDF Export Logic
    const exportBtn = document.getElementById('export-pdf');
    exportBtn.addEventListener('click', () => {
        const element = document.getElementById('paper');


        const pagesContainer = document.querySelector('.editor-area');

        // Options for html2pdf
        const opt = {
            margin:       0,
            filename:     'اختبار_الرياضيات.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, windowWidth: 800 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['css', 'legacy'] }
        };

        const pages = document.querySelectorAll('.a4-paper');

        // Force desktop width for PDF export to prevent issues on mobile
        const originalWidth = pagesContainer.style.width;
        pagesContainer.style.width = '210mm';

        pages.forEach(p => {
            p.style.transform = 'none';
            p.style.marginBottom = '0';
            p.classList.add('exporting');
        });

        html2pdf().set(opt).from(pagesContainer).save().then(() => {
            pagesContainer.style.width = originalWidth;
            pages.forEach(p => {
                p.style.transform = '';
                p.style.marginBottom = '';
                p.classList.remove('exporting');
            });
        });
    });

});
