import React from 'react';
import { X } from 'lucide-react';

const games = [
  {
    id: 'tictactoe',
    title: 'Tic Tac Toe',
    emoji: '⚔️',
    description: 'Play against Rick. He will destroy you.',
  },
  {
    id: 'rps',
    title: 'Rock Paper Scissors',
    emoji: '🪨',
    description: 'Rick trash talks every single round.',
  },
  {
    id: 'akinator',
    title: 'Rick-inator',
    emoji: '🧠',
    description: 'Think of anyone. Rick will guess who it is.',
  },
];

export default function RickGameMenu({ onSelectGame, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-black border-2 border-[#ff5e00] rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ff5e00]">
          <div>
            <h2 className="text-[#ff5e00] font-bold text-xl">Rick's Game Room</h2>
            <p className="text-gray-400 text-xs mt-0.5">Pick a game. Try not to embarrass yourself.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        {/* Rick intro */}
        <div className="mx-4 mt-4 p-3 bg-[#1a0a00] border border-[#ff5e00] rounded-lg">
          <p className="text-[#ff5e00] text-xs font-bold mb-1">Rick says:</p>
          <p className="text-white text-sm leading-relaxed">
            Oh great, you want to play games. Fine. Pick one and let's get this over with. I have a universe to save after this.
          </p>
        </div>

        {/* Game options */}
        <div className="flex flex-col gap-3 p-4">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className="flex items-center gap-4 p-4 bg-black border border-gray-700 hover:border-[#ff5e00] rounded-xl transition-all duration-200 text-left group"
            >
              <span className="text-3xl">{game.emoji}</span>
              <div>
                <p className="text-white font-semibold group-hover:text-[#ff5e00] transition-colors">{game.title}</p>
                <p className="text-gray-400 text-sm mt-0.5">{game.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 bg-transparent border border-gray-600 hover:border-white text-gray-400 hover:text-white font-semibold rounded-lg transition-colors"
          >
            Back to Chat
          </button>
        </div>
      </div>
    </div>
  );
}
