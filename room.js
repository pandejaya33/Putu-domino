import { db } from "./firebase.js";
import { doc, setDoc, updateDoc, onSnapshot, collection } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const name = localStorage.getItem("playerName");
document.getElementById("roomCode").innerText = roomId;

const playerId = Date.now().toString();

await setDoc(doc(db,"rooms",roomId,"players",playerId),{
  name:name,
  ready:false,
  cards:[]
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