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

export interface PurchaseItem {
    id: string;
    purchase: string;
    isFinished: boolean;
    createdAt?: Timestamp;
}

export const subscribeToUserPurchase = (
    userId: string,
    callback: (goals: PurchaseItem[]) => void
) => {
    if (!userId) return () => { };

    const purchaseRef = collection(db, "users", userId, "purchase");
    const q = query(purchaseRef, orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const purchase: PurchaseItem[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();

            return {
                id: docSnap.id,
                // Older documents may have used `task`; new documents use `purchase`.
                purchase: data.purchase ?? data.task ?? "",
                isFinished: data.isFinished,
                createdAt: data.createdAt,
            };
        });
        callback(purchase);
    });
};

export const addPurhcaseToUser = async (userId: string, purchase: string) => {
    if (!userId || !purchase.trim()) return;

    const purchaseRef = collection(db, "users", userId, "purchase");
    await addDoc(purchaseRef, {
        purchase: purchase.trim(),
        isFinished: false,
        createdAt: serverTimestamp(),
    });
};


export const toggleUserPurchaseStatus = async (
    userId: string,
    purchaseId: string,
    currentStatus: boolean
) => {
    if (!userId || !purchaseId) return;

    const purchaseDocRef = doc(db, "users", userId, "purchase", purchaseId);
    await updateDoc(purchaseDocRef, {
        isFinished: !currentStatus,
    });
};


export const deleteUserPurchase = async (userId: string, purchaseId: string) => {
    if (!userId || !purchaseId) return;

    const purchaseDocRef = doc(db, "users", userId, "purchase", purchaseId);
    await deleteDoc(purchaseDocRef);
};
