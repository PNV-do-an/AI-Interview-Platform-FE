import React from 'react';
import { useAuth } from '../../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <p>Welcome, <strong>{user?.fullName}</strong>!</p>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>
      <button onClick={logout} style={{ marginTop: 16, padding: '8px 16px' }}>
        Logout
      </button>
    </div>
  );
};

export default DashboardPage;
