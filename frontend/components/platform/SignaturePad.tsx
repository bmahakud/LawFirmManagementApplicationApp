'use client';

import { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check, Loader2, Upload, PenTool, Image as ImageIcon } from 'lucide-react';

type Props = {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
  title?: string;
  saving?: boolean;
};

export default function SignaturePad({ onSave, onCancel, title = 'Add Signature', saving = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">Select your preferred signing method</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex px-6 pt-6">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('draw')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'draw' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <PenTool className="w-4 h-4" />
              Draw
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'upload' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {mode === 'draw' ? (
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full cursor-crosshair touch-none"
                style={{ touchAction: 'none' }}
              />
              <p className="text-sm text-gray-500 py-2 border-t border-gray-100 text-center bg-gray-50">
                Sign above using your mouse or touch screen
              </p>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50 cursor-pointer transition-colors ${uploadedImage ? 'border-purple-300' : 'border-gray-300 hover:border-purple-400'
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
                  <img src={uploadedImage} alt="Uploaded Signature" className="max-h-[150px] object-contain" />
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 mr-2"
                    >
                      <RotateCcw className="w-5 h-5 text-purple-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedImage(null);
                      }}
                      className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                    >
                      <X className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Click to upload signature image</h4>
                  <p className="text-xs text-gray-500">PNG, JPG or BMP (Recommended: Transparent PNG)</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={clearSignature}
            disabled={mode === 'draw' ? isEmpty : !uploadedImage}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={saveSignature}
              disabled={(mode === 'draw' ? isEmpty : !uploadedImage) || saving}
              className="px-6 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

