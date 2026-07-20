import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
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
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/12 rounded-2xl h-full">
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
    <label className="text-xs text-indigo-300/70 uppercase tracking-wider font-medium">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full bg-[#0d0d22] border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 text-sm outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
    />
  </div>
);

const SkeletonCard = () => (
  <div className="relative">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10" />
    <div className="relative bg-white/5 border border-white/12 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-white/5 animate-pulse rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/5 animate-pulse rounded w-3/4" />
          <div className="h-3 bg-white/5 animate-pulse rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-white/5 animate-pulse rounded w-2/3" />
      <div className="h-3 bg-white/5 animate-pulse rounded w-full" />
      <div className="h-3 bg-white/5 animate-pulse rounded w-4/5" />
      <div className="flex justify-end gap-2 pt-2 border-t border-white/8 mt-auto">
        <div className="w-14 h-7 bg-white/5 animate-pulse rounded-lg" />
        <div className="w-16 h-7 bg-white/5 animate-pulse rounded-lg" />
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
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0">
              {!imgLoaded && (
                <div className="w-full h-full animate-pulse bg-white/5" />
              )}
              <img
                src={experience.logo_url}
                alt={experience.company}
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0 absolute"}`}
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-indigo-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm mb-0.5 truncate">
              {experience.position}
            </h3>
            <p className="text-white/95 text-xs truncate">
              {experience.company}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{startDate} - {endDate}</span>
          </div>
          {experience.location && (
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{experience.location}</span>
            </div>
          )}
        </div>

        {experience.description && (
          <p className="text-gray-400 text-xs mb-3 line-clamp-3 leading-relaxed">
            {experience.description}
          </p>
        )}

        <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-white/8">
          <button
            onClick={() => onEdit(experience)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/10 text-xs transition-colors"
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
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-20 pointer-events-none" />
      <div className="relative bg-[#0a0a1a] border border-white/12 rounded-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-white transition-colors"
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
          <label className="text-xs text-indigo-300/70 uppercase tracking-wider font-medium">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={set("description")}
            placeholder="Describe your responsibilities and achievements..."
            rows={3}
            className="w-full bg-[#0d0d22] border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 text-sm outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs text-indigo-300/70 uppercase tracking-wider font-medium">
            Company Logo
          </label>
          <label className="flex items-center gap-4 w-full bg-[#0d0d22] border border-dashed border-white/15 rounded-xl px-4 py-4 cursor-pointer hover:border-indigo-500/40 hover:bg-white/4 transition-all">
            {preview ? (
              <img
                src={preview}
                className="h-16 w-16 object-cover rounded-lg border border-white/10"
                alt="logo preview"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                <ImageIcon className="w-5 h-5 text-gray-600" />
              </div>
            )}
            <div>
              <p className="text-sm text-gray-300">
                {preview ? "Change logo" : "Click to upload logo"}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
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
          className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
        <button type="submit" disabled={uploading} className="relative group/s">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4f52c9] to-[#8644c5] rounded-xl opacity-60 blur group-hover/s:opacity-100 transition duration-300" />
          <div className="relative flex items-center gap-2 px-5 py-2 bg-[#030014] rounded-xl border border-white/10">
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4 text-indigo-400" />
            )}
            <span className="text-sm text-gray-200">
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

  const fetchExperiences = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("experiences")
      .select("*")
      .order("start_date", { ascending: false });
    setExperiences(data || []);
    setLoading(false);
    try {
      localStorage.setItem("dashboard_experiences", JSON.stringify(data || []));
    } catch { /* storage full */ }
  };

  useEffect(() => {
    const cached = localStorage.getItem("dashboard_experiences");
    if (cached) {
      setExperiences(JSON.parse(cached));
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

  const handleCreate = async (form, file) => {
    setUploading(true);
    let logoUrl = "";
    if (file) logoUrl = await uploadLogo(file);
    await supabase.from("experiences").insert({
      company: form.company,
      position: form.position,
      description: form.description || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      location: form.location || null,
      logo_url: logoUrl,
    });
    setShowCreate(false);
    setUploading(false);
    fetchExperiences();
  };

  const handleEdit = async (form, file) => {
    setUploading(true);
    let logoUrl = editExperience.logo_url || "";
    if (file) logoUrl = await uploadLogo(file);
    await supabase
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
    setEditExperience(null);
    setUploading(false);
    fetchExperiences();
  };

  const deleteExperience = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Experience?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Delete',
      background: '#030014',
      color: '#fff',
    });
    if (!result.isConfirmed) return;
    await supabase.from("experiences").delete().eq("id", id);
    fetchExperiences();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-xl blur opacity-50" />
            <div className="relative w-9 h-9 bg-[#030014] rounded-xl border border-white/15 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Experiences
            </h1>
            <p className="text-gray-500 text-xs">
              {loading ? "Loading..." : `${experiences.length} experiences total`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="relative group shrink-0"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4f52c9] to-[#8644c5] rounded-xl opacity-50 blur group-hover:opacity-80 transition duration-300" />
          <div className="relative flex items-center gap-2 px-4 py-2.5 bg-[#030014] rounded-xl border border-white/10">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-gray-200">New Experience</span>
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
            <Briefcase className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
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
