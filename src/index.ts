import { copyFileSync, existsSync, lstatSync, mkdirSync, readdir } from 'fs';
import path from 'path';

import { parseArgs } from './args';
import { readScanInfo, ScannedImage, writeScanInfo } from './scanInfo';
import { createScanner, Prediction } from './scanner';

interface ImageScanResult {
  success: boolean
  result: ScannedImage
}

const scannerOptions = {
  url: 'https://southcentralus.api.cognitive.microsoft.com/customvision/v1.1/Prediction/2c8ede3f-87ac-4b7f-928e-506882d16fbf/image',
  key: 'dd0d0c7396414986b12d140ee1b9a095',
  retryInterval: 1500,
}
const scanner = createScanner(scannerOptions)

const { directory } = parseArgs(process.argv)

readdir(directory, async (err, files) => {
  const scanInfo = readScanInfo(directory)
  
  for (let file of files) {
    const filePath = path.resolve(directory, file)
    
    if (!isImage(filePath)) {
      continue
    }

    if (scanInfo.images[file]) {
      console.log(`Skipping ${file} - already scanned`)
      continue
    }

    const { success, result } = await scanFile(directory, file)
    
    if (success) {
      scanInfo.images[file] = result
    }
  }

  writeScanInfo(directory, scanInfo)
})

async function scanFile(directory: string, name: string): Promise<ImageScanResult> {
  const filePath = path.resolve(directory, name)
  console.log(`Scanning ${name}...`)
  const { response, rawBody, body } = await scanner(filePath)

  console.log(`Got ${response.statusCode} from ${name}`)
  if (response.statusCode !== 200) {
    console.log(rawBody)

    return {
      success: false,
      result: null,
    }
  }

  body.Predictions.forEach(prediction => {
    if (prediction.Probability >= 0.9) {
      copyTag(directory, name, prediction)
    }
  })

  return {
    success: true,
    result: {
      scannedOn: String(new Date()),
      name,
      predictions: body.Predictions
    }
  }
}

function copyTag(directory: string, name: string, prediction: Prediction) {
  const { Tag } = prediction
  const tagDirectory = path.resolve(directory, Tag)

  if (!existsSync(tagDirectory)) {
    mkdirSync(tagDirectory)
  }

  const from = path.resolve(directory, name)
  const to = path.resolve(tagDirectory, name)
  console.log(`Writing ${to}`)
  copyFileSync(from, to)
}

function isImage(filePath: string) {
  if (lstatSync(filePath).isDirectory()) {
    console.log(`Skipping directory: ${filePath}`)
    return false
  }

  const supportedExtensions = ['.jpg', '.jpeg', '.png']
  if (!supportedExtensions.some(extension => path.extname(filePath).toLowerCase() === extension)) {
    console.log(`Skipping ${filePath} - not an image`)
    return false
  }

  return true
}
