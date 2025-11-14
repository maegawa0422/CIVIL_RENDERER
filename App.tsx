
import React, { useState, useCallback, ChangeEvent, useRef, useEffect, useLayoutEffect } from 'react';
import { renderImage, reRenderImage, Material } from './services/geminiService';

// --- Helper Functions ---
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error("Invalid data URL");
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

// --- Icons ---
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);
const Loader: React.FC = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
const WandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-3.198 3.198M5.63 21a3 3 0 0 0 3.198-3.198M16.122 9.53a3 3 0 0 0-3.198-3.198M21 5.63a3 3 0 0 0-3.198 3.198M18.37 5.63l-1.414 1.414M5.63 18.37l-1.414 1.414M12 6.01V4.5m0 15v-1.5m8.37-12.37-1.414-1.414M3.63 18.37l-1.414-1.414M6.01 12H4.5m15 0h-1.5" />
  </svg>
);
const SquaresPlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);
const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);
const CropIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9M20.25 20.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
);
// Drawing Tool Icons
const SelectIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" />
  </svg>
);
const PenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
    </svg>
);
const LineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15" />
    </svg>
);
const RectangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5H5.25A2.25 2.25 0 0 0 3 6.75v10.5A2.25 2.25 0 0 0 5.25 19.5h13.5A2.25 2.25 0 0 0 21 16.5V6.75A2.25 2.25 0 0 0 18.75 4.5H15m0 0h-6m6 0v6m-6-6v6" />
    </svg>
);
const TextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0a8.25 8.25 0 0 0 0 1.5M4.5 12a8.25 8.25 0 0 1 0-1.5M19.5 12a8.25 8.25 0 0 0 0-1.5M19.5 12a8.25 8.25 0 0 1 0 1.5m-15 0a8.25 8.25 0 0 0 0-1.5" />
    </svg>
);
const UndoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
  </svg>
);
const RedoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
  </svg>
);
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);


// --- Component: ImageInputPanel ---
interface ImageInputPanelProps {
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  imagePreview: string | null;
  prompt: string;
  setPrompt: (prompt: string) => void;
  materials: Material[];
  onMaterialsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveMaterial: (id: string) => void;
  onMaterialNameChange: (id: string, name: string) => void;
  onRender: () => void;
  isLoading: boolean;
  onStartEdit: () => void;
}

