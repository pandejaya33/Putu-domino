import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName");
const roomRef = doc(db, "rooms", roomId);

async function initRoom() {
    const snap = await getDoc(roomRef);
    const me = { id: myId, name: myName, ready: false, cards: [], isBot: false };
    if (!snap.exists()) {
        const mode = localStorage.getItem("mode") || "spirit";
        await setDoc(roomRef, { players: [me], started: false, deck: buatDeck(), hostId: myId, mode: mode });
    } else {
        const room = snap.data();
        if (!room.players.find(p => p.id === myId)) {
            await updateDoc(roomRef, { players: arrayUnion(me) });
        }
    }
}
initRoom();

// Fungsi Helper untuk membuat Titik Domino (Dots)
function createDots(num) {
    const positions = {
        0: [],
        1: ['center'],
        2: ['top-right', 'bottom-left'],
        3: ['top-right', 'center', 'bottom-left'],
        4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
        6: ['top-left', 'top-right', 'mid-left', 'mid-right', 'bottom-left', 'bottom-right']
    };
    return positions[num].map(pos => `<div class="dot ${pos}"></div>`).join('');
}

onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const room = snap.data();
    const me = room.players.find(p => p.id === myId);

    // Ganti baris 44 yang error itu dengan ini agar tidak crash lagi:
const roomCodeElem = document.getElementById("roomCode");
if (roomCodeElem) {
    roomCodeElem.innerText = roomId + " - " + room.mode.toUpperCase();
}


    // List Pemain (Perbaikan Bot agar tidak gabung)
    document.getElementById("playerList").innerHTML = room.players.map(p => `
        <div style="background:rgba(255,255,255,0.1); padding:10px; margin:5px; border-radius:10px; display:flex; justify-content:space-between; color:white;">
            <span>${p.isBot ? '🤖' : '👤'} ${p.name}</span>
            <span>${p.ready ? '✅' : '⏳'} (${p.cards.length} krt)</span>
        </div>
    `).join("");

    // Visual Kartu (Kuning, Titik Merah seperti foto)
    const area = document.getElementById("kartuSaya");
    area.innerHTML = "";
    if (me?.cards) {
        me.cards.forEach((c) => {
            const [top, bottom] = c.split("|");
            const div = document.createElement("div");
            div.className = "domino-card-real";
            div.innerHTML = `
                <div class="half">${createDots(parseInt(top))}</div>
                <div class="line"></div>
                <div class="half">${createDots(parseInt(bottom))}</div>
            `;
            area.appendChild(div);
        });
    }

    const limit = room.mode === "spirit" ? 3 : 4;
    const btnLanjut = document.getElementById("btnLanjut");
    if (room.started && me && me.cards.length > 0 && me.cards.length < limit) {
        btnLanjut.style.display = "block";
    } else {
        btnLanjut.style.display = "none";
    }

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

// Fungsi Tombol
window.setReady = async () => {
    const snap = await getDoc(roomRef);
    let p = [...snap.data().players];
    const idx = p.findIndex(x => x.id === myId);
    if (idx !== -1) {
        p[idx].ready = true;
        await updateDoc(roomRef, { players: p });
    }
};

window.tambahBot = async () => {
    const names = ["Mas J", "Mangku", "Dontol"];
    const snap = await getDoc(roomRef);
    const room = snap.data();
    const count = room.players.filter(p => p.isBot).length;
    if (count < names.length) {
        const bot = { id: "bot_"+Date.now(), name: names[count], ready: true, cards: [], isBot: true };
        await updateDoc(roomRef, { players: arrayUnion(bot) });
    }
};

window.ambilKartuLanjut = async () => {
    const snap = await getDoc(roomRef);
    const room = snap.data();
    const limit = room.mode === "spirit" ? 3 : 4;
    let p = [...room.players];
    const idx = p.findIndex(x => x.id === myId);
    if (p[idx].cards.length < limit) {
        let deck = [...room.deck];
        const k = deck.pop();
        p[idx].cards.push(`${k.left}|${k.right}`);
        await updateDoc(roomRef, { players: p, deck: deck });
    }
};

window.mainLagi = async () => {
    await updateDoc(roomRef, { started: false, players: [] });
    window.location.reload();
};
