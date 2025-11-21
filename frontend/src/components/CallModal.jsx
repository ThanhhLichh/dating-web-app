import { useState, useEffect, useRef } from "react";
import {
  FaPhone,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo as FaVideoOn,
  FaVideoSlash,
  FaTimes,
} from "react-icons/fa";
import "./CallModal.css";

export default function CallModal({
  isOpen,
  callType,
  isIncoming,
  isCallAccepted,
  callerName,
  localStream,
  remoteStream,
  onAccept,
  onReject,
  onEnd,
  onToggleMic,
  onToggleCamera,
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const remoteAudioRef = useRef(null);


  // ALWAYS ATTACH LOCAL STREAM (Fix mất video người gọi)
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, remoteStream, isCallAccepted]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Timer khi kết nối
  useEffect(() => {
    if (remoteStream || isCallAccepted) {
      const interval = setInterval(() => setDuration((t) => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [remoteStream, isCallAccepted]);

  useEffect(() => {
  if (remoteAudioRef.current && remoteStream) {
    remoteAudioRef.current.srcObject = remoteStream;
  }
}, [remoteStream]);


  const formatDuration = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!isOpen) return null;

  const callConnected = remoteStream || isCallAccepted;

  return (
    <div className="call-modal-overlay">
      <div className="call-modal">

        {/* --------------------- INCOMING CALL --------------------- */}
        {isIncoming && !isCallAccepted && (
          <div className="incoming-call">
            <div className="caller-avatar">
              <FaPhone className="phone-icon pulse" />
            </div>
            <h2>{callerName}</h2>
            <p>{callType === "video" ? "📹 Video call đến..." : "📞 Voice call đến..."}</p>

            <div className="call-actions">
              <button className="btn-accept" onClick={onAccept}>
                <FaPhone /> Trả lời
              </button>
              <button className="btn-reject" onClick={onReject}>
                <FaTimes /> Từ chối
              </button>
            </div>
          </div>
        )}

        {/* --------------------- OUTGOING CALL (Chờ bắt máy) --------------------- */}
        {!isIncoming && !callConnected && (
          <div className="calling-out">
            {/* Local video ALWAYS visible */}
            {callType === "video" && (
              <div className="local-video-container">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="local-video"
                />
              </div>
            )}

            <div className="caller-avatar">
              <FaPhone className="phone-icon pulse" />
            </div>

            <h2>{callerName}</h2>
            <p>Đang gọi...</p>

            {/* Only 1 cancel button */}
            <button className="btn-end" onClick={onEnd}>
              <FaTimes /> Hủy
            </button>
          </div>
        )}

       {/* --------------------- ACTIVE CALL (Đã kết nối) --------------------- */}
{callConnected && (
  <div className="active-call">

    {/* Remote video hoặc avatar cho voice call */}
    <div className="remote-video-container">
      {callType === "video" ? (
        remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
        ) : (
          <div className="connecting">
            <div className="pulse" style={{ fontSize: "2rem", marginBottom: "10px" }}>
              📡
            </div>
            <p>Đang kết nối tín hiệu...</p>
          </div>
        )
      ) : (
        <div className="audio-call-avatar">
          <FaPhone className="phone-icon" />
          <p>{callerName}</p>
        </div>
      )}
    </div>

    {/* ✅ Remote audio player (quan trọng!!) */}
    {callType === "voice" && (
      <audio ref={remoteAudioRef} autoPlay playsInline />
    )}

    {/* Local video ALWAYS visible */}
    {callType === "video" && (
      <div className="local-video-container">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="local-video"
        />
      </div>
    )}

    {/* Call Info */}
    <div className="call-info">
      <h3>{callerName}</h3>
      <p>{formatDuration(duration)}</p>
    </div>

    {/* Controls */}
    <div className="call-controls">
      <button
        className={`btn-control ${isMuted ? "muted" : ""}`}
        onClick={() => setIsMuted(!onToggleMic())}
      >
        {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
      </button>

      {callType === "video" && (
        <button
          className={`btn-control ${isCameraOff ? "muted" : ""}`}
          onClick={() => setIsCameraOff(!onToggleCamera())}
        >
          {isCameraOff ? <FaVideoSlash /> : <FaVideoOn />}
        </button>
      )}

      <button className="btn-end" onClick={onEnd}>
        <FaPhone />
      </button>
    </div>

  </div>
)}


      </div>
    </div>
  );
}
