import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const rId = localStorage.getItem("roomId");
const pId = localStorage.getItem("playerId");
const roomRef = doc(db, "rooms", rId);
const modePilihan = localStorage.getItem("mode") || "spirit";
const MAX_KARTU = modePilihan === "spirit" ? 3 : 4;

function getDots(num, isHidden) {
    if (isHidden) return '<div class="card-back">❓</div>'; // Tampilan jika kartu tertutup
    const p = { 0:[], 1:[4], 2:[0,8], 3:[0,4,8], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8] };
    let h = '<div class="dot-container">';
    for(let i=0; i<9; i++) h += `<div class="dot ${p[num].includes(i)?'active':''}"></div>`;
    return h + '</div>';
}

// FUNGSI TOMBOL SIAP
window.setReady = async () => {
    const snap = await getDoc(roomRef);
    let { players } = snap.data();
    const idx = players.findIndex(p => p.id === pId);

    // Cek jika jumlah kartu sudah maksimal, tidak bisa siap lagi
    if (players[idx].cards.length >= MAX_KARTU) return alert("Kartu sudah maksimal!");

    // Set status pemain ini jadi SIAP
    players[idx].isReady = true;
    await updateDoc(roomRef, { players });
};

// LOGIKA PEMBAGIAN KARTU OTOMATIS (SINKRON)
async function bagiKartuOtomatis(data) {
    let { players, deck } = data;
    
    // Cek apakah SEMUA pemain sudah menekan SIAP
    const semuaSiap = players.every(p => p.isReady === true);
    
    if (semuaSiap && deck.length > 0) {
        // Berikan 1 kartu ke setiap pemain
        players = players.map(p => {
            if (p.cards.length < MAX_KARTU) {
                p.cards.push(deck.shift());
            }
            p.isReady = false; // Reset status siap untuk putaran kartu berikutnya
            return p;
        });

        await updateDoc(roomRef, { players, deck });
    }
}

window.mainLagi = async () => {
    const snap = await getDoc(roomRef);
    let ps = snap.data().players.map(p => ({...p, cards:[], isReady: false}));
    await updateDoc(roomRef, { players:ps, deck:buatDeck() });
};

onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    
    // Jalankan pengecekan sinkronisasi siap
    bagiKartuOtomatis(data);

    document.getElementById("infoDisplay").innerText = `MODE: ${modePilihan.toUpperCase()} (MAX ${MAX_KARTU}) | KODE: ${rId}`;
    
    // List Pemain & Status Siap
    document.getElementById("playerList").innerHTML = data.players.map(p => `
        <div class="player-item ${p.isReady ? 'ready-status' : ''}">
            <span>${p.name}</span>
            <span>${p.isReady ? '✅ SIAP' : '⏳ MENUNGGU'} (${p.cards.length} KRT)</span>
        </div>
    `).join('');

    const me = data.players.find(p => p.id === pId);
    if(me) {
        document.getElementById("myCardsArea").innerHTML = me.cards.map((c, index) => {
            // Logika: Kartu terakhir yang baru diambil dalam keadaan TERBUKA, sisanya TERTUTUP (atau bisa diset tertutup semua)
            // Jika ingin SEMUA tertutup sampai permainan dimulai, hapus kondisi index.
            const isHidden = true; 
            return `
                <div class="domino-card-real ${isHidden ? 'hidden-style' : ''}">
                    ${getDots(c.left, isHidden)}
                    <div class="line"></div>
                    ${getDots(c.right, isHidden)}
                </div>
            `;
        }).join('');
    }
});
