import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const rId = localStorage.getItem("roomId");
const pId = localStorage.getItem("playerId");
const pName = localStorage.getItem("playerName");
const roomRef = doc(db, "rooms", rId);

// Fungsi Gambar Titik Domino
function getDotsHtml(num) {
    const p = { 0:[], 1:[4], 2:[0,8], 3:[0,4,8], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8] };
    let h = '<div class="dot-container">';
    for (let i = 0; i < 9; i++) h += `<div class="dot ${p[num].includes(i) ? 'active' : ''}"></div>`;
    return h + '</div>';
}

// Inisialisasi Player di dalam Room
(async () => {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) {
        await setDoc(roomRef, { 
            players: [{id: pId, name: pName, cards: []}], 
            deck: buatDeck(), 
            started: false 
        });
    } else {
        let players = snap.data().players || [];
        if (!players.find(p => p.id === pId)) {
            players.push({id: pId, name: pName, cards: []});
            await updateDoc(roomRef, { players });
        }
    }
})();

// Fungsi Tarik Kartu (Pencet Ready)
window.setReady = async () => {
    const snap = await getDoc(roomRef);
    let data = snap.data();
    let players = [...data.players];
    let deck = [...data.deck];
    const idx = players.findIndex(p => p.id === pId);

    // Ambil 1 kartu dari deck jika belum mencapai batas
    if (players[idx].cards.length < 4) {
        const kartuBaru = deck.shift();
        players[idx].cards.push(kartuBaru);
        await updateDoc(roomRef, { players, deck, started: true });
    }
};

// Monitor Perubahan Real-time
onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    
    // Tampilkan List Pemain
    const listArea = document.getElementById("playerList");
    if (listArea) {
        listArea.innerHTML = data.players.map(p => `
            <div class="player-item">
                <span>${p.name}</span>
                <span>${p.cards.length} KRT</span>
            </div>
        `).join('');
    }

    // Tampilkan Kartu Kuning Titik Merah Milik Sendiri
    const me = data.players.find(p => p.id === pId);
    const cardArea = document.getElementById("myCardsArea");
    if (cardArea && me && me.cards) {
        cardArea.innerHTML = me.cards.map(c => `
            <div class="domino-card-real">
                ${getDotsHtml(c.left)}
                <div class="line"></div>
                ${getDotsHtml(c.right)}
            </div>
        `).join('');
    }
});
