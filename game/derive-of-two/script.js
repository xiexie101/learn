import { tasks, truthOrDare } from './tasks.js';

// DOM Elements
const screens = {
    landing: document.getElementById('landing'),
    spin: document.getElementById('spin-screen'),
    task: document.getElementById('task-screen'),
    veto: document.getElementById('veto-screen')
};

const wheel = document.getElementById('wheel');
const taskCard = document.getElementById('task-card');

// Buttons
const btnStart = document.getElementById('start-btn');
const btnSpin = document.getElementById('spin-btn');
const btnAccept = document.getElementById('accept-btn');
const btnVeto = document.getElementById('veto-btn');
const btnTruthDone = document.getElementById('truth-done-btn');
const btnReset = document.getElementById('reset-btn');

// State
let currentRotation = 0;
let currentDeg = 0;
let isSpinning = false;
let currentTask = null;
const today = new Date().toISOString().split('T')[0];
const storageKey = `derive_history_${today}`;

// URL Params
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('tip') === '1') {
    document.body.classList.add('show-tips');
}

// Load history
let history = JSON.parse(localStorage.getItem(storageKey) || '[]');

// Categories mapped to angles
// 0: Attunement (Blue) - 0-90 deg
// 1: Detournement (Red) - 90-180 deg
// 2: Conspiracy (Green) - 180-270 deg
// 3: Dream (Purple) - 270-360 deg
const categories = ['Attunement', 'Detournement', 'Conspiracy', 'Dream'];
const categoriesLabel = ['观察', '非常规', '互动', '探索'];

