import { db } from "./firebase.js";
import { doc, setDoc, updateDoc, onSnapshot, collection } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck, hitungPoint } from "./game.js";

const roomId = localStorage.getItem("roomId");
const name = localStorage.getItem("playerName");
document.getElementById("roomCode").innerText = roomId;

const playerId = Date.now().toString();

await setDoc(doc(db,"rooms",roomId,"players",playerId),{
  name:name,
  ready:false,
  cards:[]
});
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


window.readyUp = async function(){
  await updateDoc(doc(db,"rooms",roomId,"players",playerId),{ready:true});
}

onSnapshot(collection(db,"rooms",roomId,"players"), snap=>{
  let html="";
  snap.forEach(doc=>{
    const p=doc.data();
    html+=`<div>${p.name} ${p.ready?"✅":"⏳"}</div>`;
  });
  document.getElementById("players").innerHTML=html;
});
  snap.forEach(docSnap=>{
    const p = docSnap.data();
    if(p.isBot){
      setTimeout(()=>{
        let point = hitungPoint(p.cards || []);
        if(point < 6){
          console.log(p.name+" ambil kartu");
        } else {
          console.log(p.name+" stop");
        }
      },1500);
    }
  });
