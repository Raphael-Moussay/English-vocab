let vocabulary = [];
let learnedWords = [];

function loadVocabulary() {
    const storedVocabulary = localStorage.getItem('vocabulary');
    if (storedVocabulary) {
        vocabulary = JSON.parse(storedVocabulary);
    } else {
        vocabulary = [
            {english: "apple", french: "pomme"},
            {english: "dog", french: "chien"},
            {english: "house", french: "maison"},
            {english: "car", french: "voiture"},
            {english: "tree", french: "arbre"}
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
    document.getElementById('word').innerText = currentWord.french;
    document.getElementById('result').innerText = "";
    document.getElementById('translation').value = "";
    document.getElementById('translation').style.display = "block";
    document.getElementById('validate-button').style.display = "block";
    document.getElementById('next-button').style.display = "none";
}

function validateTranslation() {
    const userTranslation = document.getElementById('translation').value.trim().toLowerCase();
    const wordElement = document.getElementById('word').innerText;
    const currentWord = vocabulary.find(word => word.french === wordElement);
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

function handleVocabInput() {
    const vocabInput = document.getElementById('vocab-input').value.trim();
    const lines = vocabInput.split('\n');
    const newVocabulary = lines.map(line => {
        const [english, french] = line.split('=').map(word => word.trim());
        return {english, french};
    });
    saveVocabulary(newVocabulary);
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

    if (document.getElementById('validate-button')) {
        loadVocabulary();
        loadLearnedWords();
        getRandomWord();
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