const ImageInputPanel: React.FC<ImageInputPanelProps> = ({ onImageChange, imagePreview, prompt, setPrompt, materials, onMaterialsChange, onRemoveMaterial, onMaterialNameChange, onRender, isLoading, onStartEdit }) => {
  const [isDraggingBase, setIsDraggingBase] = useState(false);
  const [isDraggingMaterial, setIsDraggingMaterial] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleBaseDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingBase(true);
  };
  const handleBaseDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingBase(false);
  };
  const handleBaseDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingBase(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const syntheticEvent = {
            target: { files: e.dataTransfer.files },
        } as unknown as ChangeEvent<HTMLInputElement>;
        onImageChange(syntheticEvent);
    }
  };

  const handleMaterialDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMaterial(true);
  };
  const handleMaterialDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMaterial(false);
  };
  const handleMaterialDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMaterial(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const syntheticEvent = {
            target: { files: e.dataTransfer.files },
        } as unknown as ChangeEvent<HTMLInputElement>;
        onMaterialsChange(syntheticEvent);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800/50 rounded-2xl p-4 md:p-6 space-y-4">
      <div className="flex-grow flex flex-col space-y-4 overflow-y-auto">
        {/* Base Image Upload */}
         <div>
            <p className="block text-sm font-medium text-slate-300 mb-2">Base Image</p>
            <div
                className="w-full relative group"
                onDragOver={handleDragOver}
                onDragEnter={handleBaseDragEnter}
                onDragLeave={handleBaseDragLeave}
                onDrop={handleBaseDrop}
            >
                <label
                    htmlFor="image-upload"
                    className={`cursor-pointer w-full aspect-video rounded-lg border-2 border-dashed flex flex-col justify-center items-center transition-colors ${isDraggingBase ? 'border-indigo-400 bg-slate-800 ring-4 ring-indigo-500/20' : imagePreview ? 'border-indigo-500/50' : 'border-slate-600 hover:border-indigo-500 hover:bg-slate-800'}`}
                >
                    {imagePreview && !isDraggingBase ? (
                        <img src={imagePreview} alt="Uploaded preview" className="w-full h-full object-contain rounded-lg" />
                    ) : (
                        <div className="text-center p-4">
                            <UploadIcon className="mx-auto h-10 w-10 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                            <p className="mt-2 text-sm font-semibold text-slate-300 group-hover:text-indigo-300">
                                {isDraggingBase ? 'Drop to upload' : 'Click to upload or drag & drop'}
                            </p>
                            <p className="text-xs text-slate-500">Sketch, 3D model, or any image</p>
                        </div>
                    )}
                </label>
                {imagePreview && (
                    <button onClick={onStartEdit} className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-900/70 text-white font-semibold py-1.5 px-3 rounded-full transition-all duration-200 backdrop-blur-sm border border-white/20 hover:bg-slate-800/80 opacity-0 group-hover:opacity-100">
                       <EditIcon className="w-4 h-4"/> Edit
                    </button>
                )}
            </div>
            <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={onImageChange} />
        </div>
        
        {/* Material Images Upload */}
        <div>
          <label htmlFor="material-upload" className="block text-sm font-medium text-slate-300 mb-2 cursor-pointer">Material Images (Optional)</label>
          {materials.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-2">
              {materials.map((material) => (
                <div key={material.id} className="flex flex-col gap-2">
                  <div className="relative group aspect-square">
                    <img src={URL.createObjectURL(material.file)} alt={material.name} className="w-full h-full object-cover rounded-md" />
                    <button onClick={() => onRemoveMaterial(material.id)} className="absolute top-1 right-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                      <XCircleIcon className="w-5 h-5"/>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={material.name}
                    onChange={(e) => onMaterialNameChange(material.id, e.target.value)}
                    placeholder="e.g., Concrete"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-md p-1.5 text-xs text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    aria-label={`Material name for ${material.file.name}`}
                  />
                </div>
              ))}
            </div>
          )}
          <label
            htmlFor="material-upload"
            className={`cursor-pointer group w-full aspect-[2/1] rounded-lg border-2 border-dashed flex flex-col justify-center items-center transition-colors text-center p-4 ${isDraggingMaterial ? 'border-indigo-400 bg-slate-800 ring-4 ring-indigo-500/20' : 'border-slate-600 hover:border-indigo-500 hover:bg-slate-800'}`}
            onDragOver={handleDragOver}
            onDragEnter={handleMaterialDragEnter}
            onDragLeave={handleMaterialDragLeave}
            onDrop={handleMaterialDrop}
          >
             <SquaresPlusIcon className="mx-auto h-8 w-8 text-slate-500 group-hover:text-indigo-400 transition-colors" />
             <p className="mt-2 text-sm font-semibold text-slate-300 group-hover:text-indigo-300">
                {isDraggingMaterial ? 'Drop to add materials' : 'Add Materials'}
             </p>
          </label>
          <input id="material-upload" type="file" multiple className="hidden" accept="image/*" onChange={onMaterialsChange} />
        </div>

        {/* Prompt */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-2">Prompt</label>
          <textarea id="prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A photorealistic render of a modern bridge, daytime lighting, clear sky..." className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none" />
        </div>
      </div>
      <div className="flex-shrink-0">
         <button onClick={onRender} disabled={!imagePreview || !prompt || isLoading} className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none">
          {isLoading ? <><Loader /> Rendering...</> : 'Render Photorealistic Image'}
        </button>
      </div>
    </div>
  );
};

// --- Component: ImageOutputPanel ---
interface ImageOutputPanelProps {
  generatedImage: string | null;
  isLoading: boolean;
  error: string | null;
  onReRender: () => Promise<void>;
  isReRendering: boolean;
  checkbackFile: File | null;
  setCheckbackFile: (file: File | null) => void;
  checkbackPreview: string | null;
  setCheckbackPreview: (url: string | null) => void;
  reRenderPrompt: string;
  setReRenderPrompt: (prompt: string) => void;
  onDownload: (resolution: string) => void;
  onStartEdit: () => void;
  onStartCrop: () => void;
}

