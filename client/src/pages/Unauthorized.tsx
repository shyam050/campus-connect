import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roleHome } from '../components/RequireRole';
import { Button } from '../components/ui';

export default function Unauthorized() {
  const { user } = useAuth();
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="text-center">
        <ShieldAlert size={36} strokeWidth={1.5} className="mx-auto text-wine" />
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-900">Access denied</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Your role ({user?.role ?? 'guest'}) doesn't have permission to view this page. The permission
          matrix is enforced on both the API and the UI.
        </p>
        <Link to={user ? roleHome(user.role) : '/login'} className="mt-6 inline-block">
          <Button>Back to my dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
