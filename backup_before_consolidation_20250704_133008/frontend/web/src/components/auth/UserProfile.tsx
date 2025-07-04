import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@renexus/ui-components';

export default function UserProfile() {
  const { user, updateUser, changePassword, error, clearError } = useAuth();
  
  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  
  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateSuccess(false);
    clearError();
    
    try {
      await updateUser({ name });
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      // Error is handled by the useAuth hook
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Validate password
  const validatePassword = () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    
    // Check for complexity
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    if (!(hasUppercase && hasLowercase && hasNumber && hasSpecial)) {
      setPasswordError('Password must include uppercase, lowercase, number, and special character');
      return false;
    }
    
    setPasswordError('');
    return true;
  };
  
  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordChangeSuccess(false);
    clearError();
    
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordChangeSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordChangeSuccess(false), 3000);
    } catch (err) {
      // Error is handled by the useAuth hook
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {updateSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              Profile updated successfully!
            </div>
          )}
          
          <form onSubmit={handleProfileUpdate}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email address cannot be changed.
                </p>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  id="role"
                  type="text"
                  value={user.role}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              
              <div>
                <Button
                  type="submit"
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="password" className="mt-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {passwordChangeSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              Password changed successfully!
            </div>
          )}
          
          <form onSubmit={handlePasswordChange}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character.
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {passwordError && (
                  <p className="mt-1 text-xs text-red-600">{passwordError}</p>
                )}
              </div>
              
              <div>
                <Button
                  type="submit"
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
