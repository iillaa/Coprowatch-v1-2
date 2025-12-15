import { useState, useEffect } from 'react';
import { db } from '../services/db';
import { logic } from '../services/logic';
import AddWorkerForm from './AddWorkerForm';
import { FaPlus, FaSearch, FaFileDownload, FaFileUpload, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';

export default function WorkerList({ onNavigateWorker }) {
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [exams, setExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  const loadData = async () => {
    const w = await db.getWorkers();
    const d = await db.getDepartments();
    const e = await db.getExams();
    setWorkers(w);
    setDepartments(d);
    setExams(e);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let result = workers;
    if (filterDept) result = result.filter(w => w.department_id == filterDept);
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(w => 
        w.full_name.toLowerCase().includes(lower) || 
        w.national_id.includes(lower)
      );
    }
    setFilteredWorkers(result);
  }, [searchTerm, filterDept, workers]);

  const handleEdit = (e, worker) => {
    e.stopPropagation();
    setEditingWorker(worker);
    setShowForm(true);
  };

  const handleDelete = async (e, worker) => {
    e.stopPropagation();
    if (window.confirm(`Supprimer ${worker.full_name} ?`)) {
      await db.deleteWorker(worker.id);
      loadData();
    }
  };

  const handleAddNew = () => { setEditingWorker(null); setShowForm(true); };

  // Styles spécifiques "Cartoon" pour les inputs
  const inputStyle = {
    border: '3px solid black',
    borderRadius: '12px',
    padding: '0.8rem',
    outline: 'none',
    boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
    transition: 'all 0.2s',
    fontWeight: '600'
  };

  // Badge status
  const getStatusBadge = (id) => {
    const workerExams = exams.filter(e => e.worker_id === id);
    if (!workerExams.length) return <span className="status-pill" style={{background:'#eee', color:'#666'}}>Nouveau</span>;
    workerExams.sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));
    const last = workerExams.find(e => e.decision?.status)?.decision?.status;
    
    if (last === 'apte') return <span className="status-pill" style={{background:'#a5f3fc', color:'#0891b2'}}>Apte</span>;
    if (last === 'inapte') return <span className="status-pill" style={{background:'#fda4af', color:'#be123c'}}>Inapte</span>;
    return <span className="status-pill" style={{background:'#fef3c7', color:'#b45309'}}>Partiel</span>;
  };

  const getAvatarUrl = (name) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4`;

  return (
    <div>
      {/* HEADER + ACTIONS */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'end', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem'}}>
        <div>
           <h2 style={{fontSize:'2.5rem', marginBottom:'0.5rem'}}>L'Équipe 👥</h2>
           <p style={{margin:0, fontWeight:500, color:'#666'}}>Gestion du personnel médical.</p>
        </div>
        <div style={{display:'flex', gap:'1rem'}}>
          <button className="btn-yellow-action" style={{background:'white'}} onClick={() => {/* Export logic */}}><FaFileDownload /> Export</button>
          <button className="btn-yellow-action" style={{background:'var(--primary)', color:'white'}} onClick={handleAddNew}><FaPlus /> AJOUTER</button>
        </div>
      </div>

      {/* BARRE DE RECHERCHE & FILTRES */}
      <div className="list-card" style={{padding:'1.5rem', marginBottom:'2rem', display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center', background:'#FFecb3'}}>
        <div style={{flex:1, minWidth:'250px'}}>
           <input 
             style={{...inputStyle, width:'100%', boxSizing:'border-box'}}
             placeholder="🔍 Chercher un nom..."
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
        <div>
           <select 
             style={{...inputStyle, minWidth:'200px', cursor:'pointer'}}
             value={filterDept}
             onChange={e => setFilterDept(e.target.value)}
           >
             <option value="">🏢 Tous les services</option>
             {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
           </select>
        </div>
      </div>

      {/* GRILLE / LISTE DES TRAVAILLEURS */}
      <div className="list-card">
        <table>
          <thead>
            <tr>
              <th>Identité</th>
              <th>Service</th>
              <th>Prochain RDV</th>
              <th>Statut</th>
              <th style={{textAlign:'right'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkers.map(w => {
               const isOverdue = logic.isOverdue(w.next_exam_due);
               return (
                  <tr key={w.id} onClick={() => onNavigateWorker(w.id)} style={{cursor:'pointer'}}>
                    <td>
                        <div className="worker-info">
                            <img src={getAvatarUrl(w.full_name)} className="avatar" alt="av" />
                            <div>
                                <div style={{fontWeight:'700'}}>{w.full_name}</div>
                                <div style={{fontSize:'0.75rem', opacity:0.7}}>{w.national_id}</div>
                            </div>
                        </div>
                    </td>
                    <td><span style={{fontWeight:600}}>{departments.find(d=>d.id == w.department_id)?.name || '-'}</span></td>
                    <td>
                        {isOverdue && <span style={{fontSize:'1.2rem', marginRight:'5px'}}>⏰</span>}
                        <span style={{fontWeight: isOverdue ? 800 : 500, color: isOverdue ? 'red' : 'inherit'}}>
                            {w.next_exam_due}
                        </span>
                    </td>
                    <td>{getStatusBadge(w.id)}</td>
                    <td style={{textAlign:'right'}}>
                      <button 
                        onClick={(e) => handleEdit(e, w)} 
                        style={{border:'none', background:'none', cursor:'pointer', fontSize:'1.2rem', marginRight:'10px'}}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, w)} 
                        style={{border:'none', background:'none', cursor:'pointer', fontSize:'1.2rem'}}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
               );
            })}
            {filteredWorkers.length === 0 && (
                <tr><td colSpan="5" style={{padding:'2rem', textAlign:'center', color:'#888'}}>Personne n'a été trouvé... 🌵</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <AddWorkerForm 
          workerToEdit={editingWorker} 
          onClose={() => setShowForm(false)} 
          onSave={() => { setShowForm(false); loadData(); }} 
        />
      )}
    </div>
  );
}
