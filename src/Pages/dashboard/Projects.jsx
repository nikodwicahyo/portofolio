import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import Swal from 'sweetalert2';
import {
  Plus,
  Trash2,
  Upload,
  FolderGit2,
  X,
  ImageIcon,
  ExternalLink,
  Github,
  Pencil,
} from "lucide-react";

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
      <div className="w-full aspect-[16/8] bg-soft animate-pulse rounded-xl" />
      <div className="h-4 bg-soft animate-pulse rounded-lg w-2/3" />
      <div className="h-3 bg-soft animate-pulse rounded-lg w-full" />
      <div className="h-3 bg-soft animate-pulse rounded-lg w-4/5" />
      <div className="flex gap-1.5 mt-1">
        <div className="h-5 w-16 bg-soft animate-pulse rounded-full" />
        <div className="h-5 w-12 bg-soft animate-pulse rounded-full" />
        <div className="h-5 w-20 bg-soft animate-pulse rounded-full" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-edge mt-auto">
        <div className="flex gap-2">
          <div className="w-7 h-7 bg-soft animate-pulse rounded-lg" />
          <div className="w-7 h-7 bg-soft animate-pulse rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="w-14 h-7 bg-soft animate-pulse rounded-lg" />
          <div className="w-16 h-7 bg-soft animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

