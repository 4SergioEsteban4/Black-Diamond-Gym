-- ============================================================
-- Black Diamond Gym — Schema convertido a PostgreSQL (Supabase)
-- ============================================================

-- ADMINS
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  usuario VARCHAR(60) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admins (id, nombre, usuario, password_hash, creado_en) VALUES
(1, 'Profe Black Diamond', 'blackdiamond1', '$2a$10$vENPn8pQLId7OMEM7gsM3edpNKgRjpgsfNuDkEI80ogOw7EK4MqVu', '2026-03-23 01:01:52'),
(2, 'Admin 2', 'blackdiamond2', '$2a$10$vENPn8pQLId7OMEM7gsM3edpNKgRjpgsfNuDkEI80ogOw7EK4MqVu', '2026-03-23 03:05:35'),
(3, 'Admin 3', 'blackdiamond3', '$2a$10$vENPn8pQLId7OMEM7gsM3edpNKgRjpgsfNuDkEI80ogOw7EK4MqVu', '2026-03-23 03:05:35');

SELECT setval('admins_id_seq', 4);

-- ============================================================

-- CATALOGO
CREATE TABLE IF NOT EXISTS catalogo (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio INT NOT NULL,
  imagen_url VARCHAR(400),
  categoria VARCHAR(80),
  stock INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO catalogo (id, nombre, descripcion, precio, imagen_url, categoria, stock, activo, creado_en) VALUES
(9, 'Ejemplo', 'Descripcion', 2000, 'https://res.cloudinary.com/dddljjigu/image/upload/v1775263086/blackdiamond/catalogo/h8iltmsncqw2kmu9h5mf.png', 'Ropa', 5, TRUE, '2026-04-04 00:38:07');

SELECT setval('catalogo_id_seq', 12);

-- ============================================================

-- GALERIA_FOTOS
CREATE TABLE IF NOT EXISTS galeria_fotos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL DEFAULT '',
  url VARCHAR(400) NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO galeria_fotos (id, titulo, url, orden, activo, creado_en) VALUES
(6, 'Ejemplo', 'https://res.cloudinary.com/dddljjigu/image/upload/v1775271322/blackdiamond/galeria/n76xdnyackkaokkn7hzn.png', 0, TRUE, '2026-04-04 02:03:26');

SELECT setval('galeria_fotos_id_seq', 7);

-- ============================================================

-- IMAGENES_SITIO
CREATE TABLE IF NOT EXISTS imagenes_sitio (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(60) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL,
  url VARCHAR(400) NOT NULL,
  actualizado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO imagenes_sitio (id, clave, label, url, actualizado) VALUES
(1, 'hero_bg', 'Fondo Hero (sección principal)', 'https://res.cloudinary.com/dddljjigu/image/upload/v1775271237/blackdiamond/sitio/ek9lkk35goqelbkhagdn.png', '2026-04-04 02:53:58'),
(2, 'logo_icono', 'Logo / Ícono del Gym (header y footer)', 'https://res.cloudinary.com/dddljjigu/image/upload/v1775271309/blackdiamond/sitio/namqruqy0zaldhgjvont.jpg', '2026-04-04 02:55:10'),
(3, 'historia', 'Imagen Nuestra Historia (boxeador)', 'https://res.cloudinary.com/dddljjigu/image/upload/v1775271238/blackdiamond/sitio/tnra33f0en2rbrjq68rx.jpg', '2026-04-04 02:53:59'),
(4, 'mike', 'Imagen Mike (sección horarios)', 'https://res.cloudinary.com/dddljjigu/image/upload/v1775271241/blackdiamond/sitio/y6o8gzvxu4y5ohe2l85m.png', '2026-04-04 02:54:01'),
(5, 'servicio_boxeo', 'Ícono Servicio Clases de Boxeo', 'https://res.cloudinary.com/dddljjigu/image/upload/v1775271247/blackdiamond/sitio/ekqxlxnbvrzumpt1vzs.png', '2026-04-04 02:54:08'),
(6, 'servicio_fitness', 'Ícono Servicio Acondicionamiento', 'https://res.cloudinary.com/dddljjigu/image/upload/v1775271248/blackdiamond/sitio/dmgg0tfmngr hlvmfkrww.png', '2026-04-04 02:54:08'),
(7, 'servicio_personal', 'Ícono Servicio Entrenamiento Personal', 'https://res.cloudinary.com/dddljjigu/image/upload/v1775271248/blackdiamond/sitio/kun0bk1ki2wvrlpacwg.jpg', '2026-04-04 02:54:09'),
(8, 'cat_edad', 'Categorías Foto "Por Edad"', 'https://res.cloudinary.com/dddljjigu/image/upload/v1775271255/blackdiamond/sitio/a1x42g9edyc2hm7i4ont.png', '2026-04-04 02:54:16'),
(9, 'cat_modalidad', 'Categorías Foto "Modalidades"', 'https://res.cloudinary.com/dddljjigu/image/upload/v1775271255/blackdiamond/sitio/eh0diu6kc40ijb8rkrqq.png', '2026-04-04 02:54:15');

SELECT setval('imagenes_sitio_id_seq', 10);

-- ============================================================

-- NOTICIAS
CREATE TABLE IF NOT EXISTS noticias (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  contenido TEXT NOT NULL,
  imagen_url VARCHAR(300),
  fecha_publicacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  admin_id INT REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fecha ON noticias(fecha_publicacion);

INSERT INTO noticias (id, titulo, contenido, imagen_url, fecha_publicacion, admin_id) VALUES
(12, '5', '5', NULL, '2026-04-04 02:13:39', 1),
(13, '6', '6', NULL, '2026-04-04 02:13:53', 1),
(14, 'Ejemplo', 'Ejemplo', 'https://res.cloudinary.com/dddljjigu/image/upload/v1775268863/blackdiamond/noticias/u7n5r53izp2hbwfgropr.jpg', '2026-04-04 02:14:23', 1),
(15, 'Ejemplo', 'Hola', NULL, '2026-04-11 22:39:35', 1),
(16, 'Gato fino', 'Gato', 'https://res.cloudinary.com/dddljjigu/image/upload/v1775955072/blackdiamond/noticias/mfrmmthbxoybj5aauhzz.jpg', '2026-04-12 00:51:13', 1);

SELECT setval('noticias_id_seq', 17);

-- ============================================================

-- PLANES
CREATE TABLE IF NOT EXISTS planes (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(60) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(200),
  precio INT NOT NULL,
  periodo VARCHAR(40) DEFAULT '/mes',
  actualizado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO planes (id, clave, nombre, descripcion, precio, periodo, actualizado) VALUES
(1, 'boxeo', 'BOXEO', 'Boxeo + Musculación + Funcional', 120000, '/mes', '2026-04-04 13:50:45'),
(2, 'gym', 'GYM', 'Musculación + Funcional', 75000, '/mes', '2026-04-04 13:50:45'),
(3, 'valera', 'VALERA', 'Boxeo + Musculacion', 60000, '/15 días', '2026-04-04 13:55:09'),
(4, 'dia_dir_boxeo', 'Dirigido Boxeo', 'Clase dirigida de boxeo', 20000, 'por clase', '2026-03-23 01:02:13'),
(5, 'dia_lib_boxeo', 'Libre Boxeo', 'Acceso libre zona boxeo', 15000, 'por clase', '2026-03-23 01:02:13'),
(6, 'dia_dir_gym', 'Dirigido Gym', 'Clase dirigida de gym', 15000, 'por clase', '2026-03-23 01:02:13'),
(7, 'dia_lib_gym', 'Libre Gym', 'Acceso libre zona gym', 10000, 'por clase', '2026-03-23 01:02:13');

SELECT setval('planes_id_seq', 8);

-- ============================================================

-- SOLICITUDES
CREATE TABLE IF NOT EXISTS solicitudes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(180),
  whatsapp VARCHAR(30),
  plan_interes VARCHAR(100),
  mensaje TEXT,
  leido BOOLEAN NOT NULL DEFAULT FALSE,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO solicitudes (id, nombre, email, whatsapp, plan_interes, mensaje, leido, fecha) VALUES
(2, 'Yo', 'admin@blackdiamondgym.co', NULL, 'Mensualidad Boxeo', NULL, FALSE, '2026-04-04 02:01:25'),
(3, 'Yo', 'admin@blackdiamondgym.co', NULL, 'Mensualidad Boxeo', NULL, FALSE, '2026-04-11 22:38:16');

SELECT setval('solicitudes_id_seq', 4);

-- ============================================================

-- TEXTOS_SITIO
CREATE TABLE IF NOT EXISTS textos_sitio (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(80) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  actualizado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO textos_sitio (id, clave, valor, actualizado) VALUES
(1, 'con-dir', 'Bosa, Bogotá D.C.', '2026-04-04 02:36:16'),
(2, 'con-wa', '573133737591', '2026-04-04 02:36:16'),
(3, 'con-ig', 'https://www.instagram.com/gym_blackdiamond_boxing_center/', '2026-04-04 02:36:16'),
(4, 'con-tk', 'https://www.tiktok.com/@gymblackdiamondboxingcen', '2026-04-04 02:36:16'),
(5, 'con-footer', '© 2026 Black Diamond Gym · Boxing Center · Bosa, Bogotá', '2026-04-04 02:36:16');

SELECT setval('textos_sitio_id_seq', 42);

-- ============================================================

-- VIDEOS_DESTACADOS
CREATE TABLE IF NOT EXISTS videos_destacados (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  url VARCHAR(500) NOT NULL,
  plataforma VARCHAR(20) NOT NULL DEFAULT 'instagram',
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO videos_destacados (id, titulo, url, plataforma, orden, activo, creado_en) VALUES
(1, 'Entrena con nosotros', 'https://www.instagram.com/p/DO3tb-kDpaA/', 'instagram', 1, TRUE, '2026-03-23 01:02:24'),
(3, 'Tiktok ejemplo', 'https://www.tiktok.com/@gymblackdiamondboxingcen/video/7524563298751188230?is_from_webapp=1&sender_device=pc&web_id=7624331905404487176', 'tiktok', 2, TRUE, '2026-04-03 01:02:58'),
(7, 'Facebook', 'https://www.facebook.com/watch/?v=984895340287684', 'facebook', 3, TRUE, '2026-04-03 02:59:03');

SELECT setval('videos_destacados_id_seq', 8);
