let vocabulary = [];
let learnedWords = [];
let selectedLists = [];

function loadVocabulary() {
    const storedVocabulary = localStorage.getItem('vocabulary');
    if (storedVocabulary) {
        vocabulary = JSON.parse(storedVocabulary);
    } else {
        vocabulary = [
            { title: "Fruits", words: [{english: "apple", french: "pomme"}, {english: "banana", french: "banane"}] },
            { title: "Animaux", words: [{english: "dog", french: "chien"}, {english: "cat", french: "chat"}] },
            { title: "Objets", words: [{english: "house", french: "maison"}, {english: "car", french: "voiture"}] },
            { title: "Nature", words: [{english: "tree", french: "arbre"}, {english: "flower", french: "fleur"}] }
        ];
    }
}

function loadLearnedWords() {
    const storedLearnedWords = localStorage.getItem('learnedWords');
    if (storedLearnedWords) {
        learnedWords = JSON.parse(storedLearnedWords);
    }
}

function saveVocabulary(newVocabulary) {
    vocabulary = newVocabulary;
    localStorage.setItem('vocabulary', JSON.stringify(vocabulary));
}

function saveLearnedWords() {
    localStorage.setItem('learnedWords', JSON.stringify(learnedWords));
}

function getFilteredVocabulary() {
    // Ici, vocabulary est déjà un tableau de mots plats
    return vocabulary.filter(word => !learnedWords.find(learnedWord => learnedWord.english === word.english));
}

function getRandomWord() {
    const filteredVocabulary = getFilteredVocabulary();
    if (filteredVocabulary.length === 0) {
        document.getElementById('word').innerText = "Tous les mots ont été appris!";
        document.getElementById('result').innerText = "";
        document.getElementById('translation').style.display = "none";
        document.getElementById('validate-button').style.display = "none";
        document.getElementById('next-button').style.display = "none";
        return;
    }
    const currentWord = filteredVocabulary[Math.floor(Math.random() * filteredVocabulary.length)];
    // On stocke le mot courant pour la validation
    window.currentWord = currentWord;
    document.getElementById('word').innerText = currentWord.french;
    document.getElementById('result').innerText = "";
    document.getElementById('translation').value = "";
    document.getElementById('translation').style.display = "block";
    document.getElementById('validate-button').style.display = "block";
    document.getElementById('next-button').style.display = "none";
}

function validateTranslation() {
    const userTranslation = document.getElementById('translation').value.trim().toLowerCase();
    const currentWord = window.currentWord;
    if (!currentWord) return;
    const correctTranslation = currentWord.english;
    const resultElement = document.getElementById('result');

    if (userTranslation === correctTranslation.toLowerCase()) {
        resultElement.innerHTML = `<span style='color: green;'>Correct</span> 
                                   <button id="speak-button">🔊</button>`;
        if (!learnedWords.find(word => word.english === currentWord.english)) {
            learnedWords.push(currentWord);
            saveLearnedWords();
        }
        document.getElementById('speak-button').addEventListener('click', () => speakWord(correctTranslation));
    } else {
        resultElement.innerHTML = `<span style='color: red;'>Faux</span> - <span style='color: green;'>${correctTranslation}</span>
                                   <button id="speak-button">🔊</button>`;
        document.getElementById('speak-button').addEventListener('click', () => speakWord(correctTranslation));
    }
    document.getElementById('validate-button').style.display = "none";
    document.getElementById('next-button').style.display = "block";
}

function speakWord(word) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

function loadVocabularyLists() {
    const stored = localStorage.getItem('vocabularyLists');
    if (stored) {
        return JSON.parse(stored);
    }
    return [];
}

function saveVocabularyLists(lists) {
    localStorage.setItem('vocabularyLists', JSON.stringify(lists));
}

function handleVocabInput() {
    const title = document.getElementById('vocab-title').value.trim();
    const vocabInput = document.getElementById('vocab-input').value.trim();
    if (!title || !vocabInput) {
        alert("Veuillez entrer un titre et du vocabulaire.");
        return;
    }
    const lines = vocabInput.split('\n');
    const words = lines.map(line => {
        const [english, french] = line.split('=').map(word => word.trim());
        return {english, french};
    }).filter(w => w.english && w.french);

    let lists = loadVocabularyLists();
    lists.push({ title, words });
    saveVocabularyLists(lists);

    document.getElementById('vocab-title').value = '';
    document.getElementById('vocab-input').value = '';
    alert("Liste enregistrée !");
}

function displayLearnedWords() {
    const learnedWordsList = document.getElementById('learned-words');
    learnedWordsList.innerHTML = learnedWords.map(word => `<li>${word.english} = ${word.french}</li>`).join('');
    document.getElementById('learned-count').innerText = `Nombre de mots appris : ${learnedWords.length}`;
}

function clearLearnedWords() {
    learnedWords = [];
    saveLearnedWords();
    displayLearnedWords();
}

function renderListSelection() {
    const lists = loadVocabularyLists();
    const container = document.getElementById('list-selection');
    if (!container) return;
    if (lists.length === 0) {
        container.innerHTML = "<em>Aucune liste enregistrée.</em>";
        return;
    }
    container.innerHTML = "<strong>Choisissez les listes à travailler :</strong><br>";
    lists.forEach((list, idx) => {
        container.innerHTML += `
            <label>
                <input type="checkbox" class="list-checkbox" value="${idx}" checked>
                ${list.title}
            </label><br>
        `;
    });
}

function getSelectedVocabulary() {
    const lists = loadVocabularyLists();
    const checked = Array.from(document.querySelectorAll('.list-checkbox:checked')).map(cb => parseInt(cb.value));
    let words = [];
    checked.forEach(idx => {
        if (lists[idx]) words = words.concat(lists[idx].words);
    });
    return words;
}

// Remplace loadVocabulary et getFilteredVocabulary :
function loadVocabulary() {
    vocabulary = getSelectedVocabulary();
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('define-vocab-button')) {
        document.getElementById('define-vocab-button').addEventListener('click', () => {
            window.location.href = 'define.html';
        });
    }
    if (document.getElementById('define-vocab-button2')) {
        document.getElementById('define-vocab-button2').addEventListener('click', () => {
            window.location.href = 'define.html';
        });
    }

    if (document.getElementById('learn-vocab-button')) {
        document.getElementById('learn-vocab-button').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    if (document.getElementById('learned-words-button')) {
        document.getElementById('learned-words-button').addEventListener('click', () => {
            window.location.href = 'learned.html';
        });
    }

    if (document.getElementById('save-vocab-button')) {
        document.getElementById('save-vocab-button').addEventListener('click', handleVocabInput);
    }

    if (document.getElementById('list-selection')) {
        renderListSelection();
        // Charger le vocabulaire et un mot APRES avoir affiché les cases à cocher
        loadVocabulary();
        loadLearnedWords();
        getRandomWord();

        document.getElementById('list-selection').addEventListener('change', () => {
            loadVocabulary();
            getRandomWord();
        });
    }

    if (document.getElementById('validate-button')) {
        document.getElementById('validate-button').addEventListener('click', validateTranslation);
        document.getElementById('next-button').addEventListener('click', getRandomWord);

        document.getElementById('translation').addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                if (document.getElementById('validate-button').style.display === 'block') {
                    validateTranslation();
                } else {
                    getRandomWord();
                }
            }
        });
    }

    if (document.getElementById('learned-words')) {
        loadLearnedWords();
        displayLearnedWords();
    }

    if (document.getElementById('clear-learned-words-button')) {
        document.getElementById('clear-learned-words-button').addEventListener('click', clearLearnedWords);
    }
});
