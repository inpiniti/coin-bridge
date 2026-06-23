import React, { useState, useEffect } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";

export default function KbankWithdraw({ keys, upbitKrwBalance, onWithdrawSuccess, onAddLog }) {
  const [activeTab, setActiveTab] = useState("registered"); // registered | manual
  const [accountNo, setAccountNo] = useState("100-123-456789");
  const [accountHolder, setAccountHolder] = useState("김환전");
  const [amount, setAmount] = useState("0");
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // 로컬 스토리지 또는 목업 초기화
  useEffect(() => {
    const savedAccount = localStorage.getItem("kbank_account_no");
    if (savedAccount) {
      setAccountNo(savedAccount);
    }
  }, []);

  const handleSaveAccount = (val) => {
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

  const handleQuickPercent = (percent) => {
    const balance = keys ? upbitKrwBalance : 1250000;
    const calc = Math.floor(balance * percent);
    setAmount(calc.toString());
  };

  const handleMaxAmount = () => {
    const balance = keys ? upbitKrwBalance : 1250000;
    setAmount(balance.toString());
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const balance = keys ? upbitKrwBalance : 1250000;
    const withdrawAmt = parseFloat(amount || 0);

    if (withdrawAmt <= 0 || withdrawAmt > balance) {
      setError("올바른 출금 금액을 입력하세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    onAddLog(`[업비트] 연동된 케이뱅크 계좌(${accountNo})로 출금 신청 중 (금액: ${withdrawAmt.toLocaleString()}원)...`);

    try {
      if (keys?.upbitAccess && keys?.upbitSecret) {
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
          throw new Error(errData.detail || "출금 신청 실패");
        }
      } else {
        // Mocking 성공 딜레이
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setSuccess(true);
      onAddLog(`✨ [완료] 케이뱅크 계좌(${accountNo})로 ${withdrawAmt.toLocaleString()}원 출금 완료!`);
      setAmount("0");
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

  const displayBalance = keys ? upbitKrwBalance : 1250000;

  return (
    <div className="bg-white border border-[#EDEFF2] rounded-[32px] p-8 shadow-sm flex flex-col justify-between text-left relative min-h-[500px]">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#5A4FE0] flex items-center justify-center font-bold text-white text-sm shrink-0">
            K
          </div>
          <h3 className="text-lg font-extrabold text-[#191F28]">케이뱅크 출금</h3>
        </div>

        {/* Sub title / Balance */}
        <div className="mb-6">
          <span className="text-xs text-[#8B95A1] font-semibold">출금 가능 금액</span>
          <div className="text-[32px] font-extrabold text-[#5A4FE0] mt-1">
            {displayBalance.toLocaleString()}원
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[#F2F4F6] p-1 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => setActiveTab("registered")}
            className={`flex-1 text-xs font-extrabold py-2.5 rounded-xl toss-transition cursor-pointer ${
              activeTab === "registered"
                ? "bg-white text-[#191F28] shadow-sm"
                : "text-[#8B95A1]"
            }`}
          >
            등록 계좌
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 text-xs font-extrabold py-2.5 rounded-xl toss-transition cursor-pointer ${
              activeTab === "manual"
                ? "bg-white text-[#191F28] shadow-sm"
                : "text-[#8B95A1]"
            }`}
          >
            직접 입력
          </button>
        </div>

        {/* Account Info Box */}
        {activeTab === "registered" ? (
          <div className="bg-[#F5F4FE] border border-[#5A4FE0] rounded-2xl p-4 flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#5A4FE0] flex items-center justify-center font-bold text-white text-xs shrink-0">
                K
              </div>
              <div>
                <div className="font-extrabold text-[#191F28] text-sm">케이뱅크 · {accountHolder}</div>
                <div className="text-xs text-[#5A4FE0] font-bold mt-0.5">{accountNo}</div>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-[#5A4FE0] bg-[#E8E6FD] px-2.5 py-1 rounded-lg">
              등록됨
            </span>
          </div>
        ) : (
          <div className="space-y-3 mb-5">
            <input
              type="text"
              placeholder="예: 김환전"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              className="w-full bg-[#F2F4F6] border-0 rounded-xl px-4 py-3 text-sm text-[#191F28] font-bold focus:outline-none focus:ring-1 focus:ring-[#5A4FE0]"
            />
            <input
              type="text"
              placeholder="계좌번호 입력 (000-000-000000)"
              value={accountNo}
              onChange={(e) => handleSaveAccount(e.target.value)}
              className="w-full bg-[#F2F4F6] border-0 rounded-xl px-4 py-3 text-sm text-[#191F28] font-bold focus:outline-none focus:ring-1 focus:ring-[#5A4FE0] font-mono"
            />
          </div>
        )}

        {/* Amount Input Form */}
        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#8B95A1] block mb-1.5">출금 금액</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#F2F4F6] border-0 rounded-xl pl-4 pr-10 py-3.5 text-base text-[#191F28] font-extrabold focus:outline-none focus:ring-1 focus:ring-[#5A4FE0]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-[#8B95A1]">
                원
              </span>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickPercent(0.1)}
              className="bg-white border border-[#EDEFF2] hover:bg-[#F9FAFB] text-xs font-extrabold py-2.5 rounded-xl toss-transition text-[#4E5968] cursor-pointer"
            >
              +10%
            </button>
            <button
              type="button"
              onClick={() => handleQuickPercent(0.5)}
              className="bg-white border border-[#EDEFF2] hover:bg-[#F9FAFB] text-xs font-extrabold py-2.5 rounded-xl toss-transition text-[#4E5968] cursor-pointer"
            >
              +50%
            </button>
            <button
              type="button"
              onClick={handleMaxAmount}
              className="bg-white border border-[#EDEFF2] hover:bg-[#F9FAFB] text-xs font-extrabold py-2.5 rounded-xl toss-transition text-[#4E5968] cursor-pointer"
            >
              최대
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-500 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-600 font-bold text-center">
              🎉 출금 신청이 성공적으로 접수되었습니다.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || displayBalance <= 0}
            className="w-full bg-[#5A4FE0] hover:bg-[#473BCC] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-2xl text-sm toss-transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              "출금하기"
            )}
          </button>
        </form>
      </div>

      <div className="text-center text-[10px] text-[#8B95A1] font-semibold mt-4">
        출금 수수료 무료 · 실시간 이체
      </div>
    </div>
  );
}
