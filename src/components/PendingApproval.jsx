import React from 'react';
import { useAuth } from '../context/AuthContext';

function PendingApproval() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Pending Approval</h1>
        
        <div className="mb-6 text-gray-600">
          <p className="mb-4">
            Welcome, <span className="font-semibold text-gray-800">{user?.email}</span>!
          </p>
          <p className="mb-4">
            Your account is pending approval from an administrator.
          </p>
          <p className="text-sm">
            You will receive access once your account has been approved. 
            Please check back later or contact an administrator.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This app requires admin approval for new users to ensure secure access to the sprint calendar and team data.
          </p>
        </div>

        <button
          onClick={signOut}
          className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default PendingApproval;
