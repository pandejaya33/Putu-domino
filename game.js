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
    const id = Math.random().toString(36).substring(2, 7).toUpperCase();
    const pId = "p_" + Math.random().toString(36).substring(2, 6);
    localStorage.setItem("roomId", id);
    localStorage.setItem("playerId", pId);
    window.location.href = "room.html"; 
}

export function gabungRoom() {
    const pId = "p_" + Math.random().toString(36).substring(2, 6);
    localStorage.setItem("playerId", pId);
    window.location.href = "room.html";
}
