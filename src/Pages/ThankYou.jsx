import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const ThankYouPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
          Thank You!
        </h1>
        <p className="text-secondary text-lg mb-8">
          Your message has been received. I&apos;ll get back to you as soon as possible.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-8 py-3 bg-invert text-invert-text rounded-xl font-semibold transition-all duration-300 hover:bg-invert-hover active:scale-[0.98]"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default ThankYouPage;
