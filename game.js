export function buatDeck(){
  let deck=[];
  for(let i=0;i<=6;i++){
    for(let j=i;j<=6;j++){
      deck.push({left:i,right:j});
    }
  }
  return deck.sort(()=>Math.random()-0.5);
}

export function pointDuaKartu(a,b){
  return (a.left+a.right+b.left+b.right)%10;
}

export function hitungSpirit(cards){
  let total=0;
  cards.forEach(c=> total+=c.left+c.right);
  return total%10;
}

export function cekBrerong(cards){
  // kartu: 4 buah
  let totalSemua = cards.reduce((t,c)=>t+c.left+c.right,0);

  // 40 rule
  if(totalSemua===40) return {rank:4,label:"MENANG 40"};

  // lunix (total %10 =9)
  if(totalSemua%10===9) return {rank:3,label:"LUNIX"};

  // triple (semua palang)
  if(cards.every(c=>c.left===c.right)) return {rank:2,label:"TRIPLE"};

  // cek kombinasi 2 kartu
  let best=0;
  for(let i=0;i<4;i++){
    for(let j=i+1;j<4;j++){
      let p1=pointDuaKartu(cards[i],cards[j]);
      let sisa=[0,1,2,3].filter(x=>x!==i&&x!==j);
      let p2=pointDuaKartu(cards[sisa[0]],cards[sisa[1]]);
      if(p1===9) best=Math.max(best,p2);
      if(p2===9) best=Math.max(best,p1);
    }
  }
  if(best>0) return {rank:1,label:"9 + "+best};

  return {rank:0,label:"KALAH"};
}
