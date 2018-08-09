(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.repl = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":1,"ieee754":3}],3:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
"use strict";

var _globalDef = require("./globalDef");

var _ITP = require("./ITP2");

//const ITP2 = require("./ITP2");
//const has_type = ITP2.has_type;
const untyped_beta_conv = _ITP.untyped_beta_conversion;
//const TYPE_STAR = ITP2.TYPE_STAR;
//const TYPE_SQUARE = ITP2.TYPE_SQUARE;

// proof constructor : Command -> pttm
// proof constructor only works at type-level
//type Dict<K, V> = Array<[K, V]>;
//type Option<T> = T | typeof undefined;
//
//const obeq = (a: Object, b:Object):boolean => (typeof a === typeof b) && (JSON.stringify(a) === JSON.stringify(b));

//let lift_maybe = <D,C>(f: D => C): ((D | undefined) => (C | undefined)) => 
//            (input : D | undefined) => {if (D !== undefined) {return f(D);} else {return undefined;} }

//const _add_to_dict = <K, V>(newterm : K, newtype : V, ctx: Dict<K,V>) : Dict<K,V> => {let r = ctx.slice(); r.push([newterm, newtype]); return r;}
//const _find_in_dict = <K,V>(pred: K => boolean, ctx : Dict<K,V>) : Option<V> => 
//        (x_ => {const x = x_[x_.length - 1]; if(!x){return x[1];}else{return undefined;}})(ctx.filter(x => pred(x[0])));
//const _reverse_mapping = <K, V>(d : Dict<K,V>) : Dict<V,K> => d.map(x => [x[1], x[0]]);

// definee & its type, if its definee is bottom, its primitive definition; if it is false, then it is in context

// A prover : Extend Coc with definition, become lambdaD
// should named as ITP3.js

const addCtx = _ITP._add_to_dict;
const findinCtx = (ctx, n) => (0, _ITP._find_in_dict)(j => (0, _globalDef.ideq)(n, j), ctx);
const ppCtx = (0, _ITP.pprintDict)(_globalDef.ppID, x => {
    let ret = "";
    if (typeof x[0] === 'object') {
        ret = ret + " := " + (0, _ITP.ppPttm)(x[0]);
    }
    return ret + " : " + (0, _ITP.ppPttm)(x[1]);
});

//type DefContext = Dict<ID, [pttm, pttm]>;
//type GlobalContext = Context;
// size of doman * function

const ppDefL = (0, _ITP.pprintDict)(_globalDef.ppID, x => " := " + (0, _ITP.ppPttm)(x[0]) + " : " + (0, _ITP.ppPttm)(x[1]));

// homomorphism
const connect = (f, g) => {
    const f_ = a => f[1](a.slice(0, f[0]));
    const g_ = a => g[1](a.slice(f[0], f[0] + g[0]));
    return [f[0] + g[0], a => f_(a).concat(g_(a))];
};

// Now it's all about proof constructor
// Proof constructor is a transformation from an array of commands to term in Coc

// not open


const ppCmd = x => JSON.stringify(x);

const combine = gs => {
    return gs.reduce((x, y) => [x[0].concat(y[0]), connect(x[1], y[1])]);
};
// At ITP2, it's pure Coc, so we have to reduce lambdaD into lambdaC
const untyped_delta_conv_all = (ctx, tm) => {
    const utca = x => untyped_delta_conv_all(ctx, x);
    if (tm.type === "lambda") {
        return { type: "lambda", bind: tm.bind, iT: tm.iT, body: utca(tm.body) };
    } else if (tm.type === "pi") {
        return { type: "pi", bind: tm.bind, iT: tm.iT, body: utca(tm.body) };
    } else if (tm.type === "apply") {
        return { type: "apply", fun: utca(tm.fun), arg: utca(tm.arg) };
    } else if (tm.type === "var") {
        const replacement0_ = findinCtx(ctx, tm.n);
        if (replacement0_ === undefined) {
            return tm;
        }
        const replacement0 = replacement0_;
        if (replacement0[0] === "bottom") {
            return tm;
        } else if (replacement0[0] === false) {
            return tm;
        } else {
            return utca(replacement0[0]);
        }
    } else {
        return tm;
    }
};

const untyped_beta_delta_conv_all = (ctx, tm) => untyped_beta_conv(untyped_delta_conv_all(ctx, tm));

// Yes. casting. I hate it. But flow is too silly.
const defListToCtx = defl => defl;

// prerequisite : ctx is consistent
const newtermChecker = (ctx, newbind, newterm, decType) => {
    const type_ctx = ctx.map(x => [x[0], x[1][1]]);
    const tyOfdecType = (0, _ITP.has_type)(type_ctx, untyped_delta_conv_all(defListToCtx(ctx), decType));
    if (!(0, _ITP.obeq)(tyOfdecType, _ITP.TYPE_SQUARE) && !(0, _ITP.obeq)(tyOfdecType, _ITP.TYPE_STAR) && !(0, _ITP.obeq)(decType, _ITP.TYPE_SQUARE)) {
        return false;
    }
    if (newterm === "bottom") {
        return true;
    }
    if ((0, _ITP._find_in_dict)(x => x === newbind, ctx) !== undefined) {
        return false;
    }
    if (!(0, _ITP.obeq)((0, _ITP.has_type)(type_ctx, newterm), decType)) {
        return false;
    }
    return true;
};

// Check the whole proof is correct
const pfChecker = ctx => {
    if (ctx.length == 0) {
        return true;
    }
    const oldlist = ctx.slice(0, ctx.length - 1);
    return pfChecker(oldlist) && newtermChecker(oldlist, ctx[ctx.length - 1][0], ctx[ctx.length - 1][1][0], ctx[ctx.length - 1][1][1]);
};

// for a specific partial goal, it may transform into several subgoals, then we have to flatmap them
// each array of commands is like a matrix transformation, than transform an array of partial goal into a new array of partial goal
// the reason why it is partial goal is because the goal may have been accomplished
const goaltransform = function* (ncmd, warn, cmd_, goal_) {
    const cmd = cmd_;
    const donothing = [1, x => x];
    if (goal_ === true) {
        return [[true], donothing];
    }
    const goal = goal_;
    // Now goal is not true
    const ctx = goal[0];
    const ctx_list = ctx.map(x => [x[0], x[1][1]]);
    let goal_ty = goal[1];
    if (cmd.type === "intro") {
        // check truely a function
        if (goal_ty.type !== "pi") {
            warn("Intro failed.");return [[goal], donothing];
        }
        return [[[addCtx(goal_ty.bind, [false, goal_ty.iT], ctx), goal_ty.body]], [1, x => [{ type: "lambda", bind: goal_ty.bind, iT: goal_ty.iT, body: x[0] }]]];
    } else if (cmd.type === "apply") {
        const claimed_fty = cmd.caller;
        const claimed_xty = cmd.callee;

        const type_of_claimed_f = (0, _ITP.has_type)(ctx_list, claimed_fty);
        const type_of_claimed_x = (0, _ITP.has_type)(ctx_list, claimed_xty);
        if (type_of_claimed_f === undefined || !(0, _ITP.obeq)(type_of_claimed_f, _ITP.TYPE_STAR) || type_of_claimed_x === undefined || !(0, _ITP.obeq)(type_of_claimed_f, _ITP.TYPE_STAR)) {
            warn("Apply failed. Type Inconsistent.");return [[goal], donothing];
        }
        if (claimed_fty.type !== "pi") {
            warn("Apply failed. Type Inconsistent.");return [[goal], donothing];
        }
        if (!(0, _ITP.obeq)(claimed_fty.iT, claimed_xty)) {
            warn("Apply failed. Type Inconsistent.");return [[goal], donothing];
        }
        return [[[ctx, claimed_fty], [ctx, claimed_xty]], //: PartialGoals,
        [2, x => [{ type: "apply", fun: x[0], arg: x[1] }]]];
    } else if (cmd.type === "check") {
        const claimed_term = cmd.term;
        const claimed_term_ty = (0, _ITP.has_type)(ctx_list, claimed_term);
        if (!(0, _ITP.obeq)(claimed_term_ty, goal_ty)) {
            warn("Check failed. Type Inconsistent.");return [[goal], donothing];
        }
        return [[true], [1, x => [claimed_term]]];
    } else if (cmd.type === "conv") {
        const claimed_ty = cmd.newform;
        // now beta, delta conversion
        const ty_claimed_ty = (0, _ITP.has_type)(ctx_list, claimed_ty);
        if (ty_claimed_ty === undefined) {
            warn("Conversion failed. Types are not equivalent.");return [[goal], donothing];
        }
        if (!(0, _ITP.obeq)(untyped_beta_delta_conv_all(ctx, claimed_ty), untyped_beta_delta_conv_all(ctx, goal_ty))) {
            warn("Conversion failed. Types are not equivalent.");return [[goal], donothing];
        }
        return [[[ctx, claimed_ty]], [1, x => x]];
    } else if (cmd.type === "let") {
        const new_add_term = cmd.term;
        const new_add_term_ty = (0, _ITP.has_type)(ctx_list, new_add_term);
        if (new_add_term_ty === undefined) {
            warn("Local Define failed. Unsupported type");return [[goal], donothing];
        }
        return [[[addCtx(cmd.bind, [new_add_term, new_add_term_ty], ctx), goal_ty]], [1, x => [{ type: "apply",
            fun: { type: "lambda", bind: cmd.bind, iT: new_add_term_ty, body: x[0] },
            arg: new_add_term
        }]]];
    } else if (cmd.type === "focus") {
        // most special, it will hang up the current goal and star focusing on a particular partial goal
        // const term = pfconstructor(ncmd, warn, [goal])[0];
        // return [[true], [1, x => [term]]];
        const ret_ = yield* ppfconstructor(cmd.streamOfCmd, warn, [goal]);
        return ret_;
    } else if (cmd.type === "idtac") {
        return [[goal], donothing];
    } else {
        warn("Something Unexpected Happened.");
        return [[goal], donothing];
    }
};

// Core of this file, transform an array of partial goal into an array of term each with correct type
// term finder in some sense
// the core of lambdaD, though no correctness is assure and necessary -- all the correctness is based on ITP2 (Coc)
const pfconstructor = function* (ncmd, warn, currentGoals) {
    let nextcmds_ = yield* ncmd(currentGoals)();
    while (nextcmds_.length !== currentGoals.length) {
        warn("Error: Command number not enough");
        nextcmds_ = yield* ncmd(currentGoals)();
    }
    const nextcmds = nextcmds_;
    const newGoals_IT_ = nextcmds.map((cmd, index) => goaltransform(ncmd, warn, cmd, currentGoals[index]));
    let newGoals_IT__ = [];
    for (let each_new_goal of newGoals_IT_) {
        const adding = yield* each_new_goal;
        newGoals_IT__.push(adding);
    }
    const newGoals_IT = combine(newGoals_IT__);
    // const newGoals_IT : [PartialGoals, ArrayF<pttm, pttm>] = 
    //             combine(nextcmds.map((cmd, index) => 
    //                             goaltransform(ncmd, warn, cmd, currentGoals[index])));
    const newGoals = newGoals_IT[0];
    if (newGoals_IT[1][0] !== newGoals.length) {
        warn("Internal Error: Domain number incoincides with array element number");
    }
    const inverseTransform = newGoals_IT[1][1];
    if (newGoals.filter(x => x !== true).length === 0) {
        return inverseTransform(newGoals.map(x => undefined));
    } else {
        const ret_ = yield* pfconstructor(ncmd, warn, newGoals);
        return inverseTransform(ret_);
    }
};

// more generalized now
// partial proof constructor
// will stop constructing when meet defocus
// always return the term constructed with all effort
const ppfconstructor = function* (ncmd, warn, currentGoals) {
    let nextcmds_ = yield* ncmd(currentGoals)();
    if (nextcmds_[0].type === "defocus") {
        // the way to stop
        return [currentGoals, [currentGoals.length, x => x]];
    }
    while (nextcmds_.length !== currentGoals.length) {
        warn("Error: Command number not enough");
        nextcmds_ = yield* ncmd(currentGoals)();
    }
    const nextcmds = nextcmds_;
    const newGoals_IT_ = nextcmds.map((cmd, index) => goaltransform(ncmd, warn, cmd, currentGoals[index]));
    let newGoals_IT__ = [];
    for (let each_new_goal of newGoals_IT_) {
        const adding = yield* each_new_goal;
        newGoals_IT__.push(adding);
    }
    const newGoals_IT = combine(newGoals_IT__);

    //        combine(nextcmds.map((cmd, index) => goaltransform(ncmd, warn, cmd, currentGoals[index])));
    const newGoals = newGoals_IT[0];
    if (newGoals_IT[1][0] !== newGoals.length) {
        warn("Internal Error: Domain number incoincides with array element number");
    }
    if (newGoals.filter(x => x !== true).length === 0) {
        return newGoals_IT;
    }
    const retGoals_IT = yield* ppfconstructor(ncmd, warn, newGoals);
    return [retGoals_IT[0], [retGoals_IT[1][0], x => newGoals_IT[1][1](retGoals_IT[1][1](x))]];
    // if(newGoals_IT[1][0] !== newGoals.length) {warn("Internal Error: Domain number incoincides with array element number");}
    // const inverseTransform : Array<pttm> => Array<pttm> = newGoals_IT[1][1];
    // if(newGoals.filter(x => x !== true).length === 0) {
    //     return inverseTransform(newGoals.map(x => ((undefined : any): pttm)));
    // } else {
    //     return inverseTransform(pfconstructor(ncmd, warn, newGoals));
    // }
};

module.exports = {
    defListToCtx,
    pfconstructor,
    newtermChecker,
    pfChecker,
    ppCmd,
    ppCtx,
    ppDefL
};
},{"./ITP2":6,"./globalDef":10}],6:[function(require,module,exports){
'use strict';

var _globalDef = require('./globalDef');

// Calculus of Construction
// pttm = pre-typed term
const TYPE_STAR = { type: "U0" };
const TYPE_SQUARE = { type: "U1" };
const ppPttm = x => {
    if (x === "bottom") {
        return "_|_";
    } else {
        return _ppPttm(x);
    }
};

const _ppPttm = tm => {
    if (tm.type === "U1") {
        return "**";
    } else if (tm.type === "U0") {
        return "*";
    } else if (tm.type === "apply") {
        return (0, _globalDef.printf)("({0} {1})", _ppPttm(tm.fun), _ppPttm(tm.arg));
    } else if (tm.type === "lambda") {
        return (0, _globalDef.printf)("\\\\{0}:{1},{2}", (0, _globalDef.ppID)(tm.bind), _ppPttm(tm.iT), _ppPttm(tm.body));
    } else if (tm.type === "pi") {
        return (0, _globalDef.printf)("forall {0}:{1},{2}", (0, _globalDef.ppID)(tm.bind), _ppPttm(tm.iT), _ppPttm(tm.body));
    } else if (tm.type === "var") {
        return (0, _globalDef.ppID)(tm.n);
    } else {
        return "";
    }
};

const subst = (exp, from, to) => {
    let sb = subexp => subst(subexp, from, to);
    if (exp.type === "lambda" && exp.bind !== from) {
        return { type: "lambda", bind: exp.bind, iT: exp.iT, body: sb(exp.body) };
    } else if (exp.type === "pi" && exp.bind !== from) {
        return { type: "pi", bind: exp.bind, iT: exp.iT, body: sb(exp.body) };
    } else if (exp.type === "apply") {
        return { type: "apply", fun: sb(exp.fun), arg: sb(exp.arg) };
    } else if (exp.type === "var" && (0, _globalDef.ideq)(exp.n, from)) {
        return to;
    }
    return exp;
};

const untyped_beta_conversion = tm => {
    if (tm.type === "lambda") {
        return { type: "lambda", bind: tm.bind, iT: tm.iT, body: untyped_beta_conversion(tm.body) };
    } else if (tm.type === "pi") {
        return { type: "pi", bind: tm.bind, iT: tm.iT, body: untyped_beta_conversion(tm.body) };
    } else if (tm.type === "apply") {
        let f = untyped_beta_conversion(tm.fun);
        let x = untyped_beta_conversion(tm.arg);
        if (f.type === "lambda") {
            return subst(f.body, f.bind, x);
        }
    }
    return tm;
};

// One specification: beta_conversion(has_type(..)) === has_type(..)
// Another : beta_conversion(find_in_dict(..)) == find_in_dict(..)
const has_type = (ctx, tmm) => {
    // I don't need to hard-code them
    const tm = tmm;
    if (tm.type === "U1") {
        return undefined;
    } else if (tm.type === "U0") {
        return { type: "U1" };
    } else if (tm.type === "apply") {
        let f = tm.fun;
        let x = tm.arg;
        let fT = has_type(ctx, f);
        let xT = has_type(ctx, x);
        if (fT === undefined || xT === undefined || fT.type !== "pi" || !(0, _globalDef.obeq)(fT.iT, xT)) {
            return undefined;
        }
        return subst(fT.body, fT.bind, x);
    } else if (tm.type === "lambda") {
        let iTT = has_type(ctx, tm.iT);
        if (iTT === undefined || iTT.type !== "U1" && iTT.type !== "U0") {
            return undefined;
        }
        const iTc = untyped_beta_conversion(tm.iT);
        let oT = has_type((0, _globalDef._add_to_dict)(tm.bind, iTc, ctx), tm.body);
        if (oT === undefined || iTT.type !== "U1" && iTT.type !== "U0") {
            return undefined;
        };
        return { type: "pi", bind: tm.bind, iT: iTc, body: oT };
    } else if (tm.type === "pi") {
        let iTT = has_type(ctx, tm.iT);
        if (iTT === undefined || iTT.type !== "U1" && iTT.type !== "U0") {
            return undefined;
        }
        let oT = has_type((0, _globalDef._add_to_dict)(tm.bind, untyped_beta_conversion(tm.iT), ctx), tm.body);
        if (oT === undefined || iTT.type !== "U1" && iTT.type !== "U0") {
            return undefined;
        };
        return oT;
    } else if (tm.type === "var") {
        return (0, _globalDef._find_in_dict)(x => x === tm.n, ctx);
    }
};

module.exports = {
    untyped_beta_conversion,
    has_type,
    TYPE_STAR,
    TYPE_SQUARE,
    obeq: _globalDef.obeq,
    _add_to_dict: _globalDef._add_to_dict,
    _find_in_dict: _globalDef._find_in_dict,
    _reverse_mapping: _globalDef._reverse_mapping,
    pprintDict: _globalDef.pprintDict,
    ppPttm
};
},{"./globalDef":10}],7:[function(require,module,exports){
"use strict";

var _globalDef = require("../globalDef");

var _ITP = require("../ITP2");

var _ITP2 = require("../ITP.pver");

// TContext -> String


// MEDIUM LEVEL : META TACTIC
// A Tactic is a instruction that can be interpreted into (A function from PartialGoals to Commands := Actic)

// A group of targeted tactic
// number denote the goal number targeted


// An REPL for ITP3, a general interpretation for all platform
// An abstraction about interaction
// where includes information about Instructions, Targeted-Tactic, Tactic, 
// which can be then translated into (PartialGoals => Commands) 

const pprintTac = x => {
    if (x.type === "cmds") {
        return (0, _ITP2.ppCmd)(x.t);
    } else if (x.type === "seq") {
        return pprintTac(x.t0) + ";" + pprintTac(x.t1);
    } else if (x.type === "let") {
        return "let " + (0, _globalDef.ppID)(x.name) + " = " + pprintTac(x.bind) + " in " + pprintTac(x.body);
    } else if (x.type === "metavar") {
        return (0, _globalDef.ppID)(x.n);
    }
    return "";
};

const donothing = (0, _globalDef.listGen)([s => (0, _globalDef.constGer)(Array(s.length).fill({ type: "idtac" }))]);
// The interpreter of A single tactic
// tactic has a property that it is not going to be exposed to the current goal number
// so a single tactic will do things to all the possible goals
// and only TTactic -- targeted tactic know things about goal number
const tacticIntp = (tctx, tac_) => {
    const tac = tac_;
    if (tac.type === "cmds") {
        return (0, _globalDef.listGen)([s => (0, _globalDef.constGer)(Array(s.length).fill(tac.t))]);
    } else if (tac.type === "seq") {
        const tip = t => tacticIntp(tctx, t);
        return (0, _globalDef.concat_)(tip(tac.t0), () => tip(tac.t1));
    } else if (tac.type === "let") {
        return tacticIntp((0, _ITP._add_to_dict)(tac.name, tac.bind, tctx), tac.body);
    } else if (tac.type === "metavar") {
        const subs = (0, _ITP._find_in_dict)(x => (0, _globalDef.ideq)(x, tac.n), tctx);
        if (subs === undefined) {
            return donothing;
        }
        return tacticIntp(tctx, subs);
    } else {
        return donothing;
    }
};

// starting from here, code is elegant (I think) but ambiguous
// the reason is due to Generator_<> is a function with side-effect

// join is actually a flip makes (() => PG => CMDs ) -> (PG => () => CMDs), where the second 
// parenthesis can be auto applied when PG is applied, makes it into (PG => CMDs)
const __joinActic_endwithdefocus = gen => {
    const infGen = (0, _globalDef.endswith)(x => function* () {
        return Array(x.length).fill({ type: "defocus" });
    }, gen);
    return pgs => infGen()(pgs);
};

// translate TTactic into Actic
// actually, Tactic class is much easier to be translated
// The reason TTactic can be translated is largely due to the "focus" command
const ttacticIntp = (tctx, ttac_) => {
    const ttac = ttac_;
    const idtac = { type: "idtac" };
    const dictofGen = ttac.map(x => [x[0], tacticIntp(tctx, x[1])]);

    const arrayOfFocus = dictofGen.map(x => [x[0], __joinActic_endwithdefocus(x[1])]).map(x => [x[0], { type: "focus", streamOfCmd: x[1] }]);

    return (0, _globalDef.listGen)([pgs => (0, _globalDef.constGer)((0, _globalDef.toArrayFillBlankWith)(arrayOfFocus, pgs.length, idtac))]);
};

const prettyprintTacCtx = (0, _ITP.pprintDict)(x => x.toString(), pprintTac);

const inputAsGen = i => i("");

const ppPGs = pg => pg.map((x, index) => {
    if (typeof x !== 'boolean') {
        return index.toString() + "] " + (0, _ITP2.ppCtx)(x[0]) + "\n ?- " + (0, _ITP.ppPttm)(x[1]);
    }
    return "";
}).filter(x => x !== "").join("\n");

// const ger_gen_switch : <X>(p : IO<Generator_<X>>) => Generator_<IO<X>> = gerDelay;
// const promise_actic_flat : (p : IO<Actic>) => Actic = 
//     pg => function* () {
//         return (gerDelay(p))(pg)
//     }

// the flatmap (joinGen) makes input into a generator of actic
// because each tactic can deal with several times of interaction (a number of Commands)
// we need to flatmap, and what's more, the envoke of input becomes implicit
// Actic = (PartialGoals => IO<Commands>)
const interaction = (ioe, tctx) => {
    const tacticInput = (0, _globalDef.ger_gen__ger)((0, _globalDef.map_ger)( // IO<Generator_<Actic>>
    y => ttacticIntp(tctx, y), inputAsGen(ioe.i) // : IO<TTactic>
    ));

    // joinGen(
    // gerDelay(
    // mapGen(
    //     y => map_ger(u => ttacticIntp(tctx, u), y) // : IO<Generator_<Actic>>
    //     ,inputAsGen(ioe.i) // : IO<TTactic>
    //     )));
    return s => function* () {
        ioe.o(ppPGs(s));
        let tI = yield* tacticInput(); // Actic
        let ret = yield* tI(s)();
        return ret;
    };
};
const PFCONSOLE = function* (ioe, tctx, dctx, newty) {
    // here it's too stupid
    const ctx = (0, _ITP2.defListToCtx)(dctx);
    (0, _globalDef.debug)("function PFCONSOLE, with pfconstructor, proof mode.");
    const term = yield* (0, _ITP2.pfconstructor)(interaction(ioe, tctx), ioe.e, [[ctx, newty]]);
    (0, _globalDef.debug)("function PFCONSOLE return, back to normal mode.");
    return term[0];
};

// UPPER LEVEL : CONSOLE
// by addDef, we can enter proof mode(pf constructor)

const defaultprintDef = o => x => o((0, _ITP2.ppDefL)(x));
const defaultprintScript = o => s => o(s);

const CONSOLE = function* (ioe) {
    let AllDefinitions = [];
    let AllTactics = [];

    while (true) {

        const input = yield* ioe.iI("")();

        // debug(input + " function CONSOLE");
        if (input.type === "terminate") {
            break;
        } else if (input.type === "addDef") {
            // Into Proof Mode
            ioe.o("Enter Proof Mode.");
            const tm = yield* PFCONSOLE(ioe, AllTactics, AllDefinitions, input.ty);
            ioe.o("Back to Instruction Mode.");
            if (!(0, _ITP2.newtermChecker)(AllDefinitions, input.name, tm, input.ty)) {
                ioe.e("Define Failed.");continue;
            }
            AllDefinitions.push([input.name, [tm, input.ty]]);
        } else if (input.type === "addAxiom") {
            const tm = "bottom";
            if (!(0, _ITP2.newtermChecker)(AllDefinitions, input.name, tm, input.ty)) {
                ioe.e("Define Failed.");continue;
            }
            AllDefinitions.push([input.name, [tm, input.ty]]);
        } else if (input.type === "addTactic") {
            AllTactics.push([input.name, input.tac]);
        } else if (input.type === "printScript") {
            ioe.o(ioe.scripts());
        } else if (input.type === "printDef") {
            if (!(0, _ITP2.pfChecker)(AllDefinitions)) {
                ioe.e("Unexpected Internal Error. Cannot output definition.");continue;
            }
            ioe.o((0, _ITP2.ppDefL)(AllDefinitions));
        } else if (input.type === "printTacs") {
            ioe.o(prettyprintTacCtx(AllTactics));
        }
    }

    return undefined;
};

module.exports = {
    CONSOLE,
    defaultprintDef,
    defaultprintScript
};

// Intended to make it monadic form
// I think if I did that, I would be an idiot.

//
// class StateTransition<S, R>{
//     constructor(t : S => [S, R]) {
//         this.transition = t;
//     }
//     <Q>bind(f : R => StateTransition<S, Q>) : State<S,Q> {
//         return new StateTransition(
//             s => {
//                 const intermediate = this.transition(s);
//                 const iS = intermediate[0];
//                 const iR = intermediate[1];
//                 return f(iR).transition(iS);
//             }
//         );
//     }
//     <Q>ttach(f : StateTransition<S, Q>) : StateTransition<S, Q> {
//         return new StateTransition(
//             s => {
//                 const intermediate = this.transition(s);
//                 const iS = intermediate[0];
//                 const iR = intermediate[1];
//                 return f.transition(iS);
//             }
//         )
//     }

// }
// const idret<S, R> = (t : R) : StateTransition<S, R> => 
//     new StateTransition<S, R>(s => [s, t]) 
// const get<S> = new StateTransition<S, S>(s => [s, s]);
// const modify= <S, typeof undefined> (t : S => S) : StateTransition<S, R> =>
//          new StateTransition(s => [t(s), undefined];
// type BACKG = {iT : Input<Tactic>, o : Output<String>, e : Error, defs : DefinitionList, definedTactis : Array<number, >};

// const PFCONSOLE = (newname : number, newty : pttm) : StateTransition<BACKG, Array<pttm>> => {
//     get.bind( backg => {
//         const interaction = (pg : PartialGoals) : Commands =>
//             backg.o(prettyprint(pg)), backg.iC("");
//         return idret(pfconstructor())
//     }
// )
// }
},{"../ITP.pver":5,"../ITP2":6,"../globalDef":10}],8:[function(require,module,exports){
"use strict";

var _globalDef = require("../globalDef");

const ParserC = require("parsimmon");

const optWS = ParserC.optWhitespace;
const WS = ParserC.whitespace;

const foldToApp = xs => xs.reduce((f, x) => ({ type: "apply", fun: f, arg: x }));
const foldToSeq = xs => xs.reduce((f, x) => ({ type: "seq", t0: f, t1: x }), { type: "cmds", t: { type: "idtac" } });

const numberChar = "1234567890";
const NumberParser = ParserC.regexp(/[0-9]+/);
const smallabt = "qwertyuiopasdfghjklzxcvbnm";
const abt = smallabt + smallabt.toUpperCase();
const symbolChar = "!@#$%^&-_+=";

const langTerm = ParserC.createLanguage({
    Value: self => ParserC.alt(self.U1, self.U0, self.Lambda, self.Pi, self.App, self.Variable),
    U1: () => ParserC.string("**").wrap(optWS, optWS).result({ type: "U1" }),
    U0: () => ParserC.string("*").wrap(optWS, optWS).result({ type: "U0" }),
    Lambda: r => ParserC.seqMap(ParserC.string("\\\\").then(optWS).then(r.Variable).skip(optWS).skip(ParserC.string(":")), optWS.then(r.Value).skip(optWS).skip(ParserC.string(",")), optWS.then(r.Value), (metaid, declty, body) => ({ type: "lambda", bind: metaid.n, iT: declty, body: body })),
    Pi: r => ParserC.seqMap(ParserC.string("forall").then(WS).then(r.Variable).skip(optWS).skip(ParserC.string(":")), optWS.then(r.Value).skip(optWS).skip(ParserC.string(",")), optWS.then(r.Value), (metaid, declty, body) => ({ type: "pi", bind: metaid.n, iT: declty, body: body })),
    App: r => r.Value.sepBy1(WS).wrap(optWS, optWS).wrap(ParserC.string("("), ParserC.string(")")).map(xs => {
        if (xs.length === 1) {
            return xs[0];
        } else {
            // xs.length > 1
            return foldToApp(xs);
        }
    }),
    Variable: () => ParserC.oneOf(numberChar + abt + symbolChar).atLeast(1).map(xs => xs.reduce((x, y) => x + y)).map(x => ({ type: "var", n: (0, _globalDef.toID)(x) }))
});

const langCommand = ParserC.createLanguage({
    Cmd: r => ParserC.alt(r.intro, r.apply, r.check, r.conv, r.letTerm, r.idtac),
    intro: () => ParserC.string("intro").result({ type: "intro" }),
    apply: () => ParserC.seqMap(ParserC.string("apply"), langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, ParserC.string("")).times(2), (icon, xs) => ({ type: "apply", caller: xs[0], callee: xs[1] })),
    check: () => ParserC.seqMap(ParserC.string("check"), langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, ParserC.string("")).times(1), (icon, xs) => ({ type: "check", term: xs[0] })),
    conv: () => ParserC.seqMap(ParserC.string("conv"), langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, ParserC.string("")).times(1), (icon, xs) => ({ type: "conv", term: xs[0] })),
    letTerm: () => ParserC.seqMap(ParserC.string("let").skip(WS), langTerm.Variable.wrap(optWS, WS).skip(ParserC.string(":=").skip(optWS)), langTerm.Value.wrap(optWS, optWS).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, ParserC.string("")).times(1), (icon, vname, vbinding) => ({ type: "let", bind: vname.n, term: vbinding[0] })),
    idtac: () => ParserC.string("idtac").result({ type: "idtac" })
});

