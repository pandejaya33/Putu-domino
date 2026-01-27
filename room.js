import { db } from "./firebase.js";
import { doc,setDoc,updateDoc,getDoc,getDocs,onSnapshot,collection }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck,hitungSpirit,cekBrerong } from "./game.js";

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
 let jumlahKartu = mode==="brerong"?4:1;

 for(let id of ids){
  let cards=[];
  for(let i=0;i<jumlahKartu;i++) cards.push(deck.pop());
  await updateDoc(doc(db,"rooms",roomId,"players",id),{cards});
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

function tampilKartu(){
 onSnapshot(doc(db,"rooms",roomId,"players",playerId),snap=>{
  let html="";
  snap.data()?.cards.forEach(c=>{
   html+=`<div style="display:inline-block;background:white;color:black;
   padding:16px;margin:6px;border-radius:12px;font-weight:bold;">
   ${c.left} | ${c.right}</div>`;
  });
  myCards.innerHTML=html;
 });
}

function kontrolGiliran(){
 onSnapshot(roomRef,snap=>{
  let room=snap.data(); if(!room) return;
  if(room.turn===playerId && mode==="spirit"){
    drawBtn.style.display="inline";
    passBtn.style.display="inline";
  } else {
    drawBtn.style.display="none";
    passBtn.style.display="none";
  }
 });
}

window.drawCard=async()=>{
 let pRef=doc(db,"rooms",roomId,"players",playerId);
 let pSnap=await getDoc(pRef);
 let cards=pSnap.data().cards;
 if(cards.length>=3) return alert("Maks 3 kartu!");

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
 let ids=[]; snap.forEach(d=>ids.push(d.id));
 let r=await getDoc(roomRef);
 let next=ids[(ids.indexOf(r.data().turn)+1)%ids.length];
 await updateDoc(roomRef,{turn:next,deck});
 cekPemenang();
}

async function cekPemenang(){
 const snap=await getDocs(collection(db,"rooms",roomId,"players"));
 let winner=null, bestRank=-1, bestPoint=-1;

 snap.forEach(d=>{
  let p=d.data();
  if(mode==="spirit"){
    let pt=hitungSpirit(p.cards);
    if(pt>bestPoint){bestPoint=pt;winner=d.id;}
  }else{
    let r=cekBrerong(p.cards);
    if(r.rank>bestRank){bestRank=r.rank;winner=d.id;}
  }
 });

 if(winner){
  let wRef=doc(db,"rooms",roomId,"players",winner);
  let wSnap=await getDoc(wRef);
  await updateDoc(wRef,{score:(wSnap.data().score||0)+1});
  winnerText.innerText="Pemenang ditemukan!";
 }
}

window.restartGame=async()=>{
 const snap=await getDocs(collection(db,"rooms",roomId,"players"));
 snap.forEach(async d=>{
  await updateDoc(doc(db,"rooms",roomId,"players",d.id),{cards:[],ready:false});
 });
 winnerText.innerText="";
};
