import { useEffect, useState, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Code2,
  Star,
  ChevronRight,
  Layers,
  Layout,
  Globe,
  Package,
  Cpu,
  Code,
} from "lucide-react";
import Swal from "sweetalert2";
import { getSupabase } from "../supabase";
import { normalizeSlug, toSlug } from "../utils/slug";
import { safeExternalUrl } from "../utils/fileType";
import { fullHdUrl, projectDetailUrl, projectSrcSet } from "../utils/image";
import { PROJECTS_CACHE_KEY } from "../utils/portfolioPrefetch";
import { onPortfolioDataUpdated } from "../utils/realtimeSync";
import ImageViewerModal from "./ImageViewerModal";

const TECH_ICONS = {
  React: Globe,
  Tailwind: Layout,
  Express: Cpu,
  Python: Code,
  Javascript: Code,
  HTML: Code,
  CSS: Code,
  default: Package,
};

const TechBadge = ({ tech }) => {
  const Icon = TECH_ICONS[tech] || TECH_ICONS["default"];
  return (
    <div className="group relative overflow-hidden px-3 py-2 md:px-4 md:py-2.5 bg-soft rounded-xl border border-edge hover:border-edge-strong transition-all duration-300 cursor-default">
      <div className="relative flex items-center gap-1.5 md:gap-2">
        <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary group-hover:text-primary transition-colors" />
        <span className="text-xs md:text-sm font-medium text-primary group-hover:text-primary transition-colors">
          {tech}
        </span>
      </div>
    </div>
  );
};

const FeatureItem = ({ feature }) => {
  return (
    <li className="group flex items-start space-x-3 p-2.5 md:p-3.5 rounded-xl hover:bg-soft transition-all duration-300 border border-transparent hover:border-edge">
      <div className="relative mt-2">
        <div className="relative w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-zinc-400 group-hover:bg-primary group-hover:scale-125 transition-transform duration-300" />
      </div>
      <span className="text-sm md:text-base text-primary group-hover:text-primary transition-colors">
        {feature}
      </span>
    </li>
  );
};

const ProjectStats = ({ project }) => {
  const techStackCount = project?.tech_stack?.length || 0;
  const featuresCount = project?.features?.length || 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 p-3 md:p-4 bg-surface rounded-xl border border-edge">
      <div className="relative z-10 flex items-center space-x-2 md:space-x-3 bg-soft p-2 md:p-3 rounded-lg border border-edge transition-all duration-300 hover:border-edge-strong hover:bg-soft-strong">
        <div className="bg-soft-strong p-1.5 md:p-2 rounded-full">
          <Code2
            className="text-primary w-4 h-4 md:w-6 md:h-6"
            strokeWidth={1.5}
          />
        </div>
        <div className="flex-grow">
          <div className="text-lg md:text-xl font-semibold text-primary">
            {techStackCount}
          </div>
          <div className="text-[10px] md:text-xs text-muted">
            Total Technology
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center space-x-2 md:space-x-3 bg-soft p-2 md:p-3 rounded-lg border border-edge transition-all duration-300 hover:border-edge-strong hover:bg-soft-strong">
        <div className="bg-soft-strong p-1.5 md:p-2 rounded-full">
          <Layers
            className="text-primary w-4 h-4 md:w-6 md:h-6"
            strokeWidth={1.5}
          />
        </div>
        <div className="flex-grow">
          <div className="text-lg md:text-xl font-semibold text-primary">
            {featuresCount}
          </div>
          <div className="text-[10px] md:text-xs text-muted">
            Key Features
          </div>
        </div>
      </div>
    </div>
  );
};

const showUnavailable = (title, text) => {
  Swal.fire({
    icon: "info",
    title,
    text,
    confirmButtonText: "Got it",
    confirmButtonColor: 'var(--invert)',
    background: 'var(--elevated)',
    color: 'var(--primary)',
  });
};

