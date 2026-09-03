// Must be imported before `next` in the custom server (server.ts).
//
// Next.js reads `globalThis.AsyncLocalStorage` once, when its
// app-render/async-local-storage module is first evaluated. Its own baseline
// polyfill (server/node-environment-baseline) that exposes this global runs
// lazily, so when Next is loaded from a custom server through a loader such as
// tsx, the async-local-storage module can be evaluated first and permanently
// fall back to a stub that throws "AsyncLocalStorage accessed in runtime where
// it is not available". Setting the global here first prevents that.
import { AsyncLocalStorage } from 'node:async_hooks'

if (typeof (globalThis as { AsyncLocalStorage?: unknown }).AsyncLocalStorage !== 'function') {
  ;(globalThis as { AsyncLocalStorage?: unknown }).AsyncLocalStorage = AsyncLocalStorage
}
