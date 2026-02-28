import React from 'react';

function HinglishTour({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-dark-card border border-white/10 p-8 rounded-3xl max-w-sm text-center space-y-4">
                <h2 className="text-xl font-bold text-white">AI Guide Tour - Alpha</h2>
                <p className="text-dark-text-secondary text-sm">Tour functionality is being initialized. Please check back in a moment.</p>
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-blue-accent text-white rounded-xl font-bold"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

export default HinglishTour;
