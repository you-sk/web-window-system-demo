document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let highestZ = 2;
    const windows = document.querySelectorAll('.window');
    const icons = {
        'icon-notepad': 'window-notepad',
        'icon-settings': 'window-settings',
        'icon-calculator': 'window-calculator',
        'icon-paint': 'window-paint',
        'icon-filemanager': 'window-filemanager'
    };
    const windowTitles = {
        'window-notepad': 'メモ帳',
        'window-settings': '設定',
        'window-calculator': '電卓',
        'window-paint': 'ペイント',
        'window-filemanager': 'ファイルマネージャー'
    };
    const taskbarItems = document.getElementById('taskbar-items');

    // --- Taskbar Management ---
    function createTaskbarItem(windowId) {
        const button = document.createElement('button');
        button.className = 'taskbar-item bevel-out bg-[#c0c0c0] text-black';
        button.textContent = windowTitles[windowId];
        button.dataset.windowId = windowId;

        button.addEventListener('click', () => {
            const win = document.getElementById(windowId);
            if (win.classList.contains('minimized')) {
                win.classList.remove('minimized');
                win.classList.remove('hidden');
                activateWindow(win);
            } else if (win.querySelector('.title-bar').classList.contains('active')) {
                win.classList.add('minimized');
                button.classList.remove('active');
            } else {
                activateWindow(win);
            }
        });

        return button;
    }

    function updateTaskbar() {
        taskbarItems.innerHTML = '';
        windows.forEach(win => {
            if (!win.classList.contains('hidden') && !win.classList.contains('minimized')) {
                const item = createTaskbarItem(win.id);
                if (win.querySelector('.title-bar').classList.contains('active')) {
                    item.classList.add('active');
                }
                taskbarItems.appendChild(item);
            } else if (win.classList.contains('minimized')) {
                const item = createTaskbarItem(win.id);
                taskbarItems.appendChild(item);
            }
        });
    }

    // --- Window Interaction Logic ---
    function activateWindow(win) {
        if (!win) return;
        windows.forEach(w => w.querySelector('.title-bar').classList.remove('active'));
        win.querySelector('.title-bar').classList.add('active');
        highestZ++;
        win.style.zIndex = highestZ;
        updateTaskbar();
    }

    windows.forEach(win => {
        const titleBar = win.querySelector('.title-bar');
        const resizeHandle = win.querySelector('.resize-handle');
        let isDragging = false, isResizing = false;
        let offsetX, offsetY, startX, startY, startWidth, startHeight;

        const bringToFront = (e) => {
            if(e.target.closest('button')) return;
            activateWindow(win);
        };
        win.addEventListener('mousedown', bringToFront);

        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON' || win.dataset.maximized === 'true') return;
            isDragging = true;
            titleBar.classList.add('dragging');
            offsetX = e.clientX - win.offsetLeft;
            offsetY = e.clientY - win.offsetTop;
        });

        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', (e) => {
                if (win.dataset.maximized === 'true') return;
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = parseInt(document.defaultView.getComputedStyle(win).width, 10);
                startHeight = parseInt(document.defaultView.getComputedStyle(win).height, 10);
                e.preventDefault();
            });
        }

        const btnClose = win.querySelector('.btn-close');
        const btnMaximize = win.querySelector('.btn-maximize');
        
        btnClose.addEventListener('click', (e) => {
            e.stopPropagation();
            win.classList.add('hidden');
            win.classList.remove('minimized');
            updateTaskbar();
        });

        btnMaximize.addEventListener('click', (e) => {
            e.stopPropagation();
            if (win.dataset.maximized === 'true') {
                win.style.top = win.dataset.originalTop;
                win.style.left = win.dataset.originalLeft;
                win.style.width = win.dataset.originalWidth;
                win.style.height = win.dataset.originalHeight;
                win.dataset.maximized = 'false';
            } else {
                win.dataset.originalTop = win.style.top;
                win.dataset.originalLeft = win.style.left;
                win.dataset.originalWidth = win.style.width;
                win.dataset.originalHeight = win.style.height;
                win.style.top = '0';
                win.style.left = '0';
                win.style.width = '100vw';
                win.style.height = '100vh';
                win.dataset.maximized = 'true';
            }
            const canvas = win.querySelector('#paint-canvas');
            if (canvas) {
                setTimeout(() => resizeCanvas(canvas), 0);
            }
        });
    
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const x = Math.max(0, Math.min(e.clientX - offsetX, window.innerWidth - win.offsetWidth));
                const y = Math.max(0, Math.min(e.clientY - offsetY, window.innerHeight - win.offsetHeight));
                win.style.left = `${x}px`;
                win.style.top = `${y}px`;
            } else if (isResizing) {
                const newWidth = startWidth + e.clientX - startX;
                const newHeight = startHeight + e.clientY - startY;
                if (newWidth > 200) win.style.width = `${newWidth}px`;
                if (newHeight > 150) win.style.height = `${newHeight}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                 const canvas = win.querySelector('#paint-canvas');
                 if (canvas) {
                    resizeCanvas(canvas);
                 }
            }
            isDragging = false;
            isResizing = false;
            titleBar.classList.remove('dragging');
        });
    });

    // --- Desktop Icon Logic ---
    Object.keys(icons).forEach(iconId => {
        const icon = document.getElementById(iconId);
        const windowId = icons[iconId];
        const win = document.getElementById(windowId);
        
        if(icon && win){
            icon.addEventListener('dblclick', () => {
                win.classList.remove('hidden');
                win.classList.remove('minimized');
                activateWindow(win);

                if(windowId === 'window-paint') {
                    const canvas = win.querySelector('#paint-canvas');
                    setTimeout(() => resizeCanvas(canvas), 0);
                }
            });
        }
    });

    // --- Notepad Logic ---
    const notepadTextarea = document.querySelector('#window-notepad textarea');
    const notepadSaveData = () => {
        localStorage.setItem('notepad-content', notepadTextarea.value);
        alert('ファイルが保存されました');
    };
    const notepadLoadData = () => {
        const savedContent = localStorage.getItem('notepad-content');
        if (savedContent !== null) {
            notepadTextarea.value = savedContent;
        }
    };
    const notepadClearData = () => {
        if (confirm('新規作成します。現在の内容は失われます。よろしいですか？')) {
            notepadTextarea.value = '';
        }
    };

    // Create notepad menu
    const createNotepadMenu = () => {
        const menuBar = document.createElement('div');
        menuBar.className = 'flex bg-[#c0c0c0] border-b border-[#dfdfdf] text-xs';

        const fileMenu = document.createElement('button');
        fileMenu.className = 'px-2 py-1 hover:bg-[#000080] hover:text-white';
        fileMenu.textContent = 'ファイル(F)';

        const editMenu = document.createElement('button');
        editMenu.className = 'px-2 py-1 hover:bg-[#000080] hover:text-white';
        editMenu.textContent = '編集(E)';

        menuBar.appendChild(fileMenu);
        menuBar.appendChild(editMenu);

        // File menu dropdown
        const fileDropdown = document.createElement('div');
        fileDropdown.className = 'absolute bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black hidden';
        fileDropdown.style.top = '20px';
        fileDropdown.innerHTML = `
            <button class="block w-full text-left px-4 py-1 hover:bg-[#000080] hover:text-white" id="notepad-new">新規作成</button>
            <button class="block w-full text-left px-4 py-1 hover:bg-[#000080] hover:text-white" id="notepad-open">開く</button>
            <button class="block w-full text-left px-4 py-1 hover:bg-[#000080] hover:text-white" id="notepad-save">保存</button>
            <div class="border-t border-[#808080] my-1"></div>
            <button class="block w-full text-left px-4 py-1 hover:bg-[#000080] hover:text-white" id="notepad-exit">終了</button>
        `;

        fileMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            fileDropdown.classList.toggle('hidden');
        });

        fileMenu.appendChild(fileDropdown);

        // Insert menu bar after title bar
        const notepadWindow = document.getElementById('window-notepad');
        const titleBar = notepadWindow.querySelector('.title-bar');
        titleBar.parentNode.insertBefore(menuBar, titleBar.nextSibling);

        // Menu actions
        document.getElementById('notepad-new').addEventListener('click', notepadClearData);
        document.getElementById('notepad-open').addEventListener('click', notepadLoadData);
        document.getElementById('notepad-save').addEventListener('click', notepadSaveData);
        document.getElementById('notepad-exit').addEventListener('click', () => {
            notepadWindow.classList.add('hidden');
            updateTaskbar();
        });

        // Close dropdown when clicking elsewhere
        document.addEventListener('click', () => {
            fileDropdown.classList.add('hidden');
        });
    };

    // Initialize notepad
    createNotepadMenu();
    notepadLoadData();

    // Auto-save on window close
    const notepadCloseBtn = document.querySelector('#window-notepad .btn-close');
    const originalNotepadClose = notepadCloseBtn.onclick;
    notepadCloseBtn.onclick = function(e) {
        if (notepadTextarea.value && notepadTextarea.value !== localStorage.getItem('notepad-content')) {
            if (confirm('変更内容を保存しますか？')) {
                notepadSaveData();
            }
        }
        if (originalNotepadClose) originalNotepadClose.call(this, e);
    };

    // --- Settings OK Button Logic ---
    const settingsOkBtn = document.getElementById('settings-ok-btn');
    if (settingsOkBtn) {
        settingsOkBtn.addEventListener('click', () => {
            document.getElementById('window-settings').classList.add('hidden');
        });
    }


    // --- Calculator Logic (Enhanced) ---
    const calcDisplay = document.getElementById('calc-display');
    const calcButtons = document.querySelectorAll('.calculator-grid button');
    let currentInput = '0';
    let operator = null;
    let previousInput = null;
    let shouldResetDisplay = false;
    let memory = 0;

    // Add memory and additional buttons
    const addCalculatorButtons = () => {
        const calcGrid = document.querySelector('.calculator-grid');

        // Add memory buttons row at the top
        const memoryRow = document.createElement('div');
        memoryRow.className = 'col-span-4 grid grid-cols-4 gap-1 mb-1';
        memoryRow.innerHTML = `
            <button class="calc-btn-memory bevel-out bg-[#c0c0c0] hover:bg-[#dfdfdf] active:bevel-in text-xs" data-action="MC">MC</button>
            <button class="calc-btn-memory bevel-out bg-[#c0c0c0] hover:bg-[#dfdfdf] active:bevel-in text-xs" data-action="MR">MR</button>
            <button class="calc-btn-memory bevel-out bg-[#c0c0c0] hover:bg-[#dfdfdf] active:bevel-in text-xs" data-action="M+">M+</button>
            <button class="calc-btn-memory bevel-out bg-[#c0c0c0] hover:bg-[#dfdfdf] active:bevel-in text-xs" data-action="M-">M-</button>
        `;
        calcGrid.insertBefore(memoryRow, calcGrid.firstChild);

        // Add decimal point and backspace buttons
        const existingButtons = Array.from(calcGrid.querySelectorAll('button')).filter(btn =>
            !btn.classList.contains('calc-btn-memory'));
        const cButton = existingButtons.find(btn => btn.textContent === 'C');

        // Create decimal button
        const decimalBtn = document.createElement('button');
        decimalBtn.className = 'bevel-out bg-[#c0c0c0] hover:bg-[#dfdfdf] active:bevel-in';
        decimalBtn.textContent = '.';

        // Create backspace button
        const backspaceBtn = document.createElement('button');
        backspaceBtn.className = 'bevel-out bg-[#c0c0c0] hover:bg-[#dfdfdf] active:bevel-in text-xs';
        backspaceBtn.textContent = '←';

        // Replace one button with decimal and add backspace
        if (cButton) {
            cButton.parentNode.insertBefore(decimalBtn, cButton);
            cButton.parentNode.insertBefore(backspaceBtn, cButton.nextSibling);
        }
    };

    addCalculatorButtons();

    // Update button handlers
    const allCalcButtons = document.querySelectorAll('.calculator-grid button');
    allCalcButtons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.textContent;
            const action = button.dataset.action;

            // Memory operations
            if (action) {
                switch(action) {
                    case 'MC':
                        memory = 0;
                        break;
                    case 'MR':
                        currentInput = memory.toString();
                        break;
                    case 'M+':
                        memory += parseFloat(currentInput);
                        break;
                    case 'M-':
                        memory -= parseFloat(currentInput);
                        break;
                }
            }
            // Decimal point
            else if (value === '.') {
                if (!currentInput.includes('.')) {
                    currentInput += '.';
                }
            }
            // Backspace
            else if (value === '←') {
                if (currentInput.length > 1) {
                    currentInput = currentInput.slice(0, -1);
                } else {
                    currentInput = '0';
                }
            }
            // Numbers
            else if (!isNaN(value)) {
                if (currentInput === '0' || shouldResetDisplay) {
                    currentInput = value;
                    shouldResetDisplay = false;
                } else {
                    currentInput += value;
                }
            }
            // Operators
            else if (['+', '-', '*', '/'].includes(value)) {
                if (operator && previousInput) {
                    currentInput = calculate(previousInput, currentInput, operator);
                }
                operator = value;
                previousInput = currentInput;
                shouldResetDisplay = true;
            }
            // Equals
            else if (value === '=') {
                if (operator && previousInput) {
                    currentInput = calculate(previousInput, currentInput, operator);
                    operator = null;
                    previousInput = null;
                }
            }
            // Clear
            else if (value === 'C') {
                currentInput = '0';
                operator = null;
                previousInput = null;
            }

            calcDisplay.textContent = currentInput;
        });
    });

    function calculate(a, b, op) {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        let result;

        switch(op) {
            case '+':
                result = numA + numB;
                break;
            case '-':
                result = numA - numB;
                break;
            case '*':
                result = numA * numB;
                break;
            case '/':
                result = numB !== 0 ? numA / numB : 0;
                break;
            default:
                return b;
        }

        // Format result to avoid floating point issues
        return Math.round(result * 100000000) / 100000000;
    }

    // Keyboard support for calculator
    document.addEventListener('keydown', (e) => {
        const calcWindow = document.getElementById('window-calculator');
        if (!calcWindow.classList.contains('hidden') &&
            calcWindow.querySelector('.title-bar').classList.contains('active')) {

            if (e.key >= '0' && e.key <= '9') {
                const btn = Array.from(allCalcButtons).find(b => b.textContent === e.key);
                if (btn) btn.click();
            } else if (['+', '-', '*', '/'].includes(e.key)) {
                const btn = Array.from(allCalcButtons).find(b => b.textContent === e.key);
                if (btn) btn.click();
            } else if (e.key === 'Enter' || e.key === '=') {
                const btn = Array.from(allCalcButtons).find(b => b.textContent === '=');
                if (btn) btn.click();
            } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
                const btn = Array.from(allCalcButtons).find(b => b.textContent === 'C');
                if (btn) btn.click();
            } else if (e.key === '.') {
                const btn = Array.from(allCalcButtons).find(b => b.textContent === '.');
                if (btn) btn.click();
            } else if (e.key === 'Backspace') {
                const btn = Array.from(allCalcButtons).find(b => b.textContent === '←');
                if (btn) btn.click();
            }

            e.preventDefault();
        }
    });


    // --- Paint Logic (Enhanced) ---
    const canvas = document.getElementById('paint-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let currentTool = 'pencil';
        let currentColor = '#000000';
        let currentSize = 2;
        let startX, startY;

        function resizeCanvas(canvasToResize) {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = canvasToResize.width;
            tempCanvas.height = canvasToResize.height;
            if(canvasToResize.width > 0 && canvasToResize.height > 0) {
                 tempCtx.drawImage(canvasToResize, 0, 0);
            }
            const parent = canvasToResize.parentElement;
            if (parent.clientWidth > 0 && parent.clientHeight > 0) {
                 canvasToResize.width = parent.clientWidth;
                 canvasToResize.height = parent.clientHeight;
            }
            ctx.drawImage(tempCanvas, 0, 0);
        }

        // Create paint toolbar
        const createPaintToolbar = () => {
            const toolbar = document.createElement('div');
            toolbar.className = 'flex gap-2 p-2 bg-[#c0c0c0] border-b-2 border-[#808080]';

            // Tools
            const toolsDiv = document.createElement('div');
            toolsDiv.className = 'flex gap-1';
            toolsDiv.innerHTML = `
                <button class="paint-tool bevel-out px-2 py-1 bg-[#c0c0c0] active" data-tool="pencil">✏️</button>
                <button class="paint-tool bevel-out px-2 py-1 bg-[#c0c0c0]" data-tool="eraser">消</button>
                <button class="paint-tool bevel-out px-2 py-1 bg-[#c0c0c0]" data-tool="line">／</button>
                <button class="paint-tool bevel-out px-2 py-1 bg-[#c0c0c0]" data-tool="rect">□</button>
                <button class="paint-tool bevel-out px-2 py-1 bg-[#c0c0c0]" data-tool="circle">○</button>
            `;

            // Color palette
            const colorsDiv = document.createElement('div');
            colorsDiv.className = 'flex gap-1 ml-2';
            const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'];
            colors.forEach(color => {
                const colorBtn = document.createElement('button');
                colorBtn.className = 'w-6 h-6 border-2 border-[#808080]';
                colorBtn.style.backgroundColor = color;
                colorBtn.dataset.color = color;
                colorsDiv.appendChild(colorBtn);
            });

            // Brush size
            const sizeDiv = document.createElement('div');
            sizeDiv.className = 'flex items-center gap-2 ml-2';
            sizeDiv.innerHTML = `
                <label class="text-xs">サイズ:</label>
                <select id="brush-size" class="border-2 border-[#808080] bg-white">
                    <option value="1">1px</option>
                    <option value="2" selected>2px</option>
                    <option value="4">4px</option>
                    <option value="8">8px</option>
                </select>
            `;

            // Clear button
            const clearBtn = document.createElement('button');
            clearBtn.className = 'bevel-out px-3 py-1 bg-[#c0c0c0] ml-auto';
            clearBtn.textContent = 'クリア';

            toolbar.appendChild(toolsDiv);
            toolbar.appendChild(colorsDiv);
            toolbar.appendChild(sizeDiv);
            toolbar.appendChild(clearBtn);

            // Insert toolbar
            const paintWindow = document.getElementById('window-paint');
            const titleBar = paintWindow.querySelector('.title-bar');
            titleBar.parentNode.insertBefore(toolbar, titleBar.nextSibling);

            // Tool selection
            toolbar.querySelectorAll('.paint-tool').forEach(btn => {
                btn.addEventListener('click', () => {
                    toolbar.querySelectorAll('.paint-tool').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentTool = btn.dataset.tool;
                });
            });

            // Color selection
            colorsDiv.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    currentColor = btn.dataset.color;
                });
            });

            // Size selection
            document.getElementById('brush-size').addEventListener('change', (e) => {
                currentSize = parseInt(e.target.value);
            });

            // Clear canvas
            clearBtn.addEventListener('click', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });
        };

        createPaintToolbar();

        const getMousePos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const draw = (e) => {
            if (!isDrawing) return;
            const { x, y } = getMousePos(e);

            ctx.lineWidth = currentSize;
            ctx.lineCap = 'round';

            if (currentTool === 'pencil') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = currentColor;
                ctx.lineTo(x, y);
                ctx.stroke();
            } else if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        };

        const drawShape = (e) => {
            const { x, y } = getMousePos(e);

            // Clear and redraw for shapes
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            ctx.putImageData(imageData, 0, 0);

            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentSize;
            ctx.globalCompositeOperation = 'source-over';

            switch(currentTool) {
                case 'line':
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    break;
                case 'rect':
                    ctx.beginPath();
                    ctx.rect(startX, startY, x - startX, y - startY);
                    ctx.stroke();
                    break;
                case 'circle':
                    const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
                    ctx.beginPath();
                    ctx.arc(startX, startY, radius, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
            }
        };

        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const { x, y } = getMousePos(e);
            startX = x;
            startY = y;

            if (currentTool === 'pencil' || currentTool === 'eraser') {
                ctx.beginPath();
                ctx.moveTo(x, y);
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;

            if (currentTool === 'pencil' || currentTool === 'eraser') {
                draw(e);
            } else {
                // For shapes, show preview while drawing
                // Note: This is simplified - a full implementation would save/restore canvas state
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (isDrawing && ['line', 'rect', 'circle'].includes(currentTool)) {
                drawShape(e);
            }
            isDrawing = false;
            ctx.beginPath();
        });

        canvas.addEventListener('mouseleave', () => {
            isDrawing = false;
        });
    }

    // --- Clock ---
    function updateClock() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        document.getElementById('clock').textContent = `${hours}:${minutes}`;
    }
    updateClock();
    setInterval(updateClock, 30000); // Update every 30 seconds

    // --- Start Button ---
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', () => {
        // Placeholder for start menu functionality
        alert('スタートメニューは現在実装中です');
    });

    // Initialize - hide all windows on start
    windows.forEach(win => win.classList.add('hidden'));
});