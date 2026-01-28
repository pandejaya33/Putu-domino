import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName");
const roomRef = doc(db, "rooms", roomId);

let sudahBagiAwal = false;

async function initRoom() {
    const snap = await getDoc(roomRef);
    const me = { id: myId, name: myName, ready: false, cards: [], revealed: [], isBot: false };
    if (!snap.exists()) {
        await setDoc(roomRef, { players: [me], started: false, deck: buatDeck(), hostId: myId });
    } else {
        const room = snap.data();
        if (!room.players.find(p => p.id === myId)) {
            await updateDoc(roomRef, { players: arrayUnion(me) });
        }
    }
}
initRoom();

onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const room = snap.data();
    const me = room.players.find(p => p.id === myId);

    document.getElementById("roomCode").innerText = roomId;
    
    // Tampilan daftar pemain
    const list = document.getElementById("playerList");
    list.innerHTML = room.players.map(p => `
        <div class="player-item" style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.1); padding:10px; margin-bottom:5px; border-radius:8px;">
            <span>${p.isBot ? '🤖' : '👤'} ${p.name}</span>
            <span style="color: ${p.ready ? '#10b981' : '#f59e0b'}">${p.ready ? '✅ Ready' : '⏳ Menunggu'} (${p.cards.length} kartu)</span>
        </div>
    `).join("");

    // Tampilan kartu
    const area = document.getElementById("kartuSaya");
    area.innerHTML = "";
    if (me && me.cards) {
        me.cards.forEach((c, i) => {
            const div = document.createElement("div");
            div.className = "dominoCard";
            div.innerHTML = `<div class="back" style="background:#222; width:60px; height:100px; border-radius:5px; border:2px solid #444;"></div>`;
            area.appendChild(div);
        });
    }

    // LOGIKA LIMIT: Hanya izinkan ambil kartu jika < 3
    const btnLanjut = document.getElementById("btnLanjut");
    if (room.started && me && me.cards.length > 0 && me.cards.length < 3) {
        btnLanjut.style.display = "block";
    } else {
        btnLanjut.style.display = "none";
    }

    // MULAI GAME: Hanya Host yang membagi 1 kartu pertama
    if (!room.started && room.players.length >= 2 && room.players.every(p => p.ready)) {
        if (room.hostId === myId && !sudahBagiAwal) {
            sudahBagiAwal = true;
            bagiKartuSatu(room);
        }
    }
});

async function bagiKartuSatu(room) {
    let deck = [...room.deck];
    const pBaru = room.players.map(p => {
        const k = deck.pop();
        return { ...p, cards: [`${k.left}|${k.right}`] }; // HANYA 1 KARTU
    });
    await updateDoc(roomRef, { started: true, players: pBaru, deck: deck });
}

window.tambahBot = async () => {
    const snap = await getDoc(roomRef);
    const room = snap.data();
    const bots = [
        { id: "bot1", name: "Mas J", ready: true, cards: [], isBot: true },
        { id: "bot2", name: "Mangku", ready: true, cards: [], isBot: true }
    ];
    await updateDoc(roomRef, { players: [...room.players, ...bots] });
};

window.setReady = async () => {
    const snap = await getDoc(roomRef);
    const players = [...snap.data().players];
    const idx = players.findIndex(p => p.id === myId);
    players[idx].ready = true;
    await updateDoc(roomRef, { players });
};

window.ambilKartuLanjut = async () => {
    const snap = await getDoc(roomRef);
    const room = snap.data();
    let players = [...room.players];
    const idx = players.findIndex(p => p.id === myId);

    if (players[idx].cards.length < 3) { // LIMIT KETAT 3 KARTU
        let deck = [...room.deck];
        const k = deck.pop();
        players[idx].cards.push(`${k.left}|${k.right}`);
        await updateDoc(roomRef, { players, deck });
    }
};

window.mainLagi = async () => {
    await updateDoc(roomRef, { started: false, deck: buatDeck(), players: [] });
    window.location.reload();
};
