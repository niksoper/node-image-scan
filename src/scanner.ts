import { createReadStream } from "fs"
import request from 'request'

export interface ScannerOptions {
  url: string
  key: string
  retryInterval: number
}

interface Prediction {
  TagId: string
  Tag: string
  Probability: number
}

interface PredictionResponse {
  Predictions: Prediction[]
}

const RATE_LIMIT_EXCEEDED = 429

export function createScanner({ url, key, retryInterval }: ScannerOptions) {
  return function scan(filePath: string) {
    console.log(`PATH: ${filePath}`)
    createReadStream(filePath).pipe(request.post({
      url,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Prediction-Key': key,
      }
    }, (err, response, rawBody) => {
      console.log(`${filePath} received ${response.statusCode}`)
      if (response.statusCode !== 200) {
        console.log(rawBody)
  
        if (response.statusCode === RATE_LIMIT_EXCEEDED) {
          console.log(`Retrying in ${retryInterval / 1000} seconds...`)
          setTimeout(() => scan(filePath), retryInterval)
        }
        return
      }
  
      const body = JSON.parse(rawBody) as PredictionResponse
      console.log(body.Predictions.map(p => {
        const { TagId, ...rest } = p
        return rest
      }))
    }))
  }
}