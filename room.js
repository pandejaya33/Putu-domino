import { db } from "./firebase.js";
import {
  doc,
  onSnapshot,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId   = localStorage.getItem("playerId");

let playersData = [];
const roomRef = doc(db, "rooms", roomId);



// ================= REALTIME LISTENER =================
onSnapshot(roomRef, (snap) => {
  if (!snap.exists()) return;

  let room = snap.data();
  playersData = room.players || [];

  renderPemain(playersData);
  renderKartuSaya();
});



// ================= RENDER DAFTAR PEMAIN =================
function renderPemain(players) {
  const list = document.getElementById("playerList");
  list.innerHTML = "";

  players.forEach(p => {
    list.innerHTML += `<div>${p.name} | Kartu: ${p.cards.length}</div>`;
  });
}



// ================= GAMBAR TITIK DOMINO =================
function gambarTitik(n) {
  const dots = {
    0: [],
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9]
  };

  let grid = "";
  for (let i = 1; i <= 9; i++) {
    grid += `<div class="dot ${dots[n].includes(i) ? "on" : ""}"></div>`;
  }
  return `<div class="grid">${grid}</div>`;
}



// ================= RENDER KARTU SAYA =================
function renderKartuSaya() {
  const area = document.getElementById("kartuSaya");
  area.innerHTML = "";

  let me = playersData.find(p => p.id === myId);
  if (!me) return;

  me.cards.forEach((card, i) => {
    let opened = me.revealed?.includes(i);
    let div = document.createElement("div");
    div.className = "dominoCard";

    if (opened) {
      let [a, b] = card.split("|").map(Number);
      div.innerHTML = `
        <div class="half">${gambarTitik(a)}</div>
        <div class="divider"></div>
        <div class="half">${gambarTitik(b)}</div>
      `;
    } else {
      div.innerHTML = `<div class="back"></div>`;
    }

    div.onclick = () => bukaKartu(i);
    area.appendChild(div);
  });
}



// ================= BUKA KARTU SAAT DIKETUK =================
window.bukaKartu = async function(index) {
  const snap = await getDoc(roomRef);
  let room = snap.data();

  let me = room.players.find(p => p.id === myId);
  if (!me.revealed) me.revealed = [];

  if (!me.revealed.includes(index)) {
    me.revealed.push(index);
  }

  await updateDoc(roomRef, { players: room.players });
};



// ================= MAIN LAGI (RESET RONDE) =================
window.mainLagi = async function() {
  let deck = buatDeck().sort(() => Math.random() - 0.5);

  let snap = await getDoc(roomRef);
  let room = snap.data();

  let players = room.players.map(p => ({
    ...p,
    cards: [],
    revealed: [],
    ready: false,
    stand: false
  }));

  await updateDoc(roomRef, {
    deck: deck,
    players: players,
    turn: 0,
    started: true
  });
};
