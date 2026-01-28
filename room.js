import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName");
const myMode = localStorage.getItem("mode") || "spirit";

const roomRef = doc(db, "rooms", roomId);

// 1. INISIALISASI ROOM
async function initRoom() {
  const snap = await getDoc(roomRef);
  const me = { id: myId, name: myName, ready: false, cards: [], revealed: [], isBot: false };

  if (!snap.exists()) {
    await setDoc(roomRef, { players: [me], started: false, deck: buatDeck(), mode: myMode });
  } else {
    const room = snap.data();
    if (!room.players.find(p => p.id === myId)) {
      await updateDoc(roomRef, { players: [...room.players, me] });
    }
  }
}
initRoom();

// 2. MONITORING DATA (REALTIME)
onSnapshot(roomRef, (snap) => {
  if (!snap.exists()) return;
  const room = snap.data();
  const me = room.players.find(p => p.id === myId);

  // Update Daftar Pemain
  document.getElementById("roomCode").innerText = roomId;
  const list = document.getElementById("playerList");
  list.innerHTML = room.players.map(p => `
    <div class="player-item">
      <span>${p.isBot ? '🤖' : '👤'} ${p.name}</span> 
      <span>${p.ready ? '✅' : '⏳'} (${p.cards.length} Krt)</span>
    </div>
  `).join("");

  // Tampilkan Kartu Saya
  const area = document.getElementById("kartuSaya");
  area.innerHTML = "";
  if (me && me.cards) {
    me.cards.forEach((c, i) => {
      const div = document.createElement("div");
      div.className = "dominoCard";
      const isOpened = me.revealed?.includes(i);
      if (isOpened) {
        const [a, b] = c.split("|");
        div.innerHTML = `<div class="half">${drawDots(a)}</div><div class="divider"></div><div class="half">${drawDots(b)}</div>`;
      } else {
        div.innerHTML = `<div class="back"></div>`;
      }
      div.onclick = () => bukaKartu(i);
      area.appendChild(div);
    });
  }

  // Kontrol Tombol
  const maxKartu = room.mode === "spirit" ? 3 : 4;
  document.getElementById("btnLanjut").style.display = (room.started && me && me.cards.length > 0 && me.cards.length < maxKartu) ? "block" : "none";
  document.getElementById("btnBot").style.display = room.started ? "none" : "block";

  // LOGIKA PEMBAGIAN KARTU PERTAMA (HANYA 1 KARTU)
  if (!room.started && room.players.length >= 2 && room.players.every(p => p.ready)) {
    prosesMulaiGame(room);
  }
});

// 3. FUNGSI MULAI GAME (PASTI 1 KARTU)
async function prosesMulaiGame(room) {
  let deck = [...room.deck];
  const updatedPlayers = room.players.map(p => {
    const k = deck.pop(); // Ambil 1 kartu saja
    return { 
      ...p, 
      cards: [`${k.left}|${k.right}`], // Array hanya berisi 1 kartu
      revealed: p.isBot ? [0] : []     // Bot otomatis buka kartu ke-1
    };
  });
  
  await updateDoc(roomRef, { 
    started: true, 
    players: updatedPlayers, 
    deck: deck 
  });
}

// 4. FUNGSI TAMBAH BOT (MAS J, MANGKU, DONTOL)
window.tambahBot = async () => {
  const snap = await getDoc(roomRef);
  const room = snap.data();
  const bots = [
    { id: "bot1", name: "Mas J", ready: true, cards: [], revealed: [], isBot: true },
    { id: "bot2", name: "Mangku", ready: true, cards: [], revealed: [], isBot: true },
    { id: "bot3", name: "Dontol", ready: true, cards: [], revealed: [], isBot: true }
  ];
  await updateDoc(roomRef, { players: [...room.players, ...bots] });
};

window.setReady = async () => {
  const snap = await getDoc(roomRef);
  const players = [...snap.data().players];
  const idx = players.findIndex(p => p.id === myId);
  players[idx].ready = true;
  await updateDoc(roomRef, { players });
};

window.ambilKartuLanjut = async () => {
  const snap = await getDoc(roomRef);
  const room = snap.data();
  let deck = [...room.deck];
  let players = [...room.players];
  
  // Semua pemain (Termasuk Bot) ambil 1 kartu tambahan
  players.forEach(p => {
    if (deck.length > 0) {
      const k = deck.pop();
      p.cards.push(`${k.left}|${k.right}`);
      if (p.isBot) p.revealed.push(p.cards.length - 1);
    }
  });

  await updateDoc(roomRef, { players, deck });
};

window.bukaKartu = async (i) => {
  const snap = await getDoc(roomRef);
  const players = [...snap.data().players];
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
