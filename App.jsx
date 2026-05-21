// ─────────────────────────────────────────────────────────────────────────────
// App.jsx  —  EventVote — Plateforme de sondage événementiel sécurisée
// Stack : React + Firebase Auth (Google) + Firestore (temps réel)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { auth, db, provider } from './firebase';

// ─── DONNÉES ─────────────────────────────────────────────────────────────────
const ARTISTS = [
  {
    id: 'a1',
    name: 'King Mensah',
    genre: 'Afropop / Highlife',
    img: '🎤',
    desc: 'Légende de la musique togolaise',
  },
  {
    id: 'a2',
    name: 'Toofan',
    genre: 'Afrobeat / Dancehall',
    img: '🔥',
    desc: "Duo phare du Togo, connu dans toute l'Afrique",
  },
  {
    id: 'a3',
    name: 'Bella Bellow',
    genre: 'Soul / Folk africain',
    img: '🌟',
    desc: 'Icône éternelle de la chanson togolaise',
  },
  {
    id: 'a4',
    name: 'Fally Ipupa',
    genre: 'Rumba / Afropop',
    img: '🎶',
    desc: 'Superstar de la musique africaine',
  },
  {
    id: 'a5',
    name: 'Davido',
    genre: 'Afrobeats',
    img: '🎸',
    desc: "L'une des plus grandes stars d'Afrique",
  },
  {
    id: 'a6',
    name: 'DJ Arafat',
    genre: 'Coupé-Décalé',
    img: '🎧',
    desc: 'Roi du Coupé-Décalé, légende ivoirienne',
  },
];
const PRICES = [1000, 2000, 3000, 5000, 10000, 20000];

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f2f2f7;--surf:#ffffff;--surf2:#fafafc;
  --border:rgba(0,0,0,0.08);--border2:rgba(0,0,0,0.13);
  --txt:#1c1c1e;--txt2:#636366;--txt3:#aeaeb2;
  --blue:#0071e3;--blue-h:#0077ed;--blue-l:rgba(0,113,227,0.10);
  --green:#30d158;--green-l:rgba(48,209,88,0.11);
  --orange:#ff9f0a;--red:#ff3b30;--red-l:rgba(255,59,48,0.10);
  --r:18px;--r-sm:12px;--r-xs:8px;
  --sh-sm:0 2px 8px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);
  --sh:0 4px 24px rgba(0,0,0,0.08),0 1px 4px rgba(0,0,0,0.04);
  --sh-lg:0 20px 60px rgba(0,0,0,0.12),0 4px 16px rgba(0,0,0,0.06);
  --font:'Outfit',-apple-system,BlinkMacSystemFont,sans-serif;
}
body{font-family:var(--font);background:var(--bg);color:var(--txt);
  min-height:100vh;-webkit-font-smoothing:antialiased;overflow-x:hidden}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.13);border-radius:3px}

