/* ================================================================
   BLACK DIAMOND GYM — Backend API v3
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
const mysql      = require('mysql2/promise');
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

// Máx 5 formularios de contacto por hora por IP
const solicitudesLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { error: 'Demasiadas solicitudes enviadas. Intenta en 1 hora.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
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
        const partes = url.split('/');
        const archivo = partes[partes.length - 1].split('.')[0];
        const folder  = partes[partes.length - 2];
        await cloudinary.uploader.destroy(`${folder}/${archivo}`);
    } catch(e) { console.warn('Error eliminando de Cloudinary:', e.message); }
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blackdiamond_gym',
    waitForConnections: true, connectionLimit: 10,
    charset: 'utf8mb4',
    ssl: process.env.DB_HOST?.includes('aivencloud.com') ? { rejectUnauthorized: false } : false,
});

/* ── Multer — memoria en vez de disco ───────────────────────── */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8*1024*1024 },
    fileFilter: (req,f,cb) => cb(/jpeg|jpg|png|webp/.test(f.mimetype)?null:new Error('Solo JPG/PNG/WEBP'),/jpeg|jpg|png|webp/.test(f.mimetype))
});

/* ── JWT ────────────────────────────────────────────────────── */
function auth(req, res, next) {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token requerido' });
    try { req.usuario = jwt.verify(h.slice(7), process.env.JWT_SECRET||'secreto_dev'); next(); }
    catch { res.status(403).json({ error: 'Token inválido o expirado' }); }
}

/* ── Helper URL — Cloudinary ya devuelve URLs absolutas ─────── */
const fullUrl = (req, url) => url || null;

