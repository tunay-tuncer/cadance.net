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
import { format } from "date-fns";
import { db } from "./client";

export type ProjectType = "Drawing" | "Modelling" | "Renovation";

export interface ProjectItem {
    id: string;
    name: string;
    type?: ProjectType;
    startDate: string; // 'yyyy-MM-dd'
    agreedPayment: number;
    totalMoneySpent: number;
    totalMoneyReceived: number;
    targetProfit?: number;
    isComplete: boolean;
    isBilled: boolean;
    createdAt?: Timestamp | unknown;
}

export type NewProjectInput = {
    name: string;
    type?: ProjectType;
    startDate?: string;
    agreedPayment?: number;
    totalMoneySpent?: number;
    totalMoneyReceived?: number;
    targetProfit?: number;
    isComplete?: boolean;
    isBilled?: boolean;
};

const PROJECTS_SUBCOLLECTION = "projects";

// 1. Subscribe to user's projects in real-time (users/{uid}/projects)
export const subscribeToUserProjects = (
    userId: string,
    callback: (projects: ProjectItem[]) => void
) => {
    if (!userId) return () => {};

    const projectsRef = collection(db, "users", userId, PROJECTS_SUBCOLLECTION);
    const q = query(projectsRef, orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const projects: ProjectItem[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            let startDate = data.startDate;
            if (!startDate && data.createdAt?.toDate) {
                startDate = format(data.createdAt.toDate(), "yyyy-MM-dd");
            } else if (!startDate) {
                startDate = format(new Date(), "yyyy-MM-dd");
            }

            return {
                id: docSnap.id,
                name: data.name || "Untitled Project",
                type: (data.type as ProjectType) || "Drawing",
                startDate: startDate,
                agreedPayment: Number(data.agreedPayment) || 0,
                totalMoneySpent: Number(data.totalMoneySpent) || 0,
                totalMoneyReceived: Number(data.totalMoneyReceived) || 0,
                targetProfit: Number(data.targetProfit) || 0,
                isComplete: Boolean(data.isComplete),
                isBilled: Boolean(data.isBilled),
                createdAt: data.createdAt,
            };
        });

        callback(projects);
    }, (error) => {
        console.error("Error subscribing to projects:", error);
    });
};

// 2. Add project to user
export const addProjectToUser = async (
    userId: string,
    project: NewProjectInput
) => {
    if (!userId || !project.name.trim()) return;

    const projectsRef = collection(db, "users", userId, PROJECTS_SUBCOLLECTION);
    await addDoc(projectsRef, {
        name: project.name.trim(),
        type: project.type || "Drawing",
        startDate: project.startDate || format(new Date(), "yyyy-MM-dd"),
        agreedPayment: Number(project.agreedPayment) || 0,
        totalMoneySpent: Number(project.totalMoneySpent) || 0,
        totalMoneyReceived: Number(project.totalMoneyReceived) || 0,
        isComplete: Boolean(project.isComplete ?? false),
        isBilled: Boolean(project.isBilled ?? false),
        createdAt: serverTimestamp(),
    });
};

// 3. Toggle project completion status
export const toggleUserProjectComplete = async (
    userId: string,
    projectId: string,
    currentStatus: boolean
) => {
    if (!userId || !projectId) return;

    const projectDocRef = doc(db, "users", userId, PROJECTS_SUBCOLLECTION, projectId);
    await updateDoc(projectDocRef, {
        isComplete: !currentStatus,
    });
};

// 4. Toggle project billed status
export const toggleUserProjectBilled = async (
    userId: string,
    projectId: string,
    currentStatus: boolean
) => {
    if (!userId || !projectId) return;

    const projectDocRef = doc(db, "users", userId, PROJECTS_SUBCOLLECTION, projectId);
    await updateDoc(projectDocRef, {
        isBilled: !currentStatus,
    });
};

// 5. Update project details (payments, spent, name, etc.)
export const updateUserProject = async (
    userId: string,
    projectId: string,
    updates: Partial<NewProjectInput>
) => {
    if (!userId || !projectId) return;

    const projectDocRef = doc(db, "users", userId, PROJECTS_SUBCOLLECTION, projectId);
    const cleanUpdates: Record<string, string | number | boolean> = {};

    if (updates.name !== undefined) cleanUpdates.name = updates.name.trim();
    if (updates.type !== undefined) cleanUpdates.type = updates.type;
    if (updates.startDate !== undefined) cleanUpdates.startDate = updates.startDate;
    if (updates.agreedPayment !== undefined) cleanUpdates.agreedPayment = Number(updates.agreedPayment) || 0;
    if (updates.totalMoneySpent !== undefined) cleanUpdates.totalMoneySpent = Number(updates.totalMoneySpent) || 0;
    if (updates.totalMoneyReceived !== undefined) cleanUpdates.totalMoneyReceived = Number(updates.totalMoneyReceived) || 0;
    if (updates.targetProfit !== undefined) cleanUpdates.targetProfit = Number(updates.targetProfit) || 0;
    if (updates.isComplete !== undefined) cleanUpdates.isComplete = Boolean(updates.isComplete);
    if (updates.isBilled !== undefined) cleanUpdates.isBilled = Boolean(updates.isBilled);

    await updateDoc(projectDocRef, cleanUpdates);
};

// 6. Delete project
export const deleteUserProject = async (userId: string, projectId: string) => {
    if (!userId || !projectId) return;

    const projectDocRef = doc(db, "users", userId, PROJECTS_SUBCOLLECTION, projectId);
    await deleteDoc(projectDocRef);
};
