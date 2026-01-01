// REPLACE WITH YOUR GOOGLE APPS SCRIPT URL
const API_URL = "https://script.google.com/macros/s/AKfycbwEjkaQQRSTdhncI9Ix43bTKdN0K3NlTemD3S3B9FtqOLtjQfNueuO3Zl-nd-la8oVJoQ/exec"; 

let appData = { shortcuts: [], differences: [] };
let state = { isMac: false, isExcelSource: true };

// Elements
const els = {
    search: document.getElementById('searchInput'),
    results: document.getElementById('resultsContainer'),
    diffBox: document.getElementById('differencesContainer'),
    loading: document.getElementById('loading'),
    osToggle: document.getElementById('osToggle'),
    dirToggle: document.getElementById('dirToggle'),
    instruction: document.getElementById('instruction-text')
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Auto-detect Mac
    if (navigator.platform.toUpperCase().includes('MAC')) {
        state.isMac = true;
        els.osToggle.checked = true;
    }
    updateInstruction();
    fetchData();
});

// Fetch & Clean Data
async function fetchData() {
    try {
        const res = await fetch(API_URL);
        const json = await res.json();
        
        // Normalize keys (handle excel_Win vs excel_win)
        appData.shortcuts = cleanDataKeys(json.shortcuts);
        appData.differences = cleanDataKeys(json.differences);
        
        els.loading.style.display = 'none';
        render(appData.shortcuts); 
    } catch (err) {
        console.error(err);
        els.loading.textContent = "Error loading database. Check console.";
    }
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

// Events
els.search.addEventListener('input', (e) => {
    const q = e.target.value;
    filterShortcuts(q);
    showDifferences(q);
});

els.osToggle.addEventListener('change', () => {
    state.isMac = els.osToggle.checked;
    updateInstruction();
    filterShortcuts(els.search.value);
});

els.dirToggle.addEventListener('change', () => {
    state.isExcelSource = !els.dirToggle.checked;
    updateInstruction();
    filterShortcuts(els.search.value);
});

function updateInstruction() {
    const os = state.isMac ? "Mac" : "Windows";
    const flow = state.isExcelSource ? "Excel &rarr; Sheets" : "Sheets &rarr; Excel";
    els.instruction.innerHTML = `Mode: <strong>${os}</strong> | ${flow}`;
}

// Logic: Search Shortcuts
function filterShortcuts(query) {
    const q = query.toLowerCase();
    const filtered = appData.shortcuts.filter(item => 
        Object.values(item).some(val => String(val).toLowerCase().includes(q))
    );
    render(filtered);
}

// Logic: Render Results
function render(data) {
    els.results.innerHTML = '';
    
    if (data.length === 0) {
        els.results.innerHTML = '<div style="text-align:center; color:#999; margin-top:20px;">No shortcuts found.</div>';
        return;
    }

    data.forEach(item => {
        const osSuffix = state.isMac ? "_mac" : "_win";
        const sourceCol = (state.isExcelSource ? "excel" : "gsheet") + osSuffix;
        const targetCol = (state.isExcelSource ? "gsheet" : "excel") + osSuffix;

        const sVal = item[sourceCol] || "N/A";
        const tVal = item[targetCol] || "N/A";

        // Tag Logic
        const typeStr = (item.type || "").toLowerCase();
        let typeClass = "type-tag";
        if (typeStr.includes("hold")) typeClass += " tag-hold";
        else if (typeStr.includes("seq")) typeClass += " tag-seq";

        const card = document.createElement('div');
        card.className = 'shortcut-card';
        card.innerHTML = `
            <div class="card-content">
                <div class="desc">${item.description || "Unknown Action"}</div>
                <div class="keys-row">
                    <span class="key-badge">${sVal}</span>
                    <span class="arrow">&rarr;</span>
                    <span class="key-badge target-badge">${tVal}</span>
                </div>
            </div>
            <div class="${typeClass}">${item.type || ""}</div>
        `;
        els.results.appendChild(card);
    });
}

// Logic: Show Multiple Differences
function showDifferences(query) {
    if (!query) {
        els.diffBox.style.display = 'none';
        return;
    }
    const q = query.toLowerCase();
    
    // FIND ALL MATCHES
    const matches = appData.differences.filter(d => 
        (d.keywords && d.keywords.toLowerCase().includes(q)) || 
        (d.title && d.title.toLowerCase().includes(q))
    );

    if (matches.length > 0) {
        els.diffBox.style.display = 'block';
        // Map matches to HTML and join them
        els.diffBox.innerHTML = matches.map(match => `
            <div style="margin-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 12px;">
                <strong>💡 ${match.title}</strong> 
                ${match.content}
            </div>
        `).join('');
        
        // Clean up last item style
        if(els.diffBox.lastElementChild) {
            els.diffBox.lastElementChild.style.borderBottom = 'none';
            els.diffBox.lastElementChild.style.marginBottom = '0';
            els.diffBox.lastElementChild.style.paddingBottom = '0';
        }
    } else {
        els.diffBox.style.display = 'none';
    }
}
