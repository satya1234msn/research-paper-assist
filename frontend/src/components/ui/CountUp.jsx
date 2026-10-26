import React, { useEffect, useState } from 'react';

export const CountUp = ({ to = 0, from = 0, duration = 1.2, className = '' }) => {
  const [count, setCount] = useState(from);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Ease-out expo
      const current = Math.floor(from + (to - from) * (1 - Math.pow(2, -10 * progress)));
      setCount(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      } else {
        setCount(to);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [to, from, duration]);

  return <span className={className}>{count}</span>;
};

export default CountUp;
