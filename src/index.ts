import { copyFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

import { Args, File, getFilesToScan } from './args';
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

const args = getFilesToScan(process.argv)

scanFiles(args)

async function scanFiles({ directory, files, forceRescan }: Args) {
  const scanInfo = readScanInfo(args.directory)

  for (let file of files) {
    if (!forceRescan && scanInfo.images[file.name]) {
      console.log(`Already scanned: ${file.name}`)
      continue
    }
    
    const { success, result } = await scanFile(file)

    if (success) {
      scanInfo.images[file.name] = result
      writeScanInfo(args.directory, scanInfo)
    }
  }
}

async function scanFile({ directory, name, path }: File): Promise<ImageScanResult> {
  console.log(`Scanning ${name}...`)
  const { response, rawBody, body } = await scanner(path)

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
