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

export interface NoteItem {
    id: string;
    note: string;
    colorIndex: number;
    createdAt?: any;
}

const NOTES_SUBCOLLECTION = "notes";

// 1. Notları Dinle
export const subscribeToUserNotes = (
    userId: string,
    callback: (notes: NoteItem[]) => void
) => {
    if (!userId) return () => { };

    const notesRef = collection(db, "users", userId, NOTES_SUBCOLLECTION);
    const q = query(notesRef, orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const notes: NoteItem[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            let formattedDate = "Just now";

            if (data.createdAt?.toDate) {
                const date = data.createdAt.toDate();
                formattedDate = date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                });
            }

            return {
                id: docSnap.id,
                note: data.note,
                colorIndex: data.colorIndex ?? 0,
                createdAt: formattedDate,
            };
        });

        callback(notes);
    });
};

// 2. Not Ekle
export const addNoteToUser = async (
    userId: string,
    noteText: string,
    colorIndex: number = 0
) => {
    if (!userId || !noteText.trim()) return;

    const notesRef = collection(db, "users", userId, NOTES_SUBCOLLECTION);
    await addDoc(notesRef, {
        note: noteText.trim(),
        colorIndex,
        createdAt: serverTimestamp(),
    });
};

// 3. Not Güncelle (Edit)
export const updateUserNote = async (
    userId: string,
    noteId: string,
    updatedText: string
) => {
    if (!userId || !noteId || !updatedText.trim()) return;

    const noteDocRef = doc(db, "users", userId, NOTES_SUBCOLLECTION, noteId);
    await updateDoc(noteDocRef, {
        note: updatedText.trim(),
        updatedAt: serverTimestamp(),
    });
};

// 4. Not Sil
export const deleteUserNote = async (userId: string, noteId: string) => {
    if (!userId || !noteId) return;

    const noteDocRef = doc(db, "users", userId, NOTES_SUBCOLLECTION, noteId);
    await deleteDoc(noteDocRef);
};