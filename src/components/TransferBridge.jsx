import React, { useState } from "react";
import { ArrowRightLeft, MoveRight, Download, Send, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

export default function TransferBridge({ keys, selectedCoin, onClearSelected, onTransferSuccess, onAddLog }) {
  const [coin, setCoin] = useState("");
  const [amount, setAmount] = useState("");
  const [chain, setChain] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: idle, 1: fetching address, 2: initiating withdraw, 3: success
  const [error, setError] = useState("");
  
  const [depositAddress, setDepositAddress] = useState("");
  const [depositTag, setDepositTag] = useState("");

  // selectedCoin prop이 바뀔 때 로컬 상태 동기화
  React.useEffect(() => {
    if (selectedCoin) {
      setCoin(selectedCoin.coin);
      setAmount(selectedCoin.totalBalance.toString());
      // 기본 체인 자동 지정
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const droppedCoin = e.dataTransfer.getData("coin");
    const droppedBalance = e.dataTransfer.getData("balance");
    if (droppedCoin) {
      setCoin(droppedCoin);
      setAmount(droppedBalance);
      const coinUpper = droppedCoin.toUpperCase();
      if (coinUpper === "XRP") setChain("XRP");
      else if (coinUpper === "TRX") setChain("TRX");
      else if (coinUpper === "EOS") setChain("EOS");
      else if (coinUpper === "USDT") setChain("TRC20");
      else setChain(coinUpper);
      setError("");
      setStep(0);
    }
  };

  const handleStartTransfer = async () => {
    if (!coin || !amount || parseFloat(amount) <= 0) {
      setError("올바른 코인과 수량을 지정하세요.");
      return;
    }

    setLoading(true);
    setError("");
    setStep(1); // 1단계: 업비트 입금주소 획득
    onAddLog(`[업비트] ${coin} 입금 주소 및 데스티네이션 태그 조회 중...`);

    try {
      // 1. 업비트 입금 주소 가져오기
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
      const address = addrData.deposit_address;
      const tag = addrData.secondary_address_profile?.secondary_address || ""; // secondary_address (XRP 등)
      
      setDepositAddress(address);
      setDepositTag(tag);
      onAddLog(`[업비트] 입금 주소 획득 성공: ${address.slice(0, 10)}... (Tag: ${tag || "없음"})`);

      // 2단계: 바이비트에서 출금(송금) 개시
      setStep(2);
      onAddLog(`[바이비트] 업비트로 ${coin} 전송 실행 중 (수량: ${amount})...`);

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

      const withdrawData = await withdrawRes.json();
      setStep(3); // 3단계: 완료
      onAddLog(`✨ [완료] 바이비트 -> 업비트 ${coin} 전송 성공! (출금 ID: ${withdrawData.withdrawId})`);
      
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

  const handleReset = () => {
    setCoin("");
    setAmount("");
    setChain("");
    setDepositAddress("");
    setDepositTag("");
    setError("");
    setStep(0);
    if (onClearSelected) onClearSelected();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-slate-800 border-2 rounded-2xl p-6 text-center toss-shadow toss-transition flex flex-col items-center justify-center min-h-[260px] ${
        isDraggingOver
          ? "border-blue-500 bg-slate-800/80 scale-[1.01]"
          : coin
          ? "border-slate-700 bg-slate-800"
          : "border-slate-700/60 border-dashed bg-slate-800/30"
      }`}
    >
      {!coin ? (
        <div className="space-y-3 pointer-events-none select-none">
          <div className="w-14 h-14 bg-slate-700/40 rounded-full flex items-center justify-center mx-auto text-slate-500">
            <ArrowRightLeft className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">바이비트 → 업비트 전송 브릿지</p>
            <p className="text-xs text-slate-500 mt-1">
              바이비트 보유 코인을 이곳으로 드래그 앤 드롭하세요
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full space-y-5 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
              <Send className="w-4.5 h-4.5 text-blue-400" />
              전송 상세 정보
            </h3>
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg toss-transition cursor-pointer"
            >
              초기화
            </button>
          </div>

          {step < 3 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">코인명</label>
                  <input
                    type="text"
                    value={coin}
                    disabled
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">전송 체인(Chain)</label>
                  <input
                    type="text"
                    value={chain}
                    onChange={(e) => setChain(e.target.value)}
                    placeholder="예: XRP, TRX, TRC20"
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">보낼 수량</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-3.5 pr-12 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {coin}
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-3 flex items-start gap-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="space-y-3">
                  <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: step === 1 ? "40%" : "80%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-center text-slate-400 font-semibold flex items-center justify-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {step === 1 ? "업비트 입금주소 발급/조회 중..." : "바이비트에서 송금 신청 진행 중..."}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleStartTransfer}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 toss-transition cursor-pointer"
                >
                  <ArrowRightLeft className="w-4.5 h-4.5" />
                  업비트로 안전 송금 시작
                </button>
              )}
            </div>
          ) : (
            <div className="py-4 text-center space-y-4 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-emerald-950/60 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-900">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">송금 요청 완료</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  바이비트 출금 트랜잭션이 성공적으로 발송되었습니다. 전송 완료까지 약 2~5분이 소요될 수 있습니다.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="bg-slate-900 hover:bg-slate-950 border border-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl toss-transition cursor-pointer"
              >
                추가 전송하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
