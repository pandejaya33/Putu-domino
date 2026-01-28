function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

window.buatRoom = function() {
  const name = document.getElementById("nameInput").value;
  const mode = document.getElementById("modeSelect").value;
  if (!name) return alert("Nama tidak boleh kosong!");

  const roomId = Math.random().toString(36).substring(2, 7);
  const playerId = generateId();

  localStorage.setItem("playerName", name);
  localStorage.setItem("playerId", playerId);
  localStorage.setItem("roomId", roomId);
  localStorage.setItem("mode", mode);

  window.location.href = "room.html";
};

window.gabungRoom = function() {
  const name = document.getElementById("nameInput").value;
  const roomId = document.getElementById("roomInput").value;
  if (!name || !roomId) return alert("Isi nama dan kode room!");

  const playerId = generateId();

  localStorage.setItem("playerName", name);
  localStorage.setItem("playerId", playerId);
  localStorage.setItem("roomId", roomId);

  window.location.href = "room.html";
};
