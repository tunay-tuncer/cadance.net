import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    where,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";
import { db } from "./client";

export interface FinanceItem {
    id: string;
    date: string; // 'yyyy-MM-dd' or string format
    transactionType: string; // 'Income' | 'Expense' | string
    catagory: string; // Category name (e.g. Salary, Project, Office)
    explanation: string; // Description/notes (or Project Name)
    income: number;
    expense: number;
    paymentMethod: string; // Bank Transfer, Credit Card, Cash, etc.
    status: string; // Completed, Pending, Cancelled
    summary: number; // Net amount (income - expense)
    projectId?: string; // Linked project doc ID
    createdAt?: Timestamp | unknown;
}

export type NewFinanceInput = {
    date?: string;
    transactionType?: string;
    catagory?: string;
    explanation?: string;
    income?: number;
    expense?: number;
    paymentMethod?: string;
    status?: string;
    summary?: number;
    projectId?: string;
};

const FINANCES_SUBCOLLECTION = "finances";

// Helper: Recalculate and synchronize project totalMoneyReceived and totalMoneySpent from finances
export const syncProjectFinanceTotals = async (
    userId: string,
    projectIdOrName: string
) => {
    if (!userId || !projectIdOrName) return;

    try {
        const trimmedTarget = projectIdOrName.trim();
        const projectsRef = collection(db, "users", userId, "projects");
        let targetProjectId: string | null = null;
        let targetProjectName: string = "";

        // 1. Check if trimmedTarget matches a project doc ID directly
        const directDocRef = doc(db, "users", userId, "projects", trimmedTarget);
        const directSnap = await getDoc(directDocRef);
        if (directSnap.exists()) {
            targetProjectId = directSnap.id;
            targetProjectName = directSnap.data().name || "";
        } else {
            // 2. Check if it matches a project by name
            const qProj = query(projectsRef, where("name", "==", trimmedTarget));
            const snapProj = await getDocs(qProj);
            if (!snapProj.empty) {
                targetProjectId = snapProj.docs[0].id;
                targetProjectName = snapProj.docs[0].data().name || "";
            }
        }

        if (!targetProjectId) return;

        // 3. Query all user finances with catagory == 'Project'
        const financesRef = collection(db, "users", userId, FINANCES_SUBCOLLECTION);
        const qFin = query(financesRef, where("catagory", "==", "Project"));
        const snapFin = await getDocs(qFin);

        let totalReceived = 0;
        let totalSpent = 0;

        snapFin.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const matchesId = data.projectId && data.projectId === targetProjectId;
            const matchesName = data.explanation && data.explanation.trim().toLowerCase() === targetProjectName.trim().toLowerCase();

            if (matchesId || matchesName) {
                totalReceived += Number(data.income) || 0;
                totalSpent += Number(data.expense) || 0;
            }
        });

        // 4. Update the project document in Firestore
        const projectDocRef = doc(db, "users", userId, "projects", targetProjectId);
        await updateDoc(projectDocRef, {
            totalMoneyReceived: totalReceived,
            totalMoneySpent: totalSpent,
        });
    } catch (error) {
        console.error("Error syncing project finance totals:", error);
    }
};

// 1. Subscribe to user's finance records in real-time (users/{uid}/finances)
export const subscribeToUserFinanceRecords = (
    userId: string,
    callback: (records: FinanceItem[]) => void
) => {
    if (!userId) return () => {};

    const financesRef = collection(db, "users", userId, FINANCES_SUBCOLLECTION);
    const q = query(financesRef, orderBy("createdAt", "desc"));

    return onSnapshot(
        q,
        (snapshot) => {
            const records: FinanceItem[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                let dateStr = data.date;
                if (!dateStr && data.createdAt?.toDate) {
                    dateStr = format(data.createdAt.toDate(), "yyyy-MM-dd");
                } else if (!dateStr) {
                    dateStr = format(new Date(), "yyyy-MM-dd");
                }

                const income = Number(data.income) || 0;
                const expense = Number(data.expense) || 0;
                const summary = data.summary !== undefined ? Number(data.summary) : income - expense;

                return {
                    id: docSnap.id,
                    date: dateStr,
                    transactionType: data.transactionType || (income >= expense ? "Income" : "Expense"),
                    catagory: data.catagory ?? data.category ?? "General",
                    explanation: data.explanation || "",
                    income: income,
                    expense: expense,
                    paymentMethod: data.paymentMethod || "Bank Transfer",
                    status: data.status || "Completed",
                    summary: summary,
                    projectId: data.projectId || "",
                    createdAt: data.createdAt,
                };
            });

            callback(records);
        },
        (error) => {
            console.error("Error subscribing to finance records:", error);
        }
    );
};

