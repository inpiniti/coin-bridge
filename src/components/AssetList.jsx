import React, { useState, useEffect } from "react";
import { Coins, RefreshCw, AlertTriangle, ArrowRightLeft } from "lucide-react";

export default function AssetList({ keys, refreshTrigger, onSelectCoinForSell, onSelectCoinForTransfer }) {
  const [bybitAssets, setBybitAssets] = useState([]);
  const [upbitAssets, setUpbitAssets] = useState([]);
  
  const [bybitLoading, setBybitLoading] = useState(false);
  const [upbitLoading, setUpbitLoading] = useState(false);
  
  const [bybitError, setBybitError] = useState("");
  const [upbitError, setUpbitError] = useState("");

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
        throw new Error(errData.detail || "바이비트 자산 정보를 가져오지 못했습니다.");
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
        throw new Error(errData.detail || "업비트 자산 정보를 가져오지 못했습니다.");
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
    if (keys) {
      handleRefreshAll();
    } else {
      setBybitAssets([]);
      setUpbitAssets([]);
    }
  }, [keys, refreshTrigger]);

  if (!keys) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-2xl p-8 text-center text-slate-500">
        <Coins className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">거래소 API 인증 설정을 완료하면</p>
        <p className="text-xs mt-1">실시간 자산 잔고가 이곳에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Bybit Asset List */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col toss-shadow text-left">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            Bybit 자산 현황
          </h3>
          <button
            onClick={fetchBybitAssets}
            disabled={bybitLoading}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${bybitLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {bybitLoading ? (
          <div className="flex-1 flex items-center justify-center py-10 text-sm text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            자산 불러오는 중...
          </div>
        ) : bybitError ? (
          <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex items-start gap-2.5 text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{bybitError}</span>
          </div>
        ) : bybitAssets.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-10 text-xs text-slate-500">
            보유 중인 자산이 없습니다.
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto max-h-[300px]">
            {bybitAssets.map((asset) => (
              <div
                key={asset.coin}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("coin", asset.coin);
                  e.dataTransfer.setData("balance", asset.totalBalance);
                }}
                className="bg-slate-900/40 hover:bg-slate-900/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between group toss-transition cursor-grab active:cursor-grabbing select-none"
              >
                <div>
                  <div className="font-bold text-slate-200 text-sm">{asset.coin}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Funding: {asset.fundingBalance.toFixed(4)} / Unified: {asset.unifiedBalance.toFixed(4)}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="font-bold text-slate-100 text-sm">
                      {asset.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </div>
                    {asset.usdValue > 0 && (
                      <div className="text-xs text-slate-500">${asset.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    )}
                  </div>
                  {/* 드래그 유도 및 퀵 트랜스퍼 버튼 */}
                  <button
                    onClick={() => onSelectCoinForTransfer(asset)}
                    className="opacity-0 group-hover:opacity-100 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white p-1.5 rounded-lg toss-transition cursor-pointer"
                    title="업비트로 전송"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-slate-500 text-center mt-2">
              💡 코인을 드래그하여 중앙 브릿지 영역에 드롭하면 송금이 시작됩니다.
            </p>
          </div>
        )}
      </div>

      {/* Upbit Asset List */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col toss-shadow text-left">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            Upbit 자산 현황
          </h3>
          <button
            onClick={fetchUpbitAssets}
            disabled={upbitLoading}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${upbitLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {upbitLoading ? (
          <div className="flex-1 flex items-center justify-center py-10 text-sm text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            자산 불러오는 중...
          </div>
        ) : upbitError ? (
          <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex items-start gap-2.5 text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{upbitError}</span>
          </div>
        ) : upbitAssets.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-10 text-xs text-slate-500">
            보유 중인 자산이 없습니다.
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto max-h-[300px]">
            {upbitAssets.map((asset) => {
              const balance = parseFloat(asset.balance);
              const locked = parseFloat(asset.locked);
              const total = balance + locked;
              const isKrw = asset.currency === "KRW";
              
              if (total === 0) return null;

              return (
                <div
                  key={asset.currency}
                  className="bg-slate-900/40 hover:bg-slate-900/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between group toss-transition select-none"
                >
                  <div>
                    <div className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                      {asset.currency}
                      {isKrw && <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-900 px-1.5 py-0.5 rounded-md font-semibold">원화</span>}
                    </div>
                    {asset.avg_buy_price > 0 && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        평단가: {parseFloat(asset.avg_buy_price).toLocaleString()} KRW
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="font-bold text-slate-100 text-sm">
                        {total.toLocaleString(undefined, { maximumFractionDigits: 6 })} {isKrw ? "원" : ""}
                      </div>
                      {!isKrw && (
                        <div className="text-xs text-slate-500">
                          {(total * parseFloat(asset.avg_buy_price || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} KRW
                        </div>
                      )}
                    </div>
                    
                    {/* 매도 유도 버튼 */}
                    {!isKrw && (
                      <button
                        onClick={() => onSelectCoinForSell(asset)}
                        className="opacity-0 group-hover:opacity-100 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold toss-transition cursor-pointer"
                      >
                        판매(매도)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
