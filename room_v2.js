import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const rId = localStorage.getItem("roomId");
const pId = localStorage.getItem("playerId");
const pName = localStorage.getItem("playerName");

if (!rId || !pName) { window.location.href = "index.html"; }

const roomRef = doc(db, "rooms", rId);

// Inisialisasi Room
(async () => {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) {
        await setDoc(roomRef, { players: [{id: pId, name: pName, ready: false, cards: []}], started: false });
    } else {
        let players = snap.data().players || [];
        if (!players.find(p => p.id === pId)) {
            players.push({id: pId, name: pName, ready: false, cards: []});
            await updateDoc(roomRef, { players });
        }
    }
})();

// Fungsi Tombol Ready
document.getElementById('readyBtn').onclick = async () => {
    const snap = await getDoc(roomRef);
    let players = [...snap.data().players];
    const idx = players.findIndex(p => p.id === pId);
    players[idx].ready = true;

    if (players.every(p => p.ready) && players.length >= 1) {
        const deck = buatDeck();
        players.forEach(p => { p.cards = deck.splice(0, 3); });
        await updateDoc(roomRef, { players, started: true });
    } else {
        await updateDoc(roomRef, { players });
    }
};

// Pantau Perubahan
onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    
    document.getElementById("roomCodeDisplay").innerText = `KODE: ${rId}`;
    
    const list = document.getElementById("playerList");
    list.innerHTML = data.players.map(p => `
        <div class="player-card" style="border: 1px solid ${p.ready ? '#ffd700' : '#555'}">
            <span>${p.name} ${p.ready ? '✅' : '⏳'}</span>
            <span>${p.cards ? p.cards.length : 0} KRT</span>
        </div>
    `).join('');

    const area = document.getElementById("myCardsArea");
    const me = data.players.find(p => p.id === pId);
    if (data.started && me && me.cards.length > 0) {
        area.innerHTML = me.cards.map(c => `
            <div class="domino-card-real">
                <div class="top">${c.left}</div>
                <div class="line"></div>
                <div class="bottom">${c.right}</div>
            </div>
        `).join('');
    }
});
