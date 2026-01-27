import { db } from "./firebase.js";
import { doc,setDoc,updateDoc,onSnapshot,collection,getDoc,getDocs }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId=localStorage.getItem("roomId");
const name=localStorage.getItem("playerName");
const playerId=Date.now().toString();
const roomRef=doc(db,"rooms",roomId);

roomCode.innerText=roomId;

init();

async function init(){

await setDoc(doc(db,"rooms",roomId,"players",playerId),{
  name:name,ready:false,cards:[]
});

window.readyUp=async()=>{
  await updateDoc(doc(db,"rooms",roomId,"players",playerId),{ready:true});
};

// tampil pemain
onSnapshot(collection(db,"rooms",roomId,"players"),snap=>{
  let html="";
  snap.forEach(d=>{
    let p=d.data();
    html+=`<div>${p.name} ${p.ready?"✅":"⏳"}</div>`;
  });
  players.innerHTML=html;
});

// mulai game sekali
onSnapshot(roomRef,async snap=>{
  let room=snap.data()||{};
  if(room.gameStarted) return;

  const ps=await getDocs(collection(db,"rooms",roomId,"players"));
  let ids=[], allReady=true;
  ps.forEach(d=>{
    ids.push(d.id);
    if(!d.data().ready) allReady=false;
  });

  if(!allReady) return;

  let deck=buatDeck();

  for(let id of ids){
    await updateDoc(doc(db,"rooms",roomId,"players",id),{
      cards:[deck.pop()]
    });
  }

  await updateDoc(roomRef,{deck:deck,turn:ids[0],gameStarted:true});
});

// tampil kartu
onSnapshot(doc(db,"rooms",roomId,"players",playerId),snap=>{
  let data=snap.data();
  if(!data) return;

  let html="";
  data.cards.forEach(c=>{
    html+=`<div style="display:inline-block;background:white;color:black;
    padding:12px;margin:6px;border-radius:8px;font-weight:bold;">
    ${c.left} | ${c.right}</div>`;
  });
  myCards.innerHTML=html;
});

// tombol giliran
onSnapshot(roomRef,snap=>{
  let room=snap.data();
  if(!room) return;
  if(room.turn===playerId){
    drawBtn.style.display="inline-block";
    passBtn.style.display="inline-block";
  }else{
    drawBtn.style.display="none";
    passBtn.style.display="none";
  }
});

}

// ambil kartu
window.drawCard=async()=>{
  let r=await getDoc(roomRef);
  let deck=r.data().deck;
  if(deck.length===0) return;

  let card=deck.pop();
  let pRef=doc(db,"rooms",roomId,"players",playerId);
  let pSnap=await getDoc(pRef);
  let cards=pSnap.data().cards;
  cards.push(card);

  await updateDoc(pRef,{cards:cards});
  await nextTurn(deck);
};

window.passTurn=async()=>{
  let r=await getDoc(roomRef);
  await nextTurn(r.data().deck);
};

async function nextTurn(deck){
  const snap=await getDocs(collection(db,"rooms",roomId,"players"));
  let ids=[];
  snap.forEach(d=>ids.push(d.id));

  let r=await getDoc(roomRef);
  let idx=ids.indexOf(r.data().turn);
  let next=ids[(idx+1)%ids.length];

  await updateDoc(roomRef,{turn:next,deck:deck});
}
