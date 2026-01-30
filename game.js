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
    localStorage.setItem("roomId", id);
    localStorage.setItem("playerId", "p_" + Math.random().toString(36).substring(2, 6));
    window.location.href = "room.html"; 
}

export function gabungRoom() {
    window.location.href = "room.html";
}
