import { lstatSync, readdirSync } from 'fs';
import minimist from 'minimist';
import path from 'path';

export interface Args {
  directory: string
  files: File[]
}

export interface File {
  directory: string
  name: string
  path: string
}

export function getFilesToScan(args: string[]): Args {
  const argv = minimist(args.slice(2))
  let [firstArg] = argv._
  if (firstArg.match(/^".*"$/)) {
    firstArg = firstArg.substring(1, firstArg.length - 2)
  }

  if (isDirectory(firstArg)) {
    const files: File[] = readdirSync(firstArg)
      .map(name => ({
        directory: firstArg,
        name,
        path: path.resolve(firstArg, name),
      }))
      .filter(file => isImage(file.path))

    return {
      directory: firstArg,
      files,
    }
  }

  if (isImage(firstArg)) {
    const directory = path.dirname(firstArg)
    return {
      directory,
      files: [{
        directory,
        name: path.basename(firstArg),
        path: path.resolve(firstArg),
      }]
    }
  }
}

function isDirectory(filePath: string) {
  return lstatSync(filePath).isDirectory()
}

function isImage(filePath: string) {
  if (isDirectory(filePath)) {
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
