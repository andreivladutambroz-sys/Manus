import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ============================================================
// SUPPORTED LANGUAGES
// ============================================================
export type Language = "ro" | "en" | "fr" | "de" | "it";

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

// ============================================================
// TRANSLATIONS
// ============================================================
type TranslationKeys = {
  // Navigation & Common
  "nav.home": string;
  "nav.dashboard": string;
  "nav.newDiagnostic": string;
  "nav.vehicles": string;
  "nav.knowledgeBase": string;
  "nav.profile": string;
  "nav.login": string;
  "nav.getStarted": string;
  "nav.logout": string;
  "nav.aiLearning": string;
  "nav.chatAI": string;
  "nav.adminKB": string;
  "nav.swarmMonitoring": string;
  "nav.agentFineTuning": string;

  // Home Page
  "home.title": string;
  "home.titleHighlight": string;
  "home.subtitle": string;
  "home.cta": string;
  "home.feature1.title": string;
  "home.feature1.desc": string;
  "home.feature2.title": string;
  "home.feature2.desc": string;
  "home.feature3.title": string;
  "home.feature3.desc": string;

  // Dashboard
  "dashboard.title": string;
  "dashboard.welcome": string;
  "dashboard.totalDiagnostics": string;
  "dashboard.totalVehicles": string;
  "dashboard.recentDiagnostics": string;
  "dashboard.noDiagnostics": string;
  "dashboard.createFirst": string;
  "dashboard.search": string;
  "dashboard.loading": string;

  // Diagnostic Form
  "diag.newTitle": string;
  "diag.step1.title": string;
  "diag.step1.desc": string;
  "diag.step2.title": string;
  "diag.step2.desc": string;
  "diag.step3.title": string;
  "diag.step3.desc": string;
  "diag.step4.title": string;
  "diag.step4.desc": string;
  "diag.brand": string;
  "diag.model": string;
  "diag.year": string;
  "diag.engine": string;
  "diag.mileage": string;
  "diag.vin": string;
  "diag.vinDecode": string;
  "diag.uploadCertificate": string;
  "diag.ocrExtract": string;
  "diag.symptoms": string;
  "diag.symptomsPlaceholder": string;
  "diag.errorCodes": string;
  "diag.errorCodesPlaceholder": string;
  "diag.category": string;
  "diag.conditions": string;
  "diag.conditionsPlaceholder": string;
  "diag.next": string;
  "diag.previous": string;
  "diag.startAnalysis": string;
  "diag.analyzing": string;
  "diag.analysisComplete": string;

  // Diagnostic Results
  "results.title": string;
  "results.accuracy": string;
  "results.probableCauses": string;
  "results.eliminationSteps": string;
  "results.repairProcedure": string;
  "results.partsNeeded": string;
  "results.estimatedCost": string;
  "results.severity": string;
  "results.critical": string;
  "results.high": string;
  "results.medium": string;
  "results.low": string;
  "results.exportPDF": string;
  "results.chatAI": string;
  "results.sendFeedback": string;
  "results.newDiagnostic": string;
  "results.backToDashboard": string;
  "results.step": string;
  "results.toolsNeeded": string;
  "results.estimatedTime": string;
  "results.ifPositive": string;
  "results.ifNegative": string;
  "results.oemCode": string;
  "results.aftermarket": string;
  "results.price": string;
  "results.laborCost": string;

  // Categories
  "cat.engine": string;
  "cat.transmission": string;
  "cat.brakes": string;
  "cat.electrical": string;
  "cat.suspension": string;
  "cat.cooling": string;
  "cat.exhaust": string;
  "cat.steering": string;
  "cat.fuel": string;
  "cat.ac": string;
  "cat.body": string;
  "cat.other": string;

  // Profile
  "profile.title": string;
  "profile.workshop": string;
  "profile.phone": string;
  "profile.city": string;
  "profile.experience": string;
  "profile.specialties": string;
  "profile.save": string;
  "profile.saved": string;

  // Knowledge Base
  "kb.title": string;
  "kb.search": string;
  "kb.searchPlaceholder": string;
  "kb.noResults": string;
  "kb.commonIssues": string;
  "kb.estimatedCost": string;
  "kb.difficulty": string;

  // Admin KB
  "adminKb.title": string;
  "adminKb.upload": string;
  "adminKb.category": string;
  "adminKb.documents": string;
  "adminKb.noDocuments": string;

  // Chat
  "chat.title": string;
  "chat.placeholder": string;
  "chat.suggestedPrompts": string;

  // Feedback
  "feedback.title": string;
  "feedback.rating": string;
  "feedback.correct": string;
  "feedback.partial": string;
  "feedback.incorrect": string;
  "feedback.notes": string;
  "feedback.submit": string;
  "feedback.submitted": string;

  // Learning
  "learning.title": string;
  "learning.accuracy": string;
  "learning.patterns": string;
  "learning.improvements": string;

  // Common
  "common.loading": string;
  "common.error": string;
  "common.save": string;
  "common.cancel": string;
  "common.delete": string;
  "common.edit": string;
  "common.search": string;
  "common.filter": string;
  "common.all": string;
  "common.noData": string;
  "common.confirm": string;
  "common.back": string;
  "common.comingSoon": string;
};

