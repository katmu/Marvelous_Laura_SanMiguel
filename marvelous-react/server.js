// Cargamos las variables de entorno desde .env antes que nada
require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcrypt');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Número de rondas de sal para el hash de contraseñas con bcrypt
const SALT_ROUNDS = 10;
const app = express();

// ======= CONFIGURACIÓN DEL MODELO DE IA (GEMINI) =======
// Inicializamos el cliente de Gemini con la API key del .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Creamos el modelo con un rol de sistema: JARVIS-C, experto en cómics Marvel y DC
const geminiModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `Eres JARVIS-C, un agente de inteligencia artificial de S.H.I.E.L.D. especializado en el universo de los cómics Marvel y DC. Tu misión es proporcionar información precisa, detallada y apasionante sobre héroes, villanos, eventos, arcos argumentales, películas, series y cómics. Responde siempre en español, con el entusiasmo de un fan experto y el tono formal de un agente de élite. Si te preguntan algo completamente ajeno a los cómics, redirige la conversación amablemente hacia ese universo.`
});

// Middlewares globales: CORS para permitir peticiones desde React, y JSON para leer el body
app.use(cors());
app.use(express.json());

// ======= CONEXIÓN A LA BASE DE DATOS MYSQL =======
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err);
    return;
  }
  console.log('✅ Conectado a la Base de Datos de S.H.I.E.L.D.');

  // Creamos la tabla de hilos del foro si no existe todavía.
  // La clave foránea enlaza cada hilo con su autor en la tabla usuario.
  db.query(`
    CREATE TABLE IF NOT EXISTS hilos (
      id_hilo   INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NOT NULL,
      titulo    VARCHAR(200) NOT NULL,
      texto     TEXT NOT NULL,
      fecha     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
    )
  `, (e) => { if (e) console.error('❌ Error creando tabla hilos:', e.message); else console.log('✅ Tabla hilos lista'); });

  // Creamos la tabla de respuestas del foro si no existe.
  // ON DELETE CASCADE: si se borra un hilo, sus respuestas también desaparecen.
  db.query(`
    CREATE TABLE IF NOT EXISTS respuestas (
      id_respuesta INT AUTO_INCREMENT PRIMARY KEY,
      id_hilo      INT NOT NULL,
      id_usuario   INT NOT NULL,
      texto        TEXT NOT NULL,
      fecha        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_hilo)     REFERENCES hilos(id_hilo)         ON DELETE CASCADE,
      FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario)    ON DELETE CASCADE
    )
  `, (e) => { if (e) console.error('❌ Error creando tabla respuestas:', e.message); else console.log('✅ Tabla respuestas lista'); });
});

// Capturamos errores de conexión en caliente para que Node no se caiga si MySQL se desconecta
db.on('error', (err) => {
  console.error('❌ Error en la conexión MySQL:', err);
});

// ======= AUTENTICACIÓN =======

// POST /login — Comprueba usuario y contraseña (bcrypt)
app.post('/login', async (req, res) => {
  const nombre = String(req.body.nombre).trim();
  const password = String(req.body.password).trim();

  try {
    // Buscamos el usuario por nombre en la base de datos
    const [result] = await db.promise().query("SELECT * FROM usuario WHERE nombre = ?", [nombre]);

    // Si no existe el usuario, devolvemos el mismo mensaje genérico (no revelamos cuál campo es incorrecto)
    if (result.length === 0) {
      return res.send({ auth: false, message: "ID de Agente o Clave incorrectos" });
    }

    // Comparamos la contraseña enviada con el hash almacenado en la BD
    const match = await bcrypt.compare(password, result[0].pass);
    if (!match) {
      return res.send({ auth: false, message: "ID de Agente o Clave incorrectos" });
    }

    // Nunca enviamos el hash de la contraseña al cliente; lo eliminamos del objeto
    const { pass, ...userWithoutPassword } = result[0];
    console.log(`✅ Login exitoso: ${nombre}`);
    res.send({ auth: true, user: userWithoutPassword });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ auth: false, message: "Error en el servidor" });
  }
});

