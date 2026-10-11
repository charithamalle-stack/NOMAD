import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Compass,
  MapPin,
  Mic,
  Camera,
  Trees,
  Waves,
  Mountain,
  Sparkles,
  X,
} from "lucide-react";
import "./App.css";

function App() {
    const [backendStatus, setBackendStatus] = useState("checking");
    const videoRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const [fieldMode, setFieldMode] = useState(false);
    const [captureStatus, setCaptureStatus] = useState("");
    const [missionAnalysis, setMissionAnalysis] = useState("");
    const [totalXP, setTotalXP] = useState(
  () => Number(localStorage.getItem("nomadXP") || 0)
);
const [completedMissions, setCompletedMissions] = useState(
  () => Number(localStorage.getItem("nomadCompletedMissions") || 0)
);
const [missionCompleted, setMissionCompleted] = useState(false);
    const canvasRef = useRef(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((response) => response.json())
      .then((data) => {
        setBackendStatus(data.status);
      })
      .catch(() => {
        setBackendStatus("offline");
      });
  }, []);
  useEffect(() => {
  if (cameraStream && videoRef.current) {
    videoRef.current.srcObject = cameraStream;

    videoRef.current.play().catch((error) => {
      console.error("Camera playback failed:", error);
    });
  }
}, [cameraStream, fieldMode]);
  const [showModal, setShowModal] = useState(false);
  const [started, setStarted] = useState(false);
  const startExpedition = async () => {
  setStarted(true);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

  setCameraStream(stream);
setCameraActive(true);
  } catch (error) {
    console.error("Camera access failed:", error);
    setCameraActive(false);
  }
  };
 
const captureEnvironment = async () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!video || !canvas || !video.videoWidth) {
    setCaptureStatus("Camera is not ready. Please wait and try again.");
    return;
  }

  setCaptureStatus("CAPTURING ENVIRONMENT...");
setMissionAnalysis("");
setMissionCompleted(false);

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(async (blob) => {
    if (!blob) {
      setCaptureStatus("Capture failed. Please try again.");
      return;
    }

    setCaptureStatus("Image captured. Sending to NOMAD...");

    const formData = new FormData();
    formData.append("file", blob, "environment.jpg");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/analyze-environment",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Image upload failed.");
      }

     setCaptureStatus(
  `MISSION GENERATED · ${(data.image_size / 1024).toFixed(1)} KB`
);

      setMissionAnalysis(data.analysis);
      console.log("NOMAD image received:", data);
    } catch (error) {
      console.error("Environment upload failed:", error);
      setCaptureStatus(`Upload failed: ${error.message}`);
    }
  }, "image/jpeg", 0.85);
};
  
function completeMission() {
  if (missionCompleted) return;

  const newXP = totalXP + 100;
  const newCount = completedMissions + 1;

  localStorage.setItem("nomadXP", String(newXP));
  localStorage.setItem("nomadCompletedMissions", String(newCount));

  setTotalXP(newXP);
  setCompletedMissions(newCount);
  setMissionCompleted(true);
}

