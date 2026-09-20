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
import { InvoiceWorkItem } from "./invoiceWorkItemService";

export interface ProjectCalculationRecord {
    id: string;
    projectId: string;
    projectName?: string;
    name: string; // e.g. "Maliyet Planı v1", "Yüksek Kâr Senaryosu"
    targetProfit: number;
    useGrossUp: boolean;
    totalRawCost: number;
    effectiveProfit: number;
    totalOfferedPrice: number;
    itemCount: number;
    items: InvoiceWorkItem[];
    createdAt?: Timestamp | any;
    updatedAt?: Timestamp | any;
}

export type NewProjectCalculationInput = {
    projectId: string;
    projectName?: string;
    name: string;
    targetProfit: number;
    useGrossUp: boolean;
    totalRawCost: number;
    effectiveProfit: number;
    totalOfferedPrice: number;
    itemCount: number;
    items: InvoiceWorkItem[];
};

const CALCULATIONS_SUBCOLLECTION = "calculations";

/**
 * Real-time subscription to saved calculations for a specific project
 * Path: users/{userId}/projects/{projectId}/calculations
 */
export const subscribeToProjectCalculations = (
    userId: string,
    projectId: string,
    callback: (calculations: ProjectCalculationRecord[]) => void
) => {
    if (!userId || !projectId) {
        callback([]);
        return () => {};
    }

    const calculationsRef = collection(
        db,
        "users",
        userId,
        "projects",
        projectId,
        CALCULATIONS_SUBCOLLECTION
    );

    // Order by updatedAt desc; if index is not ready, catch and fallback to un-ordered query
    const q = query(calculationsRef, orderBy("updatedAt", "desc"));

    return onSnapshot(
        q,
        (snapshot) => {
            const records: ProjectCalculationRecord[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    projectId: data.projectId || projectId,
                    projectName: data.projectName,
                    name: data.name || "İsimsiz Hesap",
                    targetProfit: Number(data.targetProfit) || 0,
                    useGrossUp: Boolean(data.useGrossUp),
                    totalRawCost: Number(data.totalRawCost) || 0,
                    effectiveProfit: Number(data.effectiveProfit) || 0,
                    totalOfferedPrice: Number(data.totalOfferedPrice) || 0,
                    itemCount: Number(data.itemCount) || (Array.isArray(data.items) ? data.items.length : 0),
                    items: Array.isArray(data.items) ? data.items : [],
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                };
            });
            callback(records);
        },
        (error) => {
            console.warn("Index or query issue with ordered calculations, falling back to basic query:", error);
            // Fallback to plain collection without orderBy
            return onSnapshot(calculationsRef, (snapshot) => {
                const records: ProjectCalculationRecord[] = snapshot.docs.map((docSnap) => {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        projectId: data.projectId || projectId,
                        projectName: data.projectName,
                        name: data.name || "İsimsiz Hesap",
                        targetProfit: Number(data.targetProfit) || 0,
                        useGrossUp: Boolean(data.useGrossUp),
                        totalRawCost: Number(data.totalRawCost) || 0,
                        effectiveProfit: Number(data.effectiveProfit) || 0,
                        totalOfferedPrice: Number(data.totalOfferedPrice) || 0,
                        itemCount: Number(data.itemCount) || (Array.isArray(data.items) ? data.items.length : 0),
                        items: Array.isArray(data.items) ? data.items : [],
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                    };
                });
                // Sort in memory by updatedAt or createdAt desc
                records.sort((a, b) => {
                    const timeA = a.updatedAt?.toMillis?.() || a.updatedAt?.seconds || 0;
                    const timeB = b.updatedAt?.toMillis?.() || b.updatedAt?.seconds || 0;
                    return timeB - timeA;
                });
                callback(records);
            });
        }
    );
};

/**
 * Add a new calculation under a project
 */
export const addProjectCalculation = async (
    userId: string,
    projectId: string,
    input: NewProjectCalculationInput
): Promise<string | null> => {
    if (!userId || !projectId) return null;

    try {
        const calculationsRef = collection(
            db,
            "users",
            userId,
            "projects",
            projectId,
            CALCULATIONS_SUBCOLLECTION
        );

        const docRef = await addDoc(calculationsRef, {
            projectId,
            projectName: input.projectName || "",
            name: input.name.trim() || "Hesap 1",
            targetProfit: Number(input.targetProfit) || 0,
            useGrossUp: Boolean(input.useGrossUp),
            totalRawCost: Number(input.totalRawCost) || 0,
            effectiveProfit: Number(input.effectiveProfit) || 0,
            totalOfferedPrice: Number(input.totalOfferedPrice) || 0,
            itemCount: input.items.length,
            items: input.items,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return docRef.id;
    } catch (error) {
        console.error("Error creating project calculation:", error);
        throw error;
    }
};

/**
 * Update an existing calculation
 */
export const updateProjectCalculation = async (
    userId: string,
    projectId: string,
    calculationId: string,
    updates: Partial<NewProjectCalculationInput>
): Promise<void> => {
    if (!userId || !projectId || !calculationId) return;

    try {
        const docRef = doc(
            db,
            "users",
            userId,
            "projects",
            projectId,
            CALCULATIONS_SUBCOLLECTION,
            calculationId
        );

        const payload: Record<string, any> = {
            updatedAt: serverTimestamp(),
        };

        if (updates.name !== undefined) payload.name = updates.name.trim();
        if (updates.projectName !== undefined) payload.projectName = updates.projectName;
        if (updates.targetProfit !== undefined) payload.targetProfit = Number(updates.targetProfit);
        if (updates.useGrossUp !== undefined) payload.useGrossUp = Boolean(updates.useGrossUp);
        if (updates.totalRawCost !== undefined) payload.totalRawCost = Number(updates.totalRawCost);
        if (updates.effectiveProfit !== undefined) payload.effectiveProfit = Number(updates.effectiveProfit);
        if (updates.totalOfferedPrice !== undefined) payload.totalOfferedPrice = Number(updates.totalOfferedPrice);
        if (updates.items !== undefined) {
            payload.items = updates.items;
            payload.itemCount = updates.items.length;
        }

        await updateDoc(docRef, payload);
    } catch (error) {
        console.error("Error updating project calculation:", error);
        throw error;
    }
};

/**
 * Delete a calculation
 */
export const deleteProjectCalculation = async (
    userId: string,
    projectId: string,
    calculationId: string
): Promise<void> => {
    if (!userId || !projectId || !calculationId) return;

    try {
        const docRef = doc(
            db,
            "users",
            userId,
            "projects",
            projectId,
            CALCULATIONS_SUBCOLLECTION,
            calculationId
        );
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting project calculation:", error);
        throw error;
    }
};
