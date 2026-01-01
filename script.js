// REPLACE WITH YOUR NEW DEPLOYMENT URL
const API_URL = "YOUR_NEW_GOOGLE_SCRIPT_URL_HERE";

// State
let appData = { shortcuts: [], differences: [] };
let state = {
    isMac: false,
    isExcelSource: true
};

// DOM Elements
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const diffContainer = document.getElementById('differencesContainer');
const loading = document.getElementById('loading');
const osToggle = document.getElementById('osToggle');
const dirToggle = document.getElementById('dirToggle');
const instructionText = document.getElementById('instruction-text');

// Init
document.addEventListener('DOMContentLoaded', () => {
    detectOS();
    fetchData();
});

// 1. Auto-Detect OS
function detectOS() {
    const platform = navigator.platform.toUpperCase();
    if (platform.indexOf('MAC') >= 0 || platform.indexOf('IPHONE') >= 0) {
        state.isMac = true;
        osToggle.checked = true;
    }
    updateInstruction();
}

// 2. Fetch Data (Shortcuts + Differences)
async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const json = await response.json();
        
        // The API returns { shortcuts: [], differences: [] }
        appData.shortcuts = json.shortcuts;
        appData.differences = json.differences;
        
        loading.style.display = 'none';
        renderShortcuts(appData.shortcuts); // Render all initially
        renderDifferences([]); // Empty initially
    } catch (error) {
        console.error(error);
        loading.textContent = "Error loading database.";
    }
}

// 3. Event Listeners
searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    filterShortcuts(query);
    filterDifferences(query);
});

osToggle.addEventListener('change', () => {
    state.isMac = osToggle.checked;
    updateInstruction();
    // Re-render current view
    filterShortcuts(searchInput.value);
});

dirToggle.addEventListener('change', () => {
    state.isExcelSource = !dirToggle.checked; // Unchecked = Excel (Left side), Checked = Sheets
    updateInstruction();
    filterShortcuts(searchInput.value);
});

// 4. Update UI Helpers
function updateInstruction() {
    const os = state.isMac ? "Mac" : "Windows";
    const mode = state.isExcelSource ? "Excel -> Sheets" : "Sheets -> Excel";
    
    // Update simple text helper
    const modifier = state.isMac ? "Cmd" : "Ctrl";
    instructionText.innerHTML = `Mode: <strong>${os}</strong> | ${mode} | Tip: Use <strong>${modifier}</strong> key`;
}

// 5. Filter & Render Shortcuts
function filterShortcuts(query) {
    const lowerQ = query.toLowerCase();
    
    const filtered = appData.shortcuts.filter(item => {
        // Search in description, and ALL shortcut columns to be safe
        return Object.values(item).some(val => 
            String(val).toLowerCase().includes(lowerQ)
        );
    });
    
    renderShortcuts(filtered);
}

function renderShortcuts(data) {
    resultsContainer.innerHTML = '';
    
    if(data.length === 0) {
        resultsContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#666">No shortcuts found. Check the Differences panel?</div>';
        return;
    }

    data.forEach(item => {
        // DYNAMIC COLUMN SELECTION
        // 1. Determine OS Suffix
        const osSuffix = state.isMac ? "_mac" : "_win";
        
        // 2. Determine Source/Target Columns
        let sourceCol, targetCol;
        
        if (state.isExcelSource) {
            sourceCol = "excel" + osSuffix;
            targetCol = "gsheet" + osSuffix;
        } else {
            sourceCol = "gsheet" + osSuffix;
            targetCol = "excel" + osSuffix;
        }

        const sourceKey = item[sourceCol] || "N/A";
        const targetKey = item[targetCol] || "N/A";

        // Create Card
        const card = document.createElement('div');
        card.className = 'shortcut-card';
        card.innerHTML = `
            <div class="sc-desc">${item.description}</div>
            <div class="sc-keys">
                <span class="key-display source" title="Source">${sourceKey}</span>
                <span class="sc-arrow">&rarr;</span>
                <span class="key-display target" title="Converted">${targetKey}</span>
            </div>
            <div style="font-size:0.75rem; color:#888; text-align:right;">${item.type}</div>
        `;
        resultsContainer.appendChild(card);
    });
}

// 6. Filter & Render Differences (Knowledge Base)
function filterDifferences(query) {
    if(!query) {
        renderDifferences([]); // Hide if no search
        return;
    }

    const lowerQ = query.toLowerCase();
    
    const filtered = appData.differences.filter(diff => {
        return (diff.keywords && diff.keywords.toLowerCase().includes(lowerQ)) || 
               (diff.title && diff.title.toLowerCase().includes(lowerQ));
    });

    renderDifferences(filtered);
}

function renderDifferences(data) {
    diffContainer.innerHTML = '';

    if (data.length === 0) {
        diffContainer.innerHTML = '<div class="empty-state-panel">Search a topic (e.g. "Macro", "Save") to see platform differences.</div>';
        return;
    }

    data.forEach(diff => {
        const div = document.createElement('div');
        div.className = 'diff-card';
        div.innerHTML = `
            <h4>${diff.title}</h4>
            <p>${diff.content}</p>
        `;
        diffContainer.appendChild(div);
    });
}
