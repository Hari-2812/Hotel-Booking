const crypto = require("crypto");

const { env } = require("../config/env");

function canUseCloudinary() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

function createUploadSignature({ timestamp, folder = "staybook" }) {
  if (!canUseCloudinary()) return null;

  const toSign = `folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder,
    timestamp,
    signature,
  };
}

module.exports = {
  canUseCloudinary,
  createUploadSignature,
};