/* ── AUTH ── */
.auth{min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(145deg,#f2f2f7 0%,#e5e5ea 100%);padding:24px;position:relative;overflow:hidden}
.auth::before{content:'';position:absolute;width:700px;height:700px;
  background:radial-gradient(circle,rgba(0,113,227,0.07) 0%,transparent 65%);
  top:-150px;right:-150px;pointer-events:none}
.auth-card{background:var(--surf);border-radius:28px;padding:52px 44px;
  width:100%;max-width:420px;box-shadow:var(--sh-lg);border:1px solid var(--border);
  position:relative;z-index:1;animation:slideUp .5s cubic-bezier(.34,1.56,.64,1)}
.auth-logo{width:68px;height:68px;background:linear-gradient(135deg,#0071e3,#5ac8fa);
  border-radius:20px;display:flex;align-items:center;justify-content:center;
  font-size:30px;margin:0 auto 28px;box-shadow:0 10px 28px rgba(0,113,227,0.28)}
.auth-title{font-size:27px;font-weight:800;letter-spacing:-.6px;text-align:center;margin-bottom:8px}
.auth-sub{font-size:15px;color:var(--txt2);text-align:center;margin-bottom:36px;line-height:1.55}
.g-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:12px;
  padding:15px 24px;background:var(--surf);border:1.5px solid var(--border2);
  border-radius:var(--r-sm);font-size:15px;font-weight:600;color:var(--txt);
  cursor:pointer;transition:all .2s;font-family:var(--font)}
.g-btn:hover{background:var(--bg);border-color:rgba(0,0,0,.22);box-shadow:var(--sh-sm);transform:translateY(-1px)}
.g-btn:active{transform:translateY(0)}
.g-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.g-icon{width:20px;height:20px;flex-shrink:0}
.auth-note{margin-top:20px;font-size:12px;color:var(--txt3);text-align:center;line-height:1.6}
.auth-note a{color:var(--blue);text-decoration:none}

/* ── LOADER ── */
.loader-wrap{display:flex;flex-direction:column;align-items:center;
  justify-content:center;min-height:100vh;gap:16px}
.spinner{width:36px;height:36px;border:3px solid var(--border);
  border-top-color:var(--blue);border-radius:50%;animation:spin .7s linear infinite}
.loader-txt{font-size:14px;color:var(--txt2);font-weight:500}

/* ── NAV ── */
.nav{position:sticky;top:0;z-index:100;
  background:rgba(255,255,255,0.82);
  backdrop-filter:saturate(180%) blur(20px);
  -webkit-backdrop-filter:saturate(180%) blur(20px);
  border-bottom:1px solid var(--border);
  padding:0 24px;height:56px;
  display:flex;align-items:center;justify-content:space-between}
.nav-brand{display:flex;align-items:center;gap:9px;
  font-size:17px;font-weight:700;letter-spacing:-.3px}
.nav-icon{width:28px;height:28px;background:linear-gradient(135deg,#0071e3,#5ac8fa);
  border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px}
.nav-right{display:flex;align-items:center;gap:10px}
.tabs{display:flex;gap:2px;background:var(--bg);border:1px solid var(--border);
  border-radius:10px;padding:3px}
.tab{padding:6px 14px;border-radius:7px;font-size:13px;font-weight:600;
  border:none;background:transparent;color:var(--txt2);cursor:pointer;
  transition:all .2s;font-family:var(--font)}
.tab.on{background:white;color:var(--txt);box-shadow:var(--sh-sm)}
.user-chip{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;
  border-radius:20px;background:var(--bg);border:1px solid var(--border);cursor:pointer;
  transition:all .2s;font-size:13px;font-weight:500}
.user-chip:hover{box-shadow:var(--sh-sm)}
.avatar{width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0}
.avatar-init{width:28px;height:28px;border-radius:50%;
  background:linear-gradient(135deg,#0071e3,#5ac8fa);
  color:white;font-size:11px;font-weight:700;
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.avatar-init.admin{background:linear-gradient(135deg,#1c1c1e,#48484a)}
.sign-out{padding:7px 13px;border-radius:8px;font-size:13px;font-weight:500;
  border:1px solid var(--border);background:transparent;color:var(--txt2);
  cursor:pointer;transition:all .2s;font-family:var(--font)}
.sign-out:hover{background:var(--red-l);color:var(--red);border-color:var(--red)}

/* ── PAGE ── */
.page{max-width:1080px;margin:0 auto;padding:44px 24px 88px}
.hero{margin-bottom:48px}
.eyebrow{font-size:12px;font-weight:700;text-transform:uppercase;
  letter-spacing:1.5px;color:var(--blue);margin-bottom:10px}
.h1{font-size:clamp(28px,5vw,46px);font-weight:800;letter-spacing:-1.2px;
  line-height:1.12;margin-bottom:14px}
.h1 span{color:var(--blue)}
.lead{font-size:16px;color:var(--txt2);max-width:480px;line-height:1.65}
.sec-head{font-size:21px;font-weight:700;letter-spacing:-.3px;margin-bottom:18px;
  display:flex;align-items:center;gap:10px}
.badge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;
  background:var(--blue-l);color:var(--blue)}

/* ── ARTIST GRID ── */
.a-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));
  gap:14px;margin-bottom:48px}
.a-card{background:var(--surf);border:1.5px solid var(--border);border-radius:20px;
  padding:22px;cursor:pointer;transition:all .25s cubic-bezier(.34,1.56,.64,1);
  position:relative;overflow:hidden;user-select:none}
.a-card::after{content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,var(--blue-l),transparent);
  opacity:0;transition:opacity .2s}
.a-card:hover{transform:translateY(-3px);box-shadow:var(--sh)}
.a-card:hover::after{opacity:1}
.a-card.sel{border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-l),var(--sh)}
.a-card.sel::after{opacity:1}
.a-card.disabled{opacity:.45;pointer-events:none}
.a-emoji{font-size:34px;width:58px;height:58px;background:var(--bg);
  border-radius:15px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.a-name{font-size:16px;font-weight:700;margin-bottom:3px;letter-spacing:-.2px}
.a-genre{font-size:12px;color:var(--blue);font-weight:600;margin-bottom:7px}
.a-desc{font-size:13px;color:var(--txt2);line-height:1.5}
.a-check{position:absolute;top:14px;right:14px;width:24px;height:24px;
  border-radius:50%;background:var(--blue);color:white;font-size:11px;
  display:flex;align-items:center;justify-content:center;
  transform:scale(0);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
.a-card.sel .a-check{transform:scale(1)}

/* ── PRICE GRID ── */
.p-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));
  gap:12px;margin-bottom:48px}
