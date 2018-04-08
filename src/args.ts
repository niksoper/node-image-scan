import minimist from 'minimist'

export interface Args {
  directory: string
}

export function parseArgs(args: string[]): Args {
  const argv = minimist(args.slice(2))
  let [directory] = argv._
  if (directory.match(/^".*"$/)) {
    directory = directory.substring(1, directory.length - 2)
  }

  return { directory }
}