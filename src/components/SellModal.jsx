import React, { useState, useEffect } from "react";
import { X, Coins, TrendingDown, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

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

  const fetchCurrentPrice = async () => {
    if (!coin) return;
    setLoadingPrice(true);
    try {
      const res = await fetch(`https://api.upbit.com/v1/ticker?markets=${market}`);
      if (!res.ok) throw new Error("시세 조회 실패");
      const data = await res.json();
      if (data && data.length > 0) {
        setCurrentPrice(data[0].trade_price);
      }
    } catch (e) {
      console.error(e);
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
    onAddLog(`[업비트] ${coin} 매도 신청 중 (수량: ${volume}, 현재가: ${currentPrice}원)...`);

    try {
      if (keys?.upbitAccess && keys?.upbitSecret) {
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
            ord_type: "market"
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "매도 주문에 실패했습니다.");
        }
      } else {
        // Mocking
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setSuccess(true);
      onAddLog(`✨ [완료] 업비트 ${coin} 시장가 매도 성공! (원화 환전 완료)`);
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
      <div className="bg-white border border-[#EDEFF2] w-full max-w-md rounded-[32px] overflow-hidden toss-shadow toss-transition">
        {/* Header */}
        <div className="border-b border-[#EDEFF2] px-6 py-5 flex items-center justify-between text-left">
          <h3 className="font-extrabold text-[#191F28] text-base flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#1763F6]" />
            업비트 코인 판매 (매도)
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-650 p-1.5 rounded-lg hover:bg-slate-50 toss-transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-left">
          {!success ? (
            <>
              {/* Asset Info Card */}
              <div className="bg-slate-50 border border-[#EDEFF2] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#8B95A1] block mb-0.5">보유 잔량</span>
                  <span className="font-extrabold text-[#191F28] text-sm">
                    {balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {coin}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-[#8B95A1] block mb-0.5">현재 시가</span>
                  <span className="font-extrabold text-[#191F28] text-sm flex items-center justify-end gap-1">
                    {loadingPrice ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#8B95A1]" />
                    ) : (
                      `${currentPrice.toLocaleString()}원`
                    )}
                  </span>
                </div>
              </div>

              {/* Volume Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#8B95A1]">판매 수량</label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleHalfVolume}
                      className="text-[10px] font-bold text-[#4E5968] hover:text-[#191F28] bg-slate-100 border border-[#EDEFF2] px-2.5 py-1 rounded-md cursor-pointer"
                    >
                      50%
                    </button>
                    <button
                      onClick={handleMaxVolume}
                      className="text-[10px] font-bold text-[#4E5968] hover:text-[#191F28] bg-slate-100 border border-[#EDEFF2] px-2.5 py-1 rounded-md cursor-pointer"
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
                    className="w-full bg-[#F2F4F6] border-0 rounded-xl pl-4 pr-12 py-3.5 text-sm text-[#191F28] font-extrabold focus:outline-none focus:ring-1 focus:ring-[#1763F6]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[#8B95A1]">
                    {coin}
                  </span>
                </div>
              </div>

              {/* Expected Value */}
              <div className="bg-slate-50 border border-[#EDEFF2] rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-[#4E5968]">
                  <span>최종 예상 원화금액</span>
                  <span className="text-[#1763F6] font-extrabold text-sm">{expectedKrw.toLocaleString()}원</span>
                </div>
                <div className="text-[10px] text-[#8B95A1] text-center border-t border-[#EDEFF2] pt-2 leading-relaxed font-semibold">
                  💡 시장가로 판매하여 호가 변동에 따라 실 체결액이 미세하게 다를 수 있습니다.
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-500 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#4E5968] font-extrabold py-3.5 rounded-2xl text-sm toss-transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleSell}
                  disabled={submitting}
                  className="flex-1 bg-[#1763F6] hover:bg-[#0F50D1] text-white font-extrabold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 toss-transition cursor-pointer"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <TrendingDown className="w-4.5 h-4.5" />
                      판매하기
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center space-y-4 flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-emerald-50 text-[#2D9D78] rounded-full flex items-center justify-center border border-[#E8F8F5]">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <p className="text-md font-bold text-[#191F28]">매도 주문 처리 완료</p>
                <p className="text-xs text-[#8B95A1] mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                  시장가 매도가 완결되어 잔고에 원화(KRW)로 정산되었습니다.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-black text-white font-extrabold py-3.5 rounded-2xl text-sm toss-transition cursor-pointer"
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
