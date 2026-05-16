/* ================================================================
   CAFETERÍA — endpoints a añadir en server.js
   Pegar ANTES de la línea: app.get('/unete', ...)
================================================================ */

// Migración automática tabla cafeteria
(async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS cafeteria (
                id          SERIAL PRIMARY KEY,
                nombre      VARCHAR(120) NOT NULL,
                categoria   VARCHAR(60)  DEFAULT 'Otros',
                descripcion TEXT         DEFAULT '',
                precio      INT          NOT NULL DEFAULT 0,
                imagen_url  TEXT         DEFAULT '',
                disponible  BOOLEAN      NOT NULL DEFAULT TRUE,
                orden       INT          NOT NULL DEFAULT 0,
                creado      TIMESTAMPTZ  DEFAULT NOW()
            )
        `);
        console.log('✅ Tabla cafeteria OK');
    } catch(e) { console.warn('Migración cafeteria:', e.message); }
})();

// GET público — listar menú
app.get('/api/cafeteria', async (req, res) => {
    try {
        const { rows } = await query(
            'SELECT id,nombre,categoria,descripcion,precio,imagen_url,disponible,orden FROM cafeteria ORDER BY categoria,orden,nombre'
        );
        rows.forEach(r => r.imagen_url = fullUrl(req, r.imagen_url));
        res.json(rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST admin — crear ítem
app.post('/api/cafeteria', auth, upload.single('imagen'), async (req, res) => {
    const { nombre, categoria, descripcion, precio, disponible, orden } = req.body;
    if (!nombre || precio === undefined) return res.status(400).json({ error: 'Nombre y precio requeridos' });
    let img = '';
    if (req.file) img = await subirACloudinary(req.file.buffer, 'blackdiamond/cafeteria');
    try {
        const { rows: r } = await query(
            'INSERT INTO cafeteria (nombre,categoria,descripcion,precio,imagen_url,disponible,orden) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',
            [nombre.trim(), categoria||'Otros', descripcion||'', Number(precio), img,
             disponible!==false&&disponible!=='false', Number(orden)||0]
        );
        res.status(201).json({ mensaje: 'Ítem creado', id: r[0].id });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT admin — editar ítem
app.put('/api/cafeteria/:id', auth, upload.single('imagen'), async (req, res) => {
    const { nombre, categoria, descripcion, precio, disponible, orden } = req.body;
    try {
        const { rows } = await query('SELECT * FROM cafeteria WHERE id=$1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Ítem no encontrado' });
        const c = rows[0];
        let img = c.imagen_url;
        if (req.file) {
            await eliminarDeCloudinary(img);
            img = await subirACloudinary(req.file.buffer, 'blackdiamond/cafeteria');
        }
        await query(
            'UPDATE cafeteria SET nombre=$1,categoria=$2,descripcion=$3,precio=$4,imagen_url=$5,disponible=$6,orden=$7 WHERE id=$8',
            [nombre||c.nombre, categoria||c.categoria, descripcion??c.descripcion,
             precio!==undefined?Number(precio):c.precio, img,
             disponible!==undefined?(disponible!==false&&disponible!=='false'):c.disponible,
             orden!==undefined?Number(orden):c.orden, req.params.id]
        );
        res.json({ mensaje: 'Ítem actualizado' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE admin — eliminar ítem
app.delete('/api/cafeteria/:id', auth, async (req, res) => {
    try {
        const { rows } = await query('SELECT imagen_url FROM cafeteria WHERE id=$1', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Ítem no encontrado' });
        if (rows[0].imagen_url) await eliminarDeCloudinary(rows[0].imagen_url);
        await query('DELETE FROM cafeteria WHERE id=$1', [req.params.id]);
        res.json({ mensaje: 'Ítem eliminado' });
    } catch(e) { res.status(500).json({ error: e.message }); }
});
