const mongoose = require('mongoose');

function getBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'reports' });
}

function uploadFile({ fileBuffer, mimetype, originalName, patientId }) {
  const bucket   = getBucket();
  const filename = `${patientId}-${Date.now()}-${originalName}`;
  const uploadStream = bucket.openUploadStream(filename, {
    metadata: { mimetype, patientId }
  });
  return new Promise((resolve, reject) => {
    uploadStream.on('finish', () => resolve({ fileId: uploadStream.id.toString(), filename }));
    uploadStream.on('error',  reject);
    uploadStream.end(fileBuffer);
  });
}

function getFileStream(fileId) {
  return getBucket().openDownloadStream(new mongoose.Types.ObjectId(fileId));
}

function deleteFile(fileId) {
  return getBucket().delete(new mongoose.Types.ObjectId(fileId));
}

module.exports = { uploadFile, getFileStream, deleteFile };
