import { useEffect, useState, useCallback, useRef, memo } from "react";

import { supabase } from "../supabase";

import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import CardProject from "../components/CardProject";
import TechStackIcon from "../components/TechStackIcon";
import LazyImage from "../components/LazyImage";
import Certificate from "../components/Certificate";
import { Code, Award, Boxes, Briefcase, Calendar, MapPin } from "lucide-react";

const shimmer = "relative overflow-hidden bg-white/[0.06] before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] before:bg-[length:200%_100%] before:animate-shimmer";

const ShimmerBlock = ({ className = "" }) => (
  <div className={`${shimmer} ${className}`} />
);

const ToggleButton = ({ onClick, isShowingMore }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 text-slate-300 hover:text-white text-sm font-medium transition-all duration-300 ease-in-out flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-md border border-white/10 hover:border-white/20 backdrop-blur-sm group relative overflow-hidden"
  >
    <span className="relative z-10 flex items-center gap-2">
      {isShowingMore ? "See Less" : "See More"}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={`transition-transform duration-300 ${isShowingMore ? "group-hover:-translate-y-0.5" : "group-hover:translate-y-0.5"}`}
      >
        <polyline points={isShowingMore ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
      </svg>
    </span>
    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500/50 transition-all duration-300 group-hover:w-full" />
  </button>
);

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      className="px-1 sm:p-6"
      {...other}
    >
      {value === index && children}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

// ponytail: inline components kept to avoid prop threading overhead

const ExperienceCard = memo(({ exp, onSelect }) => {
  const fmt = (d) => {
    if (!d) return "Present";
    return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  return (
    <div className="relative group cursor-pointer" onClick={() => onSelect(exp)}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/12 rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-3">
          {exp.logo_url ? (
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-white/5 shrink-0">
              <LazyImage src={exp.logo_url} alt={exp.company} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-indigo-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm sm:text-base mb-0.5 leading-tight">{exp.position}</h3>
            <p className="text-white/95 text-xs sm:text-sm">{exp.company}</p>
          </div>
        </div>
        <div className="space-y-1 mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="truncate">{fmt(exp.start_date)} - {fmt(exp.end_date)}</span>
          </div>
          {exp.location && (
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{exp.location}</span>
            </div>
          )}
        </div>
        {exp.description && (
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">{exp.description}</p>
        )}
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/8">
          <p className="text-indigo-400/70 text-xs font-medium flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            View details
          </p>
        </div>
      </div>
    </div>
  );
});

const ExperienceModal = ({ experience, onClose }) => {
  if (!experience) return null;
  const fmt = (d) => {
    if (!d) return "Present";
    return new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose} style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }} />
      <div className="relative z-10 w-full max-w-2xl mx-auto" style={{ animation: 'fadeIn 0.2s ease-out, scaleIn 0.2s ease-out' }} onClick={e => e.stopPropagation()}>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-30 pointer-events-none" />
        <div className="relative bg-[#0a0a1a] border border-white/12 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/8">
            <h2 className="text-base sm:text-lg font-semibold text-white">Experience Details</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-start gap-3 sm:gap-4">
              {experience.logo_url ? (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
                  <LazyImage src={experience.logo_url} alt={experience.company} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1 break-words">{experience.position}</h3>
                <p className="text-white/95 text-sm sm:text-base">{experience.company}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Calendar className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>{fmt(experience.start_date)} - {fmt(experience.end_date)}</span>
              </div>
              {experience.location && (
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <MapPin className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>{experience.location}</span>
                </div>
              )}
            </div>
            {experience.description && (
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-white mb-2 uppercase tracking-wider">Description</h4>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{experience.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CardGridLoading = ({ count, cols }) => {
  const shimmerCards = Array.from({ length: count });
  const shimmerItem = (i) => (
    <div key={i} className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10" />
      <div className="relative bg-white/5 border border-white/12 rounded-2xl overflow-hidden">
        <ShimmerBlock className="w-full aspect-[16/11.5] rounded-none" />
      </div>
    </div>
  );
  if (cols <= 2) return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">{shimmerCards.map((_, i) => shimmerItem(i))}</div>;
  return <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">{shimmerCards.map((_, i) => shimmerItem(i))}</div>;
};

const ExpShimmer = ({ count = 3 }) => (
  <div className="space-y-6 sm:space-y-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="relative pl-10 sm:pl-14">
        <div className="absolute left-4 sm:left-6 top-5 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white/10 ring-4 ring-[#030014]" />
        <div className="relative bg-white/5 border border-white/12 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <ShimmerBlock className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <ShimmerBlock className="h-4 w-3/4 rounded-lg" />
              <ShimmerBlock className="h-3 w-1/2 rounded-lg" />
            </div>
          </div>
          <ShimmerBlock className="h-3 w-1/3 rounded-lg" />
          <ShimmerBlock className="h-3 w-full rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

const ExperienceTimeline = ({ experiences, onSelect }) => (
  <div className="relative">
    <div className="absolute left-4 sm:left-6 md:left-1/2 top-0 w-0.5 h-full bg-gradient-to-b from-[#6366f1] via-[#a855f7] to-[#6366f1] opacity-60 md:-translate-x-1/2" />
    <div className="space-y-6 sm:space-y-8 md:space-y-12">
      {experiences.map((exp, index) => {
        const isEven = index % 2 === 0;
        return (
          <div key={exp.id || index}
            data-aos={window.innerWidth < 768 ? "fade-up" : isEven ? "fade-right" : "fade-left"}
            data-aos-duration="1000"
            data-aos-once="true"
            className="relative pl-10 sm:pl-14 md:pl-0"
          >
            <div className="absolute left-4 sm:left-6 md:left-1/2 top-5 md:top-6 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] ring-4 ring-[#030014] shadow-lg shadow-indigo-500/30 md:-translate-x-1/2 z-10" />

            <div className="md:hidden">
              <ExperienceCard exp={exp} onSelect={onSelect} />
            </div>

            <div className="hidden md:flex items-start">
              <div className={`w-5/12 ${isEven ? '' : 'invisible'}`}>
                {isEven && <ExperienceCard exp={exp} onSelect={onSelect} />}
              </div>
              <div className="w-2/12 shrink-0" />
              <div className={`w-5/12 ${isEven ? 'invisible' : ''}`}>
                {!isEven && <ExperienceCard exp={exp} onSelect={onSelect} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const TAB_META = [
  { key: 'projects', order: { field: 'id', asc: false } },
  { key: 'certificates', order: { field: 'id', asc: false } },
  { key: 'experiences', order: { field: 'start_date', asc: false } },
  { key: 'tech_stacks', order: { field: 'display_order', asc: true } },
];

const EMPTY = [];

function useTabData() {
  const initial = {};
  for (const { key } of TAB_META) {
    const raw = localStorage.getItem(key);
    if (raw) { const p = JSON.parse(raw); if (p.length > 0) { initial[key] = { data: p, loading: false, error: null }; continue; } }
    initial[key] = { data: EMPTY, loading: true, error: null };
  }

  const [state, setState] = useState(initial);
  const fetching = useRef(false);

  const doFetch = useCallback(async (retries = 2) => {
    if (fetching.current) return;
    fetching.current = true;

    const fetchOne = async ({ key, order }) => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const { data, error } = await supabase.from(key).select("*").order(order.field, { ascending: order.asc });
          if (error) throw error;
          if (data === null) throw new Error(`Supabase returned null for "${key}" — check RLS policies`);
          setState(prev => ({ ...prev, [key]: { data, loading: false, error: null } }));
          if (data.length > 0) localStorage.setItem(key, JSON.stringify(data));
          return;
        } catch (e) {
          console.error(`[${key}] attempt ${attempt + 1}/${retries + 1} failed:`, e.message);
          if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          else setState(prev => ({ ...prev, [key]: { data: prev[key]?.data || EMPTY, loading: false, error: e.message } }));
        }
      }
    };

    await Promise.all(TAB_META.map(fetchOne));
    fetching.current = false;
  }, []);

  useEffect(() => { doFetch(); }, [doFetch]);

  return { state, retry: () => { fetching.current = false; doFetch(); } };
}

const RetryButton = ({ onClick }) => (
  <button onClick={onClick}
    className="px-4 py-2 mt-3 text-sm font-medium text-white bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 transition-colors"
  >
    Retry
  </button>
);

const ErrorState = ({ msg, onRetry }) => (
  <div className="text-center py-12 sm:py-16">
    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <p className="text-gray-400 text-xs sm:text-sm mb-1">Failed to load data</p>
    <p className="text-gray-600 text-xs max-w-md mx-auto px-4">{msg}</p>
    {onRetry && <RetryButton onClick={onRetry} />}
  </div>
);

export default function FullWidthTabs() {
  const { state: tabData, retry } = useTabData();
  const { data: projects, loading: projLoading, error: projError } = tabData.projects;
  const { data: certificates, loading: certLoading, error: certError } = tabData.certificates;
  const { data: experiences, loading: expLoading, error: expError } = tabData.experiences;
  const { data: techStacks, loading: techLoading, error: techError } = tabData.tech_stacks;

  const [value, setValue] = useState(() => {
    const saved = sessionStorage.getItem('portfolioTab');
    return saved ? Number(saved) : 0;
  });
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllCertificates, setShowAllCertificates] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const initialItems = isMobile ? 4 : 6;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const el = document.getElementById('Portofolio');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    sessionStorage.setItem('portfolioTab', newValue);
  };

  const toggleShowMore = useCallback((type) => {
    if (type === 'projects') setShowAllProjects(p => !p);
    else setShowAllCertificates(p => !p);
  }, []);

  const displayedProjects = showAllProjects ? projects : projects.slice(0, initialItems);
  const displayedCertificates = showAllCertificates ? certificates : certificates.slice(0, initialItems);

  const emptyState = (Icon, msg) => (
    <div className="text-center py-12 sm:py-16">
      <Icon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-700 mx-auto mb-4" />
      <p className="text-gray-500 text-sm">{msg}</p>
    </div>
  );

  const sectionContent = (loading, data, error, shimmer, icon, emptyMsg, done) => {
    if (loading && data.length === 0) return shimmer;
    if (error && data.length === 0) return <ErrorState msg={error} onRetry={retry} />;
    if (!loading && data.length === 0) return emptyState(icon, emptyMsg);
    return done;
  };

  const ExpSection = () => sectionContent(expLoading, experiences, expError,
    <ExpShimmer />, Briefcase, "No experiences to display yet",
    <ExperienceTimeline experiences={experiences} onSelect={setSelectedExperience} />
  );

  const ProjectSection = () => sectionContent(projLoading, projects, projError,
    <CardGridLoading count={initialItems} cols={2} />, Code, "No projects to display yet",
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 w-full">
        {displayedProjects.map((project, index) => (
          <div key={project.id || index}
            data-aos={index % 3 === 0 ? "fade-up-right" : index % 3 === 1 ? "fade-up" : "fade-up-left"}
            data-aos-duration={index % 3 === 0 ? "1000" : index % 3 === 1 ? "1200" : "1000"}
            data-aos-once="true"
          >
            <CardProject Img={project.img} Title={project.title} Description={project.description} Link={project.link} id={project.id} />
          </div>
        ))}
      </div>
      {projects.length > initialItems && (
        <div className="mt-6 w-full flex justify-center sm:justify-start">
          <ToggleButton onClick={() => toggleShowMore('projects')} isShowingMore={showAllProjects} />
        </div>
      )}
    </>
  );

  const CertSection = () => sectionContent(certLoading, certificates, certError,
    <CardGridLoading count={initialItems} cols={3} />, Award, "No certificates to display yet",
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 w-full">
        {displayedCertificates.map((cert, index) => (
          <div key={cert.id || index}
            data-aos={index % 3 === 0 ? "fade-up-right" : index % 3 === 1 ? "fade-up" : "fade-up-left"}
            data-aos-duration={index % 3 === 0 ? "1000" : index % 3 === 1 ? "1200" : "1000"}
            data-aos-once="true"
          >
            <Certificate ImgSertif={cert.img} />
          </div>
        ))}
      </div>
      {certificates.length > initialItems && (
        <div className="mt-6 w-full flex justify-center sm:justify-start">
          <ToggleButton onClick={() => toggleShowMore('certificates')} isShowingMore={showAllCertificates} />
        </div>
      )}
    </>
  );

  const TechSection = () => sectionContent(techLoading, techStacks, techError,
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-8 py-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10" />
          <div className="relative bg-white/5 border border-white/12 rounded-2xl p-4 sm:p-6 flex flex-col items-center gap-3">
            <ShimmerBlock className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl" />
            <ShimmerBlock className="h-4 w-16 sm:w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>, Boxes, "No tech stacks to display yet",
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-8 w-full">
      {techStacks.map((stack, index) => (
        <div key={stack.id}
          data-aos={index % 3 === 0 ? "fade-up-right" : index % 3 === 1 ? "fade-up" : "fade-up-left"}
          data-aos-duration={index % 3 === 0 ? "1000" : index % 3 === 1 ? "1200" : "1000"}
          data-aos-once="true"
        >
          <TechStackIcon TechStackIcon={stack.icon} Language={stack.name} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="md:px-[10%] px-[5%] w-full sm:mt-0 mt-[3rem] bg-[#030014] overflow-hidden scroll-mt-16" id="Portofolio">
      <div className="text-center pb-6 sm:pb-10" data-aos="fade-up" data-aos-duration="1000">
        <h2 className="inline-block text-2xl sm:text-3xl md:text-5xl font-bold text-center mx-auto text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
          Portfolio Showcase
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm md:text-base mt-2 px-2">
          Explore my journey through work experiences, projects, certifications, and technical expertise.
        </p>
      </div>

      <Box sx={{ width: "100%" }}>
        <AppBar position="static" elevation={0} className="!rounded-xl sm:!rounded-2xl"
          sx={{
            bgcolor: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            "&::before": {
              content: '""', position: "absolute", inset: 0,
              background: "linear-gradient(180deg, rgba(139, 92, 246, 0.03) 0%, rgba(59, 130, 246, 0.03) 100%)",
              backdropFilter: "blur(10px)", zIndex: 0,
            },
          }}
        >
          <Tabs
            value={value} onChange={handleChange}
            textColor="secondary" indicatorColor="secondary"
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={false}
            sx={{
              minHeight: { xs: "48px", sm: "70px" },
              "& .MuiTabs-flexContainer": { gap: { xs: "1px", sm: "4px" } },
              "& .MuiTab-root": {
                fontSize: { xs: "0.65rem", sm: "0.9rem", md: "1rem" },
                fontWeight: "600",
                color: "#94a3b8",
                textTransform: "none",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                padding: { xs: "6px 4px", sm: "12px 4px", md: "20px 0" },
                zIndex: 1,
                margin: { xs: "2px 1px", sm: "6px 4px" },
                borderRadius: "12px",
                minHeight: { xs: "44px", sm: "70px" },
                minWidth: { xs: "auto", sm: "auto" },
                flex: { xs: "1 1 auto", sm: "1 1 0" },
                "&:hover": {
                  color: "#ffffff",
                  backgroundColor: "rgba(139, 92, 246, 0.1)",
                },
                "&.Mui-selected": {
                  color: "#fff",
                  background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))",
                  boxShadow: "0 4px 15px -3px rgba(139, 92, 246, 0.2)",
                  "& .lucide": { color: "#a78bfa" },
                },
              },
              "& .MuiTabs-indicator": { height: 0 },
            }}
          >
            {[
              { icon: Briefcase, label: "Experiences" },
              { icon: Code, label: "Projects" },
              { icon: Award, label: "Certificates" },
              { icon: Boxes, label: "Tech Stack" },
            ].map((tab, i) => (
              <Tab key={i}
                icon={<tab.icon className="mb-0.5 sm:mb-2 w-3.5 h-3.5 sm:w-5 sm:h-5 transition-all duration-300" />}
                label={<span className="text-[0.6rem] leading-tight sm:text-sm md:text-base">{tab.label}</span>}
                {...a11yProps(i)}
              />
            ))}
          </Tabs>
        </AppBar>

        <TabPanel value={value} index={0}>
          <div className="w-full px-0 sm:px-4 py-2 sm:py-4 tab-fade-in">
            <ExpSection />
            {selectedExperience && (
              <ExperienceModal experience={selectedExperience} onClose={() => setSelectedExperience(null)} />
            )}
          </div>
        </TabPanel>

        <TabPanel value={value} index={1}>
          <div className="w-full px-0 sm:px-4 py-2 sm:py-4 tab-fade-in">
            <ProjectSection />
          </div>
        </TabPanel>

        <TabPanel value={value} index={2}>
          <div className="w-full px-0 sm:px-4 py-2 sm:py-4 tab-fade-in">
            <CertSection />
          </div>
        </TabPanel>

        <TabPanel value={value} index={3}>
          <div className="w-full px-0 sm:px-4 py-2 sm:py-4 tab-fade-in">
            <TechSection />
          </div>
        </TabPanel>
      </Box>
    </div>
  );
}
