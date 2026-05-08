import React, { useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import {
  Loader2,
  User,
  Lock,
  ChevronLeft,
  School,
  GraduationCap,
  Users,
  Eye,
  EyeOff,
  Sparkles
} from "lucide-react";

const InputField = ({ icon: Icon, type, placeholder, value, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative mb-4">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-brand-textSecondary" />
      </div>

      <input
        type={isPassword ? (showPassword ? "text" : "password") : type}
        className="w-full pl-12 pr-12 py-4 bg-brand-bg/50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-brand-textSecondary/60"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-brand-textSecondary hover:text-primary transition-colors focus:outline-none"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
};

const RoleCard = ({ role, icon: Icon, title, description, onClick }) => (
  <button
    onClick={() => onClick(role)}
    className="w-full flex items-center p-5 mb-4 bg-white border border-gray-100 rounded-3xl hover:shadow-premium hover:border-primary/30 transition-all group text-left group active:scale-[0.98]"
  >
    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
      <Icon className="h-7 w-7" />
    </div>
    <div className="ml-5">
      <h3 className="text-brand-text font-bold text-lg">{title}</h3>
      <p className="text-sm text-brand-textSecondary leading-relaxed">{description}</p>
    </div>
  </button>
);

const Login = ({ onLogin }) => {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await http.post("/auth/login", { email, password, role });
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-brand-bg font-inter">
      {/* LEFT SIDE - BRANDING (Refreshed) */}
      <div className="hidden lg:flex lg:w-3/5 bg-white flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-2xl font-bold text-primary">
            <div className="p-2 bg-primary/10 rounded-xl">
              <School className="w-8 h-8" />
            </div>
            <span className="font-poppins tracking-tight">SmartKindy</span>
          </div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent-dark rounded-full text-sm font-bold mb-8">
            <Sparkles className="w-4 h-4" />
            Modern Kindergarten Management
          </div>
          <h1 className="text-7xl font-bold text-brand-text mb-8 leading-[1.1] font-poppins tracking-tight">
            Nurturing <br />
            <span className="text-primary italic">Tomorrow's</span> <br />
            Leaders Today.
          </h1>
          <p className="text-brand-textSecondary text-xl max-w-lg leading-relaxed">
            The complete management & monitoring platform for teachers, parents, and administrators.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex -space-x-3">
             {[1,2,3,4].map(i => (
               <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" />
               </div>
             ))}
          </div>
          <p className="text-brand-textSecondary font-medium">
            Join <span className="text-primary font-bold">50+</span> schools managing better.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM (Refreshed) */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-premium animate-in fade-in zoom-in duration-700">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-brand-text font-poppins tracking-tight">
              {!role ? "Welcome" : `${role.charAt(0).toUpperCase() + role.slice(1)} Login`}
            </h2>
            <p className="text-brand-textSecondary mt-3 text-lg">
              {!role ? "Who are you logging in as?" : "Access your secure portal below"}
            </p>
          </div>

          {!role ? (
            <div className="space-y-2">
              <RoleCard
                role="admin"
                icon={School}
                title="Administrator"
                description="Manage staff, students & operations"
                onClick={setRole}
              />
              <RoleCard
                role="teacher"
                icon={GraduationCap}
                title="Teacher"
                description="Classroom activities & student progress"
                onClick={setRole}
              />
              <RoleCard
                role="parent"
                icon={Users}
                title="Parent"
                description="Track your child's journey & updates"
                onClick={setRole}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="animate-in slide-in-from-right-8 duration-300">
              {error && (
                <div className="mb-6 p-4 bg-status-error/10 border-l-4 border-status-error text-status-error text-sm rounded-r-xl font-medium">
                  {error}
                </div>
              )}

              <InputField
                icon={User}
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <InputField
                icon={Lock}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="flex justify-end mb-8">
                <Link to="/forgot-password" size="sm" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-[1.25rem] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-poppins"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In to Portal"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole(null);
                  setError("");
                  setEmail("");
                  setPassword("");
                }}
                className="w-full mt-6 text-brand-textSecondary hover:text-brand-text text-sm font-bold flex items-center justify-center gap-2 transition-colors uppercase tracking-widest"
              >
                <ChevronLeft className="w-5 h-5" />
                Change Portal Type
              </button>
            </form>
          )}

          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-brand-textSecondary font-medium">
              New parent?{" "}
              <Link to="/enroll" className="text-secondary-dark font-bold hover:underline">
                Register your child here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;