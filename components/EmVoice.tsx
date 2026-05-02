"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────
const SAMPLE_RATE = 24000;
const WS_MODEL    = "gpt-4o-mini-realtime-preview-2024-12-17";

// ─── Easing ───────────────────────────────────────────────────────────────────
function easeInOut(x: number) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

// ─── Blob ─────────────────────────────────────────────────────────────────────
function Blob({ opacity }: { opacity: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null!);

  useFrame(({ clock }) => {
    mat.current.uniforms.uTime.value    = clock.elapsedTime;
    mat.current.uniforms.uOpacity.value = opacity;
  });

  return (
    <Sphere args={[1, 256, 256]}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        uniforms={{ uTime: { value: 0 }, uOpacity: { value: 1 } }}
        vertexShader={`
          uniform float uTime;
          varying vec3 vNormal, vWorld;
          varying vec2 vUv;
          float noise(vec3 p){ return sin(p.x*3.)*sin(p.y*3.)*sin(p.z*3.); }
          void main(){
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec3 pos = position + normal * noise(position*2. + uTime*0.25)*0.03;
            vec4 wp = modelMatrix * vec4(pos,1.);
            vWorld = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `}
        fragmentShader={`
          uniform float uOpacity;
          varying vec3 vNormal, vWorld;
          varying vec2 vUv;
          void main(){
            vec3 vd = normalize(cameraPosition - vWorld);
            float fr = pow(1. - dot(vd, normalize(vNormal)), 2.4);
            vec3 c = mix(mix(vec3(.75,.1,.95), vec3(.55,.75,1.), dot(vd,vNormal)*.5+.5), vec3(.85,.8,.95), .35);
            c += (smoothstep(-.4,.4,sin((vUv.y+vUv.x*.35)*80.))-.5)*.04 * smoothstep(.25,.85,vUv.y);
            c += smoothstep(.6,0.,length(vUv-.5))*.25 + fr*.45;
            c *= .92;
            gl_FragColor = vec4(c, (.3+fr*.22)*uOpacity);
          }
        `}
      />
    </Sphere>
  );
}

// ─── Voice Bars ───────────────────────────────────────────────────────────────
const BAR_COUNT = 7;
const BAR_W     = 0.09;
const BAR_GAP   = 0.085;
const TOTAL_W   = BAR_COUNT * BAR_W + (BAR_COUNT - 1) * BAR_GAP;

const BAR_COLORS: THREE.Color[] = [
  new THREE.Color(0.86, 0.75, 1.00),
  new THREE.Color(0.76, 0.56, 1.00),
  new THREE.Color(0.62, 0.36, 0.96),
  new THREE.Color(0.52, 0.22, 0.94),
  new THREE.Color(0.62, 0.36, 0.96),
  new THREE.Color(0.76, 0.56, 1.00),
  new THREE.Color(0.86, 0.75, 1.00),
];