const ImageOutputPanel: React.FC<ImageOutputPanelProps> = ({ generatedImage, isLoading, error, onReRender, isReRendering, checkbackFile, setCheckbackFile, checkbackPreview, setCheckbackPreview, reRenderPrompt, setReRenderPrompt, onDownload, onStartEdit, onStartCrop }) => {
    const [isDraggingCheckback, setIsDraggingCheckback] = useState(false);

    const processCheckbackFile = (file: File) => {
      if (file) {
        setCheckbackFile(file);
        setCheckbackPreview(URL.createObjectURL(file));
      }
    };

    const handleCheckbackChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            processCheckbackFile(event.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleCheckbackDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingCheckback(true);
    };

    const handleCheckbackDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingCheckback(false);
    };

    const handleCheckbackDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingCheckback(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processCheckbackFile(e.dataTransfer.files[0]);
        }
    };
    
    return (
        <div className="w-full h-full bg-slate-800/50 rounded-2xl flex flex-col justify-start items-center p-4 md:p-6 relative overflow-hidden space-y-4">
            <div className="w-full flex-grow flex justify-center items-center relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-900/50 flex flex-col justify-center items-center backdrop-blur-sm z-10">
                        <div className="w-24 h-24 border-4 border-dashed border-indigo-400/50 rounded-full animate-spin"></div>
                        <p className="text-slate-300 font-semibold mt-6">Rendering your vision...</p>
                        <p className="text-slate-400 text-sm mt-1">This might take a moment.</p>
                    </div>
                )}
                {error && !isLoading && (
                    <div className="text-center bg-red-900/50 border border-red-700 rounded-lg p-6">
                        <h3 className="text-red-300 font-bold text-lg">Rendering Failed</h3>
                        <p className="text-red-400 mt-2 text-sm max-w-md">{error}</p>
                    </div>
                )}
                {!isLoading && !error && !generatedImage && (
                    <div className="text-center">
                        <WandIcon className="mx-auto h-16 w-16 text-slate-600"/>
                        <h2 className="mt-4 text-xl font-bold text-slate-300">Your masterpiece will appear here</h2>
                        <p className="mt-1 text-sm text-slate-500">Upload an image and write a prompt to begin.</p>
                    </div>
                )}
                {generatedImage && (
                    <img src={generatedImage} alt="Rendered result" className="w-full h-full object-contain rounded-lg transition-opacity duration-500 opacity-100" />
                )}
            </div>

            {generatedImage && !isLoading && (
                <div className="w-full flex-shrink-0 bg-slate-900/30 p-4 rounded-lg space-y-3">
                    <h3 className="text-md font-semibold text-slate-200 mb-2">Refine & Export</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <DownloadPanel onDownload={onDownload} />
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={onStartCrop} className="w-full flex justify-center items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200">
                               <CropIcon className="w-5 h-5"/> Crop
                            </button>
                            <button onClick={onStartEdit} className="w-full flex justify-center items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200">
                               <EditIcon className="w-5 h-5"/> Edit
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-slate-700/50 my-3"></div>

                    <h3 className="text-md font-semibold text-slate-200">Check-back & Re-render</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                             <label
                                htmlFor="checkback-upload"
                                className="cursor-pointer group"
                                onDragOver={handleDragOver}
                                onDragEnter={handleCheckbackDragEnter}
                                onDragLeave={handleCheckbackDragLeave}
                                onDrop={handleCheckbackDrop}
                            >
                                <div className={`w-full aspect-video rounded-lg border-2 border-dashed flex flex-col justify-center items-center transition-colors ${isDraggingCheckback ? 'border-cyan-400 bg-slate-800 ring-4 ring-cyan-500/20' : checkbackPreview ? 'border-cyan-500/50' : 'border-slate-600 hover:border-cyan-500 hover:bg-slate-800'}`}>
                                    {checkbackPreview && !isDraggingCheckback ? (
                                    <img src={checkbackPreview} alt="Checkback preview" className="w-full h-full object-contain rounded-lg" />
                                    ) : (
                                    <div className="text-center p-2">
                                        <UploadIcon className="mx-auto h-8 w-8 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                        <p className="mt-2 text-xs font-semibold text-slate-300">
                                            {isDraggingCheckback ? 'Drop to upload' : 'Upload or Draw Check-back'}
                                        </p>
                                    </div>
                                    )}
                                </div>
                            </label>
                            <input id="checkback-upload" type="file" className="hidden" accept="image/*" onChange={handleCheckbackChange} />
                        </div>
                        <textarea value={reRenderPrompt} onChange={(e) => setReRenderPrompt(e.target.value)} rows={3} placeholder="Add re-rendering instructions..." className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-sm resize-none" />
                    </div>
                    <button onClick={onReRender} disabled={!reRenderPrompt || isReRendering} className="w-full flex justify-center items-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-cyan-900/50 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none">
                        {isReRendering ? <><Loader /> Re-rendering...</> : 'Re-render with Feedback'}
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Component: DownloadPanel ---
const DownloadPanel: React.FC<{ onDownload: (resolution: string) => void }> = ({ onDownload }) => {
    const [resolution, setResolution] = useState('original');
    const resolutions = {
        'original': 'Original',
        '1280x720': 'HD (1280x720)',
        '1920x1080': 'Full HD (1920x1080)',
    };

    return (
        <div className="flex gap-2">
            <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
                {Object.entries(resolutions).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                ))}
            </select>
            <button
                onClick={() => onDownload(resolution)}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 hover:bg-indigo-500"
                aria-label="Download Image"
            >
                <DownloadIcon className="w-5 h-5"/>
            </button>
        </div>
    );
};

// --- Component: DrawingCanvas ---
type Tool = 'select' | 'pen' | 'line' | 'rectangle' | 'text';
type Point = { x: number; y: number };
type LineDash = 'solid' | 'dashed' | 'dotted';
type Drawable = {
    id: string;
    type: Tool;
    points: Point[];
    color: string;
    lineWidth: number;
    lineDash: LineDash;
    text?: string;
};
type EditingState = {
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
};
type Action = 'none' | 'drawing' | 'moving';

// --- Canvas Helper Functions ---
const pDistanceSq = (p: Point, p1: Point, p2: Point): number => {
    const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
    if (l2 === 0) return (p.x - p1.x) ** 2 + (p.y - p1.y) ** 2;
    let t = ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const dx = p1.x + t * (p2.x - p1.x) - p.x;
    const dy = p1.y + t * (p2.y - p1.y) - p.y;
    return dx * dx + dy * dy;
};

interface DrawingCanvasProps {
    baseImage: string;
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ baseImage, onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(new Image());
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const [tool, setTool] = useState<Tool>('pen');
    const [color, setColor] = useState('#ff3b30');
    const [lineWidth, setLineWidth] = useState(5);
    const [lineDash, setLineDash] = useState<LineDash>('solid');

