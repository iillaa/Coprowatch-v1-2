import { useState } from 'react';
import { db } from '../services/db';
import { logic } from '../services/logic';

export default function ExamForm({ worker, existingExam, onClose, onSave, deptName, workplaceName }) {
  const [examDate, setExamDate] = useState(existingExam?.exam_date || new Date().toISOString().split('T')[0]);
  const [physician, setPhysician] = useState(existingExam?.physician_name || "Dr Kibeche");
  
  // Labo
  const [labResult, setLabResult] = useState(existingExam?.lab_result?.result || 'negative');
  const [labDetails, setLabDetails] = useState(existingExam?.lab_result?.details || '');

  // Décision
  const [status, setStatus] = useState(existingExam?.decision?.status || 'apte');
  const [duration, setDuration] = useState(existingExam?.decision?.duration_months || 6);
  const [observation, setObservation] = useState(existingExam?.decision?.observation || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const examData = {
      worker_id: worker.id,
      exam_date: examDate,
      physician_name: physician,
      lab_result: { result: labResult, details: labDetails },
      decision: { status, duration_months: parseInt(duration), observation }
    };

    if (existingExam) {
      await db.updateExam(existingExam.id, examData);
    } else {
      await db.addExam(examData);
      // Recalculer la prochaine date pour le travailleur
      const nextDate = logic.calculateNextDueDate(examDate, parseInt(duration));
      await db.updateWorker(worker.id, { 
        last_exam_date: examDate,
        next_exam_due: nextDate
      });
    }
    onSave();
  };

  // Styles identiques
  const overlayStyle = {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(5px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1100
  };

  const modalStyle = {
    background: 'white',
    border: '4px solid black',
    borderRadius: '20px',
    padding: '1.5rem',
    width: '95%', maxWidth: '600px',
    boxShadow: '10px 10px 0px #6366f1', /* Ombre violette */
    maxHeight: '95vh', overflowY: 'auto'
  };

  const inputStyle = {
    width: '100%', padding: '0.8rem',
    border: '3px solid black', borderRadius: '12px',
    fontSize: '1rem', fontWeight: '600', marginBottom:'1rem', boxSizing: 'border-box'
  };

  const bigRadioStyle = (isSelected, color) => ({
    flex: 1, padding: '1rem', textAlign: 'center',
    border: '3px solid black', borderRadius: '12px',
    background: isSelected ? color : 'white',
    fontWeight: '800', cursor: 'pointer',
    transform: isSelected ? 'translate(2px, 2px)' : 'none',
    boxShadow: isSelected ? 'none' : '4px 4px 0px rgba(0,0,0,0.1)',
    transition: 'all 0.1s'
  });

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{marginTop:0, borderBottom:'3px solid black', paddingBottom:'0.5rem'}}>
          🩺 Examen Médical
        </h2>
        
        <div style={{background:'#E3F2FD', padding:'0.5rem', borderRadius:'8px', border:'2px dashed black', marginBottom:'1rem'}}>
           <strong>Patient:</strong> {worker.full_name} <br/>
           <small>{deptName} • {workplaceName}</small>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div style={{display:'flex', gap:'1rem'}}>
             <div style={{flex:1}}>
                <label style={{fontWeight:'bold'}}>Date</label>
                <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} style={inputStyle} />
             </div>
             <div style={{flex:1}}>
                <label style={{fontWeight:'bold'}}>Médecin</label>
                <input value={physician} onChange={e => setPhysician(e.target.value)} style={inputStyle} />
             </div>
          </div>

          {/* Section Résultat Labo */}
          <div style={{marginBottom:'1rem'}}>
            <label style={{fontWeight:'bold', display:'block', marginBottom:'0.5rem'}}>🧪 RÉSULTAT ANALYSES</label>
            <div style={{display:'flex', gap:'10px'}}>
               <div onClick={() => setLabResult('negative')} style={bigRadioStyle(labResult === 'negative', '#69F0AE')}>
                  NÉGATIF (OK) 👍
               </div>
               <div onClick={() => setLabResult('positive')} style={bigRadioStyle(labResult === 'positive', '#FF8A80')}>
                  POSITIF 🦠
               </div>
            </div>
          </div>

          {/* Section Aptitude */}
          <div style={{marginBottom:'1rem'}}>
            <label style={{fontWeight:'bold', display:'block', marginBottom:'0.5rem'}}>⚖️ DÉCISION & APTITUDE</label>
            <div style={{display:'flex', gap:'5px', marginBottom:'1rem'}}>
               <div onClick={() => setStatus('apte')} style={bigRadioStyle(status === 'apte', '#69F0AE')}>
                  APTE
               </div>
               <div onClick={() => setStatus('apte_partielle')} style={bigRadioStyle(status === 'apte_partielle', '#FFF176')}>
                  RESTREINT
               </div>
               <div onClick={() => setStatus('inapte')} style={bigRadioStyle(status === 'inapte', '#FF8A80')}>
                  INAPTE
               </div>
            </div>

            <label style={{fontWeight:'bold'}}>Validité (Mois)</label>
            <select value={duration} onChange={e => setDuration(e.target.value)} style={inputStyle}>
                <option value="3">3 Mois (Suivi court)</option>
                <option value="6">6 Mois (Standard)</option>
                <option value="12">12 Mois (Annuel)</option>
                <option value="24">24 Mois (Biennal)</option>
            </select>
          </div>

          <div>
             <label style={{fontWeight:'bold'}}>Observations / Ordonnance</label>
             <textarea value={observation} onChange={e => setObservation(e.target.value)} rows="3" style={{...inputStyle, fontFamily:'inherit'}} placeholder="Remarques..." />
          </div>

          <div style={{display:'flex', gap:'1rem', marginTop:'1.5rem'}}>
            <button type="button" onClick={onClose} className="btn-yellow-action" style={{background:'white', flex:1, justifyContent:'center'}}>
              ANNULER
            </button>
            <button type="submit" className="btn-yellow-action" style={{background:'var(--primary)', color:'white', flex:1, justifyContent:'center'}}>
              VALIDER L'EXAMEN
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