.p-card{background:var(--surf);border:1.5px solid var(--border);border-radius:16px;
  padding:20px 14px;text-align:center;cursor:pointer;
  transition:all .25s cubic-bezier(.34,1.56,.64,1);user-select:none}
.p-card:hover{transform:translateY(-2px);box-shadow:var(--sh-sm)}
.p-card.sel{border-color:var(--blue);background:var(--blue-l);
  box-shadow:0 0 0 3px var(--blue-l)}
.p-card.disabled{opacity:.45;pointer-events:none}
.p-amt{font-size:21px;font-weight:800;letter-spacing:-.5px;margin-bottom:3px}
.p-card.sel .p-amt{color:var(--blue)}
.p-cur{font-size:11px;color:var(--txt2);font-weight:600}

/* ── SUBMIT ── */
.submit-row{display:flex;justify-content:flex-end;margin-top:8px}
.btn-primary{padding:14px 34px;background:var(--blue);color:white;
  border:none;border-radius:var(--r-sm);font-size:15px;font-weight:700;
  cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:8px;
  font-family:var(--font)}
.btn-primary:hover{background:var(--blue-h);transform:translateY(-1px);
  box-shadow:0 8px 28px rgba(0,113,227,.32)}
.btn-primary:active{transform:translateY(0)}
.btn-primary:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}

/* ── SUCCESS ── */
.success{background:var(--surf);border:1px solid var(--border);border-radius:24px;
  padding:52px 40px;text-align:center;animation:slideUp .4s ease}
.s-icon{width:76px;height:76px;background:var(--green-l);border-radius:50%;
  display:flex;align-items:center;justify-content:center;font-size:34px;
  margin:0 auto 22px;animation:popIn .5s cubic-bezier(.34,1.56,.64,1) .15s both}
.s-title{font-size:26px;font-weight:800;margin-bottom:8px;letter-spacing:-.4px}
.s-sub{font-size:15px;color:var(--txt2);margin-bottom:28px;line-height:1.55}
.btn-ghost{padding:10px 22px;border-radius:10px;border:1.5px solid var(--border);
  background:var(--bg);cursor:pointer;font-size:14px;font-weight:600;
  color:var(--txt);transition:all .2s;font-family:var(--font)}
