import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId") || "p_" + Math.random().toString(36).substr(2, 9);
const myName = localStorage.getItem("playerName") || "Guest";
const myMode = localStorage.getItem("mode") || "spirit";

if (!localStorage.getItem("playerId")) localStorage.setItem("playerId", myId);

const roomRef = doc(db, "rooms", roomId);
document.getElementById("roomCode").innerText = roomId;

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

onSnapshot(roomRef, (snap) => {
  if (!snap.exists()) return;
  const room = snap.data();
  const me = room.players.find(p => p.id === myId);

  // Render Daftar Pemain
  const list = document.getElementById("playerList");
  list.innerHTML = room.players.map(p => `
    <div class="player-item">
      <span>${p.isBot ? '🤖' : '👤'} ${p.name}</span> 
      <span>${p.ready ? '✅' : '⏳'} (${p.cards.length})</span>
    </div>
  `).join("");

  // Render Kartu Saya
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

  // Tombol Lanjut
  const btnLanjut = document.getElementById("btnLanjut");
  const maxKartu = room.mode === "spirit" ? 3 : 4;
  btnLanjut.style.display = (room.started && me && me.cards.length > 0 && me.cards.length < maxKartu) ? "block" : "none";
  document.getElementById("btnBot").style.display = room.started ? "none" : "block";

  // Auto Start jika semua Ready
  if (!room.started && room.players.length >= 2 && room.players.every(p => p.ready)) {
    mulaiSesi(room);
  }
});

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

async function mulaiSesi(room) {
  const deck = [...room.deck];
  const updatedPlayers = room.players.map(p => {
    const k = deck.pop();
    return { ...p, cards: [`${k.left}|${k.right}`], revealed: p.isBot ? [0] : [] };
  });
  await updateDoc(roomRef, { started: true, players: updatedPlayers, deck: deck });
}

window.ambilKartuLanjut = async () => {
  const snap = await getDoc(roomRef);
  const room = snap.data();
  let deck = [...room.deck];
  let players = [...room.players];
  
  const myIdx = players.findIndex(p => p.id === myId);
  const kMe = deck.pop();
  players[myIdx].cards.push(`${kMe.left}|${kMe.right}`);

  players.forEach(p => {
    if (p.isBot && deck.length > 0) {
      const kBot = deck.pop();
      p.cards.push(`${kBot.left}|${kBot.right}`);
      p.revealed.push(p.cards.length - 1); 
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
