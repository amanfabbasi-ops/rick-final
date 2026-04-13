import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

const choices = ['Rock', 'Paper', 'Scissors'];

const emojis = { Rock: '🪨', Paper: '📄', Scissors: '✂️' };

const WIN_LINES = {
  Rock: 'Scissors',
  Paper: 'Rock',
  Scissors: 'Paper',
};

const RICK_WIN = [
  "Rock beats scissors. Just like science beats your feelings.",
  "Ha! Predictable. I modeled your choice using quantum probability. You never had a chance.",
  "You picked that? Seriously? Even Morty does better and he cries at everything.",
  "Winner winner, Szechuan dinner. That's me, by the way.",
  "I win again. Shocking. Not really.",
];

const RICK_LOSE = [
  "You got lucky. The multiverse just happened to favor you this once.",
  "Fine. You won. I was distracted by a dimension where scissors beats everything.",
  "Okay that was genuinely unexpected. I respect it. A little. Very little.",
  "Enjoy it. There are infinite universes where I win. This is just a weird one.",
  "I let you win. For science. I'm studying your dopamine response.",
];

const RICK_DRAW = [
  "A tie. How cosmically boring.",
  "We picked the same thing. Are you copying me? Don't copy me.",
  "Draw. The universe is indifferent to both of us. Mostly you though.",
  "Same choice. You must be psychically linked to me. Gross.",
];

const RICK_INTRO = [
  "Rock Paper Scissors. The game of champions and idiots. Let's find out which one you are.",
  "Alright let's do this. I already know what you're going to pick, by the way.",
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getResult(player, rick) {
  if (player === rick) return 'draw';
  if (WIN_LINES[player] === rick) return 'win';
  return 'lose';
}

export default function RickRPS({ onClose, onBackToMenu }) {
  const [playerChoice, setPlayerChoice] = useState(null);
  const [rickChoice, setRickChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [rickComment, setRickComment] = useState(randomFrom(RICK_INTRO));
  const [score, setScore] = useState({ player: 0, rick: 0, draws: 0 });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const audioRef = useRef(null);

  const speakText = async (text) => {
    try {
      setIsSpeaking(true);
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (data.audioUrl && audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.load();
        audioRef.current.play().catch(e => console.log('Audio error:', e));
      }
    } catch (error) {
      console.error('Speak error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const play = (choice) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setPlayerChoice(choice);
    setRickChoice(null);
    setResult(null);

    setTimeout(() => {
      const rick = randomFrom(choices);
      const outcome = getResult(choice, rick);
      let comment = '';

      if (outcome === 'win') {
        comment = randomFrom(RICK_LOSE);
        setScore(s => ({ ...s, player: s.player + 1 }));
      } else if (outcome === 'lose') {
        comment = randomFrom(RICK_WIN);
        setScore(s => ({ ...s, rick: s.rick + 1 }));
      } else {
        comment = randomFrom(RICK_DRAW);
        setScore(s => ({ ...s, draws: s.draws + 1 }));
      }

      setRickChoice(rick);
      setResult(outcome);
      setRickComment(comment);
      speakText(comment);
      setIsAnimating(false);
    }, 800);
  };

  const reset = () => {
    setPlayerChoice(null);
    setRickChoice(null);
    setResult(null);
    const comment = "Again? Fine. I enjoy watching you fail repeatedly.";
    setRickComment(comment);
    speakText(comment);
  };

  const resultText = {
    win: 'You Win!',
    lose: 'Rick Wins!',
    draw: "It's a Draw!",
  };

  const resultColor = {
    win: 'text-green-400',
    lose: 'text-red-400',
    draw: 'text-yellow-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-black border-2 border-[#ff5e00] rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ff5e00]">
          <div>
            <h2 className="text-[#ff5e00] font-bold text-xl">Rock Paper Scissors</h2>
            <p className="text-gray-400 text-xs mt-0.5">You vs Rick</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        {/* Score */}
        <div className="flex justify-center gap-6 py-3 border-b border-gray-800">
          {[['You', score.player, 'text-white'], ['Draws', score.draws, 'text-yellow-400'], ['Rick', score.rick, 'text-[#ff5e00]']].map(([label, val, color]) => (
            <div key={label} className="text-center">
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-gray-500 text-xs">{label}</p>
            </div>
          ))}
        </div>

        {/* Rick comment */}
        <div className="mx-4 mt-4 p-3 bg-[#1a0a00] border border-[#ff5e00] rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[#ff5e00] text-xs font-bold">Rick says:</p>
            {isSpeaking && <span className="text-xs text-gray-400 animate-pulse">speaking...</span>}
          </div>
          <p className="text-white text-sm leading-relaxed">{rickComment}</p>
        </div>

        {/* Battle display */}
        {playerChoice && (
          <div className="flex items-center justify-center gap-6 mt-4 px-4">
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">You</p>
              <div className="text-6xl">{emojis[playerChoice]}</div>
              <p className="text-white text-sm mt-1">{playerChoice}</p>
            </div>
            <div className="text-[#ff5e00] text-2xl font-bold">VS</div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">Rick</p>
              <div className="text-6xl">{isAnimating ? '❓' : rickChoice ? emojis[rickChoice] : '❓'}</div>
              <p className="text-white text-sm mt-1">{isAnimating ? '...' : rickChoice || '?'}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <p className={`text-center text-lg font-bold mt-3 ${resultColor[result]}`}>
            {resultText[result]}
          </p>
        )}

        {/* Choice buttons */}
        {!playerChoice && (
          <div className="flex justify-center gap-4 mt-4 px-4">
            {choices.map(c => (
              <button
                key={c}
                onClick={() => play(c)}
                className="flex flex-col items-center gap-2 p-4 bg-black border border-gray-700 hover:border-[#ff5e00] rounded-xl transition-all duration-200 flex-1"
              >
                <span className="text-4xl">{emojis[c]}</span>
                <span className="text-white text-sm">{c}</span>
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 px-4 py-4 mt-2">
          {playerChoice && (
            <button
              onClick={reset}
              className="flex-1 py-3 bg-[#ff5e00] hover:bg-[#ff7e30] text-white font-semibold rounded-lg transition-colors"
            >
              Play Again
            </button>
          )}
          <button
            onClick={onBackToMenu}
            className="flex-1 py-3 bg-transparent border border-gray-600 hover:border-white text-gray-400 hover:text-white font-semibold rounded-lg transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" preload="auto" />
    </div>
  );
}
