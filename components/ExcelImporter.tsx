"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, X, Upload, ArrowRight, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addPatient } from "@/lib/patients";
import { toast } from "sonner";

interface ExcelImporterProps {
    onImportSuccess: () => void;
}

export function ExcelImporter({ onImportSuccess }: ExcelImporterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [jsonData, setJsonData] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mapping State
    const [mapping, setMapping] = useState({
        name: "",
        phone: "",
        time: ""
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        parseFile(selectedFile);
    };

    const parseFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                if (json.length > 0) {
                    const extractedHeaders = json[0] as string[];
                    setHeaders(extractedHeaders);

                    // Remove header row for data
                    const dataRows = XLSX.utils.sheet_to_json(sheet);
                    setJsonData(dataRows);

                    // Auto-detect mapping
                    const newMapping = { name: "", phone: "", time: "" };
                    extractedHeaders.forEach(header => {
                        const h = header.toLowerCase();
                        if (h.includes("nom") || h.includes("patient") || h.includes("name")) newMapping.name = header;
                        if (h.includes("tel") || h.includes("tél") || h.includes("gsm") || h.includes("phone")) newMapping.phone = header;
                        if (h.includes("heure") || h.includes("time") || h.includes("rdv")) newMapping.time = header;
                    });
                    setMapping(newMapping);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Error parsing file:", error);
                toast.error("Erreur lors de la lecture du fichier");
            }
        };
        reader.readAsBinaryString(file);
    };

    const cleanPhoneNumber = (rawPhone: any): string => {
        if (!rawPhone) return "";
        const str = String(rawPhone);
        // Remove non-digits
        const digits = str.replace(/\D/g, "");
        // Keep last 8 digits
        return digits.slice(-8);
    };

    const handleImport = async () => {
        if (!mapping.name) {
            toast.error("Veuillez sélectionner la colonne pour le Nom");
            return;
        }

        setIsImporting(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            for (const row of jsonData) {
                const name = row[mapping.name];
                if (!name) continue; // Skip rows without name

                const rawPhone = mapping.phone ? row[mapping.phone] : "";
                const phone = cleanPhoneNumber(rawPhone);

                const rawTime = mapping.time ? row[mapping.time] : "";
                let type: "walk-in" | "rdv" = "walk-in";
                let rdvTime = undefined;

                if (rawTime) {
                    type = "rdv";
                    // Try to parse time
                    // If it's an Excel serial date
                    if (typeof rawTime === 'number') {
                        const date = new Date(Math.round((rawTime - 25569) * 86400 * 1000));
                        // Adjust for timezone if needed, but usually simple extraction works
                        const hours = date.getUTCHours();
                        const minutes = date.getUTCMinutes();

                        const today = new Date();
                        today.setHours(hours, minutes, 0, 0);
                        rdvTime = today.toISOString();
                    } else if (typeof rawTime === 'string') {
                        // Try parsing "HH:MM" string
                        const [hours, minutes] = rawTime.split(':').map(Number);
                        if (!isNaN(hours) && !isNaN(minutes)) {
                            const today = new Date();
                            today.setHours(hours, minutes, 0, 0);
                            rdvTime = today.toISOString();
                        }
                    }
                }

                try {
                    await addPatient(
                        String(name).trim(),
                        phone,
                        type,
                        rdvTime,
                        "consultation", // Default motif
                        false // Not priority
                    );
                    successCount++;
                } catch (err) {
                    console.error("Error importing row:", row, err);
                    errorCount++;
                }
            }

            toast.success(`${successCount} patients importés avec succès`);
            if (errorCount > 0) {
                toast.warning(`${errorCount} erreurs lors de l'importation`);
            }

            onImportSuccess();
            setIsOpen(false);
            setFile(null);
        } catch (error) {
            console.error("Import error:", error);
            toast.error("Erreur critique lors de l'importation");
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-black bg-white px-6 py-3 text-sm font-bold text-black shadow-[4px_4px_0px_0px_#000] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-50 mt-3"
            >
                <FileSpreadsheet className="h-5 w-5" />
                IMPORTER LISTE EXCEL
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-lg border-4 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden"
                        >
                            <div className="bg-gray-50 border-b-4 border-black p-4 flex items-center justify-between">
                                <h2 className="font-display font-black text-xl uppercase tracking-wide flex items-center gap-2">
                                    <FileSpreadsheet className="h-6 w-6" />
                                    Harmonisation des Colonnes
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors border-2 border-transparent hover:border-black"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg flex gap-3 items-start">
                                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-800 font-medium">
                                        Aidez-nous à comprendre votre fichier. Associez les colonnes de votre Excel aux champs Saffi.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Name Mapping */}
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-5 font-bold text-sm uppercase">Nom du Patient *</div>
                                        <div className="col-span-2 flex justify-center"><ArrowRight className="h-4 w-4 text-gray-400" /></div>
                                        <div className="col-span-5">
                                            <select
                                                value={mapping.name}
                                                onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                                                className="w-full border-2 border-black p-2 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                            >
                                                <option value="">Choisir colonne...</option>
                                                {headers.map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Phone Mapping */}
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-5 font-bold text-sm uppercase">Numéro de Tél</div>
                                        <div className="col-span-2 flex justify-center"><ArrowRight className="h-4 w-4 text-gray-400" /></div>
                                        <div className="col-span-5">
                                            <select
                                                value={mapping.phone}
                                                onChange={(e) => setMapping({ ...mapping, phone: e.target.value })}
                                                className="w-full border-2 border-black p-2 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                            >
                                                <option value="">Choisir colonne...</option>
                                                {headers.map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Time Mapping */}
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-5 font-bold text-sm uppercase">Heure (Optionnel)</div>
                                        <div className="col-span-2 flex justify-center"><ArrowRight className="h-4 w-4 text-gray-400" /></div>
                                        <div className="col-span-5">
                                            <select
                                                value={mapping.time}
                                                onChange={(e) => setMapping({ ...mapping, time: e.target.value })}
                                                className="w-full border-2 border-black p-2 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                            >
                                                <option value="">Choisir colonne...</option>
                                                {headers.map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleImport}
                                    disabled={isImporting || !mapping.name}
                                    className="w-full bg-[#10B981] text-white h-14 font-black text-lg uppercase tracking-wide border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isImporting ? (
                                        <>
                                            <Upload className="h-5 w-5 animate-bounce" />
                                            Importation...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-5 w-5" />
                                            Confirmer l'Import
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
