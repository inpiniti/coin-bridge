import React, { useState, useEffect } from "react";

export default function ApiConfig({ onKeysChange }) {
  const [bybitKey, setBybitKey] = useState("");
  const [bybitSecret, setBybitSecret] = useState("");
  const [upbitAccess, setUpbitAccess] = useState("");
  const [upbitSecret, setUpbitSecret] = useState("");

  const [isBybitConnected, setIsBybitConnected] = useState(false);
  const [isUpbitConnected, setIsUpbitConnected] = useState(false);

  // 로컬 스토리지에서 자동 로드
  useEffect(() => {
    const savedBybitKey = localStorage.getItem("bybit_api_key") || "";
    const savedBybitSecret = localStorage.getItem("bybit_api_secret") || "";
    const savedUpbitAccess = localStorage.getItem("upbit_access_key") || "";
    const savedUpbitSecret = localStorage.getItem("upbit_secret_key") || "";

    setBybitKey(savedBybitKey);
    setBybitSecret(savedBybitSecret);
    setUpbitAccess(savedUpbitAccess);
    setUpbitSecret(savedUpbitSecret);

    const hasBybit = !!(savedBybitKey && savedBybitSecret);
    const hasUpbit = !!(savedUpbitAccess && savedUpbitSecret);

    setIsBybitConnected(hasBybit);
    setIsUpbitConnected(hasUpbit);

    if (hasBybit || hasUpbit) {
      onKeysChange({
        bybitKey: savedBybitKey,
        bybitSecret: savedBybitSecret,
        upbitAccess: savedUpbitAccess,
        upbitSecret: savedUpbitSecret,
      });
    }
  }, []);

  const handleBybitConnect = () => {
    if (isBybitConnected) {
      // 해제
      localStorage.removeItem("bybit_api_key");
      localStorage.removeItem("bybit_api_secret");
      setBybitKey("");
      setBybitSecret("");
      setIsBybitConnected(false);
    } else {
      if (!bybitKey) return;
      // Secret Key 임시 목업 저장(입력 안 한 경우)
      const secret = bybitSecret || "MOCK_SECRET";
      localStorage.setItem("bybit_api_key", bybitKey);
      localStorage.setItem("bybit_api_secret", secret);
      setBybitSecret(secret);
      setIsBybitConnected(true);
    }
  };

  const handleUpbitConnect = () => {
    if (isUpbitConnected) {
      // 해제
      localStorage.removeItem("upbit_access_key");
      localStorage.removeItem("upbit_secret_key");
      setUpbitAccess("");
      setUpbitSecret("");
      setIsUpbitConnected(false);
    } else {
      if (!upbitAccess) return;
      const secret = upbitSecret || "MOCK_SECRET";
      localStorage.setItem("upbit_access_key", upbitAccess);
      localStorage.setItem("upbit_secret_key", secret);
      setUpbitSecret(secret);
      setIsUpbitConnected(true);
    }
  };

  // 상태 변경 시 부모 컴포넌트에 즉각 전달
  useEffect(() => {
    onKeysChange({
      bybitKey: isBybitConnected ? bybitKey : "",
      bybitSecret: isBybitConnected ? bybitSecret : "",
      upbitAccess: isUpbitConnected ? upbitAccess : "",
      upbitSecret: isUpbitConnected ? upbitSecret : "",
    });
  }, [isBybitConnected, isUpbitConnected]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Bybit API Bar */}
      <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-[#EDEFF2] shadow-sm w-full sm:w-auto">
        <div className="w-8 h-8 rounded-full bg-[#F7A600] flex items-center justify-center font-bold text-white text-sm shrink-0">
          B
        </div>
        <span className="text-sm font-bold text-[#191F28] shrink-0">Bybit</span>
        <div className="flex flex-col gap-1 shrink-0">
          <input
            type="text"
            placeholder="API Key"
            value={bybitKey}
            onChange={(e) => setBybitKey(e.target.value)}
            disabled={isBybitConnected}
            className="bg-[#F2F4F6] border-0 rounded-lg px-2.5 py-1 text-xs text-[#191F28] font-bold focus:outline-none focus:ring-1 focus:ring-[#F7A600] w-32"
          />
          {!isBybitConnected && (
            <input
              type="password"
              placeholder="Secret Key"
              value={bybitSecret}
              onChange={(e) => setBybitSecret(e.target.value)}
              className="bg-[#F2F4F6] border-0 rounded-lg px-2.5 py-1 text-xs text-[#191F28] focus:outline-none focus:ring-1 focus:ring-[#F7A600] w-32"
            />
          )}
        </div>
        <button
          onClick={handleBybitConnect}
          className={`toss-btn text-xs px-3.5 py-1.5 rounded-xl border ${
            isBybitConnected
              ? "border-[#E8F8F5] text-[#2D9D78] bg-[#F4FBF9] font-bold"
              : "border-[#EDEFF2] text-[#4E5968] hover:bg-slate-50"
          }`}
        >
          {isBybitConnected ? "연결됨" : "연결"}
        </button>
      </div>

      {/* Upbit API Bar */}
      <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-[#EDEFF2] shadow-sm w-full sm:w-auto">
        <div className="w-8 h-8 rounded-full bg-[#1763F6] flex items-center justify-center font-bold text-white text-sm shrink-0">
          U
        </div>
        <span className="text-sm font-bold text-[#191F28] shrink-0">Upbit</span>
        <div className="flex flex-col gap-1 shrink-0">
          <input
            type="text"
            placeholder="Access Key"
            value={upbitAccess}
            onChange={(e) => setUpbitAccess(e.target.value)}
            disabled={isUpbitConnected}
            className="bg-[#F2F4F6] border-0 rounded-lg px-2.5 py-1 text-xs text-[#191F28] font-bold focus:outline-none focus:ring-1 focus:ring-[#1763F6] w-32"
          />
          {!isUpbitConnected && (
            <input
              type="password"
              placeholder="Secret Key"
              value={upbitSecret}
              onChange={(e) => setUpbitSecret(e.target.value)}
              className="bg-[#F2F4F6] border-0 rounded-lg px-2.5 py-1 text-xs text-[#191F28] focus:outline-none focus:ring-1 focus:ring-[#1763F6] w-32"
            />
          )}
        </div>
        <button
          onClick={handleUpbitConnect}
          className={`toss-btn text-xs px-3.5 py-1.5 rounded-xl border ${
            isUpbitConnected
              ? "border-[#E8F8F5] text-[#2D9D78] bg-[#F4FBF9] font-bold"
              : "border-[#EDEFF2] text-[#4E5968] hover:bg-slate-50"
          }`}
        >
          {isUpbitConnected ? "연결됨" : "연결"}
        </button>
      </div>
    </div>
  );
}
