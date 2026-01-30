import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const rId = localStorage.getItem("roomId");
const pId = localStorage.getItem("playerId");
const roomRef = doc(db, "rooms", rId);
const modePilihan = (localStorage.getItem("mode") || "spirit").toLowerCase();
const MAX_KARTU = modePilihan === "spirit" ? 3 : 4;

// UI Kartu Tertutup (Sesuai permintaan Anda)
function renderCard() {
    return `<div class="domino-card-real hidden-style"><div class="card-back">❓</div></div>`;
}

// Tombol Siap (Hanya mengubah status isReady)
window.setReady = async () => {
    const snap = await getDoc(roomRef);
    let { players } = snap.data();
    const idx = players.findIndex(p => p.id === pId);
    
    if (players[idx].cards.length >= MAX_KARTU) return;
    if (players[idx].isReady) return; 

    players[idx].isReady = true;
    await updateDoc(roomRef, { players });
};

// Fungsi Kontrol Pembagian (Agar tidak bocor jadi 4 kartu)
async function kontrolPembagian(data) {
    let { players, deck } = data;
    const semuaSiap = players.every(p => p.isReady);
    
    // Syarat: Semua Siap DAN jumlah kartu saat ini masih di bawah MAX
    if (semuaSiap && players[0].cards.length < MAX_KARTU) {
        const newPlayers = players.map(p => {
            if (p.cards.length < MAX_KARTU) {
                p.cards.push(deck.shift());
            }
            p.isReady = false; // Reset untuk putaran kartu berikutnya
            return p;
        });
        await updateDoc(roomRef, { players: newPlayers, deck });
    }
}

window.mainLagi = async () => {
    const snap = await getDoc(roomRef);
    let ps = snap.data().players.map(p => ({...p, cards:[], isReady:false}));
    await updateDoc(roomRef, { players:ps, deck:buatDeck() });
};

onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();

    // HANYA pemain pertama yang memproses logika bagi kartu (mencegah tabrakan data)
    if (data.players[0].id === pId) {
        kontrolPembagian(data);
    }

    document.getElementById("infoDisplay").innerText = `MODE: ${modePilihan.toUpperCase()} | KODE: ${rId}`;
    
    // List Pemain dengan indikator Siap
    document.getElementById("playerList").innerHTML = data.players.map(p => `
        <div class="player-item ${p.isReady ? 'ready-status' : ''}">
            <span>${p.name}</span>
            <span>${p.isReady ? '✅ SIAP' : '⏳ ...'} (${p.cards.length}/${MAX_KARTU})</span>
        </div>
    `).join('');

    const me = data.players.find(p => p.id === pId);
    if (me) {
        // Kartu TERTUTUP (Hidden)
        document.getElementById("myCardsArea").innerHTML = me.cards.map(() => renderCard()).join('');
    }
});
