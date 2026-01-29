import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName");
const roomRef = doc(db, "rooms", roomId);

async function initRoom() {
    const snap = await getDoc(roomRef);
    const mode = localStorage.getItem("mode") || "spirit";
    const gameType = localStorage.getItem("gameType"); 
    const me = { id: myId, name: myName, ready: false, cards: [], isBot: false };

    if (!snap.exists()) {
        let players = [me];
        if (gameType === "vs_bot") {
            players.push(
                { id: "bot1", name: "Mas J", ready: true, cards: [], isBot: true },
                { id: "bot2", name: "Mangku", ready: true, cards: [], isBot: true }
            );
        }
        await setDoc(roomRef, { players, started: false, deck: buatDeck(), hostId: myId, mode: mode });
    } else {
        const data = snap.data();
        if (!data.players.find(p => p.id === myId)) {
            await updateDoc(roomRef, { players: arrayUnion(me) });
        }
    }
}
initRoom();

onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const room = snap.data();
    const me = room.players.find(p => p.id === myId);
    
    // Update daftar pemain (Agar nama lawan muncul)
    document.getElementById("playerList").innerHTML = room.players.map(p => `
        <div style="background:rgba(255,255,255,0.1); padding:10px; margin:5px; border-radius:8px; display:flex; justify-content:space-between;">
            <span>${p.isBot ? '🤖' : '👤'} ${p.name}</span>
            <span>${p.cards.length} kartu ${p.ready ? '✅' : '⏳'}</span>
        </div>
    `).join("");

    // Logika render kartu (tetap sama seperti sebelumnya)
    const area = document.getElementById("kartuSaya");
    const limit = room.mode === "spirit" ? 3 : 4;
    if (area && me?.cards) {
        area.innerHTML = me.cards.map(c => {
            if (me.cards.length < limit) return `<div class="domino-card-back"></div>`;
            const [t, b] = c.split("|");
            return `<div class="domino-card-real">
                <div class="half">${createDots(parseInt(t))}</div>
                <div class="line"></div>
                <div class="half">${createDots(parseInt(b))}</div>
            </div>`;
        }).join("");
    }
    
    // Tampilkan tombol ambil kartu jika giliran
    const btnLanjut = document.getElementById("btnLanjut");
    if (btnLanjut) btnLanjut.style.display = (room.started && me.cards.length < limit) ? "block" : "none";
});


    if (!room.started && room.players.length >= 2 && room.players.every(p => p.ready)) {
        if (room.hostId === myId) {
            let deck = [...room.deck];
            const pUpdate = room.players.map(p => {
                const k = deck.pop();
                return { ...p, cards: [`${k.left}|${k.right}`] };
            });
            updateDoc(roomRef, { started: true, players: pUpdate, deck: deck });
        }
    }
});

window.setReady = async () => {
    document.getElementById("sfxClick").play();
    const snap = await getDoc(roomRef);
    let p = [...snap.data().players];
    const i = p.findIndex(x => x.id === myId);
    if (i !== -1) { p[i].ready = true; await updateDoc(roomRef, { players: p }); }
};

window.ambilKartuLanjut = async () => {
    document.getElementById("sfxCard").play();
    const snap = await getDoc(roomRef);
    const room = snap.data();
    let p = [...room.players];
    const i = p.findIndex(x => x.id === myId);
    let deck = [...room.deck];
    const k = deck.pop();
    p[i].cards.push(`${k.left}|${k.right}`);
    await updateDoc(roomRef, { players: p, deck: deck });
};

window.mainLagi = async () => {
    await updateDoc(roomRef, { started: false, players: [] });
    window.location.reload();
};
