import { useState, useEffect, useCallback, useRef, memo } from "react"
import { Helmet } from "react-helmet-async"
import { Github, Linkedin, Mail, ExternalLink, Instagram } from "lucide-react"
import { goToPortfolioTab } from "../services/portfolio"
import { detectAlphaVideoSupport, pickHeroSources } from "../utils/video"

const StatusBadge = memo(() => (
  <div className="inline-block lg:mx-0">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-edge-strong bg-soft">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      <span className="text-primary sm:text-sm text-[0.7rem] font-medium">
        Open to work · Jakarta / Remote
      </span>
    </div>
  </div>
));
StatusBadge.displayName = "StatusBadge";

const MainTitle = memo(() => (
  <div className="space-y-2">
    <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-4xl xl:text-6xl font-bold tracking-tight text-primary">
      <span className="block">Full Stack Dev</span>
      <span className="block mt-2 text-primary">AI Engineer</span>
    </h1>
  </div>
));
MainTitle.displayName = "MainTitle";

const TechStack = memo(({ tech }) => (
  <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-soft border border-edge text-[0.65rem] sm:text-xs text-secondary hover:text-primary hover:border-edge-strong transition-colors whitespace-nowrap shrink-0">
    {tech}
  </div>
));
TechStack.displayName = "TechStack";

