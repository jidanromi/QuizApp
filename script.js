// Quiz Categories - Questions loaded from external files
const quizCategories = {
    'pengetahuan-umum': pengetahuanUmumQuestions,
    'film': filmQuestions,
    'musik': musikQuestions,
    'kuliner': kulinerQuestions,
    'geografi': geografiQuestions,
    'hewan': hewanQuestions,
    'olahraga': olahragaQuestions,
    'bahasa': bahasaQuestions
};

// Application State
let currentQuestionIndex = 0;
let score = 0;
let userName = '';
let userAge = 0;
let correctAnswersCount = 0;
let wrongAnswersCount = 0;
let selectedCategory = 'pengetahuan-umum';
let selectedDifficulty = 'sedang';
let timerEnabled = true;
let soundEnabled = true;
let currentQuizData = [];
let timeLeft = 10;
let timerInterval = null;
let streak = 0;
let maxStreak = 0;
let fiftyFiftyUsed = false;
let skipUsed = false;
let questionStartTime = 0;
let totalSpeedBonuses = 0;

// Difficulty settings
const difficultySettings = {
    mudah: { time: 15, pointsCorrect: 10, pointsWrong: 0 },
    sedang: { time: 10, pointsCorrect: 15, pointsWrong: -5 },
    sulit: { time: 7, pointsCorrect: 20, pointsWrong: -10 }
};

// Achievements
const achievements = [
    { id: 'perfect', name: 'Sempurna!', icon: '🏆', condition: (stats) => stats.correct === 10 },
    { id: 'speed', name: 'Kilat', icon: '⚡', condition: (stats) => stats.avgTime < 5 },
    { id: 'streak5', name: 'Streak 5', icon: '🔥', condition: (stats) => stats.maxStreak >= 5 },
    { id: 'noMistake', name: 'Tanpa Salah', icon: '✨', condition: (stats) => stats.wrong === 0 },
    { id: 'scholar', name: 'Cendekiawan', icon: '📚', condition: (stats) => stats.score >= 150 }
];

// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const quizScreen = document.getElementById('quizScreen');
const resultScreen = document.getElementById('resultScreen');
const userForm = document.getElementById('userForm');
const userNameInput = document.getElementById('userName');
const userAgeInput = document.getElementById('userAge');
const categorySelect = document.getElementById('quizCategory');
const difficultySelect = document.getElementById('difficulty');
const timerToggle = document.getElementById('timerToggle');
const soundToggle = document.getElementById('soundToggle');
const displayName = document.getElementById('displayName');
const displayAge = document.getElementById('displayAge');
const currentQuestionEl = document.getElementById('currentQuestion');
const totalQuestionsEl = document.getElementById('totalQuestions');
const currentScoreEl = document.getElementById('currentScore');
const progressFill = document.getElementById('progressFill');
const questionNum = document.getElementById('questionNum');
const questionText = document.getElementById('questionText');
const answersContainer = document.getElementById('answersContainer');
const nextBtn = document.getElementById('nextBtn');
const timerDisplay = document.getElementById('timerDisplay');
const timeLeftEl = document.getElementById('timeLeft');
const streakDisplay = document.getElementById('streakDisplay');
const streakCount = document.getElementById('streakCount');
const fiftyFiftyBtn = document.getElementById('fiftyFiftyBtn');
const skipBtn = document.getElementById('skipBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const themeButtons = document.querySelectorAll('.theme-btn');
const shareScoreBtn = document.getElementById('shareScoreBtn');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const correctAnswersEl = document.getElementById('correctAnswers');
const wrongAnswersEl = document.getElementById('wrongAnswers');
const finalScoreEl = document.getElementById('finalScore');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const achievementsDisplay = document.getElementById('achievementsDisplay');
const achievementsList = document.getElementById('achievementsList');
const retryBtn = document.getElementById('retryBtn');
const resultIcon = document.getElementById('resultIcon');

// Initialize
totalQuestionsEl.textContent = 10;

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// Load color theme preference
const savedTheme = localStorage.getItem('colorTheme') || 'purple';
document.body.setAttribute('data-theme', savedTheme);

// Set active theme button (if exists)
if (themeButtons && themeButtons.length > 0) {
    themeButtons.forEach(btn => {
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        }
    });
}

