import { db } from "./firebase.js";
import {
  doc, onSnapshot, updateDoc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName");

if (!roomId || !myId) {
  window.location.href = "index.html";
}

const roomRef = doc(db, "rooms", roomId);
let playersData = [];

document.getElementById("roomCode").innerText = roomId;

// DAFTARKAN DIRI KE ROOM
async function initRoom() {
  const snap = await getDoc(roomRef);
  let pData = { id: myId, name: myName, ready: false, cards: [], revealed: [] };

  if (!snap.exists()) {
    await setDoc(roomRef, {
      players: [pData],
      started: false,
      turn: 0,
      deck: []
    });
  } else {
    let room = snap.data();
    if (!room.players.find(p => p.id === myId)) {
      room.players.push(pData);
      await updateDoc(roomRef, { players: room.players });
    }
  }
}
initRoom();

// LISTEN DATA REALTIME
onSnapshot(roomRef, (snap) => {
  if (!snap.exists()) return;
  const room = snap.data();
  playersData = room.players;

  renderPemain(room.players, room.turn);
  renderKartuSaya();

  if (!room.started) {
    cekMulaiOtomatis(room);
  }
});

function renderPemain(players, turn) {
  const list = document.getElementById("playerList");
  list.innerHTML = "";
  players.forEach((p, i) => {
    let status = p.ready ? "✅" : "⏳";
    let giliran = i === turn ? "🎯 " : "";
    list.innerHTML += `<div style="margin:5px 0;">${giliran}${p.name} ${status}</div>`;
  });
}

window.setReady = async function() {
  const snap = await getDoc(roomRef);
  let room = snap.data();
  let idx = room.players.findIndex(p => p.id === myId);
  if (idx !== -1) {
    room.players[idx].ready = true;
    await updateDoc(roomRef, { players: room.players });
  }
};

async function cekMulaiOtomatis(room) {
  if (room.players.length < 2) return;
  if (room.players.every(p => p.ready)) {
    let deck = buatDeck();
    let mode = localStorage.getItem("mode") || "spirit";
    let jml = mode === "spirit" ? 2 : 4;

    let updatedPlayers = room.players.map(p => {
      let tangan = [];
      for (let i = 0; i < jml; i++) {
        let k = deck.pop();
        tangan.push(`${k.left}|${k.right}`);
      }
      return { ...p, cards: tangan, ready: true };
    });

    await updateDoc(roomRef, {
      started: true,
      players: updatedPlayers,
      deck: deck
    });
  }
}

function renderKartuSaya() {
  const area = document.getElementById("kartuSaya");
  area.innerHTML = "";
  let me = playersData.find(p => p.id === myId);
  if (!me || !me.cards) return;

  me.cards.forEach((c, i) => {
    let isOpen = me.revealed?.includes(i);
    let div = document.createElement("div");
    div.className = "dominoCard";
    if (isOpen) {
      let [a, b] = c.split("|").map(Number);
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
  let room = snap.data();
  let pIdx = room.players.findIndex(p => p.id === myId);
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

window.mainLagi = () => window.location.reload();
