import { useState, useEffect } from 'react';
import { db } from '../services/db';
import { logic } from '../services/logic';
// On n'utilise plus les icônes FontAwesome classiques pour les grosses illustrations, 
// mais des emojis ou des images pour coller au style "cartoon"
import { FaChevronRight } from 'react-icons/fa';

export default function Dashboard({ onNavigateWorker }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    const workers = await db.getWorkers();
    const exams = await db.getExams();
    const computed = logic.getDashboardStats(workers, exams);
    setStats(computed);
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  if (loading) return <div>Chargement...</div>;

  // Fonction utilitaire pour générer un avatar aléatoire stable basé sur le nom
  const getAvatarUrl = (name) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4`;

  return (
    <div>
      <header>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <h2>Tableau de bord</h2>
          <span style={{fontSize:'1.5rem'}}>⭐</span>
        </div>
        <p className="subtitle">Aperçu de la situation médicale.</p>
      </header>
      
      {/* GRID DES 3 CARTES COLOREES */}
      <div className="dashboard-grid">
        {/* CARTE JAUNE */}
        <div className="stat-card card-yellow">
          <div className="stat-content">
            <div className="stat-title">À FAIRE</div>
            <div className="stat-number">{stats.dueSoon.length}</div>
            {/* Formes décoratives en fond */}
            <div style={{fontSize:'1.5rem'}}>🟡 🔺</div>
          </div>
          {/* REMPLACEZ PAR VOTRE IMAGE "GLOBULE ROUGE" */}
          <div className="stat-illustration">🩸</div> 
        </div>
        
        {/* CARTE ROUGE */}
        <div className="stat-card card-red">
          <div className="stat-content">
            <div className="stat-title">EN RETARD</div>
            <div className="stat-number">{stats.overdue.length}</div>
            <div style={{fontSize:'1.5rem'}}>⚡ ❗</div>
          </div>
          {/* REMPLACEZ PAR VOTRE IMAGE "VIRUS VERT" */}
          <div className="stat-illustration">🦠</div>
        </div>

        {/* CARTE BLEUE */}
        <div className="stat-card card-blue">
          <div className="stat-content">
            <div className="stat-title">SUIVI MÉDICAL</div>
            <div className="stat-number">{stats.activePositive.length}</div>
          </div>
          {/* REMPLACEZ PAR VOTRE IMAGE "NEURONE/DOCTEUR" */}
          <div className="stat-illustration">🔬</div>
        </div>
      </div>

      {/* SECTION DES LISTES */}
      <div className="lists-grid">
        
        {/* Examens à prévoir */}
        <div className="list-card">
          <div className="list-header">
            <h3>Examens à prévoir</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>NOM</th>
                <th>DATE PRÉVUE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {/* Combine overdue and dueSoon for the list */}
              {[...stats.overdue, ...stats.dueSoon].slice(0, 5).map(w => (
                <tr key={w.id}>
                  <td>
                    <div className="worker-info">
                      <img src={getAvatarUrl(w.full_name)} alt="avatar" className="avatar" />
                      <div>
                        <div style={{fontWeight:'700'}}>{w.full_name}</div>
                        {stats.overdue.find(o => o.id === w.id) && (
                          <span className="status-pill">EN RETARD</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{fontWeight:'600'}}>{w.next_exam_due}</td>
                  <td style={{textAlign:'right'}}>
                    <button className="btn-yellow-action" onClick={() => onNavigateWorker(w.id)}>
                      VOIR <FaChevronRight size={10} />
                    </button>
                  </td>
                </tr>
              ))}
              {[...stats.overdue, ...stats.dueSoon].length === 0 && (
                 <tr><td colSpan="3" style={{textAlign:'center', color:'#888'}}>Aucun examen prévu</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Contre-visites */}
        <div className="list-card">
          <div className="list-header">
            <h3>Contre-visites</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>NOM</th>
                <th>DATE PRÉVUE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stats.retests.slice(0, 5).map(item => (
                <tr key={item.worker.id}>
                  <td>
                    <div className="worker-info">
                      <img src={getAvatarUrl(item.worker.full_name)} alt="avatar" className="avatar" />
                      <div style={{fontWeight:'700'}}>{item.worker.full_name}</div>
                    </div>
                  </td>
                  <td style={{fontWeight:'600'}}>{logic.formatDate(new Date(item.date))}</td>
                  <td style={{textAlign:'right'}}>
                    <button className="btn-yellow-action" onClick={() => onNavigateWorker(item.worker.id)}>
                      OUVRIR <FaChevronRight size={10} />
                    </button>
                  </td>
                </tr>
              ))}
               {stats.retests.length === 0 && (
                 <tr><td colSpan="3" style={{textAlign:'center', color:'#888'}}>Aucune contre-visite</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
