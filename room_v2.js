import { db } from "./firebase.js";
import { doc, onSnapshot, updateDoc, getDoc, setDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buatDeck } from "./game.js";

const roomId = localStorage.getItem("roomId");
const myId = localStorage.getItem("playerId");
const myName = localStorage.getItem("playerName");
const roomRef = doc(db, "rooms", roomId);

let kunciBagi = false;

async function initRoom() {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) {
        await setDoc(roomRef, { players: [{ id: myId, name: myName, ready: false, cards: [], isBot: false }], started: false, deck: buatDeck(), hostId: myId });
    } else {
        const room = snap.data();
        if (!room.players.find(p => p.id === myId)) {
            await updateDoc(roomRef, { players: arrayUnion({ id: myId, name: myName, ready: false, cards: [], isBot: false }) });
        }
    }
}
initRoom();

onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    const room = snap.data();
    const me = room.players.find(p => p.id === myId);

    // List Pemain
    document.getElementById("playerList").innerHTML = room.players.map(p => `
        <div style="color:white; background:rgba(255,255,255,0.1); padding:8px; margin-bottom:5px; border-radius:5px;">
            ${p.isBot ? '🤖' : '👤'} ${p.name} (${p.cards.length} kartu) ${p.ready ? '✅' : '⏳'}
        </div>
    `).join("");

    // Kartu (Dibatasi tampilannya)
    const area = document.getElementById("kartuSaya");
    area.innerHTML = "";
    if (me?.cards) {
        me.cards.forEach(() => {
            const div = document.createElement("div");
            div.className = "dominoCard";
            div.style.cssText = "background:white; width:50px; height:80px; border-radius:5px; display:inline-block; margin:5px;";
            area.appendChild(div);
        });
    }

    // LOGIKA LIMIT: Hanya muncul jika kartu kurang dari 3
    const btnLanjut = document.getElementById("btnLanjut");
    if (room.started && me && me.cards.length > 0 && me.cards.length < 3) {
        btnLanjut.style.display = "block";
    } else {
        btnLanjut.style.display = "none";
    }

    // MULAI (HANYA 1 KARTU)
    if (!room.started && room.players.length >= 2 && room.players.every(p => p.ready)) {
        if (room.hostId === myId && !kunciBagi) {
            kunciBagi = true;
            let deck = [...room.deck];
            const pUpdate = room.players.map(p => {
                const k = deck.pop();
                return { ...p, cards: [`${k.left}|${k.right}`] };
            });
            updateDoc(roomRef, { started: true, players: pUpdate, deck: deck });
        }
    }
});

window.tambahBot = async () => {
    const snap = await getDoc(roomRef);
    const b = [{ id: "bot1", name: "Mas J", ready: true, cards: [], isBot: true }, { id: "bot2", name: "Mangku", ready: true, cards: [], isBot: true }];
    await updateDoc(roomRef, { players: [...snap.data().players, ...b] });
};

window.setReady = async () => {
    const snap = await getDoc(roomRef);
    const p = [...snap.data().players];
    const i = p.findIndex(x => x.id === myId);
    p[i].ready = true;
    await updateDoc(roomRef, { players: p });
};

window.ambilKartuLanjut = async () => {
    const snap = await getDoc(roomRef);
    const room = snap.data();
    let p = [...room.players];
    const i = p.findIndex(x => x.id === myId);
    if (p[i].cards.length < 3) {
        let d = [...room.deck];
        const k = d.pop();
        p[i].cards.push(`${k.left}|${k.right}`);
        await updateDoc(roomRef, { players: p, deck: d });
    }
};

window.mainLagi = async () => {
    await updateDoc(roomRef, { started: false, deck: buatDeck(), players: [] });
    window.location.reload();
};
