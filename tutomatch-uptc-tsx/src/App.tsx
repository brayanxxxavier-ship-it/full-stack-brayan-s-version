import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, Menu, Moon, Send, Sun, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { categoryLabels, fallbackSubjects } from './lib/catalog';
import type { Category, Subject } from './types';
import { HeroSection } from './components/HeroSection';
import { HomeContent } from './components/HomeContent';
import { AdminDashboard } from './components/AdminDashboard';

type View = 'home' | 'admin' | 'privacy' | 'terms';

function useFadeSwitcher(words: string[], interval = 2800) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false); // Inicia el desvanecimiento
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setFade(true); // Aparece la nueva palabra
      }, 300); // Tiempo de la transición
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval]);

  return { text: words[index], fade };
}

function App() {
  const [view, setView] = useState<View>('home');
  const [dark, setDark] = useState(() => localStorage.getItem('tutomatch-theme') === 'dark');
  const [menuOpen, setMenuOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [pqrsOpen, setPqrsOpen] = useState(false);
  const { text: titleText, fade } = useFadeSwitcher(['Aprender', 'Entender', 'Avanzar']);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('tutomatch-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabase) {
        if (active) {
          setSubjects(
            Object.entries(fallbackSubjects).flatMap(([categoria, names]) =>
              names.map((nombre, index) => ({
                id: `fallback-${categoria}-${index}`,
                nombre,
                categoria: categoria as Category,
                activa: true,
                created_at: new Date().toISOString(),
              }))
            )
          );
          setLoadingSubjects(false);
        }
        return;
      }
      const { data } = await supabase.from('materias').select('*').eq('activa', true).order('categoria').order('nombre');
      if (active) {
        setSubjects(data ?? []);
        setLoadingSubjects(false);
      }
    };
    void load();
    if (!supabase) return () => { active = false; };
    
    const client = supabase;
    const channel = client
      .channel('public-materias')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materias' }, () => void load())
      .subscribe();
      
    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, []);

  const grouped = useMemo(
    () =>
      (Object.keys(categoryLabels) as Category[]).map((category) => ({
        category,
        label: categoryLabels[category],
        items: subjects.filter((subject) => subject.categoria === category),
      })),
    [subjects]
  );

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="site-header container">
        <button
          className="brand"
          onClick={() => {
            setView('home');
            setMenuOpen(false);
          }}
          aria-label="Volver al inicio"
        >
          <img src="/uptc-logo.svg" alt="Logo UPTC" />
          <span>
            <strong>TutoMatch</strong>
            <small>UPTC · acompañamiento académico</small>
          </span>
        </button>

        {/* MENÚ CON BURBUJA/PÍLDORA ACTIVA */}
        <nav className={menuOpen ? 'nav open' : 'nav'}>
          <button 
            className={view === 'home' ? 'nav-item-bubble active' : 'nav-item-bubble'}
            onClick={() => { setView('home'); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            Inicio
          </button>
          <button 
            className="nav-item-bubble"
            onClick={() => { setView('home'); setMenuOpen(false); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }); }}
          >
            Asignaturas
          </button>
          <button 
            className={view === 'admin' ? 'nav-item-bubble active' : 'nav-item-bubble'}
            onClick={() => { setView('admin'); setMenuOpen(false); }}
          >
            Dashboard
          </button>
        </nav>

        <div className="header-actions">
          <span className="status-pill"><i /> Plataforma activa</span>
          <button className="theme-toggle" onClick={() => setDark((value) => !value)} aria-label="Cambiar tema">
            {dark ? <Moon size={15} /> : <Sun size={15} />}
            <span>{dark ? 'Oscuro' : 'Claro'}</span>
          </button>
          <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menú">
            <Menu size={19} />
          </button>
        </div>
      </header>

      {view === 'home' && (
        <main className="container main-content">
          <HeroSection title={title} />
          <HomeContent grouped={grouped} loadingSubjects={loadingSubjects} onPqrs={() => setPqrsOpen(true)} />
        </main>
      )}

      {view === 'admin' && <AdminDashboard subjects={subjects} setSubjects={setSubjects} />}
      {view === 'privacy' && <LegalPage kind="privacy" />}
      {view === 'terms' && <LegalPage kind="terms" />}

      <footer className="footer container">
        <span>© 2026 TutoMatch UPTC</span>
        <div>
          <button onClick={() => setPqrsOpen(true)}>Servicio PQRS</button>
          <button onClick={() => setView('privacy')}>Privacidad</button>
          <button onClick={() => setView('terms')}>Uso del servicio</button>
        </div>
        <span>Hecho para aprender mejor <b>✦</b></span>
      </footer>
      {pqrsOpen && <PqrsModal onClose={() => setPqrsOpen(false)} />}
    </div>
  );
}

