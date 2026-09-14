import { useEffect, useState, useCallback } from 'react';

// File input + object-URL preview with automatic revoke (no leaks).
// Validates via `validate` fn; exposes error string.
export function useFilePreview(validate) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [fileError, setFileError] = useState('');

  const pick = useCallback(
    (f) => {
      if (preview) {
        try { URL.revokeObjectURL(preview); } catch { /* noop */ }
      }
      if (!f) {
        setFile(null);
        setPreview('');
        setFileError('');
        return;
      }
      const err = validate ? validate(f) : null;
      if (err) {
        setFile(null);
        setPreview('');
        setFileError(err);
        return;
      }
      setFileError('');
      setFile(f);
      try {
        setPreview(URL.createObjectURL(f));
      } catch {
        setPreview('');
      }
    },
    [preview, validate]
  );

  const reset = useCallback(() => {
    if (preview) {
      try { URL.revokeObjectURL(preview); } catch { /* noop */ }
    }
    setFile(null);
    setPreview('');
    setFileError('');
  }, [preview]);

  useEffect(
    () => () => {
      if (preview) {
        try { URL.revokeObjectURL(preview); } catch { /* noop */ }
      }
    },
    [preview]
  );

  return { file, preview, fileError, pick, reset, setPreview };
}
