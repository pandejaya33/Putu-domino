export function buatDeck() {
    let deck = [];
    for (let i = 0; i < 7; i++) {
        for (let j = i; j < 7; j++) {
            deck.push({ left: i, right: j });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

export function buatRoom() {
    const id = Math.random().toString(36).substring(2, 7);
    localStorage.setItem("roomId", id);
    localStorage.setItem("playerId", "p_" + Math.random().toString(36).substring(2, 5));
    window.location.href = "room.html"; // Pastikan nama file tujuan benar
}

export function gabungRoom() {
    const id = localStorage.getItem("roomId");
    if (id) {
        localStorage.setItem("playerId", "p_" + Math.random().toString(36).substring(2, 5));
        window.location.href = "room.html";
    }
}
