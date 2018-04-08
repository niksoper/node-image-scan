import { Prediction } from "./scanner"
import { existsSync, readFile, readFileSync, writeFileSync } from 'fs'
import path from 'path'

export interface ScannedImage {
  scannedOn: string
  name: string
  predictions: Prediction[]
}

export interface ScannedDirectory {
   images: Record<string, ScannedImage>
}

function infoFilename(directory: string) {
  return path.resolve(directory, 'image-scan.json')
}

export function readScanInfo(directory: string): ScannedDirectory {
  const infoPath = infoFilename(directory)

  if (!existsSync(infoPath)) {
    return {
      images: {},
    }
  }

  return JSON.parse(readFileSync(infoPath, 'utf8'))
}

export function writeScanInfo(directory: string, info: ScannedDirectory) {
  writeFileSync(infoFilename(directory), JSON.stringify(info, null, 2))
}