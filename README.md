# Marvelous 🦸 — Una aplicación para superhéroes

Aplicación web de tipo Single Page Application (SPA) orientada a la gestión y descubrimiento personalizado de contenido del universo de los cómics. Desarrollada como Trabajo de Fin de Titulación (TFT) del Bàtxelor en Informática de la Universitat Digital Europea (UNIPRO).

## 🛠️ Stack tecnológico

- **Frontend:** React 18 + React Router v6
- **Backend:** Node.js + Express
- **Base de datos:** MySQL
- **IA:** Google Gemini 2.5 Flash
- **API de datos:** Comic Vine API

## ✨ Funcionalidades

- 📚 Catálogo de cómics y personajes en tiempo real
- 🔍 Buscador avanzado por categorías
- 🔐 Autenticación segura con bcrypt
- ❤️ Sistema de favoritos y valoración por estrellas
- 🎯 Motor de recomendaciones personalizado
- 🏆 Hall of Fame comunitario
- 💬 Foro con hilos y respuestas
- 🤖 Chatbot JARVIS-C powered by Gemini

## 📋 Requisitos previos

- Node.js v18 o superior
- MySQL 8.0 o superior
- Cuenta en [Comic Vine API](https://comicvine.gamespot.com/api/)
- Cuenta en [Google AI Studio](https://aistudio.google.com/) para Gemini

## 🚀 Instalación

### 1. Clona el repositorio

```bash
git clone https://github.com/katmu/Marvelous_Laura_SanMiguel.git
cd Marvelous_Laura_SanMiguel
```

### 2. Instala las dependencias del backend

```bash
npm install
```

### 3. Instala las dependencias del frontend

```bash
cd marvelous-react
npm install
cd ..
```

### 4. Configura las variables de entorno

Copia el archivo `.env.example` y renómbralo a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:
SERVER_PORT=5000
DB_HOST=localhost
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=marvelous
COMICVINE_API_KEY=tu_api_key
COMICVINE_BASE_URL=https://comicvine.gamespot.com/api
GEMINI_API_KEY=tu_api_key_gemini
REACT_APP_SERVER_URL=http://localhost:5000

### 5. Crea la base de datos

Importa el script SQL en tu servidor MySQL:

```bash
mysql -u tu_usuario -p < database.sql
```

O importa el archivo `database.sql` directamente desde phpMyAdmin.

### 6. Inicia el servidor backend

```bash
node server.js
```

### 7. Inicia el frontend

En una terminal separada:

```bash
cd marvelous-react
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del proyecto
Marvelous_React/
├── server.js                  ← Servidor Express
├── database.sql               ← Script de creación de la BD
├── .env.example               ← Plantilla de variables de entorno
├── .gitignore
├── package.json
└── marvelous-react/           ← Aplicación React
└── src/
├── App.js
├── index.js
└── components/
├── ComicList.jsx
├── HeroList.jsx
├── Buscador.jsx
├── PerfilUser.jsx
├── RegistroUser.jsx
├── HallOfFame.jsx
├── HallOfFameBanner.jsx
├── Foro.jsx
├── MuroAgentes.jsx
└── AgenteIA.jsx

## 🎥 Vídeo demostrativo

https://youtu.be/BJlPdasTTow 

## 👩‍💻 Autora

Laura San Miguel Losantos  
Bàtxelor en Informática — UNIPRO Universitat Digital Europea  
Tutor: Joaquín Gaspar Medina Arco

## 📄 Licencia

Proyecto académico — Todos los derechos reservados.