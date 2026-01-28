import { db } from "./firebase.js";
import {
  doc, onSnapshot, updateDoc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName");

if (!roomId || !myId) { window.location.href = "index.html"; }

const roomRef = doc(db, "rooms", roomId);
let playersData = [];

document.getElementById("roomCode").innerText = roomId;

// --- FUNGSI DAFTAR PEMAIN (Sangat Penting) ---
async function gabungKeRoom() {
  const snap = await getDoc(roomRef);
  const pData = { id: myId, name: myName, ready: false, cards: [], revealed: [] };

  if (!snap.exists()) {
    // Jika room belum ada, buat baru
    await setDoc(roomRef, { players: [pData], started: false, deck: [] });
  } else {
    // Jika room sudah ada, ambil data lama dan tambahkan diri sendiri jika belum ada
    const room = snap.data();
    const sudahAda = room.players.find(p => p.id === myId);
    if (!sudahAda) {
      const listBaru = [...room.players, pData];
      await updateDoc(roomRef, { players: listBaru });
    }
  }
}
gabungKeRoom();

// --- LISTENER (Melihat Pemain Lain) ---
onSnapshot(roomRef, (snap) => {
  if (!snap.exists()) return;
  const room = snap.data();
  playersData = room.players || [];

  renderPemain(playersData);
  renderKartuSaya();

  // Atur Tombol
  const btnAmbil = document.getElementById("btnAmbil");
  const btnReady = document.getElementById("btnReady");

  if (room.started) {
    btnAmbil.style.display = "block";
    btnReady.style.display = "none";
  } else {
    btnAmbil.style.display = "block";
    btnReady.style.display = "block";
    // Mulai jika minimal 2 orang dan semua ready
    if (playersData.length >= 2 && playersData.every(p => p.ready)) {
      mulaiGame(room);
    }
  }
});

function renderPemain(players) {
  const list = document.getElementById("playerList");
  list.innerHTML = "";
  players.forEach((p) => {
    const status = p.ready ? "✅ Ready" : "⏳ Menunggu";
    list.innerHTML += `<div class="player-item"><span>${p.name}</span> <span>${status}</span></div>`;
  });
}

window.setReady = async function() {
  const snap = await getDoc(roomRef);
  const room = snap.data();
  const idx = room.players.findIndex(p => p.id === myId);
  if (idx !== -1) {
    room.players[idx].ready = true;
    await updateDoc(roomRef, { players: room.players });
  }
};

async function mulaiGame(room) {
  if (room.started) return;
  const deck = buatDeck();
  const mode = localStorage.getItem("mode") || "spirit";
  const jml = (mode === "spirit") ? 2 : 4;

  const updatedPlayers = room.players.map(p => {
    let tangan = [];
    for (let i = 0; i < jml; i++) {
      let k = deck.pop();
      tangan.push(`${k.left}|${k.right}`);
    }
    return { ...p, cards: tangan, revealed: [], ready: true };
  });

  await updateDoc(roomRef, { started: true, players: updatedPlayers, deck: deck });
}

window.ambilKartu = async function() {
  const snap = await getDoc(roomRef);
  const room = snap.data();
  if (!room.deck || room.deck.length === 0) return alert("Kartu habis!");
  
  const pIdx = room.players.findIndex(p => p.id === myId);
  const k = room.deck.pop();
  room.players[pIdx].cards.push(`${k.left}|${k.right}`);
  
  await updateDoc(roomRef, { players: room.players, deck: room.deck });
};

function renderKartuSaya() {
  const area = document.getElementById("kartuSaya");
  area.innerHTML = "";
  const me = playersData.find(p => p.id === myId);
  if (!me || !me.cards) return;

  me.cards.forEach((c, i) => {
    const isOpen = me.revealed?.includes(i);
    const div = document.createElement("div");
    div.className = "dominoCard";
    if (isOpen) {
      const [a, b] = c.split("|").map(Number);
      div.innerHTML = `<div class="half">${drawDots(a)}</div><div class="divider"></div><div class="half">${drawDots(b)}</div>`;
    } else {
      div.innerHTML = `<div class="back"></div>`;
    }
    div.onclick = () => bukaKartu(i);
    area.appendChild(div);
  });
}

window.bukaKartu = async function(i) {
  const snap = await getDoc(roomRef);
  const room = snap.data();
  const pIdx = room.players.findIndex(p => p.id === myId);
  if (!room.players[pIdx].revealed) room.players[pIdx].revealed = [];
  if (!room.players[pIdx].revealed.includes(i)) {
    room.players[pIdx].revealed.push(i);
    await updateDoc(roomRef, { players: room.players });
  }
};

function drawDots(n) {
  const dots = { 0:[], 1:[5], 2:[1,9], 3:[1,5,9], 4:[1,3,7,9], 5:[1,3,5,7,9], 6:[1,3,4,6,7,9] };
  let g = "";
  for(let i=1; i<=9; i++) g += `<div class="dot ${dots[n].includes(i)?'on':''}"></div>`;
  return `<div class="grid">${g}</div>`;
}

window.mainLagi = async () => {
  const snap = await getDoc(roomRef);
  const room = snap.data();
  await updateDoc(roomRef, { 
    started: false, 
    deck: [],
    players: room.players.map(p => ({...p, ready: false, cards: [], revealed: []})) 
  });
};
