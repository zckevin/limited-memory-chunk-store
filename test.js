const LimitedMemoryChunkStore = require('./')
const abstractTests = require('abstract-chunk-store/tests')
const test = require('tape')
abstractTests(test, LimitedMemoryChunkStore)

test('thresh option', function (t) {
  LimitedMemoryChunkStore.thresh = 10
  const store = new LimitedMemoryChunkStore(10)
  t.deepEqual(store.thresh, 10)

  delete LimitedMemoryChunkStore.thresh
  const store2 = new LimitedMemoryChunkStore(10, { thresh: 20 })
  t.deepEqual(store2.thresh, 20)
  t.end()
})

test('thresh', function (t) {
  LimitedMemoryChunkStore.thresh = 2
  const store = new LimitedMemoryChunkStore(1)
  store.put(0, Buffer.from('a'))
  store.put(1, Buffer.from('b'))
  store.put(2, Buffer.from('c'))

  t.equal(store.isFull(), true)
  t.deepEqual(store.chunkIds.toarray(), [1, 2])

  store.get(0, (err, buf) => {
    t.ok(err instanceof Error)
    store.get(1, (err, buf) => {
      t.error(err)
      t.deepEqual(buf, Buffer.from('b'))
      store.get(2, (err, buf) => {
        t.error(err)
        t.deepEqual(buf, Buffer.from('c'))
        t.end()
      })
    })
  })
})

test('eternal', function (t) {
  LimitedMemoryChunkStore.thresh = 2
  const store = new LimitedMemoryChunkStore(1, { eternal: true })

  store.put(0, Buffer.from('a'))
  store.lock()
  store.put(1, Buffer.from('b'))
  store.put(2, Buffer.from('c'))
  store.put(3, Buffer.from('d'))

  t.equal(store.isFull(), true)
  t.deepEqual(store.chunkIds.toarray(), [2, 3])

  store.get(0, (err, buf) => {
    t.error(err)
    t.deepEqual(buf, Buffer.from('a'))
    store.get(1, (err, buf) => {
      t.ok(err instanceof Error)
      store.get(2, (err, buf) => {
        t.error(err)
        t.deepEqual(buf, Buffer.from('c'))
        store.get(3, (err, buf) => {
          t.error(err)
          t.deepEqual(buf, Buffer.from('d'))
          t.end()
        })
      })
    })
  })
})
