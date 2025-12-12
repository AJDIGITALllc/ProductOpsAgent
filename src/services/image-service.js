/**
 * Image Service
 * 
 * Handles image generation using Gemini (Nano Banana / Pro)
 * - Generates one product image per run
 * - Stores asset in owned storage
 * - Attaches to product
 * - Enforces daily image cap
 */

const { checkImageQuota, recordImageGeneration } = require('./telemetry-service');

/**
 * Generate an image using Gemini
 * @param {string} prompt - Image generation prompt
 * @param {Object} settings - Generation settings
 * @returns {Promise<Object>} Generated image data with URL and metadata
 */
async function generateImage(prompt, settings = {}) {
  // Check image quota before proceeding
  checkImageQuota();
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured - image generation disabled');
  }
  
  console.log(`🎨 Generating image with prompt: "${prompt.substring(0, 50)}..."`);
  
  const {
    model = 'gemini-pro-vision',
    style = 'professional',
    aspectRatio = '16:9',
    quality = 'high'
  } = settings;
  
  try {
    // Simulate image generation (would call actual Gemini API in production)
    const imageData = await mockGenerateImage(prompt, {
      model,
      style,
      aspectRatio,
      quality
    });
    
    // Store the image in owned storage
    const storedImage = await storeImage(imageData);
    
    // Record telemetry
    recordImageGeneration();
    
    console.log(`✓ Image generated and stored: ${storedImage.url}`);
    
    return {
      url: storedImage.url,
      prompt,
      settings: {
        model,
        style,
        aspectRatio,
        quality
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        storageKey: storedImage.key
      }
    };
  } catch (error) {
    console.error('❌ Image generation failed:', error.message);
    throw error;
  }
}

/**
 * Mock image generation (replace with actual Gemini API call)
 */
async function mockGenerateImage(prompt, settings) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    data: 'base64-encoded-image-data',
    format: 'png',
    width: 1920,
    height: 1080
  };
}

/**
 * Store image in owned storage (S3, Cloud Storage, etc.)
 */
async function storeImage(imageData) {
  const bucket = process.env.STORAGE_BUCKET || 'productops-assets';
  const region = process.env.STORAGE_REGION || 'us-east-1';
  const key = `images/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
  
  console.log(`💾 Storing image in ${bucket}/${key}`);
  
  // Simulate storage (would use actual S3/GCS API in production)
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  
  return {
    url,
    key,
    bucket
  };
}

/**
 * Get image generation settings for PLAN view
 */
function getImageSettings() {
  return {
    availableModels: ['gemini-pro-vision', 'gemini-nano'],
    availableStyles: ['professional', 'modern', 'minimalist', 'bold', 'creative'],
    availableAspectRatios: ['16:9', '1:1', '4:3', '9:16'],
    availableQualities: ['standard', 'high', 'ultra'],
    defaultSettings: {
      model: 'gemini-pro-vision',
      style: 'professional',
      aspectRatio: '16:9',
      quality: 'high'
    }
  };
}

module.exports = {
  generateImage,
  getImageSettings
};
