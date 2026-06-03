import React, { useState, useEffect } from "react";
import { Loader2, Lock, User, Mail, Phone, Shield, MapPin } from "lucide-react";
import { updatePassword } from "../../api/auth"; // Ensure this import exists (see step 2)
import { getStudents, updateParentAddress } from "../../api/students";

export default function Settings({ user }) {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(false);

  useEffect(() => {
    if (user.role === "parent") {
      const fetchParentAddress = async () => {
        try {
          setFetchingAddress(true);
          const children = await getStudents();
          if (children && children.length > 0) {
            setAddress(children[0].homeAddress || "");
          }
        } catch (err) {
          console.error("Failed to fetch child address:", err);
        } finally {
          setFetchingAddress(false);
        }
      };
      fetchParentAddress();
    }
  }, [user]);

  const handleAddressUpdate = async () => {
    try {
      setAddressLoading(true);
      await updateParentAddress(address);
      alert("Home address updated successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update home address.");
    } finally {
      setAddressLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordUpdate = async () => {
    // Basic Validation
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      alert("Please fill in all password fields.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    if (passwords.newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      // Call Backend API
      await updatePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      
      alert("Password updated successfully!");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-gray-500">View your profile information and manage security.</p>
      </div>

      {/* 1. READ-ONLY PROFILE INFO */}
      <div className="bg-white p-6 rounded-xl shadow border-2 border-gray-300">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-accent" /> Profile Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
            <div className="p-3 bg-white border rounded-lg text-gray-700 font-medium">
              {user.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
            <div className="p-3 bg-white border rounded-lg text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              {user.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
            <div className="p-3 bg-white border rounded-lg text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              {user.phone || "Not provided"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
            <div className="p-3 bg-white border rounded-lg text-gray-700 flex items-center gap-2 capitalize">
              <Shield className="w-4 h-4 text-gray-400" />
              {user.role}
            </div>
          </div>
        </div>
      </div>

      {/* 1.5. HOME ADDRESS INFO (ONLY FOR PARENTS, EDITABLE) */}
      {user.role === "parent" && (
        <div className="bg-white p-6 rounded-xl shadow border-2 border-gray-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/5 to-primary/5 rounded-bl-full pointer-events-none" />
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2 relative z-10">
            <MapPin className="w-5 h-5 text-accent" /> Home Address Information
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            View and update your children's registered residential address.
          </p>

          {fetchingAddress ? (
            <div className="flex items-center gap-2 text-gray-500 py-4">
              <Loader2 className="w-5 h-5 animate-spin animate-infinite" />
              <span>Retrieving address details...</span>
            </div>
          ) : (
            <div className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Residential Address</label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your complete home address (e.g., house number, street, city, state, postal code)"
                    className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm resize-none shadow-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAddressUpdate}
                  disabled={addressLoading}
                  className="px-6 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium flex items-center gap-2 shadow-md hover:shadow-accent/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {addressLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Home Address
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. CHANGE PASSWORD (FUNCTIONAL) */}
      <div className="bg-white p-6 rounded-xl shadow border-2 border-gray-300">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-purple-600" /> Security
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder=""
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder=""
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder=""
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handlePasswordUpdate}
            disabled={loading}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}