export function withMinDuration<T>(promise: Promise<T>, ms: number): Promise<T> {
  const delay = new Promise<void>((resolve) => setTimeout(resolve, ms))
  return Promise.all([promise, delay]).then(([result]) => result)
}
