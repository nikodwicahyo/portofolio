import { useEffect, useState, memo, useMemo } from "react"
import { supabase } from "../supabase"
import { Code, Award, Globe, ArrowUpRight } from "lucide-react"
import CVViewerButton from "../components/CVViewerButton"
import LazyImage from "../components/LazyImage"
import { PROJECTS_CACHE_KEY } from "../utils/portfolioPrefetch"
import { onPortfolioDataUpdated } from "../utils/realtimeSync"

// Memoized Components
const Header = memo(() => (
  <div className="text-center lg:mb-8 mb-2 px-[5%]">
    <div className="inline-block relative group">
      <h2 
        className="text-4xl md:text-5xl font-bold text-primary" 
        data-aos="zoom-in-up"
        data-aos-duration="600"
      >
        About Me
      </h2>
    </div>
    <p 
      className="mt-2 text-secondary max-w-2xl mx-auto text-base sm:text-lg"
      data-aos="zoom-in-up"
      data-aos-duration="800"
    >
      Transforming ideas into digital experiences
    </p>
  </div>
));
Header.displayName = "Header";

const ProfileImage = memo(() => (
  <div className="flex justify-end items-center sm:p-12 sm:py-0 sm:pb-0 p-0 py-2 pb-2">
    <div 
      className="relative group" 
      data-aos="fade-up"
      data-aos-duration="1000"
    >
      <div className="relative">
        <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full overflow-hidden border border-edge-strong shadow-2xl transform transition-all duration-700 group-hover:scale-105">
          <div className="absolute inset-0 border-4 border-edge rounded-full z-20 transition-all duration-700 group-hover:border-edge-strong group-hover:scale-105" />
          <LazyImage
            src="/Photo.jpeg"
            alt="Profile"
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          />
        </div>
      </div>
    </div>
  </div>
));
ProfileImage.displayName = "ProfileImage";

const StatCard = memo(({ icon: Icon, value, label, description, animation }) => (
  <div data-aos={animation} data-aos-duration={1300} className="relative group">
    <div className="relative z-10 bg-surface rounded-2xl p-6 border border-edge transition-all duration-300 hover:border-edge-strong hover:bg-elevated h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-soft border border-edge">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <span 
          className="text-4xl font-bold text-primary"
          data-aos="fade-up-left"
          data-aos-duration="1500"
          data-aos-anchor-placement="top-bottom"
        >
          {value}
        </span>
      </div>

      <div>
        <p 
          className="text-sm uppercase tracking-wider text-primary mb-2"
          data-aos="fade-up"
          data-aos-duration="800"
          data-aos-anchor-placement="top-bottom"
        >
          {label}
        </p>
        <div className="flex items-center justify-between">
          <p 
            className="text-xs text-muted"
            data-aos="fade-up"
            data-aos-duration="1000"
            data-aos-anchor-placement="top-bottom"
          >
            {description}
          </p>
          <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  </div>
));
StatCard.displayName = "StatCard";

