export function buatDeck() {
  let deck = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      deck.push({ left: i, right: j });
    }
  }
  // Kocok kartu
  return deck.sort(() => Math.random() - 0.5);
}