// 2. Add finance record for user
export const addFinanceRecordToUser = async (
    userId: string,
    record: NewFinanceInput
) => {
    if (!userId) return;

    const financesRef = collection(db, "users", userId, FINANCES_SUBCOLLECTION);
    const income = Number(record.income) || 0;
    const expense = Number(record.expense) || 0;
    const summary = record.summary !== undefined ? Number(record.summary) : income - expense;

    const docRef = await addDoc(financesRef, {
        date: record.date || format(new Date(), "yyyy-MM-dd"),
        transactionType: record.transactionType || (income >= expense ? "Income" : "Expense"),
        catagory: record.catagory?.trim() || "General",
        explanation: record.explanation?.trim() || "",
        income: income,
        expense: expense,
        paymentMethod: record.paymentMethod || "Bank Transfer",
        status: record.status || "Completed",
        summary: summary,
        projectId: record.projectId || "",
        createdAt: serverTimestamp(),
    });

    // Automatically update the project info in Firestore if category is Project
    if (record.catagory?.trim() === "Project") {
        const target = record.projectId || record.explanation?.trim();
        if (target) {
            await syncProjectFinanceTotals(userId, target);
        }
    }

    return docRef;
};

// 3. Update finance record
export const updateFinanceRecord = async (
    userId: string,
    recordId: string,
    updates: Partial<NewFinanceInput>
) => {
    if (!userId || !recordId) return;

    const recordDocRef = doc(db, "users", userId, FINANCES_SUBCOLLECTION, recordId);
    const oldSnap = await getDoc(recordDocRef);
    const oldData = oldSnap.exists() ? oldSnap.data() : null;

    const cleanUpdates: Record<string, string | number> = {};

    if (updates.date !== undefined) cleanUpdates.date = updates.date;
    if (updates.transactionType !== undefined) cleanUpdates.transactionType = updates.transactionType;
    if (updates.catagory !== undefined) cleanUpdates.catagory = updates.catagory.trim();
    if (updates.explanation !== undefined) cleanUpdates.explanation = updates.explanation.trim();
    if (updates.paymentMethod !== undefined) cleanUpdates.paymentMethod = updates.paymentMethod;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.projectId !== undefined) cleanUpdates.projectId = updates.projectId;

    if (updates.income !== undefined) cleanUpdates.income = Number(updates.income) || 0;
    if (updates.expense !== undefined) cleanUpdates.expense = Number(updates.expense) || 0;

    // Recalculate summary if income or expense was modified or summary was passed explicitly
    if (updates.summary !== undefined) {
        cleanUpdates.summary = Number(updates.summary);
    } else if (updates.income !== undefined || updates.expense !== undefined) {
        const income = updates.income !== undefined ? Number(updates.income) || 0 : 0;
        const expense = updates.expense !== undefined ? Number(updates.expense) || 0 : 0;
        cleanUpdates.summary = income - expense;
    }

    await updateDoc(recordDocRef, cleanUpdates);

    // Sync projects if affected
    const oldProjectTarget = oldData?.catagory === "Project" ? (oldData.projectId || oldData.explanation) : null;
    const newCategory = updates.catagory !== undefined ? updates.catagory.trim() : oldData?.catagory;
    const newProjectTarget = newCategory === "Project" ? (updates.projectId || updates.explanation?.trim() || oldData?.projectId || oldData?.explanation) : null;

    if (oldProjectTarget) {
        await syncProjectFinanceTotals(userId, oldProjectTarget);
    }
    if (newProjectTarget && newProjectTarget !== oldProjectTarget) {
        await syncProjectFinanceTotals(userId, newProjectTarget);
    }
};

// 4. Delete finance record
export const deleteFinanceRecord = async (userId: string, recordId: string) => {
    if (!userId || !recordId) return;

    const recordDocRef = doc(db, "users", userId, FINANCES_SUBCOLLECTION, recordId);
    const oldSnap = await getDoc(recordDocRef);
    const oldData = oldSnap.exists() ? oldSnap.data() : null;

    await deleteDoc(recordDocRef);

    if (oldData?.catagory === "Project") {
        const target = oldData.projectId || oldData.explanation;
        if (target) {
            await syncProjectFinanceTotals(userId, target);
        }
    }
};
