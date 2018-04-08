import minimist from 'minimist'
import { createReadStream, readdir } from 'fs'
import path from 'path'
import request from 'request'

import { createScanner } from './scanner'

const argv = minimist(process.argv.slice(2))
const [directory] = argv._

const scanner = createScanner({
  url: 'https://southcentralus.api.cognitive.microsoft.com/customvision/v1.1/Prediction/2c8ede3f-87ac-4b7f-928e-506882d16fbf/image',
  key: 'dd0d0c7396414986b12d140ee1b9a095',
  retryInterval: 1500,
})

readdir(directory, (err, files) => {
  files.forEach(file => {
    const filePath = path.resolve(directory, file)
    scanner(filePath)
  })
})
