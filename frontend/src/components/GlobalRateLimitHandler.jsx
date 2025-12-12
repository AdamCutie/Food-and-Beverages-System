import React, { useState, useEffect } from 'react';
import RateLimitedUI from './RateLimitedUI'; 

const GlobalRateLimitHandler = ({ children }) => {
  const [isRateLimited, setIsRateLimited] = useState(false);

  useEffect(() => {
    const handleRateLimit = () => {
      setIsRateLimited(true);
      // Automatically unlock after 1 minute
      setTimeout(() => setIsRateLimited(false), 60000); 
    };

    window.addEventListener('rate-limit-reached', handleRateLimit);
    return () => window.removeEventListener('rate-limit-reached', handleRateLimit);
  }, []);

  if (isRateLimited) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-4">
         <div className="w-full max-w-2xl">
            {/* Just show the warning UI, no manual close button */}
            <RateLimitedUI />
         </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default GlobalRateLimitHandler;