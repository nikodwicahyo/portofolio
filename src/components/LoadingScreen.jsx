const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="w-12 h-12 rounded-full border-4 border-edge border-t-primary animate-spin"></div>
        <span className="text-secondary text-sm">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingScreen;