// ============================================================
// ROMANIAN (Default)
// ============================================================
const ro: TranslationKeys = {
  "nav.home": "Acasă",
  "nav.dashboard": "Dashboard",
  "nav.newDiagnostic": "Diagnostic Nou",
  "nav.vehicles": "Vehicule",
  "nav.knowledgeBase": "Baza de Cunoștințe",
  "nav.profile": "Profil",
  "nav.login": "Autentificare",
  "nav.getStarted": "Începe Acum",
  "nav.logout": "Deconectare",
  "nav.aiLearning": "AI Learning",
  "nav.chatAI": "Chat AI",
  "nav.adminKB": "Admin KB",
  "nav.swarmMonitoring": "Swarm Monitoring",
  "nav.agentFineTuning": "Agent Fine-tuning",

  "home.title": "Diagnostic Auto Profesional",
  "home.titleHighlight": "Powered by AI",
  "home.subtitle": "Optimizează fluxul de diagnostic cu analiză inteligentă a simptomelor, gestionare completă a istoricului și recomandări AI instant.",
  "home.cta": "Începe Acum",
  "home.feature1.title": "Diagnostic AI",
  "home.feature1.desc": "6 agenți AI specializați analizează simptomele în paralel pentru diagnostic rapid și precis.",
  "home.feature2.title": "Bază de Cunoștințe",
  "home.feature2.desc": "Acces la manuale ELSA, ETKA, Autodata și buletin tehnice pentru toate mărcile.",
  "home.feature3.title": "Învățare Continuă",
  "home.feature3.desc": "AI-ul învață din fiecare diagnostic confirmat, devenind mai precis cu timpul.",

  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Bine ai venit",
  "dashboard.totalDiagnostics": "Total Diagnostice",
  "dashboard.totalVehicles": "Total Vehicule",
  "dashboard.recentDiagnostics": "Diagnostice Recente",
  "dashboard.noDiagnostics": "Nu ai diagnostice încă",
  "dashboard.createFirst": "Creează Primul Diagnostic",
  "dashboard.search": "Caută diagnostic...",
  "dashboard.loading": "Se încarcă...",

  "diag.newTitle": "Diagnostic Nou",
  "diag.step1.title": "Date Vehicul",
  "diag.step1.desc": "Introdu datele vehiculului sau scanează certificatul de înmatriculare",
  "diag.step2.title": "Simptome & Coduri Eroare",
  "diag.step2.desc": "Descrie simptomele și introdu codurile de eroare",
  "diag.step3.title": "Analiză AI",
  "diag.step3.desc": "Agenții AI analizează datele în paralel",
  "diag.step4.title": "Rezultate",
  "diag.step4.desc": "Diagnostic complet cu soluții pas-cu-pas",
  "diag.brand": "Marcă",
  "diag.model": "Model",
  "diag.year": "An fabricație",
  "diag.engine": "Motor",
  "diag.mileage": "Kilometraj",
  "diag.vin": "Serie caroserie (VIN)",
  "diag.vinDecode": "Decodează VIN",
  "diag.uploadCertificate": "Upload certificat auto",
  "diag.ocrExtract": "Extrage date din poză",
  "diag.symptoms": "Simptome",
  "diag.symptomsPlaceholder": "Descrie simptomele vehiculului...",
  "diag.errorCodes": "Coduri Eroare",
  "diag.errorCodesPlaceholder": "ex: P0300, P0171, P0420",
  "diag.category": "Categorie",
  "diag.conditions": "Condiții apariție",
  "diag.conditionsPlaceholder": "Când apare problema? (la rece, la cald, în mers...)",
  "diag.next": "Următorul",
  "diag.previous": "Anterior",
  "diag.startAnalysis": "Începe Analiza",
  "diag.analyzing": "Se analizează...",
  "diag.analysisComplete": "Analiză completă!",

  "results.title": "Rezultate Diagnostic",
  "results.accuracy": "Acuratețe",
  "results.probableCauses": "Cauze Probabile",
  "results.eliminationSteps": "Pași Eliminare",
  "results.repairProcedure": "Procedură Reparație",
  "results.partsNeeded": "Piese Necesare",
  "results.estimatedCost": "Cost Estimat",
  "results.severity": "Severitate",
  "results.critical": "Critic",
  "results.high": "Ridicat",
  "results.medium": "Mediu",
  "results.low": "Scăzut",
  "results.exportPDF": "Export Raport PDF",
  "results.chatAI": "Chat AI",
  "results.sendFeedback": "Trimite Feedback",
  "results.newDiagnostic": "Diagnostic Nou",
  "results.backToDashboard": "Înapoi la Dashboard",
  "results.step": "Pas",
  "results.toolsNeeded": "Unelte necesare",
  "results.estimatedTime": "Timp estimat",
  "results.ifPositive": "Dacă pozitiv",
  "results.ifNegative": "Dacă negativ",
  "results.oemCode": "Cod OEM",
  "results.aftermarket": "Aftermarket",
  "results.price": "Preț",
  "results.laborCost": "Cost manoperă",

  "cat.engine": "Motor",
  "cat.transmission": "Transmisie",
  "cat.brakes": "Frâne",
  "cat.electrical": "Electric",
  "cat.suspension": "Suspensie",
  "cat.cooling": "Răcire",
  "cat.exhaust": "Evacuare",
  "cat.steering": "Direcție",
  "cat.fuel": "Alimentare",
  "cat.ac": "Climatizare",
  "cat.body": "Caroserie",
  "cat.other": "Altele",

  "profile.title": "Profil Mecanic",
  "profile.workshop": "Atelier",
  "profile.phone": "Telefon",
  "profile.city": "Oraș",
  "profile.experience": "Ani experiență",
  "profile.specialties": "Specializări",
  "profile.save": "Salvează",
  "profile.saved": "Profil salvat!",

  "kb.title": "Baza de Cunoștințe",
  "kb.search": "Caută",
  "kb.searchPlaceholder": "Caută problemă, cod eroare, simptom...",
  "kb.noResults": "Niciun rezultat găsit",
  "kb.commonIssues": "Probleme Frecvente",
  "kb.estimatedCost": "Cost estimat",
  "kb.difficulty": "Dificultate",

  "adminKb.title": "Admin - Baza de Cunoștințe",
  "adminKb.upload": "Upload Document",
  "adminKb.category": "Categorie",
  "adminKb.documents": "Documente",
  "adminKb.noDocuments": "Niciun document încărcat",

  "chat.title": "Chat AI Diagnostic",
  "chat.placeholder": "Pune o întrebare despre diagnostic...",
  "chat.suggestedPrompts": "Sugestii",

  "feedback.title": "Feedback Diagnostic",
  "feedback.rating": "Evaluare",
  "feedback.correct": "Corect",
  "feedback.partial": "Parțial corect",
  "feedback.incorrect": "Incorect",
  "feedback.notes": "Note adiționale",
  "feedback.submit": "Trimite Feedback",
  "feedback.submitted": "Feedback trimis!",

  "learning.title": "AI Learning Dashboard",
  "learning.accuracy": "Acuratețe Globală",
  "learning.patterns": "Pattern-uri Învățate",
  "learning.improvements": "Îmbunătățiri",

  "common.loading": "Se încarcă...",
  "common.error": "Eroare",
  "common.save": "Salvează",
  "common.cancel": "Anulează",
  "common.delete": "Șterge",
  "common.edit": "Editează",
  "common.search": "Caută",
  "common.filter": "Filtrează",
  "common.all": "Toate",
  "common.noData": "Nu sunt date disponibile",
  "common.confirm": "Confirmă",
  "common.back": "Înapoi",
  "common.comingSoon": "În curând",
};

