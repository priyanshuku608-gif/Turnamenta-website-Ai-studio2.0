import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { uploadToImgbb } from '../../lib/imgbbUpload';

interface ImageUploadButtonProps {
  apiKey?: string;
  onUploaded: (url: string) => void;
  label?: string;
  className?: string;
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  apiKey,
  onUploaded,
  label = 'Upload Image',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous input value so the same file can be re-selected if needed
    e.target.value = '';

    if (!apiKey || !apiKey.trim()) {
      setErrorMsg('Configure ImgBB API Key in Settings first.');
      alert('Please set your ImgBB API Key in Admin Panel -> Settings -> ImgBB API Key before uploading images.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    try {
      const uploadedUrl = await uploadToImgbb(file, apiKey);
      onUploaded(uploadedUrl);
    } catch (err: any) {
      console.error('Image upload error:', err);
      const msg = err.message || 'Image upload failed';
      setErrorMsg(msg);
      alert('Upload Error: ' + msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`w-full sm:w-auto max-w-full flex flex-col ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-[#B6FF3C] text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
        title="Choose an image from device and upload via ImgBB"
      >
        {uploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 text-[#B6FF3C] animate-spin" />
            <span className="text-[#B6FF3C]">Uploading...</span>
          </>
        ) : (
          <>
            <UploadCloud className="w-3.5 h-3.5 text-[#B6FF3C]" />
            <span>{label}</span>
          </>
        )}
      </button>
      {errorMsg && (
        <span className="text-[10px] text-red-400 mt-1 max-w-full break-words" title={errorMsg}>
          {errorMsg}
        </span>
      )}
    </div>
  );
};
