export default class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;

    this.questionData = quiz.getCurrentQuestion();
    this.index = quiz.currentQuestionIndex;

    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(this.questionData.correct_answer);
    this.category = this.decodeHtml(this.questionData.category);

    this.wrongAnswers = this.questionData.incorrect_answers.map((ans) =>
      this.decodeHtml(ans)
    );

    this.allAnswers = this.shuffleAnswers();

    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = 15;
    this.keyHandler = null;
  }

  // Decode HTML entities
  decodeHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.documentElement.textContent;
  }

  // Shuffle answers using Fisher-Yates algorithm
  shuffleAnswers() {
    const array = [...this.wrongAnswers, this.correctAnswer];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Get progress percentage
  getProgress() {
    return Math.round(((this.index + 1) / this.quiz.numberOfQuestions) * 100);
  }

  // Render question card
  displayQuestion() {
    const answersHTML = this.allAnswers
      .map(
        (ans, idx) => `
        <button class="answer-btn" data-answer="${ans}">
          <span class="answer-key">${idx + 1}</span>
          <span class="answer-text">${ans}</span>
        </button>
      `
      )
      .join('');

    const html = `
      <div class="game-card question-card">
        <div class="xp-bar-container">
          <div class="xp-bar-header">
            <span class="xp-label"><i class="fa-solid fa-bolt"></i> Progress</span>
            <span class="xp-value">Question ${this.index + 1}/${this.quiz.numberOfQuestions}</span>
          </div>
          <div class="xp-bar">
            <div class="xp-bar-fill" style="width: ${this.getProgress()}%"></div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-badge category">
            <i class="fa-solid fa-bookmark"></i>
            <span>${this.category}</span>
          </div>
          <div class="stat-badge difficulty ${this.questionData.difficulty}">
            <i class="fa-solid fa-gauge-high"></i>
            <span>${this.questionData.difficulty}</span>
          </div>
          <div class="stat-badge timer" id="timerBadge">
            <i class="fa-solid fa-stopwatch"></i>
            <span class="timer-value" id="timerDisplay">${this.timeRemaining}</span>s
          </div>
          <div class="stat-badge counter">
            <i class="fa-solid fa-gamepad"></i>
            <span>${this.index + 1}/${this.quiz.numberOfQuestions}</span>
          </div>
        </div>

        <h2 class="question-text">${this.question}</h2>

        <div class="answers-grid">
          ${answersHTML}
        </div>

        <p class="keyboard-hint">
          <i class="fa-regular fa-keyboard"></i> Press 1-${this.allAnswers.length} to select
        </p>

        <div class="score-panel">
          <div class="score-item">
            <div class="score-item-label">Score</div>
            <div class="score-item-value">${this.quiz.score}</div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.addEventListeners();
    this.startTimer();
  }

  // Attach click and keyboard handlers
  addEventListeners() {
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.checkAnswer(e.currentTarget);
      });
    });

    this.keyHandler = (e) => {
      if (this.answered) return;
      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= this.allAnswers.length) {
        const targetBtn = buttons[keyNum - 1];
        if (targetBtn) {
          this.checkAnswer(targetBtn);
        }
      }
    };

    document.addEventListener('keydown', this.keyHandler);
  }

  // Clean up keyboard listeners
  removeEventListeners() {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
    }
  }

  // Countdown timer
  startTimer() {
    const timerDisplay = document.getElementById('timerDisplay');
    const timerBadge = document.getElementById('timerBadge');

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (timerDisplay) timerDisplay.textContent = this.timeRemaining;

      if (this.timeRemaining <= 5 && timerBadge) {
        timerBadge.classList.add('warning');
      }

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.handleTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  // Handle timeout
  handleTimeUp() {
    this.answered = true;
    this.removeEventListeners();

    const questionCard = document.querySelector('.question-card');
    const timeUpMsg = document.createElement('div');
    timeUpMsg.className = 'time-up-message';
    timeUpMsg.innerHTML = `<i class="fa-solid fa-clock"></i> TIME'S UP!`;
    if (questionCard) {
      questionCard.insertBefore(timeUpMsg, document.querySelector('.score-panel'));
    }

    this.highlightCorrectAnswer();
    this.animateQuestion(400);
  }

  // Check answer correctness
  checkAnswer(choiceElement) {
    if (this.answered) return;
    this.answered = true;
    this.stopTimer();
    this.removeEventListeners();

    const selectedAnswer = choiceElement.getAttribute('data-answer');
    const isCorrect =
      selectedAnswer.trim().toLowerCase() ===
      this.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      choiceElement.classList.add('correct');
      this.quiz.incrementScore();
    } else {
      choiceElement.classList.add('wrong');
      this.highlightCorrectAnswer();
    }

    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((btn) => {
      if (btn !== choiceElement) {
        btn.classList.add('disabled');
      }
    });

    this.animateQuestion(400);
  }

  // Highlight correct answer
  highlightCorrectAnswer() {
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((btn) => {
      const answerText = btn.getAttribute('data-answer');
      if (
        answerText.trim().toLowerCase() ===
        this.correctAnswer.trim().toLowerCase()
      ) {
        btn.classList.add('correct-reveal');
      }
    });
  }

  // Get next question or show end screen
  getNextQuestion() {
    const hasNext = this.quiz.nextQuestion();
    if (hasNext) {
      const nextQ = new Question(this.quiz, this.container, this.onQuizEnd);
      nextQ.displayQuestion();
    } else {
      this.quiz.endQuiz(this.container);
    }
  }

  // Transition animation
  animateQuestion(duration = 400) {
    setTimeout(() => {
      const questionCard = document.querySelector('.question-card');
      if (questionCard) {
        questionCard.classList.add('exit');
      }
      setTimeout(() => {
        this.getNextQuestion();
      }, duration);
    }, 1500);
  }
}