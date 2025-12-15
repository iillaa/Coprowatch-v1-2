import { useState, useEffect } from 'react';

export default function PinLock({ onUnlock, correctPin = "0000" }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === correctPin) onUnlock();
      else {
        setError(true);
        setTimeout(() => { setPin(""); setError(false); }, 500);
      }
    }
  }, [pin]);

  const handleDigit = (n) => { if(pin.length < 4) { setPin(p => p + n); setError(false); } };

  // Style des boutons du clavier
  const btnStyle = {
    width: '70px', height: '70px', borderRadius: '50%',
    border: '3px solid black', background: 'white',
    fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer',
    boxShadow: '4px 4px 0px rgba(0,0,0,0.2)',
    transition: 'transform 0.1s',
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  };

  return (
    <div style={{
      position:'fixed', inset:0, background:'#F3E5F5',
      display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', zIndex:9999
    }}>
      <div style={{
        background:'white', padding:'2rem', borderRadius:'30px',
        border:'4px solid black', boxShadow:'8px 8px 0px black',
        textAlign:'center', maxWidth:'350px'
      }}>
        <div style={{fontSize:'3rem', marginBottom:'1rem'}}>🔐</div>
        <h2 style={{textTransform:'uppercase', margin:'0 0 1rem 0'}}>Accès Sécurisé</h2>
        
        {/* POINTS DU PIN */}
        <div style={{display:'flex', justifyContent:'center', gap:'15px', marginBottom:'2rem'}}>
          {[0,1,2,3].map(i => (
             <div key={i} style={{
                width:'20px', height:'20px', borderRadius:'50%',
                border:'2px solid black',
                background: i < pin.length ? (error ? '#FF8A80' : '#6366f1') : 'white'
             }} />
          ))}
        </div>

        {/* CLAVIER */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'15px', justifyContent:'center'}}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} style={btnStyle} onClick={() => handleDigit(n)} 
              onMouseDown={e => e.currentTarget.style.transform='translate(2px,2px)'}
              onMouseUp={e => e.currentTarget.style.transform='translate(0,0)'}
            >
              {n}
            </button>
          ))}
          <button style={{...btnStyle, background:'#FF8A80', color:'white'}} onClick={() => setPin("")}>C</button>
          <button style={btnStyle} onClick={() => handleDigit(0)}>0</button>
          <button style={{...btnStyle, background:'#E0E0E0'}} onClick={() => setPin(p => p.slice(0,-1))}>⬅️</button>
        </div>
      </div>
    </div>
  );
}
