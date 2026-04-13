import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const WIN_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

const RICK_WIN_TAUNTS = [
  "Ha! Did you really think you could beat the smartest man in the universe? Pathetic.",
  "I've defeated galactic overlords. You never stood a chance, Morty... I mean, you.",
  "Wubba lubba dub dub! That means I won, genius.",
  "I calculated your every move 47 steps ahead. This was over before it started.",
  "You just got beaten at Tic Tac Toe by a man trapped in a poster. Let that sink in.",
];

const RICK_LOSE_TAUNTS = [
  "Okay okay, you got lucky. The quantum fluctuations were clearly in your favor.",
  "I let you win. Obviously. I'm testing your confidence levels for an experiment.",
  "Congratulations, you beat a genius trapped in 2D space. Real impressive.",
  "This means nothing. I was using 12% of my brain. The other 88% was inventing things.",
  "Fine. You won. But can you build a portal gun? Didn't think so.",
];

const RICK_DRAW_TAUNTS = [
  "A draw? Against me? You should be proud. Most people lose in 3 moves.",
  "Interesting. You're not as dumb as you look. Still pretty dumb though.",
  "A tie. The mathematical equivalent of nothing mattering. Classic.",
  "You managed not to lose. That's... something, I guess.",
];

const RICK_MOVE_COMMENTS = [
  "Really? THAT'S your move?",
  "Ugh, predictable.",
  "Bold strategy. Wrong, but bold.",
  "I've seen better moves from a Gazorpazorp infant.",
  "Sure, go ahead. It won't help you.",
  "Oh interesting. Still losing though.",
];

function checkWinner(board: (string | null)[]): { winner: string; combo: number[] } | null {
  for (const combo of WIN_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a]!, combo };
    }
  }
  return null;
}

