import { useEffect, useState, useCallback } from "react";


const Index = () => {
  const [blinking, setBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [idleOffset, setIdleOffset] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [textVisible, setTextVisible] = useState(false);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);

  // Derived: button is disabled when listening or speaking
  const buttonDisabled = busy || listening || speaking;

  // Blink every 3-5 seconds
  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    };
    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Expose speaking control via window for external scripts
  useEffect(() => {
    (window as any).bmoSpeak = (text: string) => {
      setSpokenText(text);
      setSpeaking(true);
      setTextVisible(true);
      setListening(false);
      setBusy(true);
    };
    (window as any).bmoStopSpeaking = () => {
      setSpeaking(false);
      setTextVisible(false);
      setSpokenText("");
      setListening(false);
      setBusy(false);
    };
    (window as any).bmoStartListening = () => {
      setListening(true);
      setSpeaking(true);
      setTextVisible(false);
      setSpokenText("");
      setBusy(true);
    };
    (window as any).bmoShowUserSpeech = (text: string) => {
      setSpokenText(text);
      setTextVisible(true);
    };
    return () => {
      delete (window as any).bmoSpeak;
      delete (window as any).bmoStopSpeaking;
      delete (window as any).bmoStartListening;
      delete (window as any).bmoShowUserSpeech;
    };
  }, []);

  const handleRedButtonClick = useCallback(() => {
    if (buttonDisabled) return;
    // Trigger external listening start if defined
    if ((window as any).onBmoButtonPress) {
      (window as any).onBmoButtonPress();
    }
  }, [buttonDisabled]);

  // Mouth animation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 2000 + Math.random() * 1500);
    return () => clearInterval(interval);
  }, []);

  // Subtle idle bob
  useEffect(() => {
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.02;
      setIdleOffset(Math.sin(t) * 3);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#7ccdb5" }}
    >
      {/* BMO Body */}
      <div
        className="relative flex flex-col items-center"
        style={{
          width: "min(85vw, 380px)",
          padding: "clamp(14px, 4vw, 24px)",
          backgroundColor: "#7ccdb5",
          borderRadius: "clamp(24px, 6vw, 40px)",
          border: "3px solid #5faa93",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          transform: `translateY(${idleOffset}px)`,
          transition: "transform 0.1s linear",
        }}
      >
        {/* Screen */}
        <div
          className="relative w-full flex items-center justify-center"
          style={{
            aspectRatio: "5 / 3.5",
            backgroundColor: "#d0dfca",
            borderRadius: "clamp(14px, 4vw, 24px)",
            border: "3px solid rgba(60,90,75,0.3)",
            boxShadow: "inset 0 3px 12px rgba(0,0,0,0.05)",
          }}
        >
          {/* Face mode */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: speaking ? 0 : 1,
              transition: "opacity 0.4s ease",
              pointerEvents: speaking ? "none" : "auto",
            }}
          >
            <div className="flex flex-col items-center" style={{ gap: "clamp(6px, 2vw, 12px)", marginTop: "-4%" }}>
              {/* Eyes */}
              <div className="flex items-center" style={{ gap: "clamp(16px, 5vw, 30px)" }}>
                <div
                  style={{
                    width: "clamp(12px, 4vw, 22px)",
                    height: blinking ? "3px" : "clamp(12px, 4vw, 22px)",
                    backgroundColor: "#2a2a3d",
                    borderRadius: blinking ? "2px" : "3px",
                    transition: "height 0.08s ease",
                  }}
                />
                <div
                  style={{
                    width: "clamp(12px, 4vw, 22px)",
                    height: blinking ? "3px" : "clamp(12px, 4vw, 22px)",
                    backgroundColor: "#2a2a3d",
                    borderRadius: blinking ? "2px" : "3px",
                    transition: "height 0.08s ease",
                  }}
                />
              </div>
              {/* Mouth */}
              <div
                style={{
                  width: "clamp(22px, 7vw, 38px)",
                  height: mouthOpen ? "clamp(10px, 3vw, 16px)" : "clamp(3px, 1vw, 5px)",
                  backgroundColor: "#2a2a3d",
                  borderRadius: mouthOpen ? "0 0 50% 50%" : "2px",
                  transition: "all 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Text mode (speaking/listening) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: textVisible ? 1 : 0,
              transition: "opacity 0.4s ease",
              pointerEvents: speaking ? "auto" : "none",
              padding: "clamp(16px, 5vw, 28px)",
              overflow: "hidden",
            }}
          >
            <p
              style={{
                color: "#2a2a3d",
                fontSize: "clamp(13px, 3.5vw, 18px)",
                fontFamily: "'Courier New', monospace",
                textAlign: "center",
                lineHeight: 1.5,
                letterSpacing: "0.02em",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                maxWidth: "100%",
              }}
            >
              {spokenText}
            </p>
          </div>
        </div>

        {/* Speaker bar + blue dot */}
        <div className="w-full flex items-center mt-[4%] px-[8%]" style={{ gap: "6%" }}>
          <div
            className="flex-1"
            style={{
              height: "clamp(7px, 2vw, 12px)",
              backgroundColor: "#6aac96",
              borderRadius: "6px",
            }}
          />
          <div
            style={{
              width: "clamp(10px, 3vw, 16px)",
              height: "clamp(10px, 3vw, 16px)",
              backgroundColor: "#7a9ad4",
              borderRadius: "50%",
              border: "2px solid #6284b8",
            }}
          />
        </div>

        {/* Controls area */}
        <div className="w-full flex items-start justify-between mt-[5%] px-[10%]">
          {/* D-Pad */}
          <div className="relative" style={{ width: "clamp(42px, 13vw, 72px)", height: "clamp(42px, 13vw, 72px)" }}>
            <div
              className="absolute top-1/2 left-0 w-full -translate-y-1/2"
              style={{
                height: "33%",
                backgroundColor: "#ddc64e",
                borderRadius: "5px",
              }}
            />
            <div
              className="absolute left-1/2 top-0 h-full -translate-x-1/2"
              style={{
                width: "33%",
                backgroundColor: "#ddc64e",
                borderRadius: "5px",
              }}
            />
          </div>

          {/* Right buttons */}
          <div className="flex flex-col items-center" style={{ gap: "clamp(6px, 2vw, 12px)" }}>
            <div className="flex items-center" style={{ gap: "clamp(10px, 3vw, 20px)" }}>
              {/* Triangle button */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "clamp(6px, 2vw, 11px) solid transparent",
                  borderRight: "clamp(6px, 2vw, 11px) solid transparent",
                  borderBottom: "clamp(11px, 3.5vw, 19px) solid #8dcde0",
                }}
              />
              {/* Small green circle */}
              <div
                style={{
                  width: "clamp(12px, 3.5vw, 20px)",
                  height: "clamp(12px, 3.5vw, 20px)",
                  backgroundColor: "#b5de5a",
                  borderRadius: "50%",
                  border: "2px solid #8fb84a",
                }}
              />
            </div>
            {/* Big pink button */}
            <div
              onClick={handleRedButtonClick}
              role="button"
              tabIndex={0}
              style={{
                width: "clamp(30px, 9vw, 48px)",
                height: "clamp(30px, 9vw, 48px)",
                backgroundColor: "#f28da0",
                borderRadius: "50%",
                border: "2px solid #d4748a",
                boxShadow: listening
                  ? "0 0 12px 4px rgba(242,141,160,0.5)"
                  : "0 2px 6px rgba(0,0,0,0.08)",
                transform: listening ? "scale(1.1)" : "scale(1)",
                transition: "box-shadow 0.3s ease, transform 0.2s ease",
                cursor: buttonDisabled ? "not-allowed" : "pointer",
                opacity: buttonDisabled && !listening ? 0.6 : 1,
              }}
            />
          </div>
        </div>

        {/* Bottom dashes */}
        <div className="flex mt-[4%]" style={{ gap: "clamp(5px, 1.5vw, 10px)" }}>
          <div
            style={{
              width: "clamp(16px, 5vw, 28px)",
              height: "clamp(4px, 1.2vw, 7px)",
              backgroundColor: "#7a9ad4",
              borderRadius: "4px",
            }}
          />
          <div
            style={{
              width: "clamp(16px, 5vw, 28px)",
              height: "clamp(4px, 1.2vw, 7px)",
              backgroundColor: "#7a9ad4",
              borderRadius: "4px",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
