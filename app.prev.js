let vocab = [];
let currentIndex = 0;
let correctAnswers = 0;
let streak = 0;
let maxStreak = 0;
let currentLanguage = "en";
let currentDataset = "vocabulary";

const wordEl = document.getElementById("word");
const sentenceEl = document.getElementById("sentenceContainer");
const choicesEl = document.querySelector(".choices");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("next");
const achievementEl = document.getElementById("achievement");
const languageSelector = document.getElementById("languageSelector");
const datasetSelector = document.getElementById("datasetSelector");

// Stats elements
const currentWordEl = document.getElementById("currentWord");
const totalWordsEl = document.getElementById("totalWords");
const correctCountEl = document.getElementById("correctCount");
const streakEl = document.getElementById("streak");
const progressFillEl = document.getElementById("progressFill");

// Dataset URLs
const datasets = {
  vocabulary: "merged", // Special flag to indicate merged dataset
  grammar:
    "https://raw.githubusercontent.com/jayeshthk/dtz_b1_spiel/refs/heads/main/data/deutsch_artikel.json",
};

// Individual dataset URLs for merging
const vocabularyDatasets = {
  vocabulary_1:
    "https://raw.githubusercontent.com/jayeshthk/dtz_b1_spiel/refs/heads/main/data/deutsch_ubung.json",
  vocabulary_2:
    "https://raw.githubusercontent.com/jayeshthk/dtz_b1_spiel/refs/heads/main/data/deu_eng.json",
};
function normalizeVocabularyItem(item, source) {
  if (source === "vocabulary_1") {
    // vocabulary_1 structure: {word, correct, correct_ru, correct_ar, options, options_ru, options_ar, sentence}
    return {
      word: item.word,
      correct: item.correct,
      correct_ru: item.correct_ru,
      correct_ar: item.correct_ar,
      options: item.options,
      options_ru: item.options_ru,
      options_ar: item.options_ar,
      sentence: item.sentence,
      source: "vocabulary_1",
    };
  } else if (source === "vocabulary_2") {
    // vocabulary_2 structure: {word, correct, options} - only English
    return {
      word: item.word,
      correct: item.correct,
      correct_ru: item.correct, // Fallback to English if no Russian
      correct_ar: item.correct, // Fallback to English if no Arabic
      options: item.options,
      options_ru: item.options, // Fallback to English options
      options_ar: item.options, // Fallback to English options
      sentence: item.sentence || null,
      source: "vocabulary_2",
    };
  }
  return item;
}
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function updateStats() {
  currentWordEl.textContent = currentIndex + 1;
  totalWordsEl.textContent = vocab.length;
  correctCountEl.textContent = correctAnswers;
  streakEl.textContent = `🔥 ${streak}`;

  const progress = ((currentIndex + 1) / vocab.length) * 100;
  progressFillEl.style.width = `${progress}%`;
}

function showAchievement(text) {
  achievementEl.textContent = text;
  achievementEl.classList.add("show");
  setTimeout(() => {
    achievementEl.classList.remove("show");
  }, 3000);
}

function checkAchievements() {
  if (streak === 5) {
    showAchievement("🔥 5er-Serie! Du bist auf Feuer!");
  } else if (streak === 10) {
    showAchievement("⚡ 10er-Serie! Unglaublich!");
  } else if (streak === 20) {
    showAchievement("🚀 20er-Serie! Du bist ein Vokabel-Meister!");
  }

  if (correctAnswers === 10) {
    showAchievement("🎯 10 richtige Antworten erreicht!");
  } else if (correctAnswers === 25) {
    showAchievement("🌟 25 richtige Antworten! Fantastisch!");
  }
}

function showWord() {
  if (currentIndex >= vocab.length) return;

  feedbackEl.textContent = "";
  feedbackEl.className = "";
  nextBtn.style.display = "none";

  const item = vocab[currentIndex];

  if (currentDataset === "vocabulary") {
    // Structure 1: Vocabulary
    wordEl.textContent = item.word;

    // Show sentence if available
    if (item.sentence) {
      sentenceEl.textContent = `Beispiel: ${item.sentence}`;
      sentenceEl.style.display = "block";
    } else {
      sentenceEl.style.display = "none";
    }

    // Get correct answer and options based on language
    let correctAnswer, options;

    switch (currentLanguage) {
      case "ru":
        correctAnswer = item.correct_ru;
        options = item.options_ru || item.options;
        break;
      case "ar":
        correctAnswer = item.correct_ar;
        options = item.options_ar || item.options;
        break;
      default:
        correctAnswer = item.correct;
        options = item.options;
        break;
    }

    item.currentCorrect = correctAnswer;

    choicesEl.innerHTML = "";
    shuffle([...options]).forEach((option) => {
      const btn = document.createElement("button");
      btn.textContent = option;
      btn.onclick = () => selectAnswer(btn, option === correctAnswer);
      choicesEl.appendChild(btn);
    });
  } else {
    // Structure 2: Grammar
    wordEl.textContent = item.word;

    // Show sentence with blank
    if (item.sentence) {
      sentenceEl.innerHTML = item.sentence.replace(
        /___ /g,
        '<strong style="color: #667eea;">___ </strong>'
      );
      sentenceEl.style.display = "block";
    } else {
      sentenceEl.style.display = "none";
    }

    item.currentCorrect = item.true;

    choicesEl.innerHTML = "";
    shuffle([...item.options]).forEach((option) => {
      const btn = document.createElement("button");
      btn.textContent = option;
      btn.onclick = () => selectAnswer(btn, option === item.true);
      choicesEl.appendChild(btn);
    });
  }

  wordEl.className = "";
  updateStats();
}

