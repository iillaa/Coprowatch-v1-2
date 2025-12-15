import { useState, useEffect } from 'react';
import { db } from '../services/db';

export default function AddWorkerForm({ workerToEdit, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    department_id: '',
    workplace_id: '',
    job_role: '',
    birth_date: '',
    notes: ''
  });

  const [departments, setDepartments] = useState([]);
  const [workplaces, setWorkplaces] = useState([]);

  useEffect(() => {
    const load = async () => {
      setDepartments(await db.getDepartments());
      setWorkplaces(await db.getWorkplaces());
    };
    load();
    if (workerToEdit) {
      setFormData(workerToEdit);
    }
  }, [workerToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name) return alert('Le nom est obligatoire !');
    
    if (workerToEdit) {
      await db.updateWorker(workerToEdit.id, formData);
    } else {
      await db.addWorker(formData);
    }
    onSave();
  };

  // Styles "Cartoon"
  const overlayStyle = {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(5px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000
  };

  const modalStyle = {
    background: '#FFF9C4', /* Jaune très pâle */
    border: '4px solid black',
    borderRadius: '20px',
    padding: '2rem',
    width: '90%', maxWidth: '500px',
    boxShadow: '10px 10px 0px black',
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  const inputStyle = {
    width: '100%', padding: '0.8rem', marginBottom: '1rem',
    border: '3px solid black', borderRadius: '12px',
    fontSize: '1rem', fontWeight: '600',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block', fontWeight: '800', marginBottom: '0.3rem',
    textTransform: 'uppercase', fontSize: '0.8rem'
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{marginTop:0, fontSize:'2rem', textTransform:'uppercase'}}>
          {workerToEdit ? '✏️ Modifier' : '➕ Nouveau'}
        </h2>

        <form onSubmit={handleSubmit}>
          
          <div>
            <label style={labelStyle}>Nom Complet</label>
            <input name="full_name" value={formData.full_name} onChange={handleChange} style={inputStyle} placeholder="ex: Ali Benali" autoFocus />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
            <div>
              <label style={labelStyle}>Matricule</label>
              <input name="national_id" value={formData.national_id} onChange={handleChange} style={inputStyle} placeholder="ex: 12345" />
            </div>
            <div>
              <label style={labelStyle}>Date Naissance</label>
              <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
            <div>
              <label style={labelStyle}>Service</label>
              <select name="department_id" value={formData.department_id} onChange={handleChange} style={inputStyle}>
                <option value="">-- Choisir --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Lieu de travail</label>
              <select name="workplace_id" value={formData.workplace_id} onChange={handleChange} style={inputStyle}>
                 <option value="">-- Choisir --</option>
                 {workplaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div>
             <label style={labelStyle}>Poste de travail</label>
             <input name="job_role" value={formData.job_role} onChange={handleChange} style={inputStyle} placeholder="ex: Soudeur" />
          </div>

          <div>
             <label style={labelStyle}>Notes Médicales / Antécédents</label>
             <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" style={{...inputStyle, fontFamily:'inherit'}} placeholder="Allergies, maladies chroniques..." />
          </div>

          <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
            <button type="button" onClick={onClose} className="btn-yellow-action" style={{background:'#FF8A80', flex:1, justifyContent:'center'}}>
              ANNULER
            </button>
            <button type="submit" className="btn-yellow-action" style={{background:'#69F0AE', flex:1, justifyContent:'center'}}>
              SAUVEGARDER
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
