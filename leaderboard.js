// Leaderboard JavaScript

// DOM Elements
const leaderboardList = document.getElementById('leaderboardList');
const leaderboardCategoryFilter = document.getElementById('leaderboardCategory');
const backToQuizBtn = document.getElementById('backToQuizBtn');

// Category names mapping
const categoryNames = {
    'pengetahuan-umum': '🌍 Pengetahuan Umum',
    'film': '🎬 Film & Sinema',
    'musik': '🎵 Musik & Lagu',
    'kuliner': '🍜 Kuliner & Makanan',
    'geografi': '🗺️ Geografi & Bendera',
    'hewan': '🐾 Hewan & Satwa',
    'olahraga': '⚽ Olahraga',
    'bahasa': '💬 Bahasa & Idiom'
};

const difficultyNames = {
    'mudah': 'Mudah',
    'sedang': 'Sedang',
    'sulit': 'Sulit'
};

// Load color theme preference
const savedTheme = localStorage.getItem('colorTheme') || 'purple';
document.body.setAttribute('data-theme', savedTheme);

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// Event Listeners
leaderboardCategoryFilter.addEventListener('change', loadLeaderboard);
backToQuizBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Load leaderboard on page load
loadLeaderboard();

// Load Leaderboard Function
function loadLeaderboard() {
    const leaderboardData = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    const selectedCategory = leaderboardCategoryFilter.value;

    // Filter by category
    let filteredData = leaderboardData;
    if (selectedCategory !== 'all') {
        filteredData = leaderboardData.filter(entry => entry.category === selectedCategory);
    }

    // Sort by score (highest first)
    filteredData.sort((a, b) => b.score - a.score);

    // Take top 10
    const top10 = filteredData.slice(0, 10);

    // Display leaderboard
    if (top10.length === 0) {
        leaderboardList.innerHTML = `
            <div class="leaderboard-empty">
                <p>📊 Belum ada data leaderboard</p>
                <p>Mainkan quiz untuk masuk leaderboard!</p>
            </div>
        `;
        return;
    }

    leaderboardList.innerHTML = '';

    top10.forEach((entry, index) => {
        const rank = index + 1;
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const categoryName = categoryNames[entry.category] || entry.category;
        const difficultyName = difficultyNames[entry.difficulty] || entry.difficulty;

        // Medal for top 3
        let rankBadge = `<span class="rank-badge">#${rank}</span>`;
        if (rank === 1) {
            rankBadge = `<span class="rank-badge gold">🥇 #1</span>`;
        } else if (rank === 2) {
            rankBadge = `<span class="rank-badge silver">🥈 #2</span>`;
        } else if (rank === 3) {
            rankBadge = `<span class="rank-badge bronze">🥉 #3</span>`;
        }

        const leaderboardItem = document.createElement('div');
        leaderboardItem.className = `leaderboard-item rank-${rank}`;
        leaderboardItem.innerHTML = `
            ${rankBadge}
            <div class="player-info">
                <div class="player-name">${entry.name}</div>
                <div class="player-details">
                    ${categoryName} • ${difficultyName} • ${formattedDate}
                </div>
            </div>
            <div class="player-score">
                <div class="score-value">${entry.score}</div>
                <div class="score-label">poin</div>
            </div>
        `;

        leaderboardList.appendChild(leaderboardItem);
    });
}
