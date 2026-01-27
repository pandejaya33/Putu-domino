export function buatDeck(){
  let deck=[];
  for(let i=0;i<=6;i++){
    for(let j=i;j<=6;j++){
      deck.push({left:i,right:j,open:false});
    }
  }
  return deck.sort(()=>Math.random()-0.5);
}

export function hitungSpirit(cards){
  let total=0;
  cards.forEach(c=> total+=c.left+c.right);
  return total%10;
}

export function semuaSelesaiSpirit(players){
  return players.every(p=>p.cards.length>=2);
}

export function semuaSelesaiBrerong(players){
  return players.every(p=>p.cards.length===4);
}
