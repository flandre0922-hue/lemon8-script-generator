'use client';

import { useState, useEffect } from 'react';
import { Settings, Sparkles, Copy, Check, RefreshCw, AlertCircle, Wand2, Key, AlignLeft, Save, Trash2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SavedScript = {
  id: string;
  title: string;
  content: string;
};

export default function Home() {
  // Input states
  const [apiKey, setApiKey] = useState('');
  const [baseScript, setBaseScript] = useState('');
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [hookDirection, setHookDirection] = useState('');

  // Stock states
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string>('new');

  // Output states
  const [isGenerating, setIsGenerating] = useState(false);
  const [narration, setNarration] = useState('');
  const [telop, setTelop] = useState('');
  const [error, setError] = useState('');
  
  // Copy states
  const [copiedNarration, setCopiedNarration] = useState(false);
  const [copiedTelop, setCopiedTelop] = useState(false);

  // Load saved scripts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lemon8_saved_scripts');
    if (saved) {
      try {
        setSavedScripts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved scripts');
      }
    }
  }, []);

  const saveToStock = () => {
    if (!baseScript.trim()) {
      alert('保存する台本が空です。');
      return;
    }
    const title = window.prompt('ストックする台本のタイトルを入力してください\n（例：掃除術 テンプレA）');
    if (!title) return; // cancelled or empty

    const newScript: SavedScript = {
      id: Date.now().toString(),
      title: title.trim(),
      content: baseScript,
    };

    const updated = [...savedScripts, newScript];
    setSavedScripts(updated);
    localStorage.setItem('lemon8_saved_scripts', JSON.stringify(updated));
    setSelectedScriptId(newScript.id);
  };

  const deleteFromStock = () => {
    if (selectedScriptId === 'new') return;
    if (window.confirm('本当にこの台本をストックから削除しますか？')) {
      const updated = savedScripts.filter(s => s.id !== selectedScriptId);
      setSavedScripts(updated);
      localStorage.setItem('lemon8_saved_scripts', JSON.stringify(updated));
      setSelectedScriptId('new');
      setBaseScript('');
    }
  };

  const handleScriptSelection = (id: string) => {
    setSelectedScriptId(id);
    if (id === 'new') {
      setBaseScript('');
    } else {
      const script = savedScripts.find(s => s.id === id);
      if (script) {
        setBaseScript(script.content);
      }
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Gemini APIキーを入力してください。');
      return;
    }
    if (!baseScript || !topic || !details) {
      setError('ベース台本、今回の題材、詳細情報は必須です。');
      return;
    }

    setError('');
    setIsGenerating(true);
    setNarration('');
    setTelop('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          baseScript,
          topic,
          details,
          hookDirection,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成に失敗しました。');
      }

      setNarration(data.narration);
      setTelop(data.telop);
    } catch (err: any) {
      setError(err.message || '予期せぬエラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, type: 'narration' | 'telop') => {
    navigator.clipboard.writeText(text);
    if (type === 'narration') {
      setCopiedNarration(true);
      setTimeout(() => setCopiedNarration(false), 2000);
    } else {
      setCopiedTelop(true);
      setTimeout(() => setCopiedTelop(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 text-slate-100 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Background Orbs for Glassmorphism */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-2.5 rounded-xl shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-wide text-white">Lemon8 Remake Engine</h1>
              <p className="text-xs text-slate-300 tracking-wider">PREMIERE PRO TELOP GENERATOR</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="relative group flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-300 transition-colors">
                <Key className="h-4 w-4" />
              </div>
              <input
                type="password"
                placeholder="Gemini API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-600 rounded-full text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 w-56 sm:w-72 transition-all placeholder:text-slate-400 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-700/40 backdrop-blur-xl border border-slate-600/50 rounded-3xl p-7 shadow-xl">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                <span className="bg-cyan-500/20 text-cyan-300 w-7 h-7 rounded-lg inline-flex items-center justify-center text-sm font-bold">1</span>
                入力情報
              </h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                      <AlignLeft className="w-4 h-4 text-slate-400" />
                      ベース台本 <span className="text-pink-400">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select
                          value={selectedScriptId}
                          onChange={(e) => handleScriptSelection(e.target.value)}
                          className="appearance-none bg-slate-800/80 border border-slate-600 text-slate-200 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 cursor-pointer w-40 sm:w-48 truncate"
                        >
                          <option value="new">新規入力（手動コピペ）</option>
                          {savedScripts.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                      
                      {selectedScriptId === 'new' ? (
                        <button
                          onClick={saveToStock}
                          title="現在の台本をストックに保存"
                          className="p-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-cyan-300 rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={deleteFromStock}
                          title="この台本を削除"
                          className="p-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-pink-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={baseScript}
                    onChange={(e) => {
                      setBaseScript(e.target.value);
                      if (selectedScriptId !== 'new') setSelectedScriptId('new'); // 編集したら新規扱いにする
                    }}
                    placeholder="流用したい過去の成功台本を貼り付けてください..."
                    className="w-full h-40 p-4 bg-slate-900/40 border border-slate-600/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none text-base text-slate-100 placeholder:text-slate-400 transition-all leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    今回の題材 <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="例：窓のサッシ掃除、スタバの新作カスタム"
                    className="w-full p-4 bg-slate-900/40 border border-slate-600/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-base text-slate-100 placeholder:text-slate-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    詳細情報 <span className="text-pink-400">*</span>
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="レシピ、手順、使うアイテムの正式名称など"
                    className="w-full h-32 p-4 bg-slate-900/40 border border-slate-600/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none text-base text-slate-100 placeholder:text-slate-400 transition-all leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    フックの方向性
                  </label>
                  <input
                    type="text"
                    value={hookDirection}
                    onChange={(e) => setHookDirection(e.target.value)}
                    placeholder="例：面倒くさがりな人向け、衝撃の事実から開始"
                    className="w-full p-4 bg-slate-900/40 border border-slate-600/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-base text-slate-100 placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="mt-10">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="relative w-full group overflow-hidden bg-white/10 border border-white/20 text-white font-bold py-4 px-4 rounded-2xl transition-all hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-cyan-300" />
                      <span>ルール検証・生成ループ実行中...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 text-cyan-300" />
                      <span>台本を生成する</span>
                    </>
                  )}
                </button>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-pink-200 text-sm flex items-start gap-2 bg-pink-500/20 border border-pink-500/30 p-4 rounded-xl"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-700/40 backdrop-blur-xl border border-slate-600/50 rounded-3xl p-7 shadow-xl min-h-[700px] flex flex-col">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                <span className="bg-blue-500/20 text-blue-300 w-7 h-7 rounded-lg inline-flex items-center justify-center text-sm font-bold">2</span>
                出力結果
              </h2>

              {!narration && !isGenerating && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-20 h-20 bg-slate-600/30 rounded-3xl flex items-center justify-center transform rotate-3">
                    <Wand2 className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-base">条件を入力して「台本を生成する」をクリックしてください</p>
                </div>
              )}

              <AnimatePresence mode="wait">
                {isGenerating && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-6"
                  >
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 rounded-full border-[6px] border-slate-600/50"></div>
                      <div className="absolute inset-0 rounded-full border-[6px] border-cyan-400 border-t-transparent animate-spin"></div>
                      <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-cyan-300 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-medium text-white tracking-wide">台本を構築中...</p>
                      <p className="text-sm text-cyan-200 font-mono bg-cyan-500/20 px-4 py-1.5 rounded-full inline-block">
                        ブロック数・文字数制約を検証しています
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {narration && !isGenerating && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex-1 space-y-8"
                >
                  {/* Narration Section */}
                  <div className="bg-slate-800/60 border border-slate-600 rounded-2xl overflow-hidden">
                    <div className="flex justify-between items-center px-5 py-3 border-b border-slate-600 bg-slate-700/50">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                        ナレーション版 <span className="text-slate-300 text-xs font-normal ml-2">自然な口語 / 断定表現</span>
                      </h3>
                      <button
                        onClick={() => copyToClipboard(narration, 'narration')}
                        className="text-xs text-slate-200 hover:text-white flex items-center gap-1.5 bg-slate-600 hover:bg-slate-500 px-3 py-1.5 rounded-lg transition-all"
                      >
                        {copiedNarration ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                        {copiedNarration ? 'コピー完了' : 'コピー'}
                      </button>
                    </div>
                    <div className="p-6 text-[15px] whitespace-pre-wrap leading-loose text-slate-100 font-medium tracking-wide">
                      {narration}
                    </div>
                  </div>

                  {/* Telop Section */}
                  <div className="bg-slate-900/80 border border-slate-700 rounded-2xl overflow-hidden relative shadow-inner">
                    <div className="flex justify-between items-center px-5 py-3 border-b border-slate-700 bg-slate-800/80">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.8)]"></div>
                        テロップ版 <span className="text-slate-300 text-xs font-normal ml-2">Premiere Pro用</span>
                      </h3>
                      <button
                        onClick={() => copyToClipboard(telop, 'telop')}
                        className="text-xs text-slate-200 hover:text-white flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-all"
                      >
                        {copiedTelop ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                        {copiedTelop ? 'コピー完了' : 'コピー'}
                      </button>
                    </div>
                    {/* Decorative side border like Premiere Pro active clip */}
                    <div className="absolute left-0 top-[53px] bottom-0 w-1 bg-pink-400/70"></div>
                    <div className="p-6 text-base whitespace-pre-wrap leading-8 text-slate-100 font-mono tracking-widest pl-8">
                      {telop}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-cyan-200 bg-cyan-500/20 px-4 py-3 rounded-xl border border-cyan-500/30">
                    <Check className="w-4 h-4" />
                    <span>自動検証クリア：ブロック数完全一致 / 1行14文字以内 / 最大2行 / 句読点なし</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
