import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ChefHat, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../Customer/CustomerTheme.css'; 

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoPlaylist = [
    '/videos/video1.mp4',
    '/videos/video2.mp4',
    '/videos/video3.mp4',
    '/videos/video5.mp4',
    '/videos/video6.mp4',
    '/videos/video7.mp4',
    '/videos/video8.mp4',
  ];

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const handleVideoEnded = () => {
    setCurrentVideoIndex((prevIndex) => {
      // If we are at the last video, go back to 0. Otherwise, go to next.
      return (prevIndex + 1) % videoPlaylist.length;
    });
  };

  const { login } = useAuth();
  const navigate = useNavigate();

  // 🔗 CONFIG: Your External Register URL
  const EXTERNAL_REGISTER_URL = "https://thecelestiahotel.vercel.app/register"; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    if (!success) setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex w-full bg-[#FDF8F5]">
      
      {/* 1. LEFT SIDE: The "Kitchen Theater" (Video) */}
      <div className="hidden md:flex w-1/2 lg:w-7/12 relative overflow-hidden bg-black">
         
         {/* ✅ VIDEO BACKGROUND */}
              <div className="absolute inset-0 w-full h-full bg-black"> {/* Added bg-black to hide flashes */}
        <video 
            // Key is important! It forces React to reload the player when src changes
            key={currentVideoIndex}
            autoPlay 
            muted 
            playsInline
            onEnded={handleVideoEnded} 
            className="w-full h-full object-cover opacity-90 transition-opacity duration-500"
        >
            {/* Use the current video from the playlist */}
            <source src={videoPlaylist[currentVideoIndex]} type="video/mp4" />
        </video>
      </div>
         
         {/* Gradient Overlay for Text Readability */}
         <div className="absolute inset-0 bg-gradient-to-t from-[#0B3D2E] via-[#0B3D2E]/50 to-transparent"></div>

         {/* Branding Text */}
         <div className="relative z-10 w-full h-full flex flex-col justify-end items-center p-12 lg:p-20 text-white text-center">
             <div className="mb-6">
          <img 
              src="/images/logo_var.svg" 
              alt="Celestia Dining" 
              className="h-32 w-auto object-contain drop-shadow-lg" 
          />
      </div>
             <p className="text-xl text-[#F9A825] font-light max-w-lg leading-relaxed">
                 Discover the culinary arts. Order from our top-notch kitchen and have it served right to your table or room.
             </p>
         </div>
      </div>

      {/* 2. RIGHT SIDE: The Login Form */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 relative bg-[#FDF8F5]">
        
        {/* Mobile Header */}
        <div className="md:hidden mb-8 flex items-center gap-2">
             <div className="p-2 bg-[#0B3D2E] rounded-lg">
                <ChefHat size={20} className="text-white"/>
             </div>
             <span className="font-bold text-[#0B3D2E] text-xl">Celestia Dining</span>
        </div>

        {/* Skip Button */}
        <button 
            onClick={() => navigate('/')} 
            className="absolute top-8 right-8 text-[#0B3D2E]/60 hover:text-[#0B3D2E] text-sm font-bold flex items-center gap-2 transition-colors"
        >
            Explore Dining <ArrowRight size={16}/>
        </button>

        <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-extrabold text-[#0B3D2E] mb-2">Welcome Back</h2>
            <p className="text-gray-500 mb-10">Please enter your details to sign in.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                    <label className="text-xs font-bold text-[#0B3D2E] uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                        <input
                            type="email"
                            required
                            placeholder="guest@gmail.com"
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#F9A825] focus:ring-1 focus:ring-[#F9A825] transition-all text-[#0B3D2E] placeholder-gray-300"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-[#0B3D2E] uppercase tracking-wider">Password</label>
                        <a href="https://thecelestiahotel.vercel.app/forgot-password" className="text-xs font-bold text-[#F9A825] hover:underline">Forgot Password?</a>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="••••••••"
                            className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#F9A825] focus:ring-1 focus:ring-[#F9A825] transition-all text-[#0B3D2E] placeholder-gray-300"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-3.5 text-gray-400 hover:text-[#0B3D2E] transition-colors"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#0B3D2E] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#082a20] hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                >
                    {isLoading ? 'Authenticating...' : 'Sign In'}
                </button>
            </form>

            {/* ✅ EXTERNAL REGISTRATION LINK */}
            <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 mb-4">New to Celestia Hotel?</p>
                <a 
                    href={EXTERNAL_REGISTER_URL} 
                    className="inline-block w-full py-3 rounded-xl border-2 border-[#0B3D2E]/10 text-[#0B3D2E] font-bold hover:bg-[#0B3D2E] hover:text-white transition-all text-center"
                >
                    Create Guest Account
                </a>
            </div>
        </div>

        <div className="mt-12 text-center">
             <p className="text-[10px] text-gray-300 uppercase tracking-widest">Powered by Celestia Food and Beverage System</p>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;