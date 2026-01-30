import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const rId = localStorage.getItem("roomId");
const pId = localStorage.getItem("playerId");
const pName = localStorage.getItem("playerName");
const roomRef = doc(db, "rooms", rId);

function getDots(num) {
    const p = { 0:[], 1:[4], 2:[0,8], 3:[0,4,8], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8] };
    let h = '<div class="dot-container">';
    for(let i=0; i<9; i++) h += `<div class="dot ${p[num].includes(i)?'active':''}"></div>`;
    return h + '</div>';
}

(async () => {
    const snap = await getDoc(roomRef);
    if(!snap.exists()) {
        await setDoc(roomRef, { players:[{id:pId, name:pName, cards:[]}], deck:buatDeck() });
    } else {
        let ps = snap.data().players;
        if(!ps.find(p => p.id === pId)) {
            ps.push({id:pId, name:pName, cards:[]});
            await updateDoc(roomRef, { players:ps });
        }
    }
})();

window.setReady = async () => {
    const snap = await getDoc(roomRef);
    let {players, deck} = snap.data();
    const idx = players.findIndex(p => p.id === pId);
    if(players[idx].cards.length < 4) {
        players[idx].cards.push(deck.shift());
        await updateDoc(roomRef, { players, deck });
    }
};

window.mainLagi = async () => {
    const snap = await getDoc(roomRef);
    let ps = snap.data().players.map(p => ({...p, cards:[]}));
    await updateDoc(roomRef, { players:ps, deck:buatDeck() });
};

onSnapshot(roomRef, (snap) => {
    if(!snap.exists()) return;
    const data = snap.data();
    document.getElementById("infoDisplay").innerText = `MODE: KODE: ${rId} (${localStorage.getItem("mode")?.toUpperCase()})`;
    document.getElementById("playerList").innerHTML = data.players.map(p => `
        <div style="background:rgba(0,0,0,0.5); padding:10px; margin:5px; border-radius:8px; width:280px; display:flex; justify-content:space-between;">
            <span>${p.name}</span><span>${p.cards.length} KRT</span>
        </div>
    `).join('');
    const me = data.players.find(p => p.id === pId);
    if(me) {
        document.getElementById("myCardsArea").innerHTML = me.cards.map(c => `
            <div class="domino-card-real">${getDots(c.left)}<div class="line"></div>${getDots(c.right)}</div>
        `).join('');
    }
});
