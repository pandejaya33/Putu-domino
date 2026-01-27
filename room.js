import { db } from "./firebase.js";
import { doc,setDoc,updateDoc,getDoc,getDocs,onSnapshot,collection }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck,hitungSpirit,semuaSelesaiSpirit,semuaSelesaiBrerong } from "./game.js";

const roomId=localStorage.getItem("roomId");
const name=localStorage.getItem("playerName");
const mode=localStorage.getItem("mode")||"spirit";
const playerId=Date.now().toString();

const roomRef=doc(db,"rooms",roomId);
roomCode.innerText=roomId;
modeText.innerText="Mode: "+mode;

init();

async function init(){
 await setDoc(doc(db,"rooms",roomId,"players",playerId),{
  name,ready:false,cards:[],score:0
 });
 tampilPemain(); tampilKartu(); kontrolGiliran();
}

window.readyUp=async()=>{
 await updateDoc(doc(db,"rooms",roomId,"players",playerId),{ready:true});
 const snap=await getDocs(collection(db,"rooms",roomId,"players"));
 let ids=[],allReady=true;
 snap.forEach(d=>{ids.push(d.id); if(!d.data().ready) allReady=false;});
 if(!allReady) return;

 let deck=buatDeck();
 for(let id of ids){
  await updateDoc(doc(db,"rooms",roomId,"players",id),{cards:[deck.pop()]});
 }

 await setDoc(roomRef,{deck,turn:ids[0],gameStarted:true,mode});
};

function tampilPemain(){
 onSnapshot(collection(db,"rooms",roomId,"players"),snap=>{
  let html="";
  snap.forEach(d=>{
   let p=d.data();
   html+=`<div>${p.name} | Kartu:${p.cards.length} | Skor:${p.score||0}</div>`;
  });
  players.innerHTML=html;
 });
}

function renderDots(n){
  return "●".repeat(n);
}

function tampilKartu(){
 onSnapshot(doc(db,"rooms",roomId,"players",playerId),snap=>{
  let html="";
  snap.data()?.cards.forEach((c,i)=>{
   if(!c.open){
     html+=`<div onclick="bukaKartu(${i})" style="width:60px;height:110px;
     background:#1f2937;border-radius:10px;display:inline-block;margin:6px;"></div>`;
   }else{
     html+=`<div style="width:60px;height:110px;background:white;color:black;
     border-radius:10px;display:inline-flex;flex-direction:column;
     justify-content:space-around;align-items:center;margin:6px;font-size:18px;">
     <div>${renderDots(c.left)}</div><div>${renderDots(c.right)}</div></div>`;
   }
  });
  myCards.innerHTML=html;
 });
}

window.bukaKartu=async(index)=>{
 let pRef=doc(db,"rooms",roomId,"players",playerId);
 let snap=await getDoc(pRef);
 let cards=snap.data().cards;
 cards[index].open=true;
 await updateDoc(pRef,{cards});
};

function kontrolGiliran(){
 onSnapshot(roomRef,snap=>{
  let room=snap.data(); if(!room) return;
  if(room.turn===playerId){drawBtn.style.display="inline";passBtn.style.display="inline";}
  else{drawBtn.style.display="none";passBtn.style.display="none";}
 });
}

window.drawCard=async()=>{
 let pRef=doc(db,"rooms",roomId,"players",playerId);
 let pSnap=await getDoc(pRef);
 let cards=pSnap.data().cards;

 if(mode==="spirit" && cards.length>=3) return alert("Maks 3 kartu");
 if(mode==="brerong" && cards.length>=4) return;

 let r=await getDoc(roomRef);
 let deck=r.data().deck;
 cards.push(deck.pop());

 await updateDoc(pRef,{cards});
 await nextTurn(deck);
};

window.passTurn=async()=>{
 let r=await getDoc(roomRef);
 await nextTurn(r.data().deck);
};

async function nextTurn(deck){
 const snap=await getDocs(collection(db,"rooms",roomId,"players"));
 let ids=[]; let playersData=[];
 snap.forEach(d=>{ids.push(d.id);playersData.push(d.data());});
 let r=await getDoc(roomRef);
 let next=ids[(ids.indexOf(r.data().turn)+1)%ids.length];

 await updateDoc(roomRef,{turn:next,deck});
 cekPemenang(playersData);
}

async function cekPemenang(players){
 if(mode==="spirit" && !semuaSelesaiSpirit(players)) return;
 if(mode==="brerong" && !semuaSelesaiBrerong(players)) return;

 let best=-1,winnerIndex=-1;
 players.forEach((p,i)=>{
  let pt=hitungSpirit(p.cards);
  if(pt>best){best=pt;winnerIndex=i;}
 });

 if(winnerIndex>=0){
  winnerText.innerText="Pemenang ditemukan!";
 }
}
