import { memo } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, ArrowRight } from "lucide-react";
import { toSlug } from "../utils/slug";
import LazyImage from "./LazyImage";

const CardProject = memo(({ Img, Title, Description, Link: ProjectLink, id }) => {
  return (
    <div className="group relative w-full">
      <div className="relative overflow-hidden rounded-xl bg-surface border border-edge transition-all duration-300 hover:border-edge-strong hover:bg-elevated">
        <div className="relative p-4 sm:p-5 z-10">
          <div className="relative overflow-hidden rounded-lg">
            <LazyImage
              src={Img}
              alt={Title}
              className="w-full h-full object-cover aspect-[16/8] transform group-hover:scale-105"
            />
          </div>

          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
            <h3 className="text-base sm:text-xl font-semibold text-primary leading-tight">
              {Title}
            </h3>

            <p className="text-secondary text-xs sm:text-sm leading-relaxed line-clamp-2">
              {Description}
            </p>

            <div className="pt-3 sm:pt-4 flex items-center justify-between gap-2 flex-wrap">
              {ProjectLink ? (
                <a
                  href={ProjectLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 sm:gap-2 text-primary hover:text-primary transition-colors duration-200 text-xs sm:text-sm"
                >
                  <span className="font-medium">Live Demo</span>
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
              ) : (
                <span className="text-faint text-xs sm:text-sm">Demo Not Available</span>
              )}

              {id ? (
                <Link
                  to={`/project/${toSlug(Title)}`}
                  onClick={() => sessionStorage.setItem('scrollToPortfolio', 'true')}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-soft hover:bg-soft-strong text-primary transition-all duration-200 hover:border-edge-strong border border-edge text-xs sm:text-sm"
                >
                  <span className="font-medium">Details</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              ) : (
                <span className="text-faint text-xs sm:text-sm">Details Not Available</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CardProject;
