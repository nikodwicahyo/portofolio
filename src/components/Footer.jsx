const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="text-center">
        <hr className="my-3 border-edge sm:mx-auto lg:my-6" />
        <span className="block text-sm pb-4 text-muted text-center">
          © {currentYear}{" "}
          Niko Dwicahyo Widiyanto. All Rights Reserved.
        </span>
    </footer>
  );
};

export default Footer;