    const [objects, setObjects] = useState<Drawable[]>([]);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [drawingObject, setDrawingObject] = useState<Drawable | null>(null);
    const [editingText, setEditingText] = useState<EditingState | null>(null);

    const [history, setHistory] = useState<Drawable[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const [action, setAction] = useState<Action>('none');
    const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 });
    const [initialObjectState, setInitialObjectState] = useState<Drawable | null>(null);

    const updateHistory = useCallback((newObjects: Drawable[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newObjects);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const getContext = useCallback(() => canvasRef.current?.getContext('2d'), []);

    const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const getObjectAtPosition = (pos: Point): Drawable | null => {
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            const threshold = Math.max(10, obj.lineWidth / 2);
            if (obj.type === 'rectangle') {
                const [start, end] = obj.points;
                const minX = Math.min(start.x, end.x), maxX = Math.max(start.x, end.x);
                const minY = Math.min(start.y, end.y), maxY = Math.max(start.y, end.y);
                if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) return obj;
            } else if (obj.type === 'line' || obj.type === 'pen') {
                for (let j = 0; j < obj.points.length - 1; j++) {
                    if (pDistanceSq(pos, obj.points[j], obj.points[j + 1]) < threshold * threshold) return obj;
                }
            } else if (obj.type === 'text') {
                const ctx = getContext();
                if (!ctx || !obj.text) continue;
                ctx.font = `${obj.lineWidth * 4}px sans-serif`;
                const textLines = obj.text.split('\n');
                const textHeight = textLines.length * (obj.lineWidth * 4);
                const textWidth = Math.max(...textLines.map(line => ctx.measureText(line).width));
                if (pos.x >= obj.points[0].x && pos.x <= obj.points[0].x + textWidth &&
                    pos.y >= obj.points[0].y && pos.y <= obj.points[0].y + textHeight) return obj;
            }
        }
        return null;
    };
    
    const drawObject = useCallback((ctx: CanvasRenderingContext2D, obj: Drawable) => {
        ctx.strokeStyle = obj.color;
        ctx.lineWidth = obj.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash({ solid: [], dashed: [15, 10], dotted: [2, 8] }[obj.lineDash]);
        
        ctx.beginPath();
        if ((obj.type === 'pen' || obj.type === 'line') && obj.points.length > 1) {
            ctx.moveTo(obj.points[0].x, obj.points[0].y);
            obj.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        } else if (obj.type === 'rectangle' && obj.points.length === 2) {
            const [start, end] = obj.points;
            ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
        }
        ctx.stroke();

        if (obj.type === 'text' && obj.text && obj.points.length > 0) {
            ctx.fillStyle = obj.color;
            ctx.font = `${obj.lineWidth * 4}px sans-serif`;
            ctx.textBaseline = 'top';
            obj.text.split('\n').forEach((line, i) => {
                 ctx.fillText(line, obj.points[0].x, obj.points[0].y + i * (obj.lineWidth * 4 * 1.2));
            });
        }
    }, []);

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = getContext();
        if (!canvas || !ctx || !imageRef.current.src) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
        
        objects.forEach(obj => drawObject(ctx, obj));
        if (drawingObject) drawObject(ctx, drawingObject);
        
        const selectedObject = objects.find(o => o.id === selectedObjectId);
        if (selectedObject) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            if (selectedObject.type === 'text') {
                 ctx.font = `${selectedObject.lineWidth * 4}px sans-serif`;
                 const lines = selectedObject.text?.split('\n') || [''];
                 const w = Math.max(...lines.map(l => ctx.measureText(l).width));
                 const h = lines.length * selectedObject.lineWidth * 4 * 1.2;
                 minX = selectedObject.points[0].x; minY = selectedObject.points[0].y;
                 maxX = minX + w; maxY = minY + h;
            } else {
                selectedObject.points.forEach(p => {
                    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
                });
            }
            ctx.strokeStyle = '#4f46e5';
            ctx.lineWidth = 1;
            ctx.setLineDash([6, 3]);
            const padding = 5 + selectedObject.lineWidth / 2;
            ctx.strokeRect(minX - padding, minY - padding, maxX - minX + padding * 2, maxY - minY + padding * 2);
        }
    }, [getContext, objects, drawingObject, drawObject, selectedObjectId]);

    useLayoutEffect(redrawCanvas, [redrawCanvas]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        imageRef.current.src = baseImage;
        imageRef.current.onload = () => {
            const container = canvas.parentElement!;
            const { width: cWidth, height: cHeight } = container.getBoundingClientRect();
            const imgAspect = imageRef.current.width / imageRef.current.height;
            const cAspect = cWidth / cHeight;
            canvas.width = (imgAspect > cAspect) ? cWidth : cHeight * imgAspect;
            canvas.height = (imgAspect > cAspect) ? cWidth / imgAspect : cHeight;
            redrawCanvas();
        };
    }, [baseImage, redrawCanvas]);
    
    useEffect(() => {
        if (editingText) textAreaRef.current?.focus();
    }, [editingText]);

    useEffect(() => {
        const selectedObject = objects.find(obj => obj.id === selectedObjectId);
        if (!selectedObject) return;
        const updatedObjects = objects.map(obj => 
            obj.id === selectedObjectId ? { ...obj, color, lineWidth, lineDash } : obj
        );
        if (JSON.stringify(objects) !== JSON.stringify(updatedObjects)) {
            setObjects(updatedObjects);
        }
    }, [color, lineWidth, lineDash, selectedObjectId]);
    
    useEffect(() => {
        const selectedObject = objects.find(obj => obj.id === selectedObjectId);
        if (selectedObject) {
            setColor(selectedObject.color);
            setLineWidth(selectedObject.lineWidth);
            setLineDash(selectedObject.lineDash);
        }
    }, [selectedObjectId, objects]);


    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (editingText) return;
        const pos = getMousePos(e);
        setStartPoint(pos);

        if (tool === 'select') {
            const target = getObjectAtPosition(pos);
            setSelectedObjectId(target?.id || null);
            if (target) {
                setAction('moving');
                setInitialObjectState(JSON.parse(JSON.stringify(target)));
            }
        } else {
            setAction('drawing');
            setSelectedObjectId(null);
            const newObject: Drawable = {
                id: `obj-${Date.now()}`, type: tool, points: [pos],
                color, lineWidth, lineDash,
                text: tool === 'text' ? 'Text' : undefined
            };
            if (tool === 'line' || tool === 'rectangle') newObject.points.push(pos);
            setDrawingObject(newObject);
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (action === 'none') return;
        const pos = getMousePos(e);
        
        if (action === 'drawing' && drawingObject) {
            setDrawingObject(current => {
                if (!current) return null;
                const newPoints = [...current.points];
                if (current.type === 'pen') newPoints.push(pos);
                else if (current.type === 'line' || current.type === 'rectangle') newPoints[1] = pos;
                return { ...current, points: newPoints };
            });
        } else if (action === 'moving' && selectedObjectId && initialObjectState) {
            const dx = pos.x - startPoint.x, dy = pos.y - startPoint.y;
            const newObjects = objects.map(obj => 
                obj.id === selectedObjectId 
                    ? { ...obj, points: initialObjectState.points.map(p => ({ x: p.x + dx, y: p.y + dy })) }
                    : obj
            );
            setObjects(newObjects);
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getMousePos(e);
        if (action === 'drawing' && drawingObject) {
            if (tool === 'text') {
                setEditingText({ id: drawingObject.id, text: '', ...pos, width: 150, height: lineWidth * 4 * 1.2 + 8 });
            } else {
                const newObjects = [...objects, drawingObject];
                setObjects(newObjects);
                updateHistory(newObjects);
            }
        } else if (action === 'moving') {
            updateHistory(objects);
        }
        setAction('none');
        setDrawingObject(null);
        setInitialObjectState(null);
    };

    const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (tool !== 'select') return;
        const pos = getMousePos(e);
        const target = getObjectAtPosition(pos);
        if (target?.type === 'text') {
            setSelectedObjectId(target.id);
            const ctx = getContext();
            if (!ctx) return;
            ctx.font = `${target.lineWidth * 4}px sans-serif`;
            const lines = target.text?.split('\n') || [''];
            const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 20;
            const h = lines.length * target.lineWidth * 4 * 1.2 + 8;
            setEditingText({ id: target.id, text: target.text || '', x: target.points[0].x, y: target.points[0].y, width: w, height: h });
        }
    };

    const handleTextBlur = () => {
        if (!editingText) return;
        const existingObj = objects.find(o => o.id === editingText.id);
        if (editingText.text.trim() === '') {
            if (existingObj) { // It was an existing object being edited to be empty
                const newObjects = objects.filter(o => o.id !== editingText.id);
                setObjects(newObjects);
                updateHistory(newObjects);
            }
        } else {
            const newTextObject: Drawable = {
                id: editingText.id, type: 'text', points: [{ x: editingText.x, y: editingText.y }],
                color, lineWidth, lineDash: 'solid', text: editingText.text,
            };
            const newObjects = existingObj
                ? objects.map(o => o.id === editingText.id ? newTextObject : o)
                : [...objects, newTextObject];
            setObjects(newObjects);
            updateHistory(newObjects);
            setSelectedObjectId(newTextObject.id);
        }
        setEditingText(null);
    };
    
    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setObjects(history[historyIndex - 1]);
            setSelectedObjectId(null);
        }
    };
    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setObjects(history[historyIndex + 1]);
            setSelectedObjectId(null);
        }
    };
    const handleDelete = () => {
        if (selectedObjectId) {
            const newObjects = objects.filter(obj => obj.id !== selectedObjectId);
            setObjects(newObjects);
            updateHistory(newObjects);
            setSelectedObjectId(null);
        }
    };
    
    const handleSave = () => {
        setSelectedObjectId(null); 
        setTimeout(() => {
            if (canvasRef.current) {
                onSave(canvasRef.current.toDataURL('image/png'));
            }
        }, 50);
    };

    const tools: { id: Tool; icon: React.ReactNode; name: string }[] = [
        { id: 'select', icon: <SelectIcon className="w-5 h-5" />, name: 'Select & Move' },
        { id: 'pen', icon: <PenIcon className="w-5 h-5" />, name: 'Pen' },
        { id: 'line', icon: <LineIcon className="w-5 h-5" />, name: 'Line' },
        { id: 'rectangle', icon: <RectangleIcon className="w-5 h-5" />, name: 'Rectangle' },
        { id: 'text', icon: <TextIcon className="w-5 h-5" />, name: 'Text' },
    ];
    const lineStyles: { id: LineDash; name: string; icon: React.ReactNode }[] = [
        { id: 'solid', name: 'Solid', icon: <div className="w-full h-0.5 bg-current"></div> },
        { id: 'dashed', name: 'Dashed', icon: <svg width="100%" height="2"><line x1="0" y1="1" x2="100%" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="6,4"></line></svg> },
        { id: 'dotted', name: 'Dotted', icon: <svg width="100%" height="2"><line x1="0" y1="1" x2="100%" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="1,4" strokeLinecap="round"></line></svg> },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col justify-center items-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-4 flex flex-col gap-4 w-full max-w-7xl h-full max-h-[95vh]">
                <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 bg-slate-900/50 p-2 rounded-lg">
                    <div className="flex items-center gap-1 bg-slate-700 p-1 rounded-lg">
                        {tools.map(({ id, icon, name }) => (
                            <button key={id} onClick={() => setTool(id)} title={name} className={`p-2 rounded-md transition-colors ${tool === id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>
                                {icon}
                            </button>
                        ))}
                    </div>
                     <div className="flex items-center gap-4">
                        <input id="color-picker" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 p-0 border-none rounded bg-slate-700 cursor-pointer" title="Color"/>
                        <div className="flex items-center gap-2">
                            <input id="line-width" type="range" min="1" max="50" value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="w-24 cursor-pointer" title="Line Width"/>
                            <span className="text-sm text-slate-300 w-6 text-center">{lineWidth}</span>
                        </div>
                         <div className="flex items-center gap-1 bg-slate-700 p-1 rounded-lg">
                             {lineStyles.map(({ id, icon, name }) => (
                                <button key={id} onClick={() => setLineDash(id)} title={name} className={`p-2 w-10 h-8 flex items-center justify-center rounded-md transition-colors ${lineDash === id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-700 p-1 rounded-lg">
                         <button onClick={handleUndo} disabled={historyIndex === 0} title="Undo (Ctrl+Z)" className="p-2 rounded-md transition-colors text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><UndoIcon className="w-5 h-5"/></button>
                         <button onClick={handleRedo} disabled={historyIndex === history.length - 1} title="Redo (Ctrl+Y)" className="p-2 rounded-md transition-colors text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"><RedoIcon className="w-5 h-5"/></button>
                         <button onClick={handleDelete} disabled={!selectedObjectId} title="Delete" className="p-2 rounded-md transition-colors text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Save</button>
                    </div>
                </div>
                <div className="relative flex-grow w-full h-full flex justify-center items-center overflow-hidden bg-slate-900/50 rounded-md">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onDoubleClick={handleDoubleClick}
                        className={tool === 'select' ? 'cursor-default' : 'cursor-crosshair'}
                    />
                    {editingText && (
                         <textarea
                            ref={textAreaRef}
                            value={editingText.text}
                            onChange={(e) => setEditingText(prev => prev ? { ...prev, text: e.target.value } : null)}
                            onBlur={handleTextBlur}
                            style={{
                                position: 'absolute',
                                left: editingText.x,
                                top: editingText.y,
                                width: editingText.width,
                                height: editingText.height,
                                border: '1px solid #4f46e5',
                                background: 'rgba(30, 41, 59, 0.9)',
                                color: 'white',
                                outline: 'none',
                                resize: 'none',
                                overflow: 'hidden',
                                fontSize: `${lineWidth * 4}px`,
                                fontFamily: 'sans-serif',
                                lineHeight: 1.2,
                                padding: '2px',
                                zIndex: 100,
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Component: ImageCropper ---
interface ImageCropperProps {
    imageSrc: string;
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}
type CropRect = { x: number; y: number; width: number; height: number };

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(new Image());
    const [crop, setCrop] = useState<CropRect | null>(null);
    const [dragInfo, setDragInfo] = useState<{ type: 'move' | 'resize' | 'new'; startX: number; startY: number; handle?: string; startCrop?: CropRect } | null>(null);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const image = imageRef.current;
        if (!canvas || !ctx || !image.src) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        if (crop) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.clearRect(crop.x, crop.y, crop.width, crop.height);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

            // Draw handles
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            const handleSize = 8;
            const halfHandle = handleSize / 2;
            const { x, y, width, height } = crop;
            // corners
            ctx.fillRect(x - halfHandle, y - halfHandle, handleSize, handleSize);
            ctx.fillRect(x + width - halfHandle, y - halfHandle, handleSize, handleSize);
            ctx.fillRect(x - halfHandle, y + height - halfHandle, handleSize, handleSize);
            ctx.fillRect(x + width - halfHandle, y + height - halfHandle, handleSize, handleSize);
        }
    }, [crop]);

    useEffect(() => {
        const image = imageRef.current;
        image.src = imageSrc;
        image.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const container = canvas.parentElement!;
            const { width: cWidth, height: cHeight } = container.getBoundingClientRect();
            const imgAspect = image.width / image.height;
            const cAspect = cWidth / cHeight;

            let canvasWidth, canvasHeight;
            if (imgAspect > cAspect) {
                canvasWidth = cWidth;
                canvasHeight = cWidth / imgAspect;
            } else {
                canvasHeight = cHeight;
                canvasWidth = cHeight * imgAspect;
            }
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const initialWidth = canvasWidth * 0.8;
            const initialHeight = canvasHeight * 0.8;
            setCrop({
                x: (canvasWidth - initialWidth) / 2,
                y: (canvasHeight - initialHeight) / 2,
                width: initialWidth,
                height: initialHeight
            });
        };
    }, [imageSrc]);
    
    useEffect(draw, [draw, crop]);
    
    const getHandle = (mouseX: number, mouseY: number) => {
        if (!crop) return null;
        const { x, y, width, height } = crop;
        const handleSize = 12; // larger hit area
        if (Math.abs(mouseX - x) < handleSize && Math.abs(mouseY - y) < handleSize) return 'tl';
        if (Math.abs(mouseX - (x + width)) < handleSize && Math.abs(mouseY - y) < handleSize) return 'tr';
        if (Math.abs(mouseX - x) < handleSize && Math.abs(mouseY - (y + height)) < handleSize) return 'bl';
        if (Math.abs(mouseX - (x + width)) < handleSize && Math.abs(mouseY - (y + height)) < handleSize) return 'br';
        return null;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = e.nativeEvent;
        if (!crop) {
            setDragInfo({ type: 'new', startX: offsetX, startY: offsetY });
            return;
        }
        const handle = getHandle(offsetX, offsetY);
        if (handle) {
            setDragInfo({ type: 'resize', handle, startX: offsetX, startY: offsetY, startCrop: { ...crop } });
        } else if (offsetX > crop.x && offsetX < crop.x + crop.width && offsetY > crop.y && offsetY < crop.y + crop.height) {
            setDragInfo({ type: 'move', startX: offsetX, startY: offsetY, startCrop: { ...crop } });
        } else {
             setDragInfo({ type: 'new', startX: offsetX, startY: offsetY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!dragInfo) return;
        const { offsetX, offsetY } = e.nativeEvent;
        const dx = offsetX - dragInfo.startX;
        const dy = offsetY - dragInfo.startY;

        if (dragInfo.type === 'new') {
            const newCrop = {
                x: Math.min(dragInfo.startX, offsetX),
                y: Math.min(dragInfo.startY, offsetY),
                width: Math.abs(dx),
                height: Math.abs(dy),
            };
            setCrop(newCrop);
        } else if (dragInfo.type === 'move' && dragInfo.startCrop) {
            setCrop({ ...dragInfo.startCrop, x: dragInfo.startCrop.x + dx, y: dragInfo.startCrop.y + dy });
        } else if (dragInfo.type === 'resize' && dragInfo.handle && dragInfo.startCrop) {
            let { x, y, width, height } = dragInfo.startCrop;
            if (dragInfo.handle.includes('l')) { x += dx; width -= dx; }
            if (dragInfo.handle.includes('r')) { width += dx; }
            if (dragInfo.handle.includes('t')) { y += dy; height -= dy; }
            if (dragInfo.handle.includes('b')) { height += dy; }
            setCrop({ x, y, width, height });
        }
    };
    
    const handleMouseUp = () => setDragInfo(null);

    const handleSave = () => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!crop || !canvas) return;

        const tempCanvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / canvas.width;
        const scaleY = image.naturalHeight / canvas.height;
        tempCanvas.width = crop.width * scaleX;
        tempCanvas.height = crop.height * scaleY;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(
            image,
            crop.x * scaleX, crop.y * scaleY,
            crop.width * scaleX, crop.height * scaleY,
            0, 0,
            tempCanvas.width, tempCanvas.height
        );
        onSave(tempCanvas.toDataURL('image/png'));
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex flex-col justify-center items-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-4 flex flex-col gap-4 w-full max-w-6xl h-full max-h-[95vh]">
                <div className="flex-shrink-0 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-200">Crop Image</h3>
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Save Crop</button>
                    </div>
                </div>
                <div className="relative flex-grow w-full h-full flex justify-center items-center overflow-hidden bg-slate-900/50 rounded-md">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="cursor-crosshair"
                    />
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [checkbackFile, setCheckbackFile] = useState<File | null>(null);
  const [checkbackPreview, setCheckbackPreview] = useState<string | null>(null);
  const [reRenderPrompt, setReRenderPrompt] = useState<string>('');
  const [isReRendering, setIsReRendering] = useState<boolean>(false);

  const [editingTarget, setEditingTarget] = useState<'base' | 'checkback' | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);


  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleMaterialsChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        const newFiles = Array.from(event.target.files);
        const newMaterials: Material[] = newFiles.map((file: File, index) => ({
            id: `${Date.now()}-${file.name}-${index}`,
            file,
            name: `Material ${materials.length + index + 1}`,
        }));
        setMaterials(prev => [...prev, ...newMaterials]);
    }
  };

  const handleRemoveMaterial = (idToRemove: string) => {
    setMaterials(prev => prev.filter(material => material.id !== idToRemove));
  };

  const handleMaterialNameChange = (id: string, newName: string) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, name: newName } : m));
  };
  
  const handleRender = useCallback(async () => {
    if (!imageFile || !prompt) {
      setError("Please upload a base image and provide a prompt.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    
    try {
      const materialData = materials.map(({ file, name }) => ({ file, name }));
      const result = await renderImage(imageFile, materialData, prompt);
      setGeneratedImage(result);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, materials, prompt]);
  
  const handleReRender = useCallback(async () => {
    if (!generatedImage || !reRenderPrompt) {
        setError("Please provide instructions for re-rendering.");
        return;
    }

    setIsReRendering(true);
    setError(null);

    try {
        const result = await reRenderImage(generatedImage, checkbackFile, reRenderPrompt);
        setGeneratedImage(result);
        setCheckbackFile(null);
        setCheckbackPreview(null);
        setReRenderPrompt('');
    } catch (e) {
        if (e instanceof Error) setError(e.message);
        else setError("An unexpected error occurred during re-rendering.");
    } finally {
        setIsReRendering(false);
    }
  }, [generatedImage, checkbackFile, reRenderPrompt]);

  const handleDownload = useCallback((resolution: string) => {
    if (!generatedImage) return;

    const image = new Image();
    image.src = generatedImage;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (resolution === 'original') {
        canvas.width = image.width;
        canvas.height = image.height;
      } else {
        const [width, height] = resolution.split('x').map(Number);
        canvas.width = width;
        canvas.height = height;
      }

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const link = document.createElement('a');
      link.download = `civil-renderer-${resolution}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  }, [generatedImage]);

  const handleSaveDrawing = (dataUrl: string) => {
    if (editingTarget === 'base') {
      setImagePreview(dataUrl);
      setImageFile(dataURLtoFile(dataUrl, 'base-edited.png'));
    } else if (editingTarget === 'checkback') {
      setCheckbackPreview(dataUrl);
      setCheckbackFile(dataURLtoFile(dataUrl, 'checkback.png'));
    }
    setEditingTarget(null);
  };
  
  const handleSaveCrop = (dataUrl: string) => {
    setGeneratedImage(dataUrl);
    setCheckbackFile(null);
    setCheckbackPreview(null);
    setIsCropping(false);
  };

  const getEditingImage = () => {
      if (editingTarget === 'base') return imagePreview;
      if (editingTarget === 'checkback') return generatedImage;
      return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-6 md:mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            CIVIL RENDERER
          </h1>
          <p className="mt-3 text-lg text-slate-400 max-w-3xl mx-auto">
            Transform your civil engineering and architectural concepts into stunningly realistic images with AI.
          </p>
        </header>

        {editingTarget && getEditingImage() && (
            <DrawingCanvas
                baseImage={getEditingImage()!}
                onSave={handleSaveDrawing}
                onCancel={() => setEditingTarget(null)}
            />
        )}
        
        {isCropping && generatedImage && (
            <ImageCropper
                imageSrc={generatedImage}
                onSave={handleSaveCrop}
                onCancel={() => setIsCropping(false)}
            />
        )}

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="w-full">
              <ImageInputPanel
                onImageChange={handleImageChange}
                imagePreview={imagePreview}
                prompt={prompt}
                setPrompt={setPrompt}
                materials={materials}
                onMaterialsChange={handleMaterialsChange}
                onRemoveMaterial={handleRemoveMaterial}
                onMaterialNameChange={handleMaterialNameChange}
                onRender={handleRender}
                isLoading={isLoading}
                onStartEdit={() => setEditingTarget('base')}
              />
          </div>
          <div className="w-full">
              <ImageOutputPanel
                generatedImage={generatedImage}
                isLoading={isLoading}
                error={error}
                onReRender={handleReRender}
                isReRendering={isReRendering || isLoading}
                checkbackFile={checkbackFile}
                setCheckbackFile={setCheckbackFile}
                checkbackPreview={checkbackPreview}
                setCheckbackPreview={setCheckbackPreview}
                reRenderPrompt={reRenderPrompt}
                setReRenderPrompt={setReRenderPrompt}
                onDownload={handleDownload}
                onStartEdit={() => setEditingTarget('checkback')}
                onStartCrop={() => setIsCropping(true)}
              />
          </div>
        </main>
      </div>
    </div>
  );
}
