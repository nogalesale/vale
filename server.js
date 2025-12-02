const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

// Archivos estáticos
app.use(express.static("public"));
app.use(express.json());

// ------------------ NUEVO: FUNCIONES PARA GUARDAR/LEER MENSAJES ------------------
const MESSAGES_FILE = path.join(__dirname, "messages.json");

// Leer mensajes guardados
function readMessages() {
  try {
    const data = fs.readFileSync(MESSAGES_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Guardar un nuevo mensaje
function saveMessage(msg) {
  const messages = readMessages();
  messages.push(msg);
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}
// -------------------------------------------------------------------------------

// Login temporal (si lo quieres)
const users = JSON.parse(fs.readFileSync("./users.json"));
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) res.json({ success: true });
  else res.json({ success: false });
});

// Socket.io
io.on("connection", (socket) => {

  // Enviar mensajes guardados al usuario recién conectado
  const mensajesGuardados = readMessages();
  socket.emit("chatHistory", mensajesGuardados);

  // Mensajes de texto
  socket.on("chatMessage", (data) => {
    saveMessage({ type: "text", ...data }); // NUEVO: guardar mensaje
    io.emit("chatMessage", data);
  });

  // Mensajes de imagen
  socket.on("chatImage", (data) => {
    saveMessage({ type: "image", ...data }); // NUEVO: guardar imagen
    io.emit("chatImage", data);
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado");
  });
});

server.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
