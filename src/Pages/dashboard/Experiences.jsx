import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { notifyPortfolioChanged } from "../../utils/realtimeSync";
import {
  Plus,
  Trash2,
  Upload,
  Briefcase,
  X,
  ImageIcon,
  Pencil,
  MapPin,
  Calendar,
} from "lucide-react";
import Swal from 'sweetalert2';

const Card = ({ children, className = "" }) => (
  <div className={`relative ${className}`}>
    <div className="relative bg-surface border border-edge rounded-2xl h-full">
      {children}
    </div>
  </div>
);

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) => (
  <div className="space-y-1.5">
    <label className="text-xs text-secondary uppercase tracking-wider font-medium">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full bg-soft border border-edge rounded-xl px-4 py-2.5 text-primary placeholder-muted text-sm outline-none focus:border-edge-strong focus:ring-1 focus:ring-edge-strong transition-all"
    />
  </div>
);

const SkeletonCard = () => (
  <div className="relative">
    <div className="relative bg-surface border border-edge rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-soft animate-pulse rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-soft animate-pulse rounded w-3/4" />
          <div className="h-3 bg-soft animate-pulse rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-soft animate-pulse rounded w-2/3" />
      <div className="h-3 bg-soft animate-pulse rounded w-full" />
      <div className="h-3 bg-soft animate-pulse rounded w-4/5" />
      <div className="flex justify-end gap-2 pt-2 border-t border-edge mt-auto">
        <div className="w-14 h-7 bg-soft animate-pulse rounded-lg" />
        <div className="w-16 h-7 bg-soft animate-pulse rounded-lg" />
      </div>
    </div>
  </div>
);

