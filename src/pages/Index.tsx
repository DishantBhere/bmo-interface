import { useEffect, useState } from "react";

const Index = () => {
  const [blinking, setBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [idleOffset, setIdleOffset] = useState(0);

  // Blink every 3-5 seconds
  useEffect(() => {
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    };
    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
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
      style={{ backgroundColor: "#5bbda2" }}
    >
      {/* BMO Body */}
      <div
        className="relative flex flex-col items-center"
        style={{
          width: "min(90vw, 420px)",
          transform: `translateY(${idleOffset}px)`,
          transition: "transform 0.1s linear",
        }}
      >
        {/* Screen */}
        <div
          className="relative w-full flex items-center justify-center"
          style={{
            aspectRatio: "4 / 3",
            backgroundColor: "#c8dbbe",
            borderRadius: "16px",
            border: "4px solid #2d4a3e",
            boxShadow: "inset 0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          {/* Face container */}
          <div className="flex flex-col items-center gap-[8%]">
            {/* Eyes */}
            <div className="flex items-center" style={{ gap: "25%" }}>
              <div
                style={{
                  width: "clamp(16px, 5vw, 28px)",
                  height: blinking ? "3px" : "clamp(16px, 5vw, 28px)",
                  backgroundColor: "#1a1a2e",
                  borderRadius: blinking ? "2px" : "3px",
                  transition: "height 0.08s ease",
                }}
              />
              <div
                style={{
                  width: "clamp(16px, 5vw, 28px)",
                  height: blinking ? "3px" : "clamp(16px, 5vw, 28px)",
                  backgroundColor: "#1a1a2e",
                  borderRadius: blinking ? "2px" : "3px",
                  transition: "height 0.08s ease",
                }}
              />
            </div>
            {/* Mouth */}
            <div
              style={{
                width: "clamp(30px, 10vw, 50px)",
                height: mouthOpen ? "clamp(14px, 4vw, 22px)" : "clamp(4px, 1.2vw, 6px)",
                backgroundColor: "#1a1a2e",
                borderRadius: mouthOpen ? "0 0 50% 50%" : "2px",
                transition: "all 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Speaker bar + blue dot */}
        <div className="w-full flex items-center mt-[5%] px-[5%]" style={{ gap: "8%" }}>
          <div
            className="flex-1"
            style={{
              height: "clamp(10px, 3vw, 18px)",
              backgroundColor: "#3d6b5e",
              borderRadius: "4px",
            }}
          />
          <div
            style={{
              width: "clamp(12px, 3.5vw, 20px)",
              height: "clamp(12px, 3.5vw, 20px)",
              backgroundColor: "#1a1ab8",
              borderRadius: "50%",
              border: "2px solid #14147a",
            }}
          />
        </div>

        {/* Controls area */}
        <div className="w-full flex items-start justify-between mt-[6%] px-[5%]">
          {/* D-Pad */}
          <div className="relative" style={{ width: "clamp(50px, 16vw, 90px)", height: "clamp(50px, 16vw, 90px)" }}>
            {/* Horizontal */}
            <div
              className="absolute top-1/2 left-0 w-full -translate-y-1/2"
              style={{
                height: "33%",
                backgroundColor: "#e8c834",
                borderRadius: "4px",
              }}
            />
            {/* Vertical */}
            <div
              className="absolute left-1/2 top-0 h-full -translate-x-1/2"
              style={{
                width: "33%",
                backgroundColor: "#e8c834",
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Right buttons */}
          <div className="flex flex-col items-center" style={{ gap: "clamp(8px, 2.5vw, 16px)" }}>
            {/* Triangle + small green */}
            <div className="flex items-center" style={{ gap: "clamp(12px, 4vw, 28px)" }}>
              {/* Triangle button */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "clamp(8px, 2.5vw, 14px) solid transparent",
                  borderRight: "clamp(8px, 2.5vw, 14px) solid transparent",
                  borderBottom: "clamp(14px, 4vw, 24px) solid #6ec6e6",
                }}
              />
              {/* Small green circle */}
              <div
                style={{
                  width: "clamp(14px, 4vw, 24px)",
                  height: "clamp(14px, 4vw, 24px)",
                  backgroundColor: "#a0d911",
                  borderRadius: "50%",
                  border: "2px solid #6b8e23",
                }}
              />
            </div>
            {/* Big pink button */}
            <div
              style={{
                width: "clamp(36px, 11vw, 60px)",
                height: "clamp(36px, 11vw, 60px)",
                backgroundColor: "#ff5a8a",
                borderRadius: "50%",
                border: "3px solid #c44069",
                boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
              }}
            />
          </div>
        </div>

        {/* Bottom dashes */}
        <div className="flex mt-[6%]" style={{ gap: "clamp(6px, 2vw, 12px)" }}>
          <div
            style={{
              width: "clamp(20px, 6vw, 36px)",
              height: "clamp(6px, 1.5vw, 10px)",
              backgroundColor: "#1a1ab8",
              borderRadius: "3px",
            }}
          />
          <div
            style={{
              width: "clamp(20px, 6vw, 36px)",
              height: "clamp(6px, 1.5vw, 10px)",
              backgroundColor: "#1a1ab8",
              borderRadius: "3px",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