function readMissionAloud() {
  if (!missionAnalysis || !("speechSynthesis" in window)) {
    alert("Audio is not supported in this browser.");
    return;
  }

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(missionAnalysis);
  speech.lang = "en-IN";
  speech.rate = 0.9;

  window.speechSynthesis.speak(speech);
}

   if (fieldMode) { 
  return (
    <div className="nomad-app field-mode">
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      <nav className="navbar">
        <div className="brand">
          <div className="brand-mark">
            <Compass size={18} />
          </div>
          NOMAD
        </div>

        <div className="nav-status">
          <span className="status-dot" />
          FIELD MODE
        </div>
      </nav>

      <main className="field-screen">
        <div className="field-status">
          <span className="status-dot" />
          EXPEDITION ACTIVE
        </div>

        <h1>
          Look around.
          <br />
          <span>Something is waiting.</span>
        </h1>

        <p>
          NOMAD is preparing a mission from the world around you.
          Your surroundings are the game board.
        </p>

        <div className="field-scan">
        {cameraActive && (
  <>
   <video
  ref={videoRef}
  autoPlay
  playsInline
  muted
  onLoadedMetadata={() => {
    videoRef.current?.play();
  }}
  className="field-camera"
/>

    <canvas ref={canvasRef} style={{ display: "none" }} />
  </>
)}  
      
       
          <div className="scan-ring ring-one" />
          <div className="scan-ring ring-two" />

          <div className="field-compass">
            <Compass size={42} />
          </div>

          <div className="field-scan-label">
            <span className="status-dot" />
            SENSING ENVIRONMENT
          </div>
        </div>

        <div className="field-signals">
          <div>
            <Camera size={18} />
            <span>VISION</span>
            <strong>ACTIVE</strong>
          </div>

          <div>
            <MapPin size={18} />
            <span>LOCATION</span>
            <strong>ACTIVE</strong>
          </div>

          <div>
            <Mic size={18} />
            <span>AUDIO</span>
            <strong>STANDBY</strong>
          </div>
        </div>
        <button
  className="primary-button"
  onClick={captureEnvironment}
>
 CAPTURE ENVIRONMENT
  <Camera size={17} />
</button>
<p className="capture-status" role="status">
  {captureStatus}
</p>
      {missionAnalysis && (
  <div className="mission-results">
    <h2>Your NOMAD Mission</h2>
    <div className="mission-analysis">{missionAnalysis}</div>
    
<div className="mission-actions">
  <button onClick={readMissionAloud}>
    🔊 Listen to Mission
  </button>

  <button
    onClick={completeMission}
    disabled={missionCompleted}
  >
    {missionCompleted
      ? "✓ Mission Completed"
      : "✓ I Completed This Mission — +100 XP"}
  </button>
</div>

<p>
  Total XP: {totalXP} · Missions completed: {completedMissions}
</p>

  </div>
)}
        <button
          className="primary-button"
          onClick={() => setFieldMode(false)}
        >
          EXIT FIELD MODE
          <X size={17} />
        </button>
      </main>
    </div>
  );
}

  return (
    <div className="nomad-app">
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-mark">
            <Compass size={18} />
          </div>
          NOMAD
        </div>

       <div className="nav-status">
             <span className="status-dot" />
             {backendStatus === "healthy" ? "AI CORE ONLINE" : "CONNECTING"}
      </div>
      </nav>

      {/* HERO */}
      <main className="hero">
        <section>
          <div className="eyebrow">
            <span className="status-dot" />
            AI FOR THE PHYSICAL WORLD
          </div>

          <h1>
            Your world
            <span>is the game.</span>
          </h1>

          <p className="hero-description">
            NOMAD turns the environment around you into a one-time adventure.
            Look around. Listen. Then put your phone away.
          </p>

          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => setShowModal(true)}
            >
              START EXPEDITION
              <ArrowRight size={17} />
            </button>

            <div className="micro-copy">
              <span>NO ROUTE TO FOLLOW</span>
              <span>NO FEED TO SCROLL</span>
            </div>
          </div>
        </section>

        {/* ENVIRONMENT CARD */}
        <section className="environment-card">
          <div className="card-top">
            <div>
              <span className="card-label">LIVE ENVIRONMENT</span>
              <h2>The world is waiting.</h2>
            </div>

            <div className="live-indicator">
              <span />
              READY
            </div>
          </div>

          <div className="terrain-visual">
            <div className="sun" />

            <div className="mountain mountain-back" />
            <div className="mountain mountain-middle" />
            <div className="mountain mountain-front" />

            <Trees className="tree tree-one" size={100} />
            <Trees className="tree tree-two" size={75} />

            <div className="terrain-grid" />

            <div className="scan-ring ring-one" />
            <div className="scan-ring ring-two" />

            <div className="scan-point" />

            <div className="scan-label">
              <span />
              ENVIRONMENT SCAN
            </div>
          </div>

          <div className="signal-row">
            <div className="signal-item">
              <Camera size={15} />
              <span>VISION</span>
              <strong>READY</strong>
            </div>

            <div className="signal-item">
              <Mic size={15} />
              <span>AUDIO</span>
              <strong>READY</strong>
            </div>

            <div className="signal-item">
              <MapPin size={15} />
              <span>LOCATION</span>
              <strong>READY</strong>
            </div>
          </div>
        </section>
      </main>

      {/* CONCEPT */}
      <section className="concept-section">
        <div className="section-heading">
          <span>THE NOMAD LOOP</span>

          <h2>
            The world is the input.
            <br />
            <em>AI creates the experience.</em>
          </h2>
        </div>

        <div className="concept-grid">
          <article className="concept-card">
            <div className="concept-icon">
              <Camera size={18} />
            </div>

            <span>01 / SENSE</span>

            <h3>Sense</h3>

            <p>
              NOMAD reads your surroundings through vision, sound and
              location.
            </p>
          </article>

          <article className="concept-card featured">
            <div className="concept-icon">
              <Sparkles size={18} />
            </div>

            <span>02 / IMAGINE</span>

            <h3>Imagine</h3>

            <p>
              Open-weight AI creates a mission from what actually exists
              around you.
            </p>
          </article>

          <article className="concept-card">
            <div className="concept-icon">
              <Mountain size={18} />
            </div>

            <span>03 / DISAPPEAR</span>

            <h3>Disappear</h3>

            <p>
              Once the mission begins, your phone becomes a tool — not the
              destination.
            </p>
          </article>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <span>NOMAD / 2026</span>

        <div>
          <span>THE WORLD GENERATES THE EXPERIENCE.</span>
          <strong>OPEN INNOVATION</strong>
        </div>
      </footer>

      {/* START MODAL */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="start-modal">
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "25px",
                right: "25px",
                background: "transparent",
                border: 0,
                color: "#819087",
                cursor: "pointer",
              }}
            >
              <X size={19} />
            </button>

            {!started ? (
              <>
                <div className="modal-icon">
                  <Compass size={25} />
                </div>

                <div className="eyebrow">EXPEDITION SETUP</div>

                <h2>
                  Ready to see
                  <br />
                  differently?
                </h2>

                <p>
                  NOMAD will understand your surroundings and create a
                  physical mission specifically for the world around you.
                </p>

                <div className="permission-list">
                  <div>
                    <MapPin size={16} />
                    <span>Location</span>
                    <b>REQUIRED</b>
                  </div>

                  <div>
                    <Camera size={16} />
                    <span>Environment vision</span>
                    <b>REQUIRED</b>
                  </div>

                  <div>
                    <Mic size={16} />
                    <span>Voice interaction</span>
                    <b>OPTIONAL</b>
                  </div>
                </div>

                <button
                  className="primary-button modal-button"
                  onClick={startExpedition}
                >
                  BEGIN SENSING
                  <ArrowRight size={17} />
                </button>

                <button
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  CANCEL
                </button>
              </>
            ) : (
              <>
                <div className="modal-icon">
                  <Sparkles size={25} />
                </div>

                <div className="eyebrow">
                  <span className="status-dot" />
                  NOMAD IS READY
                </div>

                <h2>
                  Your world is
                  <br />
                  about to become a mission.
                </h2>

                <p>
                  NOMAD will analyze the environment around you and generate
                  something you can only experience by physically exploring
                  it.
                </p>

                <div className="permission-list">
                  <div>
                    <Trees size={16} />
                    <span>Environment</span>
                    <b>DETECTED</b>
                  </div>

                  <div>
                    <Waves size={16} />
                    <span>Exploration</span>
                    <b>READY</b>
                  </div>

                  <div>
                    <Sparkles size={16} />
                    <span>AI Mission</span>
                    <b>READY</b>
                  </div>
                </div>
                
              
<button
  className="primary-button modal-button"
  onClick={() => {
    setShowModal(false);
    setStarted(false);
    setCaptureStatus("");
    setMissionAnalysis("");
    setMissionCompleted(false);
    setFieldMode(true);
  }}
>
  ENTER FIELD MODE
  <ArrowRight size={17} />
</button>

              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;