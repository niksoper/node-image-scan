const fs = require('fs')
const request = require('request')

const url = 'https://southcentralus.api.cognitive.microsoft.com/customvision/v1.1/Prediction/2c8ede3f-87ac-4b7f-928e-506882d16fbf/image'
const predictionKey = 'dd0d0c7396414986b12d140ee1b9a095'
const filePath = './images/bigtank1.jpg'

const RATE_LIMIT_EXCEEDED = 429
const retryInterval = 1500

checkFile('desk')
checkFile('glass')
checkFile('hood')
checkFile('instruments')
checkFile('bigtank2')

function checkFile(name) {
  const filePath = `./images/${name}.jpg`
  console.log(`Checking file: ${filePath}`)

  fs.createReadStream(filePath)
    .pipe(request.post({
      url,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Prediction-Key': predictionKey,
      }
    }, (err, response, rawBody) => {
      console.log(`${name} received ${response.statusCode}`)
      if (response.statusCode !== 200) {
        console.log(rawBody)

        if (response.statusCode === RATE_LIMIT_EXCEEDED) {
          console.log(`Retrying in ${retryInterval/1000} seconds...`)
          setTimeout(() => checkFile(name), retryInterval)
        }
        return
      }

      const body = JSON.parse(rawBody)
      console.log(body.Predictions.map(p => {
        const { TagId, ...rest } = p
        return rest
      }))
    }))
}
