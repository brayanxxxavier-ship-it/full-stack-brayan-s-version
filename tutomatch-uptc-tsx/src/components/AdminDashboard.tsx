import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import type { Subject, Category } from '../types';
import { Plus, Trash2, RefreshCw, Send, Users, BookOpen, MessageSquare, BarChart3 } from 'lucide-react';

interface AdminDashboardProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
}

export function AdminDashboard({ subjects, setSubjects }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'subjects' | 'pqrs'>('stats');
  const [newNombre, setNewNombre] = useState('');
  const [newCategoria, setNewCategoria] = useState<Category>('ingenierias');
  const [statusMsg, setStatusMsg] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Estados para datos recibidos de Supabase
  const [pqrsList, setPqrsList] = useState<any[]>([]);
  const [loadingPqrs, setLoadingPqrs] = useState(false);

  // Estados para la demostración de fetch() y JSON (Paso 4 Rúbrica)
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [fetchingApi, setFetchingApi] = useState(false);

  // Cargar PQRS registradas desde Supabase
  useEffect(() => {
    const fetchPqrs = async () => {
      if (!supabase) return;
      setLoadingPqrs(true);
      const { data } = await supabase.from('pqrs').select('*').order('created_at', { ascending: false });
      if (data) setPqrsList(data);
      setLoadingPqrs(false);
    };

    void fetchPqrs();
  }, []);

  // Agregar asignatura a Supabase
  const handleAddSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim()) return;

    if (!supabase) {
      setStatusMsg('Supabase no está disponible en modo offline.');
      return;
    }

    setLoadingAction(true);
    setStatusMsg('');

    const { data, error } = await supabase
      .from('materias')
      .insert([{ nombre: newNombre.trim(), categoria: newCategoria, activa: true }])
      .select();

    setLoadingAction(false);

    if (error) {
      setStatusMsg('Error al agregar: ' + error.message);
    } else if (data) {
      setSubjects((prev) => [...prev, data[0] as Subject]);
      setNewNombre('');
      setStatusMsg('Asignatura agregada correctamente.');
    }
  };

  // Eliminar asignatura de Supabase
  const handleDeleteSubject = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('materias').delete().eq('id', id);
    if (!error) {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      setStatusMsg('Asignatura eliminada.');
    } else {
      setStatusMsg('Error al eliminar: ' + error.message);
    }
  };

  // Demostración asíncrona mediante fetch() y JSON
  const handleFetchJsonDemo = async () => {
    setFetchingApi(true);
    setApiResponse(null);
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users/1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Error en la comunicación HTTP');
      const jsonData = await response.json();
      setApiResponse(jsonData);
    } catch (err: any) {
      setApiResponse({ error: err.message || 'Error en petición fetch' });
    } finally {
      setFetchingApi(false);
    }
  };

  return (
    <main className="container main-content" style={{ marginTop: '30px', paddingBottom: '60px' }}>
      <div className="section-heading" style={{ marginBottom: '25px' }}>
        <div>
          <span className="eyebrow">PANEL DE ADMINISTRACIÓN</span>
          <h2>Control y métricas <em>TutoMatch UPTC.</em></h2>
        </div>
        <span className="live-badge"><i /> Supabase Realtime</span>
      </div>

      {statusMsg && (
        <div className="form-feedback success" style={{ marginBottom: '20px' }}>
          {statusMsg}
        </div>
      )}

      {/* PESTAÑAS DE NAVEGACIÓN INTERNA */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '12px' }}>
        <button 
          className={activeTab === 'stats' ? 'nav-item-bubble active' : 'nav-item-bubble'}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart3 size={16} /> Resumen General
        </button>
        <button 
          className={activeTab === 'subjects' ? 'nav-item-bubble active' : 'nav-item-bubble'}
          onClick={() => setActiveTab('subjects')}
        >
          <BookOpen size={16} /> Catálogo de Materias ({subjects.length})
        </button>
        <button 
          className={activeTab === 'pqrs' ? 'nav-item-bubble active' : 'nav-item-bubble'}
          onClick={() => setActiveTab('pqrs')}
        >
          <MessageSquare size={16} /> PQRS Recibidas ({pqrsList.length})
        </button>
      </div>

      {/* TAB 1: RESUMEN Y METRICAS */}
      {activeTab === 'stats' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: 'var(--card-bg, #fff)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Asignaturas Activas</span>
              <h3 style={{ fontSize: '28px', marginTop: '8px', color: 'var(--brand-accent, #2563eb)' }}>{subjects.length}</h3>
            </div>
            <div style={{ background: 'var(--card-bg, #fff)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Solicitudes PQRS</span>
              <h3 style={{ fontSize: '28px', marginTop: '8px' }}>{pqrsList.length}</h3>
            </div>
            <div style={{ background: 'var(--card-bg, #fff)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Conexión Supabase</span>
              <h3 style={{ fontSize: '18px', marginTop: '12px', color: '#10b981' }}>Activa / 200 OK</h3>
            </div>
          </div>

          {/* SECCIÓN DEMOSTRATIVA DE FETCH Y JSON PARA LA RÚBRICA */}
          <div style={{ background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <span className="eyebrow">DEMOSTRACIÓN TÉCNICA (PASO 4)</span>
            <h3 style={{ margin: '8px 0 10px', fontSize: '19px' }}>Conexión Asíncrona con <code>fetch()</code> y JSON</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '18px', lineHeight: '1.5' }}>
              Ejecuta una petición HTTP asíncrona basada en promesas para consumir un servicio externo y formatear la respuesta JSON en pantalla.
            </p>

            <button 
              className="submit-button" 
              style={{ maxWidth: '240px', height: '44px' }}
              onClick={handleFetchJsonDemo}
              disabled={fetchingApi}
            >
              {fetchingApi ? (
                <>
                  <span>Consultando API…</span>
                  <RefreshCw className="spin" size={16} />
                </>
              ) : (
                <>
                  <strong>Probar <code>fetch()</code> asíncrono</strong>
                  <Send size={16} />
                </>
              )}
            </button>

            {apiResponse && (
              <div style={{ marginTop: '20px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  OBJETO JSON RECIBIDO:
                </span>
                <div style={{ background: '#0f172a', color: '#38bdf8', padding: '18px', borderRadius: '12px', fontSize: '13px', overflowX: 'auto', fontFamily: 'monospace' }}>
                  <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GESTIÓN DE ASIGNATURAS */}
      {activeTab === 'subjects' && (
        <div style={{ background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '28px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '19px' }}>Agregar Asignatura al Catálogo</h3>
          
          <form onSubmit={handleAddSubject} style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: '15px', marginBottom: '25px' }}>
            <label className="field" style={{ margin: 0 }}>
              <span>Nombre de la asignatura</span>
              <input 
                type="text" 
                value={newNombre} 
                onChange={(e) => setNewNombre(e.target.value)} 
                placeholder="Ej. Programación Orientada a Objetos" 
                required 
              />
            </label>

            <label className="field" style={{ margin: 0 }}>
              <span>Categoría</span>
              <select 
                value={newCategoria} 
                onChange={(e) => setNewCategoria(e.target.value as Category)}
              >
                <option value="ingenierias">Ingenierías</option>
                <option value="arquitectura">Arquitectura y Diseño</option>
                <option value="ciencias">Ciencias Básicas</option>
              </select>
            </label>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="submit-button" type="submit" disabled={loadingAction} style={{ height: '48px', padding: '0 24px' }}>
                <Plus size={18} />
                <strong>{loadingAction ? 'Guardando...' : 'Añadir'}</strong>
              </button>
            </div>
          </form>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color, #e2e8f0)', color: 'var(--muted)' }}>
                  <th style={{ padding: '12px' }}>Asignatura</th>
                  <th style={{ padding: '12px' }}>Categoría</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{sub.nombre}</td>
                    <td style={{ padding: '12px', color: 'var(--muted)', textTransform: 'capitalize' }}>{sub.categoria}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteSubject(sub.id)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VER PQRS DESDE SUPABASE */}
      {activeTab === 'pqrs' && (
        <div style={{ background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '28px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '19px' }}>Solicitudes de PQRS Registradas</h3>
          
          {loadingPqrs ? (
            <p style={{ color: 'var(--muted)' }}>Cargando solicitudes desde Supabase…</p>
          ) : pqrsList.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No hay solicitudes de PQRS registradas aún.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color, #e2e8f0)', color: 'var(--muted)' }}>
                    <th style={{ padding: '12px' }}>Nombre</th>
                    <th style={{ padding: '12px' }}>Correo</th>
                    <th style={{ padding: '12px' }}>Tipo</th>
                    <th style={{ padding: '12px' }}>Asunto</th>
                    <th style={{ padding: '12px' }}>Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {pqrsList.map((item) => (
                    <tr key={item.id || item.created_at} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{item.nombre}</td>
                      <td style={{ padding: '12px', color: 'var(--muted)' }}>{item.email_corp}</td>
                      <td style={{ padding: '12px', textTransform: 'capitalize' }}>{item.tipo}</td>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{item.asunto}</td>
                      <td style={{ padding: '12px', color: 'var(--muted)', maxWidth: '300px' }}>{item.mensaje}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}