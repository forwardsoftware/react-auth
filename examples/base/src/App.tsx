import React from 'react'

import { AuthProvider } from './auth';
import { Content } from './Content';

export const App: React.FC = () => (
  <AuthProvider>
    <Content />
  </AuthProvider>
);