// REPLACE WITH YOUR APPS SCRIPT URL
const API_URL = "https://script.google.com/macros/s/AKfycbwEjkaQQRSTdhncI9Ix43bTKdN0K3NlTemD3S3B9FtqOLtjQfNueuO3Zl-nd-la8oVJoQ/exec";

let allShortcuts = [];
let currentCard = null;
let streak = 0;
let isMac = false;

const els = {
    loading: document.getElementById('loading'),
    actionText: document.getElementById('action-text'),
    excelKeys: document.getElementById('excel-keys'),
    sheetKeys: document.getElementById('sheet-keys'),
    cardBack: document.getElementById('card-back'),
    revealBtn: document.getElementById('revealBtn'),
    ratingBtns: document.getElementById('rating-btns'),
    streak: document.getElementById('streak'),
    osToggle: document.getElementById('osToggle'),
    osLabel: document.getElementById('os-label')
};

document.addEventListener('DOMContentLoaded', async () => {
    // Auto-detect Mac
    if (navigator.platform.toUpperCase().includes('MAC')) {
        isMac = true;
        els.osToggle.checked = true;
        els.osLabel.textContent = "Mac";
    }

    try {
        const res = await fetch(API_URL);
        const json = await res.json();
        allShortcuts = cleanDataKeys(json.shortcuts);
        els.loading.style.display = 'none';
        nextCard();
    } catch (err) {
        console.error(err);
        els.loading.textContent = "Error loading database.";
    }
});

els.osToggle.addEventListener('change', () => {
    isMac = els.osToggle.checked;
    els.osLabel.textContent = isMac ? "Mac" : "Windows";
    // If card is revealed, update keys immediately
    if (els.cardBack.style.display === 'block' && currentCard) {
        renderKeys();
    }
});

els.revealBtn.addEventListener('click', () => {
    renderKeys();
    els.cardBack.style.display = 'block';
    els.revealBtn.style.display = 'none';
    els.ratingBtns.style.display = 'flex';
});

document.getElementById('gotBtn').addEventListener('click', () => {
    streak++;
    els.streak.textContent = streak;
    nextCard();
});

document.getElementById('missBtn').addEventListener('click', () => {
    streak = 0;
    els.streak.textContent = streak;
    nextCard();
});

function nextCard() {
    // Reset UI
    els.cardBack.style.display = 'none';
    els.revealBtn.style.display = 'block';
    els.ratingBtns.style.display = 'none';

    // Pick Random
    const randIndex = Math.floor(Math.random() * allShortcuts.length);
    currentCard = allShortcuts[randIndex];

    // Show Description
    els.actionText.textContent = currentCard.description;
}

function renderKeys() {
    const osSuffix = isMac ? "_mac" : "_win";
    els.excelKeys.textContent = currentCard["excel" + osSuffix] || "N/A";
    els.sheetKeys.textContent = currentCard["gsheet" + osSuffix] || "N/A";
}

function cleanDataKeys(data) {
    return data.map(item => {
        const newItem = {};
        Object.keys(item).forEach(key => {
            newItem[key.trim().toLowerCase()] = item[key]; 
        });
        return newItem;
    });
}