// POST /registro — Registra un nuevo usuario hasheando su contraseña
app.post('/registro', async (req, res) => {
  const { nombre, password } = req.body;

  try {
    // Verificamos que el nombre de usuario no esté ya en uso
    const [result] = await db.promise().query("SELECT * FROM usuario WHERE nombre = ?", [nombre]);

    if (result.length > 0) {
      return res.json({ success: false, message: "El ID de Agente ya está en uso." });
    }

    // Hasheamos la contraseña antes de guardarla
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await db.promise().query("INSERT INTO usuario (nombre, pass) VALUES (?, ?)", [nombre, hash]);
    res.json({ success: true, message: "Nuevo Agente registrado con éxito." });
  } catch (err) {
    console.error("❌ Error en registro:", err);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});

// POST /update-pass — Actualiza la contraseña de un agente (genera nuevo hash)
app.post('/update-pass', async (req, res) => {
  const { id_usuario, nuevaPass } = req.body;

  try {
    const hash = await bcrypt.hash(nuevaPass, SALT_ROUNDS);
    const [result] = await db.promise().query(
      "UPDATE usuario SET pass = ? WHERE id_usuario = ?",
      [hash, id_usuario]
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: "Clave actualizada con éxito." });
    } else {
      res.json({ success: false, message: "No se encontró el agente solicitado." });
    }
  } catch (err) {
    console.error("❌ ERROR AL ACTUALIZAR:", err);
    res.status(500).json({ success: false, message: "Error en el servidor de seguridad." });
  }
});

// ======= FAVORITOS =======

// POST /favoritos/toggle — Añade o elimina un favorito según si ya existe (toggle)
app.post('/favoritos/toggle', (req, res) => {
  const { id_favorito, id_usuario, tipo, imagen_url, nombre } = req.body;

  // Primero comprobamos si el favorito ya existe para este usuario
  const sqlCheck = "SELECT * FROM favoritos WHERE id_favorito = ? AND id_usuario = ?";
  db.query(sqlCheck, [id_favorito, id_usuario], (err, result) => {
    if (err) {
      console.error("❌ Error en SELECT:", err);
      return res.status(500).json({ error: "Error al consultar la base de datos" });
    }

    if (result.length > 0) {
      // Ya existe → lo eliminamos (desmarcar favorito)
      const sqlDelete = "DELETE FROM favoritos WHERE id_favorito = ? AND id_usuario = ?";
      db.query(sqlDelete, [id_favorito, id_usuario], (err) => {
        if (err) return res.status(500).json({ error: "Error al eliminar" });
        res.json({ success: true, action: 'removed' });
      });
    } else {
      // No existe → lo insertamos con todos sus datos
      const sqlInsert = "INSERT INTO favoritos (id_favorito, id_usuario, tipo, imagen_url, nombre) VALUES (?, ?, ?, ?, ?)";
      db.query(sqlInsert, [id_favorito, id_usuario, tipo, imagen_url, nombre], (err) => {
        if (err) {
          console.error("❌ ERROR CRÍTICO EN INSERT:", err.message);
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, action: 'added' });
      });
    }
  });
});

// GET /favoritos/:id_usuario — Devuelve todos los favoritos de un usuario concreto
app.get('/favoritos/:id_usuario', (req, res) => {
  const id_usuario = req.params.id_usuario;
  const sql = "SELECT * FROM favoritos WHERE id_usuario = ?";

  db.query(sql, [id_usuario], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.send(result);
  });
});

// POST /favoritos/rate — Guarda o actualiza la puntuación de estrellas de un favorito
app.post('/favoritos/rate', (req, res) => {
  const { id_usuario, id_favorito, estrellas } = req.body;

  const sql = "UPDATE favoritos SET estrellas = ? WHERE id_usuario = ? AND id_favorito = ?";
  db.query(sql, [estrellas, id_usuario, id_favorito], (err) => {
    if (err) {
      console.error("❌ Error al puntuar:", err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true, message: "Puntuación guardada" });
  });
});

// ======= MOTOR DE RECOMENDACIONES STARK =======