// ============================================================
// ENGLISH
// ============================================================
const en: TranslationKeys = {
  "nav.home": "Home",
  "nav.dashboard": "Dashboard",
  "nav.newDiagnostic": "New Diagnostic",
  "nav.vehicles": "Vehicles",
  "nav.knowledgeBase": "Knowledge Base",
  "nav.profile": "Profile",
  "nav.login": "Login",
  "nav.getStarted": "Get Started",
  "nav.logout": "Logout",
  "nav.aiLearning": "AI Learning",
  "nav.chatAI": "AI Chat",
  "nav.adminKB": "Admin KB",
  "nav.swarmMonitoring": "Swarm Monitoring",
  "nav.agentFineTuning": "Agent Fine-tuning",

  "home.title": "Professional Auto Diagnostics",
  "home.titleHighlight": "Powered by AI",
  "home.subtitle": "Streamline your diagnostic workflow with intelligent symptom analysis, comprehensive history management, and instant AI-powered recommendations.",
  "home.cta": "Get Started",
  "home.feature1.title": "AI Diagnostics",
  "home.feature1.desc": "6 specialized AI agents analyze symptoms in parallel for fast and accurate diagnostics.",
  "home.feature2.title": "Knowledge Base",
  "home.feature2.desc": "Access ELSA, ETKA, Autodata manuals and technical bulletins for all brands.",
  "home.feature3.title": "Continuous Learning",
  "home.feature3.desc": "AI learns from each confirmed diagnostic, becoming more accurate over time.",

  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Welcome",
  "dashboard.totalDiagnostics": "Total Diagnostics",
  "dashboard.totalVehicles": "Total Vehicles",
  "dashboard.recentDiagnostics": "Recent Diagnostics",
  "dashboard.noDiagnostics": "No diagnostics yet",
  "dashboard.createFirst": "Create Your First Diagnostic",
  "dashboard.search": "Search diagnostics...",
  "dashboard.loading": "Loading...",

  "diag.newTitle": "New Diagnostic",
  "diag.step1.title": "Vehicle Data",
  "diag.step1.desc": "Enter vehicle data or scan the registration certificate",
  "diag.step2.title": "Symptoms & Error Codes",
  "diag.step2.desc": "Describe symptoms and enter error codes",
  "diag.step3.title": "AI Analysis",
  "diag.step3.desc": "AI agents analyze data in parallel",
  "diag.step4.title": "Results",
  "diag.step4.desc": "Complete diagnostic with step-by-step solutions",
  "diag.brand": "Brand",
  "diag.model": "Model",
  "diag.year": "Year",
  "diag.engine": "Engine",
  "diag.mileage": "Mileage",
  "diag.vin": "VIN Number",
  "diag.vinDecode": "Decode VIN",
  "diag.uploadCertificate": "Upload vehicle certificate",
  "diag.ocrExtract": "Extract data from photo",
  "diag.symptoms": "Symptoms",
  "diag.symptomsPlaceholder": "Describe vehicle symptoms...",
  "diag.errorCodes": "Error Codes",
  "diag.errorCodesPlaceholder": "e.g.: P0300, P0171, P0420",
  "diag.category": "Category",
  "diag.conditions": "Occurrence conditions",
  "diag.conditionsPlaceholder": "When does the problem occur? (cold start, warm, driving...)",
  "diag.next": "Next",
  "diag.previous": "Previous",
  "diag.startAnalysis": "Start Analysis",
  "diag.analyzing": "Analyzing...",
  "diag.analysisComplete": "Analysis complete!",

  "results.title": "Diagnostic Results",
  "results.accuracy": "Accuracy",
  "results.probableCauses": "Probable Causes",
  "results.eliminationSteps": "Elimination Steps",
  "results.repairProcedure": "Repair Procedure",
  "results.partsNeeded": "Parts Needed",
  "results.estimatedCost": "Estimated Cost",
  "results.severity": "Severity",
  "results.critical": "Critical",
  "results.high": "High",
  "results.medium": "Medium",
  "results.low": "Low",
  "results.exportPDF": "Export PDF Report",
  "results.chatAI": "AI Chat",
  "results.sendFeedback": "Send Feedback",
  "results.newDiagnostic": "New Diagnostic",
  "results.backToDashboard": "Back to Dashboard",
  "results.step": "Step",
  "results.toolsNeeded": "Tools needed",
  "results.estimatedTime": "Estimated time",
  "results.ifPositive": "If positive",
  "results.ifNegative": "If negative",
  "results.oemCode": "OEM Code",
  "results.aftermarket": "Aftermarket",
  "results.price": "Price",
  "results.laborCost": "Labor cost",

  "cat.engine": "Engine",
  "cat.transmission": "Transmission",
  "cat.brakes": "Brakes",
  "cat.electrical": "Electrical",
  "cat.suspension": "Suspension",
  "cat.cooling": "Cooling",
  "cat.exhaust": "Exhaust",
  "cat.steering": "Steering",
  "cat.fuel": "Fuel System",
  "cat.ac": "A/C",
  "cat.body": "Body",
  "cat.other": "Other",

  "profile.title": "Mechanic Profile",
  "profile.workshop": "Workshop",
  "profile.phone": "Phone",
  "profile.city": "City",
  "profile.experience": "Years of experience",
  "profile.specialties": "Specialties",
  "profile.save": "Save",
  "profile.saved": "Profile saved!",

  "kb.title": "Knowledge Base",
  "kb.search": "Search",
  "kb.searchPlaceholder": "Search issue, error code, symptom...",
  "kb.noResults": "No results found",
  "kb.commonIssues": "Common Issues",
  "kb.estimatedCost": "Estimated cost",
  "kb.difficulty": "Difficulty",

  "adminKb.title": "Admin - Knowledge Base",
  "adminKb.upload": "Upload Document",
  "adminKb.category": "Category",
  "adminKb.documents": "Documents",
  "adminKb.noDocuments": "No documents uploaded",

  "chat.title": "AI Diagnostic Chat",
  "chat.placeholder": "Ask a question about the diagnostic...",
  "chat.suggestedPrompts": "Suggestions",

  "feedback.title": "Diagnostic Feedback",
  "feedback.rating": "Rating",
  "feedback.correct": "Correct",
  "feedback.partial": "Partially correct",
  "feedback.incorrect": "Incorrect",
  "feedback.notes": "Additional notes",
  "feedback.submit": "Submit Feedback",
  "feedback.submitted": "Feedback submitted!",

  "learning.title": "AI Learning Dashboard",
  "learning.accuracy": "Global Accuracy",
  "learning.patterns": "Learned Patterns",
  "learning.improvements": "Improvements",

  "common.loading": "Loading...",
  "common.error": "Error",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.search": "Search",
  "common.filter": "Filter",
  "common.all": "All",
  "common.noData": "No data available",
  "common.confirm": "Confirm",
  "common.back": "Back",
  "common.comingSoon": "Coming soon",
};