const langTactic = ParserC.createLanguage({
    tacs: r => ParserC.alt(r.cmds, r.seq, r.lettac, r.metavar),
    cmds: () => langCommand.Cmd.wrap(optWS, optWS).map(x => ({ type: "cmds", t: x })),
    seq: r => r.tacs.sepBy1(ParserC.string(";").wrap(optWS, optWS)).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, optWS).map(xs => foldToSeq(xs)),
    lettac: r => ParserC.seqMap(optWS.then(ParserC.string("lettac")).then(r.metavar.wrap(WS, optWS)).skip(ParserC.string(":=").wrap(optWS, optWS)), r.tacs.wrap(ParserC.string("[").wrap(optWS, optWS), ParserC.string("]").wrap(optWS, optWS)).skip(ParserC.string("in").wrap(optWS, WS)), r.tacs.wrap(optWS, optWS), (bind, binding, body) => ({ type: "let", name: bind.n, bind: binding, body: body })),
    metavar: () => ParserC.seqMap(ParserC.oneOf(abt), ParserC.oneOf(numberChar + abt + symbolChar).atLeast(0).map(xs => xs.reduce((x, y) => x + y, "")), (head, tail) => ({ type: "metavar", n: head + tail }))
});

const langTTactic = ParserC.createLanguage({
    all: r => ParserC.alt(langTactic.tacs.map(x => [[0, x]]), r.ttactic).skip(ParserC.string(".").wrap(optWS, optWS)),
    ttactic: () => ParserC.seqMap(NumberParser.wrap(optWS, optWS).skip(ParserC.string(":")), langTactic.tacs.wrap(optWS, optWS), (target, tactic) => [Number(target), tactic]).sepBy1(ParserC.string("|").wrap(optWS, optWS)).wrap(ParserC.string("["), ParserC.string("]")).wrap(optWS, optWS)
});

