# Black Diamond Gym — Boxing Center

Sitio web oficial de **Black Diamond Gym**, un gimnasio de boxeo y fitness ubicado en el barrio Carbonel, localidad de Bosa, Bogotá, Colombia.

## 🥊 Descripción

Plataforma web completa con sitio público, panel de administración y API REST. Permite al gimnasio gestionar noticias, precios, galería, catálogo deportivo y solicitudes de contacto desde un panel sin necesidad de tocar código.

## 🌐 URLs

| Servicio | URL |
|----------|-----|
| Sitio web | https://black-diamond-gym-5d2h.onrender.com |
| Panel admin | https://black-diamond-gym-5d2h.onrender.com/admin.html |
| API | https://black-diamond-gym-5d2h.onrender.com/api |

## 🛠 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Backend | Node.js + Express |
| Base de datos | MySQL 8 — Aiven (Always Free) |
| Imágenes | Cloudinary (Free) |
| Hosting servidor | Render (Free) |
| Control de versiones | GitHub |

## 📁 Estructura del proyecto

```
Black-Diamond-Gym/
├── server/
│   ├── server.js          # API REST (Node.js + Express)
│   ├── package.json       # Dependencias
│   └── uploads/           # Carpeta temporal (no usar, imágenes van a Cloudinary)
├── index.html             # Sitio web público
├── admin.html             # Panel de administración
├── CSS.css                # Estilos
├── javascript.js          # Lógica del frontend
├── schema.sql             # Esquema de la base de datos
├── MEDIA/                 # Imágenes estáticas (miniaturas de videos)
│   ├── instagram.png
│   └── facebook.png
└── .gitignore
```

## ⚙️ Variables de entorno (Render)

```env
DB_HOST=<host_aiven>
DB_PORT=19935
DB_USER=avnadmin
DB_PASSWORD=<password_aiven>
DB_NAME=defaultdb
JWT_SECRET=<clave_secreta>
PORT=3000
CORS_ORIGIN=*
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
```

## 🗄 Base de datos

La BD corre en **Aiven** (MySQL 8, plan gratuito permanente, 1GB). Para restaurar desde cero ejecutar `schema.sql` en la instancia MySQL.

Tablas: `admins`, `noticias`, `imagenes_sitio`, `galeria_fotos`, `planes`, `textos_sitio`, `solicitudes`, `videos_destacados`, `catalogo`.

## 🔑 Acceso al panel admin

| Usuario | Contraseña |
|---------|-----------|
| blackdiamond1 | Admin1234! |
| blackdiamond2 | Admin1234! |
| blackdiamond3 | Admin1234! |

## 🚀 Correr en local

```bash
cd server
npm install
# Crear .env con las variables de entorno
npm run dev
```

## 📦 Dependencias principales

- `express` — servidor HTTP
- `mysql2` — conexión a MySQL
- `bcryptjs` — hash de contraseñas
- `jsonwebtoken` — autenticación JWT
- `multer` — manejo de archivos
- `cloudinary` — almacenamiento de imágenes
- `cors` — política de origen cruzado
- `dotenv` — variables de entorno