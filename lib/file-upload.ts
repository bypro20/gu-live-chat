import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { put } from '@vercel/blob'

export type UploadInput = {
  buffer: Buffer
  safeFileName: string
  originalName: string
  mimeType: string
  keyPrefix: string
}

export type UploadResult = {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
}

function getS3Client(): S3Client | null {
  const region = process.env.AWS_REGION || 'eu-central-1'
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
    return null
  }
  return new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })
}

async function uploadToS3(input: UploadInput): Promise<UploadResult | null> {
  const s3 = getS3Client()
  const bucket = process.env.AWS_S3_BUCKET
  if (!s3 || !bucket) return null

  const key = `${input.keyPrefix}/${input.safeFileName}`
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.buffer,
      ContentType: input.mimeType,
    })
  )
  const baseUrl = process.env.AWS_S3_PUBLIC_URL || `https://${bucket}.s3.amazonaws.com`
  return {
    url: `${baseUrl}/${key}`,
    fileName: input.originalName,
    fileSize: input.buffer.length,
    mimeType: input.mimeType,
  }
}

async function uploadToVercelBlob(input: UploadInput): Promise<UploadResult | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) return null

  const blob = await put(`${input.keyPrefix}/${input.safeFileName}`, input.buffer, {
    access: 'public',
    contentType: input.mimeType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  return {
    url: blob.url,
    fileName: input.originalName,
    fileSize: input.buffer.length,
    mimeType: input.mimeType,
  }
}

async function uploadToLocal(input: UploadInput): Promise<UploadResult | null> {
  if (process.env.VERCEL) return null

  const relDir = input.keyPrefix.replace(/^uploads\/?/, '')
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', relDir)
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, input.safeFileName), input.buffer)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const publicPath = `/uploads/${relDir ? `${relDir}/` : ''}${input.safeFileName}`
  const url = appUrl ? `${appUrl.replace(/\/$/, '')}${publicPath}` : publicPath

  return {
    url,
    fileName: input.originalName,
    fileSize: input.buffer.length,
    mimeType: input.mimeType,
  }
}

/** S3 → Vercel Blob → local disk (dev). */
export async function uploadFileBuffer(input: UploadInput): Promise<UploadResult> {
  const s3Result = await uploadToS3(input)
  if (s3Result) return s3Result

  const blobResult = await uploadToVercelBlob(input)
  if (blobResult) return blobResult

  const localResult = await uploadToLocal(input)
  if (localResult) return localResult

  throw new Error('STORAGE_NOT_CONFIGURED')
}

export function isFileStorageConfigured(): boolean {
  if (getS3Client() && process.env.AWS_S3_BUCKET) return true
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return true
  if (!process.env.VERCEL) return true
  return false
}
