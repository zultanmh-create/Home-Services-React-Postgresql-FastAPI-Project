import { Service, User, UserRole, LoginResponse, Booking, Review } from '../types';

// --- BACKEND CONFIGURATION ---
const USE_MOCK_API = false; // Always use backend - no mock data
const API_URL = 'http://localhost:8000';
const BACKEND_TIMEOUT = 10000; // 10 seconds timeout

// Backend health check
const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
    
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Error handler for backend connection issues
const handleBackendError = (error: any): never => {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    // Network error - backend is likely not running
    const errorMessage = 'Backend server is not running. Please start the backend server with: fastapi dev main.py';
    console.error('Backend Connection Error:', errorMessage);
    throw new Error(errorMessage);
  }
  
  if (error.name === 'AbortError') {
    throw new Error('Backend request timed out. Please check if the backend server is running.');
  }
  
  // Re-throw other errors
  throw error;
};

// Initial Mock Data
let mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'user@test.com', role: UserRole.USER, avatarUrl: 'https://ui-avatars.com/api/?name=John+Doe' },
  { id: '2', name: 'Bob Smith', email: 'provider@test.com', role: UserRole.PROVIDER, avatarUrl: 'https://ui-avatars.com/api/?name=Bob+Smith' }
];

let mockServices: Service[] = [
  {
    id: '1',
    providerId: '2',
    providerName: 'Bob Smith',
    title: 'Expert Electrical Repair',
    description: 'Fixing all your wiring needs with safety and speed. Residential and commercial services available.',
    category: 'Electrical',
    location: 'New York, NY',
    price: 150,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: 12
  },
  {
    id: '2',
    providerId: '2',
    providerName: 'Bob Smith',
    title: 'Emergency Plumbing',
    description: 'Leaky pipes? Clogged drains? I can help 24/7. Fast response times guaranteed.',
    category: 'Plumbing',
    location: 'Brooklyn, NY',
    price: 120,
    imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    reviewCount: 8
  },
  {
    id: '3',
    providerId: '99',
    providerName: 'Clean Home Inc',
    title: 'Deep House Cleaning',
    description: 'We make your home sparkle from top to bottom. Eco-friendly products used.',
    category: 'Cleaning',
    location: 'Manhattan, NY',
    price: 200,
    imageUrl: 'https://images.unsplash.com/photo-1581578731117-104f8a338e2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 25
  },
  {
    id: '4',
    providerId: '100',
    providerName: 'Green Thumbs',
    title: 'Garden Maintenance',
    description: 'Weekly lawn care, pruning, and landscaping services.',
    category: 'Gardening',
    location: 'Queens, NY',
    price: 80,
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewCount: 15
  }
];

let mockBookings: Booking[] = [];

let mockReviews: Review[] = [
  {
    id: '1',
    serviceId: '1',
    userId: '1',
    userName: 'John Doe',
    rating: 5,
    comment: 'Excellent work, very professional!',
    date: new Date().toISOString()
  }
];

// Helper functions for Real API (kept for reference)
const mapService = (data: any): Service => ({
  id: String(data.id),
  providerId: String(data.provider_id),
  providerName: data.provider_name,
  title: data.title,
  description: data.description,
  category: data.category,
  location: data.location,
  price: data.price,
  imageUrl: data.image_url,
  rating: data.rating || 0,
  reviewCount: data.review_count || 0
});

const mapUser = (data: any): User => ({
  id: String(data.id),
  name: data.name,
  email: data.email,
  role: data.role as UserRole,
  avatarUrl: data.avatar_url
});

const mapBooking = (data: any): Booking => ({
  id: String(data.id),
  serviceId: String(data.service_id),
  userId: String(data.user_id),
  serviceTitle: data.service_title,
  serviceImage: data.service_image,
  status: data.status,
  date: data.booking_date,
  price: data.price,
  userName: data.user_name,
  userEmail: data.user_email,
  userAvatar: data.user_avatar
});

const mapReview = (data: any): Review => ({
  id: String(data.id),
  serviceId: String(data.service_id),
  userId: String(data.user_id),
  userName: data.user_name,
  rating: data.rating,
  comment: data.comment,
  date: data.created_at
});

