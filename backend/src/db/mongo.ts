import { MongoClient, Db, Collection } from 'mongodb'
import { config } from '../config'
import { logger } from '../utils/logger'
import { VerificationRecord, CertificationRecord } from '../types'

let client: MongoClient | null = null
let db: Db | null = null

/**
 * Connect to MongoDB and return the database instance.
 */
export async function connectToMongoDB(): Promise<Db> {
  if (db) return db

  client = new MongoClient(config.MONGO_URI)
  await client.connect()
  db = client.db('socialcert')

  // Create indexes
  const verifications = db.collection('verifications')
  await verifications.createIndex({ identityKey: 1 })
  await verifications.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 86400 } // TTL: 24 hours
  )

  const certifications = db.collection('certifications')
  await certifications.createIndex({ identityKey: 1 })
  await certifications.createIndex({ identityKey: 1, serialNumber: 1 }, { unique: true })

  logger.info('Connected to MongoDB')
  return db
}

/**
 * Get the MongoDB client for health checks.
 */
export function getMongoClient(): MongoClient | null {
  return client
}

/**
 * Get a typed collection reference.
 */
function getDb(): Db {
  if (!db) throw new Error('MongoDB not connected')
  return db
}

export function verificationsCollection(): Collection<VerificationRecord> {
  return getDb().collection<VerificationRecord>('verifications')
}

export function certificationsCollection(): Collection<CertificationRecord> {
  return getDb().collection<CertificationRecord>('certifications')
}

/**
 * Upsert a verification record after successful platform verification.
 */
export async function writeVerifiedAttributes(
  identityKey: string,
  verifiedAttributes: Record<string, string>
): Promise<void> {
  await verificationsCollection().updateOne(
    { identityKey, verifiedAttributes },
    {
      $set: {
        identityKey,
        verifiedAttributes,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  )
}

/**
 * Find a verification record matching identity key and attributes.
 */
export async function findVerification(
  identityKey: string,
  verifiedAttributes: Record<string, string>
): Promise<VerificationRecord | null> {
  return verificationsCollection().findOne({ identityKey, verifiedAttributes })
}

/**
 * Upsert a signed certificate record.
 */
export async function writeSignedCertificate(
  identityKey: string,
  serialNumber: string,
  signedCertificate: Record<string, unknown>
): Promise<void> {
  await certificationsCollection().updateOne(
    { identityKey, serialNumber },
    {
      $set: {
        identityKey,
        serialNumber,
        signedCertificate,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  )
}

/**
 * Gracefully close the MongoDB connection.
 */
export async function closeMongoConnection(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
    logger.info('MongoDB connection closed')
  }
}
