// PASTE YOUR GOOGLE SCRIPT URL HERE
const API_URL = "https://script.google.com/macros/s/AKfycbyCVYvwe5Zz2aSIWZt-zaAu75_1RYHa-5Abb3HB02x0nj_jY3fnK10RfIJsaAdabzau5Q/exec"; 

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
        
        appData.shortcuts = cleanDataKeys(json.shortcuts);
        appData.differences = cleanDataKeys(json.differences);
        
        els.loading.style.display = 'none';
        render(appData.shortcuts); 
    } catch (err) {
        console.error(err);
        els.loading.textContent = "Error loading database.";
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

// Logic
function filterShortcuts(query) {
    const q = query.toLowerCase();
    const filtered = appData.shortcuts.filter(item => 
        Object.values(item).some(val => String(val).toLowerCase().includes(q))
    );
    render(filtered);
}

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

        // Determine Tag Color
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

function showDifferences(query) {
    if (!query) {
        els.diffBox.style.display = 'none';
        return;
    }
    const q = query.toLowerCase();
    const match = appData.differences.find(d => 
        (d.keywords && d.keywords.toLowerCase().includes(q)) || 
        (d.title && d.title.toLowerCase().includes(q))
    );

    if (match) {
        els.diffBox.style.display = 'block';
        els.diffBox.innerHTML = `<strong>💡 ${match.title}</strong> ${match.content}`;
    } else {
        els.diffBox.style.display = 'none';
    }
}
