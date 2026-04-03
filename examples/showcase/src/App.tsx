import { AuthProvider } from './auth';
import { Dashboard } from './components/Dashboard';

const LoadingComponent = (
  <div className="loading-screen">
    <div className="spinner" />
    <p>Initializing authentication…</p>
  </div>
);

const ErrorComponent = (
  <div className="error-screen">
    <p>⚠️ Authentication failed to initialize. Please reload the page.</p>
  </div>
);

export const App = () => (
  <AuthProvider LoadingComponent={LoadingComponent} ErrorComponent={ErrorComponent}>
    <Dashboard />
  </AuthProvider>
);
