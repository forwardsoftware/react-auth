import React from 'react';

import AppContent from './AppContent';
import { AuthProvider } from './auth';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
