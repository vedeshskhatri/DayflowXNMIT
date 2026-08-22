import React from 'react';
import { useAuth } from '../context/AuthContext';
import { EmployeeProfileView } from '../components/EmployeeProfileView';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return <EmployeeProfileView employeeId={user.id} editable={true} />;
};