.btn-ghost:hover{background:var(--surf);box-shadow:var(--sh-sm)}

/* ── DASHBOARD ── */
.dash-head{display:flex;align-items:flex-start;justify-content:space-between;
  flex-wrap:wrap;gap:16px;margin-bottom:36px}
.live{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;
  background:var(--green-l);border-radius:20px;font-size:12px;font-weight:700;color:var(--green)}
.live-dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 1.5s infinite}
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));
  gap:14px;margin-bottom:36px}
.stat{background:var(--surf);border:1px solid var(--border);border-radius:20px;
  padding:22px;animation:fadeIn .4s ease}
.stat-lbl{font-size:13px;color:var(--txt2);font-weight:500;margin-bottom:8px}
.stat-val{font-size:34px;font-weight:800;letter-spacing:-1px}
.stat-val.blue{color:var(--blue)}
.stat-val.green{color:var(--green)}
.stat-val.sm{font-size:22px;padding-top:4px}

.tbl{background:var(--surf);border:1px solid var(--border);
  border-radius:20px;overflow:hidden;margin-bottom:20px}
.tbl-head{display:flex;align-items:center;justify-content:space-between;
  padding:18px 22px;border-bottom:1px solid var(--border)}
.tbl-title{font-size:15px;font-weight:700}
.tbl-sub{font-size:13px;color:var(--txt2)}
.tbl-row{display:flex;align-items:center;gap:14px;
  padding:14px 22px;border-bottom:1px solid var(--border);
  transition:background .15s}
.tbl-row:last-child{border-bottom:none}
.tbl-row:hover{background:var(--bg)}
.rank{width:28px;height:28px;border-radius:50%;background:var(--bg);
  font-size:12px;font-weight:700;display:flex;align-items:center;
  justify-content:center;color:var(--txt2);flex-shrink:0}