const ExperienceCard = ({ experience, onDelete, onEdit }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Present";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const startDate = formatDate(experience.start_date);
  const endDate = formatDate(experience.end_date);

  return (
    <Card>
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-start gap-3 mb-3">
          {experience.logo_url ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-soft shrink-0">
              {!imgLoaded && (
                <div className="w-full h-full animate-pulse bg-soft" />
              )}
              <img
                src={experience.logo_url}
                alt={experience.company}
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0 absolute"}`}
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-soft-strong border border-edge flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-primary text-sm mb-0.5 truncate">
              {experience.position}
            </h3>
            <p className="text-primary text-xs truncate">
              {experience.company}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-secondary text-xs">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{startDate} - {endDate}</span>
          </div>
          {experience.location && (
            <div className="flex items-center gap-1.5 text-secondary text-xs">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{experience.location}</span>
            </div>
          )}
        </div>

        {experience.description && (
          <p className="text-secondary text-xs mb-3 line-clamp-3 leading-relaxed">
            {experience.description}
          </p>
        )}

        <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-edge">
          <button
            onClick={() => onEdit(experience)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-edge-strong text-primary hover:bg-soft-strong text-xs transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={() => onDelete(experience.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
    </Card>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    />
    <div
      className="relative z-10 w-full max-w-2xl flex flex-col"
      style={{ maxHeight: "calc(100vh - 24px)" }}
    >
      <div className="relative bg-elevated border border-edge rounded-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge shrink-0">
          <h2 className="text-base font-semibold text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted hover:text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  </div>
);

const ExperienceForm = ({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save Experience",
  uploading,
}) => {
  const [form, setForm] = useState({
    company: initial?.company || "",
    position: initial?.position || "",
    description: initial?.description || "",
    start_date: initial?.start_date || "",
    end_date: initial?.end_date || "",
    location: initial?.location || "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initial?.logo_url || null);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (form.end_date && form.start_date && form.end_date < form.start_date) {
      setError("End date must be after start date");
      return;
    }

    onSubmit(form, file);
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
      {error && (
        <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Company"
          value={form.company}
          onChange={set("company")}
          placeholder="e.g. Google"
          required
        />
        <InputField
          label="Position"
          value={form.position}
          onChange={set("position")}
          placeholder="e.g. Software Engineer"
          required
        />

        <InputField
          label="Start Date"
          type="date"
          value={form.start_date}
          onChange={set("start_date")}
          required
        />
        <InputField
          label="End Date"
          type="date"
          value={form.end_date}
          onChange={set("end_date")}
          placeholder="Leave empty if current position"
        />

        <InputField
          label="Location"
          value={form.location}
          onChange={set("location")}
          placeholder="e.g. Jakarta, Indonesia"
        />

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs text-secondary uppercase tracking-wider font-medium">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={set("description")}
            placeholder="Describe your responsibilities and achievements..."
            rows={3}
            className="w-full bg-soft border border-edge rounded-xl px-4 py-2.5 text-primary placeholder-muted text-sm outline-none focus:border-edge-strong focus:ring-1 focus:ring-edge-strong transition-all resize-none"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs text-secondary uppercase tracking-wider font-medium">
            Company Logo
          </label>
          <label className="flex items-center gap-4 w-full bg-soft border border-dashed border-edge-strong rounded-xl px-4 py-4 cursor-pointer hover:border-edge-strong hover:bg-soft transition-all">
            {preview ? (
              <img
                src={preview}
                className="h-16 w-16 object-cover rounded-lg border border-edge"
                alt="logo preview"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-soft flex items-center justify-center border border-edge">
                <ImageIcon className="w-5 h-5 text-faint" />
              </div>
            )}
            <div>
              <p className="text-sm text-primary">
                {preview ? "Change logo" : "Click to upload logo"}
              </p>
              <p className="text-xs text-faint mt-0.5">
                PNG, JPG, WEBP supported
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-edge text-secondary hover:text-primary text-sm transition-colors"
        >
          Cancel
        </button>
        <button type="submit" disabled={uploading} className="relative group/s">
          <div className="relative flex items-center gap-2 px-5 py-2 bg-invert text-invert-text rounded-xl hover:bg-invert-hover transition-colors">
            {uploading ? (
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {uploading ? "Saving..." : submitLabel}
            </span>
          </div>
        </button>
      </div>
    </form>
  );
};

export default function Experiences() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editExperience, setEditExperience] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchExperiences = async (force = false) => {
    const raw = localStorage.getItem("dashboard_experiences_ts");
    if (!force && raw && Date.now() - Number(raw) < 300000) return;
    setLoading(true);
    const { data } = await supabase
      .from("experiences")
      .select("id,company,position,description,start_date,end_date,location,logo_url,created_at")
      .order("start_date", { ascending: false });
    const rows = data || [];
    setExperiences(rows);
    setLoading(false);
    try {
      localStorage.setItem("dashboard_experiences_ts", String(Date.now()));
      localStorage.setItem("dashboard_experiences", JSON.stringify(rows));
    } catch { /* storage full */ }
  };

  useEffect(() => {
    const cached = localStorage.getItem("dashboard_experiences");
    if (cached) {
      try { setExperiences(JSON.parse(cached)); } catch {}
      setLoading(false);
    }
    fetchExperiences();
  }, []);

  const uploadLogo = async (f) => {
    const fileName = `${Date.now()}-${f.name}`;
    await supabase.storage.from("experience-logos").upload(fileName, f);
    const { data } = supabase.storage
      .from("experience-logos")
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  const removeOrphanLogo = async (url) => {
    if (!url) return;
    try {
      const fileName = url.split("/").pop();
      if (fileName) await supabase.storage.from("experience-logos").remove([fileName]);
    } catch { /* cleanup is best-effort */ }
  };

  const handleCreate = async (form, file) => {
    setUploading(true);
    let logoUrl = "";
    try {
      if (file) logoUrl = await uploadLogo(file);
      const { error } = await supabase.from("experiences").insert({
        company: form.company,
        position: form.position,
        description: form.description || null,
        start_date: form.start_date,
        end_date: form.end_date || null,
        location: form.location || null,
        logo_url: logoUrl,
      });
      if (error) throw error;
      setShowCreate(false);
      fetchExperiences(true);
      notifyPortfolioChanged();
    } catch (err) {
      if (logoUrl) await removeOrphanLogo(logoUrl);
      Swal.fire({ icon: 'error', title: 'Failed', text: err.message, confirmButtonColor: 'var(--invert)', confirmButtonTextColor: 'var(--invert-text)', background: 'var(--elevated)', color: 'var(--primary)' });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (form, file) => {
    setUploading(true);
    let logoUrl = editExperience.logo_url || "";
    try {
      if (file) logoUrl = await uploadLogo(file);
      const { error } = await supabase
        .from("experiences")
        .update({
          company: form.company,
          position: form.position,
          description: form.description || null,
          start_date: form.start_date,
          end_date: form.end_date || null,
          location: form.location || null,
          logo_url: logoUrl,
        })
        .eq("id", editExperience.id);
      if (error) throw error;
      setEditExperience(null);
      fetchExperiences(true);
      notifyPortfolioChanged();
    } catch (err) {
      if (logoUrl && file) await removeOrphanLogo(logoUrl);
      Swal.fire({ icon: 'error', title: 'Failed', text: err.message, confirmButtonColor: 'var(--invert)', confirmButtonTextColor: 'var(--invert-text)', background: 'var(--elevated)', color: 'var(--primary)' });
    } finally {
      setUploading(false);
    }
  };

  const deleteExperience = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Experience?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: 'var(--soft-strong)', cancelButtonTextColor: 'var(--primary)',
      confirmButtonText: 'Delete',
      background: 'var(--elevated)',
      color: 'var(--primary)',
    });
    if (!result.isConfirmed) return;
    await supabase.from("experiences").delete().eq("id", id);
    fetchExperiences(true);
    notifyPortfolioChanged();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 bg-soft rounded-xl border border-edge flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              Experiences
            </h1>
            <p className="text-muted text-xs">
              {loading ? "Loading..." : `${experiences.length} experiences total`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="relative group shrink-0"
        >
          <div className="relative flex items-center gap-2 px-4 py-2.5 bg-invert text-invert-text rounded-xl hover:bg-invert-hover transition-colors">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Experience</span>
          </div>
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Add New Experience" onClose={() => setShowCreate(false)}>
          <ExperienceForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            submitLabel="Save Experience"
            uploading={uploading}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editExperience && (
        <Modal title="Edit Experience" onClose={() => setEditExperience(null)}>
          <ExperienceForm
            initial={editExperience}
            onSubmit={handleEdit}
            onCancel={() => setEditExperience(null)}
            submitLabel="Update Experience"
            uploading={uploading}
          />
        </Modal>
      )}

      {/* Experiences Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : experiences.length === 0 ? (
        <Card>
          <div className="p-16 text-center">
            <Briefcase className="w-10 h-10 text-faint mx-auto mb-3" />
            <p className="text-muted text-sm">
              No experiences yet. Add your first one!
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {experiences.map((experience) => (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              onDelete={deleteExperience}
              onEdit={setEditExperience}
            />
          ))}
        </div>
      )}
    </div>
  );
}
