/**
 * AudioWorkletProcessor that captures raw PCM16 (Int16) audio from the
 * microphone and posts it to the main thread as base64-encoded strings
 * ready to send over the OpenAI Realtime WebSocket.
 *
 * Registration name: "pcm-recorder-processor"
 */
class PcmRecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0]; // mono
    if (!channelData || channelData.length === 0) return true;

    // Convert Float32 [-1,1] → Int16 [-32768,32767]
    const pcm16 = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Convert to base64 string
    const bytes = new Uint8Array(pcm16.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    this.port.postMessage({ pcm16Base64: btoa(binary) });
    return true;
  }
}

registerProcessor("pcm-recorder-processor", PcmRecorderProcessor);
