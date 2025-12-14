import { useState, useEffect } from 'react';
import { db } from '../services/db';
import { logic } from '../services/logic';
import ExamForm from './ExamForm';
import { FaArrowLeft, FaFileMedical, FaTrash } from 'react-icons/fa';

export default function WorkerDetail({ workerId, onBack }) {
  const [worker, setWorker] = useState(null);
  const [exams, setExams] = useState([]);
  const [showExamForm, setShowExamForm] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  
  const [deptName, setDeptName] = useState('');
  const [workplaceName, setWorkplaceName] = useState('');

  const loadData = async () => {
    const w = (await db.getWorkers()).find(x => x.id === workerId);
    setWorker(w);
    
    if (w) {
        const depts = await db.getDepartments();
        const works = await db.getWorkplaces();
        const d = depts.find(x => x.id == w.department_id);
        const wp = works.find(x => x.id == w.workplace_id);
        setDeptName(d ? d.name : '-');
        setWorkplaceName(wp ? wp.name : '-');
    }

    const allExams = await db.getExams();
    const wExams = allExams.filter(e => e.worker_id === workerId);
    // Sort desc
    wExams.sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));
    setExams(wExams);
  };

  useEffect(() => {
    loadData();
  }, [workerId]);

  const handleNewExam = () => {
    setSelectedExam(null);
    setShowExamForm(true);
  };

  const handleOpenExam = (exam) => {
    setSelectedExam(exam);
    setShowExamForm(true);
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet examen ?")) {
        await db.deleteExam(examId);
        loadData();
    }
  };

  const handleDeleteWorker = async () => {
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${worker.full_name} ?`)) {
          await db.deleteWorker(worker.id);
          onBack();
      }
  };

  const renderStatusBadge = (status) => {
      if (!status) return '-';
      let badgeClass = '';
      let label = status;

      switch(status) {
          case 'apte':
              badgeClass = 'badge badge-green';
              label = 'Apte';
              break;
          case 'inapte':
              badgeClass = 'badge badge-red';
              label = 'Inapte Temporaire';
              break;
          case 'apte_partielle':
              badgeClass = 'badge badge-yellow';
              label = 'Apte Partiel';
              break;
          default:
              return status;
      }
      return <span className={badgeClass}>{label}</span>;
  };

  if (!worker) return <div>Chargement...</div>;

  return (
    <div>
      <div style={{marginBottom:'1rem'}}>
        <button className="btn btn-outline" onClick={onBack}><FaArrowLeft /> Retour</button>
      </div>

      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
           <div>
             <h2 style={{margin:0}}>{worker.full_name}</h2>
             <p style={{color:'var(--text-muted)', marginTop:'0.5rem'}}>
                <strong>Service:</strong> {deptName} • <strong>Lieu:</strong> {workplaceName} • <strong>Poste:</strong> {worker.job_role}
             </p>
             <p style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>Matricule: {worker.national_id}</p>
             <div style={{marginTop:'0.5rem'}}>
                <span className="badge badge-yellow">Prochain Examen: {worker.next_exam_due}</span>
             </div>
           </div>
           <div style={{display:'flex', gap:'0.5rem'}}>
             <button className="btn btn-primary" onClick={handleNewExam}><FaFileMedical /> Nouvel Examen</button>
             <button className="btn btn-outline" onClick={handleDeleteWorker} style={{color: 'var(--danger)', borderColor: 'var(--danger)'}} title="Supprimer le travailleur">
                <FaTrash />
             </button>
           </div>
        </div>
        <div style={{marginTop:'1rem', paddingTop:'1rem', borderTop:'1px solid var(--border)'}}>
           <strong>Antécédents médicaux:</strong> {worker.notes || 'Aucun antécédent.'}
        </div>
      </div>

      <h3>Historique Médical</h3>
      <div className="card" style={{padding:0}}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Médecin</th>
              <th>Résultat Labo</th>
              <th>Statut Final</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {exams.map(e => (
              <tr key={e.id}>
                <td>{e.exam_date}</td>
                <td>{e.physician_name}</td>
                <td>
                  {e.lab_result ? (
                     <span className={`badge ${e.lab_result.result === 'positive' ? 'badge-red' : 'badge-green'}`}>
                       {e.lab_result.result === 'positive' ? 'Positif' : 'Négatif'}
                     </span>
                  ) : 'En attente'}
                </td>
                <td>{renderStatusBadge(e.decision?.status)}</td>
                <td>
                  <button className="btn btn-outline btn-sm" onClick={() => handleOpenExam(e)} style={{marginRight:'0.5rem'}}>Détails</button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleDeleteExam(e.id)} style={{color:'var(--danger)', borderColor:'var(--danger)'}} title="Supprimer"><FaTrash /></button>
                </td>
              </tr>
            ))}
            {exams.length === 0 && <tr><td colSpan="5" style={{textAlign:'center'}}>Aucun historique.</td></tr>}
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
          onSave={() => { setShowExamForm(false); loadData(); }}
        />
      )}
    </div>
  );
}
