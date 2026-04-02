import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

const UserNotRegisteredError = () => {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    stage_name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartRegistration = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.email) setFormData(prev => ({ ...prev, email: user.email }));
    } catch {}
    setIsCreatingAccount(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await base44.auth.me();
      if (!user || !user.email) {
        throw new Error('Could not retrieve your email address');
      }

      await base44.auth.updateMe({
        full_name: `${formData.first_name} ${formData.last_name}`,
        first_name: formData.first_name,
        last_name: formData.last_name,
        stage_name: formData.stage_name
      });

      // Reload the page to re-check authentication
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  if (!isCreatingAccount) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-orange-100">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Complete Your Registration</h1>
            <p className="text-slate-600 mb-8">
              You have been invited to use this application. Please complete your account setup to continue.
            </p>
            <Button 
              onClick={handleStartRegistration}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Account
            </Button>
            <div className="mt-6 p-4 bg-slate-50 rounded-md text-sm text-slate-600">
              <p>If you believe this is an error, you can:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Verify you are logged in with the correct account</li>
                <li>Contact the app administrator for access</li>
                <li>Try logging out and back in again</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50 p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Your Account</h1>
        <p className="text-sm text-slate-600 mb-6">Fill in your details to complete registration</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              readOnly
              className="mt-1 bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Your email is set from your invite and cannot be changed here.</p>
          </div>

          <div>
            <Label htmlFor="first_name" className="text-sm font-medium">First Name *</Label>
            <Input
              id="first_name"
              type="text"
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="mt-1"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="last_name" className="text-sm font-medium">Last Name *</Label>
            <Input
              id="last_name"
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="mt-1"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="stage_name" className="text-sm font-medium">Stage Name</Label>
            <Input
              id="stage_name"
              type="text"
              value={formData.stage_name}
              onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
              className="mt-1"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreatingAccount(false)}
              disabled={loading}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;