// Event Listeners
userForm.addEventListener('submit', startQuiz);
nextBtn.addEventListener('click', loadNextQuestion);
retryBtn.addEventListener('click', resetQuiz);
fiftyFiftyBtn.addEventListener('click', useFiftyFifty);
skipBtn.addEventListener('click', useSkip);
darkModeToggle.addEventListener('click', toggleDarkMode);

// Theme button listeners (if exists)
if (themeButtons && themeButtons.length > 0) {
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            changeColorTheme(theme);

            // Update active state
            themeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Sound Effects (using Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!soundEnabled) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'correct') {
        oscillator.frequency.value = 523.25; // C5
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } else if (type === 'wrong') {
        oscillator.frequency.value = 220; // A3
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'tick') {
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Color Theme Change
function changeColorTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('colorTheme', theme);
}

// Share Score
function shareScore() {
    const categoryEmojis = {
        'pengetahuan-umum': '🌍',
        'film': '🎬',
        'musik': '🎵',
        'kuliner': '🍜',
        'geografi': '🗺️',
        'hewan': '🐾',
        'olahraga': '⚽',
        'bahasa': '💬'
    };

    const categoryName = categoryNames[selectedCategory] || selectedCategory;
    const difficultyName = difficultyNames[selectedDifficulty] || selectedDifficulty;
    const percentage = Math.round((correctAnswersCount / 10) * 100);

    let shareText = `🎯 Quiz App - Hasil Saya!\n\n`;
    shareText += `👤 ${userName}\n`;
    shareText += `${categoryEmojis[selectedCategory]} ${categoryName}\n`;
    shareText += `⭐ Tingkat: ${difficultyName}\n\n`;
    shareText += `📊 Skor: ${score} poin\n`;
    shareText += `✅ Benar: ${correctAnswersCount}/10 (${percentage}%)\n`;
    shareText += `❌ Salah: ${wrongAnswersCount}\n`;

    if (totalSpeedBonuses > 0) {
        shareText += `⚡ Speed Bonus: ${totalSpeedBonuses}x\n`;
    }

    if (maxStreak >= 5) {
        shareText += `🔥 Max Streak: ${maxStreak}\n`;
    }

    shareText += `\n🏆 Coba kalahkan skor saya!`;

    // Try Web Share API first
    if (navigator.share) {
        navigator.share({
            title: 'Quiz App - Hasil Saya',
            text: shareText
        }).catch(err => console.log('Share cancelled'));
    } else {
        // Fallback: Copy to clipboard or WhatsApp
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    }
}

