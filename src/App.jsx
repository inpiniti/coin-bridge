import { useState, useRef, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// Static coin metadata.
// ─────────────────────────────────────────────────────────────
const META = {
  USDT: { name: "테더", color: "#26A17B", glyph: "₮", usd: 1, krw: 1382, net: "TRC20", fee: 1 },
  BTC: { name: "비트코인", color: "#F7931A", glyph: "₿", usd: 98500, krw: 136200000, net: "Bitcoin", fee: 0.0005 },
  ETH: { name: "이더리움", color: "#627EEA", glyph: "Ξ", usd: 3550, krw: 4905000, net: "Ethereum (ERC20)", fee: 0.003 },
  XRP: { name: "리플", color: "#1A2B4A", glyph: "✕", usd: 2.32, krw: 3205, net: "Ripple (XRP)", fee: 0.25 },
  TRX: { name: "트론", color: "#EC092F", glyph: "T", usd: 0.12, krw: 165, net: "TRON", fee: 1 },
  EOS: { name: "이오스", color: "#000000", glyph: "E", usd: 0.8, krw: 1100, net: "EOS", fee: 0.1 }
};

// ─── formatting helpers ───
const fmtCoin = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 8 });
const fmtUsd = (n) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtKrw = (n) => Math.floor(n).toLocaleString("ko-KR") + "원";
const pnum = (v) => {
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
};

const reduceBal = (state, sym, qty) => {
  return state
    .map((item) => {
      if (item.sym === sym) {
        return { ...item, amount: Math.max(0, item.amount - qty) };
      }
      return item;
    })
    .filter((item) => item.amount > 0.00000001);
};

const addBal = (state, sym, qty) => {
  const exists = state.some((item) => item.sym === sym);
  if (exists) {
    return state.map((item) => {
      if (item.sym === sym) {
        return { ...item, amount: item.amount + qty };
      }
      return item;
    });
  } else {
    const usd = META[sym]?.usd || 1;
    const krw = META[sym]?.krw || 1300;
    return [...state, { sym, amount: qty, usd, krw }];
  }
};


function StatusPill({ connected, isVirtual }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700,
        padding: "4px 9px", borderRadius: 20,
        background: connected ? (isVirtual ? "#FFF1D6" : "#E7F8F0") : "#FDECEC",
        color: connected ? (isVirtual ? "#B07900" : "#119A5B") : "#E5484D",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
      {connected ? (isVirtual ? "가상연결됨" : "연결됨") : "미연결"}
    </div>
  );
}

function Connector({ label, badge, badgeBg, badgeColor, apiKey, apiSecret, onKeyChange, onSecretChange, connected, onToggle, isVirtual }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #EAEDF0", borderRadius: 14, padding: "8px 10px 8px 12px", boxShadow: "0 1px 2px rgba(0,0,0,.03)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, width: 78 }}>
        <div style={{ width: 22, height: 22, borderRadius: 7, background: badgeBg, display: "flex", alignItems: "center", justifyContent: "center", color: badgeColor, fontSize: 13, fontWeight: 900 }}>{badge}</div>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.3px" }}>{label}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <input
          value={apiKey} onChange={onKeyChange} disabled={connected || isVirtual} placeholder="API Key"
          style={{ width: 150, border: "1px solid #E5E8EB", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, background: "#F9FAFB", color: "#333D4B" }}
        />
        <input
          type="password"
          value={apiSecret} onChange={onSecretChange} disabled={connected || isVirtual} placeholder="Secret Key"
          style={{ width: 150, border: "1px solid #E5E8EB", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, background: "#F9FAFB", color: "#333D4B" }}
        />
      </div>
      <button
        onClick={onToggle}
        disabled={isVirtual}
        style={{ border: "none", cursor: isVirtual ? "not-allowed" : "pointer", borderRadius: 9, padding: "8px 12px", fontSize: 12.5, fontWeight: 700, letterSpacing: "-0.2px", whiteSpace: "nowrap", background: connected ? (isVirtual ? "#FFF1D6" : "#E7F8F0") : "#191F28", color: connected ? (isVirtual ? "#B07900" : "#119A5B") : "#fff", opacity: isVirtual ? 0.6 : 1 }}
      >
        {connected ? (isVirtual ? "가상모드" : "연결됨") : "연결"}
      </button>
    </div>
  );
}

function Arrow() {
  return (
    <div style={{ width: 46, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#fff", border: "1px solid #E5E8EB", display: "flex", alignItems: "center", justifyContent: "center", color: "#B0B8C1", fontSize: 15, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>→</div>
    </div>
  );
}

function CoinAvatar({ sym, size = 34 }) {
  const m = META[sym] || { color: "#23292F", glyph: sym.slice(0,1), name: sym };
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.44, fontWeight: 800, flexShrink: 0 }}>{m.glyph}</div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,20,30,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: "92vw", background: "#fff", borderRadius: 22, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
        {children}
      </div>
    </div>
  );
}

