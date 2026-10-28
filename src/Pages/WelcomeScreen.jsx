import { useState, useEffect, useRef } from 'react';
import { Code2, Github, Globe, User } from 'lucide-react';

const TypewriterEffect = ({ text }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 130);
    
    return () => clearInterval(timer);
  }, [text]);

  return (
    <span className="inline-block">
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

const IconButton = ({ Icon }) => (
  <div className="p-2 sm:p-3 bg-soft border border-edge rounded-full transition-all duration-300 hover:border-edge-strong hover:bg-soft-strong">
    <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary" />
  </div>
);

const WelcomeScreen = ({ onLoadingComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const doneRef = useRef(null);

  useEffect(() => {
    // Long enough for every step to finish: last AOS item at 1.2 s (+0.4 s run)
    // and the typewriter at 11 x 130 ms = 1.4 s. Then a beat, then the 800 ms
    // exit. Cutting this shorter truncates the animation mid-word.
    const timer = setTimeout(() => {
      setIsLoading(false);
      doneRef.current = setTimeout(() => {
        onLoadingComplete?.();
      }, 800);
    }, 2200);
    
    return () => {
      clearTimeout(timer);
      if (doneRef.current) clearTimeout(doneRef.current);
    };
  }, [onLoadingComplete]);

  // The exit (fade + scale + blur, children drifting up) is a CSS keyframe:
  // framer-motion used to cost 40 KB gzipped and ~125 ms of boot CPU for it.
  return (
    <div
      // z-100 clears the z-50 navbar. No fade-in: the page underneath must never
      // show through, only the exit animates.
      className={`fixed inset-0 z-[100] bg-bg${isLoading ? '' : ' splash-out'}`}
      inert=""
      aria-hidden="true"
    >
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* Icons */}
          <div className="splash-child flex justify-center gap-3 sm:gap-4 md:gap-8 mb-6 sm:mb-8 md:mb-12">
            {[Code2, User, Github].map((Icon, index) => (
              <div key={index} data-aos="fade-down" data-aos-delay={index * 200}>
                <IconButton Icon={Icon} />
              </div>
            ))}
          </div>

          {/* Welcome Text */}
          <div className="splash-child text-center mb-6 sm:mb-8 md:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-primary space-y-2 sm:space-y-4">
              <div className="mb-2 sm:mb-4">
                <span data-aos="fade-right" data-aos-delay="200" className="inline-block px-2 text-primary">
                  Welcome
                </span>{' '}
                <span data-aos="fade-right" data-aos-delay="400" className="inline-block px-2 text-primary">
                  To
                </span>{' '}
                <span data-aos="fade-right" data-aos-delay="600" className="inline-block px-2 text-primary">
                  My
                </span>
              </div>
              <div>
                <span data-aos="fade-up" data-aos-delay="800" className="inline-block px-2 text-primary">
                  Portfolio
                </span>{' '}
                <span data-aos="fade-up" data-aos-delay="1000" className="inline-block px-2 text-primary">
                  Website
                </span>
              </div>
            </h1>
          </div>

          {/* Website Link */}
          <div
            className="splash-child text-center"
            data-aos="fade-up"
            data-aos-delay="1200"
          >
            <a
              href="https://nikodwicahyo.vercel.app"
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full border border-edge bg-soft transition-all duration-300 hover:border-edge-strong"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
              <span className="text-primary text-lg sm:text-xl md:text-2xl">
                <TypewriterEffect text="nikodwchy" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