const langInstruction = ParserC.createLanguage({
    all: r => ParserC.alt(r.addDef, r.addAxiom, r.addTactic, r.printScript, r.printDef, r.printTacs, r.terminate).skip(ParserC.string(".").wrap(optWS, optWS)),
    addDef: () => ParserC.seqMap(optWS.skip(ParserC.string("addDef").wrap(optWS, WS)).then(langTerm.Variable.wrap(optWS, optWS)).skip(ParserC.string(":").wrap(optWS, optWS)), langTerm.Value.wrap(optWS, optWS), (name, binding) => ({ type: "addDef", name: name.n, ty: binding })),
    addAxiom: () => ParserC.seqMap(optWS.skip(ParserC.string("addAxiom").wrap(optWS, WS)).then(langTerm.Variable.wrap(optWS, optWS)).skip(ParserC.string(":").wrap(optWS, optWS)), langTerm.Value.wrap(optWS, optWS), (name, binding) => ({ type: "addAxiom", name: name.n, ty: binding })),
    addTactic: () => ParserC.seqMap(optWS.skip(ParserC.string("addTactic").wrap(optWS, WS)).then(langTactic.metavar.wrap(optWS, optWS)).skip(ParserC.string(":=").wrap(optWS, optWS)), langTactic.tacs.wrap(optWS, optWS), (name, binding) => ({ type: "addTactic", name: name.n, ty: binding })),
    printScript: () => ParserC.string("printScript").wrap(optWS, optWS).result({ type: "printScript" }),
    printDef: () => ParserC.string("printDef").wrap(optWS, optWS).result({ type: "printDef" }),
    printTacs: () => ParserC.string("printTacs").wrap(optWS, optWS).result({ type: "printTacs" }),
    terminate: () => ParserC.string("terminate").wrap(optWS, optWS).result({ type: "terminate" })
});

