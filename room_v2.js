import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName") || "Player";
const isVsBot = localStorage.getItem("gameType") === "vs_bot";

const roomRef = doc(db, "rooms", roomId);

// Hubungkan tombol HTML ke fungsi JavaScript
window.setReady = async () => {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    let players = [...snap.data().players];
    const idx = players.findIndex(p => p.id === myId);
    if (idx !== -1) {
        players[idx].ready = true;
        await updateDoc(roomRef, { players });
        
        // Cek jika semua sudah ready
        if (players.every(p => p.ready)) {
            const deck = buatDeck();
            const mode = localStorage.getItem("mode") || "spirit";
            const jml = mode === "bererong" ? 4 : 3;
            
            const updated = players.map(p => ({
                ...p, cards: deck.splice(0, jml)
            }));
            await updateDoc(roomRef, { players: updated, started: true });
        }
    }
};

window.resetGame = async () => {
    await updateDoc(roomRef, { started: false, players: [] });
    window.location.reload();
};

// Pantau Perubahan Data
onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    
    // Tampilkan List Pemain
    const list = document.getElementById("playerList");
    list.innerHTML = data.players.map(p => `
        <div class="player-card">
            <span>${p.name} ${p.ready ? '✅' : '⏳'}</span>
            <span>${p.cards ? p.cards.length : 0} Kartu</span>
        </div>
    `).join('');

    // MUNCULKAN KARTU KUNING JIKA SUDAH MULAI
    const area = document.getElementById("myCardsArea");
    const me = data.players.find(p => p.id === myId);
    if (data.started && me && me.cards) {
        area.innerHTML = me.cards.map(c => `
            <div class="domino-card-real">
                <div class="top">${c.left}</div>
                <div class="line"></div>
                <div class="bottom">${c.right}</div>
            </div>
        `).join('');
    } else {
        area.innerHTML = "";
    }
});
