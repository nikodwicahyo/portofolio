import { useEffect, useState, useCallback, useRef, memo } from "react";

import { supabase } from "../supabase";
import { PROJECTS_CACHE_KEY } from "../utils/portfolioPrefetch";
import { onPortfolioDataUpdated } from "../utils/realtimeSync";

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

const shimmer = "relative overflow-hidden bg-soft before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent_0%,var(--soft-strong)_50%,transparent_100%)] before:bg-[length:200%_100%] before:animate-shimmer";

const ShimmerBlock = ({ className = "" }) => (
  <div className={`${shimmer} ${className}`} />
);

const ToggleButton = ({ onClick, isShowingMore }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 text-secondary hover:text-primary text-sm font-medium transition-all duration-300 ease-in-out flex items-center gap-2 bg-soft hover:bg-soft-strong rounded-md border border-edge hover:border-edge-strong backdrop-blur-sm group relative overflow-hidden"
  >
    <span className="relative z-10 flex items-center gap-2">
      {isShowingMore ? "See Less" : "See More"}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={`transition-transform duration-300 ${isShowingMore ? "group-hover:-translate-y-0.5" : "group-hover:translate-y-0.5"}`}
      >
        <polyline points={isShowingMore ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
      </svg>
    </span>
    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-soft-strong transition-all duration-300 group-hover:w-full" />
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
      <div className="relative bg-surface border border-edge rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:border-edge-strong hover:bg-elevated">
        <div className="flex items-start gap-3 mb-3">
          {exp.logo_url ? (
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-soft shrink-0">
              <LazyImage src={exp.logo_url} alt={exp.company} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-soft border border-edge flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-secondary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-primary text-sm sm:text-base mb-0.5 leading-tight">{exp.position}</h3>
            <p className="text-secondary text-xs sm:text-sm">{exp.company}</p>
          </div>
        </div>
        <div className="space-y-1 mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 text-muted text-xs">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="truncate">{fmt(exp.start_date)} - {fmt(exp.end_date)}</span>
          </div>
          {exp.location && (
            <div className="flex items-center gap-1.5 text-muted text-xs">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{exp.location}</span>
            </div>
          )}
        </div>
        {exp.description && (
          <p className="text-secondary text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">{exp.description}</p>
        )}
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-edge">
          <p className="text-muted group-hover:text-primary text-xs font-medium flex items-center gap-1.5 transition-colors">
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
        <div className="relative bg-elevated border border-edge rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-edge">
            <h2 className="text-base sm:text-lg font-semibold text-primary">Experience Details</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-soft-strong transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-start gap-3 sm:gap-4">
              {experience.logo_url ? (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-soft shrink-0">
                  <LazyImage src={experience.logo_url} alt={experience.company} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-soft border border-edge flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-secondary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-primary mb-1 break-words">{experience.position}</h3>
                <p className="text-secondary text-sm sm:text-base">{experience.company}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary text-sm">
                <Calendar className="w-4 h-4 shrink-0 text-muted" />
                <span>{fmt(experience.start_date)} - {fmt(experience.end_date)}</span>
              </div>
              {experience.location && (
                <div className="flex items-center gap-2 text-primary text-sm">
                  <MapPin className="w-4 h-4 shrink-0 text-muted" />
                  <span>{experience.location}</span>
                </div>
              )}
            </div>
            {experience.description && (
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Description</h4>
                <p className="text-secondary text-sm leading-relaxed whitespace-pre-wrap">{experience.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
ExperienceCard.displayName = "ExperienceCard";

const CardGridLoading = ({ count, cols }) => {
  const shimmerCards = Array.from({ length: count });
  const shimmerItem = (i) => (
    <div key={i} className="relative group">
      <div className="relative bg-surface border border-edge rounded-2xl overflow-hidden">
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
        <div className="absolute left-4 sm:left-6 top-5 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-soft-strong ring-4 ring-bg" />
        <div className="relative bg-surface border border-edge rounded-2xl p-4 sm:p-5 space-y-3">
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

const ExperienceTimeline = memo(({ experiences, onSelect, visited }) => {
  const isMobile = window.innerWidth < 768;
  return (
  <div className="relative">
    <div className="absolute left-4 sm:left-6 md:left-1/2 top-0 w-0.5 h-full bg-soft-strong md:-translate-x-1/2" />
    <div className="space-y-6 sm:space-y-8 md:space-y-12">
      {experiences.map((exp, index) => {
        const even = index % 2 === 0;
        const anim = isMobile ? "fadeIn" : even ? "slideInLeft" : "slideInRight";
        return (
          <div key={exp.id || index}
            {...entrance(visited, anim, 1000, index)}
            className="relative pl-10 sm:pl-14 md:pl-0"
          >
            <div className="absolute left-4 sm:left-6 md:left-1/2 top-5 md:top-6 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary ring-4 ring-bg md:-translate-x-1/2 z-10" />

            <div className="md:hidden">
              <ExperienceCard exp={exp} onSelect={onSelect} />
            </div>

            <div className="hidden md:grid grid-cols-[5fr_2fr_5fr] items-start">
              <div>{even && <ExperienceCard exp={exp} onSelect={onSelect} />}</div>
              <div />
              <div>{!even && <ExperienceCard exp={exp} onSelect={onSelect} />}</div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);});
ExperienceTimeline.displayName = "ExperienceTimeline";

const TAB_META = [
  { key: 'projects', order: { field: 'id', asc: false }, select: 'id,title,description,img,link,github,tech_stack,features', storageKey: PROJECTS_CACHE_KEY },
  { key: 'certificates', order: { field: 'id', asc: false }, select: 'id,img' },
  { key: 'experiences', order: { field: 'start_date', asc: false }, select: 'id,position,company,logo_url,start_date,end_date,location,description' },
  { key: 'tech_stacks', order: { field: 'display_order', asc: true }, select: 'id,icon,name,display_order' },
];

const EMPTY = [];
const CACHE_TTL = 86400000;
const MAX_CACHE_BYTES = 100 * 1024;
const TIME_SLOTS = [5000, 10000, 15000];

  const cacheKey = (key) => {
    const m = TAB_META.find((t) => t.key === key);
    return m?.storageKey || key;
  };

  function useTabData() {
    const initial = {};
    for (const { key } of TAB_META) {
      try {
        const raw = localStorage.getItem(cacheKey(key));
      if (raw) {
        const p = JSON.parse(raw);
        const data = Array.isArray(p) ? p : p.data;
        if (data && data.length > 0) { initial[key] = { data, loading: false, error: null, fetched: true }; continue; }
      }
    } catch { /* invalid cache */ }
    initial[key] = { data: EMPTY, loading: false, error: null, fetched: false };
  }

  const [state, setState] = useState(initial);
  const fetching = useRef({});

  const cache = (key, data) => {
    if (data.length === 0) return;
    const payload = JSON.stringify({ data, timestamp: Date.now() });
    if (payload.length > MAX_CACHE_BYTES) return;
    for (let i = 0; i < 2; i++) {
      try { localStorage.setItem(cacheKey(key), payload); return; }
      catch { if (i === 0) TAB_META.forEach(({ key: k }) => localStorage.removeItem(cacheKey(k))); }
    }
  };

  const fetchTab = useCallback(async (key, retries = 2, force = false) => {
    if (fetching.current[key]) return;
    fetching.current[key] = true;
    const meta = TAB_META.find(t => t.key === key);
    if (!meta) { fetching.current[key] = false; return; }

    try {
      const raw = localStorage.getItem(cacheKey(key));
      if (!force && raw) {
        const p = JSON.parse(raw);
        if (!Array.isArray(p) && p.data?.length > 0 && Date.now() - p.timestamp < CACHE_TTL) {
          fetching.current[key] = false; return;
        }
      }
    } catch { /* invalid cache */ }

    setState(prev => ({ ...prev, [key]: { ...prev[key], loading: true } }));

    for (let attempt = 0; attempt <= retries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIME_SLOTS[attempt] || 15000);
      try {
        const { data, error } = await supabase.from(key).select(meta.select).order(meta.order.field, { ascending: meta.order.asc });
        clearTimeout(timer);
        if (error) throw error;
        if (data === null) throw new Error(`Supabase returned null for "${key}"`);
        setState(prev => ({ ...prev, [key]: { data, loading: false, error: null, fetched: true } }));
        cache(key, data);
        fetching.current[key] = false;
        return;
      } catch (e) {
        clearTimeout(timer);
        const ms = TIME_SLOTS[attempt] || 15000;
        const msg = e.name === 'AbortError' ? `Request timed out (${ms / 1000}s)` : e.message;
        console.error(`[${key}] attempt ${attempt + 1}/${retries + 1} failed:`, msg);
        if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        else {
          setState(prev => ({ ...prev, [key]: { ...prev[key], loading: false, error: msg, fetched: true } }));
          fetching.current[key] = false;
        }
      }
    }
  }, []);

  return { state, fetchTab };
}

const RetryButton = ({ onClick }) => (
  <button onClick={onClick}
    className="px-4 py-2 mt-3 text-sm font-medium text-primary bg-soft-strong hover:bg-soft-strong rounded-lg border border-edge transition-colors"
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
            <p className="text-secondary text-xs sm:text-sm mb-1">Failed to load data</p>
            <p className="text-faint text-xs max-w-md mx-auto px-4">{msg}</p>
    {onRetry && <RetryButton onClick={onRetry} />}
  </div>
);

const entrance = (visited, animation, duration, index) =>
  visited
    ? {}
    : { style: { animation: `${animation} ${duration}ms ease both`, animationDelay: `${index * 90}ms` } };

export default function FullWidthTabs() {
  const { state: tabData, fetchTab } = useTabData();
  const { data: projects, loading: projLoading, error: projError, fetched: projFetched } = tabData.projects;
  const { data: certificates, loading: certLoading, error: certError, fetched: certFetched } = tabData.certificates;
  const { data: experiences, loading: expLoading, error: expError, fetched: expFetched } = tabData.experiences;
  const { data: techStacks, loading: techLoading, error: techError, fetched: techFetched } = tabData.tech_stacks;

  const [value, setValue] = useState(() => {
    const saved = sessionStorage.getItem('portfolioTab');
    return saved ? Number(saved) : 0;
  });
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllCertificates, setShowAllCertificates] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const initialItems = isMobile ? 4 : 6;
  const [visitedTabs, setVisitedTabs] = useState(() => new Set());
  const prevTabRef = useRef(value);

  useEffect(() => {
    if (value === prevTabRef.current) return;
    setVisitedTabs((prev) => {
      const next = new Set(prev);
      next.add(prevTabRef.current);
      return next;
    });
    prevTabRef.current = value;
  }, [value]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('scrollToPortfolio')) {
      sessionStorage.removeItem('scrollToPortfolio');
      const el = document.getElementById('Portofolio');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    for (const { key } of TAB_META) {
      fetchTab(key, 2, true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const key = TAB_META[value].key;
    const tab = tabData[key];
    if (!tab.fetched && !tab.loading) fetchTab(key);
  }, [value, tabData, fetchTab]);

  useEffect(() => {
    return onPortfolioDataUpdated((table) => fetchTab(table, 2, true));
  }, [fetchTab]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    sessionStorage.setItem('portfolioTab', newValue);
  };

  const prefetchTab = useCallback((index) => {
    const key = TAB_META[index].key;
    const tab = tabData[key];
    if (!tab.fetched && !tab.loading) fetchTab(key);
  }, [tabData, fetchTab]);

  const toggleShowMore = useCallback((type) => {
    if (type === 'projects') setShowAllProjects(p => !p);
    else setShowAllCertificates(p => !p);
  }, []);

  const displayedProjects = showAllProjects ? projects : projects.slice(0, initialItems);
  const displayedCertificates = showAllCertificates ? certificates : certificates.slice(0, initialItems);
  const visited = {
    experiences: visitedTabs.has(0),
    projects: visitedTabs.has(1),
    certificates: visitedTabs.has(2),
    tech: visitedTabs.has(3),
  };

  const emptyState = (Icon, msg) => (
    <div className="text-center py-12 sm:py-16">
            <Icon className="w-12 h-12 sm:w-16 sm:h-16 text-faint mx-auto mb-4" />
            <p className="text-muted text-sm">{msg}</p>
    </div>
  );

  const sectionContent = (loading, data, error, fetched, shimmer, icon, emptyMsg, done, key) => {
    if ((loading || !fetched) && data.length === 0) return shimmer;
    if (error && data.length === 0) return <ErrorState msg={error} onRetry={() => fetchTab(key)} />;
    if (!loading && data.length === 0) return emptyState(icon, emptyMsg);
    return done;
  };

  const ExpSection = () => sectionContent(expLoading, experiences, expError, expFetched,
    <ExpShimmer />, Briefcase, "No experiences to display yet",
    <ExperienceTimeline experiences={experiences} onSelect={setSelectedExperience} visited={visited.experiences} />,
    'experiences'
  );

  const ProjectSection = () => sectionContent(projLoading, projects, projError, projFetched,
    <CardGridLoading count={initialItems} cols={2} />, Code, "No projects to display yet",
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 w-full">
        {displayedProjects.map((project, index) => (
          <div key={project.id || index} {...entrance(visited.projects, index % 3 === 0 ? "slideInLeft" : index % 3 === 1 ? "fadeIn" : "slideInRight", index % 3 === 0 ? 1000 : index % 3 === 1 ? 1200 : 1000, index)}>
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
  , 'projects');

  const CertSection = () => sectionContent(certLoading, certificates, certError, certFetched,
    <CardGridLoading count={initialItems} cols={3} />, Award, "No certificates to display yet",
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 w-full">
        {displayedCertificates.map((cert, index) => (
          <div key={cert.id || index} {...entrance(visited.certificates, index % 3 === 0 ? "slideInLeft" : index % 3 === 1 ? "fadeIn" : "slideInRight", index % 3 === 0 ? 1000 : index % 3 === 1 ? 1200 : 1000, index)}>
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
  , 'certificates');

  const TechSection = () => sectionContent(techLoading, techStacks, techError, techFetched,
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-8 py-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="relative group">
          <div className="relative bg-surface border border-edge rounded-2xl p-4 sm:p-6 flex flex-col items-center gap-3">
            <ShimmerBlock className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl" />
            <ShimmerBlock className="h-4 w-16 sm:w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>, Boxes, "No tech stacks to display yet",
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-8 w-full">
      {techStacks.map((stack, index) => (
        <div key={stack.id} {...entrance(visited.tech, index % 3 === 0 ? "slideInLeft" : index % 3 === 1 ? "fadeIn" : "slideInRight", index % 3 === 0 ? 1000 : index % 3 === 1 ? 1200 : 1000, index)}>
          <TechStackIcon TechStackIcon={stack.icon} Language={stack.name} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="md:px-[10%] px-[5%] w-full sm:mt-0 mt-[3rem] bg-bg overflow-hidden scroll-mt-16" id="Portofolio">
      <div className="text-center pb-6 sm:pb-10" data-aos="fade-up" data-aos-duration="1000">
        <h2 className="inline-block text-2xl sm:text-3xl md:text-5xl font-bold text-center mx-auto text-primary">
          Portfolio Showcase
        </h2>
        <p className="text-secondary max-w-2xl mx-auto text-xs sm:text-sm md:text-base mt-2 px-2">
          Explore my journey through work experiences, projects, certifications, and technical expertise.
        </p>
      </div>

      <Box sx={{ width: "100%" }}>
        <AppBar position="static" elevation={0} className="!rounded-xl sm:!rounded-2xl"
          sx={{
            bgcolor: "var(--soft)",
            border: "1px solid var(--edge)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Tabs
            value={value} onChange={handleChange}
            textColor="inherit" indicatorColor="primary"
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={false}
            sx={{
              minHeight: { xs: "48px", sm: "70px" },
              "& .MuiTabs-flexContainer": { gap: { xs: "1px", sm: "4px" } },
              "& .MuiTab-root": {
                fontSize: { xs: "0.65rem", sm: "0.9rem", md: "1rem" },
                fontWeight: "500",
                color: "var(--secondary)",
                textTransform: "none",
                transition: "all 0.2s ease",
                padding: { xs: "6px 4px", sm: "12px 4px", md: "20px 0" },
                zIndex: 1,
                margin: { xs: "2px 1px", sm: "6px 4px" },
                borderRadius: "12px",
                minHeight: { xs: "44px", sm: "70px" },
                minWidth: { xs: "auto", sm: "auto" },
                flex: { xs: "1 1 auto", sm: "1 1 0" },
                "&:hover": {
                  color: "var(--primary)",
                  backgroundColor: "var(--soft-strong)",
                },
                "&.Mui-selected": {
                  color: "var(--primary)",
                  backgroundColor: "var(--soft-strong)",
                  "& .lucide": { color: "var(--primary)" },
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
                onMouseEnter={() => prefetchTab(i)}
                {...a11yProps(i)}
              />
            ))}
          </Tabs>
        </AppBar>

        <TabPanel value={value} index={0}>
          <div className={`w-full px-0 sm:px-4 py-2 sm:py-4 ${visited.experiences ? "" : "tab-fade-in"}`}>
            <ExpSection />
            {selectedExperience && (
              <ExperienceModal experience={selectedExperience} onClose={() => setSelectedExperience(null)} />
            )}
          </div>
        </TabPanel>

        <TabPanel value={value} index={1}>
          <div className={`w-full px-0 sm:px-4 py-2 sm:py-4 ${visited.projects ? "" : "tab-fade-in"}`}>
            <ProjectSection />
          </div>
        </TabPanel>

        <TabPanel value={value} index={2}>
          <div className={`w-full px-0 sm:px-4 py-2 sm:py-4 ${visited.certificates ? "" : "tab-fade-in"}`}>
            <CertSection />
          </div>
        </TabPanel>

        <TabPanel value={value} index={3}>
          <div className={`w-full px-0 sm:px-4 py-2 sm:py-4 ${visited.tech ? "" : "tab-fade-in"}`}>
            <TechSection />
          </div>
        </TabPanel>
      </Box>
    </div>
  );
}
