import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName");
const roomRef = doc(db, "rooms", roomId);

let sedangBagi = false;

async function initRoom() {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) {
        await setDoc(roomRef, { 
            players: [{ id: myId, name: myName, ready: false, cards: [], isBot: false }], 
            started: false, 
            deck: buatDeck(), 
            hostId: myId 
        });
    } else {
        const room = snap.data();
        if (!room.players.find(p => p.id === myId)) {
            await updateDoc(roomRef, { 
                players: arrayUnion({ id: myId, name: myName, ready: false, cards: [], isBot: false }) 
            });
        }
    }
}
initRoom();

onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const room = snap.data();
    const me = room.players.find(p => p.id === myId);

    document.getElementById("roomCode").innerText = roomId;
    
    // List Pemain
    document.getElementById("playerList").innerHTML = room.players.map(p => `
        <div style="background:rgba(255,255,255,0.1); padding:8px; margin-bottom:5px; border-radius:5px; display:flex; justify-content:space-between;">
            <span>${p.isBot ? '🤖' : '👤'} ${p.name}</span>
            <span>${p.ready ? '✅' : '⏳'} (${p.cards.length} kartu)</span>
        </div>
    `).join("");

    // Render Kartu (Putih polos agar kontras)
    const area = document.getElementById("kartuSaya");
    area.innerHTML = "";
    if (me?.cards) {
        me.cards.forEach(() => {
            const div = document.createElement("div");
            div.className = "dominoCard";
            div.style.background = "#fff";
            area.appendChild(div);
        });
    }

    // --- REM (LIMIT) SPIRIT 3 KARTU ---
    const btnLanjut = document.getElementById("btnLanjut");
    if (room.started && me && me.cards.length > 0 && me.cards.length < 3) {
        btnLanjut.style.display = "block";
    } else {
        btnLanjut.style.display = "none";
    }

    // MULAI (PASTI 1 KARTU)
    if (!room.started && room.players.length >= 2 && room.players.every(p => p.ready)) {
        if (room.hostId === myId && !sedangBagi) {
            sedangBagi = true;
            let deck = [...room.deck];
            const pUpdate = room.players.map(p => {
                const k = deck.pop();
                return { ...p, cards: [`${k.left}|${k.right}`] }; // HANYA 1
            });
            updateDoc(roomRef, { started: true, players: pUpdate, deck: deck });
        }
    }
});

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
    const p = [...snap.data().players];
    const i = p.findIndex(x => x.id === myId);
    p[i].ready = true;
    await updateDoc(roomRef, { players: p });
};

window.ambilKartuLanjut = async () => {
    const snap = await getDoc(roomRef);
    const room = snap.data();
    let p = [...room.players];
    const i = p.findIndex(x => x.id === myId);
    
    if (p[i].cards.length < 3) { // LIMIT TOTAL 3 KARTU
        let d = [...room.deck];
        const k = d.pop();
        p[i].cards.push(`${k.left}|${k.right}`);
        await updateDoc(roomRef, { players: p, deck: d });
    }
};

window.mainLagi = async () => {
    await updateDoc(roomRef, { started: false, deck: buatDeck(), players: [] });
    window.location.reload();
};
