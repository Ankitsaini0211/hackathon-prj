// src/client/App.tsx

import React from 'react';
import { usePuzzle } from './hooks/usePuzzle';

// Custom confetti component using pure CSS
const Confetti: React.FC = () => {
  const emojis = ['🎉', '✨', '🎊', '💥', '⭐', '🔥'];
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <span
          key={i}
          className="absolute animate-fall text-2xl"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            fontSize: `${1 + Math.random()}rem`,
          }}
        >
          {emojis[Math.floor(Math.random() * emojis.length)]}
        </span>
      ))}
      <style>
        {`
          @keyframes fall {
            0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          .animate-fall {
            animation: fall 3s linear forwards;
          }
        `}
      </style>
    </div>
  );
};

export const App: React.FC = () => {
  const { puzzle, loading, answered, isCorrect, submitAnswer, resetPuzzle } = usePuzzle();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d93900] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading today's puzzle...</p>
        </div>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg">
          <p className="text-xl text-red-600 mb-4">No puzzle available</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#d93900] text-white px-6 py-2 rounded-lg hover:bg-[#b52c00] transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-4 relative">
      {/* Confetti animation for correct answers */}
      {answered && isCorrect && <Confetti />}
      
      {/* Reddit logo/mascot */}
      <img 
        className="w-20 h-20 mb-6 opacity-90" 
        src="/snoo.png" 
        alt="Reddit Snoo" 
      />

      {/* Game container */}
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {!answered ? (
          <>
            {/* Question */}
            <h1 className="text-2xl font-bold text-gray-800 mb-6 leading-tight">
              {puzzle.question}
            </h1>
            
            {/* Answer options */}
            <div className="space-y-3">
              {puzzle.options.map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => submitAnswer(option)}
                  className="w-full px-4 py-3 rounded-xl bg-[#d93900] text-white font-medium hover:bg-[#b52c00] transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Results screen */}
            <div className="mb-6">
              <div className={`text-6xl mb-4 ${isCorrect ? 'animate-bounce' : 'animate-pulse'}`}>
                {isCorrect ? '🎉' : '❌'}
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect ? 'Correct!' : 'Wrong!'}
              </h2>
              <p className="text-gray-600 mb-4">
                The correct answer was: <span className="font-semibold text-gray-800">{puzzle.answer}</span>
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={resetPuzzle}
                className="w-full bg-[#d93900] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#b52c00] transition"
              >
                Try Another Question
              </button>
              <p className="text-sm text-gray-500">
                Come back tomorrow for a new daily puzzle!
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Built with 💝 for Reddit Hackathon 2025</p>
      </div>
    </div>
  );
};
