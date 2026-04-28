/* ================================================================
   BLACK DIAMOND GYM — Backend API v3 (PostgreSQL / Supabase)
   ================================================================
   POST /api/admin/login
   GET  /api/noticia              → última noticia (público)
   POST /api/noticia              → crear (admin)
   PUT  /api/noticia/:id          → editar (admin)
   GET  /api/imagenes             → todas (público)
   PUT  /api/imagenes/:clave      → actualizar (admin)
   GET  /api/planes               → todos (público)
   PUT  /api/planes/:clave        → actualizar (admin)
   POST /api/solicitudes          → guardar (público)
   GET  /api/solicitudes          → listar (admin)
   PUT  /api/solicitudes/:id      → editar (admin)
   PUT  /api/solicitudes/:id/leido
   DELETE /api/solicitudes/:id    → borrar (admin)
   GET  /api/videos               → listar (público)
   POST /api/videos               → crear (admin)
   PUT  /api/videos/:id           → editar (admin)
   DELETE /api/videos/:id         → borrar (admin)
   GET  /api/catalogo             → listar (público)
   POST /api/catalogo             → crear (admin)
   PUT  /api/catalogo/:id         → editar (admin)
   DELETE /api/catalogo/:id       → borrar (admin)
   GET  /api/textos               → listar (público)
   POST /api/textos               → guardar/actualizar (admin)
   GET  /api/galeria              → listar fotos galería (público)
   POST /api/galeria              → añadir foto (admin)
   PUT  /api/galeria/:id          → editar título/orden (admin)
   DELETE /api/galeria/:id        → borrar foto (admin)
================================================================ */

require('dotenv').config();
const express    = require('express');
const { Pool }   = require('pg');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const cors       = require('cors');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const rateLimit  = require('express-rate-limit');

// Máx 10 intentos de login cada 15 min por IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Demasiados intentos. Espera 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Máx 3 formularios de contacto por hora por IP
const solicitudesLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { error: 'Demasiadas solicitudes enviadas. Intenta en 1 hora.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const app  = express();
const PORT = process.env.PORT || 3000;

// Necesario para que express-rate-limit funcione correctamente en Render
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
// Servir archivos estáticos desde la raíz del repo (un nivel arriba de server/)
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static(path.join(__dirname)));

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Función para subir buffer a Cloudinary
function subirACloudinary(buffer, folder) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: folder || 'blackdiamond', resource_type: 'image' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        Readable.from(buffer).pipe(stream);
    });
}

// Función para eliminar imagen de Cloudinary por URL
async function eliminarDeCloudinary(url) {
    try {
        if (!url || !url.includes('cloudinary.com')) return;
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
        if (!match) return;
        const publicId = match[1];
        await cloudinary.uploader.destroy(publicId);
    } catch(e) { console.warn('Error eliminando de Cloudinary:', e.message); }
}

// ── Conexión PostgreSQL (Supabase) ───────────────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// Helper: ejecutar query con valores
const query = (text, params) => pool.query(text, params);

/* ── Multer — memoria en vez de disco ───────────────────────── */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8*1024*1024 },
    fileFilter: (req,f,cb) => {
        const ok = /jpeg|jpg|png|webp|x-icon|vnd\.microsoft\.icon/.test(f.mimetype) || f.originalname.toLowerCase().endsWith('.ico');
        cb(ok ? null : new Error('Solo JPG/PNG/WEBP/ICO'), ok);
    }
});

/* ── JWT ────────────────────────────────────────────────────── */
function auth(req, res, next) {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido' });
    try { req.usuario = jwt.verify(h.slice(7), process.env.JWT_SECRET||'secreto_dev'); next(); }
    catch { res.status(403).json({ error: 'Token inválido o expirado' }); }
}

/* ── Helper URL ─────────────────────────────────────────────── */
const fullUrl = (req, url) => url || null;

