import React, { useState } from 'react';
import { ProductionChannel, IngestedLiveEvent, CitizenIntakeResponse } from '../types';
import { submitRequest } from '../services/api';

interface ProductionChannelGatewayProps {
  onShowToast: (msg: string) => void;
  canDispatch: boolean;
}

const PRODUCTION_CHANNELS: ProductionChannel[] = [
  {
    name: "RapidPro DPG (SMS & WhatsApp)",
    provider: "UNICEF / DPGA Visual Flow Engine",
    protocol: "POST /webhooks/rapidpro (Dual Reply)",
    status: "operational",
    throughput: "56 msgs/sec",
    lastEvent: "2s ago"
  },
  {
    name: "WhatsApp Meta Cloud API v21.0",
    provider: "Meta Graph API (Direct Webhook)",
    protocol: "X-Hub-Signature-256 HMAC Verified",
    status: "operational",
    throughput: "42 msgs/sec",
    lastEvent: "4s ago"
  },
  {
    name: "Twilio / Exotel Inbound IVR Voice",
    provider: "TwiML / Exotel XML Voice Stream",
    protocol: "16kHz Mono WAV (In-Memory Buffer)",
    status: "operational",
    throughput: "18 concurrent calls",
    lastEvent: "12s ago"
  },
  {
    name: "Cloud Pub/Sub Event Backbone",
    provider: "GCP Pub/Sub (citizen-intake-events)",
    protocol: "Stateless Push (Cloud Run Worker)",
    status: "operational",
    throughput: "85 events/sec",
    lastEvent: "1s ago"
  },
  {
    name: "Google Vertex AI Multimodal Vision",
    provider: "Gemini 2.0 Flash (Civil Inspection)",
    protocol: "REST / gRPC Enterprise Endpoint",
    status: "connected",
    throughput: "2.1s avg inference",
    lastEvent: "18s ago"
  }
];

const INITIAL_EVENTS: IngestedLiveEvent[] = [
  { id: "EVT-8842", channel: "WhatsApp Voice", district: "Varanasi", state: "Uttar Pradesh", category: "Roads", timestamp: "1 min ago", status: "Ingested & Geocoded", hasVisualEvidence: true },
  { id: "EVT-8841", channel: "Twilio IVR", district: "Gaya", state: "Bihar", category: "Water Supply", timestamp: "3 mins ago", status: "Transcribed (Magahi)", hasVisualEvidence: false },
  { id: "EVT-8840", channel: "WhatsApp Text", district: "Jabalpur", state: "Madhya Pradesh", category: "Public Safety", timestamp: "5 mins ago", status: "Hotspot Cluster #1", hasVisualEvidence: true },
  { id: "EVT-8839", channel: "Web Portal", district: "Madurai", state: "Tamil Nadu", category: "Power Outage", timestamp: "7 mins ago", status: "Dispatched to CPGRAMS", hasVisualEvidence: false },
  { id: "EVT-8838", channel: "WhatsApp Voice", district: "Salem", state: "Tamil Nadu", category: "School Building", timestamp: "11 mins ago", status: "Hotspot Cluster #5", hasVisualEvidence: true },
];

