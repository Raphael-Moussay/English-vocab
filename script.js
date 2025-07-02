let vocabulary = [];
let learnedWords = [];

// Gestion des mots appris (toujours en local)
function loadLearnedWords() {
    const storedLearnedWords = localStorage.getItem('learnedWords');
    if (storedLearnedWords) {
        learnedWords = JSON.parse(storedLearnedWords);
    }
}
function saveLearnedWords() {
    localStorage.setItem('learnedWords', JSON.stringify(learnedWords));
}

// Filtrage des mots non appris
function getFilteredVocabulary() {
    return vocabulary.filter(word => !learnedWords.find(learnedWord => learnedWord.english === word.english));
}

// Affichage d'un mot à traduire
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
    window.currentWord = currentWord;
    document.getElementById('word').innerText = currentWord.french;
    document.getElementById('result').innerText = "";
    document.getElementById('translation').value = "";
    document.getElementById('translation').style.display = "block";
    document.getElementById('validate-button').style.display = "block";
    document.getElementById('next-button').style.display = "none";
}

// Validation de la traduction
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

// Prononciation
function speakWord(word) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

// Firestore : charger toutes les listes
async function loadVocabularyLists() {
    const snapshot = await db.collection("vocabLists").get();
    return snapshot.docs.map(doc => doc.data());
}

// Firestore : sauvegarder une liste
async function saveVocabularyList(list) {
    await db.collection("vocabLists").add(list);
}

// Ajout d'une nouvelle liste depuis le formulaire
async function handleVocabInput() {
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

    await saveVocabularyList({ title, words });

    document.getElementById('vocab-title').value = '';
    document.getElementById('vocab-input').value = '';
    alert("Liste enregistrée !");
    await renderListSelection();
}

// Affichage des listes à cocher avec bouton suppression
async function renderListSelection() {
    const lists = await loadVocabularyLists();
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
    </label>
    <button class="delete-list-btn" data-idx="${idx}" title="Supprimer la liste">🗑️</button>
    <br>
`;
    });

    // Ajoute les listeners pour les boutons de suppression
    document.querySelectorAll('.delete-list-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const idx = parseInt(btn.getAttribute('data-idx'));
            const confirmDelete = confirm("Êtes-vous sûr de vouloir supprimer cette liste ?");
            if (!confirmDelete) return;
            await deleteVocabularyListByIndex(idx);
            await renderListSelection();
            await loadVocabulary();
            getRandomWord();
        });
    });
}

// Fonction pour supprimer une liste par son index (Firestore)
async function deleteVocabularyListByIndex(idx) {
    const snapshot = await db.collection("vocabLists").get();
    const doc = snapshot.docs[idx];
    if (doc) {
        await db.collection("vocabLists").doc(doc.id).delete();
    }
}

// Récupère tous les mots des listes cochées
async function getSelectedVocabulary() {
    const lists = await loadVocabularyLists();
    const checked = Array.from(document.querySelectorAll('.list-checkbox:checked')).map(cb => parseInt(cb.value));
    let words = [];
    checked.forEach(idx => {
        if (lists[idx]) words = words.concat(lists[idx].words);
    });
    return words;
}

// Charge les mots sélectionnés dans la variable globale
async function loadVocabulary() {
    vocabulary = await getSelectedVocabulary();
}

// Initialisation de la page
document.addEventListener('DOMContentLoaded', async () => {
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
        await renderListSelection();
        await loadVocabulary();
        loadLearnedWords();
        getRandomWord();

        document.getElementById('list-selection').addEventListener('change', async () => {
            await loadVocabulary();
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

// (Optionnel) Fonction pour afficher les mots appris sur la page learned.html
function displayLearnedWords() {
    const ul = document.getElementById('learned-words');
    const count = document.getElementById('learned-count');
    if (!ul) return;
    ul.innerHTML = '';
    learnedWords.forEach(word => {
        const li = document.createElement('li');
        li.textContent = `${word.french} = ${word.english}`;
        ul.appendChild(li);
    });
    if (count) count.textContent = `Nombre de mots appris : ${learnedWords.length}`;
}

// (Optionnel) Fonction pour vider la liste des mots appris
function clearLearnedWords() {
    learnedWords = [];
    saveLearnedWords();
    displayLearnedWords();
}
