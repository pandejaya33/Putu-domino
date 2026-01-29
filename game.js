// Fungsi mengocok kartu Domino
export function buatDeck() {
    let deck = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push({ left: i, right: j });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

// Fungsi membuat Room Baru
export function buatRoom() {
    const id = Math.random().toString(36).substring(2, 7); // Kode unik 5 karakter
    const pId = "p_" + Math.random().toString(36).substring(2, 6);
    localStorage.setItem("roomId", id);
    localStorage.setItem("playerId", pId);
    window.location.href = "room.html"; 
}

// Fungsi bergabung ke Room yang sudah ada
export function gabungRoom() {
    const id = localStorage.getItem("roomId");
    if (!id) return alert("Masukkan kode room terlebih dahulu!");
    const pId = "p_" + Math.random().toString(36).substring(2, 6);
    localStorage.setItem("playerId", pId);
    window.location.href = "room.html";
}