const ProjectActionButton = ({ href, onClick, className, icon: Icon, label }) => {
  const safeHref = safeExternalUrl(href);
  const content = (
    <>
      <Icon className="relative w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform" />
      <span className="relative font-medium">{label}</span>
    </>
  );
  const shared = `group relative inline-flex items-center space-x-1.5 md:space-x-2 px-4 md:px-8 py-2.5 md:py-4 font-medium rounded-xl transition-all duration-300 text-sm md:text-base ${className}`;
  if (safeHref) {
    return (
      <a href={safeHref} target="_blank" rel="noopener noreferrer" className={shared}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={shared}>
      {content}
    </button>
  );
};

const ProjectDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(false);
  const reqId = useRef(0);
  const findProject = useCallback((projects) => {
    const target = normalizeSlug(slug);
    return projects.find((p) => toSlug(p.title) === target);
  }, [slug]);

  const goBack = () => {
    try { sessionStorage.setItem('welcomeShown', '1'); } catch { /* best-effort */ }
    if (location.key === "default") {
      sessionStorage.setItem('scrollToPortfolio', 'true');
      navigate("/");
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;
    setLoading(true);

    const applyProject = (p) => {
      if (cancelled) return;
      setProject(p);
    };

    let storedProjects = [];
    let cacheFresh = false;
    try {
      const raw = localStorage.getItem(PROJECTS_CACHE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) {
          storedProjects = p;
        } else if (Array.isArray(p.data)) {
          storedProjects = p.data;
          cacheFresh = p.data.length > 0 && (Date.now() - p.timestamp < 86400000);
        }
      }
    } catch { storedProjects = []; }
    const cached = findProject(storedProjects);
    if (cached) {
      applyProject(cached);
      setLoading(false);
    }
    const fetchProjects = async () => {
      const id = ++reqId.current;
      const sb = getSupabase();
      if (!sb) { if (!cancelled) setLoading(false); return; }
      try {
        const { data, error } = await sb
          .from("projects")
          .select("id,title,description,img,link,github,tech_stack,features")
          .order("id", { ascending: false });

        if (error) throw error;

        if (cancelled || id !== reqId.current) return;
        if (data) {
          const found = findProject(data);
          if (found) applyProject(found);
          try {
            localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
          } catch { /* storage full */ }
        }
      } catch (err) {
        if (cancelled || id !== reqId.current) return;
        console.error("Error fetching project:", err.message);
      } finally {
        if (!cancelled && id === reqId.current) setLoading(false);
      }
    };

    // ponytail: fresh cache = skip network fetch, keep paint identical
    if (!(cached && cacheFresh)) fetchProjects();
    else if (!cancelled) setLoading(false);
    const unsub = onPortfolioDataUpdated((table) => {
      if (table === "projects") fetchProjects();
    });
    return () => { cancelled = true; unsub(); };
  }, [slug, findProject]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 md:w-24 md:h-24 mx-auto border-4 border-edge-strong border-t-primary rounded-full animate-spin" />
          <h2 className="text-xl md:text-3xl font-bold text-primary">
            Loading Project...
          </h2>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 md:w-24 md:h-24 mx-auto rounded-full bg-soft flex items-center justify-center">
            <Code2 className="w-8 h-8 md:w-12 md:h-12 text-muted" />
          </div>
          <h2 className="text-xl md:text-3xl font-bold text-primary">
            Project Not Found
          </h2>
          <p className="text-secondary text-sm md:text-base">
            The project you are looking for does not exist or has been removed.
          </p>
          <button
            onClick={goBack}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-soft hover:bg-soft-strong text-primary rounded-xl transition-all duration-300 border border-edge hover:border-edge-strong"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  const projectUrl = `https://nikodwicahyo.vercel.app/project/${toSlug(project.title)}`;

  return (
    <>
      <Helmet>
        <title>{project.title} - Niko Dwicahyo Widiyanto</title>
        <meta
          name="description"
          content={
            project.description
              ? project.description.slice(0, 155)
              : `Project ${project.title} by Niko Dwicahyo Widiyanto — Full-Stack Web Developer and AI Engineer.`
          }
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={projectUrl} />
        <meta
          property="og:title"
          content={`${project.title} — Niko Dwicahyo Widiyanto`}
        />
        <meta
          property="og:description"
          content={project.description?.slice(0, 155)}
        />
        <meta property="og:url" content={projectUrl} />
        <meta property="og:type" content="article" />
        {project.img && <meta property="og:image" content={fullHdUrl(project.img)} />}
        {project.img && <meta property="og:image:alt" content={project.title} />}
        {project.img && <link rel="preload" as="image" href={projectDetailUrl(project.img)} imageSrcSet={projectSrcSet(project.img, [960, 1280, 1600])} imageSizes="(max-width: 1024px) 100vw, 50vw" />}
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.title,
          description: project.description,
          url: projectUrl,
          author: {
            '@type': 'Person',
            name: 'Niko Dwicahyo Widiyanto',
            url: 'https://nikodwicahyo.vercel.app',
          },
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-bg px-[2%] sm:px-0 relative overflow-hidden">
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
            <div className="flex items-center space-x-2 md:space-x-4 mb-8 md:mb-12 animate-fadeIn">
              <button
                onClick={goBack}
                className="group inline-flex items-center space-x-1.5 md:space-x-2 px-3 md:px-5 py-2 md:py-2.5 bg-soft rounded-xl text-primary hover:bg-soft-strong transition-all duration-300 border border-edge hover:border-edge-strong text-sm md:text-base"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-1 md:space-x-2 text-sm md:text-base text-muted">
                <span>Projects</span>
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-primary truncate">{project.title}</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 md:gap-16">
              <div className="space-y-6 md:space-y-10 animate-slideInLeft">
                <div className="space-y-4 md:space-y-6">
                  <h1 className="text-3xl md:text-6xl font-bold text-primary leading-tight">
{project.title}
                  </h1>
                  <div className="relative h-1 w-16 md:w-24">
                    <div className="absolute inset-0 bg-soft-strong rounded-full" />
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-base md:text-lg text-secondary leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <ProjectStats project={project} />

                <div className="flex flex-wrap gap-3 md:gap-4">
                  <ProjectActionButton
                    href={project.link}
                    onClick={() => showUnavailable("Live Demo Not Available", "Demo for this project is not available to the public")}
                    className="bg-invert text-invert-text hover:bg-invert-hover"
                    icon={ExternalLink}
                    label="Live Demo"
                  />

                  <ProjectActionButton
                    href={project.github && project.github !== "Private" ? project.github : null}
                    onClick={() => showUnavailable(
                      project.github === "Private" ? "Source Code Private" : "GitHub Not Available",
                      project.github === "Private" ? "Sorry, the source code for this project is private." : "The GitHub link for this project is not available."
                    )}
                    className="bg-soft text-primary hover:bg-soft-strong border border-edge-strong"
                    icon={Github}
                    label="Github"
                  />
                </div>

                <div className="space-y-4 md:space-y-6">
                  <h3 className="text-lg md:text-xl font-semibold text-primary mt-[3rem] md:mt-0 flex items-center gap-2 md:gap-3">
                    <Code2 className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
                    Technologies Used
                  </h3>
                  {project.tech_stack && project.tech_stack.length > 0 ? (
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {(project.tech_stack || []).map((tech, index) => (
                        <TechBadge key={index} tech={tech} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm md:text-base text-muted opacity-50">
                      No technologies added.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6 md:space-y-10 animate-slideInRight">
                <div className="relative rounded-2xl overflow-hidden border border-edge shadow-2xl group">
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <img
                    src={projectDetailUrl(project.img)}
                    srcSet={projectSrcSet(project.img, [960, 1280, 1600])}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    alt={project.title}
                    loading="eager"
                    decoding="async"
                    onClick={() => project.img && setLightbox(true)}
                    onError={(e) => {
                      // Resilient: transform endpoint unavailable → original URL.
                      const t = e.currentTarget;
                      if (t.src !== project.img) {
                        t.removeAttribute('srcset');
                        t.src = project.img;
                      }
                    }}
                    className="w-full h-auto block cursor-zoom-in"

                  />
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-edge transition-colors duration-300 rounded-2xl pointer-events-none" />
                </div>

                <div className="bg-soft rounded-2xl p-8 border border-edge space-y-6 hover:border-edge-strong transition-colors duration-300 group">
                  <h3 className="text-xl font-semibold text-primary flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-400 group-hover:rotate-[20deg] transition-transform duration-300" />
                    Key Features
                  </h3>
                  {(project.features || []).length > 0 ? (
                    <ul className="list-none space-y-2">
                      {(project.features || []).map((feature, index) => (
                        <FeatureItem key={index} feature={feature} />
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted opacity-50">
                      No features added.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {project.img && (
        <ImageViewerModal
          imageUrl={fullHdUrl(project.img)}
          isOpen={lightbox}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  );
};

export default ProjectDetails;
