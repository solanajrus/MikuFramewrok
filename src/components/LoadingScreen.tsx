import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const bootMessages = [
    'Welcome to your AI companion terminal ♡'
  ];

  useEffect(() => {
    if (currentMessageIndex < bootMessages.length) {
      const message = bootMessages[currentMessageIndex];
      
      // Much faster delays
      let delay = 30; // Very fast default
      
      if (message === '') {
        delay = 50; // Short pause for empty lines
      } else if (message.startsWith('echo "===') || message.includes('WARNING')) {
        delay = 100; // Brief pause for important messages
      } else if (message.includes('✓')) {
        delay = 80; // Quick pause for status messages
      } else if (message.startsWith('#')) {
        delay = 60; // Quick pause for comments
      }

      const timer = setTimeout(() => {
        setMessages(prev => [...prev, bootMessages[currentMessageIndex]]);
        setCurrentMessageIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      // Quick completion
      const timer = setTimeout(() => {
        setIsComplete(true);
        // Auto-redirect quickly
        const redirectTimer = setTimeout(() => {
          onComplete();
        }, 800); // Just 0.8 seconds after completion

        return () => clearTimeout(redirectTimer);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex, bootMessages, isComplete, onComplete]);

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col relative overflow-hidden">
      {/* Terminal header */}
      <div className="border-b border-white/30 p-4 bg-black">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
          <span className="text-white text-sm">AI_COMPANION://initializing.sh</span>
          <span className="text-white text-xs ml-auto">STATUS: LOADING</span>
        </div>
      </div>

      {/* Terminal content - moved further left */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-4xl">
          {messages.map((message, index) => (
            <div key={index} className="mb-1 flex items-start">
              {message === '' ? (
                <div className="h-4"></div>
              ) : (
                <>
                  <span className="text-white text-xs mr-3 select-none w-4 text-right">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <span className="text-white">{message}</span>
                    {index === messages.length - 1 && !isComplete && (
                      <span className="inline-block w-2 h-5 bg-white ml-1 animate-pulse"></span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          
          {isComplete && (
            <div className="mt-6 space-y-2 border-t border-white/30 pt-4">
              <div className="text-white text-lg font-bold animate-pulse">
                ✓ COMPANION READY
              </div>
              <div className="flex items-center">
                <span className="text-white">companion@ready:~# </span>
                <span className="inline-block w-2 h-5 bg-white ml-1 animate-pulse"></span>
              </div>
              <div className="text-white text-sm animate-pulse">
                Starting companion chat interface...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="border-t border-white/30 p-2 bg-black text-xs">
        <div className="flex justify-between items-center">
          <span className="text-white">COMPANION INITIALIZATION</span>
          <span className="text-white">
            {messages.length}/{bootMessages.length} | 
            {isComplete ? 'COMPLETE' : 'RUNNING'}
          </span>
          <span className="text-white animate-pulse">● INIT</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;