import { db } from "./firebase.js";
import { doc, setDoc, updateDoc, onSnapshot, collection, getDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const name = localStorage.getItem("playerName");
document.getElementById("roomCode").innerText = roomId;

const playerId = Date.now().toString();
const roomRef = doc(db,"rooms",roomId);

// ========= PEMAIN MASUK =========
await setDoc(doc(db,"rooms",roomId,"players",playerId),{
  name:name,
  ready:false,
  cards:[]
});

// ========= BUAT BOT =========
onSnapshot(roomRef, async (roomSnap)=>{
  const room = roomSnap.data();
  if(!room) return;

  if(room.botCount && !room.botsCreated){
    for(let i=1;i<=room.botCount;i++){
      await setDoc(doc(db,"rooms",roomId,"players","bot"+i),{
        name:"Bot "+i,
        ready:true,
        isBot:true,
        cards:[]
      });
    }
    await updateDoc(roomRef,{botsCreated:true});
  }
});

// ========= TOMBOL READY =========
window.readyUp = async function(){
  await updateDoc(doc(db,"rooms",roomId,"players",playerId),{ready:true});
}

// ========= LIST PEMAIN =========
onSnapshot(collection(db,"rooms",roomId,"players"), snap=>{
  let html="";
  snap.forEach(docSnap=>{
    const p=docSnap.data();
    html+=`<div>${p.name} ${p.ready?"✅":"⏳"}</div>`;
  });
  document.getElementById("players").innerHTML=html;
});

// ========= START GAME (TERPISAH SUPAYA TIDAK MERUSAK UI) =========
onSnapshot(collection(db,"rooms",roomId,"players"), async snap=>{
  let players=[];
  let allReady=true;

  snap.forEach(docSnap=>{
    const p=docSnap.data();
    players.push({id:docSnap.id, ...p});
    if(!p.ready) allReady=false;
  });

  if(!allReady) return;

  const roomSnap = await getDoc(roomRef);
  const room = roomSnap.data();

  if(room.gameStarted) return;

  await updateDoc(roomRef,{gameStarted:true});

  let deck = buatDeck();

  for(let p of players){
    let card = deck.pop();
    await updateDoc(doc(db,"rooms",roomId,"players",p.id),{
      cards:[card]
    });
  }

  await updateDoc(roomRef,{deck:deck});

  console.log("Game dimulai, kartu dibagikan");
});
