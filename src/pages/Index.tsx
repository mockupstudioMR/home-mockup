import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Palette, Home, Package, LogOut, User, ArrowRight } from "lucide-react";
import AccountNameDialog from "@/components/AccountNameDialog";
import heroBg from "@/assets/hero-bg.jpg";
import "@/journey/mu.css";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleEntryClick = (path: string) => {
    if (user) {
      navigate(path);
    } else {
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="mu app">
      <div className="blob" />
      <div className="blob2" />
      <header className="top">
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
          <span className="brand-mark">
            <Home className="ic" />
          </span>
          Home Mockup
        </a>
        <div style={{ flex: "1 1 auto" }} />
        <div className="top-actions">
          <button type="button" className="link-btn" onClick={() => navigate("/b2b-solutions")}>
            For business
          </button>
          {user ? (
            <>
              <button type="button" className="link-btn" onClick={() => navigate("/gallery")}>
                <User className="ic" style={{ width: 18, height: 18 }} />
                My HomeMockUps
              </button>
              <AccountNameDialog compact />
              <button type="button" className="link-btn" onClick={handleSignOut}>
                <LogOut className="ic" style={{ width: 18, height: 18 }} />
                Sign out
              </button>
            </>
          ) : (
            <button type="button" className="link-btn" onClick={() => navigate("/auth")}>
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="wrap" style={{ maxWidth: "1180px" }}>
        <p className="eyebrow">Where you lead. Technology supports.</p>
        <h1 className="h1">
          Live individually.
          <br />
          <span style={{ color: "var(--plum)" }}>Design beautifully.</span>
        </h1>
        <p className="sub">
          Start with inspiration — a quiz, a piece you love, or your own space. Explore and refine your design in real
          time, at your pace, down to every detail.
        </p>
        <p className="script" style={{ marginTop: "14px" }}>your creativity leads, technology keeps up</p>
        <div className="row" style={{ justifyContent: "center", marginTop: "32px", gap: "14px" }}>
          <button type="button" className="btn auto" onClick={() => handleEntryClick("/choose-path")}>
            Get started
            <ArrowRight className="ic" style={{ width: 20, height: 20 }} />
          </button>
          {user && (
            <button type="button" className="btn ghost auto" onClick={() => navigate("/gallery")}>
              View my HomeMockUps
            </button>
          )}
        </div>

        <div
          className="ph"
          style={{ marginTop: "56px", aspectRatio: "16 / 7", borderRadius: "28px", boxShadow: "0 40px 80px -48px rgba(52,32,59,.45)" }}
        >
          <img className="img" src={heroBg} alt="A finished living room designed with Home Mockup" style={{ borderRadius: "28px" }} />
        </div>

        <div className="g3" style={{ marginTop: "56px" }}>
          {[
            { tone: "a", icon: <Palette className="ic" />, t: "Find your style", d: "Photos you love or a short quiz become one clear direction." },
            { tone: "b", icon: <Home className="ic" />, t: "Fit your real room", d: "Upload a floor plan; layouts respect your doors, windows and walls." },
            { tone: "c", icon: <Package className="ic" />, t: "Buy with confidence", d: "A buying list with sizes that fit, from shops you choose." },
          ].map((f) => (
            <div key={f.t} className={`opt short ${f.tone}`} style={{ cursor: "default", minHeight: 0, padding: "36px 28px" }}>
              <span className="tile sm">{f.icon}</span>
              <span className="opt-t" style={{ fontSize: "24px" }}>{f.t}</span>
              <span className="opt-d">{f.d}</span>
            </div>
          ))}
        </div>

        <section className="panel tint" style={{ marginTop: "56px" }}>
          <div className="row between" style={{ gap: "24px" }}>
            <div className="stack" style={{ gap: "6px", maxWidth: "620px" }}>
              <h2 className="h3">Are you a professional?</h2>
              <p className="p">Furniture shops, designers and real estate — grow your business with AI-powered design tools.</p>
            </div>
            <button type="button" className="btn auto" onClick={() => navigate("/b2b-solutions")}>
              Sign up as a business
              <ArrowRight className="ic" style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </section>

        <p className="small" style={{ textAlign: "center", marginTop: "40px" }}>Powered by AI · Create beautiful spaces effortlessly</p>
      </main>
    </div>
  );
};

export default Index;