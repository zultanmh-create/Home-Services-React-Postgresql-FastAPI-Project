import React from 'react';
import { Link } from '../context/AuthContext';
import { Hammer, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Hammer className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-white">ServiceLink</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Connecting you with trusted local professionals for all your home service needs. Quality work, guaranteed.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Discover</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/search" className="hover:text-indigo-400 transition-colors">Find Services</Link></li>
              <li><Link to="/search?category=Plumbing" className="hover:text-indigo-400 transition-colors">Plumbing</Link></li>
              <li><Link to="/search?category=Electrical" className="hover:text-indigo-400 transition-colors">Electrical</Link></li>
              <li><Link to="/search?category=Cleaning" className="hover:text-indigo-400 transition-colors">Home Cleaning</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Provider Login</Link></li>
              <li><Link to="/register" className="hover:text-indigo-400 transition-colors">Become a Provider</Link></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <span>123 Service Lane,<br/>Tech City, TC 90210</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <span>support@servicelink.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} ServiceLink. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};