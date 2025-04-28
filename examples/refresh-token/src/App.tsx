import AppContent from './AppContent';
import { AuthProvider } from './auth';

export const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
