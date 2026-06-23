import React, { useState, useEffect } from "react";
import { X, ArrowRight, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

export default function TransferBridge({ keys, selectedCoin, onClose, onTransferSuccess, onAddLog }) {
  const [coin, setCoin] = useState("");
  const [amount, setAmount] = useState("");
  const [chain, setChain] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: input, 1: fetching address, 2: withdrawing, 3: success
  const [error, setError] = useState("");

  const [depositAddress, setDepositAddress] = useState("");
  const [depositTag, setDepositTag] = useState("");

  useEffect(() => {
    if (selectedCoin) {
      setCoin(selectedCoin.coin);
      setAmount(selectedCoin.totalBalance.toString());
      
      const coinUpper = selectedCoin.coin.toUpperCase();
      if (coinUpper === "XRP") setChain("XRP");
      else if (coinUpper === "TRX") setChain("TRX");
      else if (coinUpper === "EOS") setChain("EOS");
      else if (coinUpper === "USDT") setChain("TRC20");
      else setChain(coinUpper);
      
      setError("");
      setStep(0);
    }
  }, [selectedCoin]);

  const handleTransfer = async () => {
    if (!coin || !amount || parseFloat(amount) <= 0) {
      setError("올바른 코인과 수량을 지정하세요.");
      return;
    }

    setLoading(true);
    setError("");
    setStep(1); // 1단계: 업비트 입금주소 획득
    onAddLog(`[업비트] ${coin} 입금 주소 및 데스티네이션 태그 조회 중...`);

    try {
      let address = "MOCK_UPBIT_DEPOSIT_ADDRESS";
      let tag = "";

      if (keys?.upbitAccess && keys?.upbitSecret) {
        const addrRes = await fetch(`/api/upbit/deposit-address?currency=${coin}`, {
          headers: {
            "X-Upbit-Access-Key": keys.upbitAccess,
            "X-Upbit-Secret-Key": keys.upbitSecret,
          },
        });

        if (!addrRes.ok) {
          const errData = await addrRes.json();
          throw new Error(`업비트 입금 주소 획득 실패: ${errData.detail}`);
        }

        const addrData = await addrRes.json();
        address = addrData.deposit_address;
        tag = addrData.secondary_address_profile?.secondary_address || "";
      }

      setDepositAddress(address);
      setDepositTag(tag);
      onAddLog(`[업비트] 입금 주소 획득 성공: ${address.slice(0, 10)}... (Tag: ${tag || "없음"})`);

      // 2단계: 바이비트에서 출금(송금) 개시
      setStep(2);
      onAddLog(`[바이비트] 업비트로 ${coin} 전송 실행 중 (수량: ${amount})...`);

      if (keys?.bybitKey && keys?.bybitSecret) {
        const withdrawRes = await fetch("/api/bybit/withdraw", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Bybit-Api-Key": keys.bybitKey,
            "X-Bybit-Api-Secret": keys.bybitSecret,
          },
          body: JSON.stringify({
            coin: coin.toUpperCase(),
            chain: chain.toUpperCase(),
            address: address,
            amount: amount,
            tag: tag || undefined
          }),
        });

        if (!withdrawRes.ok) {
          const errData = await withdrawRes.json();
          throw new Error(`바이비트 출금 요청 실패: ${errData.detail}`);
        }
      } else {
        // Mocking
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      setStep(3); // 3단계: 완료
      onAddLog(`✨ [완료] 바이비트 -> 업비트 ${coin} 전송 성공! (수량: ${amount})`);
      if (onTransferSuccess) {
        onTransferSuccess();
      }
    } catch (e) {
      setError(e.message);
      setStep(0);
      onAddLog(`❌ [에러] 전송 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMaxAmount = () => {
    if (selectedCoin) {
      setAmount(selectedCoin.totalBalance.toString());
    }
  };

  if (!selectedCoin) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#EDEFF2] w-full max-w-md rounded-[32px] overflow-hidden toss-shadow toss-transition">
        {/* Header */}
        <div className="border-b border-[#EDEFF2] px-6 py-5 flex items-center justify-between text-left">
          <h3 className="font-extrabold text-[#191F28] text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F7A600]"></span>
            코인 업비트로 전송
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
          {step < 3 ? (
            <>
              {/* Info Card */}
              <div className="bg-slate-50 border border-[#EDEFF2] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#8B95A1] block">전송할 코인</span>
                  <span className="font-extrabold text-[#191F28] text-sm">{coin}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-[#8B95A1] block">보유량</span>
                  <span className="font-extrabold text-[#191F28] text-sm">
                    {selectedCoin.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {coin}
                  </span>
                </div>
              </div>

              {/* Chain & Amount Input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#8B95A1] block mb-1.5">체인(Chain)</label>
                  <input
                    type="text"
                    value={chain}
                    onChange={(e) => setChain(e.target.value)}
                    className="w-full bg-[#F2F4F6] border-0 rounded-xl px-3.5 py-3 text-sm text-[#191F28] font-bold focus:outline-none focus:ring-1 focus:ring-[#F7A600]"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-[#8B95A1]">전송 수량</label>
                    <button
                      onClick={handleMaxAmount}
                      className="text-[10px] font-bold text-[#F7A600] hover:underline"
                    >
                      최대
                    </button>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#F2F4F6] border-0 rounded-xl px-3.5 py-3 text-sm text-[#191F28] font-bold focus:outline-none focus:ring-1 focus:ring-[#F7A600]"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-500 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="space-y-3 py-2">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#F7A600] h-full rounded-full transition-all duration-500"
                      style={{ width: step === 1 ? "40%" : "85%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-center text-[#8B95A1] font-semibold flex items-center justify-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {step === 1 ? "업비트 입금주소 받아오는 중..." : "바이비트 출금 신청 중..."}
                  </p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-[#4E5968] font-extrabold py-3.5 rounded-2xl text-sm toss-transition cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleTransfer}
                    className="flex-1 bg-[#F7A600] hover:bg-[#E09400] text-white font-extrabold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 toss-transition cursor-pointer"
                  >
                    전송하기
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-6 text-center space-y-4 flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-emerald-50 text-[#2D9D78] rounded-full flex items-center justify-center border border-[#E8F8F5]">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <p className="text-md font-bold text-[#191F28]">전송 요청 성공</p>
                <p className="text-xs text-[#8B95A1] mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                  바이비트에서 업비트 입금 주소로 송금 요청을 접수했습니다. 블록체인 전송 및 입금 확인까지 약 2~5분이 걸릴 수 있습니다.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-black text-white font-extrabold py-3.5 rounded-2xl text-sm toss-transition cursor-pointer"
              >
                확인
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
