import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

class FaceVerificationService {
  constructor() {
    this.modelsLoaded = false;
    this.referenceDescriptor = null;
  }

  async loadModels() {
    if (this.modelsLoaded) return;
    
    try {
      // Force CPU backend to avoid WebGL shader compilation issues on some hardware
      if (faceapi.tf) {
        await faceapi.tf.setBackend('cpu');
        console.log('Using CPU backend for face-api.js');
      }
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      this.modelsLoaded = true;
      console.log('Face verification models loaded successfully');
    } catch (error) {
      console.error('Error loading face verification models:', error);
      throw error;
    }
  }

  async getDescriptorFromImage(imageBase64) {
    if (!this.modelsLoaded) await this.loadModels();

    const img = await faceapi.fetchImage(imageBase64);
    const detection = await faceapi.detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection ? detection.descriptor : null;
  }

  async setReferencePhoto(imageBase64) {
    this.referenceDescriptor = await this.getDescriptorFromImage(imageBase64);
    return !!this.referenceDescriptor;
  }

  async verifyFace(liveImageBase64) {
    if (!this.modelsLoaded) await this.loadModels();
    if (!this.referenceDescriptor) return { match: true, distance: 0 }; // Baseline if no ref

    const liveDescriptor = await this.getDescriptorFromImage(liveImageBase64);
    if (!liveDescriptor) return { match: false, distance: 1.0, error: 'NO_FACE' };

    const distance = faceapi.euclideanDistance(this.referenceDescriptor, liveDescriptor);
    
    // Threshold usually 0.6. Lower distance = better match.
    return {
      match: distance < 0.6,
      distance: (1 - distance) * 100, // Convert to confidence percentage
      rawDistance: distance
    };
  }
}

const faceVerificationService = new FaceVerificationService();
export default faceVerificationService;
