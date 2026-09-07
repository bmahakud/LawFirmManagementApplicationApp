'use client';

import { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check, Loader2, Upload, PenTool, Image as ImageIcon } from 'lucide-react';

type Props = {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
  title?: string;
  saving?: boolean;
  inline?: boolean;
  hideHeader?: boolean;
  defaultMode?: 'draw' | 'upload';
  hideModeSelector?: boolean;
};

export default function SignaturePad({
  onSave,
  onCancel,
  title = 'Add Signature',
  saving = false,
  inline = false,
  hideHeader = false,
  defaultMode = 'draw',
  hideModeSelector = false
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'draw' | 'upload'>(defaultMode);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 600;
      canvas.height = 200;

      // Set drawing style
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Fill with white background
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // If we had something before, we need to mark it as not empty if drawing resumed
      // but usually we clear on mode switch or keep state. Let's keep it simple.
    }
  }, [mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setIsEmpty(false);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
    } else {
      setUploadedImage(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSignature = () => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || isEmpty) return;

      // Convert canvas to base64 image
      const signatureData = canvas.toDataURL('image/png');
      onSave(signatureData);
    } else {
      if (!uploadedImage) return;
      onSave(uploadedImage);
    }
  };

  const innerContent = (
    <div className={`bg-white rounded-xl ${inline ? 'w-full border border-gray-200 shadow-xs' : 'shadow-2xl max-w-2xl w-full'}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Select your preferred signing method</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Mode Selector */}
      {!hideModeSelector && (
        <div className="flex px-5 pt-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('draw')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'draw' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Draw
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'upload' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="p-4 sm:p-5">
        {mode === 'draw' ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white shadow-inner">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full cursor-crosshair touch-none h-44"
              style={{ touchAction: 'none' }}
            />
            <p className="text-xs text-gray-400 py-1.5 border-t border-gray-100 text-center bg-gray-50 font-medium">
              Sign above using your mouse, stylus or finger
            </p>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 cursor-pointer transition-colors ${
              uploadedImage ? 'border-indigo-300' : 'border-gray-300 hover:border-indigo-400'
            }`}
            onClick={() => !uploadedImage && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />

            {uploadedImage ? (
              <div className="relative group">
                <img src={uploadedImage} alt="Uploaded Signature" className="max-h-[140px] object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 text-indigo-600"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedImage(null);
                    }}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-0.5">Click to upload signature image</h4>
                <p className="text-[11px] text-gray-500">PNG, JPG or WebP (Transparent background recommended)</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/80 rounded-b-xl">
        <button
          type="button"
          onClick={clearSignature}
          disabled={mode === 'draw' ? isEmpty : !uploadedImage}
          className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 disabled:opacity-40 transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveSignature}
            disabled={(mode === 'draw' ? isEmpty : !uploadedImage) || saving}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all active:scale-95"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Save Signature
          </button>
        </div>
      </div>
    </div>
  );

  if (inline) {
    return innerContent;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      {innerContent}
    </div>
  );
}