function getBestMove(board: (string | null)[]): number {
  // Try to win
  for (const combo of WIN_COMBOS) {
    const [a, b, c] = combo;
    const vals = [board[a], board[b], board[c]];
    if (vals.filter(v => v === 'R').length === 2 && vals.includes(null)) {
      return combo[vals.indexOf(null)];
    }
  }
  // Block player
  for (const combo of WIN_COMBOS) {
    const [a, b, c] = combo;
    const vals = [board[a], board[b], board[c]];
    if (vals.filter(v => v === 'X').length === 2 && vals.includes(null)) {
      return combo[vals.indexOf(null)];
    }
  }
  // Take center
  if (!board[4]) return 4;
  // Take corners
  const corners = [0, 2, 6, 8].filter(i => !board[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // Take any
  const available = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
  return available[Math.floor(Math.random() * available.length)];
}

function randomFrom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface RickTicTacToeProps {
  onClose: () => void;
}

export default function RickTicTacToe({ onClose }: RickTicTacToeProps) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost' | 'draw'>('playing');
  const [winCombo, setWinCombo] = useState<number[] | null>(null);
  const [rickComment, setRickComment] = useState("Oh great, another human who thinks they can beat me. Go ahead, make your move.");
  const [score, setScore] = useState({ player: 0, rick: 0, draws: 0 });

  useEffect(() => {
    if (!isPlayerTurn && status === 'playing') {
      const timer = setTimeout(() => {
        const newBoard = [...board];
        const move = getBestMove(newBoard);
        newBoard[move] = 'R';

        const result = checkWinner(newBoard);
        if (result) {
          setWinCombo(result.combo);
          setStatus('lost');
          setRickComment(randomFrom(RICK_WIN_TAUNTS));
          setScore(s => ({ ...s, rick: s.rick + 1 }));
        } else if (newBoard.every(Boolean)) {
          setStatus('draw');
          setRickComment(randomFrom(RICK_DRAW_TAUNTS));
          setScore(s => ({ ...s, draws: s.draws + 1 }));
        } else {
          setRickComment(randomFrom(RICK_MOVE_COMMENTS));
        }

        setBoard(newBoard);
        setIsPlayerTurn(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, board, status]);

  const handleClick = (i: number) => {
    if (!isPlayerTurn || board[i] || status !== 'playing') return;

    const newBoard = [...board];
    newBoard[i] = 'X';

    const result = checkWinner(newBoard);
    if (result) {
      setWinCombo(result.combo);
      setStatus('won');
      setRickComment(randomFrom(RICK_LOSE_TAUNTS));
      setScore(s => ({ ...s, player: s.player + 1 }));
      setBoard(newBoard);
      return;
    }

    if (newBoard.every(Boolean)) {
      setStatus('draw');
      setRickComment(randomFrom(RICK_DRAW_TAUNTS));
      setScore(s => ({ ...s, draws: s.draws + 1 }));
      setBoard(newBoard);
      return;
    }

    setBoard(newBoard);
    setIsPlayerTurn(false);
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setStatus('playing');
    setWinCombo(null);
    setRickComment("Fine, another round. Don't expect me to go easy on you.");
  };

  const getCellStyle = (i: number) => {
    const isWin = winCombo?.includes(i);
    const val = board[i];
    return {
      base: `w-full aspect-square flex items-center justify-center text-4xl font-bold cursor-pointer rounded-lg border-2 transition-all duration-200 select-none`,
      color: isWin
        ? val === 'X' ? 'border-green-400 bg-green-900 bg-opacity-40 text-green-400' : 'border-red-400 bg-red-900 bg-opacity-40 text-red-400'
        : val === 'X' ? 'border-white text-white bg-black bg-opacity-40 hover:bg-opacity-60'
        : val === 'R' ? 'border-[#ff5e00] text-[#ff5e00] bg-black bg-opacity-40'
        : 'border-gray-700 bg-black bg-opacity-20 hover:border-[#ff5e00] hover:bg-opacity-40'
    };
  };

  const statusText = {
    playing: isPlayerTurn ? "Your move, genius." : "Rick is thinking...",
    won: "You won! ...This time.",
    lost: "Rick wins. Obviously.",
    draw: "It's a draw. How boring.",
  }[status];

  const statusColor = {
    playing: 'text-white',
    won: 'text-green-400',
    lost: 'text-red-400',
    draw: 'text-yellow-400',
  }[status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-black border-2 border-[#ff5e00] rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ff5e00]">
          <div>
            <h2 className="text-[#ff5e00] font-bold text-xl">Rick's Tic Tac Toe</h2>
            <p className="text-gray-400 text-xs mt-0.5">You: X &nbsp;|&nbsp; Rick: R</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        {/* Score */}
        <div className="flex justify-center gap-6 py-3 border-b border-gray-800">
          {[['You', score.player, 'text-white'], ['Draws', score.draws, 'text-yellow-400'], ['Rick', score.rick, 'text-[#ff5e00]']].map(([label, val, color]) => (
            <div key={label as string} className="text-center">
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-gray-500 text-xs">{label}</p>
            </div>
          ))}
        </div>

        {/* Rick's comment */}
        <div className="mx-4 mt-4 p-3 bg-[#1a0a00] border border-[#ff5e00] rounded-lg">
          <p className="text-[#ff5e00] text-xs font-bold mb-1">Rick says:</p>
          <p className="text-white text-sm leading-relaxed">{rickComment}</p>
        </div>

        {/* Status */}
        <p className={`text-center text-sm font-semibold mt-3 ${statusColor}`}>{statusText}</p>

        {/* Board */}
        <div className="grid grid-cols-3 gap-2 p-4">
          {board.map((val, i) => {
            const s = getCellStyle(i);
            return (
              <div key={i} className={`${s.base} ${s.color}`} onClick={() => handleClick(i)}>
                {val}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 px-4 pb-5">
          <button
            onClick={reset}
            className="flex-1 py-3 bg-[#ff5e00] hover:bg-[#ff7e30] text-white font-semibold rounded-lg transition-colors"
          >
            {status === 'playing' ? 'Restart' : 'Play Again'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-transparent border border-gray-600 hover:border-white text-gray-400 hover:text-white font-semibold rounded-lg transition-colors"
          >
            Back to Chat
          </button>
        </div>
      </div>
    </div>
  );
}