function selectAnswer(button, isCorrect) {
  const buttons = document.querySelectorAll(".choices button");
  buttons.forEach((btn) => (btn.disabled = true));

  if (isCorrect) {
    button.classList.add("correct");
    feedbackEl.textContent = "✅ Richtig!";
    feedbackEl.className = "feedback-correct";
    correctAnswers++;
    streak++;
    checkAchievements();
  } else {
    button.classList.add("incorrect");
    feedbackEl.textContent = `❌ Falsch! Richtige Antwort: ${vocab[currentIndex].currentCorrect}`;
    feedbackEl.className = "feedback-incorrect";
    streak = 0;
  }

  maxStreak = Math.max(maxStreak, streak);
  nextBtn.style.display = "inline-block";
  updateStats();
}

nextBtn.onclick = () => {
  currentIndex++;
  if (currentIndex < vocab.length) {
    showWord();
  } else {
    showCompletion();
  }
};

function showCompletion() {
  const accuracy = Math.round((correctAnswers / vocab.length) * 100);

  wordEl.innerHTML = `
        <div class="completion-card">
          <div class="completion-emoji">🎉</div>
          <h2>Herzlichen Glückwunsch!</h2>
          <p>Du hast alle ${vocab.length} Aufgaben geübt.</p>
          <p><strong>Genauigkeit: ${accuracy}%</strong></p>
          <p><strong>Längste Serie: ${maxStreak}</strong></p>
          <button onclick="restartGame()" style="margin-top: 20px; padding: 12px 24px; background: white; color: #667eea; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
            🔄 Nochmal spielen
          </button>
        </div>
      `;

  choicesEl.innerHTML = "";
  sentenceEl.style.display = "none";
  feedbackEl.textContent = "";
  nextBtn.style.display = "none";

  if (accuracy >= 90) {
    showAchievement("🏆 Perfekte Leistung! 90%+ Genauigkeit!");
  } else if (accuracy >= 75) {
    showAchievement("⭐ Großartige Arbeit! 75%+ Genauigkeit!");
  }
}

function restartGame() {
  currentIndex = 0;
  correctAnswers = 0;
  streak = 0;
  maxStreak = 0;
  vocab.sort(() => 0.5 - Math.random());
  showWord();
}
async function loadDatasetWithProgress() {
  wordEl.innerHTML =
    '<div class="loading"><div class="spinner"></div><p>Lade Vokabeln...</p></div>';
  choicesEl.innerHTML = "";
  sentenceEl.style.display = "none";
  feedbackEl.textContent = "";
  nextBtn.style.display = "none";

  try {
    if (currentDataset === "vocabulary") {
      // Show progress
      wordEl.innerHTML =
        '<div class="loading"><div class="spinner"></div><p>Lade Vokabeldatensätze (1/2)...</p></div>';

      const vocab1Response = await fetch(vocabularyDatasets.vocabulary_1);
      const vocab1Data = await vocab1Response.json();

      wordEl.innerHTML =
        '<div class="loading"><div class="spinner"></div><p>Lade Vokabeldatensätze (2/2)...</p></div>';

      const vocab2Response = await fetch(vocabularyDatasets.vocabulary_2);
      const vocab2Data = await vocab2Response.json();

      wordEl.innerHTML =
        '<div class="loading"><div class="spinner"></div><p>Zusammenführen der Daten...</p></div>';

      // Normalize and merge
      const normalizedVocab1 = vocab1Data.map((item) =>
        normalizeVocabularyItem(item, "vocabulary_1")
      );
      const normalizedVocab2 = vocab2Data.map((item) =>
        normalizeVocabularyItem(item, "vocabulary_2")
      );

      vocab = [...normalizedVocab1, ...normalizedVocab2];
      vocab.sort(() => 0.5 - Math.random());
    } else {
      const response = await fetch(datasets[currentDataset]);
      vocab = await response.json();
      vocab.sort(() => 0.5 - Math.random());
    }

    currentIndex = 0;
    correctAnswers = 0;
    streak = 0;
    maxStreak = 0;
    totalWordsEl.textContent = vocab.length;
    showWord();
  } catch (error) {
    wordEl.innerHTML = `
      <div style="color: #dc3545; text-align: center;">
        <h3>⚠️ Fehler beim Laden</h3>
        <p>Die Daten konnten nicht geladen werden.</p>
        <button onclick="loadDataset()" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
          🔄 Neu laden
        </button>
      </div>
    `;
    console.error("Fehler beim Laden:", error);
  }
}

