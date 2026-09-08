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

export interface GoalItem {
    id: string;
    goal: string;
    isFinished: boolean;
    createdAt?: any;
}

export const subscribeToUserGoals = (
    userId: string,
    callback: (goals: GoalItem[]) => void
) => {
    if (!userId) return () => { };

    const goalsRef = collection(db, "users", userId, "goals");
    const q = query(goalsRef, orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const goals: GoalItem[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            goal: docSnap.data().task,
            isFinished: docSnap.data().isFinished,
            createdAt: docSnap.data().createdAt,
        }));
        callback(goals);
    });
};

export const addGoalsToUser = async (userId: string, task: string) => {
    if (!userId || !task.trim()) return;

    const goalsRef = collection(db, "users", userId, "goals");
    await addDoc(goalsRef, {
        task: task.trim(),
        isFinished: false,
        createdAt: serverTimestamp(),
    });
};


export const toggleUserGoalStatus = async (
    userId: string,
    goalId: string,
    currentStatus: boolean
) => {
    if (!userId || !goalId) return;

    const goalsDocRef = doc(db, "users", userId, "goals", goalId);
    await updateDoc(goalsDocRef, {
        isFinished: !currentStatus,
    });
};


export const deleteUserGoal = async (userId: string, goalId: string) => {
    if (!userId || !goalId) return;

    const goalDocRef = doc(db, "users", userId, "goals", goalId);
    await deleteDoc(goalDocRef);
};