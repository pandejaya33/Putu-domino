function randomRoom(){
  return Math.random().toString(36).substring(2,7);
}

window.buatRoom = function(){
  const name = nameInput.value;
  const mode = modeSelect.value;
  if(!name) return alert("Isi nama");

  const roomId = randomRoom();

  localStorage.setItem("playerName",name);
  localStorage.setItem("roomId",roomId);
  localStorage.setItem("mode",mode);

  window.location.href="room.html";
};

window.gabungRoom = function(){
  const name = nameInput.value;
  const roomId = roomInput.value;
  if(!name || !roomId) return alert("Isi semua");

  localStorage.setItem("playerName",name);
  localStorage.setItem("roomId",roomId);

  window.location.href="room.html";
};
