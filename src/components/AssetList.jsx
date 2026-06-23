import React, { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function AssetList({ keys, refreshTrigger, onSelectCoinForSell, onSelectCoinForTransfer }) {
  const [bybitAssets, setBybitAssets] = useState([]);
  const [upbitAssets, setUpbitAssets] = useState([]);
  
  const [bybitLoading, setBybitLoading] = useState(false);
  const [upbitLoading, setUpbitLoading] = useState(false);
  
  const [bybitError, setBybitError] = useState("");
  const [upbitError, setUpbitError] = useState("");

  // 한글 코인명 맵핑
  const coinNames = {
    USDT: "USDT 테더",
    BTC: "BTC 비트코인",
    ETH: "ETH 이더리움",
    XRP: "XRP 리플",
    TRX: "TRX 트론",
    EOS: "EOS 이오스"
  };

  const fetchBybitAssets = async () => {
    if (!keys?.bybitKey || !keys?.bybitSecret) return;
    setBybitLoading(true);
    setBybitError("");
    try {
      const res = await fetch("/api/bybit/balance", {
        headers: {
          "X-Bybit-Api-Key": keys.bybitKey,
          "X-Bybit-Api-Secret": keys.bybitSecret,
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "바이비트 자산 조회 실패");
      }
      const data = await res.json();
      setBybitAssets(data);
    } catch (e) {
      setBybitError(e.message);
    } finally {
      setBybitLoading(false);
    }
  };

  const fetchUpbitAssets = async () => {
    if (!keys?.upbitAccess || !keys?.upbitSecret) return;
    setUpbitLoading(true);
    setUpbitError("");
    try {
      const res = await fetch("/api/upbit/balance", {
        headers: {
          "X-Upbit-Access-Key": keys.upbitAccess,
          "X-Upbit-Secret-Key": keys.upbitSecret,
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "업비트 자산 조회 실패");
      }
      const data = await res.json();
      setUpbitAssets(data);
    } catch (e) {
      setUpbitError(e.message);
    } finally {
      setUpbitLoading(false);
    }
  };

  const handleRefreshAll = () => {
    fetchBybitAssets();
    fetchUpbitAssets();
  };

  useEffect(() => {
    if (keys?.bybitKey || keys?.upbitAccess) {
      handleRefreshAll();
    } else {
      setBybitAssets([]);
      setUpbitAssets([]);
    }
  }, [keys, refreshTrigger]);

  // 바이비트 총 보유 자산 계산 (USD 합산)
  const totalBybitUsd = bybitAssets.reduce((sum, item) => sum + (item.usdValue || 0), 0);

  // 업비트 KRW 잔고
  const upbitKrwAsset = upbitAssets.find((a) => a.currency === "KRW");
  const totalUpbitKrw = upbitKrwAsset ? parseFloat(upbitKrwAsset.balance) : 0;

  // Bybit 지갑 미연결 시 표시할 목업 데이터
  const mockBybitAssets = [
    { coin: "USDT", totalBalance: 5200, usdValue: 5200.00, fundingBalance: 5200, unifiedBalance: 0 },
    { coin: "BTC", totalBalance: 0.085, usdValue: 8372.50, fundingBalance: 0.085, unifiedBalance: 0 },
    { coin: "ETH", totalBalance: 1.2, usdValue: 4260.00, fundingBalance: 1.2, unifiedBalance: 0 },
    { coin: "XRP", totalBalance: 3500, usdValue: 8120.00, fundingBalance: 3500, unifiedBalance: 0 }
  ];

  // Upbit 지갑 미연결 시 표시할 목업 데이터
  const mockUpbitAssets = [
    { currency: "USDT", balance: "1000", avg_buy_price: "1382", locked: "0" },
    { currency: "XRP", balance: "2000", avg_buy_price: "3205", locked: "0" }
  ];

  const currentBybitAssets = (keys?.bybitKey && keys?.bybitSecret) ? bybitAssets : mockBybitAssets;
  const currentUpbitAssets = (keys?.upbitAccess && keys?.upbitSecret) ? upbitAssets : [];
  const displayUpbitAssets = currentUpbitAssets.filter((a) => a.currency !== "KRW");
  const finalUpbitAssets = displayUpbitAssets.length > 0 ? displayUpbitAssets : mockUpbitAssets;
  
  const displayBybitUsd = (keys?.bybitKey && keys?.bybitSecret) ? totalBybitUsd : 25952.50;
  const displayUpbitKrw = (keys?.upbitAccess && keys?.upbitSecret) ? totalUpbitKrw : 1250000;

  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-6 w-full">
      {/* 바이비트 지갑 카드 */}
      <div className="flex-1 bg-white border border-[#EDEFF2] rounded-[32px] p-8 shadow-sm flex flex-col justify-between text-left relative min-h-[500px]">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F7A600] flex items-center justify-center font-bold text-white text-sm shrink-0">
                B
              </div>
              <h3 className="text-lg font-extrabold text-[#191F28]">바이비트 지갑</h3>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-[#2D9D78] font-bold bg-[#F4FBF9] border border-[#E8F8F5] px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D9D78]"></span>
              연결됨
            </span>
          </div>

          {/* Sub title / Balance */}
          <div className="mb-4">
            <span className="text-xs text-[#8B95A1] font-semibold">총 보유자산</span>
            <div className="text-[32px] font-extrabold text-[#191F28] mt-1">
              ${displayBybitUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Banner */}
          <div className="bg-[#FFF8E6] rounded-2xl px-4 py-3.5 text-xs text-[#B07C00] font-bold mb-5 flex items-center gap-1.5">
            💡 코인을 업비트로 드래그 하거나 전송 버튼을 누르세요
          </div>

          {/* Coin List */}
          <div className="space-y-3">
            {currentBybitAssets.map((asset) => (
              <div
                key={asset.coin}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("coin", asset.coin);
                  e.dataTransfer.setData("balance", asset.totalBalance);
                }}
                className="bg-white border border-[#EDEFF2] rounded-2xl p-4 flex items-center justify-between hover:bg-[#F9FAFB] toss-transition cursor-grab active:cursor-grabbing select-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${
                    asset.coin === "USDT" ? "bg-[#26A17B]" :
                    asset.coin === "BTC" ? "bg-[#F7931A]" :
                    asset.coin === "ETH" ? "bg-[#627EEA]" : "bg-[#23292F]"
                  }`}>
                    {asset.coin.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-extrabold text-[#191F28] text-sm">{coinNames[asset.coin] || asset.coin}</div>
                    <div className="text-[11px] text-[#8B95A1] font-semibold mt-0.5">
                      {asset.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} ≈ ${asset.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => onSelectCoinForTransfer(asset)}
                  className="bg-[#FFF8E6] hover:bg-[#FFF3D1] text-[#F7A600] text-xs font-extrabold px-4 py-2.5 rounded-xl toss-transition cursor-pointer"
                >
                  전송
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sync loading */}
        {bybitLoading && (
          <div className="absolute inset-0 bg-white/70 rounded-[32px] flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-[#F7A600]" />
          </div>
        )}
      </div>

      {/* 구분 화살표 */}
      <div className="hidden lg:flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white border border-[#EDEFF2] flex items-center justify-center text-[#8B95A1] font-bold text-lg shadow-sm">
          →
        </div>
      </div>

      {/* 업비트 지갑 카드 */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const coin = e.dataTransfer.getData("coin");
          const balance = e.dataTransfer.getData("balance");
          if (coin && balance) {
            onSelectCoinForTransfer({ coin, totalBalance: parseFloat(balance) });
          }
        }}
        className="flex-1 bg-white border border-[#EDEFF2] rounded-[32px] p-8 shadow-sm flex flex-col justify-between text-left relative min-h-[500px]"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1763F6] flex items-center justify-center font-bold text-white text-sm shrink-0">
                U
              </div>
              <h3 className="text-lg font-extrabold text-[#191F28]">업비트 지갑</h3>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-[#2D9D78] font-bold bg-[#F4FBF9] border border-[#E8F8F5] px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D9D78]"></span>
              연결됨
            </span>
          </div>

          {/* Sub title / Balance */}
          <div className="mb-4">
            <span className="text-xs text-[#8B95A1] font-semibold">원화(KRW) 잔고</span>
            <div className="text-[32px] font-extrabold text-[#1763F6] mt-1">
              {displayUpbitKrw.toLocaleString()}원
            </div>
          </div>

          {/* Banner */}
          <div className="bg-[#EBF2FF] rounded-2xl px-4 py-3.5 text-xs text-[#1763F6] font-bold mb-5 flex items-center gap-1.5">
            💡 코인을 눌러 판매 하고 원화로 바꾸세요
          </div>

          {/* Coin List */}
          <div className="space-y-3">
            {finalUpbitAssets.map((asset) => {
              const balanceVal = parseFloat(asset.balance);
              const lockedVal = parseFloat(asset.locked);
              const totalVal = balanceVal + lockedVal;
              const avgBuy = parseFloat(asset.avg_buy_price || 0);
              const krwValue = totalVal * avgBuy;

              return (
                <div
                  key={asset.currency}
                  className="bg-white border border-[#EDEFF2] rounded-2xl p-4 flex items-center justify-between hover:bg-[#F9FAFB] toss-transition select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${
                      asset.currency === "USDT" ? "bg-[#26A17B]" : "bg-[#23292F]"
                    }`}>
                      {asset.currency.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-extrabold text-[#191F28] text-sm">{coinNames[asset.currency] || `${asset.currency} 리플`}</div>
                      <div className="text-[11px] text-[#8B95A1] font-semibold mt-0.5">
                        {totalVal.toLocaleString(undefined, { maximumFractionDigits: 4 })} ≈ {krwValue.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onSelectCoinForSell(asset)}
                    className="bg-[#1763F6] hover:bg-[#0F50D1] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl toss-transition cursor-pointer"
                  >
                    판매
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sync loading */}
        {upbitLoading && (
          <div className="absolute inset-0 bg-white/70 rounded-[32px] flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-[#1763F6]" />
          </div>
        )}
      </div>
    </div>
  );
}
