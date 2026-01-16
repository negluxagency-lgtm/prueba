import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Corregido: antes apuntaba a lib/supabaseClient

export default function AuthGuard({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para el formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // 1. Comprobar si ya hay sesión guardada en el navegador al entrar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuchar cambios (si se loguea o desloguea)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función para iniciar sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setErrorMsg("Usuario o contraseña incorrectos.");
      setLoading(false);
    }
    // Si no hay error, el "onAuthStateChange" de arriba detectará el login y actualizará la vista
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // MIENTRAS CARGA (verifica si existe sesión)
  if (loading && !session) {
    return <div style={styles.container}><div style={{ color: '#f59e0b', fontWeight: 'bold', fontFamily: 'monospace' }}>CARGANDO SISTEMA...</div></div>;
  }

  // SI NO HAY SESIÓN (Muestra el Login)
  if (!session) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontStyle: 'italic', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-1px' }}>
              Wolf <span style={{ color: '#f59e0b' }}>Barbershop</span>
            </h2>
            <p style={{ margin: '5px 0 0 0', color: '#71717a', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', tracking: '2px' }}>Acceso Acceso restringido</p>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />

            {errorMsg && <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>{errorMsg}</p>}

            <button type="submit" style={styles.button}>
              {loading ? 'AUTENTICANDO...' : 'INICIAR SESIÓN'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // SI HAY SESIÓN (Muestra la App)
  return (
    <div>
      <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
      {children}
    </div>
  );
}

// Estilos rápidos ajustados al tema oscuro/negro/ámbar
const styles = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', fontFamily: 'monospace' },
  card: { width: '100%', maxWidth: '380px', padding: '3rem 2rem', background: '#111', borderRadius: '24px', border: '1px solid #27272a', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', color: 'white' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '16px', borderRadius: '12px', background: '#18181b', border: '1px solid #27272a', fontSize: '14px', color: 'white', outline: 'none' },
  button: { padding: '16px', background: '#f59e0b', color: 'black', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '900', transition: 'all 0.2s', marginTop: '10px' },
  logoutBtn: { position: 'fixed', top: '20px', right: '20px', background: '#18181b', color: '#71717a', border: '1px solid #27272a', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', zIndex: 1000, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }
};