/* ================================================================
   AUTH
================================================================ */
app.post('/api/admin/login', loginLimiter, async (req, res) => {
    const { usuario, password } = req.body;
    if (!usuario||!password) return res.status(400).json({ error:'Faltan campos' });
    try {
        const [rows] = await pool.query('SELECT id, nombre, usuario, password_hash FROM admins WHERE usuario=? LIMIT 1',[usuario.trim()]);
        if (!rows.length) return res.status(401).json({ error:'Credenciales incorrectas' });
        if (!await bcrypt.compare(password, rows[0].password_hash.trim()))
            return res.status(401).json({ error:'Credenciales incorrectas' });
        const token = jwt.sign({ id:rows[0].id, usuario:rows[0].usuario, rol:'admin' },
            process.env.JWT_SECRET||'secreto_dev', { expiresIn:'8h' });
        res.json({ token, nombre:rows[0].nombre });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ================================================================
   NOTICIAS
================================================================ */
app.get('/api/noticia', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id,titulo,contenido,imagen_url,fecha_publicacion FROM noticias ORDER BY fecha_publicacion DESC LIMIT 1');
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
        const [r] = await pool.query('INSERT INTO noticias (titulo,contenido,imagen_url,fecha_publicacion,admin_id) VALUES(?,?,?,NOW(),?)',
            [titulo.trim(),contenido.trim(),img,req.usuario.id]);

        // Mantener solo las últimas 5 noticias — borrar las más antiguas
        await pool.query(`
            DELETE FROM noticias
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id FROM noticias
                    ORDER BY fecha_publicacion DESC
                    LIMIT 5
                ) tmp
            )
        `);

        res.status(201).json({ mensaje:'Noticia publicada', id:r.insertId });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/noticia/:id', auth, upload.single('imagen'), async (req, res) => {
    const { titulo, contenido } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM noticias WHERE id=?',[req.params.id]);
        if (!rows.length) return res.status(404).json({ error:'No encontrada' });
        const n = rows[0]; let img = n.imagen_url;
        if (req.file) {
            await eliminarDeCloudinary(img);
            img = await subirACloudinary(req.file.buffer, 'blackdiamond/noticias');
        }
        await pool.query('UPDATE noticias SET titulo=?,contenido=?,imagen_url=?,fecha_publicacion=NOW() WHERE id=?',
            [titulo?.trim()||n.titulo, contenido?.trim()||n.contenido, img, req.params.id]);
        res.json({ mensaje:'Actualizada' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ================================================================
   IMÁGENES
================================================================ */
app.get('/api/imagenes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT clave,label,url FROM imagenes_sitio ORDER BY id');
        rows.forEach(r => r.url = fullUrl(req, r.url));
        res.json(rows);
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/imagenes/:clave', auth, upload.single('imagen'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM imagenes_sitio WHERE clave=?',[req.params.clave]);
        if (!rows.length) return res.status(404).json({ error:'Clave no encontrada' });
        if (!req.file) return res.status(400).json({ error:'No se envió imagen' });
        await eliminarDeCloudinary(rows[0].url);
        const url = await subirACloudinary(req.file.buffer, 'blackdiamond/sitio');
        await pool.query('UPDATE imagenes_sitio SET url=? WHERE clave=?',[url, req.params.clave]);
        res.json({ mensaje:'Imagen actualizada', url });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ================================================================
   PLANES
================================================================ */
app.get('/api/planes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT clave,nombre,descripcion,precio,periodo FROM planes ORDER BY id');
        res.json(rows);
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/planes/:clave', auth, async (req, res) => {
    const { nombre, descripcion, precio, periodo } = req.body;
    if (precio===undefined) return res.status(400).json({ error:'Precio requerido' });
    try {
        const [rows] = await pool.query('SELECT * FROM planes WHERE clave=?',[req.params.clave]);
        if (!rows.length) return res.status(404).json({ error:'Plan no encontrado' });
        const p = rows[0];
        await pool.query('UPDATE planes SET nombre=?,descripcion=?,precio=?,periodo=? WHERE clave=?',
            [nombre||p.nombre, descripcion||p.descripcion, Number(precio), periodo||p.periodo, req.params.clave]);
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
        const [r] = await pool.query('INSERT INTO solicitudes (nombre,email,whatsapp,plan_interes,mensaje) VALUES(?,?,?,?,?)',
            [nombre.trim(), email||null, whatsapp||null, plan_interes||null, mensaje||null]);
        res.status(201).json({ mensaje:'Solicitud recibida', id:r.insertId });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.get('/api/solicitudes', auth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, nombre, email, whatsapp, plan_interes, mensaje, leido, fecha FROM solicitudes ORDER BY fecha DESC');
        res.json(rows);
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/solicitudes/:id', auth, async (req, res) => {
    const { nombre, email, whatsapp, plan_interes, mensaje, leido } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM solicitudes WHERE id=?',[req.params.id]);
        if (!rows.length) return res.status(404).json({ error:'No encontrada' });
        const s = rows[0];
        await pool.query('UPDATE solicitudes SET nombre=?,email=?,whatsapp=?,plan_interes=?,mensaje=?,leido=? WHERE id=?',
            [nombre??s.nombre, email??s.email, whatsapp??s.whatsapp, plan_interes??s.plan_interes, mensaje??s.mensaje, leido??s.leido, req.params.id]);
        res.json({ mensaje:'Solicitud actualizada' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/solicitudes/:id/leido', auth, async (req, res) => {
    try {
        await pool.query('UPDATE solicitudes SET leido=1 WHERE id=?',[req.params.id]);
        res.json({ mensaje:'Marcada como leída' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.delete('/api/solicitudes/:id', auth, async (req, res) => {
    try {
        await pool.query('DELETE FROM solicitudes WHERE id=?',[req.params.id]);
        res.json({ mensaje:'Solicitud eliminada' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ================================================================
   VIDEOS DESTACADOS
================================================================ */
app.get('/api/videos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id,titulo,url,plataforma,orden FROM videos_destacados WHERE activo=1 ORDER BY orden,id');
        res.json(rows);
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.post('/api/videos', auth, async (req, res) => {
    const { titulo, url, plataforma, orden } = req.body;
    if (!titulo||!url) return res.status(400).json({ error:'Título y URL requeridos' });
    // Detectar plataforma automáticamente si no se especifica
    const plat = plataforma || (url.includes('tiktok')?'tiktok': url.includes('facebook')||url.includes('fb.watch')?'facebook':'instagram');
    try {
        const [r] = await pool.query('INSERT INTO videos_destacados (titulo,url,plataforma,orden) VALUES(?,?,?,?)',
            [titulo.trim(), url.trim(), plat, orden||0]);
        res.status(201).json({ mensaje:'Video añadido', id:r.insertId });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/videos/:id', auth, async (req, res) => {
    const { titulo, url, plataforma, orden, activo } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM videos_destacados WHERE id=?',[req.params.id]);
        if (!rows.length) return res.status(404).json({ error:'No encontrado' });
        const v = rows[0];
        const plat = plataforma||(url&&url.includes('tiktok')?'tiktok': url&&(url.includes('facebook')||url.includes('fb.watch'))?'facebook':v.plataforma);
        await pool.query('UPDATE videos_destacados SET titulo=?,url=?,plataforma=?,orden=?,activo=? WHERE id=?',
            [titulo||v.titulo, url||v.url, plat, orden??v.orden, activo??v.activo, req.params.id]);
        res.json({ mensaje:'Video actualizado' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.delete('/api/videos/:id', auth, async (req, res) => {
    try {
        await pool.query('DELETE FROM videos_destacados WHERE id=?',[req.params.id]);
        res.json({ mensaje:'Video eliminado' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ================================================================
   CATÁLOGO
================================================================ */
app.get('/api/catalogo', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id,nombre,descripcion,precio,imagen_url,categoria,stock FROM catalogo WHERE activo=1 ORDER BY categoria,nombre');
        rows.forEach(r => r.imagen_url = fullUrl(req, r.imagen_url));
        res.json(rows);
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.post('/api/catalogo', auth, upload.single('imagen'), async (req, res) => {
    const { nombre, descripcion, precio, categoria, stock } = req.body;
    if (!nombre||precio===undefined) return res.status(400).json({ error:'Nombre y precio requeridos' });
    let img = null;
    if (req.file) img = await subirACloudinary(req.file.buffer, 'blackdiamond/catalogo');
    try {
        const [r] = await pool.query('INSERT INTO catalogo (nombre,descripcion,precio,imagen_url,categoria,stock) VALUES(?,?,?,?,?,?)',
            [nombre.trim(), descripcion||null, Number(precio), img, categoria||null, Number(stock)||0]);
        res.status(201).json({ mensaje:'Producto creado', id:r.insertId });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.put('/api/catalogo/:id', auth, upload.single('imagen'), async (req, res) => {
    const { nombre, descripcion, precio, categoria, stock, activo } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM catalogo WHERE id=?',[req.params.id]);
        if (!rows.length) return res.status(404).json({ error:'No encontrado' });
        const c = rows[0]; let img = c.imagen_url;
        if (req.file) {
            await eliminarDeCloudinary(img);
            img = await subirACloudinary(req.file.buffer, 'blackdiamond/catalogo');
        }
        await pool.query('UPDATE catalogo SET nombre=?,descripcion=?,precio=?,imagen_url=?,categoria=?,stock=?,activo=? WHERE id=?',
            [nombre||c.nombre, descripcion??c.descripcion, precio!==undefined?Number(precio):c.precio,
             img, categoria||c.categoria, stock!==undefined?Number(stock):c.stock, activo??c.activo, req.params.id]);
        res.json({ mensaje:'Producto actualizado' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

app.delete('/api/catalogo/:id', auth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT imagen_url FROM catalogo WHERE id=?',[req.params.id]);
        if (rows[0]?.imagen_url) await eliminarDeCloudinary(rows[0].imagen_url);
        await pool.query('DELETE FROM catalogo WHERE id=?',[req.params.id]);
        res.json({ mensaje:'Producto eliminado' });
    } catch(e){ res.status(500).json({ error:e.message }); }
});

/* ================================================================
   GALERÍA DE FOTOS
================================================================ */
app.get('/api/galeria', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, titulo, url, orden FROM galeria_fotos WHERE activo=1 ORDER BY orden, id'
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
        const [r] = await pool.query(
            'INSERT INTO galeria_fotos (titulo, url, orden) VALUES (?, ?, ?)',
            [titulo || '', url, parseInt(orden) || 0]
        );
        res.status(201).json({ mensaje: 'Foto añadida', id: r.insertId, url });
    } catch(e){ res.status(500).json({ error: e.message }); }
});

app.put('/api/galeria/:id', auth, upload.single('imagen'), async (req, res) => {
    const { titulo, orden } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM galeria_fotos WHERE id=?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'No encontrada' });
        const f = rows[0];
        let url = f.url;
        if (req.file) {
            await eliminarDeCloudinary(url);
            url = await subirACloudinary(req.file.buffer, 'blackdiamond/galeria');
        }
        await pool.query(
            'UPDATE galeria_fotos SET titulo=?, url=?, orden=? WHERE id=?',
            [titulo ?? f.titulo, url, orden !== undefined ? parseInt(orden) : f.orden, req.params.id]
        );
        res.json({ mensaje: 'Foto actualizada', url });
    } catch(e){ res.status(500).json({ error: e.message }); }
});

app.delete('/api/galeria/:id', auth, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT url FROM galeria_fotos WHERE id=?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'No encontrada' });
        await eliminarDeCloudinary(rows[0].url);
        await pool.query('DELETE FROM galeria_fotos WHERE id=?', [req.params.id]);
        res.json({ mensaje: 'Foto eliminada' });
    } catch(e){ res.status(500).json({ error: e.message }); }
});

/* ================================================================
   TEXTOS DEL SITIO
================================================================ */
app.get('/api/textos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT clave, valor FROM textos_sitio');
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
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const placeholders = entries.map(() => '(?, ?)').join(', ');
        const values = entries.flatMap(([clave, valor]) => [clave, String(valor)]);
        await conn.query(
            `INSERT INTO textos_sitio (clave, valor) VALUES ${placeholders}
             ON DUPLICATE KEY UPDATE valor = VALUES(valor), actualizado = NOW()`,
            values
        );
        await conn.commit();
        res.json({ mensaje: 'Textos guardados', actualizados: entries.length });
    } catch(e) {
        await conn.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        conn.release();
    }
});

/* ── Listen ─────────────────────────────────────────────────── */
app.listen(PORT, () => {
    console.log(`✅ API corriendo en   http://localhost:${PORT}`);
    console.log(`🔑 Panel admin en     http://localhost:${PORT}/admin.html`);
});