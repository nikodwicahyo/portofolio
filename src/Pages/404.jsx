import { Home, ArrowLeft, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const goBack = () => {
    // Direct entry has no history — fall back to home instead of a dead button.
    try {
      if (window.history.length > 1) navigate(-1);
      else navigate('/');
    } catch { navigate('/'); }
  };
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
          <div className="w-24 h-1 bg-soft-strong mx-auto rounded-full"></div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-primary mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-secondary max-w-md mx-auto leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Explore my work or head back home.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-6 py-3 bg-soft border border-edge text-primary rounded-xl hover:bg-soft-strong transition-all duration-300 text-sm"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 bg-invert text-invert-text font-medium rounded-xl hover:bg-invert-hover transition-all duration-300 text-sm"
          >
            <Home size={20} />
            Home
          </Link>

          <a
            href="/#Portofolio"
            className="flex items-center gap-2 px-6 py-3 bg-soft border border-edge text-primary rounded-xl hover:bg-soft-strong transition-all duration-300 text-sm"
          >
            <Briefcase size={20} />
            My Experiences
          </a>
        </div>
      </div>
    </div>
  );
}
