import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName");
const roomRef = doc(db, "rooms", roomId);

async function initRoom() {
    console.log("Inisialisasi room...");
    const snap = await getDoc(roomRef);
    const me = { id: myId, name: myName, ready: false, cards: [], isBot: false };
    
    if (!snap.exists()) {
        const modePilihan = localStorage.getItem("mode") || "spirit";
        await setDoc(roomRef, { players: [me], started: false, deck: buatDeck(), hostId: myId, mode: modePilihan });
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

    // Update Header
    document.getElementById("roomCode").innerText = `${roomId} - MODE: ${room.mode.toUpperCase()}`;

    // List Pemain
    document.getElementById("playerList").innerHTML = room.players.map(p => `
        <div style="background:rgba(255,255,255,0.1); padding:10px; margin:5px; border-radius:8px; display:flex; justify-content:space-between; color:white;">
            <span>${p.isBot ? '🤖' : '👤'} ${p.name}</span>
            <span>${p.ready ? '✅ READY' : '⏳ WAIT'} (${p.cards.length})</span>
        </div>
    `).join("");

    // Visual Kartu Sesuai Permintaan (Warna Putih, Angka Merah)
    const area = document.getElementById("kartuSaya");
    area.innerHTML = "";
    if (me?.cards) {
        me.cards.forEach((c) => {
            const [top, bottom] = c.split("|");
            const div = document.createElement("div");
            div.style.cssText = "background:white; color:red; width:60px; height:100px; border-radius:8px; border:2px solid #000; font-size:28px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-weight:bold; margin:5px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);";
            div.innerHTML = `<div>${top}</div><div style="width:100%; height:2px; background:black;"></div><div>${bottom}</div>`;
            area.appendChild(div);
        });
    }

    // Limit Aturan (Spirit 3, Bererong 4)
    const limit = room.mode === "spirit" ? 3 : 4;
    const btnLanjut = document.getElementById("btnLanjut");
    if (room.started && me && me.cards.length > 0 && me.cards.length < limit) {
        btnLanjut.style.display = "block";
    } else {
        btnLanjut.style.display = "none";
    }

    // Auto-Start jika 2+ pemain & semua ready
    if (!room.started && room.players.length >= 2 && room.players.every(p => p.ready)) {
        if (room.hostId === myId) {
            console.log("Memulai pembagian kartu...");
            let deck = [...room.deck];
            const pUpdate = room.players.map(p => {
                const k = deck.pop();
                return { ...p, cards: [`${k.left}|${k.right}`] };
            });
            updateDoc(roomRef, { started: true, players: pUpdate, deck: deck });
        }
    }
});

// Tombol SIAP (READY)
window.setReady = async () => {
    console.log("Klik tombol Ready");
    const snap = await getDoc(roomRef);
    let p = [...snap.data().players];
    const idx = p.findIndex(x => x.id === myId);
    if (idx !== -1) {
        p[idx].ready = true;
        await updateDoc(roomRef, { players: p }).then(() => console.log("Berhasil Ready"));
    }
};

// Tombol Tambah Bot
window.tambahBot = async () => {
    console.log("Klik tombol Bot");
    const daftarBot = ["Mas J", "Mangku", "Dontol"];
    const snap = await getDoc(roomRef);
    const room = snap.data();
    const jumlahBot = room.players.filter(p => p.isBot).length;

    if (jumlahBot < daftarBot.length) {
        const botBaru = { 
            id: "bot_" + Math.random().toString(36).substr(2, 5), 
            name: daftarBot[jumlahBot], 
            ready: true, 
            cards: [], 
            isBot: true 
        };
        await updateDoc(roomRef, { players: arrayUnion(botBaru) }).then(() => console.log("Bot berhasil masuk"));
    }
};

// Ambil Kartu Lanjut
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
