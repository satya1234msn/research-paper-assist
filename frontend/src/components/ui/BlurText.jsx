import React, { useState, useEffect } from 'react';

export const BlurText = ({ text = '', delay = 40, className = '' }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const words = text.split(' ');

  return (
    <span className={`inline-flex flex-wrap gap-x-1.5 ${className}`}>
      {words.map((word, idx) => (
        <span
          key={idx}
          className={`inline-block transition-all duration-700 ease-out`}
          style={{
            filter: visible ? 'blur(0px)' : 'blur(8px)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(8px)',
            transitionDelay: `${idx * delay}ms`,
          }}
        >
          {word}
        </span>
      ))}
    </span>
  );
};

export default BlurText;
