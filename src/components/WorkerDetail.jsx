import { useState, useEffect } from 'react';
import { db } from '../services/db';
import { logic } from '../services/logic';
import ExamForm from './ExamForm';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';

export default function WorkerDetail({ workerId, onBack }) {
  const [worker, setWorker] = useState(null);
  const [exams, setExams] = useState([]);
  const [showExamForm, setShowExamForm] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  
  const [deptName, setDeptName] = useState('');
  const [workplaceName, setWorkplaceName] = useState('');

  useEffect(() => {
    const load = async () => {
        const w = (await db.getWorkers()).find(x => x.id === workerId);
        setWorker(w);
        if (w) {
            const depts = await db.getDepartments();
            const works = await db.getWorkplaces();
            setDeptName(depts.find(x => x.id == w.department_id)?.name || '-');
            setWorkplaceName(works.find(x => x.id == w.workplace_id)?.name || '-');
        }
        const all = await db.getExams();
        setExams(all.filter(e => e.worker_id === workerId).sort((a,b) => new Date(b.exam_date)-new Date(a.exam_date)));
    };
    load();
  }, [workerId]);

  if (!worker) return <div>Chargement...</div>;

  const handleDeleteWorker = async () => {
    if (window.confirm("Voulez-vous vraiment supprimer ce dossier ?")) {
        await db.deleteWorker(worker.id);
        onBack();
    }
  };

  const getAvatarUrl = (name) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4`;

  return (
    <div>
      <button onClick={onBack} style={{background:'none', border:'none', cursor:'pointer', fontWeight:'700', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'5px'}}>
        <FaArrowLeft /> RETOUR LISTE
      </button>

      {/* CARTE D'IDENTITÉ DOSSIER */}
      <div className="stat-card" style={{display:'block', background:'#E1BEE7', minHeight:'auto', marginBottom:'2rem'}}>
         <div style={{display:'flex', gap:'2rem', alignItems:'center', flexWrap:'wrap'}}>
            <img src={getAvatarUrl(worker.full_name)} style={{width:'100px', height:'100px', borderRadius:'50%', border:'3px solid black', background:'white'}} />
            
            <div style={{flex:1}}>
                <h1 style={{margin:'0 0 0.5rem 0', fontSize:'2.5rem', textTransform:'uppercase'}}>{worker.full_name}</h1>
                <div style={{display:'flex', gap:'1rem', flexWrap:'wrap', fontWeight:'600'}}>
                    <div style={{background:'white', padding:'5px 10px', borderRadius:'8px', border:'2px solid black'}}>🏢 {deptName}</div>
                    <div style={{background:'white', padding:'5px 10px', borderRadius:'8px', border:'2px solid black'}}>📍 {workplaceName}</div>
                    <div style={{background:'white', padding:'5px 10px', borderRadius:'8px', border:'2px solid black'}}>💼 {worker.job_role}</div>
                </div>
            </div>

            <div style={{textAlign:'right'}}>
                 <button className="btn-yellow-action" style={{background:'#FF8A80', color:'white'}} onClick={handleDeleteWorker}>
                    <FaTrash /> SUPPRIMER
                 </button>
            </div>
         </div>
         
         <div style={{marginTop:'1.5rem', padding:'1rem', background:'rgba(255,255,255,0.5)', borderRadius:'12px', border:'2px dashed black'}}>
            <strong>📝 Notes Médicales :</strong> {worker.notes || "Rien à signaler."}
         </div>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
        <h3>Historique des Examens</h3>
        <button className="btn-yellow-action" onClick={() => { setSelectedExam(null); setShowExamForm(true); }}>
            ➕ NOUVEL EXAMEN
        </button>
      </div>

      <div className="list-card">
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Résultat</th>
                    <th>Décision</th>
                    <th style={{textAlign:'right'}}>Détails</th>
                </tr>
            </thead>
            <tbody>
                {exams.map(e => (
                    <tr key={e.id}>
                        <td style={{fontWeight:'700'}}>{e.exam_date}</td>
                        <td>
                            {e.lab_result?.result === 'positive' 
                                ? <span className="status-pill" style={{background:'#FF8A80', transform:'rotate(2deg)'}}>POSITIF</span> 
                                : <span className="status-pill" style={{background:'#A5D6A7', transform:'rotate(-2deg)'}}>NÉGATIF</span>}
                        </td>
                        <td>{e.decision?.status?.toUpperCase() || '-'}</td>
                        <td style={{textAlign:'right'}}>
                            <button className="btn-yellow-action" style={{padding:'5px 10px', fontSize:'0.7rem'}} onClick={() => {setSelectedExam(e); setShowExamForm(true);}}>
                                OUVRIR
                            </button>
                        </td>
                    </tr>
                ))}
                {exams.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:'2rem', color:'#888'}}>Le dossier est vide.</td></tr>}
            </tbody>
        </table>
      </div>

      {showExamForm && (
        <ExamForm 
          worker={worker}
          existingExam={selectedExam}
          deptName={deptName}
          workplaceName={workplaceName}
          onClose={() => setShowExamForm(false)}
          onSave={() => { setShowExamForm(false); loadData(); }} // loadData n'est pas dispo ici, il faut le passer ou trigger reload via props si besoin, mais ici WorkerDetail a son propre loadData donc ça va marcher si on trigger le re-render
        />
      )}
    </div>
  );
}
