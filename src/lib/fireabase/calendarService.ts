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
    writeBatch,
} from "firebase/firestore";
import { db } from "./client";

export interface CalendarEvent {
    id: string;
    title: string;
    date: string; // 'yyyy-MM-dd'
    colorId: string;
    type?: string;
    createdAt?: any;
    updatedAt?: any;
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

// 4. Kullanıcı Etkinliğini Güncelle (Edit Event)
export const updateUserEvent = async (
    userId: string,
    eventId: string,
    event: {
        title: string;
        date: string;
        colorId?: string;
        type?: string;
    }
) => {
    if (!userId || !eventId || !event.title.trim()) return;

    const eventDocRef = doc(db, "users", userId, EVENTS_SUBCOLLECTION, eventId);
    await updateDoc(eventDocRef, {
        title: event.title.trim(),
        date: event.date,
        colorId: event.colorId || "9",
        type: event.type || "standard",
        updatedAt: serverTimestamp(),
    });
};

// 5. Çoklu Etkinlik Ekle (Repeat / Batch Events)
export const addBatchEventsToUser = async (
    userId: string,
    events: Array<{
        title: string;
        date: string;
        colorId?: string;
        type?: string;
    }>
) => {
    if (!userId || events.length === 0) return;

    // Firestore batch limit is 500 operations
    const BATCH_SIZE = 450;
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
        const chunk = events.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        const eventsRef = collection(db, "users", userId, EVENTS_SUBCOLLECTION);

        for (const ev of chunk) {
            if (!ev.title.trim()) continue;
            const newDocRef = doc(eventsRef);
            batch.set(newDocRef, {
                title: ev.title.trim(),
                date: ev.date,
                colorId: ev.colorId || "9",
                type: ev.type || "standard",
                createdAt: serverTimestamp(),
            });
        }

        await batch.commit();
    }
};

