import { useEffect, useState, useRef } from "react";


const Index = () => {
  const [blinking, setBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [idleOffset, setIdleOffset] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [textVisible, setTextVisible] = useState(false);
  const [listening, setListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setListening(true);
        setSpeaking(false);
        setTextVisible(true);
        setSpokenText("");
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setSpokenText(transcript);
          } else {
            interimTranscript += transcript;
          }
        }
        if (interimTranscript) {
          setSpokenText(interimTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setListening(false);
        generateAndSpeak();
      };

      recognitionRef.current.onerror = () => {
        setListening(false);
      };
    }
  }, []);

  // Generate response and speak
  const generateAndSpeak = () => {
    const responses = [
      "That sounds interesting!",
      "I understand.",
      "Tell me more.",
      "I'm listening.",
      "Got it!",
    ];
    const responseText = responses[Math.floor(Math.random() * responses.length)];
    speakText(responseText);
  };

  // Text-to-Speech function
  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    setSpeaking(true);
    setTextVisible(true);
    setSpokenText(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setSpeaking(false);
      setTextVisible(false);
      setSpokenText("");
    };

    utterance.onerror = () => {
      setSpeaking(false);
      setTextVisible(false);
      setSpokenText("");
    };

    window.speechSynthesis.speak(utterance);
  };

  // Handle red button click to start listening
  const handleListenClick = () => {
    if (recognitionRef.current && !listening && !speaking) {
      recognitionRef.current.start();
    }
  };

  // Blink every 3-5 seconds (only when not listening or speaking)
  useEffect(() => {
    if (listening || speaking) return;
    
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    };
    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [listening, speaking]);

  // Expose speaking control via window for external scripts
  useEffect(() => {
    (window as any).bmoSpeak = (text: string) => {
      speakText(text);
    };
    (window as any).bmoStopSpeaking = () => {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setTextVisible(false);
      setSpokenText("");
    };
    return () => {
      delete (window as any).bmoSpeak;
      delete (window as any).bmoStopSpeaking;
    };
  }, []);

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
              opacity: speaking || listening ? 0 : 1,
              transition: "opacity 0.4s ease",
              pointerEvents: speaking || listening ? "none" : "auto",
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

          {/* Text mode (speaking) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: textVisible ? 1 : 0,
              transition: "opacity 0.4s ease",
              pointerEvents: speaking || listening ? "auto" : "none",
              padding: "clamp(12px, 4vw, 24px)",
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
              onClick={handleListenClick}
              style={{
                width: "clamp(30px, 9vw, 48px)",
                height: "clamp(30px, 9vw, 48px)",
                backgroundColor: "#f28da0",
                borderRadius: "50%",
                border: "2px solid #d4748a",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                cursor: listening || speaking ? "default" : "pointer",
                opacity: listening || speaking ? 0.7 : 1,
                transition: "opacity 0.2s ease",
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
