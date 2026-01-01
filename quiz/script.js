// REPLACE WITH YOUR APPS SCRIPT URL
const API_URL = "https://script.google.com/macros/s/AKfycbyCVYvwe5Zz2aSIWZt-zaAu75_1RYHa-5Abb3HB02x0nj_jY3fnK10RfIJsaAdabzau5Q/exec"; 

let allQuestions = [];
let currentPool = [];
let currentIndex = 0;
let score = 0;

const els = {
    loading: document.getElementById('loading'),
    gameArea: document.getElementById('game-area'),
    filterBar: document.querySelector('.filter-bar'),
    questionText: document.getElementById('question-text'),
    optionsGrid: document.getElementById('options-container'),
    feedback: document.getElementById('feedback'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackText: document.getElementById('feedback-text'),
    nextBtn: document.getElementById('nextBtn'),
    startBtn: document.getElementById('startBtn'),
    score: document.getElementById('score'),
    diffBadge: document.getElementById('diff-badge'),
    qNum: document.getElementById('q-number')
};

// 1. Fetch Data
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        // The script returns { shortcuts: [], differences: [], quizzes: [] }
        // We need to clean keys to lowercase to match our logic
        allQuestions = cleanDataKeys(data.quizzes);
        
        els.loading.style.display = 'none';
        
    } catch (err) {
        console.error(err);
        els.loading.textContent = "Error loading quiz data.";
    }
});

// 2. Start Game Logic
els.startBtn.addEventListener('click', () => {
    const topic = document.getElementById('topicSelect').value;
    const level = document.getElementById('levelSelect').value;
    
    // Filter
    currentPool = allQuestions.filter(q => {
        const matchTopic = topic === 'all' || (q.category && q.category.includes(topic));
        const matchLevel = level === 'all' || (q.difficulty === level);
        return matchTopic && matchLevel;
    });
    
    if(currentPool.length === 0) {
        alert("No questions found for this filter!");
        return;
    }

    // Shuffle
    currentPool = currentPool.sort(() => Math.random() - 0.5);
    
    // Reset
    currentIndex = 0;
    score = 0;
    els.score.textContent = 0;
    els.filterBar.style.display = 'none'; // Hide filters during game
    els.gameArea.style.display = 'block';
    
    loadQuestion();
});

// 3. Load Question
function loadQuestion() {
    const q = currentPool[currentIndex];
    
    // Update UI
    els.qNum.textContent = `Question ${currentIndex + 1} of ${currentPool.length}`;
    els.questionText.textContent = q.question;
    
    // Badge Color
    els.diffBadge.textContent = q.difficulty;
    els.diffBadge.className = 'difficulty-badge diff-' + q.difficulty.toLowerCase();
    
    // Hide Feedback
    els.feedback.style.display = 'none';
    els.optionsGrid.style.pointerEvents = 'auto'; // Re-enable clicks
    
    // Render Options
    els.optionsGrid.innerHTML = '';
    const options = [
        { text: q.option_a, key: 'option_a' },
        { text: q.option_b, key: 'option_b' },
        { text: q.option_c, key: 'option_c' },
        { text: q.option_d, key: 'option_d' }
    ];
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt.text;
        btn.onclick = () => checkAnswer(opt.text, q.correct_answer, q.explanation, btn);
        els.optionsGrid.appendChild(btn);
    });
}

// 4. Check Answer
function checkAnswer(selected, correct, explanation, btnElement) {
    // Disable further clicks
    els.optionsGrid.style.pointerEvents = 'none';
    
    const isCorrect = selected.trim() === correct.trim();
    
    if (isCorrect) {
        btnElement.classList.add('correct');
        score++;
        els.score.textContent = score;
        els.feedbackTitle.textContent = "✅ Correct!";
        els.feedbackTitle.style.color = "#166534";
    } else {
        btnElement.classList.add('wrong');
        els.feedbackTitle.textContent = "❌ Incorrect";
        els.feedbackTitle.style.color = "#991b1b";
        
        // Highlight the correct one
        Array.from(els.optionsGrid.children).forEach(b => {
            if(b.textContent.trim() === correct.trim()) {
                b.classList.add('correct');
            }
        });
    }
    
    els.feedbackText.textContent = explanation;
    els.feedback.style.display = 'block';
}

// 5. Next Button
els.nextBtn.addEventListener('click', () => {
    currentIndex++;
    if(currentIndex < currentPool.length) {
        loadQuestion();
    } else {
        // End of Quiz
        els.gameArea.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <h2>Quiz Complete! 🎉</h2>
                <p>Final Score: ${score} / ${currentPool.length}</p>
                <button onclick="location.reload()" style="margin-top:20px;">Play Again</button>
            </div>
        `;
    }
});

// Helper
function cleanDataKeys(data) {
    return data.map(item => {
        const newItem = {};
        Object.keys(item).forEach(key => {
            newItem[key.trim().toLowerCase()] = item[key]; 
        });
        return newItem;
    });
}
