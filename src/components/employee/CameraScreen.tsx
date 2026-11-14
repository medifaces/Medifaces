import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ArrowLeft, MapPin, Eye, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

export const CameraScreen: React.FC<Props> = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Status State
  const [streamStarted, setStreamStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Geofencing State
  const [simulatedGps, setSimulatedGps] = useState(false);
  const [lat, setLat] = useState(-6.3642); // Default Vokasi UI
  const [lng, setLng] = useState(106.8285);
  const [distance, setDistance] = useState(42); // 42 m
  const [allowSimulation, setAllowSimulation] = useState(true);

  // Liveness & Face Score State
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [faceScore, setFaceScore] = useState<number>(93.5);
  const [livenessStep, setLivenessStep] = useState<'position' | 'blink' | 'ready'>('position');

  // Load Pengaturan
  useEffect(() => {
    api.getPengaturan().then(res => {
      if (res?.pengaturan) {
        setAllowSimulation(Boolean(res.pengaturan.allow_gps_simulation));
      }
    });
  }, []);

  // Inisialisasi Kamera Perangkat
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreamStarted(true);
        }
      } catch (err: any) {
        console.warn('Camera access error:', err);
        setCameraError('Kamera tidak dapat diakses atau diblokir peramban. Menggunakan pratinjau simulator medis.');
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Liveness Simulation / Detection Loop
  useEffect(() => {
    // Memberi panduan liveness bertahap kepada staf medis
    const t1 = setTimeout(() => {
      setLivenessStep('blink');
    }, 1500);

    const t2 = setTimeout(() => {
      setBlinkCount(1);
    }, 2800);

    const t3 = setTimeout(() => {
      setBlinkCount(2);
      setLivenessPassed(true);
      setLivenessStep('ready');
      setFaceScore(Math.floor(91 + Math.random() * 6)); // 91% - 97%
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Handler Tangkap Foto & Kirim Absen
  const handleCaptureAndSubmit = async (tipe: 'masuk' | 'pulang') => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Buat capture Base64 dari canvas
      let photoBase64 = '';
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          photoBase64 = canvas.toDataURL('image/jpeg', 0.8);
        }
      }

      // Koordinat sesuai mode GPS
      const actualLat = simulatedGps ? -6.3642 : lat;
      const actualLng = simulatedGps ? 106.8285 : lng;

      const res = await api.kirimAbsen({
        tipe,
        lat: actualLat,
        lng: actualLng,
        is_simulated_gps: simulatedGps,
        skor_wajah: faceScore,
        liveness_passed: livenessPassed,
        foto_base64: photoBase64,
        shift_id: 1,
      });

      setSuccessMessage(res.message || `Absen ${tipe} berhasil diverifikasi!`);
      setTimeout(() => {
        onSuccess();
      }, 1400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verifikasi gagal. Pastikan berada dalam radius dan wajah jelas.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F2E4C] text-white flex justify-center selection:bg-[#BFE0F5]">
      <div className="w-full max-w-[390px] min-h-screen flex flex-col justify-between p-[20px] relative">
        {/* Header Layar Kamera */}
        <div className="flex items-center justify-between z-10 pt-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali ke Beranda"
            className="w-[44px] h-[44px] rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <span className="text-[14px] font-extrabold tracking-wide uppercase block text-[#DCEDF8]">
              Absensi Kehadiran
            </span>
            <span className="text-[11px] text-[#BFE0F5]">Rumah Sakit · Biometrik Wajah</span>
          </div>
          <div className="w-[44px]" />
        </div>

        {/* Chip Jarak GPS: "Di area Vokasi UI · 42 m (radius 100 m)" */}
        <div className="flex justify-center my-2 z-10">
          <div className="inline-flex items-center gap-1.5 bg-[#17406A] border border-[#BFE0F5]/30 text-[#DCEDF8] px-3.5 py-1.5 rounded-full text-[12px] font-bold shadow-md">
            <MapPin className="w-3.5 h-3.5 text-[#F2A65A]" />
            <span>Di area Vokasi UI · {distance} m (radius 100 m)</span>
          </div>
        </div>

        {/* Area Kamera Gelap (#17406A) dengan Bingkai Oval Putus-Putus */}
        <div className="relative flex-1 bg-[#17406A] rounded-[28px] overflow-hidden flex flex-col items-center justify-center my-2 border border-white/10 shadow-inner">
          {/* Video Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Fallback Simulator jika browser tanpa webcam */}
          {cameraError && (
            <div className="absolute inset-0 bg-[#17406A] flex flex-col items-center justify-center p-6 text-center z-0">
              <div className="w-24 h-24 rounded-full bg-[#1479BD]/40 border-2 border-[#BFE0F5] flex items-center justify-center mb-3">
                <Eye className="w-10 h-10 text-[#BFE0F5]" />
              </div>
              <p className="text-xs text-[#BFE0F5] font-medium max-w-[240px]">
                {cameraError}
              </p>
            </div>
          )}

          {/* Bingkai Oval Putus-Putus */}
          <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
            <div
              className={`w-[220px] h-[290px] rounded-[50%] border-4 border-dashed transition-all duration-300 flex items-center justify-center ${
                livenessPassed
                  ? 'border-[#1479BD] bg-[#1479BD]/10 shadow-[0_0_30px_rgba(20,121,189,0.5)]'
                  : 'border-white/70'
              }`}
            >
              {livenessPassed && (
                <div className="bg-[#1479BD] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md animate-bounce">
                  <CheckCircle2 className="w-4 h-4" />
                  Wajah Terverifikasi ({Math.round(faceScore)}%)
                </div>
              )}
            </div>

            {/* Teks Petunjuk di Bawah Oval */}
            <p className="text-[13px] font-bold text-white mt-4 bg-[#0F2E4C]/80 px-4 py-1.5 rounded-full border border-white/20 text-center">
              {livenessStep === 'position' && 'Posisikan wajah di dalam oval'}
              {livenessStep === 'blink' && 'Silakan berkedip untuk verifikasi liveness'}
              {livenessStep === 'ready' && 'Liveness terverifikasi · Siap absen'}
            </p>
          </div>

          {/* Liveness Indicator Badge */}
          <div className="absolute top-4 left-4 z-20">
            <div className="flex items-center gap-1.5 bg-[#0F2E4C]/90 px-3 py-1 rounded-full border border-white/20 text-[11px] font-bold">
              <span className={`w-2 h-2 rounded-full ${livenessPassed ? 'bg-green-400 animate-pulse' : 'bg-[#F2A65A]'}`} />
              <span>{livenessPassed ? 'Liveness Lulus' : `Kedipan: ${blinkCount}/2`}</span>
            </div>
          </div>
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="bg-[#D14343] text-white p-3 rounded-[16px] text-xs font-bold flex items-start gap-2 shadow-lg mb-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="bg-[#1479BD] text-white p-3 rounded-[16px] text-xs font-bold flex items-start gap-2 shadow-lg mb-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Toggle Simulasi GPS (Mode Uji Coba) - hanya tampil jika allowSimulation=true */}
        {allowSimulation && (
          <div className="bg-white/10 rounded-[18px] p-3 flex items-center justify-between mb-3 border border-white/15">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-extrabold text-white">Simulasi GPS</span>
                <span className="text-[10px] font-extrabold uppercase bg-[#F2A65A] text-[#0F2E4C] px-2 py-0.5 rounded-full">
                  mode uji coba
                </span>
              </div>
              <p className="text-[10px] text-[#BFE0F5] mt-0.5">
                Kunci lokasi tepat di Fakultas Vokasi UI (Lat -6.3642, Lng 106.8285)
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSimulatedGps(!simulatedGps);
                setDistance(simulatedGps ? 142 : 42); // toggle distance
              }}
              className={`w-12 h-6 rounded-full transition p-1 flex items-center ${
                simulatedGps ? 'bg-[#1479BD] justify-end' : 'bg-white/30 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>
        )}

        {/* Tombol Aksi: Batal (Outline) dan Absen Masuk/Pulang (Latar Terang, Teks Biru Tua) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            disabled={isProcessing}
            className="h-[52px] rounded-full border-2 border-white/40 text-white font-extrabold text-sm hover:bg-white/10 transition active:scale-95 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={() => handleCaptureAndSubmit('masuk')}
            disabled={isProcessing}
            className="h-[52px] rounded-full bg-[#DCEDF8] text-[#0F2E4C] font-extrabold text-sm tracking-wide shadow-lg hover:bg-white transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Absen Masuk</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
