import { BlobServiceClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

function getContainerClient() {
  if (!connectionString || !containerName) {
    throw new Error("Azure Blob Storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING and AZURE_STORAGE_CONTAINER_NAME in .env");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  return blobServiceClient.getContainerClient(containerName);
}

export async function ensureBlobContainer() {
  const containerClient = getContainerClient();
  await containerClient.createIfNotExists();
  return containerClient;
}

export async function uploadBufferToBlob(params: {
  buffer: Buffer;
  blobName: string;
  contentType?: string;
}) {
  const containerClient = await ensureBlobContainer();
  const blockBlobClient = containerClient.getBlockBlobClient(params.blobName);

  await blockBlobClient.uploadData(params.buffer, {
    blobHTTPHeaders: {
      blobContentType: params.contentType || "application/octet-stream",
    },
  });

  return {
    url: blockBlobClient.url,
    blobName: params.blobName,
  };
}