function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  return (
    <main className="container legal-page">
      <span className="eyebrow">
        TUTOMATCH UPTC · {kind === 'privacy' ? 'PRIVACIDAD' : 'USO DEL SERVICIO'}
      </span>
      <h1>
        {kind === 'privacy' ? <>Política de <em>privacidad.</em></> : <>Política de <em>uso.</em></>}
      </h1>
      <p className="legal-lead">Última actualización: octubre de 2026</p>
      {kind === 'privacy' ? (
        <>
          <h2>1. Datos que recopilamos</h2>
          <p>Recibimos nombre, correo institucional, código estudiantil, asignatura seleccionada y los datos que voluntariamente incluyas en una PQRS. Se utilizan para gestionar el acompañamiento académico y responder solicitudes.</p>
          <h2>2. Seguridad y conservación</h2>
          <p>La información se almacena con cifrado y control de acceso restringido para personal autorizado.</p>
          <h2>3. Tus derechos</h2>
          <p>Puedes solicitar consulta, corrección o eliminación de tus datos mediante el servicio PQRS.</p>
        </>
      ) : (
        <>
          <h2>1. Uso académico</h2>
          <p>TutoMatch UPTC es un canal de registro y orientación para tutorías. Debes entregar información verdadera.</p>
          <h2>2. Catálogo y disponibilidad</h2>
          <p>Las asignaturas, horarios y acompañamientos dependen de la disponibilidad institucional.</p>
          <h2>3. PQRS</h2>
          <p>Las PQRS deben ser respetuosas, claras y relacionadas con el servicio universitario.</p>
        </>
      )}
    </main>
  );
}

function PqrsModal({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    const data = new FormData(event.currentTarget);
    const { error } = await supabase.from('pqrs').insert({
      nombre: data.get('nombre'),
      email_corp: data.get('email_corp'),
      tipo: data.get('tipo'),
      asunto: data.get('asunto'),
      mensaje: data.get('mensaje'),
    });
    setSaving(false);
    if (!error) setSent(true);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pqrs-title">
      <div className="modal">
        <button className="close-button" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        {sent ? (
          <div className="success-state">
            <Check size={34} />
            <h2>Recibimos tu PQRS</h2>
            <p>Coordinación revisará tu mensaje y te contactará por correo institucional.</p>
            <button className="submit-button" onClick={onClose}>
              <strong>Volver al inicio</strong>
            </button>
          </div>
        ) : (
          <>
            <span className="eyebrow">SERVICIO PQRS</span>
            <h2 id="pqrs-title">Estamos para <em>escucharte.</em></h2>
            <form onSubmit={submit}>
              <label className="field">
                <span>Nombre completo</span>
                <input name="nombre" placeholder="Tu nombre" required />
              </label>
              <label className="field">
                <span>Correo institucional</span>
                <input name="email_corp" type="email" placeholder="nombre@uptc.edu.co" required />
              </label>
              <div className="field-row">
                <label className="field">
                  <span>Tipo</span>
                  <select name="tipo" defaultValue="peticion">
                    <option value="peticion">Petición</option>
                    <option value="queja">Queja</option>
                    <option value="reclamo">Reclamo</option>
                    <option value="sugerencia">Sugerencia</option>
                  </select>
                </label>
                <label className="field">
                  <span>Asunto</span>
                  <input name="asunto" required placeholder="¿Sobre qué?" />
                </label>
              </div>
              <label className="field">
                <span>Mensaje</span>
                <textarea name="mensaje" required minLength={10} placeholder="Cuéntanos con detalle…" />
              </label>
              <button className="submit-button" disabled={saving}>
                <strong>{saving ? 'Enviando…' : 'Enviar PQRS'}</strong>
                <Send size={17} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default App;