.rank.top{background:rgba(255,159,10,.12);color:var(--orange)}
.row-emoji{font-size:20px;flex-shrink:0}
.row-info{flex:1;min-width:0}
.row-name{font-size:14px;font-weight:700}
.row-sub{font-size:12px;color:var(--txt2)}
.bar-wrap{width:130px;flex-shrink:0}
.bar-track{height:6px;background:var(--bg);border-radius:3px;overflow:hidden}
.bar-fill{height:100%;border-radius:3px;
  background:linear-gradient(90deg,var(--blue),#5ac8fa);
  transition:width .8s cubic-bezier(.34,1.56,.64,1)}
.bar-fill.green{background:linear-gradient(90deg,var(--green),#34d399)}
.row-pct{font-size:13px;font-weight:700;color:var(--blue);
  min-width:56px;text-align:right;flex-shrink:0}
.row-pct.green{color:var(--green)}

.two{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px}

.voters-tbl{background:var(--surf);border:1px solid var(--border);
  border-radius:20px;overflow:hidden}
.v-row{display:flex;align-items:center;gap:12px;
  padding:13px 20px;border-bottom:1px solid var(--border);transition:background .15s}
.v-row:last-child{border-bottom:none}
.v-row:hover{background:var(--bg)}
.v-av{width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0}
.v-av-init{width:32px;height:32px;border-radius:50%;
  background:linear-gradient(135deg,#0071e3,#5ac8fa);
  color:white;font-size:11px;font-weight:700;
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.v-name{font-size:14px;font-weight:600;flex:1;min-width:0;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.v-tag{font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;
  background:var(--blue-l);color:var(--blue);flex-shrink:0;white-space:nowrap}
.v-price{font-size:12px;color:var(--txt2);flex-shrink:0;min-width:68px;text-align:right}
.v-time{font-size:11px;color:var(--txt3);flex-shrink:0;min-width:42px;text-align:right}

.empty{text-align:center;padding:64px 24px;color:var(--txt2)}
.empty-ic{font-size:42px;margin-bottom:14px}
.empty-t{font-size:17px;font-weight:700;color:var(--txt);margin-bottom:6px}
.empty-d{font-size:14px;line-height:1.55}

.export-btn{display:flex;align-items:center;gap:7px;padding:9px 16px;
  border:1px solid var(--border);border-radius:10px;font-size:13px;font-weight:600;
  background:var(--surf);color:var(--txt);cursor:pointer;transition:all .2s;font-family:var(--font)}
.export-btn:hover{background:var(--bg);box-shadow:var(--sh-sm)}

.error-bar{background:var(--red-l);border:1px solid rgba(255,59,48,.2);
  border-radius:var(--r-sm);padding:12px 16px;font-size:14px;font-weight:500;
  color:var(--red);margin-bottom:20px;display:flex;align-items:center;gap:8px}

/* ── TOAST ── */
.toast{position:fixed;bottom:24px;left:50%;
  transform:translateX(-50%) translateY(80px);
  background:rgba(28,28,30,0.94);color:white;
  padding:12px 20px;border-radius:12px;font-size:14px;font-weight:500;
  backdrop-filter:blur(20px);box-shadow:var(--sh-lg);
  transition:transform .3s cubic-bezier(.34,1.56,.64,1);z-index:1000;white-space:nowrap}
.toast.on{transform:translateX(-50%) translateY(0)}

/* ── ANIMATIONS ── */
@keyframes slideUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes popIn{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}

/* ── RESPONSIVE ── */
@media(max-width:768px){
  .auth-card{padding:36px 26px}
  .page{padding:24px 16px 64px}
  .a-grid{grid-template-columns:1fr 1fr;gap:10px}
  .a-card{padding:16px}
  .p-grid{grid-template-columns:repeat(3,1fr);gap:8px}
  .p-card{padding:15px 10px}
  .p-amt{font-size:17px}
  .two{grid-template-columns:1fr}
  .bar-wrap{display:none}
  .nav{padding:0 14px}
  .tab{padding:5px 10px;font-size:12px}
  .stats{grid-template-columns:1fr 1fr}
  .submit-row{justify-content:stretch}
  .btn-primary{width:100%;justify-content:center}
  .dash-head{flex-direction:column;gap:10px}
}
@media(max-width:480px){
  .a-grid{grid-template-columns:1fr}
  .p-grid{grid-template-columns:repeat(2,1fr)}
  .stats{grid-template-columns:1fr}
  .user-chip span{display:none}
}
`;

// ─── GOOGLE SVG ───────────────────────────────────────────────────────────────
const GIcon = () => (
  <svg className="g-icon" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// ─── TOAST HOOK ───────────────────────────────────────────────────────────────
function useToast() {
  const [state, setState] = useState({ on: false, msg: '' });
  const timer = useRef(null);
  const show = useCallback((msg) => {
    setState({ on: true, msg });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState({ on: false, msg: '' }), 2800);
  }, []);
  return [state, show];
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState('vote');
  const [votes, setVotes] = useState([]);
  const [authErr, setAuthErr] = useState('');
  const [toast, showToast] = useToast();

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Handle redirect result (mobile fallback)
    getRedirectResult(auth).catch(() => {});

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'admins', u.uid));
        setIsAdmin(snap.exists());
      } else {
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  // ── Firestore live listener (admin only) ───────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'votes'));
    const unsub = onSnapshot(q, (snap) => {
      setVotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [isAdmin]);

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  const signIn = async () => {
    setAuthErr('');
    try {
      // Popup d'abord, redirect comme fallback (mobile)
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/popup-closed-by-user'
      ) {
        try {
          await signInWithRedirect(auth, provider);
        } catch (e) {
          setAuthErr(
            'Connexion échouée. Vérifie que les popups ne sont pas bloqués.'
          );
        }
      } else if (err.code !== 'auth/cancelled-popup-request') {
        setAuthErr('Erreur de connexion : ' + err.message);
      }
    }
  };

  const signOutUser = () => {
    signOut(auth);
    setTab('vote');
    showToast('Déconnecté avec succès');
  };

  // ── Soumettre un vote ──────────────────────────────────────────────────────
  const submitVote = async (data) => {
    try {
      await setDoc(doc(db, 'votes', user.uid), {
        ...data,
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        userPhoto: user.photoURL || null,
        timestamp: serverTimestamp(),
      });
      showToast('Vote enregistré ✓');
    } catch (e) {
      showToast('Erreur : ' + e.message);
      throw e;
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (user === undefined)
    return (
      <>
        <style>{css}</style>
        <div className="loader-wrap">
          <div className="spinner" />
          <div className="loader-txt">Chargement…</div>
        </div>
      </>
    );

  // ── Auth screen ────────────────────────────────────────────────────────────
  if (!user)
    return (
      <>
        <style>{css}</style>
        <div className="auth">
          <div className="auth-card">
            <div className="auth-logo">🎪</div>
            <h1 className="auth-title">Votez pour l'événement</h1>
            <p className="auth-sub">
              Choisissez vos artistes préférés et le prix du ticket idéal.
              Connexion sécurisée via Google.
            </p>
            {authErr && <div className="error-bar">⚠ {authErr}</div>}
            <button className="g-btn" onClick={signIn}>
              <GIcon /> Continuer avec Google
            </button>
            <p className="auth-note">
              Votre vote est unique et sécurisé. Vos données ne sont utilisées
              qu'à des fins de sondage.
            </p>
          </div>
        </div>
        <Toast {...toast} />
      </>
    );

  // ── Authenticated ──────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <Nav
        user={user}
        isAdmin={isAdmin}
        tab={tab}
        setTab={setTab}
        onSignOut={signOutUser}
      />
      {isAdmin && tab === 'dashboard' ? (
        <Dashboard votes={votes} />
      ) : (
        <VotePage
          user={user}
          isAdmin={isAdmin}
          onSubmit={submitVote}
          showToast={showToast}
        />
      )}
      <Toast {...toast} />
    </>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Nav({ user, isAdmin, tab, setTab, onSignOut }) {
  const initials =
    user.displayName
      ?.split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('') || '?';
  return (
    <nav className="nav">
      <div className="nav-brand">
        <div className="nav-icon">🎪</div>
        EventVote
      </div>
      <div className="nav-right">
        {isAdmin && (
          <div className="tabs">
            <button
              className={`tab ${tab === 'vote' ? 'on' : ''}`}
              onClick={() => setTab('vote')}
            >
              Voter
            </button>
            <button
              className={`tab ${tab === 'dashboard' ? 'on' : ''}`}
              onClick={() => setTab('dashboard')}
            >
              Dashboard
            </button>
          </div>
        )}
        <div className="user-chip">
          {user.photoURL ? (
            <img src={user.photoURL} className="avatar" alt="" />
          ) : (
            <div className={`avatar-init ${isAdmin ? 'admin' : ''}`}>
              {initials}
            </div>
          )}
          <span>{user.displayName?.split(' ')[0]}</span>
        </div>
        <button className="sign-out" onClick={onSignOut}>
          Quitter
        </button>
      </div>
    </nav>
  );
}

// ─── VOTE PAGE ────────────────────────────────────────────────────────────────
function VotePage({ user, isAdmin, onSubmit, showToast }) {
  const [sel, setSel] = useState(null);
  const [price, setPrice] = useState(null);
  const [existing, setExisting] = useState(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'votes', user.uid)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setExisting(d);
        setSel(d.artistId);
        setPrice(d.price);
        setDone(true);
      }
      setLoading(false);
    });
  }, [user.uid]);

  const handleSubmit = async () => {
    if (!sel || !price) {
      showToast('Choisis un artiste et un prix !');
      return;
    }
    setSaving(true);
    try {
      const artist = ARTISTS.find((a) => a.id === sel);
      await onSubmit({ artistId: sel, artistName: artist.name, price });
      setExisting({ artistId: sel, artistName: artist.name, price });
      setDone(true);
    } catch {}
    setSaving(false);
  };

  if (loading)
    return (
      <div className="loader-wrap">
        <div className="spinner" />
        <div className="loader-txt">Chargement de ton vote…</div>
      </div>
    );

  if (done && existing) {
    const artist = ARTISTS.find((a) => a.id === existing.artistId);
    return (
      <div className="page">
        <div className="success">
          <div className="s-icon">✓</div>
          <h2 className="s-title">Vote enregistré !</h2>
          <p className="s-sub">
            Tu as voté pour <strong>{artist?.name}</strong> avec un ticket à{' '}
            <strong>{existing.price?.toLocaleString('fr-TG')} FCFA</strong>
          </p>
          <button className="btn-ghost" onClick={() => setDone(false)}>
            Modifier mon vote
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="hero">
        <p className="eyebrow">Sondage participants</p>
        <h1 className="h1">
          Qui voulez-vous voir <span>sur scène ?</span>
        </h1>
        <p className="lead">
          Votre voix compte. Choisissez l'artiste et le prix du ticket qui vous
          convient le mieux.
        </p>
      </div>

      <div className="sec-head">
        Choisissez un artiste{' '}
        <span className="badge">{ARTISTS.length} options</span>
      </div>
      <div className="a-grid">
        {ARTISTS.map((a) => (
          <div
            key={a.id}
            className={`a-card ${sel === a.id ? 'sel' : ''} ${
              saving ? 'disabled' : ''
            }`}
            onClick={() => !saving && setSel(a.id)}
          >
            <div className="a-emoji">{a.img}</div>
            <div className="a-name">{a.name}</div>
            <div className="a-genre">{a.genre}</div>
            <div className="a-desc">{a.desc}</div>
            <div className="a-check">✓</div>
          </div>
        ))}
      </div>

      <div className="sec-head">
        Prix du ticket <span className="badge">FCFA</span>
      </div>
      <div className="p-grid">
        {PRICES.map((p) => (
          <div
            key={p}
            className={`p-card ${price === p ? 'sel' : ''} ${
              saving ? 'disabled' : ''
            }`}
            onClick={() => !saving && setPrice(p)}
          >
            <div className="p-amt">{p.toLocaleString('fr-TG')}</div>
            <div className="p-cur">Francs CFA</div>
          </div>
        ))}
      </div>

      <div className="submit-row">
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!sel || !price || saving}
        >
          {saving ? 'Enregistrement…' : 'Soumettre mon vote →'}
        </button>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function Dashboard({ votes }) {
  const total = votes.length;

  const artistData = ARTISTS.map((a) => ({
    ...a,
    count: votes.filter((v) => v.artistId === a.id).length,
    pct: total
      ? Math.round(
          (votes.filter((v) => v.artistId === a.id).length / total) * 100
        )
      : 0,
  })).sort((a, b) => b.count - a.count);

  const priceData = PRICES.map((p) => ({
    price: p,
    count: votes.filter((v) => v.price === p).length,
    pct: total
      ? Math.round((votes.filter((v) => v.price === p).length / total) * 100)
      : 0,
  })).sort((a, b) => b.count - a.count);

  const avgPrice = total
    ? Math.round(votes.reduce((s, v) => s + (v.price || 0), 0) / total)
    : 0;
  const top = artistData[0];
  const topP = priceData[0];

  const exportCSV = () => {
    const rows = [['Nom', 'Email', 'Artiste', 'Prix (FCFA)', 'Date']];
    votes.forEach((v) =>
      rows.push([
        v.userName,
        v.userEmail,
        v.artistName,
        v.price,
        v.timestamp?.toDate?.().toLocaleString('fr-TG') || '',
      ])
    );
    const a = document.createElement('a');
    a.href =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(rows.map((r) => r.join(',')).join('\n'));
    a.download = 'votes_evenement.csv';
    a.click();
  };

  return (
    <div className="page">
      <div className="dash-head">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="h1" style={{ fontSize: 'clamp(24px,4vw,36px)' }}>
            Résultats <span>en temps réel</span>
          </h1>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingTop: 6,
          }}
        >
          <div className="live">
            <div className="live-dot" />
            Live
          </div>
          <button className="export-btn" onClick={exportCSV}>
            ⬇ CSV
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-lbl">🗳 Total votes</div>
          <div className="stat-val blue">{total}</div>
        </div>
        <div className="stat">
          <div className="stat-lbl">🏆 Artiste favori</div>
          <div className="stat-val sm">{top?.count > 0 ? top.name : '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-lbl">💰 Prix favori</div>
          <div className="stat-val green sm">
            {topP?.count > 0 ? `${topP.price.toLocaleString()} FCFA` : '—'}
          </div>
        </div>
        <div className="stat">
          <div className="stat-lbl">📊 Prix moyen</div>
          <div className="stat-val sm">
            {avgPrice > 0 ? `${avgPrice.toLocaleString()} FCFA` : '—'}
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="empty">
          <div className="empty-ic">📭</div>
          <div className="empty-t">Aucun vote pour l'instant</div>
          <div className="empty-d">
            Les résultats s'afficheront ici dès que les participants
            commenceront à voter.
          </div>
        </div>
      ) : (
        <>
          <div className="two">
            <div className="tbl">
              <div className="tbl-head">
                <div className="tbl-title">🎤 Artistes</div>
                <div className="tbl-sub">
                  {total} vote{total > 1 ? 's' : ''}
                </div>
              </div>
              {artistData
                .filter((a) => a.count > 0)
                .map((a, i) => (
                  <div key={a.id} className="tbl-row">
                    <div className={`rank ${i === 0 ? 'top' : ''}`}>
                      {i === 0 ? '🥇' : i + 1}
                    </div>
                    <div className="row-emoji">{a.img}</div>
                    <div className="row-info">
                      <div className="row-name">{a.name}</div>
                      <div className="row-sub">{a.genre}</div>
                    </div>
                    <div className="bar-wrap">
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${a.pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="row-pct">
                      {a.count} ({a.pct}%)
                    </div>
                  </div>
                ))}
            </div>

            <div className="tbl">
              <div className="tbl-head">
                <div className="tbl-title">💵 Prix du ticket</div>
              </div>
              {priceData.map((p, i) => (
                <div key={p.price} className="tbl-row">
                  <div className={`rank ${i === 0 ? 'top' : ''}`}>
                    {i === 0 ? '🥇' : i + 1}
                  </div>
                  <div className="row-info">
                    <div className="row-name">
                      {p.price.toLocaleString()} FCFA
                    </div>
                  </div>
                  <div className="bar-wrap">
                    <div className="bar-track">
                      <div
                        className="bar-fill green"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="row-pct green">
                    {p.count} ({p.pct}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sec-head">
            Participants <span className="badge">{total}</span>
          </div>
          <div className="voters-tbl">
            {[...votes]
              .sort(
                (a, b) =>
                  (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
              )
              .map((v, i) => (
                <div key={v.id || i} className="v-row">
                  {v.userPhoto ? (
                    <img src={v.userPhoto} className="v-av" alt="" />
                  ) : (
                    <div className="v-av-init">
                      {v.userName
                        ?.split(' ')
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join('') || '?'}
                    </div>
                  )}
                  <div className="v-name">{v.userName}</div>
                  <div className="v-tag">{v.artistName}</div>
                  <div className="v-price">
                    {v.price?.toLocaleString()} FCFA
                  </div>
                  <div className="v-time">
                    {v.timestamp?.toDate?.()
                      ? v.timestamp
                          .toDate()
                          .toLocaleTimeString('fr-TG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                      : '—'}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ on, msg }) {
  return <div className={`toast ${on ? 'on' : ''}`}>{msg}</div>;
}
