export function buatDeck() {
    let deck = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push({ left: i, right: j });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

export function buatRoom() {
    // Membuat ID unik untuk room
    const id = Math.random().toString(36).substring(2, 7);
    localStorage.setItem("roomId", id);
    // Membuat ID unik untuk player
    localStorage.setItem("playerId", "p_" + Math.random().toString(36).substring(2, 6));
    window.location.href = "room.html"; 
}

export function gabungRoom() {
    const code = localStorage.getItem("roomId");
    if (!code) return alert("Kode Room tidak ditemukan!");
    localStorage.setItem("playerId", "p_" + Math.random().toString(36).substring(2, 6));
    window.location.href = "room.html";
}
