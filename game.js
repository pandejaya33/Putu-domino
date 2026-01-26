export function buatDeck(){
  let deck=[];
  for(let i=0;i<=6;i++){
    for(let j=i;j<=6;j++){
      deck.push({kiri:i,kanan:j});
    }
  }
  return deck.sort(()=>Math.random()-0.5);
}

export function hitungPoint(cards){
  let total=0;
  cards.forEach(c=> total+=c.kiri+c.kanan);
  return total%10;
}

export function isPalang(card){
  return card.kiri===card.kanan;
}