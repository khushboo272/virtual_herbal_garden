import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { UploadCloud, FileBox, Cuboid, MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../lib/api';
import { GardenPositionPicker } from './GardenPositionPicker';

interface IPlant {
  _id: string;
  commonName: string;
  modelUrl?: string;
  modelUrl_lod1?: string;
  modelUrl_lod2?: string;
  globalPosition3D?: { x: number; y: number; z: number };
  botanicalBed?: string;
  isVisibleInGarden?: boolean;
}

interface PlantUploadModalProps {
  plant: IPlant | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FileState = {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
};

const initFileState: FileState = { file: null, progress: 0, status: 'idle' };

export function PlantUploadModal({ plant, isOpen, onClose, onSuccess }: PlantUploadModalProps) {
  const [activeTab, setActiveTab] = useState('model');
  
  // File States
  const [model0, setModel0] = useState<FileState>(initFileState);
  const [lod1, setLod1] = useState<FileState>(initFileState);
  const [lod2, setLod2] = useState<FileState>(initFileState);
  
  // Position States
  const [position, setPosition] = useState({
    x: plant?.globalPosition3D?.x || 0,
    y: plant?.globalPosition3D?.y || 0,
    z: plant?.globalPosition3D?.z || 0,
  });
  const [botanicalBed, setBotanicalBed] = useState(plant?.botanicalBed || '');
  const [isVisible, setIsVisible] = useState(plant?.isVisibleInGarden || false);
  const [isUpdatingPosition, setIsUpdatingPosition] = useState(false);

  // Update states if plant changes
  React.useEffect(() => {
    if (plant) {
      setPosition({
        x: plant.globalPosition3D?.x || 0,
        y: plant.globalPosition3D?.y || 0,
        z: plant.globalPosition3D?.z || 0,
      });
      setBotanicalBed(plant.botanicalBed || '');
      setIsVisible(plant.isVisibleInGarden || false);
      setModel0(initFileState);
      setLod1(initFileState);
      setLod2(initFileState);
    }
  }, [plant]);

  const handleDrop = (e: React.DragEvent, setFile: React.Dispatch<React.SetStateAction<FileState>>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.glb') || droppedFile.name.endsWith('.gltf'))) {
      setFile({ file: droppedFile, progress: 0, status: 'idle' });
    } else {
      toast.error('Only .glb or .gltf files are allowed');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<FileState>>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.name.endsWith('.glb') || selected.name.endsWith('.gltf')) {
        setFile({ file: selected, progress: 0, status: 'idle' });
      } else {
        toast.error('Only .glb or .gltf files are allowed');
      }
    }
  };

  const uploadFile = async (
    fileState: FileState,
    setFileState: React.Dispatch<React.SetStateAction<FileState>>,
    endpoint: string
  ) => {
    if (!fileState.file || !plant) return;

    setFileState(prev => ({ ...prev, status: 'uploading' }));
    
    const formData = new FormData();
    formData.append('file', fileState.file);

    try {
      await api.put(`/admin/plants/${plant._id}/${endpoint}`, formData);
      setFileState(prev => ({ ...prev, status: 'success', progress: 100 }));
      toast.success(`Successfully uploaded to ${endpoint}`);
      onSuccess();
    } catch (error: any) {
      setFileState(prev => ({ ...prev, status: 'error' }));
      toast.error(`Upload failed: ${error.message}`);
    }
  };

  const handleUpdatePosition = async () => {
    if (!plant) return;
    setIsUpdatingPosition(true);
    try {
      await api.patch(`/admin/plants/${plant._id}/garden-position`, {
        globalPosition3D: position,
        botanicalBed,
        isVisibleInGarden: isVisible
      });
      toast.success('Garden position & visibility updated');
      onSuccess();
    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setIsUpdatingPosition(false);
    }
  };

  if (!plant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Cuboid className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">3D Assets & Location</DialogTitle>
              <DialogDescription>
                Manage 3D models and virtual garden positioning for <span className="font-semibold text-purple-700">{plant.commonName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 w-full bg-purple-50 p-1 rounded-lg">
            <TabsTrigger value="model" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Cuboid className="w-4 h-4 mr-2" /> Base Model
            </TabsTrigger>
            <TabsTrigger value="lods" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FileBox className="w-4 h-4 mr-2" /> LODs
            </TabsTrigger>
            <TabsTrigger value="position" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <MapPin className="w-4 h-4 mr-2" /> Position
            </TabsTrigger>
          </TabsList>

          {/* TAB: BASE MODEL */}
          <TabsContent value="model" className="pt-4 space-y-4">
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
              <p>The <strong>Base Model (LOD0)</strong> is the highest quality mesh, displayed when users view the plant closely. Recommended size: &lt; 5MB.</p>
            </div>
            <FileDropzone 
              label="Upload Base Model (.glb)"
              fileState={model0}
              setFileState={setModel0}
              onDrop={(e) => handleDrop(e, setModel0)}
              onSelect={(e) => handleFileSelect(e, setModel0)}
              onUpload={() => uploadFile(model0, setModel0, 'model')}
            />
            {plant.modelUrl && (
              <div className="flex items-center gap-2 text-sm text-green-700 mt-2 bg-green-50 p-2 rounded border border-green-200">
                <CheckCircle2 className="w-4 h-4" />
                Base model is currently uploaded.
              </div>
            )}
          </TabsContent>

          {/* TAB: LODs */}
          <TabsContent value="lods" className="pt-4 space-y-4">
            <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100 text-sm text-amber-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p>Levels of Detail (LOD) optimize performance. <strong>LOD1</strong> is used at medium distance. <strong>LOD2</strong> is a very low-poly version for distant views.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FileDropzone 
                  label="Upload LOD1 (.glb)"
                  fileState={lod1}
                  setFileState={setLod1}
                  onDrop={(e) => handleDrop(e, setLod1)}
                  onSelect={(e) => handleFileSelect(e, setLod1)}
                  onUpload={() => {
                    if (lod1.file) {
                      const fd = new FormData();
                      fd.append('file', lod1.file);
                      fd.append('lodLevel', '1');
                      setLod1(prev => ({ ...prev, status: 'uploading' }));
                      api.put(`/admin/plants/${plant._id}/model-lod`, fd)
                        .then(() => {
                          setLod1(prev => ({ ...prev, status: 'success' }));
                          toast.success('LOD1 uploaded');
                          onSuccess();
                        })
                        .catch(err => {
                          setLod1(prev => ({ ...prev, status: 'error' }));
                          toast.error(err.message);
                        });
                    }
                  }}
                />
                {plant.modelUrl_lod1 && (
                  <p className="text-xs text-green-700 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> LOD1 active</p>
                )}
              </div>
              
              <div>
                <FileDropzone 
                  label="Upload LOD2 (.glb)"
                  fileState={lod2}
                  setFileState={setLod2}
                  onDrop={(e) => handleDrop(e, setLod2)}
                  onSelect={(e) => handleFileSelect(e, setLod2)}
                  onUpload={() => {
                    if (lod2.file) {
                      const fd = new FormData();
                      fd.append('file', lod2.file);
                      fd.append('lodLevel', '2');
                      setLod2(prev => ({ ...prev, status: 'uploading' }));
                      api.put(`/admin/plants/${plant._id}/model-lod`, fd)
                        .then(() => {
                          setLod2(prev => ({ ...prev, status: 'success' }));
                          toast.success('LOD2 uploaded');
                          onSuccess();
                        })
                        .catch(err => {
                          setLod2(prev => ({ ...prev, status: 'error' }));
                          toast.error(err.message);
                        });
                    }
                  }}
                />
                {plant.modelUrl_lod2 && (
                  <p className="text-xs text-green-700 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> LOD2 active</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB: POSITION */}
          <TabsContent value="position" className="pt-4 space-y-6">
            <GardenPositionPicker 
              position={position}
              onChange={setPosition}
              gardenSize={100}
            />
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>X Position</Label>
                <Input type="number" step="0.1" value={position.x} onChange={e => setPosition({ ...position, x: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Y Position (Up/Down)</Label>
                <Input type="number" step="0.1" value={position.y} onChange={e => setPosition({ ...position, y: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Z Position</Label>
                <Input type="number" step="0.1" value={position.z} onChange={e => setPosition({ ...position, z: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Botanical Bed / Zone</Label>
              <Input 
                placeholder="e.g., Medicinal Herb Garden A" 
                value={botanicalBed} 
                onChange={e => setBotanicalBed(e.target.value)} 
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 border rounded-lg">
              <div>
                <Label className="text-base font-medium">Visible in Virtual Garden</Label>
                <p className="text-sm text-gray-500">Toggle whether this plant should be spawned in the 3D world.</p>
              </div>
              <Switch checked={isVisible} onCheckedChange={setIsVisible} />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleUpdatePosition} disabled={isUpdatingPosition} className="bg-purple-600 hover:bg-purple-700">
                {isUpdatingPosition ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                Save Location Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Subcomponent for reusable dropzone
function FileDropzone({
  label,
  fileState,
  setFileState,
  onDrop,
  onSelect,
  onUpload
}: {
  label: string;
  fileState: FileState;
  setFileState: React.Dispatch<React.SetStateAction<FileState>>;
  onDrop: (e: React.DragEvent) => void;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="space-y-3">
      <Label className="font-medium text-gray-700">{label}</Label>
      <div 
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
          ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/30'}
          ${fileState.status === 'success' ? 'border-green-400 bg-green-50' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          setIsDragging(false);
          onDrop(e);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".glb,.gltf" 
          onChange={onSelect} 
        />
        
        <div className="flex flex-col items-center gap-2">
          {fileState.file ? (
            <>
              <Cuboid className={`w-8 h-8 ${fileState.status === 'success' ? 'text-green-500' : 'text-purple-600'}`} />
              <div className="text-sm font-medium text-gray-900">{fileState.file.name}</div>
              <div className="text-xs text-gray-500">{(fileState.file.size / (1024 * 1024)).toFixed(2)} MB</div>
            </>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 text-gray-400" />
              <div className="text-sm font-medium text-gray-700">Drag & drop your .glb file here</div>
              <div className="text-xs text-gray-500">or click to browse</div>
            </>
          )}
        </div>
      </div>

      {fileState.file && (
        <Button 
          onClick={onUpload} 
          disabled={fileState.status === 'uploading' || fileState.status === 'success'}
          className="w-full"
          variant={fileState.status === 'success' ? 'outline' : 'default'}
        >
          {fileState.status === 'uploading' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {fileState.status === 'success' ? (
            <><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Uploaded Successfully</>
          ) : (
            'Upload File to R2'
          )}
        </Button>
      )}
    </div>
  );
}
