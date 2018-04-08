import { createReadStream } from 'fs';
import request from 'request';

export interface ScannerOptions {
  url: string
  key: string
  retryInterval: number
}

export interface Prediction {
  TagId: string
  Tag: string
  Probability: number
}

export interface PredictionResponseBody {
  Predictions: Prediction[]
}

export interface PredictionResponse {
  response: request.Response
  rawBody: string
  body: PredictionResponseBody
}

export const RATE_LIMIT_EXCEEDED = 429

export function createScanner({ url, key, retryInterval }: ScannerOptions) {
  return function scan(filePath: string): Promise<PredictionResponse> {
    return new Promise((resolve, reject) => {
      createReadStream(filePath).pipe(request.post({
        url,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Prediction-Key': key,
        }
      }, (err, response, body) => {
        if (err) {
          reject(err)
          return
        }

        const parsedBody = response.statusCode === 200 ? JSON.parse(body) : null
        resolve({
          response,
          rawBody: body,
          body: parsedBody
        })
      }))
    })
  }
}
