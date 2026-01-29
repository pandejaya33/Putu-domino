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
    const dataSaya = { id: myId, name: myName, ready: false, cards: [], revealed: [], isBot: false };
    if (!snap.exists()) {
        // Mode diambil dari localStorage saat buat room
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

onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const room = snap.data();
    const me = room.players.find(p => p.id === myId);

    // FIX 1: Tampilkan Kode Room & Mode
    document.getElementById("roomCode").innerText = `${roomId} (${room.mode.toUpperCase()})`;
    
    // FIX 2: Render Pemain & Bot secara individu
    document.getElementById("playerList").innerHTML = room.players.map(p => `
        <div class="player-item" style="background:rgba(255,255,255,0.1); padding:10px; margin-bottom:5px; border-radius:8px; display:flex; justify-content:space-between;">
            <span>${p.isBot ? '🤖' : '👤'} ${p.name}</span>
            <span>${p.cards.length} krt ${p.ready ? '✅' : '⏳'}</span>
        </div>
    `).join("");

    // FIX 3: Buka Kartu (Klik kartu untuk melihat isinya)
    const area = document.getElementById("kartuSaya");
    area.innerHTML = "";
    if (me?.cards) {
        me.cards.forEach((c, i) => {
            const div = document.createElement("div");
            div.className = "dominoCard";
            // Jika index kartu ini ada di daftar 'revealed', tampilkan angkanya
            if (me.revealed && me.revealed.includes(i)) {
                div.style.background = "#fff";
                div.style.color = "#000";
                div.innerText = c; // Menampilkan angka kartu (misal: 1|5)
            } else {
                div.style.background = "#fff"; // Belakang kartu tetap putih tapi kosong
            }
            div.onclick = () => bukaKartu(i);
            area.appendChild(div);
        });
    }

    // FIX 4: Limit Dinamis (Spirit 3, Bererong 4)
    const maxKrt = room.mode === "spirit" ? 3 : 4;
    const btnLanjut = document.getElementById("btnLanjut");
    if (room.started && me && me.cards.length > 0 && me.cards.length < maxKrt) {
        btnLanjut.style.display = "block";
        btnLanjut.innerText = `+ AMBIL KARTU (${me.cards.length}/${maxKrt})`;
    } else {
        btnLanjut.style.display = "none";
    }

    // Bagi Kartu Pertama (Tetap 1)
    if (!room.started && room.players.length >= 2 && room.players.every(p => p.ready)) {
        if (room.hostId === myId && !sedangBagi) {
            sedangBagi = true;
            let deck = [...room.deck];
            const pUpdate = room.players.map(p => {
                const k = deck.pop();
                return { ...p, cards: [`${k.left}|${k.right}`], revealed: [] };
            });
            updateDoc(roomRef, { started: true, players: pUpdate, deck: deck });
        }
    }
});

// Tambah Bot Satu per Satu
window.tambahBot = async () => {
    const botNames = ["Mas J", "Mangku", "Dontol"];
    const snap = await getDoc(roomRef);
    const room = snap.data();
    const currentBots = room.players.filter(p => p.isBot).length;
    
    if (currentBots < botNames.length) {
        const newBot = { 
            id: "bot_" + Date.now(), 
            name: botNames[currentBots], 
            ready: true, 
            cards: [], 
            revealed: [], 
            isBot: true 
        };
        await updateDoc(roomRef, { players: arrayUnion(newBot) });
    }
};

window.setReady = async () => {
    const snap = await getDoc(roomRef);
    const p = [...snap.data().players];
    const i = p.findIndex(x => x.id === myId);
    p[i].ready = true;
    await updateDoc(roomRef, { players: p });
};

window.bukaKartu = async (indexKartu) => {
    const snap = await getDoc(roomRef);
    const p = [...snap.data().players];
    const i = p.findIndex(x => x.id === myId);
    if (!p[i].revealed) p[i].revealed = [];
    if (!p[i].revealed.includes(indexKartu)) {
        p[i].revealed.push(indexKartu);
        await updateDoc(roomRef, { players: p });
    }
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
    await updateDoc(roomRef, { started: false, deck: buatDeck(), players: [] });
    window.location.reload();
};
