import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Service, Review, UserRole } from '../types';
import { MapPin, Star, Tag, Check, Calendar, MessageSquare, ArrowLeft, Share2, ShieldCheck, User } from 'lucide-react';

export const ServiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Booking State
  const [bookingDate, setBookingDate] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Review State
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const [serviceData, reviewsData] = await Promise.all([
            api.getServiceById(id),
            api.getServiceReviews(id)
          ]);
          setService(serviceData || null);
          setReviews(reviewsData);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [id]);

  const handleBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!bookingDate) {
      alert("Please select a date");
      return;
    }
    
    setBookingStatus('loading');
    try {
      if (service && user) {
        await api.createBooking(service.id, user.id, bookingDate);
        setBookingStatus('success');
      }
    } catch (e) {
      setBookingStatus('error');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user || !service) return;

    setReviewSubmitting(true);
    try {
      await api.createReview(service.id, user.id, newReview.rating, newReview.comment);
      // Refresh reviews
      const updatedReviews = await api.getServiceReviews(service.id);
      setReviews(updatedReviews);
      setNewReview({ rating: 5, comment: '' });
    } catch (e) {
      alert("Failed to post review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h2>
        <Link to="/search" className="text-indigo-600 font-medium hover:underline">
          &larr; Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Back */}
        <div className="mb-6">
          <Link to="/search" className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Search
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Image Header */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative h-64 sm:h-80 md:h-96">
                <img 
                  src={service.imageUrl} 
                  alt={service.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                   <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/90 text-indigo-800 backdrop-blur-sm shadow-sm">
                    <Tag className="w-3 h-3 mr-1.5" />
                    {service.category}
                   </span>
                </div>
              </div>
              
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.title}</h1>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                      {service.location}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                        <Star className="w-5 h-5 text-amber-400 fill-current mr-1.5" />
                        <span className="font-bold text-amber-900">{service.rating}</span>
                        <span className="text-amber-700 ml-1 text-sm">({reviews.length} reviews)</span>
                     </div>
                  </div>
                </div>

                <div className="prose prose-indigo max-w-none text-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About this service</h3>
                  <p className="leading-relaxed">{service.description}</p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h3>
              
              {/* Add Review Form */}
              {isAuthenticated && user?.role === UserRole.USER ? (
                <form onSubmit={handleReviewSubmit} className="mb-8 bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-sm mb-3">Leave a Review</h4>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Rating</label>
                    <select 
                      value={newReview.rating}
                      onChange={(e) => setNewReview({...newReview, rating: Number(e.target.value)})}
                      className="border-gray-300 rounded-md text-sm p-1"
                    >
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Terrible</option>
                    </select>
                  </div>
                  <textarea
                    className="w-full border-gray-300 rounded-lg text-sm p-2 mb-2"
                    placeholder="Share your experience..."
                    rows={2}
                    value={newReview.comment}
                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                    required
                  ></textarea>
                  <button 
                    type="submit" 
                    disabled={reviewSubmitting}
                    className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {reviewSubmitting ? 'Posting...' : 'Post Review'}
                  </button>
                </form>
              ) : !isAuthenticated ? (
                <div className="mb-8 p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-sm text-gray-600">Please <Link to="/login" className="text-indigo-600 font-bold">login</Link> to leave a review.</p>
                </div>
              ) : null}

              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-gray-500 italic">No reviews yet. Be the first!</p>
                ) : (
                  reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-indigo-100 p-1.5 rounded-full">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="font-semibold text-gray-900">{review.userName}</span>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex text-amber-400 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Starting at</p>
                  <div className="text-3xl font-bold text-gray-900">${service.price}</div>
                </div>
              </div>

              {bookingStatus === 'success' ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-green-800 font-bold mb-2">Booking Confirmed!</p>
                  <p className="text-sm text-green-600 mb-4">You can view this in your dashboard.</p>
                  <Link to="/dashboard" className="text-indigo-600 text-sm font-bold underline">Go to Dashboard</Link>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Select Date</label>
                    <input 
                      type="date" 
                      className="w-full border-gray-300 rounded-lg p-2.5 text-sm"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <button 
                      onClick={handleBooking}
                      disabled={bookingStatus === 'loading'}
                      className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {bookingStatus === 'loading' ? 'Processing...' : (
                        <>
                          <Calendar className="w-5 h-5" />
                          Book Now
                        </>
                      )}
                    </button>
                    {bookingStatus === 'error' && <p className="text-red-500 text-xs text-center">Booking failed. Please try again.</p>}
                  </div>
                </>
              )}

              <div className="text-center text-xs text-gray-400 mt-4">
                Service provided by {service.providerName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};