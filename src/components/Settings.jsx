import { useState, useEffect } from 'react';
import { db } from '../services/db';
import backupService from '../services/backup';

export default function Settings({ currentPin, onPinChange }) {
  const [pin, setPin] = useState(currentPin);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    if (pin.length !== 4) return setMsg("Le PIN doit faire 4 chiffres !");
    await db.saveSettings({ pin });
    onPinChange(pin);
    setMsg("✅ C'est enregistré !");
    setTimeout(() => setMsg(''), 3000);
  };

  const inputStyle = {
    border: '3px solid black', borderRadius: '12px', padding: '1rem',
    width: '100%', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '10px',
    boxShadow: '4px 4px 0px rgba(0,0,0,0.1)', marginBottom: '1rem'
  };

  return (
    <div style={{maxWidth:'600px', margin:'0 auto'}}>
      <h2 style={{fontSize:'2.5rem', textAlign:'center', marginBottom:'2rem'}}>Réglages ⚙️</h2>

      <div className="list-card" style={{padding:'2rem', textAlign:'center'}}>
         <h3 style={{marginTop:0}}>Modifier le Code PIN</h3>
         <div style={{fontSize:'3rem', marginBottom:'1rem'}}>🛡️</div>
         
         <input 
           type="text" maxLength="4" 
           value={pin} onChange={e => setPin(e.target.value)}
           style={inputStyle}
         />
         
         <button className="btn-yellow-action" style={{width:'100%', justifyContent:'center', fontSize:'1.2rem', padding:'1rem'}} onClick={handleSave}>
            ENREGISTRER
         </button>
         {msg && <p style={{fontWeight:'bold', marginTop:'1rem'}}>{msg}</p>}
      </div>

      <div className="list-card" style={{padding:'2rem', marginTop:'2rem', background:'#E3F2FD'}}>
         <h3 style={{marginTop:0}}>Sauvegardes</h3>
         <p>Exportez vos données pour ne rien perdre.</p>
         <div style={{display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap'}}>
            <button className="btn-yellow-action" style={{background:'white'}} onClick={async () => {
                const json = await db.exportData();
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([json], {type:'application/json'}));
                a.download = 'backup_gestmed.json';
                a.click();
            }}>
                💾 TÉLÉCHARGER
            </button>
         </div>
      </div>
    </div>
  );
}
