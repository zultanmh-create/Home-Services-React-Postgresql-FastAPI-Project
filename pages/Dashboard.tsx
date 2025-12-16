import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { generateServiceDescription } from '../services/gemini';
import { Service, UserRole, Booking } from '../types';
import { Plus, Wand2, Loader2, DollarSign, MapPin as MapPinIcon, LayoutGrid, Search, Upload, Calendar, Clock, Edit2, RefreshCw, Mail } from 'lucide-react';
import { ServiceCard } from '../components/ServiceCard';
import { Link } from '../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  // --- USER DASHBOARD ---
  if (user.role === UserRole.USER) {
    return <UserDashboard />;
  }

  // --- PROVIDER DASHBOARD ---
  return <ProviderDashboard />;
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(user) {
      api.getUserBookings(user.id)
        .then(setBookings)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome back, {user?.name}!</h1>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto">
              Ready to find the perfect professional for your next project? Browse our marketplace to get started.
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                to="/search" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all"
              >
                <Search className="w-5 h-5 mr-2" />
                Find Services
              </Link>
            </div>
          </div>
            
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
               <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                 <Calendar className="w-5 h-5 text-indigo-600" />
                 My Bookings
               </h2>
               
               {loading ? (
                 <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600" /></div>
               ) : bookings.length === 0 ? (
                 <p className="text-gray-400 italic text-center py-8">No bookings found. Start exploring services!</p>
               ) : (
                 <div className="space-y-4">
                   {bookings.map((booking) => (
                     <div key={booking.id} className="flex flex-col sm:flex-row items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                       <img src={booking.serviceImage} alt="" className="w-16 h-16 rounded-lg object-cover mb-4 sm:mb-0 sm:mr-4" />
                       <div className="flex-1 text-center sm:text-left">
                         <h3 className="font-bold text-gray-900">{booking.serviceTitle}</h3>
                         <div className="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-2 mt-1">
                           <Clock className="w-4 h-4" />
                           {new Date(booking.date).toLocaleDateString()}
                         </div>
                       </div>
                       <div className="mt-4 sm:mt-0 flex flex-col items-end gap-2">
                         <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                           booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 
                           booking.status === 'Completed' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                         }`}>
                           {booking.status}
                         </span>
                         <span className="font-bold text-indigo-600">${booking.price}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
          </div>
        </div>
      </div>
  );
};

const ProviderDashboard = () => {
  const { user } = useAuth();
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingRequests, setBookingRequests] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  
  // Controls visibility of the form
  const [showForm, setShowForm] = useState(false);
  // Holds the ID of the service being edited, or null if creating new
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState({
    title: '',
    category: 'Electrical',
    price: '',
    location: '',
    description: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>(''); // For preview when editing
  
  const [aiGenerating, setAiGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadServices();
      loadBookings();
    }
  }, [user]);

  const loadServices = async () => {
    if (!user) return;
    try {
      const data = await api.getProviderServices(user.id);
      setMyServices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!user) return;
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const data = await api.getProviderBookings(user.id);
      setBookingRequests(data);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Failed to load booking requests';
      setBookingsError(message);
    } finally {
      setBookingsLoading(false);
    }
  };

  const getStatusClasses = (status: Booking['status']) => {
    if (status === 'Confirmed') return 'bg-green-100 text-green-800';
    if (status === 'Completed') return 'bg-gray-100 text-gray-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    setUpdatingBookingId(bookingId);
    try {
      const updated = await api.updateBookingStatus(bookingId, status);
      setBookingRequests(prev => prev.map(b => (b.id === bookingId ? updated : b)));
    } catch (error) {
      console.error(error);
      alert('Failed to update booking status');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleAiGenerate = async () => {
    if (!formState.title) {
      alert("Please enter a title first.");
      return;
    }
    setAiGenerating(true);
    try {
      const desc = await generateServiceDescription(formState.title, formState.category, "Professional, reliable");
      setFormState(prev => ({ ...prev, description: desc }));
    } catch (error) {
      console.error(error);
      alert("AI generation failed");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const openEditForm = (service: Service) => {
    setEditingServiceId(service.id);
    setFormState({
      title: service.title,
      category: service.category,
      price: String(service.price),
      location: service.location,
      description: service.description
    });
    setExistingImageUrl(service.imageUrl);
    setImageFile(null);
    setShowForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAddForm = () => {
    setEditingServiceId(null);
    setFormState({
      title: '',
      category: 'Electrical',
      price: '',
      location: '',
      description: ''
    });
    setExistingImageUrl('');
    setImageFile(null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingServiceId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validation: Image is required for new services, optional for updates
    if (!editingServiceId && !imageFile) {
      alert("Please upload an image for your new service.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingServiceId) {
        // UPDATE
        await api.updateService(editingServiceId, {
          title: formState.title,
          description: formState.description,
          category: formState.category,
          location: formState.location,
          price: parseFloat(formState.price)
        }, imageFile);
      } else {
        // CREATE
        await api.createService({
          providerId: user.id,
          providerName: user.name,
          title: formState.title,
          description: formState.description,
          category: formState.category,
          location: formState.location,
          price: parseFloat(formState.price)
        }, imageFile);
      }

      setShowForm(false);
      loadServices(); // Refresh list
    } catch (error) {
      console.error(error);
      alert(editingServiceId ? "Failed to update service" : "Failed to create service");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your services and view listings.</p>
          </div>
          <button 
            onClick={showForm ? cancelForm : openAddForm}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors shadow-sm ${
              showForm 
              ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {showForm ? 'Cancel' : (
              <>
                <Plus className="w-5 h-5" />
                Post New Service
              </>
            )}
          </button>
        </div>

        {/* Booking Requests */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Booking Requests</h2>
              <p className="text-gray-500 text-sm">Review client requests and confirm jobs to get started.</p>
            </div>
            <button
              onClick={loadBookings}
              disabled={bookingsLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${bookingsLoading ? 'animate-spin text-indigo-600' : 'text-gray-500'}`} />
              Refresh
            </button>
          </div>

          {bookingsError && (
            <p className="text-sm text-red-500 mb-4">{bookingsError}</p>
          )}

          {bookingsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : bookingRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No booking requests yet. When clients book your services, their requests will appear here.
            </p>
          ) : (
            <div className="space-y-4">
              {bookingRequests.map(booking => {
                const fallbackName = booking.userName || 'Client';
                const avatarUrl = booking.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}`;
                const formattedDate = (() => {
                  if (!booking.date) return 'Date pending';
                  const parsed = new Date(booking.date);
                  return isNaN(parsed.getTime()) ? booking.date : parsed.toLocaleDateString();
                })();
                const formattedPrice = typeof booking.price === 'number' ? `$${booking.price.toFixed(2)}` : '$0.00';
                const isUpdating = updatingBookingId === booking.id;

                return (
                  <div key={booking.id} className="flex flex-col lg:flex-row lg:items-center gap-6 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <img src={avatarUrl} alt={fallbackName} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{fallbackName}</h3>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{booking.userEmail || 'Email not provided'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs uppercase text-gray-400 tracking-wide">Service</p>
                        <p className="text-sm font-medium text-gray-900">{booking.serviceTitle}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400 tracking-wide">Date</p>
                        <p className="text-sm font-medium text-gray-900">{formattedDate}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400 tracking-wide">Price</p>
                        <p className="text-sm font-medium text-gray-900">{formattedPrice}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:ml-auto">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(booking.status)}`}>
                        {booking.status}
                      </span>
                      <div className="flex gap-2">
                        {booking.status === 'Pending' && (
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'Confirmed')}
                            disabled={isUpdating}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                            Accept Request
                          </button>
                        )}
                        {booking.status === 'Confirmed' && (
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, 'Completed')}
                            disabled={isUpdating}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add/Edit Service Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-10 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100">
              {editingServiceId ? 'Edit Service Details' : 'Details of your new service'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Title</label>
                  <input
                    required
                    type="text"
                    value={formState.title}
                    onChange={e => setFormState({...formState, title: e.target.value})}
                    placeholder="e.g. Emergency Plumbing Repair"
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formState.category}
                    onChange={e => setFormState({...formState, category: e.target.value})}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 border"
                  >
                     {['Electrical', 'Plumbing', 'Cleaning', 'Gardening', 'Moving', 'Painting'].map(c => (
                       <option key={c} value={c}>{c}</option>
                     ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      required
                      type="number"
                      value={formState.price}
                      onChange={e => setFormState({...formState, price: e.target.value})}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 pl-10 border"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      required
                      type="text"
                      value={formState.location}
                      onChange={e => setFormState({...formState, location: e.target.value})}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 pl-10 border"
                      placeholder="City, State"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Image {editingServiceId && '(Leave blank to keep current image)'}
                </label>
                <div className="flex gap-6 items-start">
                  {existingImageUrl && !imageFile && (
                    <div className="flex-shrink-0">
                      <p className="text-xs text-gray-500 mb-1">Current:</p>
                      <img src={existingImageUrl} alt="Current" className="w-32 h-32 object-cover rounded-lg border border-gray-200" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload new</span></p>
                        <p className="text-xs text-gray-500">{imageFile ? imageFile.name : "SVG, PNG, JPG or GIF"}</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <button 
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={aiGenerating}
                    className="text-xs flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-800 disabled:opacity-50"
                  >
                    {aiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    Generate with AI
                  </button>
                </div>
                <textarea
                  required
                  rows={4}
                  value={formState.description}
                  onChange={e => setFormState({...formState, description: e.target.value})}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 border"
                  placeholder="Describe your service in detail..."
                />
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingServiceId ? 'Update Service' : 'Publish Service'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Services Grid */}
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-gray-500" />
          My Active Services
        </h2>
        
        {loading ? (
           <div className="flex justify-center py-12">
             <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
           </div>
        ) : myServices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">You haven't posted any services yet.</p>
            <button onClick={openAddForm} className="text-indigo-600 font-medium mt-2 hover:underline">Create your first listing</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myServices.map(service => (
              <div key={service.id} className="relative group">
                <ServiceCard service={service} />
                
                {/* Provider Actions Overlay */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button 
                    onClick={() => openEditForm(service)}
                    className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-indigo-600 shadow-sm hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                    title="Edit Service"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
