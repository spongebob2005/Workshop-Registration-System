import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../api/client.ts';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Pencil, Trash2, Plus, Search, GraduationCap, X, Calendar, DollarSign, Users as UsersIcon, ImagePlus, Link, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Workshop {
  id: string;
  title: string;
  instructor: string;
  date: string;
  duration: string;
  price: number;
  category: string;
  seats: number;
  enrolled?: number;
  description?: string;
  image?: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  'Web Development': 'from-blue-500 to-indigo-600',
  'Design': 'from-pink-500 to-rose-600',
  'Data Science': 'from-purple-500 to-violet-600',
  'Marketing': 'from-orange-500 to-amber-600',
  'Cloud Computing': 'from-cyan-500 to-blue-600',
  'Mobile Development': 'from-green-500 to-emerald-600',
  'Security': 'from-red-500 to-rose-600',
  'Blockchain': 'from-yellow-500 to-amber-600',
};

export const ManageWorkshops = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [filteredWorkshops, setFilteredWorkshops] = useState<Workshop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [formData, setFormData] = useState<Partial<Workshop>>({});
  const [imageTab, setImageTab] = useState<'url' | 'upload'>('url');
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchWorkshops(); }, []);

  useEffect(() => {
    const filtered = workshops.filter(w =>
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWorkshops(filtered);
  }, [searchQuery, workshops]);

  const fetchWorkshops = async () => {
    try {
      const data = await api.get('/workshops');
      setWorkshops(data);
      setFilteredWorkshops(data);
    } catch (error) {
      console.error('Error fetching workshops:', error);
      toast.error('Failed to load workshops');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingWorkshop(null);
    setFormData({ title: '', instructor: '', date: '', duration: '', price: 0, category: '', seats: 30, enrolled: 0, description: '', image: '' });
    setImagePreview('');
    setImageTab('url');
    setShowModal(true);
  };

  const handleEdit = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setFormData(workshop);
    setImagePreview(workshop.image || '');
    setImageTab('url');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workshop?')) return;
    try {
      await api.delete(`/workshops/${id}`);
      toast.success('Workshop deleted successfully');
      fetchWorkshops();
    } catch (error) {
      console.error('Error deleting workshop:', error);
      toast.error('Failed to delete workshop');
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }));
    setImagePreview(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be smaller than 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, image: base64 }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWorkshop) {
        await api.put(`/workshops/${editingWorkshop.id}`, formData);
        toast.success('Workshop updated successfully');
      } else {
        const newWorkshop = { ...formData, id: Date.now().toString(), enrolled: 0 };
        await api.post('/workshops', newWorkshop);
        toast.success('Workshop created successfully');
      }
      setShowModal(false);
      fetchWorkshops();
    } catch (error) {
      console.error('Error saving workshop:', error);
      toast.error('Failed to save workshop');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-2xl">
                <GraduationCap className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Workshops</h1>
                <p className="text-gray-600">{workshops.length} workshops total</p>
              </div>
            </div>
            <Button onClick={handleCreate} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg">
              <Plus className="size-4 mr-2" /> Add Workshop
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <Input type="text" placeholder="Search workshops by title, instructor, or category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-12 rounded-xl border-gray-200 bg-white shadow-sm" />
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg animate-pulse">
                <div className="h-36 bg-gray-200 rounded-t-2xl mb-4" />
                <div className="p-5"><div className="h-6 bg-gray-200 rounded w-3/4 mb-2" /><div className="h-4 bg-gray-200 rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkshops.map((workshop, index) => {
              const gradient = CATEGORY_GRADIENTS[workshop.category] || 'from-indigo-500 to-purple-600';
              return (
                <motion.div key={workshop.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all">
                  <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
                    {workshop.image ? (
                      <img src={workshop.image} alt={workshop.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="flex items-center justify-center h-full opacity-40"><ImagePlus className="size-12 text-white" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-2 left-3 text-white text-xs font-medium bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-lg">{workshop.category}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{workshop.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">by {workshop.instructor}</p>
                    <div className="space-y-1.5 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600"><Calendar className="size-4" /><span>{workshop.date}</span></div>
                      <div className="flex items-center gap-2 text-gray-600"><DollarSign className="size-4" /><span>${workshop.price}</span></div>
                      <div className="flex items-center gap-2 text-gray-600"><UsersIcon className="size-4" /><span>{workshop.enrolled || 0}/{workshop.seats} enrolled</span></div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <Button onClick={() => handleEdit(workshop)} className="flex-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-0"><Pencil className="size-4 mr-2" />Edit</Button>
                      <Button onClick={() => handleDelete(workshop.id)} className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border-0"><Trash2 className="size-4 mr-2" />Delete</Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {filteredWorkshops.length === 0 && !loading && (
          <div className="text-center py-12">
            <GraduationCap className="size-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No workshops found</p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{editingWorkshop ? 'Edit Workshop' : 'Create New Workshop'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="size-5" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── Image Section ── */}
                <div>
                  <Label className="mb-2 block">Workshop Image</Label>

                  {/* URL / Upload tabs */}
                  <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-3 w-fit">
                    <button type="button" onClick={() => setImageTab('url')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${imageTab === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      <Link className="size-3.5" /> URL
                    </button>
                    <button type="button" onClick={() => setImageTab('upload')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${imageTab === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      <Upload className="size-3.5" /> Upload
                    </button>
                  </div>

                  {imageTab === 'url' ? (
                    <Input
                      type="url"
                      value={formData.image?.startsWith('data:') ? '' : (formData.image || '')}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      placeholder="https://example.com/workshop-image.jpg"
                      className="mb-3"
                    />
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all mb-3">
                      <Upload className="size-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 font-medium">Click to upload image</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP · max 5MB</p>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </div>
                  )}

                  {/* Preview */}
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden h-44 bg-gray-100">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" onError={() => setImagePreview('')} />
                      <button type="button" onClick={() => { setImagePreview(''); setFormData(prev => ({ ...prev, image: '' })); }} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors">
                        <X className="size-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2">
                        <p className="text-white text-xs">Preview</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl h-44 bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <div className="text-center"><ImagePlus className="size-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">No image selected</p></div>
                    </div>
                  )}
                </div>

                {/* ── Fields ── */}
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Workshop title" required className="mt-1" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instructor">Instructor</Label>
                    <Input id="instructor" value={formData.instructor || ''} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} placeholder="Instructor name" required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Design" required className="mt-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} placeholder="e.g., Apr 15, 2026" required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Input id="duration" value={formData.duration || ''} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g., 3 hours" required className="mt-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input id="price" type="number" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} placeholder="999" required className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="seats">Total Seats</Label>
                    <Input id="seats" type="number" value={formData.seats || ''} onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })} placeholder="30" required className="mt-1" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea id="description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Workshop description..." rows={4} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">Cancel</Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">{editingWorkshop ? 'Update' : 'Create'} Workshop</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};