import { useState, useEffect } from 'react';
import { db } from './services/db';
import backupService from './services/backup';
import Dashboard from './components/Dashboard';
import WorkerList from './components/WorkerList';
import WorkerDetail from './components/WorkerDetail';
import PinLock from './components/PinLock';
import Settings from './components/Settings';

import { FaUserMd, FaChartPie, FaUsers, FaCog } from 'react-icons/fa';

function App() {
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState("0011");

  const initApp = async () => {
    setLoading(true);
    await db.init();
    await backupService.init();
    try { await backupService.checkAndAutoImport(db); } catch (e) {}
    const settings = await db.getSettings();
    if (settings.pin) setPin(settings.pin);
    setLoading(false);
  };

  useEffect(() => { initApp(); }, []);

  const navigateToWorker = (id) => {
    setSelectedWorkerId(id);
    setView('worker-detail');
  };

  if (loading) return <div>Chargement...</div>;
  if (isLocked) return <PinLock correctPin={pin} onUnlock={() => setIsLocked(false)} />;

  return (
    <div className="app-shell">
      {/* SIDEBAR EXACTE */}
      <aside className="sidebar no-print">
        <div className="brand">
          <div className="brand-logo"><FaUserMd /></div>
          <div className="brand-text">
            <div>GestMed</div>
            <div>Travail</div>
          </div>
          {/* Le petit personnage virus à droite du logo peut être une img ou icône */}
          <div style={{fontSize:'2rem', marginLeft:'auto'}}>🦠</div> 
        </div>

        <nav className="nav">
          <div 
            className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            <FaChartPie /> Tableau de bord
          </div>
          <div 
            className={`nav-item ${view === 'workers' || view === 'worker-detail' ? 'active' : ''}`}
            onClick={() => { setView('workers'); setSelectedWorkerId(null); }}
          >
            <FaUsers /> Travailleurs
          </div>
          <div 
            className={`nav-item ${view === 'settings' ? 'active' : ''}`}
            onClick={() => setView('settings')}
          >
            <FaCog /> Paramètres
          </div>
        </nav>

        {/* Décorations visuelles style gribouillage */}
        <div style={{position:'absolute', top:'50%', left:'-10px', color:'green', fontSize:'2rem', zIndex:0}}>〰️</div>
        <div style={{position:'absolute', bottom:'20%', right:'20px', color:'orange', fontSize:'1.5rem'}}>✨</div>

        <div className="footer-credit">
          RÉALISÉ PAR<br/>
          DR KIBECHE
        </div>
      </aside>

      <main className="main-content">
        <div className="container">
          {view === 'dashboard' && <Dashboard onNavigateWorker={navigateToWorker} />}
          {view === 'workers' && <WorkerList onNavigateWorker={navigateToWorker} />}
          {view === 'worker-detail' && selectedWorkerId && (
            <WorkerDetail workerId={selectedWorkerId} onBack={() => setView('workers')} />
          )}
          {view === 'settings' && <Settings currentPin={pin} onPinChange={setPin} />}
        </div>
      </main>
    </div>
  );
}

export default App;
