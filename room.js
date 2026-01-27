import { db } from "./firebase.js";
import {
  doc, setDoc, updateDoc, onSnapshot, collection, getDoc
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

  // ========= TOMBOL READY =========
  window.readyUp = async function () {
    await updateDoc(doc(db, "rooms", roomId, "players", playerId), {
      ready: true
    });
  };

  // ========= LIST PEMAIN + GAME FLOW =========
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
      await updateDoc(roomRef, { gameStarted: true });

      let deck = buatDeck();

      for (let p of players) {
        let card = deck.pop();
await updateDoc(doc(db,"rooms",roomId,"players",p.id),{
  cards:[{left: card[0], right: card[1]}]
});
      }

      await updateDoc(roomRef, { deck: deck });
      console.log("Game dimulai");
    }
  });

  // ========= TAMPILKAN KARTU PEMAIN =========
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
}
