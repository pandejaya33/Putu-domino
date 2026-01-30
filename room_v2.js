import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const rId = localStorage.getItem("roomId");
const pId = localStorage.getItem("playerId");
const roomRef = doc(db, "rooms", rId);
const modePilihan = localStorage.getItem("mode") || "spirit";
const MAX_KARTU = modePilihan === "spirit" ? 3 : 4;

/* ================= UI KARTU DOMINO ================= */

function getDots(num) {
    const p = { 0:[], 1:[4], 2:[0,8], 3:[0,4,8], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8] };
    let h = '<div class="dot-container">';
    for(let i=0; i<9; i++) h += `<div class="dot ${p[num].includes(i)?'active':''}"></div>`;
    return h + '</div>';
}

function renderCard(c, hidden) {
    if (hidden) return `<div class="domino-card-real hidden-style">🂠</div>`;
    return `
        <div class="domino-card-real">
            ${getDots(c.left)}
            <div class="line"></div>
            ${getDots(c.right)}
        </div>`;
}

/* ================= READY SYSTEM ================= */

window.setReady = async () => {
    const snap = await getDoc(roomRef);
    let data = snap.data();
    let players = data.players;

    const idx = players.findIndex(p => p.id === pId);
    if (players[idx].cards.length >= MAX_KARTU) return alert("Kartu maksimal!");

    players[idx].isReady = true;
    await updateDoc(roomRef, { players });
};

/* ================= PEMBAGIAN KARTU TERKONTROL ================= */

async function cekSemuaReady(data) {
    let { players, deck } = data;
    const semuaSiap = players.every(p => p.isReady);

    if (!semuaSiap) return;

    // stop jika semua sudah max kartu
    if (players.every(p => p.cards.length >= MAX_KARTU)) return;

    players = players.map(p => {
        if (p.cards.length < MAX_KARTU && deck.length > 0) {
            p.cards.push(deck.shift());
        }
        p.isReady = false;
        return p;
    });

    await updateDoc(roomRef, { players, deck });
}

/* ================= MAIN LAGI ================= */

window.mainLagi = async () => {
    const snap = await getDoc(roomRef);
    let ps = snap.data().players.map(p => ({...p, cards:[], isReady:false}));
    await updateDoc(roomRef, { players:ps, deck:buatDeck() });
};

/* ================= SNAPSHOT UI ================= */

onSnapshot(roomRef, async (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();

    await cekSemuaReady(data);

    document.getElementById("infoDisplay").innerText =
        `MODE: ${modePilihan.toUpperCase()} | ROOM: ${rId}`;

    document.getElementById("playerList").innerHTML = data.players.map(p => `
        <div class="player-item ${p.isReady ? 'ready-status' : ''}">
            <span>${p.name}</span>
            <span>${p.cards.length} Kartu ${p.isReady ? '✅' : ''}</span>
        </div>
    `).join('');

    const me = data.players.find(p => p.id === pId);
    if (me) {
        document.getElementById("myCardsArea").innerHTML =
            me.cards.map(c => renderCard(c, true)).join('');
    }
});
