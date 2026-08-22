import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { EmployeeProfileView } from '../components/EmployeeProfileView';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return <Navigate to="/employees" replace />;

  return <EmployeeProfileView employeeId={id} editable={false} />;
};