const AboutPage = () => {
  const [counts, setCounts] = useState(() => {
    const p = Number(localStorage.getItem("about_projects_count")) ||
              (JSON.parse(localStorage.getItem(PROJECTS_CACHE_KEY) || "[]").length) || 0;
    const c = Number(localStorage.getItem("about_certificates_count")) ||
              (JSON.parse(localStorage.getItem("certificates") || "[]").length) || 0;
    const e = Number(localStorage.getItem("about_years_experience")) || 0;
    return { projects: p, certificates: c, yearsExperience: e };
  });
  const [countVersion, setCountVersion] = useState(0);

  useEffect(() => {
    return onPortfolioDataUpdated(() => setCountVersion((v) => v + 1));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchCounts = async () => {
      try {
        const [pResult, cResult, eResult] = await Promise.all([
          supabase.from("projects").select("id", { count: "exact", head: true }),
          supabase.from("certificates").select("id", { count: "exact", head: true }),
          supabase.from("experiences").select("start_date").order("start_date", { ascending: true }).limit(1),
        ]);
        if (cancelled) return;
        const projectCount = pResult.error
          ? Number(localStorage.getItem("about_projects_count")) || 0
          : pResult.count;
        const certCount = cResult.error
          ? Number(localStorage.getItem("about_certificates_count")) || 0
          : cResult.count;
        let yearsExp = Number(localStorage.getItem("about_years_experience")) || 0;
        if (!eResult.error && eResult.data && eResult.data.length > 0) {
          const earliest = new Date(eResult.data[0].start_date);
          const now = new Date();
          yearsExp = now.getFullYear() - earliest.getFullYear() -
            (now < new Date(now.getFullYear(), earliest.getMonth(), earliest.getDate()) ? 1 : 0);
          localStorage.setItem("about_years_experience", String(yearsExp));
        }
        localStorage.setItem("about_projects_count", String(projectCount));
        localStorage.setItem("about_certificates_count", String(certCount));
        setCounts({ projects: projectCount, certificates: certCount, yearsExperience: yearsExp });
      } catch {
        if (!cancelled) {
          const p = Number(localStorage.getItem("about_projects_count")) || 0;
          const c = Number(localStorage.getItem("about_certificates_count")) || 0;
          const e = Number(localStorage.getItem("about_years_experience")) || 0;
          setCounts({ projects: p, certificates: c, yearsExperience: e });
        }
      }
    };
    fetchCounts();
    return () => { cancelled = true; };
  }, [countVersion]);

  // Memoized stats data
  const statsData = useMemo(() => [
    {
      icon: Code,
      value: counts.projects,
      label: "Total Projects",
      description: "Innovative web solutions crafted",
      animation: "fade-right",
    },
    {
      icon: Award,
      value: counts.certificates,
      label: "Certificates",
      description: "Professional skills validated",
      animation: "fade-up",
    },
    {
      icon: Globe,
      value: counts.yearsExperience,
      label: "Years of Experience",
      description: "Continuous learning journey",
      animation: "fade-left",
    },
  ], [counts.projects, counts.certificates, counts.yearsExperience]);

  return (
    <div
      className="h-auto pb-[10%] text-primary overflow-hidden px-[5%] sm:px-[5%] lg:px-[10%] scroll-mt-16" 
      id="About"
     itemScope
  itemType="https://schema.org/Person"

    >
      <Header />

      <div className="w-full mx-auto pt-8 sm:pt-12 relative">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <h2 
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary"
              data-aos="fade-right"
              data-aos-duration="1000"
            >
              Hello, I&apos;m
              <span 
                className="block mt-2 text-primary"
                data-aos="fade-right"
                data-aos-duration="1300"
                itemProp="name"
              >
                Niko Dwicahyo Widiyanto
              </span>
            </h2>
            
            <p 
              className="text-xs sm:text-sm lg:text-base text-secondary leading-relaxed text-justify pb-4 sm:pb-0"
              data-aos="fade-right"
              data-aos-duration="1500"
            >
              Fresh Graduate in Computer Science from Gunadarma University with hands-on experience in Artificial Intelligence, Full-Stack Software Development, 
              and IT Infrastructure through internships at the Financial Services Authority (OJK) and the Ministry of Foreign Affairs of the Republic of Indonesia. 
              Proficient in Python, Golang, PHP, JavaScript, and SQL, with experience developing AI-powered solutions and machine learning models, full-stack applications, 
              database and server systems across Windows and Linux environments. Skilled in translating complex technical and organizational requirements into scalable and data-driven solutions.
            </p>

               {/* Quote Section */}
      <div 
        className="relative bg-surface border border-edge rounded-2xl p-4 my-6"
        data-aos="fade-up"
        data-aos-duration="1700"
      >
        <div className="relative flex items-start gap-3">
          <div className="text-muted mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
            </svg>
          </div>
          <blockquote className="text-primary text-center lg:text-left italic font-medium text-sm">
            &quot;Leveraging AI as a professional tool, not a replacement.&quot;
          </blockquote>
        </div>
      </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 lg:gap-4 lg:px-0 w-full">
              <CVViewerButton />
              <a href="#Portofolio" className="w-full lg:w-auto">
              <button 
                data-aos="fade-up"
                data-aos-duration="1000"
                className="w-full lg:w-auto sm:px-6 py-2 sm:py-3 rounded-lg border border-edge-strong text-primary font-medium transition-all duration-300 hover:bg-soft-strong flex items-center justify-center lg:justify-start gap-2"
              >
                <Code className="w-4 h-4 sm:w-5 sm:h-5" /> View Projects
              </button>
              </a>
            </div>
          </div>

          <ProfileImage />
        </div>

        <a href="#Portofolio">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 cursor-pointer">
            {statsData.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </a>
      </div>
    </div>
  );
};

export default AboutPage;
