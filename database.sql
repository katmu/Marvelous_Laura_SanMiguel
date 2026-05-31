-- Base de datos Marvelous
CREATE DATABASE IF NOT EXISTS marvelous;
USE marvelous;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(30) NOT NULL,
  pass       VARCHAR(255) NOT NULL,
  tipo       INT DEFAULT 0
);

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS favoritos (
  id_favorito INT NOT NULL,
  id_usuario  INT NOT NULL,
  tipo        VARCHAR(11),
  imagen_url  VARCHAR(500),
  estrellas   INT DEFAULT 0,
  nombre      VARCHAR(255),
  PRIMARY KEY (id_favorito, id_usuario),
  FOREIGN KEY (id_usuario) 
    REFERENCES usuario(id_usuario) 
    ON DELETE CASCADE
);

-- Tabla de hilos del foro
CREATE TABLE IF NOT EXISTS hilos (
  id_hilo    INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  titulo     VARCHAR(200) NOT NULL,
  texto      TEXT NOT NULL,
  fecha      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) 
    REFERENCES usuario(id_usuario) 
    ON DELETE CASCADE
);

-- Tabla de respuestas del foro
CREATE TABLE IF NOT EXISTS respuestas (
  id_respuesta INT AUTO_INCREMENT PRIMARY KEY,
  id_hilo      INT NOT NULL,
  id_usuario   INT NOT NULL,
  texto        TEXT NOT NULL,
  fecha        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_hilo) 
    REFERENCES hilos(id_hilo) 
    ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) 
    REFERENCES usuario(id_usuario) 
    ON DELETE CASCADE
);

-- Tabla de mensajes del muro
CREATE TABLE IF NOT EXISTS mensajes_muro (
  id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  texto      TEXT NOT NULL,
  fecha      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) 
    REFERENCES usuario(id_usuario) 
    ON DELETE CASCADE
);