const CTAButton = memo(({ href, onClick, text, icon: Icon, primary = false }) => (
  <a href={href} onClick={onClick}>
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
CTAButton.displayName = "CTAButton";

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
SocialLink.displayName = "SocialLink";

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

const HAS_ALPHA_VIDEO = detectAlphaVideoSupport();
const SMALL_HERO_QUERY = "(max-width: 640px)";

// Phones get the 540px encode (~5x less data than the 1200px one); the
// listener keeps it correct across rotation/resize without a 3rd rendition.
const useSmallHeroViewport = () => {
  const [small, setSmall] = useState(() =>
    typeof window !== "undefined" && window.matchMedia(SMALL_HERO_QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(SMALL_HERO_QUERY);
    const onChange = (event) => setSmall(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return small;
};

const TypewriterText = memo(() => {
  const [text, setText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const [wordIndex, setWordIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const pauseRef = useRef(null)

  const handleTyping = useCallback(() => {
    if (isTyping) {
      if (charIndex < WORDS[wordIndex].length) {
        setText(prev => prev + WORDS[wordIndex][charIndex]);
        setCharIndex(prev => prev + 1);
      } else {
        pauseRef.current = setTimeout(() => setIsTyping(false), PAUSE_DURATION);
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
  }, [handleTyping, isTyping]);

  useEffect(() => () => {
    if (pauseRef.current) clearTimeout(pauseRef.current);
  }, []);

  return (
    <>
      <span className="text-xl md:text-2xl text-primary font-light">
        {text}
      </span>
      <span className="w-[3px] h-6 bg-primary ml-1 animate-blink"></span>
    </>
  );
});
TypewriterText.displayName = "TypewriterText";

const Home = ({ revealed = true, animate = false }) => {
  const [isHovering, setIsHovering] = useState(false)
  const [videoSrc, setVideoSrc] = useState(null)
  const videoRef = useRef(null)
  const smallHeroViewport = useSmallHeroViewport()

  const heroMotion = `w-full h-full object-contain transition-all duration-500 ${
    isHovering
      ? "scale-[95%] sm:scale-[90%] md:scale-[90%] lg:scale-[90%] rotate-2"
      : "scale-[90%] sm:scale-[80%] md:scale-[80%] lg:scale-[80%]"
  }`;
  const heroSources = pickHeroSources({ smallViewport: smallHeroViewport, alphaVideo: HAS_ALPHA_VIDEO });
  const heroVideo = heroSources.video;

  // The decorative loop is 90–480 KB and costs real decode time. Keep it off the
  // critical path: paint the poster first and start the loop only once the
  // welcome overlay is gone, so it never competes with the splash for CPU.
  useEffect(() => {
    if (!revealed) return undefined;
    if (navigator.connection?.saveData) return undefined;

    let idleId;
    const enable = () => setVideoSrc(heroVideo);
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(enable, { timeout: 1500 });
    } else {
      const timer = setTimeout(enable, 150);
      return () => clearTimeout(timer);
    }

    return () => {
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [heroVideo, revealed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    video.load();
    const playing = video.play();
    if (playing?.catch) playing.catch(() => { /* autoplay blocked: poster stays */ });
  }, [videoSrc]);

  // Do not decode/paint a looping video the visitor has scrolled past.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          const playing = video.play();
          if (playing?.catch) playing.catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [videoSrc]);

  return (
    <>
      <Helmet>
        <title>Niko Dwicahyo Widiyanto - Full Stack Web Developer & AI Engineer</title>
        <meta name="description" content="Portfolio of Niko Dwicahyo Widiyanto, Full Stack Web Developer and AI Engineer building AI-powered web apps, machine learning solutions, and scalable digital experiences." />
      <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://nikodwicahyo.vercel.app/" />
        <meta property="og:title" content="Niko Dwicahyo Widiyanto - Full Stack Web Developer & AI Engineer" />
      <meta property="og:description" content="Portfolio of Niko Dwicahyo Widiyanto — Full-Stack Web Developer and AI Engineer building AI-powered web apps." />
        <meta property="og:url" content="https://nikodwicahyo.vercel.app" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Niko Dwicahyo Widiyanto",
            "jobTitle": "Full Stack Web Developer, AI Engineer",
            "url": "https://nikodwicahyo.vercel.app",
            "sameAs": [
              "https://github.com/nikodwicahyo/",
              "https://www.linkedin.com/in/nikodwicahyo/",
              "https://www.instagram.com/nikodwchy/"
            ]
          }
        `}</script>
      </Helmet>

      <div className="min-h-screen bg-bg overflow-hidden px-[5%] sm:px-[5%] lg:px-[10%] scroll-mt-16" id="Home">
        <div className={`relative z-10${animate ? " hero-enter" : ""}`}>
            <div className="container mx-auto min-h-[calc(100vh-4rem)]">
            <div className="flex flex-col lg:flex-row items-center justify-start lg:justify-between min-h-[calc(100vh-4rem)] gap-0 sm:gap-12 lg:gap-20 pt-2 sm:pt-3">
              {/* Left Column */}
              <div className="w-full lg:w-1/2 space-y-6 sm:space-y-8 text-left lg:text-left order-1 lg:order-1 lg:mt-0">
                <div className="space-y-4 sm:space-y-6 hero-seq">
                  <StatusBadge />
                  <MainTitle />

                  {/* Typing Effect */}
                  <div className="h-8 flex items-center">
                    <TypewriterText />
                  </div>

                  {/* Description */}
                  <p className="text-sm sm:text-base lg:text-lg text-secondary max-w-xl leading-relaxed font-light">
                    Architecting ecosystems with artificial intelligent to transform complex ideas into seamless digital solutions.
                  </p>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 justify-start max-w-xl">
                    {TECH_STACK.map((tech, index) => (
                      <TechStack key={index} tech={tech} />
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-row gap-3 w-full justify-start">
                    <CTAButton href="#Portofolio" onClick={() => goToPortfolioTab(0)} text="My Experiences" icon={ExternalLink} primary />
                    <CTAButton href="#Contact" text="Contact" icon={Mail} />
                  </div>

                  {/* Social Links */}
                  <div className="hidden sm:flex gap-4 justify-start">
                    {SOCIAL_LINKS.map((social, index) => (
                      <SocialLink key={index} {...social} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - WebM Video */}
              <div className="w-full py-0 md:py-[10%] sm:py-0 lg:w-1/2 h-[260px] sm:h-[400px] lg:h-[600px] xl:h-[750px] relative flex items-center justify-center order-2 lg:order-2  mt-5 sm:mt-0 hero-media"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}>
                <div className="relative w-full">
                  <div className="relative lg:left-12 z-10 w-full transform transition-transform duration-500">
                    <video
                      ref={videoRef}
                      src={videoSrc || undefined}
                      poster={heroSources.poster}
                      aria-hidden="true"
                      autoPlay={Boolean(videoSrc)}
                      loop
                      muted
                      playsInline
                      preload="none"
                      disablePictureInPicture
                      width={1200}
                      height={1200}
                      className={`hero-video ${HAS_ALPHA_VIDEO ? "" : "hero-video--fallback"} ${heroMotion}`}
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
