import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import {
  Plus,
  Trash2,
  Upload,
  Boxes,
  X,
  ImageIcon,
  Pencil,
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
    <div className="relative bg-white/5 border border-white/12 rounded-2xl p-4 flex flex-col items-center gap-3">
      <div className="w-20 h-20 bg-white/5 animate-pulse rounded-2xl" />
      <div className="h-4 bg-white/5 animate-pulse rounded-lg w-2/3" />
      <div className="h-3 bg-white/5 animate-pulse rounded-lg w-1/3" />
      <div className="flex gap-2 mt-1 w-full justify-center">
        <div className="w-7 h-7 bg-white/5 animate-pulse rounded-lg" />
        <div className="w-16 h-7 bg-white/5 animate-pulse rounded-lg" />
      </div>
    </div>
  </div>
);

const TechStackCard = ({ item, onDelete, onEdit }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Card>
      <div className="p-5 flex flex-col items-center text-center h-full">
        <div className="w-20 h-20 rounded-2xl mb-4 border border-white/8 overflow-hidden bg-white/5 flex items-center justify-center">
          {item.icon ? (
            <>
              {!imgLoaded && (
                <div className="w-full h-full animate-pulse bg-white/5 absolute" />
              )}
              <img
                src={item.icon}
                alt={item.name}
                onLoad={() => setImgLoaded(true)}
                className={`w-full h-full object-contain p-2 transition-opacity duration-300 ${
                  imgLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </>
          ) : (
            <Boxes className="w-8 h-8 text-gray-600" />
          )}
        </div>
        <h3 className="font-semibold text-white text-sm mb-1">{item.name}</h3>
        <p className="text-gray-500 text-xs">Order: {item.display_order}</p>
        <div className="flex gap-2 mt-auto pt-3">
          <button
            onClick={() => onEdit(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/10 text-xs transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
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
      className="relative z-10 w-full max-w-lg flex flex-col"
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

const TechStackForm = ({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  uploading,
}) => {
  const [form, setForm] = useState({
    Name: initial?.name || "",
    DisplayOrder: initial?.display_order ?? "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initial?.icon || null);

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
            label="Name"
            value={form.Name}
            onChange={set("Name")}
            placeholder="e.g. ReactJS"
            required
          />
        </div>
        <InputField
          label="Display Order"
          value={form.DisplayOrder}
          onChange={set("DisplayOrder")}
          placeholder="e.g. 1"
          type="number"
        />
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs text-indigo-300/70 uppercase tracking-wider font-medium">
            Icon
          </label>
          <label className="flex items-center gap-4 w-full bg-[#0d0d22] border border-dashed border-white/15 rounded-xl px-4 py-4 cursor-pointer hover:border-indigo-500/40 hover:bg-white/4 transition-all">
            {preview ? (
              <img
                src={preview}
                className="h-16 w-16 object-contain rounded-lg border border-white/10 bg-white/5 p-1"
                alt="preview"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                <ImageIcon className="w-5 h-5 text-gray-600" />
              </div>
            )}
            <div>
              <p className="text-sm text-gray-300">
                {preview ? "Change icon" : "Click to upload icon"}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                SVG, PNG, WEBP recommended
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

export default function TechStack() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tech_stacks")
      .select("*")
      .order("display_order", { ascending: true });
    setItems(data || []);
    setLoading(false);
    try {
      localStorage.setItem("dashboard_tech_stacks", JSON.stringify(data || []));
    } catch { /* storage full */ }
  };

  useEffect(() => {
    const cached = localStorage.getItem("dashboard_tech_stacks");
    if (cached) {
      setItems(JSON.parse(cached));
      setLoading(false);
    }
    fetchItems();
  }, []);

  const uploadIcon = (f) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  };

  const makeRoomForOrder = async (order, excludeId = null) => {
    const { data: conflicts } = await supabase
      .from("tech_stacks")
      .select("id, display_order")
      .gte("display_order", order)
      .order("display_order", { ascending: false });
    if (!conflicts || conflicts.length === 0) return;
    const toUpdate = excludeId
      ? conflicts.filter(item => item.id !== excludeId)
      : conflicts;
    for (const item of toUpdate) {
      await supabase
        .from("tech_stacks")
        .update({ display_order: item.display_order + 1 })
        .eq("id", item.id);
    }
  };

  const handleCreate = async (form, file) => {
    setUploading(true);
    let iconUrl = "";
    if (file) iconUrl = await uploadIcon(file);
    const order = form.DisplayOrder ? parseInt(form.DisplayOrder, 10) : 0;
    await makeRoomForOrder(order);
    await supabase.from("tech_stacks").insert({
      name: form.Name,
      icon: iconUrl,
      display_order: order,
    });
    setShowCreate(false);
    setUploading(false);
    fetchItems();
  };

  const handleEdit = async (form, file) => {
    setUploading(true);
    let iconUrl = editItem.icon || "";
    if (file) iconUrl = await uploadIcon(file);
    const order = form.DisplayOrder ? parseInt(form.DisplayOrder, 10) : 0;
    const oldOrder = editItem.display_order;

    if (order !== oldOrder) {
      if (order < oldOrder) {
        const { data: toShift } = await supabase
          .from("tech_stacks")
          .select("id, display_order")
          .gte("display_order", order)
          .lt("display_order", oldOrder)
          .order("display_order", { ascending: false });
        if (toShift) {
          for (const item of toShift) {
            await supabase
              .from("tech_stacks")
              .update({ display_order: item.display_order + 1 })
              .eq("id", item.id);
          }
        }
      } else {
        const { data: toShift } = await supabase
          .from("tech_stacks")
          .select("id, display_order")
          .gt("display_order", oldOrder)
          .lte("display_order", order)
          .order("display_order", { ascending: true });
        if (toShift) {
          for (const item of toShift) {
            await supabase
              .from("tech_stacks")
              .update({ display_order: item.display_order - 1 })
              .eq("id", item.id);
          }
        }
      }
    }

    await supabase
      .from("tech_stacks")
      .update({
        name: form.Name,
        icon: iconUrl,
        display_order: order,
      })
      .eq("id", editItem.id);
    setEditItem(null);
    setUploading(false);
    fetchItems();
  };

  const deleteItem = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Tech Stack?',
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
    await supabase.from("tech_stacks").delete().eq("id", id);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-xl blur opacity-50" />
            <div className="relative w-9 h-9 bg-[#030014] rounded-xl border border-white/15 flex items-center justify-center">
              <Boxes className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Tech Stacks
            </h1>
            <p className="text-gray-500 text-xs">
              {loading ? "Loading..." : `${items.length} tech stacks total`}
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
            <span className="text-sm text-gray-200">New Tech Stack</span>
          </div>
        </button>
      </div>

      {showCreate && (
        <Modal title="Add New Tech Stack" onClose={() => setShowCreate(false)}>
          <TechStackForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            submitLabel="Save Tech Stack"
            uploading={uploading}
          />
        </Modal>
      )}

      {editItem && (
        <Modal
          title="Edit Tech Stack"
          onClose={() => setEditItem(null)}
        >
          <TechStackForm
            initial={editItem}
            onSubmit={handleEdit}
            onCancel={() => setEditItem(null)}
            submitLabel="Update Tech Stack"
            uploading={uploading}
          />
        </Modal>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <div className="p-16 text-center">
            <Boxes className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No tech stacks yet. Create your first one!
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <TechStackCard
              key={item.id}
              item={item}
              onDelete={deleteItem}
              onEdit={setEditItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
