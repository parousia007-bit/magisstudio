import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './LoginPage.css';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      alert('¡Cuenta creada con éxito!');
      navigate('/login');
    } catch (err) {
      alert('Error en el registro: ' + err.response?.data?.message);
    }
  };

  return (
    <div className="auth-container animate-fade-up">
      <form className="auth-form glass" onSubmit={handleSubmit}>
        <h2 className="section__title text-amber">Únete a la Logia</h2>
        <p className="auth-subtitle">Crea tu acceso al Laboratorio Magis</p>
        
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Nombre de Usuario" 
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required 
          />
        </div>
        <div className="input-group">
          <input 
            type="email" 
            placeholder="Email" 
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required 
          />
        </div>
        <div className="input-group">
          <input 
            type="password" 
            placeholder="Contraseña" 
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required 
          />
        </div>
        
        <button type="submit" className="btn-primary w-full">Comenzar Mutación</button>
      </form>
    </div>
  );
}
