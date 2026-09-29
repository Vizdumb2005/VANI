"use client";

import React, { useState, useRef, useEffect } from "react";
import { INDIC_LANGUAGES } from "../../lib/constants";
import { submitCitizenIntake } from "../../lib/api";
import { CitizenIntakeResponse, VisionDamageInspection } from "../../types";
import { Mic, Upload, Send, Sparkles, AlertTriangle, ShieldCheck, Check, Volume2, Play, MessageSquare } from "lucide-react";

export const CitizenVoiceSandbox: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<string>("hin");
  const [inputText, setInputText] = useState<string>(INDIC_LANGUAGES[0].sample);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<CitizenIntakeResponse | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const playVoiceReply = (audioBase64?: string) => {
    if (!audioBase64 || typeof window === "undefined") return;
    try {
      const snd = new Audio(`data:audio/wav;base64,${audioBase64}`);
      setIsPlayingAudio(true);
      snd.onended = () => setIsPlayingAudio(false);
      snd.play();
    } catch (e) {
      console.error("Audio playback error:", e);
      setIsPlayingAudio(false);
    }
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio Waveform Visualizer simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const drawWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.lineWidth = 2;
      ctx.strokeStyle = isRecording ? "#FF7B00" : "#00E5FF";
      ctx.beginPath();

      const amplitude = isRecording ? 18 : 6;
      const freq = isRecording ? 0.08 : 0.03;

      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * freq + phase) * amplitude * Math.sin((x / width) * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += isRecording ? 0.2 : 0.04;
      animationFrameRef.current = requestAnimationFrame(drawWave);
    };

    drawWave();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecording]);

  const handleLangChange = (code: string) => {
    setSelectedLang(code);
    const langObj = INDIC_LANGUAGES.find((l) => l.code === code);
    if (langObj) {
      setInputText(langObj.sample);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // strip header
        const cleanBase64 = base64String.split(",")[1] || base64String;
        setUploadedImageBase64(cleanBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await submitCitizenIntake({
        channel: isRecording ? "web_voice" : "web_text",
        text: inputText,
        device_id: "+919876543210",
        image_base64: uploadedImageBase64 || undefined,
        cached_reference: inputText,
      });
      setResponse(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsRecording(false);
    }
  };

  return (
    <div className="liquid-glass p-5 border border-white/10 flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-accentCyan" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-heading">
              Citizen Voice & Multimodal Vision Sandbox
            </h2>
          </div>
          <p className="text-xs text-mutedText">
            Simulate citizen feedback across 22 Indic languages with instant Gemini 2.0 damage inspection & zero audio retention
          </p>
        </div>

        {/* DPDP Act 2023 §8(7) Compliance Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero Audio Retention Active</span>
        </div>
      </div>

      {/* Language Selector Bar */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {INDIC_LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => handleLangChange(l.code)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              selectedLang === l.code
                ? "bg-accentCyan/20 text-accentCyan border border-accentCyan/40 font-semibold"
                : "bg-white/5 hover:bg-white/10 text-mutedText border border-white/5"
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>

      {/* Input & Waveform Area */}
      <div className="space-y-3 flex-1 flex flex-col justify-between">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-100 placeholder:text-mutedText focus:outline-none focus:border-accentCyan transition-colors font-sans"
            placeholder="Enter citizen infrastructure grievance or select an Indic language preset..."
          />
        </div>

        {/* Waveform Canvas */}
        <div className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between gap-4">
          <canvas ref={canvasRef} width={280} height={36} className="w-full max-w-[280px] h-9" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
                isRecording
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isRecording ? "Listening..." : "Record Mic"}</span>
            </button>

            <label className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-accentCyan" />
              <span>{uploadedImageBase64 ? "Photo Attached" : "Add Damage Photo"}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-accentCyan hover:bg-cyan-300 text-[#070B14] font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-cyanGlow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Processing..." : "Intake"}</span>
            </button>
          </div>
        </div>

        {/* Result Preview Card */}
        {response && (
          <div className="p-3.5 rounded-lg liquid-glass-strong border border-accentCyan/30 space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-accentCyan font-bold">Ticket: {response.ticket_id}</span>
              <span className="text-emerald-400">Status: Registered (&lt; 42ms)</span>
            </div>

            <div className="text-xs text-slate-300">
              <span className="text-mutedText font-mono">Detected Lang:</span>{" "}
              <b className="uppercase">{response.language}</b> •{" "}
              <span className="text-mutedText font-mono">ASR Rung:</span> {response.asr_rung}
            </div>

            {/* Multimodal Damage Inspection Breakdown */}
            {response.gemini_vision_inspection && (
              <div className="p-2.5 rounded bg-black/40 border border-white/10 text-[11px] space-y-1 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gemini 2.0 Multimodal Inspection
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                      response.gemini_vision_inspection.hazard_level === "critical"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    }`}
                  >
                    Hazard: {response.gemini_vision_inspection.hazard_level}
                  </span>
                </div>
                <div className="text-slate-300">
                  Damage: <b>{response.gemini_vision_inspection.damage_type}</b> • Severity:{" "}
                  <b className="text-accentCyan">{response.gemini_vision_inspection.severity_score}/5.0</b>
                </div>
                <div className="text-mutedText italic">
                  "{response.gemini_vision_inspection.ai_damage_assessment}"
                </div>
                <div className="text-emerald-400 text-[10px]">
                  Fix: {response.gemini_vision_inspection.recommended_remediation}
                </div>
              </div>
            )}

            {/* Dual Reply: WhatsApp/SMS Text Confirmation + TTS Voice Note Player */}
            {response.text_reply && (
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-2 mt-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Citizen WhatsApp / SMS Reply
                  </span>
                  <span className="text-mutedText">Delivered via RapidPro Flow</span>
                </div>
                <div className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed font-sans">
                  {response.text_reply}
                </div>

                {/* TTS Voice Note Player */}
                {response.voice_reply?.audio_base64 && (
                  <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                    <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-accentCyan" />
                      <span>IndicTTS Voice Note ({response.voice_reply.language?.toUpperCase() || "HIN"})</span>
                    </div>
                    <button
                      onClick={() => playVoiceReply(response.voice_reply?.audio_base64)}
                      className="px-2.5 py-1 rounded bg-accentCyan/20 hover:bg-accentCyan/30 text-accentCyan border border-accentCyan/40 text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>{isPlayingAudio ? "Playing Voice Note..." : "Listen to Voice Reply"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
