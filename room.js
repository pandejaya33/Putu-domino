import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName");

const roomRef = doc(db, "rooms", roomId);

// 1. Inisialisasi Room
async function initRoom() {
  const snap = await getDoc(roomRef);
  if (!snap.exists()) {
    await setDoc(roomRef, { 
      players: [{ id: myId, name: myName, ready: false, cards: [], revealed: [] }], 
      started: false, 
      deck: buatDeck() 
    });
  } else {
    const room = snap.data();
    if (!room.players.find(p => p.id === myId)) {
      await updateDoc(roomRef, { 
        players: [...room.players, { id: myId, name: myName, ready: false, cards: [], revealed: [] }] 
      });
    }
  }
}
initRoom();

// 2. Monitoring Perubahan Data
onSnapshot(roomRef, (snap) => {
  if (!snap.exists()) return;
  const room = snap.data();
  const me = room.players.find(p => p.id === myId);

  // Tampilkan Nama Pemain & Jumlah Kartu
  const list = document.getElementById("playerList");
  list.innerHTML = room.players.map(p => `
    <div class="player-item">
      ${p.name} | ${p.ready ? '✅' : '⏳'} (${p.cards.length} kartu)
    </div>
  `).join("");

  // Tampilkan Kartu (Hanya yang ada di array me.cards)
  const area = document.getElementById("kartuSaya");
  area.innerHTML = "";
  if (me && me.cards) {
    me.cards.forEach((c, i) => {
      const div = document.createElement("div");
      div.className = "dominoCard";
      if (me.revealed && me.revealed.includes(i)) {
        const [a, b] = c.split("|");
        div.innerHTML = `<div class="half">${drawDots(a)}</div><div class="divider"></div><div class="half">${drawDots(b)}</div>`;
      } else {
        div.innerHTML = `<div class="back"></div>`;
      }
      div.onclick = () => bukaKartu(i);
      area.appendChild(div);
    });
  }

  // Tampilkan Tombol Lanjut hanya jika sudah mulai
  document.getElementById("btnLanjut").style.display = room.started ? "block" : "none";

  // Logika MULAI: Jika semua ready, panggil pembagian 1 kartu
  if (!room.started && room.players.length >= 2 && room.players.every(p => p.ready)) {
    bagikanSatuKartuSaja(room);
  }
});

// FUNGSI INI ADALAH KUNCI: HANYA MEMBERIKAN 1 KARTU
async function bagikanSatuKartuSaja(room) {
  let deck = [...room.deck];
  const updatedPlayers = room.players.map(p => {
    const k = deck.pop(); // Ambil cuma 1 kartu dari deck
    return { 
      ...p, 
      cards: [`${k.left}|${k.right}`], // Array ini dipaksa hanya berisi 1 string kartu
      revealed: [] 
    };
  });

  await updateDoc(roomRef, { 
    started: true, 
    players: updatedPlayers, 
    deck: deck 
  });
}

// Ambil kartu tambahan (Satu per satu)
window.ambilKartuLanjut = async () => {
  const snap = await getDoc(roomRef);
  const room = snap.data();
  let deck = [...room.deck];
  let players = [...room.players];
  const myIdx = players.findIndex(p => p.id === myId);

  if (deck.length > 0) {
    const k = deck.pop();
    players[myIdx].cards.push(`${k.left}|${k.right}`);
    await updateDoc(roomRef, { players, deck });
  }
};

window.setReady = async () => {
  const snap = await getDoc(roomRef);
  const players = [...snap.data().players];
  const idx = players.findIndex(p => p.id === myId);
  players[idx].ready = true;
  await updateDoc(roomRef, { players });
};

window.bukaKartu = async (i) => {
  const snap = await getDoc(roomRef);
  const room = snap.data();
  const players = [...room.players];
  const idx = players.findIndex(p => p.id === myId);
  if (!players[idx].revealed) players[idx].revealed = [];
  if (!players[idx].revealed.includes(i)) {
    players[idx].revealed.push(i);
    await updateDoc(roomRef, { players });
  }
};

function drawDots(n) {
  const dots = { 0:[], 1:[5], 2:[1,9], 3:[1,5,9], 4:[1,3,7,9], 5:[1,3,5,7,9], 6:[1,3,4,6,7,9] };
  let g = "";
  for(let i=1; i<=9; i++) g += `<div class="dot ${dots[parseInt(n)].includes(i)?'on':''}"></div>`;
  return `<div class="grid">${g}</div>`;
}

window.mainLagi = async () => {
  await updateDoc(roomRef, { started: false, deck: buatDeck(), players: [] });
  window.location.reload();
};
