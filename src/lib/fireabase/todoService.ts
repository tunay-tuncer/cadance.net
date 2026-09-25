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
import { format } from "date-fns";
import { db } from "./client";

export interface TodoItem {
    id: string;
    task: string;
    isFinished: boolean;
    date?: string; // 'yyyy-MM-dd'
    createdAt?: any;
}

// 1. Kullanıcının Kişisel Subcollection'ını Dinle (users/{uid}/todos)
export const subscribeToUserTodos = (
    userId: string,
    callback: (todos: TodoItem[]) => void,
    selectedDate?: string
) => {
    if (!userId) return () => { };

    const todosRef = collection(db, "users", userId, "todos");
    const q = query(todosRef, orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const todos: TodoItem[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            let date = data.date;
            if (!date && data.createdAt?.toDate) {
                date = format(data.createdAt.toDate(), "yyyy-MM-dd");
            }
            return {
                id: docSnap.id,
                task: data.task,
                isFinished: data.isFinished,
                date: date,
                createdAt: data.createdAt,
            };
        });

        if (selectedDate) {
            const todayStr = format(new Date(), "yyyy-MM-dd");
            const filtered = todos.filter((item) => {
                if (item.date) {
                    return item.date === selectedDate;
                }
                // Fallback for legacy items without date: match if selectedDate is today
                return selectedDate === todayStr;
            });
            callback(filtered);
        } else {
            callback(todos);
        }
    });
};

// 2. Kullanıcıya Özel Todo Ekle
export const addTodoToUser = async (userId: string, task: string, date?: string) => {
    if (!userId || !task.trim()) return;

    const todosRef = collection(db, "users", userId, "todos");
    await addDoc(todosRef, {
        task: task.trim(),
        isFinished: false,
        date: date || format(new Date(), "yyyy-MM-dd"),
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

// 5. Kullanıcının Todosunun Tarihini Güncelle (Bugüne Taşı / Tarih Güncelle)
export const updateUserTodoDate = async (
    userId: string,
    todoId: string,
    date: string
) => {
    if (!userId || !todoId || !date) return;

    const todoDocRef = doc(db, "users", userId, "todos", todoId);
    await updateDoc(todoDocRef, {
        date: date,
    });
};