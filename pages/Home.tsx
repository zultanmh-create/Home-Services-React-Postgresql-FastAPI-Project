import React from 'react';
import { Link } from '../context/AuthContext';
import { Search, ShieldCheck, Clock, Award, ArrowRight } from 'lucide-react';
import electricImg from '../img/electric.jpg';
import plumbingImg from '../img/plumbing.jpg';
import cleaningImg from '../img/cleaning.jpg';
import gardeningImg from '../img/gardening.jpg';

export const Home = () => {
  const categories = [
    { name: 'Electrical', image: electricImg },
    { name: 'Plumbing', image: plumbingImg },
    { name: 'Cleaning', image: cleaningImg },
    { name: 'Gardening', image: gardeningImg }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 to-indigo-700 text-white pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] opacity-10 bg-cover bg-center"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-8 leading-tight">
              Find the perfect professional for your needs
            </h1>
            <p className="text-xl text-indigo-100 mb-10">
              Connect with trusted local experts for electrical, cleaning, gardening, and more. 
              Quality service, right at your doorstep.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/search" 
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-indigo-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Search className="w-5 h-5 mr-2" />
                Find a Service
              </Link>
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center px-8 py-3 border border-indigo-300 text-base font-medium rounded-xl text-white bg-indigo-800/50 hover:bg-indigo-800/70 backdrop-blur-sm md:py-4 md:text-lg transition-all"
              >
                Join as Provider
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="fill-gray-50">
            <path fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Why Choose Us</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Quality Service, Guaranteed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-green-100 p-4 rounded-full mb-6">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Providers</h3>
              <p className="text-gray-500">Every provider is vetted and background checked to ensure your safety and satisfaction.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-blue-100 p-4 rounded-full mb-6">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Booking</h3>
              <p className="text-gray-500">Find help quickly. Filter by location and availability to get the job done when you need it.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-amber-100 p-4 rounded-full mb-6">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quality Guaranteed</h3>
              <p className="text-gray-500">Read reviews from real users. Our rating system ensures top-tier service quality.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Teaser */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Popular Categories</h2>
              <p className="mt-2 text-gray-500">Browse services by category to find exactly what you need.</p>
            </div>
            <Link to="/search" className="hidden sm:flex items-center font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link to={`/search?category=${cat.name}`} key={cat.name} className="group relative rounded-xl overflow-hidden aspect-square shadow-md hover:shadow-xl transition-all">
                <img 
                  src={cat.image} 
                  alt={`${cat.name} services`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                  <h3 className="text-white font-bold text-xl">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link to="/search" className="text-indigo-600 font-medium">View all categories &rarr;</Link>
          </div>
        </div>
      </section>
    </div>
  );
};