// GET /recomendaciones/:id_usuario — Devuelve un favorito con 5 estrellas al azar
// para usarlo como base de sugerencias en el perfil del agente
app.get('/recomendaciones/:id_usuario', (req, res) => {
  const id = req.params.id_usuario;

  // Cogemos un favorito con máxima puntuación al azar como semilla de recomendación
  const sql = "SELECT * FROM favoritos WHERE id_usuario = ? AND estrellas = 5 ORDER BY RAND() LIMIT 1";

  db.query(sql, [id], (err, result) => {
    if (err || result.length === 0) {
      return res.json({ success: false });
    }

    const fav = result[0];
    res.json({
      success: true,
      nombre: fav.nombre,
      id_marvel: fav.id_favorito,
      tipo: fav.tipo
    });
  });
});

// ======= HALL OF FAME =======

// GET /api/hall-of-fame/:tipo — Top 5 de héroes o cómics por promedio de estrellas
app.get('/api/hall-of-fame/:tipo', (req, res) => {
  const tipoSolicitado = req.params.tipo; // 'hero' o 'comic'
  console.log(`Petición de ranking recibida para: ${tipoSolicitado}`);

  // Agrupamos por nombre e imagen y calculamos el promedio de estrellas
  const sql = `
    SELECT nombre, imagen_url, tipo, AVG(estrellas) as promedio
    FROM favoritos
    WHERE tipo = ? AND nombre IS NOT NULL AND estrellas > 0
    GROUP BY nombre, imagen_url, tipo
    ORDER BY promedio DESC
    LIMIT 5
  `;

  db.query(sql, [tipoSolicitado], (err, results) => {
    if (err) {
      console.error("❌ Error en el ranking:", err);
      return res.status(500).json({ success: false });
    }
    console.log(`📡 Enviando Top 5 de tipo: ${tipoSolicitado}`, results);
    res.json(results);
  });
});

// ======= MURO DE AGENTES (mensajes públicos) =======

// GET /api/muro — Últimos 50 mensajes del muro, ordenados del más reciente al más antiguo
app.get('/api/muro', async (_req, res) => {
  try {
    const query = `
      SELECT m.*, u.nombre
      FROM mensajes_muro m
      JOIN usuario u ON m.id_usuario = u.id_usuario
      ORDER BY m.fecha DESC
      LIMIT 50
    `;
    const [rows] = await db.promise().query(query);
    res.json(rows);
  } catch (err) {
    console.error("❌ ERROR EN SQL GET:", err.message);
    res.status(500).send("Error en la base de datos");
  }
});

// POST /api/muro — Publica un nuevo mensaje en el muro
app.post('/api/muro', async (req, res) => {
  const { id_usuario, texto } = req.body;
  try {
    await db.promise().query("INSERT INTO mensajes_muro (id_usuario, texto) VALUES (?, ?)", [id_usuario, texto]);
    res.json({ message: "Transmisión guardada" });
  } catch (err) {
    console.error("❌ ERROR EN SQL POST:", err.message);
    res.status(500).send("Error al guardar mensaje");
  }
});

