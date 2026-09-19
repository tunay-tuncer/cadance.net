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
} from "firebase/firestore";
import { db } from "./client";

export interface InvoiceWorkItem {
    id: string;
    projectId: string;
    number: string;
    name: string;
    description: string;
    rawCost: number;
    canBeBilled: boolean; // workers with or without company
    createdAt?: any;
}

export type NewWorkItemInput = {
    number: string;
    name: string;
    description: string;
    rawCost: number;
    canBeBilled: boolean;
};

const WORK_ITEMS_SUBCOLLECTION = "invoiceWorkItems";

// 1. Real-time subscription to project work items: users/{userId}/projects/{projectId}/invoiceWorkItems
export const subscribeToProjectWorkItems = (
    userId: string,
    projectId: string,
    callback: (items: InvoiceWorkItem[]) => void
) => {
    if (!userId || !projectId) {
        callback([]);
        return () => {};
    }

    const itemsRef = collection(
        db,
        "users",
        userId,
        "projects",
        projectId,
        WORK_ITEMS_SUBCOLLECTION
    );
    const q = query(itemsRef, orderBy("number", "asc"));

    return onSnapshot(
        q,
        (snapshot) => {
            const items: InvoiceWorkItem[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    projectId: projectId,
                    number: data.number || "01",
                    name: data.name || "",
                    description: data.description || "",
                    rawCost: Number(data.rawCost) || 0,
                    canBeBilled: Boolean(data.canBeBilled),
                    createdAt: data.createdAt,
                };
            });
            callback(items);
        },
        (error) => {
            console.error("Error subscribing to invoice work items:", error);
            callback([]);
        }
    );
};

// 2. Add work item to a project
export const addInvoiceWorkItem = async (
    userId: string,
    projectId: string,
    item: NewWorkItemInput
) => {
    if (!userId || !projectId) return;

    const itemsRef = collection(
        db,
        "users",
        userId,
        "projects",
        projectId,
        WORK_ITEMS_SUBCOLLECTION
    );
    await addDoc(itemsRef, {
        number: item.number.trim() || "01",
        name: item.name.trim() || "Yeni İş Kalemi",
        description: item.description.trim() || "",
        rawCost: Number(item.rawCost) || 0,
        canBeBilled: Boolean(item.canBeBilled),
        createdAt: serverTimestamp(),
    });
};

// 3. Update existing work item
export const updateInvoiceWorkItem = async (
    userId: string,
    projectId: string,
    itemId: string,
    updates: Partial<NewWorkItemInput>
) => {
    if (!userId || !projectId || !itemId) return;

    const itemDocRef = doc(
        db,
        "users",
        userId,
        "projects",
        projectId,
        WORK_ITEMS_SUBCOLLECTION,
        itemId
    );
    const payload: Record<string, any> = {};
    if (updates.number !== undefined) payload.number = updates.number;
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.rawCost !== undefined) payload.rawCost = Number(updates.rawCost);
    if (updates.canBeBilled !== undefined) payload.canBeBilled = Boolean(updates.canBeBilled);

    await updateDoc(itemDocRef, payload);
};

// 4. Delete work item
export const deleteInvoiceWorkItem = async (
    userId: string,
    projectId: string,
    itemId: string
) => {
    if (!userId || !projectId || !itemId) return;

    const itemDocRef = doc(
        db,
        "users",
        userId,
        "projects",
        projectId,
        WORK_ITEMS_SUBCOLLECTION,
        itemId
    );
    await deleteDoc(itemDocRef);
};
