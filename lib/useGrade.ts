"use client";
import { useEffect, useState } from 'react';
import { Grade, isGrade } from './curriculum';

/** The pupil's chosen Tahun, remembered in this browser so every page starts on it. */
export function useGrade(defaultGrade: Grade = 5) {
    const [grade, setGradeState] = useState<Grade>(defaultGrade);

    useEffect(() => {
        try {
            const saved = Number(localStorage.getItem('grade'));
            if (isGrade(saved)) setGradeState(saved);
        } catch { /* storage unavailable: keep default */ }
    }, []);

    const setGrade = (next: Grade) => {
        setGradeState(next);
        try { localStorage.setItem('grade', String(next)); } catch { /* ignore */ }
    };

    return [grade, setGrade] as const;
}
