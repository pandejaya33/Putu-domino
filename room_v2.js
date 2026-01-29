import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName");
const isVsBot = localStorage.getItem("gameType") === "vs_bot";

// 1. Validasi Keamanan: Jika nama kosong, tendang balik ke lobby
if (!roomId || !myName) {
    alert("Data tidak lengkap! Silakan isi nama di lobby.");
    window.location.href = "index.html";
}

const roomRef = doc(db, "rooms", roomId);

// 2. Fungsi Gabung/Inisialisasi Room
async function initRoom() {
    const snap = await getDoc(roomRef);
    let players = [];
    
    if (!snap.exists()) {
        // Jika room baru, buat data awal
        players = [{ id: myId, name: myName, ready: false, cards: [] }];
        if (isVsBot) {
            players.push({ id: "bot_j", name: "Mas J", ready: true, cards: [] });
        }
        await setDoc(roomRef, {
            players,
            started: false,
            mode: localStorage.getItem("mode") || "spirit",
            createdAt: Date.now()
        });
    } else {
        // Jika room sudah ada, tambah player baru
        players = snap.data().players || [];
        if (!players.find(p => p.id === myId)) {
            players.push({ id: myId, name: myName, ready: false, cards: [] });
            await updateDoc(roomRef, { players });
        }
    }
}

// 3. Fungsi Tombol SIAP (Ready)
window.setReady = async () => {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    
    let players = [...snap.data().players];
    const idx = players.findIndex(p => p.id === myId);
    
    if (idx !== -1) {
        players[idx].ready = true;
        await updateDoc(roomRef, { players });
        
        // Cek jika semua sudah ready, mulai bagi kartu
        const allReady = players.every(p => p.ready === true);
        if (allReady && players.length >= (isVsBot ? 2 : 2)) {
            mulaiPermainan(players);
        }
    }
};

// 4. Fungsi Bagi Kartu
async function mulaiPermainan(players) {
    const deck = buatDeck();
    const mode = localStorage.getItem("mode");
    const jumlahKartu = mode === "bererong" ? 4 : 3;

    const updatedPlayers = players.map(p => {
        return { ...p, cards: deck.splice(0, jumlahKartu) };
    });

    await updateDoc(roomRef, {
        players: updatedPlayers,
        started: true
    });
}

// 5. Update UI Real-time
onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    
    // Update Info Room
    const codeEl = document.getElementById("roomCode");
    if (codeEl) codeEl.innerText = `KODE: ${roomId} (${data.mode.toUpperCase()})`;

    // Render Daftar Player
    const container = document.getElementById("playerList");
    if (container) {
        container.innerHTML = data.players.map(p => `
            <div class="player-card ${p.ready ? 'ready' : ''}">
                <span>${p.id === myId ? '⭐ ' : ''}${p.name}</span>
                <span>${p.ready ? '✅ SIAP' : '⏳ MENUNGGU'}</span>
                <div class="card-count">${p.cards.length} Kartu</div>
            </div>
        `).join('');
    }

    // Tampilkan Kartu Milik Sendiri jika sudah mulai
    if (data.started) {
        const me = data.players.find(p => p.id === myId);
        renderMyCards(me.cards);
    }
});

function renderMyCards(cards) {
    const area = document.getElementById("myCardsArea");
    if (!area) return;
    area.innerHTML = cards.map(c => `
        <div class="domino-card-real">
            <div class="top">${c.left}</div>
            <div class="line"></div>
            <div class="bottom">${c.right}</div>
        </div>
    `).join('');
}

// Jalankan inisialisasi
initRoom();
