import React, { useState } from 'react';
import { useNavigate, Link } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password'); // demo default
  const [userType, setUserType] = useState<'user' | 'provider'>('user'); // Default login type
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Replaced fetch with api.login for demo purposes while maintaining requested structure
      const response = await api.login(email, password, userType);

      // Save user + token in auth context
      login(response.user, response.token);

      navigate('/dashboard');
    } catch (err) {
      setError(`Invalid ${userType} email or password. (Try password: "password")`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {userType === 'provider' ? 'Provider Sign In' : 'User Sign In'}
        </h2>

        {/* Toggle Switch */}
        <div className="mt-4 flex justify-center space-x-6 text-sm">
           <button 
             type="button"
             onClick={() => setUserType('user')}
             className={`${userType === 'user' ? 'text-indigo-600 font-bold border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
           >
             Login as User
           </button>
           <span className="text-gray-300">|</span>
           <button 
             type="button"
             onClick={() => setUserType('provider')}
             className={`${userType === 'provider' ? 'text-indigo-600 font-bold border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
           >
             Login as Provider
           </button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            register a new {userType} account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={userType === 'provider' ? "provider@test.com" : "user@test.com"}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Demo password is <strong>password</strong>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : `Sign in as ${userType === 'provider' ? 'Provider' : 'User'}`}
              </button>
            </div>
          </form>

          <div className="mt-6 text-sm text-gray-500 text-center">
            Demo users:
            <br />
            {userType === 'provider' ? (
                 <span className="font-mono">provider@test.com / password</span>
            ) : (
                 <span className="font-mono">user@test.com / password</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};