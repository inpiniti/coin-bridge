import React, { useState, useEffect } from "react";
import { Key, Eye, EyeOff, Save, Trash2, CheckCircle2 } from "lucide-react";

export default function ApiConfig({ onKeysChange }) {
  const [bybitKey, setBybitKey] = useState("");
  const [bybitSecret, setBybitSecret] = useState("");
  const [upbitAccess, setUpbitAccess] = useState("");
  const [upbitSecret, setUpbitSecret] = useState("");

  const [showBybitSecret, setShowBybitSecret] = useState(false);
  const [showUpbitSecret, setShowUpbitSecret] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // 로컬 스토리지에서 기존 키 로드
  useEffect(() => {
    const savedBybitKey = localStorage.getItem("bybit_api_key") || "";
    const savedBybitSecret = localStorage.getItem("bybit_api_secret") || "";
    const savedUpbitAccess = localStorage.getItem("upbit_access_key") || "";
    const savedUpbitSecret = localStorage.getItem("upbit_secret_key") || "";

    setBybitKey(savedBybitKey);
    setBybitSecret(savedBybitSecret);
    setUpbitAccess(savedUpbitAccess);
    setUpbitSecret(savedUpbitSecret);

    if (savedBybitKey && savedBybitSecret && savedUpbitAccess && savedUpbitSecret) {
      setIsSaved(true);
      onKeysChange({
        bybitKey: savedBybitKey,
        bybitSecret: savedBybitSecret,
        upbitAccess: savedUpbitAccess,
        upbitSecret: savedUpbitSecret,
      });
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("bybit_api_key", bybitKey);
    localStorage.setItem("bybit_api_secret", bybitSecret);
    localStorage.setItem("upbit_access_key", upbitAccess);
    localStorage.setItem("upbit_secret_key", upbitSecret);
    setIsSaved(true);
    
    onKeysChange({
      bybitKey,
      bybitSecret,
      upbitAccess,
      upbitSecret,
    });
  };

  const handleClear = () => {
    localStorage.removeItem("bybit_api_key");
    localStorage.removeItem("bybit_api_secret");
    localStorage.removeItem("upbit_access_key");
    localStorage.removeItem("upbit_secret_key");
    
    setBybitKey("");
    setBybitSecret("");
    setUpbitAccess("");
    setUpbitSecret("");
    setIsSaved(false);

    onKeysChange(null);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 toss-shadow toss-transition">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-400" />
          거래소 API 설정
        </h2>
        {isSaved && (
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-900">
            <CheckCircle2 className="w-3.5 h-3.5" />
            인증 활성화됨
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4 text-left">
        {/* Bybit API Config */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Bybit API 인증 정보
          </label>
          <input
            type="text"
            placeholder="Bybit API Key"
            value={bybitKey}
            onChange={(e) => {
              setBybitKey(e.target.value);
              setIsSaved(false);
            }}
            disabled={isSaved}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <div className="relative">
            <input
              type={showBybitSecret ? "text" : "password"}
              placeholder="Bybit Secret Key"
              value={bybitSecret}
              onChange={(e) => {
                setBybitSecret(e.target.value);
                setIsSaved(false);
              }}
              disabled={isSaved}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-4 pr-11 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowBybitSecret(!showBybitSecret)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showBybitSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <hr className="border-slate-700 my-4" />

        {/* Upbit API Config */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Upbit API 인증 정보
          </label>
          <input
            type="text"
            placeholder="Upbit Access Key"
            value={upbitAccess}
            onChange={(e) => {
              setUpbitAccess(e.target.value);
              setIsSaved(false);
            }}
            disabled={isSaved}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <div className="relative">
            <input
              type={showUpbitSecret ? "text" : "password"}
              placeholder="Upbit Secret Key"
              value={upbitSecret}
              onChange={(e) => {
                setUpbitSecret(e.target.value);
                setIsSaved(false);
              }}
              disabled={isSaved}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-4 pr-11 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowUpbitSecret(!showUpbitSecret)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showUpbitSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-3">
          {isSaved ? (
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 bg-red-950/40 text-red-400 border border-red-900/60 hover:bg-red-900/40 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 toss-transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              설정 초기화
            </button>
          ) : (
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 toss-transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              API 키 저장 및 연결
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
