// 1️⃣ Importar librerías
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";

// 2️⃣ Configuración de rutas y servidor
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000; // ⚡ Corregido para Render

// 3️⃣ Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // CSS, imágenes, JS

// 3️⃣b Configurar sesión
app.use(session({
  secret: "mi_clave_secreta123", // cambia esto por algo seguro
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 60 * 1000 } // 1 hora
}));

// 4️⃣ Conexión a SQLite
const db = new sqlite3.Database(path.join(__dirname, "database.db"), (err) => {
  if (err) console.error("Error al abrir la base de datos:", err.message);
  else console.log("Conexión a SQLite correcta");
});

// Crear tabla si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS preinscripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombres TEXT,
    apellidos TEXT,
    ci TEXT,
    fecha_nac TEXT,
    genero TEXT,
    grado TEXT,
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    procedencia TEXT,
    t_nombre TEXT,
    t_cel TEXT,
    t_parentezco TEXT,
    t_email TEXT,
    emergencia TEXT
  )
`);

// 5️⃣ Usuario y contraseña de administrador
const ADMIN_USER = "admin";
const ADMIN_PASS = "12345";

// 6️⃣ Rutas HTML principales
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "views", "index.html")));
app.get("/preinscripcion", (req, res) => res.sendFile(path.join(__dirname, "views", "preinscripcion.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "views", "login.html")));

// 6️⃣b Rutas para nuevas páginas (sin .html en enlace)
app.get("/docentes", (req, res) => res.sendFile(path.join(__dirname, "views", "docentes.html")));
app.get("/acerca", (req, res) => res.sendFile(path.join(__dirname, "views", "acerca.html")));
app.get("/ubicacion", (req, res) => res.sendFile(path.join(__dirname, "views", "ubicacion.html")));

// 7️⃣ Middleware para proteger admin
function authAdmin(req, res, next) {
  if (req.session && req.session.user === ADMIN_USER) {
    next();
  } else {
    res.redirect("/login");
  }
}

app.get("/admin", authAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

// 8️⃣ API para login con sesión
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.user = username;
    res.json({ message: "Login correcto" });
  } else {
    res.status(401).json({ message: "Usuario o contraseña incorrectos" });
  }
});

// 9️⃣ API para cerrar sesión
app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Sesión cerrada" });
});

// 🔟 API para recibir formulario
app.post("/api/preinscripcion", (req, res) => {
  const data = req.body;
  const sql = `
    INSERT INTO preinscripciones
    (nombres, apellidos, ci, fecha_nac, genero, grado, direccion, telefono, email, procedencia, t_nombre, t_cel, t_parentezco, t_email, emergencia)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(sql, [
    data.nombres, data.apellidos, data.ci, data.fecha_nac, data.genero,
    data.grado, data.direccion, data.telefono, data.email, data.procedencia,
    data.t_nombre, data.t_cel, data.t_parentezco, data.t_email, data.emergencia
  ], function(err) {
    if (err) res.status(500).json({ message: "Error al guardar la preinscripción" });
    else res.json({ message: "Preinscripción enviada correctamente" });
  });
});

// 1️⃣1️⃣ API para mostrar registros admin
app.get("/api/preinscripciones", authAdmin, (req, res) => {
  db.all("SELECT * FROM preinscripciones ORDER BY id DESC", [], (err, rows) => {
    if (err) res.status(500).json({ message: "Error al obtener registros" });
    else res.json(rows);
  });
});

// 1️⃣2️⃣ Iniciar servidor
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
