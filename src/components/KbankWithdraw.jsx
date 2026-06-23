import React, { useState, useEffect } from "react";
import { CreditCard, Landmark, CheckCircle, RefreshCw, AlertCircle, ArrowUpRight } from "lucide-react";

export default function KbankWithdraw({ keys, upbitKrwBalance, onWithdrawSuccess, onAddLog }) {
  const [accountNo, setAccountNo] = useState("");
  const [amount, setAmount] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // 로컬 스토리지에서 계좌번호 불러오기
  useEffect(() => {
    const savedAccount = localStorage.getItem("kbank_account_no") || "";
    setAccountNo(savedAccount);
  }, []);

  const handleSaveAccount = (val) => {
    // 000-000-000000 형식 포맷팅 지원
    let clean = val.replace(/[^0-9]/g, "");
    let formatted = clean;
    if (clean.length > 3 && clean.length <= 6) {
      formatted = `${clean.slice(0, 3)}-${clean.slice(3)}`;
    } else if (clean.length > 6) {
      formatted = `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 12)}`;
    }
    setAccountNo(formatted);
    localStorage.setItem("kbank_account_no", formatted);
  };

  const handleMaxAmount = () => {
    setAmount(upbitKrwBalance.toString());
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > upbitKrwBalance) {
      setError("올바른 출금 금액을 입력하세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    onAddLog(`[업비트] 연동 케이뱅크 계좌로 원화 출금 신청 중 (금액: ${parseInt(amount).toLocaleString()} KRW)...`);

    try {
      const res = await fetch("/api/upbit/withdraw-krw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Upbit-Access-Key": keys.upbitAccess,
          "X-Upbit-Secret-Key": keys.upbitSecret,
        },
        body: JSON.stringify({
          amount: amount
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "원화 출금 신청에 실패했습니다.");
      }

      setSuccess(true);
      onAddLog(`✨ [완료] 케이뱅크 원화 출금 신청 완료! (출금액: ${parseInt(amount).toLocaleString()} 원)`);
      setAmount("");
      if (onWithdrawSuccess) {
        onWithdrawSuccess();
      }
    } catch (e) {
      setError(e.message);
      onAddLog(`❌ [에러] 출금 실패: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isKeysConfigured = !!(keys?.upbitAccess && keys?.upbitSecret);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 toss-shadow toss-transition text-left flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
          <Landmark className="w-5 h-5 text-indigo-400" />
          케이뱅크 원화 출금
        </h2>

        {!isKeysConfigured ? (
          <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 text-center text-slate-500 text-xs py-8">
            업비트 API 키가 설정되면 원화 출금이 가능합니다.
          </div>
        ) : success ? (
          <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-5 text-center space-y-3 flex flex-col items-center">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-sm font-bold text-slate-200">출금 완료</p>
              <p className="text-xs text-slate-400 mt-1">
                출금 신청이 접수되었습니다. 업비트에서 곧 케이뱅크 계좌로 입금됩니다.
              </p>
            </div>
            <button
              onClick={() => setSuccess(false)}
              className="text-xs text-slate-300 bg-slate-900 hover:bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-700 toss-transition cursor-pointer"
            >
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={handleWithdraw} className="space-y-4">
            {/* Account Info */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 block">케이뱅크 계좌번호</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="계좌번호 입력 (예: 000-000-000000)"
                  value={accountNo}
                  onChange={(e) => handleSaveAccount(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <CreditCard className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                ℹ️ 실제 출금은 업비트와 연동된 케이뱅크 인증 계좌로 진행됩니다. 위 입력란은 기록 보관용입니다.
              </p>
            </div>

            {/* Withdraw Amount */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400">출금 신청 금액</label>
                <div className="text-[11px] text-slate-500">
                  출금 가능:{" "}
                  <span className="font-bold text-slate-300">
                    {upbitKrwBalance.toLocaleString()}
                  </span>{" "}
                  KRW
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="출금할 원화(KRW) 금액"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-3.5 pr-14 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                />
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-1 rounded-md cursor-pointer"
                >
                  최대
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-3 flex items-start gap-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || upbitKrwBalance <= 0}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700/50 disabled:text-slate-500 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 toss-transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  출금 처리 중...
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4.5 h-4.5" />
                  케이뱅크로 즉시 출금
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
