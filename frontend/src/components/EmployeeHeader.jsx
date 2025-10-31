import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock } from 'lucide-react'; 
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../context/AuthContext'; 

// --- Helper Functions for Live Clock ---

/**
 * Formats the current date.
 * @param {Date} date - The date object.
 * @returns {string} Formatted date string (e.g., "Fri, Oct 31, 2025").
 */
const getFormattedDate = (date) => {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${weekday}, ${month} ${day}, ${year}`;
};

/**
 * Formats the current time.
 * @param {Date} date - The date object.
 * @returns {string} Formatted time string (e.g., "07:18:30 PM").
 */
const getFormattedTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

// --- Main Component ---

export default function EmployeeHeader({
    onBack, // Back button handler (Required prop)
}) {
    const { user } = useAuth(); 

    // Live Clock State and Effect
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);
        return () => clearInterval(timerId);
    }, []);

    const liveDate = getFormattedDate(currentDateTime);
    const liveTime = getFormattedTime(currentDateTime);

    // Define color constants
    const BG_COLOR = 'bg-[#352721]'; 
    const TEXT_COLOR = 'text-gray-200';
    const ACCENT_COLOR_TEXT = 'text-[#FFA237]'; // Gold (for icons and text accents)
    const ACCENT_COLOR_HOVER_BG = 'hover:bg-[#47362E]'; 
    const PROFILE_ICON_HEX = '#FFA237'; // The exact hex code for the profile icon

    return (
        <header className={`flex flex-col items-center px-6 py-4 shadow-lg ${BG_COLOR} ${TEXT_COLOR} sticky top-0 z-50 border-b border-gray-700`}>

            {/* TOP ROW: Back Button, Logo, Live Clock, and Profile Dropdown */}
            <div className="flex justify-between items-center w-full max-w-7xl">
                 
                {/* 1. LEFT SECTION: Back Button */}
                <div className="flex items-center min-w-[120px] justify-start -mt-1">
                    <button
                        onClick={onBack}
                        className={`flex items-center space-x-1 p-2 rounded-lg ${ACCENT_COLOR_TEXT} ${ACCENT_COLOR_HOVER_BG} transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFA237]`}
                    >
                        <ArrowLeft size={24} className={ACCENT_COLOR_TEXT} />
                        {/* 🌟 CHANGE 1: Pinalitan ang "Bumalik" ng "Back" at tinanggal ang "hidden xs:inline" para laging kita. 
                            Ginamit ang "inline-block" para mas maging visible. */}
                        <span className="font-medium text-base inline-block">Back</span>
                    </button>
                </div>

                {/* 2. CENTER SECTION: Logo (Main focus) */}
                <div className="flex flex-col items-center flex-grow -mt-3">
                    <Link to="/kitchen"> 
                        <img 
                            src="/images/logo_var.svg" 
                            alt="Logo" 
                            className="h-20 w-auto transition-transform hover:scale-[1.02]" 
                        /> 
                    </Link>
                </div>

                {/* 3. RIGHT SECTION: Live Clock and Profile Dropdown */}
                <div className="flex items-center space-x-4 justify-end min-w-[120px]">
                    
                    {/* Live Date and Time */}
                    <div className="hidden md:flex flex-col items-end text-right text-sm font-sans text-gray-200">
                        {/* Date (Above) */}
                        <div className="flex items-center space-x-1 ">
                            <Calendar size={16} className={ACCENT_COLOR_TEXT} />
                            <span className="font-semibold">{liveDate}</span>
                        </div>

                        {/* Time (Below) */}
                        <div className="flex items-center space-x-1">
                            <Clock size={16} className={ACCENT_COLOR_TEXT} />
                            <span className="font-semibold">{liveTime}</span>
                        </div>
                    </div>

                    {/* Profile Dropdown 
                        🌟 CHANGE 2: Tiyakin na ipinapasa ang PROFILE_ICON_HEX. 
                        Tandaan: Kung wala pa ring kulay, kailangan mong tingnan ang code ng ProfileDropdown component mismo. 
                    */}
                    <ProfileDropdown iconColor={PROFILE_ICON_HEX} />
                </div>
            </div>
            
        </header>
    );
}