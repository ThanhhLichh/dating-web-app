import api from "./api";

class CallService {
  constructor() {
    this.ws = null;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.callId = null;
    this.targetUserId = null;
    this.startTime = null;
    this.pendingCandidates = [];

    this.iceServers = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };
  }

  connect(matchId, token) {
    return new Promise((resolve, reject) => {
      if (this.ws) this.ws.close();
      this.ws = new WebSocket(`ws://127.0.0.1:8000/ws/call/${matchId}?token=${token}`);
      this.ws.onopen = () => { console.log("📞 Call WebSocket connected"); resolve(); };
      this.ws.onerror = (err) => { console.error("❌ Call WS error:", err); reject(err); };
      this.ws.onclose = () => console.log("📵 Call WebSocket closed");
    });
  }

  async startCall(targetUserId, callType = "voice", onIncomingStream) {
    this.targetUserId = targetUserId;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error("WebSocket chưa kết nối");

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
    } catch (err) {
      console.warn("⚠️ Không thể lấy Camera/Mic:", err);
      this.localStream = null;
    }

    try {
      this.peerConnection = new RTCPeerConnection(this.iceServers);
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => this.peerConnection.addTrack(track, this.localStream));
      }
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        onIncomingStream(this.remoteStream);
      };
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: "ice-candidate", target_id: this.targetUserId, candidate: event.candidate }));
        }
      };

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "call-offer", target_id: targetUserId, call_type: callType, offer: offer }));
      }
      this.startTime = Date.now();
      return this.localStream;
    } catch (err) {
      console.error("❌ Lỗi startCall:", err);
      this.cleanup();
      throw err;
    }
  }

  async answerCall(offer, callId, callType, onIncomingStream) {
    this.callId = callId;
    this.pendingCandidates = [];
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error("WebSocket chưa kết nối");

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
    } catch (err) {
      console.warn("⚠️ Không thể lấy Camera/Mic:", err);
      this.localStream = null;
    }

    try {
      this.peerConnection = new RTCPeerConnection(this.iceServers);
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => this.peerConnection.addTrack(track, this.localStream));
      }
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        onIncomingStream(this.remoteStream);
      };
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: "ice-candidate", target_id: this.targetUserId, candidate: event.candidate }));
        }
      };

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      for (const candidate of this.pendingCandidates) await this.peerConnection.addIceCandidate(candidate);
      this.pendingCandidates = [];

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "call-answer", target_id: this.targetUserId, call_id: callId, answer: answer }));
      }
      this.startTime = Date.now();
      return this.localStream;
    } catch (err) {
      console.error("❌ Lỗi answerCall:", err);
      this.cleanup();
      throw err;
    }
  }

  onMessage(callback) {
    this.ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      callback(message);
      if (message.type === "call-answered" && this.peerConnection) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
        for (const candidate of this.pendingCandidates) await this.peerConnection.addIceCandidate(candidate);
        this.pendingCandidates = [];
      }
      if (message.type === "ice-candidate" && this.peerConnection) {
        const candidate = new RTCIceCandidate(message.candidate);
        if (this.peerConnection.remoteDescription) await this.peerConnection.addIceCandidate(candidate);
        else this.pendingCandidates.push(candidate);
      }
    };
  }

  rejectCall(callId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "call-reject", target_id: this.targetUserId, call_id: callId }));
    }
    this.cleanup();
  }

  // ✅ SỬA: Nhận thêm tham số callType
  endCall(callType = "voice") {
    const duration = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.targetUserId) {
      this.ws.send(JSON.stringify({
        type: "call-end",
        target_id: this.targetUserId,
        call_id: this.callId,
        duration: duration,
        call_type: callType, // 👈 Gửi type lên server
      }));
    }
    this.cleanup();
  }

  cleanup() {
    if (this.localStream) this.localStream.getTracks().forEach((track) => track.stop());
    if (this.peerConnection) this.peerConnection.close();
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.startTime = null;
    this.pendingCandidates = [];
  }

  toggleMic() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  toggleCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }
}

export default new CallService();