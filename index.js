function randomRoom(){
  return Math.random().toString(36).substring(2,7);
}

window.buatRoom = function(){
  const name = document.getElementById("nameInput").value;
  if(!name) return alert("Isi nama dulu");

  const roomId = randomRoom();

  localStorage.setItem("playerName",name);
  localStorage.setItem("roomId",roomId);

  window.location.href="room.html";
};

window.gabungRoom = function(){
  const name = document.getElementById("nameInput").value;
  const roomId = document.getElementById("roomInput").value;

  if(!name || !roomId) return alert("Isi nama dan kode room");

  localStorage.setItem("playerName",name);
  localStorage.setItem("roomId",roomId);

  window.location.href="room.html";
};