// Helpers
function showScreen(screenName) {
    Object.values(screens).forEach(s => {
        s.classList.remove('visible');
        s.classList.add('hidden');
    });
    screens[screenName].classList.remove('hidden');
    screens[screenName].classList.add('visible');
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTaskByCategory(category) {
    const validTasks = tasks.filter(t => t.category === category && !history.includes(t.id));

    if (validTasks.length === 0) {
        return null;
    }

    return validTasks[getRandomInt(0, validTasks.length - 1)];
}

function getRandomTruth() {
    return truthOrDare[getRandomInt(0, truthOrDare.length - 1)];
}

function addToHistory(taskId) {
    if (!history.includes(taskId)) {
        history.push(taskId);
        localStorage.setItem(storageKey, JSON.stringify(history));
    }
}

// Event Listeners
btnStart.addEventListener('click', () => {
    showScreen('spin');
});

btnReset.addEventListener('click', () => {
    if (confirm('确定要重置今日的所有记录吗？之前的任务可能会再次出现。')) {
        history = [];
        localStorage.removeItem(storageKey);
        alert('记录已重置。');
    }
});

btnSpin.addEventListener('click', () => {
    if (isSpinning) return;
    isSpinning = true;
    btnSpin.disabled = true;

    // Calculate a random spin
    // Minimum 3 full rotations (1080) + random angle
    const extraSpins = 360 * 5;
    const randomAngle = getRandomInt(0, 360);
    const totalRotation = currentRotation + extraSpins + randomAngle;

    // Update rotation
    wheel.style.transform = `rotate(-${totalRotation}deg)`;

    currentRotation = totalRotation;

    // Determine the result
    // We rotate NEGATIVE, so the indicator at top (0 deg) selects the sector at that angle
    // If we rotate -90deg, the sector that was at 90deg is now at top.

    // Normalize final angle to 0-360
    const finalAngle = totalRotation % 360;

    // Determine sector index
    // Sector 0 (0-90)
    // Sector 1 (90-180)
    // Sector 2 (180-270)
    // Sector 3 (270-360)

    let sectorIndex = Math.floor(finalAngle / 90);
    // Adjust based on the wheel layout logic.
    // S0 (Top-Left, 9-12), S1 (Top-Right, 12-3), etc.
    // Rotating CCW (Negative):
    // 0-90 deg rotation brings S1 under the needle.
    // 90-180 deg rotation brings S2 under the needle.
    // So mapped index needs to be shifted by +1.
    // 0 -> S1, 1 -> S2, 2 -> S3, 3 -> S0

    const adjustedIndex = (sectorIndex + 1) % 4;

    const selectedCategory = categories[adjustedIndex];
    const selectedCategoryLabel = categoriesLabel[adjustedIndex];
    console.log("Selected:", selectedCategory, "Angle:", finalAngle, "Index:", adjustedIndex);

    // Wait for animation end (4s)
    setTimeout(() => {
        isSpinning = false;
        btnSpin.disabled = false;

        // Pick a task
        currentTask = getTaskByCategory(selectedCategory);

        if (currentTask) {
            // Add to history NOW (as per requirement "appeared")
            addToHistory(currentTask.id);
            showTask(currentTask);
        } else {
            alert(`【${selectedCategoryLabel}】类别的今日任务已全部完成！\n请尝试重置记录或休息一下。`);
        }

    }, 4000);
});

// 0: Attunement (Blue) -> Spades
// 1: Detournement (Red) -> Hearts
// 2: Conspiracy (Green) -> Clubs
// 3: Dream (Purple) -> Diamonds
const categorySuitMap = {
    'Attunement': '#icon-spades',
    'Detournement': '#icon-hearts',
    'Conspiracy': '#icon-clubs',
    'Dream': '#icon-diamonds'
};

function showTask(task) {
    const elId = taskCard.querySelector('.task-id');
    const elCat = taskCard.querySelector('.task-category');
    const elTitle = taskCard.querySelector('.task-title');
    const elDesc = taskCard.querySelector('.task-desc');
    const elBgIconUse = taskCard.querySelector('.card-bg-icon use');
    const elBgIconSvg = taskCard.querySelector('.card-bg-icon svg');

    elId.textContent = `#${task.id.toString().padStart(2, '0')}`;
    elCat.textContent = task.categoryLabel;
    elTitle.textContent = task.title;
    elDesc.textContent = task.description;

    // Apply accent color
    elCat.style.color = task.color;
    // elTitle.style.color = task.color; 

    // Apply Suit Icon
    const suitId = categorySuitMap[task.category];
    if (suitId) {
        elBgIconUse.setAttribute('href', suitId);
        elBgIconSvg.style.color = task.color;
    }

    showScreen('task');
}

btnAccept.addEventListener('click', () => {
    // Return to spin screen to continue playing later
    showScreen('spin');
});

btnVeto.addEventListener('click', () => {
    const truth = getRandomTruth();
    document.getElementById('truth-question').textContent = truth;
    showScreen('veto');
});

btnTruthDone.addEventListener('click', () => {
    showScreen('spin');
});


// --- Gallery Logic ---

const galleryGrid = document.getElementById('gallery-grid');
const galleryBackBtn = document.getElementById('gallery-back-btn');
const galleryEntryBtn = document.getElementById('gallery-entry-btn');
const filterBtns = document.querySelectorAll('.filter-btn');

// Add gallery screen to screens object
screens.gallery = document.getElementById('gallery-screen');

galleryEntryBtn.addEventListener('click', () => {
    renderGallery();
    showScreen('gallery');
});

galleryBackBtn.addEventListener('click', () => {
    showScreen('landing');
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active from all
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');

        const category = btn.getAttribute('data-category');
        filterGallery(category);
    });
});

function renderGallery() {
    galleryGrid.innerHTML = '';

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `gallery-card task-cat-${task.category}`;
        card.dataset.category = task.category;

        // CSS Variables for color
        card.style.setProperty('--card-color', task.color);

        const suitId = categorySuitMap[task.category];

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-face back">
                    <span class="card-id">#${task.id.toString().padStart(2, '0')}</span>
                    <div class="card-watermark">
                        <svg viewBox="0 0 24 24">
                            <use href="${suitId}"></use>
                        </svg>
                    </div>
                </div>
                <div class="card-face front">
                    <div class="card-cat-label">${task.categoryLabel}</div>
                    <div class="card-mini-title">${task.title}</div>
                    <div class="card-mini-desc">${task.description}</div>
                </div>
            </div>
        `;

        // Flip Interaction
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
        });

        galleryGrid.appendChild(card);
    });
}

function filterGallery(category) {
    const cards = document.querySelectorAll('.gallery-card');
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}
