import { FormEvent, useState } from 'react';
import { CheckCircle2, ChevronRight, Send, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { categoryLabels, fallbackSubjects } from '../lib/catalog';
import type { Category, Subject } from '../types';

interface HomeContentProps {
  grouped: { category: Category; label: string; items: Subject[] }[];
  loadingSubjects: boolean;
  onPqrs: () => void;
}

export function HomeContent({ grouped, loadingSubjects, onPqrs }: HomeContentProps) {
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [successSubmitted, setSuccessSubmitted] = useState(false); // Estado para el div de éxito

  const handleToggleSubject = (subjectName: string) => {
    if (selectedSubjects.includes(subjectName)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subjectName));
    } else {
      if (selectedSubjects.length >= 7) {
        setErrors((prev) => ({ ...prev, materia_id: 'Solo puedes seleccionar un máximo de 7 asignaturas.' }));
        return;
      }
      setSelectedSubjects([...selectedSubjects, subjectName]);
    }
    if (errors.materia_id) {
      setErrors((prev) => ({ ...prev, materia_id: '' }));
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      nombre: String(data.get('nombre') ?? '').trim(),
      email_corp: String(data.get('email_corp') ?? '').trim().toLowerCase(),
      codigo_est: String(data.get('codigo_est') ?? '').trim(),
      materia_id: selectedSubjects.join(', '),
    };

    const next: Record<string, string> = {};
    if (payload.nombre.length < 3) next.nombre = 'Escribe tu nombre completo.';
    if (!/^\S+@uptc\.edu\.co$/i.test(payload.email_corp)) next.email_corp = 'Usa un correo @uptc.edu.co.';
    if (!/^\d{5,12}$/.test(payload.codigo_est)) next.codigo_est = 'Usa entre 5 y 12 números.';
    if (selectedSubjects.length === 0) next.materia_id = 'Debes seleccionar al menos una asignatura del catálogo superior.';
    setErrors(next);

    if (Object.keys(next).length) return;
    if (!supabase) {
      setStatus('Error de conexión con el servicio. Intenta más tarde.');
      return;
    }
    setSending(true);
    setStatus('');
    const { error } = await supabase.from('solicitudes_tutoria').insert(payload);
    setSending(false);
    if (error) {
      setStatus(error.code === '23505' ? 'Ya existe una solicitud registrada con ese código.' : 'Error al registrar la solicitud. Inténtalo de nuevo.');
    } else {
      setSuccessSubmitted(true); // Muestra el mensaje de éxito "Tendrás noticias pronto"
      setSelectedSubjects([]);
      event.currentTarget.reset();
    }
  };

  return (
    <>
      {/* 1. CATÁLOGO DE ASIGNATURAS */}
      <section className="catalog-section" id="catalogo" style={{ marginTop: '75px' }}>
        <div className="section-heading">
          <div>
            <span className="eyebrow">CATÁLOGO VIVO</span>
            <h2>Elige hasta 7 asignaturas para <em>solicitar tutoría.</em></h2>
          </div>
          <span className="live-badge"><i /> actualizado en tiempo real</span>
        </div>
        {loadingSubjects ? (
          <div className="catalog-loading">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <div className="catalog-groups">
            {grouped.map((group) => (
              <article className="catalog-group" key={group.category}>
                <div className="group-heading">
                  <span className={`category-icon ${group.category}`}>
                    {group.category === 'ingenierias' ? '∑' : group.category === 'arquitectura' ? '⌂' : '✦'}
                  </span>
                  <div>
                    <h3>{group.label}</h3>
                    <span>{group.items.length} asignaturas</span>
                  </div>
                </div>
                <div className="subject-grid">
                  {group.items.map((subject) => {
                    const isSelected = selectedSubjects.includes(subject.nombre);
                    return (
                      <button
                        type="button"
                        className={isSelected ? 'subject-card active' : 'subject-card'}
                        key={subject.id}
                        onClick={() => handleToggleSubject(subject.nombre)}
                      >
                        {subject.nombre}
                        {isSelected && <span style={{ fontSize: '11px', marginLeft: 'auto' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SECCIÓN INTERMEDIA: IMAGEN DE ESTUDIANTES + MÉTRICAS ABAJO */}
      <section className="middle-image-section" style={{ margin: '65px auto 0', maxWidth: '640px', textAlign: 'center' }}>
        <div className="photo-card" style={{ margin: '0 auto', width: '100%' }}>
          <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85" alt="Estudiantes universitarios colaborando" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div className="photo-overlay">
            <span>01</span>
            <strong>Tu próximo avance<br />empieza aquí.</strong>
          </div>
        </div>

        <div className="proof-row" style={{ justifyContent: 'center', marginTop: '25px', marginBottom: '0' }}>
          <div className="proof-stat">
            <strong>+2.000</strong>
            <span>estudiantes acompañados</span>
          </div>
          <div className="proof-stat">
            <strong>{grouped.reduce((total, group) => total + group.items.length, 0) || 18}</strong>
            <span>asignaturas disponibles</span>
          </div>
        </div>
      </section>

      {/* 2. FORMULARIO DE REGISTRO O MENSAJE DE ÉXITO */}
      <section className="form-panel" id="registro-formulario" aria-labelledby="form-title" style={{ marginTop: '55px' }}>
        {successSubmitted ? (
          /* DIV DE ÉXITO: TENDREMOS NOTICIAS PRONTO */
          <div className="success-banner-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%', color: '#2563eb', marginBottom: '20px' }}>
              <CheckCircle2 size={42} />
            </div>
            <span className="eyebrow" style={{ justifyContent: 'center' }}>SOLICITUD EXITOSA</span>
            <h2 style={{ margin: '15px 0' }}>¡Todo listo! <em>Tendrás noticias pronto.</em></h2>
            <p style={{ color: 'var(--muted)', maxWidth: '420px', margin: '0 auto 25px', lineHeight: '1.6' }}>
              Tu registro ha quedado guardado correctamente en el sistema de coordinación de tutorías UPTC. Te contactaremos por tu correo institucional muy pronto.
            </p>
            <button 
              className="submit-button" 
              style={{ maxWidth: '280px', margin: '0 auto' }}
              onClick={() => setSuccessSubmitted(false)}
            >
              <strong>Registrar otra solicitud</strong>
            </button>
          </div>
        ) : (
          <>
            <div className="panel-top">
              <div>
                <span className="step-label">REGISTRO DE TUTORÍA</span>
                <h2 id="form-title">Cuéntanos<br /><span>tus datos de contacto.</span></h2>
              </div>
            </div>
            <p className="form-lead">
              {selectedSubjects.length > 0 ? (
                <>Asignaturas seleccionadas ({selectedSubjects.length}/7): <strong style={{ color: 'var(--brand-accent, #2563eb)' }}>{selectedSubjects.join(', ')}</strong></>
              ) : (
                'Selecciona de 1 hasta 7 asignaturas en el catálogo superior.'
              )}
            </p>
            <form onSubmit={submit} noValidate>
              <Field name="nombre" label="Tu nombre completo" placeholder="Ej. Valentina Rodríguez" error={errors.nombre} autoComplete="name" />
              <Field name="email_corp" label="Correo institucional" placeholder="nombre@uptc.edu.co" error={errors.email_corp} type="email" autoComplete="email" />
              <div className="field-row">
                <Field name="codigo_est" label="Código estudiantil" placeholder="2024••••" error={errors.codigo_est} inputMode="numeric" />
                <label className="field">
                  <span>Semestre</span>
                  <select name="semestre" defaultValue="1">
                    <option>1.º</option>
                    <option>2.º</option>
                    <option>3.º</option>
                    <option>4.º</option>
                    <option>5.º</option>
                    <option>6.º</option>
                    <option>7.º</option>
                    <option>8.º</option>
                    <option>9.º</option>
                    <option>10.º</option>
                  </select>
                </label>
              </div>

              <SubjectPicker
                subjects={grouped.flatMap((group) => group.items)}
                selectedSubjects={selectedSubjects}
                onToggleSubject={handleToggleSubject}
                error={errors.materia_id}
              />

              <button className="submit-button" disabled={sending}>
                {sending ? (
                  <>
                    <span className="skeleton-text">Procesando tu solicitud…</span>
                    <span className="loader" />
                  </>
                ) : (
                  <>
                    <strong>Quiero encontrar mi tutoría</strong>
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
              {status && (
                <div className={status.startsWith('Solicitud') ? 'form-feedback success' : 'form-feedback error'} role="status">
                  {status}
                </div>
              )}
              <p className="privacy-note">
                <ShieldCheck size={14} /> Tus datos se usan únicamente para conectarte con apoyo académico.
              </p>
            </form>
          </>
        )}
      </section>

      {/* SECCIÓN PQRS */}
      <section className="pqrs-strip">
        <div>
          <span className="eyebrow">CANALES DE ATENCIÓN</span>
          <h2>¿Necesitas hablar con coordinación?</h2>
          <p>Envíanos una PQRS y mantén el seguimiento de tu solicitud.</p>
        </div>
        <button className="secondary-button" onClick={onPqrs}>
          <strong>Ir al servicio PQRS</strong>
          <Send size={16} />
        </button>
      </section>
    </>
  );
}

function Field({ name, label, placeholder, error, type = 'text', autoComplete, inputMode }: any) {
  return (
    <label className={error ? 'field has-error' : 'field'}>
      <span>{label}</span>
      <input name={name} type={type} autoComplete={autoComplete} inputMode={inputMode} placeholder={placeholder} required />
      {error && <small className="error-message">{error}</small>}
    </label>
  );
}

function SubjectPicker({ subjects, selectedSubjects, onToggleSubject, error }: any) {
  const groups = (Object.keys(categoryLabels) as Category[]).map((category) =>
    subjects.filter((subject: Subject) => subject.categoria === category)
  );

  const allSubjects =
    groups.flat().length > 0
      ? groups.flat()
      : Object.entries(fallbackSubjects).flatMap(([categoria, names]) =>
          names.map((nombre, index) => ({
            id: `${categoria}-${index}`,
            nombre,
            categoria: categoria as Category,
          }))
        );

  return (
    <fieldset className={error ? 'subject-picker has-error' : 'subject-picker'}>
      <legend>Asignaturas seleccionadas para tutoría (Máximo 7)</legend>
      <div className="bubble-options">
        {allSubjects.map((subject: any) => {
          const isChecked = selectedSubjects.includes(subject.nombre);
          return (
            <label key={subject.id} style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="materia_id"
                value={subject.nombre}
                checked={isChecked}
                onChange={() => onToggleSubject(subject.nombre)}
              />
              <span>{subject.nombre}</span>
            </label>
          );
        })}
      </div>
      {error && <small className="error-message">{error}</small>}
    </fieldset>
  );
}