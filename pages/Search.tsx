import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from '../context/AuthContext';
import { ServiceCard } from '../components/ServiceCard';
import { Service } from '../types';
import { api } from '../services/api';
import { Search as SearchIcon, MapPin, Filter } from 'lucide-react';

export const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(queryParams.get('q') || '');
  const [category, setCategory] = useState(queryParams.get('category') || 'All');
  const [locationFilter, setLocationFilter] = useState('');

  const categories = ['All', 'Electrical', 'Plumbing', 'Cleaning', 'Gardening', 'Moving', 'Painting'];

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const data = await api.getServices(searchTerm, category, locationFilter);
        setServices(data);
      } catch (err) {
        console.error("Failed to fetch services", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [searchTerm, category, locationFilter]); // Re-run when filters change

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you might update the URL query params here
    // navigate(`?q=${searchTerm}&category=${category}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <div className="flex items-center gap-2 mb-6 text-gray-900 font-bold text-lg">
                <Filter className="w-5 h-5" />
                Filters
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="City, ZIP..." 
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="block w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 border text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-8">
              <form onSubmit={handleSearch} className="relative flex shadow-sm rounded-xl">
                <div className="relative flex-grow focus-within:z-10">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-l-xl pl-11 sm:text-sm border-gray-300 py-4"
                    placeholder="Search for providers, services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="-ml-px relative inline-flex items-center px-8 py-4 border border-transparent text-sm font-medium rounded-r-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Results */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : services.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
                  <SearchIcon className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No services found</h3>
                <p className="mt-1 text-gray-500">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};