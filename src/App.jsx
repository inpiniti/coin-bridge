import React, { useState, useEffect } from "react";
import ApiConfig from "./components/ApiConfig";
import AssetList from "./components/AssetList";
import TransferBridge from "./components/TransferBridge";
import SellModal from "./components/SellModal";
import KbankWithdraw from "./components/KbankWithdraw";
import { Landmark, ArrowRightLeft, ScrollText, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import "./App.css";

function App() {
  const [keys, setKeys] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCoinForTransfer, setSelectedCoinForTransfer] = useState(null);
  const [selectedCoinForSell, setSelectedCoinForSell] = useState(null);
  
  const [upbitKrwBalance, setUpbitKrwBalance] = useState(0);
  const [logs, setLogs] = useState([
    `${new Date().toLocaleTimeString()} - 시스템 대기 중 (API 설정 필요)`
  ]);

  const addLog = (message) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()} - ${message}`, ...prev.slice(0, 49)]);
  };

  const handleKeysChange = (newKeys) => {
    setKeys(newKeys);
    if (newKeys) {
      addLog("거래소 API 인증키 연동 성공. 자산 동기화를 개시합니다.");
    } else {
      addLog("거래소 API 인증키 연결이 해제되었습니다.");
      setUpbitKrwBalance(0);
    }
  };

  // 업비트 원화 잔고 갱신을 위한 훅
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
      console.error("원화 잔고 조회 실패: ", e);
    }
  };

  useEffect(() => {
    if (keys) {
      handleUpdateUpbitKrw();
    }
  }, [keys, refreshTrigger]);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    setSelectedCoinForTransfer(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col toss-transition">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center toss-shadow">
            <ArrowRightLeft className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 m-0 tracking-tight flex items-center gap-1.5">
              환전도우미 <span className="text-[10px] bg-blue-600/20 text-blue-400 border border-blue-900 px-2 py-0.5 rounded-full font-bold">Standalone Web</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Bybit → Upbit → Kbank Auto-Exchange System</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl font-medium text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            보안 중계 활성화 (무상태 프록시)
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Aside: API Configurations & KRW Withdrawal */}
        <aside className="lg:col-span-1 space-y-6 flex flex-col">
          <ApiConfig onKeysChange={handleKeysChange} />
          <KbankWithdraw
            keys={keys}
            upbitKrwBalance={upbitKrwBalance}
            onWithdrawSuccess={triggerRefresh}
            onAddLog={addLog}
          />
        </aside>

        {/* Central Dashboard: Bridge Transfer & Balance Monitor */}
        <section className="lg:col-span-2 space-y-6">
          <TransferBridge
            keys={keys}
            selectedCoin={selectedCoinForTransfer}
            onClearSelected={() => setSelectedCoinForTransfer(null)}
            onTransferSuccess={triggerRefresh}
            onAddLog={addLog}
          />
          <AssetList
            keys={keys}
            refreshTrigger={refreshTrigger}
            onSelectCoinForTransfer={setSelectedCoinForTransfer}
            onSelectCoinForSell={setSelectedCoinForSell}
          />
        </section>

        {/* Right Aside: Action Logger & Progress Guidelines */}
        <aside className="lg:col-span-1 flex flex-col space-y-6">
          {/* Action Logger */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col h-[340px] toss-shadow">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3.5 pb-2 border-b border-slate-700/60">
              <ScrollText className="w-4.5 h-4.5 text-blue-400" />
              실시간 작업 로그
            </h3>
            <div className="flex-1 overflow-y-auto font-mono text-[11px] text-slate-400 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700 text-left">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`leading-relaxed pb-1 border-b border-slate-800/40 last:border-b-0 ${
                    log.includes("✨")
                      ? "text-emerald-400 font-semibold"
                      : log.includes("❌")
                      ? "text-red-400 font-semibold"
                      : log.includes("[업비트] 입금 주소 획득")
                      ? "text-indigo-300"
                      : ""
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Quick User Guide */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5 text-left toss-shadow space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              환전 단계 가이드
            </h4>
            <ul className="space-y-3 text-xs text-slate-400 leading-relaxed font-medium">
              <li className="flex gap-2">
                <span className="text-blue-500 font-bold">1.</span>
                <span>Bybit API와 Upbit API 키를 왼쪽 상단 폼에 입력해 주세요.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 font-bold">2.</span>
                <span>자산 현황에서 Bybit 보유 코인(예: XRP 등)을 중앙 브릿지 영역으로 드래그하거나 퀵 전송 아이콘을 누릅니다.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 font-bold">3.</span>
                <span>송금이 완료되면 업비트 자산 현황에 입금된 코인이 나타납니다. '판매(매도)' 버튼을 눌러 원화로 환전하세요.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 font-bold">4.</span>
                <span>환전 완료 후, 왼쪽 하단 '원화 출금' 폼을 사용해 케이뱅크 계좌로 즉시 출금 신청을 실행합니다.</span>
              </li>
            </ul>
          </div>
        </aside>
      </main>

      {/* Sell Modal Popup */}
      {selectedCoinForSell && (
        <SellModal
          keys={keys}
          coinAsset={selectedCoinForSell}
          onClose={() => setSelectedCoinForSell(null)}
          onSellSuccess={triggerRefresh}
          onAddLog={addLog}
        />
      )}
    </div>
  );
}

export default App;
