import React from 'react';
import { Link } from '../context/AuthContext';
import { Service } from '../types';
import { MapPin, Star, Tag } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100 flex flex-col h-full">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={service.imageUrl} 
          alt={service.title} 
          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-indigo-700 shadow-sm flex items-center gap-1">
          <Tag className="w-3 h-3" />
          {service.category}
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{service.title}</h3>
          <span className="flex items-center text-amber-500 font-medium text-sm">
            <Star className="w-4 h-4 fill-current mr-1" />
            {service.rating} ({service.reviewCount})
          </span>
        </div>
        
        <p className="text-sm text-gray-500 mb-2 font-medium">by {service.providerName}</p>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">{service.description}</p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
            <span className="truncate max-w-[120px]">{service.location}</span>
          </div>
          <div className="text-lg font-bold text-indigo-600">
            ${service.price}
          </div>
        </div>
        
        <Link 
          to={`/service/${service.id}`}
          className="w-full mt-4 block text-center bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};