import { Router, Request, Response } from 'express'
import client from 'prom-client'

// Collect default Node.js metrics
client.collectDefaultMetrics({ prefix: 'socialcert_' })

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
})

export const externalApiDuration = new client.Histogram({
  name: 'external_api_duration_seconds',
  help: 'Duration of external API calls',
  labelNames: ['service', 'operation'],
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})

const router = Router()

router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', client.register.contentType)
    res.end(await client.register.metrics())
  } catch (err) {
    res.status(500).end()
  }
})

export default router
