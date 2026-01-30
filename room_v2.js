import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const rId = localStorage.getItem("roomId");
const pId = localStorage.getItem("playerId");
const pName = localStorage.getItem("playerName");
const roomRef = doc(db, "rooms", rId);

function getDotsHtml(num) {
    const p = { 0:[], 1:[4], 2:[0,8], 3:[0,4,8], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8] };
    let h = '<div class="dot-container">';
    for (let i = 0; i < 9; i++) h += `<div class="dot ${p[num].includes(i) ? 'active' : ''}"></div>`;
    return h + '</div>';
}

// Tombol Tarik Kartu
window.setReady = async () => {
    const snap = await getDoc(roomRef);
    let data = snap.data();
    let players = [...data.players];
    let deck = [...data.deck];
    const idx = players.findIndex(p => p.id === pId);

    if (players[idx].cards.length < 4) {
        const kartuBaru = deck.shift();
        players[idx].cards.push(kartuBaru);
        await updateDoc(roomRef, { players, deck });
    }
};

// Tombol MAIN LAGI (Reset Kartu)
window.mainLagi = async () => {
    const snap = await getDoc(roomRef);
    let players = snap.data().players.map(p => ({ ...p, cards: [] }));
    await updateDoc(roomRef, { 
        players: players, 
        deck: buatDeck() 
    });
};

onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    
    // Tampilkan KODE & MODE (Sesuai Foto)
    const mode = localStorage.getItem("mode") || "SPIRIT";
    document.getElementById("infoDisplay").innerText = `MODE: KODE: ${rId} (${mode.toUpperCase()})`;

    // Daftar Pemain
    document.getElementById("playerList").innerHTML = data.players.map(p => `
        <div class="player-item">
            <span>${p.name}</span>
            <span>${p.cards.length} KRT</span>
        </div>
    `).join('');

    // Kartu Titik Merah
    const me = data.players.find(p => p.id === pId);
    if (me && me.cards) {
        document.getElementById("myCardsArea").innerHTML = me.cards.map(c => `
            <div class="domino-card-real">
                ${getDotsHtml(c.left)}
                <div class="line"></div>
                ${getDotsHtml(c.right)}
            </div>
        `).join('');
    }
});
