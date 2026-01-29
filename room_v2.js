import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId") || "p_" + Math.random().toString(36).substr(2, 5);
const myName = localStorage.getItem("playerName") || "Pemain";
const roomRef = doc(db, "rooms", roomId);

let kunciBagi = false;

// Inisialisasi Room
async function initRoom() {
    const snap = await getDoc(roomRef);
    const dataSaya = { id: myId, name: myName, ready: false, cards: [], isBot: false };
    if (!snap.exists()) {
        await setDoc(roomRef, { players: [dataSaya], started: false, deck: buatDeck(), hostId: myId });
    } else {
        const room = snap.data();
        if (!room.players.find(p => p.id === myId)) {
            await updateDoc(roomRef, { players: arrayUnion(dataSaya) });
        }
    }
}
initRoom();

onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const room = snap.data();
    const me = room.players.find(p => p.id === myId);

    // Update List Pemain (Agar terlihat siapa yang sudah masuk)
    document.getElementById("playerList").innerHTML = room.players.map(p => `
        <div style="background:rgba(255,255,255,0.1); padding:10px; margin-bottom:5px; border-radius:8px; color:white;">
            ${p.isBot ? '🤖' : '👤'} ${p.name} | ${p.cards.length} kartu ${p.ready ? '✅' : '⏳'}
        </div>
    `).join("");

    // Render Visual Kartu
    const area = document.getElementById("kartuSaya");
    area.innerHTML = "";
    if (me?.cards) {
        me.cards.forEach(() => {
            const div = document.createElement("div");
            div.className = "dominoCard";
            div.style.cssText = "background:white; width:55px; height:85px; border-radius:5px; display:inline-block; margin:5px; border:1px solid #000;";
            area.appendChild(div);
        });
    }

    // PENGUNCI LIMIT: Tombol hilang jika kartu sudah 3
    const btnLanjut = document.getElementById("btnLanjut");
    if (room.started && me && me.cards.length > 0 && me.cards.length < 3) {
        btnLanjut.style.display = "block";
    } else {
        btnLanjut.style.display = "none";
    }

    // BAGI KARTU PERTAMA (Hanya 1 kartu)
    if (!room.started && room.players.length >= 2 && room.players.every(p => p.ready)) {
        if (room.hostId === myId && !kunciBagi) {
            kunciBagi = true;
            let deck = [...room.deck];
            const pUpdate = room.players.map(p => {
                const k = deck.pop();
                return { ...p, cards: [`${k.left}|${k.right}`] };
            });
            updateDoc(roomRef, { started: true, players: pUpdate, deck: deck });
        }
    }
});

// Fungsi Tombol-Tombol
window.tambahBot = async () => {
    const snap = await getDoc(roomRef);
    const bot = { id: "bot_" + Math.random(), name: "Mas J", ready: true, cards: [], isBot: true };
    await updateDoc(roomRef, { players: arrayUnion(bot) });
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
    // KUNCI MATI DI DATABASE
    if (p[i].cards.length < 3) {
        let d = [...room.deck];
        const k = d.pop();
        p[i].cards.push(`${k.left}|${k.right}`);
        await updateDoc(roomRef, { players: p, deck: d });
    }
};
