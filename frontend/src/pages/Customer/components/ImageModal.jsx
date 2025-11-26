import React from 'react';
import { X } from 'lucide-react';

const ImageModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-center items-center bg-black/90 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      <style>
        {`
          @keyframes zoomIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>

      {/* THEMED FRAME: Changed bg-white to bg-[#0B3D2E] */}
      <div 
        className="relative bg-[#0B3D2E] p-2 rounded-lg shadow-2xl max-w-5xl max-h-[90vh] flex justify-center items-center border border-[#0f503c]"
        onClick={(e) => e.stopPropagation()} 
        style={{ animation: 'zoomIn 0.3s ease-out' }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute -top-4 -right-4 bg-white text-[#0B3D2E] rounded-full p-2 shadow-lg hover:bg-gray-100 hover:scale-110 transition-transform z-10"
          title="Close"
        >
          <X size={24} />
        </button>

        {/* Image Container */}
        <div className="overflow-hidden rounded flex justify-center items-center bg-black w-full h-full">
            <img 
              src={imageUrl} 
              alt="Enlarged view" 
              className="object-contain max-w-full max-h-[85vh] w-auto h-auto block" 
            />
        </div>
      </div>
    </div>
  );
};

export default ImageModal;