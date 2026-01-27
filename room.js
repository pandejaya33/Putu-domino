import { db } from "./firebase.js";
import {
  doc, setDoc, updateDoc, onSnapshot,
  collection, getDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const name = localStorage.getItem("playerName");
const playerId = Date.now().toString();
const roomRef = doc(db, "rooms", roomId);

document.getElementById("roomCode").innerText = roomId;

start();

async function start() {

  // ========= MASUKKAN PLAYER =========
  await setDoc(doc(db, "rooms", roomId, "players", playerId), {
    name: name,
    ready: false,
    cards: []
  });

  // ========= READY =========
  window.readyUp = async function () {
    await updateDoc(doc(db, "rooms", roomId, "players", playerId), {
      ready: true
    });
  };

  // ========= LIST PEMAIN + START GAME =========
  onSnapshot(collection(db, "rooms", roomId, "players"), async snap => {
    let players = [];
    let allReady = true;
    let html = "";

    snap.forEach(d => {
      const p = d.data();
      players.push({ id: d.id, ...p });
      html += `<div>${p.name} ${p.ready ? "✅" : "⏳"}</div>`;
      if (!p.ready) allReady = false;
    });

    document.getElementById("players").innerHTML = html;

    const roomSnap = await getDoc(roomRef);
    const room = roomSnap.data() || {};

    // ========= BUAT BOT =========
    if (room.botCount && !room.botsCreated) {
      for (let i = 1; i <= room.botCount; i++) {
        await setDoc(doc(db, "rooms", roomId, "players", "bot" + i), {
          name: "Bot " + i,
          ready: true,
          isBot: true,
          cards: []
        });
      }
      await updateDoc(roomRef, { botsCreated: true });
      return;
    }

    // ========= START GAME =========
    if (allReady && !room.gameStarted) {
      let deck = buatDeck();

      for (let p of players) {
        let card = deck.pop();
        await updateDoc(doc(db, "rooms", roomId, "players", p.id), {
          cards: [{ left: card[0], right: card[1] }]
        });
      }

      await updateDoc(roomRef, {
        deck: deck,
        gameStarted: true,
        turn: players[0].id
      });

      console.log("Game dimulai");
    }
  });

  // ========= TAMPILKAN KARTU =========
  onSnapshot(doc(db, "rooms", roomId, "players", playerId), docSnap => {
    const data = docSnap.data();
    if (!data || !data.cards) return;

    let html = "";
    data.cards.forEach(c => {
      html += `
        <div style="
          display:inline-block;
          padding:12px;
          margin:6px;
          border-radius:8px;
          background:white;
          color:black;
          font-weight:bold;
          min-width:50px;
          text-align:center;">
          ${c.left} | ${c.right}
        </div>
      `;
    });

    document.getElementById("myCards").innerHTML = html;
  });

  // ========= TAMPILKAN TOMBOL GILIRAN =========
  onSnapshot(roomRef, snap => {
    const room = snap.data();
    if (!room || !room.turn) return;

    if (room.turn === playerId) {
      document.getElementById("drawBtn").style.display = "inline-block";
      document.getElementById("passBtn").style.display = "inline-block";
    } else {
      document.getElementById("drawBtn").style.display = "none";
      document.getElementById("passBtn").style.display = "none";
    }
  });

}

// ========= AMBIL KARTU =========
window.drawCard = async function () {
  const roomSnap = await getDoc(roomRef);
  let deck = roomSnap.data().deck;
  if (!deck || deck.length === 0) return;

  const card = deck.pop();

  const playerRef = doc(db, "rooms", roomId, "players", playerId);
  const playerSnap = await getDoc(playerRef);
  let cards = playerSnap.data().cards || [];

  cards.push({ left: card[0], right: card[1] });

  await updateDoc(playerRef, { cards: cards });
  await nextTurn(deck);
};

// ========= TIDAK AMBIL =========
window.passTurn = async function () {
  const roomSnap = await getDoc(roomRef);
  await nextTurn(roomSnap.data().deck);
};

// ========= PINDAH GILIRAN =========
async function nextTurn(deck) {
  const snap = await getDocs(collection(db, "rooms", roomId, "players"));
  let ids = [];
  snap.forEach(d => ids.push(d.id));

  const roomSnap = await getDoc(roomRef);
  let current = roomSnap.data().turn;

  let index = ids.indexOf(current);
  let next = ids[(index + 1) % ids.length];

  await updateDoc(roomRef, {
    turn: next,
    deck: deck
  });
}
