import { db } from "./firebase.js";
import { doc, setDoc, updateDoc, onSnapshot, collection, getDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck, hitungPoint } from "./game.js";

const roomId = localStorage.getItem("roomId");
const name = localStorage.getItem("playerName");
document.getElementById("roomCode").innerText = roomId;

const playerId = Date.now().toString();

// ================= PEMAIN MASUK =================
await setDoc(doc(db,"rooms",roomId,"players",playerId),{
  name:name,
  ready:false,
  cards:[]
});

// ================= BUAT BOT =================
const roomRef = doc(db,"rooms",roomId);

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

// ================= TOMBOL READY =================
window.readyUp = async function(){
  await updateDoc(doc(db,"rooms",roomId,"players",playerId),{ready:true});
}

// ================= LIST PEMAIN + CEK START GAME =================
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

  // ====== JIKA SEMUA READY → BAGI KARTU ======
  // ===== START GAME SAAT SEMUA READY =====
if(allReady){
  const roomSnap = await getDoc(roomRef);
  const room = roomSnap.data();

  if(room.gameStarted) return; // ⛔ sudah mulai, hentikan

  // tandai game mulai dulu
  await updateDoc(roomRef,{ gameStarted:true });

  let deck = buatDeck();

  // bagikan 1 kartu ke tiap pemain
  for(let p of players){
    let card = deck.pop();
    await updateDoc(doc(db,"rooms",roomId,"players",p.id),{
      cards:[card]
    });
  }

  // simpan sisa deck
  await updateDoc(roomRef,{ deck:deck });

  console.log("Game dimulai, kartu dibagikan");
} // biar cuma sekali
      let deck = buatDeck();

      await updateDoc(roomRef,{deck:deck});

      for(let p of players){
        let card = deck.pop();
        await updateDoc(doc(db,"rooms",roomId,"players",p.id),{
          cards:[card]
        });
      }

      console.log("Kartu pertama sudah dibagikan");
    }
  }
});
