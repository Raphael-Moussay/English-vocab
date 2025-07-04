let vocabulary = [];
let learnedWords = [];
let user = null;

// --- Gestion des mots appris par utilisateur (Firestore) ---
async function loadLearnedWordsFromFirestore() {
    if (!user) return [];
    const snap = await db.collection('learnedWords').doc(user.uid).get();
    return snap.exists ? snap.data().words || [] : [];
}
async function saveLearnedWordsToFirestore(words) {
    if (!user) return;
    await db.collection('learnedWords').doc(user.uid).set({ words });
}

// Surcharge les fonctions locales pour synchroniser avec Firestore
async function loadLearnedWords() {
    if (!user) {
        const storedLearnedWords = localStorage.getItem('learnedWords');
        learnedWords = storedLearnedWords ? JSON.parse(storedLearnedWords) : [];
    } else {
        learnedWords = await loadLearnedWordsFromFirestore();
        localStorage.setItem('learnedWords', JSON.stringify(learnedWords));
    }
}
async function saveLearnedWords() {
    localStorage.setItem('learnedWords', JSON.stringify(learnedWords));
    if (user) await saveLearnedWordsToFirestore(learnedWords);
}

// Nettoie les mots appris qui ne sont plus dans les listes sélectionnées
async function cleanLearnedWordsAfterListDelete() {
    // Récupère tous les mots encore présents dans les listes
    await loadVocabulary();
    learnedWords = learnedWords.filter(word => vocabulary.find(w => w.english === word.english));
    await saveLearnedWords();
    if (document.getElementById('learned-words')) displayLearnedWords();
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

// Authentification Google
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await firebase.auth().signInWithPopup(provider);
        user = result.user;
        updateAuthUI();
        await renderListSelection();
        await loadVocabulary();
        getRandomWord();
    } catch (error) {
        alert("Erreur de connexion : " + error.message);
    }
}

async function signOut() {
    await firebase.auth().signOut();
    user = null;
    localStorage.removeItem('learnedWords'); // Suppression des mots appris du localStorage à la déconnexion
    updateAuthUI();
    await renderListSelection();
    await loadVocabulary();
    getRandomWord();
}

function updateAuthUI() {
    // On place le bouton dans le nav à côté des autres onglets
    let nav = document.querySelector('header nav');
    if (!nav) return;
    let authBtn = document.getElementById('auth-btn');
    if (authBtn) authBtn.remove();
    // S'assurer que le bouton est toujours visible
    const btn = document.createElement('button');
    btn.id = 'auth-btn';
    btn.className = 'top-right-button';
    btn.style.display = 'inline-block';
    if (user) {
        btn.textContent = 'Déconnexion';
        btn.addEventListener('click', signOut);
    } else {
        btn.textContent = 'Connexion Google';
        btn.addEventListener('click', signInWithGoogle);
    }
    nav.appendChild(btn);
}

// Firestore : charger toutes les listes de l'utilisateur connecté
async function loadVocabularyLists() {
    if (!user) return [];
    const snapshot = await db.collection("vocabLists")
        .where("uid", "==", user.uid)
        .get();
    return snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
}

// Firestore : sauvegarder une liste pour l'utilisateur connecté
async function saveVocabularyList(list) {
    if (!user) return;
    await db.collection("vocabLists").add({ ...list, uid: user.uid });
}

// Fonction pour supprimer une liste par son index (Firestore)
async function deleteVocabularyListByIndex(idx) {
    if (!user) return;
    const lists = await loadVocabularyLists();
    const list = lists[idx];
    if (list && list.id) {
        await db.collection("vocabLists").doc(list.id).delete();
        await cleanLearnedWordsAfterListDelete();
    }
}

// Ajout d'une nouvelle liste depuis le formulaire
async function handleVocabInput() {
    if (!user) {
        alert("Vous devez être connecté avec Google pour enregistrer une liste.");
        return;
    }
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
    setTimeout(() => {
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
    }, 0);
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

    // Auth UI
    let header = document.querySelector('header');
    if (header && !document.getElementById('auth-container')) {
        const div = document.createElement('div');
        div.id = 'auth-container';
        div.style = 'position:absolute;top:10px;right:10px;z-index:10;';
        header.appendChild(div);
    }
    firebase.auth().onAuthStateChanged(async (u) => {
        user = u;
        await loadLearnedWords();
        updateAuthUI();
        await renderListSelection();
        await loadVocabulary();
        getRandomWord();
        if (document.getElementById('learned-words')) displayLearnedWords();
    });
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
