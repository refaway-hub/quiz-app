export default class Quiz {
  constructor(category, difficulty, numberOfQuestions, playerName) {
    this.category = category;
    this.difficulty = difficulty;
    this.numberOfQuestions = parseInt(numberOfQuestions) || 10;
    this.playerName = playerName || 'Player';
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  // Build API URL using URLSearchParams
  buildApiUrl() {
    const baseUrl = 'https://opentdb.com/api.php';
    const params = new URLSearchParams();

    params.append('amount', this.numberOfQuestions);

    if (this.category) {
      params.append('category', this.category);
    }

    if (this.difficulty) {
      params.append('difficulty', this.difficulty);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  // Fetch questions from API
  async getQuestions() {
    const url = this.buildApiUrl();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.response_code !== 0 || !data.results || data.results.length === 0) {
      throw new Error('Failed to load questions. Please try different parameters.');
    }

    this.questions = data.results;
    return this.questions;
  }

  // Score management
  incrementScore() {
    this.score++;
  }

  getCurrentQuestion() {
    if (this.currentQuestionIndex < 0 || this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    return this.questions[this.currentQuestionIndex];
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    return !this.isComplete();
  }

  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getScorePercentage() {
    if (this.numberOfQuestions === 0) return 0;
    return Math.round((this.score / this.numberOfQuestions) * 100);
  }

  // High scores & LocalStorage
  getHighScores() {
    try {
      const scores = localStorage.getItem('quizHighScores');
      return scores ? JSON.parse(scores) : [];
    } catch (e) {
      console.error('Error reading high scores:', e);
      return [];
    }
  }

  isHighScore() {
    const highScores = this.getHighScores();
    const percentage = this.getScorePercentage();

    if (highScores.length < 10) return true;

    const lowestScore = highScores[highScores.length - 1].percentage;
    return percentage > lowestScore;
  }

  saveHighScore() {
    const highScores = this.getHighScores();
    const percentage = this.getScorePercentage();

    const newScore = {
      name: this.playerName,
      score: this.score,
      total: this.numberOfQuestions,
      percentage: percentage,
      difficulty: this.difficulty,
      date: new Date().toLocaleDateString()
    };

    highScores.push(newScore);
    highScores.sort((a, b) => b.percentage - a.percentage);

    const top10 = highScores.slice(0, 10);
    localStorage.setItem('quizHighScores', JSON.stringify(top10));

    return top10;
  }

  // Render results screen
  endQuiz(container) {
    const percentage = this.getScorePercentage();
    const qualifies = this.isHighScore();

    if (qualifies) {
      this.saveHighScore();
    }

    const highScores = this.getHighScores();
    const ranks = ['gold', 'silver', 'bronze'];

    const leaderboardHTML = highScores
      .slice(0, 5)
      .map(
        (item, idx) => `
        <li class="leaderboard-item ${ranks[idx] || ''}">
          <span class="leaderboard-rank">#${idx + 1}</span>
          <span class="leaderboard-name">${item.name}</span>
          <span class="leaderboard-score">${item.percentage}%</span>
        </li>
      `
      )
      .join('');

    const html = `
      <div class="game-card results-card">
        <h2 class="results-title">Quiz Complete!</h2>
        <p class="results-score-display">${this.score}/${this.numberOfQuestions}</p>
        <p class="results-percentage">${percentage}% Accuracy</p>
        
        ${
          qualifies
            ? `<div class="new-record-badge">
                <i class="fa-solid fa-star"></i> New High Score!
               </div>`
            : ''
        }

        <div class="leaderboard">
          <h4 class="leaderboard-title">
            <i class="fa-solid fa-trophy"></i> Leaderboard
          </h4>
          <ul class="leaderboard-list">
            ${leaderboardHTML}
          </ul>
        </div>
        
        <div class="action-buttons">
          <button class="btn-restart" id="playAgainBtn">
            <i class="fa-solid fa-rotate-right"></i> Play Again
          </button>
        </div>
      </div>
    `;

    if (container) {
      container.innerHTML = html;
      const playAgainBtn = document.getElementById('playAgainBtn');
      if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
          location.reload();
        });
      }
    }

    return html;
  }
}