import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Award } from "lucide-react";

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    workshopName: "",
    phone: "",
    city: "",
    specializations: "",
    yearsExperience: "",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <p className="text-slate-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <p className="text-slate-600">Trebuie să vă conectați pentru a accesa profil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi
            </Button>
            <h1 className="text-3xl font-bold text-slate-900">Profilul Meu</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1 p-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || "M"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">{user?.name || "Mecanic"}</h2>
              <p className="text-sm text-slate-600 mb-4">{user?.email}</p>
              <div className="space-y-2 text-sm text-slate-600">
                <p>Rol: <span className="font-semibold text-slate-900">{user?.role === "admin" ? "Administrator" : "Utilizator"}</span></p>
                <p>Conectat: <span className="font-semibold text-slate-900">{new Date(user?.lastSignedIn || "").toLocaleDateString("ro-RO")}</span></p>
              </div>
            </div>
          </Card>

          {/* Edit Profile Form */}
          <Card className="md:col-span-2 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Informații Profesionale</h3>
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Salvează" : "Editează"}
              </Button>
            </div>

            <div className="space-y-4">
              {/* Workshop Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Numele Atelierului
                </label>
                <Input
                  placeholder="Ex: Auto Service Pro"
                  value={formData.workshopName}
                  onChange={(e) => setFormData({ ...formData, workshopName: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-50"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Telefon
                </label>
                <Input
                  placeholder="Ex: +40 123 456 789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-50"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Oraș
                </label>
                <Input
                  placeholder="Ex: București"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-50"
                />
              </div>

              {/* Years of Experience */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Award className="w-4 h-4 inline mr-2" />
                  Ani de Experiență
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 10"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-50"
                />
              </div>

              {/* Specializations */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Specializări (separați cu virgulă)
                </label>
                <Textarea
                  placeholder="Ex: Motoare diesel, Sisteme de injecție, Transmisii automate"
                  value={formData.specializations}
                  onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                  disabled={!isEditing}
                  className="bg-slate-50 h-24"
                />
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      toast.success("Profil actualizat cu succes!");
                      setIsEditing(false);
                    }}
                  >
                    Salvează Modificări
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsEditing(false)}
                  >
                    Anulează
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="p-6">
            <h4 className="text-sm font-medium text-slate-600 mb-2">Total Diagnostic</h4>
            <p className="text-3xl font-bold text-slate-900">0</p>
          </Card>
          <Card className="p-6">
            <h4 className="text-sm font-medium text-slate-600 mb-2">Vehicule Diagnosticate</h4>
            <p className="text-3xl font-bold text-slate-900">0</p>
          </Card>
          <Card className="p-6">
            <h4 className="text-sm font-medium text-slate-600 mb-2">Rapoarte Generate</h4>
            <p className="text-3xl font-bold text-slate-900">0</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
