import { useEffect, useState, useCallback } from 'react'
import { supabase } from "../../supabase";
import { isBase64DataUrl } from "../../utils/fileType";
import { FileText, Upload, Trash2, Plus, Eye } from 'lucide-react'
import Swal from 'sweetalert2'
import PDFThumbnail from "../../components/PDFThumbnail";
import PDFViewerModal from "../../components/PDFViewerModal";

const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-white/[0.06] ${className}`}>
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/12 rounded-2xl h-full">
      {children}
    </div>
  </div>
);

export default function CVDocuments() {
  const [cv, setCv] = useState(null);
  const [file, setFile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [openPdf, setOpenPdf] = useState(false);


  const fetchCV = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("cv_documents")
      .select("id,file_data,filename,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setCv(data || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCV();
  }, [fetchCV]);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setDisplayName(cv?.filename || f.name);
    if (f.type === 'application/pdf') {
      setPreview(null);
    } else {
      setPreview(URL.createObjectURL(f));
    }
  };

  const isSelectedPdf = file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf');

  const uploadCV = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const finalName = displayName.trim() || file.name;

      if (cv?.file_data && !isBase64DataUrl(cv.file_data)) {
        try {
          const url = new URL(cv.file_data);
          const pathParts = url.pathname.split('/');
          const oldFileName = pathParts[pathParts.length - 1];
          if (oldFileName && oldFileName !== finalName) {
            await supabase.storage.from('cv-documents').remove([oldFileName]);
          }
        } catch {
          console.warn('Failed to delete old CV from storage');
        }
      }

      const { error: uploadError } = await supabase.storage.from('cv-documents').upload(finalName, file, { upsert: true });

      let fileData = null;

      if (uploadError) {
        console.warn('Storage upload failed, using base64 fallback:', uploadError.message);
        const reader = new FileReader();
        fileData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        const { data } = supabase.storage.from('cv-documents').getPublicUrl(finalName);
        fileData = data.publicUrl;
      }

      if (cv?.id) {
        await supabase
          .from('cv_documents')
          .update({ file_data: fileData, filename: finalName, updated_at: new Date().toISOString() })
          .eq('id', cv.id);
      } else {
        await supabase
          .from('cv_documents')
          .insert({ file_data: fileData, filename: finalName });
      }

      setFile(null);
      setDisplayName("");
      setPreview(null);
      fetchCV();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const deleteCV = async () => {
    if (!cv) return;
    const result = await Swal.fire({
      title: 'Delete CV?',
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

    if (cv.file_data && !isBase64DataUrl(cv.file_data)) {
      try {
        const url = new URL(cv.file_data);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        if (fileName) {
          await supabase.storage.from('cv-documents').remove([fileName]);
        }
      } catch {
        console.warn('Failed to delete from storage');
      }
    }

    await supabase.from('cv_documents').delete().eq('id', cv.id);
    setCv(null);
    setFile(null);
    setPreview(null);
    fetchCV();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-xl blur opacity-50" />
          <div className="relative w-9 h-9 bg-[#030014] rounded-xl border border-white/15 flex items-center justify-center">
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">CV Document</h1>
          <p className="text-gray-500 text-xs">
            {loading ? 'Loading...' : cv ? `Last updated ${formatDate(cv.updated_at || cv.created_at)}` : 'No CV uploaded yet'}
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <div className="p-6 space-y-4">
            <ShimmerBlock className="w-48 h-5 rounded-lg" />
            <ShimmerBlock className="w-full h-48 rounded-xl" />
          </div>
        </Card>
      ) : cv ? (
        <Card>
          <div className="p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" /> Replace CV
            </h2>

            <label
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              className={`flex flex-col items-center justify-center w-full min-h-[120px] rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                dragOver ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/12 bg-white/4 hover:border-indigo-500/35 hover:bg-white/7'
              }`}
            >
              {preview ? (
                <img src={preview} alt="preview" className="max-h-32 object-contain rounded-lg p-2" />
              ) : isSelectedPdf && file ? (
                <div className="flex flex-col items-center gap-2 p-3">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{file.name}</p>
                </div>
              ) : (
                <div className="text-center space-y-2 p-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                    <Upload className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-sm text-gray-300">Click or drag a new PDF to replace</p>
                </div>
              )}
              <input type="file" accept=".pdf,application/pdf" onChange={e => handleFile(e.target.files[0])} className="hidden" />
            </label>

            {file && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider">Filename</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      placeholder="Enter filename"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] text-gray-600 truncate flex-1">Source: {file.name}</p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setFile(null); setDisplayName(""); setPreview(null) }}
                      className="px-3 py-1.5 rounded-xl border border-white/10 text-gray-500 hover:text-white text-xs transition-colors">
                      Clear
                    </button>
                    <button onClick={uploadCV} disabled={uploading} className="relative group/u">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4f52c9] to-[#8644c5] rounded-xl opacity-60 blur group-hover/u:opacity-100 transition duration-300" />
                      <div className="relative flex items-center gap-2 px-4 py-1.5 bg-[#030014] rounded-xl border border-white/10">
                        {uploading ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5 text-indigo-400" />}
                        <span className="text-xs text-gray-200">{uploading ? 'Uploading...' : 'Replace'}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/8">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-indigo-400" /> Current CV
              </h3>

              <div className="relative overflow-hidden rounded-xl border border-white/12 bg-white/4">
                <div className="cursor-pointer" onClick={() => setOpenPdf(true)}>
                  <PDFThumbnail pdfUrl={cv.file_data} />
                </div>
                <div className="absolute top-2 right-2 bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold z-[3]">
                  PDF
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap mt-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-200 truncate">{cv.filename}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded {formatDate(cv.created_at)}
                    {cv.updated_at !== cv.created_at && ` · Updated ${formatDate(cv.updated_at)}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setOpenPdf(true)}
                    className="relative group/u">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4f52c9] to-[#8644c5] rounded-xl opacity-60 blur group-hover/u:opacity-100 transition duration-300" />
                    <div className="relative flex items-center gap-2 px-4 py-1.5 bg-[#030014] rounded-xl border border-white/10">
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs text-gray-200">View</span>
                    </div>
                  </button>
                  <button onClick={deleteCV}
                    className="relative group/u">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-700 rounded-xl opacity-40 blur group-hover/u:opacity-100 transition duration-300" />
                    <div className="relative flex items-center gap-2 px-4 py-1.5 bg-[#030014] rounded-xl border border-red-500/20">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-xs text-red-300">Delete</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Upload CV
            </h2>

            <label
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              className={`flex flex-col items-center justify-center w-full min-h-[200px] rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                dragOver ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/12 bg-white/4 hover:border-indigo-500/35 hover:bg-white/7'
              }`}
            >
              {preview ? (
                <img src={preview} alt="preview" className="max-h-40 object-contain rounded-lg p-2" />
              ) : isSelectedPdf && file ? (
                <div className="flex flex-col items-center gap-3 p-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-red-400" />
                  </div>
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{file.name}</p>
                </div>
              ) : (
                <div className="text-center space-y-2 p-6">
                  <div className="w-11 h-11 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5 text-indigo-400" />
                  </div>
                  <p className="text-sm text-gray-300">Drag & drop or click to upload PDF</p>
                  <p className="text-xs text-gray-600">PDF files only</p>
                </div>
              )}
              <input type="file" accept=".pdf,application/pdf" onChange={e => handleFile(e.target.files[0])} className="hidden" />
            </label>

            {file && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider">Filename</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                      placeholder="Enter filename"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-[10px] text-gray-600 truncate flex-1">Source: {file.name}</p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setFile(null); setDisplayName(""); setPreview(null) }}
                      className="px-3 py-1.5 rounded-xl border border-white/10 text-gray-500 hover:text-white text-xs transition-colors">
                      Clear
                    </button>
                    <button onClick={uploadCV} disabled={uploading} className="relative group/u">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4f52c9] to-[#8644c5] rounded-xl opacity-60 blur group-hover/u:opacity-100 transition duration-300" />
                      <div className="relative flex items-center gap-2 px-4 py-1.5 bg-[#030014] rounded-xl border border-white/10">
                        {uploading ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5 text-indigo-400" />}
                        <span className="text-xs text-gray-200">{uploading ? 'Uploading...' : 'Upload'}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <PDFViewerModal
        pdfUrl={cv?.file_data}
        isOpen={openPdf}
        onClose={() => setOpenPdf(false)}
        title={cv?.filename || "CV Document"}
        filename={cv?.filename || "document.pdf"}
      />
    </div>
  );
}
