import { db } from "./firebase.js";
import { doc, setDoc, updateDoc, onSnapshot, collection, getDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const name = localStorage.getItem("playerName");
document.getElementById("roomCode").innerText = roomId;

const playerId = Date.now().toString();
const roomRef = doc(db,"rooms",roomId);

startGame(); // ⬅️ PENTING

// ================== SEMUA KODE JALAN DI SINI ==================
async function startGame(){

  // MASUKKAN PLAYER
  await setDoc(doc(db,"rooms",roomId,"players",playerId),{
    name:name,
    ready:false,
    cards:[]
  });

  // TOMBOL READY
  window.readyUp = async function(){
    await updateDoc(doc(db,"rooms",roomId,"players",playerId),{ready:true});
  }

  // LISTENER PEMAIN + LOGIKA GAME
  onSnapshot(collection(db,"rooms",roomId,"players"), async snap=>{
    let html="";
    let players=[];
    let allReady=true;

    snap.forEach(docSnap=>{
      const p=docSnap.data();
      players.push({id:docSnap.id, ...p});
      html+=`<div>${p.name} ${p.ready?"✅":"⏳"}</div>`;
      if(!p.ready) allReady=false;
    });

    document.getElementById("players").innerHTML=html;

    const roomSnap = await getDoc(roomRef);
    const room = roomSnap.data();

    // BUAT BOT
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
      return;
    }

    // START GAME
    if(allReady && !room.gameStarted){
      await updateDoc(roomRef,{gameStarted:true});

      let deck = buatDeck();

      for(let p of players){
        let card = deck.pop();
        await updateDoc(doc(db,"rooms",roomId,"players",p.id),{
          cards:[card]
        });
      }

      await updateDoc(roomRef,{deck:deck});
      console.log("Game dimulai");
    }
  });

}
