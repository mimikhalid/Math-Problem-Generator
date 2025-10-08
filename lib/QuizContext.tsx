"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface HistoryItem {
    id: string;
    problem: string;
    userAnswer: string;
    isCorrect: boolean;
    type: string;
    difficulty: string;
    correctAnswer: number;
    step_by_step_solution: string[]
}

interface QuizContextType {
    score: number;
    setScore: React.Dispatch<React.SetStateAction<number>>;
    history: HistoryItem[];
    setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
    currentProblem: any;
    setCurrentProblem: React.Dispatch<React.SetStateAction<any>>;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [score, setScore] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedScore = localStorage.getItem('quizScore');
            return savedScore ? parseInt(savedScore, 10) : 0;
        }
        return 0;
    });

    const [history, setHistory] = useState<HistoryItem[]>(() => {
        if (typeof window !== 'undefined') {
            const savedHistory = localStorage.getItem('quizHistory');
            return savedHistory ? JSON.parse(savedHistory) : [];
        }
        return [];
    });
    
    // State to hold the active problem object
    const [currentProblem, setCurrentProblem] = useState<any>(null);

    // Persist score and history to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('quizScore', score.toString());
    }, [score]);
    
    useEffect(() => {
        // Remove the limit 10 from the history persistence
        localStorage.setItem('quizHistory', JSON.stringify(history));
    }, [history]);


    return (
        <QuizContext.Provider value={{ score, setScore, history, setHistory, currentProblem, setCurrentProblem }}>
            {children}
        </QuizContext.Provider>
    );
};

export const useQuiz = () => {
    const context = useContext(QuizContext);
    if (context === undefined) {
        throw new Error('useQuiz must be used within a QuizProvider');
    }
    return context;
};