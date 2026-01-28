import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName");
const myMode = localStorage.getItem("mode") || "spirit";
const roomRef = doc(db, "rooms", roomId);

let kunciBagi = false; // Mencegah bagi kartu 2x

async function initRoom() {
  const snap = await getDoc(roomRef);
  const me = { id: myId, name: myName, ready: false, cards: [], revealed: [], isBot: false };
  if (!snap.exists()) {
    await setDoc(roomRef, { players: [me], started: false, deck: buatDeck(), mode: myMode, hostId: myId });
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

  document.getElementById("roomCode").innerText = roomId;
  
  // Update List Pemain
  const list = document.getElementById("playerList");
  list.innerHTML = room.players.map(p => `
    <div class="player-item">
      <span>${p.isBot ? '🤖' : '👤'} ${p.name}</span> 
      <span>${p.ready ? '✅' : '⏳'} (${p.cards.length} krt)</span>
    </div>
  `).join("");

  // Update Kartu Saya
  const area = document.getElementById("kartuSaya");
  area.innerHTML = "";
  if (me && me.cards) {
    me.cards.forEach((c, i) => {
      const div = document.createElement("div");
      div.className = "dominoCard";
      if (me.revealed?.includes(i)) {
        const [a, b] = c.split("|");
        div.innerHTML = `<div class="half">${drawDots(a)}</div><div class="divider"></div><div class="half">${drawDots(b)}</div>`;
      } else {
        div.innerHTML = `<div class="back"></div>`;
      }
      div.onclick = () => bukaKartu(i);
      area.appendChild(div);
    });
  }

  // ATURAN LIMIT KARTU (SPIRIT 3, BRERONG 4)
  const maxKartu = room.mode === "spirit" ? 3 : 4;
  const btnLanjut = document.getElementById("btnLanjut");
  
  // Tombol HILANG jika kartu sudah mencapai batas maksimal
  if (room.started && me && me.cards.length > 0 && me.cards.length < maxKartu) {
    btnLanjut.style.display = "block";
  } else {
    btnLanjut.style.display = "none";
  }

  // BAGIKAN KARTU PERTAMA (DIPAKSA HANYA 1 KARTU)
  if (!room.started && room.players.length >= 2 && room.players.every(p => p.ready)) {
    if (room.hostId === myId && !kunciBagi) {
      kunciBagi = true; // Kunci biar tidak jalan 2x
      const deck = [...room.deck];
      const pBaru = room.players.map(p => {
        const k = deck.pop();
        return { ...p, cards: [`${k.left}|${k.right}`], revealed: [] };
      });
      updateDoc(roomRef, { started: true, players: pBaru, deck: deck });
    }
  }
});

window.ambilKartuLanjut = async () => {
  const snap = await getDoc(roomRef);
  const room = snap.data();
  const maxKartu = room.mode === "spirit" ? 3 : 4;
  let deck = [...room.deck];
  let players = [...room.players];
  const idx = players.findIndex(p => p.id === myId);

  // CEK LAGI SUPAYA TIDAK BISA TEMBUS LIMIT
  if (players[idx].cards.length < maxKartu) {
    const k = deck.pop();
    players[idx].cards.push(`${k.left}|${k.right}`);
    await updateDoc(roomRef, { players, deck });
  }
};

window.tambahBot = async () => {
  const snap = await getDoc(roomRef);
  const bots = [
    { id: "bot1", name: "Mas J", ready: true, cards: [], revealed: [], isBot: true },
    { id: "bot2", name: "Mangku", ready: true, cards: [], revealed: [], isBot: true },
    { id: "bot3", name: "Dontol", ready: true, cards: [], revealed: [], isBot: true }
  ];
  await updateDoc(roomRef, { players: [...snap.data().players, ...bots] });
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