export const api = {
  // --- SERVICES ---
  getServices: async (query?: string, category?: string, location?: string): Promise<Service[]> => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (category && category !== 'All') params.append('category', category);
      if (location) params.append('location', location);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const res = await fetch(`${API_URL}/services?${params.toString()}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to fetch services' }));
        throw new Error(errorData.detail || 'Failed to fetch services');
      }
      
      const data = await res.json();
      return data.map(mapService);
    } catch (error) {
      handleBackendError(error);
      throw error; // This won't be reached but TypeScript needs it
    }
  },

  getServiceById: async (id: string): Promise<Service | undefined> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const res = await fetch(`${API_URL}/services/${id}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        if (res.status === 404) return undefined;
        const errorData = await res.json().catch(() => ({ detail: 'Failed to fetch service' }));
        throw new Error(errorData.detail || 'Failed to fetch service');
      }
      
      const data = await res.json();
      return mapService(data);
    } catch (error) {
      handleBackendError(error);
      return undefined;
    }
  },

  getProviderServices: async (providerId: string): Promise<Service[]> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const res = await fetch(`${API_URL}/services/provider/${providerId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to fetch provider services' }));
        throw new Error(errorData.detail || 'Failed to fetch provider services');
      }
      
      const data = await res.json();
      return data.map(mapService);
    } catch (error) {
      handleBackendError(error);
      throw error;
    }
  },

  createService: async (serviceData: any, imageFile: File | null): Promise<Service> => {
    try {
      const formData = new FormData();
      formData.append('provider_id', serviceData.providerId);
      formData.append('title', serviceData.title);
      formData.append('description', serviceData.description);
      formData.append('category', serviceData.category);
      formData.append('location', serviceData.location);
      formData.append('price', String(serviceData.price));
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT * 2); // Longer timeout for file uploads

      const res = await fetch(`${API_URL}/services`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to create service' }));
        throw new Error(err.detail || 'Failed to create service');
      }
      
      const data = await res.json();
      return mapService(data);
    } catch (error) {
      handleBackendError(error);
      throw error;
    }
  },

  updateService: async (id: string, serviceData: any, imageFile: File | null): Promise<Service> => {
    try {
      const formData = new FormData();
      formData.append('title', serviceData.title);
      formData.append('description', serviceData.description);
      formData.append('category', serviceData.category);
      formData.append('location', serviceData.location);
      formData.append('price', String(serviceData.price));
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT * 2); // Longer timeout for file uploads

      const res = await fetch(`${API_URL}/services/${id}`, {
        method: 'PUT',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to update service' }));
        throw new Error(err.detail || 'Failed to update service');
      }
      
      const data = await res.json();
      return mapService(data);
    } catch (error) {
      handleBackendError(error);
      throw error;
    }
  },

  // --- BOOKINGS ---
  createBooking: async (serviceId: string, userId: string, date: string): Promise<void> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId, user_id: userId, booking_date: date }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Booking failed' }));
        throw new Error(errorData.detail || 'Booking failed');
      }
    } catch (error) {
      handleBackendError(error);
      throw error;
    }
  },

  getUserBookings: async (userId: string): Promise<Booking[]> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const res = await fetch(`${API_URL}/bookings/user/${userId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to fetch bookings' }));
        throw new Error(errorData.detail || 'Failed to fetch bookings');
      }
      
      const data = await res.json();
      return data.map(mapBooking);
    } catch (error) {
      handleBackendError(error);
      throw error;
    }
  },

  getProviderBookings: async (providerId: string): Promise<Booking[]> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const res = await fetch(`${API_URL}/bookings/provider/${providerId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to fetch provider bookings' }));
        throw new Error(errorData.detail || 'Failed to fetch provider bookings');
      }

      const data = await res.json();
      return data.map(mapBooking);
    } catch (error) {
      handleBackendError(error);
      throw error;
    }
  },

  updateBookingStatus: async (bookingId: string, status: Booking['status']): Promise<Booking> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const res = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to update booking' }));
        throw new Error(errorData.detail || 'Failed to update booking');
      }

      const data = await res.json();
      return mapBooking(data);
    } catch (error) {
      handleBackendError(error);
      throw error;
    }
  },

  // --- REVIEWS ---
  createReview: async (serviceId: string, userId: string, rating: number, comment: string): Promise<void> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId, user_id: userId, rating, comment }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to submit review' }));
        throw new Error(errorData.detail || 'Failed to submit review');
      }
    } catch (error) {
      handleBackendError(error);
      throw error;
    }
  },

  getServiceReviews: async (serviceId: string): Promise<Review[]> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const res = await fetch(`${API_URL}/reviews/service/${serviceId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        // Return empty array for 404, but throw for other errors
        if (res.status === 404) return [];
        const errorData = await res.json().catch(() => ({ detail: 'Failed to fetch reviews' }));
        throw new Error(errorData.detail || 'Failed to fetch reviews');
      }
      
      const data = await res.json();
      return data.map(mapReview);
    } catch (error) {
      // Return empty array on connection errors for reviews (non-critical)
      if (error instanceof Error && error.message.includes('Backend server')) {
        console.warn('Backend unavailable, returning empty reviews');
        return [];
      }
      handleBackendError(error);
      throw error;
    }
  },

  // --- AUTH ---
  login: async (email: string, password: string, userType: 'user' | 'provider' = 'user'): Promise<LoginResponse> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, user_type: userType }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Invalid credentials' }));
        throw new Error(errorData.detail || 'Invalid credentials');
      }
      
      const data = await res.json();
      
      return {
        token: data.token,
        user: mapUser(data.user)
      };
    } catch (error) {
      handleBackendError(error);
      throw error;
    }
  },

  register: async (name: string, email: string, password: string, userType: 'user' | 'provider' = 'user'): Promise<LoginResponse> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const role = userType; 
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(err.detail || 'Registration failed');
      }
      
      const data = await res.json();

      return {
        token: data.token,
        user: mapUser(data.user)
      };
    } catch (error) {
      handleBackendError(error);
      throw error;
    }
  },

  // Backend health check
  checkBackendHealth
};