const ProjectCard = ({ project, onDelete, onEdit }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Card>
      <div className="p-4 flex flex-col h-full">
        {project.img && (
          <div className="w-full aspect-[16/8] rounded-xl mb-4 border border-edge overflow-hidden bg-soft">
            {!imgLoaded && (
              <div className="w-full h-full animate-pulse bg-soft" />
            )}
            <img
              src={project.img}
              alt={project.title}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0 absolute"}`}
            />
          </div>
        )}
        <h3 className="font-semibold text-primary text-sm mb-1">
          {project.title}
        </h3>
        {project.description && (
          <p className="text-secondary text-xs mb-3 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}
        {project.tech_stack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(project.tech_stack || []).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-full bg-soft-strong border border-edge-strong text-primary text-xs"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-edge">
          <div className="flex gap-2">
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg border border-edge text-muted hover:text-primary hover:border-edge-strong transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg border border-edge text-muted hover:text-primary hover:border-edge-strong transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(project)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-edge-strong text-primary hover:bg-soft-strong text-xs transition-colors"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={() => onDelete(project.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
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
        {/* Fixed header */}
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
        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  </div>
);

const ProjectForm = ({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save Project",
  uploading,
}) => {
  const [form, setForm] = useState({
    Title: initial?.title || "",
    Description: initial?.description || "",
    TechStack: Array.isArray(initial?.tech_stack)
      ? initial.tech_stack.join(", ")
      : initial?.tech_stack || "",
    Features: Array.isArray(initial?.features)
      ? initial.features.join(", ")
      : initial?.features || "",
    Link: initial?.link || "",
    Github: initial?.github || "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initial?.img || null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form, file);
      }}
      className="p-5 sm:p-6 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <InputField
            label="Project Title"
            value={form.Title}
            onChange={set("Title")}
            placeholder="e.g. My Portfolio Website"
            required
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs text-secondary uppercase tracking-wider font-medium">
            Description
          </label>
          <textarea
            value={form.Description}
            onChange={set("Description")}
            placeholder="Describe what this project does, its purpose, and impact..."
            rows={3}
            className="w-full bg-soft border border-edge rounded-xl px-4 py-2.5 text-primary placeholder-muted text-sm outline-none focus:border-edge-strong focus:ring-1 focus:ring-edge-strong transition-all resize-none"
          />
        </div>

        <InputField
          label="Tech Stack (comma separated)"
          value={form.TechStack}
          onChange={set("TechStack")}
          placeholder="e.g. React, Tailwind, Supabase"
        />
        <InputField
          label="Key Features (comma separated)"
          value={form.Features}
          onChange={set("Features")}
          placeholder="e.g. Auth, Dark mode, REST API"
        />
        <InputField
          label="Live URL"
          value={form.Link}
          onChange={set("Link")}
          placeholder="https://yourproject.com"
        />
        <InputField
          label="GitHub URL"
          value={form.Github}
          onChange={set("Github")}
          placeholder="https://github.com/username/repo"
        />

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs text-secondary uppercase tracking-wider font-medium">
            Project Image
          </label>
          <label className="flex items-center gap-4 w-full bg-soft border border-dashed border-edge-strong rounded-xl px-4 py-4 cursor-pointer hover:border-edge-strong hover:bg-soft transition-all">
            {preview ? (
              <img
                src={preview}
                className="h-16 w-24 object-cover rounded-lg border border-edge"
                alt="preview"
              />
            ) : (
              <div className="w-24 h-16 rounded-lg bg-soft flex items-center justify-center border border-edge">
                <ImageIcon className="w-5 h-5 text-faint" />
              </div>
            )}
            <div>
              <p className="text-sm text-primary">
                {preview ? "Change image" : "Click to upload image"}
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

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchProjects = async () => {
    const raw = localStorage.getItem("dashboard_projects_ts");
    if (raw && Date.now() - Number(raw) < 300000) return;
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("id,title,description,img,link,github,tech_stack,features,created_at")
      .order("created_at", { ascending: false });
    const rows = data || [];
    setProjects(rows);
    setLoading(false);
    try {
      localStorage.setItem("dashboard_projects_ts", String(Date.now()));
      localStorage.setItem("dashboard_projects", JSON.stringify(rows));
    } catch { /* storage full */ }
  };

  useEffect(() => {
    const cached = localStorage.getItem("dashboard_projects");
    if (cached) {
      try { setProjects(JSON.parse(cached)); } catch {}
      setLoading(false);
    }
    fetchProjects();
  }, []);

  const uploadImage = async (f) => {
    const fileName = `${Date.now()}-${f.name}`;
    await supabase.storage.from("project-images").upload(fileName, f);
    const { data } = supabase.storage
      .from("project-images")
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  const removeOrphanImage = async (url) => {
    if (!url) return;
    try {
      const fileName = url.split("/").pop();
      if (fileName) await supabase.storage.from("project-images").remove([fileName]);
    } catch { /* cleanup is best-effort */ }
  };

  const handleCreate = async (form, file) => {
    setUploading(true);
    let imgUrl = "";
    try {
      if (file) imgUrl = await uploadImage(file);
      const { error } = await supabase.from("projects").insert({
        title: form.Title,
        description: form.Description,
        img: imgUrl,
        tech_stack: form.TechStack.split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        features: form.Features.split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        link: form.Link,
        github: form.Github,
      });
      if (error) throw error;
      setShowCreate(false);
      fetchProjects();
    } catch (err) {
      if (imgUrl) await removeOrphanImage(imgUrl);
      Swal.fire({ icon: 'error', title: 'Failed', text: err.message, confirmButtonColor: 'var(--invert)', confirmButtonTextColor: 'var(--invert-text)', background: 'var(--elevated)', color: 'var(--primary)' });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (form, file) => {
    setUploading(true);
    let imgUrl = editProject.img || "";
    try {
      if (file) imgUrl = await uploadImage(file);
      const { error } = await supabase
        .from("projects")
        .update({
          title: form.Title,
          description: form.Description,
          img: imgUrl,
          tech_stack: form.TechStack.split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          features: form.Features.split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          link: form.Link,
          github: form.Github,
        })
        .eq("id", editProject.id);
      if (error) throw error;
      setEditProject(null);
      fetchProjects();
    } catch (err) {
      if (imgUrl && file) await removeOrphanImage(imgUrl);
      Swal.fire({ icon: 'error', title: 'Failed', text: err.message, confirmButtonColor: 'var(--invert)', confirmButtonTextColor: 'var(--invert-text)', background: 'var(--elevated)', color: 'var(--primary)' });
    } finally {
      setUploading(false);
    }
  };

  const deleteProject = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Project?',
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
    await supabase.from("projects").delete().eq("id", id);
    fetchProjects();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 bg-soft rounded-xl border border-edge flex items-center justify-center">
            <FolderGit2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              Projects
            </h1>
            <p className="text-muted text-xs">
              {loading ? "Loading..." : `${projects.length} projects total`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="relative group shrink-0"
        >
          <div className="relative flex items-center gap-2 px-4 py-2.5 bg-invert text-invert-text rounded-xl hover:bg-invert-hover transition-colors">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Project</span>
          </div>
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Add New Project" onClose={() => setShowCreate(false)}>
          <ProjectForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            submitLabel="Save Project"
            uploading={uploading}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editProject && (
        <Modal title="Edit Project" onClose={() => setEditProject(null)}>
          <ProjectForm
            initial={editProject}
            onSubmit={handleEdit}
            onCancel={() => setEditProject(null)}
            submitLabel="Update Project"
            uploading={uploading}
          />
        </Modal>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <div className="p-16 text-center">
            <FolderGit2 className="w-10 h-10 text-faint mx-auto mb-3" />
            <p className="text-muted text-sm">
              No projects yet. Create your first one!
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={deleteProject}
              onEdit={setEditProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
