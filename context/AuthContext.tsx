import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

// --- Simple Router Implementation ---

const RouterContext = createContext<{ pathname: string; search: string }>({ pathname: '/', search: '' });

export const useLocation = () => useContext(RouterContext);

export const useNavigate = () => {
  return (to: string, options?: { replace?: boolean }) => {
    window.location.hash = to;
  };
};

export const useParams = <T extends Record<string, string>>(): T => {
  const { pathname } = useLocation();
  // Safe matching for /service/:id
  const serviceMatch = pathname.match(/^\/service\/([^/]+)$/);
  if (serviceMatch) {
    return { id: serviceMatch[1] } as unknown as T;
  }
  return {} as T;
};

export const Link = ({ to, children, className, ...props }: any) => (
  <a 
    href={`#${to}`} 
    className={className} 
    {...props}
  >
    {children}
  </a>
);

export const HashRouter = ({ children }: { children: ReactNode }) => {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.slice(1) || '/';
    const [pathname, search] = hash.split('?');
    return { pathname, search: search ? `?${search}` : '' };
  });

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.slice(1) || '/';
      const [pathname, search] = hash.split('?');
      setRoute({ pathname, search: search ? `?${search}` : '' });
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return (
    <RouterContext.Provider value={route}>
      {children}
    </RouterContext.Provider>
  );
};

export const Routes = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  
  let element: ReactNode = null;
  
  React.Children.forEach(children, child => {
    if (element) return; // Already found a match
    if (!React.isValidElement(child)) return;
    
    const props = child.props as { path?: string; element?: ReactNode };
    const path = props.path;
    
    if (!path) return;

    // 1. Exact match
    if (path === pathname) {
      element = props.element;
      return;
    }
    
    // 2. Param match (supports :param syntax roughly)
    if (path.includes(':')) {
      // Convert /service/:id to ^/service/([^/]+)$
      const regexStr = '^' + path.replace(/:[^/]+/g, '([^/]+)') + '$';
      const regex = new RegExp(regexStr);
      if (regex.test(pathname)) {
        element = props.element;
      }
    }
  });

  return element;
};

export const Route = (props: { path: string, element: ReactNode }) => null;

export const Navigate = ({ to }: { to: string, replace?: boolean }) => {
  useEffect(() => {
    // Avoid setting hash if already there to prevent loops/redundant events
    const currentHash = window.location.hash.slice(1);
    if (currentHash !== to) {
      window.location.hash = to;
    }
  }, [to]);
  return null;
};

// --- Auth Context ---

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  // Initialize state LAZILY to avoid initial render with null if data exists
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from local storage", error);
      return null;
    }
  });

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Force navigate to home or login on logout
    window.location.hash = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};