/* ================================================================
   AUTH
================================================================ */
app.post('/api/admin/login', loginLimiter, async (req, res) => {
    const { usuario, password } = req.body;
    if (!usuario||!password) return res.status(400).json({ error:'Faltan campos' });
    try {
        const { rows } = await query(
            'SELECT id, nombre, usuario, password_hash FROM admins WHERE usuario=$1 LIMIT 1',
            [usuario.trim()]
        );
        if (!rows.length) return res.status(401).json({ error:'Credenciales incorrectas' });
        if (!await bcrypt.compare(password, rows[0].password_hash.trim()))
            return res.status(401).json({ error:'Credenciales incorrectas' });
        const token = jwt.sign(
            { id:rows[0].id, usuario:rows[0].usuario, rol:'admin' },
            process.env.JWT_SECRET||'secreto_dev',
            { expiresIn:'8h' }
        );
        res.json({ token, nombre:rows[0].nombre });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ================================================================
   NOTICIAS
================================================================ */
app.get('/api/noticia', async (req, res) => {
    try {
        const { rows } = await query(
            'SELECT id,titulo,contenido,imagen_url,fecha_publicacion FROM noticias ORDER BY fecha_publicacion DESC LIMIT 1'
        );
        if (!rows.length) return res.status(404).json({ error:'Sin noticias' });
        const n = rows[0]; n.imagen_url = fullUrl(req, n.imagen_url); res.json(n);
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.post('/api/noticia', auth, upload.single('imagen'), async (req, res) => {
    const { titulo, contenido } = req.body;
    if (!titulo||!contenido) return res.status(400).json({ error:'Faltan campos' });
    let img = null;
    if (req.file) img = await subirACloudinary(req.file.buffer, 'blackdiamond/noticias');
    try {
        const { rows: r } = await query(
            'INSERT INTO noticias (titulo,contenido,imagen_url,fecha_publicacion,admin_id) VALUES($1,$2,$3,NOW(),$4) RETURNING id',
            [titulo.trim(), contenido.trim(), img, req.usuario.id]
        );

        // Mantener solo las últimas 5 noticias
        await query(`
            DELETE FROM noticias
            WHERE id NOT IN (
                SELECT id FROM noticias
                ORDER BY fecha_publicacion DESC
                LIMIT 5
            )
        `);

        res.status(201).json({ mensaje:'Noticia publicada', id: r[0].id });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/noticia/:id', auth, upload.single('imagen'), async (req, res) => {
    const { titulo, contenido } = req.body;
    try {
        const { rows } = await query('SELECT * FROM noticias WHERE id=$1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error:'No encontrada' });
        const n = rows[0]; let img = n.imagen_url;
        if (req.file) {
            await eliminarDeCloudinary(img);
            img = await subirACloudinary(req.file.buffer, 'blackdiamond/noticias');
        }
        await query(
            'UPDATE noticias SET titulo=$1,contenido=$2,imagen_url=$3,fecha_publicacion=NOW() WHERE id=$4',
            [titulo?.trim()||n.titulo, contenido?.trim()||n.contenido, img, req.params.id]
        );
        res.json({ mensaje:'Actualizada' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ================================================================
   IMÁGENES
================================================================ */
app.get('/api/imagenes', async (req, res) => {
    try {
        const { rows } = await query('SELECT clave,label,url FROM imagenes_sitio ORDER BY id');
        rows.forEach(r => r.url = fullUrl(req, r.url));
        res.json(rows);
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/imagenes/:clave', auth, upload.single('imagen'), async (req, res) => {
    try {
        const { rows } = await query('SELECT * FROM imagenes_sitio WHERE clave=$1', [req.params.clave]);
        if (!rows.length) return res.status(404).json({ error:'Clave no encontrada' });
        if (!req.file) return res.status(400).json({ error:'No se envió imagen' });
        await eliminarDeCloudinary(rows[0].url);
        const url = await subirACloudinary(req.file.buffer, 'blackdiamond/sitio');
        await query('UPDATE imagenes_sitio SET url=$1, actualizado=NOW() WHERE clave=$2', [url, req.params.clave]);
        res.json({ mensaje:'Imagen actualizada', url });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ================================================================
   PLANES
================================================================ */
app.get('/api/planes', async (req, res) => {
    try {
        const { rows } = await query('SELECT clave,nombre,descripcion,precio,periodo FROM planes ORDER BY id');
        res.json(rows);
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/planes/:clave', auth, async (req, res) => {
    const { nombre, descripcion, precio, periodo } = req.body;
    if (precio===undefined) return res.status(400).json({ error:'Precio requerido' });
    try {
        const { rows } = await query('SELECT * FROM planes WHERE clave=$1', [req.params.clave]);
        if (!rows.length) return res.status(404).json({ error:'Plan no encontrado' });
        const p = rows[0];
        await query(
            'UPDATE planes SET nombre=$1,descripcion=$2,precio=$3,periodo=$4,actualizado=NOW() WHERE clave=$5',
            [nombre||p.nombre, descripcion||p.descripcion, Number(precio), periodo||p.periodo, req.params.clave]
        );
        res.json({ mensaje:'Plan actualizado' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ================================================================
   SOLICITUDES
================================================================ */
app.post('/api/solicitudes', solicitudesLimiter, async (req, res) => {
    const { nombre, email, whatsapp, plan_interes, mensaje } = req.body;
    if (!nombre) return res.status(400).json({ error:'El nombre es obligatorio' });
    if (!email && !whatsapp) return res.status(400).json({ error:'Debes ingresar correo o WhatsApp' });
    const wa = whatsapp ? whatsapp.replace(/\D/g,'') : '';
    if (whatsapp && wa.length < 10) return res.status(400).json({ error:'WhatsApp debe tener al menos 10 dígitos' });
    try {
        const { rows: r } = await query(
            'INSERT INTO solicitudes (nombre,email,whatsapp,plan_interes,mensaje) VALUES($1,$2,$3,$4,$5) RETURNING id',
            [nombre.trim(), email||null, whatsapp||null, plan_interes||null, mensaje||null]
        );
        res.status(201).json({ mensaje:'Solicitud recibida', id: r[0].id });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.get('/api/solicitudes', auth, async (req, res) => {
    try {
        const { rows } = await query(
            'SELECT id, nombre, email, whatsapp, plan_interes, mensaje, leido, fecha FROM solicitudes ORDER BY fecha DESC'
        );
        res.json(rows);
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/solicitudes/:id', auth, async (req, res) => {
    const { nombre, email, whatsapp, plan_interes, mensaje, leido } = req.body;
    try {
        const { rows } = await query('SELECT * FROM solicitudes WHERE id=$1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error:'No encontrada' });
        const s = rows[0];
        await query(
            'UPDATE solicitudes SET nombre=$1,email=$2,whatsapp=$3,plan_interes=$4,mensaje=$5,leido=$6 WHERE id=$7',
            [nombre??s.nombre, email??s.email, whatsapp??s.whatsapp, plan_interes??s.plan_interes, mensaje??s.mensaje, leido??s.leido, req.params.id]
        );
        res.json({ mensaje:'Solicitud actualizada' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/solicitudes/:id/leido', auth, async (req, res) => {
    try {
        await query('UPDATE solicitudes SET leido=true WHERE id=$1', [req.params.id]);
        res.json({ mensaje:'Marcada como leída' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.delete('/api/solicitudes/:id', auth, async (req, res) => {
    try {
        await query('DELETE FROM solicitudes WHERE id=$1', [req.params.id]);
        res.json({ mensaje:'Solicitud eliminada' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ================================================================
   VIDEOS DESTACADOS
================================================================ */
app.get('/api/videos', async (req, res) => {
    try {
        const { rows } = await query(
            'SELECT id,titulo,url,plataforma,orden FROM videos_destacados WHERE activo=true ORDER BY orden,id'
        );
        res.json(rows);
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.post('/api/videos', auth, async (req, res) => {
    const { titulo, url, plataforma, orden } = req.body;
    if (!titulo||!url) return res.status(400).json({ error:'Título y URL requeridos' });
    const plat = plataforma || (url.includes('tiktok')?'tiktok': url.includes('facebook')||url.includes('fb.watch')?'facebook':'instagram');
    try {
        const { rows: r } = await query(
            'INSERT INTO videos_destacados (titulo,url,plataforma,orden) VALUES($1,$2,$3,$4) RETURNING id',
            [titulo.trim(), url.trim(), plat, orden||0]
        );
        res.status(201).json({ mensaje:'Video añadido', id: r[0].id });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/videos/:id', auth, async (req, res) => {
    const { titulo, url, plataforma, orden, activo } = req.body;
    try {
        const { rows } = await query('SELECT * FROM videos_destacados WHERE id=$1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error:'No encontrado' });
        const v = rows[0];
        const plat = plataforma||(url&&url.includes('tiktok')?'tiktok': url&&(url.includes('facebook')||url.includes('fb.watch'))?'facebook':v.plataforma);
        await query(
            'UPDATE videos_destacados SET titulo=$1,url=$2,plataforma=$3,orden=$4,activo=$5 WHERE id=$6',
            [titulo||v.titulo, url||v.url, plat, orden??v.orden, activo??v.activo, req.params.id]
        );
        res.json({ mensaje:'Video actualizado' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.delete('/api/videos/:id', auth, async (req, res) => {
    try {
        await query('DELETE FROM videos_destacados WHERE id=$1', [req.params.id]);
        res.json({ mensaje:'Video eliminado' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ================================================================
   CATÁLOGO
================================================================ */
/* Migración automática: tabla de imágenes extra por producto */
(async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS catalogo_imagenes (
                id        SERIAL PRIMARY KEY,
                producto_id INTEGER NOT NULL REFERENCES catalogo(id) ON DELETE CASCADE,
                url       TEXT NOT NULL,
                orden     INTEGER DEFAULT 0,
                creado    TIMESTAMPTZ DEFAULT NOW()
            )
        `);
    } catch(e) { console.warn('Migración catalogo_imagenes:', e.message); }
})();

app.get('/api/catalogo', async (req, res) => {
    try {
        const { rows } = await query(
            'SELECT id,nombre,descripcion,precio,imagen_url,categoria,stock FROM catalogo WHERE activo=true ORDER BY categoria,nombre'
        );
        // Cargar imágenes extra para cada producto
        const ids = rows.map(r => r.id);
        let extrasMap = {};
        if (ids.length) {
            const { rows: extras } = await query(
                'SELECT producto_id, url FROM catalogo_imagenes WHERE producto_id = ANY($1) ORDER BY orden, id',
                [ids]
            );
            extras.forEach(e => {
                if (!extrasMap[e.producto_id]) extrasMap[e.producto_id] = [];
                extrasMap[e.producto_id].push(fullUrl(req, e.url));
            });
        }
        rows.forEach(r => {
            r.imagen_url = fullUrl(req, r.imagen_url);
            // imagenes[] = imagen principal + extras
            r.imagenes = [
                ...(r.imagen_url ? [r.imagen_url] : []),
                ...(extrasMap[r.id] || [])
            ];
        });
        res.json(rows);
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.post('/api/catalogo', auth, upload.single('imagen'), async (req, res) => {
    const { nombre, descripcion, precio, categoria, stock } = req.body;
    if (!nombre||precio===undefined) return res.status(400).json({ error:'Nombre y precio requeridos' });
    let img = null;
    if (req.file) img = await subirACloudinary(req.file.buffer, 'blackdiamond/catalogo');
    try {
        const { rows: r } = await query(
            'INSERT INTO catalogo (nombre,descripcion,precio,imagen_url,categoria,stock) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',
            [nombre.trim(), descripcion||null, Number(precio), img, categoria||null, Number(stock)||0]
        );
        res.status(201).json({ mensaje:'Producto creado', id: r[0].id });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/catalogo/:id', auth, upload.single('imagen'), async (req, res) => {
    const { nombre, descripcion, precio, categoria, stock, activo } = req.body;
    try {
        const { rows } = await query('SELECT * FROM catalogo WHERE id=$1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error:'No encontrado' });
        const c = rows[0]; let img = c.imagen_url;
        if (req.file) {
            await eliminarDeCloudinary(img);
            img = await subirACloudinary(req.file.buffer, 'blackdiamond/catalogo');
        }
        await query(
            'UPDATE catalogo SET nombre=$1,descripcion=$2,precio=$3,imagen_url=$4,categoria=$5,stock=$6,activo=$7 WHERE id=$8',
            [nombre||c.nombre, descripcion??c.descripcion, precio!==undefined?Number(precio):c.precio,
             img, categoria||c.categoria, stock!==undefined?Number(stock):c.stock, activo??c.activo, req.params.id]
        );
        res.json({ mensaje:'Producto actualizado' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.delete('/api/catalogo/:id', auth, async (req, res) => {
    try {
        const { rows } = await query('SELECT imagen_url FROM catalogo WHERE id=$1', [req.params.id]);
        if (rows[0]?.imagen_url) await eliminarDeCloudinary(rows[0].imagen_url);
        // Eliminar también las imágenes extra de Cloudinary
        const { rows: extras } = await query('SELECT url FROM catalogo_imagenes WHERE producto_id=$1', [req.params.id]);
        await Promise.all(extras.map(e => eliminarDeCloudinary(e.url)));
        await query('DELETE FROM catalogo WHERE id=$1', [req.params.id]);
        res.json({ mensaje:'Producto eliminado' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ── Imágenes extra por producto ── */
app.post('/api/catalogo/:id/imagenes', auth, upload.single('imagen'), async (req, res) => {
    try {
        const { rows } = await query('SELECT id FROM catalogo WHERE id=$1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error:'Producto no encontrado' });
        if (!req.file) return res.status(400).json({ error:'Se requiere imagen' });
        const url = await subirACloudinary(req.file.buffer, 'blackdiamond/catalogo');
        const { rows: r } = await query(
            'INSERT INTO catalogo_imagenes (producto_id, url, orden) VALUES($1,$2,(SELECT COALESCE(MAX(orden),0)+1 FROM catalogo_imagenes WHERE producto_id=$1)) RETURNING id,url',
            [req.params.id, url]
        );
        res.status(201).json({ id: r[0].id, url });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.delete('/api/catalogo/:id/imagenes/:imgId', auth, async (req, res) => {
    try {
        const { rows } = await query('SELECT url FROM catalogo_imagenes WHERE id=$1 AND producto_id=$2', [req.params.imgId, req.params.id]);
        if (!rows.length) return res.status(404).json({ error:'Imagen no encontrada' });
        await eliminarDeCloudinary(rows[0].url);
        await query('DELETE FROM catalogo_imagenes WHERE id=$1', [req.params.imgId]);
        res.json({ mensaje:'Imagen eliminada' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.get('/api/catalogo/:id/imagenes', auth, async (req, res) => {
    try {
        const { rows } = await query(
            'SELECT id, url, orden FROM catalogo_imagenes WHERE producto_id=$1 ORDER BY orden, id',
            [req.params.id]
        );
        rows.forEach(r => r.url = fullUrl(req, r.url));
        res.json(rows);
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ================================================================
   GALERÍA DE FOTOS
================================================================ */
app.get('/api/galeria', async (req, res) => {
    try {
        const { rows } = await query(
            'SELECT id, titulo, url, orden FROM galeria_fotos WHERE activo=true ORDER BY orden, id'
        );
        rows.forEach(r => r.url = fullUrl(req, r.url));
        res.json(rows);
    } catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/galeria', auth, upload.single('imagen'), async (req, res) => {
    const { titulo, orden } = req.body;
    let url = req.body.url || null;
    if (req.file) url = await subirACloudinary(req.file.buffer, 'blackdiamond/galeria');
    if (!url) return res.status(400).json({ error: 'Se requiere imagen o URL' });
    try {
        const { rows: r } = await query(
            'INSERT INTO galeria_fotos (titulo, url, orden) VALUES ($1, $2, $3) RETURNING id',
            [titulo || '', url, parseInt(orden) || 0]
        );
        res.status(201).json({ mensaje: 'Foto añadida', id: r[0].id, url });
    } catch(e){ res.status(500).json({ error: e.message }); }
});

app.put('/api/galeria/:id', auth, upload.single('imagen'), async (req, res) => {
    const { titulo, orden } = req.body;
    try {
        const { rows } = await query('SELECT * FROM galeria_fotos WHERE id=$1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'No encontrada' });
        const f = rows[0];
        let url = f.url;
        if (req.file) {
            await eliminarDeCloudinary(url);
            url = await subirACloudinary(req.file.buffer, 'blackdiamond/galeria');
        }
        await query(
            'UPDATE galeria_fotos SET titulo=$1, url=$2, orden=$3 WHERE id=$4',
            [titulo ?? f.titulo, url, orden !== undefined ? parseInt(orden) : f.orden, req.params.id]
        );
        res.json({ mensaje: 'Foto actualizada', url });
    } catch(e){ res.status(500).json({ error: e.message }); }
});

app.delete('/api/galeria/:id', auth, async (req, res) => {
    try {
        const { rows } = await query('SELECT url FROM galeria_fotos WHERE id=$1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'No encontrada' });
        await eliminarDeCloudinary(rows[0].url);
        await query('DELETE FROM galeria_fotos WHERE id=$1', [req.params.id]);
        res.json({ mensaje: 'Foto eliminada' });
    } catch(e){ res.status(500).json({ error: e.message }); }
});

/* ================================================================
   TEXTOS DEL SITIO
================================================================ */
app.get('/api/textos', async (req, res) => {
    try {
        const { rows } = await query('SELECT clave, valor FROM textos_sitio');
        const obj = {};
        rows.forEach(r => obj[r.clave] = r.valor);
        res.json(obj);
    } catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/textos', auth, async (req, res) => {
    const textos = req.body;
    if (!textos || typeof textos !== 'object') return res.status(400).json({ error: 'Payload inválido' });
    const entries = Object.entries(textos);
    if (!entries.length) return res.status(400).json({ error: 'No se enviaron textos' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const [clave, valor] of entries) {
            await client.query(
                `INSERT INTO textos_sitio (clave, valor)
                 VALUES ($1, $2)
                 ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado = NOW()`,
                [clave, String(valor)]
            );
        }
        await client.query('COMMIT');
        res.json({ mensaje: 'Textos guardados', actualizados: entries.length });
    } catch(e) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

/* ================================================================
   GESTIÓN DE ADMINS
================================================================ */
// Listar admins
app.get('/api/admins', auth, async (req, res) => {
    try {
        const { rows } = await query('SELECT id, nombre, usuario, creado_en FROM admins ORDER BY id');
        res.json(rows);
    } catch(e){ res.status(500).json({ error: e.message }); }
});

// Crear admin
app.post('/api/admins', auth, async (req, res) => {
    const { nombre, usuario, password } = req.body;
    if (!nombre || !usuario || !password) return res.status(400).json({ error: 'Nombre, usuario y contraseña requeridos' });
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
    try {
        const existe = await query('SELECT id FROM admins WHERE usuario=$1', [usuario.trim()]);
        if (existe.rows.length) return res.status(400).json({ error: 'El usuario ya existe' });
        const hash = await bcrypt.hash(password, 10);
        const { rows: r } = await query(
            'INSERT INTO admins (nombre, usuario, password_hash) VALUES($1,$2,$3) RETURNING id',
            [nombre.trim(), usuario.trim(), hash]
        );
        await registrarLog(req.usuario.id, req.usuario.usuario, 'Creó admin', `Usuario: ${usuario.trim()}`);
        res.status(201).json({ mensaje: 'Admin creado', id: r[0].id });
    } catch(e){ res.status(500).json({ error: e.message }); }
});

// Eliminar admin
app.delete('/api/admins/:id', auth, async (req, res) => {
    if (parseInt(req.params.id) === req.usuario.id)
        return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    try {
        const { rows } = await query('SELECT usuario FROM admins WHERE id=$1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Admin no encontrado' });
        await query('DELETE FROM admins WHERE id=$1', [req.params.id]);
        await registrarLog(req.usuario.id, req.usuario.usuario, 'Eliminó admin', `Usuario: ${rows[0].usuario}`);
        res.json({ mensaje: 'Admin eliminado' });
    } catch(e){ res.status(500).json({ error: e.message }); }
});

// Cambiar contraseña propia
app.put('/api/admin/password', auth, async (req, res) => {
    const { actual, nueva } = req.body;
    if (!actual || !nueva) return res.status(400).json({ error: 'Contraseña actual y nueva requeridas' });
    if (nueva.length < 8) return res.status(400).json({ error: 'La nueva contraseña debe tener mínimo 8 caracteres' });
    try {
        const { rows } = await query('SELECT password_hash FROM admins WHERE id=$1', [req.usuario.id]);
        if (!rows.length) return res.status(404).json({ error: 'Admin no encontrado' });
        if (!await bcrypt.compare(actual, rows[0].password_hash.trim()))
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        const hash = await bcrypt.hash(nueva, 10);
        await query('UPDATE admins SET password_hash=$1 WHERE id=$2', [hash, req.usuario.id]);
        await registrarLog(req.usuario.id, req.usuario.usuario, 'Cambió contraseña', '');
        res.json({ mensaje: 'Contraseña actualizada' });
    } catch(e){ res.status(500).json({ error: e.message }); }
});

/* ================================================================
   LOG DE ACTIVIDAD
================================================================ */
async function registrarLog(adminId, adminUsuario, accion, detalle) {
    try {
        await query(
            'INSERT INTO log_actividad (admin_id, admin_usuario, accion, detalle) VALUES($1,$2,$3,$4)',
            [adminId, adminUsuario, accion, detalle || '']
        );
    } catch(e){ console.warn('Log error:', e.message); }
}

app.get('/api/log', auth, async (req, res) => {
    try {
        const { rows } = await query(
            'SELECT id, admin_usuario, accion, detalle, fecha FROM log_actividad ORDER BY fecha DESC LIMIT 100'
        );
        res.json(rows);
    } catch(e){ res.status(500).json({ error: e.message }); }
});

/* ================================================================
   CATÁLOGO — IMÁGENES EXTRA (SLIDER)
================================================================ */
app.get('/api/catalogo/:id/imagenes', auth, async (req, res) => {
    try {
        const { rows } = await query(
            'SELECT id, url, orden FROM catalogo_imagenes WHERE producto_id=$1 ORDER BY orden, id',
            [req.params.id]
        );
        res.json(rows);
    } catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/catalogo/:id/imagenes', auth, upload.single('imagen'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Se requiere imagen' });
    try {
        const url = await subirACloudinary(req.file.buffer, 'blackdiamond/catalogo');
        const { rows: r } = await query(
            'INSERT INTO catalogo_imagenes (producto_id, url) VALUES($1,$2) RETURNING id',
            [req.params.id, url]
        );
        res.status(201).json({ mensaje: 'Imagen agregada', id: r[0].id, url });
    } catch(e){ res.status(500).json({ error: e.message }); }
});

app.delete('/api/catalogo/:id/imagenes/:imgId', auth, async (req, res) => {
    try {
        const { rows } = await query('SELECT url FROM catalogo_imagenes WHERE id=$1 AND producto_id=$2', [req.params.imgId, req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Imagen no encontrada' });
        await eliminarDeCloudinary(rows[0].url);
        await query('DELETE FROM catalogo_imagenes WHERE id=$1', [req.params.imgId]);
        res.json({ mensaje: 'Imagen eliminada' });
    } catch(e){ res.status(500).json({ error: e.message }); }
});

/* ── Ruta /unete ────────────────────────────────────────────── */
app.get('/unete', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'unete.html'));
});

/* ── 404 ────────────────────────────────────────────────────── */
app.use((req, res) => {
    if (!req.path.startsWith('/api')) {
        res.status(404).sendFile(path.join(__dirname, '..', '404.html'));
    } else {
        res.status(404).json({ error: 'Ruta no encontrada' });
    }
});

/* ── Keep-alive Supabase ────────────────────────────────────── */
setInterval(async () => {
    try {
        await query('SELECT 1');
        console.log('✅ Supabase keep-alive OK');
    } catch(e) {
        console.warn('⚠️ Supabase keep-alive error:', e.message);
    }
}, 4 * 60 * 60 * 1000); // cada 4 horas

/* ── Listen ─────────────────────────────────────────────────── */
app.listen(PORT, () => {
    console.log(`✅ API corriendo en   http://localhost:${PORT}`);
    console.log(`🔑 Panel admin en     http://localhost:${PORT}/admin.html`);
});