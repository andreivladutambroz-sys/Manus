import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import {
  Upload, FileText, Search, Trash2, ArrowLeft, BookOpen,
  Filter, Tag, Car, Calendar, Wrench, Database, Plus, X, Eye
} from "lucide-react";

const CATEGORIES = [
  { value: "elsa", label: "ELSA (Electronic Service Information)", icon: "📘" },
  { value: "etka", label: "ETKA (Electronic Parts Catalogue)", icon: "📗" },
  { value: "autodata", label: "Autodata", icon: "📕" },
  { value: "workshop_manual", label: "Workshop Manual", icon: "📙" },
  { value: "wiring_diagram", label: "Wiring Diagram", icon: "⚡" },
  { value: "tsi_bulletin", label: "TSI/TSB Bulletin", icon: "📋" },
  { value: "other", label: "Other", icon: "📄" },
];

const BRANDS = [
  "Volkswagen", "Audi", "BMW", "Mercedes-Benz", "Skoda", "Seat", "Porsche",
  "Opel", "Ford", "Renault", "Peugeot", "Citroen", "Toyota", "Honda",
  "Hyundai", "Kia", "Dacia", "Fiat", "Volvo", "Other"
];

export default function AdminKnowledgeBase() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Upload form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [engineCode, setEngineCode] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const documentsQuery = trpc.knowledge.listDocuments.useQuery();
  const uploadMutation = trpc.knowledge.uploadDocument.useMutation();
  const deleteMutation = trpc.knowledge.deleteDocument.useMutation();
  const uploadFileMutation = trpc.upload.image.useMutation();

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Fișierul este prea mare. Limita este 50MB.");
      return;
    }

    setIsUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        
        const result = await uploadFileMutation.mutateAsync({
          fileName: file.name,
          fileBase64: base64,
          contentType: file.type,
        });

        // Now create the document record
        await uploadMutation.mutateAsync({
          title: title || file.name,
          description,
          category: category as any,
          brand: brand || undefined,
          model: model || undefined,
          yearFrom: yearFrom ? parseInt(yearFrom) : undefined,
          yearTo: yearTo ? parseInt(yearTo) : undefined,
          engineCode: engineCode || undefined,
          fileUrl: result.url,
          fileKey: `knowledge-docs/${Date.now()}-${file.name}`,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          extractedText: extractedText || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });

        toast.success("Document încărcat cu succes!");
        setShowUploadForm(false);
        resetForm();
        documentsQuery.refetch();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Eroare la încărcarea documentului");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Sigur vrei să ștergi acest document?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Document șters cu succes!");
      documentsQuery.refetch();
    } catch (error) {
      toast.error("Eroare la ștergerea documentului");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setBrand("");
    setModel("");
    setYearFrom("");
    setYearTo("");
    setEngineCode("");
    setTags([]);
    setExtractedText("");
  };

  const documents = documentsQuery.data || [];
  const filteredDocs = documents.filter((doc: any) => {
    const matchesSearch = !searchTerm || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    const matchesBrand = filterBrand === "all" || doc.brand === filterBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Database className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Knowledge Base Admin</h1>
                <p className="text-sm text-slate-400">Gestionare manuale ELSA, ETKA, Autodata</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowUploadForm(!showUploadForm)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" /> Încarcă Document
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Upload Form */}
        {showUploadForm && (
          <Card className="bg-slate-900/80 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Upload className="h-5 w-5 text-orange-400" />
                Încarcă Document Tehnic
              </CardTitle>
              <CardDescription className="text-slate-400">
                Adaugă manuale service, scheme electrice, buletine tehnice pentru a îmbunătăți diagnosticele AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Row 1: Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Titlu Document *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex: Manual Service VW Golf 7 1.6 TDI"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Categorie *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Selectează categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Description */}
              <div className="space-y-2">
                <Label className="text-slate-300">Descriere</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descriere detaliată a conținutului documentului..."
                  className="bg-slate-800 border-slate-600 text-white min-h-[80px]"
                />
              </div>

              {/* Row 3: Vehicle Scope */}
              <div>
                <Label className="text-slate-300 flex items-center gap-2 mb-3">
                  <Car className="h-4 w-4" /> Aplicabilitate Vehicul
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                      <SelectValue placeholder="Marcă" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANDS.map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Model"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <Input
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    placeholder="An de la"
                    type="number"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <Input
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    placeholder="An până la"
                    type="number"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <Input
                    value={engineCode}
                    onChange={(e) => setEngineCode(e.target.value)}
                    placeholder="Cod motor"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* Row 4: Tags */}
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Tag-uri
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    placeholder="Adaugă tag..."
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <Button variant="outline" onClick={handleAddTag} className="border-slate-600">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-orange-500/20 text-orange-300 gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 5: Extracted Text */}
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Text Extras (opțional - pentru căutare AI)
                </Label>
                <Textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  placeholder="Copiază aici textul relevant din document pentru a permite AI-ului să caute în conținut..."
                  className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
                />
              </div>

              {/* Row 6: File Upload */}
              <Separator className="bg-slate-700" />
              <div className="space-y-2">
                <Label className="text-slate-300">Fișier Document * (max 50MB)</Label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer">
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-slate-400">Click pentru a selecta fișierul</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, DOCX, XLS, ZIP, IMG</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.jpg,.jpeg,.png,.gif"
                      disabled={!title || !category || isUploading}
                    />
                  </label>
                </div>
                {(!title || !category) && (
                  <p className="text-xs text-amber-400">Completează titlul și categoria înainte de a încărca fișierul</p>
                )}
                {isUploading && (
                  <div className="flex items-center gap-2 text-orange-400">
                    <div className="animate-spin h-4 w-4 border-2 border-orange-400 border-t-transparent rounded-full" />
                    Se încarcă...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Caută documente..."
              className="pl-10 bg-slate-900/80 border-slate-700 text-white"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px] bg-slate-900/80 border-slate-700 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate categoriile</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterBrand} onValueChange={setFilterBrand}>
            <SelectTrigger className="w-[180px] bg-slate-900/80 border-slate-700 text-white">
              <Car className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Marcă" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate mărcile</SelectItem>
              {BRANDS.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/60 border-slate-700">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">{documents.length}</p>
              <p className="text-xs text-slate-400">Total Documente</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-slate-700">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {documents.filter((d: any) => d.category === "elsa" || d.category === "etka").length}
              </p>
              <p className="text-xs text-slate-400">ELSA/ETKA</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-slate-700">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {documents.filter((d: any) => d.extractedText).length}
              </p>
              <p className="text-xs text-slate-400">Cu Text AI</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-slate-700">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">
                {new Set(documents.map((d: any) => d.brand).filter(Boolean)).size}
              </p>
              <p className="text-xs text-slate-400">Mărci Acoperite</p>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          {filteredDocs.length === 0 ? (
            <Card className="bg-slate-900/60 border-slate-700">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 text-lg">Niciun document găsit</p>
                <p className="text-slate-500 text-sm mt-1">
                  {documents.length === 0 
                    ? "Încarcă primul document tehnic pentru a îmbunătăți diagnosticele AI" 
                    : "Modifică filtrele pentru a vedea mai multe documente"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDocs.map((doc: any) => {
              const catInfo = CATEGORIES.find(c => c.value === doc.category);
              return (
                <Card key={doc.id} className="bg-slate-900/60 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-slate-800 rounded-lg text-2xl">
                          {catInfo?.icon || "📄"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{doc.title}</h3>
                          {doc.description && (
                            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{doc.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                              {catInfo?.label || doc.category}
                            </Badge>
                            {doc.brand && (
                              <Badge variant="outline" className="text-xs border-blue-600 text-blue-300">
                                <Car className="h-3 w-3 mr-1" /> {doc.brand} {doc.model || ""}
                              </Badge>
                            )}
                            {doc.engineCode && (
                              <Badge variant="outline" className="text-xs border-green-600 text-green-300">
                                <Wrench className="h-3 w-3 mr-1" /> {doc.engineCode}
                              </Badge>
                            )}
                            {(doc.yearFrom || doc.yearTo) && (
                              <Badge variant="outline" className="text-xs border-purple-600 text-purple-300">
                                <Calendar className="h-3 w-3 mr-1" /> {doc.yearFrom || "?"} - {doc.yearTo || "?"}
                              </Badge>
                            )}
                            {doc.extractedText && (
                              <Badge className="text-xs bg-green-500/20 text-green-300">
                                AI Searchable
                              </Badge>
                            )}
                          </div>
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(doc.tags as string[]).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs bg-slate-800 text-slate-300">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-slate-500 mt-2">
                            {doc.fileName} • {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(1)}MB` : "N/A"} • {new Date(doc.createdAt).toLocaleDateString("ro-RO")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => window.open(doc.fileUrl, "_blank")} className="text-slate-400 hover:text-white">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} className="text-slate-400 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
