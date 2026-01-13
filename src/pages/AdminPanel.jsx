import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      const usersCollection = collection(db, 'users');
      const snapshot = await getDocs(usersCollection);
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort: pending first, then by creation date
      usersList.sort((a, b) => {
        if (a.approved === b.approved) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return a.approved ? 1 : -1;
      });
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    setUpdating(userId);
    try {
      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, {
        approved: true,
        approvedAt: new Date().toISOString()
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, approved: true, approvedAt: new Date().toISOString() }
          : user
      ));
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user. Check console for details.');
    } finally {
      setUpdating(null);
    }
  };

  const revokeAccess = async (userId) => {
    setUpdating(userId);
    try {
      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, {
        approved: false,
        revokedAt: new Date().toISOString()
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, approved: false, revokedAt: new Date().toISOString() }
          : user
      ));
    } catch (error) {
      console.error('Error revoking access:', error);
      alert('Failed to revoke access. Check console for details.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h2>
        <p className="text-gray-600">Manage user access to the application</p>
      </div>

      {/* Pending Users Section */}
      {pendingUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⏳</span>
            <h3 className="text-2xl font-bold text-gray-800">
              Pending Approval ({pendingUsers.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {pendingUsers.map(user => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-4 border-2 border-amber-200 bg-amber-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{user.displayName}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Signed up: {new Date(user.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => approveUser(user.id)}
                  disabled={updating === user.id}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold px-6 py-2 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating === user.id ? 'Approving...' : 'Approve'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Users Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">✅</span>
          <h3 className="text-2xl font-bold text-gray-800">
            Approved Users ({approvedUsers.length})
          </h3>
        </div>
        
        {approvedUsers.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No approved users yet
          </div>
        ) : (
          <div className="space-y-3">
            {approvedUsers.map(user => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-4 border-2 border-green-200 bg-green-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{user.displayName}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Approved: {new Date(user.approvedAt || user.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Revoke access for ${user.email}?`)) {
                      revokeAccess(user.id);
                    }
                  }}
                  disabled={updating === user.id}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold px-6 py-2 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating === user.id ? 'Revoking...' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
