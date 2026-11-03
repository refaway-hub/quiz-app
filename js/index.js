
import Quiz from './quiz.js';
import Question from './question.js';

// DOM Elements
const quizOptionsForm = document.getElementById('quizOptions');
const playerNameInput = document.getElementById('playerName');
const categoryInput = document.getElementById('categoryMenu');
const difficultyOptions = document.getElementById('difficultyOptions');
const questionsNumber = document.getElementById('questionsNumber');
const startQuizBtn = document.getElementById('startQuiz');
const questionsContainer = document.getElementById('questionsContainer');

let currentQuiz = null;

// UI State Functions
function showLoading() {
  questionsContainer.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>
  `;
}

function hideLoading() {
  const overlay = questionsContainer.querySelector('.loading-overlay');
  if (overlay) overlay.remove();
}

function showError(message) {
  questionsContainer.innerHTML = `
    <div class="game-card error-card">
      <div class="error-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message">${message}</p>
      <button class="btn-play retry-btn" id="retryBtn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>
  `;

  document.getElementById('retryBtn').addEventListener('click', resetToStart);
}

// Validation & Form Errors
function validateForm() {
  const val = parseInt(questionsNumber.value);

  if (!questionsNumber.value || isNaN(val)) {
    return { isValid: false, error: 'Please enter the number of questions.' };
  }
  if (val < 1) {
    return { isValid: false, error: 'Minimum number of questions is 1.' };
  }
  if (val > 50) {
    return { isValid: false, error: 'Maximum number of questions is 50.' };
  }

  return { isValid: true, error: null };
}

function showFormError(message) {
  const existingError = quizOptionsForm.querySelector('.form-error');
  if (existingError) existingError.remove();

  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error';
  errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;

  quizOptionsForm.insertBefore(errorDiv, startQuizBtn);

  setTimeout(() => {
    errorDiv.style.opacity = '0';
    setTimeout(() => errorDiv.remove(), 300);
  }, 3000);
}

function resetToStart() {
  questionsContainer.innerHTML = '';
  quizOptionsForm.classList.remove('hidden');
  currentQuiz = null;
}

// Start Game Handler
async function startQuiz() {
  const validation = validateForm();
  if (!validation.isValid) {
    showFormError(validation.error);
    return;
  }

  const playerName = playerNameInput.value.trim() || 'Player';
  const category = categoryInput.value;
  const difficulty = difficultyOptions.value;
  const numQuestions = parseInt(questionsNumber.value);

  currentQuiz = new Quiz(category, difficulty, numQuestions, playerName);

  quizOptionsForm.classList.add('hidden');
  showLoading();

  try {
    await currentQuiz.getQuestions();
    hideLoading();

    const firstQuestion = new Question(currentQuiz, questionsContainer, resetToStart);
    firstQuestion.displayQuestion();
  } catch (err) {
    hideLoading();
    showError(err.message || 'Failed to load questions. Please try again.');
  }
}

// Event Listeners
startQuizBtn.addEventListener('click', startQuiz);

questionsNumber.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    startQuiz();
  }
});