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

    // --- Settings OK Button Logic ---
    const settingsOkBtn = document.getElementById('settings-ok-btn');
    if (settingsOkBtn) {
        settingsOkBtn.addEventListener('click', () => {
            document.getElementById('window-settings').classList.add('hidden');
        });
    }


    // --- Calculator Logic ---
    // (Calculator logic remains unchanged)
    const calcDisplay = document.getElementById('calc-display');
    const calcButtons = document.querySelectorAll('.calculator-grid button');
    let currentInput = '0';
    let operator = null;
    let previousInput = null;
    let shouldResetDisplay = false;
    calcButtons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.textContent;
            if (!isNaN(value)) {if (currentInput === '0' || shouldResetDisplay) {currentInput = value; shouldResetDisplay = false;} else {currentInput += value;}} else if (['+', '-', '*', '/'].includes(value)) {if (operator && previousInput) {currentInput = calculate(previousInput, currentInput, operator);}operator = value; previousInput = currentInput; shouldResetDisplay = true;} else if (value === '=') {if (operator && previousInput) {currentInput = calculate(previousInput, currentInput, operator); operator = null; previousInput = null;}} else if (value === 'C') {currentInput = '0'; operator = null; previousInput = null;}
            calcDisplay.textContent = currentInput;
        });
    });
    function calculate(a, b, op) {const numA = parseFloat(a); const numB = parseFloat(b); if (op === '+') return (numA + numB).toString(); if (op === '-') return (numA - numB).toString(); if (op === '*') return (numA * numB).toString(); if (op === '/') return (numA / numB).toString(); return b;}


    // --- Paint Logic ---
    const canvas = document.getElementById('paint-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        
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

        const getMousePos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const drawDot = (e) => {
            if (!isDrawing) return;
            const { x, y } = getMousePos(e);
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        };

        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            drawDot(e);
        });
        canvas.addEventListener('mousemove', drawDot);
        canvas.addEventListener('mouseup', () => isDrawing = false);
        canvas.addEventListener('mouseleave', () => isDrawing = false);
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