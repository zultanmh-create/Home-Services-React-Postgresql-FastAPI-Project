import React from 'react';
import { Link, useLocation } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Hammer, User as UserIcon, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-indigo-600';

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Hammer className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">ServiceLink</span>
            </Link>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
            <Link to="/" className={isActive('/')}>Home</Link>
            <Link to="/search" className={isActive('/search')}>Find Services</Link>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4 ml-4">
                <Link to="/dashboard" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600">
                  <img src={user?.avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full border border-gray-200" />
                  <span className="font-medium">{user?.name}</span>
                </Link>
                <button 
                  onClick={logout} 
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-gray-700 font-medium hover:text-indigo-600">Provider Login</Link>
                <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm font-medium">
                  Register Service
                </Link>
              </div>
            )}
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100">
          <div className="pt-2 pb-3 space-y-1">
            <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Home</Link>
            <Link to="/search" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Find Services</Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Dashboard</Link>
                <button onClick={logout} className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-gray-50">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Login</Link>
                <Link to="/register" className="block px-3 py-2 text-base font-medium text-indigo-600 hover:bg-indigo-50">Register Provider</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};