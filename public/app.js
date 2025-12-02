const socket = io();

// ---------------- LOGIN ----------------
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (data.success) {
    document.getElementById("login").style.display = "none";
    document.getElementById("chat").style.display = "block";
    window.username = username;
  } else {
    document.getElementById("loginError").innerText = "Usuario o contraseña incorrectos";
  }
}

// ---------------- FUNCIONES PARA MOSTRAR MENSAJES ----------------
function addMessageToDom(data) {
  const div = document.getElementById("messages");
  const p = document.createElement("p");
  p.innerHTML = `<b>${data.user}:</b> ${data.message}`;
  div.appendChild(p);
  div.scrollTop = div.scrollHeight;
}

function addImageToDom(data) {
  const div = document.getElementById("messages");
  const p = document.createElement("p");
  p.innerHTML = `<b>${data.user}:</b><br><img src="${data.image}" width="200">`;
  div.appendChild(p);
  div.scrollTop = div.scrollHeight;
}

// ---------------- RECIBIR HISTORIAL ----------------
socket.on("chatHistory", (messages) => {
  messages.forEach(data => {
    if (data.type === "text") {
      addMessageToDom(data);
    } else if (data.type === "image") {
      addImageToDom(data);
    }
  });
});

// ---------------- ENVIAR MENSAJE ----------------
function sendMessage() {
  const msg = document.getElementById("msgInput").value;

  if (msg.trim() !== "") {
    const data = { user: window.username, message: msg };
    socket.emit("chatMessage", data);
    document.getElementById("msgInput").value = "";
    addMessageToDom(data); // Mostrar en tu pantalla inmediatamente
  }
}

// ---------------- RECIBIR MENSAJE ----------------
socket.on("chatMessage", (data) => {
  addMessageToDom(data);
});

// ---------------- ENVIAR IMAGEN ----------------
function sendImage() {
  const file = document.getElementById("imageInput").files[0];

  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const data = { user: window.username, image: reader.result };
    socket.emit("chatImage", data);
    addImageToDom(data); // Mostrar en tu pantalla inmediatamente
  };
  reader.readAsDataURL(file);
}

// ---------------- RECIBIR IMAGEN ----------------
socket.on("chatImage", (data) => {
  addImageToDom(data);
});
