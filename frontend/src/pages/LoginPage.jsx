import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './LoginPage.css';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Acceso concedido');
      navigate('/social');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error en las credenciales');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container animate-fade-up">
      <form className="auth-form glass-amber" onSubmit={handleSubmit}>
        <div className="auth-header text-center">
          <h2 className="section__title text-glow-amber text-amber font-display">Ingreso a la Logia</h2>
          <p className="auth-subtitle text-muted font-mono">Autenticación requerida</p>
        </div>

        <div className="input-group">
          <input
            type="email"
            className="neu-inset-sm font-body"
            placeholder="Correo Electrónico"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        <div className="input-group">
          <input
            type="password"
            className="neu-inset-sm font-body"
            placeholder="Contraseña"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>

        <button
          type="submit"
          className="btn-primary w-full neu-raised glow-amber font-display"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Verificando...' : 'Acceder'}
        </button>

        <div className="auth-footer text-center mt-4">
          <p className="text-muted font-mono" style={{fontSize: '12px'}}>
            ¿No tienes acceso? <Link to="/registro" className="text-amber">Solicitar entrada</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
