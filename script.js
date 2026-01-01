// Paste your Web App URL here
const API_URL = "https://script.google.com/macros/s/AKfycbwEjkaQQRSTdhncI9Ix43bTKdN0K3NlTemD3S3B9FtqOLtjQfNueuO3Zl-nd-la8oVJoQ/exec";

const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const loadingIndicator = document.getElementById('loading');
const modeToggle = document.getElementById('modeToggle');
const modeDisplay = document.getElementById('mode-display');

let allShortcuts = [];
let isExcelToGoogle = true; // Default mode

// 1. Fetch Data on Load
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allShortcuts = data;
        loadingIndicator.style.display = 'none';
        renderShortcuts(allShortcuts); // Show all initially
    } catch (error) {
        console.error('Error fetching data:', error);
        loadingIndicator.textContent = "Error loading data. Please check connection.";
    }
}

// 2. Event Listeners
searchInput.addEventListener('input', (e) => {
    filterData(e.target.value);
});

modeToggle.addEventListener('change', () => {
    isExcelToGoogle = !modeToggle.checked; // If checked, it's Google -> Excel
    updateModeDisplay();
    // Re-render with current search term to swap columns
    filterData(searchInput.value);
});

function updateModeDisplay() {
    if (isExcelToGoogle) {
        modeDisplay.innerHTML = "Excel &rarr; Google Sheets";
    } else {
        modeDisplay.innerHTML = "Google Sheets &rarr; Excel";
    }
}

// 3. Filter Logic
function filterData(query) {
    const lowerQuery = query.toLowerCase();

    const filtered = allShortcuts.filter(item => {
        // Safe check in case fields are empty
        const desc = item.description ? item.description.toLowerCase() : "";
        const excel = item.excel_shortcut ? item.excel_shortcut.toLowerCase() : "";
        const gsheet = item.gsheet_shortcut ? item.gsheet_shortcut.toLowerCase() : "";

        return desc.includes(lowerQuery) || 
               excel.includes(lowerQuery) || 
               gsheet.includes(lowerQuery);
    });

    renderShortcuts(filtered);
}

// 4. Render Logic
function renderShortcuts(data) {
    resultsContainer.innerHTML = '';

    if (data.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align:center; color:#888;">No shortcuts found.</p>';
        return;
    }

    data.forEach(item => {
        // Determine which shortcut is source/target based on toggle
        const sourceKey = isExcelToGoogle ? item.excel_shortcut : item.gsheet_shortcut;
        const targetKey = isExcelToGoogle ? item.gsheet_shortcut : item.excel_shortcut;
        
        // Determine type class
        const typeClass = item.type === "Hold" ? "tag-hold" : "tag-seq";

        const card = document.createElement('div');
        card.className = 'shortcut-card';

        card.innerHTML = `
            <div class="card-content">
                <div class="description">${item.description}</div>
                <div class="conversion-row">
                    <span class="key-badge source-key">${sourceKey}</span>
                    <span class="arrow">&rarr;</span>
                    <span class="key-badge target-key">${targetKey}</span>
                </div>
            </div>
            <span class="type-tag ${typeClass}">${item.type}</span>
        `;

        resultsContainer.appendChild(card);
    });
}
