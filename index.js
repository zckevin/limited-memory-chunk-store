module.exports = Storage

const queueMicrotask = require('queue-microtask')
const CircularBuffer = require('circular-buffer')

function Storage (chunkLength, opts) {
  if (!(this instanceof Storage)) return new Storage(chunkLength, opts)
  if (!opts) opts = {}

  this.chunkLength = Number(chunkLength)
  if (!this.chunkLength) throw new Error('First argument must be a chunk length')

  this.closed = false
  this.thresh = Number(opts.thresh) || 100

  this.chunkIds = new CircularBuffer(this.thresh)
  this.chunks = new Map()
}

Storage.prototype.isFull = function () {
  return this.chunkIds.length >= this.thresh
}

Storage.prototype.put = function (index, buf, cb = () => {}) {
  if (this.closed) return queueMicrotask(() => cb(new Error('Storage is closed')))

  if (buf.length !== this.chunkLength) {
    return queueMicrotask(() => cb(new Error('Chunk length must be ' + this.chunkLength)))
  }

  if (this.isFull()) {
    const removedId = this.chunkIds.shift()
    this.chunks.delete(removedId)
  }
  this.chunkIds.push(index)
  this.chunks.set(index, buf)
  queueMicrotask(() => cb(null))
}

Storage.prototype.get = function (index, opts, cb = () => {}) {
  if (typeof opts === 'function') return this.get(index, null, opts)
  if (this.closed) return queueMicrotask(() => cb(new Error('Storage is closed')))

  let buf = this.chunks.get(index)

  if (!buf) {
    const err = new Error('Chunk not found')
    err.notFound = true
    return queueMicrotask(() => cb(err))
  }

  if (!opts) opts = {}

  const offset = opts.offset || 0
  const len = opts.length || (buf.length - offset)

  if (offset !== 0 || len !== buf.length) {
    buf = buf.slice(offset, len + offset)
  }

  queueMicrotask(() => cb(null, buf))
}

Storage.prototype.close = Storage.prototype.destroy = function (cb = () => {}) {
  if (this.closed) return queueMicrotask(() => cb(new Error('Storage is closed')))
  this.closed = true
  this.chunks = null
  queueMicrotask(() => cb(null))
}
