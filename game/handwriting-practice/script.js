document.addEventListener('DOMContentLoaded', () => {
    const charInput = document.getElementById('charInput');
    const generateBtn = document.getElementById('generateBtn');
    const animateBtn = document.getElementById('animateBtn');
    const quizBtn = document.getElementById('quizBtn');
    const statusText = document.getElementById('statusText');
    const targetDiv = document.getElementById('character-target-div');

    let writer = null;
    let isQuizzing = false;

    // Initialize with default character
    updateCharacter('喵');

    generateBtn.addEventListener('click', () => {
        const char = charInput.value.trim();
        if (char) {
            updateCharacter(char[0]); // Take first character only
        }
    });

    animateBtn.addEventListener('click', () => {
        if (writer) {
            cancelQuiz();
            statusText.textContent = '正在演示...';
            writer.animateCharacter({
                onComplete: () => {
                    statusText.textContent = '演示完成';
                }
            });
        }
    });

    quizBtn.addEventListener('click', () => {
        if (writer) {
            startQuiz();
        }
    });

    function updateCharacter(char) {
        // Clear previous writer instance if needed (though HanziWriter.create replaces content usually, 
        // it's safer to clear the container or just let the library handle it. 
        // The library appends an SVG, so we should clear the div first.)
        targetDiv.innerHTML = '';
        statusText.textContent = '准备就绪';
        cancelQuiz();

        writer = HanziWriter.create('character-target-div', char, {
            width: 260,
            height: 260,
            padding: 5,
            showOutline: true,
            strokeAnimationSpeed: 1, // 1x speed
            delayBetweenStrokes: 200, // ms
            radicalColor: '#333333', // Dark color for the character
            outlineColor: '#ddd', // Light gray for outline
            strokeColor: '#333333',
            showCharacter: true,
            showHintAfterMisses: 1,
            highlightOnComplete: true,
            // Tian Zi Ge background
            showBackground: true,
            backgroundType: 'outline', // 'outline' gives a box, we might want custom SVG for Tian Zi Ge
            // Custom background for Tian Zi Ge (Cross)
            // We can draw lines using SVG in the background or use CSS. 
            // HanziWriter allows a custom background function or we can just use CSS on the container.
            // Let's stick to simple CSS background or SVG lines if possible.
            // Actually, HanziWriter doesn't have a built-in 'tianzige' type, so we'll add it via CSS or SVG.
        });

        // Add Tian Zi Ge lines manually since HanziWriter background is simple
        addTianZiGeBackground();
    }

    function startQuiz() {
        if (!writer) return;
        isQuizzing = true;
        statusText.textContent = '请开始描红...';

        // To make it look like "tracing", we can hide the main character strokes 
        // and only show the outline.
        writer.hideCharacter();
        writer.showOutline();

        writer.quiz({
            onAlive: (data) => {
                statusText.textContent = '不错！继续...';
            },
            onMistake: (data) => {
                statusText.textContent = '笔画不对哦，再试试';
            },
            onComplete: (data) => {
                statusText.textContent = '太棒了！练习完成';
                isQuizzing = false;
                setTimeout(() => {
                    writer.showCharacter(); // Show full character after completion
                }, 1000);
            }
        });
    }

    function cancelQuiz() {
        if (isQuizzing && writer) {
            writer.cancelQuiz();
            isQuizzing = false;
            writer.showCharacter();
        }
    }

    function addTianZiGeBackground() {
        // Create SVG lines for Tian Zi Ge
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = targetDiv.querySelector('svg');
        if (!svg) return;

        // We want to insert the grid lines *before* the character strokes so they are in the background.
        // HanziWriter creates a <g> for strokes. We can prepend our grid group.

        const gridGroup = document.createElementNS(svgNS, 'g');
        gridGroup.setAttribute('class', 'tian-zi-ge-grid');
        gridGroup.setAttribute('stroke', '#e0e0e0');
        gridGroup.setAttribute('stroke-width', '1');

        const width = 260;
        const height = 260;

        // Horizontal line
        const hLine = document.createElementNS(svgNS, 'line');
        hLine.setAttribute('x1', 0);
        hLine.setAttribute('y1', height / 2);
        hLine.setAttribute('x2', width);
        hLine.setAttribute('y2', height / 2);
        hLine.setAttribute('stroke-dasharray', '5,5'); // Dashed line
        gridGroup.appendChild(hLine);

        // Vertical line
        const vLine = document.createElementNS(svgNS, 'line');
        vLine.setAttribute('x1', width / 2);
        vLine.setAttribute('y1', 0);
        vLine.setAttribute('x2', width / 2);
        vLine.setAttribute('y2', height);
        vLine.setAttribute('stroke-dasharray', '5,5'); // Dashed line
        gridGroup.appendChild(vLine);

        // Diagonals (optional, for Mi Zi Ge, but image shows Tian Zi Ge + Diagonals? 
        // The image shows a "Mi Zi Ge" (米字格) actually - vertical, horizontal, and two diagonals.
        // Let's add diagonals for Mi Zi Ge as seen in the image.

        const d1 = document.createElementNS(svgNS, 'line');
        d1.setAttribute('x1', 0);
        d1.setAttribute('y1', 0);
        d1.setAttribute('x2', width);
        d1.setAttribute('y2', height);
        d1.setAttribute('stroke-dasharray', '5,5');
        gridGroup.appendChild(d1);

        const d2 = document.createElementNS(svgNS, 'line');
        d2.setAttribute('x1', width);
        d2.setAttribute('y1', 0);
        d2.setAttribute('x2', 0);
        d2.setAttribute('y2', height);
        d2.setAttribute('stroke-dasharray', '5,5');
        gridGroup.appendChild(d2);

        // Border box
        const border = document.createElementNS(svgNS, 'rect');
        border.setAttribute('x', 0);
        border.setAttribute('y', 0);
        border.setAttribute('width', width);
        border.setAttribute('height', height);
        border.setAttribute('fill', 'none');
        border.setAttribute('stroke', '#ccc');
        border.setAttribute('stroke-width', '2');
        gridGroup.appendChild(border);

        svg.insertBefore(gridGroup, svg.firstChild);
    }
});
