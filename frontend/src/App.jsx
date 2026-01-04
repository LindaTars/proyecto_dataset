import React, { useState } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { LayoutDashboard, Activity, Rocket, Download, BarChart2, Loader2 } from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [testSize, setTestSize] = useState(0.3);
  const [resultado, setResultado] = useState(null);
  const [simulacion, setSimulacion] = useState(null);
  const [loading, setLoading] = useState(false); // <--- NUEVO: Estado de carga

  const handleUpload = async () => {
    if (!file) return alert("Selecciona un archivo primero");
    setLoading(true); // <--- NUEVO: Iniciar carga

    const formData = new FormData();
    formData.append('file', file);
    formData.append('test_size', testSize);

    try {
      // Ahora usará la variable de entorno que definimos en el archivo .env
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/analizar/`, formData);
      setResultado(res.data);
      setSimulacion(null);
    } catch (err) {
      alert("Error al procesar el dataset.");
    } finally {
      setLoading(false); // <--- NUEVO: Detener carga
    }
  };

  // --- NUEVA FUNCIÓN: Formatea datos para el gráfico de barras ---
  const getHistogramData = () => {
    if (!resultado?.histogramas) return [];
    const primeraCol = Object.keys(resultado.histogramas)[0];
    if (!primeraCol) return [];
    const data = resultado.histogramas[primeraCol];
    return data.counts.map((count, i) => ({
      rango: `${data.bins[i].toFixed(1)}`,
      frecuencia: count
    }));
  };

  const ejecutarSimulacion = () => {
    const nuevosDatos = statsData.map(s => ({
      variable: s.nombre,
      proyeccion: (parseFloat(s.media) + (Math.random() * 2 - 1) * parseFloat(s.desviacion)).toFixed(2)
    }));
    setSimulacion(nuevosDatos);
  };

  const descargarSimulacion = () => {
    if (!simulacion) return;
    const encabezados = simulacion.map(s => s.variable).join(",");
    const valores = simulacion.map(s => s.proyeccion).join(",");
    const csvContent = "data:text/csv;charset=utf-8," + encabezados + "\n" + valores;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "simulacion_proyectada.csv");
    document.body.appendChild(link);
    link.click();
  };

  const COLORS = ['#00C49F', '#FFBB28'];

  const dataGrafica = resultado ? [
    { name: 'Entrenamiento', value: resultado.filas_entrenamiento },
    { name: 'Prueba (Test)', value: resultado.filas_test },
  ] : [];

  const statsData = resultado?.stats ? Object.keys(resultado.stats).map(columna => ({
    nombre: columna,
    media: resultado.stats[columna].mean?.toFixed(2),
    desviacion: resultado.stats[columna].std?.toFixed(2),
  })) : [];

  return (
    <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#121212', color: '#e0e0e0', fontFamily: 'sans-serif', overflowX: 'hidden' }}>

      {/* --- NUEVO: OVERLAY DE CARGA --- */}
      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(18,18,18,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Loader2 size={60} color="#00C49F" style={{ animation: 'spin 1s linear infinite' }} />
          <h2 style={{ color: '#00C49F', marginTop: '20px' }}>Analizando Datos...</h2>
        </div>
      )}

      <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>

        <header style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#fff', margin: 0 }}>Simulador Estocástico <span style={{ color: '#00C49F' }}>⚡</span></h1>
          <p style={{ color: '#666' }}>Análisis de Datos y Proyección de Escenarios</p>
        </header>

        {/* CARGA */}
        <div style={{ backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '20px', border: '1px solid #333', textAlign: 'center' }}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ marginBottom: '20px' }} />
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <p style={{ color: '#ccc', marginBottom: '10px' }}>Split Test: {Math.round(testSize * 100)}%</p>
            <input type="range" min="0.1" max="0.5" step="0.05" value={testSize} onChange={(e) => setTestSize(e.target.value)} style={{ width: '100%' }} />
          </div>
          <button onClick={handleUpload} disabled={loading} style={{ marginTop: '25px', padding: '12px 40px', backgroundColor: loading ? '#333' : '#3f51b5', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Procesando...' : 'Analizar Dataset'}
          </button>
        </div>

        {resultado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>

              {/* --- NUEVO: GRÁFICO DE HISTOGRAMA --- */}
              <div style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '20px', border: '1px solid #333' }}>
                <h3 style={{ color: '#00C49F', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart2 size={20} /> Distribución</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getHistogramData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="rango" stroke="#666" fontSize={11} />
                    <YAxis stroke="#666" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#222', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="frecuencia" fill="#00C49F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* SEGMENTACIÓN */}
              <div style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '20px', border: '1px solid #333' }}>
                <h3 style={{ color: '#FFBB28', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><LayoutDashboard size={20} /> Segmentación</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={dataGrafica} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={5}>
                      {dataGrafica.map((entry, index) => <Cell key={index} fill={COLORS[index]} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#222', border: 'none', borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TABLA DE ESTADÍSTICAS (Ahora ocupa todo el ancho) */}
            <div style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '20px', border: '1px solid #333' }}>
              <h3 style={{ color: '#00C49F', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={20} /> Estadísticas Base</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#666', borderBottom: '1px solid #333' }}>
                      <th style={{ padding: '10px' }}>Variable</th>
                      <th style={{ padding: '10px' }}>Media</th>
                      <th style={{ padding: '10px' }}>Desv</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsData.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #252525' }}>
                        <td style={{ padding: '10px', color: '#fff' }}>{s.nombre}</td>
                        <td style={{ padding: '10px', color: '#00C49F' }}>{s.media}</td>
                        <td style={{ padding: '10px', color: '#FFBB28' }}>{s.desviacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN DE SIMULACIÓN */}
            <div style={{ backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '20px', border: '1px dashed #00C49F' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
                <button onClick={ejecutarSimulacion} style={{ padding: '15px 30px', backgroundColor: '#00C49F', color: '#121212', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Rocket size={20} /> GENERAR ESCENARIO
                </button>
                {simulacion && (
                  <button onClick={descargarSimulacion} style={{ padding: '15px 30px', backgroundColor: '#333', color: '#fff', fontWeight: 'bold', border: '1px solid #444', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Download size={20} /> EXPORTAR CSV
                  </button>
                )}
              </div>

              {simulacion && (
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  {simulacion.map((sim, i) => (
                    <div key={i} style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '12px', minWidth: '140px', textAlign: 'center', border: '1px solid #444' }}>
                      <div style={{ color: '#aaa', fontSize: '0.75rem' }}>{sim.variable}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#00C49F' }}>{sim.proyeccion}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default App;