// Start Quiz
function startQuiz(e) {
    e.preventDefault();

    userName = userNameInput.value.trim();
    userAge = parseInt(userAgeInput.value);
    selectedCategory = categorySelect.value;
    selectedDifficulty = difficultySelect.value;
    timerEnabled = timerToggle.checked;
    soundEnabled = soundToggle.checked;

    if (!userName || !userAge) {
        alert('Mohon isi nama dan umur Anda!');
        return;
    }

    // Get quiz data for selected category
    currentQuizData = [...quizCategories[selectedCategory]];

    displayName.textContent = userName;
    displayAge.textContent = `${userAge} tahun`;

    // Show/hide timer based on setting
    if (timerEnabled) {
        timerDisplay.style.display = 'flex';
    }

    switchScreen(welcomeScreen, quizScreen);
    loadQuestion();
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Load Question
function loadQuestion() {
    resetQuestionState();

    const currentQuestion = currentQuizData[currentQuestionIndex];

    questionNum.textContent = currentQuestionIndex + 1;
    currentQuestionEl.textContent = currentQuestionIndex + 1;
    questionText.textContent = currentQuestion.question;

    // Update progress bar
    const progress = ((currentQuestionIndex + 1) / currentQuizData.length) * 100;
    progressFill.style.width = `${progress}%`;

    // Shuffle answers to randomize positions
    const shuffledAnswers = shuffleArray(currentQuestion.answers);

    // Display answers
    shuffledAnswers.forEach((answer, index) => {
        const answerOption = document.createElement('div');
        answerOption.classList.add('answer-option');
        answerOption.dataset.index = index;

        const answerLetter = document.createElement('div');
        answerLetter.classList.add('answer-letter');
        answerLetter.textContent = String.fromCharCode(65 + index); // A, B, C, D

        const answerText = document.createElement('div');
        answerText.classList.add('answer-text');
        answerText.textContent = answer.text;

        answerOption.appendChild(answerLetter);
        answerOption.appendChild(answerText);

        answerOption.addEventListener('click', () => selectAnswer(answer, answerOption));

        answersContainer.appendChild(answerOption);
    });

    // Start timer if enabled
    if (timerEnabled) {
        startTimer();
    }

    // Track question start time for speed bonus
    questionStartTime = Date.now();
}

// Timer
function startTimer() {
    timeLeft = difficultySettings[selectedDifficulty].time;
    timeLeftEl.textContent = timeLeft;
    timerDisplay.classList.remove('warning');

    timerInterval = setInterval(() => {
        timeLeft--;
        timeLeftEl.textContent = timeLeft;

        if (timeLeft <= 3) {
            timerDisplay.classList.add('warning');
            playSound('tick');
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            // Auto select wrong answer (timeout)
            handleTimeout();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function handleTimeout() {
    wrongAnswersCount++;
    streak = 0;
    streakDisplay.style.display = 'none';

    const pointsLost = difficultySettings[selectedDifficulty].pointsWrong;
    score = Math.max(0, score + pointsLost);
    currentScoreEl.textContent = score;

    // Show correct answer
    const allAnswers = document.querySelectorAll('.answer-option');
    allAnswers.forEach((option, index) => {
        option.classList.add('disabled');
        if (currentQuizData[currentQuestionIndex].answers[index].correct) {
            option.classList.add('correct');
        }
    });

    playSound('wrong');
    nextBtn.style.display = 'inline-flex';
}

// Show Speed Bonus Notification
function showSpeedBonus() {
    const speedBonusEl = document.createElement('div');
    speedBonusEl.className = 'speed-bonus-notification';
    speedBonusEl.innerHTML = '⚡ +5 Speed Bonus!';

    document.querySelector('.question-card').appendChild(speedBonusEl);

    setTimeout(() => {
        speedBonusEl.remove();
    }, 2000);
}

// Select Answer
function selectAnswer(answer, selectedElement) {
    stopTimer();

    // Disable all answer options
    const allAnswers = document.querySelectorAll('.answer-option');
    allAnswers.forEach(option => option.classList.add('disabled'));

    if (answer.correct) {
        selectedElement.classList.add('correct');
        const points = difficultySettings[selectedDifficulty].pointsCorrect;
        score += points;
        correctAnswersCount++;
        streak++;
        maxStreak = Math.max(maxStreak, streak);

        // Calculate response time for speed bonus
        const responseTime = (Date.now() - questionStartTime) / 1000; // in seconds
        const speedBonusThreshold = 3; // 3 seconds

        if (responseTime < speedBonusThreshold) {
            const speedBonus = 5;
            score += speedBonus;
            totalSpeedBonuses++;

            // Show speed bonus notification
            showSpeedBonus();
        }

        // Show streak
        if (streak >= 2) {
            streakDisplay.style.display = 'inline-flex';
            streakCount.textContent = streak;
        }

        currentScoreEl.textContent = score;
        playSound('correct');
    } else {
        selectedElement.classList.add('wrong');
        const pointsLost = difficultySettings[selectedDifficulty].pointsWrong;
        score = Math.max(0, score + pointsLost);
        wrongAnswersCount++;
        streak = 0;
        streakDisplay.style.display = 'none';

        currentScoreEl.textContent = score;
        playSound('wrong');

        // Show correct answer
        allAnswers.forEach((option, index) => {
            if (currentQuizData[currentQuestionIndex].answers[index].correct) {
                option.classList.add('correct');
            }
        });
    }

    // Show next button
    nextBtn.style.display = 'inline-flex';
}

// Lifeline: 50:50
function useFiftyFifty() {
    if (fiftyFiftyUsed) return;

    fiftyFiftyUsed = true;
    fiftyFiftyBtn.disabled = true;

    // Get all answer options currently displayed
    const allAnswers = document.querySelectorAll('.answer-option');
    const wrongAnswerIndices = [];

    // Find which displayed answers are wrong
    allAnswers.forEach((option, index) => {
        const answerText = option.querySelector('.answer-text').textContent;
        const currentQuestion = currentQuizData[currentQuestionIndex];

        // Check if this answer is wrong
        const answerObj = currentQuestion.answers.find(a => a.text === answerText);
        if (answerObj && !answerObj.correct) {
            wrongAnswerIndices.push(index);
        }
    });

    // Randomly select 2 wrong answers to remove
    const toRemove = wrongAnswerIndices.sort(() => 0.5 - Math.random()).slice(0, 2);

    toRemove.forEach(index => {
        allAnswers[index].style.opacity = '0.3';
        allAnswers[index].style.pointerEvents = 'none';
    });
}

// Lifeline: Skip
function useSkip() {
    if (skipUsed) return;

    skipUsed = true;
    skipBtn.disabled = true;
    stopTimer();

    // Move to next question without penalty
    loadNextQuestion();
}

// Load Next Question
function loadNextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex < currentQuizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

// Reset Question State
function resetQuestionState() {
    nextBtn.style.display = 'none';
    answersContainer.innerHTML = '';
    stopTimer();
}

// Show Results
function showResults() {
    switchScreen(quizScreen, resultScreen);

    correctAnswersEl.textContent = correctAnswersCount;
    wrongAnswersEl.textContent = wrongAnswersCount;
    finalScoreEl.textContent = score;

    // Check for high score
    const highScoreKey = `highScore_${selectedCategory}_${selectedDifficulty}`;
    const currentHighScore = parseInt(localStorage.getItem(highScoreKey) || 0);

    if (score > currentHighScore) {
        localStorage.setItem(highScoreKey, score);
        highScoreDisplay.style.display = 'block';
    }

    // Check achievements
    const stats = {
        correct: correctAnswersCount,
        wrong: wrongAnswersCount,
        score: score,
        maxStreak: maxStreak,
        avgTime: 5 // Simplified
    };

    const earnedAchievements = achievements.filter(ach => ach.condition(stats));

    if (earnedAchievements.length > 0) {
        achievementsDisplay.style.display = 'block';
        achievementsList.innerHTML = '';

        earnedAchievements.forEach(achievement => {
            const badge = document.createElement('div');
            badge.classList.add('achievement-badge');
            badge.innerHTML = `
                <div class="badge-icon">${achievement.icon}</div>
                <div class="badge-name">${achievement.name}</div>
            `;
            achievementsList.appendChild(badge);
        });
    }

    // Determine result message based on score
    const percentage = (correctAnswersCount / currentQuizData.length) * 100;

    if (percentage >= 80) {
        resultTitle.textContent = 'Luar Biasa! 🎉';
        resultMessage.textContent = `Selamat ${userName}! Anda memiliki pengetahuan yang sangat baik!`;
        resultIcon.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    } else if (percentage >= 60) {
        resultTitle.textContent = 'Bagus Sekali! 👏';
        resultMessage.textContent = `Hebat ${userName}! Pengetahuan Anda cukup baik, terus belajar ya!`;
        resultIcon.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else if (percentage >= 40) {
        resultTitle.textContent = 'Cukup Baik! 💪';
        resultMessage.textContent = `Tidak buruk ${userName}! Masih ada ruang untuk belajar lebih banyak.`;
        resultIcon.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    } else {
        resultTitle.textContent = 'Tetap Semangat! 🌟';
        resultMessage.textContent = `Jangan menyerah ${userName}! Mari belajar lebih banyak.`;
        resultIcon.style.background = 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
    }

    // Enable share button
    shareScoreBtn.onclick = shareScore;
}

// Reset Quiz
function resetQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    correctAnswersCount = 0;
    wrongAnswersCount = 0;
    streak = 0;
    maxStreak = 0;
    fiftyFiftyUsed = false;
    skipUsed = false;
    totalSpeedBonuses = 0;
    currentScoreEl.textContent = score;

    fiftyFiftyBtn.disabled = false;
    skipBtn.disabled = false;
    streakDisplay.style.display = 'none';
    highScoreDisplay.style.display = 'none';
    achievementsDisplay.style.display = 'none';

    switchScreen(resultScreen, welcomeScreen);

    // Reset form
    userForm.reset();
}

// Switch Screen
function switchScreen(fromScreen, toScreen) {
    fromScreen.classList.remove('active');
    toScreen.classList.add('active');
}

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    // Press Enter to go to next question when button is visible
    if (e.key === 'Enter' && nextBtn.style.display !== 'none') {
        loadNextQuestion();
    }

    // Press 1-4 or A-D to select answer
    if (currentQuestionIndex < currentQuizData.length && quizScreen.classList.contains('active')) {
        const answerOptions = document.querySelectorAll('.answer-option:not(.disabled)');

        if (e.key >= '1' && e.key <= '4') {
            const index = parseInt(e.key) - 1;
            if (answerOptions[index]) {
                answerOptions[index].click();
            }
        } else if (e.key.toLowerCase() >= 'a' && e.key.toLowerCase() <= 'd') {
            const index = e.key.toLowerCase().charCodeAt(0) - 97;
            if (answerOptions[index]) {
                answerOptions[index].click();
            }
        }
    }
});

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Prevent form resubmission on page refresh
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}

// ==================== LEADERBOARD FUNCTIONALITY ====================

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

// Event Listeners for Leaderboard
viewLeaderboardBtn.addEventListener('click', showLeaderboard);
backToWelcomeBtn.addEventListener('click', () => {
    switchScreen(leaderboardScreen, resultScreen);
});
leaderboardCategoryFilter.addEventListener('change', loadLeaderboard);

// Save score to leaderboard
function saveToLeaderboard() {
    const leaderboardData = JSON.parse(localStorage.getItem('leaderboard') || '[]');

    const newEntry = {
        name: userName,
        score: score,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        correct: correctAnswersCount,
        wrong: wrongAnswersCount,
        date: new Date().toISOString()
    };

    leaderboardData.push(newEntry);

    // Sort by score (highest first)
    leaderboardData.sort((a, b) => b.score - a.score);

    // Keep only top 100 entries
    const trimmedData = leaderboardData.slice(0, 100);

    localStorage.setItem('leaderboard', JSON.stringify(trimmedData));
}

// Show leaderboard screen
function showLeaderboard() {
    switchScreen(resultScreen, leaderboardScreen);
    loadLeaderboard();
}

// Load and display leaderboard
function loadLeaderboard() {
    const leaderboardData = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    const selectedFilter = leaderboardCategoryFilter.value;

    // Filter by category if not "all"
    let filteredData = leaderboardData;
    if (selectedFilter !== 'all') {
        filteredData = leaderboardData.filter(entry => entry.category === selectedFilter);
    }

    // Take top 10
    const top10 = filteredData.slice(0, 10);

    // Clear list
    leaderboardList.innerHTML = '';

    if (top10.length === 0) {
        leaderboardList.innerHTML = `
            <div class="leaderboard-empty">
                <div class="leaderboard-empty-icon">🏆</div>
                <p>Belum ada data leaderboard.</p>
                <p>Mainkan quiz untuk menjadi yang pertama!</p>
            </div>
        `;
        return;
    }

    // Display leaderboard items
    top10.forEach((entry, index) => {
        const rank = index + 1;
        const item = document.createElement('div');
        item.classList.add('leaderboard-item');

        // Add special class for top 3
        if (rank <= 3) {
            item.classList.add(`rank-${rank}`);
        }

        // Format date
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        item.innerHTML = `
            <div class="rank-badge">${rank}</div>
            <div class="player-info">
                <div class="player-name">${entry.name}</div>
                <div class="player-details">
                    <span class="player-category">${categoryNames[entry.category] || entry.category}</span>
                    <span class="player-difficulty">⭐ ${difficultyNames[entry.difficulty] || entry.difficulty}</span>
                    <span class="player-date">📅 ${dateStr}</span>
                </div>
            </div>
            <div class="player-score">${entry.score}</div>
        `;

        leaderboardList.appendChild(item);
    });
}

// Update showResults to save to leaderboard
const originalShowResults = showResults;
showResults = function () {
    originalShowResults();

    // Save to leaderboard
    saveToLeaderboard();
};

