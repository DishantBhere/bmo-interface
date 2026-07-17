import { useEffect, useState, useCallback, useRef, useMemo } from "react";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type Emotion =
  | "happy"
  | "sleepy"
  | "surprised"
  | "confused"
  | "excited"
  | "neutral"
  | "talking";

// ============ BMO Face (SVG) ============
const BmoFace = ({
  emotion,
  blinking,
  eyeOffset,
  talkingOpen,
}: {
  emotion: Emotion;
  blinking: boolean;
  eyeOffset: { x: number; y: number };
  talkingOpen: boolean;
}) => {
  // viewBox coordinates
  const leftEyeCx = 34;
  const rightEyeCx = 66;
  const eyeCy = 40;
  const ox = eyeOffset.x;
  const oy = eyeOffset.y;

  const renderEye = (cx: number, side: "left" | "right") => {
    if (blinking) {
      return (
        <rect
          x={cx - 8 + ox}
          y={eyeCy - 1 + oy}
          width={16}
          height={2.5}
          rx={1.2}
          fill="#2a2a3d"
        />
      );
    }
    switch (emotion) {
      case "happy":
        // curved-up arc (^)
        return (
          <path
            d={`M ${cx - 8 + ox} ${eyeCy + 4 + oy} Q ${cx + ox} ${eyeCy - 8 + oy} ${cx + 8 + ox} ${eyeCy + 4 + oy}`}
            stroke="#2a2a3d"
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
        );
      case "sleepy":
        return (
          <rect
            x={cx - 8 + ox}
            y={eyeCy - 1 + oy}
            width={16}
            height={2.5}
            rx={1.2}
            fill="#2a2a3d"
          />
        );
      case "surprised":
        return (
          <circle
            cx={cx + ox}
            cy={eyeCy + oy}
            r={8}
            fill="none"
            stroke="#2a2a3d"
            strokeWidth={2.5}
          />
        );
      case "confused": {
        const isSmall = side === "right";
        const size = isSmall ? 10 : 14;
        const rot = isSmall ? 15 : 0;
        return (
          <rect
            x={cx - size / 2 + ox}
            y={eyeCy - size / 2 + oy}
            width={size}
            height={size}
            rx={2}
            fill="#2a2a3d"
            transform={`rotate(${rot} ${cx + ox} ${eyeCy + oy})`}
          />
        );
      }
      case "excited":
        return (
          <circle cx={cx + ox} cy={eyeCy + oy} r={9} fill="#2a2a3d" />
        );
      case "talking":
      case "neutral":
      default:
        return (
          <rect
            x={cx - 7 + ox}
            y={eyeCy - 7 + oy}
            width={14}
            height={14}
            rx={2.5}
            fill="#2a2a3d"
          />
        );
    }
  };

  const renderMouth = () => {
    switch (emotion) {
      case "happy":
        return (
          <path
            d="M 38 66 Q 50 76 62 66"
            stroke="#2a2a3d"
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
        );
      case "sleepy":
        return <circle cx={50} cy={68} r={2} fill="#2a2a3d" />;
      case "surprised":
        return (
          <ellipse cx={50} cy={68} rx={5} ry={6} fill="none" stroke="#2a2a3d" strokeWidth={2.5} />
        );
      case "confused":
        return (
          <path
            d="M 40 68 Q 44 64 48 68 T 56 68 T 62 68"
            stroke="#2a2a3d"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
          />
        );
      case "excited":
        return (
          <path
            d="M 36 62 Q 50 78 64 62 Q 50 72 36 62 Z"
            fill="#2a2a3d"
          />
        );
      case "talking":
        return talkingOpen ? (
          <ellipse cx={50} cy={68} rx={7} ry={4.5} fill="#2a2a3d" />
        ) : (
          <rect x={44} y={67} width={12} height={2.5} rx={1.2} fill="#2a2a3d" />
        );
      case "neutral":
      default:
        return <rect x={44} y={67} width={12} height={2.5} rx={1.2} fill="#2a2a3d" />;
    }
  };

  return (
    <svg
      viewBox="0 0 100 90"
      style={{ width: "62%", maxWidth: 220, overflow: "visible" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <g style={{ transition: "opacity 200ms ease" }}>
        {renderEye(leftEyeCx, "left")}
        {renderEye(rightEyeCx, "right")}
        {renderMouth()}
      </g>
    </svg>
  );
};

const Index = () => {
  const [blinking, setBlinking] = useState(false);
  const [greenPressed, setGreenPressed] = useState(false);
  const [pinkPressed, setPinkPressed] = useState(false);
  const [talkingOpen, setTalkingOpen] = useState(false);
  const [idleOffset, setIdleOffset] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [textVisible, setTextVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [emotion, setEmotion] = useState<Emotion>("neutral");
  const [dpadPressed, setDpadPressed] = useState(false);
  const [trianglePressed, setTrianglePressed] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [conversationHistory, setConversationHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >(() => {
    try {
      const saved = localStorage.getItem("bmo-conversation");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [chatBarVisible, setChatBarVisible] = useState(true);
  const [chatBarAnimating, setChatBarAnimating] = useState(false);
  const chatBarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  // Eye tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!screenRef.current) return;
      const rect = screenRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 400;
      const intensity = Math.min(1, dist / maxDist);
      const max = 3 + intensity * 3;
      const factor = Math.min(max / (dist || 1), 0.02);
      setEyeOffset({ x: dx * factor, y: dy * factor });
    };
    const handleMouseLeave = () => setEyeOffset({ x: 0, y: 0 });
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const activeEyeOffset = speaking || busy ? { x: 0, y: 0 } : eyeOffset;

  // Parse & strip emotion tag
  const stripEmotion = (text: string) =>
    text
      .replace(/\n?\s*\[emotion:\s*[^\]]*\]\s*$/i, "")
      .replace(/\n?\s*\[emotion:?[^\]]*$/i, "")
      .trimEnd();

  const parseEmotion = (text: string): Emotion | null => {
    const m = text.match(/\[emotion:\s*(happy|sleepy|surprised|confused|excited|neutral)\s*\]/i);
    return m ? (m[1].toLowerCase() as Emotion) : null;
  };

  // Stream AI response
  const streamAIResponse = useCallback(
    async (messages: { role: "user" | "assistant"; content: string }[]) => {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get AI response");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) fullResponse += content;
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) fullResponse += content;
          } catch {
            /* ignore */
          }
        }
      }

      const parsedEmotion = parseEmotion(fullResponse);
      return { text: stripEmotion(fullResponse), emotion: parsedEmotion };
    },
    []
  );

  const saveConversation = useCallback(
    (history: { role: "user" | "assistant"; content: string }[]) => {
      try {
        localStorage.setItem("bmo-conversation", JSON.stringify(history));
      } catch {
        /* ignore */
      }
    },
    []
  );

  const createUtterance = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const friendly =
      voices.find((v) => /samantha|karen|fiona|victoria|zira/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith("en") && /female/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];
    if (friendly) utterance.voice = friendly;
    utterance.pitch = 1.15;
    utterance.rate = 0.92;
    return utterance;
  }, []);

  const handleResponse = useCallback(
    async (userText: string) => {
      if (busy) return;
      const token = { cancelled: false };
      typingRef.current = token;
      setBusy(true);
      setThinking(true);
      setTextVisible(false);
      setSpokenText("");

      const userMsg = { role: "user" as const, content: userText };
      const newHistory = [...conversationHistory, userMsg];
      setConversationHistory(newHistory);

      try {
        const { text: aiResponse, emotion: parsedEmotion } = await streamAIResponse(newHistory);
        if (token.cancelled) return;

        const assistantMsg = { role: "assistant" as const, content: aiResponse };
        const updatedHistory = [...newHistory, assistantMsg];
        setConversationHistory(updatedHistory);
        saveConversation(updatedHistory);

        setThinking(false);
        setSpeaking(true);
        setTextVisible(true);
        if (parsedEmotion) setEmotion(parsedEmotion);
        setSpokenText(aiResponse);

        window.speechSynthesis.cancel();
        const utterance = createUtterance(aiResponse);
        synthRef.current = utterance;
        const finish = () => {
          setSpeaking(false);
          setTextVisible(false);
          setSpokenText("");
          setBusy(false);
          setEmotion("neutral");
          synthRef.current = null;
        };
        utterance.onend = finish;
        utterance.onerror = finish;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        if (token.cancelled) return;
        console.error("AI error:", err);
        const fallback = "Oh no! BMO's brain got a little fuzzy. Try again?";
        setThinking(false);
        setSpeaking(true);
        setTextVisible(true);
        setEmotion("confused");
        setSpokenText(fallback);
        window.speechSynthesis.cancel();
        const utterance = createUtterance(fallback);
        synthRef.current = utterance;
        const finish = () => {
          setSpeaking(false);
          setTextVisible(false);
          setSpokenText("");
          setBusy(false);
          setEmotion("neutral");
          synthRef.current = null;
        };
        utterance.onend = finish;
        utterance.onerror = finish;
        window.speechSynthesis.speak(utterance);
      }
    },
    [busy, conversationHistory, streamAIResponse, createUtterance, saveConversation]
  );

  const handleStop = useCallback(() => {
    typingRef.current.cancelled = true;
    window.speechSynthesis.cancel();
    synthRef.current = null;
    setSpeaking(false);
    setThinking(false);
    setTextVisible(false);
    setSpokenText("");
    setBusy(false);
    setEmotion("neutral");
  }, []);

  const handleChatSubmit = useCallback(() => {
    const text = chatInput.trim();
    if (!text || busy) return;
    setChatInput("");
    handleResponse(text);
  }, [chatInput, busy, handleResponse]);

  useEffect(() => {
    (window as any).bmoSpeak = (text: string) => {
      setSpokenText(text);
      setSpeaking(true);
      setTextVisible(true);
      setBusy(true);
    };
    (window as any).bmoStopSpeaking = () => {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setTextVisible(false);
      setSpokenText("");
      setBusy(false);
    };
    return () => {
      delete (window as any).bmoSpeak;
      delete (window as any).bmoStopSpeaking;
    };
  }, []);

  useEffect(() => () => window.speechSynthesis.cancel(), []);

  // Blink independent of emotion, 4-6s random
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      timeout = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 110 + Math.random() * 70);
        scheduleBlink();
      }, 4000 + Math.random() * 2000);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Talking mouth cycle
  useEffect(() => {
    if (!speaking) {
      setTalkingOpen(false);
      return;
    }
    const interval = setInterval(() => {
      setTalkingOpen((p) => !p);
    }, 180);
    return () => clearInterval(interval);
  }, [speaking]);

  // Idle bob
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

  // Auto-scroll bubbles
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversationHistory, thinking]);

  const currentEmotion: Emotion = speaking ? "talking" : emotion;

  const screenBg = useMemo(() => {
    if (currentEmotion === "happy" || currentEmotion === "excited") {
      return "linear-gradient(180deg, #dee3c4 0%, #cfd6b6 100%)";
    }
    if (currentEmotion === "sleepy") {
      return "linear-gradient(180deg, #c5d2cf 0%, #b5c3c1 100%)";
    }
    return "linear-gradient(180deg, #d6e4cf 0%, #c8d8c2 100%)";
  }, [currentEmotion]);

  const hasConversation = conversationHistory.length > 0;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#7ccdb5" }}
    >
      {/* Inline keyframes */}
      <style>{`
        @keyframes bmo-bounce-dot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes bmo-thinking-glow {
          0%, 100% { box-shadow: inset 0 4px 14px rgba(0,0,0,0.1), inset 0 1px 3px rgba(0,0,0,0.06), 0 0 12px 3px rgba(255,220,140,0.35); }
          50% { box-shadow: inset 0 4px 14px rgba(0,0,0,0.1), inset 0 1px 3px rgba(0,0,0,0.06), 0 0 22px 8px rgba(255,220,140,0.6); }
        }
      `}</style>

      {/* BMO Body */}
      <div
        className="relative flex flex-col items-center"
        style={{
          width: "min(85vw, 380px)",
          padding: "clamp(14px, 4vw, 24px)",
          backgroundColor: "#7ccdb5",
          borderRadius: "clamp(24px, 6vw, 40px)",
          border: "3px solid #5faa93",
          boxShadow: `0 ${12 + idleOffset * 0.5}px ${40 - idleOffset * 0.8}px rgba(0,0,0,${0.15 - idleOffset * 0.005}), 0 4px 12px rgba(0,0,0,0.08)`,
          transform: `translateY(${idleOffset}px)`,
          transition: "transform 0.1s linear",
        }}
      >
        {/* Screen */}
        <div
          ref={screenRef}
          className="relative w-full flex items-center justify-center"
          style={{
            aspectRatio: "5 / 3.5",
            background: screenBg,
            borderRadius: "clamp(14px, 4vw, 24px)",
            border: "3px solid rgba(60,90,75,0.25)",
            boxShadow: thinking
              ? undefined
              : speaking
              ? "inset 0 4px 14px rgba(0,0,0,0.1), inset 0 1px 3px rgba(0,0,0,0.06), 0 0 20px 5px rgba(208,223,202,0.55)"
              : "inset 0 4px 14px rgba(0,0,0,0.1), inset 0 1px 3px rgba(0,0,0,0.06)",
            animation: thinking ? "bmo-thinking-glow 1.4s ease-in-out infinite" : undefined,
            transition: "background 400ms ease, box-shadow 250ms ease",
            overflow: "hidden",
          }}
        >
          {/* CRT scanlines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)",
              pointerEvents: "none",
              zIndex: 5,
              mixBlendMode: "multiply",
              opacity: 0.5,
            }}
          />
          {/* Glass highlight */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "60%",
              height: "35%",
              background:
                "radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)",
              borderRadius: "inherit",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />

          {/* Face */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: textVisible ? 0 : 1,
              transition: "opacity 0.35s ease",
              pointerEvents: textVisible ? "none" : "auto",
            }}
          >
            <BmoFace
              emotion={currentEmotion}
              blinking={blinking}
              eyeOffset={activeEyeOffset}
              talkingOpen={talkingOpen}
            />
          </div>

          {/* Text mode */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: textVisible ? 1 : 0,
              transition: "opacity 0.35s ease",
              pointerEvents: textVisible ? "auto" : "none",
              padding: "clamp(16px, 5vw, 28px)",
              overflow: "hidden",
              zIndex: 6,
            }}
          >
            <p
              style={{
                color: "#3a3a50",
                fontSize: "clamp(13px, 3.5vw, 18px)",
                fontFamily: "'Courier New', monospace",
                textAlign: "center",
                lineHeight: 1.65,
                letterSpacing: "0.02em",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                maxWidth: "92%",
                padding: "0 4px",
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

        {/* Controls */}
        <div className="w-full flex items-start justify-between mt-[5%] px-[10%]">
          <div
            className="relative"
            style={{ width: "clamp(42px, 13vw, 72px)", height: "clamp(42px, 13vw, 72px)", cursor: "pointer" }}
            onPointerDown={() => setDpadPressed(true)}
            onPointerUp={() => {
              setDpadPressed(false);
              if (chatBarTimeoutRef.current) clearTimeout(chatBarTimeoutRef.current);
              if (chatBarVisible) {
                setChatBarAnimating(true);
                chatBarTimeoutRef.current = setTimeout(() => {
                  setChatBarVisible(false);
                  setChatBarAnimating(false);
                }, 250);
              } else {
                setChatBarVisible(true);
                setChatBarAnimating(false);
              }
            }}
            onPointerLeave={() => setDpadPressed(false)}
          >
            <div
              className="absolute top-1/2 left-0 w-full -translate-y-1/2"
              style={{
                height: "33%",
                backgroundColor: "#ddc64e",
                borderRadius: "5px",
                transform: `translateY(-50%) ${dpadPressed ? "scale(0.92)" : "scale(1)"}`,
                transition: "transform 0.1s ease",
              }}
            />
            <div
              className="absolute left-1/2 top-0 h-full -translate-x-1/2"
              style={{
                width: "33%",
                backgroundColor: "#ddc64e",
                borderRadius: "5px",
                transform: `translateX(-50%) ${dpadPressed ? "scale(0.92)" : "scale(1)"}`,
                transition: "transform 0.1s ease",
              }}
            />
          </div>

          <div className="flex flex-col items-center" style={{ gap: "clamp(6px, 2vw, 12px)" }}>
            <div className="flex items-center" style={{ gap: "clamp(10px, 3vw, 20px)" }}>
              <div
                onPointerDown={() => setTrianglePressed(true)}
                onPointerUp={() => setTrianglePressed(false)}
                onPointerLeave={() => setTrianglePressed(false)}
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "clamp(6px, 2vw, 11px) solid transparent",
                  borderRight: "clamp(6px, 2vw, 11px) solid transparent",
                  borderBottom: "clamp(11px, 3.5vw, 19px) solid #8dcde0",
                  transform: trianglePressed ? "scale(0.85)" : "scale(1)",
                  transition: "transform 0.1s ease",
                  cursor: "pointer",
                }}
              />
              <div
                onPointerDown={() => setGreenPressed(true)}
                onPointerUp={() => setGreenPressed(false)}
                onPointerLeave={() => setGreenPressed(false)}
                style={{
                  width: "clamp(12px, 3.5vw, 20px)",
                  height: "clamp(12px, 3.5vw, 20px)",
                  backgroundColor: "#b5de5a",
                  borderRadius: "50%",
                  border: "2px solid #8fb84a",
                  transform: greenPressed ? "scale(0.92)" : "scale(1)",
                  boxShadow: greenPressed ? "0 1px 2px rgba(0,0,0,0.1)" : "0 2px 4px rgba(0,0,0,0.08)",
                  transition: "transform 120ms ease, box-shadow 120ms ease, filter 150ms ease",
                  cursor: "pointer",
                  filter: "brightness(1)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "brightness(1)";
                  setGreenPressed(false);
                }}
              />
            </div>
            <div
              onClick={handleStop}
              onPointerDown={() => setPinkPressed(true)}
              onPointerUp={() => setPinkPressed(false)}
              onPointerLeave={() => setPinkPressed(false)}
              style={{
                width: "clamp(30px, 9vw, 48px)",
                height: "clamp(30px, 9vw, 48px)",
                backgroundColor: "#f28da0",
                borderRadius: "50%",
                border: "2px solid #d4748a",
                boxShadow: pinkPressed ? "0 1px 2px rgba(0,0,0,0.1)" : "0 2px 6px rgba(0,0,0,0.08)",
                transform: pinkPressed ? "scale(0.93)" : "scale(1)",
                transition: "transform 120ms ease, box-shadow 120ms ease, filter 150ms ease",
                cursor: "pointer",
                filter: "brightness(1)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
                setPinkPressed(false);
              }}
            />
          </div>
        </div>

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

      {/* Chat bubbles */}
      {chatBarVisible && hasConversation && (
        <div
          className="fixed left-0 right-0 flex justify-center pointer-events-none"
          style={{
            bottom: "calc(clamp(10px, 2.5vw, 16px) * 2 + clamp(36px, 10vw, 48px) + 8px)",
            zIndex: 40,
          }}
        >
          <div
            className="pointer-events-auto"
            style={{
              width: "min(92vw, 520px)",
              maxHeight: "28vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "10px 14px",
              opacity: chatBarAnimating ? 0 : 1,
              transform: chatBarAnimating ? "translateY(10px)" : "translateY(0)",
              transition: "opacity 250ms ease, transform 250ms ease",
            }}
          >
            {conversationHistory.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  padding: "8px 12px",
                  borderRadius: 14,
                  fontFamily: "'Courier New', monospace",
                  fontSize: "clamp(12px, 3vw, 14px)",
                  lineHeight: 1.45,
                  backgroundColor: m.role === "user" ? "#f28da0" : "#d0dfca",
                  color: m.role === "user" ? "#ffffff" : "#2a2a3d",
                  border:
                    m.role === "user"
                      ? "1px solid #d4748a"
                      : "1px solid #5faa93",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  wordBreak: "break-word",
                }}
              >
                {m.content}
              </div>
            ))}
            {thinking && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 14px",
                  borderRadius: 14,
                  backgroundColor: "#d0dfca",
                  border: "1px solid #5faa93",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  display: "flex",
                  gap: 4,
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#2a2a3d",
                      display: "inline-block",
                      animation: `bmo-bounce-dot 1.2s ${i * 0.15}s ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Chat input bar */}
      <div
        className="fixed bottom-0 left-0 right-0 flex items-center"
        style={{
          display: chatBarVisible ? "flex" : "none",
          padding: "clamp(10px, 2.5vw, 16px) clamp(12px, 3vw, 20px)",
          backgroundColor: "rgba(90, 160, 140, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(95, 170, 147, 0.5)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
          gap: "clamp(6px, 2vw, 12px)",
          opacity: chatBarVisible && !chatBarAnimating ? 1 : 0,
          transform: chatBarVisible && !chatBarAnimating ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 250ms ease-out, transform 250ms ease-out",
          zIndex: 50,
        }}
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleChatSubmit();
          }}
          disabled={busy}
          placeholder="Talk to BMO..."
          style={{
            flex: 1,
            padding: "clamp(8px, 2vw, 12px) clamp(10px, 3vw, 16px)",
            borderRadius: "clamp(10px, 3vw, 18px)",
            border: "2px solid #5faa93",
            backgroundColor: "#d0dfca",
            color: "#2a2a3d",
            fontFamily: "'Courier New', monospace",
            fontSize: "clamp(13px, 3.5vw, 16px)",
            outline: "none",
            opacity: busy ? 0.6 : 1,
          }}
        />
        <button
          onClick={handleChatSubmit}
          disabled={busy || !chatInput.trim()}
          style={{
            width: "clamp(36px, 10vw, 48px)",
            height: "clamp(36px, 10vw, 48px)",
            borderRadius: "50%",
            backgroundColor: "#f28da0",
            border: "2px solid #d4748a",
            cursor: busy || !chatInput.trim() ? "not-allowed" : "pointer",
            opacity: busy || !chatInput.trim() ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 0.2s ease",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2a2a3d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Index;
