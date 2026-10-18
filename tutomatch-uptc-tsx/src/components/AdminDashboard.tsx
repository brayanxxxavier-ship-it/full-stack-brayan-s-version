import { FormEvent, type Dispatch, type ReactNode, type SetStateAction, useEffect, useState } from 'react';
import { BarChart3, Code, Database, FileText, LockKeyhole, LogIn, LogOut, Plus, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { categoryLabels } from '../lib/catalog';
import type { Category, Pqrs, Subject, Tutoria } from '../types';

export interface Administrador {
  id: string;
  email: string;
  nombre: string;
  created_at: string;
}

const emptyCounts: Record<Category, number> = { licenciaturas: 0, ingenierias: 0, arquitectura: 0 };

interface AdminDashboardProps {
  subjects: Subject[];
  setSubjects: Dispatch<SetStateAction<Subject[]>>;
}

export function AdminDashboard({ subjects, setSubjects }: AdminDashboardProps) {
  const [session, setSession] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [requests, setRequests] = useState<Tutoria[]>([]);
  const [pqrs, setPqrs] = useState<Pqrs[]>([]);
  const [admins, setAdmins] = useState<Administrador[]>([]);
  const [newSubject, setNewSubject] = useState({ nombre: '', categoria: 'ingenierias' as Category });
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Estado para generar y mostrar los datos de Supabase en formato JSON
  const [jsonExport, setJsonExport] = useState<string>('');
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(Boolean(data.session)));
    const auth = supabase.auth.onAuthStateChange((_event, next) => setSession(Boolean(next)));
    return () => auth.data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !supabase) return;
    const client = supabase; // Guardamos la referencia asegurada

    const load = async () => {
      const [requestResult, pqrsResult, subjectResult, adminsResult] = await Promise.all([
        client.from('solicitudes_tutoria').select('*').order('fecha_registro', { ascending: false }),
        client.from('pqrs').select('*').order('created_at', { ascending: false }),
        client.from('materias').select('*').order('categoria').order('nombre'),
        client.from('administradores').select('*').order('created_at', { ascending: false }),
      ]);
      setRequests(requestResult.data ?? []);
      setPqrs(pqrsResult.data ?? []);
      setSubjects(subjectResult.data ?? []);
      setAdmins(adminsResult.data ?? []);
    };

    void load();

    const channel = client
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_tutoria' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pqrs' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materias' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'administradores' }, () => void load())
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [session, setSubjects]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return setLoginError('Error de autenticación. Inténtalo más tarde.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError('Error de autenticación. Credenciales inválidas o no tienes permisos de acceso.');
  };

  const counts = requests.reduce(
    (acc, request) => {
      const subject = subjects.find((item) => item.nombre === request.materia_id);
      if (subject) acc[subject.categoria] += 1;
      return acc;
    },
    { ...emptyCounts }
  );

  const filtered = requests.filter((item) =>
    `${item.nombre} ${item.email_corp} ${item.codigo_est} ${item.materia_id}`.toLowerCase().includes(search.toLowerCase())
  );

  const addSubject = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !newSubject.nombre.trim()) return;
    const { data } = await supabase
      .from('materias')
      .insert({ nombre: newSubject.nombre.trim(), categoria: newSubject.categoria, activa: true })
      .select()
      .single();
    if (data) {
      setSubjects((current) => [...current, data]);
      setNewSubject({ nombre: '', categoria: newSubject.categoria });
    }
  };

  const updateSubject = async (subject: Subject) => {
    if (!supabase) return;
    await supabase.from('materias').update({ nombre: subject.nombre, categoria: subject.categoria }).eq('id', subject.id);
    setEditing(null);
  };

  const removeSubject = async (id: string) => {
    if (!supabase || !window.confirm('¿Desactivar esta asignatura?')) return;
    await supabase.from('materias').update({ activa: false }).eq('id', id);
    setSubjects((current) => current.filter((subject) => subject.id !== id));
  };

  // Función para serializar los datos activos de Supabase en JSON
  const handleGenerateJson = () => {
    const payload = {
      sistema: "TutoMatch UPTC",
      generado_en: new Date().toISOString(),
      estadisticas: {
        total_solicitudes: requests.length,
        materias_activas: subjects.length,
        pqrs_totales: pqrs.length,
        administradores_registrados: admins.length
      },
      registros_solicitudes: requests,
      catalogo_materias: subjects,
      pqrs_recibidas: pqrs,
      administradores: admins
    };
    setJsonExport(JSON.stringify(payload, null, 2));
  };

  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(jsonExport);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  if (!session) {
    return (
      <main className="container admin-page">
        <section className="login-card">
          <div className="admin-icon">
            <LockKeyhole size={22} />
          </div>
          <span className="eyebrow">ÁREA RESTRINGIDA</span>
          <h1>Dashboard <em>coordinación.</em></h1>
          <p>Inicia sesión con tus credenciales institucionales habilitadas para acceder al panel administrativo.</p>
          <form onSubmit={login}>
            <label className="field">
              <span>Correo administrador</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="coordinacion@uptc.edu.co"
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              <span>Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
            {loginError && <div className="form-feedback error">{loginError}</div>}
            <button className="submit-button">
              <strong>Entrar al dashboard</strong>
              <LogIn size={17} />
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="container admin-page">
      <div className="admin-header">
        <div>
          <span className="eyebrow">PANEL DE COORDINACIÓN · TIEMPO REAL</span>
          <h1>Todo bajo <em>control.</em></h1>
        </div>
        <button className="secondary-button" onClick={() => supabase?.auth.signOut()}>
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
      <div className="metrics">
        <Metric icon={<BarChart3 />} value={requests.length} label="Solicitudes" />
        <Metric icon={<Database />} value={subjects.length} label="Asignaturas activas" />
        <Metric icon={<FileText />} value={pqrs.filter((item) => item.estado === 'pendiente').length} label="PQRS pendientes" />
      </div>
      <section className="dashboard-grid">
        <div className="dashboard-card chart-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">DISTRIBUCIÓN</span>
              <h2>Solicitudes por área</h2>
            </div>
            <span className="live-badge"><i /> vivo</span>
          </div>
          <div className="bars">
            {(Object.keys(categoryLabels) as Category[]).map((category) => (
              <div className="bar-row" key={category}>
                <span>{categoryLabels[category]}</span>
                <div className="bar-track">
                  <i style={{ width: `${Math.min(100, Math.max(8, counts[category] * 12))}%` }} />
                </div>
                <strong>{counts[category]}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="dashboard-card catalog-admin">
          <div className="card-heading">
            <div>
              <span className="eyebrow">CRUD DE ASIGNATURAS</span>
              <h2>Catálogo</h2>
            </div>
          </div>
          <form className="inline-form" onSubmit={addSubject}>
            <input
              value={newSubject.nombre}
              onChange={(event) => setNewSubject({ ...newSubject, nombre: event.target.value })}
              placeholder="Nueva asignatura"
              required
            />
            <select
              value={newSubject.categoria}
              onChange={(event) => setNewSubject({ ...newSubject, categoria: event.target.value as Category })}
            >
              {(Object.keys(categoryLabels) as Category[]).map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>
            <button className="icon-button" aria-label="Crear asignatura">
              <Plus size={17} />
            </button>
          </form>
          <div className="admin-subject-list">
            {subjects.map((subject) => (
              <div className="admin-subject" key={subject.id}>
                {editing === subject.id ? (
                  <input
                    autoFocus
                    value={subject.nombre}
                    onChange={(event) =>
                      setSubjects((items) =>
                        items.map((item) => (item.id === subject.id ? { ...item, nombre: event.target.value } : item))
                      )
                    }
                    onBlur={() => void updateSubject(subject)}
                  />
                ) : (
                  <>
                    <span>
                      {subject.nombre}
                      <small>{categoryLabels[subject.categoria]}</small>
                    </span>
                    <button onClick={() => setEditing(subject.id)} aria-label={`Editar ${subject.nombre}`}>
                      Editar
                    </button>
                    <button onClick={() => void removeSubject(subject.id)} aria-label={`Desactivar ${subject.nombre}`}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARJETA AÑADIDA: Visualizador y exportador de datos Supabase en formato JSON */}
      <section className="dashboard-card requests-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">INTEROPERABILIDAD Y DATOS</span>
            <h2>Exportar registros en JSON</h2>
          </div>
          <button className="secondary-button" onClick={handleGenerateJson}>
            <Code size={16} /> Generar JSON de Supabase
          </button>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '16px' }}>
          Serializa en tiempo real los registros, materias y PQRS obtenidos desde la base de datos de Supabase.
        </p>

        {jsonExport && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button className="secondary-button" onClick={copyJsonToClipboard} style={{ fontSize: '13px', padding: '6px 12px' }}>
                {copiedJson ? '¡Copiado al portapapeles!' : 'Copiar JSON'}
              </button>
            </div>
            <div style={{ background: '#0f172a', color: '#38bdf8', padding: '16px', borderRadius: '8px', fontSize: '13px', overflowX: 'auto', maxHeight: '300px', fontFamily: 'monospace' }}>
              <pre>{jsonExport}</pre>
            </div>
          </div>
        )}
      </section>

      <section className="dashboard-card requests-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">REGISTROS</span>
            <h2>Estudiantes inscritos</h2>
          </div>
          <label className="search-field">
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, código…" />
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Correo</th>
                <th>Código</th>
                <th>Asignatura</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((request) => (
                <tr key={request.id}>
                  <td><strong>{request.nombre}</strong></td>
                  <td>{request.email_corp}</td>
                  <td>{request.codigo_est}</td>
                  <td><span className="table-tag">{request.materia_id}</span></td>
                  <td>{new Date(request.fecha_registro).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={5}>No hay registros que coincidan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="dashboard-card requests-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">EQUIPO</span>
            <h2>Administradores autorizados</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo Institucional</th>
                <th>Fecha alta</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td><strong>{admin.nombre}</strong></td>
                  <td>{admin.email}</td>
                  <td>{new Date(admin.created_at).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
              {!admins.length && (
                <tr>
                  <td colSpan={3}>No se encontraron administradores registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="dashboard-card requests-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">PQRS</span>
            <h2>Atención ciudadana</h2>
          </div>
        </div>
        <div className="pqrs-list">
          {pqrs.slice(0, 8).map((item) => (
            <div className="pqrs-row" key={item.id}>
              <span className="table-tag">{item.tipo}</span>
              <strong>{item.asunto}</strong>
              <span>{item.email_corp}</span>
              <small>{item.estado}</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="metric">
      <span>{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}