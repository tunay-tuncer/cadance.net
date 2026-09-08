'use client';

import React, { useState } from 'react';
import { useProjectContext } from '@/context/ProjectContext';
import BaseCard from '@/components/ui/BaseCard/BaseCard'; // Daha önce tasarladığımız BaseCard
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
import { MdDelete, MdEvent, MdCenterFocusStrong, MdLocationOn, MdDoorBack } from "react-icons/md";

// STYLES
import styles from "./CalendarCard.module.css";

export interface CalendarEvent {
    id: string | number;
    title: string;
    date: string; // 'yyyy-MM-dd'
    colorId: string;
    type?: string;
}

interface EventTypeOption {
    id: string;
    label: string;
    icon: React.ReactNode;
    colorId: string;
}

export default function CalendarCard() {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const { selectedDate, setSelectedDate } = useProjectContext();
    const [zoomDay, setZoomDay] = useState<Date | null>(null);
    const [newEventTitle, setNewEventTitle] = useState<string>("");

    // Geçici demo etkinlikleri (Context/Firebase bağlandığında burası prop veya context'ten gelecek)
    const [events, setEvents] = useState<CalendarEvent[]>([
        { id: '1', title: 'Site Measurement', date: format(new Date(), 'yyyy-MM-dd'), colorId: '9' },
        { id: '2', title: 'Client Concept Review', date: format(new Date(), 'yyyy-MM-dd'), colorId: '7' }
    ]);

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

    const [eventType, setEventType] = useState<string>("default");
    const [eventColorId, setEventColorId] = useState<string>("9");

    const eventTypes: EventTypeOption[] = [
        { id: "default", label: "Standard Event", icon: <MdEvent size={16} />, colorId: "9" },
        { id: "focusTime", label: "Focus Time", icon: <MdCenterFocusStrong size={16} />, colorId: "1" },
        { id: "outOfOffice", label: "Out of Office", icon: <MdDoorBack size={16} />, colorId: "4" },
        { id: "workingLocation", label: "Working Location", icon: <MdLocationOn size={16} />, colorId: "7" }
    ];

    const googleColors: Record<string, string> = {
        "1": "#a4bdfc",
        "4": "#ff887c",
        "7": "#46d6db",
        "9": "#5484ed"
    };

    const handleAddEvent = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newEventTitle.trim() || !zoomDay) return;

        const newEvent: CalendarEvent = {
            id: Date.now().toString(),
            title: newEventTitle,
            date: format(zoomDay, 'yyyy-MM-dd'),
            colorId: eventColorId,
            type: eventType
        };

        setEvents(prev => [...prev, newEvent]);
        setNewEventTitle("");
    };

    const handleDeleteEvent = (clickedId: string | number) => {
        setEvents(prev => prev.filter(e => e.id !== clickedId));
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
                                                <span>{event.title}</span>
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
                                placeholder="Event Title..."
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                className={styles.eventInput}
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
                                        >
                                            {type.icon}
                                            <span>{type.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button type="submit" className={styles.submitEventButton}>
                                Add Event
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
                                            className={styles.zoomButton}
                                            onClick={(e) => handleZoomClick(e, day)}
                                            title="View Day Details"
                                        >
                                            <FaSearch size={10} />
                                        </button>
                                    </div>

                                    <div className={styles.eventsContainer}>
                                        {dayEvents.slice(0, 2).map((event, i) => (
                                            <div
                                                key={i}
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
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </BaseCard>
    );
}