// DELETE /api/muro/:id — Borra un mensaje del muro; solo el autor puede borrarlo
app.delete('/api/muro/:id', (req, res) => {
  const id = req.params.id;
  const { id_usuario } = req.body;

  // La condición AND id_usuario actúa como control de autorización
  const query = "DELETE FROM mensajes_muro WHERE id_mensaje = ? AND id_usuario = ?";
  db.query(query, [id, id_usuario], (err, result) => {
    if (err) {
      console.error("Error en la base de datos:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    // Si affectedRows es 0, el mensaje no era del usuario o no existía
    if (result.affectedRows === 0) {
      return res.status(403).json({ error: "No autorizado o mensaje no encontrado" });
    }

    res.status(200).json({ mensaje: "Transmisión eliminada" });
  });
});

// ======= PROXY SEGURO: COMIC VINE API =======
// Todas las llamadas a Comic Vine se hacen aquí en el servidor.
// De este modo la API key nunca llega al navegador.

// GET /api/comicvine/personajes — Galería de personajes para HeroList
app.get('/api/comicvine/personajes', async (_req, res) => {
  try {
    const url = `${process.env.COMICVINE_BASE_URL}/characters/?api_key=${process.env.COMICVINE_API_KEY}&format=json&limit=20&field_list=id,name,image,deck,real_name,description,gender,origin,birth`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error('❌ Error al obtener personajes de Comic Vine:', err.message);
    res.status(500).json({ error: 'Error al contactar Comic Vine' });
  }
});

// GET /api/comicvine/comics — Galería de cómics para ComicList
app.get('/api/comicvine/comics', async (_req, res) => {
  try {
    const url = `${process.env.COMICVINE_BASE_URL}/issues/?api_key=${process.env.COMICVINE_API_KEY}&format=json&limit=20&field_list=id,name,image,deck,description,issue_number,volume,store_date,cover_date`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error('❌ Error al obtener cómics de Comic Vine:', err.message);
    res.status(500).json({ error: 'Error al contactar Comic Vine' });
  }
});

// GET /api/comicvine/buscar — Búsqueda general (personajes, cómics, películas…)
app.get('/api/comicvine/buscar', async (req, res) => {
  const { query, categorias } = req.query;
  if (!query) return res.status(400).json({ error: 'Falta el parámetro query' });

  try {
    let url;
    // Las películas usan el endpoint /movies con filtro por nombre; el resto usa /search
    if (categorias === 'movie') {
      url = `${process.env.COMICVINE_BASE_URL}/movies/?api_key=${process.env.COMICVINE_API_KEY}&format=json&filter=name:${encodeURIComponent(query)}&limit=50`;
    } else {
      url = `${process.env.COMICVINE_BASE_URL}/search/?api_key=${process.env.COMICVINE_API_KEY}&format=json&query=${encodeURIComponent(query)}&resources=${categorias}&limit=50`;
    }
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error('❌ Error en búsqueda de Comic Vine:', err.message);
    res.status(500).json({ error: 'Error al contactar Comic Vine' });
  }
});

// GET /api/comicvine/sugerencias — Sugerencias de cómics similares para el perfil
app.get('/api/comicvine/sugerencias', async (req, res) => {
  const { nombre, exclude_id } = req.query;
  if (!nombre) return res.status(400).json({ error: 'Falta el parámetro nombre' });

  try {
    // Limpiamos el nombre quitando aclaraciones entre paréntesis antes de buscar
    const queryLimpia = nombre.split('(')[0].trim();
    const url = `${process.env.COMICVINE_BASE_URL}/issues/?api_key=${process.env.COMICVINE_API_KEY}&format=json&filter=name:${encodeURIComponent(queryLimpia)}&limit=8`;
    const response = await axios.get(url);

    let results = response.data.results || [];

    // Excluimos el propio favorito del usuario de las sugerencias
    if (exclude_id) {
      results = results.filter(item => String(item.id) !== String(exclude_id));
    }
    res.json({ results: results.slice(0, 4) });
  } catch (err) {
    console.error('❌ Error en sugerencias de Comic Vine:', err.message);
    res.status(500).json({ error: 'Error al contactar Comic Vine' });
  }
});

// ======= FORO: HILOS Y RESPUESTAS =======

// GET /api/foro/hilos — Lista todos los hilos con autor y número de respuestas
app.get('/api/foro/hilos', async (_req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT h.*, u.nombre AS nombre_usuario,
             COUNT(r.id_respuesta) AS num_respuestas
      FROM hilos h
      JOIN usuario u ON h.id_usuario = u.id_usuario
      LEFT JOIN respuestas r ON r.id_hilo = h.id_hilo
      GROUP BY h.id_hilo
      ORDER BY h.fecha DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error listando hilos:', err.message);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// GET /api/foro/hilos/:id_hilo — Detalle de un hilo junto con todas sus respuestas
app.get('/api/foro/hilos/:id_hilo', async (req, res) => {
  const { id_hilo } = req.params;
  try {
    // Cargamos el hilo con el nombre del autor
    const [[hilo]] = await db.promise().query(
      'SELECT h.*, u.nombre AS nombre_usuario FROM hilos h JOIN usuario u ON h.id_usuario = u.id_usuario WHERE h.id_hilo = ?',
      [id_hilo]
    );
    if (!hilo) return res.status(404).json({ error: 'Hilo no encontrado' });

    // Cargamos las respuestas ordenadas cronológicamente (más antigua primero)
    const [respuestas] = await db.promise().query(
      'SELECT r.*, u.nombre FROM respuestas r JOIN usuario u ON r.id_usuario = u.id_usuario WHERE r.id_hilo = ? ORDER BY r.fecha ASC',
      [id_hilo]
    );
    res.json({ hilo, respuestas });
  } catch (err) {
    console.error('❌ Error cargando hilo:', err.message);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// POST /api/foro/hilos — Crea un nuevo hilo
app.post('/api/foro/hilos', async (req, res) => {
  const { id_usuario, titulo, texto } = req.body;
  if (!titulo?.trim() || !texto?.trim()) return res.status(400).json({ error: 'Título y texto son obligatorios' });
  try {
    const [result] = await db.promise().query(
      'INSERT INTO hilos (id_usuario, titulo, texto) VALUES (?, ?, ?)',
      [id_usuario, titulo.trim(), texto.trim()]
    );
    res.json({ success: true, id_hilo: result.insertId });
  } catch (err) {
    console.error('❌ Error creando hilo:', err.message);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// DELETE /api/foro/hilos/:id_hilo — Borra un hilo; solo lo puede eliminar su autor
app.delete('/api/foro/hilos/:id_hilo', async (req, res) => {
  const { id_hilo } = req.params;
  const { id_usuario } = req.body;
  try {
    // El AND id_usuario garantiza que solo el autor pueda borrar su hilo
    const [result] = await db.promise().query(
      'DELETE FROM hilos WHERE id_hilo = ? AND id_usuario = ?',
      [id_hilo, id_usuario]
    );
    if (result.affectedRows === 0) return res.status(403).json({ error: 'No autorizado o hilo no encontrado' });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error borrando hilo:', err.message);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// POST /api/foro/respuestas — Añade una respuesta a un hilo existente
app.post('/api/foro/respuestas', async (req, res) => {
  const { id_hilo, id_usuario, texto } = req.body;
  if (!texto?.trim()) return res.status(400).json({ error: 'El texto es obligatorio' });
  try {
    const [result] = await db.promise().query(
      'INSERT INTO respuestas (id_hilo, id_usuario, texto) VALUES (?, ?, ?)',
      [id_hilo, id_usuario, texto.trim()]
    );
    res.json({ success: true, id_respuesta: result.insertId });
  } catch (err) {
    console.error('❌ Error creando respuesta:', err.message);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// DELETE /api/foro/respuestas/:id_respuesta — Borra una respuesta; solo su autor puede hacerlo
app.delete('/api/foro/respuestas/:id_respuesta', async (req, res) => {
  const { id_respuesta } = req.params;
  const { id_usuario } = req.body;
  try {
    const [result] = await db.promise().query(
      'DELETE FROM respuestas WHERE id_respuesta = ? AND id_usuario = ?',
      [id_respuesta, id_usuario]
    );
    if (result.affectedRows === 0) return res.status(403).json({ error: 'No autorizado o respuesta no encontrada' });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error borrando respuesta:', err.message);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// ======= IA: CHAT CON GEMINI (JARVIS-C) =======

// POST /api/ia/chat — Recibe el historial de conversación y el nuevo mensaje,
// los envía a Gemini y devuelve la respuesta generada
app.post('/api/ia/chat', async (req, res) => {
  const { history, message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Falta el mensaje' });

  try {
    // Convertimos el formato de mensajes de React al formato que espera el SDK de Gemini
    const geminiHistory = (history || []).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Iniciamos un chat con el historial previo y enviamos el nuevo mensaje
    const chat = geminiModel.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();
    res.json({ reply });
  } catch (err) {
    console.error('❌ Error en Gemini:', err.message);
    res.status(500).json({ error: 'Error al contactar con la IA' });
  }
});

// ======= ARRANQUE DEL SERVIDOR =======
const PORT = process.env.SERVER_PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Stark corriendo en el puerto ${PORT}`);
});
