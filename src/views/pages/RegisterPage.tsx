import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const { register, loading, error } = useAuth();
  const [form, setForm] = useState<FormData>({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const validatePassword = (password: string) => {
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[@#$%^&+=!]/.test(password),
    ];
    return checks.every(Boolean);
  };

  const getStrength = () => {
    const p = form.password;
    if (!p) return { msg: '', color: '' };
    const score = [p.length>=8, /[A-Z]/.test(p), /[a-z]/.test(p), /\d/.test(p), /[@#$%^&+=!]/.test(p)].filter(Boolean).length;
    if (score<=2) return { msg: 'Weak', color: 'red' };
    if (score<=3) return { msg: 'Medium', color: 'orange' };
    if (score<=4) return { msg: 'Strong', color: 'blue' };
    return { msg: 'Very Strong', color: 'green' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    if (!form.phone.trim()) errs.phone = 'Required';
    if (!validatePassword(form.password)) errs.password = 'Min 8 chars with uppercase, lowercase, number & special char (@#$%^&+=!)';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    register({ fullName: form.fullName, email: form.email, password: form.password, phone: form.phone });
  };

  const s = getStrength();
  const inputStyle = { display: 'block', width: '100%', padding: 8, marginTop: 4 };

  return (
    <div style={{ maxWidth: 440, margin: '60px auto', padding: 24 }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        {[['fullName','Full Name','text'],['email','Email','email'],['phone','Phone','tel']].map(([id,label,type]) => (
          <div key={id} style={{ marginBottom: 12 }}>
            <label htmlFor={id}>{label}</label>
            <input id={id} type={type} name={id} value={(form as any)[id]} onChange={handleChange} required style={inputStyle} />
            {fieldErrors[id] && <small style={{ color:'red' }}>{fieldErrors[id]}</small>}
          </div>
        ))}
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} style={inputStyle} />
          {form.password && <small style={{ color: s.color }}>Strength: {s.msg}</small>}
          {fieldErrors.password && <div><small style={{ color:'red' }}>{fieldErrors.password}</small></div>}
          <small style={{ display:'block', color:'#666', marginTop:4 }}>Must contain: uppercase, lowercase, number, special (@#$%^&+=!)</small>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input id="confirmPassword" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required style={inputStyle} />
          {fieldErrors.confirmPassword && <small style={{ color:'red' }}>{fieldErrors.confirmPassword}</small>}
        </div>
        {error && <p role="alert" style={{ color:'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width:'100%', padding:10 }}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
};

export default RegisterPage;