function VoiceBars({
  opacity,
  scaleIn,
  analyser,
}: {
  opacity:  number;
  scaleIn:  number;
  analyser: AnalyserNode | null;
}) {
  const animH    = useRef<number[]>(Array(BAR_COUNT).fill(0.08));
  const targetH  = useRef<number[]>(Array(BAR_COUNT).fill(0.08));
  const dataArr  = useRef<Uint8Array | null>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>(Array(BAR_COUNT).fill(null));
  const tRef     = useRef(0);

  useEffect(() => {
    dataArr.current = analyser
      ? new Uint8Array(analyser.frequencyBinCount)
      : null;
  }, [analyser]);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t   = tRef.current;
    const mid = (BAR_COUNT - 1) / 2;

    for (let i = 0; i < BAR_COUNT; i++) {
      if (analyser && dataArr.current) {
        analyser.getByteFrequencyData(dataArr.current);
        const lo   = 4;
        const hi   = Math.floor(dataArr.current.length * 0.55);
        const size = Math.max(1, Math.floor((hi - lo) / BAR_COUNT));
        let sum    = 0;
        for (let j = 0; j < size; j++) sum += dataArr.current[lo + i * size + j];
        const avg  = sum / size / 255;
        const bell = 1 - (Math.abs(i - mid) / mid) * 0.22;
        targetH.current[i] = Math.max(0.06, avg * bell);
      } else {
        const dist = Math.abs(i - mid) / mid;
        const w1   = Math.sin(t * 2.4 + i * 0.75) * 0.5 + 0.5;
        const w2   = Math.sin(t * 3.3 - i * 0.55) * 0.3 + 0.3;
        targetH.current[i] = 0.06 + (w1 * 0.65 + w2 * 0.35) * (1 - dist * 0.4) * 0.55;
      }
    }

    for (let i = 0; i < BAR_COUNT; i++) {
      const diff  = targetH.current[i] - animH.current[i];
      const speed = diff > 0 ? 18 : 10;
      animH.current[i] += diff * Math.min(delta * speed, 1);
    }

    for (let i = 0; i < BAR_COUNT; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      mesh.scale.set(1, animH.current[i] * scaleIn * 12, 1);
    }
  });

  return (
    <group>
      {Array.from({ length: BAR_COUNT }, (_, i) => {
        const x = -TOTAL_W / 2 + i * (BAR_W + BAR_GAP) + BAR_W / 2;
        return (
          <mesh
            key={i}
            ref={(el) => { meshRefs.current[i] = el; }}
            position={[x, 0, 0]}
          >
            <boxGeometry args={[BAR_W, 0.1, 0.05]} />
            <meshStandardMaterial
              color={BAR_COLORS[i]}
              emissive={BAR_COLORS[i]}
              emissiveIntensity={0.2}
              transparent
              opacity={opacity}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({ phase, analyser }: { phase: number; analyser: AnalyserNode | null }) {
  const groupRef = useRef<THREE.Group>(null!);
  const breathT  = useRef(0);

  useFrame((_, delta) => {
    breathT.current += delta;
    groupRef.current.scale.setScalar(1 + Math.sin(breathT.current * 0.9) * 0.011);
  });

  const ep = easeInOut(phase);

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.9} />
      <pointLight position={[2, 2, 2]}   intensity={0.5} />
      <pointLight position={[-2, -1, 1]} intensity={0.3} color="#a78bfa" />

      {phase < 1 && <Blob opacity={1 - ep} />}
      {phase > 0 && (
        <VoiceBars opacity={ep} scaleIn={0.4 + ep * 0.6} analyser={analyser} />
      )}
    </group>
  );
}

// ─── Audio helpers ────────────────────────────────────────────────────────────

/** Decode base64 PCM16 → Float32Array */
function decodePcm16(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const int16 = new Int16Array(bytes.buffer);
  const float = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) float[i] = int16[i] / 32768;
  return float;
}

/** Convert Float32 → Int16 PCM → base64 (for mic capture fallback) */
function float32ToPcm16Base64(float32: Float32Array): string {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function EmVoice() {
  const [phase,      setPhase]      = useState(0);
  const [recording,  setRecording]  = useState(false);
  const [status,     setStatus]     = useState<"idle" | "connecting" | "listening" | "responding">("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [agentTranscript, setAgentTranscript] = useState("");
  const [isTranscriptFading, setIsTranscriptFading] = useState(false);
  const [analyser,   setAnalyser]   = useState<AnalyserNode | null>(null);

  // Refs for animation phase
  const phaseRef    = useRef(0);
  const dirRef      = useRef(0);
  const rafRef      = useRef<number>();

  // Refs for audio / WebSocket
  const wsRef           = useRef<WebSocket | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const playbackBuf     = useRef<Float32Array[]>([]);
  const isPlayingRef    = useRef(false);
  const activeAudioSrcRef = useRef<AudioBufferSourceNode | null>(null);
  const playAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAnalyserRef  = useRef<AnalyserNode | null>(null);
  const activeRef       = useRef(false); // tracks if session is active (avoids stale closures)

  // ── Phase animation loop ──
  useEffect(() => {
    function step() {
      if (dirRef.current !== 0) {
        phaseRef.current = Math.max(0, Math.min(1, phaseRef.current + dirRef.current * 0.04));
        setPhase(phaseRef.current);
        if (phaseRef.current >= 1 || phaseRef.current <= 0) dirRef.current = 0;
      }
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current!);
  }, []);

  // ── Transcript auto-fade loop ──
  useEffect(() => {
    if (userTranscript || agentTranscript) {
      setIsTranscriptFading(false);
      const t1 = setTimeout(() => {
        setIsTranscriptFading(true);
      }, 7000); // Wait 7 seconds before fading out
      const t2 = setTimeout(() => {
        setUserTranscript("");
        setAgentTranscript("");
      }, 8000); // Clear after fade out finishes
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [userTranscript, agentTranscript]);

  // ── Drain playback buffer ──
  const drainPlayback = useCallback(() => {
    if (isPlayingRef.current) return;
    if (playbackBuf.current.length === 0) return;

    isPlayingRef.current = true;
    const ctx = audioCtxRef.current;
    if (!ctx) { isPlayingRef.current = false; return; }

    // Merge all queued chunks into one buffer
    let totalLen = 0;
    for (const c of playbackBuf.current) totalLen += c.length;
    const merged = new Float32Array(totalLen);
    let off = 0;
    for (const c of playbackBuf.current) { merged.set(c, off); off += c.length; }
    playbackBuf.current = [];

    const buf = ctx.createBuffer(1, merged.length, SAMPLE_RATE);
    buf.copyToChannel(merged, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    // Route through playback analyser so bars react to AI voice
    if (playAnalyserRef.current) {
      src.connect(playAnalyserRef.current);
      playAnalyserRef.current.connect(ctx.destination);
    } else {
      src.connect(ctx.destination);
    }

    activeAudioSrcRef.current = src;

    src.onended = () => {
      activeAudioSrcRef.current = null;
      isPlayingRef.current = false;
      drainPlayback();
    };
    src.start();
  }, []);

  // ── Cleanup everything ──
  const cleanup = useCallback(() => {
    activeRef.current = false;
    if (activeAudioSrcRef.current) {
      activeAudioSrcRef.current.stop();
      activeAudioSrcRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent re-entrant cleanup
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    playAnalyserRef.current = null;
    micAnalyserRef.current = null;
    setAnalyser(null);
    playbackBuf.current = [];
    isPlayingRef.current = false;
  }, []);

  // ── Start session ──
  const startSession = useCallback(async () => {
    dirRef.current = 1;
    setRecording(true);
    setStatus("connecting");
    activeRef.current = true;

    try {
      // 1. Get ephemeral token from our server
      console.log("[EmVoice] Requesting ephemeral token...");
      const tokenRes = await fetch("/api/realtime/session", { method: "POST" });
      const sessionData = await tokenRes.json();

      if (!tokenRes.ok) {
        throw new Error(sessionData.error || `Session creation failed (${tokenRes.status})`);
      }

      console.log("[EmVoice] Session response:", JSON.stringify(sessionData).substring(0, 200));
      const ephemeralKey: string = sessionData.client_secret?.value;
      if (!ephemeralKey) {
        throw new Error("No ephemeral key in session response. Check server logs.");
      }
      console.log("[EmVoice] Ephemeral key obtained (starts with):", ephemeralKey.substring(0, 20) + "...");

      // 2. Request mic access first (before opening WS so we don't waste ephemeral token time)
      console.log("[EmVoice] Requesting mic access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;
      console.log("[EmVoice] Mic access granted");

      // 3. Create AudioContext at correct sample rate
      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
      audioCtxRef.current = ctx;

      // If AudioContext didn't honour our sample rate, log it
      console.log("[EmVoice] AudioContext sampleRate:", ctx.sampleRate, "(requested:", SAMPLE_RATE, ")");

      // Create mic analyser
      const micAn = ctx.createAnalyser();
      micAn.fftSize = 512;
      micAn.smoothingTimeConstant = 0.72;
      micAnalyserRef.current = micAn;
      setAnalyser(micAn);

      // Create playback analyser
      const playAn = ctx.createAnalyser();
      playAn.fftSize = 512;
      playAn.smoothingTimeConstant = 0.72;
      playAnalyserRef.current = playAn;

      // Connect mic source
      const micSrc = ctx.createMediaStreamSource(stream);
      micSrc.connect(micAn);

      // 4. Set up mic recording via ScriptProcessor (more reliable fallback than AudioWorklet)
      // AudioWorklet can fail silently in some browsers; ScriptProcessor is deprecated but reliable
      const bufferSize = 4096;
      const scriptNode = ctx.createScriptProcessor(bufferSize, 1, 1);

      // 5. Open WebSocket to OpenAI Realtime API
      console.log("[EmVoice] Opening WebSocket to OpenAI...");
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${WS_MODEL}`;
      const ws = new WebSocket(wsUrl, [
        "realtime",
        `openai-insecure-api-key.${ephemeralKey}`,
        "openai-beta.realtime-v1",
      ]);
      wsRef.current = ws;

      // Track how many audio chunks we send for debugging
      let chunksSent = 0;

      ws.onopen = () => {
        console.log("[EmVoice] WebSocket OPEN");
        setStatus("listening");

        // Now connect script processor to start capturing
        scriptNode.onaudioprocess = (audioEvent: AudioProcessingEvent) => {
          if (!activeRef.current || ws.readyState !== WebSocket.OPEN) return;

          const inputData = audioEvent.inputBuffer.getChannelData(0);

          // If AudioContext sample rate differs from 24kHz, resample
          let pcmFloat: Float32Array;
          if (ctx.sampleRate !== SAMPLE_RATE) {
            const ratio = ctx.sampleRate / SAMPLE_RATE;
            const newLen = Math.floor(inputData.length / ratio);
            pcmFloat = new Float32Array(newLen);
            for (let i = 0; i < newLen; i++) {
              pcmFloat[i] = inputData[Math.floor(i * ratio)];
            }
          } else {
            pcmFloat = new Float32Array(inputData);
          }

          const base64 = float32ToPcm16Base64(pcmFloat);
          ws.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64,
          }));

          chunksSent++;
          if (chunksSent <= 3 || chunksSent % 50 === 0) {
            console.log(`[EmVoice] Sent audio chunk #${chunksSent}, size=${base64.length} chars`);
          }
        };

        micSrc.connect(scriptNode);
        
        // Fix for echo / answering unasked questions:
        // Connect scriptNode to destination via a muted gain node.
        // This ensures the audio loop works without playing mic audio through the speakers.
        const dummyGain = ctx.createGain();
        dummyGain.gain.value = 0;
        scriptNode.connect(dummyGain);
        dummyGain.connect(ctx.destination);
      };

      ws.onmessage = (e: MessageEvent) => {
        let msg;
        try {
          msg = JSON.parse(e.data);
        } catch {
          console.error("[EmVoice] Failed to parse WS message:", e.data);
          return;
        }

        // Log all event types for debugging
        if (msg.type !== "input_audio_buffer.speech_started" &&
            msg.type !== "input_audio_buffer.speech_stopped") {
          console.log("[EmVoice] WS event:", msg.type);
        }

        switch (msg.type) {
          case "session.created":
            console.log("[EmVoice] Session created, id:", msg.session?.id);
            // Trigger the AI to say hi immediately
            ws.send(JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["text", "audio"],
                instructions: "Say 'Hi there! I am EmVoice, your HR assistant. How can I help you today?'"
              }
            }));
            break;

          case "session.updated":
            console.log("[EmVoice] Session updated");
            break;

          case "input_audio_buffer.speech_started":
            setStatus("listening");
            break;

          case "input_audio_buffer.speech_stopped":
            console.log("[EmVoice] Speech stopped (VAD detected end of speech)");
            break;

          case "response.audio.delta":
            // AI is speaking — switch analyser to playback
            if (playAnalyserRef.current) setAnalyser(playAnalyserRef.current);
            setStatus("responding");
            playbackBuf.current.push(decodePcm16(msg.delta));
            drainPlayback();
            break;

          case "response.audio.done":
            setStatus("listening");
            // Restore mic analyser
            if (micAnalyserRef.current) {
              setTimeout(() => setAnalyser(micAnalyserRef.current), 300);
            }
            break;

          case "response.audio_transcript.delta":
            // AI's text response being streamed
            break;

          case "response.audio_transcript.done":
            if (msg.transcript) {
              console.log("[EmVoice] AI transcript:", msg.transcript);
              setAgentTranscript(msg.transcript);
            }
            break;

          case "conversation.item.input_audio_transcription.completed":
            if (msg.transcript) {
              console.log("[EmVoice] User said:", msg.transcript);
              setUserTranscript(msg.transcript);
            }
            break;

          case "error":
            console.error("[EmVoice] API error:", JSON.stringify(msg.error));
            toast.error(msg.error?.message || "Realtime API error");
            break;

          case "response.function_call_arguments.done":
            console.log("[EmVoice] Function call done:", msg.name, msg.arguments);
            if (msg.name === "generate_hr_ticket") {
              try {
                const args = JSON.parse(msg.arguments);
                
                fetch("/api/tickets", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(args)
                }).then(async (res) => {
                  const data = await res.json();
                  const resultText = res.ok ? `Successfully generated ticket. ID: ${data.id}` : `Failed to generate ticket: ${data.error}`;
                  
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                      type: "conversation.item.create",
                      item: {
                        type: "function_call_output",
                        call_id: msg.call_id,
                        output: resultText
                      }
                    }));
                    ws.send(JSON.stringify({
                      type: "response.create"
                    }));
                  }
                });
              } catch (e) {
                console.error("[EmVoice] Failed to parse function args", e);
              }
            }
            break;

          default:
            break;
        }
      };

      ws.onerror = (evt) => {
        console.error("[EmVoice] WebSocket error:", evt);
        toast.error("WebSocket connection error");
        cleanup();
        dirRef.current = -1;
        setRecording(false);
        setStatus("idle");
      };

      ws.onclose = (evt) => {
        console.log("[EmVoice] WebSocket closed, code:", evt.code, "reason:", evt.reason);
        if (activeRef.current) {
          // Unexpected close
          cleanup();
          dirRef.current = -1;
          setRecording(false);
          setStatus("idle");
        }
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      console.error("[EmVoice] Start error:", err);
      toast.error(message);
      cleanup();
      dirRef.current = -1;
      setRecording(false);
      setStatus("idle");
    }
  }, [cleanup, drainPlayback]);

  // ── Stop session ──
  const stopSession = useCallback(() => {
    console.log("[EmVoice] Stopping session...");
    dirRef.current = -1;
    setRecording(false);
    setStatus("idle");
    setUserTranscript("");
    setAgentTranscript("");
    cleanup();
  }, [cleanup]);

  const handleClick = useCallback(() => {
    if (!recording) {
      startSession();
    } else {
      stopSession();
    }
  }, [recording, startSession, stopSession]);

  // ── Status label ──
  const statusLabel = {
    idle: "EMVOICE",
    connecting: "CONNECTING…",
    listening: "LISTENING",
    responding: "SPEAKING",
  }[status];

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center select-none">
      {/* Canvas */}
      <div
        className="w-28 h-28 cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
        style={{ filter: phase < 0.5 ? "blur(5px) contrast(1.1)" : "none" }}
        onClick={handleClick}
      >
        <Canvas camera={{ position: [0, 0, 2.4] }} gl={{ alpha: true, antialias: true }}>
          <Scene phase={phase} analyser={analyser} />
        </Canvas>
      </div>

      {/* Transcript bubble */}
      {(userTranscript || agentTranscript) && recording && (
        <div 
          className={`absolute bottom-[100%] mb-4 right-0 w-80 bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant/20 rounded-2xl p-4 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] pointer-events-none origin-bottom-right flex flex-col gap-3
            ${isTranscriptFading 
              ? "opacity-0 -translate-y-6 scale-95 blur-sm" 
              : "opacity-100 translate-y-0 scale-100 blur-0"
            }`}
          style={{
            animation: !isTranscriptFading ? "emv-transcript-enter 0.6s cubic-bezier(0.2,0.8,0.2,1) forwards" : "none"
          }}
        >
          {userTranscript && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold text-primary tracking-wider uppercase">You</span>
              <p className="text-sm font-medium text-on-surface-variant leading-relaxed text-right bg-primary/10 px-3 py-2 rounded-2xl rounded-tr-sm">{userTranscript}</p>
            </div>
          )}
          {agentTranscript && (
            <div className="flex flex-col items-start gap-1">
              <span className="text-[10px] font-bold text-[#c084fc] tracking-wider uppercase">EmVoice</span>
              <p className="text-sm font-medium text-on-surface leading-relaxed text-left bg-surface-variant/50 px-3 py-2 rounded-2xl rounded-tl-sm">{agentTranscript}</p>
            </div>
          )}
        </div>
      )}

      {/* Label */}
      <div className="flex items-center gap-2 mt-1 h-5">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: status === "responding" ? "#4ade80" : "#c084fc",
            boxShadow:  status === "responding" ? "0 0 6px #22c55e" : "0 0 6px #a855f7",
            opacity:    recording ? 1 : 0,
            transition: "all 0.5s",
            animation:  recording ? "emv-pulse 1.3s ease-in-out infinite" : "none",
          }}
        />
        <p
          className="text-xs font-medium tracking-widest transition-all duration-500"
          style={{ color: status === "responding" ? "#4ade80" : recording ? "#c084fc" : undefined }}
        >
          {statusLabel}
        </p>
      </div>

      <style jsx>{`
        @keyframes emv-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        @keyframes emv-transcript-enter {
          from { opacity: 0; transform: translateY(16px) scale(0.95); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
      `}</style>
    </div>
  );
}