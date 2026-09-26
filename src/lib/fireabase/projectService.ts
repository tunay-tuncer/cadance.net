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
    writeBatch,
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
    notes?: string;
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
    notes?: string;
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
                notes: data.notes || "",
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
        notes: project.notes || "",
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
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;

    await updateDoc(projectDocRef, cleanUpdates);
};

// 6. Delete project
export const deleteUserProject = async (userId: string, projectId: string) => {
    if (!userId || !projectId) return;

    const projectDocRef = doc(db, "users", userId, PROJECTS_SUBCOLLECTION, projectId);
    await deleteDoc(projectDocRef);
};

// 7. Subscribe to a single project in real-time
export const subscribeToUserProject = (
    userId: string,
    projectId: string,
    callback: (project: ProjectItem | null) => void
) => {
    if (!userId || !projectId) {
        callback(null);
        return () => {};
    }

    const projectDocRef = doc(db, "users", userId, PROJECTS_SUBCOLLECTION, projectId);
    return onSnapshot(
        projectDocRef,
        (docSnap) => {
            if (!docSnap.exists()) {
                callback(null);
                return;
            }
            const data = docSnap.data();
            let startDate = data.startDate;
            if (!startDate && data.createdAt?.toDate) {
                startDate = format(data.createdAt.toDate(), "yyyy-MM-dd");
            } else if (!startDate) {
                startDate = format(new Date(), "yyyy-MM-dd");
            }

            callback({
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
                notes: data.notes || "",
                createdAt: data.createdAt,
            });
        },
        (error) => {
            console.error("Error subscribing to project:", error);
            callback(null);
        }
    );
};

// 8. Project Notes interfaces & real-time methods
export interface ProjectNoteItem {
    id: string;
    note: string;
    createdAt?: string;
}

const PROJECT_NOTES_SUBCOLLECTION = "notes";

export const subscribeToProjectNotes = (
    userId: string,
    projectId: string,
    callback: (notes: ProjectNoteItem[]) => void
) => {
    if (!userId || !projectId) {
        callback([]);
        return () => {};
    }

    const notesRef = collection(
        db,
        "users",
        userId,
        PROJECTS_SUBCOLLECTION,
        projectId,
        PROJECT_NOTES_SUBCOLLECTION
    );
    const q = query(notesRef, orderBy("createdAt", "desc"));

    return onSnapshot(
        q,
        (snapshot) => {
            const notes: ProjectNoteItem[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                let formattedDate = "Just now";
                if (data.createdAt?.toDate) {
                    const date = data.createdAt.toDate();
                    formattedDate = date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                }
                return {
                    id: docSnap.id,
                    note: data.note || "",
                    createdAt: formattedDate,
                };
            });
            callback(notes);
        },
        (error) => {
            console.error("Error subscribing to project notes:", error);
            callback([]);
        }
    );
};

export const addProjectNote = async (
    userId: string,
    projectId: string,
    noteText: string
) => {
    if (!userId || !projectId || !noteText.trim()) return;

    const notesRef = collection(
        db,
        "users",
        userId,
        PROJECTS_SUBCOLLECTION,
        projectId,
        PROJECT_NOTES_SUBCOLLECTION
    );
    await addDoc(notesRef, {
        note: noteText.trim(),
        createdAt: serverTimestamp(),
    });
};

export const updateProjectNote = async (
    userId: string,
    projectId: string,
    noteId: string,
    updatedText: string
) => {
    if (!userId || !projectId || !noteId || !updatedText.trim()) return;

    const noteDocRef = doc(
        db,
        "users",
        userId,
        PROJECTS_SUBCOLLECTION,
        projectId,
        PROJECT_NOTES_SUBCOLLECTION,
        noteId
    );
    await updateDoc(noteDocRef, {
        note: updatedText.trim(),
        updatedAt: serverTimestamp(),
    });
};

export const deleteProjectNote = async (
    userId: string,
    projectId: string,
    noteId: string
) => {
    if (!userId || !projectId || !noteId) return;

    const noteDocRef = doc(
        db,
        "users",
        userId,
        PROJECTS_SUBCOLLECTION,
        projectId,
        PROJECT_NOTES_SUBCOLLECTION,
        noteId
    );
    await deleteDoc(noteDocRef);
};

// 9. Project Tasks interfaces & real-time methods
export interface ProjectTaskItem {
    id: string;
    title: string;
    isCompleted: boolean;
    order?: number;
    createdAt?: string;
}

const PROJECT_TASKS_SUBCOLLECTION = "tasks";

export const subscribeToProjectTasks = (
    userId: string,
    projectId: string,
    callback: (tasks: ProjectTaskItem[]) => void
) => {
    if (!userId || !projectId) {
        callback([]);
        return () => {};
    }

    const tasksRef = collection(
        db,
        "users",
        userId,
        PROJECTS_SUBCOLLECTION,
        projectId,
        PROJECT_TASKS_SUBCOLLECTION
    );
    const q = query(tasksRef, orderBy("createdAt", "asc"));

    return onSnapshot(
        q,
        (snapshot) => {
            const tasks: ProjectTaskItem[] = snapshot.docs.map((docSnap, index) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    title: data.title || "",
                    isCompleted: Boolean(data.isCompleted),
                    order: typeof data.order === "number" ? data.order : index,
                };
            });
            // Sort by order ascending
            tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            callback(tasks);
        },
        (error) => {
            console.error("Error subscribing to project tasks:", error);
            callback([]);
        }
    );
};

export const addProjectTask = async (
    userId: string,
    projectId: string,
    title: string,
    order?: number
) => {
    if (!userId || !projectId || !title.trim()) return;

    const tasksRef = collection(
        db,
        "users",
        userId,
        PROJECTS_SUBCOLLECTION,
        projectId,
        PROJECT_TASKS_SUBCOLLECTION
    );
    await addDoc(tasksRef, {
        title: title.trim(),
        isCompleted: false,
        order: typeof order === "number" ? order : Date.now(),
        createdAt: serverTimestamp(),
    });
};

export const reorderProjectTasks = async (
    userId: string,
    projectId: string,
    orderedTasks: ProjectTaskItem[]
) => {
    if (!userId || !projectId || !orderedTasks.length) return;

    const batch = writeBatch(db);
    orderedTasks.forEach((task, index) => {
        const taskDocRef = doc(
            db,
            "users",
            userId,
            PROJECTS_SUBCOLLECTION,
            projectId,
            PROJECT_TASKS_SUBCOLLECTION,
            task.id
        );
        batch.update(taskDocRef, { order: index });
    });
    await batch.commit();
};

export const toggleProjectTask = async (
    userId: string,
    projectId: string,
    taskId: string,
    currentStatus: boolean
) => {
    if (!userId || !projectId || !taskId) return;

    const taskDocRef = doc(
        db,
        "users",
        userId,
        PROJECTS_SUBCOLLECTION,
        projectId,
        PROJECT_TASKS_SUBCOLLECTION,
        taskId
    );
    await updateDoc(taskDocRef, {
        isCompleted: !currentStatus,
    });
};

export const deleteProjectTask = async (
    userId: string,
    projectId: string,
    taskId: string
) => {
    if (!userId || !projectId || !taskId) return;

    const taskDocRef = doc(
        db,
        "users",
        userId,
        PROJECTS_SUBCOLLECTION,
        projectId,
        PROJECT_TASKS_SUBCOLLECTION,
        taskId
    );
    await deleteDoc(taskDocRef);
};
