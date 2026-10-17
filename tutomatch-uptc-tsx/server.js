import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const app = express();
const port = Number(process.env.PORT || 3000);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } }) : null;

const requestSchema = z.object({
  nombre: z.string().trim().min(3).max(120).regex(/^[\p{L} .'-]+$/u, 'El nombre contiene caracteres no válidos.'),
  email_corp: z.string().trim().toLowerCase().email().refine((email) => email.endsWith('@uptc.edu.co'), 'Usa tu correo institucional @uptc.edu.co.'),
  codigo_est: z.string().trim().regex(/^\d{5,12}$/, 'El código debe contener entre 5 y 12 números.'),
  materia_id: z.string().trim().min(2).max(80)
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '20kb' }));
app.use(express.static('dist'));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'tutomatch-uptc' }));

app.post('/api/tutorias', async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, message: 'Revisa los campos del formulario.', errors: parsed.error.flatten().fieldErrors });
  if (!supabase) return res.status(503).json({ ok: false, message: 'Supabase no está configurado. Completa las variables de entorno.' });

  try {
    const { data: existing, error: lookupError } = await supabase.from('solicitudes_tutoria').select('id').eq('codigo_est', parsed.data.codigo_est).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return res.status(409).json({ ok: false, message: 'Ya existe una solicitud registrada con este código estudiantil.' });

    const { data, error } = await supabase.from('solicitudes_tutoria').insert(parsed.data).select('id,nombre,email_corp,codigo_est,materia_id,fecha_registro').single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ ok: false, message: 'Este código estudiantil ya tiene una solicitud.' });
      throw error;
    }
    return res.status(201).json({ ok: true, message: 'Solicitud registrada correctamente.', data });
  } catch (error) {
    console.error('[POST /api/tutorias]', error);
    return res.status(500).json({ ok: false, message: 'No fue posible registrar la solicitud. Intenta nuevamente.' });
  }
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, message: 'Ruta API no encontrada.' });
  return res.sendFile('index.html', { root: 'dist' });
});
app.listen(port, () => console.log(`TutoMatch UPTC escuchando en http://localhost:${port}`));
