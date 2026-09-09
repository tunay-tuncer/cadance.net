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

export interface CalendarEvent {
    id: string;
    title: string;
    date: string; // 'yyyy-MM-dd'
    colorId: string;
    type?: string;
    createdAt?: any;
}

const EVENTS_SUBCOLLECTION = "events";

// 1. Kullanıcının Etkinliklerini Dinle (users/{uid}/events)
export const subscribeToUserEvents = (
    userId: string,
    callback: (events: CalendarEvent[]) => void
) => {
    if (!userId) return () => { };

    const eventsRef = collection(db, "users", userId, EVENTS_SUBCOLLECTION);
    const q = query(eventsRef, orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const events: CalendarEvent[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                title: data.title,
                date: data.date,
                colorId: data.colorId || "9",
                type: data.type || "standard",
                createdAt: data.createdAt,
            };
        });
        callback(events);
    });
};

// 2. Kullanıcıya Yeni Etkinlik Ekle
export const addEventToUser = async (
    userId: string,
    event: {
        title: string;
        date: string;
        colorId?: string;
        type?: string;
    }
) => {
    if (!userId || !event.title.trim()) return;

    const eventsRef = collection(db, "users", userId, EVENTS_SUBCOLLECTION);
    await addDoc(eventsRef, {
        title: event.title.trim(),
        date: event.date,
        colorId: event.colorId || "9",
        type: event.type || "standard",
        createdAt: serverTimestamp(),
    });
};

// 3. Kullanıcı Etkinliğini Sil
export const deleteUserEvent = async (userId: string, eventId: string) => {
    if (!userId || !eventId) return;

    const eventDocRef = doc(db, "users", userId, EVENTS_SUBCOLLECTION, eventId);
    await deleteDoc(eventDocRef);
};
