-- ================================================================
--  BLACK DIAMOND GYM — Esquema MySQL COMPLETO v3
--  Incluye DROP DATABASE para instalación limpia.
-- ================================================================

DROP DATABASE IF EXISTS blackdiamond_gym;

CREATE DATABASE blackdiamond_gym
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE blackdiamond_gym;

-- ── admins ────────────────────────────────────────────────────
CREATE TABLE admins (
    id            INT          NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(120) NOT NULL,
    email         VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── noticias ──────────────────────────────────────────────────
CREATE TABLE noticias (
    id                INT          NOT NULL AUTO_INCREMENT,
    titulo            VARCHAR(200) NOT NULL,
    contenido         TEXT         NOT NULL,
    imagen_url        VARCHAR(300)          DEFAULT NULL,
    fecha_publicacion DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    admin_id          INT                   DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_fecha (fecha_publicacion),
    CONSTRAINT fk_noticia_admin
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── imagenes_sitio ────────────────────────────────────────────
CREATE TABLE imagenes_sitio (
    id          INT          NOT NULL AUTO_INCREMENT,
    clave       VARCHAR(60)  NOT NULL UNIQUE,
    label       VARCHAR(120) NOT NULL,
    url         VARCHAR(400) NOT NULL,
    actualizado DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── galeria_fotos ────────────────────────────────────────────
-- Fotos adicionales de la sección "Fotos y Videos" (ilimitadas)
CREATE TABLE galeria_fotos (
    id          INT          NOT NULL AUTO_INCREMENT,
    titulo      VARCHAR(150) NOT NULL DEFAULT '',
    url         VARCHAR(400) NOT NULL,
    orden       INT          NOT NULL DEFAULT 0,
    activo      TINYINT(1)   NOT NULL DEFAULT 1,
    creado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── planes ────────────────────────────────────────────────────
CREATE TABLE planes (
    id          INT          NOT NULL AUTO_INCREMENT,
    clave       VARCHAR(60)  NOT NULL UNIQUE,
    nombre      VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200)          DEFAULT NULL,
    precio      INT          NOT NULL,
    periodo     VARCHAR(40)           DEFAULT '/mes',
    actualizado DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── textos_sitio ─────────────────────────────────────────────
-- Textos editables de la página (hero, historia, horarios, etc.)
CREATE TABLE textos_sitio (
    id          INT          NOT NULL AUTO_INCREMENT,
    clave       VARCHAR(80)  NOT NULL UNIQUE,
    valor       TEXT         NOT NULL,
    actualizado DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── solicitudes ───────────────────────────────────────────────
CREATE TABLE solicitudes (
    id           INT          NOT NULL AUTO_INCREMENT,
    nombre       VARCHAR(150) NOT NULL,
    email        VARCHAR(180)          DEFAULT NULL,
    whatsapp     VARCHAR(30)           DEFAULT NULL,
    plan_interes VARCHAR(100)          DEFAULT NULL,
    mensaje      TEXT                  DEFAULT NULL,
    leido        TINYINT(1)   NOT NULL DEFAULT 0,
    fecha        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── videos_destacados ─────────────────────────────────────────
-- Almacena URLs de Instagram, TikTok o Facebook para incrustar.
CREATE TABLE videos_destacados (
    id          INT          NOT NULL AUTO_INCREMENT,
    titulo      VARCHAR(150) NOT NULL,
    url         VARCHAR(500) NOT NULL,   -- URL completa de la publicación
    plataforma  VARCHAR(20)  NOT NULL DEFAULT 'instagram',  -- instagram | tiktok | facebook
    orden       INT          NOT NULL DEFAULT 0,
    activo      TINYINT(1)   NOT NULL DEFAULT 1,
    creado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── catalogo ──────────────────────────────────────────────────
-- Productos deportivos que vende el gimnasio.
CREATE TABLE catalogo (
    id          INT            NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(150)   NOT NULL,
    descripcion TEXT                    DEFAULT NULL,
    precio      INT            NOT NULL,
    imagen_url  VARCHAR(400)            DEFAULT NULL,
    categoria   VARCHAR(80)             DEFAULT NULL,  -- Guantes | Ropa | Accesorios | etc.
    stock       INT            NOT NULL DEFAULT 0,
    activo      TINYINT(1)     NOT NULL DEFAULT 1,
    creado_en   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ================================================================
--  DATOS INICIALES
-- ================================================================

-- Admin (contraseña: Admin1234!)
INSERT INTO admins (nombre, email, password_hash) VALUES
('Profe Black Diamond','admin@blackdiamondgym.co',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi');

-- Noticia de ejemplo
INSERT INTO noticias (titulo, contenido) VALUES
('¡Bienvenidos a la nueva sección de noticias!',
 'Black Diamond Gym estrena su sistema de noticias en tiempo real. ¡Mantente conectado!');

-- Imágenes por defecto (TODAS las imágenes editables del sitio)
INSERT INTO imagenes_sitio (clave, label, url) VALUES
  ('hero_bg',          'Fondo Hero (sección principal)',          'MEDIA/Background.jpg'),
  ('logo_icono',       'Logo / Ícono del Gym (header y footer)',  'MEDIA/icono.jpg'),
  ('historia',         'Imagen Nuestra Historia (boxeador)',      'MEDIA/historia.jpg'),
  ('mike',             'Imagen Mike (sección horarios)',          'MEDIA/Mike.jpg'),
  ('servicio_boxeo',   'Ícono Servicio — Clases de Boxeo',        'MEDIA/boxeo.png'),
  ('servicio_fitness', 'Ícono Servicio — Acondicionamiento',      'MEDIA/fitness.png'),
  ('servicio_personal','Ícono Servicio — Entrenamiento Personal', 'MEDIA/sujeto.png'),
  ('cat_edad',         'Categorías — Foto "Por Edad"',            'MEDIA/cat_edad.jpg'),
  ('cat_modalidad',    'Categorías — Foto "Modalidades"',         'MEDIA/cat_modalidad.jpg');

-- Planes por defecto
INSERT INTO planes (clave, nombre, descripcion, precio, periodo) VALUES
  ('boxeo',         'BOXEO',         'Boxeo + Musculación + Funcional', 120000, '/mes'),
  ('gym',           'GYM',           'Musculación + Funcional',          75000, '/mes'),
  ('valera',        'VALERA',        'Boxeo + Musculación · 15 días',    60000, '/15 días'),
  ('dia_dir_boxeo', 'Dirigido Boxeo','Clase dirigida de boxeo',          20000, 'por clase'),
  ('dia_lib_boxeo', 'Libre Boxeo',   'Acceso libre zona boxeo',          15000, 'por clase'),
  ('dia_dir_gym',   'Dirigido Gym',  'Clase dirigida de gym',            15000, 'por clase'),
  ('dia_lib_gym',   'Libre Gym',     'Acceso libre zona gym',            10000, 'por clase');

-- Fotos iniciales de la galería
INSERT INTO galeria_fotos (titulo, url, orden) VALUES
  ('Entrenamiento Personal', 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=800', 1),
  ('Nuestros Campeones',     'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=800', 2),
  ('Clases Grupales',        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800', 3);

-- Videos de ejemplo
INSERT INTO videos_destacados (titulo, url, plataforma, orden) VALUES
  ('Entrena con nosotros', 'https://www.instagram.com/p/DO3tb-kDpaA/', 'instagram', 1),
  ('Black Diamond en acción', 'https://www.instagram.com/gym_blackdiamond_boxing_center/', 'instagram', 2);

-- Productos reales Black Diamond Gym
INSERT INTO catalogo (nombre, descripcion, precio, categoria, stock) VALUES
  ('Vendaje de Boxeo y Protectores Bucales',
   'Vendas de protección para nudillo, muñeca y articulaciones. Incluye protector bucal de alta resistencia. Ideales para entrenamiento diario.',
   1234, 'Protección', 30),

  ('Coderas, Muñequeras, Straps y Vendas de Rodilla',
   'Kit completo de protección articular: coderas ajustables, muñequeras de neopreno, straps de soporte y vendas de rodilla elásticas.',
   12345, 'Protección', 20),

  ('Kit Caretas Talla L/M + Guantes + Bucales + Vendas',
   'Paquete completo para sparring: careta ajustable talla L o M, guantes de boxeo, protector bucal y vendas de entrenamiento.',
   12345, 'Kits', 15),

  ('Guantes de Boxeo 10 oz',
   'Guantes profesionales de 10 onzas. Espuma de alta densidad, cuero sintético reforzado. Ideales para saco y mitt.',
   12345, 'Guantes', 10),

  ('Guantes de Boxeo 12 oz',
   'Guantes profesionales de 12 onzas. Perfectos para entrenamiento general y sparring ligero. Cierre de velcro seguro.',
   12345, 'Guantes', 10),

  ('Guantes de Boxeo 14 oz',
   'Guantes profesionales de 14 onzas. Mayor protección para sparring. Espuma multi-capa y palma ventilada.',
   12345, 'Guantes', 10),

  ('Zapatillas de Boxeo Everlast',
   'Zapatillas Everlast originales para boxeo. Suela antideslizante, bota alta para soporte de tobillo. Diseño profesional.',
   12345, 'Calzado', 8),

  ('Venta de Implementación Deportiva',
   'Venta de guantes de boxeo y caretas. Consulta disponibilidad de tallas y modelos con el profe.',
   50, 'Varios', 99);
