import { useState, useEffect } from 'react';
import { db } from '../services/db';
import { logic } from '../services/logic';

export default function WorkerForm({ workerToEdit, onClose, onSave }) {
  const [departments, setDepartments] = useState([]);
  const [workplaces, setWorkplaces] = useState([]);
  
  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    phone: '',
    department_id: '',
    workplace_id: '',
    job_role: '',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
    next_exam_due: ''
  });

  useEffect(() => {
    const loadRefData = async () => {
      const depts = await db.getDepartments();
      const works = await db.getWorkplaces();
      setDepartments(depts);
      setWorkplaces(works);
    };
    loadRefData();

    if (workerToEdit) {
      setFormData(workerToEdit);
    }
  }, [workerToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.workplace_id) {
      alert("Veuillez sélectionner un lieu de travail.");
      return;
    }

    // Default to due now if not set (new worker)
    let nextDue = formData.next_exam_due;
    if (!nextDue) {
        nextDue = new Date().toISOString().split('T')[0];
    }
    
    await db.saveWorker({
      ...formData,
      id: workerToEdit ? workerToEdit.id : undefined,
      department_id: parseInt(formData.department_id),
      workplace_id: parseInt(formData.workplace_id),
      next_exam_due: nextDue
    });
    
    onSave();
  };

  // Filter workplaces by selected department (Removed as per new requirements - workplaces are global)
  // const filteredWorkplaces = formData.department_id 
  //   ? workplaces.filter(w => w.department_id === parseInt(formData.department_id))
  //   : [];


  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{
        animation: 'modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'scale(0.9)',
        animationFillMode: 'forwards'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid var(--border-color)'
        }}>
          <h3 style={{margin: 0, color: 'var(--primary)'}}>
            {workerToEdit ? 'Modifier' : 'Ajouter'} un travailleur
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'var(--danger-light)',
              border: '2px solid var(--danger)',
              color: 'var(--danger)',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translate(-2px, -2px)';
              e.target.style.boxShadow = '2px 2px 0px var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translate(0, 0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Nom complet</label>
            <input className="input" name="full_name" value={formData.full_name} onChange={handleChange} required />
          </div>
          
          <div className="form-group" style={{display:'flex', gap:'1rem'}}>
            <div style={{flex:1}}>
               <label className="label">N° Matricule / CIN</label>
               <input className="input" name="national_id" value={formData.national_id} onChange={handleChange} />
            </div>
            <div style={{flex:1}}>
               <label className="label">Téléphone</label>
               <input className="input" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group" style={{display:'flex', gap:'1rem'}}>
            <div style={{flex:1}}>
               <label className="label">Service</label>
               <select className="input" name="department_id" value={formData.department_id} onChange={handleChange} required>
                 <option value="">Sélectionner...</option>
                 {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
               </select>
            </div>
            <div style={{flex:1}}>
               <label className="label">Lieu de travail</label>
               <select className="input" name="workplace_id" value={formData.workplace_id} onChange={handleChange} required>
                 <option value="">Sélectionner...</option>
                 {workplaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
               </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Poste / Fonction</label>
            <input className="input" name="job_role" value={formData.job_role} onChange={handleChange} />
          </div>

          <div className="form-group">
             <label className="label">Antécédents médicaux</label>
             <textarea className="input" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
          </div>

          <div style={{display:'flex', justifyContent:'flex-end', gap:'1rem', marginTop:'2rem'}}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
