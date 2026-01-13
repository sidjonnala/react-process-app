import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center px-8 py-16 bg-white rounded-xl shadow-lg mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Patagonia R&D Hub
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Manage and visualize your team's sprint ceremonies
        </p>
        <Link 
          to="/weeklyschedule" 
          className="inline-block px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
        >
          View Weekly Schedule
        </Link>
      </div>
      
      <div className="mt-12">
        <h2 className="text-center text-3xl font-bold text-gray-800 mb-8">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Weekly Schedule</h3>
            <p className="text-gray-600 leading-relaxed">View all sprint ceremonies in a clear calendar format</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Multiple Teams</h3>
            <p className="text-gray-600 leading-relaxed">Track ceremonies across multiple agile teams</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
            <div className="text-5xl mb-4">⏰</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Time Management</h3>
            <p className="text-gray-600 leading-relaxed">See all meeting times at a glance</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
            <div className="text-5xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Color Coded</h3>
            <p className="text-gray-600 leading-relaxed">Easily distinguish between team events</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
