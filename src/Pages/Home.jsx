import React, { useState, useEffect, useCallback, memo } from "react"
import { Helmet } from "react-helmet-async"
import { Github, Linkedin, Mail, ExternalLink, Instagram } from "lucide-react"
import LazyImage from "../components/LazyImage"

const StatusBadge = memo(() => (
  <div className="inline-block lg:mx-0" data-aos="zoom-in" data-aos-delay="400">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-edge-strong bg-soft">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      <span className="text-primary sm:text-sm text-[0.7rem] font-medium">
        Ready to Innovate
      </span>
    </div>
  </div>
));

const MainTitle = memo(() => (
  <div className="space-y-2" data-aos="fade-up" data-aos-delay="600">
    <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-4xl xl:text-6xl font-bold tracking-tight text-primary">
      <span className="block">Full Stack Dev</span>
      <span className="block mt-2 text-primary">AI Engineer</span>
    </h1>
  </div>
));

const TechStack = memo(({ tech }) => (
  <div className="px-4 py-2 rounded-full bg-soft border border-edge text-xs text-secondary hover:text-primary hover:border-edge-strong transition-colors">
    {tech}
  </div>
));

const CTAButton = memo(({ href, text, icon: Icon, primary = false }) => (
  <a href={href}>
    <button className={`relative w-[160px] h-11 rounded-lg text-sm font-medium transition-all duration-300 active:scale-[0.98] ${
      primary
        ? "bg-invert text-invert-text hover:bg-invert-hover"
        : "bg-transparent border border-edge-strong text-primary hover:bg-soft-strong"
    }`}>
      <span className="absolute inset-0 flex items-center justify-center gap-2">
        {text}
        <Icon className={`w-4 h-4 ${primary ? "text-invert-text" : "text-primary"} ${text === 'Contact' ? 'group-hover:translate-x-1' : ''} transform transition-all duration-300`} />
      </span>
    </button>
  </a>
));

