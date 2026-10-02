import { useNavigate } from "react-router-dom";
import { goAdmin } from "../utils/goAdmin";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  return (
    <footer className="text-center relative">
        <hr className="my-3 border-edge sm:mx-auto lg:my-6" />
        <span className="block text-sm pb-1 text-muted text-center">
          © {currentYear}{" "}
          Niko Dwicahyo Widiyanto. All Rights Reserved.
        </span>
        <span className="block text-xs pb-4 text-faint text-center">
          Jakarta, Indonesia
        </span>
        {/* Hidden admin entry: invisible until hover/focus. Entry only — auth enforced by route + RLS. */}
        <button
          type="button"
          onClick={() => goAdmin(navigate)}
          aria-label="Admin login"
          className="absolute bottom-0 right-1 flex h-10 w-10 items-center justify-center opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-faint" />
        </button>
    </footer>
  );
};

export default Footer;