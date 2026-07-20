import { memo } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, ArrowRight } from "lucide-react";
import { toSlug } from "../utils/slug";
import LazyImage from "./LazyImage";

const CardProject = memo(({ Img, Title, Description, Link: ProjectLink, id }) => {
  return (
    <div className="group relative w-full">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-lg border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50 group-hover:opacity-70 transition-opacity duration-300" />

        <div className="relative p-4 sm:p-5 z-10">
          <div className="relative overflow-hidden rounded-lg">
            <LazyImage
              src={Img}
              alt={Title}
              className="w-full h-full object-cover aspect-[16/8] transform group-hover:scale-105"
            />
          </div>

          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
            <h3 className="text-base sm:text-xl font-semibold bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
              {Title}
            </h3>

            <p className="text-gray-300/80 text-xs sm:text-sm leading-relaxed line-clamp-2">
              {Description}
            </p>

            <div className="pt-3 sm:pt-4 flex items-center justify-between gap-2 flex-wrap">
              {ProjectLink ? (
                <a
                  href={ProjectLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 sm:gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-200 text-xs sm:text-sm"
                >
                  <span className="font-medium">Live Demo</span>
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
              ) : (
                <span className="text-gray-500 text-xs sm:text-sm">Demo Not Available</span>
              )}

              {id ? (
                <Link
                  to={`/project/${toSlug(Title)}`}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/90 transition-all duration-200 hover:scale-105 active:scale-95 text-xs sm:text-sm"
                >
                  <span className="font-medium">Details</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              ) : (
                <span className="text-gray-500 text-xs sm:text-sm">Details Not Available</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CardProject;
