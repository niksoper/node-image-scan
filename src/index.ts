import minimist from 'minimist'
import { createReadStream, readdir } from 'fs'
import path from 'path'
import request from 'request'

import { createScanner, RATE_LIMIT_EXCEEDED } from './scanner'

const argv = minimist(process.argv.slice(2))
const [directory] = argv._

const scannerOptions = {
  url: 'https://southcentralus.api.cognitive.microsoft.com/customvision/v1.1/Prediction/2c8ede3f-87ac-4b7f-928e-506882d16fbf/image',
  key: 'dd0d0c7396414986b12d140ee1b9a095',
  retryInterval: 1500,
}
const scanner = createScanner(scannerOptions)

readdir(directory, async (err, files) => {
  for (let file of files) {
    await scanFile(directory, file)
  }
})

async function scanFile(directory: string, name: string) {
  const filePath = path.resolve(directory, name)
  console.log(`Scanning ${name}...`)
  const { response, rawBody, body } = await scanner(filePath)

  console.log(`Got ${response.statusCode} from ${name}`)
  if (response.statusCode !== 200) {
    console.log(rawBody)

    // if (response.statusCode === RATE_LIMIT_EXCEEDED) {
    //   console.log(`Retrying in ${scannerOptions.retryInterval / 1000} seconds...`)
    //   setTimeout(() => scan(filePath), scannerOptions.retryInterval)
    // }
    return
  }

  console.log(body.Predictions.map(p => {
    const { TagId, ...rest } = p
    return rest
  }))
}