const parseToTTact = src => {
    let ret = undefined;
    while (true) {
        try {

            ret = langTTactic.all.tryParse(src());
        } catch (err) {
            (0, _globalDef.warn)("Parsing TTactic failed");
            (0, _globalDef.warn)(JSON.stringify(err));
            continue;
        }
        (0, _globalDef.debug)("Parsing TTactic success");
        return ret;
    }
};
const parseToInstr = src => {
    let ret = undefined;
    while (true) {
        try {
            ret = langInstruction.all.tryParse(src());
        } catch (err) {
            (0, _globalDef.warn)("Parsing Instruction failed");
            (0, _globalDef.warn)(JSON.stringify(err));
            continue;
        }
        (0, _globalDef.debug)("Parsing Instruction Success");

        return ret;
    }
};

const parserForTTactic = s => langTTactic.all.tryParse(s);

const parserForInstr = s => langInstruction.all.tryParse(s);

module.exports = {
    parserForTTactic,
    parserForInstr,
    parseToTTact,
    parseToInstr,
    langTerm, langCommand, langTactic, langTTactic, langInstruction
};
},{"../globalDef":10,"parsimmon":11}],9:[function(require,module,exports){
"use strict";

var _console = require("./console.ITP3");

var _parser = require("./parser.ITP3");

var _globalDef = require("../globalDef");

// const Fiber = require('fibers');

let INPUTSCRIPT = "";

const scriptGet = () => INPUTSCRIPT;

// const fiberY = () => {
//     const ret = Fiber.yield();
//     INPUTSCRIPT = INPUTSCRIPT + ret;
//     return ret;
// }
// type Input<K> = string => IO<K>;

const parserTTactic = _parser.parserForTTactic;
const parserInstr = _parser.parserForInstr;

const ask_for_input = s => function* () {
    const ret = yield;
    INPUTSCRIPT = INPUTSCRIPT + ret;
    return ret;
};

const ask_for_input_tactic = s => function* () {
    let ret_ = "";
    let ret = undefined;
    while (ret === undefined) {
        try {

            ret_ = yield* ask_for_input(s)();
            ret = parserTTactic(ret_);
        } catch (err) {
            (0, _globalDef.warn)("Parsing TTactic failed");
            (0, _globalDef.warn)(JSON.stringify(err));
            continue;
        }
    }
    (0, _globalDef.debug)("Parsing TTactic success");
    return ret;
};
const ask_for_input_instr = s => function* () {
    let ret_ = "";
    let ret = undefined;
    while (ret === undefined) {
        try {
            ret_ = yield* ask_for_input(s)();

            ret = parserInstr(ret_);
            if (ret === undefined) {
                continue;
            }
        } catch (err) {
            (0, _globalDef.warn)("Parsing Instruction failed");
            (0, _globalDef.warn)(JSON.stringify(err));
            continue;
        }
    }
    (0, _globalDef.debug)("Parsing Instruction success");
    return ret;
};

const consoleIO = (stdoutput, stderr) => () => (0, _console.CONSOLE)({
    i: ask_for_input_tactic,
    iI: ask_for_input_instr,
    o: stdoutput,
    e: stderr,
    scripts: scriptGet
});

module.exports = { consoleIO };
},{"../globalDef":10,"./console.ITP3":7,"./parser.ITP3":8}],10:[function(require,module,exports){
(function (process){
"use strict";

const debug = s => undefined; // console.log(s + "\n");
const warn = s => process.stderr.write(s);

const ideq = (x, y) => x === y;
const ppID = x => x;
const toID = x => x;

// Generator_ -- a lazy (potential) infinite list

const constGer = c => () => function* () {
    return c;
}();

// Array -> Generator_
const listGen = l => {
    let index = -1;
    return () => {
        index = index + 1;
        return l[index];
    };
};

const concat = (f, g) => {
    let flag = true;
    return () => {
        if (flag) {
            const r = f();
            if (r !== undefined) {
                return r;
            } else {
                flag = false;
            }
        }
        return g();
    };
};

const concat_ = (f, g) => {
    let flag = true;
    let g_ = undefined;
    return () => {
        if (flag) {
            const r = f();
            if (r !== undefined) {
                return r;
            } else {
                flag = false;
                g_ = g();
            }
        }
        if (g_ === undefined) {
            return undefined;
        } else {
            return g_();
        }
    };
};
const joinGen = f => {
    let firsttime = true;
    let current = undefined;
    return () => {
        if (firsttime === true) {
            current = f();firsttime = false;
        }
        let r = undefined;
        while (current !== undefined) {
            r = current();
            if (r === undefined) {
                current = f();
            } else {
                return r;
            }
        }
        return undefined;
    };
};

const mapGen = (fmap, gen) => () => mapOption(fmap)(gen());
const mapOption = fmap => x => {
    if (x === undefined) {
        return undefined;
    } else {
        return fmap(x);
    }
};
const endswith = (x, gen) => {
    return () => {
        const ret = gen();
        if (ret === undefined) {
            return x;
        }
        return ret;
    };
};

const printf = (proto, ...xs) => {
    xs.map((x, index) => {
        proto = proto.replace("{" + String(index) + "}", x);
    });
    return proto;
};

const obeq = (a, b) => typeof a === typeof b && JSON.stringify(a) === JSON.stringify(b);

//let lift_maybe = <D,C>(f: D => C): ((D | undefined) => (C | undefined)) => 
//            (input : D | undefined) => {if (D !== undefined) {return f(D);} else {return undefined;} }

const _add_to_dict = (newterm, newtype, ctx) => {
    let r = ctx.slice();r.push([newterm, newtype]);return r;
};
const _find_in_dict = (pred, ctx) => (x => {
    if (x !== undefined) {
        return x[1];
    } else {
        return undefined;
    }
})(ctx.filter(x => pred(x[0]))[0]);
const _reverse_mapping = d => d.map(x => [x[1], x[0]]);

const toArray = d => {
    let i = 0;
    let ret = [];
    while (true) {
        const result = _find_in_dict(j => j === i, d);
        if (result === undefined) {
            return ret;
        }
        ret.push(result);
    }
    return ret;
};

const toArrayFillBlankWith = (d, maxItemNumber, x) => Array(maxItemNumber).fill(undefined).map((__x, index) => {
    const ret = _find_in_dict(j => j === index, d);
    if (ret !== undefined) {
        return ret;
    } else {
        return x;
    }
});

const pprintDict = (pk, pv) => d => d.map(kv => pk(kv[0]) + " : " + pv(kv[1])).join(",\n");

const gen_not_null = g => () => {
    let ret = g();
    while (ret === undefined) {
        ret = g();
    }
    return ret;
};

const gerDelay = g => x => function* () {
    let f = yield* g();
    return f(x);
};

{} /* const gerForward = <X,Y> (g : X => IO<Y>) : (IO<X => Y>) => 
      function* () {
          return x => {
              const c = yield* g(x);
              return c;
          }
      }() */

// IO<X> = () => Generator<X, X, any>
const gerFlat = g => function* () {
    const f = yield* g();
    const x = yield* f();
    return x;
};

const gen_to_ger = g => function* () {
    let ret = g();
    while (ret == undefined) {
        ret = g();
    }
    return ret;
};

const map_ger = (f, g) => function* () {
    let c = yield* g();
    return f(c);
};

const ger_gen__ger = g => {
    let f = g();
    let r = undefined;
    return function* () {
        if (r === undefined) {
            r = yield* f;
        }
        let ret = r();
        while (ret === undefined) {
            f = g();
            r = yield* f;
            ret = r();
        }
        return ret;
    };
};
module.exports = { ideq, ppID, obeq, toID, debug, printf, warn,
    concat, concat_, joinGen, mapGen, toArrayFillBlankWith, endswith, listGen,
    _add_to_dict, _find_in_dict, _reverse_mapping, pprintDict,
    constGer, gerDelay, gerFlat, gen_to_ger, map_ger, ger_gen__ger
};
}).call(this,require('_process'))
},{"_process":4}],11:[function(require,module,exports){
(function (Buffer){
!function(n,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.Parsimmon=t():n.Parsimmon=t()}("undefined"!=typeof self?self:this,function(){return function(n){var t={};function r(e){if(t[e])return t[e].exports;var u=t[e]={i:e,l:!1,exports:{}};return n[e].call(u.exports,u,u.exports,r),u.l=!0,u.exports}return r.m=n,r.c=t,r.d=function(n,t,e){r.o(n,t)||Object.defineProperty(n,t,{configurable:!1,enumerable:!0,get:e})},r.r=function(n){Object.defineProperty(n,"__esModule",{value:!0})},r.n=function(n){var t=n&&n.__esModule?function(){return n.default}:function(){return n};return r.d(t,"a",t),t},r.o=function(n,t){return Object.prototype.hasOwnProperty.call(n,t)},r.p="",r(r.s=0)}([function(n,t,r){"use strict";function e(n){if(!(this instanceof e))return new e(n);this._=n}var u=e.prototype;function o(n,t){for(var r=0;r<n;r++)t(r)}function i(n,t,r){return function(n,t){o(t.length,function(r){n(t[r],r,t)})}(function(r,e,u){t=n(t,r,e,u)},r),t}function f(n,t){return i(function(t,r,e,u){return t.concat([n(r,e,u)])},[],t)}function a(n,t){var r={v:0,buf:t};return o(n,function(){var n;r={v:r.v<<1|(n=r.buf,n[0]>>7),buf:function(n){var t=i(function(n,t,r,e){return n.concat(r===e.length-1?Buffer.from([t,0]).readUInt16BE(0):e.readUInt16BE(r))},[],n);return Buffer.from(f(function(n){return(n<<1&65535)>>8},t))}(r.buf)}}),r}function c(){return"undefined"!=typeof Buffer}function s(){if(!c())throw new Error("Buffer global does not exist; please consider using https://github.com/feross/buffer if you are running Parsimmon in a browser.")}function l(n){s();var t=i(function(n,t){return n+t},0,n);if(t%8!=0)throw new Error("The bits ["+n.join(", ")+"] add up to "+t+" which is not an even number of bytes; the total should be divisible by 8");var r,u=t/8,o=(r=function(n){return n>48},i(function(n,t){return n||(r(t)?t:n)},null,n));if(o)throw new Error(o+" bit range requested exceeds 48 bit (6 byte) Number max.");return new e(function(t,r){var e=u+r;return e>t.length?x(r,u.toString()+" bytes"):b(e,i(function(n,t){var r=a(t,n.buf);return{coll:n.coll.concat(r.v),buf:r.buf}},{coll:[],buf:t.slice(r,e)},n).coll)})}function h(n,t){return s(),new e(function(r,e){return e+t>r.length?x(e,t+" bytes for "+n):b(e+t,r.slice(e,e+t))})}function p(n,t){if("number"!=typeof(r=t)||Math.floor(r)!==r||t<0||t>6)throw new Error(n+" requires integer length in range [0, 6].");var r}function d(n){return p("uintBE",n),h("uintBE("+n+")",n).map(function(t){return t.readUIntBE(0,n)})}function v(n){return p("uintLE",n),h("uintLE("+n+")",n).map(function(t){return t.readUIntLE(0,n)})}function g(n){return p("intBE",n),h("intBE("+n+")",n).map(function(t){return t.readIntBE(0,n)})}function m(n){return p("intLE",n),h("intLE("+n+")",n).map(function(t){return t.readIntLE(0,n)})}function y(n){return n instanceof e}function E(n){return"[object Array]"==={}.toString.call(n)}function w(n){return c()&&Buffer.isBuffer(n)}function b(n,t){return{status:!0,index:n,value:t,furthest:-1,expected:[]}}function x(n,t){return E(t)||(t=[t]),{status:!1,index:-1,value:null,furthest:n,expected:t}}function B(n,t){if(!t)return n;if(n.furthest>t.furthest)return n;var r=n.furthest===t.furthest?function(n,t){for(var r={},e=0;e<n.length;e++)r[n[e]]=!0;for(var u=0;u<t.length;u++)r[t[u]]=!0;var o=[];for(var i in r)({}).hasOwnProperty.call(r,i)&&o.push(i);return o.sort(),o}(n.expected,t.expected):t.expected;return{status:n.status,index:n.index,value:n.value,furthest:t.furthest,expected:r}}function j(n,t){if(w(n))return{offset:t,line:-1,column:-1};var r=n.slice(0,t).split("\n");return{offset:t,line:r.length,column:r[r.length-1].length+1}}function O(n){if(!y(n))throw new Error("not a parser: "+n)}function L(n,t){return"string"==typeof n?n.charAt(t):n[t]}function _(n){if("number"!=typeof n)throw new Error("not a number: "+n)}function S(n){if("function"!=typeof n)throw new Error("not a function: "+n)}function P(n){if("string"!=typeof n)throw new Error("not a string: "+n)}var k=2,q=3,I=8,A=5*I,F=4*I,M="  ";function z(n,t){return new Array(t+1).join(n)}function R(n,t,r){var e=t-n.length;return e<=0?n:z(r,e)+n}function U(n,t,r,e){return{from:n-t>0?n-t:0,to:n+r>e?e:n+r}}function W(n,t){var r,e,u,o,a,c=t.index,s=c.offset,l=1;if(s===n.length)return"Got the end of the input";if(w(n)){var h=s-s%I,p=s-h,d=U(h,A,F+I,n.length),v=f(function(n){return f(function(n){return R(n.toString(16),2,"0")},n)},function(n,t){var r=n.length,e=[],u=0;if(r<=t)return[n.slice()];for(var o=0;o<r;o++)e[u]||e.push([]),e[u].push(n[o]),(o+1)%t==0&&u++;return e}(n.slice(d.from,d.to).toJSON().data,I));o=function(n){return 0===n.from&&1===n.to?{from:n.from,to:n.to}:{from:n.from/I,to:Math.floor(n.to/I)}}(d),e=h/I,r=3*p,p>=4&&(r+=1),l=2,u=f(function(n){return n.length<=4?n.join(" "):n.slice(0,4).join(" ")+"  "+n.slice(4).join(" ")},v),(a=(8*(o.to>0?o.to-1:o.to)).toString(16).length)<2&&(a=2)}else{var g=n.split(/\r\n|[\n\r\u2028\u2029]/);r=c.column-1,e=c.line-1,o=U(e,k,q,g.length),u=g.slice(o.from,o.to),a=o.to.toString().length}var m=e-o.from;return w(n)&&(a=(8*(o.to>0?o.to-1:o.to)).toString(16).length)<2&&(a=2),i(function(t,e,u){var i,f=u===m,c=f?"> ":M;return i=w(n)?R((8*(o.from+u)).toString(16),a,"0"):R((o.from+u+1).toString(),a," "),[].concat(t,[c+i+" | "+e],f?[M+z(" ",a)+" | "+R("",r," ")+z("^",l)]:[])},[],u).join("\n")}function D(n,t){return["\n","-- PARSING FAILED "+z("-",50),"\n\n",W(n,t),"\n\n",(r=t.expected,1===r.length?"Expected:\n\n"+r[0]:"Expected one of the following: \n\n"+r.join(", ")),"\n"].join("");var r}function N(n){var t=""+n;return t.slice(t.lastIndexOf("/")+1)}function G(){for(var n=[].slice.call(arguments),t=n.length,r=0;r<t;r+=1)O(n[r]);return e(function(r,e){for(var u,o=new Array(t),i=0;i<t;i+=1){if(!(u=B(n[i]._(r,e),u)).status)return u;o[i]=u.value,e=u.index}return B(b(e,o),u)})}function J(){var n=[].slice.call(arguments);if(0===n.length)throw new Error("seqMap needs at least one argument");var t=n.pop();return S(t),G.apply(null,n).map(function(n){return t.apply(null,n)})}function T(){var n=[].slice.call(arguments),t=n.length;if(0===t)return X("zero alternates");for(var r=0;r<t;r+=1)O(n[r]);return e(function(t,r){for(var e,u=0;u<n.length;u+=1)if((e=B(n[u]._(t,r),e)).status)return e;return e})}function V(n,t){return C(n,t).or(Q([]))}function C(n,t){return O(n),O(t),J(n,t.then(n).many(),function(n,t){return[n].concat(t)})}function H(n){P(n);var t="'"+n+"'";return e(function(r,e){var u=e+n.length,o=r.slice(e,u);return o===n?b(u,o):x(e,t)})}function K(n,t){!function(n){if(!(n instanceof RegExp))throw new Error("not a regexp: "+n);for(var t=N(n),r=0;r<t.length;r++){var e=t.charAt(r);if("i"!==e&&"m"!==e&&"u"!==e)throw new Error('unsupported regexp flag "'+e+'": '+n)}}(n),arguments.length>=2?_(t):t=0;var r=function(n){return RegExp("^(?:"+n.source+")",N(n))}(n),u=""+n;return e(function(n,e){var o=r.exec(n.slice(e));if(o){if(0<=t&&t<=o.length){var i=o[0],f=o[t];return b(e+i.length,f)}return x(e,"valid match group (0 to "+o.length+") in "+u)}return x(e,u)})}function Q(n){return e(function(t,r){return b(r,n)})}function X(n){return e(function(t,r){return x(r,n)})}function Y(n){if(y(n))return e(function(t,r){var e=n._(t,r);return e.index=r,e.value="",e});if("string"==typeof n)return Y(H(n));if(n instanceof RegExp)return Y(K(n));throw new Error("not a string, regexp, or parser: "+n)}function Z(n){return O(n),e(function(t,r){var e=n._(t,r),u=t.slice(r,e.index);return e.status?x(r,'not "'+u+'"'):b(r,null)})}function $(n){return S(n),e(function(t,r){var e=L(t,r);return r<t.length&&n(e)?b(r+1,e):x(r,"a character/byte matching "+n)})}function nn(n,t){arguments.length<2&&(t=n,n=void 0);var r=e(function(n,e){return r._=t()._,r._(n,e)});return n?r.desc(n):r}function tn(){return X("fantasy-land/empty")}u.parse=function(n){if("string"!=typeof n&&!w(n))throw new Error(".parse must be called with a string or Buffer as its argument");var t=this.skip(on)._(n,0);return t.status?{status:!0,value:t.value}:{status:!1,index:j(n,t.furthest),expected:t.expected}},u.tryParse=function(n){var t=this.parse(n);if(t.status)return t.value;var r=D(n,t),e=new Error(r);throw e.type="ParsimmonError",e.result=t,e},u.or=function(n){return T(this,n)},u.trim=function(n){return this.wrap(n,n)},u.wrap=function(n,t){return J(n,this,t,function(n,t){return t})},u.thru=function(n){return n(this)},u.then=function(n){return O(n),G(this,n).map(function(n){return n[1]})},u.many=function(){var n=this;return e(function(t,r){for(var e=[],u=void 0;;){if(!(u=B(n._(t,r),u)).status)return B(b(r,e),u);if(r===u.index)throw new Error("infinite loop detected in .many() parser --- calling .many() on a parser which can accept zero characters is usually the cause");r=u.index,e.push(u.value)}})},u.tieWith=function(n){return P(n),this.map(function(t){if(function(n){if(!E(n))throw new Error("not an array: "+n)}(t),t.length){P(t[0]);for(var r=t[0],e=1;e<t.length;e++)P(t[e]),r+=n+t[e];return r}return""})},u.tie=function(){return this.tieWith("")},u.times=function(n,t){var r=this;return arguments.length<2&&(t=n),_(n),_(t),e(function(e,u){for(var o=[],i=void 0,f=void 0,a=0;a<n;a+=1){if(f=B(i=r._(e,u),f),!i.status)return f;u=i.index,o.push(i.value)}for(;a<t&&(f=B(i=r._(e,u),f),i.status);a+=1)u=i.index,o.push(i.value);return B(b(u,o),f)})},u.result=function(n){return this.map(function(){return n})},u.atMost=function(n){return this.times(0,n)},u.atLeast=function(n){return J(this.times(n),this.many(),function(n,t){return n.concat(t)})},u.map=function(n){S(n);var t=this;return e(function(r,e){var u=t._(r,e);return u.status?B(b(u.index,n(u.value)),u):u})},u.contramap=function(n){S(n);var t=this;return e(function(r,e){var u=t.parse(n(r.slice(e)));return u.status?b(e+r.length,u.value):u})},u.promap=function(n,t){return S(n),S(t),this.contramap(n).map(t)},u.skip=function(n){return G(this,n).map(function(n){return n[0]})},u.mark=function(){return J(rn,this,rn,function(n,t,r){return{start:n,value:t,end:r}})},u.node=function(n){return J(rn,this,rn,function(t,r,e){return{name:n,value:r,start:t,end:e}})},u.sepBy=function(n){return V(this,n)},u.sepBy1=function(n){return C(this,n)},u.lookahead=function(n){return this.skip(Y(n))},u.notFollowedBy=function(n){return this.skip(Z(n))},u.desc=function(n){E(n)||(n=[n]);var t=this;return e(function(r,e){var u=t._(r,e);return u.status||(u.expected=n),u})},u.fallback=function(n){return this.or(Q(n))},u.ap=function(n){return J(n,this,function(n,t){return n(t)})},u.chain=function(n){var t=this;return e(function(r,e){var u=t._(r,e);return u.status?B(n(u.value)._(r,u.index),u):u})},u.concat=u.or,u.empty=tn,u.of=Q,u["fantasy-land/ap"]=u.ap,u["fantasy-land/chain"]=u.chain,u["fantasy-land/concat"]=u.concat,u["fantasy-land/empty"]=u.empty,u["fantasy-land/of"]=u.of,u["fantasy-land/map"]=u.map;var rn=e(function(n,t){return b(t,j(n,t))}),en=e(function(n,t){return t>=n.length?x(t,"any character/byte"):b(t+1,L(n,t))}),un=e(function(n,t){return b(n.length,n.slice(t))}),on=e(function(n,t){return t<n.length?x(t,"EOF"):b(t,null)}),fn=K(/[0-9]/).desc("a digit"),an=K(/[0-9]*/).desc("optional digits"),cn=K(/[a-z]/i).desc("a letter"),sn=K(/[a-z]*/i).desc("optional letters"),ln=K(/\s*/).desc("optional whitespace"),hn=K(/\s+/).desc("whitespace"),pn=H("\r"),dn=H("\n"),vn=H("\r\n"),gn=T(vn,dn,pn).desc("newline"),mn=T(gn,on);e.all=un,e.alt=T,e.any=en,e.cr=pn,e.createLanguage=function(n){var t={};for(var r in n)({}).hasOwnProperty.call(n,r)&&function(r){t[r]=nn(function(){return n[r](t)})}(r);return t},e.crlf=vn,e.custom=function(n){return e(n(b,x))},e.digit=fn,e.digits=an,e.empty=tn,e.end=mn,e.eof=on,e.fail=X,e.formatError=D,e.index=rn,e.isParser=y,e.lazy=nn,e.letter=cn,e.letters=sn,e.lf=dn,e.lookahead=Y,e.makeFailure=x,e.makeSuccess=b,e.newline=gn,e.noneOf=function(n){return $(function(t){return n.indexOf(t)<0}).desc("none of '"+n+"'")},e.notFollowedBy=Z,e.of=Q,e.oneOf=function(n){for(var t=n.split(""),r=0;r<t.length;r++)t[r]="'"+t[r]+"'";return $(function(t){return n.indexOf(t)>=0}).desc(t)},e.optWhitespace=ln,e.Parser=e,e.range=function(n,t){return $(function(r){return n<=r&&r<=t}).desc(n+"-"+t)},e.regex=K,e.regexp=K,e.sepBy=V,e.sepBy1=C,e.seq=G,e.seqMap=J,e.seqObj=function(){for(var n,t={},r=0,u=(n=arguments,Array.prototype.slice.call(n)),o=u.length,i=0;i<o;i+=1){var f=u[i];if(!y(f)){if(E(f)&&2===f.length&&"string"==typeof f[0]&&y(f[1])){var a=f[0];if(Object.prototype.hasOwnProperty.call(t,a))throw new Error("seqObj: duplicate key "+a);t[a]=!0,r++;continue}throw new Error("seqObj arguments must be parsers or [string, parser] array pairs.")}}if(0===r)throw new Error("seqObj expects at least one named parser, found zero");return e(function(n,t){for(var r,e={},i=0;i<o;i+=1){var f,a;if(E(u[i])?(f=u[i][0],a=u[i][1]):(f=null,a=u[i]),!(r=B(a._(n,t),r)).status)return r;f&&(e[f]=r.value),t=r.index}return B(b(t,e),r)})},e.string=H,e.succeed=Q,e.takeWhile=function(n){return S(n),e(function(t,r){for(var e=r;e<t.length&&n(L(t,e));)e++;return b(e,t.slice(r,e))})},e.test=$,e.whitespace=hn,e["fantasy-land/empty"]=tn,e["fantasy-land/of"]=Q,e.Binary={bitSeq:l,bitSeqObj:function(n){s();var t={},r=0,e=f(function(n){if(E(n)){var e=n;if(2!==e.length)throw new Error("["+e.join(", ")+"] should be length 2, got length "+e.length);if(P(e[0]),_(e[1]),Object.prototype.hasOwnProperty.call(t,e[0]))throw new Error("duplicate key in bitSeqObj: "+e[0]);return t[e[0]]=!0,r++,e}return _(n),[null,n]},n);if(r<1)throw new Error("bitSeqObj expects at least one named pair, got ["+n.join(", ")+"]");var u=f(function(n){return n[0]},e);return l(f(function(n){return n[1]},e)).map(function(n){return i(function(n,t){return null!==t[0]&&(n[t[0]]=t[1]),n},{},f(function(t,r){return[t,n[r]]},u))})},byte:function(n){if(s(),_(n),n>255)throw new Error("Value specified to byte constructor ("+n+"=0x"+n.toString(16)+") is larger in value than a single byte.");var t=(n>15?"0x":"0x0")+n.toString(16);return e(function(r,e){var u=L(r,e);return u===n?b(e+1,u):x(e,t)})},buffer:function(n){return h("buffer",n).map(function(n){return Buffer.from(n)})},encodedString:function(n,t){return h("string",t).map(function(t){return t.toString(n)})},uintBE:d,uint8BE:d(1),uint16BE:d(2),uint32BE:d(4),uintLE:v,uint8LE:v(1),uint16LE:v(2),uint32LE:v(4),intBE:g,int8BE:g(1),int16BE:g(2),int32BE:g(4),intLE:m,int8LE:m(1),int16LE:m(2),int32LE:m(4),floatBE:h("floatBE",4).map(function(n){return n.readFloatBE(0)}),floatLE:h("floatLE",4).map(function(n){return n.readFloatLE(0)}),doubleBE:h("doubleBE",8).map(function(n){return n.readDoubleBE(0)}),doubleLE:h("doubleLE",8).map(function(n){return n.readDoubleLE(0)})},n.exports=e}])});
}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[9])(9)
});