const SocialLink = memo(({ icon: Icon, link, label }) => (
  <a
    href={link}
    {...(link.startsWith("mailto") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
    aria-label={label}
  >
    <button className="p-2 rounded-lg bg-soft border border-edge flex items-center justify-center text-secondary hover:text-primary hover:border-edge-strong hover:bg-soft-strong transition-all duration-300" aria-label={label}>
      <Icon className="w-5 h-5" />
    </button>
  </a>
));

const TYPING_SPEED = 100;
const ERASING_SPEED = 50;
const PAUSE_DURATION = 2000;
const WORDS = ["System Engineer", "IT Infrastructure", "Software Engineer", "Tech Enthusiast"];
const TECH_STACK = ["Python", "PHP", "Go", "Javascript", "SQL", "AI", "Machine Learning", "Deep Learning", "Internet of Things"];
const SOCIAL_LINKS = [
  { icon: Github, link: "https://github.com/nikodwicahyo/", label: "GitHub Profile" },
  { icon: Linkedin, link: "https://www.linkedin.com/in/nikodwicahyo/", label: "LinkedIn Profile" },
  { icon: Instagram, link: "https://www.instagram.com/nikodwchy/", label: "Instagram Profile" },
  { icon: Mail, link: "mailto:nikodwchy@gmail.com", label: "Email" }
];

const Home = () => {
  const [text, setText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const [wordIndex, setWordIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    setIsLoaded(true);
    return () => setIsLoaded(false);
  }, []);

  const handleTyping = useCallback(() => {
    if (isTyping) {
      if (charIndex < WORDS[wordIndex].length) {
        setText(prev => prev + WORDS[wordIndex][charIndex]);
        setCharIndex(prev => prev + 1);
      } else {
        setTimeout(() => setIsTyping(false), PAUSE_DURATION);
      }
    } else {
      if (charIndex > 0) {
        setText(prev => prev.slice(0, -1));
        setCharIndex(prev => prev - 1);
      } else {
        setWordIndex(prev => (prev + 1) % WORDS.length);
        setIsTyping(true);
      }
    }
  }, [charIndex, isTyping, wordIndex]);

  useEffect(() => {
    const timeout = setTimeout(
      handleTyping,
      isTyping ? TYPING_SPEED : ERASING_SPEED
    );
    return () => clearTimeout(timeout);
  }, [handleTyping]);

  return (
    <>
      <Helmet>
        <title>Niko Dwicahyo Widiyanto - Full Stack Web Developer - AI Engineer</title>
        <meta name="description" content="Website resmi Niko Dwicahyo Widiyanto, Full Stack Web Developer, AI Engineer. Saya berfokus pada penciptaan pengalaman digital yang menarik dan selalu berupaya memberikan solusi terbaik dalam setiap proyek yang saya kerjakan." />
     <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://ekizr.com" />
        <meta property="og:title" content="Niko Dwicahyo Widiyanto - Full Stack Web Developer - AI Engineer" />
     <meta property="og:description" content="Website resmi dan portofolio Niko Dwicahyo Widiyanto, Full-Stack Web Developer." />
        <meta property="og:url" content="https://ekizr.com" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Niko Dwicahyo Widiyanto",
            "jobTitle": "Full Stack Web Developer, AI Engineer",
            "url": "https://ekizr.com",
            "sameAs": [
              "https://github.com/nikodwicahyo/",
              "https://www.linkedin.com/in/nikodwicahyo/",
              "https://www.instagram.com/nikodwchy/"
            ]
          }
        `}</script>
      </Helmet>

      <div className="min-h-screen bg-bg overflow-hidden px-[5%] sm:px-[5%] lg:px-[10%] scroll-mt-16" id="Home">
        <div className={`relative z-10 transition-all duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
            <div className="container mx-auto min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col lg:flex-row items-center justify-start lg:justify-between min-h-[calc(100vh-4rem)] gap-0 sm:gap-12 lg:gap-20 pt-2 sm:pt-3">
              {/* Left Column */}
              <div className="w-full lg:w-1/2 space-y-6 sm:space-y-8 text-left lg:text-left order-1 lg:order-1 lg:mt-0"
                data-aos="fade-right"
                data-aos-delay="200">
                <div className="space-y-4 sm:space-y-6">
                  <StatusBadge />
                  <MainTitle />

                  {/* Typing Effect */}
                  <div className="h-8 flex items-center" data-aos="fade-up" data-aos-delay="800">
                    <span className="text-xl md:text-2xl text-primary font-light">
                      {text}
                    </span>
                    <span className="w-[3px] h-6 bg-primary ml-1 animate-blink"></span>
                  </div>

                  {/* Description */}
                  <p className="text-sm sm:text-base lg:text-lg text-secondary max-w-xl leading-relaxed font-light"
                    data-aos="fade-up"
                    data-aos-delay="1000">
                    Architecting ecosystems with artificial intelligent to transform complex ideas into seamless digital solutions.
                  </p>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-3 justify-start" data-aos="fade-up" data-aos-delay="1200">
                    {TECH_STACK.map((tech, index) => (
                      <TechStack key={index} tech={tech} />
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-row gap-3 w-full justify-start" data-aos="fade-up" data-aos-delay="1400">
                    <CTAButton href="#Portofolio" text="Projects" icon={ExternalLink} primary />
                    <CTAButton href="#Contact" text="Contact" icon={Mail} />
                  </div>

                  {/* Social Links */}
                  <div className="hidden sm:flex gap-4 justify-start" data-aos="fade-up" data-aos-delay="1600">
                    {SOCIAL_LINKS.map((social, index) => (
                      <SocialLink key={index} {...social} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - WebM Video */}
              <div className="w-full py-0 md:py-[10%] sm:py-0 lg:w-1/2 h-[260px] sm:h-[400px] lg:h-[600px] xl:h-[750px] relative flex items-center justify-center order-2 lg:order-2  mt-5 sm:mt-0"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                data-aos="fade-left"
                data-aos-delay="600">
                <div className="relative w-full opacity-90">
                  <div className="relative lg:left-12 z-10 w-full opacity-90 transform transition-transform duration-500" data-aos="fade-left">
                    <LazyImage
                      src="Animation1.gif"
                      alt="Developer Animation"
                      className={`w-full h-full object-contain transition-all duration-500 ${
                        isHovering 
                          ? "scale-[95%] sm:scale-[90%] md:scale-[90%] lg:scale-[90%] rotate-2" 
                          : "scale-[90%] sm:scale-[80%] md:scale-[80%] lg:scale-[80%]"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(Home);
