'use client';

import React, { useState, useEffect } from 'react';
import { useProjectContext } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import BaseCard from '@/components/ui/BaseCard/BaseCard';
import {
    CalendarEvent,
    subscribeToUserEvents,
    addEventToUser,
    deleteUserEvent,
} from '@/lib/fireabase/calendarService';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from 'date-fns';

// REACT ICONS
import { FaChevronLeft, FaChevronRight, FaSearch } from "react-icons/fa";
import { MdDelete, MdEvent, MdDirectionsRun, MdCall, MdPayment } from "react-icons/md";

// STYLES
import styles from "./CalendarCard.module.css";

interface EventTypeOption {
    id: string;
    label: string;
    icon: React.ReactNode;
    colorId: string;
}

export default function CalendarCard() {
    const { user } = useAuth();
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const { selectedDate, setSelectedDate } = useProjectContext();
    const [zoomDay, setZoomDay] = useState<Date | null>(null);
    const [newEventTitle, setNewEventTitle] = useState<string>("");
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        if (!user?.uid) {
            setEvents([]);
            return;
        }

        const unsubscribe = subscribeToUserEvents(user.uid, (fetchedEvents) => {
            setEvents(fetchedEvents);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        setSelectedDate(format(today, 'yyyy-MM-dd'));
    };

    const [eventType, setEventType] = useState<string>("standard");
    const [eventColorId, setEventColorId] = useState<string>("9");

    const eventTypes: EventTypeOption[] = [
        { id: "standard", label: "Standard Event", icon: <MdEvent size={16} />, colorId: "9" },
        { id: "toGo", label: "To Go", icon: <MdDirectionsRun size={16} />, colorId: "5" },
        { id: "call", label: "Call", icon: <MdCall size={16} />, colorId: "2" },
        { id: "payment", label: "Payment", icon: <MdPayment size={16} />, colorId: "11" }
    ];

    const googleColors: Record<string, string> = {
        "9": "#5484ed", // Blue - Standard Event
        "5": "#f6bf26", // Yellow - To Go
        "2": "#22c55e", // Green - Call
        "11": "#ef4444", // Red - Payment
        // Backward compatibility
        "1": "#a4bdfc",
        "4": "#ef4444",
        "7": "#46d6db"
    };

    const getEventTypeIcon = (typeId?: string) => {
        switch (typeId) {
            case "toGo":
                return <MdDirectionsRun size={15} style={{ color: "#f6bf26" }} />;
            case "call":
                return <MdCall size={15} style={{ color: "#22c55e" }} />;
            case "payment":
                return <MdPayment size={15} style={{ color: "#ef4444" }} />;
            default:
                return <MdEvent size={15} style={{ color: "#5484ed" }} />;
        }
    };

    const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newEventTitle.trim() || !zoomDay || !user?.uid) return;

        const title = newEventTitle.trim();
        setNewEventTitle("");

        try {
            await addEventToUser(user.uid, {
                title,
                date: format(zoomDay, 'yyyy-MM-dd'),
                colorId: eventColorId,
                type: eventType,
            });
        } catch (error) {
            console.error("Event ekleme hatası:", error);
        }
    };

    const handleDeleteEvent = async (clickedId: string | number) => {
        if (!user?.uid) return;
        try {
            await deleteUserEvent(user.uid, String(clickedId));
        } catch (error) {
            console.error("Event silme hatası:", error);
        }
    };

    const handleZoomClick = (e: React.MouseEvent<HTMLButtonElement>, day: Date) => {
        e.stopPropagation();
        setZoomDay(day);
        setSelectedDate(format(day, 'yyyy-MM-dd'));
    };

    const handleDaySelect = (day: Date) => {
        setSelectedDate(format(day, 'yyyy-MM-dd'));
    };

    return (
        <BaseCard className={styles.calendarCard}>
            {zoomDay ? (
                /* Detay Görünümü */
                <div className={styles.detailContainer}>
                    <div className={styles.header}>
                        <h3 className={styles.monthTitle}>
                            {format(zoomDay, 'eeee, MMMM d, yyyy')}
                        </h3>
                        <button onClick={() => setZoomDay(null)} className={styles.actionBtn}>
                            Back to Calendar
                        </button>
                    </div>

                    <div className={styles.detailViewBody}>
                        <div className={styles.detailEventsSection}>
                            <h4>Events ({events.filter(e => e.date === format(zoomDay, 'yyyy-MM-dd')).length})</h4>
                            {events.filter(e => e.date === format(zoomDay, 'yyyy-MM-dd')).length === 0 ? (
                                <p className={styles.noEventsText}>No events scheduled for this day.</p>
                            ) : (
                                <div className={styles.detailEventsList}>
                                    {events
                                        .filter(e => e.date === format(zoomDay, 'yyyy-MM-dd'))
                                        .map((event) => (
                                            <div
                                                key={event.id}
                                                className={styles.detailEventItem}
                                                style={{ borderLeft: `3px solid ${googleColors[event.colorId] || '#5484ed'}` }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {getEventTypeIcon(event.type)}
                                                    <span>{event.title}</span>
                                                </div>
                                                <MdDelete
                                                    className={styles.deleteIcon}
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                />
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleAddEvent} className={styles.addEventForm}>
                            <h4 className={styles.formTitle}>Add New Event</h4>
                            <input
                                type="text"
                                placeholder={user ? "Event Title..." : "Please log in to add events"}
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                className={styles.eventInput}
                                disabled={!user}
                            />

                            <div className={styles.eventTypeButtonGroup}>
                                {eventTypes.map((type) => {
                                    const isSelected = eventType === type.id;
                                    return (
                                        <button
                                            key={type.id}
                                            type="button"
                                            className={`${styles.typeSelectorButton} ${isSelected ? styles.activeTypeButton : ""}`}
                                            onClick={() => {
                                                setEventType(type.id);
                                                setEventColorId(type.colorId);
                                            }}
                                            disabled={!user}
                                        >
                                            <span style={{ color: googleColors[type.colorId] || '#5484ed', display: 'flex', alignItems: 'center' }}>
                                                {type.icon}
                                            </span>
                                            <span>{type.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button type="submit" className={styles.submitEventButton} disabled={!user}>
                                {user ? "Add Event" : "Log in to add"}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                /* Normal Takvim Görünümü */
                <div className={styles.gridContainer}>
                    <div className={styles.header}>
                        <div className={styles.headerTitleSection}>
                            <h3 className={styles.monthTitle}>
                                {format(currentMonth, 'MMMM yyyy')}
                            </h3>
                            <button onClick={goToToday} className={styles.actionBtn}>
                                Today
                            </button>
                        </div>

                        <div className={styles.navigationButtons}>
                            <button onClick={prevMonth} className={styles.iconNavBtn}>
                                <FaChevronLeft size={14} />
                            </button>
                            <button onClick={nextMonth} className={styles.iconNavBtn}>
                                <FaChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.weekdaysGrid}>
                        <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
                    </div>

                    <div className={styles.daysGrid}>
                        {days.map((day: Date, idx: number) => {
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const dayFormatted = format(day, 'yyyy-MM-dd');
                            const isSelected = selectedDate === dayFormatted;
                            const isToday = isSameDay(day, new Date());
                            const dayEvents = events.filter(e => e.date === dayFormatted);

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleDaySelect(day)}
                                    className={`${styles.dayCell} ${!isCurrentMonth ? styles.otherMonthDay : ''} ${isSelected ? styles.selectedDayCell : ''}`}
                                >
                                    <div className={styles.badgeWrapper}>
                                        <span className={`${styles.dayBadge} ${isToday ? styles.todayBadge : ''}`}>
                                            {format(day, 'd')}
                                        </span>
                                        <button
                                            type="button"
                                            className={styles.desktopZoomButton}
                                            onClick={(e) => handleZoomClick(e, day)}
                                            title="View Day Details"
                                        >
                                            <FaSearch size={10} />
                                        </button>
                                    </div>

                                    {/* Mobile-only Event Indicator: small colored dots showing events exist */}
                                    <div className={styles.mobileEventIndicator}>
                                        {dayEvents.slice(0, 3).map((event, i) => (
                                            <span
                                                key={event.id || i}
                                                className={styles.mobileEventDot}
                                                style={{ backgroundColor: googleColors[event.colorId] || '#5484ed' }}
                                                title={event.title}
                                            />
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <span className={styles.mobileEventMore}>+{dayEvents.length - 3}</span>
                                        )}
                                    </div>

                                    {/* Desktop Events pills */}
                                    <div className={styles.eventsContainer}>
                                        {dayEvents.slice(0, 2).map((event, i) => (
                                            <div
                                                key={event.id || i}
                                                className={styles.eventItem}
                                                title={event.title}
                                                style={{ borderLeft: `2px solid ${googleColors[event.colorId] || '#5484ed'}` }}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <span className={styles.moreEvents}>+{dayEvents.length - 2} more</span>
                                        )}
                                    </div>

                                    {/* Mobile-only Clickable Zoom Button */}
                                    <button
                                        type="button"
                                        className={styles.mobileZoomButton}
                                        onClick={(e) => handleZoomClick(e, day)}
                                        aria-label={`View events for ${dayFormatted}`}
                                        title="View Day Details"
                                    >
                                        <FaSearch size={10} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </BaseCard>
    );
}
