import { useEffect } from "react";
import {
  Linkedin,
  Github,
  Instagram,
  Mail,
  ExternalLink,
} from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
const socialLinks = [
  {
    name: "LinkedIn",
    displayName: "Let's Connect",
    subText: "on LinkedIn",
    icon: Linkedin,
    url: "https://www.linkedin.com/in/nikodwicahyo/",
    color: "#0A66C2",
    gradient: "from-[#0A66C2] to-[#0077B5]",
    isPrimary: true,
  },
  {
    name: "Instagram",
    displayName: "Instagram",
    subText: "@nikodwchy",
    icon: Instagram,
    url: "https://www.instagram.com/nikodwchy/",
    color: "#E4405F",
    gradient: "from-[#833AB4] via-[#E4405F] to-[#FCAF45]",
  },
  {
    name: "GitHub",
    displayName: "Github",
    subText: "@nikodwicahyo",
    icon: Github,
    url: "https://github.com/nikodwicahyo/",
    color: "#ffffff",
    gradient: "from-[#333] to-[#24292e]",
  },
  {
    name: "Email",
    displayName: "Email",
    subText: "nikodwchy@gmail.com",
    icon: Mail,
    url: "mailto:nikodwchy@gmail.com",
    color: "#EA4335",
    gradient: "from-[#EA4335] to-[#FBBC05]",
  },
];

const SocialLinks = () => {
  const linkedIn = socialLinks.find((link) => link.isPrimary);
  const otherLinks = socialLinks.filter((link) => !link.isPrimary);
  const [instagram, github, email] = otherLinks;

  useEffect(() => {
    AOS.init({
      offset: 10,
     
    });
  }, []);

  return (
    <div className="w-full bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 py-8 backdrop-blur-xl">
      <h3
        className="text-xl font-semibold text-white mb-6 flex items-center gap-2"
        data-aos="fade-down" 
      >
        <span className="inline-block w-8 h-1 bg-indigo-500 rounded-full"></span>
        Connect With Me
      </h3>

      <div className="flex flex-col gap-4">
        {/* LinkedIn - Primary Row */}
        <a
          href={linkedIn.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between p-4 rounded-lg 
                     bg-white/5 border border-white/10 overflow-hidden
                     hover:border-white/20 transition-all duration-500"
          data-aos="fade-up"
          data-aos-delay="100" 
        >
          {/* Hover Gradient Background */}
          <div
            className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
                       bg-gradient-to-r ${linkedIn.gradient}`}
          />

          {/* Content Container */}
          <div className="relative flex items-center gap-4">
            {/* Icon Container */}
            <div className="relative flex items-center justify-center">
              <div
                className="absolute inset-0 opacity-20 rounded-md transition-all duration-500
                               group-hover:scale-110 group-hover:opacity-30"
                style={{ backgroundColor: linkedIn.color }}
              />
              <div className="relative p-2 rounded-md">
                <linkedIn.icon
                  className="w-6 h-6 transition-all duration-500 group-hover:scale-105"
                  style={{ color: linkedIn.color }}
                />
              </div>
            </div>

            {/* Text Container */}
            <div className="flex flex-col">
              <span className="text-sm font-bold pt-[0.2rem] text-gray-200 tracking-tight leading-none group-hover:text-white transition-colors duration-300">
                {linkedIn.displayName}
              </span>
              <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                {linkedIn.subText}
              </span>
            </div>
          </div>

          {/* External Link */}
          <ExternalLink
            className="relative w-5 h-5 text-gray-500 group-hover:text-white
                       opacity-0 group-hover:opacity-100 transition-all duration-300
                       transform group-hover:translate-x-0 -translate-x-1"
          />

          {/* Shine Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                               translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
            />
          </div>
        </a>

        {/* Second Row - Email */}
        <a
          href={email.url}
          className="group relative flex items-center gap-3 p-4 rounded-xl 
                     bg-white/5 border border-white/10 overflow-hidden
                     hover:border-white/20 transition-all duration-500"
          data-aos="fade-up" 
          data-aos-delay={200}
        >
          <div
            className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
                         bg-gradient-to-r ${email.gradient}`}
          />
          <div className="relative flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-20 rounded-lg transition-all duration-500
                           group-hover:scale-125 group-hover:opacity-30"
              style={{ backgroundColor: email.color }}
            />
            <div className="relative p-2 rounded-lg">
              <email.icon
                className="w-5 h-5 transition-all duration-500 group-hover:scale-110"
                style={{ color: email.color }}
              />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors duration-300">
              {email.displayName}
            </span>
            <span className="text-xs text-gray-400 truncate group-hover:text-gray-300 transition-colors duration-300">
              {email.subText}
            </span>
          </div>
          <ExternalLink
            className="w-4 h-4 text-gray-500 group-hover:text-white ml-auto
                           opacity-0 group-hover:opacity-100 transition-all duration-300
                           transform group-hover:translate-x-0 -translate-x-2"
          />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                           translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
            />
          </div>
        </a>

        {/* Third Row - Instagram & GitHub */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href={instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-3 p-4 rounded-xl 
                       bg-white/5 border border-white/10 overflow-hidden
                       hover:border-white/20 transition-all duration-500"
            data-aos="fade-up" 
            data-aos-delay={300}
          >
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
                           bg-gradient-to-r ${instagram.gradient}`}
            />
            <div className="relative flex items-center justify-center">
              <div
                className="absolute inset-0 opacity-20 rounded-lg transition-all duration-500
                             group-hover:scale-125 group-hover:opacity-30"
                style={{ backgroundColor: instagram.color }}
              />
              <div className="relative p-2 rounded-lg">
                <instagram.icon
                  className="w-5 h-5 transition-all duration-500 group-hover:scale-110"
                  style={{ color: instagram.color }}
                />
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors duration-300">
                {instagram.displayName}
              </span>
              <span className="text-xs text-gray-400 truncate group-hover:text-gray-300 transition-colors duration-300">
                {instagram.subText}
              </span>
            </div>
            <ExternalLink
              className="w-4 h-4 text-gray-500 group-hover:text-white ml-auto
                             opacity-0 group-hover:opacity-100 transition-all duration-300
                             transform group-hover:translate-x-0 -translate-x-2"
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                             translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
              />
            </div>
          </a>
          <a
            href={github.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-3 p-4 rounded-xl 
                       bg-white/5 border border-white/10 overflow-hidden
                       hover:border-white/20 transition-all duration-500"
            data-aos="fade-up" 
            data-aos-delay={400}
          >
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
                           bg-gradient-to-r ${github.gradient}`}
            />
            <div className="relative flex items-center justify-center">
              <div
                className="absolute inset-0 opacity-20 rounded-lg transition-all duration-500
                             group-hover:scale-125 group-hover:opacity-30"
                style={{ backgroundColor: github.color }}
              />
              <div className="relative p-2 rounded-lg">
                <github.icon
                  className="w-5 h-5 transition-all duration-500 group-hover:scale-110"
                  style={{ color: github.color }}
                />
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors duration-300">
                {github.displayName}
              </span>
              <span className="text-xs text-gray-400 truncate group-hover:text-gray-300 transition-colors duration-300">
                {github.subText}
              </span>
            </div>
            <ExternalLink
              className="w-4 h-4 text-gray-500 group-hover:text-white ml-auto
                             opacity-0 group-hover:opacity-100 transition-all duration-300
                             transform group-hover:translate-x-0 -translate-x-2"
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                             translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"
              />
            </div>
          </a>
        </div>
  
      </div>
    </div>
  );
};

export default SocialLinks;