const Row = ({ label, value, color }) => (
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <span style={{ color: "#8B95A1", fontWeight: 600 }}>{label}</span>
    <span style={{ fontWeight: 700, color }}>{value}</span>
  </div>
);

const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : "https://younginpiniti-coin-bridge.hf.space/api";

export default function App({ hasRegisteredAccount = true, registeredName = "김환전", registeredAccount = "100-123-456789" }) {
  // --- Keys State (LocalStorage sync) ---
  const [bybitKey, setBybitKey] = useState(() => localStorage.getItem("bybit_api_key") || "");
  const [bybitSecret, setBybitSecret] = useState(() => localStorage.getItem("bybit_api_secret") || "");
  const [upbitAccess, setUpbitAccess] = useState(() => localStorage.getItem("upbit_access_key") || "");
  const [upbitSecret, setUpbitSecret] = useState(() => localStorage.getItem("upbit_secret_key") || "");

  const [bybitConnected, setBybitConnected] = useState(false);
  const [upbitConnected, setUpbitConnected] = useState(false);
  const [isVirtual, setIsVirtual] = useState(false);

  // --- Server Public IP ---
  const [serverIp, setServerIp] = useState("조회 중...");

  useEffect(() => {
    const fetchServerIp = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ip`);
        if (res.ok) {
          const data = await res.json();
          setServerIp(data.ip || "조회 실패");
        } else {
          setServerIp("조회 실패");
        }
      } catch (e) {
        console.error("Failed to fetch server IP", e);
        setServerIp("에러");
      }
    };
    fetchServerIp();
  }, []);

  // --- Real Assets state (populated from API or Mock) ---
  const [bybit, setBybit] = useState([]);
  const [upbit, setUpbit] = useState([]);
  const [krw, setKrw] = useState(0);

  const [dragOver, setDragOver] = useState(false);
  const dragSym = useRef(null);

  const [xferSym, setXferSym] = useState(null);
  const [xferQty, setXferQty] = useState("");
  const [sellSym, setSellSym] = useState(null);
  const [sellQty, setSellQty] = useState("");

  const [withdrawMode, setWithdrawMode] = useState("registered");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [manualBank, setManualBank] = useState("케이뱅크");
  const [manualName, setManualName] = useState("");
  const [manualNum, setManualNum] = useState("");
  const [wdOpen, setWdOpen] = useState(false);

  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, kind) => {
    const id = Date.now() + Math.random();
    const map = { ok: { icon: "✓", iconBg: "#2BC47D" }, send: { icon: "→", iconBg: "#F7A600" }, money: { icon: "₩", iconBg: "#5A4FE0" } };
    const m = map[kind] || map.ok;
    setToasts((t) => [...t, { id, msg, icon: m.icon, iconBg: m.iconBg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  // --- API Sync Functions ---
  const fetchBybitAssets = async () => {
    if (isVirtual) return;
    if (!bybitKey || !bybitSecret) return;
    try {
      const res = await fetch(`${API_BASE_URL}/bybit/balance`, {
        headers: {
          "X-Bybit-Api-Key": bybitKey,
          "X-Bybit-Api-Secret": bybitSecret,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBybit(data.map((d) => ({ sym: d.coin, amount: d.totalBalance, usd: d.usdValue / d.totalBalance || META[d.coin]?.usd || 1 })));
      }
    } catch (e) {
      console.error("Bybit sync error", e);
    }
  };

  const fetchUpbitAssets = async () => {
    if (isVirtual) return;
    if (!upbitAccess || !upbitSecret) return;
    try {
      const res = await fetch(`${API_BASE_URL}/upbit/balance`, {
        headers: {
          "X-Upbit-Access-Key": upbitAccess,
          "X-Upbit-Secret-Key": upbitSecret,
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Parse KRW
        const krwAsset = data.find((a) => a.currency === "KRW");
        if (krwAsset) {
          setKrw(parseFloat(krwAsset.balance));
        }
        // Parse coins
        const coins = data
          .filter((a) => a.currency !== "KRW")
          .map((a) => ({
            sym: a.currency,
            amount: parseFloat(a.balance) + parseFloat(a.locked),
            krw: parseFloat(a.avg_buy_price) || META[a.currency]?.krw || 1300
          }));
        setUpbit(coins);
      }
    } catch (e) {
      console.error("Upbit sync error", e);
    }
  };

  // Auto load assets on connection (Only for non-virtual mode)
  useEffect(() => {
    if (bybitConnected && !isVirtual) {
      fetchBybitAssets();
      const t = setInterval(fetchBybitAssets, 10000);
      return () => clearInterval(t);
    }
  }, [bybitConnected, bybitKey, bybitSecret, isVirtual]);

  useEffect(() => {
    if (upbitConnected && !isVirtual) {
      fetchUpbitAssets();
      const t = setInterval(fetchUpbitAssets, 10000);
      return () => clearInterval(t);
    }
  }, [upbitConnected, upbitAccess, upbitSecret, isVirtual]);

  // Load initial connection status if keys exist in storage
  useEffect(() => {
    if (bybitKey && bybitSecret) setBybitConnected(true);
    if (upbitAccess && upbitSecret) setUpbitConnected(true);
  }, []);

  // --- virtual mode controller ---
  const toggleVirtualMode = () => {
    const next = !isVirtual;
    setIsVirtual(next);
    
    if (next) {
      // 가상 연결 시작: 초기 목업 데이터를 세팅합니다.
      setBybitConnected(true);
      setUpbitConnected(true);
      setBybitKey("VIRTUAL-BYBIT-KEY");
      setBybitSecret("VIRTUAL-BYBIT-SECRET");
      setUpbitAccess("VIRTUAL-UPBIT-KEY");
      setUpbitSecret("VIRTUAL-UPBIT-SECRET");
      
      setBybit([
        { sym: "USDT", amount: 5200 },
        { sym: "BTC", amount: 0.085 },
        { sym: "ETH", amount: 1.2 },
        { sym: "XRP", amount: 3500 },
      ]);
      setUpbit([
        { sym: "USDT", amount: 1000 },
        { sym: "XRP", amount: 2000 },
      ]);
      setKrw(1250000);
      addToast("가상 연결(모의 테스트)이 활성화되었습니다.", "ok");
    } else {
      // 가상 연결 해제: 로컬 스토리지 키 확인 후 실제 연동으로 복구 시도
      const savedBybitKey = localStorage.getItem("bybit_api_key") || "";
      const savedBybitSecret = localStorage.getItem("bybit_api_secret") || "";
      const savedUpbitAccess = localStorage.getItem("upbit_access_key") || "";
      const savedUpbitSecret = localStorage.getItem("upbit_secret_key") || "";
      
      setBybitKey(savedBybitKey);
      setBybitSecret(savedBybitSecret);
      setUpbitAccess(savedUpbitAccess);
      setUpbitSecret(savedUpbitSecret);

      setBybitConnected(!!(savedBybitKey && savedBybitSecret));
      setUpbitConnected(!!(savedUpbitAccess && savedUpbitSecret));
      
      setBybit([]);
      setUpbit([]);
      setKrw(0);
      addToast("가상 연결이 해제되었습니다.", "send");
    }
  };

  // --- connect toggles ---
  const toggleBybit = () => {
    if (isVirtual) return;
    const next = !bybitConnected;
    if (next) {
      if (!bybitKey || !bybitSecret) {
        return addToast("API Key와 Secret Key를 입력해 주세요.", "send");
      }
      localStorage.setItem("bybit_api_key", bybitKey);
      localStorage.setItem("bybit_api_secret", bybitSecret);
    } else {
      localStorage.removeItem("bybit_api_key");
      localStorage.removeItem("bybit_api_secret");
    }
    setBybitConnected(next);
    addToast(next ? "바이비트 연결됨" : "바이비트 연결 해제", next ? "ok" : "send");
  };

  const toggleUpbit = () => {
    if (isVirtual) return;
    const next = !upbitConnected;
    if (next) {
      if (!upbitAccess || !upbitSecret) {
        return addToast("Access Key와 Secret Key를 입력해 주세요.", "send");
      }
      localStorage.setItem("upbit_access_key", upbitAccess);
      localStorage.setItem("upbit_secret_key", upbitSecret);
    } else {
      localStorage.removeItem("upbit_access_key");
      localStorage.removeItem("upbit_secret_key");
    }
    setUpbitConnected(next);
    addToast(next ? "업비트 연결됨" : "업비트 연결 해제", next ? "ok" : "send");
  };

  // --- transfer ---
  const openXfer = (sym) => {
    if (!upbitConnected) return addToast("업비트 API 연결이 필요합니다", "send");
    const c = bybit.find((x) => x.sym === sym);
    if (!c) return;
    setXferSym(sym);
    setXferQty(String(c.amount));
  };

  const confirmXfer = async () => {
    const c = bybit.find((x) => x.sym === xferSym);
    if (!c) return;
    const m = META[xferSym] || { net: xferSym, fee: 0 };
    let qty = pnum(xferQty);
    if (qty <= 0) return addToast("수량을 입력하세요", "send");
    if (qty > c.amount) qty = c.amount;

    const recv = Math.max(0, qty - m.fee);

    if (isVirtual) {
      // 가상 전송 처리: 로컬 잔고에서 증감
      setBybit((s) => reduceBal(s, xferSym, qty));
      setUpbit((s) => addBal(s, xferSym, recv));
      setXferSym(null);
      addToast(`${xferSym} ${fmtCoin(recv)} 업비트 가상 입금 완료`, "send");
      return;
    }

    addToast(`${xferSym} 전송 신청 중...`, "send");
    try {
      // 1. 업비트 입금주소 자동 획득
      const addrRes = await fetch(`${API_BASE_URL}/upbit/deposit-address?currency=${xferSym}`, {
        headers: {
          "X-Upbit-Access-Key": upbitAccess,
          "X-Upbit-Secret-Key": upbitSecret,
        },
      });
      if (!addrRes.ok) throw new Error("업비트 입금주소 조회 실패");
      const addrData = await addrRes.json();
      const address = addrData.deposit_address;
      const tag = addrData.secondary_address_profile?.secondary_address || "";

      // 2. 바이비트 출금 신청
      const withdrawRes = await fetch(`${API_BASE_URL}/bybit/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Bybit-Api-Key": bybitKey,
          "X-Bybit-Api-Secret": bybitSecret,
        },
        body: JSON.stringify({
          coin: xferSym.toUpperCase(),
          chain: m.net.includes("TRC20") ? "TRC20" : xferSym.toUpperCase(),
          address: address,
          amount: String(qty),
          tag: tag || undefined
        }),
      });

      if (!withdrawRes.ok) throw new Error("바이비트 출금 신청 실패");

      setXferSym(null);
      addToast(`${xferSym} 송금 요청 완료!`, "send");
      setTimeout(() => {
        fetchBybitAssets();
        fetchUpbitAssets();
      }, 2000);
    } catch (e) {
      addToast(`전송 실패: ${e.message}`, "send");
    }
  };

  // --- sell ---
  const openSell = (sym) => {
    const c = upbit.find((x) => x.sym === sym);
    if (!c) return;
    setSellSym(sym);
    setSellQty(String(c.amount));
  };

  const confirmSell = async () => {
    const c = upbit.find((x) => x.sym === sellSym);
    if (!c) return;
    const m = META[sellSym] || { krw: sc.krw || 1300 };
    let qty = pnum(sellQty);
    if (qty <= 0) return addToast("수량을 입력하세요", "send");
    if (qty > c.amount) qty = c.amount;

    const net = Math.floor(qty * m.krw * 0.9995);

    if (isVirtual) {
      // 가상 매도 처리
      setUpbit((s) => reduceBal(s, sellSym, qty));
      setKrw((k) => k + net);
      setSellSym(null);
      addToast(`${sellSym} 가상 판매 · ${fmtKrw(net)} 입금`, "money");
      return;
    }

    addToast(`${sellSym} 매도 주문 발송 중...`, "money");
    try {
      const res = await fetch(`${API_BASE_URL}/upbit/sell`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Upbit-Access-Key": upbitAccess,
          "X-Upbit-Secret-Key": upbitSecret,
        },
        body: JSON.stringify({
          market: `KRW-${sellSym}`,
          volume: String(qty),
          ord_type: "market"
        }),
      });

      if (!res.ok) throw new Error("매도 주문 실패");

      setSellSym(null);
      addToast(`${sellSym} 즉시 판매 접수 완료!`, "money");
      setTimeout(fetchUpbitAssets, 1500);
    } catch (e) {
      addToast(`매도 실패: ${e.message}`, "money");
    }
  };

  // --- withdraw ---
  const resolveAccount = () => {
    if (withdrawMode === "registered" && hasRegisteredAccount)
      return { bank: "케이뱅크", name: registeredName, account: registeredAccount };
    return { bank: manualBank || "케이뱅크", name: manualName || "(미입력)", account: manualNum || "(미입력)" };
  };

  const openWithdraw = () => {
    const amt = pnum(withdrawAmount);
    if (amt <= 0) return addToast("출금 금액을 입력하세요", "send");
    if (amt > krw) return addToast("잔고가 부족합니다", "send");
    if (withdrawMode === "manual" && (!manualName || !manualNum)) return addToast("계좌 정보를 입력하세요", "send");
    setWdOpen(true);
  };

  const confirmWithdraw = async () => {
    const amt = pnum(withdrawAmount);

    if (isVirtual) {
      // 가상 출금 처리
      setKrw((k) => k - amt);
      setWdOpen(false);
      setWithdrawAmount("");
      addToast(`케이뱅크로 ${fmtKrw(amt)} 가상 출금 완료`, "money");
      return;
    }

    addToast("케이뱅크 출금 처리 중...", "money");
    try {
      const res = await fetch(`${API_BASE_URL}/upbit/withdraw-krw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Upbit-Access-Key": upbitAccess,
          "X-Upbit-Secret-Key": upbitSecret,
        },
        body: JSON.stringify({
          amount: String(amt)
        }),
      });

      if (!res.ok) throw new Error("출금 신청 실패");

      setWdOpen(false);
      setWithdrawAmount("");
      addToast(`케이뱅크로 ${fmtKrw(amt)} 출금 접수 완료!`, "money");
      setTimeout(fetchUpbitAssets, 1500);
    } catch (e) {
      addToast(`출금 실패: ${e.message}`, "money");
    }
  };

  // --- derived calculations ---
  const bybitTotal = bybit.reduce((a, c) => a + c.amount * (META[c.sym]?.usd || c.usd || 1), 0);
  const acc = resolveAccount();
  const card = { flex: "1 1 0", minWidth: 0, background: "#fff", border: "1px solid #EDEFF2", borderRadius: 20, boxShadow: "0 2px 14px rgba(0,0,0,.04)", padding: "20px 18px", display: "flex", flexDirection: "column" };

  const xc = xferSym ? bybit.find((x) => x.sym === xferSym) : null;
  const xm = xferSym ? META[xferSym] || { net: xferSym, fee: 0 } : null;
  const xRecv = xferSym ? Math.max(0, pnum(xferQty) - xm.fee) : 0;

  const sc = sellSym ? upbit.find((x) => x.sym === sellSym) : null;
  const sm = sellSym ? META[sellSym] || { krw: sc.krw || 1300 } : null;
  const sGross = sellSym ? pnum(sellQty) * sm.krw : 0;
  const sNet = Math.floor(sGross * 0.9995);

  return (
    <div style={{ minHeight: "100vh", background: "#F2F4F6", fontFamily: "Pretendard,-apple-system,BlinkMacSystemFont,sans-serif", color: "#191F28", padding: "20px 24px 80px" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, maxWidth: 1520, margin: "0 auto", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: "#1763F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800 }}>⇄</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px" }}>환전 도우미</span>
              <button
                onClick={toggleVirtualMode}
                style={{
                  border: "1px solid #EAEDF0", cursor: "pointer", borderRadius: 8, padding: "4px 10px",
                  fontSize: 11, fontWeight: 700, background: isVirtual ? "#FFF1D6" : "#fff",
                  color: isVirtual ? "#B07900" : "#8B95A1", boxShadow: "0 1px 2px rgba(0,0,0,.03)",
                  transition: "all .12s"
                }}
              >
                {isVirtual ? "⚡ 가상연결 해제" : "⚙️ 가상 연결(모의테스트)"}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <div style={{ fontSize: 12.5, color: "#8B95A1", fontWeight: 600, letterSpacing: "-0.2px" }}>바이비트 → 업비트 → 케이뱅크</div>
              <span style={{ color: "#D9DEE3", fontSize: 12 }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#E8F0FF", color: "#1763F6", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                <span>서버 IP:</span>
                <span style={{ fontFamily: "monospace" }}>{serverIp}</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Connector
            label="Bybit" badge="B" badgeBg="#F7A600" badgeColor="#16120A"
            apiKey={bybitKey} apiSecret={bybitSecret}
            onKeyChange={(e) => setBybitKey(e.target.value)}
            onSecretChange={(e) => setBybitSecret(e.target.value)}
            connected={bybitConnected} onToggle={toggleBybit} isVirtual={isVirtual}
          />
          <Connector
            label="Upbit" badge="U" badgeBg="#1763F6" badgeColor="#fff"
            apiKey={upbitAccess} apiSecret={upbitSecret}
            onKeyChange={(e) => setUpbitAccess(e.target.value)}
            onSecretChange={(e) => setUpbitSecret(e.target.value)}
            connected={upbitConnected} onToggle={toggleUpbit} isVirtual={isVirtual}
          />
        </div>
      </div>

      {/* COLUMNS */}
      <div style={{ display: "flex", alignItems: "stretch", marginTop: 18, maxWidth: 1520, marginLeft: "auto", marginRight: "auto" }}>
        {/* ── BYBIT ── */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "#F7A600", display: "flex", alignItems: "center", justifyContent: "center", color: "#16120A", fontSize: 16, fontWeight: 900 }}>B</div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px" }}>바이비트 지갑</div>
            </div>
            <StatusPill connected={bybitConnected} isVirtual={isVirtual} />
          </div>
          {bybitConnected ? (
            <div>
              <div style={{ margin: "10px 2px 14px" }}>
                <div style={{ fontSize: 12, color: "#8B95A1", fontWeight: 600 }}>총 보유자산</div>
                <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.8px", marginTop: 2 }}>{fmtUsd(bybitTotal)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#8B95A1", fontWeight: 600, marginBottom: 8, padding: "7px 10px", background: "#FFF8EC", borderRadius: 9 }}>
                💡 코인을 업비트로 <b style={{ color: "#B07900" }}>드래그</b>하거나 전송 버튼을 누르세요
              </div>
              {bybit.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#B0B8C1", fontSize: 13, fontWeight: 600 }}>전송 가능한 자산이 없습니다</div>
              ) : (
                bybit.map((c) => {
                  const m = META[c.sym] || { name: c.sym, usd: c.usd || 1 };
                  return (
                    <div
                      key={c.sym} draggable
                      onDragStart={(e) => { dragSym.current = c.sym; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", c.sym); }}
                      onDragEnd={() => setDragOver(false)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                      style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 10px", borderRadius: 13, cursor: "grab", border: "1px solid #F0F1F3", marginBottom: 7, background: "#fff", transition: "background .12s" }}
                    >
                      <CoinAvatar sym={c.sym} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.3px" }}>{c.sym} <span style={{ color: "#B0B8C1", fontWeight: 600, fontSize: 12 }}>{m.name}</span></div>
                        <div style={{ fontSize: 12, color: "#8B95A1", fontWeight: 600, marginTop: 1 }}>{fmtCoin(c.amount)} · ≈ {fmtUsd(c.amount * m.usd)}</div>
                      </div>
                      <button onClick={() => openXfer(c.sym)} style={{ border: "none", cursor: "pointer", borderRadius: 8, padding: "7px 11px", fontSize: 12, fontWeight: 700, background: "#FFF1D6", color: "#B07900", letterSpacing: "-0.2px", whiteSpace: "nowrap" }}>전송</button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <Locked text="바이비트 API 연결이 필요합니다" />
          )}
        </div>

        <Arrow />

        {/* ── UPBIT (drop zone) ── */}
        <div
          onDragOver={(e) => { e.preventDefault(); if (!dragOver) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); const sym = dragSym.current; setDragOver(false); if (sym) openXfer(sym); dragSym.current = null; }}
          style={{ ...card, border: dragOver ? "2px dashed #1763F6" : "1px solid #EDEFF2", background: dragOver ? "#F4F8FF" : "#fff", transition: "border .12s,background .12s" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "#1763F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 900 }}>U</div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px" }}>업비트 지갑</div>
            </div>
            <StatusPill connected={upbitConnected} isVirtual={isVirtual} />
          </div>
          {upbitConnected ? (
            <div>
              <div style={{ margin: "10px 2px 14px", padding: "14px 16px", borderRadius: 14, background: "#F4F8FF" }}>
                <div style={{ fontSize: 12, color: "#5B8DEF", fontWeight: 700 }}>원화(KRW) 잔고</div>
                <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.8px", marginTop: 2, color: "#1763F6" }}>{fmtKrw(krw)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#8B95A1", fontWeight: 600, marginBottom: 8, padding: "7px 10px", background: "#F4F8FF", borderRadius: 9 }}>
                💰 코인을 눌러 <b style={{ color: "#1763F6" }}>판매</b>하고 원화로 바꾸세요
              </div>
              {upbit.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#B0B8C1", fontSize: 13, fontWeight: 600 }}>판매할 코인이 없습니다</div>
              ) : (
                upbit.map((c) => {
                  const m = META[c.sym] || { name: c.sym, krw: c.krw || 1300 };
                  return (
                    <div key={c.sym} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 10px", borderRadius: 13, border: "1px solid #F0F1F3", marginBottom: 7, background: "#fff" }}>
                      <CoinAvatar sym={c.sym} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.3px" }}>{c.sym} <span style={{ color: "#B0B8C1", fontWeight: 600, fontSize: 12 }}>{m.name}</span></div>
                        <div style={{ fontSize: 12, color: "#8B95A1", fontWeight: 600, marginTop: 1 }}>{fmtCoin(c.amount)} · ≈ {fmtKrw(c.amount * m.krw)}</div>
                      </div>
                      <button onClick={() => openSell(c.sym)} style={{ border: "none", cursor: "pointer", borderRadius: 8, padding: "7px 13px", fontSize: 12, fontWeight: 700, background: "#1763F6", color: "#fff", letterSpacing: "-0.2px", whiteSpace: "nowrap" }}>판매</button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <Locked text="업비트 API 연결이 필요합니다" />
          )}
        </div>

        <Arrow />

        {/* ── KBANK ── */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "#5A4FE0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, fontWeight: 900 }}>K</div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.4px" }}>케이뱅크 출금</div>
          </div>
          <div style={{ margin: "10px 2px 14px", padding: "14px 16px", borderRadius: 14, background: "#F5F4FE" }}>
            <div style={{ fontSize: 12, color: "#7B73E8", fontWeight: 700 }}>출금 가능 금액</div>
            <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.8px", marginTop: 2, color: "#5A4FE0" }}>{fmtKrw(krw)}</div>
          </div>

          <div style={{ display: "flex", gap: 6, background: "#F2F4F6", padding: 4, borderRadius: 11, marginBottom: 14 }}>
            {[["registered", "등록 계좌"], ["manual", "직접 입력"]].map(([mode, label]) => {
              const active = withdrawMode === mode;
              return (
                <button key={mode} onClick={() => setWithdrawMode(mode)} style={{ flex: 1, border: "none", cursor: "pointer", borderRadius: 8, padding: "8px 0", fontSize: 12.5, fontWeight: 700, letterSpacing: "-0.2px", background: active ? "#fff" : "transparent", color: active ? "#191F28" : "#8B95A1", boxShadow: active ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>{label}</button>
              );
            })}
          </div>

          {withdrawMode === "registered" ? (
            hasRegisteredAccount ? (
              <div style={{ border: "1.5px solid #5A4FE0", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, background: "#FBFBFF" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#5A4FE0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 900 }}>K</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: "-0.3px" }}>케이뱅크 · {registeredName}</div>
                  <div style={{ fontSize: 13, color: "#6B7684", fontWeight: 600, marginTop: 2, letterSpacing: "0.3px" }}>{registeredAccount}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#5A4FE0", background: "#EEEDFC", padding: "4px 8px", borderRadius: 7 }}>등록됨</div>
              </div>
            ) : (
              <div style={{ border: "1.5px dashed #D9DEE3", borderRadius: 14, padding: "22px 16px", textAlign: "center", color: "#B0B8C1", fontSize: 13, fontWeight: 600 }}>등록된 계좌가 없습니다<br /><span style={{ fontSize: 12 }}>직접 입력 탭을 이용하세요</span></div>
            )
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <Field label="은행" value={manualBank} onChange={(e) => setManualBank(e.target.value)} />
              <Field label="예금주" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="예금주명" />
              <Field label="계좌번호" value={manualNum} onChange={(e) => setManualNum(e.target.value)} placeholder="000-000-000000" mono />
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8B95A1", marginBottom: 5 }}>출금 금액</div>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #E5E8EB", borderRadius: 10, padding: "11px 12px", background: "#F9FAFB" }}>
              <input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" inputMode="numeric" style={{ flex: 1, border: "none", background: "transparent", fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px", color: "#191F28", width: "100%", outline: "none" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#8B95A1" }}>원</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {[["+10%", 0.1], ["+50%", 0.5], ["최대", 1]].map(([lbl, p]) => (
                <button key={lbl} onClick={() => setWithdrawAmount((a) => String(p === 1 ? krw : Math.min(krw, pnum(a) + Math.floor(krw * p))))} style={{ flex: 1, border: "1px solid #E5E8EB", background: "#fff", cursor: "pointer", borderRadius: 8, padding: "7px 0", fontSize: 12, fontWeight: 700, color: "#4E5968" }}>{lbl}</button>
              ))}
            </div>
          </div>

          <button onClick={openWithdraw} style={{ marginTop: 14, border: "none", cursor: "pointer", borderRadius: 12, padding: "14px 0", fontSize: 14.5, fontWeight: 800, letterSpacing: "-0.3px", background: "#5A4FE0", color: "#fff", width: "100%" }}>출금하기</button>
          <div style={{ textAlign: "center", fontSize: 11, color: "#B0B8C1", fontWeight: 600, marginTop: 8 }}>출금 수수료 무료 · 실시간 이체</div>
        </div>
      </div>

      {/* TRANSFER MODAL */}
      {xferSym && xc && xm && (
        <Modal onClose={() => setXferSym(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <CoinAvatar sym={xferSym} size={36} />
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px" }}>{xferSym} 업비트로 전송</div>
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8B95A1", marginBottom: 5 }}>전송 수량</div>
          <div style={{ display: "flex", alignItems: "center", border: "1px solid #E5E8EB", borderRadius: 11, padding: "12px 13px", background: "#F9FAFB" }}>
            <input value={xferQty} onChange={(e) => setXferQty(e.target.value)} inputMode="decimal" style={{ flex: 1, border: "none", background: "transparent", fontSize: 17, fontWeight: 800, color: "#191F28", width: "100%", outline: "none" }} />
            <button onClick={() => setXferQty(String(xc.amount))} style={{ border: "none", background: "#FFF1D6", color: "#B07900", cursor: "pointer", borderRadius: 7, padding: "5px 9px", fontSize: 11.5, fontWeight: 700 }}>최대</button>
          </div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 9, fontSize: 13 }}>
            <Row label="네트워크" value={xm.net} />
            <Row label="네트워크 수수료" value={`${fmtCoin(xm.fee)} ${xferSym}`} />
            <Row label="보유 수량" value={`${fmtCoin(xc.amount)} ${xferSym}`} />
            <div style={{ height: 1, background: "#F0F1F3", margin: "3px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#191F28", fontWeight: 700 }}>업비트 입금 예정</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: "#1763F6" }}>{fmtCoin(xRecv)} {xferSym}</span>
            </div>
          </div>
          <ModalButtons onCancel={() => setXferSym(null)} onConfirm={confirmXfer} confirmLabel="전송 확인" confirmBg="#F7A600" confirmColor="#16120A" />
        </Modal>
      )}

      {/* SELL MODAL */}
      {sellSym && sc && sm && (
        <Modal onClose={() => setSellSym(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <CoinAvatar sym={sellSym} size={36} />
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px" }}>{sellSym} 판매</div>
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8B95A1", marginBottom: 5 }}>판매 수량 (최대 {fmtCoin(sc.amount)})</div>
          <div style={{ display: "flex", alignItems: "center", border: "1px solid #E5E8EB", borderRadius: 11, padding: "12px 13px", background: "#F9FAFB" }}>
            <input value={sellQty} onChange={(e) => setSellQty(e.target.value)} inputMode="decimal" style={{ flex: 1, border: "none", background: "transparent", fontSize: 17, fontWeight: 800, color: "#191F28", width: "100%", outline: "none" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#8B95A1", marginRight: 8 }}>{sellSym}</span>
            <button onClick={() => setSellQty(String(sc.amount))} style={{ border: "none", background: "#E8F0FF", color: "#1763F6", cursor: "pointer", borderRadius: 7, padding: "5px 9px", fontSize: 11.5, fontWeight: 700 }}>최대</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {[["25%", 0.25], ["50%", 0.5], ["100%", 1]].map(([lbl, p]) => (
              <button key={lbl} onClick={() => setSellQty(String(+(sc.amount * p).toFixed(8)))} style={{ flex: 1, border: "1px solid #E5E8EB", background: "#fff", cursor: "pointer", borderRadius: 8, padding: "6px 0", fontSize: 11.5, fontWeight: 700, color: "#4E5968" }}>{lbl}</button>
            ))}
          </div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 9, fontSize: 13 }}>
            <Row label="현재 시가" value={fmtKrw(sm.krw)} />
            <Row label="거래 수수료 (0.05%)" value={fmtKrw(sGross * 0.0005)} />
            <div style={{ height: 1, background: "#F0F1F3", margin: "3px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#191F28", fontWeight: 700 }}>예상 정산 원화</span>
              <span style={{ fontWeight: 800, fontSize: 17, color: "#1763F6" }}>{fmtKrw(sNet)}</span>
            </div>
          </div>
          <ModalButtons onCancel={() => setSellSym(null)} onConfirm={confirmSell} confirmLabel="판매 확인" confirmBg="#1763F6" confirmColor="#fff" />
        </Modal>
      )}

      {/* WITHDRAW CONFIRM */}
      {wdOpen && (
        <Modal onClose={() => setWdOpen(false)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#5A4FE0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 900 }}>K</div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px" }}>출금 확인</div>
          </div>
          <div style={{ textAlign: "center", padding: "8px 0 14px" }}>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-1px", color: "#5A4FE0" }}>{fmtKrw(pnum(withdrawAmount))}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, background: "#F9FAFB", borderRadius: 12, padding: "14px 14px" }}>
            <Row label="받는 은행" value={acc.bank} />
            <Row label="예금주" value={acc.name} />
            <Row label="계좌번호" value={acc.account} />
          </div>
          <ModalButtons onCancel={() => setWdOpen(false)} onConfirm={confirmWithdraw} confirmLabel="출금 확인" confirmBg="#5A4FE0" confirmColor="#fff" />
        </Modal>
      )}

      {/* TOASTS */}
      <div style={{ position: "fixed", right: 22, bottom: 22, display: "flex", flexDirection: "column", gap: 10, zIndex: 60 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#191F28", color: "#fff", padding: "13px 16px", borderRadius: 13, boxShadow: "0 8px 28px rgba(0,0,0,.25)", fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.2px", minWidth: 220 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: t.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{t.icon}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── more small pieces ───
function Locked({ text }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px 0", color: "#B0B8C1", gap: 8 }}>
      <div style={{ fontSize: 30 }}>🔒</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#8B95A1" }}>{text}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8B95A1", marginBottom: 5 }}>{label}</div>
      <input value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", border: "1px solid #E5E8EB", borderRadius: 10, padding: "11px 12px", fontSize: 13, fontWeight: 600, background: "#F9FAFB", letterSpacing: mono ? "0.4px" : "normal", outline: "none" }} />
    </div>
  );
}

function ModalButtons({ onCancel, onConfirm, confirmLabel, confirmBg, confirmColor }) {
  return (
    <div style={{ display: "flex", gap: 9, marginTop: 22 }}>
      <button onClick={onCancel} style={{ flex: 1, border: "none", cursor: "pointer", borderRadius: 12, padding: "13px 0", fontSize: 14, fontWeight: 700, background: "#F2F4F6", color: "#4E5968" }}>취소</button>
      <button onClick={onConfirm} style={{ flex: 2, border: "none", cursor: "pointer", borderRadius: 12, padding: "13px 0", fontSize: 14, fontWeight: 800, background: confirmBg, color: confirmColor }}>{confirmLabel}</button>
    </div>
  );
}
