import { db } from "./firebase.js";
import { doc,setDoc,updateDoc,getDoc,getDocs,onSnapshot,collection }
import { getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const name = localStorage.getItem("playerName");
const playerId = Date.now().toString();
const roomRef = doc(db,"rooms",roomId);

roomCode.innerText = roomId;

init();

async function init(){
  await setDoc(doc(db,"rooms",roomId,"players",playerId),{
    name:name, ready:false, cards:[]
  });

  tampilPemain();
  tampilKartu();
  kontrolGiliran();
}

// ================= READY =================
window.readyUp = async ()=>{
  const pRef = doc(db,"rooms",roomId,"players",playerId);
  await updateDoc(pRef,{ready:true});

  // cek apakah semua ready → mulai game
  const snap = await getDocs(collection(db,"rooms",roomId,"players"));
  let ids=[], allReady=true;
  snap.forEach(d=>{
    ids.push(d.id);
    if(!d.data().ready) allReady=false;
  });

  if(allReady){
    const roomSnap = await getDoc(roomRef);
    if(roomSnap.data()?.gameStarted) return;

    let deck = buatDeck();

    for(let id of ids){
      await updateDoc(doc(db,"rooms",roomId,"players",id),{
        cards:[deck.pop()]
      });
    }

    await updateDoc(roomRef,{
      deck:deck,
      turn:ids[0],
      gameStarted:true
    });
  }
};

// ================= TAMPIL PEMAIN =================
function tampilPemain(){
  onSnapshot(collection(db,"rooms",roomId,"players"),snap=>{
    let html="";
    snap.forEach(d=>{
      let p=d.data();
      html+=`<div>${p.name} ${p.ready?"✅":"⏳"}</div>`;
    });
    players.innerHTML=html;
  });
}

// ================= TAMPIL KARTU =================
function tampilKartu(){
  onSnapshot(doc(db,"rooms",roomId,"players",playerId),snap=>{
    let data=snap.data();
    if(!data) return;
    let html="";
    data.cards?.forEach(c=>{
      html+=`<div style="display:inline-block;background:white;color:black;
      padding:12px;margin:6px;border-radius:8px;font-weight:bold;">
      ${c.left} | ${c.right}</div>`;
    });
    myCards.innerHTML=html;
  });
}

// ================= GILIRAN =================
function kontrolGiliran(){
  onSnapshot(roomRef, async snap=>{
    let room = snap.data();
    if(!room) return;

    const pSnap = await getDoc(doc(db,"rooms",roomId,"players",playerId));
    const cards = pSnap.data()?.cards || [];

    if(room.turn === playerId){
      passBtn.style.display = "inline-block";

      // 🚫 Jika sudah 3 kartu, tidak bisa ambil
      if(cards.length >= 3){
        drawBtn.style.display = "none";
      } else {
        drawBtn.style.display = "inline-block";
      }

    } else {
      drawBtn.style.display = "none";
      passBtn.style.display = "none";
    }
  });
}

// ================= AMBIL =================
window.drawCard = async () => {
  const pRef = doc(db,"rooms",roomId,"players",playerId);
  const pSnap = await getDoc(pRef);
  const cards = pSnap.data().cards || [];

  // 🚫 BATAS 3 KARTU MODE SPIRIT
  if(cards.length >= 3){
    alert("Maksimal 3 kartu di mode Spirit!");
    return;
  }

  let r = await getDoc(roomRef);
  let deck = r.data().deck;
  if(deck.length === 0) return;

  let card = deck.pop();
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
