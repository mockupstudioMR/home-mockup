import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Briefcase, Check, Home } from "lucide-react";
import Logo from "@/components/Logo";
import "@/journey/mu.css";

/** First screen after "Get started": the design canvas's "Who are you?" in the warm modern look. */
const ChoosePath = () => {
  const navigate = useNavigate();

  const options = [
    {
      id: "end-user",
      tone: "a",
      icon: <Home className="ic" />,
      title: "I'm designing my home",
      description: "Plan a room from first idea to a buying list and install checklist.",
      // Straight to the journey: going through /start loaded a second page only to redirect.
      path: "/journey",
      sel: true,
    },
    {
      id: "professional",
      tone: "b",
      icon: <Briefcase className="ic" />,
      title: "I'm a professional",
      description: "Furniture shops, designers and real estate — grow your business with AI tools.",
      path: "/start?as=pro",
      sel: false,
    },
  ];

  return (
    <div className="mu app">
      <div className="blob" />
      <div className="blob2" />
      <header className="top">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Logo size={34} />
          </span>
          Home Mockup
        </Link>
      </header>
      <main className="wrap" style={{ maxWidth: "1000px" }}>
        <p className="eyebrow">Before we begin</p>
        <h1 className="h1">Who are you?</h1>
        <p className="sub">We'll shape the experience around what you're here to do.</p>
        <div className="g2">
          {options.map((o) => (
            <button key={o.id} type="button" className={`opt ${o.tone}${o.sel ? " sel" : ""}`} onClick={() => navigate(o.path)}>
              {o.sel && (
                <span className="check">
                  <Check className="ic" />
                </span>
              )}
              <span className="tile">{o.icon}</span>
              <span className="opt-t">{o.title}</span>
              <span className="opt-d">{o.description}</span>
              <span className="opt-cta">
                Continue <ArrowRight className="ic" style={{ width: 20, height: 20 }} />
              </span>
            </button>
          ))}
        </div>
        <p className="small" style={{ textAlign: "center", marginTop: "36px" }}>
          You can switch later from your profile.
        </p>
      </main>
    </div>
  );
};

export default ChoosePath;
