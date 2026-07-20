import React, { useEffect, useState, useCallback } from "react";

import { supabase } from "../supabase"; 

import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import CardProject from "../components/CardProject";
import TechStackIcon from "../components/TechStackIcon";
import AOS from "aos";
import "aos/dist/aos.css";
import Certificate from "../components/Certificate";
import { Code, Award, Boxes, Briefcase, Calendar, MapPin } from "lucide-react";

const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-white/[0.06] ${className}`}>
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  </div>
);

const ToggleButton = ({ onClick, isShowingMore }) => (
  <button
    onClick={onClick}
    className="
      px-3 py-1.5
      text-slate-300 
      hover:text-white 
      text-sm 
      font-medium 
      transition-all 
      duration-300 
      ease-in-out
      flex 
      items-center 
      gap-2
      bg-white/5 
      hover:bg-white/10
      rounded-md
      border 
      border-white/10
      hover:border-white/20
      backdrop-blur-sm
      group
      relative
      overflow-hidden
    "
  >
    <span className="relative z-10 flex items-center gap-2">
      {isShowingMore ? "See Less" : "See More"}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`
          transition-transform 
          duration-300 
          ${isShowingMore ? "group-hover:-translate-y-0.5" : "group-hover:translate-y-0.5"}
        `}
      >
        <polyline points={isShowingMore ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
      </svg>
    </span>
    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500/50 transition-all duration-300 group-hover:w-full"></span>
  </button>
);


function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      className="p-2 sm:p-6"
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

const ExperienceModal = ({ experience, onClose }) => {
  if (!experience) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "Present";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const startDate = formatDate(experience.start_date);
  const endDate = formatDate(experience.end_date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-30 pointer-events-none" />
        <div className="relative bg-[#0a0a1a] border border-white/12 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
            <h2 className="text-lg font-semibold text-white">Experience Details</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-start gap-4">
              {experience.logo_url ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
                  <img
                    src={experience.logo_url}
                    alt={experience.company}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
                  <Briefcase className="w-7 h-7 text-indigo-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  {experience.position}
                </h3>
                <p className="text-white/95 text-base">
                  {experience.company}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Calendar className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>{startDate} - {endDate}</span>
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
                <h4 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider">Description</h4>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {experience.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FullWidthTabs() {
  const [value, setValue] = useState(0);
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [techStacks, setTechStacks] = useState([]);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllCertificates, setShowAllCertificates] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [certLoading, setCertLoading] = useState(false);
  const [techLoading, setTechLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const initialItems = isMobile ? 4 : 6;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    AOS.init({
      once: false,
    });
  }, []);


  const fetchData = useCallback(async (retries = 2) => {
    try {
      const fetchWithRetry = async (fn, retriesLeft = retries) => {
        try {
          const response = await fn();
          if (response.error) throw response.error;
          return response.data || [];
        } catch (error) {
          if (retriesLeft > 0 && error.message.includes('timeout')) {
            console.warn(`Retrying fetch... (${retriesLeft} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(fn, retriesLeft - 1);
          }
          throw error;
        }
      };

      const [projectData, certificateData, experienceData] = await Promise.all([
        fetchWithRetry(() => supabase.from("projects").select("*").order('id', { ascending: false })),
        fetchWithRetry(() => supabase.from("certificates").select("*").order('id', { ascending: false })),
        fetchWithRetry(() => supabase.from("experiences").select("*").order('start_date', { ascending: false })),
      ]);

      setProjects(projectData);
      setCertificates(certificateData);
      setExperiences(experienceData);

      try {
        localStorage.setItem("projects", JSON.stringify(projectData));
        localStorage.setItem("certificates", JSON.stringify(certificateData));
        localStorage.setItem("experiences", JSON.stringify(experienceData));
      } catch { /* storage full - will fetch from API */ }

      try {
        const techStackData = await fetchWithRetry(() => supabase.from("tech_stacks").select("*").order('display_order', { ascending: true }));
        setTechStacks(techStackData);
      } catch (error) {
        console.error("Error fetching tech stacks:", error.message);
      } finally {
        setTechLoading(false);
      }
    } catch (error) {
      console.error("Error fetching data from Supabase:", error.message);
    }
  }, []);



  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      const cachedProjects = localStorage.getItem('projects');
      const cachedCertificates = localStorage.getItem('certificates');
      const cachedExperiences = localStorage.getItem('experiences');

      if (cachedProjects && isMounted) {
        setProjects(JSON.parse(cachedProjects));
      }
      if (cachedCertificates && isMounted) {
        setCertificates(JSON.parse(cachedCertificates));
      }
      if (cachedExperiences && isMounted) {
        setExperiences(JSON.parse(cachedExperiences));
      }
      await fetchData();
      if (isMounted) {
        setHasLoadedOnce(true);
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    if (newValue === 2) {
      setCertLoading(true);
      const duration = hasLoadedOnce ? (certificates.length === 0 ? 1500 : 500) : 600;
      setTimeout(() => setCertLoading(false), duration);
    }
  };

  const toggleShowMore = useCallback((type) => {
    if (type === 'projects') {
      setShowAllProjects(prev => !prev);
    } else {
      setShowAllCertificates(prev => !prev);
    }
  }, []);

  const displayedProjects = showAllProjects ? projects : projects.slice(0, initialItems);
  const displayedCertificates = showAllCertificates ? certificates : certificates.slice(0, initialItems);

  // Sisa dari komponen (return statement) tidak ada perubahan
  return (
    <div className="md:px-[10%] px-[5%] w-full sm:mt-0 mt-[3rem] bg-[#030014] overflow-hidden scroll-mt-16" id="Portofolio">
      {/* Header section - unchanged */}
      <div className="text-center pb-10" data-aos="fade-up" data-aos-duration="1000">
        <h2 className="inline-block text-3xl md:text-5xl font-bold text-center mx-auto text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
          <span style={{
            color: '#6366f1',
            backgroundImage: 'linear-gradient(45deg, #6366f1 10%, #a855f7 93%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Portfolio Showcase
          </span>
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base mt-2">
          Explore my journey through work experiences, projects, certifications, and technical expertise. 
          Each section represents a milestone in my continuous learning path.
        </p>
      </div>

      <Box sx={{ width: "100%" }}>
        {/* AppBar and Tabs section - unchanged */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(180deg, rgba(139, 92, 246, 0.03) 0%, rgba(59, 130, 246, 0.03) 100%)",
              backdropFilter: "blur(10px)",
              zIndex: 0,
            },
          }}
          className="md:px-4"
        >
          {/* Tabs remain unchanged */}
          <Tabs
            value={value}
            onChange={handleChange}
            textColor="secondary"
            indicatorColor="secondary"
            variant="fullWidth"
            sx={{
              minHeight: { xs: "56px", sm: "70px" },
              "& .MuiTab-root": {
                fontSize: { xs: "0.7rem", sm: "0.9rem", md: "1rem" },
                fontWeight: "600",
                color: "#94a3b8",
                textTransform: "none",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                padding: { xs: "8px 2px", sm: "12px 4px", md: "20px 0" },
                zIndex: 1,
                margin: { xs: "4px 2px", sm: "6px 4px", md: "8px" },
                borderRadius: "12px",
                "&:hover": {
                  color: "#ffffff",
                  backgroundColor: "rgba(139, 92, 246, 0.1)",
                  transform: "translateY(-2px)",
                  "& .lucide": {
                    transform: "scale(1.1) rotate(5deg)",
                  },
                },
                "&.Mui-selected": {
                  color: "#fff",
                  background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))",
                  boxShadow: "0 4px 15px -3px rgba(139, 92, 246, 0.2)",
                  "& .lucide": {
                    color: "#a78bfa",
                  },
                },
              },
              "& .MuiTabs-indicator": {
                height: 0,
              },
              "& .MuiTabs-flexContainer": {
                gap: { xs: "2px", sm: "4px", md: "8px" },
              },
            }}
          >
            <Tab
              icon={<Briefcase className="mb-1 sm:mb-2 w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300" />}
              label="Experiences"
              {...a11yProps(0)}
            />
            <Tab
              icon={<Code className="mb-1 sm:mb-2 w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300" />}
              label="Projects"
              {...a11yProps(1)}
            />
            <Tab
              icon={<Award className="mb-1 sm:mb-2 w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300" />}
              label="Certificates"
              {...a11yProps(2)}
            />
            <Tab
              icon={<Boxes className="mb-1 sm:mb-2 w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300" />}
              label="Tech Stack"
              {...a11yProps(3)}
            />
          </Tabs>
        </AppBar>

        <TabPanel value={value} index={0}>
            <div className="max-w-6xl mx-auto px-4 py-4">
              {experiences.length === 0 ? (
                <div className="text-center py-16">
                  <Briefcase className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    No experiences to display yet
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Center timeline line - desktop */}
                  <div className="hidden md:block absolute left-1/2 w-0.5 h-full bg-gradient-to-b from-[#6366f1] via-[#a855f7] to-[#6366f1] opacity-60" />
                  {/* Left timeline line - mobile */}
                  <div className="md:hidden absolute left-6 top-0 w-0.5 h-full bg-gradient-to-b from-[#6366f1] via-[#a855f7] to-[#6366f1] opacity-60" />

                  <div className="space-y-8 md:space-y-12">
                    {experiences.map((exp, index) => {
                      const formatDate = (dateStr) => {
                        if (!dateStr) return "Present";
                        const date = new Date(dateStr);
                        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                      };

                      const startDate = formatDate(exp.start_date);
                      const endDate = formatDate(exp.end_date);
                      const isEven = index % 2 === 0;

                      const ExperienceCard = ({ exp }) => (
                        <div
                          className="relative group cursor-pointer"
                          onClick={() => setSelectedExperience(exp)}
                        >
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
                          <div className="relative bg-white/5 backdrop-blur-xl border border-white/12 rounded-2xl p-5">
                            <div className="flex items-start gap-3 mb-3">
                              {exp.logo_url ? (
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0">
                                  <img
                                    src={exp.logo_url}
                                    alt={exp.company}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                                  <Briefcase className="w-5 h-5 text-indigo-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-base mb-0.5">
                                  {exp.position}
                                </h3>
                                <p className="text-white/95 text-sm">
                                  {exp.company}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-1.5 mb-3">
                              <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                <span>{startDate} - {endDate}</span>
                              </div>
                              {exp.location && (
                                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{exp.location}</span>
                                </div>
                              )}
                            </div>

                            {exp.description && (
                              <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                                {exp.description}
                              </p>
                            )}

                            <div className="mt-3 pt-3 border-t border-white/8">
                              <p className="text-indigo-400/70 text-xs font-medium flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                                </svg>
                                Click to view details
                              </p>
                            </div>
                          </div>
                        </div>
                      );

                      return (
                        <div
                          key={exp.id || index}
                          data-aos={window.innerWidth < 768 ? "fade-up" : isEven ? "fade-right" : "fade-left"}
                          data-aos-duration="1000"
                          className="relative"
                        >
                          {/* Timeline dot - desktop center */}
                          <div className="hidden md:block absolute left-1/2 top-6 transform -translate-x-1/2 z-10">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] ring-4 ring-[#030014] shadow-lg shadow-indigo-500/30" />
                          </div>
                          
                          {/* Timeline dot - mobile left */}
                          <div className="md:hidden absolute left-6 top-6 transform -translate-x-1/2 z-10">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] ring-4 ring-[#030014] shadow-lg shadow-indigo-500/30" />
                          </div>

                          {/* Desktop layout - alternating */}
                          <div className="hidden md:flex items-start gap-8">
                            {/* Left side card */}
                            <div className={`w-5/12 ${isEven ? '' : 'invisible pointer-events-none'}`}>
                              {isEven && <ExperienceCard exp={exp} />}
                            </div>

                            {/* Spacer for center */}
                            <div className="w-2/12" />

                            {/* Right side card */}
                            <div className={`w-5/12 ${!isEven ? '' : 'invisible pointer-events-none'}`}>
                              {!isEven && <ExperienceCard exp={exp} />}
                            </div>
                          </div>

                          {/* Mobile layout - single column */}
                          <div className="md:hidden ml-12">
                            <div className="relative group cursor-pointer" onClick={() => setSelectedExperience(exp)}>
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
                              <div className="relative bg-white/5 backdrop-blur-xl border border-white/12 rounded-2xl p-4">
                                <div className="flex items-start gap-3 mb-3">
                                  {exp.logo_url ? (
                                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-white/5 shrink-0">
                                      <img
                                        src={exp.logo_url}
                                        alt={exp.company}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                                      <Briefcase className="w-5 h-5 text-indigo-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-sm mb-0.5">
                                      {exp.position}
                                    </h3>
                                    <p className="text-white/95 text-xs">
                                      {exp.company}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-1 mb-2">
                                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                                    <span>{startDate} - {endDate}</span>
                                  </div>
                                  {exp.location && (
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">{exp.location}</span>
                                    </div>
                                  )}
                                </div>

                                {exp.description && (
                                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                                    {exp.description}
                                  </p>
                                )}

                                <div className="mt-2 pt-2 border-t border-white/8">
                                  <p className="text-indigo-400/70 text-xs font-medium flex items-center gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                                    </svg>
                                    Tap to view details
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {selectedExperience && (
              <ExperienceModal
                experience={selectedExperience}
                onClose={() => setSelectedExperience(null)}
              />
            )}
          </TabPanel>

          <TabPanel value={value} index={1}>
            <div className="container mx-auto flex justify-center items-center overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
                {displayedProjects.map((project, index) => (
                  <div
                    key={project.id || index}
                    data-aos={index % 3 === 0 ? "fade-up-right" : index % 3 === 1 ? "fade-up" : "fade-up-left"}
                    data-aos-duration={index % 3 === 0 ? "1000" : index % 3 === 1 ? "1200" : "1000"}
                  >
                    <CardProject
                      Img={project.img}
                      Title={project.title}
                      Description={project.description}
                      Link={project.link}
                      id={project.id}
                    />
                  </div>
                ))}
              </div>
            </div>
            {projects.length > initialItems && (
              <div className="mt-6 w-full flex justify-start">
                <ToggleButton
                  onClick={() => toggleShowMore('projects')}
                  isShowingMore={showAllProjects}
                />
              </div>
            )}
          </TabPanel>

          <TabPanel value={value} index={2}>
            {certLoading || (value === 2 && !hasLoadedOnce && certificates.length === 0) ? (
              <div className="w-full py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 md:gap-5 gap-4">
                  {Array.from({ length: initialItems }).map((_, i) => (
                    <div key={i} className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10" />
                      <div className="relative bg-white/5 border border-white/12 rounded-2xl overflow-hidden">
                        <ShimmerBlock className="w-full aspect-[16/11.5] rounded-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-16">
                <Award className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No certificates to display yet</p>
              </div>
            ) : (
              <>
                <div className="container mx-auto flex justify-center items-center overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3 md:gap-5 gap-4">
                    {displayedCertificates.map((certificate, index) => (
                      <div
                        key={certificate.id || index}
                        data-aos={index % 3 === 0 ? "fade-up-right" : index % 3 === 1 ? "fade-up" : "fade-up-left"}
                        data-aos-duration={index % 3 === 0 ? "1000" : index % 3 === 1 ? "1200" : "1000"}
                      >
                        <Certificate ImgSertif={certificate.img} />
                      </div>
                    ))}
                  </div>
                </div>
                {certificates.length > initialItems && (
                  <div className="mt-6 w-full flex justify-start">
                    <ToggleButton
                      onClick={() => toggleShowMore('certificates')}
                      isShowingMore={showAllCertificates}
                    />
                  </div>
                )}
              </>
            )}
          </TabPanel>

          <TabPanel value={value} index={3}>
            <div className="container mx-auto flex justify-center items-center overflow-hidden pb-[5%]">
              {techLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-8 gap-5 py-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10" />
                      <div className="relative bg-white/5 border border-white/12 rounded-2xl p-6 flex flex-col items-center gap-3">
                        <ShimmerBlock className="w-16 h-16 rounded-2xl" />
                        <ShimmerBlock className="h-4 w-20 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : techStacks.length === 0 ? (
                <div className="text-center py-16">
                  <Boxes className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No tech stacks to display yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-8 gap-5">
                  {techStacks.map((stack, index) => (
                    <div
                      key={stack.id}
                      data-aos={index % 3 === 0 ? "fade-up-right" : index % 3 === 1 ? "fade-up" : "fade-up-left"}
                      data-aos-duration={index % 3 === 0 ? "1000" : index % 3 === 1 ? "1200" : "1000"}
                    >
                      <TechStackIcon TechStackIcon={stack.icon} Language={stack.name} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabPanel>
      </Box>
    </div>
  );
}