// ============================================================
// FRENCH
// ============================================================
const fr: TranslationKeys = {
  "nav.home": "Accueil",
  "nav.dashboard": "Tableau de bord",
  "nav.newDiagnostic": "Nouveau Diagnostic",
  "nav.vehicles": "Véhicules",
  "nav.knowledgeBase": "Base de Connaissances",
  "nav.profile": "Profil",
  "nav.login": "Connexion",
  "nav.getStarted": "Commencer",
  "nav.logout": "Déconnexion",
  "nav.aiLearning": "Apprentissage IA",
  "nav.chatAI": "Chat IA",
  "nav.adminKB": "Admin BC",
  "nav.swarmMonitoring": "Suivi Swarm",
  "nav.agentFineTuning": "Réglage Agents",

  "home.title": "Diagnostic Auto Professionnel",
  "home.titleHighlight": "Propulsé par l'IA",
  "home.subtitle": "Optimisez votre flux de diagnostic avec l'analyse intelligente des symptômes, la gestion complète de l'historique et les recommandations IA instantanées.",
  "home.cta": "Commencer",
  "home.feature1.title": "Diagnostic IA",
  "home.feature1.desc": "6 agents IA spécialisés analysent les symptômes en parallèle pour un diagnostic rapide et précis.",
  "home.feature2.title": "Base de Connaissances",
  "home.feature2.desc": "Accès aux manuels ELSA, ETKA, Autodata et bulletins techniques pour toutes les marques.",
  "home.feature3.title": "Apprentissage Continu",
  "home.feature3.desc": "L'IA apprend de chaque diagnostic confirmé, devenant plus précise avec le temps.",

  "dashboard.title": "Tableau de bord",
  "dashboard.welcome": "Bienvenue",
  "dashboard.totalDiagnostics": "Total Diagnostics",
  "dashboard.totalVehicles": "Total Véhicules",
  "dashboard.recentDiagnostics": "Diagnostics Récents",
  "dashboard.noDiagnostics": "Aucun diagnostic",
  "dashboard.createFirst": "Créer Votre Premier Diagnostic",
  "dashboard.search": "Rechercher un diagnostic...",
  "dashboard.loading": "Chargement...",

  "diag.newTitle": "Nouveau Diagnostic",
  "diag.step1.title": "Données Véhicule",
  "diag.step1.desc": "Entrez les données du véhicule ou scannez le certificat d'immatriculation",
  "diag.step2.title": "Symptômes & Codes Erreur",
  "diag.step2.desc": "Décrivez les symptômes et entrez les codes d'erreur",
  "diag.step3.title": "Analyse IA",
  "diag.step3.desc": "Les agents IA analysent les données en parallèle",
  "diag.step4.title": "Résultats",
  "diag.step4.desc": "Diagnostic complet avec solutions étape par étape",
  "diag.brand": "Marque",
  "diag.model": "Modèle",
  "diag.year": "Année",
  "diag.engine": "Moteur",
  "diag.mileage": "Kilométrage",
  "diag.vin": "Numéro VIN",
  "diag.vinDecode": "Décoder VIN",
  "diag.uploadCertificate": "Télécharger le certificat",
  "diag.ocrExtract": "Extraire les données de la photo",
  "diag.symptoms": "Symptômes",
  "diag.symptomsPlaceholder": "Décrivez les symptômes du véhicule...",
  "diag.errorCodes": "Codes Erreur",
  "diag.errorCodesPlaceholder": "ex: P0300, P0171, P0420",
  "diag.category": "Catégorie",
  "diag.conditions": "Conditions d'apparition",
  "diag.conditionsPlaceholder": "Quand le problème apparaît-il? (à froid, à chaud, en roulant...)",
  "diag.next": "Suivant",
  "diag.previous": "Précédent",
  "diag.startAnalysis": "Lancer l'Analyse",
  "diag.analyzing": "Analyse en cours...",
  "diag.analysisComplete": "Analyse terminée!",

  "results.title": "Résultats du Diagnostic",
  "results.accuracy": "Précision",
  "results.probableCauses": "Causes Probables",
  "results.eliminationSteps": "Étapes d'Élimination",
  "results.repairProcedure": "Procédure de Réparation",
  "results.partsNeeded": "Pièces Nécessaires",
  "results.estimatedCost": "Coût Estimé",
  "results.severity": "Sévérité",
  "results.critical": "Critique",
  "results.high": "Élevé",
  "results.medium": "Moyen",
  "results.low": "Faible",
  "results.exportPDF": "Exporter Rapport PDF",
  "results.chatAI": "Chat IA",
  "results.sendFeedback": "Envoyer Feedback",
  "results.newDiagnostic": "Nouveau Diagnostic",
  "results.backToDashboard": "Retour au Tableau de bord",
  "results.step": "Étape",
  "results.toolsNeeded": "Outils nécessaires",
  "results.estimatedTime": "Temps estimé",
  "results.ifPositive": "Si positif",
  "results.ifNegative": "Si négatif",
  "results.oemCode": "Code OEM",
  "results.aftermarket": "Aftermarket",
  "results.price": "Prix",
  "results.laborCost": "Coût main-d'œuvre",

  "cat.engine": "Moteur",
  "cat.transmission": "Transmission",
  "cat.brakes": "Freins",
  "cat.electrical": "Électrique",
  "cat.suspension": "Suspension",
  "cat.cooling": "Refroidissement",
  "cat.exhaust": "Échappement",
  "cat.steering": "Direction",
  "cat.fuel": "Alimentation",
  "cat.ac": "Climatisation",
  "cat.body": "Carrosserie",
  "cat.other": "Autre",

  "profile.title": "Profil Mécanicien",
  "profile.workshop": "Atelier",
  "profile.phone": "Téléphone",
  "profile.city": "Ville",
  "profile.experience": "Années d'expérience",
  "profile.specialties": "Spécialités",
  "profile.save": "Enregistrer",
  "profile.saved": "Profil enregistré!",

  "kb.title": "Base de Connaissances",
  "kb.search": "Rechercher",
  "kb.searchPlaceholder": "Rechercher problème, code erreur, symptôme...",
  "kb.noResults": "Aucun résultat trouvé",
  "kb.commonIssues": "Problèmes Fréquents",
  "kb.estimatedCost": "Coût estimé",
  "kb.difficulty": "Difficulté",

  "adminKb.title": "Admin - Base de Connaissances",
  "adminKb.upload": "Télécharger Document",
  "adminKb.category": "Catégorie",
  "adminKb.documents": "Documents",
  "adminKb.noDocuments": "Aucun document téléchargé",

  "chat.title": "Chat IA Diagnostic",
  "chat.placeholder": "Posez une question sur le diagnostic...",
  "chat.suggestedPrompts": "Suggestions",

  "feedback.title": "Feedback Diagnostic",
  "feedback.rating": "Évaluation",
  "feedback.correct": "Correct",
  "feedback.partial": "Partiellement correct",
  "feedback.incorrect": "Incorrect",
  "feedback.notes": "Notes supplémentaires",
  "feedback.submit": "Envoyer Feedback",
  "feedback.submitted": "Feedback envoyé!",

  "learning.title": "Tableau de bord Apprentissage IA",
  "learning.accuracy": "Précision Globale",
  "learning.patterns": "Patterns Appris",
  "learning.improvements": "Améliorations",

  "common.loading": "Chargement...",
  "common.error": "Erreur",
  "common.save": "Enregistrer",
  "common.cancel": "Annuler",
  "common.delete": "Supprimer",
  "common.edit": "Modifier",
  "common.search": "Rechercher",
  "common.filter": "Filtrer",
  "common.all": "Tous",
  "common.noData": "Aucune donnée disponible",
  "common.confirm": "Confirmer",
  "common.back": "Retour",
  "common.comingSoon": "Bientôt disponible",
};

