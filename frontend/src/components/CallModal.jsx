import { useState, useEffect, useRef } from "react";
import { FaPhone, FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideo as FaVideoOn, FaVideoSlash, FaTimes } from "react-icons/fa";
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

  // ✅ Hiển thị local stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // ✅ Hiển thị remote stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ✅ Đếm thời gian cuộc gọi
  useEffect(() => {
    if (!isIncoming && (remoteStream || isCallAccepted)) {
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isIncoming, remoteStream, isCallAccepted]);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleToggleMic = () => {
    const enabled = onToggleMic();
    setIsMuted(!enabled);
  };

  const handleToggleCamera = () => {
    const enabled = onToggleCamera();
    setIsCameraOff(!enabled);
  };

  if (!isOpen) return null;

  return (
    <div className="call-modal-overlay">
      <div className="call-modal">
        {/* 📞 Cuộc gọi đến */}
        {isIncoming && !isCallAccepted && (
          <div className="incoming-call">
            <div className="caller-avatar">
              <FaPhone className="phone-icon pulse" />
            </div>
            <h2>{callerName}</h2>
            <p>
              {callType === "video" ? "📹 Video call" : "📞 Voice call"} đến...
            </p>
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

        {/* 📹 Đang trong cuộc gọi */}
        {(remoteStream || isCallAccepted) && (
          <div className="active-call">
            {/* Video người đối phương */}
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
                  <div style={{ 
                      width: '100%', height: '100%', 
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'white', background: '#111' 
                  }}>
                      <div className="pulse" style={{fontSize: '2rem', marginBottom: '10px'}}>📡</div>
                      <p>Đang kết nối tín hiệu...</p>
                  </div>
                )
              ) : (
                <div className="audio-call-avatar">
                  <FaPhone className="phone-icon" />
                  <p>{callerName}</p>
                  {!remoteStream && <small style={{color: '#ddd'}}>Đang kết nối...</small>}
                </div>
              )}
            </div>

            {/* Video của mình (góc phải trên) */}
            {callType === "video" && (
              <div className="local-video-container">
                {localStream ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="local-video"
                  />
                ) : (
                  /* Fallback khi không có camera */
                  <div style={{
                    width: '100%', height: '100%', 
                    background: '#333', display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', color: '#888'
                  }}>
                     <FaVideoSlash size={24} />
                     <span style={{fontSize: '10px', marginTop: '4px'}}>No Cam</span>
                  </div>
                )}
              </div>
            )}

            {/* Thông tin cuộc gọi */}
            <div className="call-info">
              <h3>{callerName}</h3>
              <p>{formatDuration(duration)}</p>
            </div>

            {/* Nút điều khiển */}
            <div className="call-controls">
              <button
                className={`btn-control ${isMuted ? "muted" : ""}`}
                onClick={handleToggleMic}
                title={isMuted ? "Bật mic" : "Tắt mic"}
              >
                {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>

              {callType === "video" && (
                <button
                  className={`btn-control ${isCameraOff ? "muted" : ""}`}
                  onClick={handleToggleCamera}
                  title={isCameraOff ? "Bật camera" : "Tắt camera"}
                >
                  {isCameraOff ? <FaVideoSlash /> : <FaVideoOn />}
                </button>
              )}

              <button className="btn-end" onClick={onEnd} title="Kết thúc">
                <FaPhone />
              </button>
            </div>
          </div>
        )}

        {/* 📞 Đang gọi... */}
        {!isIncoming && !remoteStream && !isCallAccepted && (
          <div className="calling-out">
            <div className="caller-avatar">
              <FaPhone className="phone-icon pulse" />
            </div>
            <h2>{callerName}</h2>
            <p>Đang gọi...</p>
            <button className="btn-end" onClick={onEnd}>
              <FaTimes /> Hủy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}