import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchVisitorSession } from './find-visitor-session'

test('eşleşir: aynı visitorId + websiteId', () => {
  const hit = matchVisitorSession(
    [{ visitorId: 'v1', websiteId: 'w1', sessionId: 's1' }],
    { visitorId: 'v1', websiteId: 'w1' }
  )
  assert.equal(hit?.visitorId, 'v1')
})

test('eşleşir: admin sessionId, socket visitorId farklı ama session aynı', () => {
  const hit = matchVisitorSession(
    [{ visitorId: 'v1', websiteId: 'w1', sessionId: 'sess-9' }],
    { visitorId: 'other', websiteId: 'w1', sessionId: 'sess-9' }
  )
  assert.equal(hit?.visitorId, 'v1')
})

test('eşleşmez: yanlış website', () => {
  const hit = matchVisitorSession(
    [{ visitorId: 'v1', websiteId: 'w1' }],
    { visitorId: 'v1', websiteId: 'w2' }
  )
  assert.equal(hit, undefined)
})
