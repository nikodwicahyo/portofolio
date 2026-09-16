import { memo } from "react";
import LazyImage from "./LazyImage";
import { optimizedImageUrl } from "../utils/image";

const TechStackIcon = memo(({ TechStackIcon, Language }) => {
  const src = optimizedImageUrl(TechStackIcon, { width: 192, quality: 70 });
  return (
    <div className="group p-4 sm:p-6 rounded-2xl bg-surface border border-edge hover:border-edge-strong hover:bg-elevated transition-all duration-300 ease-in-out flex flex-col items-center justify-center gap-2 sm:gap-3 hover:-translate-y-0.5 cursor-pointer">
      <LazyImage
        src={src}
        fallbackSrc={TechStackIcon}
        alt={`${Language} icon`}
        loading="lazy"
        className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 transform transition-transform duration-300 group-hover:scale-110"
      />
      <span className="text-primary font-medium text-xs sm:text-sm md:text-base tracking-wide group-hover:text-primary transition-colors duration-300 text-center leading-tight">
        {Language}
      </span>
    </div>
  );
});
TechStackIcon.displayName = "TechStackIcon";

export default TechStackIcon;
