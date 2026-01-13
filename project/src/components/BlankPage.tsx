import React, { useState, useEffect } from 'react';

interface BlankPageProps {
  onComplete: () => void;
}

const BlankPage: React.FC<BlankPageProps> = ({ onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const targetText = "generating companion";

  useEffect(() => {
    // Start typing after a brief delay
    const startDelay = setTimeout(() => {
      setIsTyping(true);
      typeText();
    }, 1000);

    return () => clearTimeout(startDelay);
  }, []);

  const typeText = () => {
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex <= targetText.length) {
        setDisplayText(targetText.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        
        // Wait 1 second after typing is complete, then start deleting
        setTimeout(() => {
          setIsDeleting(true);
          deleteText();
        }, 1000);
      }
    }, 100); // 100ms per character for typing
  };

  const deleteText = () => {
    let currentLength = targetText.length;

    const deleteInterval = setInterval(() => {
      if (currentLength >= 0) {
        setDisplayText(targetText.substring(0, currentLength));
        currentLength--;
      } else {
        clearInterval(deleteInterval);
        setIsDeleting(false);
        setShowCursor(false);
        
        // Redirect to terminal after deletion is complete
        setTimeout(() => {
          onComplete();
        }, 500); // Brief pause before redirecting
      }
    }, 80); // 80ms per character for deleting (slightly faster than typing)
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono relative overflow-hidden flex items-center justify-center">
      <div className="text-center">
        <span className="text-2xl">
          {displayText}
          {(isTyping || isDeleting || showCursor) && (
            <span className="inline-block w-3 h-6 bg-white ml-1 animate-pulse"></span>
          )}
        </span>
      </div>
    </div>
  );
};

export default BlankPage;