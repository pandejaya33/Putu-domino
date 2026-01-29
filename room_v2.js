import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName");
const roomRef = doc(db, "rooms", roomId);

// 1. MASUK ROOM & AMBIL MODE
async function initRoom() {
    const snap = await getDoc(roomRef);
    const dataSaya = { id: myId, name: myName, ready: false, cards: [], isBot: false };
    if (!snap.exists()) {
        const modeAwal = localStorage.getItem("mode") || "spirit";
        await setDoc(roomRef, { players: [dataSaya], started: false, deck: buatDeck(), hostId: myId, mode: modeAwal });
    } else {
        const room = snap.data();
        if (!room.players.find(p => p.id === myId)) {
            await updateDoc(roomRef, { players: arrayUnion(dataSaya) });
        }
    }
}
initRoom();

// 2. MONITORING KARTU & TOMBOL
onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const room = snap.data();
    const me = room.players.find(p => p.id === myId);

    // Update Kode Room & Mode di Layar
    document.getElementById("roomCode").innerText = `${roomId} (${room.mode.toUpperCase()})`;
    
    // List Pemain (Muncul satu-satu)
    document.getElementById("playerList").innerHTML = room.players.map(p => `
        <div style="background:rgba(255,255,255,0.1); padding:10px; margin-bottom:5px; border-radius:10px; display:flex; justify-content:space-between;">
            <span>${p.isBot ? '🤖' : '👤'} ${p.name}</span>
            <span>${p.cards.length} kartu ${p.ready ? '✅' : '⏳'}</span>
        </div>
    `).join("");

    // Render Kartu (Tampilan Titik Domino)
    const area = document.getElementById("kartuSaya");
    area.innerHTML = "";
    if (me?.cards) {
        me.cards.forEach((c) => {
            const [top, bottom] = c.split("|");
            const div = document.createElement("div");
            div.className = "dominoCard";
            div.style.cssText = "background:white; color:red; width:55px; height:90px; border-radius:6px; border:2px solid #000; font-size:24px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-weight:bold; margin:5px;";
            div.innerHTML = `<div>${top}</div><div style="width:100%; height:2px; background:black;"></div><div>${bottom}</div>`;
            area.appendChild(div);
        });
    }

    // Aturan Limit: Spirit 3, Bererong 4
    const maxKrt = room.mode === "spirit" ? 3 : 4;
    const btnLanjut = document.getElementById("btnLanjut");
    if (room.started && me && me.cards.length > 0 && me.cards.length < maxKrt) {
        btnLanjut.style.display = "block";
    } else {
        btnLanjut.style.display = "none";
    }

    // Host Mulai (Otomatis jika semua Ready)
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

// 3. FUNGSI TOMBOL
window.tambahBot = async () => {
    const names = ["Mas J", "Mangku", "Dontol"];
    const snap = await getDoc(roomRef);
    const room = snap.data();
    const count = room.players.filter(p => p.isBot).length;
    if (count < names.length) {
        const bot = { id: "bot_" + Date.now(), name: names[count], ready: true, cards: [], isBot: true };
        await updateDoc(roomRef, { players: arrayUnion(bot) });
    }
};

window.setReady = async () => {
    const snap = await getDoc(roomRef);
    let p = [...snap.data().players];
    const i = p.findIndex(x => x.id === myId);
    p[i].ready = true;
    await updateDoc(roomRef, { players: p });
};

window.ambilKartuLanjut = async () => {
    const snap = await getDoc(roomRef);
    const room = snap.data();
    const maxKrt = room.mode === "spirit" ? 3 : 4;
    let p = [...room.players];
    const i = p.findIndex(x => x.id === myId);
    if (p[i].cards.length < maxKrt) {
        let d = [...room.deck];
        const k = d.pop();
        p[i].cards.push(`${k.left}|${k.right}`);
        await updateDoc(roomRef, { players: p, deck: d });
    }
};

window.mainLagi = async () => {
    await updateDoc(roomRef, { started: false, players: [] });
    window.location.reload();
};