async function loadDataset() {
  wordEl.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  choicesEl.innerHTML = "";
  sentenceEl.style.display = "none";
  feedbackEl.textContent = "";
  nextBtn.style.display = "none";

  try {
    if (currentDataset === "vocabulary") {
      // Load and merge both vocabulary datasets
      const [vocab1Response, vocab2Response] = await Promise.all([
        fetch(vocabularyDatasets.vocabulary_1),
        fetch(vocabularyDatasets.vocabulary_2),
      ]);

      const [vocab1Data, vocab2Data] = await Promise.all([
        vocab1Response.json(),
        vocab2Response.json(),
      ]);

      // Normalize and merge the datasets
      const normalizedVocab1 = vocab1Data.map((item) =>
        normalizeVocabularyItem(item, "vocabulary_1")
      );
      const normalizedVocab2 = vocab2Data.map((item) =>
        normalizeVocabularyItem(item, "vocabulary_2")
      );

      // Combine and shuffle
      vocab = [...normalizedVocab1, ...normalizedVocab2];
      vocab.sort(() => 0.5 - Math.random());
    } else {
      // Load grammar dataset normally
      const response = await fetch(datasets[currentDataset]);
      vocab = await response.json();
      vocab.sort(() => 0.5 - Math.random());
    }

    // Reset game state
    currentIndex = 0;
    correctAnswers = 0;
    streak = 0;
    maxStreak = 0;
    totalWordsEl.textContent = vocab.length;
    showWord();
  } catch (error) {
    wordEl.innerHTML = `
      <div style="color: #dc3545; text-align: center;">
        <h3>⚠️ Fehler beim Laden</h3>
        <p>Die Daten konnten nicht geladen werden.</p>
        <button onclick="loadDataset()" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
          🔄 Neu laden
        </button>
      </div>
    `;
    console.error("Fehler beim Laden:", error);
  }
}
// Event listeners
languageSelector.addEventListener("change", (e) => {
  currentLanguage = e.target.value;
  if (currentDataset === "vocabulary" && vocab.length > 0) {
    showWord(); // Refresh current word with new language
  }
});

datasetSelector.addEventListener("change", (e) => {
  currentDataset = e.target.value;
  loadDataset();
});

// Feedback form handler
document
  .getElementById("feedbackForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const feedbackText = document.getElementById("feedbackText").value.trim();
    const submitBtn = document.querySelector(".feedback-submit");

    if (!feedbackText) {
      alert("Bitte gib dein Feedback ein.");
      return;
    }

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = "Wird gesendet...";

    try {
      // Use FormData to avoid CORS issues
      const formData = new FormData();
      formData.append("feedback", feedbackText);
      formData.append("userAgent", navigator.userAgent);
      formData.append("url", window.location.href);

      // Replace 'YOUR_GOOGLE_APPS_SCRIPT_URL' with your actual script URL
      const response = await fetch("YOUR_GOOGLE_APPS_SCRIPT_URL", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.status === "success") {
        // Show success animation
        submitBtn.style.background =
          "linear-gradient(145deg, #28a745, #20c997)";
        submitBtn.textContent = "✅ Gesendet!";

        setTimeout(() => {
          alert("Vielen Dank für dein Feedback! 🙏");
          document.getElementById("feedbackText").value = "";
          submitBtn.style.background =
            "linear-gradient(145deg, #667eea, #764ba2)";
          submitBtn.textContent = "Feedback senden";
        }, 1000);
      } else {
        throw new Error(result.message || "Unbekannter Fehler");
      }
    } catch (error) {
      console.error("Feedback error:", error);

      // Try alternative method using URL parameters (GET request)
      try {
        const params = new URLSearchParams({
          feedback: feedbackText,
          userAgent: navigator.userAgent,
          url: window.location.href,
        });

        const fallbackResponse = await fetch(
          `https://script.google.com/macros/s/AKfycbyLGTvdPfhPggCc9jpYzcYtEfpWPj1QR_8u5Z1TGMDQikvUFAYR8RKai9DPlNLB76Jb/exec?${params.toString()}`
        );
        const fallbackResult = await fallbackResponse.json();

        if (fallbackResult.status === "success") {
          alert("Vielen Dank für dein Feedback! 🙏");
          document.getElementById("feedbackText").value = "";
        } else {
          throw new Error("Fallback failed");
        }
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        alert(
          "Fehler beim Senden des Feedbacks. Bitte versuche es später erneut."
        );
      }
    } finally {
      // Re-enable button
      submitBtn.disabled = false;
      if (submitBtn.textContent !== "✅ Gesendet!") {
        submitBtn.textContent = "Feedback senden";
      }
    }
  });

// Initialize the app
loadDataset();