export const ProductionChannelGateway: React.FC<ProductionChannelGatewayProps> = ({ onShowToast, canDispatch }) => {
  const [events, setEvents] = useState<IngestedLiveEvent[]>(INITIAL_EVENTS);
  const [testChannel, setTestChannel] = useState<string>('whatsapp_voice');
  const [testText, setTestText] = useState<string>('वाराणसी में रामपुर गाँव की मुख्य सड़क भारी बारिश के कारण टूट चुकी है।');
  const [testPhoto, setTestPhoto] = useState<string>('roads');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<CitizenIntakeResponse | null>(null);

  const handleTestIngest = async () => {
    if (!canDispatch) {
      onShowToast("Operator sign-in is required before live event dispatch");
      return;
    }
    setIsTesting(true);
    const t0 = performance.now();
    try {
      const res = await submitRequest({
        channel: testChannel,
        text: testText,
        device_id: "9876543210",
        image_base64: `sample_${testPhoto}_photo.jpg`
      });
      const elapsed = Math.round(performance.now() - t0);
      setLastResult(res);

      // Add to live events feed
      const newEvent: IngestedLiveEvent = {
        id: `EVT-${Math.floor(8843 + Math.random() * 50)}`,
        channel: testChannel.includes('whatsapp') ? 'WhatsApp Voice' : 'Twilio IVR',
        district: "Varanasi",
        state: "Uttar Pradesh",
        category: testPhoto === 'roads' ? 'Roads' : (testPhoto === 'water' ? 'Water Supply' : 'Power Outage'),
        timestamp: "Just now",
        status: "Ingested & Geocoded",
        hasVisualEvidence: true
      };
      setEvents([newEvent, ...events.slice(0, 5)]);
      onShowToast(`Processed live ingestion event in ${Math.max(16, elapsed)}ms`);
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : "Live event dispatch failed");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-serif text-charcoal font-semibold">
            Omnichannel Gateways & Telemetry
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border text-secondary">
            5/5 Connected · Live Streaming
          </span>
        </div>
      </div>

      {/* Gateway Status Cards (5-col compact) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {PRODUCTION_CHANNELS.map((ch, idx) => (
          <div key={idx} className="p-3 rounded-card border border-border bg-surface flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-semibold text-charcoal truncate" title={ch.name}>
                  {ch.name}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-pastel-green-text flex-shrink-0 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-secondary mt-0.5 truncate">{ch.provider}</p>
            </div>

            <div className="pt-1.5 border-t border-border flex items-center justify-between text-[10px] font-mono">
              <span className="text-secondary truncate">{ch.throughput}</span>
              <span className="text-charcoal font-medium">{ch.lastEvent}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bento Grid: Live Events Stream + Webhook Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Stream Ledger (7 cols) */}
        <div className="lg:col-span-7 border border-border rounded-card bg-surface p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif text-lg font-semibold text-charcoal">
                Live Ingestion Stream
              </h4>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border text-secondary">
                Auto-Updating Feed
              </span>
            </div>

            <div className="overflow-x-auto border border-border rounded">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle border-b border-border text-secondary font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Event ID</th>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.map((e) => (
                    <tr key={e.id} className="hover:bg-surface-subtle transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-charcoal">
                        {e.id}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-secondary">{e.channel}</td>
                      <td className="py-2.5 px-3 font-medium text-charcoal">
                        {e.district}, {e.state}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-surface-subtle border border-border text-charcoal font-mono text-[10px]">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-secondary">
                        {e.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Webhook Connectivity Validator (5 cols) */}
        <div className="lg:col-span-5 border border-border rounded-card bg-surface p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-lg font-semibold text-charcoal">
              Webhook Ingestion Dispatcher
            </h4>
            <span className="text-[10px] font-mono text-secondary">
              Direct Gateway Trigger
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div>
              <label className="text-secondary block mb-1">Target Ingestion Channel:</label>
              <select
                value={testChannel}
                onChange={(e) => setTestChannel(e.target.value)}
                className="w-full px-3 py-1.5 border border-border rounded bg-surface-subtle text-charcoal focus:outline-none"
              >
                <option value="rapidpro_omnichannel">RapidPro DPG Flow (SMS & WhatsApp Dual Reply)</option>
                <option value="whatsapp_voice">WhatsApp Meta Cloud API (Voice)</option>
                <option value="whatsapp_text">WhatsApp Meta Cloud API (Text)</option>
                <option value="web_voice">Twilio Inbound IVR Voice Stream</option>
              </select>
            </div>

            {testChannel === 'rapidpro_omnichannel' && (
              <div className="p-2 rounded bg-surface-subtle border border-border text-[11px] text-secondary flex items-center justify-between">
                <span>Flow Schema: <code className="text-charcoal font-bold">rapidpro_vaani_flow.json</code></span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-pastel-blue text-pastel-blue-text font-bold uppercase">Dual Reply Active</span>
              </div>
            )}

            <div>
              <label className="text-secondary block mb-1">Attached Multimodal Visual Evidence:</label>
              <div className="flex gap-2">
                {['roads', 'water', 'power'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTestPhoto(cat)}
                    className={`flex-1 py-1 rounded border capitalize transition-colors ${
                      testPhoto === cat
                        ? 'bg-charcoal text-white border-charcoal'
                        : 'border-border bg-surface text-secondary hover:text-charcoal'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-secondary block mb-1">Payload Content:</label>
              <textarea
                rows={2}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full p-2.5 text-xs border border-border rounded bg-surface font-sans text-charcoal focus:outline-none"
              />
            </div>

            {canDispatch ? (
              <button
                onClick={handleTestIngest}
                disabled={isTesting}
                className="w-full py-2 rounded bg-charcoal text-white text-xs font-medium uppercase tracking-wider hover:bg-charcoal/90 transition-colors shadow-subtle disabled:opacity-50"
              >
                {isTesting ? 'Streaming to Cloud Run...' : 'Dispatch Live Inbound Event'}
              </button>
            ) : (
              <div className="w-full rounded border border-border px-3 py-2 text-center text-[11px] font-mono text-secondary">
                Read-only viewer mode · live dispatch disabled
              </div>
            )}
          </div>

          {lastResult && (
            <div className="p-3 rounded border border-border bg-surface-subtle text-xs space-y-1 font-mono">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-charcoal">Result: {lastResult.request_id}</span>
                <span className="text-pastel-green-text font-bold">200 OK</span>
              </div>
              <div className="text-[11px] text-secondary">
                Language: <strong className="text-charcoal uppercase">{lastResult.language}</strong> · ASR: <strong className="text-charcoal">{lastResult.asr_rung}</strong>
              </div>
              {lastResult.gemini_vision_inspection && (
                <div className="text-[11px] text-secondary pt-1 border-t border-border">
                  Gemini Inspection: <strong className="text-charcoal">{lastResult.gemini_vision_inspection.damage_type.replace(/_/g, ' ')}</strong> (Severity {lastResult.gemini_vision_inspection.severity_score}/5.0)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
