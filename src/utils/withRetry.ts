import {
  ProgressContext,
  setProgressRetry,
} from '../store/loadings/loadProgress';

const retryCount = 5;
const retryDelayBase = 1000;

function delay(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

function shouldRetry(error: any): boolean {
  if (error.response && error.response.status === 400) {
    // Bad request - unlikely to happen as a result of a rate limit or intermittent failure.
    return false;
  }

  return true;
}

export async function withRetryContext<T>(
  method: (...args: any) => Promise<T>,
  context: ProgressContext | undefined,
  ...args: any[]
): Promise<T> {
  if (args.length > 0 && args[0] === undefined) {
    debugger;
  }

  let lastError: any;
  let delayMs = retryDelayBase;
  for (let i = 0; i < retryCount; i++) {
    try {
      const result = await method(...args);

      if (context) {
        setProgressRetry(context, undefined);
      }

      return result;
    } catch (e) {
      if (!shouldRetry(e)) {
        throw e;
      }

      lastError = e;

      if (context) {
        setProgressRetry(context, i + 2);
      }

      // Retry after a delay. Increase the delay each time.
      if (i !== retryCount - 1) {
        await delay(delayMs);
        delayMs *= 2;
      }
    }
  }

  throw lastError;
}

export function withRetry<T>(
  method: (...args: any) => Promise<T>,
  ...args: any[]
): Promise<T> {
  return withRetryContext(method, undefined, ...args);
}
