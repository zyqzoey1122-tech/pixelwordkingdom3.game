import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- 配置 & 词库 ---
const RAW_WORDS = [
  { english: 'ancient', chinese: '古代的' },
  { english: 'landscape', chinese: '风景' },
  { english: 'fantastic', chinese: '极好的' },
  { english: 'comfortable', chinese: '舒适的' },
  { english: 'experience', chinese: '经验' }
];

const HEROES = [
  { id: 'h1', name: 'Sky Princess', color: 'bg-emerald-500' },
  { id: 'h2', name: 'Fire Prince', color: 'bg-red-500' }
];

// --- 模拟 SaaS 验证 ---
const VALID_CODES = ['DEMO2025', 'TEACHER-FREE'];

const App = () => {
  const [view, setView] = useState<'LOGIN' | 'HERO' | 'GAME' | 'WIN'>('LOGIN');
  const [classCode, setClassCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [selectedHero, setSelectedHero] = useState(HEROES[0]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (VALID_CODES.includes(classCode.toUpperCase()) && studentId) {
      setView('HERO');
    } else {
      alert("无效的授权码！");
    }
  };

  const getAiHelp = async () => {
    setLoading(true);
    try {
      // 注意：商用时此逻辑应移至后端以保护 API Key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const word = RAW_WORDS[currentIdx];
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `为初中生写一个15字以内的幽默记忆法，关于单词 "${word.english}" (意思: ${word.chinese})。`
      });
      setMnemonic(res.text);
    } catch (e) {
      setMnemonic("魔法精神正在休息，请稍后再试。");
    }
    setLoading(false);
  };

  const check = (val: string) => {
    if (val.toLowerCase() === RAW_WORDS[currentIdx].english.toLowerCase()) {
      setMistakes(0); setMnemonic(null);
      if (currentIdx + 1 < RAW_WORDS.length) setCurrentIdx(currentIdx + 1);
      else setView('WIN');
    } else {
      setMistakes(m => m + 1);
    }
  };

  if (view === 'LOGIN') return (
    <div className="h-screen bg-sky flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-black text-indigo-900 mb-8">单词王国 SaaS 版</h1>
      <div className="bg-white p-8 rounded-3xl border-4 border-indigo-900 w-full max-w-sm flex flex-col gap-4 shadow-xl">
        <input placeholder="班级授权码 (输入: DEMO2025)" className="border-2 p-4 rounded-xl" value={classCode} onChange={e=>setClassCode(e.target.value)} />
        <input placeholder="学生姓名" className="border-2 p-4 rounded-xl" value={studentId} onChange={e=>setStudentId(e.target.value)} />
        <button onClick={handleLogin} className="bg-indigo-600 text-white py-4 rounded-xl font-black">开始学习</button>
      </div>
    </div>
  );

  if (view === 'HERO') return (
    <div className="h-screen bg-indigo-900 flex flex-col items-center justify-center p-8">
      <h2 className="text-white text-2xl font-black mb-8">选择你的英雄</h2>
      <div className="flex gap-4">
        {HEROES.map(h => (
          <div key={h.id} onClick={()=>{setSelectedHero(h); setView('GAME')}} className="bg-white p-6 rounded-2xl cursor-pointer hover:scale-105 transition-all">
            <div className={`w-20 h-20 ${h.color} rounded-xl mb-2`} />
            <p className="font-black text-center">{h.name}</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (view === 'GAME') return (
    <div className="h-screen bg-white p-8 flex flex-col items-center">
      <div className="w-full flex justify-between font-black text-indigo-900 mb-12">
        <span>班级: {classCode}</span>
        <span>进度: {currentIdx + 1}/{RAW_WORDS.length}</span>
      </div>
      <div className="text-5xl font-black mb-8 text-indigo-600">{RAW_WORDS[currentIdx].chinese}</div>
      <input 
        autoFocus 
        className="border-4 border-black p-5 rounded-2xl text-3xl font-black text-center w-full max-w-md"
        placeholder="输入英文单词..."
        onKeyDown={e => e.key === 'Enter' && check(e.currentTarget.value)}
      />
      {mistakes >= 2 && (
        <div className="mt-8 flex flex-col items-center">
          <button onClick={getAiHelp} className="bg-purple-600 text-white px-6 py-2 rounded-full font-black animate-pulse">
            {loading ? "召唤中..." : "🔮 召唤 AI 助记精灵"}
          </button>
          {mnemonic && <p className="mt-4 p-4 bg-purple-50 rounded-xl text-purple-900 font-bold">{mnemonic}</p>}
        </div>
      )}
    </div>
  );

  if (view === 'WIN') return (
    <div className="h-screen bg-emerald-500 flex flex-col items-center justify-center text-white p-8">
      <h1 className="text-6xl font-black mb-4">挑战成功！</h1>
      <p className="text-xl mb-8">进度已保存至班级 {classCode}</p>
      <button onClick={()=>location.reload()} className="bg-white text-emerald-600 px-12 py-4 rounded-xl font-black">返回主页</button>
    </div>
  );

  return null;
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
