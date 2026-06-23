import React, { useState, useEffect } from "react";
import { X, Coins, TrendingDown, ArrowRight, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

export default function SellModal({ keys, coinAsset, onClose, onSellSuccess, onAddLog }) {
  const [volume, setVolume] = useState("");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const coin = coinAsset?.currency || "";
  const balance = parseFloat(coinAsset?.balance || 0);
  const market = `KRW-${coin}`;

  // 업비트 Public API로 실시간 현재가 조회
  const fetchCurrentPrice = async () => {
    if (!coin) return;
    setLoadingPrice(true);
    try {
      const res = await fetch(`https://api.upbit.com/v1/ticker?markets=${market}`);
      if (!res.ok) throw new Error("시세를 조회할 수 없습니다.");
      const data = await res.json();
      if (data && data.length > 0) {
        setCurrentPrice(data[0].trade_price);
      }
    } catch (e) {
      console.error(e);
      // 만약 시세 조회가 실패하면 자산에 포함된 avg_buy_price를 차선책으로 사용
      setCurrentPrice(parseFloat(coinAsset?.avg_buy_price || 0));
    } finally {
      setLoadingPrice(false);
    }
  };

  useEffect(() => {
    fetchCurrentPrice();
    setVolume("");
    setSuccess(false);
    setError("");
  }, [coinAsset]);

  const handleMaxVolume = () => {
    setVolume(balance.toString());
  };

  const handleHalfVolume = () => {
    setVolume((balance / 2).toString());
  };

  const handleSell = async () => {
    if (!volume || parseFloat(volume) <= 0 || parseFloat(volume) > balance) {
      setError("올바른 판매 수량을 입력하세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    onAddLog(`[업비트] ${coin} 매도 신청 중 (수량: ${volume}, 현재가: ${currentPrice} KRW)...`);

    try {
      const res = await fetch("/api/upbit/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Upbit-Access-Key": keys.upbitAccess,
          "X-Upbit-Secret-Key": keys.upbitSecret,
        },
        body: JSON.stringify({
          market: market,
          volume: volume,
          ord_type: "market"  // 즉시 체결을 위해 시장가 매도
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "매도 주문에 실패했습니다.");
      }

      setSuccess(true);
      onAddLog(`✨ [완료] 업비트 ${coin} 시장가 매도 성공! (원화 확보 완료)`);
      if (onSellSuccess) {
        onSellSuccess();
      }
    } catch (e) {
      setError(e.message);
      onAddLog(`❌ [에러] 매도 실패: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const expectedKrw = currentPrice * parseFloat(volume || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-850 border border-slate-700 w-full max-w-md rounded-2xl overflow-hidden toss-shadow toss-transition">
        {/* Header */}
        <div className="border-b border-slate-700 px-5 py-4.5 flex items-center justify-between">
          <h3 className="font-bold text-slate-100 flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            업비트 코인 판매 (매도)
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 toss-transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-left">
          {!success ? (
            <>
              {/* Asset Info */}
              <div className="bg-slate-900/50 border border-slate-850 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 block mb-0.5">보유 잔량</div>
                  <div className="font-bold text-slate-100 text-sm">
                    {balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {coin}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-slate-500 block mb-0.5">현재 시가</div>
                  <div className="font-bold text-slate-100 text-sm flex items-center gap-1">
                    {loadingPrice ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
                    ) : (
                      `${currentPrice.toLocaleString()} KRW`
                    )}
                  </div>
                </div>
              </div>

              {/* Volume Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">판매 수량</label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleHalfVolume}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-750 px-2 py-1 rounded-md cursor-pointer"
                    >
                      50%
                    </button>
                    <button
                      onClick={handleMaxVolume}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-750 px-2 py-1 rounded-md cursor-pointer"
                    >
                      최대
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-3.5 pr-12 py-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {coin}
                  </span>
                </div>
              </div>

              {/* Expected Output */}
              <div className="bg-slate-900/50 border border-slate-850 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">최종 예상 원화금액</span>
                  <span className="font-bold text-slate-100">{expectedKrw.toLocaleString()} KRW</span>
                </div>
                <div className="text-[10px] text-slate-500 text-center border-t border-slate-800 pt-2 leading-relaxed">
                  💡 시장가 매도로 체결되어 체결 시점의 호가에 따라 최종 금액은 소폭 변동될 수 있습니다.
                </div>
              </div>

              {error && (
                <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 border border-slate-700 text-slate-300 font-semibold py-3.5 rounded-xl text-sm toss-transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleSell}
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 toss-transition cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      판매 신청 중...
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4.5 h-4.5" />
                      원화로 즉시 판매
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center space-y-4 flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-emerald-950/60 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-900">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <p className="text-md font-bold text-slate-200">판매 완료</p>
                <p className="text-xs text-slate-500 mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                  시장가 매도 주문이 정상적으로 실행되었습니다. 자산 조회를 새로고침하여 KRW 잔고를 확인하세요.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-950 border border-slate-700 text-slate-200 font-semibold py-3.5 rounded-xl text-sm toss-transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
