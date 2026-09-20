import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { db } from "./client";
import { InvoiceData } from "@/app/(invoice)/invoice/types/invoice";

export interface ProjectInvoiceRecord {
    id: string;
    projectId: string;
    projectName?: string;
    name: string; // Proposal name e.g. "Avan Proje Teklifi", "Revizyon 2", etc.
    invoiceNumber: string;
    totalAmount: string; // Formatted total e.g. "60.000,00"
    itemCount: number;
    isBilled: boolean;
    data: InvoiceData; // Complete form data to populate the invoice builder and PDF
    createdAt?: Timestamp | any;
    updatedAt?: Timestamp | any;
}

export type NewProjectInvoiceInput = {
    projectId: string;
    projectName?: string;
    name: string;
    invoiceNumber: string;
    totalAmount: string;
    itemCount: number;
    isBilled: boolean;
    data: InvoiceData;
};

const INVOICES_SUBCOLLECTION = "invoices";

/**
 * Real-time subscription to saved proposals for a specific project
 * Path: users/{userId}/projects/{projectId}/invoices
 */
export const subscribeToProjectInvoices = (
    userId: string,
    projectId: string,
    callback: (invoices: ProjectInvoiceRecord[]) => void
) => {
    if (!userId || !projectId) {
        callback([]);
        return () => {};
    }

    const invoicesRef = collection(
        db,
        "users",
        userId,
        "projects",
        projectId,
        INVOICES_SUBCOLLECTION
    );
    const q = query(invoicesRef, orderBy("updatedAt", "desc"));

    return onSnapshot(
        q,
        (snapshot) => {
            const invoices: ProjectInvoiceRecord[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    projectId: projectId,
                    projectName: data.projectName || "",
                    name: data.name || "İsimsiz Teklif",
                    invoiceNumber: data.invoiceNumber || "",
                    totalAmount: data.totalAmount || "0,00",
                    itemCount: typeof data.itemCount === "number" ? data.itemCount : (data.data?.items?.length || 0),
                    isBilled: Boolean(data.isBilled ?? data.data?.isBilled),
                    data: data.data as InvoiceData,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                };
            });
            callback(invoices);
        },
        (error) => {
            console.error("Error subscribing to project invoices:", error);
            // Fallback without orderBy in case index is creating
            const fallbackQ = collection(db, "users", userId, "projects", projectId, INVOICES_SUBCOLLECTION);
            onSnapshot(fallbackQ, (fallbackSnap) => {
                const invoices: ProjectInvoiceRecord[] = fallbackSnap.docs.map((docSnap) => {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        projectId: projectId,
                        projectName: data.projectName || "",
                        name: data.name || "İsimsiz Teklif",
                        invoiceNumber: data.invoiceNumber || "",
                        totalAmount: data.totalAmount || "0,00",
                        itemCount: typeof data.itemCount === "number" ? data.itemCount : (data.data?.items?.length || 0),
                        isBilled: Boolean(data.isBilled ?? data.data?.isBilled),
                        data: data.data as InvoiceData,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                    };
                });
                callback(invoices);
            });
        }
    );
};

/**
 * Add a new saved proposal under a project
 */
export const addProjectInvoice = async (
    userId: string,
    projectId: string,
    input: NewProjectInvoiceInput
): Promise<string> => {
    if (!userId || !projectId) {
        throw new Error("Missing userId or projectId");
    }

    const invoicesRef = collection(
        db,
        "users",
        userId,
        "projects",
        projectId,
        INVOICES_SUBCOLLECTION
    );

    const docRef = await addDoc(invoicesRef, {
        projectId,
        projectName: input.projectName || "",
        name: input.name.trim() || "İsimsiz Teklif",
        invoiceNumber: input.invoiceNumber || "",
        totalAmount: input.totalAmount || "0,00",
        itemCount: input.itemCount || 0,
        isBilled: Boolean(input.isBilled),
        data: input.data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return docRef.id;
};

/**
 * Update an existing proposal document
 */
export const updateProjectInvoice = async (
    userId: string,
    projectId: string,
    invoiceId: string,
    updates: Partial<NewProjectInvoiceInput>
): Promise<void> => {
    if (!userId || !projectId || !invoiceId) {
        throw new Error("Missing identifiers for invoice update");
    }

    const docRef = doc(
        db,
        "users",
        userId,
        "projects",
        projectId,
        INVOICES_SUBCOLLECTION,
        invoiceId
    );

    const payload: Record<string, any> = {
        updatedAt: serverTimestamp(),
    };

    if (updates.name !== undefined) payload.name = updates.name.trim() || "İsimsiz Teklif";
    if (updates.projectName !== undefined) payload.projectName = updates.projectName;
    if (updates.invoiceNumber !== undefined) payload.invoiceNumber = updates.invoiceNumber;
    if (updates.totalAmount !== undefined) payload.totalAmount = updates.totalAmount;
    if (updates.itemCount !== undefined) payload.itemCount = updates.itemCount;
    if (updates.isBilled !== undefined) payload.isBilled = updates.isBilled;
    if (updates.data !== undefined) payload.data = updates.data;

    await updateDoc(docRef, payload);
};

/**
 * Delete a proposal document
 */
export const deleteProjectInvoice = async (
    userId: string,
    projectId: string,
    invoiceId: string
): Promise<void> => {
    if (!userId || !projectId || !invoiceId) {
        throw new Error("Missing identifiers for invoice deletion");
    }

    const docRef = doc(
        db,
        "users",
        userId,
        "projects",
        projectId,
        INVOICES_SUBCOLLECTION,
        invoiceId
    );

    await deleteDoc(docRef);
};
