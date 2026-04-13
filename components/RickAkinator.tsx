import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

const MAX_QUESTIONS = 10;

const SYSTEM_PROMPT = `You are Rick Sanchez playing an Akinator-style guessing game. The user is thinking of a real person, fictional character, celebrity, or anyone. Your job is to guess who it is by asking yes/no questions.

Rules:
- Ask ONE yes/no question at a time. Keep questions short and sharp.
- Stay in character as Rick Sanchez — sarcastic, impatient, brilliant.
- After at most 10 questions, make your best guess. Format your guess EXACTLY like this: "RICK_GUESS: [name]"
- If you are very confident before 10 questions, go ahead and guess early using "RICK_GUESS: [name]"
- Never break character. Never be friendly.
- Do not number your questions.
- Questions should be efficient — narrow down gender, real vs fictional, alive/dead, profession, etc.
- When you make a guess, also say something snarky about it in Rick's voice before or after the RICK_GUESS line.

Start by saying something like "Alright, think of someone. Anyone. I'll figure it out in under 10 questions because I'm a genius." Then ask your first question.`;

export default function RickAkinator({ onClose, onBackToMenu }) {
  const [messages, setMessages] = useState([]);
  const [displayMessages, setDisplayMessages] = useState([]);
  const [gameState, setGameState] = useState('idle'); // idle, playing, guessed, won, lost
  const [questionCount, setQuestionCount] = useState(0);
  const [currentGuess, setCurrentGuess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayMessages]);

  const speakText = async (text) => {
    try {
      setIsSpeaking(true);
      const clean = text.replace(/RICK_GUESS:.*$/m, '').trim();
      if (!clean) return;
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean }),
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

  const callAI = async (msgs) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: msgs,
      }),
    });
    const data = await response.json();
    return data.content[0].text;
  };

  const startGame = async () => {
    setIsLoading(true);
    setGameState('playing');
    setQuestionCount(0);
    setMessages([]);
    setDisplayMessages([]);
    setCurrentGuess('');

    try {
      const initMessages = [{ role: 'user', content: 'Start the game.' }];
      const rickResponse = await callAI(initMessages);
      const newMessages = [...initMessages, { role: 'assistant', content: rickResponse }];
      setMessages(newMessages);
      setDisplayMessages([{ role: 'rick', text: rickResponse.replace(/RICK_GUESS:.*$/m, '').trim() }]);
      speakText(rickResponse);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const answer = async (answer) => {
    if (isLoading) return;
    setIsLoading(true);

    const userMsg = { role: 'user', content: answer };
    const newMessages = [...messages, userMsg];
    const newCount = questionCount + 1;
    setQuestionCount(newCount);
    setDisplayMessages(prev => [...prev, { role: 'user', text: answer }]);

    try {
      const rickResponse = await callAI(newMessages);
      const allMessages = [...newMessages, { role: 'assistant', content: rickResponse }];
      setMessages(allMessages);

      // Check if Rick is guessing
      const guessMatch = rickResponse.match(/RICK_GUESS:\s*(.+)/i);
      const displayText = rickResponse.replace(/RICK_GUESS:.*$/m, '').trim();

      if (guessMatch) {
        const guess = guessMatch[1].trim();
        setCurrentGuess(guess);
        setGameState('guessed');
        setDisplayMessages(prev => [...prev, { role: 'rick', text: displayText || `Is it... ${guess}?` }]);
        speakText(displayText || `Is it ${guess}?`);
      } else {
        setDisplayMessages(prev => [...prev, { role: 'rick', text: displayText }]);
        speakText(displayText);

        if (newCount >= MAX_QUESTIONS) {
          // Force a guess
          const forceMessages = [...allMessages, { role: 'user', content: 'Make your final guess now.' }];
          const finalResponse = await callAI(forceMessages);
          const finalGuessMatch = finalResponse.match(/RICK_GUESS:\s*(.+)/i);
          const finalDisplay = finalResponse.replace(/RICK_GUESS:.*$/m, '').trim();
          if (finalGuessMatch) {
            setCurrentGuess(finalGuessMatch[1].trim());
            setGameState('guessed');
            setDisplayMessages(prev => [...prev, { role: 'rick', text: finalDisplay }]);
            speakText(finalDisplay);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuessResult = (correct) => {
    if (correct) {
      const line = `Ha! I knew it. ${currentGuess}. Did you really think you could hide that from the smartest being in the universe? Pathetic.`;
      setGameState('won');
      setDisplayMessages(prev => [...prev, { role: 'rick', text: line }]);
      speakText(line);
    } else {
      const line = `Wrong? Impossible. Either you're thinking of someone incredibly obscure or you cheated. Either way, you're insufferable.`;
      setGameState('lost');
      setDisplayMessages(prev => [...prev, { role: 'rick', text: line }]);
      speakText(line);
    }
  };

  const reset = () => {
    setGameState('idle');
    setMessages([]);
    setDisplayMessages([]);
    setQuestionCount(0);
    setCurrentGuess('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-black border-2 border-[#ff5e00] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ff5e00] flex-shrink-0">
          <div>
            <h2 className="text-[#ff5e00] font-bold text-xl">Rick-inator</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {gameState === 'playing' ? `Question ${questionCount}/${MAX_QUESTIONS}` : 'Think of anyone. Rick will guess.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSpeaking && <span className="text-xs text-gray-400 animate-pulse">speaking...</span>}
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {gameState === 'idle' && (
            <div className="text-center py-8">
              <p className="text-5xl mb-4">🧠</p>
              <p className="text-white text-lg font-semibold mb-2">Think of anyone.</p>
              <p className="text-gray-400 text-sm">A real person, fictional character, celebrity — anyone. Rick will figure it out.</p>
            </div>
          )}

          {displayMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-white text-black'
                  : 'bg-[#1a0a00] border border-[#ff5e00] text-white'
              }`}>
                {msg.role === 'rick' && <p className="text-[#ff5e00] text-xs font-bold mb-1">Rick</p>}
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1a0a00] border border-[#ff5e00] px-4 py-2 rounded-xl">
                <p className="text-[#ff5e00] text-xs font-bold mb-1">Rick</p>
                <p className="text-white text-sm animate-pulse">Calculating...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Controls */}
        <div className="border-t border-gray-800 p-4 flex-shrink-0">

          {gameState === 'idle' && (
            <button
              onClick={startGame}
              disabled={isLoading}
              className="w-full py-3 bg-[#ff5e00] hover:bg-[#ff7e30] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              I'm thinking of someone...
            </button>
          )}

          {gameState === 'playing' && (
            <div className="flex gap-3">
              <button
                onClick={() => answer('Yes')}
                disabled={isLoading}
                className="flex-1 py-3 bg-green-800 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => answer('No')}
                disabled={isLoading}
                className="flex-1 py-3 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                No
              </button>
              <button
                onClick={() => answer("I don't know")}
                disabled={isLoading}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Not sure
              </button>
            </div>
          )}

          {gameState === 'guessed' && (
            <div>
              <p className="text-center text-white font-semibold mb-3">
                Rick guesses: <span className="text-[#ff5e00]">{currentGuess}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleGuessResult(true)}
                  className="flex-1 py-3 bg-green-800 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Yes, correct!
                </button>
                <button
                  onClick={() => handleGuessResult(false)}
                  className="flex-1 py-3 bg-red-900 hover:bg-red-800 text-white font-semibold rounded-lg transition-colors"
                >
                  No, wrong!
                </button>
              </div>
            </div>
          )}

          {(gameState === 'won' || gameState === 'lost') && (
            <button
              onClick={reset}
              className="w-full py-3 bg-[#ff5e00] hover:bg-[#ff7e30] text-white font-semibold rounded-lg transition-colors"
            >
              Play Again
            </button>
          )}

          <button
            onClick={onBackToMenu}
            className="w-full mt-2 py-2 bg-transparent border border-gray-700 hover:border-white text-gray-400 hover:text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" preload="auto" />
    </div>
  );
}