// ============================================================
// GERMAN
// ============================================================
const de: TranslationKeys = {
  "nav.home": "Startseite",
  "nav.dashboard": "Dashboard",
  "nav.newDiagnostic": "Neue Diagnose",
  "nav.vehicles": "Fahrzeuge",
  "nav.knowledgeBase": "Wissensdatenbank",
  "nav.profile": "Profil",
  "nav.login": "Anmelden",
  "nav.getStarted": "Jetzt starten",
  "nav.logout": "Abmelden",
  "nav.aiLearning": "KI-Lernen",
  "nav.chatAI": "KI-Chat",
  "nav.adminKB": "Admin WB",
  "nav.swarmMonitoring": "Schwarm-Überwachung",
  "nav.agentFineTuning": "Agenten-Feinabstimmung",

  "home.title": "Professionelle Kfz-Diagnose",
  "home.titleHighlight": "KI-gestützt",
  "home.subtitle": "Optimieren Sie Ihren Diagnose-Workflow mit intelligenter Symptomanalyse, umfassender Historienverwaltung und sofortigen KI-Empfehlungen.",
  "home.cta": "Jetzt starten",
  "home.feature1.title": "KI-Diagnose",
  "home.feature1.desc": "6 spezialisierte KI-Agenten analysieren Symptome parallel für schnelle und genaue Diagnosen.",
  "home.feature2.title": "Wissensdatenbank",
  "home.feature2.desc": "Zugang zu ELSA, ETKA, Autodata Handbüchern und technischen Bulletins für alle Marken.",
  "home.feature3.title": "Kontinuierliches Lernen",
  "home.feature3.desc": "Die KI lernt aus jeder bestätigten Diagnose und wird mit der Zeit genauer.",

  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Willkommen",
  "dashboard.totalDiagnostics": "Gesamtdiagnosen",
  "dashboard.totalVehicles": "Gesamtfahrzeuge",
  "dashboard.recentDiagnostics": "Aktuelle Diagnosen",
  "dashboard.noDiagnostics": "Noch keine Diagnosen",
  "dashboard.createFirst": "Erste Diagnose erstellen",
  "dashboard.search": "Diagnose suchen...",
  "dashboard.loading": "Laden...",

  "diag.newTitle": "Neue Diagnose",
  "diag.step1.title": "Fahrzeugdaten",
  "diag.step1.desc": "Fahrzeugdaten eingeben oder Fahrzeugschein scannen",
  "diag.step2.title": "Symptome & Fehlercodes",
  "diag.step2.desc": "Symptome beschreiben und Fehlercodes eingeben",
  "diag.step3.title": "KI-Analyse",
  "diag.step3.desc": "KI-Agenten analysieren die Daten parallel",
  "diag.step4.title": "Ergebnisse",
  "diag.step4.desc": "Vollständige Diagnose mit Schritt-für-Schritt-Lösungen",
  "diag.brand": "Marke",
  "diag.model": "Modell",
  "diag.year": "Baujahr",
  "diag.engine": "Motor",
  "diag.mileage": "Kilometerstand",
  "diag.vin": "Fahrgestellnummer (VIN)",
  "diag.vinDecode": "VIN dekodieren",
  "diag.uploadCertificate": "Fahrzeugschein hochladen",
  "diag.ocrExtract": "Daten aus Foto extrahieren",
  "diag.symptoms": "Symptome",
  "diag.symptomsPlaceholder": "Beschreiben Sie die Fahrzeugsymptome...",
  "diag.errorCodes": "Fehlercodes",
  "diag.errorCodesPlaceholder": "z.B.: P0300, P0171, P0420",
  "diag.category": "Kategorie",
  "diag.conditions": "Auftrittsbedingungen",
  "diag.conditionsPlaceholder": "Wann tritt das Problem auf? (Kaltstart, warm, während der Fahrt...)",
  "diag.next": "Weiter",
  "diag.previous": "Zurück",
  "diag.startAnalysis": "Analyse starten",
  "diag.analyzing": "Analyse läuft...",
  "diag.analysisComplete": "Analyse abgeschlossen!",

  "results.title": "Diagnoseergebnisse",
  "results.accuracy": "Genauigkeit",
  "results.probableCauses": "Wahrscheinliche Ursachen",
  "results.eliminationSteps": "Ausschlussschritte",
  "results.repairProcedure": "Reparaturverfahren",
  "results.partsNeeded": "Benötigte Teile",
  "results.estimatedCost": "Geschätzte Kosten",
  "results.severity": "Schweregrad",
  "results.critical": "Kritisch",
  "results.high": "Hoch",
  "results.medium": "Mittel",
  "results.low": "Niedrig",
  "results.exportPDF": "PDF-Bericht exportieren",
  "results.chatAI": "KI-Chat",
  "results.sendFeedback": "Feedback senden",
  "results.newDiagnostic": "Neue Diagnose",
  "results.backToDashboard": "Zurück zum Dashboard",
  "results.step": "Schritt",
  "results.toolsNeeded": "Benötigte Werkzeuge",
  "results.estimatedTime": "Geschätzte Zeit",
  "results.ifPositive": "Wenn positiv",
  "results.ifNegative": "Wenn negativ",
  "results.oemCode": "OEM-Code",
  "results.aftermarket": "Aftermarket",
  "results.price": "Preis",
  "results.laborCost": "Arbeitskosten",

  "cat.engine": "Motor",
  "cat.transmission": "Getriebe",
  "cat.brakes": "Bremsen",
  "cat.electrical": "Elektrik",
  "cat.suspension": "Fahrwerk",
  "cat.cooling": "Kühlung",
  "cat.exhaust": "Auspuff",
  "cat.steering": "Lenkung",
  "cat.fuel": "Kraftstoff",
  "cat.ac": "Klimaanlage",
  "cat.body": "Karosserie",
  "cat.other": "Sonstiges",

  "profile.title": "Mechaniker-Profil",
  "profile.workshop": "Werkstatt",
  "profile.phone": "Telefon",
  "profile.city": "Stadt",
  "profile.experience": "Jahre Erfahrung",
  "profile.specialties": "Spezialisierungen",
  "profile.save": "Speichern",
  "profile.saved": "Profil gespeichert!",

  "kb.title": "Wissensdatenbank",
  "kb.search": "Suchen",
  "kb.searchPlaceholder": "Problem, Fehlercode, Symptom suchen...",
  "kb.noResults": "Keine Ergebnisse gefunden",
  "kb.commonIssues": "Häufige Probleme",
  "kb.estimatedCost": "Geschätzte Kosten",
  "kb.difficulty": "Schwierigkeit",

  "adminKb.title": "Admin - Wissensdatenbank",
  "adminKb.upload": "Dokument hochladen",
  "adminKb.category": "Kategorie",
  "adminKb.documents": "Dokumente",
  "adminKb.noDocuments": "Keine Dokumente hochgeladen",

  "chat.title": "KI-Diagnose-Chat",
  "chat.placeholder": "Stellen Sie eine Frage zur Diagnose...",
  "chat.suggestedPrompts": "Vorschläge",

  "feedback.title": "Diagnose-Feedback",
  "feedback.rating": "Bewertung",
  "feedback.correct": "Korrekt",
  "feedback.partial": "Teilweise korrekt",
  "feedback.incorrect": "Inkorrekt",
  "feedback.notes": "Zusätzliche Anmerkungen",
  "feedback.submit": "Feedback senden",
  "feedback.submitted": "Feedback gesendet!",

  "learning.title": "KI-Lern-Dashboard",
  "learning.accuracy": "Globale Genauigkeit",
  "learning.patterns": "Gelernte Muster",
  "learning.improvements": "Verbesserungen",

  "common.loading": "Laden...",
  "common.error": "Fehler",
  "common.save": "Speichern",
  "common.cancel": "Abbrechen",
  "common.delete": "Löschen",
  "common.edit": "Bearbeiten",
  "common.search": "Suchen",
  "common.filter": "Filtern",
  "common.all": "Alle",
  "common.noData": "Keine Daten verfügbar",
  "common.confirm": "Bestätigen",
  "common.back": "Zurück",
  "common.comingSoon": "Demnächst verfügbar",
};

