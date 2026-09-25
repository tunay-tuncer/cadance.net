"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import {
    ProjectItem,
    subscribeToUserProjects,
} from "@/lib/fireabase/projectService";
import {
    ProjectInvoiceRecord,
    subscribeToProjectInvoices,
    addProjectInvoice,
    updateProjectInvoice,
    deleteProjectInvoice,
} from "@/lib/fireabase/projectInvoiceService";
import {
    subscribeToProjectWorkItems,
    InvoiceWorkItem,
} from "@/lib/fireabase/invoiceWorkItemService";
import {
    ProjectCalculationRecord,
    subscribeToProjectCalculations,
} from "@/lib/fireabase/projectCalculationService";
import {
    calculateCalculationTotals,
    calculateProfitPricesExplicit,
} from "../../utils/calculatorMath";
import InvoiceForm from "../InvoiceForm/InvoiceForm";
import InvoiceProposalBar from "../InvoiceProposalBar/InvoiceProposalBar";
import ImportCalculationModal from "../ImportCalculationModal/ImportCalculationModal";
import {
    InvoiceData,
    InvoiceItem,
    initialInvoiceData,
    calculateTotal,
} from "../../types/invoice";
import viewerStyles from "../invoicePDF/InvoiceViewer.module.css";
import styles from "./InvoiceBuilder.module.css";

// Dynamically import the PDF viewer with ssr: false
const InvoiceViewer = dynamic(() => import("../invoicePDF/InvoiceViewer"), {
    ssr: false,
    loading: () => (
        <div className={viewerStyles.loadingWrapper}>
            <div className={viewerStyles.spinner} />
            <p className={viewerStyles.loadingText}>PDF önizleme motoru hazırlanıyor...</p>
        </div>
    ),
});

