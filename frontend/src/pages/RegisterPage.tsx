import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { UserPlus, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.email, form.username, form.password, form.fullName);
      navigate('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-ink-0">TaskFlow</span>
        </div>

        <h2 className="font-display text-2xl font-bold text-ink-0 mb-1">Create your account</h2>
        <p className="text-ink-3 font-body mb-8">Start managing your projects today</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-display font-medium text-ink-1 mb-1.5">Full Name</label>
            <input type="text" className="input-field" placeholder="Jane Smith" value={form.fullName} onChange={set('fullName')} required />
          </div>
          <div>
            <label className="block text-sm font-display font-medium text-ink-1 mb-1.5">Username</label>
            <input type="text" className="input-field" placeholder="janesmith" value={form.username} onChange={set('username')} required minLength={3} />
          </div>
          <div>
            <label className="block text-sm font-display font-medium text-ink-1 mb-1.5">Email</label>
            <input type="email" className="input-field" placeholder="jane@company.com" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="block text-sm font-display font-medium text-ink-1 mb-1.5">Password</label>
            <input type="password" className="input-field" placeholder="Min 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="text-center text-ink-3 text-sm mt-8 font-body">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
