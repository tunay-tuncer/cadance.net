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

export interface TodoItem {
    id: string;
    task: string;
    isFinished: boolean;
    createdAt?: any;
}

// 1. Kullanıcının Kişisel Subcollection'ını Dinle (users/{uid}/todos)
export const subscribeToUserTodos = (
    userId: string,
    callback: (todos: TodoItem[]) => void
) => {
    if (!userId) return () => { };

    const todosRef = collection(db, "users", userId, "todos");
    const q = query(todosRef, orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const todos: TodoItem[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            task: docSnap.data().task,
            isFinished: docSnap.data().isFinished,
            createdAt: docSnap.data().createdAt,
        }));
        callback(todos);
    });
};

// 2. Kullanıcıya Özel Todo Ekle
export const addTodoToUser = async (userId: string, task: string) => {
    if (!userId || !task.trim()) return;

    const todosRef = collection(db, "users", userId, "todos");
    await addDoc(todosRef, {
        task: task.trim(),
        isFinished: false,
        createdAt: serverTimestamp(),
    });
};

// 3. Kullanıcının Todo Durumunu Güncelle (Toggle)
export const toggleUserTodoStatus = async (
    userId: string,
    todoId: string,
    currentStatus: boolean
) => {
    if (!userId || !todoId) return;

    const todoDocRef = doc(db, "users", userId, "todos", todoId);
    await updateDoc(todoDocRef, {
        isFinished: !currentStatus,
    });
};

// 4. Kullanıcının Todosunu Sil
export const deleteUserTodo = async (userId: string, todoId: string) => {
    if (!userId || !todoId) return;

    const todoDocRef = doc(db, "users", userId, "todos", todoId);
    await deleteDoc(todoDocRef);
};