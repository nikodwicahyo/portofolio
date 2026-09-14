// Shared dashboard primitives — replaces per-file Card/Input/Modal/Skeleton/Header copies.
// ponytail: confirmDelete/notifyChanged live in utils/dashboard.js (fast-refresh).
export const Card = ({ children, className = '' }) => (
  <div className={`relative ${className}`}>
    <div className="relative bg-surface border border-edge rounded-2xl h-full">{children}</div>
  </div>
);

export const DashboardInput = ({ label, ...props }) => (
  <label className="block">
    <span className="block text-xs font-medium text-secondary mb-1.5">{label}</span>
    <input
      {...props}
      className="w-full px-3 py-2 text-sm bg-soft border border-edge rounded-xl text-primary placeholder:text-faint outline-none focus:border-edge-strong transition-colors"
    />
  </label>
);

export const DashboardHeader = ({ icon: Icon, title, count, action }) => (
  <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
    <div className="flex items-center gap-3">
      <div className="relative w-9 h-9 bg-soft rounded-xl border border-edge flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">{title}</h1>
        <p className="text-xs text-muted">
          {count} item{count === 1 ? '' : 's'}
        </p>
      </div>
    </div>
    {action}
  </div>
);

export const Spinner = ({ className = 'w-6 h-6' }) => (
  <div className={`${className} border-2 border-edge-strong border-t-primary rounded-full animate-spin`} />
);

export const EmptyState = ({ message = 'No items yet.' }) => (
  <div className="text-center py-12">
    <p className="text-sm text-muted">{message}</p>
  </div>
);
