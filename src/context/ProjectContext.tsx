'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { format } from 'date-fns';

interface ProjectContextType {
    selectedDate: string; // 'yyyy-MM-dd'
    setSelectedDate: (date: string) => void;
    createDetailedDayObject: (date: Date) => { formatted: string; raw: Date };
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
    // Default to today's date
    const [selectedDate, setSelectedDate] = useState<string>(
        format(new Date(), 'yyyy-MM-dd')
    );

    const createDetailedDayObject = (date: Date) => {
        return {
            formatted: format(date, 'yyyy-MM-dd'),
            raw: date,
        };
    };

    return (
        <ProjectContext.Provider
            value={{
                selectedDate,
                setSelectedDate,
                createDetailedDayObject,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

// Custom Hook for clean context usage
export const useProjectContext = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProjectContext must be used within a ProjectProvider');
    }
    return context;
};