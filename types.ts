// These types match the structure you will likely use in your FastAPI Pydantic models

export enum UserRole {
  USER = 'USER',
  PROVIDER = 'PROVIDER'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Service {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  description: string;
  category: string;
  location: string;
  price: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  serviceId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  userId: string;
  serviceTitle: string;
  serviceImage: string;
  status: 'Pending' | 'Confirmed' | 'Completed';
  date: string;
  price: number;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export interface LoginResponse {
  token: string; // JWT token in the future
  user: User;
}
