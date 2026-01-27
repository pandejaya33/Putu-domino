export function buatDeck(){
  let deck = [];

  for(let i=0;i<=6;i++){
    for(let j=i;j<=6;j++){
      deck.push([i, j]); // ⬅️ FORMAT BENAR
    }
  }

  // acak kartu
  for(let k = deck.length - 1; k > 0; k--){
    let r = Math.floor(Math.random() * (k + 1));
    [deck[k], deck[r]] = [deck[r], deck[k]];
  }

  return deck;
}