// ============================================================
// ITALIAN
// ============================================================
const it: TranslationKeys = {
  "nav.home": "Home",
  "nav.dashboard": "Dashboard",
  "nav.newDiagnostic": "Nuova Diagnosi",
  "nav.vehicles": "Veicoli",
  "nav.knowledgeBase": "Base di Conoscenza",
  "nav.profile": "Profilo",
  "nav.login": "Accedi",
  "nav.getStarted": "Inizia Ora",
  "nav.logout": "Esci",
  "nav.aiLearning": "Apprendimento IA",
  "nav.chatAI": "Chat IA",
  "nav.adminKB": "Admin BC",
  "nav.swarmMonitoring": "Monitoraggio Swarm",
  "nav.agentFineTuning": "Regolazione Agenti",

  "home.title": "Diagnostica Auto Professionale",
  "home.titleHighlight": "Alimentata dall'IA",
  "home.subtitle": "Ottimizza il tuo flusso diagnostico con l'analisi intelligente dei sintomi, la gestione completa dello storico e le raccomandazioni IA istantanee.",
  "home.cta": "Inizia Ora",
  "home.feature1.title": "Diagnostica IA",
  "home.feature1.desc": "6 agenti IA specializzati analizzano i sintomi in parallelo per diagnosi rapide e accurate.",
  "home.feature2.title": "Base di Conoscenza",
  "home.feature2.desc": "Accesso a manuali ELSA, ETKA, Autodata e bollettini tecnici per tutti i marchi.",
  "home.feature3.title": "Apprendimento Continuo",
  "home.feature3.desc": "L'IA impara da ogni diagnosi confermata, diventando più precisa nel tempo.",

  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Benvenuto",
  "dashboard.totalDiagnostics": "Diagnosi Totali",
  "dashboard.totalVehicles": "Veicoli Totali",
  "dashboard.recentDiagnostics": "Diagnosi Recenti",
  "dashboard.noDiagnostics": "Nessuna diagnosi ancora",
  "dashboard.createFirst": "Crea la Tua Prima Diagnosi",
  "dashboard.search": "Cerca diagnosi...",
  "dashboard.loading": "Caricamento...",

  "diag.newTitle": "Nuova Diagnosi",
  "diag.step1.title": "Dati Veicolo",
  "diag.step1.desc": "Inserisci i dati del veicolo o scansiona il certificato di immatricolazione",
  "diag.step2.title": "Sintomi & Codici Errore",
  "diag.step2.desc": "Descrivi i sintomi e inserisci i codici di errore",
  "diag.step3.title": "Analisi IA",
  "diag.step3.desc": "Gli agenti IA analizzano i dati in parallelo",
  "diag.step4.title": "Risultati",
  "diag.step4.desc": "Diagnosi completa con soluzioni passo dopo passo",
  "diag.brand": "Marca",
  "diag.model": "Modello",
  "diag.year": "Anno",
  "diag.engine": "Motore",
  "diag.mileage": "Chilometraggio",
  "diag.vin": "Numero VIN",
  "diag.vinDecode": "Decodifica VIN",
  "diag.uploadCertificate": "Carica certificato veicolo",
  "diag.ocrExtract": "Estrai dati dalla foto",
  "diag.symptoms": "Sintomi",
  "diag.symptomsPlaceholder": "Descrivi i sintomi del veicolo...",
  "diag.errorCodes": "Codici Errore",
  "diag.errorCodesPlaceholder": "es: P0300, P0171, P0420",
  "diag.category": "Categoria",
  "diag.conditions": "Condizioni di comparsa",
  "diag.conditionsPlaceholder": "Quando si verifica il problema? (a freddo, a caldo, in marcia...)",
  "diag.next": "Avanti",
  "diag.previous": "Indietro",
  "diag.startAnalysis": "Avvia Analisi",
  "diag.analyzing": "Analisi in corso...",
  "diag.analysisComplete": "Analisi completata!",

  "results.title": "Risultati della Diagnosi",
  "results.accuracy": "Accuratezza",
  "results.probableCauses": "Cause Probabili",
  "results.eliminationSteps": "Passi di Eliminazione",
  "results.repairProcedure": "Procedura di Riparazione",
  "results.partsNeeded": "Ricambi Necessari",
  "results.estimatedCost": "Costo Stimato",
  "results.severity": "Gravità",
  "results.critical": "Critico",
  "results.high": "Alto",
  "results.medium": "Medio",
  "results.low": "Basso",
  "results.exportPDF": "Esporta Rapporto PDF",
  "results.chatAI": "Chat IA",
  "results.sendFeedback": "Invia Feedback",
  "results.newDiagnostic": "Nuova Diagnosi",
  "results.backToDashboard": "Torna al Dashboard",
  "results.step": "Passo",
  "results.toolsNeeded": "Strumenti necessari",
  "results.estimatedTime": "Tempo stimato",
  "results.ifPositive": "Se positivo",
  "results.ifNegative": "Se negativo",
  "results.oemCode": "Codice OEM",
  "results.aftermarket": "Aftermarket",
  "results.price": "Prezzo",
  "results.laborCost": "Costo manodopera",

  "cat.engine": "Motore",
  "cat.transmission": "Trasmissione",
  "cat.brakes": "Freni",
  "cat.electrical": "Elettrico",
  "cat.suspension": "Sospensioni",
  "cat.cooling": "Raffreddamento",
  "cat.exhaust": "Scarico",
  "cat.steering": "Sterzo",
  "cat.fuel": "Alimentazione",
  "cat.ac": "Climatizzazione",
  "cat.body": "Carrozzeria",
  "cat.other": "Altro",

  "profile.title": "Profilo Meccanico",
  "profile.workshop": "Officina",
  "profile.phone": "Telefono",
  "profile.city": "Città",
  "profile.experience": "Anni di esperienza",
  "profile.specialties": "Specializzazioni",
  "profile.save": "Salva",
  "profile.saved": "Profilo salvato!",

  "kb.title": "Base di Conoscenza",
  "kb.search": "Cerca",
  "kb.searchPlaceholder": "Cerca problema, codice errore, sintomo...",
  "kb.noResults": "Nessun risultato trovato",
  "kb.commonIssues": "Problemi Comuni",
  "kb.estimatedCost": "Costo stimato",
  "kb.difficulty": "Difficoltà",

  "adminKb.title": "Admin - Base di Conoscenza",
  "adminKb.upload": "Carica Documento",
  "adminKb.category": "Categoria",
  "adminKb.documents": "Documenti",
  "adminKb.noDocuments": "Nessun documento caricato",

  "chat.title": "Chat IA Diagnostica",
  "chat.placeholder": "Fai una domanda sulla diagnosi...",
  "chat.suggestedPrompts": "Suggerimenti",

  "feedback.title": "Feedback Diagnosi",
  "feedback.rating": "Valutazione",
  "feedback.correct": "Corretto",
  "feedback.partial": "Parzialmente corretto",
  "feedback.incorrect": "Scorretto",
  "feedback.notes": "Note aggiuntive",
  "feedback.submit": "Invia Feedback",
  "feedback.submitted": "Feedback inviato!",

  "learning.title": "Dashboard Apprendimento IA",
  "learning.accuracy": "Accuratezza Globale",
  "learning.patterns": "Pattern Appresi",
  "learning.improvements": "Miglioramenti",

  "common.loading": "Caricamento...",
  "common.error": "Errore",
  "common.save": "Salva",
  "common.cancel": "Annulla",
  "common.delete": "Elimina",
  "common.edit": "Modifica",
  "common.search": "Cerca",
  "common.filter": "Filtra",
  "common.all": "Tutti",
  "common.noData": "Nessun dato disponibile",
  "common.confirm": "Conferma",
  "common.back": "Indietro",
  "common.comingSoon": "Prossimamente",
};

// ============================================================
// TRANSLATIONS MAP
// ============================================================
const translations: Record<Language, TranslationKeys> = { ro, en, fr, de, it };

// ============================================================
// CONTEXT & HOOK
// ============================================================
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationKeys) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "mechanic-helper-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && translations[saved as Language]) {
        return saved as Language;
      }
      // Auto-detect browser language
      const browserLang = navigator.language.slice(0, 2).toLowerCase();
      if (translations[browserLang as Language]) {
        return browserLang as Language;
      }
    }
    return "ro"; // Default to Romanian
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  };

  const t = (key: keyof TranslationKeys): string => {
    return translations[language]?.[key] || translations.ro[key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