export default function InvoiceBuilder() {
    const { user } = useAuth();

    // 1. Projects State
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [projectsLoading, setProjectsLoading] = useState<boolean>(true);

    // 2. Project Invoices (Proposals) State
    const [invoices, setInvoices] = useState<ProjectInvoiceRecord[]>([]);
    const [invoicesLoading, setInvoicesLoading] = useState<boolean>(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [activeProposalName, setActiveProposalName] = useState<string>("");

    // 3. Current Invoice Form State
    const [invoiceData, setInvoiceData] = useState<InvoiceData>(initialInvoiceData);
    const [debouncedData, setDebouncedData] = useState<InvoiceData>(initialInvoiceData);

    // 4. Save & Feedback Status
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    const saveSuccessTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 5. Calculator Work Items & Calculations for optional import
    const [calculatorWorkItems, setCalculatorWorkItems] = useState<InvoiceWorkItem[]>([]);
    const [calculations, setCalculations] = useState<ProjectCalculationRecord[]>([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

    // Subscribe to User Projects
    useEffect(() => {
        if (!user?.uid) {
            setProjects([]);
            setProjectsLoading(false);
            return;
        }

        setProjectsLoading(true);
        const unsubscribe = subscribeToUserProjects(user.uid, (fetchedProjects) => {
            setProjects(fetchedProjects);
            setProjectsLoading(false);

            // If no project is currently selected, select the first available project
            setSelectedProjectId((prev) => {
                if (prev && fetchedProjects.some((p) => p.id === prev)) {
                    return prev;
                }
                return fetchedProjects.length > 0 ? fetchedProjects[0].id : "";
            });
        });

        return () => unsubscribe();
    }, [user?.uid]);

    // Subscribe to Proposals of the Selected Project
    useEffect(() => {
        if (!user?.uid || !selectedProjectId) {
            setInvoices([]);
            setSelectedInvoiceId(null);
            return;
        }

        setInvoicesLoading(true);
        const unsubscribe = subscribeToProjectInvoices(
            user.uid,
            selectedProjectId,
            (fetchedInvoices) => {
                setInvoices(fetchedInvoices);
                setInvoicesLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user?.uid, selectedProjectId]);

    // Subscribe to Calculator items of the Selected Project (for import feature fallback)
    useEffect(() => {
        if (!user?.uid || !selectedProjectId) {
            setCalculatorWorkItems([]);
            return;
        }

        const unsubscribe = subscribeToProjectWorkItems(
            user.uid,
            selectedProjectId,
            (items) => {
                setCalculatorWorkItems(items);
            }
        );

        return () => unsubscribe();
    }, [user?.uid, selectedProjectId]);

    // Subscribe to Multiple Calculations of the Selected Project
    useEffect(() => {
        if (!user?.uid || !selectedProjectId) {
            setCalculations([]);
            return;
        }

        const unsubscribe = subscribeToProjectCalculations(
            user.uid,
            selectedProjectId,
            (fetchedCalcs) => {
                setCalculations(fetchedCalcs);
            }
        );

        return () => unsubscribe();
    }, [user?.uid, selectedProjectId]);

    // Currently selected project object
    const selectedProject = useMemo(() => {
        return projects.find((p) => p.id === selectedProjectId) || null;
    }, [projects, selectedProjectId]);

    // Auto-load latest proposal or initialize defaults when project changes
    const previousProjectIdRef = useRef<string>("");
    useEffect(() => {
        if (!selectedProjectId) return;

        // When switching to a different project
        if (previousProjectIdRef.current !== selectedProjectId) {
            previousProjectIdRef.current = selectedProjectId;

            // If project has saved proposals, we'll select the latest one once loaded
            if (invoices.length > 0) {
                const latest = invoices[0];
                setSelectedInvoiceId(latest.id);
                setActiveProposalName(latest.name);
                if (latest.data) {
                    setInvoiceData(latest.data);
                }
                setHasUnsavedChanges(false);
            } else if (selectedProject) {
                // Initialize clean default invoice customized with project name
                setSelectedInvoiceId(null);
                const defaultName = `${selectedProject.name} - Teklif 1`;
                setActiveProposalName(defaultName);
                setInvoiceData({
                    ...initialInvoiceData,
                    documentTitle: `${selectedProject.name} Teklifi`,
                    isBilled: Boolean(selectedProject.isBilled),
                });
                setHasUnsavedChanges(false);
            }
        }
    }, [selectedProjectId, invoices, selectedProject]);

    // Debounce PDF re-render to ensure silky smooth typing in form inputs
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedData(invoiceData);
        }, 250);

        return () => clearTimeout(timer);
    }, [invoiceData]);

    // Project change handler
    const handleSelectProject = (projectId: string) => {
        if (projectId === selectedProjectId) return;
        setSelectedProjectId(projectId);
        setSelectedInvoiceId(null);
    };

    // Form input change handlers
    const handleFieldChange = <K extends keyof InvoiceData>(
        field: K,
        value: InvoiceData[K]
    ) => {
        setInvoiceData((prev) => ({
            ...prev,
            [field]: value,
        }));
        setHasUnsavedChanges(true);
    };

    const handleAddItem = () => {
        setInvoiceData((prev) => {
            const nextIndex = prev.items.length + 1;
            const newItem: InvoiceItem = {
                id: Date.now().toString(),
                itemNumber: String(nextIndex).padStart(2, "0"),
                title: "",
                description: "",
                price: "",
            };
            return {
                ...prev,
                items: [...prev.items, newItem],
            };
        });
        setHasUnsavedChanges(true);
    };

    const handleDeleteItem = (id: string) => {
        setInvoiceData((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.id !== id),
        }));
        setHasUnsavedChanges(true);
    };

    const handleItemChange = (
        id: string,
        field: keyof InvoiceItem,
        value: string
    ) => {
        setInvoiceData((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            ),
        }));
        setHasUnsavedChanges(true);
    };

    // Trigger visual success confirmation
    const triggerSaveSuccess = () => {
        setSaveSuccess(true);
        if (saveSuccessTimeoutRef.current) {
            clearTimeout(saveSuccessTimeoutRef.current);
        }
        saveSuccessTimeoutRef.current = setTimeout(() => {
            setSaveSuccess(false);
        }, 2200);
    };

    // 1. Select a Saved Proposal
    const handleSelectInvoice = (invoice: ProjectInvoiceRecord) => {
        setSelectedInvoiceId(invoice.id);
        setActiveProposalName(invoice.name);
        if (invoice.data) {
            setInvoiceData(invoice.data);
        }
        setHasUnsavedChanges(false);
    };

    // 2. Start a New Blank Proposal under the current project
    const handleNewBlank = () => {
        setSelectedInvoiceId(null);
        const nextIndex = invoices.length + 1;
        const newName = `${selectedProject?.name || "Proje"} - Teklif ${nextIndex}`;
        setActiveProposalName(newName);
        setInvoiceData({
            ...initialInvoiceData,
            documentTitle: `${selectedProject?.name || ""} Teklifi`,
            invoiceNumber: `TEK-${new Date().getFullYear()}-${String(nextIndex).padStart(3, "0")}`,
            issueDate: new Date().toISOString().split("T")[0],
            isBilled: Boolean(selectedProject?.isBilled),
            items: [
                {
                    id: "1",
                    itemNumber: "01",
                    title: "",
                    description: "",
                    price: "",
                },
            ],
        });
        setHasUnsavedChanges(false);
    };

    // 3. Save / Update Proposal
    const handleSave = async () => {
        if (!user?.uid || !selectedProjectId) {
            alert("Lütfen önce bir proje seçiniz.");
            return;
        }

        const totalFormatted = calculateTotal(invoiceData.items);
        const proposalName =
            activeProposalName.trim() ||
            invoiceData.documentTitle.trim() ||
            `${selectedProject?.name || "Proje"} Teklifi`;

        setIsSaving(true);
        try {
            if (selectedInvoiceId) {
                // Update existing proposal
                await updateProjectInvoice(user.uid, selectedProjectId, selectedInvoiceId, {
                    name: proposalName,
                    projectName: selectedProject?.name || "",
                    invoiceNumber: invoiceData.invoiceNumber,
                    totalAmount: totalFormatted,
                    itemCount: invoiceData.items.length,
                    isBilled: invoiceData.isBilled,
                    data: invoiceData,
                });
            } else {
                // Create new proposal
                const newDocId = await addProjectInvoice(user.uid, selectedProjectId, {
                    projectId: selectedProjectId,
                    projectName: selectedProject?.name || "",
                    name: proposalName,
                    invoiceNumber: invoiceData.invoiceNumber,
                    totalAmount: totalFormatted,
                    itemCount: invoiceData.items.length,
                    isBilled: invoiceData.isBilled,
                    data: invoiceData,
                });
                setSelectedInvoiceId(newDocId);
            }

            setHasUnsavedChanges(false);
            triggerSaveSuccess();
        } catch (error) {
            console.error("Error saving proposal:", error);
            alert("Teklif kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsSaving(false);
        }
    };

    // 4. Save As New (Fork / Versioning)
    const handleSaveAsNew = async () => {
        if (!user?.uid || !selectedProjectId) return;

        const defaultName = `${activeProposalName} (Revize)`;
        const newName = window.prompt(
            "Yeni teklif versiyonu için bir isim belirleyiniz:",
            defaultName
        );

        if (!newName || !newName.trim()) return;

        const totalFormatted = calculateTotal(invoiceData.items);
        setIsSaving(true);
        try {
            const newDocId = await addProjectInvoice(user.uid, selectedProjectId, {
                projectId: selectedProjectId,
                projectName: selectedProject?.name || "",
                name: newName.trim(),
                invoiceNumber: invoiceData.invoiceNumber,
                totalAmount: totalFormatted,
                itemCount: invoiceData.items.length,
                isBilled: invoiceData.isBilled,
                data: invoiceData,
            });

            setSelectedInvoiceId(newDocId);
            setActiveProposalName(newName.trim());
            setHasUnsavedChanges(false);
            triggerSaveSuccess();
        } catch (error) {
            console.error("Error saving as new proposal:", error);
            alert("Farklı kaydetme sırasında bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    // 5. Delete Proposal
    const handleDeleteInvoice = async (invoiceId: string, invoiceName: string) => {
        if (!user?.uid || !selectedProjectId) return;

        try {
            await deleteProjectInvoice(user.uid, selectedProjectId, invoiceId);

            // If the currently open proposal was deleted, reset to blank
            if (selectedInvoiceId === invoiceId) {
                handleNewBlank();
            }
        } catch (error) {
            console.error("Error deleting proposal:", error);
            alert("Teklif silinirken bir hata oluştu.");
        }
    };

    // 6. Optional: Import Work Items from Selected Calculation
    const handleSelectCalculationForImport = (calc: ProjectCalculationRecord) => {
        const isProjectBilled = Boolean(selectedProject?.isBilled);
        const profitMap = calculateProfitPricesExplicit(
            calc.items,
            calc.targetProfit || 0,
            isProjectBilled,
            calc.useGrossUp || false
        );

        const importedItems: InvoiceItem[] = calc.items.map((item, index) => {
            const detail = profitMap.get(item.id || String(index));
            const finalPrice = detail ? detail.profitPrice : Number(item.rawCost || 0);

            return {
                id: item.id || String(index + 1),
                itemNumber: item.number || String(index + 1).padStart(2, "0"),
                title: item.name,
                description: item.description || "",
                price: finalPrice.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }),
            };
        });

        setInvoiceData((prev) => ({
            ...prev,
            isBilled: isProjectBilled,
            items: importedItems,
        }));
        setHasUnsavedChanges(true);
        setIsImportModalOpen(false);
    };

    // Synthesize displayCalculations (including legacy items fallback if any)
    const displayCalculations = useMemo(() => {
        if (calculations.length > 0) return calculations;
        if (calculatorWorkItems.length > 0 && selectedProject) {
            const totals = calculateCalculationTotals(
                calculatorWorkItems,
                Number(selectedProject.targetProfit) || 0,
                Boolean(selectedProject.isBilled),
                false
            );
            return [
                {
                    id: "legacy_calc",
                    projectId: selectedProjectId,
                    name: "Varsayılan Hesap (Mevcut Kalemler)",
                    targetProfit: Number(selectedProject.targetProfit) || 0,
                    useGrossUp: false,
                    totalRawCost: totals.totalRawCost,
                    effectiveProfit: totals.effectiveProfit,
                    totalOfferedPrice: totals.totalOfferedPrice,
                    itemCount: calculatorWorkItems.length,
                    items: calculatorWorkItems,
                } as ProjectCalculationRecord,
            ];
        }
        return [];
    }, [calculations, calculatorWorkItems, selectedProject, selectedProjectId]);

    return (
        <div className={styles.builderWrapper}>
            {/* TOP MANAGEMENT BAR: PROJECT SELECTION, PROPOSAL SELECTOR, NAME & ACTIONS */}
            <InvoiceProposalBar
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={handleSelectProject}
                projectsLoading={projectsLoading}
                invoices={invoices}
                invoicesLoading={invoicesLoading}
                selectedInvoiceId={selectedInvoiceId}
                activeProposalName={activeProposalName}
                onChangeProposalName={(name) => {
                    setActiveProposalName(name);
                    setHasUnsavedChanges(true);
                }}
                onSelectInvoice={handleSelectInvoice}
                onNewBlank={handleNewBlank}
                onSave={handleSave}
                onSaveAsNew={handleSaveAsNew}
                onDeleteInvoice={handleDeleteInvoice}
                onImportFromCalculator={() => setIsImportModalOpen(true)}
                hasCalculatorItems={displayCalculations.length > 0}
                isSaving={isSaving}
                hasUnsavedChanges={hasUnsavedChanges}
                saveSuccess={saveSuccess}
            />

            {/* MAIN 2-COLUMN DISPLAY: FORM & LIVE PDF */}
            <div className={styles.invoiceContainer}>
                {/* Component 1: Form Inputs */}
                <InvoiceForm
                    data={invoiceData}
                    onChange={handleFieldChange}
                    onAddItem={handleAddItem}
                    onDeleteItem={handleDeleteItem}
                    onItemChange={handleItemChange}
                />

                {/* Component 2: Rendered PDF Viewer receiving input values */}
                <InvoiceViewer data={debouncedData} />
            </div>

            {/* MODAL: SELECT CALCULATION TO IMPORT */}
            <ImportCalculationModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                projectName={selectedProject?.name || ""}
                isProjectBilled={Boolean(selectedProject?.isBilled)}
                calculations={displayCalculations}
                onSelectCalculation={handleSelectCalculationForImport}
            />
        </div>
    );
}
