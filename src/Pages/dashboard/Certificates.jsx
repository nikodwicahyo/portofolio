import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from "../../supabase";
import { isPdfUrl, isBase64DataUrl } from "../../utils/fileType";
import { Award, Upload, Trash2, ImageIcon, Plus, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import Swal from 'sweetalert2'
import PDFThumbnail from "../../components/PDFThumbnail";
import PDFViewerModal from "../../components/PDFViewerModal";
import ImageViewerModal from "../../components/ImageViewerModal";

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

const ITEMS_PER_PAGE = 8

const Card = ({ children, className = '' }) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/12 rounded-2xl h-full">
      {children}
    </div>
  </div>
)

const CertCard = ({ cert, onDelete }) => {
  const isPdf = isPdfUrl(cert.img)
  const isBase64 = isBase64DataUrl(cert.img)
  const [imgLoaded, setImgLoaded] = useState(isPdf || isBase64)
  const [openPdf, setOpenPdf] = useState(false)
  const [openImage, setOpenImage] = useState(false)

  const handleOpen = () => {
    if (isPdf) {
      setOpenPdf(true)
    } else {
      setOpenImage(true)
    }
  }

  return (
    <>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-500" />
        <div className="relative bg-white/5 border border-white/12 rounded-2xl overflow-hidden">
          {!imgLoaded && (
            <div className="w-full aspect-[16/11.5] bg-white/5 animate-pulse" />
          )}

          {isPdf ? (
            <div
              className={`w-full cursor-pointer ${imgLoaded ? 'block' : 'hidden'}`}
              onClick={handleOpen}
            >
              <div className="relative">
                <PDFThumbnail pdfUrl={cert.img} />
                <div className="absolute top-2 right-2 bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold z-[3]">
                  PDF
                </div>
              </div>
            </div>
          ) : (
            <img
              src={cert.img}
              alt="Certificate"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
              onClick={handleOpen}
              className={`w-full aspect-[16/11.5] object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500 ${imgLoaded ? 'block' : 'hidden'}`}
            />
          )}

          {imgLoaded && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(cert.id, cert.img)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs w-full justify-center hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <PDFViewerModal
        pdfUrl={cert.img}
        isOpen={openPdf}
        onClose={() => setOpenPdf(false)}
      />

      <ImageViewerModal
        imageUrl={cert.img}
        isOpen={openImage}
        onClose={() => setOpenImage(false)}
      />
    </>
  )
}

export default function Certificates() {
  const [certs, setCerts] = useState([])
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = useMemo(() => Math.ceil(certs.length / ITEMS_PER_PAGE), [certs.length])
  const paginatedCerts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return certs.slice(start, start + ITEMS_PER_PAGE)
  }, [certs, currentPage])

  const fetchCerts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('certificates').select('*').order('created_at', { ascending: false })
    setCerts(data || [])
    setLoading(false)
    try {
      localStorage.setItem("dashboard_certificates", JSON.stringify(data || []))
    } catch { /* storage full */ }
  }, [])

  useEffect(() => {
    const cached = localStorage.getItem("dashboard_certificates")
    if (cached) {
      try {
        setCerts(JSON.parse(cached))
        setLoading(false)
      } catch { /* invalid cache */ }
    }
    fetchCerts()
  }, [fetchCerts])

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    if (f.type === 'application/pdf') {
      setPreview(null)
    } else {
      setPreview(URL.createObjectURL(f))
    }
  }

  const isSelectedPdf = file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf')

  const uploadCertificate = async () => {
    if (!file) return
    setUploading(true)
    try {
      const fileName = `cert-${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('certificate-images').upload(fileName, file)

      let imgUrl = null

      if (uploadError) {
        console.warn('Storage upload failed, using base64 fallback:', uploadError.message)
        const reader = new FileReader()
        imgUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      } else {
        const { data } = supabase.storage.from('certificate-images').getPublicUrl(fileName)
        imgUrl = data.publicUrl
      }

      const { error: insertError } = await supabase.from('certificates').insert({ img: imgUrl })
      if (insertError) {
        console.error('Insert error:', insertError)
      }

      setFile(null)
      setPreview(null)
      setCurrentPage(1)
      fetchCerts()
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const deleteCert = async (id, imgUrl) => {
    const result = await Swal.fire({
      title: 'Delete Certificate?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      confirmButtonText: 'Delete',
      background: '#030014',
      color: '#fff',
    });
    if (!result.isConfirmed) return

    if (imgUrl && !isBase64DataUrl(imgUrl)) {
      try {
        const url = new URL(imgUrl)
        const pathParts = url.pathname.split('/')
        const fileName = pathParts[pathParts.length - 1]
        if (fileName) {
          await supabase.storage.from('certificate-images').remove([fileName])
        }
      } catch {
        console.warn('Failed to delete from storage')
      }
    }

    await supabase.from('certificates').delete().eq('id', id)
    fetchCerts()
  }

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      let start = Math.max(1, currentPage - 2)
      let end = Math.min(totalPages, start + maxVisible - 1)
      if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1)
      for (let i = start; i <= end; i++) pages.push(i)
    }
    return pages
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-xl blur opacity-50" />
          <div className="relative w-9 h-9 bg-[#030014] rounded-xl border border-white/15 flex items-center justify-center">
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Certificates</h1>
          <p className="text-gray-500 text-xs">
            {loading ? 'Loading...' : `${certs.length} certificates total`}
          </p>
        </div>
      </div>

      {/* Upload Card */}
      <Card>
        <div className="p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" /> Upload Certificate
          </h2>

          <label
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            className={`flex flex-col items-center justify-center w-full min-h-[160px] rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
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
                  <ImageIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="text-sm text-gray-300">Drag & drop or click to upload</p>
                <p className="text-xs text-gray-600">PNG, JPG, WEBP, PDF supported</p>
              </div>
            )}
            <input type="file" accept="image/*,.pdf" onChange={e => handleFile(e.target.files[0])} className="hidden" />
          </label>

          {file && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-gray-400 truncate flex-1">{file.name}</p>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { setFile(null); setPreview(null) }}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-gray-500 hover:text-white text-xs transition-colors">
                  Clear
                </button>
                <button onClick={uploadCertificate} disabled={uploading} className="relative group/u">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4f52c9] to-[#8644c5] rounded-xl opacity-60 blur group-hover/u:opacity-100 transition duration-300" />
                  <div className="relative flex items-center gap-2 px-4 py-1.5 bg-[#030014] rounded-xl border border-white/10">
                    {uploading ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5 text-indigo-400" />}
                    <span className="text-xs text-gray-200">{uploading ? 'Uploading...' : 'Upload'}</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <div key={i} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10" />
              <div className="relative bg-white/5 border border-white/12 rounded-2xl overflow-hidden">
                <ShimmerBlock className="w-full aspect-[16/11.5] rounded-none" />
              </div>
            </div>
          ))}
        </div>
      ) : certs.length === 0 ? (
        <Card>
          <div className="p-16 text-center">
            <Award className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No certificates yet.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {paginatedCerts.map(cert => (
              <CertCard key={cert.id} cert={cert} onDelete={deleteCert} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
