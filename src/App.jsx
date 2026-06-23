import React, { useState, useEffect } from "react";
import ApiConfig from "./components/ApiConfig";
import AssetList from "./components/AssetList";
import TransferBridge from "./components/TransferBridge";
import SellModal from "./components/SellModal";
import KbankWithdraw from "./components/KbankWithdraw";
import { ArrowRightLeft } from "lucide-react";
import "./App.css";

function App() {
  const [keys, setKeys] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCoinForTransfer, setSelectedCoinForTransfer] = useState(null);
  const [selectedCoinForSell, setSelectedCoinForSell] = useState(null);
  
  const [upbitKrwBalance, setUpbitKrwBalance] = useState(1250000);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()} - ${message}`, ...prev]);
  };

  const handleKeysChange = (newKeys) => {
    setKeys(newKeys);
    if (newKeys?.bybitKey || newKeys?.upbitAccess) {
      addLog("거래소 API 인증 성공. 자산 동기화 개시.");
    }
  };

  const handleUpdateUpbitKrw = async () => {
    if (!keys?.upbitAccess || !keys?.upbitSecret) return;
    try {
      const res = await fetch("/api/upbit/balance", {
        headers: {
          "X-Upbit-Access-Key": keys.upbitAccess,
          "X-Upbit-Secret-Key": keys.upbitSecret,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const krwAsset = data.find((asset) => asset.currency === "KRW");
        if (krwAsset) {
          setUpbitKrwBalance(parseFloat(krwAsset.balance));
        }
      }
    } catch (e) {
      console.error("원화 잔고 갱신 실패", e);
    }
  };

  useEffect(() => {
    if (keys?.upbitAccess && keys?.upbitSecret) {
      handleUpdateUpbitKrw();
    }
  }, [keys, refreshTrigger]);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    setSelectedCoinForTransfer(null);
  };

  return (
    <div className="min-h-screen bg-[#F2F4F6] text-[#191F28] flex flex-col p-6 lg:p-12 items-center justify-start toss-transition">
      
      {/* Top Header Section (Logo + API configuration) */}
      <header className="max-w-[1280px] w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10">
        
        {/* Left Side: Logo */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1763F6] flex items-center justify-center shadow-md">
            <ArrowRightLeft className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-black text-[#191F28] tracking-tight">환전 도우미</h1>
            <p className="text-xs text-[#8B95A1] font-bold mt-0.5">바이비트 → 업비트 → 케이뱅크</p>
          </div>
        </div>

        {/* Right Side: Horizontal API Config */}
        <ApiConfig onKeysChange={handleKeysChange} />

      </header>

      {/* Main Container - Horizontal Layout (3 columns + arrows) */}
      <main className="max-w-[1280px] w-full flex flex-col lg:flex-row items-stretch justify-between gap-6">
        
        {/* Step 1 & 2 Cards (Bybit & Upbit assets side by side) */}
        <div className="flex-1 lg:flex-[2] flex flex-col lg:flex-row items-stretch gap-6">
          <AssetList
            keys={keys}
            refreshTrigger={refreshTrigger}
            onSelectCoinForTransfer={setSelectedCoinForTransfer}
            onSelectCoinForSell={setSelectedCoinForSell}
          />
        </div>

        {/* 구분 화살표 2 (Upbit -> Kbank) */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white border border-[#EDEFF2] flex items-center justify-center text-[#8B95A1] font-bold text-lg shadow-sm">
            →
          </div>
        </div>

        {/* Step 3 Card (Kbank withdrawal) */}
        <div className="flex-1 lg:flex-[1]">
          <KbankWithdraw
            keys={keys}
            upbitKrwBalance={upbitKrwBalance}
            onWithdrawSuccess={triggerRefresh}
            onAddLog={addLog}
          />
        </div>

      </main>

      {/* Floating Transfer Modal */}
      {selectedCoinForTransfer && (
        <TransferBridge
          keys={keys}
          selectedCoin={selectedCoinForTransfer}
          onClose={() => setSelectedCoinForTransfer(null)}
          onTransferSuccess={triggerRefresh}
          onAddLog={addLog}
        />
      )}

      {/* Floating Sell Modal */}
      {selectedCoinForSell && (
        <SellModal
          keys={keys}
          coinAsset={selectedCoinForSell}
          onClose={() => setSelectedCoinForSell(null)}
          onSellSuccess={triggerRefresh}
          onAddLog={addLog}
        />
      )}

      {/* Footer log monitor (Collapsed under button / transparent for aesthetics) */}
      {logs.length > 0 && (
        <footer className="max-w-[1280px] w-full mt-10 border-t border-[#EDEFF2] pt-4 text-left">
          <span className="text-[10px] font-bold text-[#8B95A1] uppercase tracking-wider block mb-2">실시간 상태 로그</span>
          <div className="font-mono text-[10px] text-[#8B95A1] max-h-16 overflow-y-auto space-y-1">
            {logs.slice(0, 3).map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </footer>
      )}

    </div>
  );
}

export default App;
