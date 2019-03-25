(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
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

},{"base64-js":1,"ieee754":6}],4:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})
},{"../../is-buffer/index.js":8}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],8:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],9:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],10:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


}).call(this,require('_process'))
},{"_process":11}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],14:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],15:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":13,"./encode":14}],16:[function(require,module,exports){
module.exports = require('./lib/_stream_duplex.js');

},{"./lib/_stream_duplex.js":17}],17:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};
},{"./_stream_readable":19,"./_stream_writable":21,"core-util-is":4,"inherits":7,"process-nextick-args":10}],18:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":20,"core-util-is":4,"inherits":7}],19:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = require('./internal/streams/BufferList');
var destroyImpl = require('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./_stream_duplex":17,"./internal/streams/BufferList":22,"./internal/streams/destroy":23,"./internal/streams/stream":24,"_process":11,"core-util-is":4,"events":5,"inherits":7,"isarray":9,"process-nextick-args":10,"safe-buffer":30,"string_decoder/":25,"util":2}],20:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":17,"core-util-is":4,"inherits":7}],21:[function(require,module,exports){
(function (process,global,setImmediate){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = require('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)
},{"./_stream_duplex":17,"./internal/streams/destroy":23,"./internal/streams/stream":24,"_process":11,"core-util-is":4,"inherits":7,"process-nextick-args":10,"safe-buffer":30,"timers":32,"util-deprecate":35}],22:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = require('safe-buffer').Buffer;
var util = require('util');

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
},{"safe-buffer":30,"util":2}],23:[function(require,module,exports){
'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":10}],24:[function(require,module,exports){
module.exports = require('events').EventEmitter;

},{"events":5}],25:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":30}],26:[function(require,module,exports){
module.exports = require('./readable').PassThrough

},{"./readable":27}],27:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":17,"./lib/_stream_passthrough.js":18,"./lib/_stream_readable.js":19,"./lib/_stream_transform.js":20,"./lib/_stream_writable.js":21}],28:[function(require,module,exports){
module.exports = require('./readable').Transform

},{"./readable":27}],29:[function(require,module,exports){
module.exports = require('./lib/_stream_writable.js');

},{"./lib/_stream_writable.js":21}],30:[function(require,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":3}],31:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":5,"inherits":7,"readable-stream/duplex.js":16,"readable-stream/passthrough.js":26,"readable-stream/readable.js":27,"readable-stream/transform.js":28,"readable-stream/writable.js":29}],32:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":11,"timers":32}],33:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":34,"punycode":12,"querystring":15}],34:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],35:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],36:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],37:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":36,"_process":11,"inherits":7}],38:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],39:[function(require,module,exports){
var css = "/*!\n * Bootstrap v3.4.1 (https://getbootstrap.com/)\n * Copyright 2011-2019 Twitter, Inc.\n * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)\n */\n/*! normalize.css v3.0.3 | MIT License | github.com/necolas/normalize.css */\nhtml {\n  font-family: sans-serif;\n  -ms-text-size-adjust: 100%;\n  -webkit-text-size-adjust: 100%;\n}\nbody {\n  margin: 0;\n}\narticle,\naside,\ndetails,\nfigcaption,\nfigure,\nfooter,\nheader,\nhgroup,\nmain,\nmenu,\nnav,\nsection,\nsummary {\n  display: block;\n}\naudio,\ncanvas,\nprogress,\nvideo {\n  display: inline-block;\n  vertical-align: baseline;\n}\naudio:not([controls]) {\n  display: none;\n  height: 0;\n}\n[hidden],\ntemplate {\n  display: none;\n}\na {\n  background-color: transparent;\n}\na:active,\na:hover {\n  outline: 0;\n}\nabbr[title] {\n  border-bottom: none;\n  text-decoration: underline;\n  -webkit-text-decoration: underline dotted;\n  -moz-text-decoration: underline dotted;\n  text-decoration: underline dotted;\n}\nb,\nstrong {\n  font-weight: bold;\n}\ndfn {\n  font-style: italic;\n}\nh1 {\n  font-size: 2em;\n  margin: 0.67em 0;\n}\nmark {\n  background: #ff0;\n  color: #000;\n}\nsmall {\n  font-size: 80%;\n}\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\nsup {\n  top: -0.5em;\n}\nsub {\n  bottom: -0.25em;\n}\nimg {\n  border: 0;\n}\nsvg:not(:root) {\n  overflow: hidden;\n}\nfigure {\n  margin: 1em 40px;\n}\nhr {\n  -webkit-box-sizing: content-box;\n  -moz-box-sizing: content-box;\n  box-sizing: content-box;\n  height: 0;\n}\npre {\n  overflow: auto;\n}\ncode,\nkbd,\npre,\nsamp {\n  font-family: monospace, monospace;\n  font-size: 1em;\n}\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  color: inherit;\n  font: inherit;\n  margin: 0;\n}\nbutton {\n  overflow: visible;\n}\nbutton,\nselect {\n  text-transform: none;\n}\nbutton,\nhtml input[type=\"button\"],\ninput[type=\"reset\"],\ninput[type=\"submit\"] {\n  -webkit-appearance: button;\n  cursor: pointer;\n}\nbutton[disabled],\nhtml input[disabled] {\n  cursor: default;\n}\nbutton::-moz-focus-inner,\ninput::-moz-focus-inner {\n  border: 0;\n  padding: 0;\n}\ninput {\n  line-height: normal;\n}\ninput[type=\"checkbox\"],\ninput[type=\"radio\"] {\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  padding: 0;\n}\ninput[type=\"number\"]::-webkit-inner-spin-button,\ninput[type=\"number\"]::-webkit-outer-spin-button {\n  height: auto;\n}\ninput[type=\"search\"] {\n  -webkit-appearance: textfield;\n  -webkit-box-sizing: content-box;\n  -moz-box-sizing: content-box;\n  box-sizing: content-box;\n}\ninput[type=\"search\"]::-webkit-search-cancel-button,\ninput[type=\"search\"]::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\nfieldset {\n  border: 1px solid #c0c0c0;\n  margin: 0 2px;\n  padding: 0.35em 0.625em 0.75em;\n}\nlegend {\n  border: 0;\n  padding: 0;\n}\ntextarea {\n  overflow: auto;\n}\noptgroup {\n  font-weight: bold;\n}\ntable {\n  border-collapse: collapse;\n  border-spacing: 0;\n}\ntd,\nth {\n  padding: 0;\n}\n/*! Source: https://github.com/h5bp/html5-boilerplate/blob/master/src/css/main.css */\n@media print {\n  *,\n  *:before,\n  *:after {\n    color: #000 !important;\n    text-shadow: none !important;\n    background: transparent !important;\n    -webkit-box-shadow: none !important;\n    box-shadow: none !important;\n  }\n\n  a,\n  a:visited {\n    text-decoration: underline;\n  }\n\n  a[href]:after {\n    content: \" (\" attr(href) \")\";\n  }\n\n  abbr[title]:after {\n    content: \" (\" attr(title) \")\";\n  }\n\n  a[href^=\"#\"]:after,\n  a[href^=\"javascript:\"]:after {\n    content: \"\";\n  }\n\n  pre,\n  blockquote {\n    border: 1px solid #999;\n    page-break-inside: avoid;\n  }\n\n  thead {\n    display: table-header-group;\n  }\n\n  tr,\n  img {\n    page-break-inside: avoid;\n  }\n\n  img {\n    max-width: 100% !important;\n  }\n\n  p,\n  h2,\n  h3 {\n    orphans: 3;\n    widows: 3;\n  }\n\n  h2,\n  h3 {\n    page-break-after: avoid;\n  }\n\n  .navbar {\n    display: none;\n  }\n\n  .btn > .caret,\n  .dropup > .btn > .caret {\n    border-top-color: #000 !important;\n  }\n\n  .label {\n    border: 1px solid #000;\n  }\n\n  .table {\n    border-collapse: collapse !important;\n  }\n\n  .table td,\n  .table th {\n    background-color: #fff !important;\n  }\n\n  .table-bordered th,\n  .table-bordered td {\n    border: 1px solid #ddd !important;\n  }\n}\n@font-face {\n  font-family: \"Glyphicons Halflings\";\n  src: url(\"../../../../node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.eot\");\n  src: url(\"../../../../node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.eot?#iefix\") format(\"embedded-opentype\"), url(\"../../../../node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.woff2\") format(\"woff2\"), url(\"../../../../node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.woff\") format(\"woff\"), url(\"../../../../node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.ttf\") format(\"truetype\"), url(\"../../../../node_modules/bootstrap/dist/fonts/glyphicons-halflings-regular.svg#glyphicons_halflingsregular\") format(\"svg\");\n}\n.glyphicon {\n  position: relative;\n  top: 1px;\n  display: inline-block;\n  font-family: \"Glyphicons Halflings\";\n  font-style: normal;\n  font-weight: 400;\n  line-height: 1;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n.glyphicon-asterisk:before {\n  content: \"\\002a\";\n}\n.glyphicon-plus:before {\n  content: \"\\002b\";\n}\n.glyphicon-euro:before,\n.glyphicon-eur:before {\n  content: \"\\20ac\";\n}\n.glyphicon-minus:before {\n  content: \"\\2212\";\n}\n.glyphicon-cloud:before {\n  content: \"\\2601\";\n}\n.glyphicon-envelope:before {\n  content: \"\\2709\";\n}\n.glyphicon-pencil:before {\n  content: \"\\270f\";\n}\n.glyphicon-glass:before {\n  content: \"\\e001\";\n}\n.glyphicon-music:before {\n  content: \"\\e002\";\n}\n.glyphicon-search:before {\n  content: \"\\e003\";\n}\n.glyphicon-heart:before {\n  content: \"\\e005\";\n}\n.glyphicon-star:before {\n  content: \"\\e006\";\n}\n.glyphicon-star-empty:before {\n  content: \"\\e007\";\n}\n.glyphicon-user:before {\n  content: \"\\e008\";\n}\n.glyphicon-film:before {\n  content: \"\\e009\";\n}\n.glyphicon-th-large:before {\n  content: \"\\e010\";\n}\n.glyphicon-th:before {\n  content: \"\\e011\";\n}\n.glyphicon-th-list:before {\n  content: \"\\e012\";\n}\n.glyphicon-ok:before {\n  content: \"\\e013\";\n}\n.glyphicon-remove:before {\n  content: \"\\e014\";\n}\n.glyphicon-zoom-in:before {\n  content: \"\\e015\";\n}\n.glyphicon-zoom-out:before {\n  content: \"\\e016\";\n}\n.glyphicon-off:before {\n  content: \"\\e017\";\n}\n.glyphicon-signal:before {\n  content: \"\\e018\";\n}\n.glyphicon-cog:before {\n  content: \"\\e019\";\n}\n.glyphicon-trash:before {\n  content: \"\\e020\";\n}\n.glyphicon-home:before {\n  content: \"\\e021\";\n}\n.glyphicon-file:before {\n  content: \"\\e022\";\n}\n.glyphicon-time:before {\n  content: \"\\e023\";\n}\n.glyphicon-road:before {\n  content: \"\\e024\";\n}\n.glyphicon-download-alt:before {\n  content: \"\\e025\";\n}\n.glyphicon-download:before {\n  content: \"\\e026\";\n}\n.glyphicon-upload:before {\n  content: \"\\e027\";\n}\n.glyphicon-inbox:before {\n  content: \"\\e028\";\n}\n.glyphicon-play-circle:before {\n  content: \"\\e029\";\n}\n.glyphicon-repeat:before {\n  content: \"\\e030\";\n}\n.glyphicon-refresh:before {\n  content: \"\\e031\";\n}\n.glyphicon-list-alt:before {\n  content: \"\\e032\";\n}\n.glyphicon-lock:before {\n  content: \"\\e033\";\n}\n.glyphicon-flag:before {\n  content: \"\\e034\";\n}\n.glyphicon-headphones:before {\n  content: \"\\e035\";\n}\n.glyphicon-volume-off:before {\n  content: \"\\e036\";\n}\n.glyphicon-volume-down:before {\n  content: \"\\e037\";\n}\n.glyphicon-volume-up:before {\n  content: \"\\e038\";\n}\n.glyphicon-qrcode:before {\n  content: \"\\e039\";\n}\n.glyphicon-barcode:before {\n  content: \"\\e040\";\n}\n.glyphicon-tag:before {\n  content: \"\\e041\";\n}\n.glyphicon-tags:before {\n  content: \"\\e042\";\n}\n.glyphicon-book:before {\n  content: \"\\e043\";\n}\n.glyphicon-bookmark:before {\n  content: \"\\e044\";\n}\n.glyphicon-print:before {\n  content: \"\\e045\";\n}\n.glyphicon-camera:before {\n  content: \"\\e046\";\n}\n.glyphicon-font:before {\n  content: \"\\e047\";\n}\n.glyphicon-bold:before {\n  content: \"\\e048\";\n}\n.glyphicon-italic:before {\n  content: \"\\e049\";\n}\n.glyphicon-text-height:before {\n  content: \"\\e050\";\n}\n.glyphicon-text-width:before {\n  content: \"\\e051\";\n}\n.glyphicon-align-left:before {\n  content: \"\\e052\";\n}\n.glyphicon-align-center:before {\n  content: \"\\e053\";\n}\n.glyphicon-align-right:before {\n  content: \"\\e054\";\n}\n.glyphicon-align-justify:before {\n  content: \"\\e055\";\n}\n.glyphicon-list:before {\n  content: \"\\e056\";\n}\n.glyphicon-indent-left:before {\n  content: \"\\e057\";\n}\n.glyphicon-indent-right:before {\n  content: \"\\e058\";\n}\n.glyphicon-facetime-video:before {\n  content: \"\\e059\";\n}\n.glyphicon-picture:before {\n  content: \"\\e060\";\n}\n.glyphicon-map-marker:before {\n  content: \"\\e062\";\n}\n.glyphicon-adjust:before {\n  content: \"\\e063\";\n}\n.glyphicon-tint:before {\n  content: \"\\e064\";\n}\n.glyphicon-edit:before {\n  content: \"\\e065\";\n}\n.glyphicon-share:before {\n  content: \"\\e066\";\n}\n.glyphicon-check:before {\n  content: \"\\e067\";\n}\n.glyphicon-move:before {\n  content: \"\\e068\";\n}\n.glyphicon-step-backward:before {\n  content: \"\\e069\";\n}\n.glyphicon-fast-backward:before {\n  content: \"\\e070\";\n}\n.glyphicon-backward:before {\n  content: \"\\e071\";\n}\n.glyphicon-play:before {\n  content: \"\\e072\";\n}\n.glyphicon-pause:before {\n  content: \"\\e073\";\n}\n.glyphicon-stop:before {\n  content: \"\\e074\";\n}\n.glyphicon-forward:before {\n  content: \"\\e075\";\n}\n.glyphicon-fast-forward:before {\n  content: \"\\e076\";\n}\n.glyphicon-step-forward:before {\n  content: \"\\e077\";\n}\n.glyphicon-eject:before {\n  content: \"\\e078\";\n}\n.glyphicon-chevron-left:before {\n  content: \"\\e079\";\n}\n.glyphicon-chevron-right:before {\n  content: \"\\e080\";\n}\n.glyphicon-plus-sign:before {\n  content: \"\\e081\";\n}\n.glyphicon-minus-sign:before {\n  content: \"\\e082\";\n}\n.glyphicon-remove-sign:before {\n  content: \"\\e083\";\n}\n.glyphicon-ok-sign:before {\n  content: \"\\e084\";\n}\n.glyphicon-question-sign:before {\n  content: \"\\e085\";\n}\n.glyphicon-info-sign:before {\n  content: \"\\e086\";\n}\n.glyphicon-screenshot:before {\n  content: \"\\e087\";\n}\n.glyphicon-remove-circle:before {\n  content: \"\\e088\";\n}\n.glyphicon-ok-circle:before {\n  content: \"\\e089\";\n}\n.glyphicon-ban-circle:before {\n  content: \"\\e090\";\n}\n.glyphicon-arrow-left:before {\n  content: \"\\e091\";\n}\n.glyphicon-arrow-right:before {\n  content: \"\\e092\";\n}\n.glyphicon-arrow-up:before {\n  content: \"\\e093\";\n}\n.glyphicon-arrow-down:before {\n  content: \"\\e094\";\n}\n.glyphicon-share-alt:before {\n  content: \"\\e095\";\n}\n.glyphicon-resize-full:before {\n  content: \"\\e096\";\n}\n.glyphicon-resize-small:before {\n  content: \"\\e097\";\n}\n.glyphicon-exclamation-sign:before {\n  content: \"\\e101\";\n}\n.glyphicon-gift:before {\n  content: \"\\e102\";\n}\n.glyphicon-leaf:before {\n  content: \"\\e103\";\n}\n.glyphicon-fire:before {\n  content: \"\\e104\";\n}\n.glyphicon-eye-open:before {\n  content: \"\\e105\";\n}\n.glyphicon-eye-close:before {\n  content: \"\\e106\";\n}\n.glyphicon-warning-sign:before {\n  content: \"\\e107\";\n}\n.glyphicon-plane:before {\n  content: \"\\e108\";\n}\n.glyphicon-calendar:before {\n  content: \"\\e109\";\n}\n.glyphicon-random:before {\n  content: \"\\e110\";\n}\n.glyphicon-comment:before {\n  content: \"\\e111\";\n}\n.glyphicon-magnet:before {\n  content: \"\\e112\";\n}\n.glyphicon-chevron-up:before {\n  content: \"\\e113\";\n}\n.glyphicon-chevron-down:before {\n  content: \"\\e114\";\n}\n.glyphicon-retweet:before {\n  content: \"\\e115\";\n}\n.glyphicon-shopping-cart:before {\n  content: \"\\e116\";\n}\n.glyphicon-folder-close:before {\n  content: \"\\e117\";\n}\n.glyphicon-folder-open:before {\n  content: \"\\e118\";\n}\n.glyphicon-resize-vertical:before {\n  content: \"\\e119\";\n}\n.glyphicon-resize-horizontal:before {\n  content: \"\\e120\";\n}\n.glyphicon-hdd:before {\n  content: \"\\e121\";\n}\n.glyphicon-bullhorn:before {\n  content: \"\\e122\";\n}\n.glyphicon-bell:before {\n  content: \"\\e123\";\n}\n.glyphicon-certificate:before {\n  content: \"\\e124\";\n}\n.glyphicon-thumbs-up:before {\n  content: \"\\e125\";\n}\n.glyphicon-thumbs-down:before {\n  content: \"\\e126\";\n}\n.glyphicon-hand-right:before {\n  content: \"\\e127\";\n}\n.glyphicon-hand-left:before {\n  content: \"\\e128\";\n}\n.glyphicon-hand-up:before {\n  content: \"\\e129\";\n}\n.glyphicon-hand-down:before {\n  content: \"\\e130\";\n}\n.glyphicon-circle-arrow-right:before {\n  content: \"\\e131\";\n}\n.glyphicon-circle-arrow-left:before {\n  content: \"\\e132\";\n}\n.glyphicon-circle-arrow-up:before {\n  content: \"\\e133\";\n}\n.glyphicon-circle-arrow-down:before {\n  content: \"\\e134\";\n}\n.glyphicon-globe:before {\n  content: \"\\e135\";\n}\n.glyphicon-wrench:before {\n  content: \"\\e136\";\n}\n.glyphicon-tasks:before {\n  content: \"\\e137\";\n}\n.glyphicon-filter:before {\n  content: \"\\e138\";\n}\n.glyphicon-briefcase:before {\n  content: \"\\e139\";\n}\n.glyphicon-fullscreen:before {\n  content: \"\\e140\";\n}\n.glyphicon-dashboard:before {\n  content: \"\\e141\";\n}\n.glyphicon-paperclip:before {\n  content: \"\\e142\";\n}\n.glyphicon-heart-empty:before {\n  content: \"\\e143\";\n}\n.glyphicon-link:before {\n  content: \"\\e144\";\n}\n.glyphicon-phone:before {\n  content: \"\\e145\";\n}\n.glyphicon-pushpin:before {\n  content: \"\\e146\";\n}\n.glyphicon-usd:before {\n  content: \"\\e148\";\n}\n.glyphicon-gbp:before {\n  content: \"\\e149\";\n}\n.glyphicon-sort:before {\n  content: \"\\e150\";\n}\n.glyphicon-sort-by-alphabet:before {\n  content: \"\\e151\";\n}\n.glyphicon-sort-by-alphabet-alt:before {\n  content: \"\\e152\";\n}\n.glyphicon-sort-by-order:before {\n  content: \"\\e153\";\n}\n.glyphicon-sort-by-order-alt:before {\n  content: \"\\e154\";\n}\n.glyphicon-sort-by-attributes:before {\n  content: \"\\e155\";\n}\n.glyphicon-sort-by-attributes-alt:before {\n  content: \"\\e156\";\n}\n.glyphicon-unchecked:before {\n  content: \"\\e157\";\n}\n.glyphicon-expand:before {\n  content: \"\\e158\";\n}\n.glyphicon-collapse-down:before {\n  content: \"\\e159\";\n}\n.glyphicon-collapse-up:before {\n  content: \"\\e160\";\n}\n.glyphicon-log-in:before {\n  content: \"\\e161\";\n}\n.glyphicon-flash:before {\n  content: \"\\e162\";\n}\n.glyphicon-log-out:before {\n  content: \"\\e163\";\n}\n.glyphicon-new-window:before {\n  content: \"\\e164\";\n}\n.glyphicon-record:before {\n  content: \"\\e165\";\n}\n.glyphicon-save:before {\n  content: \"\\e166\";\n}\n.glyphicon-open:before {\n  content: \"\\e167\";\n}\n.glyphicon-saved:before {\n  content: \"\\e168\";\n}\n.glyphicon-import:before {\n  content: \"\\e169\";\n}\n.glyphicon-export:before {\n  content: \"\\e170\";\n}\n.glyphicon-send:before {\n  content: \"\\e171\";\n}\n.glyphicon-floppy-disk:before {\n  content: \"\\e172\";\n}\n.glyphicon-floppy-saved:before {\n  content: \"\\e173\";\n}\n.glyphicon-floppy-remove:before {\n  content: \"\\e174\";\n}\n.glyphicon-floppy-save:before {\n  content: \"\\e175\";\n}\n.glyphicon-floppy-open:before {\n  content: \"\\e176\";\n}\n.glyphicon-credit-card:before {\n  content: \"\\e177\";\n}\n.glyphicon-transfer:before {\n  content: \"\\e178\";\n}\n.glyphicon-cutlery:before {\n  content: \"\\e179\";\n}\n.glyphicon-header:before {\n  content: \"\\e180\";\n}\n.glyphicon-compressed:before {\n  content: \"\\e181\";\n}\n.glyphicon-earphone:before {\n  content: \"\\e182\";\n}\n.glyphicon-phone-alt:before {\n  content: \"\\e183\";\n}\n.glyphicon-tower:before {\n  content: \"\\e184\";\n}\n.glyphicon-stats:before {\n  content: \"\\e185\";\n}\n.glyphicon-sd-video:before {\n  content: \"\\e186\";\n}\n.glyphicon-hd-video:before {\n  content: \"\\e187\";\n}\n.glyphicon-subtitles:before {\n  content: \"\\e188\";\n}\n.glyphicon-sound-stereo:before {\n  content: \"\\e189\";\n}\n.glyphicon-sound-dolby:before {\n  content: \"\\e190\";\n}\n.glyphicon-sound-5-1:before {\n  content: \"\\e191\";\n}\n.glyphicon-sound-6-1:before {\n  content: \"\\e192\";\n}\n.glyphicon-sound-7-1:before {\n  content: \"\\e193\";\n}\n.glyphicon-copyright-mark:before {\n  content: \"\\e194\";\n}\n.glyphicon-registration-mark:before {\n  content: \"\\e195\";\n}\n.glyphicon-cloud-download:before {\n  content: \"\\e197\";\n}\n.glyphicon-cloud-upload:before {\n  content: \"\\e198\";\n}\n.glyphicon-tree-conifer:before {\n  content: \"\\e199\";\n}\n.glyphicon-tree-deciduous:before {\n  content: \"\\e200\";\n}\n.glyphicon-cd:before {\n  content: \"\\e201\";\n}\n.glyphicon-save-file:before {\n  content: \"\\e202\";\n}\n.glyphicon-open-file:before {\n  content: \"\\e203\";\n}\n.glyphicon-level-up:before {\n  content: \"\\e204\";\n}\n.glyphicon-copy:before {\n  content: \"\\e205\";\n}\n.glyphicon-paste:before {\n  content: \"\\e206\";\n}\n.glyphicon-alert:before {\n  content: \"\\e209\";\n}\n.glyphicon-equalizer:before {\n  content: \"\\e210\";\n}\n.glyphicon-king:before {\n  content: \"\\e211\";\n}\n.glyphicon-queen:before {\n  content: \"\\e212\";\n}\n.glyphicon-pawn:before {\n  content: \"\\e213\";\n}\n.glyphicon-bishop:before {\n  content: \"\\e214\";\n}\n.glyphicon-knight:before {\n  content: \"\\e215\";\n}\n.glyphicon-baby-formula:before {\n  content: \"\\e216\";\n}\n.glyphicon-tent:before {\n  content: \"\\26fa\";\n}\n.glyphicon-blackboard:before {\n  content: \"\\e218\";\n}\n.glyphicon-bed:before {\n  content: \"\\e219\";\n}\n.glyphicon-apple:before {\n  content: \"\\f8ff\";\n}\n.glyphicon-erase:before {\n  content: \"\\e221\";\n}\n.glyphicon-hourglass:before {\n  content: \"\\231b\";\n}\n.glyphicon-lamp:before {\n  content: \"\\e223\";\n}\n.glyphicon-duplicate:before {\n  content: \"\\e224\";\n}\n.glyphicon-piggy-bank:before {\n  content: \"\\e225\";\n}\n.glyphicon-scissors:before {\n  content: \"\\e226\";\n}\n.glyphicon-bitcoin:before {\n  content: \"\\e227\";\n}\n.glyphicon-btc:before {\n  content: \"\\e227\";\n}\n.glyphicon-xbt:before {\n  content: \"\\e227\";\n}\n.glyphicon-yen:before {\n  content: \"\\00a5\";\n}\n.glyphicon-jpy:before {\n  content: \"\\00a5\";\n}\n.glyphicon-ruble:before {\n  content: \"\\20bd\";\n}\n.glyphicon-rub:before {\n  content: \"\\20bd\";\n}\n.glyphicon-scale:before {\n  content: \"\\e230\";\n}\n.glyphicon-ice-lolly:before {\n  content: \"\\e231\";\n}\n.glyphicon-ice-lolly-tasted:before {\n  content: \"\\e232\";\n}\n.glyphicon-education:before {\n  content: \"\\e233\";\n}\n.glyphicon-option-horizontal:before {\n  content: \"\\e234\";\n}\n.glyphicon-option-vertical:before {\n  content: \"\\e235\";\n}\n.glyphicon-menu-hamburger:before {\n  content: \"\\e236\";\n}\n.glyphicon-modal-window:before {\n  content: \"\\e237\";\n}\n.glyphicon-oil:before {\n  content: \"\\e238\";\n}\n.glyphicon-grain:before {\n  content: \"\\e239\";\n}\n.glyphicon-sunglasses:before {\n  content: \"\\e240\";\n}\n.glyphicon-text-size:before {\n  content: \"\\e241\";\n}\n.glyphicon-text-color:before {\n  content: \"\\e242\";\n}\n.glyphicon-text-background:before {\n  content: \"\\e243\";\n}\n.glyphicon-object-align-top:before {\n  content: \"\\e244\";\n}\n.glyphicon-object-align-bottom:before {\n  content: \"\\e245\";\n}\n.glyphicon-object-align-horizontal:before {\n  content: \"\\e246\";\n}\n.glyphicon-object-align-left:before {\n  content: \"\\e247\";\n}\n.glyphicon-object-align-vertical:before {\n  content: \"\\e248\";\n}\n.glyphicon-object-align-right:before {\n  content: \"\\e249\";\n}\n.glyphicon-triangle-right:before {\n  content: \"\\e250\";\n}\n.glyphicon-triangle-left:before {\n  content: \"\\e251\";\n}\n.glyphicon-triangle-bottom:before {\n  content: \"\\e252\";\n}\n.glyphicon-triangle-top:before {\n  content: \"\\e253\";\n}\n.glyphicon-console:before {\n  content: \"\\e254\";\n}\n.glyphicon-superscript:before {\n  content: \"\\e255\";\n}\n.glyphicon-subscript:before {\n  content: \"\\e256\";\n}\n.glyphicon-menu-left:before {\n  content: \"\\e257\";\n}\n.glyphicon-menu-right:before {\n  content: \"\\e258\";\n}\n.glyphicon-menu-down:before {\n  content: \"\\e259\";\n}\n.glyphicon-menu-up:before {\n  content: \"\\e260\";\n}\n* {\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n*:before,\n*:after {\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\nhtml {\n  font-size: 10px;\n  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);\n}\nbody {\n  font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n  font-size: 14px;\n  line-height: 1.42857143;\n  color: #333333;\n  background-color: #fff;\n}\ninput,\nbutton,\nselect,\ntextarea {\n  font-family: inherit;\n  font-size: inherit;\n  line-height: inherit;\n}\na {\n  color: #337ab7;\n  text-decoration: none;\n}\na:hover,\na:focus {\n  color: #23527c;\n  text-decoration: underline;\n}\na:focus {\n  outline: 5px auto -webkit-focus-ring-color;\n  outline-offset: -2px;\n}\nfigure {\n  margin: 0;\n}\nimg {\n  vertical-align: middle;\n}\n.img-responsive,\n.thumbnail > img,\n.thumbnail a > img,\n.carousel-inner > .item > img,\n.carousel-inner > .item > a > img {\n  display: block;\n  max-width: 100%;\n  height: auto;\n}\n.img-rounded {\n  border-radius: 6px;\n}\n.img-thumbnail {\n  padding: 4px;\n  line-height: 1.42857143;\n  background-color: #fff;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n  -webkit-transition: all 0.2s ease-in-out;\n  -o-transition: all 0.2s ease-in-out;\n  transition: all 0.2s ease-in-out;\n  display: inline-block;\n  max-width: 100%;\n  height: auto;\n}\n.img-circle {\n  border-radius: 50%;\n}\nhr {\n  margin-top: 20px;\n  margin-bottom: 20px;\n  border: 0;\n  border-top: 1px solid #eeeeee;\n}\n.sr-only {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  border: 0;\n}\n.sr-only-focusable:active,\n.sr-only-focusable:focus {\n  position: static;\n  width: auto;\n  height: auto;\n  margin: 0;\n  overflow: visible;\n  clip: auto;\n}\n[role=\"button\"] {\n  cursor: pointer;\n}\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\n.h1,\n.h2,\n.h3,\n.h4,\n.h5,\n.h6 {\n  font-family: inherit;\n  font-weight: 500;\n  line-height: 1.1;\n  color: inherit;\n}\nh1 small,\nh2 small,\nh3 small,\nh4 small,\nh5 small,\nh6 small,\n.h1 small,\n.h2 small,\n.h3 small,\n.h4 small,\n.h5 small,\n.h6 small,\nh1 .small,\nh2 .small,\nh3 .small,\nh4 .small,\nh5 .small,\nh6 .small,\n.h1 .small,\n.h2 .small,\n.h3 .small,\n.h4 .small,\n.h5 .small,\n.h6 .small {\n  font-weight: 400;\n  line-height: 1;\n  color: #777777;\n}\nh1,\n.h1,\nh2,\n.h2,\nh3,\n.h3 {\n  margin-top: 20px;\n  margin-bottom: 10px;\n}\nh1 small,\n.h1 small,\nh2 small,\n.h2 small,\nh3 small,\n.h3 small,\nh1 .small,\n.h1 .small,\nh2 .small,\n.h2 .small,\nh3 .small,\n.h3 .small {\n  font-size: 65%;\n}\nh4,\n.h4,\nh5,\n.h5,\nh6,\n.h6 {\n  margin-top: 10px;\n  margin-bottom: 10px;\n}\nh4 small,\n.h4 small,\nh5 small,\n.h5 small,\nh6 small,\n.h6 small,\nh4 .small,\n.h4 .small,\nh5 .small,\n.h5 .small,\nh6 .small,\n.h6 .small {\n  font-size: 75%;\n}\nh1,\n.h1 {\n  font-size: 36px;\n}\nh2,\n.h2 {\n  font-size: 30px;\n}\nh3,\n.h3 {\n  font-size: 24px;\n}\nh4,\n.h4 {\n  font-size: 18px;\n}\nh5,\n.h5 {\n  font-size: 14px;\n}\nh6,\n.h6 {\n  font-size: 12px;\n}\np {\n  margin: 0 0 10px;\n}\n.lead {\n  margin-bottom: 20px;\n  font-size: 16px;\n  font-weight: 300;\n  line-height: 1.4;\n}\n@media (min-width: 768px) {\n  .lead {\n    font-size: 21px;\n  }\n}\nsmall,\n.small {\n  font-size: 85%;\n}\nmark,\n.mark {\n  padding: 0.2em;\n  background-color: #fcf8e3;\n}\n.text-left {\n  text-align: left;\n}\n.text-right {\n  text-align: right;\n}\n.text-center {\n  text-align: center;\n}\n.text-justify {\n  text-align: justify;\n}\n.text-nowrap {\n  white-space: nowrap;\n}\n.text-lowercase {\n  text-transform: lowercase;\n}\n.text-uppercase {\n  text-transform: uppercase;\n}\n.text-capitalize {\n  text-transform: capitalize;\n}\n.text-muted {\n  color: #777777;\n}\n.text-primary {\n  color: #337ab7;\n}\na.text-primary:hover,\na.text-primary:focus {\n  color: #286090;\n}\n.text-success {\n  color: #3c763d;\n}\na.text-success:hover,\na.text-success:focus {\n  color: #2b542c;\n}\n.text-info {\n  color: #31708f;\n}\na.text-info:hover,\na.text-info:focus {\n  color: #245269;\n}\n.text-warning {\n  color: #8a6d3b;\n}\na.text-warning:hover,\na.text-warning:focus {\n  color: #66512c;\n}\n.text-danger {\n  color: #a94442;\n}\na.text-danger:hover,\na.text-danger:focus {\n  color: #843534;\n}\n.bg-primary {\n  color: #fff;\n  background-color: #337ab7;\n}\na.bg-primary:hover,\na.bg-primary:focus {\n  background-color: #286090;\n}\n.bg-success {\n  background-color: #dff0d8;\n}\na.bg-success:hover,\na.bg-success:focus {\n  background-color: #c1e2b3;\n}\n.bg-info {\n  background-color: #d9edf7;\n}\na.bg-info:hover,\na.bg-info:focus {\n  background-color: #afd9ee;\n}\n.bg-warning {\n  background-color: #fcf8e3;\n}\na.bg-warning:hover,\na.bg-warning:focus {\n  background-color: #f7ecb5;\n}\n.bg-danger {\n  background-color: #f2dede;\n}\na.bg-danger:hover,\na.bg-danger:focus {\n  background-color: #e4b9b9;\n}\n.page-header {\n  padding-bottom: 9px;\n  margin: 40px 0 20px;\n  border-bottom: 1px solid #eeeeee;\n}\nul,\nol {\n  margin-top: 0;\n  margin-bottom: 10px;\n}\nul ul,\nol ul,\nul ol,\nol ol {\n  margin-bottom: 0;\n}\n.list-unstyled {\n  padding-left: 0;\n  list-style: none;\n}\n.list-inline {\n  padding-left: 0;\n  list-style: none;\n  margin-left: -5px;\n}\n.list-inline > li {\n  display: inline-block;\n  padding-right: 5px;\n  padding-left: 5px;\n}\ndl {\n  margin-top: 0;\n  margin-bottom: 20px;\n}\ndt,\ndd {\n  line-height: 1.42857143;\n}\ndt {\n  font-weight: 700;\n}\ndd {\n  margin-left: 0;\n}\n@media (min-width: 768px) {\n  .dl-horizontal dt {\n    float: left;\n    width: 160px;\n    clear: left;\n    text-align: right;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n  }\n\n  .dl-horizontal dd {\n    margin-left: 180px;\n  }\n}\nabbr[title],\nabbr[data-original-title] {\n  cursor: help;\n}\n.initialism {\n  font-size: 90%;\n  text-transform: uppercase;\n}\nblockquote {\n  padding: 10px 20px;\n  margin: 0 0 20px;\n  font-size: 17.5px;\n  border-left: 5px solid #eeeeee;\n}\nblockquote p:last-child,\nblockquote ul:last-child,\nblockquote ol:last-child {\n  margin-bottom: 0;\n}\nblockquote footer,\nblockquote small,\nblockquote .small {\n  display: block;\n  font-size: 80%;\n  line-height: 1.42857143;\n  color: #777777;\n}\nblockquote footer:before,\nblockquote small:before,\nblockquote .small:before {\n  content: \"\\2014 \\00A0\";\n}\n.blockquote-reverse,\nblockquote.pull-right {\n  padding-right: 15px;\n  padding-left: 0;\n  text-align: right;\n  border-right: 5px solid #eeeeee;\n  border-left: 0;\n}\n.blockquote-reverse footer:before,\nblockquote.pull-right footer:before,\n.blockquote-reverse small:before,\nblockquote.pull-right small:before,\n.blockquote-reverse .small:before,\nblockquote.pull-right .small:before {\n  content: \"\";\n}\n.blockquote-reverse footer:after,\nblockquote.pull-right footer:after,\n.blockquote-reverse small:after,\nblockquote.pull-right small:after,\n.blockquote-reverse .small:after,\nblockquote.pull-right .small:after {\n  content: \"\\00A0 \\2014\";\n}\naddress {\n  margin-bottom: 20px;\n  font-style: normal;\n  line-height: 1.42857143;\n}\ncode,\nkbd,\npre,\nsamp {\n  font-family: Menlo, Monaco, Consolas, \"Courier New\", monospace;\n}\ncode {\n  padding: 2px 4px;\n  font-size: 90%;\n  color: #c7254e;\n  background-color: #f9f2f4;\n  border-radius: 4px;\n}\nkbd {\n  padding: 2px 4px;\n  font-size: 90%;\n  color: #fff;\n  background-color: #333;\n  border-radius: 3px;\n  -webkit-box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25);\n  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25);\n}\nkbd kbd {\n  padding: 0;\n  font-size: 100%;\n  font-weight: 700;\n  -webkit-box-shadow: none;\n  box-shadow: none;\n}\npre {\n  display: block;\n  padding: 9.5px;\n  margin: 0 0 10px;\n  font-size: 13px;\n  line-height: 1.42857143;\n  color: #333333;\n  word-break: break-all;\n  word-wrap: break-word;\n  background-color: #f5f5f5;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n}\npre code {\n  padding: 0;\n  font-size: inherit;\n  color: inherit;\n  white-space: pre-wrap;\n  background-color: transparent;\n  border-radius: 0;\n}\n.pre-scrollable {\n  max-height: 340px;\n  overflow-y: scroll;\n}\n.container {\n  padding-right: 15px;\n  padding-left: 15px;\n  margin-right: auto;\n  margin-left: auto;\n}\n@media (min-width: 768px) {\n  .container {\n    width: 750px;\n  }\n}\n@media (min-width: 992px) {\n  .container {\n    width: 970px;\n  }\n}\n@media (min-width: 1200px) {\n  .container {\n    width: 1170px;\n  }\n}\n.container-fluid {\n  padding-right: 15px;\n  padding-left: 15px;\n  margin-right: auto;\n  margin-left: auto;\n}\n.row {\n  margin-right: -15px;\n  margin-left: -15px;\n}\n.row-no-gutters {\n  margin-right: 0;\n  margin-left: 0;\n}\n.row-no-gutters [class*=\"col-\"] {\n  padding-right: 0;\n  padding-left: 0;\n}\n.col-xs-1,\n.col-sm-1,\n.col-md-1,\n.col-lg-1,\n.col-xs-2,\n.col-sm-2,\n.col-md-2,\n.col-lg-2,\n.col-xs-3,\n.col-sm-3,\n.col-md-3,\n.col-lg-3,\n.col-xs-4,\n.col-sm-4,\n.col-md-4,\n.col-lg-4,\n.col-xs-5,\n.col-sm-5,\n.col-md-5,\n.col-lg-5,\n.col-xs-6,\n.col-sm-6,\n.col-md-6,\n.col-lg-6,\n.col-xs-7,\n.col-sm-7,\n.col-md-7,\n.col-lg-7,\n.col-xs-8,\n.col-sm-8,\n.col-md-8,\n.col-lg-8,\n.col-xs-9,\n.col-sm-9,\n.col-md-9,\n.col-lg-9,\n.col-xs-10,\n.col-sm-10,\n.col-md-10,\n.col-lg-10,\n.col-xs-11,\n.col-sm-11,\n.col-md-11,\n.col-lg-11,\n.col-xs-12,\n.col-sm-12,\n.col-md-12,\n.col-lg-12 {\n  position: relative;\n  min-height: 1px;\n  padding-right: 15px;\n  padding-left: 15px;\n}\n.col-xs-1,\n.col-xs-2,\n.col-xs-3,\n.col-xs-4,\n.col-xs-5,\n.col-xs-6,\n.col-xs-7,\n.col-xs-8,\n.col-xs-9,\n.col-xs-10,\n.col-xs-11,\n.col-xs-12 {\n  float: left;\n}\n.col-xs-12 {\n  width: 100%;\n}\n.col-xs-11 {\n  width: 91.66666667%;\n}\n.col-xs-10 {\n  width: 83.33333333%;\n}\n.col-xs-9 {\n  width: 75%;\n}\n.col-xs-8 {\n  width: 66.66666667%;\n}\n.col-xs-7 {\n  width: 58.33333333%;\n}\n.col-xs-6 {\n  width: 50%;\n}\n.col-xs-5 {\n  width: 41.66666667%;\n}\n.col-xs-4 {\n  width: 33.33333333%;\n}\n.col-xs-3 {\n  width: 25%;\n}\n.col-xs-2 {\n  width: 16.66666667%;\n}\n.col-xs-1 {\n  width: 8.33333333%;\n}\n.col-xs-pull-12 {\n  right: 100%;\n}\n.col-xs-pull-11 {\n  right: 91.66666667%;\n}\n.col-xs-pull-10 {\n  right: 83.33333333%;\n}\n.col-xs-pull-9 {\n  right: 75%;\n}\n.col-xs-pull-8 {\n  right: 66.66666667%;\n}\n.col-xs-pull-7 {\n  right: 58.33333333%;\n}\n.col-xs-pull-6 {\n  right: 50%;\n}\n.col-xs-pull-5 {\n  right: 41.66666667%;\n}\n.col-xs-pull-4 {\n  right: 33.33333333%;\n}\n.col-xs-pull-3 {\n  right: 25%;\n}\n.col-xs-pull-2 {\n  right: 16.66666667%;\n}\n.col-xs-pull-1 {\n  right: 8.33333333%;\n}\n.col-xs-pull-0 {\n  right: auto;\n}\n.col-xs-push-12 {\n  left: 100%;\n}\n.col-xs-push-11 {\n  left: 91.66666667%;\n}\n.col-xs-push-10 {\n  left: 83.33333333%;\n}\n.col-xs-push-9 {\n  left: 75%;\n}\n.col-xs-push-8 {\n  left: 66.66666667%;\n}\n.col-xs-push-7 {\n  left: 58.33333333%;\n}\n.col-xs-push-6 {\n  left: 50%;\n}\n.col-xs-push-5 {\n  left: 41.66666667%;\n}\n.col-xs-push-4 {\n  left: 33.33333333%;\n}\n.col-xs-push-3 {\n  left: 25%;\n}\n.col-xs-push-2 {\n  left: 16.66666667%;\n}\n.col-xs-push-1 {\n  left: 8.33333333%;\n}\n.col-xs-push-0 {\n  left: auto;\n}\n.col-xs-offset-12 {\n  margin-left: 100%;\n}\n.col-xs-offset-11 {\n  margin-left: 91.66666667%;\n}\n.col-xs-offset-10 {\n  margin-left: 83.33333333%;\n}\n.col-xs-offset-9 {\n  margin-left: 75%;\n}\n.col-xs-offset-8 {\n  margin-left: 66.66666667%;\n}\n.col-xs-offset-7 {\n  margin-left: 58.33333333%;\n}\n.col-xs-offset-6 {\n  margin-left: 50%;\n}\n.col-xs-offset-5 {\n  margin-left: 41.66666667%;\n}\n.col-xs-offset-4 {\n  margin-left: 33.33333333%;\n}\n.col-xs-offset-3 {\n  margin-left: 25%;\n}\n.col-xs-offset-2 {\n  margin-left: 16.66666667%;\n}\n.col-xs-offset-1 {\n  margin-left: 8.33333333%;\n}\n.col-xs-offset-0 {\n  margin-left: 0%;\n}\n@media (min-width: 768px) {\n  .col-sm-1,\n  .col-sm-2,\n  .col-sm-3,\n  .col-sm-4,\n  .col-sm-5,\n  .col-sm-6,\n  .col-sm-7,\n  .col-sm-8,\n  .col-sm-9,\n  .col-sm-10,\n  .col-sm-11,\n  .col-sm-12 {\n    float: left;\n  }\n\n  .col-sm-12 {\n    width: 100%;\n  }\n\n  .col-sm-11 {\n    width: 91.66666667%;\n  }\n\n  .col-sm-10 {\n    width: 83.33333333%;\n  }\n\n  .col-sm-9 {\n    width: 75%;\n  }\n\n  .col-sm-8 {\n    width: 66.66666667%;\n  }\n\n  .col-sm-7 {\n    width: 58.33333333%;\n  }\n\n  .col-sm-6 {\n    width: 50%;\n  }\n\n  .col-sm-5 {\n    width: 41.66666667%;\n  }\n\n  .col-sm-4 {\n    width: 33.33333333%;\n  }\n\n  .col-sm-3 {\n    width: 25%;\n  }\n\n  .col-sm-2 {\n    width: 16.66666667%;\n  }\n\n  .col-sm-1 {\n    width: 8.33333333%;\n  }\n\n  .col-sm-pull-12 {\n    right: 100%;\n  }\n\n  .col-sm-pull-11 {\n    right: 91.66666667%;\n  }\n\n  .col-sm-pull-10 {\n    right: 83.33333333%;\n  }\n\n  .col-sm-pull-9 {\n    right: 75%;\n  }\n\n  .col-sm-pull-8 {\n    right: 66.66666667%;\n  }\n\n  .col-sm-pull-7 {\n    right: 58.33333333%;\n  }\n\n  .col-sm-pull-6 {\n    right: 50%;\n  }\n\n  .col-sm-pull-5 {\n    right: 41.66666667%;\n  }\n\n  .col-sm-pull-4 {\n    right: 33.33333333%;\n  }\n\n  .col-sm-pull-3 {\n    right: 25%;\n  }\n\n  .col-sm-pull-2 {\n    right: 16.66666667%;\n  }\n\n  .col-sm-pull-1 {\n    right: 8.33333333%;\n  }\n\n  .col-sm-pull-0 {\n    right: auto;\n  }\n\n  .col-sm-push-12 {\n    left: 100%;\n  }\n\n  .col-sm-push-11 {\n    left: 91.66666667%;\n  }\n\n  .col-sm-push-10 {\n    left: 83.33333333%;\n  }\n\n  .col-sm-push-9 {\n    left: 75%;\n  }\n\n  .col-sm-push-8 {\n    left: 66.66666667%;\n  }\n\n  .col-sm-push-7 {\n    left: 58.33333333%;\n  }\n\n  .col-sm-push-6 {\n    left: 50%;\n  }\n\n  .col-sm-push-5 {\n    left: 41.66666667%;\n  }\n\n  .col-sm-push-4 {\n    left: 33.33333333%;\n  }\n\n  .col-sm-push-3 {\n    left: 25%;\n  }\n\n  .col-sm-push-2 {\n    left: 16.66666667%;\n  }\n\n  .col-sm-push-1 {\n    left: 8.33333333%;\n  }\n\n  .col-sm-push-0 {\n    left: auto;\n  }\n\n  .col-sm-offset-12 {\n    margin-left: 100%;\n  }\n\n  .col-sm-offset-11 {\n    margin-left: 91.66666667%;\n  }\n\n  .col-sm-offset-10 {\n    margin-left: 83.33333333%;\n  }\n\n  .col-sm-offset-9 {\n    margin-left: 75%;\n  }\n\n  .col-sm-offset-8 {\n    margin-left: 66.66666667%;\n  }\n\n  .col-sm-offset-7 {\n    margin-left: 58.33333333%;\n  }\n\n  .col-sm-offset-6 {\n    margin-left: 50%;\n  }\n\n  .col-sm-offset-5 {\n    margin-left: 41.66666667%;\n  }\n\n  .col-sm-offset-4 {\n    margin-left: 33.33333333%;\n  }\n\n  .col-sm-offset-3 {\n    margin-left: 25%;\n  }\n\n  .col-sm-offset-2 {\n    margin-left: 16.66666667%;\n  }\n\n  .col-sm-offset-1 {\n    margin-left: 8.33333333%;\n  }\n\n  .col-sm-offset-0 {\n    margin-left: 0%;\n  }\n}\n@media (min-width: 992px) {\n  .col-md-1,\n  .col-md-2,\n  .col-md-3,\n  .col-md-4,\n  .col-md-5,\n  .col-md-6,\n  .col-md-7,\n  .col-md-8,\n  .col-md-9,\n  .col-md-10,\n  .col-md-11,\n  .col-md-12 {\n    float: left;\n  }\n\n  .col-md-12 {\n    width: 100%;\n  }\n\n  .col-md-11 {\n    width: 91.66666667%;\n  }\n\n  .col-md-10 {\n    width: 83.33333333%;\n  }\n\n  .col-md-9 {\n    width: 75%;\n  }\n\n  .col-md-8 {\n    width: 66.66666667%;\n  }\n\n  .col-md-7 {\n    width: 58.33333333%;\n  }\n\n  .col-md-6 {\n    width: 50%;\n  }\n\n  .col-md-5 {\n    width: 41.66666667%;\n  }\n\n  .col-md-4 {\n    width: 33.33333333%;\n  }\n\n  .col-md-3 {\n    width: 25%;\n  }\n\n  .col-md-2 {\n    width: 16.66666667%;\n  }\n\n  .col-md-1 {\n    width: 8.33333333%;\n  }\n\n  .col-md-pull-12 {\n    right: 100%;\n  }\n\n  .col-md-pull-11 {\n    right: 91.66666667%;\n  }\n\n  .col-md-pull-10 {\n    right: 83.33333333%;\n  }\n\n  .col-md-pull-9 {\n    right: 75%;\n  }\n\n  .col-md-pull-8 {\n    right: 66.66666667%;\n  }\n\n  .col-md-pull-7 {\n    right: 58.33333333%;\n  }\n\n  .col-md-pull-6 {\n    right: 50%;\n  }\n\n  .col-md-pull-5 {\n    right: 41.66666667%;\n  }\n\n  .col-md-pull-4 {\n    right: 33.33333333%;\n  }\n\n  .col-md-pull-3 {\n    right: 25%;\n  }\n\n  .col-md-pull-2 {\n    right: 16.66666667%;\n  }\n\n  .col-md-pull-1 {\n    right: 8.33333333%;\n  }\n\n  .col-md-pull-0 {\n    right: auto;\n  }\n\n  .col-md-push-12 {\n    left: 100%;\n  }\n\n  .col-md-push-11 {\n    left: 91.66666667%;\n  }\n\n  .col-md-push-10 {\n    left: 83.33333333%;\n  }\n\n  .col-md-push-9 {\n    left: 75%;\n  }\n\n  .col-md-push-8 {\n    left: 66.66666667%;\n  }\n\n  .col-md-push-7 {\n    left: 58.33333333%;\n  }\n\n  .col-md-push-6 {\n    left: 50%;\n  }\n\n  .col-md-push-5 {\n    left: 41.66666667%;\n  }\n\n  .col-md-push-4 {\n    left: 33.33333333%;\n  }\n\n  .col-md-push-3 {\n    left: 25%;\n  }\n\n  .col-md-push-2 {\n    left: 16.66666667%;\n  }\n\n  .col-md-push-1 {\n    left: 8.33333333%;\n  }\n\n  .col-md-push-0 {\n    left: auto;\n  }\n\n  .col-md-offset-12 {\n    margin-left: 100%;\n  }\n\n  .col-md-offset-11 {\n    margin-left: 91.66666667%;\n  }\n\n  .col-md-offset-10 {\n    margin-left: 83.33333333%;\n  }\n\n  .col-md-offset-9 {\n    margin-left: 75%;\n  }\n\n  .col-md-offset-8 {\n    margin-left: 66.66666667%;\n  }\n\n  .col-md-offset-7 {\n    margin-left: 58.33333333%;\n  }\n\n  .col-md-offset-6 {\n    margin-left: 50%;\n  }\n\n  .col-md-offset-5 {\n    margin-left: 41.66666667%;\n  }\n\n  .col-md-offset-4 {\n    margin-left: 33.33333333%;\n  }\n\n  .col-md-offset-3 {\n    margin-left: 25%;\n  }\n\n  .col-md-offset-2 {\n    margin-left: 16.66666667%;\n  }\n\n  .col-md-offset-1 {\n    margin-left: 8.33333333%;\n  }\n\n  .col-md-offset-0 {\n    margin-left: 0%;\n  }\n}\n@media (min-width: 1200px) {\n  .col-lg-1,\n  .col-lg-2,\n  .col-lg-3,\n  .col-lg-4,\n  .col-lg-5,\n  .col-lg-6,\n  .col-lg-7,\n  .col-lg-8,\n  .col-lg-9,\n  .col-lg-10,\n  .col-lg-11,\n  .col-lg-12 {\n    float: left;\n  }\n\n  .col-lg-12 {\n    width: 100%;\n  }\n\n  .col-lg-11 {\n    width: 91.66666667%;\n  }\n\n  .col-lg-10 {\n    width: 83.33333333%;\n  }\n\n  .col-lg-9 {\n    width: 75%;\n  }\n\n  .col-lg-8 {\n    width: 66.66666667%;\n  }\n\n  .col-lg-7 {\n    width: 58.33333333%;\n  }\n\n  .col-lg-6 {\n    width: 50%;\n  }\n\n  .col-lg-5 {\n    width: 41.66666667%;\n  }\n\n  .col-lg-4 {\n    width: 33.33333333%;\n  }\n\n  .col-lg-3 {\n    width: 25%;\n  }\n\n  .col-lg-2 {\n    width: 16.66666667%;\n  }\n\n  .col-lg-1 {\n    width: 8.33333333%;\n  }\n\n  .col-lg-pull-12 {\n    right: 100%;\n  }\n\n  .col-lg-pull-11 {\n    right: 91.66666667%;\n  }\n\n  .col-lg-pull-10 {\n    right: 83.33333333%;\n  }\n\n  .col-lg-pull-9 {\n    right: 75%;\n  }\n\n  .col-lg-pull-8 {\n    right: 66.66666667%;\n  }\n\n  .col-lg-pull-7 {\n    right: 58.33333333%;\n  }\n\n  .col-lg-pull-6 {\n    right: 50%;\n  }\n\n  .col-lg-pull-5 {\n    right: 41.66666667%;\n  }\n\n  .col-lg-pull-4 {\n    right: 33.33333333%;\n  }\n\n  .col-lg-pull-3 {\n    right: 25%;\n  }\n\n  .col-lg-pull-2 {\n    right: 16.66666667%;\n  }\n\n  .col-lg-pull-1 {\n    right: 8.33333333%;\n  }\n\n  .col-lg-pull-0 {\n    right: auto;\n  }\n\n  .col-lg-push-12 {\n    left: 100%;\n  }\n\n  .col-lg-push-11 {\n    left: 91.66666667%;\n  }\n\n  .col-lg-push-10 {\n    left: 83.33333333%;\n  }\n\n  .col-lg-push-9 {\n    left: 75%;\n  }\n\n  .col-lg-push-8 {\n    left: 66.66666667%;\n  }\n\n  .col-lg-push-7 {\n    left: 58.33333333%;\n  }\n\n  .col-lg-push-6 {\n    left: 50%;\n  }\n\n  .col-lg-push-5 {\n    left: 41.66666667%;\n  }\n\n  .col-lg-push-4 {\n    left: 33.33333333%;\n  }\n\n  .col-lg-push-3 {\n    left: 25%;\n  }\n\n  .col-lg-push-2 {\n    left: 16.66666667%;\n  }\n\n  .col-lg-push-1 {\n    left: 8.33333333%;\n  }\n\n  .col-lg-push-0 {\n    left: auto;\n  }\n\n  .col-lg-offset-12 {\n    margin-left: 100%;\n  }\n\n  .col-lg-offset-11 {\n    margin-left: 91.66666667%;\n  }\n\n  .col-lg-offset-10 {\n    margin-left: 83.33333333%;\n  }\n\n  .col-lg-offset-9 {\n    margin-left: 75%;\n  }\n\n  .col-lg-offset-8 {\n    margin-left: 66.66666667%;\n  }\n\n  .col-lg-offset-7 {\n    margin-left: 58.33333333%;\n  }\n\n  .col-lg-offset-6 {\n    margin-left: 50%;\n  }\n\n  .col-lg-offset-5 {\n    margin-left: 41.66666667%;\n  }\n\n  .col-lg-offset-4 {\n    margin-left: 33.33333333%;\n  }\n\n  .col-lg-offset-3 {\n    margin-left: 25%;\n  }\n\n  .col-lg-offset-2 {\n    margin-left: 16.66666667%;\n  }\n\n  .col-lg-offset-1 {\n    margin-left: 8.33333333%;\n  }\n\n  .col-lg-offset-0 {\n    margin-left: 0%;\n  }\n}\ntable {\n  background-color: transparent;\n}\ntable col[class*=\"col-\"] {\n  position: static;\n  display: table-column;\n  float: none;\n}\ntable td[class*=\"col-\"],\ntable th[class*=\"col-\"] {\n  position: static;\n  display: table-cell;\n  float: none;\n}\ncaption {\n  padding-top: 8px;\n  padding-bottom: 8px;\n  color: #777777;\n  text-align: left;\n}\nth {\n  text-align: left;\n}\n.table {\n  width: 100%;\n  max-width: 100%;\n  margin-bottom: 20px;\n}\n.table > thead > tr > th,\n.table > tbody > tr > th,\n.table > tfoot > tr > th,\n.table > thead > tr > td,\n.table > tbody > tr > td,\n.table > tfoot > tr > td {\n  padding: 8px;\n  line-height: 1.42857143;\n  vertical-align: top;\n  border-top: 1px solid #ddd;\n}\n.table > thead > tr > th {\n  vertical-align: bottom;\n  border-bottom: 2px solid #ddd;\n}\n.table > caption + thead > tr:first-child > th,\n.table > colgroup + thead > tr:first-child > th,\n.table > thead:first-child > tr:first-child > th,\n.table > caption + thead > tr:first-child > td,\n.table > colgroup + thead > tr:first-child > td,\n.table > thead:first-child > tr:first-child > td {\n  border-top: 0;\n}\n.table > tbody + tbody {\n  border-top: 2px solid #ddd;\n}\n.table .table {\n  background-color: #fff;\n}\n.table-condensed > thead > tr > th,\n.table-condensed > tbody > tr > th,\n.table-condensed > tfoot > tr > th,\n.table-condensed > thead > tr > td,\n.table-condensed > tbody > tr > td,\n.table-condensed > tfoot > tr > td {\n  padding: 5px;\n}\n.table-bordered {\n  border: 1px solid #ddd;\n}\n.table-bordered > thead > tr > th,\n.table-bordered > tbody > tr > th,\n.table-bordered > tfoot > tr > th,\n.table-bordered > thead > tr > td,\n.table-bordered > tbody > tr > td,\n.table-bordered > tfoot > tr > td {\n  border: 1px solid #ddd;\n}\n.table-bordered > thead > tr > th,\n.table-bordered > thead > tr > td {\n  border-bottom-width: 2px;\n}\n.table-striped > tbody > tr:nth-of-type(odd) {\n  background-color: #f9f9f9;\n}\n.table-hover > tbody > tr:hover {\n  background-color: #f5f5f5;\n}\n.table > thead > tr > td.active,\n.table > tbody > tr > td.active,\n.table > tfoot > tr > td.active,\n.table > thead > tr > th.active,\n.table > tbody > tr > th.active,\n.table > tfoot > tr > th.active,\n.table > thead > tr.active > td,\n.table > tbody > tr.active > td,\n.table > tfoot > tr.active > td,\n.table > thead > tr.active > th,\n.table > tbody > tr.active > th,\n.table > tfoot > tr.active > th {\n  background-color: #f5f5f5;\n}\n.table-hover > tbody > tr > td.active:hover,\n.table-hover > tbody > tr > th.active:hover,\n.table-hover > tbody > tr.active:hover > td,\n.table-hover > tbody > tr:hover > .active,\n.table-hover > tbody > tr.active:hover > th {\n  background-color: #e8e8e8;\n}\n.table > thead > tr > td.success,\n.table > tbody > tr > td.success,\n.table > tfoot > tr > td.success,\n.table > thead > tr > th.success,\n.table > tbody > tr > th.success,\n.table > tfoot > tr > th.success,\n.table > thead > tr.success > td,\n.table > tbody > tr.success > td,\n.table > tfoot > tr.success > td,\n.table > thead > tr.success > th,\n.table > tbody > tr.success > th,\n.table > tfoot > tr.success > th {\n  background-color: #dff0d8;\n}\n.table-hover > tbody > tr > td.success:hover,\n.table-hover > tbody > tr > th.success:hover,\n.table-hover > tbody > tr.success:hover > td,\n.table-hover > tbody > tr:hover > .success,\n.table-hover > tbody > tr.success:hover > th {\n  background-color: #d0e9c6;\n}\n.table > thead > tr > td.info,\n.table > tbody > tr > td.info,\n.table > tfoot > tr > td.info,\n.table > thead > tr > th.info,\n.table > tbody > tr > th.info,\n.table > tfoot > tr > th.info,\n.table > thead > tr.info > td,\n.table > tbody > tr.info > td,\n.table > tfoot > tr.info > td,\n.table > thead > tr.info > th,\n.table > tbody > tr.info > th,\n.table > tfoot > tr.info > th {\n  background-color: #d9edf7;\n}\n.table-hover > tbody > tr > td.info:hover,\n.table-hover > tbody > tr > th.info:hover,\n.table-hover > tbody > tr.info:hover > td,\n.table-hover > tbody > tr:hover > .info,\n.table-hover > tbody > tr.info:hover > th {\n  background-color: #c4e3f3;\n}\n.table > thead > tr > td.warning,\n.table > tbody > tr > td.warning,\n.table > tfoot > tr > td.warning,\n.table > thead > tr > th.warning,\n.table > tbody > tr > th.warning,\n.table > tfoot > tr > th.warning,\n.table > thead > tr.warning > td,\n.table > tbody > tr.warning > td,\n.table > tfoot > tr.warning > td,\n.table > thead > tr.warning > th,\n.table > tbody > tr.warning > th,\n.table > tfoot > tr.warning > th {\n  background-color: #fcf8e3;\n}\n.table-hover > tbody > tr > td.warning:hover,\n.table-hover > tbody > tr > th.warning:hover,\n.table-hover > tbody > tr.warning:hover > td,\n.table-hover > tbody > tr:hover > .warning,\n.table-hover > tbody > tr.warning:hover > th {\n  background-color: #faf2cc;\n}\n.table > thead > tr > td.danger,\n.table > tbody > tr > td.danger,\n.table > tfoot > tr > td.danger,\n.table > thead > tr > th.danger,\n.table > tbody > tr > th.danger,\n.table > tfoot > tr > th.danger,\n.table > thead > tr.danger > td,\n.table > tbody > tr.danger > td,\n.table > tfoot > tr.danger > td,\n.table > thead > tr.danger > th,\n.table > tbody > tr.danger > th,\n.table > tfoot > tr.danger > th {\n  background-color: #f2dede;\n}\n.table-hover > tbody > tr > td.danger:hover,\n.table-hover > tbody > tr > th.danger:hover,\n.table-hover > tbody > tr.danger:hover > td,\n.table-hover > tbody > tr:hover > .danger,\n.table-hover > tbody > tr.danger:hover > th {\n  background-color: #ebcccc;\n}\n.table-responsive {\n  min-height: 0.01%;\n  overflow-x: auto;\n}\n@media screen and (max-width: 767px) {\n  .table-responsive {\n    width: 100%;\n    margin-bottom: 15px;\n    overflow-y: hidden;\n    -ms-overflow-style: -ms-autohiding-scrollbar;\n    border: 1px solid #ddd;\n  }\n\n  .table-responsive > .table {\n    margin-bottom: 0;\n  }\n\n  .table-responsive > .table > thead > tr > th,\n  .table-responsive > .table > tbody > tr > th,\n  .table-responsive > .table > tfoot > tr > th,\n  .table-responsive > .table > thead > tr > td,\n  .table-responsive > .table > tbody > tr > td,\n  .table-responsive > .table > tfoot > tr > td {\n    white-space: nowrap;\n  }\n\n  .table-responsive > .table-bordered {\n    border: 0;\n  }\n\n  .table-responsive > .table-bordered > thead > tr > th:first-child,\n  .table-responsive > .table-bordered > tbody > tr > th:first-child,\n  .table-responsive > .table-bordered > tfoot > tr > th:first-child,\n  .table-responsive > .table-bordered > thead > tr > td:first-child,\n  .table-responsive > .table-bordered > tbody > tr > td:first-child,\n  .table-responsive > .table-bordered > tfoot > tr > td:first-child {\n    border-left: 0;\n  }\n\n  .table-responsive > .table-bordered > thead > tr > th:last-child,\n  .table-responsive > .table-bordered > tbody > tr > th:last-child,\n  .table-responsive > .table-bordered > tfoot > tr > th:last-child,\n  .table-responsive > .table-bordered > thead > tr > td:last-child,\n  .table-responsive > .table-bordered > tbody > tr > td:last-child,\n  .table-responsive > .table-bordered > tfoot > tr > td:last-child {\n    border-right: 0;\n  }\n\n  .table-responsive > .table-bordered > tbody > tr:last-child > th,\n  .table-responsive > .table-bordered > tfoot > tr:last-child > th,\n  .table-responsive > .table-bordered > tbody > tr:last-child > td,\n  .table-responsive > .table-bordered > tfoot > tr:last-child > td {\n    border-bottom: 0;\n  }\n}\nfieldset {\n  min-width: 0;\n  padding: 0;\n  margin: 0;\n  border: 0;\n}\nlegend {\n  display: block;\n  width: 100%;\n  padding: 0;\n  margin-bottom: 20px;\n  font-size: 21px;\n  line-height: inherit;\n  color: #333333;\n  border: 0;\n  border-bottom: 1px solid #e5e5e5;\n}\nlabel {\n  display: inline-block;\n  max-width: 100%;\n  margin-bottom: 5px;\n  font-weight: 700;\n}\ninput[type=\"search\"] {\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n  -webkit-appearance: none;\n  -moz-appearance: none;\n  appearance: none;\n}\ninput[type=\"radio\"],\ninput[type=\"checkbox\"] {\n  margin: 4px 0 0;\n  margin-top: 1px \\9;\n  line-height: normal;\n}\ninput[type=\"radio\"][disabled],\ninput[type=\"checkbox\"][disabled],\ninput[type=\"radio\"].disabled,\ninput[type=\"checkbox\"].disabled,\nfieldset[disabled] input[type=\"radio\"],\nfieldset[disabled] input[type=\"checkbox\"] {\n  cursor: not-allowed;\n}\ninput[type=\"file\"] {\n  display: block;\n}\ninput[type=\"range\"] {\n  display: block;\n  width: 100%;\n}\nselect[multiple],\nselect[size] {\n  height: auto;\n}\ninput[type=\"file\"]:focus,\ninput[type=\"radio\"]:focus,\ninput[type=\"checkbox\"]:focus {\n  outline: 5px auto -webkit-focus-ring-color;\n  outline-offset: -2px;\n}\noutput {\n  display: block;\n  padding-top: 7px;\n  font-size: 14px;\n  line-height: 1.42857143;\n  color: #555555;\n}\n.form-control {\n  display: block;\n  width: 100%;\n  height: 34px;\n  padding: 6px 12px;\n  font-size: 14px;\n  line-height: 1.42857143;\n  color: #555555;\n  background-color: #fff;\n  background-image: none;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n  -webkit-transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s;\n  -o-transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s;\n  -webkit-transition: border-color ease-in-out .15s, -webkit-box-shadow ease-in-out .15s;\n  transition: border-color ease-in-out .15s, -webkit-box-shadow ease-in-out .15s;\n  transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s;\n  transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s, -webkit-box-shadow ease-in-out .15s;\n}\n.form-control:focus {\n  border-color: #66afe9;\n  outline: 0;\n  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 8px rgba(102, 175, 233, 0.6);\n  box-shadow: inset 0 1px 1px rgba(0, 0, 0, .075), 0 0 8px rgba(102, 175, 233, 0.6);\n}\n.form-control::-moz-placeholder {\n  color: #999;\n  opacity: 1;\n}\n.form-control:-ms-input-placeholder {\n  color: #999;\n}\n.form-control::-webkit-input-placeholder {\n  color: #999;\n}\n.form-control::-ms-expand {\n  background-color: transparent;\n  border: 0;\n}\n.form-control[disabled],\n.form-control[readonly],\nfieldset[disabled] .form-control {\n  background-color: #eeeeee;\n  opacity: 1;\n}\n.form-control[disabled],\nfieldset[disabled] .form-control {\n  cursor: not-allowed;\n}\ntextarea.form-control {\n  height: auto;\n}\n@media screen and (-webkit-min-device-pixel-ratio: 0) {\n  input[type=\"date\"].form-control,\n  input[type=\"time\"].form-control,\n  input[type=\"datetime-local\"].form-control,\n  input[type=\"month\"].form-control {\n    line-height: 34px;\n  }\n\n  input[type=\"date\"].input-sm,\n  input[type=\"time\"].input-sm,\n  input[type=\"datetime-local\"].input-sm,\n  input[type=\"month\"].input-sm,\n  .input-group-sm input[type=\"date\"],\n  .input-group-sm input[type=\"time\"],\n  .input-group-sm input[type=\"datetime-local\"],\n  .input-group-sm input[type=\"month\"] {\n    line-height: 30px;\n  }\n\n  input[type=\"date\"].input-lg,\n  input[type=\"time\"].input-lg,\n  input[type=\"datetime-local\"].input-lg,\n  input[type=\"month\"].input-lg,\n  .input-group-lg input[type=\"date\"],\n  .input-group-lg input[type=\"time\"],\n  .input-group-lg input[type=\"datetime-local\"],\n  .input-group-lg input[type=\"month\"] {\n    line-height: 46px;\n  }\n}\n.form-group {\n  margin-bottom: 15px;\n}\n.radio,\n.checkbox {\n  position: relative;\n  display: block;\n  margin-top: 10px;\n  margin-bottom: 10px;\n}\n.radio.disabled label,\n.checkbox.disabled label,\nfieldset[disabled] .radio label,\nfieldset[disabled] .checkbox label {\n  cursor: not-allowed;\n}\n.radio label,\n.checkbox label {\n  min-height: 20px;\n  padding-left: 20px;\n  margin-bottom: 0;\n  font-weight: 400;\n  cursor: pointer;\n}\n.radio input[type=\"radio\"],\n.radio-inline input[type=\"radio\"],\n.checkbox input[type=\"checkbox\"],\n.checkbox-inline input[type=\"checkbox\"] {\n  position: absolute;\n  margin-top: 4px \\9;\n  margin-left: -20px;\n}\n.radio + .radio,\n.checkbox + .checkbox {\n  margin-top: -5px;\n}\n.radio-inline,\n.checkbox-inline {\n  position: relative;\n  display: inline-block;\n  padding-left: 20px;\n  margin-bottom: 0;\n  font-weight: 400;\n  vertical-align: middle;\n  cursor: pointer;\n}\n.radio-inline.disabled,\n.checkbox-inline.disabled,\nfieldset[disabled] .radio-inline,\nfieldset[disabled] .checkbox-inline {\n  cursor: not-allowed;\n}\n.radio-inline + .radio-inline,\n.checkbox-inline + .checkbox-inline {\n  margin-top: 0;\n  margin-left: 10px;\n}\n.form-control-static {\n  min-height: 34px;\n  padding-top: 7px;\n  padding-bottom: 7px;\n  margin-bottom: 0;\n}\n.form-control-static.input-lg,\n.form-control-static.input-sm {\n  padding-right: 0;\n  padding-left: 0;\n}\n.input-sm {\n  height: 30px;\n  padding: 5px 10px;\n  font-size: 12px;\n  line-height: 1.5;\n  border-radius: 3px;\n}\nselect.input-sm {\n  height: 30px;\n  line-height: 30px;\n}\ntextarea.input-sm,\nselect[multiple].input-sm {\n  height: auto;\n}\n.form-group-sm .form-control {\n  height: 30px;\n  padding: 5px 10px;\n  font-size: 12px;\n  line-height: 1.5;\n  border-radius: 3px;\n}\n.form-group-sm select.form-control {\n  height: 30px;\n  line-height: 30px;\n}\n.form-group-sm textarea.form-control,\n.form-group-sm select[multiple].form-control {\n  height: auto;\n}\n.form-group-sm .form-control-static {\n  height: 30px;\n  min-height: 32px;\n  padding: 6px 10px;\n  font-size: 12px;\n  line-height: 1.5;\n}\n.input-lg {\n  height: 46px;\n  padding: 10px 16px;\n  font-size: 18px;\n  line-height: 1.3333333;\n  border-radius: 6px;\n}\nselect.input-lg {\n  height: 46px;\n  line-height: 46px;\n}\ntextarea.input-lg,\nselect[multiple].input-lg {\n  height: auto;\n}\n.form-group-lg .form-control {\n  height: 46px;\n  padding: 10px 16px;\n  font-size: 18px;\n  line-height: 1.3333333;\n  border-radius: 6px;\n}\n.form-group-lg select.form-control {\n  height: 46px;\n  line-height: 46px;\n}\n.form-group-lg textarea.form-control,\n.form-group-lg select[multiple].form-control {\n  height: auto;\n}\n.form-group-lg .form-control-static {\n  height: 46px;\n  min-height: 38px;\n  padding: 11px 16px;\n  font-size: 18px;\n  line-height: 1.3333333;\n}\n.has-feedback {\n  position: relative;\n}\n.has-feedback .form-control {\n  padding-right: 42.5px;\n}\n.form-control-feedback {\n  position: absolute;\n  top: 0;\n  right: 0;\n  z-index: 2;\n  display: block;\n  width: 34px;\n  height: 34px;\n  line-height: 34px;\n  text-align: center;\n  pointer-events: none;\n}\n.input-lg + .form-control-feedback,\n.input-group-lg + .form-control-feedback,\n.form-group-lg .form-control + .form-control-feedback {\n  width: 46px;\n  height: 46px;\n  line-height: 46px;\n}\n.input-sm + .form-control-feedback,\n.input-group-sm + .form-control-feedback,\n.form-group-sm .form-control + .form-control-feedback {\n  width: 30px;\n  height: 30px;\n  line-height: 30px;\n}\n.has-success .help-block,\n.has-success .control-label,\n.has-success .radio,\n.has-success .checkbox,\n.has-success .radio-inline,\n.has-success .checkbox-inline,\n.has-success.radio label,\n.has-success.checkbox label,\n.has-success.radio-inline label,\n.has-success.checkbox-inline label {\n  color: #3c763d;\n}\n.has-success .form-control {\n  border-color: #3c763d;\n  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n}\n.has-success .form-control:focus {\n  border-color: #2b542c;\n  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 6px #67b168;\n  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 6px #67b168;\n}\n.has-success .input-group-addon {\n  color: #3c763d;\n  background-color: #dff0d8;\n  border-color: #3c763d;\n}\n.has-success .form-control-feedback {\n  color: #3c763d;\n}\n.has-warning .help-block,\n.has-warning .control-label,\n.has-warning .radio,\n.has-warning .checkbox,\n.has-warning .radio-inline,\n.has-warning .checkbox-inline,\n.has-warning.radio label,\n.has-warning.checkbox label,\n.has-warning.radio-inline label,\n.has-warning.checkbox-inline label {\n  color: #8a6d3b;\n}\n.has-warning .form-control {\n  border-color: #8a6d3b;\n  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n}\n.has-warning .form-control:focus {\n  border-color: #66512c;\n  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 6px #c0a16b;\n  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 6px #c0a16b;\n}\n.has-warning .input-group-addon {\n  color: #8a6d3b;\n  background-color: #fcf8e3;\n  border-color: #8a6d3b;\n}\n.has-warning .form-control-feedback {\n  color: #8a6d3b;\n}\n.has-error .help-block,\n.has-error .control-label,\n.has-error .radio,\n.has-error .checkbox,\n.has-error .radio-inline,\n.has-error .checkbox-inline,\n.has-error.radio label,\n.has-error.checkbox label,\n.has-error.radio-inline label,\n.has-error.checkbox-inline label {\n  color: #a94442;\n}\n.has-error .form-control {\n  border-color: #a94442;\n  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n}\n.has-error .form-control:focus {\n  border-color: #843534;\n  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 6px #ce8483;\n  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 6px #ce8483;\n}\n.has-error .input-group-addon {\n  color: #a94442;\n  background-color: #f2dede;\n  border-color: #a94442;\n}\n.has-error .form-control-feedback {\n  color: #a94442;\n}\n.has-feedback label ~ .form-control-feedback {\n  top: 25px;\n}\n.has-feedback label.sr-only ~ .form-control-feedback {\n  top: 0;\n}\n.help-block {\n  display: block;\n  margin-top: 5px;\n  margin-bottom: 10px;\n  color: #737373;\n}\n@media (min-width: 768px) {\n  .form-inline .form-group {\n    display: inline-block;\n    margin-bottom: 0;\n    vertical-align: middle;\n  }\n\n  .form-inline .form-control {\n    display: inline-block;\n    width: auto;\n    vertical-align: middle;\n  }\n\n  .form-inline .form-control-static {\n    display: inline-block;\n  }\n\n  .form-inline .input-group {\n    display: inline-table;\n    vertical-align: middle;\n  }\n\n  .form-inline .input-group .input-group-addon,\n  .form-inline .input-group .input-group-btn,\n  .form-inline .input-group .form-control {\n    width: auto;\n  }\n\n  .form-inline .input-group > .form-control {\n    width: 100%;\n  }\n\n  .form-inline .control-label {\n    margin-bottom: 0;\n    vertical-align: middle;\n  }\n\n  .form-inline .radio,\n  .form-inline .checkbox {\n    display: inline-block;\n    margin-top: 0;\n    margin-bottom: 0;\n    vertical-align: middle;\n  }\n\n  .form-inline .radio label,\n  .form-inline .checkbox label {\n    padding-left: 0;\n  }\n\n  .form-inline .radio input[type=\"radio\"],\n  .form-inline .checkbox input[type=\"checkbox\"] {\n    position: relative;\n    margin-left: 0;\n  }\n\n  .form-inline .has-feedback .form-control-feedback {\n    top: 0;\n  }\n}\n.form-horizontal .radio,\n.form-horizontal .checkbox,\n.form-horizontal .radio-inline,\n.form-horizontal .checkbox-inline {\n  padding-top: 7px;\n  margin-top: 0;\n  margin-bottom: 0;\n}\n.form-horizontal .radio,\n.form-horizontal .checkbox {\n  min-height: 27px;\n}\n.form-horizontal .form-group {\n  margin-right: -15px;\n  margin-left: -15px;\n}\n@media (min-width: 768px) {\n  .form-horizontal .control-label {\n    padding-top: 7px;\n    margin-bottom: 0;\n    text-align: right;\n  }\n}\n.form-horizontal .has-feedback .form-control-feedback {\n  right: 15px;\n}\n@media (min-width: 768px) {\n  .form-horizontal .form-group-lg .control-label {\n    padding-top: 11px;\n    font-size: 18px;\n  }\n}\n@media (min-width: 768px) {\n  .form-horizontal .form-group-sm .control-label {\n    padding-top: 6px;\n    font-size: 12px;\n  }\n}\n.btn {\n  display: inline-block;\n  margin-bottom: 0;\n  font-weight: normal;\n  text-align: center;\n  white-space: nowrap;\n  vertical-align: middle;\n  -ms-touch-action: manipulation;\n  touch-action: manipulation;\n  cursor: pointer;\n  background-image: none;\n  border: 1px solid transparent;\n  padding: 6px 12px;\n  font-size: 14px;\n  line-height: 1.42857143;\n  border-radius: 4px;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n.btn:focus,\n.btn:active:focus,\n.btn.active:focus,\n.btn.focus,\n.btn:active.focus,\n.btn.active.focus {\n  outline: 5px auto -webkit-focus-ring-color;\n  outline-offset: -2px;\n}\n.btn:hover,\n.btn:focus,\n.btn.focus {\n  color: #333;\n  text-decoration: none;\n}\n.btn:active,\n.btn.active {\n  background-image: none;\n  outline: 0;\n  -webkit-box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);\n  box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);\n}\n.btn.disabled,\n.btn[disabled],\nfieldset[disabled] .btn {\n  cursor: not-allowed;\n  filter: alpha(opacity=65);\n  opacity: 0.65;\n  -webkit-box-shadow: none;\n  box-shadow: none;\n}\na.btn.disabled,\nfieldset[disabled] a.btn {\n  pointer-events: none;\n}\n.btn-default {\n  color: #333;\n  background-color: #fff;\n  border-color: #ccc;\n}\n.btn-default:focus,\n.btn-default.focus {\n  color: #333;\n  background-color: #e6e6e6;\n  border-color: #8c8c8c;\n}\n.btn-default:hover {\n  color: #333;\n  background-color: #e6e6e6;\n  border-color: #adadad;\n}\n.btn-default:active,\n.btn-default.active,\n.open > .dropdown-toggle.btn-default {\n  color: #333;\n  background-color: #e6e6e6;\n  background-image: none;\n  border-color: #adadad;\n}\n.btn-default:active:hover,\n.btn-default.active:hover,\n.open > .dropdown-toggle.btn-default:hover,\n.btn-default:active:focus,\n.btn-default.active:focus,\n.open > .dropdown-toggle.btn-default:focus,\n.btn-default:active.focus,\n.btn-default.active.focus,\n.open > .dropdown-toggle.btn-default.focus {\n  color: #333;\n  background-color: #d4d4d4;\n  border-color: #8c8c8c;\n}\n.btn-default.disabled:hover,\n.btn-default[disabled]:hover,\nfieldset[disabled] .btn-default:hover,\n.btn-default.disabled:focus,\n.btn-default[disabled]:focus,\nfieldset[disabled] .btn-default:focus,\n.btn-default.disabled.focus,\n.btn-default[disabled].focus,\nfieldset[disabled] .btn-default.focus {\n  background-color: #fff;\n  border-color: #ccc;\n}\n.btn-default .badge {\n  color: #fff;\n  background-color: #333;\n}\n.btn-primary {\n  color: #fff;\n  background-color: #337ab7;\n  border-color: #2e6da4;\n}\n.btn-primary:focus,\n.btn-primary.focus {\n  color: #fff;\n  background-color: #286090;\n  border-color: #122b40;\n}\n.btn-primary:hover {\n  color: #fff;\n  background-color: #286090;\n  border-color: #204d74;\n}\n.btn-primary:active,\n.btn-primary.active,\n.open > .dropdown-toggle.btn-primary {\n  color: #fff;\n  background-color: #286090;\n  background-image: none;\n  border-color: #204d74;\n}\n.btn-primary:active:hover,\n.btn-primary.active:hover,\n.open > .dropdown-toggle.btn-primary:hover,\n.btn-primary:active:focus,\n.btn-primary.active:focus,\n.open > .dropdown-toggle.btn-primary:focus,\n.btn-primary:active.focus,\n.btn-primary.active.focus,\n.open > .dropdown-toggle.btn-primary.focus {\n  color: #fff;\n  background-color: #204d74;\n  border-color: #122b40;\n}\n.btn-primary.disabled:hover,\n.btn-primary[disabled]:hover,\nfieldset[disabled] .btn-primary:hover,\n.btn-primary.disabled:focus,\n.btn-primary[disabled]:focus,\nfieldset[disabled] .btn-primary:focus,\n.btn-primary.disabled.focus,\n.btn-primary[disabled].focus,\nfieldset[disabled] .btn-primary.focus {\n  background-color: #337ab7;\n  border-color: #2e6da4;\n}\n.btn-primary .badge {\n  color: #337ab7;\n  background-color: #fff;\n}\n.btn-success {\n  color: #fff;\n  background-color: #5cb85c;\n  border-color: #4cae4c;\n}\n.btn-success:focus,\n.btn-success.focus {\n  color: #fff;\n  background-color: #449d44;\n  border-color: #255625;\n}\n.btn-success:hover {\n  color: #fff;\n  background-color: #449d44;\n  border-color: #398439;\n}\n.btn-success:active,\n.btn-success.active,\n.open > .dropdown-toggle.btn-success {\n  color: #fff;\n  background-color: #449d44;\n  background-image: none;\n  border-color: #398439;\n}\n.btn-success:active:hover,\n.btn-success.active:hover,\n.open > .dropdown-toggle.btn-success:hover,\n.btn-success:active:focus,\n.btn-success.active:focus,\n.open > .dropdown-toggle.btn-success:focus,\n.btn-success:active.focus,\n.btn-success.active.focus,\n.open > .dropdown-toggle.btn-success.focus {\n  color: #fff;\n  background-color: #398439;\n  border-color: #255625;\n}\n.btn-success.disabled:hover,\n.btn-success[disabled]:hover,\nfieldset[disabled] .btn-success:hover,\n.btn-success.disabled:focus,\n.btn-success[disabled]:focus,\nfieldset[disabled] .btn-success:focus,\n.btn-success.disabled.focus,\n.btn-success[disabled].focus,\nfieldset[disabled] .btn-success.focus {\n  background-color: #5cb85c;\n  border-color: #4cae4c;\n}\n.btn-success .badge {\n  color: #5cb85c;\n  background-color: #fff;\n}\n.btn-info {\n  color: #fff;\n  background-color: #5bc0de;\n  border-color: #46b8da;\n}\n.btn-info:focus,\n.btn-info.focus {\n  color: #fff;\n  background-color: #31b0d5;\n  border-color: #1b6d85;\n}\n.btn-info:hover {\n  color: #fff;\n  background-color: #31b0d5;\n  border-color: #269abc;\n}\n.btn-info:active,\n.btn-info.active,\n.open > .dropdown-toggle.btn-info {\n  color: #fff;\n  background-color: #31b0d5;\n  background-image: none;\n  border-color: #269abc;\n}\n.btn-info:active:hover,\n.btn-info.active:hover,\n.open > .dropdown-toggle.btn-info:hover,\n.btn-info:active:focus,\n.btn-info.active:focus,\n.open > .dropdown-toggle.btn-info:focus,\n.btn-info:active.focus,\n.btn-info.active.focus,\n.open > .dropdown-toggle.btn-info.focus {\n  color: #fff;\n  background-color: #269abc;\n  border-color: #1b6d85;\n}\n.btn-info.disabled:hover,\n.btn-info[disabled]:hover,\nfieldset[disabled] .btn-info:hover,\n.btn-info.disabled:focus,\n.btn-info[disabled]:focus,\nfieldset[disabled] .btn-info:focus,\n.btn-info.disabled.focus,\n.btn-info[disabled].focus,\nfieldset[disabled] .btn-info.focus {\n  background-color: #5bc0de;\n  border-color: #46b8da;\n}\n.btn-info .badge {\n  color: #5bc0de;\n  background-color: #fff;\n}\n.btn-warning {\n  color: #fff;\n  background-color: #f0ad4e;\n  border-color: #eea236;\n}\n.btn-warning:focus,\n.btn-warning.focus {\n  color: #fff;\n  background-color: #ec971f;\n  border-color: #985f0d;\n}\n.btn-warning:hover {\n  color: #fff;\n  background-color: #ec971f;\n  border-color: #d58512;\n}\n.btn-warning:active,\n.btn-warning.active,\n.open > .dropdown-toggle.btn-warning {\n  color: #fff;\n  background-color: #ec971f;\n  background-image: none;\n  border-color: #d58512;\n}\n.btn-warning:active:hover,\n.btn-warning.active:hover,\n.open > .dropdown-toggle.btn-warning:hover,\n.btn-warning:active:focus,\n.btn-warning.active:focus,\n.open > .dropdown-toggle.btn-warning:focus,\n.btn-warning:active.focus,\n.btn-warning.active.focus,\n.open > .dropdown-toggle.btn-warning.focus {\n  color: #fff;\n  background-color: #d58512;\n  border-color: #985f0d;\n}\n.btn-warning.disabled:hover,\n.btn-warning[disabled]:hover,\nfieldset[disabled] .btn-warning:hover,\n.btn-warning.disabled:focus,\n.btn-warning[disabled]:focus,\nfieldset[disabled] .btn-warning:focus,\n.btn-warning.disabled.focus,\n.btn-warning[disabled].focus,\nfieldset[disabled] .btn-warning.focus {\n  background-color: #f0ad4e;\n  border-color: #eea236;\n}\n.btn-warning .badge {\n  color: #f0ad4e;\n  background-color: #fff;\n}\n.btn-danger {\n  color: #fff;\n  background-color: #d9534f;\n  border-color: #d43f3a;\n}\n.btn-danger:focus,\n.btn-danger.focus {\n  color: #fff;\n  background-color: #c9302c;\n  border-color: #761c19;\n}\n.btn-danger:hover {\n  color: #fff;\n  background-color: #c9302c;\n  border-color: #ac2925;\n}\n.btn-danger:active,\n.btn-danger.active,\n.open > .dropdown-toggle.btn-danger {\n  color: #fff;\n  background-color: #c9302c;\n  background-image: none;\n  border-color: #ac2925;\n}\n.btn-danger:active:hover,\n.btn-danger.active:hover,\n.open > .dropdown-toggle.btn-danger:hover,\n.btn-danger:active:focus,\n.btn-danger.active:focus,\n.open > .dropdown-toggle.btn-danger:focus,\n.btn-danger:active.focus,\n.btn-danger.active.focus,\n.open > .dropdown-toggle.btn-danger.focus {\n  color: #fff;\n  background-color: #ac2925;\n  border-color: #761c19;\n}\n.btn-danger.disabled:hover,\n.btn-danger[disabled]:hover,\nfieldset[disabled] .btn-danger:hover,\n.btn-danger.disabled:focus,\n.btn-danger[disabled]:focus,\nfieldset[disabled] .btn-danger:focus,\n.btn-danger.disabled.focus,\n.btn-danger[disabled].focus,\nfieldset[disabled] .btn-danger.focus {\n  background-color: #d9534f;\n  border-color: #d43f3a;\n}\n.btn-danger .badge {\n  color: #d9534f;\n  background-color: #fff;\n}\n.btn-link {\n  font-weight: 400;\n  color: #337ab7;\n  border-radius: 0;\n}\n.btn-link,\n.btn-link:active,\n.btn-link.active,\n.btn-link[disabled],\nfieldset[disabled] .btn-link {\n  background-color: transparent;\n  -webkit-box-shadow: none;\n  box-shadow: none;\n}\n.btn-link,\n.btn-link:hover,\n.btn-link:focus,\n.btn-link:active {\n  border-color: transparent;\n}\n.btn-link:hover,\n.btn-link:focus {\n  color: #23527c;\n  text-decoration: underline;\n  background-color: transparent;\n}\n.btn-link[disabled]:hover,\nfieldset[disabled] .btn-link:hover,\n.btn-link[disabled]:focus,\nfieldset[disabled] .btn-link:focus {\n  color: #777777;\n  text-decoration: none;\n}\n.btn-lg,\n.btn-group-lg > .btn {\n  padding: 10px 16px;\n  font-size: 18px;\n  line-height: 1.3333333;\n  border-radius: 6px;\n}\n.btn-sm,\n.btn-group-sm > .btn {\n  padding: 5px 10px;\n  font-size: 12px;\n  line-height: 1.5;\n  border-radius: 3px;\n}\n.btn-xs,\n.btn-group-xs > .btn {\n  padding: 1px 5px;\n  font-size: 12px;\n  line-height: 1.5;\n  border-radius: 3px;\n}\n.btn-block {\n  display: block;\n  width: 100%;\n}\n.btn-block + .btn-block {\n  margin-top: 5px;\n}\ninput[type=\"submit\"].btn-block,\ninput[type=\"reset\"].btn-block,\ninput[type=\"button\"].btn-block {\n  width: 100%;\n}\n.fade {\n  opacity: 0;\n  -webkit-transition: opacity 0.15s linear;\n  -o-transition: opacity 0.15s linear;\n  transition: opacity 0.15s linear;\n}\n.fade.in {\n  opacity: 1;\n}\n.collapse {\n  display: none;\n}\n.collapse.in {\n  display: block;\n}\ntr.collapse.in {\n  display: table-row;\n}\ntbody.collapse.in {\n  display: table-row-group;\n}\n.collapsing {\n  position: relative;\n  height: 0;\n  overflow: hidden;\n  -webkit-transition-property: height, visibility;\n  -o-transition-property: height, visibility;\n  transition-property: height, visibility;\n  -webkit-transition-duration: 0.35s;\n  -o-transition-duration: 0.35s;\n  transition-duration: 0.35s;\n  -webkit-transition-timing-function: ease;\n  -o-transition-timing-function: ease;\n  transition-timing-function: ease;\n}\n.caret {\n  display: inline-block;\n  width: 0;\n  height: 0;\n  margin-left: 2px;\n  vertical-align: middle;\n  border-top: 4px dashed;\n  border-top: 4px solid \\9;\n  border-right: 4px solid transparent;\n  border-left: 4px solid transparent;\n}\n.dropup,\n.dropdown {\n  position: relative;\n}\n.dropdown-toggle:focus {\n  outline: 0;\n}\n.dropdown-menu {\n  position: absolute;\n  top: 100%;\n  left: 0;\n  z-index: 1000;\n  display: none;\n  float: left;\n  min-width: 160px;\n  padding: 5px 0;\n  margin: 2px 0 0;\n  font-size: 14px;\n  text-align: left;\n  list-style: none;\n  background-color: #fff;\n  background-clip: padding-box;\n  border: 1px solid #ccc;\n  border: 1px solid rgba(0, 0, 0, 0.15);\n  border-radius: 4px;\n  -webkit-box-shadow: 0 6px 12px rgba(0, 0, 0, 0.175);\n  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.175);\n}\n.dropdown-menu.pull-right {\n  right: 0;\n  left: auto;\n}\n.dropdown-menu .divider {\n  height: 1px;\n  margin: 9px 0;\n  overflow: hidden;\n  background-color: #e5e5e5;\n}\n.dropdown-menu > li > a {\n  display: block;\n  padding: 3px 20px;\n  clear: both;\n  font-weight: 400;\n  line-height: 1.42857143;\n  color: #333333;\n  white-space: nowrap;\n}\n.dropdown-menu > li > a:hover,\n.dropdown-menu > li > a:focus {\n  color: #262626;\n  text-decoration: none;\n  background-color: #f5f5f5;\n}\n.dropdown-menu > .active > a,\n.dropdown-menu > .active > a:hover,\n.dropdown-menu > .active > a:focus {\n  color: #fff;\n  text-decoration: none;\n  background-color: #337ab7;\n  outline: 0;\n}\n.dropdown-menu > .disabled > a,\n.dropdown-menu > .disabled > a:hover,\n.dropdown-menu > .disabled > a:focus {\n  color: #777777;\n}\n.dropdown-menu > .disabled > a:hover,\n.dropdown-menu > .disabled > a:focus {\n  text-decoration: none;\n  cursor: not-allowed;\n  background-color: transparent;\n  background-image: none;\n  filter: progid:DXImageTransform.Microsoft.gradient(enabled = false);\n}\n.open > .dropdown-menu {\n  display: block;\n}\n.open > a {\n  outline: 0;\n}\n.dropdown-menu-right {\n  right: 0;\n  left: auto;\n}\n.dropdown-menu-left {\n  right: auto;\n  left: 0;\n}\n.dropdown-header {\n  display: block;\n  padding: 3px 20px;\n  font-size: 12px;\n  line-height: 1.42857143;\n  color: #777777;\n  white-space: nowrap;\n}\n.dropdown-backdrop {\n  position: fixed;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  z-index: 990;\n}\n.pull-right > .dropdown-menu {\n  right: 0;\n  left: auto;\n}\n.dropup .caret,\n.navbar-fixed-bottom .dropdown .caret {\n  content: \"\";\n  border-top: 0;\n  border-bottom: 4px dashed;\n  border-bottom: 4px solid \\9;\n}\n.dropup .dropdown-menu,\n.navbar-fixed-bottom .dropdown .dropdown-menu {\n  top: auto;\n  bottom: 100%;\n  margin-bottom: 2px;\n}\n@media (min-width: 768px) {\n  .navbar-right .dropdown-menu {\n    right: 0;\n    left: auto;\n  }\n\n  .navbar-right .dropdown-menu-left {\n    right: auto;\n    left: 0;\n  }\n}\n.btn-group,\n.btn-group-vertical {\n  position: relative;\n  display: inline-block;\n  vertical-align: middle;\n}\n.btn-group > .btn,\n.btn-group-vertical > .btn {\n  position: relative;\n  float: left;\n}\n.btn-group > .btn:hover,\n.btn-group-vertical > .btn:hover,\n.btn-group > .btn:focus,\n.btn-group-vertical > .btn:focus,\n.btn-group > .btn:active,\n.btn-group-vertical > .btn:active,\n.btn-group > .btn.active,\n.btn-group-vertical > .btn.active {\n  z-index: 2;\n}\n.btn-group .btn + .btn,\n.btn-group .btn + .btn-group,\n.btn-group .btn-group + .btn,\n.btn-group .btn-group + .btn-group {\n  margin-left: -1px;\n}\n.btn-toolbar {\n  margin-left: -5px;\n}\n.btn-toolbar .btn,\n.btn-toolbar .btn-group,\n.btn-toolbar .input-group {\n  float: left;\n}\n.btn-toolbar > .btn,\n.btn-toolbar > .btn-group,\n.btn-toolbar > .input-group {\n  margin-left: 5px;\n}\n.btn-group > .btn:not(:first-child):not(:last-child):not(.dropdown-toggle) {\n  border-radius: 0;\n}\n.btn-group > .btn:first-child {\n  margin-left: 0;\n}\n.btn-group > .btn:first-child:not(:last-child):not(.dropdown-toggle) {\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n}\n.btn-group > .btn:last-child:not(:first-child),\n.btn-group > .dropdown-toggle:not(:first-child) {\n  border-top-left-radius: 0;\n  border-bottom-left-radius: 0;\n}\n.btn-group > .btn-group {\n  float: left;\n}\n.btn-group > .btn-group:not(:first-child):not(:last-child) > .btn {\n  border-radius: 0;\n}\n.btn-group > .btn-group:first-child:not(:last-child) > .btn:last-child,\n.btn-group > .btn-group:first-child:not(:last-child) > .dropdown-toggle {\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n}\n.btn-group > .btn-group:last-child:not(:first-child) > .btn:first-child {\n  border-top-left-radius: 0;\n  border-bottom-left-radius: 0;\n}\n.btn-group .dropdown-toggle:active,\n.btn-group.open .dropdown-toggle {\n  outline: 0;\n}\n.btn-group > .btn + .dropdown-toggle {\n  padding-right: 8px;\n  padding-left: 8px;\n}\n.btn-group > .btn-lg + .dropdown-toggle {\n  padding-right: 12px;\n  padding-left: 12px;\n}\n.btn-group.open .dropdown-toggle {\n  -webkit-box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);\n  box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);\n}\n.btn-group.open .dropdown-toggle.btn-link {\n  -webkit-box-shadow: none;\n  box-shadow: none;\n}\n.btn .caret {\n  margin-left: 0;\n}\n.btn-lg .caret {\n  border-width: 5px 5px 0;\n  border-bottom-width: 0;\n}\n.dropup .btn-lg .caret {\n  border-width: 0 5px 5px;\n}\n.btn-group-vertical > .btn,\n.btn-group-vertical > .btn-group,\n.btn-group-vertical > .btn-group > .btn {\n  display: block;\n  float: none;\n  width: 100%;\n  max-width: 100%;\n}\n.btn-group-vertical > .btn-group > .btn {\n  float: none;\n}\n.btn-group-vertical > .btn + .btn,\n.btn-group-vertical > .btn + .btn-group,\n.btn-group-vertical > .btn-group + .btn,\n.btn-group-vertical > .btn-group + .btn-group {\n  margin-top: -1px;\n  margin-left: 0;\n}\n.btn-group-vertical > .btn:not(:first-child):not(:last-child) {\n  border-radius: 0;\n}\n.btn-group-vertical > .btn:first-child:not(:last-child) {\n  border-top-left-radius: 4px;\n  border-top-right-radius: 4px;\n  border-bottom-right-radius: 0;\n  border-bottom-left-radius: 0;\n}\n.btn-group-vertical > .btn:last-child:not(:first-child) {\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 4px;\n  border-bottom-left-radius: 4px;\n}\n.btn-group-vertical > .btn-group:not(:first-child):not(:last-child) > .btn {\n  border-radius: 0;\n}\n.btn-group-vertical > .btn-group:first-child:not(:last-child) > .btn:last-child,\n.btn-group-vertical > .btn-group:first-child:not(:last-child) > .dropdown-toggle {\n  border-bottom-right-radius: 0;\n  border-bottom-left-radius: 0;\n}\n.btn-group-vertical > .btn-group:last-child:not(:first-child) > .btn:first-child {\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n}\n.btn-group-justified {\n  display: table;\n  width: 100%;\n  table-layout: fixed;\n  border-collapse: separate;\n}\n.btn-group-justified > .btn,\n.btn-group-justified > .btn-group {\n  display: table-cell;\n  float: none;\n  width: 1%;\n}\n.btn-group-justified > .btn-group .btn {\n  width: 100%;\n}\n.btn-group-justified > .btn-group .dropdown-menu {\n  left: auto;\n}\n[data-toggle=\"buttons\"] > .btn input[type=\"radio\"],\n[data-toggle=\"buttons\"] > .btn-group > .btn input[type=\"radio\"],\n[data-toggle=\"buttons\"] > .btn input[type=\"checkbox\"],\n[data-toggle=\"buttons\"] > .btn-group > .btn input[type=\"checkbox\"] {\n  position: absolute;\n  clip: rect(0, 0, 0, 0);\n  pointer-events: none;\n}\n.input-group {\n  position: relative;\n  display: table;\n  border-collapse: separate;\n}\n.input-group[class*=\"col-\"] {\n  float: none;\n  padding-right: 0;\n  padding-left: 0;\n}\n.input-group .form-control {\n  position: relative;\n  z-index: 2;\n  float: left;\n  width: 100%;\n  margin-bottom: 0;\n}\n.input-group .form-control:focus {\n  z-index: 3;\n}\n.input-group-lg > .form-control,\n.input-group-lg > .input-group-addon,\n.input-group-lg > .input-group-btn > .btn {\n  height: 46px;\n  padding: 10px 16px;\n  font-size: 18px;\n  line-height: 1.3333333;\n  border-radius: 6px;\n}\nselect.input-group-lg > .form-control,\nselect.input-group-lg > .input-group-addon,\nselect.input-group-lg > .input-group-btn > .btn {\n  height: 46px;\n  line-height: 46px;\n}\ntextarea.input-group-lg > .form-control,\ntextarea.input-group-lg > .input-group-addon,\ntextarea.input-group-lg > .input-group-btn > .btn,\nselect[multiple].input-group-lg > .form-control,\nselect[multiple].input-group-lg > .input-group-addon,\nselect[multiple].input-group-lg > .input-group-btn > .btn {\n  height: auto;\n}\n.input-group-sm > .form-control,\n.input-group-sm > .input-group-addon,\n.input-group-sm > .input-group-btn > .btn {\n  height: 30px;\n  padding: 5px 10px;\n  font-size: 12px;\n  line-height: 1.5;\n  border-radius: 3px;\n}\nselect.input-group-sm > .form-control,\nselect.input-group-sm > .input-group-addon,\nselect.input-group-sm > .input-group-btn > .btn {\n  height: 30px;\n  line-height: 30px;\n}\ntextarea.input-group-sm > .form-control,\ntextarea.input-group-sm > .input-group-addon,\ntextarea.input-group-sm > .input-group-btn > .btn,\nselect[multiple].input-group-sm > .form-control,\nselect[multiple].input-group-sm > .input-group-addon,\nselect[multiple].input-group-sm > .input-group-btn > .btn {\n  height: auto;\n}\n.input-group-addon,\n.input-group-btn,\n.input-group .form-control {\n  display: table-cell;\n}\n.input-group-addon:not(:first-child):not(:last-child),\n.input-group-btn:not(:first-child):not(:last-child),\n.input-group .form-control:not(:first-child):not(:last-child) {\n  border-radius: 0;\n}\n.input-group-addon,\n.input-group-btn {\n  width: 1%;\n  white-space: nowrap;\n  vertical-align: middle;\n}\n.input-group-addon {\n  padding: 6px 12px;\n  font-size: 14px;\n  font-weight: 400;\n  line-height: 1;\n  color: #555555;\n  text-align: center;\n  background-color: #eeeeee;\n  border: 1px solid #ccc;\n  border-radius: 4px;\n}\n.input-group-addon.input-sm {\n  padding: 5px 10px;\n  font-size: 12px;\n  border-radius: 3px;\n}\n.input-group-addon.input-lg {\n  padding: 10px 16px;\n  font-size: 18px;\n  border-radius: 6px;\n}\n.input-group-addon input[type=\"radio\"],\n.input-group-addon input[type=\"checkbox\"] {\n  margin-top: 0;\n}\n.input-group .form-control:first-child,\n.input-group-addon:first-child,\n.input-group-btn:first-child > .btn,\n.input-group-btn:first-child > .btn-group > .btn,\n.input-group-btn:first-child > .dropdown-toggle,\n.input-group-btn:last-child > .btn:not(:last-child):not(.dropdown-toggle),\n.input-group-btn:last-child > .btn-group:not(:last-child) > .btn {\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n}\n.input-group-addon:first-child {\n  border-right: 0;\n}\n.input-group .form-control:last-child,\n.input-group-addon:last-child,\n.input-group-btn:last-child > .btn,\n.input-group-btn:last-child > .btn-group > .btn,\n.input-group-btn:last-child > .dropdown-toggle,\n.input-group-btn:first-child > .btn:not(:first-child),\n.input-group-btn:first-child > .btn-group:not(:first-child) > .btn {\n  border-top-left-radius: 0;\n  border-bottom-left-radius: 0;\n}\n.input-group-addon:last-child {\n  border-left: 0;\n}\n.input-group-btn {\n  position: relative;\n  font-size: 0;\n  white-space: nowrap;\n}\n.input-group-btn > .btn {\n  position: relative;\n}\n.input-group-btn > .btn + .btn {\n  margin-left: -1px;\n}\n.input-group-btn > .btn:hover,\n.input-group-btn > .btn:focus,\n.input-group-btn > .btn:active {\n  z-index: 2;\n}\n.input-group-btn:first-child > .btn,\n.input-group-btn:first-child > .btn-group {\n  margin-right: -1px;\n}\n.input-group-btn:last-child > .btn,\n.input-group-btn:last-child > .btn-group {\n  z-index: 2;\n  margin-left: -1px;\n}\n.nav {\n  padding-left: 0;\n  margin-bottom: 0;\n  list-style: none;\n}\n.nav > li {\n  position: relative;\n  display: block;\n}\n.nav > li > a {\n  position: relative;\n  display: block;\n  padding: 10px 15px;\n}\n.nav > li > a:hover,\n.nav > li > a:focus {\n  text-decoration: none;\n  background-color: #eeeeee;\n}\n.nav > li.disabled > a {\n  color: #777777;\n}\n.nav > li.disabled > a:hover,\n.nav > li.disabled > a:focus {\n  color: #777777;\n  text-decoration: none;\n  cursor: not-allowed;\n  background-color: transparent;\n}\n.nav .open > a,\n.nav .open > a:hover,\n.nav .open > a:focus {\n  background-color: #eeeeee;\n  border-color: #337ab7;\n}\n.nav .nav-divider {\n  height: 1px;\n  margin: 9px 0;\n  overflow: hidden;\n  background-color: #e5e5e5;\n}\n.nav > li > a > img {\n  max-width: none;\n}\n.nav-tabs {\n  border-bottom: 1px solid #ddd;\n}\n.nav-tabs > li {\n  float: left;\n  margin-bottom: -1px;\n}\n.nav-tabs > li > a {\n  margin-right: 2px;\n  line-height: 1.42857143;\n  border: 1px solid transparent;\n  border-radius: 4px 4px 0 0;\n}\n.nav-tabs > li > a:hover {\n  border-color: #eeeeee #eeeeee #ddd;\n}\n.nav-tabs > li.active > a,\n.nav-tabs > li.active > a:hover,\n.nav-tabs > li.active > a:focus {\n  color: #555555;\n  cursor: default;\n  background-color: #fff;\n  border: 1px solid #ddd;\n  border-bottom-color: transparent;\n}\n.nav-tabs.nav-justified {\n  width: 100%;\n  border-bottom: 0;\n}\n.nav-tabs.nav-justified > li {\n  float: none;\n}\n.nav-tabs.nav-justified > li > a {\n  margin-bottom: 5px;\n  text-align: center;\n}\n.nav-tabs.nav-justified > .dropdown .dropdown-menu {\n  top: auto;\n  left: auto;\n}\n@media (min-width: 768px) {\n  .nav-tabs.nav-justified > li {\n    display: table-cell;\n    width: 1%;\n  }\n\n  .nav-tabs.nav-justified > li > a {\n    margin-bottom: 0;\n  }\n}\n.nav-tabs.nav-justified > li > a {\n  margin-right: 0;\n  border-radius: 4px;\n}\n.nav-tabs.nav-justified > .active > a,\n.nav-tabs.nav-justified > .active > a:hover,\n.nav-tabs.nav-justified > .active > a:focus {\n  border: 1px solid #ddd;\n}\n@media (min-width: 768px) {\n  .nav-tabs.nav-justified > li > a {\n    border-bottom: 1px solid #ddd;\n    border-radius: 4px 4px 0 0;\n  }\n\n  .nav-tabs.nav-justified > .active > a,\n  .nav-tabs.nav-justified > .active > a:hover,\n  .nav-tabs.nav-justified > .active > a:focus {\n    border-bottom-color: #fff;\n  }\n}\n.nav-pills > li {\n  float: left;\n}\n.nav-pills > li > a {\n  border-radius: 4px;\n}\n.nav-pills > li + li {\n  margin-left: 2px;\n}\n.nav-pills > li.active > a,\n.nav-pills > li.active > a:hover,\n.nav-pills > li.active > a:focus {\n  color: #fff;\n  background-color: #337ab7;\n}\n.nav-stacked > li {\n  float: none;\n}\n.nav-stacked > li + li {\n  margin-top: 2px;\n  margin-left: 0;\n}\n.nav-justified {\n  width: 100%;\n}\n.nav-justified > li {\n  float: none;\n}\n.nav-justified > li > a {\n  margin-bottom: 5px;\n  text-align: center;\n}\n.nav-justified > .dropdown .dropdown-menu {\n  top: auto;\n  left: auto;\n}\n@media (min-width: 768px) {\n  .nav-justified > li {\n    display: table-cell;\n    width: 1%;\n  }\n\n  .nav-justified > li > a {\n    margin-bottom: 0;\n  }\n}\n.nav-tabs-justified {\n  border-bottom: 0;\n}\n.nav-tabs-justified > li > a {\n  margin-right: 0;\n  border-radius: 4px;\n}\n.nav-tabs-justified > .active > a,\n.nav-tabs-justified > .active > a:hover,\n.nav-tabs-justified > .active > a:focus {\n  border: 1px solid #ddd;\n}\n@media (min-width: 768px) {\n  .nav-tabs-justified > li > a {\n    border-bottom: 1px solid #ddd;\n    border-radius: 4px 4px 0 0;\n  }\n\n  .nav-tabs-justified > .active > a,\n  .nav-tabs-justified > .active > a:hover,\n  .nav-tabs-justified > .active > a:focus {\n    border-bottom-color: #fff;\n  }\n}\n.tab-content > .tab-pane {\n  display: none;\n}\n.tab-content > .active {\n  display: block;\n}\n.nav-tabs .dropdown-menu {\n  margin-top: -1px;\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n}\n.navbar {\n  position: relative;\n  min-height: 50px;\n  margin-bottom: 20px;\n  border: 1px solid transparent;\n}\n@media (min-width: 768px) {\n  .navbar {\n    border-radius: 4px;\n  }\n}\n@media (min-width: 768px) {\n  .navbar-header {\n    float: left;\n  }\n}\n.navbar-collapse {\n  padding-right: 15px;\n  padding-left: 15px;\n  overflow-x: visible;\n  border-top: 1px solid transparent;\n  -webkit-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);\n  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);\n  -webkit-overflow-scrolling: touch;\n}\n.navbar-collapse.in {\n  overflow-y: auto;\n}\n@media (min-width: 768px) {\n  .navbar-collapse {\n    width: auto;\n    border-top: 0;\n    -webkit-box-shadow: none;\n    box-shadow: none;\n  }\n\n  .navbar-collapse.collapse {\n    display: block !important;\n    height: auto !important;\n    padding-bottom: 0;\n    overflow: visible !important;\n  }\n\n  .navbar-collapse.in {\n    overflow-y: visible;\n  }\n\n  .navbar-fixed-top .navbar-collapse,\n  .navbar-static-top .navbar-collapse,\n  .navbar-fixed-bottom .navbar-collapse {\n    padding-right: 0;\n    padding-left: 0;\n  }\n}\n.navbar-fixed-top,\n.navbar-fixed-bottom {\n  position: fixed;\n  right: 0;\n  left: 0;\n  z-index: 1030;\n}\n.navbar-fixed-top .navbar-collapse,\n.navbar-fixed-bottom .navbar-collapse {\n  max-height: 340px;\n}\n@media (max-device-width: 480px) and (orientation: landscape) {\n  .navbar-fixed-top .navbar-collapse,\n  .navbar-fixed-bottom .navbar-collapse {\n    max-height: 200px;\n  }\n}\n@media (min-width: 768px) {\n  .navbar-fixed-top,\n  .navbar-fixed-bottom {\n    border-radius: 0;\n  }\n}\n.navbar-fixed-top {\n  top: 0;\n  border-width: 0 0 1px;\n}\n.navbar-fixed-bottom {\n  bottom: 0;\n  margin-bottom: 0;\n  border-width: 1px 0 0;\n}\n.container > .navbar-header,\n.container-fluid > .navbar-header,\n.container > .navbar-collapse,\n.container-fluid > .navbar-collapse {\n  margin-right: -15px;\n  margin-left: -15px;\n}\n@media (min-width: 768px) {\n  .container > .navbar-header,\n  .container-fluid > .navbar-header,\n  .container > .navbar-collapse,\n  .container-fluid > .navbar-collapse {\n    margin-right: 0;\n    margin-left: 0;\n  }\n}\n.navbar-static-top {\n  z-index: 1000;\n  border-width: 0 0 1px;\n}\n@media (min-width: 768px) {\n  .navbar-static-top {\n    border-radius: 0;\n  }\n}\n.navbar-brand {\n  float: left;\n  height: 50px;\n  padding: 15px 15px;\n  font-size: 18px;\n  line-height: 20px;\n}\n.navbar-brand:hover,\n.navbar-brand:focus {\n  text-decoration: none;\n}\n.navbar-brand > img {\n  display: block;\n}\n@media (min-width: 768px) {\n  .navbar > .container .navbar-brand,\n  .navbar > .container-fluid .navbar-brand {\n    margin-left: -15px;\n  }\n}\n.navbar-toggle {\n  position: relative;\n  float: right;\n  padding: 9px 10px;\n  margin-right: 15px;\n  margin-top: 8px;\n  margin-bottom: 8px;\n  background-color: transparent;\n  background-image: none;\n  border: 1px solid transparent;\n  border-radius: 4px;\n}\n.navbar-toggle:focus {\n  outline: 0;\n}\n.navbar-toggle .icon-bar {\n  display: block;\n  width: 22px;\n  height: 2px;\n  border-radius: 1px;\n}\n.navbar-toggle .icon-bar + .icon-bar {\n  margin-top: 4px;\n}\n@media (min-width: 768px) {\n  .navbar-toggle {\n    display: none;\n  }\n}\n.navbar-nav {\n  margin: 7.5px -15px;\n}\n.navbar-nav > li > a {\n  padding-top: 10px;\n  padding-bottom: 10px;\n  line-height: 20px;\n}\n@media (max-width: 767px) {\n  .navbar-nav .open .dropdown-menu {\n    position: static;\n    float: none;\n    width: auto;\n    margin-top: 0;\n    background-color: transparent;\n    border: 0;\n    -webkit-box-shadow: none;\n    box-shadow: none;\n  }\n\n  .navbar-nav .open .dropdown-menu > li > a,\n  .navbar-nav .open .dropdown-menu .dropdown-header {\n    padding: 5px 15px 5px 25px;\n  }\n\n  .navbar-nav .open .dropdown-menu > li > a {\n    line-height: 20px;\n  }\n\n  .navbar-nav .open .dropdown-menu > li > a:hover,\n  .navbar-nav .open .dropdown-menu > li > a:focus {\n    background-image: none;\n  }\n}\n@media (min-width: 768px) {\n  .navbar-nav {\n    float: left;\n    margin: 0;\n  }\n\n  .navbar-nav > li {\n    float: left;\n  }\n\n  .navbar-nav > li > a {\n    padding-top: 15px;\n    padding-bottom: 15px;\n  }\n}\n.navbar-form {\n  padding: 10px 15px;\n  margin-right: -15px;\n  margin-left: -15px;\n  border-top: 1px solid transparent;\n  border-bottom: 1px solid transparent;\n  -webkit-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 0 rgba(255, 255, 255, 0.1);\n  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 0 rgba(255, 255, 255, 0.1);\n  margin-top: 8px;\n  margin-bottom: 8px;\n}\n@media (min-width: 768px) {\n  .navbar-form .form-group {\n    display: inline-block;\n    margin-bottom: 0;\n    vertical-align: middle;\n  }\n\n  .navbar-form .form-control {\n    display: inline-block;\n    width: auto;\n    vertical-align: middle;\n  }\n\n  .navbar-form .form-control-static {\n    display: inline-block;\n  }\n\n  .navbar-form .input-group {\n    display: inline-table;\n    vertical-align: middle;\n  }\n\n  .navbar-form .input-group .input-group-addon,\n  .navbar-form .input-group .input-group-btn,\n  .navbar-form .input-group .form-control {\n    width: auto;\n  }\n\n  .navbar-form .input-group > .form-control {\n    width: 100%;\n  }\n\n  .navbar-form .control-label {\n    margin-bottom: 0;\n    vertical-align: middle;\n  }\n\n  .navbar-form .radio,\n  .navbar-form .checkbox {\n    display: inline-block;\n    margin-top: 0;\n    margin-bottom: 0;\n    vertical-align: middle;\n  }\n\n  .navbar-form .radio label,\n  .navbar-form .checkbox label {\n    padding-left: 0;\n  }\n\n  .navbar-form .radio input[type=\"radio\"],\n  .navbar-form .checkbox input[type=\"checkbox\"] {\n    position: relative;\n    margin-left: 0;\n  }\n\n  .navbar-form .has-feedback .form-control-feedback {\n    top: 0;\n  }\n}\n@media (max-width: 767px) {\n  .navbar-form .form-group {\n    margin-bottom: 5px;\n  }\n\n  .navbar-form .form-group:last-child {\n    margin-bottom: 0;\n  }\n}\n@media (min-width: 768px) {\n  .navbar-form {\n    width: auto;\n    padding-top: 0;\n    padding-bottom: 0;\n    margin-right: 0;\n    margin-left: 0;\n    border: 0;\n    -webkit-box-shadow: none;\n    box-shadow: none;\n  }\n}\n.navbar-nav > li > .dropdown-menu {\n  margin-top: 0;\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n}\n.navbar-fixed-bottom .navbar-nav > li > .dropdown-menu {\n  margin-bottom: 0;\n  border-top-left-radius: 4px;\n  border-top-right-radius: 4px;\n  border-bottom-right-radius: 0;\n  border-bottom-left-radius: 0;\n}\n.navbar-btn {\n  margin-top: 8px;\n  margin-bottom: 8px;\n}\n.navbar-btn.btn-sm {\n  margin-top: 10px;\n  margin-bottom: 10px;\n}\n.navbar-btn.btn-xs {\n  margin-top: 14px;\n  margin-bottom: 14px;\n}\n.navbar-text {\n  margin-top: 15px;\n  margin-bottom: 15px;\n}\n@media (min-width: 768px) {\n  .navbar-text {\n    float: left;\n    margin-right: 15px;\n    margin-left: 15px;\n  }\n}\n@media (min-width: 768px) {\n  .navbar-left {\n    float: left !important;\n  }\n\n  .navbar-right {\n    float: right !important;\n    margin-right: -15px;\n  }\n\n  .navbar-right ~ .navbar-right {\n    margin-right: 0;\n  }\n}\n.navbar-default {\n  background-color: #f8f8f8;\n  border-color: #e7e7e7;\n}\n.navbar-default .navbar-brand {\n  color: #777;\n}\n.navbar-default .navbar-brand:hover,\n.navbar-default .navbar-brand:focus {\n  color: #5e5e5e;\n  background-color: transparent;\n}\n.navbar-default .navbar-text {\n  color: #777;\n}\n.navbar-default .navbar-nav > li > a {\n  color: #777;\n}\n.navbar-default .navbar-nav > li > a:hover,\n.navbar-default .navbar-nav > li > a:focus {\n  color: #333;\n  background-color: transparent;\n}\n.navbar-default .navbar-nav > .active > a,\n.navbar-default .navbar-nav > .active > a:hover,\n.navbar-default .navbar-nav > .active > a:focus {\n  color: #555;\n  background-color: #e7e7e7;\n}\n.navbar-default .navbar-nav > .disabled > a,\n.navbar-default .navbar-nav > .disabled > a:hover,\n.navbar-default .navbar-nav > .disabled > a:focus {\n  color: #ccc;\n  background-color: transparent;\n}\n.navbar-default .navbar-nav > .open > a,\n.navbar-default .navbar-nav > .open > a:hover,\n.navbar-default .navbar-nav > .open > a:focus {\n  color: #555;\n  background-color: #e7e7e7;\n}\n@media (max-width: 767px) {\n  .navbar-default .navbar-nav .open .dropdown-menu > li > a {\n    color: #777;\n  }\n\n  .navbar-default .navbar-nav .open .dropdown-menu > li > a:hover,\n  .navbar-default .navbar-nav .open .dropdown-menu > li > a:focus {\n    color: #333;\n    background-color: transparent;\n  }\n\n  .navbar-default .navbar-nav .open .dropdown-menu > .active > a,\n  .navbar-default .navbar-nav .open .dropdown-menu > .active > a:hover,\n  .navbar-default .navbar-nav .open .dropdown-menu > .active > a:focus {\n    color: #555;\n    background-color: #e7e7e7;\n  }\n\n  .navbar-default .navbar-nav .open .dropdown-menu > .disabled > a,\n  .navbar-default .navbar-nav .open .dropdown-menu > .disabled > a:hover,\n  .navbar-default .navbar-nav .open .dropdown-menu > .disabled > a:focus {\n    color: #ccc;\n    background-color: transparent;\n  }\n}\n.navbar-default .navbar-toggle {\n  border-color: #ddd;\n}\n.navbar-default .navbar-toggle:hover,\n.navbar-default .navbar-toggle:focus {\n  background-color: #ddd;\n}\n.navbar-default .navbar-toggle .icon-bar {\n  background-color: #888;\n}\n.navbar-default .navbar-collapse,\n.navbar-default .navbar-form {\n  border-color: #e7e7e7;\n}\n.navbar-default .navbar-link {\n  color: #777;\n}\n.navbar-default .navbar-link:hover {\n  color: #333;\n}\n.navbar-default .btn-link {\n  color: #777;\n}\n.navbar-default .btn-link:hover,\n.navbar-default .btn-link:focus {\n  color: #333;\n}\n.navbar-default .btn-link[disabled]:hover,\nfieldset[disabled] .navbar-default .btn-link:hover,\n.navbar-default .btn-link[disabled]:focus,\nfieldset[disabled] .navbar-default .btn-link:focus {\n  color: #ccc;\n}\n.navbar-inverse {\n  background-color: #222;\n  border-color: #080808;\n}\n.navbar-inverse .navbar-brand {\n  color: #9d9d9d;\n}\n.navbar-inverse .navbar-brand:hover,\n.navbar-inverse .navbar-brand:focus {\n  color: #fff;\n  background-color: transparent;\n}\n.navbar-inverse .navbar-text {\n  color: #9d9d9d;\n}\n.navbar-inverse .navbar-nav > li > a {\n  color: #9d9d9d;\n}\n.navbar-inverse .navbar-nav > li > a:hover,\n.navbar-inverse .navbar-nav > li > a:focus {\n  color: #fff;\n  background-color: transparent;\n}\n.navbar-inverse .navbar-nav > .active > a,\n.navbar-inverse .navbar-nav > .active > a:hover,\n.navbar-inverse .navbar-nav > .active > a:focus {\n  color: #fff;\n  background-color: #080808;\n}\n.navbar-inverse .navbar-nav > .disabled > a,\n.navbar-inverse .navbar-nav > .disabled > a:hover,\n.navbar-inverse .navbar-nav > .disabled > a:focus {\n  color: #444;\n  background-color: transparent;\n}\n.navbar-inverse .navbar-nav > .open > a,\n.navbar-inverse .navbar-nav > .open > a:hover,\n.navbar-inverse .navbar-nav > .open > a:focus {\n  color: #fff;\n  background-color: #080808;\n}\n@media (max-width: 767px) {\n  .navbar-inverse .navbar-nav .open .dropdown-menu > .dropdown-header {\n    border-color: #080808;\n  }\n\n  .navbar-inverse .navbar-nav .open .dropdown-menu .divider {\n    background-color: #080808;\n  }\n\n  .navbar-inverse .navbar-nav .open .dropdown-menu > li > a {\n    color: #9d9d9d;\n  }\n\n  .navbar-inverse .navbar-nav .open .dropdown-menu > li > a:hover,\n  .navbar-inverse .navbar-nav .open .dropdown-menu > li > a:focus {\n    color: #fff;\n    background-color: transparent;\n  }\n\n  .navbar-inverse .navbar-nav .open .dropdown-menu > .active > a,\n  .navbar-inverse .navbar-nav .open .dropdown-menu > .active > a:hover,\n  .navbar-inverse .navbar-nav .open .dropdown-menu > .active > a:focus {\n    color: #fff;\n    background-color: #080808;\n  }\n\n  .navbar-inverse .navbar-nav .open .dropdown-menu > .disabled > a,\n  .navbar-inverse .navbar-nav .open .dropdown-menu > .disabled > a:hover,\n  .navbar-inverse .navbar-nav .open .dropdown-menu > .disabled > a:focus {\n    color: #444;\n    background-color: transparent;\n  }\n}\n.navbar-inverse .navbar-toggle {\n  border-color: #333;\n}\n.navbar-inverse .navbar-toggle:hover,\n.navbar-inverse .navbar-toggle:focus {\n  background-color: #333;\n}\n.navbar-inverse .navbar-toggle .icon-bar {\n  background-color: #fff;\n}\n.navbar-inverse .navbar-collapse,\n.navbar-inverse .navbar-form {\n  border-color: #101010;\n}\n.navbar-inverse .navbar-link {\n  color: #9d9d9d;\n}\n.navbar-inverse .navbar-link:hover {\n  color: #fff;\n}\n.navbar-inverse .btn-link {\n  color: #9d9d9d;\n}\n.navbar-inverse .btn-link:hover,\n.navbar-inverse .btn-link:focus {\n  color: #fff;\n}\n.navbar-inverse .btn-link[disabled]:hover,\nfieldset[disabled] .navbar-inverse .btn-link:hover,\n.navbar-inverse .btn-link[disabled]:focus,\nfieldset[disabled] .navbar-inverse .btn-link:focus {\n  color: #444;\n}\n.breadcrumb {\n  padding: 8px 15px;\n  margin-bottom: 20px;\n  list-style: none;\n  background-color: #f5f5f5;\n  border-radius: 4px;\n}\n.breadcrumb > li {\n  display: inline-block;\n}\n.breadcrumb > li + li:before {\n  padding: 0 5px;\n  color: #ccc;\n  content: \"/\\00a0\";\n}\n.breadcrumb > .active {\n  color: #777777;\n}\n.pagination {\n  display: inline-block;\n  padding-left: 0;\n  margin: 20px 0;\n  border-radius: 4px;\n}\n.pagination > li {\n  display: inline;\n}\n.pagination > li > a,\n.pagination > li > span {\n  position: relative;\n  float: left;\n  padding: 6px 12px;\n  margin-left: -1px;\n  line-height: 1.42857143;\n  color: #337ab7;\n  text-decoration: none;\n  background-color: #fff;\n  border: 1px solid #ddd;\n}\n.pagination > li > a:hover,\n.pagination > li > span:hover,\n.pagination > li > a:focus,\n.pagination > li > span:focus {\n  z-index: 2;\n  color: #23527c;\n  background-color: #eeeeee;\n  border-color: #ddd;\n}\n.pagination > li:first-child > a,\n.pagination > li:first-child > span {\n  margin-left: 0;\n  border-top-left-radius: 4px;\n  border-bottom-left-radius: 4px;\n}\n.pagination > li:last-child > a,\n.pagination > li:last-child > span {\n  border-top-right-radius: 4px;\n  border-bottom-right-radius: 4px;\n}\n.pagination > .active > a,\n.pagination > .active > span,\n.pagination > .active > a:hover,\n.pagination > .active > span:hover,\n.pagination > .active > a:focus,\n.pagination > .active > span:focus {\n  z-index: 3;\n  color: #fff;\n  cursor: default;\n  background-color: #337ab7;\n  border-color: #337ab7;\n}\n.pagination > .disabled > span,\n.pagination > .disabled > span:hover,\n.pagination > .disabled > span:focus,\n.pagination > .disabled > a,\n.pagination > .disabled > a:hover,\n.pagination > .disabled > a:focus {\n  color: #777777;\n  cursor: not-allowed;\n  background-color: #fff;\n  border-color: #ddd;\n}\n.pagination-lg > li > a,\n.pagination-lg > li > span {\n  padding: 10px 16px;\n  font-size: 18px;\n  line-height: 1.3333333;\n}\n.pagination-lg > li:first-child > a,\n.pagination-lg > li:first-child > span {\n  border-top-left-radius: 6px;\n  border-bottom-left-radius: 6px;\n}\n.pagination-lg > li:last-child > a,\n.pagination-lg > li:last-child > span {\n  border-top-right-radius: 6px;\n  border-bottom-right-radius: 6px;\n}\n.pagination-sm > li > a,\n.pagination-sm > li > span {\n  padding: 5px 10px;\n  font-size: 12px;\n  line-height: 1.5;\n}\n.pagination-sm > li:first-child > a,\n.pagination-sm > li:first-child > span {\n  border-top-left-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.pagination-sm > li:last-child > a,\n.pagination-sm > li:last-child > span {\n  border-top-right-radius: 3px;\n  border-bottom-right-radius: 3px;\n}\n.pager {\n  padding-left: 0;\n  margin: 20px 0;\n  text-align: center;\n  list-style: none;\n}\n.pager li {\n  display: inline;\n}\n.pager li > a,\n.pager li > span {\n  display: inline-block;\n  padding: 5px 14px;\n  background-color: #fff;\n  border: 1px solid #ddd;\n  border-radius: 15px;\n}\n.pager li > a:hover,\n.pager li > a:focus {\n  text-decoration: none;\n  background-color: #eeeeee;\n}\n.pager .next > a,\n.pager .next > span {\n  float: right;\n}\n.pager .previous > a,\n.pager .previous > span {\n  float: left;\n}\n.pager .disabled > a,\n.pager .disabled > a:hover,\n.pager .disabled > a:focus,\n.pager .disabled > span {\n  color: #777777;\n  cursor: not-allowed;\n  background-color: #fff;\n}\n.label {\n  display: inline;\n  padding: 0.2em 0.6em 0.3em;\n  font-size: 75%;\n  font-weight: 700;\n  line-height: 1;\n  color: #fff;\n  text-align: center;\n  white-space: nowrap;\n  vertical-align: baseline;\n  border-radius: 0.25em;\n}\na.label:hover,\na.label:focus {\n  color: #fff;\n  text-decoration: none;\n  cursor: pointer;\n}\n.label:empty {\n  display: none;\n}\n.btn .label {\n  position: relative;\n  top: -1px;\n}\n.label-default {\n  background-color: #777777;\n}\n.label-default[href]:hover,\n.label-default[href]:focus {\n  background-color: #5e5e5e;\n}\n.label-primary {\n  background-color: #337ab7;\n}\n.label-primary[href]:hover,\n.label-primary[href]:focus {\n  background-color: #286090;\n}\n.label-success {\n  background-color: #5cb85c;\n}\n.label-success[href]:hover,\n.label-success[href]:focus {\n  background-color: #449d44;\n}\n.label-info {\n  background-color: #5bc0de;\n}\n.label-info[href]:hover,\n.label-info[href]:focus {\n  background-color: #31b0d5;\n}\n.label-warning {\n  background-color: #f0ad4e;\n}\n.label-warning[href]:hover,\n.label-warning[href]:focus {\n  background-color: #ec971f;\n}\n.label-danger {\n  background-color: #d9534f;\n}\n.label-danger[href]:hover,\n.label-danger[href]:focus {\n  background-color: #c9302c;\n}\n.badge {\n  display: inline-block;\n  min-width: 10px;\n  padding: 3px 7px;\n  font-size: 12px;\n  font-weight: bold;\n  line-height: 1;\n  color: #fff;\n  text-align: center;\n  white-space: nowrap;\n  vertical-align: middle;\n  background-color: #777777;\n  border-radius: 10px;\n}\n.badge:empty {\n  display: none;\n}\n.btn .badge {\n  position: relative;\n  top: -1px;\n}\n.btn-xs .badge,\n.btn-group-xs > .btn .badge {\n  top: 0;\n  padding: 1px 5px;\n}\na.badge:hover,\na.badge:focus {\n  color: #fff;\n  text-decoration: none;\n  cursor: pointer;\n}\n.list-group-item.active > .badge,\n.nav-pills > .active > a > .badge {\n  color: #337ab7;\n  background-color: #fff;\n}\n.list-group-item > .badge {\n  float: right;\n}\n.list-group-item > .badge + .badge {\n  margin-right: 5px;\n}\n.nav-pills > li > a > .badge {\n  margin-left: 3px;\n}\n.jumbotron {\n  padding-top: 30px;\n  padding-bottom: 30px;\n  margin-bottom: 30px;\n  color: inherit;\n  background-color: #eeeeee;\n}\n.jumbotron h1,\n.jumbotron .h1 {\n  color: inherit;\n}\n.jumbotron p {\n  margin-bottom: 15px;\n  font-size: 21px;\n  font-weight: 200;\n}\n.jumbotron > hr {\n  border-top-color: #d5d5d5;\n}\n.container .jumbotron,\n.container-fluid .jumbotron {\n  padding-right: 15px;\n  padding-left: 15px;\n  border-radius: 6px;\n}\n.jumbotron .container {\n  max-width: 100%;\n}\n@media screen and (min-width: 768px) {\n  .jumbotron {\n    padding-top: 48px;\n    padding-bottom: 48px;\n  }\n\n  .container .jumbotron,\n  .container-fluid .jumbotron {\n    padding-right: 60px;\n    padding-left: 60px;\n  }\n\n  .jumbotron h1,\n  .jumbotron .h1 {\n    font-size: 63px;\n  }\n}\n.thumbnail {\n  display: block;\n  padding: 4px;\n  margin-bottom: 20px;\n  line-height: 1.42857143;\n  background-color: #fff;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n  -webkit-transition: border 0.2s ease-in-out;\n  -o-transition: border 0.2s ease-in-out;\n  transition: border 0.2s ease-in-out;\n}\n.thumbnail > img,\n.thumbnail a > img {\n  margin-right: auto;\n  margin-left: auto;\n}\na.thumbnail:hover,\na.thumbnail:focus,\na.thumbnail.active {\n  border-color: #337ab7;\n}\n.thumbnail .caption {\n  padding: 9px;\n  color: #333333;\n}\n.alert {\n  padding: 15px;\n  margin-bottom: 20px;\n  border: 1px solid transparent;\n  border-radius: 4px;\n}\n.alert h4 {\n  margin-top: 0;\n  color: inherit;\n}\n.alert .alert-link {\n  font-weight: bold;\n}\n.alert > p,\n.alert > ul {\n  margin-bottom: 0;\n}\n.alert > p + p {\n  margin-top: 5px;\n}\n.alert-dismissable,\n.alert-dismissible {\n  padding-right: 35px;\n}\n.alert-dismissable .close,\n.alert-dismissible .close {\n  position: relative;\n  top: -2px;\n  right: -21px;\n  color: inherit;\n}\n.alert-success {\n  color: #3c763d;\n  background-color: #dff0d8;\n  border-color: #d6e9c6;\n}\n.alert-success hr {\n  border-top-color: #c9e2b3;\n}\n.alert-success .alert-link {\n  color: #2b542c;\n}\n.alert-info {\n  color: #31708f;\n  background-color: #d9edf7;\n  border-color: #bce8f1;\n}\n.alert-info hr {\n  border-top-color: #a6e1ec;\n}\n.alert-info .alert-link {\n  color: #245269;\n}\n.alert-warning {\n  color: #8a6d3b;\n  background-color: #fcf8e3;\n  border-color: #faebcc;\n}\n.alert-warning hr {\n  border-top-color: #f7e1b5;\n}\n.alert-warning .alert-link {\n  color: #66512c;\n}\n.alert-danger {\n  color: #a94442;\n  background-color: #f2dede;\n  border-color: #ebccd1;\n}\n.alert-danger hr {\n  border-top-color: #e4b9c0;\n}\n.alert-danger .alert-link {\n  color: #843534;\n}\n@-webkit-keyframes progress-bar-stripes {\n  from {\n    background-position: 40px 0;\n  }\n\n  to {\n    background-position: 0 0;\n  }\n}\n@-o-keyframes progress-bar-stripes {\n  from {\n    background-position: 40px 0;\n  }\n\n  to {\n    background-position: 0 0;\n  }\n}\n@keyframes progress-bar-stripes {\n  from {\n    background-position: 40px 0;\n  }\n\n  to {\n    background-position: 0 0;\n  }\n}\n.progress {\n  height: 20px;\n  margin-bottom: 20px;\n  overflow: hidden;\n  background-color: #f5f5f5;\n  border-radius: 4px;\n  -webkit-box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);\n  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);\n}\n.progress-bar {\n  float: left;\n  width: 0%;\n  height: 100%;\n  font-size: 12px;\n  line-height: 20px;\n  color: #fff;\n  text-align: center;\n  background-color: #337ab7;\n  -webkit-box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.15);\n  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.15);\n  -webkit-transition: width 0.6s ease;\n  -o-transition: width 0.6s ease;\n  transition: width 0.6s ease;\n}\n.progress-striped .progress-bar,\n.progress-bar-striped {\n  background-image: -webkit-linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n  background-image: -o-linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n  background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n  -webkit-background-size: 40px 40px;\n  background-size: 40px 40px;\n}\n.progress.active .progress-bar,\n.progress-bar.active {\n  -webkit-animation: progress-bar-stripes 2s linear infinite;\n  -o-animation: progress-bar-stripes 2s linear infinite;\n  animation: progress-bar-stripes 2s linear infinite;\n}\n.progress-bar-success {\n  background-color: #5cb85c;\n}\n.progress-striped .progress-bar-success {\n  background-image: -webkit-linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n  background-image: -o-linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n  background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n}\n.progress-bar-info {\n  background-color: #5bc0de;\n}\n.progress-striped .progress-bar-info {\n  background-image: -webkit-linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n  background-image: -o-linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n  background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n}\n.progress-bar-warning {\n  background-color: #f0ad4e;\n}\n.progress-striped .progress-bar-warning {\n  background-image: -webkit-linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n  background-image: -o-linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n  background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n}\n.progress-bar-danger {\n  background-color: #d9534f;\n}\n.progress-striped .progress-bar-danger {\n  background-image: -webkit-linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n  background-image: -o-linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n  background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);\n}\n.media {\n  margin-top: 15px;\n}\n.media:first-child {\n  margin-top: 0;\n}\n.media,\n.media-body {\n  overflow: hidden;\n  zoom: 1;\n}\n.media-body {\n  width: 10000px;\n}\n.media-object {\n  display: block;\n}\n.media-object.img-thumbnail {\n  max-width: none;\n}\n.media-right,\n.media > .pull-right {\n  padding-left: 10px;\n}\n.media-left,\n.media > .pull-left {\n  padding-right: 10px;\n}\n.media-left,\n.media-right,\n.media-body {\n  display: table-cell;\n  vertical-align: top;\n}\n.media-middle {\n  vertical-align: middle;\n}\n.media-bottom {\n  vertical-align: bottom;\n}\n.media-heading {\n  margin-top: 0;\n  margin-bottom: 5px;\n}\n.media-list {\n  padding-left: 0;\n  list-style: none;\n}\n.list-group {\n  padding-left: 0;\n  margin-bottom: 20px;\n}\n.list-group-item {\n  position: relative;\n  display: block;\n  padding: 10px 15px;\n  margin-bottom: -1px;\n  background-color: #fff;\n  border: 1px solid #ddd;\n}\n.list-group-item:first-child {\n  border-top-left-radius: 4px;\n  border-top-right-radius: 4px;\n}\n.list-group-item:last-child {\n  margin-bottom: 0;\n  border-bottom-right-radius: 4px;\n  border-bottom-left-radius: 4px;\n}\n.list-group-item.disabled,\n.list-group-item.disabled:hover,\n.list-group-item.disabled:focus {\n  color: #777777;\n  cursor: not-allowed;\n  background-color: #eeeeee;\n}\n.list-group-item.disabled .list-group-item-heading,\n.list-group-item.disabled:hover .list-group-item-heading,\n.list-group-item.disabled:focus .list-group-item-heading {\n  color: inherit;\n}\n.list-group-item.disabled .list-group-item-text,\n.list-group-item.disabled:hover .list-group-item-text,\n.list-group-item.disabled:focus .list-group-item-text {\n  color: #777777;\n}\n.list-group-item.active,\n.list-group-item.active:hover,\n.list-group-item.active:focus {\n  z-index: 2;\n  color: #fff;\n  background-color: #337ab7;\n  border-color: #337ab7;\n}\n.list-group-item.active .list-group-item-heading,\n.list-group-item.active:hover .list-group-item-heading,\n.list-group-item.active:focus .list-group-item-heading,\n.list-group-item.active .list-group-item-heading > small,\n.list-group-item.active:hover .list-group-item-heading > small,\n.list-group-item.active:focus .list-group-item-heading > small,\n.list-group-item.active .list-group-item-heading > .small,\n.list-group-item.active:hover .list-group-item-heading > .small,\n.list-group-item.active:focus .list-group-item-heading > .small {\n  color: inherit;\n}\n.list-group-item.active .list-group-item-text,\n.list-group-item.active:hover .list-group-item-text,\n.list-group-item.active:focus .list-group-item-text {\n  color: #c7ddef;\n}\na.list-group-item,\nbutton.list-group-item {\n  color: #555;\n}\na.list-group-item .list-group-item-heading,\nbutton.list-group-item .list-group-item-heading {\n  color: #333;\n}\na.list-group-item:hover,\nbutton.list-group-item:hover,\na.list-group-item:focus,\nbutton.list-group-item:focus {\n  color: #555;\n  text-decoration: none;\n  background-color: #f5f5f5;\n}\nbutton.list-group-item {\n  width: 100%;\n  text-align: left;\n}\n.list-group-item-success {\n  color: #3c763d;\n  background-color: #dff0d8;\n}\na.list-group-item-success,\nbutton.list-group-item-success {\n  color: #3c763d;\n}\na.list-group-item-success .list-group-item-heading,\nbutton.list-group-item-success .list-group-item-heading {\n  color: inherit;\n}\na.list-group-item-success:hover,\nbutton.list-group-item-success:hover,\na.list-group-item-success:focus,\nbutton.list-group-item-success:focus {\n  color: #3c763d;\n  background-color: #d0e9c6;\n}\na.list-group-item-success.active,\nbutton.list-group-item-success.active,\na.list-group-item-success.active:hover,\nbutton.list-group-item-success.active:hover,\na.list-group-item-success.active:focus,\nbutton.list-group-item-success.active:focus {\n  color: #fff;\n  background-color: #3c763d;\n  border-color: #3c763d;\n}\n.list-group-item-info {\n  color: #31708f;\n  background-color: #d9edf7;\n}\na.list-group-item-info,\nbutton.list-group-item-info {\n  color: #31708f;\n}\na.list-group-item-info .list-group-item-heading,\nbutton.list-group-item-info .list-group-item-heading {\n  color: inherit;\n}\na.list-group-item-info:hover,\nbutton.list-group-item-info:hover,\na.list-group-item-info:focus,\nbutton.list-group-item-info:focus {\n  color: #31708f;\n  background-color: #c4e3f3;\n}\na.list-group-item-info.active,\nbutton.list-group-item-info.active,\na.list-group-item-info.active:hover,\nbutton.list-group-item-info.active:hover,\na.list-group-item-info.active:focus,\nbutton.list-group-item-info.active:focus {\n  color: #fff;\n  background-color: #31708f;\n  border-color: #31708f;\n}\n.list-group-item-warning {\n  color: #8a6d3b;\n  background-color: #fcf8e3;\n}\na.list-group-item-warning,\nbutton.list-group-item-warning {\n  color: #8a6d3b;\n}\na.list-group-item-warning .list-group-item-heading,\nbutton.list-group-item-warning .list-group-item-heading {\n  color: inherit;\n}\na.list-group-item-warning:hover,\nbutton.list-group-item-warning:hover,\na.list-group-item-warning:focus,\nbutton.list-group-item-warning:focus {\n  color: #8a6d3b;\n  background-color: #faf2cc;\n}\na.list-group-item-warning.active,\nbutton.list-group-item-warning.active,\na.list-group-item-warning.active:hover,\nbutton.list-group-item-warning.active:hover,\na.list-group-item-warning.active:focus,\nbutton.list-group-item-warning.active:focus {\n  color: #fff;\n  background-color: #8a6d3b;\n  border-color: #8a6d3b;\n}\n.list-group-item-danger {\n  color: #a94442;\n  background-color: #f2dede;\n}\na.list-group-item-danger,\nbutton.list-group-item-danger {\n  color: #a94442;\n}\na.list-group-item-danger .list-group-item-heading,\nbutton.list-group-item-danger .list-group-item-heading {\n  color: inherit;\n}\na.list-group-item-danger:hover,\nbutton.list-group-item-danger:hover,\na.list-group-item-danger:focus,\nbutton.list-group-item-danger:focus {\n  color: #a94442;\n  background-color: #ebcccc;\n}\na.list-group-item-danger.active,\nbutton.list-group-item-danger.active,\na.list-group-item-danger.active:hover,\nbutton.list-group-item-danger.active:hover,\na.list-group-item-danger.active:focus,\nbutton.list-group-item-danger.active:focus {\n  color: #fff;\n  background-color: #a94442;\n  border-color: #a94442;\n}\n.list-group-item-heading {\n  margin-top: 0;\n  margin-bottom: 5px;\n}\n.list-group-item-text {\n  margin-bottom: 0;\n  line-height: 1.3;\n}\n.panel {\n  margin-bottom: 20px;\n  background-color: #fff;\n  border: 1px solid transparent;\n  border-radius: 4px;\n  -webkit-box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);\n  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);\n}\n.panel-body {\n  padding: 15px;\n}\n.panel-heading {\n  padding: 10px 15px;\n  border-bottom: 1px solid transparent;\n  border-top-left-radius: 3px;\n  border-top-right-radius: 3px;\n}\n.panel-heading > .dropdown .dropdown-toggle {\n  color: inherit;\n}\n.panel-title {\n  margin-top: 0;\n  margin-bottom: 0;\n  font-size: 16px;\n  color: inherit;\n}\n.panel-title > a,\n.panel-title > small,\n.panel-title > .small,\n.panel-title > small > a,\n.panel-title > .small > a {\n  color: inherit;\n}\n.panel-footer {\n  padding: 10px 15px;\n  background-color: #f5f5f5;\n  border-top: 1px solid #ddd;\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.panel > .list-group,\n.panel > .panel-collapse > .list-group {\n  margin-bottom: 0;\n}\n.panel > .list-group .list-group-item,\n.panel > .panel-collapse > .list-group .list-group-item {\n  border-width: 1px 0;\n  border-radius: 0;\n}\n.panel > .list-group:first-child .list-group-item:first-child,\n.panel > .panel-collapse > .list-group:first-child .list-group-item:first-child {\n  border-top: 0;\n  border-top-left-radius: 3px;\n  border-top-right-radius: 3px;\n}\n.panel > .list-group:last-child .list-group-item:last-child,\n.panel > .panel-collapse > .list-group:last-child .list-group-item:last-child {\n  border-bottom: 0;\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.panel > .panel-heading + .panel-collapse > .list-group .list-group-item:first-child {\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n}\n.panel-heading + .list-group .list-group-item:first-child {\n  border-top-width: 0;\n}\n.list-group + .panel-footer {\n  border-top-width: 0;\n}\n.panel > .table,\n.panel > .table-responsive > .table,\n.panel > .panel-collapse > .table {\n  margin-bottom: 0;\n}\n.panel > .table caption,\n.panel > .table-responsive > .table caption,\n.panel > .panel-collapse > .table caption {\n  padding-right: 15px;\n  padding-left: 15px;\n}\n.panel > .table:first-child,\n.panel > .table-responsive:first-child > .table:first-child {\n  border-top-left-radius: 3px;\n  border-top-right-radius: 3px;\n}\n.panel > .table:first-child > thead:first-child > tr:first-child,\n.panel > .table-responsive:first-child > .table:first-child > thead:first-child > tr:first-child,\n.panel > .table:first-child > tbody:first-child > tr:first-child,\n.panel > .table-responsive:first-child > .table:first-child > tbody:first-child > tr:first-child {\n  border-top-left-radius: 3px;\n  border-top-right-radius: 3px;\n}\n.panel > .table:first-child > thead:first-child > tr:first-child td:first-child,\n.panel > .table-responsive:first-child > .table:first-child > thead:first-child > tr:first-child td:first-child,\n.panel > .table:first-child > tbody:first-child > tr:first-child td:first-child,\n.panel > .table-responsive:first-child > .table:first-child > tbody:first-child > tr:first-child td:first-child,\n.panel > .table:first-child > thead:first-child > tr:first-child th:first-child,\n.panel > .table-responsive:first-child > .table:first-child > thead:first-child > tr:first-child th:first-child,\n.panel > .table:first-child > tbody:first-child > tr:first-child th:first-child,\n.panel > .table-responsive:first-child > .table:first-child > tbody:first-child > tr:first-child th:first-child {\n  border-top-left-radius: 3px;\n}\n.panel > .table:first-child > thead:first-child > tr:first-child td:last-child,\n.panel > .table-responsive:first-child > .table:first-child > thead:first-child > tr:first-child td:last-child,\n.panel > .table:first-child > tbody:first-child > tr:first-child td:last-child,\n.panel > .table-responsive:first-child > .table:first-child > tbody:first-child > tr:first-child td:last-child,\n.panel > .table:first-child > thead:first-child > tr:first-child th:last-child,\n.panel > .table-responsive:first-child > .table:first-child > thead:first-child > tr:first-child th:last-child,\n.panel > .table:first-child > tbody:first-child > tr:first-child th:last-child,\n.panel > .table-responsive:first-child > .table:first-child > tbody:first-child > tr:first-child th:last-child {\n  border-top-right-radius: 3px;\n}\n.panel > .table:last-child,\n.panel > .table-responsive:last-child > .table:last-child {\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.panel > .table:last-child > tbody:last-child > tr:last-child,\n.panel > .table-responsive:last-child > .table:last-child > tbody:last-child > tr:last-child,\n.panel > .table:last-child > tfoot:last-child > tr:last-child,\n.panel > .table-responsive:last-child > .table:last-child > tfoot:last-child > tr:last-child {\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.panel > .table:last-child > tbody:last-child > tr:last-child td:first-child,\n.panel > .table-responsive:last-child > .table:last-child > tbody:last-child > tr:last-child td:first-child,\n.panel > .table:last-child > tfoot:last-child > tr:last-child td:first-child,\n.panel > .table-responsive:last-child > .table:last-child > tfoot:last-child > tr:last-child td:first-child,\n.panel > .table:last-child > tbody:last-child > tr:last-child th:first-child,\n.panel > .table-responsive:last-child > .table:last-child > tbody:last-child > tr:last-child th:first-child,\n.panel > .table:last-child > tfoot:last-child > tr:last-child th:first-child,\n.panel > .table-responsive:last-child > .table:last-child > tfoot:last-child > tr:last-child th:first-child {\n  border-bottom-left-radius: 3px;\n}\n.panel > .table:last-child > tbody:last-child > tr:last-child td:last-child,\n.panel > .table-responsive:last-child > .table:last-child > tbody:last-child > tr:last-child td:last-child,\n.panel > .table:last-child > tfoot:last-child > tr:last-child td:last-child,\n.panel > .table-responsive:last-child > .table:last-child > tfoot:last-child > tr:last-child td:last-child,\n.panel > .table:last-child > tbody:last-child > tr:last-child th:last-child,\n.panel > .table-responsive:last-child > .table:last-child > tbody:last-child > tr:last-child th:last-child,\n.panel > .table:last-child > tfoot:last-child > tr:last-child th:last-child,\n.panel > .table-responsive:last-child > .table:last-child > tfoot:last-child > tr:last-child th:last-child {\n  border-bottom-right-radius: 3px;\n}\n.panel > .panel-body + .table,\n.panel > .panel-body + .table-responsive,\n.panel > .table + .panel-body,\n.panel > .table-responsive + .panel-body {\n  border-top: 1px solid #ddd;\n}\n.panel > .table > tbody:first-child > tr:first-child th,\n.panel > .table > tbody:first-child > tr:first-child td {\n  border-top: 0;\n}\n.panel > .table-bordered,\n.panel > .table-responsive > .table-bordered {\n  border: 0;\n}\n.panel > .table-bordered > thead > tr > th:first-child,\n.panel > .table-responsive > .table-bordered > thead > tr > th:first-child,\n.panel > .table-bordered > tbody > tr > th:first-child,\n.panel > .table-responsive > .table-bordered > tbody > tr > th:first-child,\n.panel > .table-bordered > tfoot > tr > th:first-child,\n.panel > .table-responsive > .table-bordered > tfoot > tr > th:first-child,\n.panel > .table-bordered > thead > tr > td:first-child,\n.panel > .table-responsive > .table-bordered > thead > tr > td:first-child,\n.panel > .table-bordered > tbody > tr > td:first-child,\n.panel > .table-responsive > .table-bordered > tbody > tr > td:first-child,\n.panel > .table-bordered > tfoot > tr > td:first-child,\n.panel > .table-responsive > .table-bordered > tfoot > tr > td:first-child {\n  border-left: 0;\n}\n.panel > .table-bordered > thead > tr > th:last-child,\n.panel > .table-responsive > .table-bordered > thead > tr > th:last-child,\n.panel > .table-bordered > tbody > tr > th:last-child,\n.panel > .table-responsive > .table-bordered > tbody > tr > th:last-child,\n.panel > .table-bordered > tfoot > tr > th:last-child,\n.panel > .table-responsive > .table-bordered > tfoot > tr > th:last-child,\n.panel > .table-bordered > thead > tr > td:last-child,\n.panel > .table-responsive > .table-bordered > thead > tr > td:last-child,\n.panel > .table-bordered > tbody > tr > td:last-child,\n.panel > .table-responsive > .table-bordered > tbody > tr > td:last-child,\n.panel > .table-bordered > tfoot > tr > td:last-child,\n.panel > .table-responsive > .table-bordered > tfoot > tr > td:last-child {\n  border-right: 0;\n}\n.panel > .table-bordered > thead > tr:first-child > td,\n.panel > .table-responsive > .table-bordered > thead > tr:first-child > td,\n.panel > .table-bordered > tbody > tr:first-child > td,\n.panel > .table-responsive > .table-bordered > tbody > tr:first-child > td,\n.panel > .table-bordered > thead > tr:first-child > th,\n.panel > .table-responsive > .table-bordered > thead > tr:first-child > th,\n.panel > .table-bordered > tbody > tr:first-child > th,\n.panel > .table-responsive > .table-bordered > tbody > tr:first-child > th {\n  border-bottom: 0;\n}\n.panel > .table-bordered > tbody > tr:last-child > td,\n.panel > .table-responsive > .table-bordered > tbody > tr:last-child > td,\n.panel > .table-bordered > tfoot > tr:last-child > td,\n.panel > .table-responsive > .table-bordered > tfoot > tr:last-child > td,\n.panel > .table-bordered > tbody > tr:last-child > th,\n.panel > .table-responsive > .table-bordered > tbody > tr:last-child > th,\n.panel > .table-bordered > tfoot > tr:last-child > th,\n.panel > .table-responsive > .table-bordered > tfoot > tr:last-child > th {\n  border-bottom: 0;\n}\n.panel > .table-responsive {\n  margin-bottom: 0;\n  border: 0;\n}\n.panel-group {\n  margin-bottom: 20px;\n}\n.panel-group .panel {\n  margin-bottom: 0;\n  border-radius: 4px;\n}\n.panel-group .panel + .panel {\n  margin-top: 5px;\n}\n.panel-group .panel-heading {\n  border-bottom: 0;\n}\n.panel-group .panel-heading + .panel-collapse > .panel-body,\n.panel-group .panel-heading + .panel-collapse > .list-group {\n  border-top: 1px solid #ddd;\n}\n.panel-group .panel-footer {\n  border-top: 0;\n}\n.panel-group .panel-footer + .panel-collapse .panel-body {\n  border-bottom: 1px solid #ddd;\n}\n.panel-default {\n  border-color: #ddd;\n}\n.panel-default > .panel-heading {\n  color: #333333;\n  background-color: #f5f5f5;\n  border-color: #ddd;\n}\n.panel-default > .panel-heading + .panel-collapse > .panel-body {\n  border-top-color: #ddd;\n}\n.panel-default > .panel-heading .badge {\n  color: #f5f5f5;\n  background-color: #333333;\n}\n.panel-default > .panel-footer + .panel-collapse > .panel-body {\n  border-bottom-color: #ddd;\n}\n.panel-primary {\n  border-color: #337ab7;\n}\n.panel-primary > .panel-heading {\n  color: #fff;\n  background-color: #337ab7;\n  border-color: #337ab7;\n}\n.panel-primary > .panel-heading + .panel-collapse > .panel-body {\n  border-top-color: #337ab7;\n}\n.panel-primary > .panel-heading .badge {\n  color: #337ab7;\n  background-color: #fff;\n}\n.panel-primary > .panel-footer + .panel-collapse > .panel-body {\n  border-bottom-color: #337ab7;\n}\n.panel-success {\n  border-color: #d6e9c6;\n}\n.panel-success > .panel-heading {\n  color: #3c763d;\n  background-color: #dff0d8;\n  border-color: #d6e9c6;\n}\n.panel-success > .panel-heading + .panel-collapse > .panel-body {\n  border-top-color: #d6e9c6;\n}\n.panel-success > .panel-heading .badge {\n  color: #dff0d8;\n  background-color: #3c763d;\n}\n.panel-success > .panel-footer + .panel-collapse > .panel-body {\n  border-bottom-color: #d6e9c6;\n}\n.panel-info {\n  border-color: #bce8f1;\n}\n.panel-info > .panel-heading {\n  color: #31708f;\n  background-color: #d9edf7;\n  border-color: #bce8f1;\n}\n.panel-info > .panel-heading + .panel-collapse > .panel-body {\n  border-top-color: #bce8f1;\n}\n.panel-info > .panel-heading .badge {\n  color: #d9edf7;\n  background-color: #31708f;\n}\n.panel-info > .panel-footer + .panel-collapse > .panel-body {\n  border-bottom-color: #bce8f1;\n}\n.panel-warning {\n  border-color: #faebcc;\n}\n.panel-warning > .panel-heading {\n  color: #8a6d3b;\n  background-color: #fcf8e3;\n  border-color: #faebcc;\n}\n.panel-warning > .panel-heading + .panel-collapse > .panel-body {\n  border-top-color: #faebcc;\n}\n.panel-warning > .panel-heading .badge {\n  color: #fcf8e3;\n  background-color: #8a6d3b;\n}\n.panel-warning > .panel-footer + .panel-collapse > .panel-body {\n  border-bottom-color: #faebcc;\n}\n.panel-danger {\n  border-color: #ebccd1;\n}\n.panel-danger > .panel-heading {\n  color: #a94442;\n  background-color: #f2dede;\n  border-color: #ebccd1;\n}\n.panel-danger > .panel-heading + .panel-collapse > .panel-body {\n  border-top-color: #ebccd1;\n}\n.panel-danger > .panel-heading .badge {\n  color: #f2dede;\n  background-color: #a94442;\n}\n.panel-danger > .panel-footer + .panel-collapse > .panel-body {\n  border-bottom-color: #ebccd1;\n}\n.embed-responsive {\n  position: relative;\n  display: block;\n  height: 0;\n  padding: 0;\n  overflow: hidden;\n}\n.embed-responsive .embed-responsive-item,\n.embed-responsive iframe,\n.embed-responsive embed,\n.embed-responsive object,\n.embed-responsive video {\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  border: 0;\n}\n.embed-responsive-16by9 {\n  padding-bottom: 56.25%;\n}\n.embed-responsive-4by3 {\n  padding-bottom: 75%;\n}\n.well {\n  min-height: 20px;\n  padding: 19px;\n  margin-bottom: 20px;\n  background-color: #f5f5f5;\n  border: 1px solid #e3e3e3;\n  border-radius: 4px;\n  -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.05);\n  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.05);\n}\n.well blockquote {\n  border-color: #ddd;\n  border-color: rgba(0, 0, 0, 0.15);\n}\n.well-lg {\n  padding: 24px;\n  border-radius: 6px;\n}\n.well-sm {\n  padding: 9px;\n  border-radius: 3px;\n}\n.close {\n  float: right;\n  font-size: 21px;\n  font-weight: bold;\n  line-height: 1;\n  color: #000;\n  text-shadow: 0 1px 0 #fff;\n  filter: alpha(opacity=20);\n  opacity: 0.2;\n}\n.close:hover,\n.close:focus {\n  color: #000;\n  text-decoration: none;\n  cursor: pointer;\n  filter: alpha(opacity=50);\n  opacity: 0.5;\n}\nbutton.close {\n  padding: 0;\n  cursor: pointer;\n  background: transparent;\n  border: 0;\n  -webkit-appearance: none;\n  -moz-appearance: none;\n  appearance: none;\n}\n.modal-open {\n  overflow: hidden;\n}\n.modal {\n  position: fixed;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  z-index: 1050;\n  display: none;\n  overflow: hidden;\n  -webkit-overflow-scrolling: touch;\n  outline: 0;\n}\n.modal.fade .modal-dialog {\n  -webkit-transform: translate(0, -25%);\n  -ms-transform: translate(0, -25%);\n  -o-transform: translate(0, -25%);\n  transform: translate(0, -25%);\n  -webkit-transition: -webkit-transform 0.3s ease-out;\n  -o-transition: -o-transform 0.3s ease-out;\n  transition: -webkit-transform 0.3s ease-out;\n  transition: transform 0.3s ease-out;\n  transition: transform 0.3s ease-out, -webkit-transform 0.3s ease-out, -o-transform 0.3s ease-out;\n}\n.modal.in .modal-dialog {\n  -webkit-transform: translate(0, 0);\n  -ms-transform: translate(0, 0);\n  -o-transform: translate(0, 0);\n  transform: translate(0, 0);\n}\n.modal-open .modal {\n  overflow-x: hidden;\n  overflow-y: auto;\n}\n.modal-dialog {\n  position: relative;\n  width: auto;\n  margin: 10px;\n}\n.modal-content {\n  position: relative;\n  background-color: #fff;\n  background-clip: padding-box;\n  border: 1px solid #999;\n  border: 1px solid rgba(0, 0, 0, 0.2);\n  border-radius: 6px;\n  -webkit-box-shadow: 0 3px 9px rgba(0, 0, 0, 0.5);\n  box-shadow: 0 3px 9px rgba(0, 0, 0, 0.5);\n  outline: 0;\n}\n.modal-backdrop {\n  position: fixed;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  z-index: 1040;\n  background-color: #000;\n}\n.modal-backdrop.fade {\n  filter: alpha(opacity=0);\n  opacity: 0;\n}\n.modal-backdrop.in {\n  filter: alpha(opacity=50);\n  opacity: 0.5;\n}\n.modal-header {\n  padding: 15px;\n  border-bottom: 1px solid #e5e5e5;\n}\n.modal-header .close {\n  margin-top: -2px;\n}\n.modal-title {\n  margin: 0;\n  line-height: 1.42857143;\n}\n.modal-body {\n  position: relative;\n  padding: 15px;\n}\n.modal-footer {\n  padding: 15px;\n  text-align: right;\n  border-top: 1px solid #e5e5e5;\n}\n.modal-footer .btn + .btn {\n  margin-bottom: 0;\n  margin-left: 5px;\n}\n.modal-footer .btn-group .btn + .btn {\n  margin-left: -1px;\n}\n.modal-footer .btn-block + .btn-block {\n  margin-left: 0;\n}\n.modal-scrollbar-measure {\n  position: absolute;\n  top: -9999px;\n  width: 50px;\n  height: 50px;\n  overflow: scroll;\n}\n@media (min-width: 768px) {\n  .modal-dialog {\n    width: 600px;\n    margin: 30px auto;\n  }\n\n  .modal-content {\n    -webkit-box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);\n    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);\n  }\n\n  .modal-sm {\n    width: 300px;\n  }\n}\n@media (min-width: 992px) {\n  .modal-lg {\n    width: 900px;\n  }\n}\n.tooltip {\n  position: absolute;\n  z-index: 1070;\n  display: block;\n  font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n  font-style: normal;\n  font-weight: 400;\n  line-height: 1.42857143;\n  line-break: auto;\n  text-align: left;\n  text-align: start;\n  text-decoration: none;\n  text-shadow: none;\n  text-transform: none;\n  letter-spacing: normal;\n  word-break: normal;\n  word-spacing: normal;\n  word-wrap: normal;\n  white-space: normal;\n  font-size: 12px;\n  filter: alpha(opacity=0);\n  opacity: 0;\n}\n.tooltip.in {\n  filter: alpha(opacity=90);\n  opacity: 0.9;\n}\n.tooltip.top {\n  padding: 5px 0;\n  margin-top: -3px;\n}\n.tooltip.right {\n  padding: 0 5px;\n  margin-left: 3px;\n}\n.tooltip.bottom {\n  padding: 5px 0;\n  margin-top: 3px;\n}\n.tooltip.left {\n  padding: 0 5px;\n  margin-left: -3px;\n}\n.tooltip.top .tooltip-arrow {\n  bottom: 0;\n  left: 50%;\n  margin-left: -5px;\n  border-width: 5px 5px 0;\n  border-top-color: #000;\n}\n.tooltip.top-left .tooltip-arrow {\n  right: 5px;\n  bottom: 0;\n  margin-bottom: -5px;\n  border-width: 5px 5px 0;\n  border-top-color: #000;\n}\n.tooltip.top-right .tooltip-arrow {\n  bottom: 0;\n  left: 5px;\n  margin-bottom: -5px;\n  border-width: 5px 5px 0;\n  border-top-color: #000;\n}\n.tooltip.right .tooltip-arrow {\n  top: 50%;\n  left: 0;\n  margin-top: -5px;\n  border-width: 5px 5px 5px 0;\n  border-right-color: #000;\n}\n.tooltip.left .tooltip-arrow {\n  top: 50%;\n  right: 0;\n  margin-top: -5px;\n  border-width: 5px 0 5px 5px;\n  border-left-color: #000;\n}\n.tooltip.bottom .tooltip-arrow {\n  top: 0;\n  left: 50%;\n  margin-left: -5px;\n  border-width: 0 5px 5px;\n  border-bottom-color: #000;\n}\n.tooltip.bottom-left .tooltip-arrow {\n  top: 0;\n  right: 5px;\n  margin-top: -5px;\n  border-width: 0 5px 5px;\n  border-bottom-color: #000;\n}\n.tooltip.bottom-right .tooltip-arrow {\n  top: 0;\n  left: 5px;\n  margin-top: -5px;\n  border-width: 0 5px 5px;\n  border-bottom-color: #000;\n}\n.tooltip-inner {\n  max-width: 200px;\n  padding: 3px 8px;\n  color: #fff;\n  text-align: center;\n  background-color: #000;\n  border-radius: 4px;\n}\n.tooltip-arrow {\n  position: absolute;\n  width: 0;\n  height: 0;\n  border-color: transparent;\n  border-style: solid;\n}\n.popover {\n  position: absolute;\n  top: 0;\n  left: 0;\n  z-index: 1060;\n  display: none;\n  max-width: 276px;\n  padding: 1px;\n  font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n  font-style: normal;\n  font-weight: 400;\n  line-height: 1.42857143;\n  line-break: auto;\n  text-align: left;\n  text-align: start;\n  text-decoration: none;\n  text-shadow: none;\n  text-transform: none;\n  letter-spacing: normal;\n  word-break: normal;\n  word-spacing: normal;\n  word-wrap: normal;\n  white-space: normal;\n  font-size: 14px;\n  background-color: #fff;\n  background-clip: padding-box;\n  border: 1px solid #ccc;\n  border: 1px solid rgba(0, 0, 0, 0.2);\n  border-radius: 6px;\n  -webkit-box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);\n  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);\n}\n.popover.top {\n  margin-top: -10px;\n}\n.popover.right {\n  margin-left: 10px;\n}\n.popover.bottom {\n  margin-top: 10px;\n}\n.popover.left {\n  margin-left: -10px;\n}\n.popover > .arrow {\n  border-width: 11px;\n}\n.popover > .arrow,\n.popover > .arrow:after {\n  position: absolute;\n  display: block;\n  width: 0;\n  height: 0;\n  border-color: transparent;\n  border-style: solid;\n}\n.popover > .arrow:after {\n  content: \"\";\n  border-width: 10px;\n}\n.popover.top > .arrow {\n  bottom: -11px;\n  left: 50%;\n  margin-left: -11px;\n  border-top-color: #999999;\n  border-top-color: rgba(0, 0, 0, 0.25);\n  border-bottom-width: 0;\n}\n.popover.top > .arrow:after {\n  bottom: 1px;\n  margin-left: -10px;\n  content: \" \";\n  border-top-color: #fff;\n  border-bottom-width: 0;\n}\n.popover.right > .arrow {\n  top: 50%;\n  left: -11px;\n  margin-top: -11px;\n  border-right-color: #999999;\n  border-right-color: rgba(0, 0, 0, 0.25);\n  border-left-width: 0;\n}\n.popover.right > .arrow:after {\n  bottom: -10px;\n  left: 1px;\n  content: \" \";\n  border-right-color: #fff;\n  border-left-width: 0;\n}\n.popover.bottom > .arrow {\n  top: -11px;\n  left: 50%;\n  margin-left: -11px;\n  border-top-width: 0;\n  border-bottom-color: #999999;\n  border-bottom-color: rgba(0, 0, 0, 0.25);\n}\n.popover.bottom > .arrow:after {\n  top: 1px;\n  margin-left: -10px;\n  content: \" \";\n  border-top-width: 0;\n  border-bottom-color: #fff;\n}\n.popover.left > .arrow {\n  top: 50%;\n  right: -11px;\n  margin-top: -11px;\n  border-right-width: 0;\n  border-left-color: #999999;\n  border-left-color: rgba(0, 0, 0, 0.25);\n}\n.popover.left > .arrow:after {\n  right: 1px;\n  bottom: -10px;\n  content: \" \";\n  border-right-width: 0;\n  border-left-color: #fff;\n}\n.popover-title {\n  padding: 8px 14px;\n  margin: 0;\n  font-size: 14px;\n  background-color: #f7f7f7;\n  border-bottom: 1px solid #ebebeb;\n  border-radius: 5px 5px 0 0;\n}\n.popover-content {\n  padding: 9px 14px;\n}\n.carousel {\n  position: relative;\n}\n.carousel-inner {\n  position: relative;\n  width: 100%;\n  overflow: hidden;\n}\n.carousel-inner > .item {\n  position: relative;\n  display: none;\n  -webkit-transition: 0.6s ease-in-out left;\n  -o-transition: 0.6s ease-in-out left;\n  transition: 0.6s ease-in-out left;\n}\n.carousel-inner > .item > img,\n.carousel-inner > .item > a > img {\n  line-height: 1;\n}\n@media all and (transform-3d), (-webkit-transform-3d) {\n  .carousel-inner > .item {\n    -webkit-transition: -webkit-transform 0.6s ease-in-out;\n    -o-transition: -o-transform 0.6s ease-in-out;\n    transition: -webkit-transform 0.6s ease-in-out;\n    transition: transform 0.6s ease-in-out;\n    transition: transform 0.6s ease-in-out, -webkit-transform 0.6s ease-in-out, -o-transform 0.6s ease-in-out;\n    -webkit-backface-visibility: hidden;\n    backface-visibility: hidden;\n    -webkit-perspective: 1000px;\n    perspective: 1000px;\n  }\n\n  .carousel-inner > .item.next,\n  .carousel-inner > .item.active.right {\n    -webkit-transform: translate3d(100%, 0, 0);\n    transform: translate3d(100%, 0, 0);\n    left: 0;\n  }\n\n  .carousel-inner > .item.prev,\n  .carousel-inner > .item.active.left {\n    -webkit-transform: translate3d(-100%, 0, 0);\n    transform: translate3d(-100%, 0, 0);\n    left: 0;\n  }\n\n  .carousel-inner > .item.next.left,\n  .carousel-inner > .item.prev.right,\n  .carousel-inner > .item.active {\n    -webkit-transform: translate3d(0, 0, 0);\n    transform: translate3d(0, 0, 0);\n    left: 0;\n  }\n}\n.carousel-inner > .active,\n.carousel-inner > .next,\n.carousel-inner > .prev {\n  display: block;\n}\n.carousel-inner > .active {\n  left: 0;\n}\n.carousel-inner > .next,\n.carousel-inner > .prev {\n  position: absolute;\n  top: 0;\n  width: 100%;\n}\n.carousel-inner > .next {\n  left: 100%;\n}\n.carousel-inner > .prev {\n  left: -100%;\n}\n.carousel-inner > .next.left,\n.carousel-inner > .prev.right {\n  left: 0;\n}\n.carousel-inner > .active.left {\n  left: -100%;\n}\n.carousel-inner > .active.right {\n  left: 100%;\n}\n.carousel-control {\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  width: 15%;\n  font-size: 20px;\n  color: #fff;\n  text-align: center;\n  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);\n  background-color: rgba(0, 0, 0, 0);\n  filter: alpha(opacity=50);\n  opacity: 0.5;\n}\n.carousel-control.left {\n  background-image: -webkit-linear-gradient(left, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.0001) 100%);\n  background-image: -o-linear-gradient(left, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.0001) 100%);\n  background-image: -webkit-gradient(linear, left top, right top, from(rgba(0, 0, 0, 0.5)), to(rgba(0, 0, 0, 0.0001)));\n  background-image: linear-gradient(to right, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.0001) 100%);\n  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#80000000', endColorstr='#00000000', GradientType=1);\n  background-repeat: repeat-x;\n}\n.carousel-control.right {\n  right: 0;\n  left: auto;\n  background-image: -webkit-linear-gradient(left, rgba(0, 0, 0, 0.0001) 0%, rgba(0, 0, 0, 0.5) 100%);\n  background-image: -o-linear-gradient(left, rgba(0, 0, 0, 0.0001) 0%, rgba(0, 0, 0, 0.5) 100%);\n  background-image: -webkit-gradient(linear, left top, right top, from(rgba(0, 0, 0, 0.0001)), to(rgba(0, 0, 0, 0.5)));\n  background-image: linear-gradient(to right, rgba(0, 0, 0, 0.0001) 0%, rgba(0, 0, 0, 0.5) 100%);\n  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#00000000', endColorstr='#80000000', GradientType=1);\n  background-repeat: repeat-x;\n}\n.carousel-control:hover,\n.carousel-control:focus {\n  color: #fff;\n  text-decoration: none;\n  outline: 0;\n  filter: alpha(opacity=90);\n  opacity: 0.9;\n}\n.carousel-control .icon-prev,\n.carousel-control .icon-next,\n.carousel-control .glyphicon-chevron-left,\n.carousel-control .glyphicon-chevron-right {\n  position: absolute;\n  top: 50%;\n  z-index: 5;\n  display: inline-block;\n  margin-top: -10px;\n}\n.carousel-control .icon-prev,\n.carousel-control .glyphicon-chevron-left {\n  left: 50%;\n  margin-left: -10px;\n}\n.carousel-control .icon-next,\n.carousel-control .glyphicon-chevron-right {\n  right: 50%;\n  margin-right: -10px;\n}\n.carousel-control .icon-prev,\n.carousel-control .icon-next {\n  width: 20px;\n  height: 20px;\n  font-family: serif;\n  line-height: 1;\n}\n.carousel-control .icon-prev:before {\n  content: \"\\2039\";\n}\n.carousel-control .icon-next:before {\n  content: \"\\203a\";\n}\n.carousel-indicators {\n  position: absolute;\n  bottom: 10px;\n  left: 50%;\n  z-index: 15;\n  width: 60%;\n  padding-left: 0;\n  margin-left: -30%;\n  text-align: center;\n  list-style: none;\n}\n.carousel-indicators li {\n  display: inline-block;\n  width: 10px;\n  height: 10px;\n  margin: 1px;\n  text-indent: -999px;\n  cursor: pointer;\n  background-color: #000 \\9;\n  background-color: rgba(0, 0, 0, 0);\n  border: 1px solid #fff;\n  border-radius: 10px;\n}\n.carousel-indicators .active {\n  width: 12px;\n  height: 12px;\n  margin: 0;\n  background-color: #fff;\n}\n.carousel-caption {\n  position: absolute;\n  right: 15%;\n  bottom: 20px;\n  left: 15%;\n  z-index: 10;\n  padding-top: 20px;\n  padding-bottom: 20px;\n  color: #fff;\n  text-align: center;\n  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);\n}\n.carousel-caption .btn {\n  text-shadow: none;\n}\n@media screen and (min-width: 768px) {\n  .carousel-control .glyphicon-chevron-left,\n  .carousel-control .glyphicon-chevron-right,\n  .carousel-control .icon-prev,\n  .carousel-control .icon-next {\n    width: 30px;\n    height: 30px;\n    margin-top: -10px;\n    font-size: 30px;\n  }\n\n  .carousel-control .glyphicon-chevron-left,\n  .carousel-control .icon-prev {\n    margin-left: -10px;\n  }\n\n  .carousel-control .glyphicon-chevron-right,\n  .carousel-control .icon-next {\n    margin-right: -10px;\n  }\n\n  .carousel-caption {\n    right: 20%;\n    left: 20%;\n    padding-bottom: 30px;\n  }\n\n  .carousel-indicators {\n    bottom: 20px;\n  }\n}\n.clearfix:before,\n.clearfix:after,\n.dl-horizontal dd:before,\n.dl-horizontal dd:after,\n.container:before,\n.container:after,\n.container-fluid:before,\n.container-fluid:after,\n.row:before,\n.row:after,\n.form-horizontal .form-group:before,\n.form-horizontal .form-group:after,\n.btn-toolbar:before,\n.btn-toolbar:after,\n.btn-group-vertical > .btn-group:before,\n.btn-group-vertical > .btn-group:after,\n.nav:before,\n.nav:after,\n.navbar:before,\n.navbar:after,\n.navbar-header:before,\n.navbar-header:after,\n.navbar-collapse:before,\n.navbar-collapse:after,\n.pager:before,\n.pager:after,\n.panel-body:before,\n.panel-body:after,\n.modal-header:before,\n.modal-header:after,\n.modal-footer:before,\n.modal-footer:after {\n  display: table;\n  content: \" \";\n}\n.clearfix:after,\n.dl-horizontal dd:after,\n.container:after,\n.container-fluid:after,\n.row:after,\n.form-horizontal .form-group:after,\n.btn-toolbar:after,\n.btn-group-vertical > .btn-group:after,\n.nav:after,\n.navbar:after,\n.navbar-header:after,\n.navbar-collapse:after,\n.pager:after,\n.panel-body:after,\n.modal-header:after,\n.modal-footer:after {\n  clear: both;\n}\n.center-block {\n  display: block;\n  margin-right: auto;\n  margin-left: auto;\n}\n.pull-right {\n  float: right !important;\n}\n.pull-left {\n  float: left !important;\n}\n.hide {\n  display: none !important;\n}\n.show {\n  display: block !important;\n}\n.invisible {\n  visibility: hidden;\n}\n.text-hide {\n  font: 0/0 a;\n  color: transparent;\n  text-shadow: none;\n  background-color: transparent;\n  border: 0;\n}\n.hidden {\n  display: none !important;\n}\n.affix {\n  position: fixed;\n}\n@-ms-viewport {\n  width: device-width;\n}\n.visible-xs,\n.visible-sm,\n.visible-md,\n.visible-lg {\n  display: none !important;\n}\n.visible-xs-block,\n.visible-xs-inline,\n.visible-xs-inline-block,\n.visible-sm-block,\n.visible-sm-inline,\n.visible-sm-inline-block,\n.visible-md-block,\n.visible-md-inline,\n.visible-md-inline-block,\n.visible-lg-block,\n.visible-lg-inline,\n.visible-lg-inline-block {\n  display: none !important;\n}\n@media (max-width: 767px) {\n  .visible-xs {\n    display: block !important;\n  }\n\n  table.visible-xs {\n    display: table !important;\n  }\n\n  tr.visible-xs {\n    display: table-row !important;\n  }\n\n  th.visible-xs,\n  td.visible-xs {\n    display: table-cell !important;\n  }\n}\n@media (max-width: 767px) {\n  .visible-xs-block {\n    display: block !important;\n  }\n}\n@media (max-width: 767px) {\n  .visible-xs-inline {\n    display: inline !important;\n  }\n}\n@media (max-width: 767px) {\n  .visible-xs-inline-block {\n    display: inline-block !important;\n  }\n}\n@media (min-width: 768px) and (max-width: 991px) {\n  .visible-sm {\n    display: block !important;\n  }\n\n  table.visible-sm {\n    display: table !important;\n  }\n\n  tr.visible-sm {\n    display: table-row !important;\n  }\n\n  th.visible-sm,\n  td.visible-sm {\n    display: table-cell !important;\n  }\n}\n@media (min-width: 768px) and (max-width: 991px) {\n  .visible-sm-block {\n    display: block !important;\n  }\n}\n@media (min-width: 768px) and (max-width: 991px) {\n  .visible-sm-inline {\n    display: inline !important;\n  }\n}\n@media (min-width: 768px) and (max-width: 991px) {\n  .visible-sm-inline-block {\n    display: inline-block !important;\n  }\n}\n@media (min-width: 992px) and (max-width: 1199px) {\n  .visible-md {\n    display: block !important;\n  }\n\n  table.visible-md {\n    display: table !important;\n  }\n\n  tr.visible-md {\n    display: table-row !important;\n  }\n\n  th.visible-md,\n  td.visible-md {\n    display: table-cell !important;\n  }\n}\n@media (min-width: 992px) and (max-width: 1199px) {\n  .visible-md-block {\n    display: block !important;\n  }\n}\n@media (min-width: 992px) and (max-width: 1199px) {\n  .visible-md-inline {\n    display: inline !important;\n  }\n}\n@media (min-width: 992px) and (max-width: 1199px) {\n  .visible-md-inline-block {\n    display: inline-block !important;\n  }\n}\n@media (min-width: 1200px) {\n  .visible-lg {\n    display: block !important;\n  }\n\n  table.visible-lg {\n    display: table !important;\n  }\n\n  tr.visible-lg {\n    display: table-row !important;\n  }\n\n  th.visible-lg,\n  td.visible-lg {\n    display: table-cell !important;\n  }\n}\n@media (min-width: 1200px) {\n  .visible-lg-block {\n    display: block !important;\n  }\n}\n@media (min-width: 1200px) {\n  .visible-lg-inline {\n    display: inline !important;\n  }\n}\n@media (min-width: 1200px) {\n  .visible-lg-inline-block {\n    display: inline-block !important;\n  }\n}\n@media (max-width: 767px) {\n  .hidden-xs {\n    display: none !important;\n  }\n}\n@media (min-width: 768px) and (max-width: 991px) {\n  .hidden-sm {\n    display: none !important;\n  }\n}\n@media (min-width: 992px) and (max-width: 1199px) {\n  .hidden-md {\n    display: none !important;\n  }\n}\n@media (min-width: 1200px) {\n  .hidden-lg {\n    display: none !important;\n  }\n}\n.visible-print {\n  display: none !important;\n}\n@media print {\n  .visible-print {\n    display: block !important;\n  }\n\n  table.visible-print {\n    display: table !important;\n  }\n\n  tr.visible-print {\n    display: table-row !important;\n  }\n\n  th.visible-print,\n  td.visible-print {\n    display: table-cell !important;\n  }\n}\n.visible-print-block {\n  display: none !important;\n}\n@media print {\n  .visible-print-block {\n    display: block !important;\n  }\n}\n.visible-print-inline {\n  display: none !important;\n}\n@media print {\n  .visible-print-inline {\n    display: inline !important;\n  }\n}\n.visible-print-inline-block {\n  display: none !important;\n}\n@media print {\n  .visible-print-inline-block {\n    display: inline-block !important;\n  }\n}\n@media print {\n  .hidden-print {\n    display: none !important;\n  }\n}\n/*# sourceMappingURL=bootstrap.css.map */\n.widget-text {\n  font-size: 15px;\n  font-family: 'Century Gothic';\n}\n.widget-table {\n  padding: 0px 5px 0px 5px;\n}\n.widget {\n  width: 375px;\n  height: 265px;\n  background: white;\n  border: 1px solid #ccc;\n}\n.widget-title {\n  margin-left: 4px;\n}\n.widget {\n  width: 375px;\n  height: 365px;\n  background: #fff;\n  border: 1px solid #ccc;\n}\n.widget-clean {\n  width: 270px;\n  height: auto;\n  background: #fff;\n  border: 1px solid #ccc;\n}\n.widget-header {\n  height: 30px;\n  width: 100%;\n  padding-top: 3px;\n  padding-left: 5px;\n  background: #eee;\n  border-bottom: 1px solid #ccc;\n  cursor: move;\n}\n.widget-body {\n  padding: 0 1px 0 1px;\n  position: relative;\n}\n.widget-title {\n  display: inline-block;\n  font-size: 16px;\n}\n.widget-border {\n  background: #fff;\n  border: 1px solid #ccc;\n}\n.ss-container {\n  position: relative;\n}\n.ss-container>div {\n  position: absolute;\n}\n.ss-container>div[data-ss-colspan='2'] {\n  width: 170px;\n}\n.ss-container .ss-placeholder-child {\n  background: transparent;\n  border: 1px dashed #333;\n  z-index: -5;\n}\n.ss-trash {\n  position: relative;\n  border: 1px solid #555;\n  height: 100px;\n  padding-top: 2.5em;\n  text-align: center;\n}\n.ss-trash>div {\n  position: absolute;\n}\n.ss-trash>div[data-ss-colspan='2'] {\n  width: 170px;\n}\n.ss-trash .ss-placeholder-child {\n  background: transparent;\n  border: 1px dashed #333;\n  z-index: -5;\n}\n.trash-glow-on {\n  border: 2px solid red!important;\n  -moz-transition: border 1s;\n  -webkit-transition: border 1s;\n  -o-transition: border 1s;\n  transition: border 1s;\n}\n.trash-glow-off {\n  border: 2px solid #555!important;\n  -moz-transition: border 2s;\n  -webkit-transition: border 2s;\n  -o-transition: border 2s;\n  transition: border 2s;\n}\n.trashing {\n  border: 1px solid #bf3131!important;\n}\n.trashing\n\n.widget-header {\n  background-color: #bf3131!important;\n}\n.widget-body .chart-checkboxes {\n  position: absolute;\n  top: 30px;\n  right: 10px;\n}\n.chart-container {\n  position: relative;\n  padding-top: 10px;\n  padding-right: 10px;\n}\n.chart-container-clean {\n  position: relative;\n  padding-left: 4px;\n  padding-right: 4px;\n  margin-bottom: 20px;\n}\n.chart-body {\n  height: 280px;\n}\n.chart-container-clean .chart-body {\n  height: 60px;\n}\n.chart-title {\n  display: inline-block;\n  font-size: 16px;\n}\n.chart-checkboxes {\n  background-color: #fff;\n  padding-left: 7px;\n  z-index: 4;\n}\n.chart-checkboxes .checkbox {\n  margin-right: 12px;\n  margin-bottom: 0;\n}\n"; (require("browserify-css").createStyle(css, { "href": "css\\main.css" }, { "insertAt": "bottom" })); module.exports = css;
},{"browserify-css":73}],40:[function(require,module,exports){
'use strict';
var chart_widget = require('../speed-direction-chart-widget');
var model = function(){
    return {
      row: null,
      parsed: function(row){
        row.timestamp = Date.parse(row.hour);
        return row;
      },
      timestamp: function(parsed){
          return parsed.timestamp;
      },
      waterTemperature: function(parsed){
        return {timestamp: parsed.timestamp, waterTemperature: parsed.WaterTemperature};
      },
      waveHeight: function(parsed){
        return {timestamp: parsed.timestamp, waveHeight: parsed.WaveHeight};
      },
      wavePeriod: function(parsed){
        return {timestamp: parsed.timestamp, wavePeriod: parsed.WavePeriod};
      },
      windSpeed: function(parsed){
        return {timestamp: parsed.timestamp, windSpeed: parsed.AverageWindSpeed};
      },
      windDirection: function(parsed){
        return {timestamp: parsed.timestamp, windDirection: parsed.WindDirection};
      },
      windGustSpeed: function(parsed){
        return {timestamp: parsed.timestamp, windGustSpeed: parsed.GustSpeed};
      },
      windGustDirection: function(parsed){
        return {timestamp: parsed.timestamp, windGustDirection: parsed.WindGustDirection};
      },
  };
}
var available_components = ["location","title","latest","waterTemperature","waveHeight","wavePeriod","windSpeed","windDirection","windGustSpeed","windGustDirection"];
var widget = function(location,elid,options){
  options = options || {};
  options.components = options.components || available_components;
  var stockcomponents = {
    "waterTemperature": {field: "waterTemperature", title: "Water Temperature", units: "&deg;C"},
    "waveHeight": {field: "waveHeight", title: "Wave Height", units: "m"},
    "wavePeriod": {field: "wavePeriod", title: "Wave Period", units: "s"},
    "windSpeed": {field: "windSpeed", title: "Wind Speed", units: "knots"},
    "windDirection": {field: "windDirection", title: "Wind Direction", units: "degrees", directional: true},
    "windGustSpeed": {field: "windGustSpeed", title: "Wind Gust Speed", units: "knots"},
    "windGustDirection": {field: "windGustDirection", title: "Wind Gust Direction", units: "degrees", directional: true},
  }
  var stockcharts = []
  var components = {};
  for(var i=0;i<options.components.length;i++){
    if(location.metocean[options.components[i]]){
      components[options.components[i]] = true;
      var wanted = stockcomponents[options.components[i]];
      if(wanted) stockcharts.push(wanted);
    }
  }
  var d = new Date();
  d.setDate(d.getDate() - 3);
  var start_date = d.toISOString();
  var url = "//cilpublic.cil.ie/MetOcean/MetOcean.ashx?accesstoken=B9EF21E2-C563-4C07-94E9-198AF132C447&MMSI="+location.mmsi+"&FromDate="+start_date;
  return new chart_widget(elid,{
                namespace: "cilmetocean"+location.key,
                title: components.title?location.type:false,
                location: components.location?location:false,
                model: model(),
                stockcharts: stockcharts,
                latest: components.latest?true:false,
                onModelReady: options.onModelReady,
                preload: {
                    url: url,
                    source: "MetOceanData",
                    target: "row"
                }
     });
};
exports.model = model;
exports.widget = widget;
exports.components = available_components;

},{"../speed-direction-chart-widget":64}],41:[function(require,module,exports){
'use strict';

const locations = require("./cil.locations").locations;

exports.metocean = require("./cil.metocean");
exports.meta = {
  key:"cil",
  name: "Commissioner of Irish Lights",
  description: "We are a maritime organisation \
  delivering an essential safety service around \
  the coast of Ireland, protecting the marine environment, \
  and supporting the marine industry and coastal communities.",
  url: "http://www.irishlights.ie/",
  icon: null,
  logo: "http://www.irishlights.ie/media/48896/IrishLights.png",
  types:  [ "metocean" ],
  locations: locations,
}

},{"./cil.locations":42,"./cil.metocean":43}],42:[function(require,module,exports){
'use strict';
var locations = {
dublinbay: {key: "dublinbay", metocean: {location: true, title: true, latest: true, waterTemperature: true, waveHeight:true, wavePeriod: true, windSpeed: true, windGustSpeed: true,windDirection: true, windGustDirection: true}, mmsi: "992501301", name: "Dublin Bay Buoy"},
fastnet: {key: "fastnet", metocean: {location: true, title: true, latest: true, waterTemperature: false, waveHeight:false, wavePeriod: false, windSpeed: true, windGustSpeed: true,windDirection: true, windGustDirection: true}, mmsi: "992501123", name: "Fastnet"},
coningbeg: {key: "coningbeg", metocean: {location: true, title: true, latest: true, waterTemperature: false, waveHeight:false, wavePeriod: false, windSpeed: true, windGustSpeed: true, windDirection: true, windGustDirection: false}, mmsi: "992501074", name: "Coningbeg"},
splaugh: {key: "splaugh", metocean: {location: true, title: true, latest: true, waterTemperature: true, waveHeight:true, wavePeriod: false, windSpeed: true, windGustSpeed: true,windDirection: true, windGustDirection: true}, mmsi: "992501062", name: "Splaugh"},
kishbank: {key: "kishbank", metocean: {location: true, title: true, latest: true, waterTemperature: true, waveHeight:true, wavePeriod: true, windSpeed: true, windGustSpeed: true,windDirection: true, windGustDirection: true}, mmsi: "992501017", name: "Kish Bank"},
southhunter: {key: "southhunter", metocean: {location: true, title: true, latest: true, waterTemperature: true, waveHeight:false, wavePeriod: false, windSpeed: true, windGustSpeed: true,windDirection: true, windGustDirection: true}, mmsi: "992351007", name: "South Hunter"},
foyle: {key: "foyle", metocean: {location: true, title: true, latest: true, waterTemperature: true, waveHeight:true, wavePeriod: true, windGustSpeed: true,windSpeed: true, windDirection: true, windGustDirection: true}, mmsi: "992501230", name: "Foyle"},
finnis: {key: "finnis", metocean: {location: true, title: true, latest: true, waterTemperature: true, waveHeight:true, wavePeriod: true, windGustSpeed: true,windSpeed: true, windDirection: true, windGustDirection: true}, mmsi: "992501164", name: "Finnis"},
ballybunnion: {key: "ballybunnion", metocean: {location: true, title: true, latest: true, waterTemperature: false, waveHeight:true, wavePeriod: true, windSpeed: true, windGustSpeed: true,windDirection: true, windGustDirection: true}, mmsi: "992501146", name: "Ballybunnion"},
wt2buoy: {key: "wt2buoy", metocean: {location: true, title: true, latest: true, waterTemperature: false, waveHeight:false, wavePeriod: false, windSpeed: true, windGustSpeed: true,windDirection: true, windGustDirection: true}, mmsi: "992501304", name: "WT 2 Buoy"},
eastkish: {key: "eastkish", name: "East Kish", type: "Buoy", position: "53°14.349'N, 005°53.618'W", mmsi:"992501020" },
moulditch: {key: "moulditch", name: "Moulditch", type: "Buoy", position: "53°08.430'N, 006°01.230'W", mmsi:"992501022" },
southindia: {key: "southindia", name: "South India", type: "Buoy", position: "53°00.349'N, 005°53.346'W", mmsi:"992501030" },
wicklowhead: {key: "wicklowhead", name: "Wicklow Head", type: "Lighthouse", position: "52°57.947'N,  005°59.889'W", mmsi:"992501031" },
glassgorman2: {key: "glassgorman2", name: "No.2 Glassgorman", type: "Buoy", position: "52°45.348'N, 006°05.343'W", mmsi:"992501038" },
northblackwater: {key: "northblackwater", name: "North Blackwater", type: "Buoy", position: "52°32.225'N, 006°09.520'W", mmsi:"992501046" },
rusk1: {key: "rusk1", name: "No.1 Rusk", type: "Buoy", position: "52°28.539'N, 006°11.799'W", mmsi:"992501048" },
rochespoint: {key: "rochespoint", name: "Roches Point", type: "Lighthouse", position: "51°47.586'N, 008°15.287'W", mmsi:"992501099" },
daunt: {key: "daunt", name: "Daunt", type: "Buoy", position: "51°43.531'N, 008°17.665'W", mmsi:"992501102" },
bulman: {key: "bulman", name: "Bulman", type: "Buoy", position: "51°40.136'N, 008°29.739'W", mmsi:"992501104" },
blacktom: {key: "blacktom", name: "Black Tom", type: "Buoy", position: "51°36.408'N, 008°37.959'W", mmsi:"992501110" },
loo: {key: "loo", name: "Loo", type: "Buoy", position: "51°28.438'N, 009°23.458'W", mmsi:"992501119" },
mizen: {key: "mizen", name: "Mizen", type: "Lighthouse", position: "51°26.991'N, 009°49.225'W", mmsi:"992501127" },
walterscott: {key: "walterscott", name: "Walter Scott", type: "Buoy", position: "51°38.541'N, 009°54.234'W", mmsi:"992501128" },
maidenrock: {key: "maidenrock", name: "Maiden Rock", type: "Buoy", position: "51°49.023'N, 009°48.034'W", mmsi:"992501134" },
cromwellpoint: {key: "cromwellpoint", name: "Cromwell Point", type: "Lighthouse", position: "51°56.022'N, 010°19.280'W", mmsi:"992501141" },
foot: {key: "foot", name: "Foot", type: "Buoy", position: "51°55.718'N, 010°17.072'W", mmsi:"992501140" },
doonaha: {key: "doonaha", name: "Doonaha", type: "Buoy", position: "52°35.545'N, 009°39.014'W", mmsi:"992501154" },
cannonrock: {key: "cannonrock", name: "Cannon  Rock", type: "Buoy", position: "53°14.078'N, 009°34.352'W", mmsi:"992501173" },
cashlabay: {key: "cashlabay", name: "Cashla Bay", type: "Lighthouse", position: "53°15.834'N, 009°33.982'W", mmsi:"992501171" },
eeragh: {key: "eeragh", name: "Eeragh", type: "Lighthouse", position: "53°08.909'N, 009°51.402'W", mmsi:"992501172" },
carrickpatrick: {key: "carrickpatrick", name: "Carrickpatrick", type: "Buoy", position: "54°15.557'N, 009°09.141'W", mmsi:"992501192" },
blackrocksligo: {key: "blackrocksligo", name: "Blackrock Sligo", type: "Lighthouse", position: "54°18.460'N, 008°37.059'W", mmsi:"992501195" },
wheatrock: {key: "wheatrock", name: "Wheat Rock", type: "Buoy", position: "54°18.843'N, 008°39.099'W", mmsi:"992501196" },
ruepoint: {key: "ruepoint", name: "Rue Point", type: "Lighthouse", position: "55°15.533'N, 006°11.474'W", mmsi:"992351131" },
southbriggs: {key: "southbriggs", name: "South Briggs", type: "Buoy", position: "54°41.182'N, 005°35.732'W", mmsi:"992351133" },
governor: {key: "governor", name: "Governor", type: "Buoy", position: "54°39.360'N, 005°31.991'W", mmsi:"992351134" },
barpladdy: {key: "barpladdy", name: "Bar Pladdy", type: "Buoy", position: "54°19.344'N, 005°30.501'W", mmsi:"992351135" },
dunany: {key: "dunany", name: "Dunany", type: "Buoy", position: "53°53.530'N, 006°09.502'W", mmsi:"992501243" },
imogene: {key: "imogene", name: "Imogene", type: "Buoy", position: "53°57.415'N, 006°07.042'W", mmsi:"992501238" }
};
exports.locations = locations;

},{}],43:[function(require,module,exports){
'use strict';

const locations = require("./cil.locations").locations;
const metocean = require("./cil-metocean-widget");
var keys = Object.keys(locations);
var locs = [];
for(var i=0;i<keys.length;i++){
    var key = keys[i];
    if(locations[key].metocean){
      locs.push(locations[key]);
      exports[key] = {widget: metocean.widget.bind(this,locations[key])};
    }
}
exports.meta = {
  name: "MetOcean",
  description: 'Recorded data from Buoys and Lighthouses',
  components: metocean.components,
  locations: locs
};

},{"./cil-metocean-widget":40,"./cil.locations":42}],44:[function(require,module,exports){
'use strict';

var documentation = function(ido,root){
    var createElement = function(n,classes,text){
      var el = document.createElement(n);
      if(classes){
        for(var i=0;i<classes.length;i++){
          el.classList.add(classes[i]);
        }
     }
      if(text){
        el.innerText = text;
      }
      return el;
    };
    var getLocation = function(service,location){
      var container = createElement("div",[],location.name);
      return container;
    };
    var getService = function(service,prefix,provider_name,provider_href){
      var div = createElement("div",["row"]);
      div.appendChild(createElement("h3",[],service.meta.name));
      div.appendChild(createElement("p",[],service.meta.description));
      var div2 = createElement("div",["col-xs-5"]);
      var p = createElement("p");
      p.appendChild(document.createTextNode("Data from "));
      var a = createElement("a",[],provider_name);
      a.setAttribute("href",'#'+provider_href);
      p.appendChild(a);
      p.appendChild(document.createTextNode(" is available for:"));
      div2.appendChild(p);
      var ul = createElement("ul",[]);
      var demo = createElement("div",["col-xs-9"]);
      demo.id = "demo_"+prefix
      var codeContainer = createElement("div",["well"]);
      var code = createElement("code",[],
      "Select a location on the left to view the html and live widget");
      codeContainer.appendChild(code);
      var demoContainer = createElement("div",["row"]);
      var componentContainer = createElement("div",["col-xs-3"]);
      demoContainer.appendChild(demo);
      demoContainer.appendChild(componentContainer);
      for(var i=0;i<service.meta.locations.length;i++){
        var location = service.meta.locations[i];
        var li = createElement("li",[]);
        var li = createElement('li');
        var link = createElement('a');
        link.appendChild(getLocation(service,location));
        var cb = function(key,service,demo,code,fc,fn){
          if(fn){
            fc.loader = fn;
          }
          var options = {};
          var componentEls = fc.getElementsByClassName("component");
          var components = [];
          for(var i=0;i<componentEls.length;i++){
            componentEls[i].disabled = false;
            if(componentEls[i].checked){
              components.push(componentEls[i].getAttribute("name"));
            }
          }
          var componentsCode = "";
          if(components.length && components.length<componentEls.length){
            componentsCode = "\n     data-components='"+components.join(",")+"'";
            options.components = components;
          }
          code.innerHTML = "&lt;script src='ido.js'&gt;&lt;/script&gt;";
          code.innerText += "\n<div class='ido-widget'\n     data-widget='"+key+"'"+componentsCode+"></div>";
          service.widget("#"+demo.id,options);
        }.bind(this,prefix+'.'+location.key,service[location.key],demo,code,componentContainer);

        link.addEventListener("click", cb.bind(this,cb));
        li.appendChild(link);
        ul.appendChild(li);
      }
      div2.appendChild(ul);
      div.appendChild(div2);
      if(service.meta.components){
        var components = service.meta.components;
        for(var i=0;i<components.length;i++){
          var componentDiv = createElement('div',["checkbox"]);
          var label = createElement("label");
          var checkbox = createElement("input",["component"]);
          checkbox.setAttribute("type","checkbox");
          checkbox.setAttribute("name",components[i]);
          checkbox.checked = true;
          checkbox.disabled = true;
          checkbox.onchange = function(fc){
            fc.loader();
          }.bind(this,componentContainer);
          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(components[i]));
          componentDiv.appendChild(label);
          componentContainer.appendChild(componentDiv);
        }
      }
      var div3 = createElement("div",["col-xs-7"]);
      div3.appendChild(codeContainer);
      div3.appendChild(demoContainer);
      div.appendChild(div3);
      return div;
    };
    var getProvider = function(provider,prefix,provider_href){
      var el = createElement("div");
      var link = createElement("a");
      link.setAttribute("name",provider_href);
      el.appendChild(link);
      var img = createElement("img","img-responsive");
      img.setAttribute("src",provider.meta.logo);
      el.setAttribute("alt",provider.meta.name);
      el.appendChild(img);
      el.appendChild(createElement("hr"))
      el.appendChild(createElement("p",[],provider.meta.description));
      var p = createElement("p");
      var a = createElement("a",[],"Irish Digital Ocean");
      a.setAttribute("href",'#ido_overview');
      p.appendChild(a);
      p.appendChild(document.createTextNode(" data services from "+provider.meta.name+":"));
      el.appendChild(p);
      var listOfservices = createElement('ul');
      el.appendChild(listOfservices);
      for(var i=0;i<provider.meta.types.length;i++){
        var key = provider.meta.types[i];
        var linkname = "a_"+prefix+"_"+key;
        var link = createElement("a",[],provider[key].meta.name);
        link.setAttribute("href",'#'+linkname);
        var li = createElement("li");
        li.appendChild(link);
        listOfservices.appendChild(li);
        var target = createElement("a");
        target.setAttribute("name",linkname);
        el.appendChild(target);
        el.appendChild(getService(provider[key],prefix+'.'+key,provider.meta.name,provider_href));
      }
      return el;
    };
    var getCustomWidgetDocs = function(){
      var examples = [
        {
          name: "Simple",
          description: ["A simple example of a custom widget which combines all the data for a specific location.",
           "This widget combines all the data for 'galwayport' location,"],
          code: "galwayport"
        },
        {
         name: "No titles",
         description: ["A small widget showing selected a single location, without titles.",
       "This widget shows the tides and tidesforecast for galwayport."],
         code: "galwayport[tides(height),tidesforecast(height)]"
       },

        {
         name: "Intermediate",
         description: ["A small widget showing selected data from two locations.",
       "This widget combines data from galwaybay and galwayport locations.",
       "From galwaybay location we include the ctd, with location and temperature components.",
       "From galwayport we include waves widget, with temperature component."],
         code: "galwaybay[ctd(location,temperature)],galwayport[waves(temperature)]"
       },
        {
         name: "Advanced",
         description: ["This advanced example shows multiple widgets from two locations combined."],
         code: "galwaybay[ctd(location,temperature),fluorometer(turbidity)],galwayport[waves(temperature,height),tides(height),tidesforecast(height)]"
       }
      ];
      var container = createElement("div",["container"]);
      var link = createElement("a");
      link.setAttribute("name","customwidget");
      container.appendChild(link);
      container.appendChild(createElement("h2",[],"Custom Widgets"));
      container.appendChild(createElement("p",[],"Custom widgets provide a way to combine selected data from one or more providers."
    + " This can be useful to create a consolidated view about a particular location."));
      var el = createElement("div",["row"]);
      container.appendChild(el);
      var colLeft = createElement("div",["col-xs-5"]);
      colLeft.appendChild(createElement("p",[],"Examples:"));
      var ul = createElement("ul");
      var colRight = createElement("div",["col-xs-7"]);
      el.appendChild(colLeft);
      el.appendChild(colRight);
      var codeContainer = createElement("div",["well"]);
      var code = createElement("code",[],
      "Select an example on the left to view the html and live widget");
      var live = createElement("div");
      colLeft.appendChild(ul);
      var docs = createElement("div");
      colLeft.appendChild(docs);
      codeContainer.appendChild(code);
      colRight.appendChild(codeContainer);
      colRight.appendChild(live);
      var cb = function(example,codebox,livebox,docs){
        var code = "<div class='ido-widget' data-widget='custom'\n";
        code += "  data-components='"+example.code+"'></div>";
        docs.innerHTML="";
        docs.appendChild(createElement("h3",[],example.name));
        for(var i=0;i<example.description.length;i++){
          docs.appendChild(createElement("p",[],example.description[i]));
        }
        codebox.innerText = code;
        livebox.innerHTML = code;
        ido.applyWidgets(livebox);
      }
      for(var i=0;i<examples.length;i++){
        var li = createElement("li");
        var a = createElement("a",[],examples[i].name);
        a.addEventListener("click", cb.bind(this,examples[i],code,live,docs));
        li.appendChild(a);
        ul.appendChild(li);
      }
      return container;
    }
      var container = createElement("div",["container"]);
      var overview = createElement("div",["page-header"]);
      var a = createElement("a");
      a.setAttribute("name","ido_overview");
      overview.appendChild(a);
      overview.appendChild(createElement('h1',[],ido.meta.name));
      overview.appendChild(createElement('p',[],ido.meta.description));
      overview.appendChild(createElement('p',[],"Services are provided by:"));
      var listOfProviders = createElement('ul');
      overview.appendChild(listOfProviders);
      container.appendChild(overview);
      for(var i=0;i<ido.meta.providers.length;i++){
        var key = ido.meta.providers[i];
        var provider = ido[key];
        var li = createElement('li');
        var link = createElement('a',[],provider.meta.name);
        var provider_href = 'ido_provider_'+key;
        link.setAttribute('href','#'+provider_href);
        li.appendChild(link);
        listOfProviders.appendChild(li);
        var el = document.createElement('div');
        el.appendChild(getProvider(provider,key,provider_href));
        container.appendChild(el);
      }
      var custom = createElement('p');
      custom.appendChild(document.createTextNode("Data from different providers can be combined into "));
      var customlink = createElement('a',[],"custom widget");
      customlink.setAttribute('href','#customwidget');
      custom.appendChild(customlink);
      custom.appendChild(document.createTextNode("."));

      overview.appendChild(custom);
      container.appendChild(getCustomWidgetDocs());
      root.appendChild(container);
};
exports.documentation = documentation;

},{}],45:[function(require,module,exports){
'use strict';

function Exceliot(options){
  options = options || {}
  this.async = options.async === false?false:true;
  this.data = {};
  this.seen = {};
  this.listeners = {};
}
Exceliot.prototype = {
    argumentNames: function(fun) {
        var names = fun.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
            .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
            .replace(/\s+/g, '').split(',');
        return names.length == 1 && !names[0] ? [] : names;
    },
    functions: function(){
       return {
        __accumulate: function(_,value,n){
           if(_ == undefined || _ == null){
             _ = [];
           }
           _.push(value);
           while(_.length > n){
              _.shift();
           }
           return _;
        },
        __minute: function(){
           var time = new Date().getTime();
           return time - time % 60000;
        }
       }
    },

  dispatch: function(fn, args){
    try{
      fn = (typeof fn == "function") ? fn : window[fn];  // Allow fn to be a function object or the name of a global function
      if(args){
        for(var i=0;i<args.length;i++){
          if (typeof args[i] == 'function'){
            args[i] = args[i]();
          }
        }
      }
      return fn.apply(this.functions(), args || []);  // args is optional, use an empty array by default
    }catch(e){
       console.log(e);
       return undefined;
    }
  },
   add_listener: function(source,target,fn){
       if(this.listeners[source] == undefined){
            this.listeners[source] = [];
        }
        this.listeners[source].push({"key": target, "fn": fn})
   },

    with_namespace: function(key,default_namespace){
      if(key.split('_').length<2){
         return default_namespace+'_'+key;
      }
      return key;
    },
    on: function(fq_key,callback){
       this.add_listener(fq_key,null,callback);
    },
    registered: function(namespace,properties){
      var that = this;
      var obj = {
         on: function(key,cb){
            that.on(namespace+'_'+key,cb);
         },
         set: function(key,val,cb){
            that.set(namespace+'_'+key,val,cb);
         }
      }
      for(var i=0;i<properties.length;i++){
        var property = properties[i];
        var key = property.key;
        var fqprop = namespace+'_'+key;
        var local_property = {
          set: function (key,x) { this.set(key,x); }.bind(that,fqprop),
          get: function (key,x) { return this.data[key]; }.bind(that,fqprop)
        };
        var ns_property = {
             set: function (key,x) { this.set(key,x); }.bind(that,fqprop),
             get: function (key,x) { return this.data[key]; }.bind(that,fqprop)
        };
        if(property.readonly){
          local_property.set = function(key,x){throw "Cannot assign value to readonly property "+key}.bind(null,key);
          ns_property.set = function (key,x){ throw "Cannot assign value to readonly property "+key}.bind(null,fqprop);
        }
        Object.defineProperty(obj, property.key, local_property);
        Object.defineProperty(that, fqprop, ns_property);
      }
      return obj;
    },
    register: function(namespace,obj){
      if(/[\s_]/.test(namespace)){
        throw "Illegal namespace '"+namespace+"'. Underscores and whitespace are not allowed";
      }
      var keys = Object.keys(obj);
      var properties = [];
      for(var i=0;i<keys.length;i++){
       var key = keys[i];
       if(key.indexOf("__")==0){
          // it's private.
          continue;
       }
       var property = {key: key, readonly: false};
       if(typeof obj[key] == "function"){
         property.readonly = true;
         var fn = obj[key];
         fn.namespace = namespace;
         var args = this.argumentNames(fn);
         for(var j=0;j<args.length;j++){
            var param = args[j];
            if(param != "_"){
              this.add_listener(this.with_namespace(param,namespace),namespace+'_'+key,fn);
            }
          }
       }else{
          this.set(namespace+'_'+key,obj[key]);
        }
        properties.push(property);
      }
      var model = this.registered(namespace,properties);
      Object.defineProperty(this, namespace, {
        get: function () { return this; }.bind(model)
       });
       return model;

   },
    user_callback: function(fn,oldVal,newVal){
       return function(){fn(oldVal,newVal);};
    },
    notify: function(key,oldVal,newVal){
           var listeners = [];
           if(this.listeners[key] == undefined){
             return;
           }
           for(var i=0;i<this.listeners[key].length;i++){
             var listener = this.listeners[key][i];
             var isUserCallback = listener.key == null;
             if(isUserCallback){
                listener.fn(newVal,oldVal);
                continue;
             }
             var x = this.argumentNames(listener.fn);
             var params = [];
             for(var j=0;j<x.length;j++){
               var varName = x[j];
               if(varName == "_"){
                 varName = listener.key;
                }
                var valueKey = this.with_namespace(varName,listener.fn.namespace);
                var value = this.data[valueKey];
                if (value === undefined ||
                  value === null ||
                  typeof value === 'string' ||
                   value instanceof String ||
                   typeof value === 'number' ||
                   typeof value === 'boolean'){
                     params.push(value);
                }else{
                     value = JSON.parse(JSON.stringify(value));
                     params.push(value);
                }
              }
              this.set(listener.key,this.dispatch(listener.fn,params),null,true);
            }

       },
     set: function(key,value,cb,immediate){
      var fn = function(key,newValue,cb){
         var oldValue = this.data[key];
         var same = oldValue == newValue;
         if(oldValue && newValue && !same){
           same = JSON.stringify(oldValue) === JSON.stringify(newValue);
         }
         if(!same){
           this.data[key] = newValue;
           this.notify(key,oldValue,newValue);
         }
         if(cb){
            if(this.async){
             setTimeout(cb,0);
            }else{
              cb();
            }
         }
      }.bind(this,key,value,cb);
      if(this.async && !immediate){
          setTimeout(fn,0);
      }else{
        fn();
     }
   }
};

module.exports = Exceliot;

},{}],46:[function(require,module,exports){
'use strict';
// parses something like this:
//galwaybay[tides(height),tidesforecast],dublinport,killybegs[tides]
var consume = function(chars,pos,char){
  while(pos<chars.length && chars[pos] == char){
    pos++;
  }
  return pos;
}
var parseComponents = function(chars,pos){
  var components = [];
  var component = "";
  var done = false;
  while(pos<chars.length && !done){
    var c = chars[pos++];
    switch(c){
    case ')':
      done = true;
      break;
    case ',':
      if(component.length){
        components.push(component);
        component = "";
      }
      pos = consume(chars,pos,',');
      break;
    default:
      component += c;
    }
  }
  if(component.length){
    components.push(component);
  }
  return [pos,components.length?components:undefined];
}
var parseWidgets = function(chars,pos){
  var widgets = [];
  var done = false;
  var widget = {key:"",components:[]};
  while(pos<chars.length && !done){
    var c = chars[pos++];
    switch(c){
      case '(':
        var result = parseComponents(chars,pos);
        pos = result[0];
        widget.components = result[1];
        widgets.push(widget);
        widget = {key:"",components:[]};
        break;
      case ',':
        pos = consume(chars,pos,',');
        if(widget.key.length){
          widgets.push(widget);
        }
        widget = {key:"",components:[]};
        break;
      case ']':
        done = true;
        break;
      default:
        widget.key += c;
    }
  }
  if(widget.key.length){
    widgets.push(widget);
  }
  return [pos,widgets.length?widgets:undefined];
}
var parseLocation = function(chars,pos){
  var loc = {key:"",widgets:[]};
  var done = false;
  while(pos<chars.length && !done){
    var c = chars[pos++];
    switch(c){
      case '[':
         var result = parseWidgets(chars,pos);
         pos = result[0];
         loc.widgets = result[1];
         pos = consume(chars,pos,',');
         done = true;
         break;
      case ',':
        pos = consume(chars,pos,',');
        done = true;
        break;
      default:
        loc.key += c;
    }
  }
  return [pos,loc];
}
var parse = function(input){
  var chars = input.replace(/\s/g, '').replace(/^#/,'').split("");
  var locations = [], pos = 0;
  while(pos<chars.length){
    var result = parseLocation(chars,pos);
    pos = result[0];
    locations.push(result[1]);
    pos = consume(chars,pos,',');
  }
  return locations;
}

exports.parse = parse;

},{}],47:[function(require,module,exports){
'use strict';
var uidocs = require('./docs-widget.js');
var parser = require('./hashparser');
var applyWidgets = function(root) {
  root = root || document;
  var pre = "_"+(new Date()).getTime()+"_";
  var n = 0;
  var elements = root.getElementsByClassName("ido-widget");
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    if(el.hasAttribute("data-widget")){
      var elid =  "ido_widget"+pre+n++;
      el.innerHTML = "<div id='"+elid+"'></div>";
      var wanted = "" + el.getAttribute("data-widget");
      if(wanted == "documentation"){
        ido.documentation(ido,el);
        continue;
      }else if (wanted == "custom") {
        if(el.hasAttribute("data-components")){
          el.innerHTML = ido.str2widgetHTML(""+el.getAttribute("data-components"));
          ido.applyWidgets(el);
        }
        continue;
      }
      var parts = wanted.split(/\./);
      var path = window.ido;
      for(var j=0;j<parts.length;j++){
        if(path){
          path = path[parts[j]];
        }
      }
      var options = {};
      if(el.hasAttribute("data-components")){
        var components = (""+el.getAttribute("data-components")).split(",");
        for(var k=0;k<components.length;k++){
          components[k] = components[k].trim();
        }
        if(components.length){
          options.components = components;
        }
      }
      if(path && path.widget){
        path.widget("#"+elid,options);
      }else{
        console.log("no widget found for "+wanted);
      }
    }
  }
};
var str2widgetHTML = function(str){
    var wanted = parser.parse(str);
    if(!(wanted && wanted.length)){
      return "";
    }
    var lookup = {};
    for(var p=0;p<ido.meta.providers.length;p++){
      var provider = ido[ido.meta.providers[p]];
      for(var t=0;t<provider.meta.types.length;t++){
        var typekey = provider.meta.types[t];
        var type = provider[typekey];
        for(var l=0;l<type.meta.locations.length;l++){
          var loc = type.meta.locations[l];
          lookup[loc.key] = lookup[loc.key] || {};
          lookup[loc.key][typekey] = lookup[loc.key][typekey] || {};
          lookup[loc.key][typekey][provider.meta.key] = type;
        }
      }
    }
    var html = [];
    for(var i=0;i<wanted.length;i++){
      var loc = lookup[wanted[i].key];
      if(loc){
        var allwidgets = [];
        var keys = Object.keys(loc);
        for(var j=0;j<keys.length;j++){
          allwidgets.push({key:keys[j]});
        }
        var widgets = wanted[i].widgets || [];
        if(widgets.length == 0){
          widgets = allwidgets
        };
        for(var j=0;j<widgets.length;j++){
          var widget = widgets[j];
          var providers = Object.keys(loc[widget.key]||{});
          for(var p=0;p<providers.length;p++){
            var provider = providers[p];
            var widget_key = provider+"."+widget.key+"."+wanted[i].key;
            html.push("<div class='ido-widget' data-widget='"+widget_key+"'");
            if(widget.components && widget.components.length){
              html.push(" data-components='");
              html.push(widget.components.join(","));
              html.push("'")
            }
            html.push("></div>");
          }
        }
      }
    }
    return html.join("");
};

var docReady = function(e){e();};
if(typeof window !== 'undefined'){
  docReady = require('doc-ready');
}
var providers = [];
var mi = require('./mi/mi.js');
providers.push(mi);
exports.mi = mi
var cil = require("./cil/cil.js")
providers.push(cil);
exports.cil = cil

exports.meta = {
  name: "Irish Digital Ocean API",
  description: "A collection of services for displaying live and \
  archived data about Ireland's Marine Environment",
  providers: ["mi","cil"]
};
exports.documentation = uidocs.documentation;

exports.applyWidgets = function(root){
  docReady(applyWidgets.bind(this,root));
};
exports.locations = function(){
  var seen = {};
  var answer = [];
  for(var i=0;i<providers.length;i++){
    var locations = providers[i].meta.locations;
    var keys = Object.keys(locations);
    for(var j=0;j<keys.length;j++){
      var l = locations[keys[j]];
      if(!seen[l.key]){
        seen[l.key] = true;
        answer.push(l);
      }
    }
  }
  return answer.sort(function(a, b) {
        return ((a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0));
    });
}
exports.str2widgetHTML = str2widgetHTML;

},{"./cil/cil.js":41,"./docs-widget.js":44,"./hashparser":46,"./mi/mi.js":58,"doc-ready":75}],48:[function(require,module,exports){
'use strict';
var ido = require('./ido.js');

if(typeof window !== 'undefined'){
  var css = require('../css/main.css');
  window.ido = ido;
  var docReady = require('doc-ready');
  docReady(ido.applyWidgets);
}
exports.ido = ido;

},{"../css/main.css":39,"./ido.js":47,"doc-ready":75}],49:[function(require,module,exports){
'use strict';

var configure = function(Highcharts){
    Highcharts.theme = {
        //colors: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572', '#FF9655', '#FFF263', '#6AF9C4'],
        chart: {
            zoomType: 'x',
            marginRight: 10,
            spacingLeft: 0,
            spacingBottom: 5//30
        },
        xAxis: {
            ordinal: false,
            lineColor: "#333",
            lineWidth: 1,
            title: {
                enabled: false,
                text: 'Time',
                margin: 0
                //offset: 25
            },
            labels: {
                y: 18
            },
            tickLength: 8
            //tickPosition: "inside"
        },
        yAxis: {
            lineColor: "#333",
            lineWidth: 1,
            maxPadding: 0,
            floor: 0,
            title: {
                margin: 5,
                style: {
                    //color: '#333',
                    fontSize: '11px'
                }
            },
            labels: {
                x: -5,
                y: 4,
                style: {
                    //color: '#000',
                    font: '11px Trebuchet MS, Verdana, sans-serif'
                }
            }
        },
        tooltip: {
            shared: true,
            valueDecimals: 2
        },
        legend: {
            enabled: false,
            //floating: true,
            //align: 'right',
            //borderColor: '#333',
            //borderWidth: 1,
            //verticalAlign: 'bottom',
            //y: 30
        },
        rangeSelector: {
            enabled: false,
        },
        navigator: {
            margin: 5,
            enabled: false
        },
        scrollbar: {
            enabled: false
        },
        credits: {
            enabled: false
        },
        exporting: {
            enabled: false
        }
    };

    // Apply the theme
    //Highcharts.setOptions(Highcharts.theme); //doesn't work in Highstock (its a bug)...
    //we add the theme manually in each view instead using Highcharts.merge(theme1, theme2)

    Highcharts.windTheme = Highcharts.merge(Highcharts.theme, {
        tooltip: {
            shared: true,
            valueDecimals: 2,
            useHTML: true,
            formatter: function() {
                //thursday, oct 21, 21:32 - 21:33
                var date = Highcharts.dateFormat('%A, %b %e, %H:%M', new Date(this.x));
                var chart = this.points[0].series.chart; //get the chart object
                var index = this.points[0].series.xData.indexOf(this.x);

                var directionSeries = chart.series[0];
                //var directionSeries = chart.series[1];

                var s = '<tspan style="font-size: 10px">' + date + '</tspan>';
                //s += '<br/><span style="color:#7cb5ec">●</span><span> ' + speedSeries.name +': </span><span style="font-weight:bold">' + Highcharts.numberFormat(speedSeries.data[index].y,  2) + " (knots)</span>";
                s += '<br/><span class="glyphicon glyphicon-arrow-right"></span><span> ' + directionSeries.name +': </span><span style="font-weight:bold">' + Highcharts.numberFormat(directionSeries.data[index].y,  2) + " (degrees)</span>";

                return s;
            }
        },
        plotOptions: {
            series: {
                dataGrouping: {
                    enabled: false
                }
            }
        },
        chart: {
            zoomType: ""
        }
    });



    // Apply the theme
    //Highcharts.setOptions(Highcharts.theme); //doesn't work in Highstock (its a bug)...
    //we add the theme manually in each view instead using Highcharts.merge(theme1, theme2)

    Highcharts.currentsTheme = Highcharts.merge(Highcharts.theme, {
        tooltip: {
            shared: true,
            valueDecimals: 2,
            useHTML: true,
            formatter: function () {
                //thursday, oct 21, 21:32 - 21:33
                var date = Highcharts.dateFormat('%A, %b %e, %H:%M', new Date(this.x));
                var chart = this.points[0].series.chart; //get the chart object
                var index = this.points[0].series.xData.indexOf(this.x);

                var speedSeries = chart.series[0];
                var directionSeries = chart.series[1];

                var s = '<tspan style="font-size: 10px">' + date + '</tspan>';
                s += '<br/><span style="color:#7cb5ec">●</span><span> ' + speedSeries.name + ': </span><span style="font-weight:bold">' + Highcharts.numberFormat(speedSeries.data[index].y, 2) + " (m/s)</span>";
                s += '<br/><span class="glyphicon glyphicon-arrow-right"></span><span> ' + directionSeries.name + ': </span><span style="font-weight:bold">' + Highcharts.numberFormat(directionSeries.data[index].y, 2) + " (degrees true)</span>";

                return s;
            }
        }
    });
  }

  exports.configure = configure;

},{}],50:[function(require,module,exports){
'use strict';
var Highcharts = require('highcharts/highstock');
var Exceliot = require("./exceliot");
if( typeof window !== 'undefined' ){
var chartoptions = require('./mi-chart-options');
  chartoptions.configure(Highcharts);
}

var mi_chart_widget = function(element_id,options){
  this.elid = element_id;
  this.namespace = options.namespace;
  this.title = options.title;
  this.model = new Exceliot().register(options.namespace,options.model);
  this.options = options;
  this.apply();
};
mi_chart_widget.prototype = {
     ajax: function(url,fn,errorcb){
     var request = new XMLHttpRequest();
     request.open('GET', url, true);
     request.onload = function() {
       if (request.status >= 200 && request.status < 400) {
         var data = JSON.parse(request.responseText);
         fn(data);
       }else{
         errorcb();
       }
     };
    request.addEventListener("error",errorcb);
    request.send();
   },

  getWidgetElementHtml: function(el_id,title,units){
    var html = [];
    html.push("<div>");
    html.push("<div style='height:40px; position:relative;'>");
    if(title){
        html.push(" <span style='position:absolute; left: 10px; bottom:0;'>");
        html.push(" <span style='font-size: 18px; color: #555'>");
        html.push(title);
        html.push("</span>");
        html.push(" </span>");
    }
    html.push(" <span style='position:absolute; right:10px; bottom:0;'>");
    html.push("   <span id='"+el_id+"_latest' class='chart-latest-value'></span>")
    html.push("   <span class='chart-latest-units'>"+units+"</span>");
    html.push(" </span>");
    html.push("</div>");
    html.push("<div class='chart-container-clean'>");
    html.push(" <div id='"+el_id+"' class='chart-body'>");
    html.push(" </div>");
    html.push("</div>");
    html.push("</div>");

    return html.join("");
  },
  getWidgetContainerHtml: function(namespace,location,title,latest){
    var html=[];
    html.push("<div>");
    html.push(" <div class='widget-clean'>");
    if(location || (title && title.length)){
      html.push(" <div class='widget-header'>");
      if(location){
        html.push(" <div class='widget-title'>");
        html.push(location.name);
        html.push(" </div>");
      }
      if(title && title.length){
        html.push(" <div class='widget-title'>");
        html.push(title);
        html.push(" </div>");
      }
      html.push(" </div>");
    }
    html.push(" <div id='"+namespace+"-widget-body' class='widget-body'>");
    if(latest){
      html.push(" <h5 style='text-align: center; margin: 20px;'>");
      html.push(" Latest Reading: <span id='"+namespace+"-latest-reading'></span> (UTC)");
      html.push(" </h5>");
    }

    html.push(" </div>");
    html.push(" </div>");
    html.push("</div>");
    return html.join("");
   },
    createChart: function(model,namespace,params){
       var field = params.field;
       var displayTitle = params.title;
       var displayUnits = params.units;
       var show_reading = params.show_reading === false?false:true;

       var chartElementId = namespace+"_"+field+"_chart";
       var html = this.getWidgetElementHtml(chartElementId,displayTitle,show_reading?displayUnits:"");
      try{
        document.getElementById(namespace+"-widget-body").insertAdjacentHTML('beforeend',html);
        var e = document.createElement('div');
        e.innerHTML = params.units;
        var units = e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;



        var chart = Highcharts.StockChart(Highcharts.merge(Highcharts.theme, {
            yAxis: { title: { text: ' ' }, opposite: false, floor: 0, gridLineWidth: 0, minorGridLineWidth: 0, labels: { enabled: false } },
            series: [{name: displayTitle, data:[]}],
            plotOptions: { turboThreshold: 10000 },
            tooltip: {
                shared: true,
                valueDecimals: 3,

                valueSuffix: " (" + units + ")"
            },
            chart: {
               renderTo: chartElementId
             }
         }));
        chart.series[0].setVisible(false,false);
        model.on(field,function(show_reading,val){
           var shift = chart.series[0].length >= 4000;
           var value = val[field];
           if(value === undefined){
             return;
           }
           chart.series[0].addPoint([val.timestamp,value], true, shift);
           if(show_reading){
             try{
               value  = value.toFixed(3);
             }catch(e){}
             var el = document.getElementById(chartElementId+"_latest");
             if(el) el.innerText = value;
           }
        }.bind(null,show_reading));
        return chart;
       }catch(e){
          console.log(e);
       }
    },
    createCustom: function(model,namespace,params){
      var field = params.field;
      var elementId = namespace+"_"+field+"_custom_"+ new Date().getTime()*1000;
      var html = '<div id="'+elementId+'" ></div>';
      document.getElementById(namespace+"-widget-body").insertAdjacentHTML('beforeend',html);
      var el = document.getElementById(elementId);
      model.on(field,params.on.bind(null,el));

    },
   renderWidgetContainerHtml: function(){
      var el = undefined;
      if(this.elid.indexOf("#") == 0){
        el = document.getElementById(this.elid.substring(1));
      }
      if(el){
        el.innerHTML = this.getWidgetContainerHtml(this.namespace,this.options.location,this.title,this.options.latest === false?false:true);
      }else{
        console.log("could not find element ["+this.elid+"] for "+this.namespace+" widget");
        return;
      }
    },

    apply: function(){
      this.renderWidgetContainerHtml();
      var charts = [];

      // are any stockcharts wanted?
      if(this.options.stockcharts){
        for(var i=0;i<this.options.stockcharts.length;i++){
          charts.push(this.createChart(this.model,this.namespace,this.options.stockcharts[i]));
        }
      }
      // are any custom divs?
      if(this.options.custom){
        for(var i=0;i<this.options.custom.length;i++){
          this.createCustom(this.model,this.namespace,this.options.custom[i]);
        }
      }

      // Is there a standard timestamp field?
      if(this.options.model.timestamp){
       this.model.on("timestamp",function(val){
          var el = document.getElementById(this.namespace+"-latest-reading");
          if(el) el.innerText = new Date(val).toUTCString().substr(17, 9);
       }.bind(this));
      }

      // should we subscribe to a live feed?
      var subscribe_fn = undefined;
      if(typeof ido == 'undefined' || ido.mi == null || ido.mi.mqtt == null){
        console.log("not connected for mqtt");
      }else if(this.options.mqtt){
       subscribe_fn =
         function(model,mqtt){
           //console.log("subscribing to mqtt topic "+mqtt.topic);
           ido.mi.mqtt.on(mqtt.topic, function(topic,payload){
                model.set(mqtt.target,payload.toString());
             });
         }.bind(null,this.model,this.options.mqtt);
       }

      var makeChartsVisibleAndCallUserCallback = function(){
             for(var j=0;j<charts.length;j++){
               if(charts[j]){
                 for(var n=0;n<charts[j].series.length;n++){
                   charts[j].series[n].setVisible(true,true);
                 }
               }
             }
             setTimeout(subscribe_fn,0);
       };

       // Is any data to be preloaded by ajax?
       if(this.options.preload){
        this.ajax(this.options.preload.url, function(data){
          var parts = this.options.preload.source.split(".");
          for(var i=0;i<parts.length;i++){
            if(data){
              data = data[parts[i]];
            }
          }
          if(data == undefined){
            console.log("No data found for key "+this.options.preload.source);
            setTimeout(makeChartsVisibleAndCallUserCallback,0);
            return;
          }
           for(var i=0;i<data.length;i++){
             this.model.set(this.options.preload.target,data[i],(function(n){
                  if(n == i-1){ // done now.
                     setTimeout(makeChartsVisibleAndCallUserCallback,0);
                  }
              }).bind(this,i));
          }
        }.bind(this),makeChartsVisibleAndCallUserCallback);
      }else{
        setTimeout(makeChartsVisibleAndCallUserCallback,0);
      }
    }
  };
  module.exports = mi_chart_widget;

},{"./exceliot":45,"./mi-chart-options":49,"highcharts/highstock":88}],51:[function(require,module,exports){
'use strict';
var mi_charts_widget = require('../mi-chart-widget');
var model = function(){
  return {
      raw: null,
      parsed: function(_,raw){
         try{
          var parts = raw.split("|");
          var data = parts[2].trim().split(/\s+/);
          return {
               timestamp: Date.parse(parts[0]),
               device: parts[1],
               pressure: parseFloat(data[0].trim()),
               temperature: parseFloat(data[1].trim()),
               conductivity: parseFloat(data[2].trim()),
               salinity: parseFloat(data[3].trim()),
               sound_velocity: parseFloat(data[4].trim()),
               raw_time: data[5].trim()
          };
         }catch(e){
            return _;
         }
      },
      timestamp: function(parsed){
          return parsed.timestamp;
      },
      pressure: function(parsed){
          return {timestamp: parsed.timestamp, pressure: parsed.pressure};
      },
      temperature: function(parsed){
          return {timestamp: parsed.timestamp, temperature: parsed.temperature};
      },
      soundVelocity: function(parsed){
          return {timestamp: parsed.timestamp, soundVelocity: parsed.sound_velocity};
      },
      salinity: function(parsed){
          return {timestamp: parsed.timestamp, salinity: parsed.salinity};
      },
      conductivity: function(parsed){
          return {timestamp: parsed.timestamp, conductivity: parsed.conductivity};
      },
  };
}
var widget = function(location,elid,options){
  options = options || {};
  options.components = options.components || ["location","title","latest","temperature","pressure","conductivity","soundVelocity"];
  var stockcomponents = {
    "temperature": {field: "temperature", title: "Subsea Temp", units: "&deg;C"},
    "pressure": {field: "pressure", title:"Pressure", units: "dbar"},
    "conductivity": {field: "conductivity", title:"Conductivity", units: "mS/cm" },
    "soundVelocity": {field: "soundVelocity", title: "Sound Velocity", units: "m/s"}
  };
  var components = {};
  var stockcharts = [];
  for(var i=0;i<options.components.length;i++){
    components[options.components[i]] = true;
    var wanted = stockcomponents[options.components[i]];
    if(wanted) stockcharts.push(wanted);
  }
  if(!components.latest){
    for(var i=0;i<stockcharts.length;i++){
      stockcharts[i].show_reading = false;
    }
  }
  return new mi_charts_widget(elid,{
                namespace: "spiddal-ctd",
                title: components.title?"CTD Readings (-20m)":false,
                location: components.location?location:false,
                model: model(),
                stockcharts: stockcharts,
                onModelReady: options.onModelReady,
                latest: components.latest?true:false,
                preload: {
                    url: '//spiddal.marine.ie/data/spiddal-ctd-sample.json',
                    source: "data",
                    target: "raw"
                },
                mqtt: {
                   topic: "spiddal-ctd",
                   target: "raw"
                }
     });
};

exports.model = model;
exports.widget = widget;

},{"../mi-chart-widget":50}],52:[function(require,module,exports){
'use strict';
var mi_charts_widget = require('../mi-chart-widget');
var model = function(){
    return {
      raw: null,
      parsed: function(_,raw){
         try{
          var parts = raw.split("|");
          var data = parts[2].trim().split(/\s+/);
          return {
               timestamp: Date.parse(parts[0]),
               device: parts[1],
               date: data[0].trim(),
               time: data[1].trim(),
               wavelength_fluorescence: parseFloat(data[2].trim()),
               chlorophyll_counts: parseFloat(data[3].trim()),
               wavelength_turbidity: parseFloat(data[4].trim()),
               turbidity_counts: parseFloat(data[5].trim()),
               thermistor: parseFloat(data[6].trim()),
               chlorophyll: 0.0181 * (parseFloat(data[3].trim()) - 49.0),
               turbidity: 0.0483 * (parseFloat(data[5].trim()) - 50.0)
          };
         }catch(e){
            return _;
         }
      },
      timestamp: function(parsed){
          return parsed.timestamp;
      },
      chlorophyll: function(parsed){
          return {timestamp: parsed.timestamp, chlorophyll: parsed.chlorophyll};
      },
      turbidity: function(parsed){
          return {timestamp: parsed.timestamp, turbidity: parsed.turbidity};
      }
  };
}

var widget = function(location,elid,options){
  options = options || {};
  options.components = options.components || ["location","title","latest","chlorophyll","turbidity"];
  var stockcomponents = {
    "chlorophyll": {field: "chlorophyll", title: "Chlorophyll", units: "ug/l"},
    "turbidity": {field: "turbidity", title:"Turbidity", units: "NTU"}
  };
  var components = {};
  var stockcharts = [];
  for(var i=0;i<options.components.length;i++){
    components[options.components[i]] = true;
    var wanted = stockcomponents[options.components[i]];
    if(wanted) stockcharts.push(wanted);
  }
  if(!components.latest){
    for(var i=0;i<stockcharts.length;i++){
      stockcharts[i].show_reading = false;
    }
  }

  return new mi_charts_widget(elid,{
                namespace: "spiddal-fluorometer",
                title: components.title?"Fluorometer (-20m)":false,
                location: components.location?location:false,
                model: model(),
                stockcharts: stockcharts,
                latest: components.latest?true:false,
                onModelReady: options.onModelReady,
                preload: {
                    url: '//spiddal.marine.ie/data/spiddal-fluorometer-sample.json',
                    source: "data",
                    target: "raw"
                },
                mqtt: {
                   topic: "spiddal-fluorometer",
                   target: "raw"
                }
     });
};
exports.model = model;
exports.widget = widget;

},{"../mi-chart-widget":50}],53:[function(require,module,exports){
'use strict';
var mi_charts_widget = require('../mi-chart-widget');
var model = function(){
    return {
      row: null,
      parsed: function(_,row){
         try{
          return {
               timestamp: Date.parse(row[0]),
               waterLevel: row[1]
          };
         }catch(e){
            return _;
         }
      },
      timestamp: function(parsed){
          return parsed.timestamp;
      },
      waterLevel: function(parsed){
        return {timestamp:parsed.timestamp, waterLevel: parsed.waterLevel};
      },
      tworeadings: function(_,parsed){
        var current = {
            timestamp: parsed.timestamp,
            waterLevel: parsed.waterLevel,
            tide: "unknown"
          };
        var previous = {
            timestamp: null,
            waterLevel: null,
            tide: "unknown"
          };
        if(_){
          previous.timestamp = _.current.timestamp;
          previous.waterLevel = _.current.waterLevel;
          previous.tide = _.current.tide;
          if(current.waterLevel == previous.waterLevel){
            current.tide = previous.tide;
          }else if (current.waterLevel > previous.waterLevel) {
            current.tide = "rising";
          }else {
            current.tide = "falling";
          }
        }
        return {
           current: current,
           previous: previous
        }
      },
      tide: function(_,tworeadings){
        if(tworeadings.previous == undefined){
          return _;
        }
        if(tworeadings.current.tide == tworeadings.previous.tide){
          return _;
        }
        if(tworeadings.previous.tide == "unknown"){
          return _;
        }
        var highlow = tworeadings.previous.tide == "rising"?"High":"Low";
        var previousTimestamp = _ ? _.timestamp : false;
        return {timestamp: tworeadings.previous.timestamp, previousTimestamp: previousTimestamp, waterLevel: tworeadings.previous.waterLevel, tide: highlow};
      }
  };
}
var get_custom_latest = function(){
  return {
                      field: "tide",
                      on: function(el,tide){
                        var tableid = el.id+"-hightides";
                        var eltable = document.getElementById(tableid);
                        if(eltable == null){
                          el.insertAdjacentHTML('beforeend','<table class="table table-condensed table-striped" id="'+tableid+'"></table>');
                          eltable = document.getElementById(tableid);
                        }
                        var td = new Date(tide.timestamp).toUTCString();
                        var date = td.substring(0,11);
                        var time = td.substring(17,22);
                        var date_changed = tide.previousTimestamp?new Date(tide.previousTimestamp).toUTCString().substring(0,11) != date : true;
                        var html = [];
                        html.push("<tr><td>")
                        if(date_changed){
                          html.push(date);
                        }
                        html.push("</td><td>"+time+"</td><td>"+tide.tide+"</td><td>"+tide.waterLevel+" m</td></tr>");
                        eltable.insertAdjacentHTML('beforeend',html.join(""));
                      }
                    };
}
var widget = function(location,station,elid,options){
  options = options || {};
  options.components = options.components || ["location","title","latest","height","tides"];
  var stockcomponents = {
    "height": {field: "waterLevel", title: "Forecast Tide Height", units: "m", show_reading: false}
  }
  var customcomponents = {
    "tides": get_custom_latest()
  }
  var custom = [];
  var stockcharts = [];
  var components = {};
  for(var i=0;i<options.components.length;i++){
    components[options.components[i]] = true;
    var wanted = stockcomponents[options.components[i]];
    if(wanted) stockcharts.push(wanted);
    wanted = customcomponents[options.components[i]];
    if(wanted) custom.push(wanted);
  }

  var d = new Date();
  d.setDate(d.getDate());
  var start_date = d.toISOString();
  d.setDate(d.getDate() + 2);
  var end_date = d.toISOString();
    var url = '//erddap.marine.ie/erddap/tabledap/IMI-TidePrediction.json?time,Water_Level&time>='+start_date+'&time<='+end_date+'&stationID="'+station+'"';
    return new mi_charts_widget(elid,{
                namespace: "tide-forecast-"+station.replace(/[\s_]+/g, '-').toLowerCase(),
                title: components.title?"Tide Forecast":false,
                location: components.location?location:false,
                model: model(),
                stockcharts: stockcharts,
                custom: custom,
                latest: components.latest?true:false,
                onModelReady: options.onModelReady,
                preload: {
                    url: url,
                    source: "table.rows",
                    target: "row"
                }
     });
};
exports.model = model;
exports.widget = widget;

},{"../mi-chart-widget":50}],54:[function(require,module,exports){
'use strict';
var mi_charts_widget = require('../mi-chart-widget');
var model = function(){
    return {
      row: null,
      parsed: function(_,row){
         try{
          return {
               timestamp: Date.parse(row[0]),
               height: row[1]
          };
         }catch(e){
            return _;
         }
      },
      timestamp: function(parsed){
          return parsed.timestamp;
      },
      height: function(parsed){
        return parsed;
      }
  };
}

var widget = function(location,station,elid,options){
  options = options || {};
  options.components = options.components || ["location","title","latest","height"];
  var stockcomponents = {
    "height": {field: "height", title: "Tide Height", units: "m"}
  }
  var custom = [];
  var stockcharts = []
  var components = {};
  for(var i=0;i<options.components.length;i++){
    components[options.components[i]] = true;
    var wanted = stockcomponents[options.components[i]];
    if(wanted) stockcharts.push(wanted);
  }
  var d = new Date();
  d.setDate(d.getDate() - 2);
  var start_date = d.toISOString();
  d.setDate(d.getDate() + 3);
  var end_date = d.toISOString();
    var url = '//erddap.marine.ie/erddap/tabledap/IrishNationalTideGaugeNetwork.json?time,Water_Level&time>='+start_date+'&time<='+end_date+'&station_id="'+station+'"';
    return new mi_charts_widget(elid,{
                namespace: "tide-gauge-"+station.replace(/[\s_]+/g, '-').toLowerCase(),
                title: components.title?"Tide Gauge":false,
                location: components.location?location:false,
                model: model(),
                stockcharts: stockcharts,
                latest: components.latest?true:false,
                onModelReady: options.onModelReady,
                preload: {
                    url: url,
                    source: "table.rows",
                    target: "row"
                }
     });
};
exports.model = model;
exports.widget = widget;

},{"../mi-chart-widget":50}],55:[function(require,module,exports){
'use strict';
var mi_charts_widget = require('../mi-chart-widget');
var model = function(station){
    return {
      row: null,
      mqtt: undefined,
      parsed: function(_,row,mqtt){
        if(mqtt){
          try{
            var obj = JSON.parse(mqtt);
            if(obj.station_id != station){
              return _;
            }
            return {
              timestamp: Date.parse(obj.time),
              temperature: obj.SeaTemperature,
              significantWaveHeight: obj.SignificantWaveHeight
            };

          }catch(e){
            console.log(e);
            return _;
          }
        }
         try{
          return {
               timestamp: Date.parse(row[0]),
               temperature: row[1],
               significantWaveHeight: row[2]
          };
         }catch(e){
            return _;
         }
      },
      timestamp: function(parsed){
          return parsed.timestamp;
      },
      temperature: function(parsed){
        return {timestamp: parsed.timestamp, temperature: parsed.temperature};
      },
      significantWaveHeight: function(parsed){
        return {timestamp: parsed.timestamp, significantWaveHeight: parsed.significantWaveHeight/100.0};
      }
  };
}

var widget = function(location,station,elid,options){
  options = options || {};
  options.components = options.components || ["location","title","latest","temperature","height"];
  var stockcomponents = {
    "temperature": {field: "temperature", title: "Surface Sea Temp", units: "&deg;C"},
    "height": {field: "significantWaveHeight", title: "Sig. Wave Height", units: "m"},
  }
  var custom = [];
  var stockcharts = [];
  var components = {};
  for(var i=0;i<options.components.length;i++){
    components[options.components[i]] = true;
    var wanted = stockcomponents[options.components[i]];
    if(wanted) stockcharts.push(wanted);
  }
  var d = new Date();
  d.setDate(d.getDate() - 2);
  var start_date = d.toISOString();
  d.setDate(d.getDate() + 3);
  var end_date = d.toISOString();
    var url = '//erddap.marine.ie/erddap/tabledap/IWaveBNetwork30Min.json?time,SeaTemperature,SignificantWaveHeight&time>='+start_date+'&time<='+end_date+'&station_id="'+station+'"&SeaTemperature!=0.0000&PeakPeriod>=0';
    return new mi_charts_widget(elid,{
                namespace: "wave-buoy-"+station.replace(/[\s+_]/g, '-').toLowerCase(),
                title: components.title?"Wave Buoy":false,
                location: components.location?location:false,
                model: model(station),
                stockcharts: stockcharts,
                latest: components.latest?true:false,
                onModelReady: options.onModelReady,
                preload: {
                    url: url,
                    source: "table.rows",
                    target: "row"
                },
                mqtt: {
                   topic: "irish-wave-buoys",
                   target: "mqtt"
                }
     });
};
exports.model = model;
exports.widget = widget;

},{"../mi-chart-widget":50}],56:[function(require,module,exports){
'use strict';

var locations = require('./mi.locations').locations;
const ctd = require('./mi-spiddal-ctd-widget');
exports.galwaybay = {widget: ctd.widget.bind(this,locations.galwaybay)};
exports.meta = {
  name: "Conductivity Temperature Depth Sensor",
  description: 'A Conductivity/Temperature/Depth sensor measures the \
  temperature and conductivity of the seawater (the conductivity is \
  used to calculate an estimate of the salinity); the pressure \
  exert by the seawater above (from which the depth of the sensor is \
  estimated); and these parameters are also used to estimate the \
  speed of sound within the sea.',
  components: ["location","title","latest","temperature","pressure","conductivity","soundVelocity"],
  locations: [
    locations.galwaybay
  ]
};

},{"./mi-spiddal-ctd-widget":51,"./mi.locations":59}],57:[function(require,module,exports){
'use strict';

var locations = require('./mi.locations').locations;
const fluorometer = require('./mi-spiddal-fluorometer-widget');
exports.galwaybay = {widget: fluorometer.widget.bind(this,locations.galwaybay)};
exports.meta = {
  name: "Fluorometer Sensor",
  description: 'A fluorometer measures the fluorescence of the seawater \
    to give an estimate of the volume of chlorophyll present \
    (indicative of the amount of phytoplankton in the seawater) \
    and it measures turbidity, or the "cloudiness" of the seawater, \
    caused by the presence of particles such as sediment from \
    the seabed suspended in the water.',
    components: ["location","title","latest","chlorophyll","turbidity"],
  locations: [
    locations.galwaybay
  ]
};

},{"./mi-spiddal-fluorometer-widget":52,"./mi.locations":59}],58:[function(require,module,exports){
'use strict';
var mqtt = require('mqtt');
var mqtt_feed = require('../mqtt-feed');
var mi = {};
try{
  mi.mqtt = new mqtt_feed.wrap(mqtt.connect("wss://mqtt.marine.ie"));
}catch(e){
  console.log("could not connect to mqtt feed wss://mqtt.marine.ie",e);
}

exports.mqtt = mi.mqtt
exports.ctd = require("./mi.ctd");
exports.fluorometer = require('./mi.fluorometer');
exports.tidesforecast = require('./mi.tidesforecast');
exports.tides = require('./mi.tides');
exports.waves = require('./mi.waves');

exports.meta = {
  key:"mi",
  name: "Irish Marine Institute",
  description: "The State agency responsible for marine research, \
  technology development and innovation in Ireland. We provide \
  scientific and technical advice to Government to help inform \
  policy and to support the sustainable development of Ireland's \
  marine resource.",
  url: "http://www.marine.ie",
  icon: "http://webapps.marine.ie/virtual_earth_polygon/Images/MISymbol.bmp",
  logo: "http://www.marine.ie/Home/sites/default/files/MIFiles/Images/General/Marine_logo.jpg",
  types:  [ "ctd","fluorometer","tidesforecast","tides","waves" ],
  locations: require("./mi.locations").locations
}

},{"../mqtt-feed":63,"./mi.ctd":56,"./mi.fluorometer":57,"./mi.locations":59,"./mi.tides":60,"./mi.tidesforecast":61,"./mi.waves":62,"mqtt":97}],59:[function(require,module,exports){
'use strict'

var locations = {
  aranmore: {key: "aranmore", name: "Aranmore"},
  ballycotton: {key: "ballycotton", name: "Ballycotton"},
  ballyglass: {key: "ballyglass", name: "Ballyglass"},
  belmulletbertha: {key: "belmulletbertha", name: "Belmullet Berth A"},
  belmulletberthb: {key: "belmulletberthb", name: "Belmullet Berth B"},
  castletownbere: {key: "castletownbere", name: "Castletownbere"},
  dublinport: {key: "dublinport", name: "Dublin Port"},
  dundalk: {key: "dundalk", name: "Dundalk"},
  dunmoreeast: {key: "dunmoreeast", name: "Dunmore East"},
  galwaybay: {key: "galwaybay", name: "Galway Bay"},
   galwayport: {key: "galwayport", name: "Galway Port"},
   howthharbour: {key: "howthharbour", name: "Howth Harbour"},
   inishmore: {key: "inishmore", name: "Inishmore"},
   killybegsport: {key: "killybegsport", name: "Killybegs Port"},
   kishbanklighthouse: {key: "kishbanklighthouse", name: "Kish Bank Lighthouse"},
   malinhead: {key: "malinhead", name: "Malin Head"},
   skerries: {key: "skerries", name: "Skerries"},
   sligo: {key: "sligo", name: "Sligo"},
   spiddal: {key: "spiddal", name: "Spiddal"}, // should this be galway bay?
   wexford: {key: "wexford", name: "Wexford"},
   westwavemk3: {key: "westwavemk3", name: "Westwave MK3"},
};
exports.locations = locations;

},{}],60:[function(require,module,exports){
'use strict';

var locations = require('./mi.locations').locations;
const tides = require('./mi-tides-widget');
exports.aranmore = { widget: tides.widget.bind(this,locations.aranmore,"Aranmore")};
exports.ballycotton = { widget: tides.widget.bind(this,locations.ballycotton,"Ballycotton")};
exports.ballyglass = { widget: tides.widget.bind(this,locations.ballyglass,"Ballyglass")};
exports.dublinport = { widget: tides.widget.bind(this,locations.dublinport,"Dublin Port")};
exports.galwayport = { widget: tides.widget.bind(this,locations.galwayport,"Galway Port")};
exports.howthharbour = { widget: tides.widget.bind(this,locations.howthharbour,"Howth Harbour")};
exports.killybegsport = { widget: tides.widget.bind(this,locations.killybegsport,"Killybegs Port")};
exports.malinhead = { widget: tides.widget.bind(this,locations.malinhead,"Malin Head")};

exports.meta = {
  name: "Tides",
  description: 'Recorded data from the Irish Tides Network',
  components: ["location","title","latest","height"],
  locations: [
    locations.aranmore,
    locations.ballycotton,
    locations.ballyglass,
    locations.dublinport,
    locations.galwayport,
    locations.howthharbour,
    locations.killybegsport,
    locations.malinhead,
  ]
};

},{"./mi-tides-widget":54,"./mi.locations":59}],61:[function(require,module,exports){
'use strict';

var locations = require('./mi.locations').locations;
const forecast = require('./mi-tides-forecast-widget');

exports.aranmore = { widget: forecast.widget.bind(this,locations.aranmore,"Aranmore")};
exports.ballycotton ={ widget:  forecast.widget.bind(this,locations.ballycotton,"Ballycotton")};
exports.ballyglass = { widget: forecast.widget.bind(this,locations.ballyglass,"Ballyglass")};
exports.castletownbere = {widget: forecast.widget.bind(this,locations.castletownbere,"Castletownbere")};
exports.dublinport = { widget: forecast.widget.bind(this,locations.dublinport,"Dublin_Port")};
exports.dundalk = {widget: forecast.widget.bind(this,locations.dundalk,"Dundalk")};
exports.dunmoreeast = {widget: forecast.widget.bind(this,locations.dunmoreeast,"Dunmore_East")};
exports.galwayport = { widget: forecast.widget.bind(this,locations.galwayport,"Galway_Port")};
exports.howthharbour = { widget: forecast.widget.bind(this,locations.howthharbour,"Howth")};
exports.inishmore = {widget: forecast.widget.bind(this,locations.inishmore,"Inishmore")};
exports.killybegsport = { widget: forecast.widget.bind(this,locations.killybegsport,"Killybegs")};
exports.kishbanklighthouse = {widget: forecast.widget.bind(this,locations.kishbanklighthouse,"Kish_Bank_Lighthouse")};
exports.malinhead = { widget: forecast.widget.bind(this,locations.malinhead,"Malin_Head")};
exports.skerries = {widget: forecast.widget.bind(this,locations.skerries,"Skerries")};
exports.sligo = {widget: forecast.widget.bind(this,locations.sligo,"Sligo")};
exports.wexford = {widget: forecast.widget.bind(this,locations.wexford,"Wexford")};

exports.meta = {
  name: "Tides Forecast",
  description: 'Irish Tides Forecast',
  components: ["location","title","latest","height","tides"],
  locations: [
    locations.aranmore,
    locations.ballyglass,
    locations.ballycotton,
    locations.galwayport,
    locations.dublinport,
    locations.dundalk,
    locations.dunmoreeast,
    locations.inishmore,
    locations.howthharbour,
    locations.killybegsport,
    locations.kishbanklighthouse,
    locations.malinhead,
    locations.skerries,
    locations.sligo,
    locations.wexford,
  ]
};

},{"./mi-tides-forecast-widget":53,"./mi.locations":59}],62:[function(require,module,exports){
'use strict';
const waves = require('./mi-waves-widget');
var locations = require('./mi.locations').locations;

exports.belmulletbertha = { widget:waves.widget.bind(this,locations.belmulletbertha,"Belmullet Wave Buoy Berth A")};
exports.belmulletberthb = { widget:waves.widget.bind(this,locations.belmulletberthb,"Belmullet Wave Buoy Berth B")};
exports.galwayport = { widget:waves.widget.bind(this,locations.galwayport,"Galway Bay Wave Buoy")};
exports.westwavemk3 = { widget:waves.widget.bind(this,locations.westwavemk3,"Westwave MK3")};
exports.meta = {
  name: "Waves",
  description: 'Data from the Irish Waves Buoy Network',
  components: ["location","title","latest","temperature","height"],
  locations: [
    locations.belmulletbertha,
    locations.belmulletberthb,
    locations.galwayport,
    locations.westwavemk3
  ]
};

},{"./mi-waves-widget":55,"./mi.locations":59}],63:[function(require,module,exports){
'use strict';
var wrap = function(client){
  this.client = client;
  this.handlers = {};
  this.client.on("message", function(topic,payload){
     this.handle_message(topic,payload);
  }.bind(this));
};
wrap.prototype = {
    on: function(topic,handler){
      var subscribe = false;
      if(this.handlers[topic] == undefined){
        subscribe = true;
        this.handlers[topic] = [];
      }
      this.handlers[topic].push(handler);
      if(subscribe){
        this.client.subscribe(topic);
      }
    },
    handle_message: function(topic,payload){
       if(this.handlers[topic]){
          for(var i=0;i<this.handlers[topic].length;i++){
            try{
              this.handlers[topic][i](topic,payload);
            }catch(e){
              console.log(e);
            }
          }
       }
    }
};
exports.wrap = wrap;

},{}],64:[function(require,module,exports){
'use strict';
const Highcharts = require('highcharts/highstock');
const mi_chart_widget = require('./mi-chart-widget');

var chart_widget = function(element_id,options){
  mi_chart_widget.call(this,element_id,options);
}

// subclass extends superclass
chart_widget.prototype = Object.create(mi_chart_widget.prototype);
chart_widget.prototype.constructor = chart_widget;

chart_widget.prototype.createBasicChart = chart_widget.prototype.createChart;

chart_widget.prototype.createDirectionalChart = function(model,namespace,params){
  //This is not in use yet. Some work needs done and possible refactor.
   var field = params.field;
   var displayTitle = params.title;
   var displayUnits = params.units;
   var show_reading = params.show_reading === false?false:true;

   var chartElementId = namespace+"_"+field+"_chart";
   var html = this.getWidgetElementHtml(chartElementId,displayTitle,show_reading?displayUnits:"");
  try{
    document.getElementById(namespace+"-widget-body").insertAdjacentHTML('beforeend',html);
    var e = document.createElement('div');
    e.innerHTML = params.units;
    var units = e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
    const draw_function = function(){
      for(var i=0;i<this.series[0].data.length;i+=3){
        var point = this.series[0].data[i];
        if(point == null){
          continue;
        }
        var x = point.plotX + this.plotLeft;
        var y = 20;

                        //Create arrow: Set vector values & then set rotation
        var  arrow = this.renderer.path(
                            [
                                'M', 0, 7, // top of arrow
                                'L', -1.5, 7,
                                0, 10,
                                1.5, 7,
                                0, 7,
                                0, -8 // base of arrow
                            ]
                        ).attr({
                            rotation: point.y,
                            translateX: x, // rotation center
                            translateY: y // rotation center
                        });

                        //Set arrow style
                        arrow.attr({
                            stroke: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black', 'stroke-width': 1.5, zIndex: 5
                        }).add();
          }

    };
    var chart = Highcharts.StockChart(Highcharts.merge(Highcharts.windTheme, {
        //xAxis: {offset: 5 },
        yAxis: { title: { text: ' ' }, opposite: false, floor: 0, gridLineWidth: 0, minorGridLineWidth: 0, labels: { enabled: false } },
        series: [{name: displayTitle, data:[]}],
        plotOptions: { turboThreshold: 10000 },
        tooltip: {
            shared: true,
            valueDecimals: 3,

            valueSuffix: " (" + units + ")"
        },
        chart: {
           renderTo: chartElementId,
           events: {
             redraw: draw_function
           }
         }
     }), function(chart){
       draw_function.bind(chart)();
     });
    chart.series[0].setVisible(false,false);


    model.on(field,function(show_reading,val){
       var shift = chart.series[0].length >= 4000;
       var value = val[field];
       if(value === undefined){
         return;
       }
       chart.series[0].addPoint([val.timestamp,value], true, shift);
       if(show_reading){
         try{
           value  = value.toFixed(3);
         }catch(e){}
         var el = document.getElementById(chartElementId+"_latest");
         if(el) el.innerText = value;
       }
    }.bind(null,show_reading));
    return chart;
   }catch(e){
      console.log(e);
   }
};

chart_widget.prototype.createChart = function(model,namespace,params){
  if(params.directional){
    return this.createDirectionalChart(model,namespace,params);
  }else{
    return this.createBasicChart(model,namespace,params);
  }
};

module.exports = chart_widget;

},{"./mi-chart-widget":50,"highcharts/highstock":88}],65:[function(require,module,exports){
var DuplexStream = require('readable-stream/duplex')
  , util         = require('util')
  , Buffer       = require('safe-buffer').Buffer


function BufferList (callback) {
  if (!(this instanceof BufferList))
    return new BufferList(callback)

  this._bufs  = []
  this.length = 0

  if (typeof callback == 'function') {
    this._callback = callback

    var piper = function piper (err) {
      if (this._callback) {
        this._callback(err)
        this._callback = null
      }
    }.bind(this)

    this.on('pipe', function onPipe (src) {
      src.on('error', piper)
    })
    this.on('unpipe', function onUnpipe (src) {
      src.removeListener('error', piper)
    })
  } else {
    this.append(callback)
  }

  DuplexStream.call(this)
}


util.inherits(BufferList, DuplexStream)


BufferList.prototype._offset = function _offset (offset) {
  var tot = 0, i = 0, _t
  if (offset === 0) return [ 0, 0 ]
  for (; i < this._bufs.length; i++) {
    _t = tot + this._bufs[i].length
    if (offset < _t || i == this._bufs.length - 1)
      return [ i, offset - tot ]
    tot = _t
  }
}


BufferList.prototype.append = function append (buf) {
  var i = 0

  if (Buffer.isBuffer(buf)) {
    this._appendBuffer(buf);
  } else if (Array.isArray(buf)) {
    for (; i < buf.length; i++)
      this.append(buf[i])
  } else if (buf instanceof BufferList) {
    // unwrap argument into individual BufferLists
    for (; i < buf._bufs.length; i++)
      this.append(buf._bufs[i])
  } else if (buf != null) {
    // coerce number arguments to strings, since Buffer(number) does
    // uninitialized memory allocation
    if (typeof buf == 'number')
      buf = buf.toString()

    this._appendBuffer(Buffer.from(buf));
  }

  return this
}


BufferList.prototype._appendBuffer = function appendBuffer (buf) {
  this._bufs.push(buf)
  this.length += buf.length
}


BufferList.prototype._write = function _write (buf, encoding, callback) {
  this._appendBuffer(buf)

  if (typeof callback == 'function')
    callback()
}


BufferList.prototype._read = function _read (size) {
  if (!this.length)
    return this.push(null)

  size = Math.min(size, this.length)
  this.push(this.slice(0, size))
  this.consume(size)
}


BufferList.prototype.end = function end (chunk) {
  DuplexStream.prototype.end.call(this, chunk)

  if (this._callback) {
    this._callback(null, this.slice())
    this._callback = null
  }
}


BufferList.prototype.get = function get (index) {
  return this.slice(index, index + 1)[0]
}


BufferList.prototype.slice = function slice (start, end) {
  if (typeof start == 'number' && start < 0)
    start += this.length
  if (typeof end == 'number' && end < 0)
    end += this.length
  return this.copy(null, 0, start, end)
}


BufferList.prototype.copy = function copy (dst, dstStart, srcStart, srcEnd) {
  if (typeof srcStart != 'number' || srcStart < 0)
    srcStart = 0
  if (typeof srcEnd != 'number' || srcEnd > this.length)
    srcEnd = this.length
  if (srcStart >= this.length)
    return dst || Buffer.alloc(0)
  if (srcEnd <= 0)
    return dst || Buffer.alloc(0)

  var copy   = !!dst
    , off    = this._offset(srcStart)
    , len    = srcEnd - srcStart
    , bytes  = len
    , bufoff = (copy && dstStart) || 0
    , start  = off[1]
    , l
    , i

  // copy/slice everything
  if (srcStart === 0 && srcEnd == this.length) {
    if (!copy) { // slice, but full concat if multiple buffers
      return this._bufs.length === 1
        ? this._bufs[0]
        : Buffer.concat(this._bufs, this.length)
    }

    // copy, need to copy individual buffers
    for (i = 0; i < this._bufs.length; i++) {
      this._bufs[i].copy(dst, bufoff)
      bufoff += this._bufs[i].length
    }

    return dst
  }

  // easy, cheap case where it's a subset of one of the buffers
  if (bytes <= this._bufs[off[0]].length - start) {
    return copy
      ? this._bufs[off[0]].copy(dst, dstStart, start, start + bytes)
      : this._bufs[off[0]].slice(start, start + bytes)
  }

  if (!copy) // a slice, we need something to copy in to
    dst = Buffer.allocUnsafe(len)

  for (i = off[0]; i < this._bufs.length; i++) {
    l = this._bufs[i].length - start

    if (bytes > l) {
      this._bufs[i].copy(dst, bufoff, start)
    } else {
      this._bufs[i].copy(dst, bufoff, start, start + bytes)
      break
    }

    bufoff += l
    bytes -= l

    if (start)
      start = 0
  }

  return dst
}

BufferList.prototype.shallowSlice = function shallowSlice (start, end) {
  start = start || 0
  end = end || this.length

  if (start < 0)
    start += this.length
  if (end < 0)
    end += this.length

  var startOffset = this._offset(start)
    , endOffset = this._offset(end)
    , buffers = this._bufs.slice(startOffset[0], endOffset[0] + 1)

  if (endOffset[1] == 0)
    buffers.pop()
  else
    buffers[buffers.length-1] = buffers[buffers.length-1].slice(0, endOffset[1])

  if (startOffset[1] != 0)
    buffers[0] = buffers[0].slice(startOffset[1])

  return new BufferList(buffers)
}

BufferList.prototype.toString = function toString (encoding, start, end) {
  return this.slice(start, end).toString(encoding)
}

BufferList.prototype.consume = function consume (bytes) {
  while (this._bufs.length) {
    if (bytes >= this._bufs[0].length) {
      bytes -= this._bufs[0].length
      this.length -= this._bufs[0].length
      this._bufs.shift()
    } else {
      this._bufs[0] = this._bufs[0].slice(bytes)
      this.length -= bytes
      break
    }
  }
  return this
}


BufferList.prototype.duplicate = function duplicate () {
  var i = 0
    , copy = new BufferList()

  for (; i < this._bufs.length; i++)
    copy.append(this._bufs[i])

  return copy
}


BufferList.prototype.destroy = function destroy () {
  this._bufs.length = 0
  this.length = 0
  this.push(null)
}


;(function () {
  var methods = {
      'readDoubleBE' : 8
    , 'readDoubleLE' : 8
    , 'readFloatBE'  : 4
    , 'readFloatLE'  : 4
    , 'readInt32BE'  : 4
    , 'readInt32LE'  : 4
    , 'readUInt32BE' : 4
    , 'readUInt32LE' : 4
    , 'readInt16BE'  : 2
    , 'readInt16LE'  : 2
    , 'readUInt16BE' : 2
    , 'readUInt16LE' : 2
    , 'readInt8'     : 1
    , 'readUInt8'    : 1
  }

  for (var m in methods) {
    (function (m) {
      BufferList.prototype[m] = function (offset) {
        return this.slice(offset, offset + methods[m])[m](0)
      }
    }(m))
  }
}())


module.exports = BufferList

},{"readable-stream/duplex":66,"safe-buffer":114,"util":37}],66:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"./lib/_stream_duplex.js":67,"dup":16}],67:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"./_stream_readable":68,"./_stream_writable":69,"core-util-is":74,"dup":17,"inherits":89,"process-nextick-args":104}],68:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"./_stream_duplex":67,"./internal/streams/BufferList":70,"./internal/streams/destroy":71,"./internal/streams/stream":72,"_process":11,"core-util-is":74,"dup":19,"events":5,"inherits":89,"isarray":90,"process-nextick-args":104,"safe-buffer":114,"string_decoder/":116,"util":2}],69:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"./_stream_duplex":67,"./internal/streams/destroy":71,"./internal/streams/stream":72,"_process":11,"core-util-is":74,"dup":21,"inherits":89,"process-nextick-args":104,"safe-buffer":114,"timers":32,"util-deprecate":127}],70:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22,"safe-buffer":114,"util":2}],71:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23,"process-nextick-args":104}],72:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"events":5}],73:[function(require,module,exports){
'use strict';
// For more information about browser field, check out the browser field at https://github.com/substack/browserify-handbook#browser-field.

var styleElementsInsertedAtTop = [];

var insertStyleElement = function(styleElement, options) {
    var head = document.head || document.getElementsByTagName('head')[0];
    var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];

    options = options || {};
    options.insertAt = options.insertAt || 'bottom';

    if (options.insertAt === 'top') {
        if (!lastStyleElementInsertedAtTop) {
            head.insertBefore(styleElement, head.firstChild);
        } else if (lastStyleElementInsertedAtTop.nextSibling) {
            head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
        } else {
            head.appendChild(styleElement);
        }
        styleElementsInsertedAtTop.push(styleElement);
    } else if (options.insertAt === 'bottom') {
        head.appendChild(styleElement);
    } else {
        throw new Error('Invalid value for parameter \'insertAt\'. Must be \'top\' or \'bottom\'.');
    }
};

module.exports = {
    // Create a <link> tag with optional data attributes
    createLink: function(href, attributes) {
        var head = document.head || document.getElementsByTagName('head')[0];
        var link = document.createElement('link');

        link.href = href;
        link.rel = 'stylesheet';

        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            link.setAttribute('data-' + key, value);
        }

        head.appendChild(link);
    },
    // Create a <style> tag with optional data attributes
    createStyle: function(cssText, attributes, extraOptions) {
        extraOptions = extraOptions || {};

        var style = document.createElement('style');
        style.type = 'text/css';

        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            style.setAttribute('data-' + key, value);
        }

        if (style.sheet) { // for jsdom and IE9+
            style.innerHTML = cssText;
            style.sheet.cssText = cssText;
            insertStyleElement(style, { insertAt: extraOptions.insertAt });
        } else if (style.styleSheet) { // for IE8 and below
            insertStyleElement(style, { insertAt: extraOptions.insertAt });
            style.styleSheet.cssText = cssText;
        } else { // for Chrome, Firefox, and Safari
            style.appendChild(document.createTextNode(cssText));
            insertStyleElement(style, { insertAt: extraOptions.insertAt });
        }
    }
};

},{}],74:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../../../../../Users/rfuller/AppData/Roaming/npm/node_modules/browserify/node_modules/is-buffer/index.js")})
},{"../../../../../../Users/rfuller/AppData/Roaming/npm/node_modules/browserify/node_modules/is-buffer/index.js":38}],75:[function(require,module,exports){
/*!
 * docReady v1.0.4
 * Cross browser DOMContentLoaded event emitter
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true*/
/*global define: false, require: false, module: false */

( function( window ) {

'use strict';

var document = window.document;
// collection of functions to be triggered on ready
var queue = [];

function docReady( fn ) {
  // throw out non-functions
  if ( typeof fn !== 'function' ) {
    return;
  }

  if ( docReady.isReady ) {
    // ready now, hit it
    fn();
  } else {
    // queue function when ready
    queue.push( fn );
  }
}

docReady.isReady = false;

// triggered on various doc ready events
function onReady( event ) {
  // bail if already triggered or IE8 document is not ready just yet
  var isIE8NotReady = event.type === 'readystatechange' && document.readyState !== 'complete';
  if ( docReady.isReady || isIE8NotReady ) {
    return;
  }

  trigger();
}

function trigger() {
  docReady.isReady = true;
  // process queue
  for ( var i=0, len = queue.length; i < len; i++ ) {
    var fn = queue[i];
    fn();
  }
}

function defineDocReady( eventie ) {
  // trigger ready if page is ready
  if ( document.readyState === 'complete' ) {
    trigger();
  } else {
    // listen for events
    eventie.bind( document, 'DOMContentLoaded', onReady );
    eventie.bind( document, 'readystatechange', onReady );
    eventie.bind( window, 'load', onReady );
  }

  return docReady;
}

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( [ 'eventie/eventie' ], defineDocReady );
} else if ( typeof exports === 'object' ) {
  module.exports = defineDocReady( require('eventie') );
} else {
  // browser global
  window.docReady = defineDocReady( window.eventie );
}

})( window );

},{"eventie":87}],76:[function(require,module,exports){
(function (process,Buffer){
var stream = require('readable-stream')
var eos = require('end-of-stream')
var inherits = require('inherits')
var shift = require('stream-shift')

var SIGNAL_FLUSH = (Buffer.from && Buffer.from !== Uint8Array.from)
  ? Buffer.from([0])
  : new Buffer([0])

var onuncork = function(self, fn) {
  if (self._corked) self.once('uncork', fn)
  else fn()
}

var autoDestroy = function (self, err) {
  if (self._autoDestroy) self.destroy(err)
}

var destroyer = function(self, end) {
  return function(err) {
    if (err) autoDestroy(self, err.message === 'premature close' ? null : err)
    else if (end && !self._ended) self.end()
  }
}

var end = function(ws, fn) {
  if (!ws) return fn()
  if (ws._writableState && ws._writableState.finished) return fn()
  if (ws._writableState) return ws.end(fn)
  ws.end()
  fn()
}

var toStreams2 = function(rs) {
  return new (stream.Readable)({objectMode:true, highWaterMark:16}).wrap(rs)
}

var Duplexify = function(writable, readable, opts) {
  if (!(this instanceof Duplexify)) return new Duplexify(writable, readable, opts)
  stream.Duplex.call(this, opts)

  this._writable = null
  this._readable = null
  this._readable2 = null

  this._autoDestroy = !opts || opts.autoDestroy !== false
  this._forwardDestroy = !opts || opts.destroy !== false
  this._forwardEnd = !opts || opts.end !== false
  this._corked = 1 // start corked
  this._ondrain = null
  this._drained = false
  this._forwarding = false
  this._unwrite = null
  this._unread = null
  this._ended = false

  this.destroyed = false

  if (writable) this.setWritable(writable)
  if (readable) this.setReadable(readable)
}

inherits(Duplexify, stream.Duplex)

Duplexify.obj = function(writable, readable, opts) {
  if (!opts) opts = {}
  opts.objectMode = true
  opts.highWaterMark = 16
  return new Duplexify(writable, readable, opts)
}

Duplexify.prototype.cork = function() {
  if (++this._corked === 1) this.emit('cork')
}

Duplexify.prototype.uncork = function() {
  if (this._corked && --this._corked === 0) this.emit('uncork')
}

Duplexify.prototype.setWritable = function(writable) {
  if (this._unwrite) this._unwrite()

  if (this.destroyed) {
    if (writable && writable.destroy) writable.destroy()
    return
  }

  if (writable === null || writable === false) {
    this.end()
    return
  }

  var self = this
  var unend = eos(writable, {writable:true, readable:false}, destroyer(this, this._forwardEnd))

  var ondrain = function() {
    var ondrain = self._ondrain
    self._ondrain = null
    if (ondrain) ondrain()
  }

  var clear = function() {
    self._writable.removeListener('drain', ondrain)
    unend()
  }

  if (this._unwrite) process.nextTick(ondrain) // force a drain on stream reset to avoid livelocks

  this._writable = writable
  this._writable.on('drain', ondrain)
  this._unwrite = clear

  this.uncork() // always uncork setWritable
}

Duplexify.prototype.setReadable = function(readable) {
  if (this._unread) this._unread()

  if (this.destroyed) {
    if (readable && readable.destroy) readable.destroy()
    return
  }

  if (readable === null || readable === false) {
    this.push(null)
    this.resume()
    return
  }

  var self = this
  var unend = eos(readable, {writable:false, readable:true}, destroyer(this))

  var onreadable = function() {
    self._forward()
  }

  var onend = function() {
    self.push(null)
  }

  var clear = function() {
    self._readable2.removeListener('readable', onreadable)
    self._readable2.removeListener('end', onend)
    unend()
  }

  this._drained = true
  this._readable = readable
  this._readable2 = readable._readableState ? readable : toStreams2(readable)
  this._readable2.on('readable', onreadable)
  this._readable2.on('end', onend)
  this._unread = clear

  this._forward()
}

Duplexify.prototype._read = function() {
  this._drained = true
  this._forward()
}

Duplexify.prototype._forward = function() {
  if (this._forwarding || !this._readable2 || !this._drained) return
  this._forwarding = true

  var data

  while (this._drained && (data = shift(this._readable2)) !== null) {
    if (this.destroyed) continue
    this._drained = this.push(data)
  }

  this._forwarding = false
}

Duplexify.prototype.destroy = function(err) {
  if (this.destroyed) return
  this.destroyed = true

  var self = this
  process.nextTick(function() {
    self._destroy(err)
  })
}

Duplexify.prototype._destroy = function(err) {
  if (err) {
    var ondrain = this._ondrain
    this._ondrain = null
    if (ondrain) ondrain(err)
    else this.emit('error', err)
  }

  if (this._forwardDestroy) {
    if (this._readable && this._readable.destroy) this._readable.destroy()
    if (this._writable && this._writable.destroy) this._writable.destroy()
  }

  this.emit('close')
}

Duplexify.prototype._write = function(data, enc, cb) {
  if (this.destroyed) return cb()
  if (this._corked) return onuncork(this, this._write.bind(this, data, enc, cb))
  if (data === SIGNAL_FLUSH) return this._finish(cb)
  if (!this._writable) return cb()

  if (this._writable.write(data) === false) this._ondrain = cb
  else cb()
}

Duplexify.prototype._finish = function(cb) {
  var self = this
  this.emit('preend')
  onuncork(this, function() {
    end(self._forwardEnd && self._writable, function() {
      // haxx to not emit prefinish twice
      if (self._writableState.prefinished === false) self._writableState.prefinished = true
      self.emit('prefinish')
      onuncork(self, cb)
    })
  })
}

Duplexify.prototype.end = function(data, enc, cb) {
  if (typeof data === 'function') return this.end(null, null, data)
  if (typeof enc === 'function') return this.end(data, null, enc)
  this._ended = true
  if (data) this.write(data)
  if (!this._writableState.ending) this.write(SIGNAL_FLUSH)
  return stream.Writable.prototype.end.call(this, cb)
}

module.exports = Duplexify

}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":11,"buffer":3,"end-of-stream":86,"inherits":89,"readable-stream":85,"stream-shift":115}],77:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"./_stream_readable":79,"./_stream_writable":81,"core-util-is":74,"dup":17,"inherits":89,"process-nextick-args":104}],78:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"./_stream_transform":80,"core-util-is":74,"dup":18,"inherits":89}],79:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"./_stream_duplex":77,"./internal/streams/BufferList":82,"./internal/streams/destroy":83,"./internal/streams/stream":84,"_process":11,"core-util-is":74,"dup":19,"events":5,"inherits":89,"isarray":90,"process-nextick-args":104,"safe-buffer":114,"string_decoder/":116,"util":2}],80:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"./_stream_duplex":77,"core-util-is":74,"dup":20,"inherits":89}],81:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"./_stream_duplex":77,"./internal/streams/destroy":83,"./internal/streams/stream":84,"_process":11,"core-util-is":74,"dup":21,"inherits":89,"process-nextick-args":104,"safe-buffer":114,"timers":32,"util-deprecate":127}],82:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22,"safe-buffer":114,"util":2}],83:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23,"process-nextick-args":104}],84:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"events":5}],85:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"./lib/_stream_duplex.js":77,"./lib/_stream_passthrough.js":78,"./lib/_stream_readable.js":79,"./lib/_stream_transform.js":80,"./lib/_stream_writable.js":81,"dup":27}],86:[function(require,module,exports){
var once = require('once');

var noop = function() {};

var isRequest = function(stream) {
	return stream.setHeader && typeof stream.abort === 'function';
};

var isChildProcess = function(stream) {
	return stream.stdio && Array.isArray(stream.stdio) && stream.stdio.length === 3
};

var eos = function(stream, opts, callback) {
	if (typeof opts === 'function') return eos(stream, null, opts);
	if (!opts) opts = {};

	callback = once(callback || noop);

	var ws = stream._writableState;
	var rs = stream._readableState;
	var readable = opts.readable || (opts.readable !== false && stream.readable);
	var writable = opts.writable || (opts.writable !== false && stream.writable);

	var onlegacyfinish = function() {
		if (!stream.writable) onfinish();
	};

	var onfinish = function() {
		writable = false;
		if (!readable) callback.call(stream);
	};

	var onend = function() {
		readable = false;
		if (!writable) callback.call(stream);
	};

	var onexit = function(exitCode) {
		callback.call(stream, exitCode ? new Error('exited with error code: ' + exitCode) : null);
	};

	var onerror = function(err) {
		callback.call(stream, err);
	};

	var onclose = function() {
		if (readable && !(rs && rs.ended)) return callback.call(stream, new Error('premature close'));
		if (writable && !(ws && ws.ended)) return callback.call(stream, new Error('premature close'));
	};

	var onrequest = function() {
		stream.req.on('finish', onfinish);
	};

	if (isRequest(stream)) {
		stream.on('complete', onfinish);
		stream.on('abort', onclose);
		if (stream.req) onrequest();
		else stream.on('request', onrequest);
	} else if (writable && !ws) { // legacy streams
		stream.on('end', onlegacyfinish);
		stream.on('close', onlegacyfinish);
	}

	if (isChildProcess(stream)) stream.on('exit', onexit);

	stream.on('end', onend);
	stream.on('finish', onfinish);
	if (opts.error !== false) stream.on('error', onerror);
	stream.on('close', onclose);

	return function() {
		stream.removeListener('complete', onfinish);
		stream.removeListener('abort', onclose);
		stream.removeListener('request', onrequest);
		if (stream.req) stream.req.removeListener('finish', onfinish);
		stream.removeListener('end', onlegacyfinish);
		stream.removeListener('close', onlegacyfinish);
		stream.removeListener('finish', onfinish);
		stream.removeListener('exit', onexit);
		stream.removeListener('end', onend);
		stream.removeListener('error', onerror);
		stream.removeListener('close', onclose);
	};
};

module.exports = eos;

},{"once":103}],87:[function(require,module,exports){
/*!
 * eventie v1.0.6
 * event binding helper
 *   eventie.bind( elem, 'click', myFn )
 *   eventie.unbind( elem, 'click', myFn )
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true */
/*global define: false, module: false */

( function( window ) {

'use strict';

var docElem = document.documentElement;

var bind = function() {};

function getIEEvent( obj ) {
  var event = window.event;
  // add event.target
  event.target = event.target || event.srcElement || obj;
  return event;
}

if ( docElem.addEventListener ) {
  bind = function( obj, type, fn ) {
    obj.addEventListener( type, fn, false );
  };
} else if ( docElem.attachEvent ) {
  bind = function( obj, type, fn ) {
    obj[ type + fn ] = fn.handleEvent ?
      function() {
        var event = getIEEvent( obj );
        fn.handleEvent.call( fn, event );
      } :
      function() {
        var event = getIEEvent( obj );
        fn.call( obj, event );
      };
    obj.attachEvent( "on" + type, obj[ type + fn ] );
  };
}

var unbind = function() {};

if ( docElem.removeEventListener ) {
  unbind = function( obj, type, fn ) {
    obj.removeEventListener( type, fn, false );
  };
} else if ( docElem.detachEvent ) {
  unbind = function( obj, type, fn ) {
    obj.detachEvent( "on" + type, obj[ type + fn ] );
    try {
      delete obj[ type + fn ];
    } catch ( err ) {
      // can't delete window object properties
      obj[ type + fn ] = undefined;
    }
  };
}

var eventie = {
  bind: bind,
  unbind: unbind
};

// ----- module definition ----- //

if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( eventie );
} else if ( typeof exports === 'object' ) {
  // CommonJS
  module.exports = eventie;
} else {
  // browser global
  window.eventie = eventie;
}

})( window );

},{}],88:[function(require,module,exports){
/*
 Highstock JS v6.1.4 (2018-09-25)

 (c) 2009-2016 Torstein Honsi

 License: www.highcharts.com/license
*/
(function(P,J){"object"===typeof module&&module.exports?module.exports=P.document?J(P):J:"function"===typeof define&&define.amd?define(function(){return J(P)}):P.Highcharts=J(P)})("undefined"!==typeof window?window:this,function(P){var J=function(){var a="undefined"===typeof P?window:P,E=a.document,F=a.navigator&&a.navigator.userAgent||"",G=E&&E.createElementNS&&!!E.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect,q=/(edge|msie|trident)/i.test(F)&&!a.opera,l=-1!==F.indexOf("Firefox"),
f=-1!==F.indexOf("Chrome"),u=l&&4>parseInt(F.split("Firefox/")[1],10);return a.Highcharts?a.Highcharts.error(16,!0):{product:"Highstock",version:"6.1.4",deg2rad:2*Math.PI/360,doc:E,hasBidiBug:u,hasTouch:E&&void 0!==E.documentElement.ontouchstart,isMS:q,isWebKit:-1!==F.indexOf("AppleWebKit"),isFirefox:l,isChrome:f,isSafari:!f&&-1!==F.indexOf("Safari"),isTouchDevice:/(Mobile|Android|Windows Phone)/.test(F),SVG_NS:"http://www.w3.org/2000/svg",chartCount:0,seriesTypes:{},symbolSizes:{},svg:G,win:a,marginNames:["plotTop",
"marginRight","marginBottom","plotLeft"],noop:function(){},charts:[]}}();(function(a){a.timers=[];var E=a.charts,F=a.doc,G=a.win;a.error=function(q,l){q=a.isNumber(q)?"Highcharts error #"+q+": www.highcharts.com/errors/"+q:q;if(l)throw Error(q);G.console&&console.log(q)};a.Fx=function(a,l,f){this.options=l;this.elem=a;this.prop=f};a.Fx.prototype={dSetter:function(){var a=this.paths[0],l=this.paths[1],f=[],u=this.now,C=a.length,r;if(1===u)f=this.toD;else if(C===l.length&&1>u)for(;C--;)r=parseFloat(a[C]),
f[C]=isNaN(r)?l[C]:u*parseFloat(l[C]-r)+r;else f=l;this.elem.attr("d",f,null,!0)},update:function(){var a=this.elem,l=this.prop,f=this.now,u=this.options.step;if(this[l+"Setter"])this[l+"Setter"]();else a.attr?a.element&&a.attr(l,f,null,!0):a.style[l]=f+this.unit;u&&u.call(a,f,this)},run:function(q,l,f){var u=this,C=u.options,r=function(a){return r.stopped?!1:u.step(a)},y=G.requestAnimationFrame||function(a){setTimeout(a,13)},p=function(){for(var d=0;d<a.timers.length;d++)a.timers[d]()||a.timers.splice(d--,
1);a.timers.length&&y(p)};q!==l||this.elem["forceAnimate:"+this.prop]?(this.startTime=+new Date,this.start=q,this.end=l,this.unit=f,this.now=this.start,this.pos=0,r.elem=this.elem,r.prop=this.prop,r()&&1===a.timers.push(r)&&y(p)):(delete C.curAnim[this.prop],C.complete&&0===a.keys(C.curAnim).length&&C.complete.call(this.elem))},step:function(q){var l=+new Date,f,u=this.options,C=this.elem,r=u.complete,y=u.duration,p=u.curAnim;C.attr&&!C.element?q=!1:q||l>=y+this.startTime?(this.now=this.end,this.pos=
1,this.update(),f=p[this.prop]=!0,a.objectEach(p,function(a){!0!==a&&(f=!1)}),f&&r&&r.call(C),q=!1):(this.pos=u.easing((l-this.startTime)/y),this.now=this.start+(this.end-this.start)*this.pos,this.update(),q=!0);return q},initPath:function(q,l,f){function u(a){var b,d;for(c=a.length;c--;)b="M"===a[c]||"L"===a[c],d=/[a-zA-Z]/.test(a[c+3]),b&&d&&a.splice(c+1,0,a[c+1],a[c+2],a[c+1],a[c+2])}function C(a,b){for(;a.length<m;){a[0]=b[m-a.length];var d=a.slice(0,g);[].splice.apply(a,[0,0].concat(d));x&&(d=
a.slice(a.length-g),[].splice.apply(a,[a.length,0].concat(d)),c--)}a[0]="M"}function r(a,c){for(var d=(m-a.length)/g;0<d&&d--;)b=a.slice().splice(a.length/B-g,g*B),b[0]=c[m-g-d*g],e&&(b[g-6]=b[g-2],b[g-5]=b[g-1]),[].splice.apply(a,[a.length/B,0].concat(b)),x&&d--}l=l||"";var y,p=q.startX,d=q.endX,e=-1<l.indexOf("C"),g=e?7:3,m,b,c;l=l.split(" ");f=f.slice();var x=q.isArea,B=x?2:1,t;e&&(u(l),u(f));if(p&&d){for(c=0;c<p.length;c++)if(p[c]===d[0]){y=c;break}else if(p[0]===d[d.length-p.length+c]){y=c;t=
!0;break}void 0===y&&(l=[])}l.length&&a.isNumber(y)&&(m=f.length+y*B*g,t?(C(l,f),r(f,l)):(C(f,l),r(l,f)));return[l,f]},fillSetter:function(){a.Fx.prototype.strokeSetter.apply(this,arguments)},strokeSetter:function(){this.elem.attr(this.prop,a.color(this.start).tweenTo(a.color(this.end),this.pos),null,!0)}};a.merge=function(){var q,l=arguments,f,u={},C=function(f,y){"object"!==typeof f&&(f={});a.objectEach(y,function(p,d){!a.isObject(p,!0)||a.isClass(p)||a.isDOMElement(p)?f[d]=y[d]:f[d]=C(f[d]||{},
p)});return f};!0===l[0]&&(u=l[1],l=Array.prototype.slice.call(l,2));f=l.length;for(q=0;q<f;q++)u=C(u,l[q]);return u};a.pInt=function(a,l){return parseInt(a,l||10)};a.isString=function(a){return"string"===typeof a};a.isArray=function(a){a=Object.prototype.toString.call(a);return"[object Array]"===a||"[object Array Iterator]"===a};a.isObject=function(q,l){return!!q&&"object"===typeof q&&(!l||!a.isArray(q))};a.isDOMElement=function(q){return a.isObject(q)&&"number"===typeof q.nodeType};a.isClass=function(q){var l=
q&&q.constructor;return!(!a.isObject(q,!0)||a.isDOMElement(q)||!l||!l.name||"Object"===l.name)};a.isNumber=function(a){return"number"===typeof a&&!isNaN(a)&&Infinity>a&&-Infinity<a};a.erase=function(a,l){for(var f=a.length;f--;)if(a[f]===l){a.splice(f,1);break}};a.defined=function(a){return void 0!==a&&null!==a};a.attr=function(q,l,f){var u;a.isString(l)?a.defined(f)?q.setAttribute(l,f):q&&q.getAttribute&&((u=q.getAttribute(l))||"class"!==l||(u=q.getAttribute(l+"Name"))):a.defined(l)&&a.isObject(l)&&
a.objectEach(l,function(a,f){q.setAttribute(f,a)});return u};a.splat=function(q){return a.isArray(q)?q:[q]};a.syncTimeout=function(a,l,f){if(l)return setTimeout(a,l,f);a.call(0,f)};a.clearTimeout=function(q){a.defined(q)&&clearTimeout(q)};a.extend=function(a,l){var f;a||(a={});for(f in l)a[f]=l[f];return a};a.pick=function(){var a=arguments,l,f,u=a.length;for(l=0;l<u;l++)if(f=a[l],void 0!==f&&null!==f)return f};a.css=function(q,l){a.isMS&&!a.svg&&l&&void 0!==l.opacity&&(l.filter="alpha(opacity\x3d"+
100*l.opacity+")");a.extend(q.style,l)};a.createElement=function(q,l,f,u,C){q=F.createElement(q);var r=a.css;l&&a.extend(q,l);C&&r(q,{padding:0,border:"none",margin:0});f&&r(q,f);u&&u.appendChild(q);return q};a.extendClass=function(q,l){var f=function(){};f.prototype=new q;a.extend(f.prototype,l);return f};a.pad=function(a,l,f){return Array((l||2)+1-String(a).replace("-","").length).join(f||0)+a};a.relativeLength=function(a,l,f){return/%$/.test(a)?l*parseFloat(a)/100+(f||0):parseFloat(a)};a.wrap=
function(a,l,f){var u=a[l];a[l]=function(){var a=Array.prototype.slice.call(arguments),r=arguments,y=this;y.proceed=function(){u.apply(y,arguments.length?arguments:r)};a.unshift(u);a=f.apply(this,a);y.proceed=null;return a}};a.formatSingle=function(q,l,f){var u=/\.([0-9])/,C=a.defaultOptions.lang;/f$/.test(q)?(f=(f=q.match(u))?f[1]:-1,null!==l&&(l=a.numberFormat(l,f,C.decimalPoint,-1<q.indexOf(",")?C.thousandsSep:""))):l=(f||a.time).dateFormat(q,l);return l};a.format=function(q,l,f){for(var u="{",
C=!1,r,y,p,d,e=[],g;q;){u=q.indexOf(u);if(-1===u)break;r=q.slice(0,u);if(C){r=r.split(":");y=r.shift().split(".");d=y.length;g=l;for(p=0;p<d;p++)g&&(g=g[y[p]]);r.length&&(g=a.formatSingle(r.join(":"),g,f));e.push(g)}else e.push(r);q=q.slice(u+1);u=(C=!C)?"}":"{"}e.push(q);return e.join("")};a.getMagnitude=function(a){return Math.pow(10,Math.floor(Math.log(a)/Math.LN10))};a.normalizeTickInterval=function(q,l,f,u,C){var r,y=q;f=a.pick(f,1);r=q/f;l||(l=C?[1,1.2,1.5,2,2.5,3,4,5,6,8,10]:[1,2,2.5,5,10],
!1===u&&(1===f?l=a.grep(l,function(a){return 0===a%1}):.1>=f&&(l=[1/f])));for(u=0;u<l.length&&!(y=l[u],C&&y*f>=q||!C&&r<=(l[u]+(l[u+1]||l[u]))/2);u++);return y=a.correctFloat(y*f,-Math.round(Math.log(.001)/Math.LN10))};a.stableSort=function(a,l){var f=a.length,u,C;for(C=0;C<f;C++)a[C].safeI=C;a.sort(function(a,f){u=l(a,f);return 0===u?a.safeI-f.safeI:u});for(C=0;C<f;C++)delete a[C].safeI};a.arrayMin=function(a){for(var l=a.length,f=a[0];l--;)a[l]<f&&(f=a[l]);return f};a.arrayMax=function(a){for(var l=
a.length,f=a[0];l--;)a[l]>f&&(f=a[l]);return f};a.destroyObjectProperties=function(q,l){a.objectEach(q,function(a,u){a&&a!==l&&a.destroy&&a.destroy();delete q[u]})};a.discardElement=function(q){var l=a.garbageBin;l||(l=a.createElement("div"));q&&l.appendChild(q);l.innerHTML=""};a.correctFloat=function(a,l){return parseFloat(a.toPrecision(l||14))};a.setAnimation=function(q,l){l.renderer.globalAnimation=a.pick(q,l.options.chart.animation,!0)};a.animObject=function(q){return a.isObject(q)?a.merge(q):
{duration:q?500:0}};a.timeUnits={millisecond:1,second:1E3,minute:6E4,hour:36E5,day:864E5,week:6048E5,month:24192E5,year:314496E5};a.numberFormat=function(q,l,f,u){q=+q||0;l=+l;var C=a.defaultOptions.lang,r=(q.toString().split(".")[1]||"").split("e")[0].length,y,p,d=q.toString().split("e");-1===l?l=Math.min(r,20):a.isNumber(l)?l&&d[1]&&0>d[1]&&(y=l+ +d[1],0<=y?(d[0]=(+d[0]).toExponential(y).split("e")[0],l=y):(d[0]=d[0].split(".")[0]||0,q=20>l?(d[0]*Math.pow(10,d[1])).toFixed(l):0,d[1]=0)):l=2;p=(Math.abs(d[1]?
d[0]:q)+Math.pow(10,-Math.max(l,r)-1)).toFixed(l);r=String(a.pInt(p));y=3<r.length?r.length%3:0;f=a.pick(f,C.decimalPoint);u=a.pick(u,C.thousandsSep);q=(0>q?"-":"")+(y?r.substr(0,y)+u:"");q+=r.substr(y).replace(/(\d{3})(?=\d)/g,"$1"+u);l&&(q+=f+p.slice(-l));d[1]&&0!==+q&&(q+="e"+d[1]);return q};Math.easeInOutSine=function(a){return-.5*(Math.cos(Math.PI*a)-1)};a.getStyle=function(q,l,f){if("width"===l)return Math.max(0,Math.min(q.offsetWidth,q.scrollWidth)-a.getStyle(q,"padding-left")-a.getStyle(q,
"padding-right"));if("height"===l)return Math.max(0,Math.min(q.offsetHeight,q.scrollHeight)-a.getStyle(q,"padding-top")-a.getStyle(q,"padding-bottom"));G.getComputedStyle||a.error(27,!0);if(q=G.getComputedStyle(q,void 0))q=q.getPropertyValue(l),a.pick(f,"opacity"!==l)&&(q=a.pInt(q));return q};a.inArray=function(q,l,f){return(a.indexOfPolyfill||Array.prototype.indexOf).call(l,q,f)};a.grep=function(q,l){return(a.filterPolyfill||Array.prototype.filter).call(q,l)};a.find=Array.prototype.find?function(a,
l){return a.find(l)}:function(a,l){var f,u=a.length;for(f=0;f<u;f++)if(l(a[f],f))return a[f]};a.some=function(q,l,f){return(a.somePolyfill||Array.prototype.some).call(q,l,f)};a.map=function(a,l){for(var f=[],u=0,C=a.length;u<C;u++)f[u]=l.call(a[u],a[u],u,a);return f};a.keys=function(q){return(a.keysPolyfill||Object.keys).call(void 0,q)};a.reduce=function(q,l,f){return(a.reducePolyfill||Array.prototype.reduce).apply(q,2<arguments.length?[l,f]:[l])};a.offset=function(a){var l=F.documentElement;a=a.parentElement||
a.parentNode?a.getBoundingClientRect():{top:0,left:0};return{top:a.top+(G.pageYOffset||l.scrollTop)-(l.clientTop||0),left:a.left+(G.pageXOffset||l.scrollLeft)-(l.clientLeft||0)}};a.stop=function(q,l){for(var f=a.timers.length;f--;)a.timers[f].elem!==q||l&&l!==a.timers[f].prop||(a.timers[f].stopped=!0)};a.each=function(q,l,f){return(a.forEachPolyfill||Array.prototype.forEach).call(q,l,f)};a.objectEach=function(a,l,f){for(var u in a)a.hasOwnProperty(u)&&l.call(f||a[u],a[u],u,a)};a.addEvent=function(q,
l,f,u){var C,r=q.addEventListener||a.addEventListenerPolyfill;C="function"===typeof q&&q.prototype?q.prototype.protoEvents=q.prototype.protoEvents||{}:q.hcEvents=q.hcEvents||{};a.Point&&q instanceof a.Point&&q.series&&q.series.chart&&(q.series.chart.runTrackerClick=!0);r&&r.call(q,l,f,!1);C[l]||(C[l]=[]);C[l].push(f);u&&a.isNumber(u.order)&&(f.order=u.order,C[l].sort(function(a,p){return a.order-p.order}));return function(){a.removeEvent(q,l,f)}};a.removeEvent=function(q,l,f){function u(p,d){var e=
q.removeEventListener||a.removeEventListenerPolyfill;e&&e.call(q,p,d,!1)}function C(p){var d,e;q.nodeName&&(l?(d={},d[l]=!0):d=p,a.objectEach(d,function(a,d){if(p[d])for(e=p[d].length;e--;)u(d,p[d][e])}))}var r,y;a.each(["protoEvents","hcEvents"],function(p){var d=q[p];d&&(l?(r=d[l]||[],f?(y=a.inArray(f,r),-1<y&&(r.splice(y,1),d[l]=r),u(l,f)):(C(d),d[l]=[])):(C(d),q[p]={}))})};a.fireEvent=function(q,l,f,u){var C,r,y,p,d;f=f||{};F.createEvent&&(q.dispatchEvent||q.fireEvent)?(C=F.createEvent("Events"),
C.initEvent(l,!0,!0),a.extend(C,f),q.dispatchEvent?q.dispatchEvent(C):q.fireEvent(l,C)):a.each(["protoEvents","hcEvents"],function(e){if(q[e])for(r=q[e][l]||[],y=r.length,f.target||a.extend(f,{preventDefault:function(){f.defaultPrevented=!0},target:q,type:l}),p=0;p<y;p++)(d=r[p])&&!1===d.call(q,f)&&f.preventDefault()});u&&!f.defaultPrevented&&u.call(q,f)};a.animate=function(q,l,f){var u,C="",r,y,p;a.isObject(f)||(p=arguments,f={duration:p[2],easing:p[3],complete:p[4]});a.isNumber(f.duration)||(f.duration=
400);f.easing="function"===typeof f.easing?f.easing:Math[f.easing]||Math.easeInOutSine;f.curAnim=a.merge(l);a.objectEach(l,function(d,e){a.stop(q,e);y=new a.Fx(q,f,e);r=null;"d"===e?(y.paths=y.initPath(q,q.d,l.d),y.toD=l.d,u=0,r=1):q.attr?u=q.attr(e):(u=parseFloat(a.getStyle(q,e))||0,"opacity"!==e&&(C="px"));r||(r=d);r&&r.match&&r.match("px")&&(r=r.replace(/px/g,""));y.run(u,r,C)})};a.seriesType=function(q,l,f,u,C){var r=a.getOptions(),y=a.seriesTypes;r.plotOptions[q]=a.merge(r.plotOptions[l],f);
y[q]=a.extendClass(y[l]||function(){},u);y[q].prototype.type=q;C&&(y[q].prototype.pointClass=a.extendClass(a.Point,C));return y[q]};a.uniqueKey=function(){var a=Math.random().toString(36).substring(2,9),l=0;return function(){return"highcharts-"+a+"-"+l++}}();G.jQuery&&(G.jQuery.fn.highcharts=function(){var q=[].slice.call(arguments);if(this[0])return q[0]?(new (a[a.isString(q[0])?q.shift():"Chart"])(this[0],q[0],q[1]),this):E[a.attr(this[0],"data-highcharts-chart")]})})(J);(function(a){var E=a.each,
F=a.isNumber,G=a.map,q=a.merge,l=a.pInt;a.Color=function(f){if(!(this instanceof a.Color))return new a.Color(f);this.init(f)};a.Color.prototype={parsers:[{regex:/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]?(?:\.[0-9]+)?)\s*\)/,parse:function(a){return[l(a[1]),l(a[2]),l(a[3]),parseFloat(a[4],10)]}},{regex:/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/,parse:function(a){return[l(a[1]),l(a[2]),l(a[3]),1]}}],names:{white:"#ffffff",black:"#000000"},init:function(f){var l,
C,r,y;if((this.input=f=this.names[f&&f.toLowerCase?f.toLowerCase():""]||f)&&f.stops)this.stops=G(f.stops,function(p){return new a.Color(p[1])});else if(f&&f.charAt&&"#"===f.charAt()&&(l=f.length,f=parseInt(f.substr(1),16),7===l?C=[(f&16711680)>>16,(f&65280)>>8,f&255,1]:4===l&&(C=[(f&3840)>>4|(f&3840)>>8,(f&240)>>4|f&240,(f&15)<<4|f&15,1])),!C)for(r=this.parsers.length;r--&&!C;)y=this.parsers[r],(l=y.regex.exec(f))&&(C=y.parse(l));this.rgba=C||[]},get:function(a){var f=this.input,l=this.rgba,r;this.stops?
(r=q(f),r.stops=[].concat(r.stops),E(this.stops,function(f,p){r.stops[p]=[r.stops[p][0],f.get(a)]})):r=l&&F(l[0])?"rgb"===a||!a&&1===l[3]?"rgb("+l[0]+","+l[1]+","+l[2]+")":"a"===a?l[3]:"rgba("+l.join(",")+")":f;return r},brighten:function(a){var f,C=this.rgba;if(this.stops)E(this.stops,function(f){f.brighten(a)});else if(F(a)&&0!==a)for(f=0;3>f;f++)C[f]+=l(255*a),0>C[f]&&(C[f]=0),255<C[f]&&(C[f]=255);return this},setOpacity:function(a){this.rgba[3]=a;return this},tweenTo:function(a,l){var f=this.rgba,
r=a.rgba;r.length&&f&&f.length?(a=1!==r[3]||1!==f[3],l=(a?"rgba(":"rgb(")+Math.round(r[0]+(f[0]-r[0])*(1-l))+","+Math.round(r[1]+(f[1]-r[1])*(1-l))+","+Math.round(r[2]+(f[2]-r[2])*(1-l))+(a?","+(r[3]+(f[3]-r[3])*(1-l)):"")+")"):l=a.input||"none";return l}};a.color=function(f){return new a.Color(f)}})(J);(function(a){var E,F,G=a.addEvent,q=a.animate,l=a.attr,f=a.charts,u=a.color,C=a.css,r=a.createElement,y=a.defined,p=a.deg2rad,d=a.destroyObjectProperties,e=a.doc,g=a.each,m=a.extend,b=a.erase,c=a.grep,
x=a.hasTouch,B=a.inArray,t=a.isArray,n=a.isFirefox,L=a.isMS,z=a.isObject,D=a.isString,h=a.isWebKit,I=a.merge,H=a.noop,v=a.objectEach,w=a.pick,k=a.pInt,A=a.removeEvent,Q=a.stop,T=a.svg,K=a.SVG_NS,O=a.symbolSizes,N=a.win;E=a.SVGElement=function(){return this};m(E.prototype,{opacity:1,SVG_NS:K,textProps:"direction fontSize fontWeight fontFamily fontStyle color lineHeight width textAlign textDecoration textOverflow textOutline cursor".split(" "),init:function(a,b){this.element="span"===b?r(b):e.createElementNS(this.SVG_NS,
b);this.renderer=a},animate:function(b,k,c){k=a.animObject(w(k,this.renderer.globalAnimation,!0));0!==k.duration?(c&&(k.complete=c),q(this,b,k)):(this.attr(b,null,c),k.step&&k.step.call(this));return this},complexColor:function(b,k,c){var M=this.renderer,A,d,h,m,K,w,e,x,n,B,z,D=[],H;a.fireEvent(this.renderer,"complexColor",{args:arguments},function(){b.radialGradient?d="radialGradient":b.linearGradient&&(d="linearGradient");d&&(h=b[d],K=M.gradients,e=b.stops,B=c.radialReference,t(h)&&(b[d]=h={x1:h[0],
y1:h[1],x2:h[2],y2:h[3],gradientUnits:"userSpaceOnUse"}),"radialGradient"===d&&B&&!y(h.gradientUnits)&&(m=h,h=I(h,M.getRadialAttr(B,m),{gradientUnits:"userSpaceOnUse"})),v(h,function(a,b){"id"!==b&&D.push(b,a)}),v(e,function(a){D.push(a)}),D=D.join(","),K[D]?z=K[D].attr("id"):(h.id=z=a.uniqueKey(),K[D]=w=M.createElement(d).attr(h).add(M.defs),w.radAttr=m,w.stops=[],g(e,function(b){0===b[1].indexOf("rgba")?(A=a.color(b[1]),x=A.get("rgb"),n=A.get("a")):(x=b[1],n=1);b=M.createElement("stop").attr({offset:b[0],
"stop-color":x,"stop-opacity":n}).add(w);w.stops.push(b)})),H="url("+M.url+"#"+z+")",c.setAttribute(k,H),c.gradient=D,b.toString=function(){return H})})},applyTextOutline:function(k){var c=this.element,M,A,d,h,m;-1!==k.indexOf("contrast")&&(k=k.replace(/contrast/g,this.renderer.getContrast(c.style.fill)));k=k.split(" ");A=k[k.length-1];if((d=k[0])&&"none"!==d&&a.svg){this.fakeTS=!0;k=[].slice.call(c.getElementsByTagName("tspan"));this.ySetter=this.xSetter;d=d.replace(/(^[\d\.]+)(.*?)$/g,function(a,
b,k){return 2*b+k});for(m=k.length;m--;)M=k[m],"highcharts-text-outline"===M.getAttribute("class")&&b(k,c.removeChild(M));h=c.firstChild;g(k,function(a,b){0===b&&(a.setAttribute("x",c.getAttribute("x")),b=c.getAttribute("y"),a.setAttribute("y",b||0),null===b&&c.setAttribute("y",0));a=a.cloneNode(1);l(a,{"class":"highcharts-text-outline",fill:A,stroke:A,"stroke-width":d,"stroke-linejoin":"round"});c.insertBefore(a,h)})}},attr:function(a,b,k,c){var M,A=this.element,d,h=this,m,K;"string"===typeof a&&
void 0!==b&&(M=a,a={},a[M]=b);"string"===typeof a?h=(this[a+"Getter"]||this._defaultGetter).call(this,a,A):(v(a,function(b,k){m=!1;c||Q(this,k);this.symbolName&&/^(x|y|width|height|r|start|end|innerR|anchorX|anchorY)$/.test(k)&&(d||(this.symbolAttr(a),d=!0),m=!0);!this.rotation||"x"!==k&&"y"!==k||(this.doTransform=!0);m||(K=this[k+"Setter"]||this._defaultSetter,K.call(this,b,k,A),this.shadows&&/^(width|height|visibility|x|y|d|transform|cx|cy|r)$/.test(k)&&this.updateShadows(k,b,K))},this),this.afterSetters());
k&&k.call(this);return h},afterSetters:function(){this.doTransform&&(this.updateTransform(),this.doTransform=!1)},updateShadows:function(a,b,k){for(var c=this.shadows,M=c.length;M--;)k.call(c[M],"height"===a?Math.max(b-(c[M].cutHeight||0),0):"d"===a?this.d:b,a,c[M])},addClass:function(a,b){var k=this.attr("class")||"";-1===k.indexOf(a)&&(b||(a=(k+(k?" ":"")+a).replace("  "," ")),this.attr("class",a));return this},hasClass:function(a){return-1!==B(a,(this.attr("class")||"").split(" "))},removeClass:function(a){return this.attr("class",
(this.attr("class")||"").replace(a,""))},symbolAttr:function(a){var b=this;g("x y r start end width height innerR anchorX anchorY".split(" "),function(k){b[k]=w(a[k],b[k])});b.attr({d:b.renderer.symbols[b.symbolName](b.x,b.y,b.width,b.height,b)})},clip:function(a){return this.attr("clip-path",a?"url("+this.renderer.url+"#"+a.id+")":"none")},crisp:function(a,b){var k;b=b||a.strokeWidth||0;k=Math.round(b)%2/2;a.x=Math.floor(a.x||this.x||0)+k;a.y=Math.floor(a.y||this.y||0)+k;a.width=Math.floor((a.width||
this.width||0)-2*k);a.height=Math.floor((a.height||this.height||0)-2*k);y(a.strokeWidth)&&(a.strokeWidth=b);return a},css:function(a){var b=this.styles,c={},A=this.element,d,M="",h,K=!b,w=["textOutline","textOverflow","width"];a&&a.color&&(a.fill=a.color);b&&v(a,function(a,k){a!==b[k]&&(c[k]=a,K=!0)});K&&(b&&(a=m(b,c)),a&&(null===a.width||"auto"===a.width?delete this.textWidth:"text"===A.nodeName.toLowerCase()&&a.width&&(d=this.textWidth=k(a.width))),this.styles=a,d&&!T&&this.renderer.forExport&&
delete a.width,A.namespaceURI===this.SVG_NS?(h=function(a,b){return"-"+b.toLowerCase()},v(a,function(a,b){-1===B(b,w)&&(M+=b.replace(/([A-Z])/g,h)+":"+a+";")}),M&&l(A,"style",M)):C(A,a),this.added&&("text"===this.element.nodeName&&this.renderer.buildText(this),a&&a.textOutline&&this.applyTextOutline(a.textOutline)));return this},strokeWidth:function(){return this["stroke-width"]||0},on:function(a,b){var k=this,c=k.element;x&&"click"===a?(c.ontouchstart=function(a){k.touchEventFired=Date.now();a.preventDefault();
b.call(c,a)},c.onclick=function(a){(-1===N.navigator.userAgent.indexOf("Android")||1100<Date.now()-(k.touchEventFired||0))&&b.call(c,a)}):c["on"+a]=b;return this},setRadialReference:function(a){var b=this.renderer.gradients[this.element.gradient];this.element.radialReference=a;b&&b.radAttr&&b.animate(this.renderer.getRadialAttr(a,b.radAttr));return this},translate:function(a,b){return this.attr({translateX:a,translateY:b})},invert:function(a){this.inverted=a;this.updateTransform();return this},updateTransform:function(){var a=
this.translateX||0,b=this.translateY||0,k=this.scaleX,c=this.scaleY,A=this.inverted,d=this.rotation,h=this.matrix,m=this.element;A&&(a+=this.width,b+=this.height);a=["translate("+a+","+b+")"];y(h)&&a.push("matrix("+h.join(",")+")");A?a.push("rotate(90) scale(-1,1)"):d&&a.push("rotate("+d+" "+w(this.rotationOriginX,m.getAttribute("x"),0)+" "+w(this.rotationOriginY,m.getAttribute("y")||0)+")");(y(k)||y(c))&&a.push("scale("+w(k,1)+" "+w(c,1)+")");a.length&&m.setAttribute("transform",a.join(" "))},toFront:function(){var a=
this.element;a.parentNode.appendChild(a);return this},align:function(a,k,c){var A,d,h,M,m={};d=this.renderer;h=d.alignedObjects;var K,v;if(a){if(this.alignOptions=a,this.alignByTranslate=k,!c||D(c))this.alignTo=A=c||"renderer",b(h,this),h.push(this),c=null}else a=this.alignOptions,k=this.alignByTranslate,A=this.alignTo;c=w(c,d[A],d);A=a.align;d=a.verticalAlign;h=(c.x||0)+(a.x||0);M=(c.y||0)+(a.y||0);"right"===A?K=1:"center"===A&&(K=2);K&&(h+=(c.width-(a.width||0))/K);m[k?"translateX":"x"]=Math.round(h);
"bottom"===d?v=1:"middle"===d&&(v=2);v&&(M+=(c.height-(a.height||0))/v);m[k?"translateY":"y"]=Math.round(M);this[this.placed?"animate":"attr"](m);this.placed=!0;this.alignAttr=m;return this},getBBox:function(a,b){var k,c=this.renderer,A,d=this.element,h=this.styles,M,K=this.textStr,v,e=c.cache,x=c.cacheKeys,n;b=w(b,this.rotation);A=b*p;M=h&&h.fontSize;y(K)&&(n=K.toString(),-1===n.indexOf("\x3c")&&(n=n.replace(/[0-9]/g,"0")),n+=["",b||0,M,this.textWidth,h&&h.textOverflow].join());n&&!a&&(k=e[n]);if(!k){if(d.namespaceURI===
this.SVG_NS||c.forExport){try{(v=this.fakeTS&&function(a){g(d.querySelectorAll(".highcharts-text-outline"),function(b){b.style.display=a})})&&v("none"),k=d.getBBox?m({},d.getBBox()):{width:d.offsetWidth,height:d.offsetHeight},v&&v("")}catch(U){}if(!k||0>k.width)k={width:0,height:0}}else k=this.htmlGetBBox();c.isSVG&&(a=k.width,c=k.height,h&&"11px"===h.fontSize&&17===Math.round(c)&&(k.height=c=14),b&&(k.width=Math.abs(c*Math.sin(A))+Math.abs(a*Math.cos(A)),k.height=Math.abs(c*Math.cos(A))+Math.abs(a*
Math.sin(A))));if(n&&0<k.height){for(;250<x.length;)delete e[x.shift()];e[n]||x.push(n);e[n]=k}}return k},show:function(a){return this.attr({visibility:a?"inherit":"visible"})},hide:function(){return this.attr({visibility:"hidden"})},fadeOut:function(a){var b=this;b.animate({opacity:0},{duration:a||150,complete:function(){b.attr({y:-9999})}})},add:function(a){var b=this.renderer,k=this.element,c;a&&(this.parentGroup=a);this.parentInverted=a&&a.inverted;void 0!==this.textStr&&b.buildText(this);this.added=
!0;if(!a||a.handleZ||this.zIndex)c=this.zIndexSetter();c||(a?a.element:b.box).appendChild(k);if(this.onAdd)this.onAdd();return this},safeRemoveChild:function(a){var b=a.parentNode;b&&b.removeChild(a)},destroy:function(){var a=this,k=a.element||{},c=a.renderer.isSVG&&"SPAN"===k.nodeName&&a.parentGroup,A=k.ownerSVGElement,d=a.clipPath;k.onclick=k.onmouseout=k.onmouseover=k.onmousemove=k.point=null;Q(a);d&&A&&(g(A.querySelectorAll("[clip-path],[CLIP-PATH]"),function(a){var b=a.getAttribute("clip-path"),
k=d.element.id;(-1<b.indexOf("(#"+k+")")||-1<b.indexOf('("#'+k+'")'))&&a.removeAttribute("clip-path")}),a.clipPath=d.destroy());if(a.stops){for(A=0;A<a.stops.length;A++)a.stops[A]=a.stops[A].destroy();a.stops=null}a.safeRemoveChild(k);for(a.destroyShadows();c&&c.div&&0===c.div.childNodes.length;)k=c.parentGroup,a.safeRemoveChild(c.div),delete c.div,c=k;a.alignTo&&b(a.renderer.alignedObjects,a);v(a,function(b,k){delete a[k]});return null},shadow:function(a,b,k){var c=[],A,d,h=this.element,m,v,K,M;
if(!a)this.destroyShadows();else if(!this.shadows){v=w(a.width,3);K=(a.opacity||.15)/v;M=this.parentInverted?"(-1,-1)":"("+w(a.offsetX,1)+", "+w(a.offsetY,1)+")";for(A=1;A<=v;A++)d=h.cloneNode(0),m=2*v+1-2*A,l(d,{stroke:a.color||"#000000","stroke-opacity":K*A,"stroke-width":m,transform:"translate"+M,fill:"none"}),d.setAttribute("class",(d.getAttribute("class")||"")+" highcharts-shadow"),k&&(l(d,"height",Math.max(l(d,"height")-m,0)),d.cutHeight=m),b?b.element.appendChild(d):h.parentNode&&h.parentNode.insertBefore(d,
h),c.push(d);this.shadows=c}return this},destroyShadows:function(){g(this.shadows||[],function(a){this.safeRemoveChild(a)},this);this.shadows=void 0},xGetter:function(a){"circle"===this.element.nodeName&&("x"===a?a="cx":"y"===a&&(a="cy"));return this._defaultGetter(a)},_defaultGetter:function(a){a=w(this[a+"Value"],this[a],this.element?this.element.getAttribute(a):null,0);/^[\-0-9\.]+$/.test(a)&&(a=parseFloat(a));return a},dSetter:function(a,b,k){a&&a.join&&(a=a.join(" "));/(NaN| {2}|^$)/.test(a)&&
(a="M 0 0");this[b]!==a&&(k.setAttribute(b,a),this[b]=a)},dashstyleSetter:function(a){var b,c=this["stroke-width"];"inherit"===c&&(c=1);if(a=a&&a.toLowerCase()){a=a.replace("shortdashdotdot","3,1,1,1,1,1,").replace("shortdashdot","3,1,1,1").replace("shortdot","1,1,").replace("shortdash","3,1,").replace("longdash","8,3,").replace(/dot/g,"1,3,").replace("dash","4,3,").replace(/,$/,"").split(",");for(b=a.length;b--;)a[b]=k(a[b])*c;a=a.join(",").replace(/NaN/g,"none");this.element.setAttribute("stroke-dasharray",
a)}},alignSetter:function(a){this.alignValue=a;this.element.setAttribute("text-anchor",{left:"start",center:"middle",right:"end"}[a])},opacitySetter:function(a,b,k){this[b]=a;k.setAttribute(b,a)},titleSetter:function(a){var b=this.element.getElementsByTagName("title")[0];b||(b=e.createElementNS(this.SVG_NS,"title"),this.element.appendChild(b));b.firstChild&&b.removeChild(b.firstChild);b.appendChild(e.createTextNode(String(w(a),"").replace(/<[^>]*>/g,"").replace(/&lt;/g,"\x3c").replace(/&gt;/g,"\x3e")))},
textSetter:function(a){a!==this.textStr&&(delete this.bBox,this.textStr=a,this.added&&this.renderer.buildText(this))},fillSetter:function(a,b,k){"string"===typeof a?k.setAttribute(b,a):a&&this.complexColor(a,b,k)},visibilitySetter:function(a,b,k){"inherit"===a?k.removeAttribute(b):this[b]!==a&&k.setAttribute(b,a);this[b]=a},zIndexSetter:function(a,b){var c=this.renderer,A=this.parentGroup,d=(A||c).element||c.box,h,m=this.element,v,K,c=d===c.box;h=this.added;var w;y(a)?(m.setAttribute("data-z-index",
a),a=+a,this[b]===a&&(h=!1)):y(this[b])&&m.removeAttribute("data-z-index");this[b]=a;if(h){(a=this.zIndex)&&A&&(A.handleZ=!0);b=d.childNodes;for(w=b.length-1;0<=w&&!v;w--)if(A=b[w],h=A.getAttribute("data-z-index"),K=!y(h),A!==m)if(0>a&&K&&!c&&!w)d.insertBefore(m,b[w]),v=!0;else if(k(h)<=a||K&&(!y(a)||0<=a))d.insertBefore(m,b[w+1]||null),v=!0;v||(d.insertBefore(m,b[c?3:0]||null),v=!0)}return v},_defaultSetter:function(a,b,k){k.setAttribute(b,a)}});E.prototype.yGetter=E.prototype.xGetter;E.prototype.translateXSetter=
E.prototype.translateYSetter=E.prototype.rotationSetter=E.prototype.verticalAlignSetter=E.prototype.rotationOriginXSetter=E.prototype.rotationOriginYSetter=E.prototype.scaleXSetter=E.prototype.scaleYSetter=E.prototype.matrixSetter=function(a,b){this[b]=a;this.doTransform=!0};E.prototype["stroke-widthSetter"]=E.prototype.strokeSetter=function(a,b,k){this[b]=a;this.stroke&&this["stroke-width"]?(E.prototype.fillSetter.call(this,this.stroke,"stroke",k),k.setAttribute("stroke-width",this["stroke-width"]),
this.hasStroke=!0):"stroke-width"===b&&0===a&&this.hasStroke&&(k.removeAttribute("stroke"),this.hasStroke=!1)};F=a.SVGRenderer=function(){this.init.apply(this,arguments)};m(F.prototype,{Element:E,SVG_NS:K,init:function(a,b,k,c,A,d){var m;c=this.createElement("svg").attr({version:"1.1","class":"highcharts-root"}).css(this.getStyle(c));m=c.element;a.appendChild(m);l(a,"dir","ltr");-1===a.innerHTML.indexOf("xmlns")&&l(m,"xmlns",this.SVG_NS);this.isSVG=!0;this.box=m;this.boxWrapper=c;this.alignedObjects=
[];this.url=(n||h)&&e.getElementsByTagName("base").length?N.location.href.split("#")[0].replace(/<[^>]*>/g,"").replace(/([\('\)])/g,"\\$1").replace(/ /g,"%20"):"";this.createElement("desc").add().element.appendChild(e.createTextNode("Created with Highstock 6.1.4"));this.defs=this.createElement("defs").add();this.allowHTML=d;this.forExport=A;this.gradients={};this.cache={};this.cacheKeys=[];this.imgCount=0;this.setSize(b,k,!1);var v;n&&a.getBoundingClientRect&&(b=function(){C(a,{left:0,top:0});v=a.getBoundingClientRect();
C(a,{left:Math.ceil(v.left)-v.left+"px",top:Math.ceil(v.top)-v.top+"px"})},b(),this.unSubPixelFix=G(N,"resize",b))},getStyle:function(a){return this.style=m({fontFamily:'"Lucida Grande", "Lucida Sans Unicode", Arial, Helvetica, sans-serif',fontSize:"12px"},a)},setStyle:function(a){this.boxWrapper.css(this.getStyle(a))},isHidden:function(){return!this.boxWrapper.getBBox().width},destroy:function(){var a=this.defs;this.box=null;this.boxWrapper=this.boxWrapper.destroy();d(this.gradients||{});this.gradients=
null;a&&(this.defs=a.destroy());this.unSubPixelFix&&this.unSubPixelFix();return this.alignedObjects=null},createElement:function(a){var b=new this.Element;b.init(this,a);return b},draw:H,getRadialAttr:function(a,b){return{cx:a[0]-a[2]/2+b.cx*a[2],cy:a[1]-a[2]/2+b.cy*a[2],r:b.r*a[2]}},truncate:function(a,b,k,c,A,d,h){var m=this,v=a.rotation,K,w=c?1:0,n=(k||c).length,g=n,x=[],B=function(a){b.firstChild&&b.removeChild(b.firstChild);a&&b.appendChild(e.createTextNode(a))},z=function(d,v){v=v||d;if(void 0===
x[v])if(b.getSubStringLength)try{x[v]=A+b.getSubStringLength(0,c?v+1:v)}catch(ga){}else B(h(k||c,d)),x[v]=A+m.getSpanWidth(a,b);return x[v]},t,D;a.rotation=0;t=z(b.textContent.length);if(D=A+t>d){for(;w<=n;)g=Math.ceil((w+n)/2),c&&(K=h(c,g)),t=z(g,K&&K.length-1),w===n?w=n+1:t>d?n=g-1:w=g;0===n?B(""):k&&n===k.length-1||B(K||h(k||c,g))}c&&c.splice(0,g);a.actualWidth=t;a.rotation=v;return D},escapes:{"\x26":"\x26amp;","\x3c":"\x26lt;","\x3e":"\x26gt;","'":"\x26#39;",'"':"\x26quot;"},buildText:function(a){var b=
a.element,A=this,d=A.forExport,h=w(a.textStr,"").toString(),m=-1!==h.indexOf("\x3c"),n=b.childNodes,x,z=l(b,"x"),t=a.styles,D=a.textWidth,H=t&&t.lineHeight,Q=t&&t.textOutline,p=t&&"ellipsis"===t.textOverflow,I=t&&"nowrap"===t.whiteSpace,M=t&&t.fontSize,O,f,L=n.length,t=D&&!a.added&&this.box,r=function(a){var c;c=/(px|em)$/.test(a&&a.style.fontSize)?a.style.fontSize:M||A.style.fontSize||12;return H?k(H):A.fontMetrics(c,a.getAttribute("style")?a:b).h},y=function(a,b){v(A.escapes,function(k,c){b&&-1!==
B(k,b)||(a=a.toString().replace(new RegExp(k,"g"),c))});return a},N=function(a,b){var k;k=a.indexOf("\x3c");a=a.substring(k,a.indexOf("\x3e")-k);k=a.indexOf(b+"\x3d");if(-1!==k&&(k=k+b.length+1,b=a.charAt(k),'"'===b||"'"===b))return a=a.substring(k+1),a.substring(0,a.indexOf(b))};O=[h,p,I,H,Q,M,D].join();if(O!==a.textCache){for(a.textCache=O;L--;)b.removeChild(n[L]);m||Q||p||D||-1!==h.indexOf(" ")?(t&&t.appendChild(b),h=m?h.replace(/<(b|strong)>/g,'\x3cspan style\x3d"font-weight:bold"\x3e').replace(/<(i|em)>/g,
'\x3cspan style\x3d"font-style:italic"\x3e').replace(/<a/g,"\x3cspan").replace(/<\/(b|strong|i|em|a)>/g,"\x3c/span\x3e").split(/<br.*?>/g):[h],h=c(h,function(a){return""!==a}),g(h,function(k,c){var h,m=0,v=0;k=k.replace(/^\s+|\s+$/g,"").replace(/<span/g,"|||\x3cspan").replace(/<\/span>/g,"\x3c/span\x3e|||");h=k.split("|||");g(h,function(k){if(""!==k||1===h.length){var w={},n=e.createElementNS(A.SVG_NS,"tspan"),g,t;(g=N(k,"class"))&&l(n,"class",g);if(g=N(k,"style"))g=g.replace(/(;| |^)color([ :])/,
"$1fill$2"),l(n,"style",g);(t=N(k,"href"))&&!d&&(l(n,"onclick",'location.href\x3d"'+t+'"'),l(n,"class","highcharts-anchor"),C(n,{cursor:"pointer"}));k=y(k.replace(/<[a-zA-Z\/](.|\n)*?>/g,"")||" ");if(" "!==k){n.appendChild(e.createTextNode(k));m?w.dx=0:c&&null!==z&&(w.x=z);l(n,w);b.appendChild(n);!m&&f&&(!T&&d&&C(n,{display:"block"}),l(n,"dy",r(n)));if(D){var B=k.replace(/([^\^])-/g,"$1- ").split(" "),w=!I&&(1<h.length||c||1<B.length);t=0;var H=r(n);if(p)x=A.truncate(a,n,k,void 0,0,Math.max(0,D-parseInt(M||
12,10)),function(a,b){return a.substring(0,b)+"\u2026"});else if(w)for(;B.length;)B.length&&!I&&0<t&&(n=e.createElementNS(K,"tspan"),l(n,{dy:H,x:z}),g&&l(n,"style",g),n.appendChild(e.createTextNode(B.join(" ").replace(/- /g,"-"))),b.appendChild(n)),A.truncate(a,n,null,B,0===t?v:0,D,function(a,b){return B.slice(0,b).join(" ").replace(/- /g,"-")}),v=a.actualWidth,t++}m++}}});f=f||b.childNodes.length}),p&&x&&a.attr("title",y(a.textStr,["\x26lt;","\x26gt;"])),t&&t.removeChild(b),Q&&a.applyTextOutline&&
a.applyTextOutline(Q)):b.appendChild(e.createTextNode(y(h)))}},getContrast:function(a){a=u(a).rgba;a[0]*=1;a[1]*=1.2;a[2]*=.5;return 459<a[0]+a[1]+a[2]?"#000000":"#FFFFFF"},button:function(a,b,k,c,A,d,h,v,K){var w=this.label(a,b,k,K,null,null,null,null,"button"),e=0;w.attr(I({padding:8,r:2},A));var n,g,x,t;A=I({fill:"#f7f7f7",stroke:"#cccccc","stroke-width":1,style:{color:"#333333",cursor:"pointer",fontWeight:"normal"}},A);n=A.style;delete A.style;d=I(A,{fill:"#e6e6e6"},d);g=d.style;delete d.style;
h=I(A,{fill:"#e6ebf5",style:{color:"#000000",fontWeight:"bold"}},h);x=h.style;delete h.style;v=I(A,{style:{color:"#cccccc"}},v);t=v.style;delete v.style;G(w.element,L?"mouseover":"mouseenter",function(){3!==e&&w.setState(1)});G(w.element,L?"mouseout":"mouseleave",function(){3!==e&&w.setState(e)});w.setState=function(a){1!==a&&(w.state=e=a);w.removeClass(/highcharts-button-(normal|hover|pressed|disabled)/).addClass("highcharts-button-"+["normal","hover","pressed","disabled"][a||0]);w.attr([A,d,h,v][a||
0]).css([n,g,x,t][a||0])};w.attr(A).css(m({cursor:"default"},n));return w.on("click",function(a){3!==e&&c.call(w,a)})},crispLine:function(a,b){a[1]===a[4]&&(a[1]=a[4]=Math.round(a[1])-b%2/2);a[2]===a[5]&&(a[2]=a[5]=Math.round(a[2])+b%2/2);return a},path:function(a){var b={fill:"none"};t(a)?b.d=a:z(a)&&m(b,a);return this.createElement("path").attr(b)},circle:function(a,b,k){a=z(a)?a:{x:a,y:b,r:k};b=this.createElement("circle");b.xSetter=b.ySetter=function(a,b,k){k.setAttribute("c"+b,a)};return b.attr(a)},
arc:function(a,b,k,c,A,d){z(a)?(c=a,b=c.y,k=c.r,a=c.x):c={innerR:c,start:A,end:d};a=this.symbol("arc",a,b,k,k,c);a.r=k;return a},rect:function(a,b,k,c,A,d){A=z(a)?a.r:A;var h=this.createElement("rect");a=z(a)?a:void 0===a?{}:{x:a,y:b,width:Math.max(k,0),height:Math.max(c,0)};void 0!==d&&(a.strokeWidth=d,a=h.crisp(a));a.fill="none";A&&(a.r=A);h.rSetter=function(a,b,k){l(k,{rx:a,ry:a})};return h.attr(a)},setSize:function(a,b,k){var c=this.alignedObjects,A=c.length;this.width=a;this.height=b;for(this.boxWrapper.animate({width:a,
height:b},{step:function(){this.attr({viewBox:"0 0 "+this.attr("width")+" "+this.attr("height")})},duration:w(k,!0)?void 0:0});A--;)c[A].align()},g:function(a){var b=this.createElement("g");return a?b.attr({"class":"highcharts-"+a}):b},image:function(a,b,k,c,A,d){var h={preserveAspectRatio:"none"},v,K=function(a,b){a.setAttributeNS?a.setAttributeNS("http://www.w3.org/1999/xlink","href",b):a.setAttribute("hc-svg-href",b)},w=function(b){K(v.element,a);d.call(v,b)};1<arguments.length&&m(h,{x:b,y:k,width:c,
height:A});v=this.createElement("image").attr(h);d?(K(v.element,"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw\x3d\x3d"),h=new N.Image,G(h,"load",w),h.src=a,h.complete&&w({})):K(v.element,a);return v},symbol:function(a,b,k,c,A,d){var h=this,v,K=/^url\((.*?)\)$/,n=K.test(a),x=!n&&(this.symbols[a]?a:"circle"),t=x&&this.symbols[x],B=y(b)&&t&&t.call(this.symbols,Math.round(b),Math.round(k),c,A,d),z,D;t?(v=this.path(B),v.attr("fill","none"),m(v,{symbolName:x,x:b,y:k,width:c,
height:A}),d&&m(v,d)):n&&(z=a.match(K)[1],v=this.image(z),v.imgwidth=w(O[z]&&O[z].width,d&&d.width),v.imgheight=w(O[z]&&O[z].height,d&&d.height),D=function(){v.attr({width:v.width,height:v.height})},g(["width","height"],function(a){v[a+"Setter"]=function(a,b){var k={},c=this["img"+b],A="width"===b?"translateX":"translateY";this[b]=a;y(c)&&(this.element&&this.element.setAttribute(b,c),this.alignByTranslate||(k[A]=((this[b]||0)-c)/2,this.attr(k)))}}),y(b)&&v.attr({x:b,y:k}),v.isImg=!0,y(v.imgwidth)&&
y(v.imgheight)?D():(v.attr({width:0,height:0}),r("img",{onload:function(){var a=f[h.chartIndex];0===this.width&&(C(this,{position:"absolute",top:"-999em"}),e.body.appendChild(this));O[z]={width:this.width,height:this.height};v.imgwidth=this.width;v.imgheight=this.height;v.element&&D();this.parentNode&&this.parentNode.removeChild(this);h.imgCount--;if(!h.imgCount&&a&&a.onload)a.onload()},src:z}),this.imgCount++));return v},symbols:{circle:function(a,b,k,c){return this.arc(a+k/2,b+c/2,k/2,c/2,{start:0,
end:2*Math.PI,open:!1})},square:function(a,b,k,c){return["M",a,b,"L",a+k,b,a+k,b+c,a,b+c,"Z"]},triangle:function(a,b,k,c){return["M",a+k/2,b,"L",a+k,b+c,a,b+c,"Z"]},"triangle-down":function(a,b,k,c){return["M",a,b,"L",a+k,b,a+k/2,b+c,"Z"]},diamond:function(a,b,k,c){return["M",a+k/2,b,"L",a+k,b+c/2,a+k/2,b+c,a,b+c/2,"Z"]},arc:function(a,b,k,c,A){var d=A.start,h=A.r||k,v=A.r||c||k,m=A.end-.001;k=A.innerR;c=w(A.open,.001>Math.abs(A.end-A.start-2*Math.PI));var K=Math.cos(d),e=Math.sin(d),n=Math.cos(m),
m=Math.sin(m);A=.001>A.end-d-Math.PI?0:1;h=["M",a+h*K,b+v*e,"A",h,v,0,A,1,a+h*n,b+v*m];y(k)&&h.push(c?"M":"L",a+k*n,b+k*m,"A",k,k,0,A,0,a+k*K,b+k*e);h.push(c?"":"Z");return h},callout:function(a,b,k,c,A){var d=Math.min(A&&A.r||0,k,c),h=d+6,v=A&&A.anchorX;A=A&&A.anchorY;var m;m=["M",a+d,b,"L",a+k-d,b,"C",a+k,b,a+k,b,a+k,b+d,"L",a+k,b+c-d,"C",a+k,b+c,a+k,b+c,a+k-d,b+c,"L",a+d,b+c,"C",a,b+c,a,b+c,a,b+c-d,"L",a,b+d,"C",a,b,a,b,a+d,b];v&&v>k?A>b+h&&A<b+c-h?m.splice(13,3,"L",a+k,A-6,a+k+6,A,a+k,A+6,a+k,
b+c-d):m.splice(13,3,"L",a+k,c/2,v,A,a+k,c/2,a+k,b+c-d):v&&0>v?A>b+h&&A<b+c-h?m.splice(33,3,"L",a,A+6,a-6,A,a,A-6,a,b+d):m.splice(33,3,"L",a,c/2,v,A,a,c/2,a,b+d):A&&A>c&&v>a+h&&v<a+k-h?m.splice(23,3,"L",v+6,b+c,v,b+c+6,v-6,b+c,a+d,b+c):A&&0>A&&v>a+h&&v<a+k-h&&m.splice(3,3,"L",v-6,b,v,b-6,v+6,b,k-d,b);return m}},clipRect:function(b,k,c,A){var d=a.uniqueKey(),h=this.createElement("clipPath").attr({id:d}).add(this.defs);b=this.rect(b,k,c,A,0).add(h);b.id=d;b.clipPath=h;b.count=0;return b},text:function(a,
b,k,c){var A={};if(c&&(this.allowHTML||!this.forExport))return this.html(a,b,k);A.x=Math.round(b||0);k&&(A.y=Math.round(k));if(a||0===a)A.text=a;a=this.createElement("text").attr(A);c||(a.xSetter=function(a,b,k){var c=k.getElementsByTagName("tspan"),A,d=k.getAttribute(b),h;for(h=0;h<c.length;h++)A=c[h],A.getAttribute(b)===d&&A.setAttribute(b,a);k.setAttribute(b,a)});return a},fontMetrics:function(a,b){a=a||b&&b.style&&b.style.fontSize||this.style&&this.style.fontSize;a=/px/.test(a)?k(a):/em/.test(a)?
parseFloat(a)*(b?this.fontMetrics(null,b.parentNode).f:16):12;b=24>a?a+3:Math.round(1.2*a);return{h:b,b:Math.round(.8*b),f:a}},rotCorr:function(a,b,k){var c=a;b&&k&&(c=Math.max(c*Math.cos(b*p),4));return{x:-a/3*Math.sin(b*p),y:c}},label:function(b,k,c,d,h,v,K,w,e){var n=this,x=n.g("button"!==e&&"label"),t=x.text=n.text("",0,0,K).attr({zIndex:1}),B,z,D=0,H=3,Q=0,p,T,O,f,L,r={},l,N,M=/^url\((.*?)\)$/.test(d),C=M,u,q,S,W;e&&x.addClass("highcharts-"+e);C=M;u=function(){return(l||0)%2/2};q=function(){var a=
t.element.style,b={};z=(void 0===p||void 0===T||L)&&y(t.textStr)&&t.getBBox();x.width=(p||z.width||0)+2*H+Q;x.height=(T||z.height||0)+2*H;N=H+n.fontMetrics(a&&a.fontSize,t).b;C&&(B||(x.box=B=n.symbols[d]||M?n.symbol(d):n.rect(),B.addClass(("button"===e?"":"highcharts-label-box")+(e?" highcharts-"+e+"-box":"")),B.add(x),a=u(),b.x=a,b.y=(w?-N:0)+a),b.width=Math.round(x.width),b.height=Math.round(x.height),B.attr(m(b,r)),r={})};S=function(){var a=Q+H,b;b=w?0:N;y(p)&&z&&("center"===L||"right"===L)&&(a+=
{center:.5,right:1}[L]*(p-z.width));if(a!==t.x||b!==t.y)t.attr("x",a),t.hasBoxWidthChanged&&(z=t.getBBox(!0),q()),void 0!==b&&t.attr("y",b);t.x=a;t.y=b};W=function(a,b){B?B.attr(a,b):r[a]=b};x.onAdd=function(){t.add(x);x.attr({text:b||0===b?b:"",x:k,y:c});B&&y(h)&&x.attr({anchorX:h,anchorY:v})};x.widthSetter=function(b){p=a.isNumber(b)?b:null};x.heightSetter=function(a){T=a};x["text-alignSetter"]=function(a){L=a};x.paddingSetter=function(a){y(a)&&a!==H&&(H=x.padding=a,S())};x.paddingLeftSetter=function(a){y(a)&&
a!==Q&&(Q=a,S())};x.alignSetter=function(a){a={left:0,center:.5,right:1}[a];a!==D&&(D=a,z&&x.attr({x:O}))};x.textSetter=function(a){void 0!==a&&t.textSetter(a);q();S()};x["stroke-widthSetter"]=function(a,b){a&&(C=!0);l=this["stroke-width"]=a;W(b,a)};x.strokeSetter=x.fillSetter=x.rSetter=function(a,b){"r"!==b&&("fill"===b&&a&&(C=!0),x[b]=a);W(b,a)};x.anchorXSetter=function(a,b){h=x.anchorX=a;W(b,Math.round(a)-u()-O)};x.anchorYSetter=function(a,b){v=x.anchorY=a;W(b,a-f)};x.xSetter=function(a){x.x=a;
D&&(a-=D*((p||z.width)+2*H),x["forceAnimate:x"]=!0);O=Math.round(a);x.attr("translateX",O)};x.ySetter=function(a){f=x.y=Math.round(a);x.attr("translateY",f)};var R=x.css;return m(x,{css:function(a){if(a){var b={};a=I(a);g(x.textProps,function(k){void 0!==a[k]&&(b[k]=a[k],delete a[k])});t.css(b);"width"in b&&q()}return R.call(x,a)},getBBox:function(){return{width:z.width+2*H,height:z.height+2*H,x:z.x-H,y:z.y-H}},shadow:function(a){a&&(q(),B&&B.shadow(a));return x},destroy:function(){A(x.element,"mouseenter");
A(x.element,"mouseleave");t&&(t=t.destroy());B&&(B=B.destroy());E.prototype.destroy.call(x);x=n=q=S=W=null}})}});a.Renderer=F})(J);(function(a){var E=a.attr,F=a.createElement,G=a.css,q=a.defined,l=a.each,f=a.extend,u=a.isFirefox,C=a.isMS,r=a.isWebKit,y=a.pick,p=a.pInt,d=a.SVGRenderer,e=a.win,g=a.wrap;f(a.SVGElement.prototype,{htmlCss:function(a){var b="SPAN"===this.element.tagName&&a&&"width"in a,c=y(b&&a.width,void 0);b&&(delete a.width,this.textWidth=c,this.htmlUpdateTransform());a&&"ellipsis"===
a.textOverflow&&(a.whiteSpace="nowrap",a.overflow="hidden");this.styles=f(this.styles,a);G(this.element,a);return this},htmlGetBBox:function(){var a=this.element;return{x:a.offsetLeft,y:a.offsetTop,width:a.offsetWidth,height:a.offsetHeight}},htmlUpdateTransform:function(){if(this.added){var a=this.renderer,b=this.element,c=this.translateX||0,d=this.translateY||0,e=this.x||0,t=this.y||0,n=this.textAlign||"left",g={left:0,center:.5,right:1}[n],z=this.styles,D=z&&z.whiteSpace;G(b,{marginLeft:c,marginTop:d});
this.shadows&&l(this.shadows,function(a){G(a,{marginLeft:c+1,marginTop:d+1})});this.inverted&&l(b.childNodes,function(c){a.invertChild(c,b)});if("SPAN"===b.tagName){var z=this.rotation,h=this.textWidth&&p(this.textWidth),I=[z,n,b.innerHTML,this.textWidth,this.textAlign].join(),H;(H=h!==this.oldTextWidth)&&!(H=h>this.oldTextWidth)&&((H=this.textPxLength)||(G(b,{width:"",whiteSpace:D||"nowrap"}),H=b.offsetWidth),H=H>h);H&&/[ \-]/.test(b.textContent||b.innerText)?(G(b,{width:h+"px",display:"block",whiteSpace:D||
"normal"}),this.oldTextWidth=h,this.hasBoxWidthChanged=!0):this.hasBoxWidthChanged=!1;I!==this.cTT&&(D=a.fontMetrics(b.style.fontSize).b,!q(z)||z===(this.oldRotation||0)&&n===this.oldAlign||this.setSpanRotation(z,g,D),this.getSpanCorrection(!q(z)&&this.textPxLength||b.offsetWidth,D,g,z,n));G(b,{left:e+(this.xCorr||0)+"px",top:t+(this.yCorr||0)+"px"});this.cTT=I;this.oldRotation=z;this.oldAlign=n}}else this.alignOnAdd=!0},setSpanRotation:function(a,b,c){var d={},m=this.renderer.getTransformKey();d[m]=
d.transform="rotate("+a+"deg)";d[m+(u?"Origin":"-origin")]=d.transformOrigin=100*b+"% "+c+"px";G(this.element,d)},getSpanCorrection:function(a,b,c){this.xCorr=-a*c;this.yCorr=-b}});f(d.prototype,{getTransformKey:function(){return C&&!/Edge/.test(e.navigator.userAgent)?"-ms-transform":r?"-webkit-transform":u?"MozTransform":e.opera?"-o-transform":""},html:function(a,b,c){var d=this.createElement("span"),m=d.element,e=d.renderer,n=e.isSVG,p=function(a,b){l(["opacity","visibility"],function(c){g(a,c+
"Setter",function(a,c,d,h){a.call(this,c,d,h);b[d]=c})});a.addedSetters=!0};d.textSetter=function(a){a!==m.innerHTML&&delete this.bBox;this.textStr=a;m.innerHTML=y(a,"");d.doTransform=!0};n&&p(d,d.element.style);d.xSetter=d.ySetter=d.alignSetter=d.rotationSetter=function(a,b){"align"===b&&(b="textAlign");d[b]=a;d.doTransform=!0};d.afterSetters=function(){this.doTransform&&(this.htmlUpdateTransform(),this.doTransform=!1)};d.attr({text:a,x:Math.round(b),y:Math.round(c)}).css({fontFamily:this.style.fontFamily,
fontSize:this.style.fontSize,position:"absolute"});m.style.whiteSpace="nowrap";d.css=d.htmlCss;n&&(d.add=function(a){var b,c=e.box.parentNode,n=[];if(this.parentGroup=a){if(b=a.div,!b){for(;a;)n.push(a),a=a.parentGroup;l(n.reverse(),function(a){function h(b,k){a[k]=b;"translateX"===k?m.left=b+"px":m.top=b+"px";a.doTransform=!0}var m,k=E(a.element,"class");k&&(k={className:k});b=a.div=a.div||F("div",k,{position:"absolute",left:(a.translateX||0)+"px",top:(a.translateY||0)+"px",display:a.display,opacity:a.opacity,
pointerEvents:a.styles&&a.styles.pointerEvents},b||c);m=b.style;f(a,{classSetter:function(a){return function(b){this.element.setAttribute("class",b);a.className=b}}(b),on:function(){n[0].div&&d.on.apply({element:n[0].div},arguments);return a},translateXSetter:h,translateYSetter:h});a.addedSetters||p(a,m)})}}else b=c;b.appendChild(m);d.added=!0;d.alignOnAdd&&d.htmlUpdateTransform();return d});return d}})})(J);(function(a){var E=a.defined,F=a.each,G=a.extend,q=a.merge,l=a.pick,f=a.timeUnits,u=a.win;
a.Time=function(a){this.update(a,!1)};a.Time.prototype={defaultOptions:{},update:function(a){var f=l(a&&a.useUTC,!0),y=this;this.options=a=q(!0,this.options||{},a);this.Date=a.Date||u.Date;this.timezoneOffset=(this.useUTC=f)&&a.timezoneOffset;this.getTimezoneOffset=this.timezoneOffsetFunction();(this.variableTimezone=!(f&&!a.getTimezoneOffset&&!a.timezone))||this.timezoneOffset?(this.get=function(a,d){var e=d.getTime(),g=e-y.getTimezoneOffset(d);d.setTime(g);a=d["getUTC"+a]();d.setTime(e);return a},
this.set=function(a,d,e){var g;if("Milliseconds"===a||"Seconds"===a||"Minutes"===a&&0===d.getTimezoneOffset()%60)d["set"+a](e);else g=y.getTimezoneOffset(d),g=d.getTime()-g,d.setTime(g),d["setUTC"+a](e),a=y.getTimezoneOffset(d),g=d.getTime()+a,d.setTime(g)}):f?(this.get=function(a,d){return d["getUTC"+a]()},this.set=function(a,d,e){return d["setUTC"+a](e)}):(this.get=function(a,d){return d["get"+a]()},this.set=function(a,d,e){return d["set"+a](e)})},makeTime:function(f,r,y,p,d,e){var g,m,b;this.useUTC?
(g=this.Date.UTC.apply(0,arguments),m=this.getTimezoneOffset(g),g+=m,b=this.getTimezoneOffset(g),m!==b?g+=b-m:m-36E5!==this.getTimezoneOffset(g-36E5)||a.isSafari||(g-=36E5)):g=(new this.Date(f,r,l(y,1),l(p,0),l(d,0),l(e,0))).getTime();return g},timezoneOffsetFunction:function(){var f=this,r=this.options,l=u.moment;if(!this.useUTC)return function(a){return 6E4*(new Date(a)).getTimezoneOffset()};if(r.timezone){if(l)return function(a){return 6E4*-l.tz(a,r.timezone).utcOffset()};a.error(25)}return this.useUTC&&
r.getTimezoneOffset?function(a){return 6E4*r.getTimezoneOffset(a)}:function(){return 6E4*(f.timezoneOffset||0)}},dateFormat:function(f,l,y){if(!a.defined(l)||isNaN(l))return a.defaultOptions.lang.invalidDate||"";f=a.pick(f,"%Y-%m-%d %H:%M:%S");var p=this,d=new this.Date(l),e=this.get("Hours",d),g=this.get("Day",d),m=this.get("Date",d),b=this.get("Month",d),c=this.get("FullYear",d),x=a.defaultOptions.lang,B=x.weekdays,t=x.shortWeekdays,n=a.pad,d=a.extend({a:t?t[g]:B[g].substr(0,3),A:B[g],d:n(m),e:n(m,
2," "),w:g,b:x.shortMonths[b],B:x.months[b],m:n(b+1),o:b+1,y:c.toString().substr(2,2),Y:c,H:n(e),k:e,I:n(e%12||12),l:e%12||12,M:n(p.get("Minutes",d)),p:12>e?"AM":"PM",P:12>e?"am":"pm",S:n(d.getSeconds()),L:n(Math.floor(l%1E3),3)},a.dateFormats);a.objectEach(d,function(a,b){for(;-1!==f.indexOf("%"+b);)f=f.replace("%"+b,"function"===typeof a?a.call(p,l):a)});return y?f.substr(0,1).toUpperCase()+f.substr(1):f},getTimeTicks:function(a,r,y,p){var d=this,e=[],g,m={},b;g=new d.Date(r);var c=a.unitRange,
x=a.count||1,B;p=l(p,1);if(E(r)){d.set("Milliseconds",g,c>=f.second?0:x*Math.floor(d.get("Milliseconds",g)/x));c>=f.second&&d.set("Seconds",g,c>=f.minute?0:x*Math.floor(d.get("Seconds",g)/x));c>=f.minute&&d.set("Minutes",g,c>=f.hour?0:x*Math.floor(d.get("Minutes",g)/x));c>=f.hour&&d.set("Hours",g,c>=f.day?0:x*Math.floor(d.get("Hours",g)/x));c>=f.day&&d.set("Date",g,c>=f.month?1:x*Math.floor(d.get("Date",g)/x));c>=f.month&&(d.set("Month",g,c>=f.year?0:x*Math.floor(d.get("Month",g)/x)),b=d.get("FullYear",
g));c>=f.year&&d.set("FullYear",g,b-b%x);c===f.week&&(b=d.get("Day",g),d.set("Date",g,d.get("Date",g)-b+p+(b<p?-7:0)));b=d.get("FullYear",g);p=d.get("Month",g);var t=d.get("Date",g),n=d.get("Hours",g);r=g.getTime();d.variableTimezone&&(B=y-r>4*f.month||d.getTimezoneOffset(r)!==d.getTimezoneOffset(y));r=g.getTime();for(g=1;r<y;)e.push(r),r=c===f.year?d.makeTime(b+g*x,0):c===f.month?d.makeTime(b,p+g*x):!B||c!==f.day&&c!==f.week?B&&c===f.hour&&1<x?d.makeTime(b,p,t,n+g*x):r+c*x:d.makeTime(b,p,t+g*x*(c===
f.day?1:7)),g++;e.push(r);c<=f.hour&&1E4>e.length&&F(e,function(a){0===a%18E5&&"000000000"===d.dateFormat("%H%M%S%L",a)&&(m[a]="day")})}e.info=G(a,{higherRanks:m,totalRange:c*x});return e}}})(J);(function(a){var E=a.color,F=a.merge;a.defaultOptions={colors:"#7cb5ec #434348 #90ed7d #f7a35c #8085e9 #f15c80 #e4d354 #2b908f #f45b5b #91e8e1".split(" "),symbols:["circle","diamond","square","triangle","triangle-down"],lang:{loading:"Loading...",months:"January February March April May June July August September October November December".split(" "),
shortMonths:"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" "),weekdays:"Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),decimalPoint:".",numericSymbols:"kMGTPE".split(""),resetZoom:"Reset zoom",resetZoomTitle:"Reset zoom level 1:1",thousandsSep:" "},global:{},time:a.Time.prototype.defaultOptions,chart:{borderRadius:0,defaultSeriesType:"line",ignoreHiddenSeries:!0,spacing:[10,10,15,10],resetZoomButton:{theme:{zIndex:6},position:{align:"right",x:-10,y:10}},width:null,
height:null,borderColor:"#335cad",backgroundColor:"#ffffff",plotBorderColor:"#cccccc"},title:{text:"Chart title",align:"center",margin:15,widthAdjust:-44},subtitle:{text:"",align:"center",widthAdjust:-44},plotOptions:{},labels:{style:{position:"absolute",color:"#333333"}},legend:{enabled:!0,align:"center",alignColumns:!0,layout:"horizontal",labelFormatter:function(){return this.name},borderColor:"#999999",borderRadius:0,navigation:{activeColor:"#003399",inactiveColor:"#cccccc"},itemStyle:{color:"#333333",
fontSize:"12px",fontWeight:"bold",textOverflow:"ellipsis"},itemHoverStyle:{color:"#000000"},itemHiddenStyle:{color:"#cccccc"},shadow:!1,itemCheckboxStyle:{position:"absolute",width:"13px",height:"13px"},squareSymbol:!0,symbolPadding:5,verticalAlign:"bottom",x:0,y:0,title:{style:{fontWeight:"bold"}}},loading:{labelStyle:{fontWeight:"bold",position:"relative",top:"45%"},style:{position:"absolute",backgroundColor:"#ffffff",opacity:.5,textAlign:"center"}},tooltip:{enabled:!0,animation:a.svg,borderRadius:3,
dateTimeLabelFormats:{millisecond:"%A, %b %e, %H:%M:%S.%L",second:"%A, %b %e, %H:%M:%S",minute:"%A, %b %e, %H:%M",hour:"%A, %b %e, %H:%M",day:"%A, %b %e, %Y",week:"Week from %A, %b %e, %Y",month:"%B %Y",year:"%Y"},footerFormat:"",padding:8,snap:a.isTouchDevice?25:10,backgroundColor:E("#f7f7f7").setOpacity(.85).get(),borderWidth:1,headerFormat:'\x3cspan style\x3d"font-size: 10px"\x3e{point.key}\x3c/span\x3e\x3cbr/\x3e',pointFormat:'\x3cspan style\x3d"color:{point.color}"\x3e\u25cf\x3c/span\x3e {series.name}: \x3cb\x3e{point.y}\x3c/b\x3e\x3cbr/\x3e',
shadow:!0,style:{color:"#333333",cursor:"default",fontSize:"12px",pointerEvents:"none",whiteSpace:"nowrap"}},credits:{enabled:!0,href:"https://www.highcharts.com",position:{align:"right",x:-10,verticalAlign:"bottom",y:-5},style:{cursor:"pointer",color:"#999999",fontSize:"9px"},text:"Highcharts.com"}};a.setOptions=function(E){a.defaultOptions=F(!0,a.defaultOptions,E);a.time.update(F(a.defaultOptions.global,a.defaultOptions.time),!1);return a.defaultOptions};a.getOptions=function(){return a.defaultOptions};
a.defaultPlotOptions=a.defaultOptions.plotOptions;a.time=new a.Time(F(a.defaultOptions.global,a.defaultOptions.time));a.dateFormat=function(F,q,l){return a.time.dateFormat(F,q,l)}})(J);(function(a){var E=a.correctFloat,F=a.defined,G=a.destroyObjectProperties,q=a.fireEvent,l=a.isNumber,f=a.merge,u=a.pick,C=a.deg2rad;a.Tick=function(a,f,p,d){this.axis=a;this.pos=f;this.type=p||"";this.isNewLabel=this.isNew=!0;p||d||this.addLabel()};a.Tick.prototype={addLabel:function(){var a=this.axis,l=a.options,p=
a.chart,d=a.categories,e=a.names,g=this.pos,m=l.labels,b=a.tickPositions,c=g===b[0],x=g===b[b.length-1],e=d?u(d[g],e[g],g):g,d=this.label,b=b.info,B;a.isDatetimeAxis&&b&&(B=l.dateTimeLabelFormats[b.higherRanks[g]||b.unitName]);this.isFirst=c;this.isLast=x;l={axis:a,chart:p,isFirst:c,isLast:x,dateTimeLabelFormat:B,value:a.isLog?E(a.lin2log(e)):e,pos:g};l=a.labelFormatter.call(l,l);if(F(d))d&&d.textStr!==l&&(!d.textWidth||m.style&&m.style.width||d.styles.width||d.css({width:null}),d.attr({text:l}));
else{if(this.label=d=F(l)&&m.enabled?p.renderer.text(l,0,0,m.useHTML).css(f(m.style)).add(a.labelGroup):null)d.textPxLength=d.getBBox().width;this.rotation=0}},getLabelSize:function(){return this.label?this.label.getBBox()[this.axis.horiz?"height":"width"]:0},handleOverflow:function(a){var f=this.axis,p=f.options.labels,d=a.x,e=f.chart.chartWidth,g=f.chart.spacing,m=u(f.labelLeft,Math.min(f.pos,g[3])),g=u(f.labelRight,Math.max(f.isRadial?0:f.pos+f.len,e-g[1])),b=this.label,c=this.rotation,x={left:0,
center:.5,right:1}[f.labelAlign||b.attr("align")],B=b.getBBox().width,t=f.getSlotWidth(this),n=t,l=1,z,D={};if(c||"justify"!==u(p.overflow,"justify"))0>c&&d-x*B<m?z=Math.round(d/Math.cos(c*C)-m):0<c&&d+x*B>g&&(z=Math.round((e-d)/Math.cos(c*C)));else if(e=d+(1-x)*B,d-x*B<m?n=a.x+n*(1-x)-m:e>g&&(n=g-a.x+n*x,l=-1),n=Math.min(t,n),n<t&&"center"===f.labelAlign&&(a.x+=l*(t-n-x*(t-Math.min(B,n)))),B>n||f.autoRotation&&(b.styles||{}).width)z=n;z&&(D.width=z,(p.style||{}).textOverflow||(D.textOverflow="ellipsis"),
b.css(D))},getPosition:function(f,l,p,d){var e=this.axis,g=e.chart,m=d&&g.oldChartHeight||g.chartHeight;f={x:f?a.correctFloat(e.translate(l+p,null,null,d)+e.transB):e.left+e.offset+(e.opposite?(d&&g.oldChartWidth||g.chartWidth)-e.right-e.left:0),y:f?m-e.bottom+e.offset-(e.opposite?e.height:0):a.correctFloat(m-e.translate(l+p,null,null,d)-e.transB)};q(this,"afterGetPosition",{pos:f});return f},getLabelPosition:function(a,f,p,d,e,g,m,b){var c=this.axis,x=c.transA,B=c.reversed,t=c.staggerLines,n=c.tickRotCorr||
{x:0,y:0},l=e.y,z=d||c.reserveSpaceDefault?0:-c.labelOffset*("center"===c.labelAlign?.5:1),D={};F(l)||(l=0===c.side?p.rotation?-8:-p.getBBox().height:2===c.side?n.y+8:Math.cos(p.rotation*C)*(n.y-p.getBBox(!1,0).height/2));a=a+e.x+z+n.x-(g&&d?g*x*(B?-1:1):0);f=f+l-(g&&!d?g*x*(B?1:-1):0);t&&(p=m/(b||1)%t,c.opposite&&(p=t-p-1),f+=c.labelOffset/t*p);D.x=a;D.y=Math.round(f);q(this,"afterGetLabelPosition",{pos:D});return D},getMarkPath:function(a,f,p,d,e,g){return g.crispLine(["M",a,f,"L",a+(e?0:-p),f+
(e?p:0)],d)},renderGridLine:function(a,f,p){var d=this.axis,e=d.options,g=this.gridLine,m={},b=this.pos,c=this.type,x=d.tickmarkOffset,B=d.chart.renderer,t=c?c+"Grid":"grid",n=e[t+"LineWidth"],l=e[t+"LineColor"],e=e[t+"LineDashStyle"];g||(m.stroke=l,m["stroke-width"]=n,e&&(m.dashstyle=e),c||(m.zIndex=1),a&&(m.opacity=0),this.gridLine=g=B.path().attr(m).addClass("highcharts-"+(c?c+"-":"")+"grid-line").add(d.gridGroup));if(!a&&g&&(a=d.getPlotLinePath(b+x,g.strokeWidth()*p,a,!0)))g[this.isNew?"attr":
"animate"]({d:a,opacity:f})},renderMark:function(a,f,p){var d=this.axis,e=d.options,g=d.chart.renderer,m=this.type,b=m?m+"Tick":"tick",c=d.tickSize(b),x=this.mark,B=!x,t=a.x;a=a.y;var n=u(e[b+"Width"],!m&&d.isXAxis?1:0),e=e[b+"Color"];c&&(d.opposite&&(c[0]=-c[0]),B&&(this.mark=x=g.path().addClass("highcharts-"+(m?m+"-":"")+"tick").add(d.axisGroup),x.attr({stroke:e,"stroke-width":n})),x[B?"attr":"animate"]({d:this.getMarkPath(t,a,c[0],x.strokeWidth()*p,d.horiz,g),opacity:f}))},renderLabel:function(a,
f,p,d){var e=this.axis,g=e.horiz,m=e.options,b=this.label,c=m.labels,x=c.step,e=e.tickmarkOffset,B=!0,t=a.x;a=a.y;b&&l(t)&&(b.xy=a=this.getLabelPosition(t,a,b,g,c,e,d,x),this.isFirst&&!this.isLast&&!u(m.showFirstLabel,1)||this.isLast&&!this.isFirst&&!u(m.showLastLabel,1)?B=!1:!g||c.step||c.rotation||f||0===p||this.handleOverflow(a),x&&d%x&&(B=!1),B&&l(a.y)?(a.opacity=p,b[this.isNewLabel?"attr":"animate"](a),this.isNewLabel=!1):(b.attr("y",-9999),this.isNewLabel=!0))},render:function(f,l,p){var d=
this.axis,e=d.horiz,g=this.getPosition(e,this.pos,d.tickmarkOffset,l),m=g.x,b=g.y,d=e&&m===d.pos+d.len||!e&&b===d.pos?-1:1;p=u(p,1);this.isActive=!0;this.renderGridLine(l,p,d);this.renderMark(g,p,d);this.renderLabel(g,l,p,f);this.isNew=!1;a.fireEvent(this,"afterRender")},destroy:function(){G(this,this.axis)}}})(J);var ea=function(a){var E=a.addEvent,F=a.animObject,G=a.arrayMax,q=a.arrayMin,l=a.color,f=a.correctFloat,u=a.defaultOptions,C=a.defined,r=a.deg2rad,y=a.destroyObjectProperties,p=a.each,d=
a.extend,e=a.fireEvent,g=a.format,m=a.getMagnitude,b=a.grep,c=a.inArray,x=a.isArray,B=a.isNumber,t=a.isString,n=a.merge,L=a.normalizeTickInterval,z=a.objectEach,D=a.pick,h=a.removeEvent,I=a.splat,H=a.syncTimeout,v=a.Tick,w=function(){this.init.apply(this,arguments)};a.extend(w.prototype,{defaultOptions:{dateTimeLabelFormats:{millisecond:"%H:%M:%S.%L",second:"%H:%M:%S",minute:"%H:%M",hour:"%H:%M",day:"%e. %b",week:"%e. %b",month:"%b '%y",year:"%Y"},endOnTick:!1,labels:{enabled:!0,x:0,style:{color:"#666666",
cursor:"default",fontSize:"11px"}},maxPadding:.01,minorTickLength:2,minorTickPosition:"outside",minPadding:.01,startOfWeek:1,startOnTick:!1,tickLength:10,tickPixelInterval:100,tickmarkPlacement:"between",tickPosition:"outside",title:{align:"middle",style:{color:"#666666"}},type:"linear",minorGridLineColor:"#f2f2f2",minorGridLineWidth:1,minorTickColor:"#999999",lineColor:"#ccd6eb",lineWidth:1,gridLineColor:"#e6e6e6",tickColor:"#ccd6eb"},defaultYAxisOptions:{endOnTick:!0,maxPadding:.05,minPadding:.05,
tickPixelInterval:72,showLastLabel:!0,labels:{x:-8},startOnTick:!0,title:{rotation:270,text:"Values"},stackLabels:{allowOverlap:!1,enabled:!1,formatter:function(){return a.numberFormat(this.total,-1)},style:{color:"#000000",fontSize:"11px",fontWeight:"bold",textOutline:"1px contrast"}},gridLineWidth:1,lineWidth:0},defaultLeftAxisOptions:{labels:{x:-15},title:{rotation:270}},defaultRightAxisOptions:{labels:{x:15},title:{rotation:90}},defaultBottomAxisOptions:{labels:{autoRotation:[-45],x:0},title:{rotation:0}},
defaultTopAxisOptions:{labels:{autoRotation:[-45],x:0},title:{rotation:0}},init:function(a,b){var k=b.isX,A=this;A.chart=a;A.horiz=a.inverted&&!A.isZAxis?!k:k;A.isXAxis=k;A.coll=A.coll||(k?"xAxis":"yAxis");e(this,"init",{userOptions:b});A.opposite=b.opposite;A.side=b.side||(A.horiz?A.opposite?0:2:A.opposite?1:3);A.setOptions(b);var d=this.options,h=d.type;A.labelFormatter=d.labels.formatter||A.defaultLabelFormatter;A.userOptions=b;A.minPixelPadding=0;A.reversed=d.reversed;A.visible=!1!==d.visible;
A.zoomEnabled=!1!==d.zoomEnabled;A.hasNames="category"===h||!0===d.categories;A.categories=d.categories||A.hasNames;A.names||(A.names=[],A.names.keys={});A.plotLinesAndBandsGroups={};A.isLog="logarithmic"===h;A.isDatetimeAxis="datetime"===h;A.positiveValuesOnly=A.isLog&&!A.allowNegativeLog;A.isLinked=C(d.linkedTo);A.ticks={};A.labelEdge=[];A.minorTicks={};A.plotLinesAndBands=[];A.alternateBands={};A.len=0;A.minRange=A.userMinRange=d.minRange||d.maxZoom;A.range=d.range;A.offset=d.offset||0;A.stacks=
{};A.oldStacks={};A.stacksTouched=0;A.max=null;A.min=null;A.crosshair=D(d.crosshair,I(a.options.tooltip.crosshairs)[k?0:1],!1);b=A.options.events;-1===c(A,a.axes)&&(k?a.axes.splice(a.xAxis.length,0,A):a.axes.push(A),a[A.coll].push(A));A.series=A.series||[];a.inverted&&!A.isZAxis&&k&&void 0===A.reversed&&(A.reversed=!0);z(b,function(a,b){E(A,b,a)});A.lin2log=d.linearToLogConverter||A.lin2log;A.isLog&&(A.val2lin=A.log2lin,A.lin2val=A.lin2log);e(this,"afterInit")},setOptions:function(a){this.options=
n(this.defaultOptions,"yAxis"===this.coll&&this.defaultYAxisOptions,[this.defaultTopAxisOptions,this.defaultRightAxisOptions,this.defaultBottomAxisOptions,this.defaultLeftAxisOptions][this.side],n(u[this.coll],a));e(this,"afterSetOptions",{userOptions:a})},defaultLabelFormatter:function(){var b=this.axis,c=this.value,d=b.chart.time,h=b.categories,v=this.dateTimeLabelFormat,m=u.lang,w=m.numericSymbols,m=m.numericSymbolMagnitude||1E3,e=w&&w.length,n,t=b.options.labels.format,b=b.isLog?Math.abs(c):b.tickInterval;
if(t)n=g(t,this,d);else if(h)n=c;else if(v)n=d.dateFormat(v,c);else if(e&&1E3<=b)for(;e--&&void 0===n;)d=Math.pow(m,e+1),b>=d&&0===10*c%d&&null!==w[e]&&0!==c&&(n=a.numberFormat(c/d,-1)+w[e]);void 0===n&&(n=1E4<=Math.abs(c)?a.numberFormat(c,-1):a.numberFormat(c,-1,void 0,""));return n},getSeriesExtremes:function(){var a=this,c=a.chart;e(this,"getSeriesExtremes",null,function(){a.hasVisibleSeries=!1;a.dataMin=a.dataMax=a.threshold=null;a.softThreshold=!a.isXAxis;a.buildStacks&&a.buildStacks();p(a.series,
function(k){if(k.visible||!c.options.chart.ignoreHiddenSeries){var A=k.options,d=A.threshold,h;a.hasVisibleSeries=!0;a.positiveValuesOnly&&0>=d&&(d=null);if(a.isXAxis)A=k.xData,A.length&&(k=q(A),h=G(A),B(k)||k instanceof Date||(A=b(A,B),k=q(A),h=G(A)),A.length&&(a.dataMin=Math.min(D(a.dataMin,A[0],k),k),a.dataMax=Math.max(D(a.dataMax,A[0],h),h)));else if(k.getExtremes(),h=k.dataMax,k=k.dataMin,C(k)&&C(h)&&(a.dataMin=Math.min(D(a.dataMin,k),k),a.dataMax=Math.max(D(a.dataMax,h),h)),C(d)&&(a.threshold=
d),!A.softThreshold||a.positiveValuesOnly)a.softThreshold=!1}})});e(this,"afterGetSeriesExtremes")},translate:function(a,b,c,d,h,v){var k=this.linkedParent||this,A=1,m=0,w=d?k.oldTransA:k.transA;d=d?k.oldMin:k.min;var n=k.minPixelPadding;h=(k.isOrdinal||k.isBroken||k.isLog&&h)&&k.lin2val;w||(w=k.transA);c&&(A*=-1,m=k.len);k.reversed&&(A*=-1,m-=A*(k.sector||k.len));b?(a=(a*A+m-n)/w+d,h&&(a=k.lin2val(a))):(h&&(a=k.val2lin(a)),a=B(d)?A*(a-d)*w+m+A*n+(B(v)?w*v:0):void 0);return a},toPixels:function(a,
b){return this.translate(a,!1,!this.horiz,null,!0)+(b?0:this.pos)},toValue:function(a,b){return this.translate(a-(b?0:this.pos),!0,!this.horiz,null,!0)},getPlotLinePath:function(a,b,c,d,h){var k=this.chart,A=this.left,v=this.top,m,w,n=c&&k.oldChartHeight||k.chartHeight,e=c&&k.oldChartWidth||k.chartWidth,K;m=this.transB;var t=function(a,b,k){if(a<b||a>k)d?a=Math.min(Math.max(b,a),k):K=!0;return a};h=D(h,this.translate(a,null,null,c));h=Math.min(Math.max(-1E5,h),1E5);a=c=Math.round(h+m);m=w=Math.round(n-
h-m);B(h)?this.horiz?(m=v,w=n-this.bottom,a=c=t(a,A,A+this.width)):(a=A,c=e-this.right,m=w=t(m,v,v+this.height)):(K=!0,d=!1);return K&&!d?null:k.renderer.crispLine(["M",a,m,"L",c,w],b||1)},getLinearTickPositions:function(a,b,c){var k,A=f(Math.floor(b/a)*a);c=f(Math.ceil(c/a)*a);var d=[],h;f(A+a)===A&&(h=20);if(this.single)return[b];for(b=A;b<=c;){d.push(b);b=f(b+a,h);if(b===k)break;k=b}return d},getMinorTickInterval:function(){var a=this.options;return!0===a.minorTicks?D(a.minorTickInterval,"auto"):
!1===a.minorTicks?null:a.minorTickInterval},getMinorTickPositions:function(){var a=this,b=a.options,c=a.tickPositions,d=a.minorTickInterval,h=[],v=a.pointRangePadding||0,m=a.min-v,v=a.max+v,w=v-m;if(w&&w/d<a.len/3)if(a.isLog)p(this.paddedTicks,function(b,k,c){k&&h.push.apply(h,a.getLogTickPositions(d,c[k-1],c[k],!0))});else if(a.isDatetimeAxis&&"auto"===this.getMinorTickInterval())h=h.concat(a.getTimeTicks(a.normalizeTimeTickInterval(d),m,v,b.startOfWeek));else for(b=m+(c[0]-m)%d;b<=v&&b!==h[0];b+=
d)h.push(b);0!==h.length&&a.trimTicks(h);return h},adjustForMinRange:function(){var a=this.options,b=this.min,c=this.max,d,h,v,m,w,n,e,t;this.isXAxis&&void 0===this.minRange&&!this.isLog&&(C(a.min)||C(a.max)?this.minRange=null:(p(this.series,function(a){n=a.xData;for(m=e=a.xIncrement?1:n.length-1;0<m;m--)if(w=n[m]-n[m-1],void 0===v||w<v)v=w}),this.minRange=Math.min(5*v,this.dataMax-this.dataMin)));c-b<this.minRange&&(h=this.dataMax-this.dataMin>=this.minRange,t=this.minRange,d=(t-c+b)/2,d=[b-d,D(a.min,
b-d)],h&&(d[2]=this.isLog?this.log2lin(this.dataMin):this.dataMin),b=G(d),c=[b+t,D(a.max,b+t)],h&&(c[2]=this.isLog?this.log2lin(this.dataMax):this.dataMax),c=q(c),c-b<t&&(d[0]=c-t,d[1]=D(a.min,c-t),b=G(d)));this.min=b;this.max=c},getClosest:function(){var a;this.categories?a=1:p(this.series,function(b){var c=b.closestPointRange,k=b.visible||!b.chart.options.chart.ignoreHiddenSeries;!b.noSharedTooltip&&C(c)&&k&&(a=C(a)?Math.min(a,c):c)});return a},nameToX:function(a){var b=x(this.categories),k=b?this.categories:
this.names,d=a.options.x,h;a.series.requireSorting=!1;C(d)||(d=!1===this.options.uniqueNames?a.series.autoIncrement():b?c(a.name,k):D(k.keys[a.name],-1));-1===d?b||(h=k.length):h=d;void 0!==h&&(this.names[h]=a.name,this.names.keys[a.name]=h);return h},updateNames:function(){var b=this,c=this.names;0<c.length&&(p(a.keys(c.keys),function(a){delete c.keys[a]}),c.length=0,this.minRange=this.userMinRange,p(this.series||[],function(a){a.xIncrement=null;if(!a.points||a.isDirtyData)a.processData(),a.generatePoints();
p(a.points,function(c,k){var d;c.options&&(d=b.nameToX(c),void 0!==d&&d!==c.x&&(c.x=d,a.xData[k]=d))})}))},setAxisTranslation:function(a){var b=this,c=b.max-b.min,k=b.axisPointRange||0,d,h=0,v=0,m=b.linkedParent,w=!!b.categories,n=b.transA,g=b.isXAxis;if(g||w||k)d=b.getClosest(),m?(h=m.minPointOffset,v=m.pointRangePadding):p(b.series,function(a){var c=w?1:g?D(a.options.pointRange,d,0):b.axisPointRange||0;a=a.options.pointPlacement;k=Math.max(k,c);b.single||(h=Math.max(h,t(a)?0:c/2),v=Math.max(v,"on"===
a?0:c))}),m=b.ordinalSlope&&d?b.ordinalSlope/d:1,b.minPointOffset=h*=m,b.pointRangePadding=v*=m,b.pointRange=Math.min(k,c),g&&(b.closestPointRange=d);a&&(b.oldTransA=n);b.translationSlope=b.transA=n=b.options.staticScale||b.len/(c+v||1);b.transB=b.horiz?b.left:b.bottom;b.minPixelPadding=n*h;e(this,"afterSetAxisTranslation")},minFromRange:function(){return this.max-this.range},setTickInterval:function(b){var c=this,k=c.chart,d=c.options,h=c.isLog,v=c.isDatetimeAxis,w=c.isXAxis,n=c.isLinked,t=d.maxPadding,
g=d.minPadding,x=d.tickInterval,z=d.tickPixelInterval,H=c.categories,I=B(c.threshold)?c.threshold:null,l=c.softThreshold,r,y,u,q;v||H||n||this.getTickAmount();u=D(c.userMin,d.min);q=D(c.userMax,d.max);n?(c.linkedParent=k[c.coll][d.linkedTo],k=c.linkedParent.getExtremes(),c.min=D(k.min,k.dataMin),c.max=D(k.max,k.dataMax),d.type!==c.linkedParent.options.type&&a.error(11,1)):(!l&&C(I)&&(c.dataMin>=I?(r=I,g=0):c.dataMax<=I&&(y=I,t=0)),c.min=D(u,r,c.dataMin),c.max=D(q,y,c.dataMax));h&&(c.positiveValuesOnly&&
!b&&0>=Math.min(c.min,D(c.dataMin,c.min))&&a.error(10,1),c.min=f(c.log2lin(c.min),15),c.max=f(c.log2lin(c.max),15));c.range&&C(c.max)&&(c.userMin=c.min=u=Math.max(c.dataMin,c.minFromRange()),c.userMax=q=c.max,c.range=null);e(c,"foundExtremes");c.beforePadding&&c.beforePadding();c.adjustForMinRange();!(H||c.axisPointRange||c.usePercentage||n)&&C(c.min)&&C(c.max)&&(k=c.max-c.min)&&(!C(u)&&g&&(c.min-=k*g),!C(q)&&t&&(c.max+=k*t));B(d.softMin)&&!B(c.userMin)&&(c.min=Math.min(c.min,d.softMin));B(d.softMax)&&
!B(c.userMax)&&(c.max=Math.max(c.max,d.softMax));B(d.floor)&&(c.min=Math.max(c.min,d.floor));B(d.ceiling)&&(c.max=Math.min(c.max,d.ceiling));l&&C(c.dataMin)&&(I=I||0,!C(u)&&c.min<I&&c.dataMin>=I?c.min=I:!C(q)&&c.max>I&&c.dataMax<=I&&(c.max=I));c.tickInterval=c.min===c.max||void 0===c.min||void 0===c.max?1:n&&!x&&z===c.linkedParent.options.tickPixelInterval?x=c.linkedParent.tickInterval:D(x,this.tickAmount?(c.max-c.min)/Math.max(this.tickAmount-1,1):void 0,H?1:(c.max-c.min)*z/Math.max(c.len,z));w&&
!b&&p(c.series,function(a){a.processData(c.min!==c.oldMin||c.max!==c.oldMax)});c.setAxisTranslation(!0);c.beforeSetTickPositions&&c.beforeSetTickPositions();c.postProcessTickInterval&&(c.tickInterval=c.postProcessTickInterval(c.tickInterval));c.pointRange&&!x&&(c.tickInterval=Math.max(c.pointRange,c.tickInterval));b=D(d.minTickInterval,c.isDatetimeAxis&&c.closestPointRange);!x&&c.tickInterval<b&&(c.tickInterval=b);v||h||x||(c.tickInterval=L(c.tickInterval,null,m(c.tickInterval),D(d.allowDecimals,
!(.5<c.tickInterval&&5>c.tickInterval&&1E3<c.max&&9999>c.max)),!!this.tickAmount));this.tickAmount||(c.tickInterval=c.unsquish());this.setTickPositions()},setTickPositions:function(){var b=this.options,c,d=b.tickPositions;c=this.getMinorTickInterval();var h=b.tickPositioner,v=b.startOnTick,m=b.endOnTick;this.tickmarkOffset=this.categories&&"between"===b.tickmarkPlacement&&1===this.tickInterval?.5:0;this.minorTickInterval="auto"===c&&this.tickInterval?this.tickInterval/5:c;this.single=this.min===this.max&&
C(this.min)&&!this.tickAmount&&(parseInt(this.min,10)===this.min||!1!==b.allowDecimals);this.tickPositions=c=d&&d.slice();!c&&(!this.ordinalPositions&&(this.max-this.min)/this.tickInterval>Math.max(2*this.len,200)?(c=[this.min,this.max],a.error(19)):c=this.isDatetimeAxis?this.getTimeTicks(this.normalizeTimeTickInterval(this.tickInterval,b.units),this.min,this.max,b.startOfWeek,this.ordinalPositions,this.closestPointRange,!0):this.isLog?this.getLogTickPositions(this.tickInterval,this.min,this.max):
this.getLinearTickPositions(this.tickInterval,this.min,this.max),c.length>this.len&&(c=[c[0],c.pop()],c[0]===c[1]&&(c.length=1)),this.tickPositions=c,h&&(h=h.apply(this,[this.min,this.max])))&&(this.tickPositions=c=h);this.paddedTicks=c.slice(0);this.trimTicks(c,v,m);this.isLinked||(this.single&&2>c.length&&(this.min-=.5,this.max+=.5),d||h||this.adjustTickAmount());e(this,"afterSetTickPositions")},trimTicks:function(a,b,c){var k=a[0],d=a[a.length-1],h=this.minPointOffset||0;if(!this.isLinked){if(b&&
-Infinity!==k)this.min=k;else for(;this.min-h>a[0];)a.shift();if(c)this.max=d;else for(;this.max+h<a[a.length-1];)a.pop();0===a.length&&C(k)&&!this.options.tickPositions&&a.push((d+k)/2)}},alignToOthers:function(){var a={},b,c=this.options;!1===this.chart.options.chart.alignTicks||!1===c.alignTicks||!1===c.startOnTick||!1===c.endOnTick||this.isLog||p(this.chart[this.coll],function(c){var k=c.options,k=[c.horiz?k.left:k.top,k.width,k.height,k.pane].join();c.series.length&&(a[k]?b=!0:a[k]=1)});return b},
getTickAmount:function(){var a=this.options,b=a.tickAmount,c=a.tickPixelInterval;!C(a.tickInterval)&&this.len<c&&!this.isRadial&&!this.isLog&&a.startOnTick&&a.endOnTick&&(b=2);!b&&this.alignToOthers()&&(b=Math.ceil(this.len/c)+1);4>b&&(this.finalTickAmt=b,b=5);this.tickAmount=b},adjustTickAmount:function(){var a=this.tickInterval,b=this.tickPositions,c=this.tickAmount,d=this.finalTickAmt,h=b&&b.length,v=D(this.threshold,this.softThreshold?0:null);if(this.hasData()){if(h<c){for(;b.length<c;)b.length%
2||this.min===v?b.push(f(b[b.length-1]+a)):b.unshift(f(b[0]-a));this.transA*=(h-1)/(c-1);this.min=b[0];this.max=b[b.length-1]}else h>c&&(this.tickInterval*=2,this.setTickPositions());if(C(d)){for(a=c=b.length;a--;)(3===d&&1===a%2||2>=d&&0<a&&a<c-1)&&b.splice(a,1);this.finalTickAmt=void 0}}},setScale:function(){var a,b;this.oldMin=this.min;this.oldMax=this.max;this.oldAxisLength=this.len;this.setAxisSize();b=this.len!==this.oldAxisLength;p(this.series,function(b){if(b.isDirtyData||b.isDirty||b.xAxis.isDirty)a=
!0});b||a||this.isLinked||this.forceRedraw||this.userMin!==this.oldUserMin||this.userMax!==this.oldUserMax||this.alignToOthers()?(this.resetStacks&&this.resetStacks(),this.forceRedraw=!1,this.getSeriesExtremes(),this.setTickInterval(),this.oldUserMin=this.userMin,this.oldUserMax=this.userMax,this.isDirty||(this.isDirty=b||this.min!==this.oldMin||this.max!==this.oldMax)):this.cleanStacks&&this.cleanStacks();e(this,"afterSetScale")},setExtremes:function(a,b,c,h,v){var k=this,m=k.chart;c=D(c,!0);p(k.series,
function(a){delete a.kdTree});v=d(v,{min:a,max:b});e(k,"setExtremes",v,function(){k.userMin=a;k.userMax=b;k.eventArgs=v;c&&m.redraw(h)})},zoom:function(a,b){var c=this.dataMin,k=this.dataMax,d=this.options,h=Math.min(c,D(d.min,c)),d=Math.max(k,D(d.max,k));if(a!==this.min||b!==this.max)this.allowZoomOutside||(C(c)&&(a<h&&(a=h),a>d&&(a=d)),C(k)&&(b<h&&(b=h),b>d&&(b=d))),this.displayBtn=void 0!==a||void 0!==b,this.setExtremes(a,b,!1,void 0,{trigger:"zoom"});return!0},setAxisSize:function(){var b=this.chart,
c=this.options,d=c.offsets||[0,0,0,0],h=this.horiz,v=this.width=Math.round(a.relativeLength(D(c.width,b.plotWidth-d[3]+d[1]),b.plotWidth)),m=this.height=Math.round(a.relativeLength(D(c.height,b.plotHeight-d[0]+d[2]),b.plotHeight)),w=this.top=Math.round(a.relativeLength(D(c.top,b.plotTop+d[0]),b.plotHeight,b.plotTop)),c=this.left=Math.round(a.relativeLength(D(c.left,b.plotLeft+d[3]),b.plotWidth,b.plotLeft));this.bottom=b.chartHeight-m-w;this.right=b.chartWidth-v-c;this.len=Math.max(h?v:m,0);this.pos=
h?c:w},getExtremes:function(){var a=this.isLog;return{min:a?f(this.lin2log(this.min)):this.min,max:a?f(this.lin2log(this.max)):this.max,dataMin:this.dataMin,dataMax:this.dataMax,userMin:this.userMin,userMax:this.userMax}},getThreshold:function(a){var b=this.isLog,c=b?this.lin2log(this.min):this.min,b=b?this.lin2log(this.max):this.max;null===a||-Infinity===a?a=c:Infinity===a?a=b:c>a?a=c:b<a&&(a=b);return this.translate(a,0,1,0,1)},autoLabelAlign:function(a){a=(D(a,0)-90*this.side+720)%360;return 15<
a&&165>a?"right":195<a&&345>a?"left":"center"},tickSize:function(a){var b=this.options,c=b[a+"Length"],k=D(b[a+"Width"],"tick"===a&&this.isXAxis?1:0);if(k&&c)return"inside"===b[a+"Position"]&&(c=-c),[c,k]},labelMetrics:function(){var a=this.tickPositions&&this.tickPositions[0]||0;return this.chart.renderer.fontMetrics(this.options.labels.style&&this.options.labels.style.fontSize,this.ticks[a]&&this.ticks[a].label)},unsquish:function(){var a=this.options.labels,b=this.horiz,c=this.tickInterval,d=c,
h=this.len/(((this.categories?1:0)+this.max-this.min)/c),v,m=a.rotation,w=this.labelMetrics(),n,e=Number.MAX_VALUE,t,g=function(a){a/=h||1;a=1<a?Math.ceil(a):1;return f(a*c)};b?(t=!a.staggerLines&&!a.step&&(C(m)?[m]:h<D(a.autoRotationLimit,80)&&a.autoRotation))&&p(t,function(a){var b;if(a===m||a&&-90<=a&&90>=a)n=g(Math.abs(w.h/Math.sin(r*a))),b=n+Math.abs(a/360),b<e&&(e=b,v=a,d=n)}):a.step||(d=g(w.h));this.autoRotation=t;this.labelRotation=D(v,m);return d},getSlotWidth:function(){var a=this.chart,
b=this.horiz,c=this.options.labels,d=Math.max(this.tickPositions.length-(this.categories?0:1),1),h=a.margin[3];return b&&2>(c.step||0)&&!c.rotation&&(this.staggerLines||1)*this.len/d||!b&&(c.style&&parseInt(c.style.width,10)||h&&h-a.spacing[3]||.33*a.chartWidth)},renderUnsquish:function(){var a=this.chart,b=a.renderer,c=this.tickPositions,d=this.ticks,h=this.options.labels,v=h&&h.style||{},m=this.horiz,w=this.getSlotWidth(),n=Math.max(1,Math.round(w-2*(h.padding||5))),e={},g=this.labelMetrics(),x=
h.style&&h.style.textOverflow,B,z,D=0,H;t(h.rotation)||(e.rotation=h.rotation||0);p(c,function(a){(a=d[a])&&a.label&&a.label.textPxLength>D&&(D=a.label.textPxLength)});this.maxLabelLength=D;if(this.autoRotation)D>n&&D>g.h?e.rotation=this.labelRotation:this.labelRotation=0;else if(w&&(B=n,!x))for(z="clip",n=c.length;!m&&n--;)if(H=c[n],H=d[H].label)H.styles&&"ellipsis"===H.styles.textOverflow?H.css({textOverflow:"clip"}):H.textPxLength>w&&H.css({width:w+"px"}),H.getBBox().height>this.len/c.length-(g.h-
g.f)&&(H.specificTextOverflow="ellipsis");e.rotation&&(B=D>.5*a.chartHeight?.33*a.chartHeight:D,x||(z="ellipsis"));if(this.labelAlign=h.align||this.autoLabelAlign(this.labelRotation))e.align=this.labelAlign;p(c,function(a){var b=(a=d[a])&&a.label,c=v.width,k={};b&&(b.attr(e),B&&!c&&"nowrap"!==v.whiteSpace&&(B<b.textPxLength||"SPAN"===b.element.tagName)?(k.width=B,x||(k.textOverflow=b.specificTextOverflow||z),b.css(k)):b.styles&&b.styles.width&&!k.width&&!c&&b.css({width:null}),delete b.specificTextOverflow,
a.rotation=e.rotation)});this.tickRotCorr=b.rotCorr(g.b,this.labelRotation||0,0!==this.side)},hasData:function(){return this.hasVisibleSeries||C(this.min)&&C(this.max)&&this.tickPositions&&0<this.tickPositions.length},addTitle:function(a){var b=this.chart.renderer,c=this.horiz,d=this.opposite,k=this.options.title,h;this.axisTitle||((h=k.textAlign)||(h=(c?{low:"left",middle:"center",high:"right"}:{low:d?"right":"left",middle:"center",high:d?"left":"right"})[k.align]),this.axisTitle=b.text(k.text,0,
0,k.useHTML).attr({zIndex:7,rotation:k.rotation||0,align:h}).addClass("highcharts-axis-title").css(n(k.style)).add(this.axisGroup),this.axisTitle.isNew=!0);k.style.width||this.isRadial||this.axisTitle.css({width:this.len});this.axisTitle[a?"show":"hide"](!0)},generateTick:function(a){var b=this.ticks;b[a]?b[a].addLabel():b[a]=new v(this,a)},getOffset:function(){var a=this,b=a.chart,c=b.renderer,d=a.options,h=a.tickPositions,v=a.ticks,m=a.horiz,w=a.side,n=b.inverted&&!a.isZAxis?[1,0,3,2][w]:w,t,g,
x=0,B,H=0,I=d.title,f=d.labels,l=0,L=b.axisOffset,b=b.clipOffset,r=[-1,1,1,-1][w],y=d.className,u=a.axisParent,q=this.tickSize("tick");t=a.hasData();a.showAxis=g=t||D(d.showEmpty,!0);a.staggerLines=a.horiz&&f.staggerLines;a.axisGroup||(a.gridGroup=c.g("grid").attr({zIndex:d.gridZIndex||1}).addClass("highcharts-"+this.coll.toLowerCase()+"-grid "+(y||"")).add(u),a.axisGroup=c.g("axis").attr({zIndex:d.zIndex||2}).addClass("highcharts-"+this.coll.toLowerCase()+" "+(y||"")).add(u),a.labelGroup=c.g("axis-labels").attr({zIndex:f.zIndex||
7}).addClass("highcharts-"+a.coll.toLowerCase()+"-labels "+(y||"")).add(u));t||a.isLinked?(p(h,function(b,c){a.generateTick(b,c)}),a.renderUnsquish(),a.reserveSpaceDefault=0===w||2===w||{1:"left",3:"right"}[w]===a.labelAlign,D(f.reserveSpace,"center"===a.labelAlign?!0:null,a.reserveSpaceDefault)&&p(h,function(a){l=Math.max(v[a].getLabelSize(),l)}),a.staggerLines&&(l*=a.staggerLines),a.labelOffset=l*(a.opposite?-1:1)):z(v,function(a,b){a.destroy();delete v[b]});I&&I.text&&!1!==I.enabled&&(a.addTitle(g),
g&&!1!==I.reserveSpace&&(a.titleOffset=x=a.axisTitle.getBBox()[m?"height":"width"],B=I.offset,H=C(B)?0:D(I.margin,m?5:10)));a.renderLine();a.offset=r*D(d.offset,L[w]);a.tickRotCorr=a.tickRotCorr||{x:0,y:0};c=0===w?-a.labelMetrics().h:2===w?a.tickRotCorr.y:0;H=Math.abs(l)+H;l&&(H=H-c+r*(m?D(f.y,a.tickRotCorr.y+8*r):f.x));a.axisTitleMargin=D(B,H);L[w]=Math.max(L[w],a.axisTitleMargin+x+r*a.offset,H,t&&h.length&&q?q[0]+r*a.offset:0);d=d.offset?0:2*Math.floor(a.axisLine.strokeWidth()/2);b[n]=Math.max(b[n],
d);e(this,"afterGetOffset")},getLinePath:function(a){var b=this.chart,c=this.opposite,d=this.offset,k=this.horiz,h=this.left+(c?this.width:0)+d,d=b.chartHeight-this.bottom-(c?this.height:0)+d;c&&(a*=-1);return b.renderer.crispLine(["M",k?this.left:h,k?d:this.top,"L",k?b.chartWidth-this.right:h,k?d:b.chartHeight-this.bottom],a)},renderLine:function(){this.axisLine||(this.axisLine=this.chart.renderer.path().addClass("highcharts-axis-line").add(this.axisGroup),this.axisLine.attr({stroke:this.options.lineColor,
"stroke-width":this.options.lineWidth,zIndex:7}))},getTitlePosition:function(){var a=this.horiz,b=this.left,c=this.top,d=this.len,h=this.options.title,v=a?b:c,m=this.opposite,w=this.offset,n=h.x||0,e=h.y||0,t=this.axisTitle,g=this.chart.renderer.fontMetrics(h.style&&h.style.fontSize,t),t=Math.max(t.getBBox(null,0).height-g.h-1,0),d={low:v+(a?0:d),middle:v+d/2,high:v+(a?d:0)}[h.align],b=(a?c+this.height:b)+(a?1:-1)*(m?-1:1)*this.axisTitleMargin+[-t,t,g.f,-t][this.side];return{x:a?d+n:b+(m?this.width:
0)+w+n,y:a?b+e-(m?this.height:0)+w:d+e}},renderMinorTick:function(a){var b=this.chart.hasRendered&&B(this.oldMin),c=this.minorTicks;c[a]||(c[a]=new v(this,a,"minor"));b&&c[a].isNew&&c[a].render(null,!0);c[a].render(null,!1,1)},renderTick:function(a,b){var c=this.isLinked,d=this.ticks,h=this.chart.hasRendered&&B(this.oldMin);if(!c||a>=this.min&&a<=this.max)d[a]||(d[a]=new v(this,a)),h&&d[a].isNew&&d[a].render(b,!0,.1),d[a].render(b)},render:function(){var b=this,c=b.chart,d=b.options,h=b.isLog,m=b.isLinked,
w=b.tickPositions,n=b.axisTitle,t=b.ticks,g=b.minorTicks,x=b.alternateBands,D=d.stackLabels,I=d.alternateGridColor,f=b.tickmarkOffset,l=b.axisLine,L=b.showAxis,r=F(c.renderer.globalAnimation),y,u;b.labelEdge.length=0;b.overlap=!1;p([t,g,x],function(a){z(a,function(a){a.isActive=!1})});if(b.hasData()||m)b.minorTickInterval&&!b.categories&&p(b.getMinorTickPositions(),function(a){b.renderMinorTick(a)}),w.length&&(p(w,function(a,c){b.renderTick(a,c)}),f&&(0===b.min||b.single)&&(t[-1]||(t[-1]=new v(b,
-1,null,!0)),t[-1].render(-1))),I&&p(w,function(d,k){u=void 0!==w[k+1]?w[k+1]+f:b.max-f;0===k%2&&d<b.max&&u<=b.max+(c.polar?-f:f)&&(x[d]||(x[d]=new a.PlotLineOrBand(b)),y=d+f,x[d].options={from:h?b.lin2log(y):y,to:h?b.lin2log(u):u,color:I},x[d].render(),x[d].isActive=!0)}),b._addedPlotLB||(p((d.plotLines||[]).concat(d.plotBands||[]),function(a){b.addPlotBandOrLine(a)}),b._addedPlotLB=!0);p([t,g,x],function(a){var b,d=[],h=r.duration;z(a,function(a,b){a.isActive||(a.render(b,!1,0),a.isActive=!1,d.push(b))});
H(function(){for(b=d.length;b--;)a[d[b]]&&!a[d[b]].isActive&&(a[d[b]].destroy(),delete a[d[b]])},a!==x&&c.hasRendered&&h?h:0)});l&&(l[l.isPlaced?"animate":"attr"]({d:this.getLinePath(l.strokeWidth())}),l.isPlaced=!0,l[L?"show":"hide"](!0));n&&L&&(d=b.getTitlePosition(),B(d.y)?(n[n.isNew?"attr":"animate"](d),n.isNew=!1):(n.attr("y",-9999),n.isNew=!0));D&&D.enabled&&b.renderStackTotals();b.isDirty=!1;e(this,"afterRender")},redraw:function(){this.visible&&(this.render(),p(this.plotLinesAndBands,function(a){a.render()}));
p(this.series,function(a){a.isDirty=!0})},keepProps:"extKey hcEvents names series userMax userMin".split(" "),destroy:function(a){var b=this,d=b.stacks,k=b.plotLinesAndBands,v;e(this,"destroy",{keepEvents:a});a||h(b);z(d,function(a,b){y(a);d[b]=null});p([b.ticks,b.minorTicks,b.alternateBands],function(a){y(a)});if(k)for(a=k.length;a--;)k[a].destroy();p("stackTotalGroup axisLine axisTitle axisGroup gridGroup labelGroup cross scrollbar".split(" "),function(a){b[a]&&(b[a]=b[a].destroy())});for(v in b.plotLinesAndBandsGroups)b.plotLinesAndBandsGroups[v]=
b.plotLinesAndBandsGroups[v].destroy();z(b,function(a,d){-1===c(d,b.keepProps)&&delete b[d]})},drawCrosshair:function(a,b){var c,d=this.crosshair,h=D(d.snap,!0),k,v=this.cross;e(this,"drawCrosshair",{e:a,point:b});a||(a=this.cross&&this.cross.e);if(this.crosshair&&!1!==(C(b)||!h)){h?C(b)&&(k=D(b.crosshairPos,this.isXAxis?b.plotX:this.len-b.plotY)):k=a&&(this.horiz?a.chartX-this.pos:this.len-a.chartY+this.pos);C(k)&&(c=this.getPlotLinePath(b&&(this.isXAxis?b.x:D(b.stackY,b.y)),null,null,null,k)||null);
if(!C(c)){this.hideCrosshair();return}h=this.categories&&!this.isRadial;v||(this.cross=v=this.chart.renderer.path().addClass("highcharts-crosshair highcharts-crosshair-"+(h?"category ":"thin ")+d.className).attr({zIndex:D(d.zIndex,2)}).add(),v.attr({stroke:d.color||(h?l("#ccd6eb").setOpacity(.25).get():"#cccccc"),"stroke-width":D(d.width,1)}).css({"pointer-events":"none"}),d.dashStyle&&v.attr({dashstyle:d.dashStyle}));v.show().attr({d:c});h&&!d.width&&v.attr({"stroke-width":this.transA});this.cross.e=
a}else this.hideCrosshair();e(this,"afterDrawCrosshair",{e:a,point:b})},hideCrosshair:function(){this.cross&&this.cross.hide()}});return a.Axis=w}(J);(function(a){var E=a.Axis,F=a.getMagnitude,G=a.normalizeTickInterval,q=a.timeUnits;E.prototype.getTimeTicks=function(){return this.chart.time.getTimeTicks.apply(this.chart.time,arguments)};E.prototype.normalizeTimeTickInterval=function(a,f){var l=f||[["millisecond",[1,2,5,10,20,25,50,100,200,500]],["second",[1,2,5,10,15,30]],["minute",[1,2,5,10,15,30]],
["hour",[1,2,3,4,6,8,12]],["day",[1,2]],["week",[1,2]],["month",[1,2,3,4,6]],["year",null]];f=l[l.length-1];var C=q[f[0]],r=f[1],y;for(y=0;y<l.length&&!(f=l[y],C=q[f[0]],r=f[1],l[y+1]&&a<=(C*r[r.length-1]+q[l[y+1][0]])/2);y++);C===q.year&&a<5*C&&(r=[1,2,5]);a=G(a/C,r,"year"===f[0]?Math.max(F(a/C),1):1);return{unitRange:C,count:a,unitName:f[0]}}})(J);(function(a){var E=a.Axis,F=a.getMagnitude,G=a.map,q=a.normalizeTickInterval,l=a.pick;E.prototype.getLogTickPositions=function(a,u,C,r){var f=this.options,
p=this.len,d=[];r||(this._minorAutoInterval=null);if(.5<=a)a=Math.round(a),d=this.getLinearTickPositions(a,u,C);else if(.08<=a)for(var p=Math.floor(u),e,g,m,b,c,f=.3<a?[1,2,4]:.15<a?[1,2,4,6,8]:[1,2,3,4,5,6,7,8,9];p<C+1&&!c;p++)for(g=f.length,e=0;e<g&&!c;e++)m=this.log2lin(this.lin2log(p)*f[e]),m>u&&(!r||b<=C)&&void 0!==b&&d.push(b),b>C&&(c=!0),b=m;else u=this.lin2log(u),C=this.lin2log(C),a=r?this.getMinorTickInterval():f.tickInterval,a=l("auto"===a?null:a,this._minorAutoInterval,f.tickPixelInterval/
(r?5:1)*(C-u)/((r?p/this.tickPositions.length:p)||1)),a=q(a,null,F(a)),d=G(this.getLinearTickPositions(a,u,C),this.log2lin),r||(this._minorAutoInterval=a/5);r||(this.tickInterval=a);return d};E.prototype.log2lin=function(a){return Math.log(a)/Math.LN10};E.prototype.lin2log=function(a){return Math.pow(10,a)}})(J);(function(a,E){var F=a.arrayMax,G=a.arrayMin,q=a.defined,l=a.destroyObjectProperties,f=a.each,u=a.erase,C=a.merge,r=a.pick;a.PlotLineOrBand=function(a,p){this.axis=a;p&&(this.options=p,this.id=
p.id)};a.PlotLineOrBand.prototype={render:function(){var f=this,p=f.axis,d=p.horiz,e=f.options,g=e.label,m=f.label,b=e.to,c=e.from,x=e.value,B=q(c)&&q(b),t=q(x),n=f.svgElem,l=!n,z=[],D=e.color,h=r(e.zIndex,0),I=e.events,z={"class":"highcharts-plot-"+(B?"band ":"line ")+(e.className||"")},H={},v=p.chart.renderer,w=B?"bands":"lines";p.isLog&&(c=p.log2lin(c),b=p.log2lin(b),x=p.log2lin(x));t?(z.stroke=D,z["stroke-width"]=e.width,e.dashStyle&&(z.dashstyle=e.dashStyle)):B&&(D&&(z.fill=D),e.borderWidth&&
(z.stroke=e.borderColor,z["stroke-width"]=e.borderWidth));H.zIndex=h;w+="-"+h;(D=p.plotLinesAndBandsGroups[w])||(p.plotLinesAndBandsGroups[w]=D=v.g("plot-"+w).attr(H).add());l&&(f.svgElem=n=v.path().attr(z).add(D));if(t)z=p.getPlotLinePath(x,n.strokeWidth());else if(B)z=p.getPlotBandPath(c,b,e);else return;l&&z&&z.length?(n.attr({d:z}),I&&a.objectEach(I,function(a,b){n.on(b,function(a){I[b].apply(f,[a])})})):n&&(z?(n.show(),n.animate({d:z})):(n.hide(),m&&(f.label=m=m.destroy())));g&&q(g.text)&&z&&
z.length&&0<p.width&&0<p.height&&!z.isFlat?(g=C({align:d&&B&&"center",x:d?!B&&4:10,verticalAlign:!d&&B&&"middle",y:d?B?16:10:B?6:-4,rotation:d&&!B&&90},g),this.renderLabel(g,z,B,h)):m&&m.hide();return f},renderLabel:function(a,p,d,e){var g=this.label,m=this.axis.chart.renderer;g||(g={align:a.textAlign||a.align,rotation:a.rotation,"class":"highcharts-plot-"+(d?"band":"line")+"-label "+(a.className||"")},g.zIndex=e,this.label=g=m.text(a.text,0,0,a.useHTML).attr(g).add(),g.css(a.style));e=p.xBounds||
[p[1],p[4],d?p[6]:p[1]];p=p.yBounds||[p[2],p[5],d?p[7]:p[2]];d=G(e);m=G(p);g.align(a,!1,{x:d,y:m,width:F(e)-d,height:F(p)-m});g.show()},destroy:function(){u(this.axis.plotLinesAndBands,this);delete this.axis;l(this)}};a.extend(E.prototype,{getPlotBandPath:function(a,p){var d=this.getPlotLinePath(p,null,null,!0),e=this.getPlotLinePath(a,null,null,!0),g=[],m=this.horiz,b=1,c;a=a<this.min&&p<this.min||a>this.max&&p>this.max;if(e&&d)for(a&&(c=e.toString()===d.toString(),b=0),a=0;a<e.length;a+=6)m&&d[a+
1]===e[a+1]?(d[a+1]+=b,d[a+4]+=b):m||d[a+2]!==e[a+2]||(d[a+2]+=b,d[a+5]+=b),g.push("M",e[a+1],e[a+2],"L",e[a+4],e[a+5],d[a+4],d[a+5],d[a+1],d[a+2],"z"),g.isFlat=c;return g},addPlotBand:function(a){return this.addPlotBandOrLine(a,"plotBands")},addPlotLine:function(a){return this.addPlotBandOrLine(a,"plotLines")},addPlotBandOrLine:function(f,p){var d=(new a.PlotLineOrBand(this,f)).render(),e=this.userOptions;d&&(p&&(e[p]=e[p]||[],e[p].push(f)),this.plotLinesAndBands.push(d));return d},removePlotBandOrLine:function(a){for(var p=
this.plotLinesAndBands,d=this.options,e=this.userOptions,g=p.length;g--;)p[g].id===a&&p[g].destroy();f([d.plotLines||[],e.plotLines||[],d.plotBands||[],e.plotBands||[]],function(d){for(g=d.length;g--;)d[g].id===a&&u(d,d[g])})},removePlotBand:function(a){this.removePlotBandOrLine(a)},removePlotLine:function(a){this.removePlotBandOrLine(a)}})})(J,ea);(function(a){var E=a.doc,F=a.each,G=a.extend,q=a.format,l=a.isNumber,f=a.map,u=a.merge,C=a.pick,r=a.splat,y=a.syncTimeout,p=a.timeUnits;a.Tooltip=function(){this.init.apply(this,
arguments)};a.Tooltip.prototype={init:function(a,e){this.chart=a;this.options=e;this.crosshairs=[];this.now={x:0,y:0};this.isHidden=!0;this.split=e.split&&!a.inverted;this.shared=e.shared||this.split;this.outside=e.outside&&!this.split},cleanSplit:function(a){F(this.chart.series,function(d){var e=d&&d.tt;e&&(!e.isActive||a?d.tt=e.destroy():e.isActive=!1)})},getLabel:function(){var d=this.chart.renderer,e=this.options,g;this.label||(this.outside&&(this.container=g=a.doc.createElement("div"),g.className=
"highcharts-tooltip-container",a.css(g,{position:"absolute",top:"1px",pointerEvents:e.style&&e.style.pointerEvents}),a.doc.body.appendChild(g),this.renderer=d=new a.Renderer(g,0,0)),this.split?this.label=d.g("tooltip"):(this.label=d.label("",0,0,e.shape||"callout",null,null,e.useHTML,null,"tooltip").attr({padding:e.padding,r:e.borderRadius}),this.label.attr({fill:e.backgroundColor,"stroke-width":e.borderWidth}).css(e.style).shadow(e.shadow)),this.outside&&(this.label.attr({x:this.distance,y:this.distance}),
this.label.xSetter=function(a){g.style.left=a+"px"},this.label.ySetter=function(a){g.style.top=a+"px"}),this.label.attr({zIndex:8}).add());return this.label},update:function(a){this.destroy();u(!0,this.chart.options.tooltip.userOptions,a);this.init(this.chart,u(!0,this.options,a))},destroy:function(){this.label&&(this.label=this.label.destroy());this.split&&this.tt&&(this.cleanSplit(this.chart,!0),this.tt=this.tt.destroy());this.renderer&&(this.renderer=this.renderer.destroy(),a.discardElement(this.container));
a.clearTimeout(this.hideTimer);a.clearTimeout(this.tooltipTimeout)},move:function(d,e,g,m){var b=this,c=b.now,x=!1!==b.options.animation&&!b.isHidden&&(1<Math.abs(d-c.x)||1<Math.abs(e-c.y)),B=b.followPointer||1<b.len;G(c,{x:x?(2*c.x+d)/3:d,y:x?(c.y+e)/2:e,anchorX:B?void 0:x?(2*c.anchorX+g)/3:g,anchorY:B?void 0:x?(c.anchorY+m)/2:m});b.getLabel().attr(c);x&&(a.clearTimeout(this.tooltipTimeout),this.tooltipTimeout=setTimeout(function(){b&&b.move(d,e,g,m)},32))},hide:function(d){var e=this;a.clearTimeout(this.hideTimer);
d=C(d,this.options.hideDelay,500);this.isHidden||(this.hideTimer=y(function(){e.getLabel()[d?"fadeOut":"hide"]();e.isHidden=!0},d))},getAnchor:function(a,e){var d=this.chart,m=d.pointer,b=d.inverted,c=d.plotTop,x=d.plotLeft,B=0,t=0,n,p;a=r(a);this.followPointer&&e?(void 0===e.chartX&&(e=m.normalize(e)),a=[e.chartX-d.plotLeft,e.chartY-c]):a[0].tooltipPos?a=a[0].tooltipPos:(F(a,function(a){n=a.series.yAxis;p=a.series.xAxis;B+=a.plotX+(!b&&p?p.left-x:0);t+=(a.plotLow?(a.plotLow+a.plotHigh)/2:a.plotY)+
(!b&&n?n.top-c:0)}),B/=a.length,t/=a.length,a=[b?d.plotWidth-t:B,this.shared&&!b&&1<a.length&&e?e.chartY-c:b?d.plotHeight-B:t]);return f(a,Math.round)},getPosition:function(a,e,g){var d=this.chart,b=this.distance,c={},x=d.inverted&&g.h||0,B,t=this.outside,n=t?E.documentElement.clientWidth-2*b:d.chartWidth,p=t?Math.max(E.body.scrollHeight,E.documentElement.scrollHeight,E.body.offsetHeight,E.documentElement.offsetHeight,E.documentElement.clientHeight):d.chartHeight,z=d.pointer.chartPosition,D=["y",
p,e,(t?z.top-b:0)+g.plotY+d.plotTop,t?0:d.plotTop,t?p:d.plotTop+d.plotHeight],h=["x",n,a,(t?z.left-b:0)+g.plotX+d.plotLeft,t?0:d.plotLeft,t?n:d.plotLeft+d.plotWidth],I=!this.followPointer&&C(g.ttBelow,!d.inverted===!!g.negative),H=function(a,d,h,k,v,m){var w=h<k-b,n=k+b+h<d,e=k-b-h;k+=b;if(I&&n)c[a]=k;else if(!I&&w)c[a]=e;else if(w)c[a]=Math.min(m-h,0>e-x?e:e-x);else if(n)c[a]=Math.max(v,k+x+h>d?k:k+x);else return!1},v=function(a,d,h,k){var v;k<b||k>d-b?v=!1:c[a]=k<h/2?1:k>d-h/2?d-h-2:k-h/2;return v},
w=function(a){var b=D;D=h;h=b;B=a},k=function(){!1!==H.apply(0,D)?!1!==v.apply(0,h)||B||(w(!0),k()):B?c.x=c.y=0:(w(!0),k())};(d.inverted||1<this.len)&&w();k();return c},defaultFormatter:function(a){var d=this.points||r(this),g;g=[a.tooltipFooterHeaderFormatter(d[0])];g=g.concat(a.bodyFormatter(d));g.push(a.tooltipFooterHeaderFormatter(d[0],!0));return g},refresh:function(d,e){var g,m=this.options,b,c=d,x,B={},t=[];g=m.formatter||this.defaultFormatter;var B=this.shared,n;m.enabled&&(a.clearTimeout(this.hideTimer),
this.followPointer=r(c)[0].series.tooltipOptions.followPointer,x=this.getAnchor(c,e),e=x[0],b=x[1],!B||c.series&&c.series.noSharedTooltip?B=c.getLabelConfig():(F(c,function(a){a.setState("hover");t.push(a.getLabelConfig())}),B={x:c[0].category,y:c[0].y},B.points=t,c=c[0]),this.len=t.length,B=g.call(B,this),n=c.series,this.distance=C(n.tooltipOptions.distance,16),!1===B?this.hide():(g=this.getLabel(),this.isHidden&&g.attr({opacity:1}).show(),this.split?this.renderSplit(B,r(d)):(m.style.width||g.css({width:this.chart.spacingBox.width}),
g.attr({text:B&&B.join?B.join(""):B}),g.removeClass(/highcharts-color-[\d]+/g).addClass("highcharts-color-"+C(c.colorIndex,n.colorIndex)),g.attr({stroke:m.borderColor||c.color||n.color||"#666666"}),this.updatePosition({plotX:e,plotY:b,negative:c.negative,ttBelow:c.ttBelow,h:x[2]||0})),this.isHidden=!1))},renderSplit:function(d,e){var g=this,m=[],b=this.chart,c=b.renderer,x=!0,B=this.options,t=0,n,p=this.getLabel(),z=b.plotTop;a.isString(d)&&(d=[!1,d]);F(d.slice(0,e.length+1),function(a,d){if(!1!==
a){d=e[d-1]||{isHeader:!0,plotX:e[0].plotX};var h=d.series||g,H=h.tt,v=d.series||{},w="highcharts-color-"+C(d.colorIndex,v.colorIndex,"none");H||(h.tt=H=c.label(null,null,null,"callout",null,null,B.useHTML).addClass("highcharts-tooltip-box "+w+(d.isHeader?" highcharts-tooltip-header":"")).attr({padding:B.padding,r:B.borderRadius,fill:B.backgroundColor,stroke:B.borderColor||d.color||v.color||"#333333","stroke-width":B.borderWidth}).add(p));H.isActive=!0;H.attr({text:a});H.css(B.style).shadow(B.shadow);
a=H.getBBox();v=a.width+H.strokeWidth();d.isHeader?(t=a.height,b.xAxis[0].opposite&&(n=!0,z-=t),v=Math.max(0,Math.min(d.plotX+b.plotLeft-v/2,b.chartWidth+(b.scrollablePixels?b.scrollablePixels-b.marginRight:0)-v))):v=d.plotX+b.plotLeft-C(B.distance,16)-v;0>v&&(x=!1);a=(d.series&&d.series.yAxis&&d.series.yAxis.pos)+(d.plotY||0);a-=z;d.isHeader&&(a=n?-t:b.plotHeight+t);m.push({target:a,rank:d.isHeader?1:0,size:h.tt.getBBox().height+1,point:d,x:v,tt:H})}});this.cleanSplit();a.distribute(m,b.plotHeight+
t);F(m,function(a){var c=a.point,d=c.series;a.tt.attr({visibility:void 0===a.pos?"hidden":"inherit",x:x||c.isHeader?a.x:c.plotX+b.plotLeft+C(B.distance,16),y:a.pos+z,anchorX:c.isHeader?c.plotX+b.plotLeft:c.plotX+d.xAxis.pos,anchorY:c.isHeader?b.plotTop+b.plotHeight/2:c.plotY+d.yAxis.pos})})},updatePosition:function(a){var d=this.chart,g=this.getLabel(),m=(this.options.positioner||this.getPosition).call(this,g.width,g.height,a),b=a.plotX+d.plotLeft;a=a.plotY+d.plotTop;var c;this.outside&&(c=(this.options.borderWidth||
0)+2*this.distance,this.renderer.setSize(g.width+c,g.height+c,!1),b+=d.pointer.chartPosition.left-m.x,a+=d.pointer.chartPosition.top-m.y);this.move(Math.round(m.x),Math.round(m.y||0),b,a)},getDateFormat:function(a,e,g,m){var b=this.chart.time,c=b.dateFormat("%m-%d %H:%M:%S.%L",e),d,B,t={millisecond:15,second:12,minute:9,hour:6,day:3},n="millisecond";for(B in p){if(a===p.week&&+b.dateFormat("%w",e)===g&&"00:00:00.000"===c.substr(6)){B="week";break}if(p[B]>a){B=n;break}if(t[B]&&c.substr(t[B])!=="01-01 00:00:00.000".substr(t[B]))break;
"week"!==B&&(n=B)}B&&(d=m[B]);return d},getXDateFormat:function(a,e,g){e=e.dateTimeLabelFormats;var d=g&&g.closestPointRange;return(d?this.getDateFormat(d,a.x,g.options.startOfWeek,e):e.day)||e.year},tooltipFooterHeaderFormatter:function(a,e){e=e?"footer":"header";var d=a.series,m=d.tooltipOptions,b=m.xDateFormat,c=d.xAxis,x=c&&"datetime"===c.options.type&&l(a.key),B=m[e+"Format"];x&&!b&&(b=this.getXDateFormat(a,m,c));x&&b&&F(a.point&&a.point.tooltipDateKeys||["key"],function(a){B=B.replace("{point."+
a+"}","{point."+a+":"+b+"}")});return q(B,{point:a,series:d},this.chart.time)},bodyFormatter:function(a){return f(a,function(a){var d=a.series.tooltipOptions;return(d[(a.point.formatPrefix||"point")+"Formatter"]||a.point.tooltipFormatter).call(a.point,d[(a.point.formatPrefix||"point")+"Format"])})}}})(J);(function(a){var E=a.addEvent,F=a.attr,G=a.charts,q=a.color,l=a.css,f=a.defined,u=a.each,C=a.extend,r=a.find,y=a.fireEvent,p=a.isNumber,d=a.isObject,e=a.offset,g=a.pick,m=a.splat,b=a.Tooltip;a.Pointer=
function(a,b){this.init(a,b)};a.Pointer.prototype={init:function(a,d){this.options=d;this.chart=a;this.runChartClick=d.chart.events&&!!d.chart.events.click;this.pinchDown=[];this.lastValidTouch={};b&&(a.tooltip=new b(a,d.tooltip),this.followTouchMove=g(d.tooltip.followTouchMove,!0));this.setDOMEvents()},zoomOption:function(a){var b=this.chart,c=b.options.chart,d=c.zoomType||"",b=b.inverted;/touch/.test(a.type)&&(d=g(c.pinchType,d));this.zoomX=a=/x/.test(d);this.zoomY=d=/y/.test(d);this.zoomHor=a&&
!b||d&&b;this.zoomVert=d&&!b||a&&b;this.hasZoom=a||d},normalize:function(a,b){var c;c=a.touches?a.touches.length?a.touches.item(0):a.changedTouches[0]:a;b||(this.chartPosition=b=e(this.chart.container));return C(a,{chartX:Math.round(c.pageX-b.left),chartY:Math.round(c.pageY-b.top)})},getCoordinates:function(a){var b={xAxis:[],yAxis:[]};u(this.chart.axes,function(c){b[c.isXAxis?"xAxis":"yAxis"].push({axis:c,value:c.toValue(a[c.horiz?"chartX":"chartY"])})});return b},findNearestKDPoint:function(a,b,
m){var c;u(a,function(a){var n=!(a.noSharedTooltip&&b)&&0>a.options.findNearestPointBy.indexOf("y");a=a.searchPoint(m,n);if((n=d(a,!0))&&!(n=!d(c,!0)))var n=c.distX-a.distX,e=c.dist-a.dist,t=(a.series.group&&a.series.group.zIndex)-(c.series.group&&c.series.group.zIndex),n=0<(0!==n&&b?n:0!==e?e:0!==t?t:c.series.index>a.series.index?-1:1);n&&(c=a)});return c},getPointFromEvent:function(a){a=a.target;for(var b;a&&!b;)b=a.point,a=a.parentNode;return b},getChartCoordinatesFromPoint:function(a,b){var c=
a.series,d=c.xAxis,c=c.yAxis,m=g(a.clientX,a.plotX),e=a.shapeArgs;if(d&&c)return b?{chartX:d.len+d.pos-m,chartY:c.len+c.pos-a.plotY}:{chartX:m+d.pos,chartY:a.plotY+c.pos};if(e&&e.x&&e.y)return{chartX:e.x,chartY:e.y}},getHoverData:function(b,m,e,t,n,p,z){var c,h=[],x=z&&z.isBoosting;t=!(!t||!b);z=m&&!m.stickyTracking?[m]:a.grep(e,function(a){return a.visible&&!(!n&&a.directTouch)&&g(a.options.enableMouseTracking,!0)&&a.stickyTracking});m=(c=t?b:this.findNearestKDPoint(z,n,p))&&c.series;c&&(n&&!m.noSharedTooltip?
(z=a.grep(e,function(a){return a.visible&&!(!n&&a.directTouch)&&g(a.options.enableMouseTracking,!0)&&!a.noSharedTooltip}),u(z,function(a){var b=r(a.points,function(a){return a.x===c.x&&!a.isNull});d(b)&&(x&&(b=a.getPoint(b)),h.push(b))})):h.push(c));return{hoverPoint:c,hoverSeries:m,hoverPoints:h}},runPointActions:function(b,d){var c=this.chart,m=c.tooltip&&c.tooltip.options.enabled?c.tooltip:void 0,n=m?m.shared:!1,e=d||c.hoverPoint,x=e&&e.series||c.hoverSeries,x=this.getHoverData(e,x,c.series,"touchmove"!==
b.type&&(!!d||x&&x.directTouch&&this.isDirectTouch),n,b,{isBoosting:c.isBoosting}),D,e=x.hoverPoint;D=x.hoverPoints;d=(x=x.hoverSeries)&&x.tooltipOptions.followPointer;n=n&&x&&!x.noSharedTooltip;if(e&&(e!==c.hoverPoint||m&&m.isHidden)){u(c.hoverPoints||[],function(b){-1===a.inArray(b,D)&&b.setState()});u(D||[],function(a){a.setState("hover")});if(c.hoverSeries!==x)x.onMouseOver();c.hoverPoint&&c.hoverPoint.firePointEvent("mouseOut");if(!e.series)return;e.firePointEvent("mouseOver");c.hoverPoints=
D;c.hoverPoint=e;m&&m.refresh(n?D:e,b)}else d&&m&&!m.isHidden&&(e=m.getAnchor([{}],b),m.updatePosition({plotX:e[0],plotY:e[1]}));this.unDocMouseMove||(this.unDocMouseMove=E(c.container.ownerDocument,"mousemove",function(b){var c=G[a.hoverChartIndex];if(c)c.pointer.onDocumentMouseMove(b)}));u(c.axes,function(c){var d=g(c.crosshair.snap,!0),h=d?a.find(D,function(a){return a.series[c.coll]===c}):void 0;h||!d?c.drawCrosshair(b,h):c.hideCrosshair()})},reset:function(a,b){var c=this.chart,d=c.hoverSeries,
n=c.hoverPoint,e=c.hoverPoints,g=c.tooltip,x=g&&g.shared?e:n;a&&x&&u(m(x),function(b){b.series.isCartesian&&void 0===b.plotX&&(a=!1)});if(a)g&&x&&(g.refresh(x),g.shared&&e?u(e,function(a){a.setState(a.state,!0);a.series.xAxis.crosshair&&a.series.xAxis.drawCrosshair(null,a);a.series.yAxis.crosshair&&a.series.yAxis.drawCrosshair(null,a)}):n&&(n.setState(n.state,!0),u(c.axes,function(a){a.crosshair&&a.drawCrosshair(null,n)})));else{if(n)n.onMouseOut();e&&u(e,function(a){a.setState()});if(d)d.onMouseOut();
g&&g.hide(b);this.unDocMouseMove&&(this.unDocMouseMove=this.unDocMouseMove());u(c.axes,function(a){a.hideCrosshair()});this.hoverX=c.hoverPoints=c.hoverPoint=null}},scaleGroups:function(a,b){var c=this.chart,d;u(c.series,function(m){d=a||m.getPlotBox();m.xAxis&&m.xAxis.zoomEnabled&&m.group&&(m.group.attr(d),m.markerGroup&&(m.markerGroup.attr(d),m.markerGroup.clip(b?c.clipRect:null)),m.dataLabelsGroup&&m.dataLabelsGroup.attr(d))});c.clipRect.attr(b||c.clipBox)},dragStart:function(a){var b=this.chart;
b.mouseIsDown=a.type;b.cancelClick=!1;b.mouseDownX=this.mouseDownX=a.chartX;b.mouseDownY=this.mouseDownY=a.chartY},drag:function(a){var b=this.chart,c=b.options.chart,d=a.chartX,m=a.chartY,e=this.zoomHor,g=this.zoomVert,D=b.plotLeft,h=b.plotTop,p=b.plotWidth,H=b.plotHeight,v,w=this.selectionMarker,k=this.mouseDownX,A=this.mouseDownY,f=c.panKey&&a[c.panKey+"Key"];w&&w.touch||(d<D?d=D:d>D+p&&(d=D+p),m<h?m=h:m>h+H&&(m=h+H),this.hasDragged=Math.sqrt(Math.pow(k-d,2)+Math.pow(A-m,2)),10<this.hasDragged&&
(v=b.isInsidePlot(k-D,A-h),b.hasCartesianSeries&&(this.zoomX||this.zoomY)&&v&&!f&&!w&&(this.selectionMarker=w=b.renderer.rect(D,h,e?1:p,g?1:H,0).attr({fill:c.selectionMarkerFill||q("#335cad").setOpacity(.25).get(),"class":"highcharts-selection-marker",zIndex:7}).add()),w&&e&&(d-=k,w.attr({width:Math.abs(d),x:(0<d?0:d)+k})),w&&g&&(d=m-A,w.attr({height:Math.abs(d),y:(0<d?0:d)+A})),v&&!w&&c.panning&&b.pan(a,c.panning)))},drop:function(a){var b=this,c=this.chart,d=this.hasPinched;if(this.selectionMarker){var m=
{originalEvent:a,xAxis:[],yAxis:[]},e=this.selectionMarker,g=e.attr?e.attr("x"):e.x,D=e.attr?e.attr("y"):e.y,h=e.attr?e.attr("width"):e.width,I=e.attr?e.attr("height"):e.height,H;if(this.hasDragged||d)u(c.axes,function(c){if(c.zoomEnabled&&f(c.min)&&(d||b[{xAxis:"zoomX",yAxis:"zoomY"}[c.coll]])){var v=c.horiz,k="touchend"===a.type?c.minPixelPadding:0,e=c.toValue((v?g:D)+k),v=c.toValue((v?g+h:D+I)-k);m[c.coll].push({axis:c,min:Math.min(e,v),max:Math.max(e,v)});H=!0}}),H&&y(c,"selection",m,function(a){c.zoom(C(a,
d?{animation:!1}:null))});p(c.index)&&(this.selectionMarker=this.selectionMarker.destroy());d&&this.scaleGroups()}c&&p(c.index)&&(l(c.container,{cursor:c._cursor}),c.cancelClick=10<this.hasDragged,c.mouseIsDown=this.hasDragged=this.hasPinched=!1,this.pinchDown=[])},onContainerMouseDown:function(a){a=this.normalize(a);2!==a.button&&(this.zoomOption(a),a.preventDefault&&a.preventDefault(),this.dragStart(a))},onDocumentMouseUp:function(b){G[a.hoverChartIndex]&&G[a.hoverChartIndex].pointer.drop(b)},onDocumentMouseMove:function(a){var b=
this.chart,c=this.chartPosition;a=this.normalize(a,c);!c||this.inClass(a.target,"highcharts-tracker")||b.isInsidePlot(a.chartX-b.plotLeft,a.chartY-b.plotTop)||this.reset()},onContainerMouseLeave:function(b){var c=G[a.hoverChartIndex];c&&(b.relatedTarget||b.toElement)&&(c.pointer.reset(),c.pointer.chartPosition=null)},onContainerMouseMove:function(b){var c=this.chart;f(a.hoverChartIndex)&&G[a.hoverChartIndex]&&G[a.hoverChartIndex].mouseIsDown||(a.hoverChartIndex=c.index);b=this.normalize(b);b.returnValue=
!1;"mousedown"===c.mouseIsDown&&this.drag(b);!this.inClass(b.target,"highcharts-tracker")&&!c.isInsidePlot(b.chartX-c.plotLeft,b.chartY-c.plotTop)||c.openMenu||this.runPointActions(b)},inClass:function(a,b){for(var c;a;){if(c=F(a,"class")){if(-1!==c.indexOf(b))return!0;if(-1!==c.indexOf("highcharts-container"))return!1}a=a.parentNode}},onTrackerMouseOut:function(a){var b=this.chart.hoverSeries;a=a.relatedTarget||a.toElement;this.isDirectTouch=!1;if(!(!b||!a||b.stickyTracking||this.inClass(a,"highcharts-tooltip")||
this.inClass(a,"highcharts-series-"+b.index)&&this.inClass(a,"highcharts-tracker")))b.onMouseOut()},onContainerClick:function(a){var b=this.chart,c=b.hoverPoint,d=b.plotLeft,m=b.plotTop;a=this.normalize(a);b.cancelClick||(c&&this.inClass(a.target,"highcharts-tracker")?(y(c.series,"click",C(a,{point:c})),b.hoverPoint&&c.firePointEvent("click",a)):(C(a,this.getCoordinates(a)),b.isInsidePlot(a.chartX-d,a.chartY-m)&&y(b,"click",a)))},setDOMEvents:function(){var b=this,d=b.chart.container,m=d.ownerDocument;
d.onmousedown=function(a){b.onContainerMouseDown(a)};d.onmousemove=function(a){b.onContainerMouseMove(a)};d.onclick=function(a){b.onContainerClick(a)};this.unbindContainerMouseLeave=E(d,"mouseleave",b.onContainerMouseLeave);a.unbindDocumentMouseUp||(a.unbindDocumentMouseUp=E(m,"mouseup",b.onDocumentMouseUp));a.hasTouch&&(d.ontouchstart=function(a){b.onContainerTouchStart(a)},d.ontouchmove=function(a){b.onContainerTouchMove(a)},a.unbindDocumentTouchEnd||(a.unbindDocumentTouchEnd=E(m,"touchend",b.onDocumentTouchEnd)))},
destroy:function(){var b=this;b.unDocMouseMove&&b.unDocMouseMove();this.unbindContainerMouseLeave();a.chartCount||(a.unbindDocumentMouseUp&&(a.unbindDocumentMouseUp=a.unbindDocumentMouseUp()),a.unbindDocumentTouchEnd&&(a.unbindDocumentTouchEnd=a.unbindDocumentTouchEnd()));clearInterval(b.tooltipTimeout);a.objectEach(b,function(a,c){b[c]=null})}}})(J);(function(a){var E=a.charts,F=a.each,G=a.extend,q=a.map,l=a.noop,f=a.pick;G(a.Pointer.prototype,{pinchTranslate:function(a,f,l,q,p,d){this.zoomHor&&
this.pinchTranslateDirection(!0,a,f,l,q,p,d);this.zoomVert&&this.pinchTranslateDirection(!1,a,f,l,q,p,d)},pinchTranslateDirection:function(a,f,l,q,p,d,e,g){var m=this.chart,b=a?"x":"y",c=a?"X":"Y",x="chart"+c,B=a?"width":"height",t=m["plot"+(a?"Left":"Top")],n,r,z=g||1,D=m.inverted,h=m.bounds[a?"h":"v"],I=1===f.length,H=f[0][x],v=l[0][x],w=!I&&f[1][x],k=!I&&l[1][x],A;l=function(){!I&&20<Math.abs(H-w)&&(z=g||Math.abs(v-k)/Math.abs(H-w));r=(t-v)/z+H;n=m["plot"+(a?"Width":"Height")]/z};l();f=r;f<h.min?
(f=h.min,A=!0):f+n>h.max&&(f=h.max-n,A=!0);A?(v-=.8*(v-e[b][0]),I||(k-=.8*(k-e[b][1])),l()):e[b]=[v,k];D||(d[b]=r-t,d[B]=n);d=D?1/z:z;p[B]=n;p[b]=f;q[D?a?"scaleY":"scaleX":"scale"+c]=z;q["translate"+c]=d*t+(v-d*H)},pinch:function(a){var u=this,r=u.chart,y=u.pinchDown,p=a.touches,d=p.length,e=u.lastValidTouch,g=u.hasZoom,m=u.selectionMarker,b={},c=1===d&&(u.inClass(a.target,"highcharts-tracker")&&r.runTrackerClick||u.runChartClick),x={};1<d&&(u.initiated=!0);g&&u.initiated&&!c&&a.preventDefault();
q(p,function(a){return u.normalize(a)});"touchstart"===a.type?(F(p,function(a,b){y[b]={chartX:a.chartX,chartY:a.chartY}}),e.x=[y[0].chartX,y[1]&&y[1].chartX],e.y=[y[0].chartY,y[1]&&y[1].chartY],F(r.axes,function(a){if(a.zoomEnabled){var b=r.bounds[a.horiz?"h":"v"],c=a.minPixelPadding,d=a.toPixels(f(a.options.min,a.dataMin)),m=a.toPixels(f(a.options.max,a.dataMax)),e=Math.max(d,m);b.min=Math.min(a.pos,Math.min(d,m)-c);b.max=Math.max(a.pos+a.len,e+c)}}),u.res=!0):u.followTouchMove&&1===d?this.runPointActions(u.normalize(a)):
y.length&&(m||(u.selectionMarker=m=G({destroy:l,touch:!0},r.plotBox)),u.pinchTranslate(y,p,b,m,x,e),u.hasPinched=g,u.scaleGroups(b,x),u.res&&(u.res=!1,this.reset(!1,0)))},touch:function(l,q){var r=this.chart,u,p;if(r.index!==a.hoverChartIndex)this.onContainerMouseLeave({relatedTarget:!0});a.hoverChartIndex=r.index;1===l.touches.length?(l=this.normalize(l),(p=r.isInsidePlot(l.chartX-r.plotLeft,l.chartY-r.plotTop))&&!r.openMenu?(q&&this.runPointActions(l),"touchmove"===l.type&&(q=this.pinchDown,u=q[0]?
4<=Math.sqrt(Math.pow(q[0].chartX-l.chartX,2)+Math.pow(q[0].chartY-l.chartY,2)):!1),f(u,!0)&&this.pinch(l)):q&&this.reset()):2===l.touches.length&&this.pinch(l)},onContainerTouchStart:function(a){this.zoomOption(a);this.touch(a,!0)},onContainerTouchMove:function(a){this.touch(a)},onDocumentTouchEnd:function(f){E[a.hoverChartIndex]&&E[a.hoverChartIndex].pointer.drop(f)}})})(J);(function(a){var E=a.addEvent,F=a.charts,G=a.css,q=a.doc,l=a.extend,f=a.noop,u=a.Pointer,C=a.removeEvent,r=a.win,y=a.wrap;
if(!a.hasTouch&&(r.PointerEvent||r.MSPointerEvent)){var p={},d=!!r.PointerEvent,e=function(){var d=[];d.item=function(a){return this[a]};a.objectEach(p,function(a){d.push({pageX:a.pageX,pageY:a.pageY,target:a.target})});return d},g=function(d,b,c,g){"touch"!==d.pointerType&&d.pointerType!==d.MSPOINTER_TYPE_TOUCH||!F[a.hoverChartIndex]||(g(d),g=F[a.hoverChartIndex].pointer,g[b]({type:c,target:d.currentTarget,preventDefault:f,touches:e()}))};l(u.prototype,{onContainerPointerDown:function(a){g(a,"onContainerTouchStart",
"touchstart",function(a){p[a.pointerId]={pageX:a.pageX,pageY:a.pageY,target:a.currentTarget}})},onContainerPointerMove:function(a){g(a,"onContainerTouchMove","touchmove",function(a){p[a.pointerId]={pageX:a.pageX,pageY:a.pageY};p[a.pointerId].target||(p[a.pointerId].target=a.currentTarget)})},onDocumentPointerUp:function(a){g(a,"onDocumentTouchEnd","touchend",function(a){delete p[a.pointerId]})},batchMSEvents:function(a){a(this.chart.container,d?"pointerdown":"MSPointerDown",this.onContainerPointerDown);
a(this.chart.container,d?"pointermove":"MSPointerMove",this.onContainerPointerMove);a(q,d?"pointerup":"MSPointerUp",this.onDocumentPointerUp)}});y(u.prototype,"init",function(a,b,c){a.call(this,b,c);this.hasZoom&&G(b.container,{"-ms-touch-action":"none","touch-action":"none"})});y(u.prototype,"setDOMEvents",function(a){a.apply(this);(this.hasZoom||this.followTouchMove)&&this.batchMSEvents(E)});y(u.prototype,"destroy",function(a){this.batchMSEvents(C);a.call(this)})}})(J);(function(a){var E=a.addEvent,
F=a.css,G=a.discardElement,q=a.defined,l=a.each,f=a.fireEvent,u=a.isFirefox,C=a.marginNames,r=a.merge,y=a.pick,p=a.setAnimation,d=a.stableSort,e=a.win,g=a.wrap;a.Legend=function(a,b){this.init(a,b)};a.Legend.prototype={init:function(a,b){this.chart=a;this.setOptions(b);b.enabled&&(this.render(),E(this.chart,"endResize",function(){this.legend.positionCheckboxes()}),this.proximate?this.unchartrender=E(this.chart,"render",function(){this.legend.proximatePositions();this.legend.positionItems()}):this.unchartrender&&
this.unchartrender())},setOptions:function(a){var b=y(a.padding,8);this.options=a;this.itemStyle=a.itemStyle;this.itemHiddenStyle=r(this.itemStyle,a.itemHiddenStyle);this.itemMarginTop=a.itemMarginTop||0;this.padding=b;this.initialItemY=b-5;this.symbolWidth=y(a.symbolWidth,16);this.pages=[];this.proximate="proximate"===a.layout&&!this.chart.inverted},update:function(a,b){var c=this.chart;this.setOptions(r(!0,this.options,a));this.destroy();c.isDirtyLegend=c.isDirtyBox=!0;y(b,!0)&&c.redraw();f(this,
"afterUpdate")},colorizeItem:function(a,b){a.legendGroup[b?"removeClass":"addClass"]("highcharts-legend-item-hidden");var c=this.options,d=a.legendItem,m=a.legendLine,e=a.legendSymbol,n=this.itemHiddenStyle.color,c=b?c.itemStyle.color:n,g=b?a.color||n:n,z=a.options&&a.options.marker,p={fill:g};d&&d.css({fill:c,color:c});m&&m.attr({stroke:g});e&&(z&&e.isMarker&&(p=a.pointAttribs(),b||(p.stroke=p.fill=n)),e.attr(p));f(this,"afterColorizeItem",{item:a,visible:b})},positionItems:function(){l(this.allItems,
this.positionItem,this);this.chart.isResizing||this.positionCheckboxes()},positionItem:function(a){var b=this.options,c=b.symbolPadding,b=!b.rtl,d=a._legendItemPos,m=d[0],d=d[1],e=a.checkbox;if((a=a.legendGroup)&&a.element)a[q(a.translateY)?"animate":"attr"]({translateX:b?m:this.legendWidth-m-2*c-4,translateY:d});e&&(e.x=m,e.y=d)},destroyItem:function(a){var b=a.checkbox;l(["legendItem","legendLine","legendSymbol","legendGroup"],function(b){a[b]&&(a[b]=a[b].destroy())});b&&G(a.checkbox)},destroy:function(){function a(a){this[a]&&
(this[a]=this[a].destroy())}l(this.getAllItems(),function(b){l(["legendItem","legendGroup"],a,b)});l("clipRect up down pager nav box title group".split(" "),a,this);this.display=null},positionCheckboxes:function(){var a=this.group&&this.group.alignAttr,b,c=this.clipHeight||this.legendHeight,d=this.titleHeight;a&&(b=a.translateY,l(this.allItems,function(e){var m=e.checkbox,n;m&&(n=b+d+m.y+(this.scrollOffset||0)+3,F(m,{left:a.translateX+e.checkboxOffset+m.x-20+"px",top:n+"px",display:n>b-6&&n<b+c-6?
"":"none"}))},this))},renderTitle:function(){var a=this.options,b=this.padding,c=a.title,d=0;c.text&&(this.title||(this.title=this.chart.renderer.label(c.text,b-3,b-4,null,null,null,a.useHTML,null,"legend-title").attr({zIndex:1}).css(c.style).add(this.group)),a=this.title.getBBox(),d=a.height,this.offsetWidth=a.width,this.contentGroup.attr({translateY:d}));this.titleHeight=d},setText:function(d){var b=this.options;d.legendItem.attr({text:b.labelFormat?a.format(b.labelFormat,d,this.chart.time):b.labelFormatter.call(d)})},
renderItem:function(a){var b=this.chart,c=b.renderer,d=this.options,e=this.symbolWidth,m=d.symbolPadding,n=this.itemStyle,g=this.itemHiddenStyle,z="horizontal"===d.layout?y(d.itemDistance,20):0,p=!d.rtl,h=a.legendItem,f=!a.series,H=!f&&a.series.drawLegendSymbol?a.series:a,v=H.options,v=this.createCheckboxForItem&&v&&v.showCheckbox,z=e+m+z+(v?20:0),w=d.useHTML,k=a.options.className;h||(a.legendGroup=c.g("legend-item").addClass("highcharts-"+H.type+"-series highcharts-color-"+a.colorIndex+(k?" "+k:
"")+(f?" highcharts-series-"+a.index:"")).attr({zIndex:1}).add(this.scrollGroup),a.legendItem=h=c.text("",p?e+m:-m,this.baseline||0,w).css(r(a.visible?n:g)).attr({align:p?"left":"right",zIndex:2}).add(a.legendGroup),this.baseline||(e=n.fontSize,this.fontMetrics=c.fontMetrics(e,h),this.baseline=this.fontMetrics.f+3+this.itemMarginTop,h.attr("y",this.baseline)),this.symbolHeight=d.symbolHeight||this.fontMetrics.f,H.drawLegendSymbol(this,a),this.setItemEvents&&this.setItemEvents(a,h,w),v&&this.createCheckboxForItem(a));
this.colorizeItem(a,a.visible);n.width||h.css({width:(d.itemWidth||d.width||b.spacingBox.width)-z});this.setText(a);b=h.getBBox();a.itemWidth=a.checkboxOffset=d.itemWidth||a.legendItemWidth||b.width+z;this.maxItemWidth=Math.max(this.maxItemWidth,a.itemWidth);this.totalItemWidth+=a.itemWidth;this.itemHeight=a.itemHeight=Math.round(a.legendItemHeight||b.height||this.symbolHeight)},layoutItem:function(a){var b=this.options,c=this.padding,d="horizontal"===b.layout,e=a.itemHeight,m=b.itemMarginBottom||
0,n=this.itemMarginTop,g=d?y(b.itemDistance,20):0,z=b.width,p=z||this.chart.spacingBox.width-2*c-b.x,b=b.alignColumns&&this.totalItemWidth>p?this.maxItemWidth:a.itemWidth;d&&this.itemX-c+b>p&&(this.itemX=c,this.itemY+=n+this.lastLineHeight+m,this.lastLineHeight=0);this.lastItemY=n+this.itemY+m;this.lastLineHeight=Math.max(e,this.lastLineHeight);a._legendItemPos=[this.itemX,this.itemY];d?this.itemX+=b:(this.itemY+=n+e+m,this.lastLineHeight=e);this.offsetWidth=z||Math.max((d?this.itemX-c-(a.checkbox?
0:g):b)+c,this.offsetWidth)},getAllItems:function(){var a=[];l(this.chart.series,function(b){var c=b&&b.options;b&&y(c.showInLegend,q(c.linkedTo)?!1:void 0,!0)&&(a=a.concat(b.legendItems||("point"===c.legendType?b.data:b)))});f(this,"afterGetAllItems",{allItems:a});return a},getAlignment:function(){var a=this.options;return this.proximate?a.align.charAt(0)+"tv":a.floating?"":a.align.charAt(0)+a.verticalAlign.charAt(0)+a.layout.charAt(0)},adjustMargins:function(a,b){var c=this.chart,d=this.options,
e=this.getAlignment();e&&l([/(lth|ct|rth)/,/(rtv|rm|rbv)/,/(rbh|cb|lbh)/,/(lbv|lm|ltv)/],function(m,n){m.test(e)&&!q(a[n])&&(c[C[n]]=Math.max(c[C[n]],c.legend[(n+1)%2?"legendHeight":"legendWidth"]+[1,-1,-1,1][n]*d[n%2?"x":"y"]+y(d.margin,12)+b[n]+(0===n&&void 0!==c.options.title.margin?c.titleOffset+c.options.title.margin:0)))})},proximatePositions:function(){var d=this.chart,b=[],c="left"===this.options.align;l(this.allItems,function(e){var m,g;m=c;e.xAxis&&e.points&&(e.xAxis.options.reversed&&(m=
!m),m=a.find(m?e.points:e.points.slice(0).reverse(),function(b){return a.isNumber(b.plotY)}),g=e.legendGroup.getBBox().height,b.push({target:e.visible?(m?m.plotY:e.xAxis.height)-.3*g:d.plotHeight,size:g,item:e}))},this);a.distribute(b,d.plotHeight);l(b,function(a){a.item._legendItemPos[1]=d.plotTop-d.spacing[0]+a.pos})},render:function(){var a=this.chart,b=a.renderer,c=this.group,e,g,t,n=this.box,p=this.options,z=this.padding;this.itemX=z;this.itemY=this.initialItemY;this.lastItemY=this.offsetWidth=
0;c||(this.group=c=b.g("legend").attr({zIndex:7}).add(),this.contentGroup=b.g().attr({zIndex:1}).add(c),this.scrollGroup=b.g().add(this.contentGroup));this.renderTitle();e=this.getAllItems();d(e,function(a,b){return(a.options&&a.options.legendIndex||0)-(b.options&&b.options.legendIndex||0)});p.reversed&&e.reverse();this.allItems=e;this.display=g=!!e.length;this.itemHeight=this.totalItemWidth=this.maxItemWidth=this.lastLineHeight=0;l(e,this.renderItem,this);l(e,this.layoutItem,this);e=(p.width||this.offsetWidth)+
z;t=this.lastItemY+this.lastLineHeight+this.titleHeight;t=this.handleOverflow(t);t+=z;n||(this.box=n=b.rect().addClass("highcharts-legend-box").attr({r:p.borderRadius}).add(c),n.isNew=!0);n.attr({stroke:p.borderColor,"stroke-width":p.borderWidth||0,fill:p.backgroundColor||"none"}).shadow(p.shadow);0<e&&0<t&&(n[n.isNew?"attr":"animate"](n.crisp.call({},{x:0,y:0,width:e,height:t},n.strokeWidth())),n.isNew=!1);n[g?"show":"hide"]();this.legendWidth=e;this.legendHeight=t;g&&(b=a.spacingBox,/(lth|ct|rth)/.test(this.getAlignment())&&
(b=r(b,{y:b.y+a.titleOffset+a.options.title.margin})),c.align(r(p,{width:e,height:t,verticalAlign:this.proximate?"top":p.verticalAlign}),!0,b));this.proximate||this.positionItems()},handleOverflow:function(a){var b=this,c=this.chart,d=c.renderer,e=this.options,m=e.y,n=this.padding,c=c.spacingBox.height+("top"===e.verticalAlign?-m:m)-n,m=e.maxHeight,g,p=this.clipRect,f=e.navigation,h=y(f.animation,!0),I=f.arrowSize||12,H=this.nav,v=this.pages,w,k=this.allItems,A=function(a){"number"===typeof a?p.attr({height:a}):
p&&(b.clipRect=p.destroy(),b.contentGroup.clip());b.contentGroup.div&&(b.contentGroup.div.style.clip=a?"rect("+n+"px,9999px,"+(n+a)+"px,0)":"auto")};"horizontal"!==e.layout||"middle"===e.verticalAlign||e.floating||(c/=2);m&&(c=Math.min(c,m));v.length=0;a>c&&!1!==f.enabled?(this.clipHeight=g=Math.max(c-20-this.titleHeight-n,0),this.currentPage=y(this.currentPage,1),this.fullHeight=a,l(k,function(a,b){var c=a._legendItemPos[1],d=Math.round(a.legendItem.getBBox().height),h=v.length;if(!h||c-v[h-1]>g&&
(w||c)!==v[h-1])v.push(w||c),h++;a.pageIx=h-1;w&&(k[b-1].pageIx=h-1);b===k.length-1&&c+d-v[h-1]>g&&(v.push(c),a.pageIx=h);c!==w&&(w=c)}),p||(p=b.clipRect=d.clipRect(0,n,9999,0),b.contentGroup.clip(p)),A(g),H||(this.nav=H=d.g().attr({zIndex:1}).add(this.group),this.up=d.symbol("triangle",0,0,I,I).on("click",function(){b.scroll(-1,h)}).add(H),this.pager=d.text("",15,10).addClass("highcharts-legend-navigation").css(f.style).add(H),this.down=d.symbol("triangle-down",0,0,I,I).on("click",function(){b.scroll(1,
h)}).add(H)),b.scroll(0),a=c):H&&(A(),this.nav=H.destroy(),this.scrollGroup.attr({translateY:1}),this.clipHeight=0);return a},scroll:function(a,b){var c=this.pages,d=c.length;a=this.currentPage+a;var e=this.clipHeight,m=this.options.navigation,n=this.pager,g=this.padding;a>d&&(a=d);0<a&&(void 0!==b&&p(b,this.chart),this.nav.attr({translateX:g,translateY:e+this.padding+7+this.titleHeight,visibility:"visible"}),this.up.attr({"class":1===a?"highcharts-legend-nav-inactive":"highcharts-legend-nav-active"}),
n.attr({text:a+"/"+d}),this.down.attr({x:18+this.pager.getBBox().width,"class":a===d?"highcharts-legend-nav-inactive":"highcharts-legend-nav-active"}),this.up.attr({fill:1===a?m.inactiveColor:m.activeColor}).css({cursor:1===a?"default":"pointer"}),this.down.attr({fill:a===d?m.inactiveColor:m.activeColor}).css({cursor:a===d?"default":"pointer"}),this.scrollOffset=-c[a-1]+this.initialItemY,this.scrollGroup.animate({translateY:this.scrollOffset}),this.currentPage=a,this.positionCheckboxes())}};a.LegendSymbolMixin=
{drawRectangle:function(a,b){var c=a.symbolHeight,d=a.options.squareSymbol;b.legendSymbol=this.chart.renderer.rect(d?(a.symbolWidth-c)/2:0,a.baseline-c+1,d?c:a.symbolWidth,c,y(a.options.symbolRadius,c/2)).addClass("highcharts-point").attr({zIndex:3}).add(b.legendGroup)},drawLineMarker:function(a){var b=this.options,c=b.marker,d=a.symbolWidth,e=a.symbolHeight,g=e/2,n=this.chart.renderer,m=this.legendGroup;a=a.baseline-Math.round(.3*a.fontMetrics.b);var p;p={"stroke-width":b.lineWidth||0};b.dashStyle&&
(p.dashstyle=b.dashStyle);this.legendLine=n.path(["M",0,a,"L",d,a]).addClass("highcharts-graph").attr(p).add(m);c&&!1!==c.enabled&&d&&(b=Math.min(y(c.radius,g),g),0===this.symbol.indexOf("url")&&(c=r(c,{width:e,height:e}),b=0),this.legendSymbol=c=n.symbol(this.symbol,d/2-b,a-b,2*b,2*b,c).addClass("highcharts-point").add(m),c.isMarker=!0)}};(/Trident\/7\.0/.test(e.navigator.userAgent)||u)&&g(a.Legend.prototype,"positionItem",function(a,b){var c=this,d=function(){b._legendItemPos&&a.call(c,b)};d();
setTimeout(d)})})(J);(function(a){var E=a.addEvent,F=a.animate,G=a.animObject,q=a.attr,l=a.doc,f=a.Axis,u=a.createElement,C=a.defaultOptions,r=a.discardElement,y=a.charts,p=a.css,d=a.defined,e=a.each,g=a.extend,m=a.find,b=a.fireEvent,c=a.grep,x=a.isNumber,B=a.isObject,t=a.isString,n=a.Legend,L=a.marginNames,z=a.merge,D=a.objectEach,h=a.Pointer,I=a.pick,H=a.pInt,v=a.removeEvent,w=a.seriesTypes,k=a.splat,A=a.syncTimeout,Q=a.win,T=a.Chart=function(){this.getArgs.apply(this,arguments)};a.chart=function(a,
b,c){return new T(a,b,c)};g(T.prototype,{callbacks:[],getArgs:function(){var a=[].slice.call(arguments);if(t(a[0])||a[0].nodeName)this.renderTo=a.shift();this.init(a[0],a[1])},init:function(c,d){var h,k,v=c.series,e=c.plotOptions||{};b(this,"init",{args:arguments},function(){c.series=null;h=z(C,c);for(k in h.plotOptions)h.plotOptions[k].tooltip=e[k]&&z(e[k].tooltip)||void 0;h.tooltip.userOptions=c.chart&&c.chart.forExport&&c.tooltip.userOptions||c.tooltip;h.series=c.series=v;this.userOptions=c;var w=
h.chart,n=w.events;this.margin=[];this.spacing=[];this.bounds={h:{},v:{}};this.labelCollectors=[];this.callback=d;this.isResizing=0;this.options=h;this.axes=[];this.series=[];this.time=c.time&&a.keys(c.time).length?new a.Time(c.time):a.time;this.hasCartesianSeries=w.showAxes;var g=this;g.index=y.length;y.push(g);a.chartCount++;n&&D(n,function(a,b){E(g,b,a)});g.xAxis=[];g.yAxis=[];g.pointCount=g.colorCounter=g.symbolCounter=0;b(g,"afterInit");g.firstRender()})},initSeries:function(b){var c=this.options.chart;
(c=w[b.type||c.type||c.defaultSeriesType])||a.error(17,!0);c=new c;c.init(this,b);return c},orderSeries:function(a){var b=this.series;for(a=a||0;a<b.length;a++)b[a]&&(b[a].index=a,b[a].name=b[a].getName())},isInsidePlot:function(a,b,c){var d=c?b:a;a=c?a:b;return 0<=d&&d<=this.plotWidth&&0<=a&&a<=this.plotHeight},redraw:function(c){b(this,"beforeRedraw");var d=this.axes,h=this.series,k=this.pointer,v=this.legend,w=this.userOptions.legend,n=this.isDirtyLegend,m,p,A=this.hasCartesianSeries,H=this.isDirtyBox,
z,t=this.renderer,f=t.isHidden(),D=[];this.setResponsive&&this.setResponsive(!1);a.setAnimation(c,this);f&&this.temporaryDisplay();this.layOutTitles();for(c=h.length;c--;)if(z=h[c],z.options.stacking&&(m=!0,z.isDirty)){p=!0;break}if(p)for(c=h.length;c--;)z=h[c],z.options.stacking&&(z.isDirty=!0);e(h,function(a){a.isDirty&&("point"===a.options.legendType?(a.updateTotals&&a.updateTotals(),n=!0):w&&(w.labelFormatter||w.labelFormat)&&(n=!0));a.isDirtyData&&b(a,"updatedData")});n&&v&&v.options.enabled&&
(v.render(),this.isDirtyLegend=!1);m&&this.getStacks();A&&e(d,function(a){a.updateNames();a.setScale()});this.getMargins();A&&(e(d,function(a){a.isDirty&&(H=!0)}),e(d,function(a){var c=a.min+","+a.max;a.extKey!==c&&(a.extKey=c,D.push(function(){b(a,"afterSetExtremes",g(a.eventArgs,a.getExtremes()));delete a.eventArgs}));(H||m)&&a.redraw()}));H&&this.drawChartBox();b(this,"predraw");e(h,function(a){(H||a.isDirty)&&a.visible&&a.redraw();a.isDirtyData=!1});k&&k.reset(!0);t.draw();b(this,"redraw");b(this,
"render");f&&this.temporaryDisplay(!0);e(D,function(a){a.call()})},get:function(a){function b(b){return b.id===a||b.options&&b.options.id===a}var c,d=this.series,h;c=m(this.axes,b)||m(this.series,b);for(h=0;!c&&h<d.length;h++)c=m(d[h].points||[],b);return c},getAxes:function(){var a=this,c=this.options,d=c.xAxis=k(c.xAxis||{}),c=c.yAxis=k(c.yAxis||{});b(this,"getAxes");e(d,function(a,b){a.index=b;a.isX=!0});e(c,function(a,b){a.index=b});d=d.concat(c);e(d,function(b){new f(a,b)});b(this,"afterGetAxes")},
getSelectedPoints:function(){var a=[];e(this.series,function(b){a=a.concat(c(b.data||[],function(a){return a.selected}))});return a},getSelectedSeries:function(){return c(this.series,function(a){return a.selected})},setTitle:function(a,b,c){var d=this,h=d.options,k;k=h.title=z({style:{color:"#333333",fontSize:h.isStock?"16px":"18px"}},h.title,a);h=h.subtitle=z({style:{color:"#666666"}},h.subtitle,b);e([["title",a,k],["subtitle",b,h]],function(a,b){var c=a[0],h=d[c],k=a[1];a=a[2];h&&k&&(d[c]=h=h.destroy());
a&&!h&&(d[c]=d.renderer.text(a.text,0,0,a.useHTML).attr({align:a.align,"class":"highcharts-"+c,zIndex:a.zIndex||4}).add(),d[c].update=function(a){d.setTitle(!b&&a,b&&a)},d[c].css(a.style))});d.layOutTitles(c)},layOutTitles:function(a){var b=0,c,d=this.renderer,h=this.spacingBox;e(["title","subtitle"],function(a){var c=this[a],k=this.options[a];a="title"===a?-3:k.verticalAlign?0:b+2;var v;c&&(v=k.style.fontSize,v=d.fontMetrics(v,c).b,c.css({width:(k.width||h.width+k.widthAdjust)+"px"}).align(g({y:a+
v},k),!1,"spacingBox"),k.floating||k.verticalAlign||(b=Math.ceil(b+c.getBBox(k.useHTML).height)))},this);c=this.titleOffset!==b;this.titleOffset=b;!this.isDirtyBox&&c&&(this.isDirtyBox=this.isDirtyLegend=c,this.hasRendered&&I(a,!0)&&this.isDirtyBox&&this.redraw())},getChartSize:function(){var b=this.options.chart,c=b.width,b=b.height,h=this.renderTo;d(c)||(this.containerWidth=a.getStyle(h,"width"));d(b)||(this.containerHeight=a.getStyle(h,"height"));this.chartWidth=Math.max(0,c||this.containerWidth||
600);this.chartHeight=Math.max(0,a.relativeLength(b,this.chartWidth)||(1<this.containerHeight?this.containerHeight:400))},temporaryDisplay:function(b){var c=this.renderTo;if(b)for(;c&&c.style;)c.hcOrigStyle&&(a.css(c,c.hcOrigStyle),delete c.hcOrigStyle),c.hcOrigDetached&&(l.body.removeChild(c),c.hcOrigDetached=!1),c=c.parentNode;else for(;c&&c.style;){l.body.contains(c)||c.parentNode||(c.hcOrigDetached=!0,l.body.appendChild(c));if("none"===a.getStyle(c,"display",!1)||c.hcOricDetached)c.hcOrigStyle=
{display:c.style.display,height:c.style.height,overflow:c.style.overflow},b={display:"block",overflow:"hidden"},c!==this.renderTo&&(b.height=0),a.css(c,b),c.offsetWidth||c.style.setProperty("display","block","important");c=c.parentNode;if(c===l.body)break}},setClassName:function(a){this.container.className="highcharts-container "+(a||"")},getContainer:function(){var c,d=this.options,h=d.chart,k,v;c=this.renderTo;var e=a.uniqueKey(),w;c||(this.renderTo=c=h.renderTo);t(c)&&(this.renderTo=c=l.getElementById(c));
c||a.error(13,!0);k=H(q(c,"data-highcharts-chart"));x(k)&&y[k]&&y[k].hasRendered&&y[k].destroy();q(c,"data-highcharts-chart",this.index);c.innerHTML="";h.skipClone||c.offsetWidth||this.temporaryDisplay();this.getChartSize();k=this.chartWidth;v=this.chartHeight;w=g({position:"relative",overflow:"hidden",width:k+"px",height:v+"px",textAlign:"left",lineHeight:"normal",zIndex:0,"-webkit-tap-highlight-color":"rgba(0,0,0,0)"},h.style);this.container=c=u("div",{id:e},w,c);this._cursor=c.style.cursor;this.renderer=
new (a[h.renderer]||a.Renderer)(c,k,v,null,h.forExport,d.exporting&&d.exporting.allowHTML);this.setClassName(h.className);this.renderer.setStyle(h.style);this.renderer.chartIndex=this.index;b(this,"afterGetContainer")},getMargins:function(a){var c=this.spacing,h=this.margin,k=this.titleOffset;this.resetMargins();k&&!d(h[0])&&(this.plotTop=Math.max(this.plotTop,k+this.options.title.margin+c[0]));this.legend&&this.legend.display&&this.legend.adjustMargins(h,c);b(this,"getMargins");a||this.getAxisMargins()},
getAxisMargins:function(){var a=this,b=a.axisOffset=[0,0,0,0],c=a.margin;a.hasCartesianSeries&&e(a.axes,function(a){a.visible&&a.getOffset()});e(L,function(h,k){d(c[k])||(a[h]+=b[k])});a.setChartSize()},reflow:function(b){var c=this,h=c.options.chart,k=c.renderTo,v=d(h.width)&&d(h.height),e=h.width||a.getStyle(k,"width"),h=h.height||a.getStyle(k,"height"),k=b?b.target:Q;if(!v&&!c.isPrinting&&e&&h&&(k===Q||k===l)){if(e!==c.containerWidth||h!==c.containerHeight)a.clearTimeout(c.reflowTimeout),c.reflowTimeout=
A(function(){c.container&&c.setSize(void 0,void 0,!1)},b?100:0);c.containerWidth=e;c.containerHeight=h}},setReflow:function(a){var b=this;!1===a||this.unbindReflow?!1===a&&this.unbindReflow&&(this.unbindReflow=this.unbindReflow()):(this.unbindReflow=E(Q,"resize",function(a){b.reflow(a)}),E(this,"destroy",this.unbindReflow))},setSize:function(c,d,h){var k=this,v=k.renderer;k.isResizing+=1;a.setAnimation(h,k);k.oldChartHeight=k.chartHeight;k.oldChartWidth=k.chartWidth;void 0!==c&&(k.options.chart.width=
c);void 0!==d&&(k.options.chart.height=d);k.getChartSize();c=v.globalAnimation;(c?F:p)(k.container,{width:k.chartWidth+"px",height:k.chartHeight+"px"},c);k.setChartSize(!0);v.setSize(k.chartWidth,k.chartHeight,h);e(k.axes,function(a){a.isDirty=!0;a.setScale()});k.isDirtyLegend=!0;k.isDirtyBox=!0;k.layOutTitles();k.getMargins();k.redraw(h);k.oldChartHeight=null;b(k,"resize");A(function(){k&&b(k,"endResize",null,function(){--k.isResizing})},G(c).duration)},setChartSize:function(a){var c=this.inverted,
d=this.renderer,h=this.chartWidth,k=this.chartHeight,v=this.options.chart,w=this.spacing,n=this.clipOffset,g,m,p,A;this.plotLeft=g=Math.round(this.plotLeft);this.plotTop=m=Math.round(this.plotTop);this.plotWidth=p=Math.max(0,Math.round(h-g-this.marginRight));this.plotHeight=A=Math.max(0,Math.round(k-m-this.marginBottom));this.plotSizeX=c?A:p;this.plotSizeY=c?p:A;this.plotBorderWidth=v.plotBorderWidth||0;this.spacingBox=d.spacingBox={x:w[3],y:w[0],width:h-w[3]-w[1],height:k-w[0]-w[2]};this.plotBox=
d.plotBox={x:g,y:m,width:p,height:A};h=2*Math.floor(this.plotBorderWidth/2);c=Math.ceil(Math.max(h,n[3])/2);d=Math.ceil(Math.max(h,n[0])/2);this.clipBox={x:c,y:d,width:Math.floor(this.plotSizeX-Math.max(h,n[1])/2-c),height:Math.max(0,Math.floor(this.plotSizeY-Math.max(h,n[2])/2-d))};a||e(this.axes,function(a){a.setAxisSize();a.setAxisTranslation()});b(this,"afterSetChartSize",{skipAxes:a})},resetMargins:function(){var a=this,b=a.options.chart;e(["margin","spacing"],function(c){var d=b[c],h=B(d)?d:
[d,d,d,d];e(["Top","Right","Bottom","Left"],function(d,k){a[c][k]=I(b[c+d],h[k])})});e(L,function(b,c){a[b]=I(a.margin[c],a.spacing[c])});a.axisOffset=[0,0,0,0];a.clipOffset=[0,0,0,0]},drawChartBox:function(){var a=this.options.chart,c=this.renderer,d=this.chartWidth,h=this.chartHeight,k=this.chartBackground,v=this.plotBackground,e=this.plotBorder,w,n=this.plotBGImage,g=a.backgroundColor,m=a.plotBackgroundColor,p=a.plotBackgroundImage,A,H=this.plotLeft,z=this.plotTop,t=this.plotWidth,f=this.plotHeight,
D=this.plotBox,I=this.clipRect,l=this.clipBox,x="animate";k||(this.chartBackground=k=c.rect().addClass("highcharts-background").add(),x="attr");w=a.borderWidth||0;A=w+(a.shadow?8:0);g={fill:g||"none"};if(w||k["stroke-width"])g.stroke=a.borderColor,g["stroke-width"]=w;k.attr(g).shadow(a.shadow);k[x]({x:A/2,y:A/2,width:d-A-w%2,height:h-A-w%2,r:a.borderRadius});x="animate";v||(x="attr",this.plotBackground=v=c.rect().addClass("highcharts-plot-background").add());v[x](D);v.attr({fill:m||"none"}).shadow(a.plotShadow);
p&&(n?n.animate(D):this.plotBGImage=c.image(p,H,z,t,f).add());I?I.animate({width:l.width,height:l.height}):this.clipRect=c.clipRect(l);x="animate";e||(x="attr",this.plotBorder=e=c.rect().addClass("highcharts-plot-border").attr({zIndex:1}).add());e.attr({stroke:a.plotBorderColor,"stroke-width":a.plotBorderWidth||0,fill:"none"});e[x](e.crisp({x:H,y:z,width:t,height:f},-e.strokeWidth()));this.isDirtyBox=!1;b(this,"afterDrawChartBox")},propFromSeries:function(){var a=this,b=a.options.chart,c,d=a.options.series,
h,k;e(["inverted","angular","polar"],function(v){c=w[b.type||b.defaultSeriesType];k=b[v]||c&&c.prototype[v];for(h=d&&d.length;!k&&h--;)(c=w[d[h].type])&&c.prototype[v]&&(k=!0);a[v]=k})},linkSeries:function(){var a=this,c=a.series;e(c,function(a){a.linkedSeries.length=0});e(c,function(b){var c=b.options.linkedTo;t(c)&&(c=":previous"===c?a.series[b.index-1]:a.get(c))&&c.linkedParent!==b&&(c.linkedSeries.push(b),b.linkedParent=c,b.visible=I(b.options.visible,c.options.visible,b.visible))});b(this,"afterLinkSeries")},
renderSeries:function(){e(this.series,function(a){a.translate();a.render()})},renderLabels:function(){var a=this,b=a.options.labels;b.items&&e(b.items,function(c){var d=g(b.style,c.style),h=H(d.left)+a.plotLeft,k=H(d.top)+a.plotTop+12;delete d.left;delete d.top;a.renderer.text(c.html,h,k).attr({zIndex:2}).css(d).add()})},render:function(){var a=this.axes,b=this.renderer,c=this.options,d,h,k;this.setTitle();this.legend=new n(this,c.legend);this.getStacks&&this.getStacks();this.getMargins(!0);this.setChartSize();
c=this.plotWidth;d=this.plotHeight=Math.max(this.plotHeight-21,0);e(a,function(a){a.setScale()});this.getAxisMargins();h=1.1<c/this.plotWidth;k=1.05<d/this.plotHeight;if(h||k)e(a,function(a){(a.horiz&&h||!a.horiz&&k)&&a.setTickInterval(!0)}),this.getMargins();this.drawChartBox();this.hasCartesianSeries&&e(a,function(a){a.visible&&a.render()});this.seriesGroup||(this.seriesGroup=b.g("series-group").attr({zIndex:3}).add());this.renderSeries();this.renderLabels();this.addCredits();this.setResponsive&&
this.setResponsive();this.hasRendered=!0},addCredits:function(a){var b=this;a=z(!0,this.options.credits,a);a.enabled&&!this.credits&&(this.credits=this.renderer.text(a.text+(this.mapCredits||""),0,0).addClass("highcharts-credits").on("click",function(){a.href&&(Q.location.href=a.href)}).attr({align:a.position.align,zIndex:8}).css(a.style).add().align(a.position),this.credits.update=function(a){b.credits=b.credits.destroy();b.addCredits(a)})},destroy:function(){var c=this,d=c.axes,h=c.series,k=c.container,
w,g=k&&k.parentNode;b(c,"destroy");c.renderer.forExport?a.erase(y,c):y[c.index]=void 0;a.chartCount--;c.renderTo.removeAttribute("data-highcharts-chart");v(c);for(w=d.length;w--;)d[w]=d[w].destroy();this.scroller&&this.scroller.destroy&&this.scroller.destroy();for(w=h.length;w--;)h[w]=h[w].destroy();e("title subtitle chartBackground plotBackground plotBGImage plotBorder seriesGroup clipRect credits pointer rangeSelector legend resetZoomButton tooltip renderer".split(" "),function(a){var b=c[a];b&&
b.destroy&&(c[a]=b.destroy())});k&&(k.innerHTML="",v(k),g&&r(k));D(c,function(a,b){delete c[b]})},firstRender:function(){var a=this,c=a.options;if(!a.isReadyToRender||a.isReadyToRender()){a.getContainer();a.resetMargins();a.setChartSize();a.propFromSeries();a.getAxes();e(c.series||[],function(b){a.initSeries(b)});a.linkSeries();b(a,"beforeRender");h&&(a.pointer=new h(a,c));a.render();if(!a.renderer.imgCount&&a.onload)a.onload();a.temporaryDisplay(!0)}},onload:function(){e([this.callback].concat(this.callbacks),
function(a){a&&void 0!==this.index&&a.apply(this,[this])},this);b(this,"load");b(this,"render");d(this.index)&&this.setReflow(this.options.chart.reflow);this.onload=null}})})(J);(function(a){var E=a.addEvent,F=a.Chart,G=a.each;E(F,"afterSetChartSize",function(q){var l=this.options.chart.scrollablePlotArea;(l=l&&l.minWidth)&&!this.renderer.forExport&&(this.scrollablePixels=l=Math.max(0,l-this.chartWidth))&&(this.plotWidth+=l,this.clipBox.width+=l,q.skipAxes||G(this.axes,function(f){1===f.side?f.getPlotLinePath=
function(){var l=this.right,q;this.right=l-f.chart.scrollablePixels;q=a.Axis.prototype.getPlotLinePath.apply(this,arguments);this.right=l;return q}:(f.setAxisSize(),f.setAxisTranslation())}))});E(F,"render",function(){this.scrollablePixels?(this.setUpScrolling&&this.setUpScrolling(),this.applyFixed()):this.fixedDiv&&this.applyFixed()});F.prototype.setUpScrolling=function(){this.scrollingContainer=a.createElement("div",{className:"highcharts-scrolling"},{overflowX:"auto",WebkitOverflowScrolling:"touch"},
this.renderTo);this.innerContainer=a.createElement("div",{className:"highcharts-inner-container"},null,this.scrollingContainer);this.innerContainer.appendChild(this.container);this.setUpScrolling=null};F.prototype.applyFixed=function(){var q=this.container,l,f,u=!this.fixedDiv;u&&(this.fixedDiv=a.createElement("div",{className:"highcharts-fixed"},{position:"absolute",overflow:"hidden",pointerEvents:"none",zIndex:2},null,!0),this.renderTo.insertBefore(this.fixedDiv,this.renderTo.firstChild),this.fixedRenderer=
l=new a.Renderer(this.fixedDiv,0,0),this.scrollableMask=l.path().attr({fill:a.color(this.options.chart.backgroundColor||"#fff").setOpacity(.85).get(),zIndex:-1}).addClass("highcharts-scrollable-mask").add(),a.each([this.inverted?".highcharts-xaxis":".highcharts-yaxis",this.inverted?".highcharts-xaxis-labels":".highcharts-yaxis-labels",".highcharts-contextbutton",".highcharts-credits",".highcharts-legend",".highcharts-subtitle",".highcharts-title",".highcharts-legend-checkbox"],function(f){a.each(q.querySelectorAll(f),
function(a){(a.namespaceURI===l.SVG_NS?l.box:l.box.parentNode).appendChild(a);a.style.pointerEvents="auto"})}));this.fixedRenderer.setSize(this.chartWidth,this.chartHeight);f=this.chartWidth+this.scrollablePixels;a.stop(this.container);this.container.style.width=f+"px";this.renderer.boxWrapper.attr({width:f,height:this.chartHeight,viewBox:[0,0,f,this.chartHeight].join(" ")});this.chartBackground.attr({width:f});u&&(f=this.options.chart.scrollablePlotArea,f.scrollPositionX&&(this.scrollingContainer.scrollLeft=
this.scrollablePixels*f.scrollPositionX));u=this.axisOffset;f=this.plotTop-u[0]-1;var u=this.plotTop+this.plotHeight+u[2],C=this.plotLeft+this.plotWidth-this.scrollablePixels;this.scrollableMask.attr({d:this.scrollablePixels?["M",0,f,"L",this.plotLeft-1,f,"L",this.plotLeft-1,u,"L",0,u,"Z","M",C,f,"L",this.chartWidth,f,"L",this.chartWidth,u,"L",C,u,"Z"]:["M",0,0]})}})(J);(function(a){var E,F=a.each,G=a.extend,q=a.erase,l=a.fireEvent,f=a.format,u=a.isArray,C=a.isNumber,r=a.pick,y=a.removeEvent;a.Point=
E=function(){};a.Point.prototype={init:function(a,d,e){this.series=a;this.color=a.color;this.applyOptions(d,e);a.options.colorByPoint?(d=a.options.colors||a.chart.options.colors,this.color=this.color||d[a.colorCounter],d=d.length,e=a.colorCounter,a.colorCounter++,a.colorCounter===d&&(a.colorCounter=0)):e=a.colorIndex;this.colorIndex=r(this.colorIndex,e);a.chart.pointCount++;l(this,"afterInit");return this},applyOptions:function(a,d){var e=this.series,g=e.options.pointValKey||e.pointValKey;a=E.prototype.optionsToObject.call(this,
a);G(this,a);this.options=this.options?G(this.options,a):a;a.group&&delete this.group;g&&(this.y=this[g]);this.isNull=r(this.isValid&&!this.isValid(),null===this.x||!C(this.y,!0));this.selected&&(this.state="select");"name"in this&&void 0===d&&e.xAxis&&e.xAxis.hasNames&&(this.x=e.xAxis.nameToX(this));void 0===this.x&&e&&(this.x=void 0===d?e.autoIncrement(this):d);return this},setNestedProperty:function(p,d,e){e=e.split(".");a.reduce(e,function(e,m,b,c){e[m]=c.length-1===b?d:a.isObject(e[m],!0)?e[m]:
{};return e[m]},p);return p},optionsToObject:function(p){var d={},e=this.series,g=e.options.keys,m=g||e.pointArrayMap||["y"],b=m.length,c=0,f=0;if(C(p)||null===p)d[m[0]]=p;else if(u(p))for(!g&&p.length>b&&(e=typeof p[0],"string"===e?d.name=p[0]:"number"===e&&(d.x=p[0]),c++);f<b;)g&&void 0===p[c]||(0<m[f].indexOf(".")?a.Point.prototype.setNestedProperty(d,p[c],m[f]):d[m[f]]=p[c]),c++,f++;else"object"===typeof p&&(d=p,p.dataLabels&&(e._hasPointLabels=!0),p.marker&&(e._hasPointMarkers=!0));return d},
getClassName:function(){return"highcharts-point"+(this.selected?" highcharts-point-select":"")+(this.negative?" highcharts-negative":"")+(this.isNull?" highcharts-null-point":"")+(void 0!==this.colorIndex?" highcharts-color-"+this.colorIndex:"")+(this.options.className?" "+this.options.className:"")+(this.zone&&this.zone.className?" "+this.zone.className.replace("highcharts-negative",""):"")},getZone:function(){var a=this.series,d=a.zones,a=a.zoneAxis||"y",e=0,g;for(g=d[e];this[a]>=g.value;)g=d[++e];
this.nonZonedColor||(this.nonZonedColor=this.color);this.color=g&&g.color&&!this.options.color?g.color:this.nonZonedColor;return g},destroy:function(){var a=this.series.chart,d=a.hoverPoints,e;a.pointCount--;d&&(this.setState(),q(d,this),d.length||(a.hoverPoints=null));if(this===a.hoverPoint)this.onMouseOut();if(this.graphic||this.dataLabel)y(this),this.destroyElements();this.legendItem&&a.legend.destroyItem(this);for(e in this)this[e]=null},destroyElements:function(){for(var a=["graphic","dataLabel",
"dataLabelUpper","connector","shadowGroup"],d,e=6;e--;)d=a[e],this[d]&&(this[d]=this[d].destroy())},getLabelConfig:function(){return{x:this.category,y:this.y,color:this.color,colorIndex:this.colorIndex,key:this.name||this.category,series:this.series,point:this,percentage:this.percentage,total:this.total||this.stackTotal}},tooltipFormatter:function(a){var d=this.series,e=d.tooltipOptions,g=r(e.valueDecimals,""),m=e.valuePrefix||"",b=e.valueSuffix||"";F(d.pointArrayMap||["y"],function(c){c="{point."+
c;if(m||b)a=a.replace(RegExp(c+"}","g"),m+c+"}"+b);a=a.replace(RegExp(c+"}","g"),c+":,."+g+"f}")});return f(a,{point:this,series:this.series},d.chart.time)},firePointEvent:function(a,d,e){var g=this,m=this.series.options;(m.point.events[a]||g.options&&g.options.events&&g.options.events[a])&&this.importEvents();"click"===a&&m.allowPointSelect&&(e=function(a){g.select&&g.select(null,a.ctrlKey||a.metaKey||a.shiftKey)});l(this,a,d,e)},visible:!0}})(J);(function(a){var E=a.addEvent,F=a.animObject,G=a.arrayMax,
q=a.arrayMin,l=a.correctFloat,f=a.defaultOptions,u=a.defaultPlotOptions,C=a.defined,r=a.each,y=a.erase,p=a.extend,d=a.fireEvent,e=a.grep,g=a.isArray,m=a.isNumber,b=a.isString,c=a.merge,x=a.objectEach,B=a.pick,t=a.removeEvent,n=a.splat,L=a.SVGElement,z=a.syncTimeout,D=a.win;a.Series=a.seriesType("line",null,{lineWidth:2,allowPointSelect:!1,showCheckbox:!1,animation:{duration:1E3},events:{},marker:{lineWidth:0,lineColor:"#ffffff",enabledThreshold:2,radius:4,states:{normal:{animation:!0},hover:{animation:{duration:50},
enabled:!0,radiusPlus:2,lineWidthPlus:1},select:{fillColor:"#cccccc",lineColor:"#000000",lineWidth:2}}},point:{events:{}},dataLabels:{align:"center",formatter:function(){return null===this.y?"":a.numberFormat(this.y,-1)},style:{fontSize:"11px",fontWeight:"bold",color:"contrast",textOutline:"1px contrast"},verticalAlign:"bottom",x:0,y:0,padding:5},cropThreshold:300,pointRange:0,softThreshold:!0,states:{normal:{animation:!0},hover:{animation:{duration:50},lineWidthPlus:1,marker:{},halo:{size:10,opacity:.25}},
select:{}},stickyTracking:!0,turboThreshold:1E3,findNearestPointBy:"x"},{isCartesian:!0,pointClass:a.Point,sorted:!0,requireSorting:!0,directTouch:!1,axisTypes:["xAxis","yAxis"],colorCounter:0,parallelArrays:["x","y"],coll:"series",init:function(a,b){var c=this,h,e=a.series,k;c.chart=a;c.options=b=c.setOptions(b);c.linkedSeries=[];c.bindAxes();p(c,{name:b.name,state:"",visible:!1!==b.visible,selected:!0===b.selected});h=b.events;x(h,function(a,b){E(c,b,a)});if(h&&h.click||b.point&&b.point.events&&
b.point.events.click||b.allowPointSelect)a.runTrackerClick=!0;c.getColor();c.getSymbol();r(c.parallelArrays,function(a){c[a+"Data"]=[]});c.setData(b.data,!1);c.isCartesian&&(a.hasCartesianSeries=!0);e.length&&(k=e[e.length-1]);c._i=B(k&&k._i,-1)+1;a.orderSeries(this.insert(e));d(this,"afterInit")},insert:function(a){var b=this.options.index,c;if(m(b)){for(c=a.length;c--;)if(b>=B(a[c].options.index,a[c]._i)){a.splice(c+1,0,this);break}-1===c&&a.unshift(this);c+=1}else a.push(this);return B(c,a.length-
1)},bindAxes:function(){var b=this,c=b.options,d=b.chart,v;r(b.axisTypes||[],function(h){r(d[h],function(a){v=a.options;if(c[h]===v.index||void 0!==c[h]&&c[h]===v.id||void 0===c[h]&&0===v.index)b.insert(a.series),b[h]=a,a.isDirty=!0});b[h]||b.optionalAxis===h||a.error(18,!0)})},updateParallelArrays:function(a,b){var c=a.series,d=arguments,h=m(b)?function(d){var h="y"===d&&c.toYData?c.toYData(a):a[d];c[d+"Data"][b]=h}:function(a){Array.prototype[b].apply(c[a+"Data"],Array.prototype.slice.call(d,2))};
r(c.parallelArrays,h)},autoIncrement:function(){var a=this.options,b=this.xIncrement,c,d=a.pointIntervalUnit,e=this.chart.time,b=B(b,a.pointStart,0);this.pointInterval=c=B(this.pointInterval,a.pointInterval,1);d&&(a=new e.Date(b),"day"===d?e.set("Date",a,e.get("Date",a)+c):"month"===d?e.set("Month",a,e.get("Month",a)+c):"year"===d&&e.set("FullYear",a,e.get("FullYear",a)+c),c=a.getTime()-b);this.xIncrement=b+c;return b},setOptions:function(a){var b=this.chart,h=b.options,v=h.plotOptions,e=(b.userOptions||
{}).plotOptions||{},k=v[this.type];this.userOptions=a;b=c(k,v.series,a);this.tooltipOptions=c(f.tooltip,f.plotOptions.series&&f.plotOptions.series.tooltip,f.plotOptions[this.type].tooltip,h.tooltip.userOptions,v.series&&v.series.tooltip,v[this.type].tooltip,a.tooltip);this.stickyTracking=B(a.stickyTracking,e[this.type]&&e[this.type].stickyTracking,e.series&&e.series.stickyTracking,this.tooltipOptions.shared&&!this.noSharedTooltip?!0:b.stickyTracking);null===k.marker&&delete b.marker;this.zoneAxis=
b.zoneAxis;a=this.zones=(b.zones||[]).slice();!b.negativeColor&&!b.negativeFillColor||b.zones||a.push({value:b[this.zoneAxis+"Threshold"]||b.threshold||0,className:"highcharts-negative",color:b.negativeColor,fillColor:b.negativeFillColor});a.length&&C(a[a.length-1].value)&&a.push({color:this.color,fillColor:this.fillColor});d(this,"afterSetOptions",{options:b});return b},getName:function(){return this.name||"Series "+(this.index+1)},getCyclic:function(a,b,c){var d,h=this.chart,k=this.userOptions,
e=a+"Index",n=a+"Counter",g=c?c.length:B(h.options.chart[a+"Count"],h[a+"Count"]);b||(d=B(k[e],k["_"+e]),C(d)||(h.series.length||(h[n]=0),k["_"+e]=d=h[n]%g,h[n]+=1),c&&(b=c[d]));void 0!==d&&(this[e]=d);this[a]=b},getColor:function(){this.options.colorByPoint?this.options.color=null:this.getCyclic("color",this.options.color||u[this.type].color,this.chart.options.colors)},getSymbol:function(){this.getCyclic("symbol",this.options.marker.symbol,this.chart.options.symbols)},drawLegendSymbol:a.LegendSymbolMixin.drawLineMarker,
updateData:function(b){var c=this.options,d=this.points,h=[],e,k,n,g=this.requireSorting;r(b,function(b){var k;k=a.defined(b)&&this.pointClass.prototype.optionsToObject.call({series:this},b).x;m(k)&&(k=a.inArray(k,this.xData,n),-1===k||d[k].touched?h.push(b):b!==c.data[k]?(d[k].update(b,!1,null,!1),d[k].touched=!0,g&&(n=k+1)):d[k]&&(d[k].touched=!0),e=!0)},this);if(e)for(b=d.length;b--;)k=d[b],k.touched||k.remove(!1),k.touched=!1;else if(b.length===d.length)r(b,function(a,b){d[b].update&&a!==c.data[b]&&
d[b].update(a,!1,null,!1)});else return!1;r(h,function(a){this.addPoint(a,!1)},this);return!0},setData:function(c,d,e,v){var h=this,k=h.points,n=k&&k.length||0,z,t=h.options,f=h.chart,p=null,D=h.xAxis,l=t.turboThreshold,x=this.xData,H=this.yData,I=(z=h.pointArrayMap)&&z.length,q;c=c||[];z=c.length;d=B(d,!0);!1!==v&&z&&n&&!h.cropped&&!h.hasGroupedData&&h.visible&&!h.isSeriesBoosting&&(q=this.updateData(c));if(!q){h.xIncrement=null;h.colorCounter=0;r(this.parallelArrays,function(a){h[a+"Data"].length=
0});if(l&&z>l){for(e=0;null===p&&e<z;)p=c[e],e++;if(m(p))for(e=0;e<z;e++)x[e]=this.autoIncrement(),H[e]=c[e];else if(g(p))if(I)for(e=0;e<z;e++)p=c[e],x[e]=p[0],H[e]=p.slice(1,I+1);else for(e=0;e<z;e++)p=c[e],x[e]=p[0],H[e]=p[1];else a.error(12)}else for(e=0;e<z;e++)void 0!==c[e]&&(p={series:h},h.pointClass.prototype.applyOptions.apply(p,[c[e]]),h.updateParallelArrays(p,e));H&&b(H[0])&&a.error(14,!0);h.data=[];h.options.data=h.userOptions.data=c;for(e=n;e--;)k[e]&&k[e].destroy&&k[e].destroy();D&&(D.minRange=
D.userMinRange);h.isDirty=f.isDirtyBox=!0;h.isDirtyData=!!k;e=!1}"point"===t.legendType&&(this.processData(),this.generatePoints());d&&f.redraw(e)},processData:function(b){var c=this.xData,d=this.yData,h=c.length,e;e=0;var k,n,g=this.xAxis,m,z=this.options;m=z.cropThreshold;var p=this.getExtremesFromAll||z.getExtremesFromAll,t=this.isCartesian,z=g&&g.val2lin,f=g&&g.isLog,D=this.requireSorting,l,x;if(t&&!this.isDirty&&!g.isDirty&&!this.yAxis.isDirty&&!b)return!1;g&&(b=g.getExtremes(),l=b.min,x=b.max);
t&&this.sorted&&!p&&(!m||h>m||this.forceCrop)&&(c[h-1]<l||c[0]>x?(c=[],d=[]):this.yData&&(c[0]<l||c[h-1]>x)&&(e=this.cropData(this.xData,this.yData,l,x),c=e.xData,d=e.yData,e=e.start,k=!0));for(m=c.length||1;--m;)h=f?z(c[m])-z(c[m-1]):c[m]-c[m-1],0<h&&(void 0===n||h<n)?n=h:0>h&&D&&(a.error(15),D=!1);this.cropped=k;this.cropStart=e;this.processedXData=c;this.processedYData=d;this.closestPointRange=n},cropData:function(a,b,c,d,e){var k=a.length,h=0,v=k,n;e=B(e,this.cropShoulder,1);for(n=0;n<k;n++)if(a[n]>=
c){h=Math.max(0,n-e);break}for(c=n;c<k;c++)if(a[c]>d){v=c+e;break}return{xData:a.slice(h,v),yData:b.slice(h,v),start:h,end:v}},generatePoints:function(){var a=this.options,b=a.data,c=this.data,d,e=this.processedXData,k=this.processedYData,g=this.pointClass,m=e.length,z=this.cropStart||0,t,f=this.hasGroupedData,a=a.keys,D,l=[],x;c||f||(c=[],c.length=b.length,c=this.data=c);a&&f&&(this.options.keys=!1);for(x=0;x<m;x++)t=z+x,f?(D=(new g).init(this,[e[x]].concat(n(k[x]))),D.dataGroup=this.groupMap[x],
D.dataGroup.options&&(D.options=D.dataGroup.options,p(D,D.dataGroup.options))):(D=c[t])||void 0===b[t]||(c[t]=D=(new g).init(this,b[t],e[x])),D&&(D.index=t,l[x]=D);this.options.keys=a;if(c&&(m!==(d=c.length)||f))for(x=0;x<d;x++)x!==z||f||(x+=m),c[x]&&(c[x].destroyElements(),c[x].plotX=void 0);this.data=c;this.points=l},getExtremes:function(a){var b=this.yAxis,c=this.processedXData,d,h=[],k=0;d=this.xAxis.getExtremes();var e=d.min,n=d.max,z,t,f=this.requireSorting?1:0,p,D;a=a||this.stackedYData||this.processedYData||
[];d=a.length;for(D=0;D<d;D++)if(t=c[D],p=a[D],z=(m(p,!0)||g(p))&&(!b.positiveValuesOnly||p.length||0<p),t=this.getExtremesFromAll||this.options.getExtremesFromAll||this.cropped||(c[D+f]||t)>=e&&(c[D-f]||t)<=n,z&&t)if(z=p.length)for(;z--;)"number"===typeof p[z]&&(h[k++]=p[z]);else h[k++]=p;this.dataMin=q(h);this.dataMax=G(h)},translate:function(){this.processedXData||this.processData();this.generatePoints();var a=this.options,b=a.stacking,c=this.xAxis,e=c.categories,n=this.yAxis,k=this.points,g=k.length,
z=!!this.modifyValue,p=a.pointPlacement,t="between"===p||m(p),f=a.threshold,D=a.startFromThreshold?f:0,x,r,q,u,L=Number.MAX_VALUE;"between"===p&&(p=.5);m(p)&&(p*=B(a.pointRange||c.pointRange));for(a=0;a<g;a++){var y=k[a],F=y.x,E=y.y;r=y.low;var G=b&&n.stacks[(this.negStacks&&E<(D?0:f)?"-":"")+this.stackKey],J;n.positiveValuesOnly&&null!==E&&0>=E&&(y.isNull=!0);y.plotX=x=l(Math.min(Math.max(-1E5,c.translate(F,0,0,0,1,p,"flags"===this.type)),1E5));b&&this.visible&&!y.isNull&&G&&G[F]&&(u=this.getStackIndicator(u,
F,this.index),J=G[F],E=J.points[u.key],r=E[0],E=E[1],r===D&&u.key===G[F].base&&(r=B(m(f)&&f,n.min)),n.positiveValuesOnly&&0>=r&&(r=null),y.total=y.stackTotal=J.total,y.percentage=J.total&&y.y/J.total*100,y.stackY=E,J.setOffset(this.pointXOffset||0,this.barW||0));y.yBottom=C(r)?Math.min(Math.max(-1E5,n.translate(r,0,1,0,1)),1E5):null;z&&(E=this.modifyValue(E,y));y.plotY=r="number"===typeof E&&Infinity!==E?Math.min(Math.max(-1E5,n.translate(E,0,1,0,1)),1E5):void 0;y.isInside=void 0!==r&&0<=r&&r<=n.len&&
0<=x&&x<=c.len;y.clientX=t?l(c.translate(F,0,0,0,1,p)):x;y.negative=y.y<(f||0);y.category=e&&void 0!==e[y.x]?e[y.x]:y.x;y.isNull||(void 0!==q&&(L=Math.min(L,Math.abs(x-q))),q=x);y.zone=this.zones.length&&y.getZone()}this.closestPointRangePx=L;d(this,"afterTranslate")},getValidPoints:function(a,b){var c=this.chart;return e(a||this.points||[],function(a){return b&&!c.isInsidePlot(a.plotX,a.plotY,c.inverted)?!1:!a.isNull})},setClip:function(a){var b=this.chart,c=this.options,d=b.renderer,h=b.inverted,
k=this.clipBox,e=k||b.clipBox,n=this.sharedClipKey||["_sharedClip",a&&a.duration,a&&a.easing,e.height,c.xAxis,c.yAxis].join(),g=b[n],m=b[n+"m"];g||(a&&(e.width=0,h&&(e.x=b.plotSizeX),b[n+"m"]=m=d.clipRect(h?b.plotSizeX+99:-99,h?-b.plotLeft:-b.plotTop,99,h?b.chartWidth:b.chartHeight)),b[n]=g=d.clipRect(e),g.count={length:0});a&&!g.count[this.index]&&(g.count[this.index]=!0,g.count.length+=1);!1!==c.clip&&(this.group.clip(a||k?g:b.clipRect),this.markerGroup.clip(m),this.sharedClipKey=n);a||(g.count[this.index]&&
(delete g.count[this.index],--g.count.length),0===g.count.length&&n&&b[n]&&(k||(b[n]=b[n].destroy()),b[n+"m"]&&(b[n+"m"]=b[n+"m"].destroy())))},animate:function(a){var b=this.chart,c=F(this.options.animation),d;a?this.setClip(c):(d=this.sharedClipKey,(a=b[d])&&a.animate({width:b.plotSizeX,x:0},c),b[d+"m"]&&b[d+"m"].animate({width:b.plotSizeX+99,x:0},c),this.animate=null)},afterAnimate:function(){this.setClip();d(this,"afterAnimate");this.finishedAnimating=!0},drawPoints:function(){var a=this.points,
b=this.chart,c,d,e,k,n=this.options.marker,g,m,z,p=this[this.specialGroup]||this.markerGroup,t,f=B(n.enabled,this.xAxis.isRadial?!0:null,this.closestPointRangePx>=n.enabledThreshold*n.radius);if(!1!==n.enabled||this._hasPointMarkers)for(c=0;c<a.length;c++)d=a[c],k=d.graphic,g=d.marker||{},m=!!d.marker,e=f&&void 0===g.enabled||g.enabled,z=d.isInside,e&&!d.isNull?(e=B(g.symbol,this.symbol),t=this.markerAttribs(d,d.selected&&"select"),k?k[z?"show":"hide"](!0).animate(t):z&&(0<t.width||d.hasImage)&&(d.graphic=
k=b.renderer.symbol(e,t.x,t.y,t.width,t.height,m?g:n).add(p)),k&&k.attr(this.pointAttribs(d,d.selected&&"select")),k&&k.addClass(d.getClassName(),!0)):k&&(d.graphic=k.destroy())},markerAttribs:function(a,b){var c=this.options.marker,d=a.marker||{},h=d.symbol||c.symbol,k=B(d.radius,c.radius);b&&(c=c.states[b],b=d.states&&d.states[b],k=B(b&&b.radius,c&&c.radius,k+(c&&c.radiusPlus||0)));a.hasImage=h&&0===h.indexOf("url");a.hasImage&&(k=0);a={x:Math.floor(a.plotX)-k,y:a.plotY-k};k&&(a.width=a.height=
2*k);return a},pointAttribs:function(a,b){var c=this.options.marker,d=a&&a.options,h=d&&d.marker||{},k=this.color,e=d&&d.color,n=a&&a.color,d=B(h.lineWidth,c.lineWidth);a=a&&a.zone&&a.zone.color;k=e||a||n||k;a=h.fillColor||c.fillColor||k;k=h.lineColor||c.lineColor||k;b&&(c=c.states[b],b=h.states&&h.states[b]||{},d=B(b.lineWidth,c.lineWidth,d+B(b.lineWidthPlus,c.lineWidthPlus,0)),a=b.fillColor||c.fillColor||a,k=b.lineColor||c.lineColor||k);return{stroke:k,"stroke-width":d,fill:a}},destroy:function(){var b=
this,c=b.chart,e=/AppleWebKit\/533/.test(D.navigator.userAgent),v,n,k=b.data||[],g,m;d(b,"destroy");t(b);r(b.axisTypes||[],function(a){(m=b[a])&&m.series&&(y(m.series,b),m.isDirty=m.forceRedraw=!0)});b.legendItem&&b.chart.legend.destroyItem(b);for(n=k.length;n--;)(g=k[n])&&g.destroy&&g.destroy();b.points=null;a.clearTimeout(b.animationTimeout);x(b,function(a,b){a instanceof L&&!a.survive&&(v=e&&"group"===b?"hide":"destroy",a[v]())});c.hoverSeries===b&&(c.hoverSeries=null);y(c.series,b);c.orderSeries();
x(b,function(a,c){delete b[c]})},getGraphPath:function(a,b,c){var d=this,e=d.options,k=e.step,h,n=[],g=[],m;a=a||d.points;(h=a.reversed)&&a.reverse();(k={right:1,center:2}[k]||k&&3)&&h&&(k=4-k);!e.connectNulls||b||c||(a=this.getValidPoints(a));r(a,function(h,v){var w=h.plotX,z=h.plotY,p=a[v-1];(h.leftCliff||p&&p.rightCliff)&&!c&&(m=!0);h.isNull&&!C(b)&&0<v?m=!e.connectNulls:h.isNull&&!b?m=!0:(0===v||m?v=["M",h.plotX,h.plotY]:d.getPointSpline?v=d.getPointSpline(a,h,v):k?(v=1===k?["L",p.plotX,z]:2===
k?["L",(p.plotX+w)/2,p.plotY,"L",(p.plotX+w)/2,z]:["L",w,p.plotY],v.push("L",w,z)):v=["L",w,z],g.push(h.x),k&&(g.push(h.x),2===k&&g.push(h.x)),n.push.apply(n,v),m=!1)});n.xMap=g;return d.graphPath=n},drawGraph:function(){var a=this,b=this.options,c=(this.gappedPath||this.getGraphPath).call(this),d=[["graph","highcharts-graph",b.lineColor||this.color,b.dashStyle]],d=a.getZonesGraphs(d);r(d,function(d,k){var e=d[0],h=a[e];h?(h.endX=a.preventGraphAnimation?null:c.xMap,h.animate({d:c})):c.length&&(a[e]=
a.chart.renderer.path(c).addClass(d[1]).attr({zIndex:1}).add(a.group),h={stroke:d[2],"stroke-width":b.lineWidth,fill:a.fillGraph&&a.color||"none"},d[3]?h.dashstyle=d[3]:"square"!==b.linecap&&(h["stroke-linecap"]=h["stroke-linejoin"]="round"),h=a[e].attr(h).shadow(2>k&&b.shadow));h&&(h.startX=c.xMap,h.isArea=c.isArea)})},getZonesGraphs:function(a){r(this.zones,function(b,c){a.push(["zone-graph-"+c,"highcharts-graph highcharts-zone-graph-"+c+" "+(b.className||""),b.color||this.color,b.dashStyle||this.options.dashStyle])},
this);return a},applyZones:function(){var a=this,b=this.chart,c=b.renderer,d=this.zones,e,k,n=this.clips||[],g,m=this.graph,z=this.area,p=Math.max(b.chartWidth,b.chartHeight),t=this[(this.zoneAxis||"y")+"Axis"],f,D,l=b.inverted,x,q,u,L,y=!1;d.length&&(m||z)&&t&&void 0!==t.min&&(D=t.reversed,x=t.horiz,m&&!this.showLine&&m.hide(),z&&z.hide(),f=t.getExtremes(),r(d,function(d,h){e=D?x?b.plotWidth:0:x?0:t.toPixels(f.min);e=Math.min(Math.max(B(k,e),0),p);k=Math.min(Math.max(Math.round(t.toPixels(B(d.value,
f.max),!0)),0),p);y&&(e=k=t.toPixels(f.max));q=Math.abs(e-k);u=Math.min(e,k);L=Math.max(e,k);t.isXAxis?(g={x:l?L:u,y:0,width:q,height:p},x||(g.x=b.plotHeight-g.x)):(g={x:0,y:l?L:u,width:p,height:q},x&&(g.y=b.plotWidth-g.y));l&&c.isVML&&(g=t.isXAxis?{x:0,y:D?u:L,height:g.width,width:b.chartWidth}:{x:g.y-b.plotLeft-b.spacingBox.x,y:0,width:g.height,height:b.chartHeight});n[h]?n[h].animate(g):(n[h]=c.clipRect(g),m&&a["zone-graph-"+h].clip(n[h]),z&&a["zone-area-"+h].clip(n[h]));y=d.value>f.max;a.resetZones&&
0===k&&(k=void 0)}),this.clips=n)},invertGroups:function(a){function b(){r(["group","markerGroup"],function(b){c[b]&&(d.renderer.isVML&&c[b].attr({width:c.yAxis.len,height:c.xAxis.len}),c[b].width=c.yAxis.len,c[b].height=c.xAxis.len,c[b].invert(a))})}var c=this,d=c.chart,e;c.xAxis&&(e=E(d,"resize",b),E(c,"destroy",e),b(a),c.invertGroups=b)},plotGroup:function(a,b,c,d,e){var k=this[a],h=!k;h&&(this[a]=k=this.chart.renderer.g().attr({zIndex:d||.1}).add(e));k.addClass("highcharts-"+b+" highcharts-series-"+
this.index+" highcharts-"+this.type+"-series "+(C(this.colorIndex)?"highcharts-color-"+this.colorIndex+" ":"")+(this.options.className||"")+(k.hasClass("highcharts-tracker")?" highcharts-tracker":""),!0);k.attr({visibility:c})[h?"attr":"animate"](this.getPlotBox());return k},getPlotBox:function(){var a=this.chart,b=this.xAxis,c=this.yAxis;a.inverted&&(b=c,c=this.xAxis);return{translateX:b?b.left:a.plotLeft,translateY:c?c.top:a.plotTop,scaleX:1,scaleY:1}},render:function(){var a=this,b=a.chart,c,e=
a.options,n=!!a.animate&&b.renderer.isSVG&&F(e.animation).duration,k=a.visible?"inherit":"hidden",g=e.zIndex,m=a.hasRendered,p=b.seriesGroup,t=b.inverted;c=a.plotGroup("group","series",k,g,p);a.markerGroup=a.plotGroup("markerGroup","markers",k,g,p);n&&a.animate(!0);c.inverted=a.isCartesian?t:!1;a.drawGraph&&(a.drawGraph(),a.applyZones());a.drawDataLabels&&a.drawDataLabels();a.visible&&a.drawPoints();a.drawTracker&&!1!==a.options.enableMouseTracking&&a.drawTracker();a.invertGroups(t);!1===e.clip||
a.sharedClipKey||m||c.clip(b.clipRect);n&&a.animate();m||(a.animationTimeout=z(function(){a.afterAnimate()},n));a.isDirty=!1;a.hasRendered=!0;d(a,"afterRender")},redraw:function(){var a=this.chart,b=this.isDirty||this.isDirtyData,c=this.group,d=this.xAxis,e=this.yAxis;c&&(a.inverted&&c.attr({width:a.plotWidth,height:a.plotHeight}),c.animate({translateX:B(d&&d.left,a.plotLeft),translateY:B(e&&e.top,a.plotTop)}));this.translate();this.render();b&&delete this.kdTree},kdAxisArray:["clientX","plotY"],
searchPoint:function(a,b){var c=this.xAxis,d=this.yAxis,e=this.chart.inverted;return this.searchKDTree({clientX:e?c.len-a.chartY+c.pos:a.chartX-c.pos,plotY:e?d.len-a.chartX+d.pos:a.chartY-d.pos},b)},buildKDTree:function(){function a(c,d,k){var e,h;if(h=c&&c.length)return e=b.kdAxisArray[d%k],c.sort(function(a,b){return a[e]-b[e]}),h=Math.floor(h/2),{point:c[h],left:a(c.slice(0,h),d+1,k),right:a(c.slice(h+1),d+1,k)}}this.buildingKdTree=!0;var b=this,c=-1<b.options.findNearestPointBy.indexOf("y")?2:
1;delete b.kdTree;z(function(){b.kdTree=a(b.getValidPoints(null,!b.directTouch),c,c);b.buildingKdTree=!1},b.options.kdNow?0:1)},searchKDTree:function(a,b){function c(a,b,n,g){var v=b.point,m=d.kdAxisArray[n%g],w,z,p=v;z=C(a[e])&&C(v[e])?Math.pow(a[e]-v[e],2):null;w=C(a[k])&&C(v[k])?Math.pow(a[k]-v[k],2):null;w=(z||0)+(w||0);v.dist=C(w)?Math.sqrt(w):Number.MAX_VALUE;v.distX=C(z)?Math.sqrt(z):Number.MAX_VALUE;m=a[m]-v[m];w=0>m?"left":"right";z=0>m?"right":"left";b[w]&&(w=c(a,b[w],n+1,g),p=w[h]<p[h]?
w:v);b[z]&&Math.sqrt(m*m)<p[h]&&(a=c(a,b[z],n+1,g),p=a[h]<p[h]?a:p);return p}var d=this,e=this.kdAxisArray[0],k=this.kdAxisArray[1],h=b?"distX":"dist";b=-1<d.options.findNearestPointBy.indexOf("y")?2:1;this.kdTree||this.buildingKdTree||this.buildKDTree();if(this.kdTree)return c(a,this.kdTree,b,b)}})})(J);(function(a){var E=a.Axis,F=a.Chart,G=a.correctFloat,q=a.defined,l=a.destroyObjectProperties,f=a.each,u=a.format,C=a.objectEach,r=a.pick,y=a.Series;a.StackItem=function(a,d,e,g,m){var b=a.chart.inverted;
this.axis=a;this.isNegative=e;this.options=d;this.x=g;this.total=null;this.points={};this.stack=m;this.rightCliff=this.leftCliff=0;this.alignOptions={align:d.align||(b?e?"left":"right":"center"),verticalAlign:d.verticalAlign||(b?"middle":e?"bottom":"top"),y:r(d.y,b?4:e?14:-6),x:r(d.x,b?e?-6:6:0)};this.textAlign=d.textAlign||(b?e?"right":"left":"center")};a.StackItem.prototype={destroy:function(){l(this,this.axis)},render:function(a){var d=this.axis.chart,e=this.options,g=e.format,g=g?u(g,this,d.time):
e.formatter.call(this);this.label?this.label.attr({text:g,visibility:"hidden"}):this.label=d.renderer.text(g,null,null,e.useHTML).css(e.style).attr({align:this.textAlign,rotation:e.rotation,visibility:"hidden"}).add(a);this.label.labelrank=d.plotHeight},setOffset:function(a,d){var e=this.axis,g=e.chart,m=e.translate(e.usePercentage?100:this.total,0,0,0,1),b=e.translate(0),b=q(m)&&Math.abs(m-b);a=g.xAxis[0].translate(this.x)+a;e=q(m)&&this.getStackBox(g,this,a,m,d,b,e);(d=this.label)&&e&&(d.align(this.alignOptions,
null,e),e=d.alignAttr,d[!1===this.options.crop||g.isInsidePlot(e.x,e.y)?"show":"hide"](!0))},getStackBox:function(a,d,e,g,m,b,c){var p=d.axis.reversed,f=a.inverted;a=c.height+c.pos-(f?a.plotLeft:a.plotTop);d=d.isNegative&&!p||!d.isNegative&&p;return{x:f?d?g:g-b:e,y:f?a-e-m:d?a-g-b:a-g,width:f?b:m,height:f?m:b}}};F.prototype.getStacks=function(){var a=this;f(a.yAxis,function(a){a.stacks&&a.hasVisibleSeries&&(a.oldStacks=a.stacks)});f(a.series,function(d){!d.options.stacking||!0!==d.visible&&!1!==a.options.chart.ignoreHiddenSeries||
(d.stackKey=d.type+r(d.options.stack,""))})};E.prototype.buildStacks=function(){var a=this.series,d=r(this.options.reversedStacks,!0),e=a.length,g;if(!this.isXAxis){this.usePercentage=!1;for(g=e;g--;)a[d?g:e-g-1].setStackedPoints();for(g=0;g<e;g++)a[g].modifyStacks()}};E.prototype.renderStackTotals=function(){var a=this.chart,d=a.renderer,e=this.stacks,g=this.stackTotalGroup;g||(this.stackTotalGroup=g=d.g("stack-labels").attr({visibility:"visible",zIndex:6}).add());g.translate(a.plotLeft,a.plotTop);
C(e,function(a){C(a,function(a){a.render(g)})})};E.prototype.resetStacks=function(){var a=this,d=a.stacks;a.isXAxis||C(d,function(d){C(d,function(e,m){e.touched<a.stacksTouched?(e.destroy(),delete d[m]):(e.total=null,e.cumulative=null)})})};E.prototype.cleanStacks=function(){var a;this.isXAxis||(this.oldStacks&&(a=this.stacks=this.oldStacks),C(a,function(a){C(a,function(a){a.cumulative=a.total})}))};y.prototype.setStackedPoints=function(){if(this.options.stacking&&(!0===this.visible||!1===this.chart.options.chart.ignoreHiddenSeries)){var f=
this.processedXData,d=this.processedYData,e=[],g=d.length,m=this.options,b=m.threshold,c=r(m.startFromThreshold&&b,0),l=m.stack,m=m.stacking,B=this.stackKey,t="-"+B,n=this.negStacks,u=this.yAxis,z=u.stacks,D=u.oldStacks,h,I,H,v,w,k,A;u.stacksTouched+=1;for(w=0;w<g;w++)k=f[w],A=d[w],h=this.getStackIndicator(h,k,this.index),v=h.key,H=(I=n&&A<(c?0:b))?t:B,z[H]||(z[H]={}),z[H][k]||(D[H]&&D[H][k]?(z[H][k]=D[H][k],z[H][k].total=null):z[H][k]=new a.StackItem(u,u.options.stackLabels,I,k,l)),H=z[H][k],null!==
A?(H.points[v]=H.points[this.index]=[r(H.cumulative,c)],q(H.cumulative)||(H.base=v),H.touched=u.stacksTouched,0<h.index&&!1===this.singleStacks&&(H.points[v][0]=H.points[this.index+","+k+",0"][0])):H.points[v]=H.points[this.index]=null,"percent"===m?(I=I?B:t,n&&z[I]&&z[I][k]?(I=z[I][k],H.total=I.total=Math.max(I.total,H.total)+Math.abs(A)||0):H.total=G(H.total+(Math.abs(A)||0))):H.total=G(H.total+(A||0)),H.cumulative=r(H.cumulative,c)+(A||0),null!==A&&(H.points[v].push(H.cumulative),e[w]=H.cumulative);
"percent"===m&&(u.usePercentage=!0);this.stackedYData=e;u.oldStacks={}}};y.prototype.modifyStacks=function(){var a=this,d=a.stackKey,e=a.yAxis.stacks,g=a.processedXData,m,b=a.options.stacking;a[b+"Stacker"]&&f([d,"-"+d],function(c){for(var d=g.length,f,t;d--;)if(f=g[d],m=a.getStackIndicator(m,f,a.index,c),t=(f=e[c]&&e[c][f])&&f.points[m.key])a[b+"Stacker"](t,f,d)})};y.prototype.percentStacker=function(a,d,e){d=d.total?100/d.total:0;a[0]=G(a[0]*d);a[1]=G(a[1]*d);this.stackedYData[e]=a[1]};y.prototype.getStackIndicator=
function(a,d,e,g){!q(a)||a.x!==d||g&&a.key!==g?a={x:d,index:0,key:g}:a.index++;a.key=[e,d,a.index].join();return a}})(J);(function(a){var E=a.addEvent,F=a.animate,G=a.Axis,q=a.createElement,l=a.css,f=a.defined,u=a.each,C=a.erase,r=a.extend,y=a.fireEvent,p=a.inArray,d=a.isNumber,e=a.isObject,g=a.isArray,m=a.merge,b=a.objectEach,c=a.pick,x=a.Point,B=a.Series,t=a.seriesTypes,n=a.setAnimation,L=a.splat;r(a.Chart.prototype,{addSeries:function(a,b,d){var e,h=this;a&&(b=c(b,!0),y(h,"addSeries",{options:a},
function(){e=h.initSeries(a);h.isDirtyLegend=!0;h.linkSeries();y(h,"afterAddSeries");b&&h.redraw(d)}));return e},addAxis:function(a,b,d,e){var h=b?"xAxis":"yAxis",n=this.options;a=m(a,{index:this[h].length,isX:b});b=new G(this,a);n[h]=L(n[h]||{});n[h].push(a);c(d,!0)&&this.redraw(e);return b},showLoading:function(a){var b=this,c=b.options,d=b.loadingDiv,e=c.loading,n=function(){d&&l(d,{left:b.plotLeft+"px",top:b.plotTop+"px",width:b.plotWidth+"px",height:b.plotHeight+"px"})};d||(b.loadingDiv=d=q("div",
{className:"highcharts-loading highcharts-loading-hidden"},null,b.container),b.loadingSpan=q("span",{className:"highcharts-loading-inner"},null,d),E(b,"redraw",n));d.className="highcharts-loading";b.loadingSpan.innerHTML=a||c.lang.loading;l(d,r(e.style,{zIndex:10}));l(b.loadingSpan,e.labelStyle);b.loadingShown||(l(d,{opacity:0,display:""}),F(d,{opacity:e.style.opacity||.5},{duration:e.showDuration||0}));b.loadingShown=!0;n()},hideLoading:function(){var a=this.options,b=this.loadingDiv;b&&(b.className=
"highcharts-loading highcharts-loading-hidden",F(b,{opacity:0},{duration:a.loading.hideDuration||100,complete:function(){l(b,{display:"none"})}}));this.loadingShown=!1},propsRequireDirtyBox:"backgroundColor borderColor borderWidth margin marginTop marginRight marginBottom marginLeft spacing spacingTop spacingRight spacingBottom spacingLeft borderRadius plotBackgroundColor plotBackgroundImage plotBorderColor plotBorderWidth plotShadow shadow".split(" "),propsRequireUpdateSeries:"chart.inverted chart.polar chart.ignoreHiddenSeries chart.type colors plotOptions time tooltip".split(" "),
update:function(a,e,h,n){var g=this,v={credits:"addCredits",title:"setTitle",subtitle:"setSubtitle"},w=a.chart,k,t,z=[];y(g,"update",{options:a});if(w){m(!0,g.options.chart,w);"className"in w&&g.setClassName(w.className);"reflow"in w&&g.setReflow(w.reflow);if("inverted"in w||"polar"in w||"type"in w)g.propFromSeries(),k=!0;"alignTicks"in w&&(k=!0);b(w,function(a,b){-1!==p("chart."+b,g.propsRequireUpdateSeries)&&(t=!0);-1!==p(b,g.propsRequireDirtyBox)&&(g.isDirtyBox=!0)});"style"in w&&g.renderer.setStyle(w.style)}a.colors&&
(this.options.colors=a.colors);a.plotOptions&&m(!0,this.options.plotOptions,a.plotOptions);b(a,function(a,b){if(g[b]&&"function"===typeof g[b].update)g[b].update(a,!1);else if("function"===typeof g[v[b]])g[v[b]](a);"chart"!==b&&-1!==p(b,g.propsRequireUpdateSeries)&&(t=!0)});u("xAxis yAxis zAxis series colorAxis pane".split(" "),function(b){var c;a[b]&&("series"===b&&(c=[],u(g[b],function(a,b){a.options.isInternal||c.push(b)})),u(L(a[b]),function(a,d){(d=f(a.id)&&g.get(a.id)||g[b][c?c[d]:d])&&d.coll===
b&&(d.update(a,!1),h&&(d.touched=!0));if(!d&&h)if("series"===b)g.addSeries(a,!1).touched=!0;else if("xAxis"===b||"yAxis"===b)g.addAxis(a,"xAxis"===b,!1).touched=!0}),h&&u(g[b],function(a){a.touched||a.options.isInternal?delete a.touched:z.push(a)}))});u(z,function(a){a.remove(!1)});k&&u(g.axes,function(a){a.update({},!1)});t&&u(g.series,function(a){a.update({},!1)});a.loading&&m(!0,g.options.loading,a.loading);k=w&&w.width;w=w&&w.height;d(k)&&k!==g.chartWidth||d(w)&&w!==g.chartHeight?g.setSize(k,
w,n):c(e,!0)&&g.redraw(n);y(g,"afterUpdate",{options:a})},setSubtitle:function(a){this.setTitle(void 0,a)}});r(x.prototype,{update:function(a,b,d,g){function h(){n.applyOptions(a);null===n.y&&k&&(n.graphic=k.destroy());e(a,!0)&&(k&&k.element&&a&&a.marker&&void 0!==a.marker.symbol&&(n.graphic=k.destroy()),a&&a.dataLabels&&n.dataLabel&&(n.dataLabel=n.dataLabel.destroy()),n.connector&&(n.connector=n.connector.destroy()));t=n.index;m.updateParallelArrays(n,t);z.data[t]=e(z.data[t],!0)||e(a,!0)?n.options:
c(a,z.data[t]);m.isDirty=m.isDirtyData=!0;!m.fixedBox&&m.hasCartesianSeries&&(f.isDirtyBox=!0);"point"===z.legendType&&(f.isDirtyLegend=!0);b&&f.redraw(d)}var n=this,m=n.series,k=n.graphic,t,f=m.chart,z=m.options;b=c(b,!0);!1===g?h():n.firePointEvent("update",{options:a},h)},remove:function(a,b){this.series.removePoint(p(this,this.series.data),a,b)}});r(B.prototype,{addPoint:function(a,b,d,e){var h=this.options,n=this.data,g=this.chart,k=this.xAxis,k=k&&k.hasNames&&k.names,m=h.data,t,f,z=this.xData,
p,l;b=c(b,!0);t={series:this};this.pointClass.prototype.applyOptions.apply(t,[a]);l=t.x;p=z.length;if(this.requireSorting&&l<z[p-1])for(f=!0;p&&z[p-1]>l;)p--;this.updateParallelArrays(t,"splice",p,0,0);this.updateParallelArrays(t,p);k&&t.name&&(k[l]=t.name);m.splice(p,0,a);f&&(this.data.splice(p,0,null),this.processData());"point"===h.legendType&&this.generatePoints();d&&(n[0]&&n[0].remove?n[0].remove(!1):(n.shift(),this.updateParallelArrays(t,"shift"),m.shift()));this.isDirtyData=this.isDirty=!0;
b&&g.redraw(e)},removePoint:function(a,b,d){var e=this,h=e.data,g=h[a],m=e.points,k=e.chart,t=function(){m&&m.length===h.length&&m.splice(a,1);h.splice(a,1);e.options.data.splice(a,1);e.updateParallelArrays(g||{series:e},"splice",a,1);g&&g.destroy();e.isDirty=!0;e.isDirtyData=!0;b&&k.redraw()};n(d,k);b=c(b,!0);g?g.firePointEvent("remove",null,t):t()},remove:function(a,b,d){function e(){h.destroy();n.isDirtyLegend=n.isDirtyBox=!0;n.linkSeries();c(a,!0)&&n.redraw(b)}var h=this,n=h.chart;!1!==d?y(h,
"remove",null,e):e()},update:function(b,d){var e=this,n=e.chart,g=e.userOptions,v=e.oldType||e.type,w=b.type||g.type||n.options.chart.type,k=t[v].prototype,f,z=["group","markerGroup","dataLabelsGroup"],l=["navigatorSeries","baseSeries"],D=e.finishedAnimating&&{animation:!1},x=["data","name","turboThreshold"],B=a.keys(b),q=0<B.length;u(B,function(a){-1===p(a,x)&&(q=!1)});if(q)b.data&&this.setData(b.data,!1),b.name&&this.setName(b.name,!1);else{l=z.concat(l);u(l,function(a){l[a]=e[a];delete e[a]});
b=m(g,D,{index:e.index,pointStart:c(g.pointStart,e.xData[0])},{data:e.options.data},b);e.remove(!1,null,!1);for(f in k)e[f]=void 0;t[w||v]?r(e,t[w||v].prototype):a.error(17,!0);u(l,function(a){e[a]=l[a]});e.init(n,b);b.zIndex!==g.zIndex&&u(z,function(a){e[a]&&e[a].attr({zIndex:b.zIndex})});e.oldType=v;n.linkSeries()}y(this,"afterUpdate");c(d,!0)&&n.redraw(q?void 0:!1)},setName:function(a){this.name=this.options.name=this.userOptions.name=a;this.chart.isDirtyLegend=!0}});r(G.prototype,{update:function(a,
d){var e=this.chart,n=a&&a.events||{};a=m(this.userOptions,a);e.options[this.coll].indexOf&&(e.options[this.coll][e.options[this.coll].indexOf(this.userOptions)]=a);b(e.options[this.coll].events,function(a,b){"undefined"===typeof n[b]&&(n[b]=void 0)});this.destroy(!0);this.init(e,r(a,{events:n}));e.isDirtyBox=!0;c(d,!0)&&e.redraw()},remove:function(a){for(var b=this.chart,d=this.coll,e=this.series,n=e.length;n--;)e[n]&&e[n].remove(!1);C(b.axes,this);C(b[d],this);g(b.options[d])?b.options[d].splice(this.options.index,
1):delete b.options[d];u(b[d],function(a,b){a.options.index=a.userOptions.index=b});this.destroy();b.isDirtyBox=!0;c(a,!0)&&b.redraw()},setTitle:function(a,b){this.update({title:a},b)},setCategories:function(a,b){this.update({categories:a},b)}})})(J);(function(a){var E=a.color,F=a.each,G=a.map,q=a.pick,l=a.Series,f=a.seriesType;f("area","line",{softThreshold:!1,threshold:0},{singleStacks:!1,getStackPoints:function(f){var l=[],r=[],u=this.xAxis,p=this.yAxis,d=p.stacks[this.stackKey],e={},g=this.index,
m=p.series,b=m.length,c,x=q(p.options.reversedStacks,!0)?1:-1,B;f=f||this.points;if(this.options.stacking){for(B=0;B<f.length;B++)f[B].leftNull=f[B].rightNull=null,e[f[B].x]=f[B];a.objectEach(d,function(a,b){null!==a.total&&r.push(b)});r.sort(function(a,b){return a-b});c=G(m,function(){return this.visible});F(r,function(a,n){var m=0,f,t;if(e[a]&&!e[a].isNull)l.push(e[a]),F([-1,1],function(h){var m=1===h?"rightNull":"leftNull",p=0,v=d[r[n+h]];if(v)for(B=g;0<=B&&B<b;)f=v.points[B],f||(B===g?e[a][m]=
!0:c[B]&&(t=d[a].points[B])&&(p-=t[1]-t[0])),B+=x;e[a][1===h?"rightCliff":"leftCliff"]=p});else{for(B=g;0<=B&&B<b;){if(f=d[a].points[B]){m=f[1];break}B+=x}m=p.translate(m,0,1,0,1);l.push({isNull:!0,plotX:u.translate(a,0,0,0,1),x:a,plotY:m,yBottom:m})}})}return l},getGraphPath:function(a){var f=l.prototype.getGraphPath,r=this.options,u=r.stacking,p=this.yAxis,d,e,g=[],m=[],b=this.index,c,x=p.stacks[this.stackKey],B=r.threshold,t=p.getThreshold(r.threshold),n,r=r.connectNulls||"percent"===u,L=function(d,
e,h){var n=a[d];d=u&&x[n.x].points[b];var f=n[h+"Null"]||0;h=n[h+"Cliff"]||0;var v,w,n=!0;h||f?(v=(f?d[0]:d[1])+h,w=d[0]+h,n=!!f):!u&&a[e]&&a[e].isNull&&(v=w=B);void 0!==v&&(m.push({plotX:c,plotY:null===v?t:p.getThreshold(v),isNull:n,isCliff:!0}),g.push({plotX:c,plotY:null===w?t:p.getThreshold(w),doCurve:!1}))};a=a||this.points;u&&(a=this.getStackPoints(a));for(d=0;d<a.length;d++)if(e=a[d].isNull,c=q(a[d].rectPlotX,a[d].plotX),n=q(a[d].yBottom,t),!e||r)r||L(d,d-1,"left"),e&&!u&&r||(m.push(a[d]),g.push({x:d,
plotX:c,plotY:n})),r||L(d,d+1,"right");d=f.call(this,m,!0,!0);g.reversed=!0;e=f.call(this,g,!0,!0);e.length&&(e[0]="L");e=d.concat(e);f=f.call(this,m,!1,r);e.xMap=d.xMap;this.areaPath=e;return f},drawGraph:function(){this.areaPath=[];l.prototype.drawGraph.apply(this);var a=this,f=this.areaPath,r=this.options,y=[["area","highcharts-area",this.color,r.fillColor]];F(this.zones,function(f,d){y.push(["zone-area-"+d,"highcharts-area highcharts-zone-area-"+d+" "+f.className,f.color||a.color,f.fillColor||
r.fillColor])});F(y,function(p){var d=p[0],e=a[d];e?(e.endX=a.preventGraphAnimation?null:f.xMap,e.animate({d:f})):(e=a[d]=a.chart.renderer.path(f).addClass(p[1]).attr({fill:q(p[3],E(p[2]).setOpacity(q(r.fillOpacity,.75)).get()),zIndex:0}).add(a.group),e.isArea=!0);e.startX=f.xMap;e.shiftUnit=r.step?2:1})},drawLegendSymbol:a.LegendSymbolMixin.drawRectangle})})(J);(function(a){var E=a.pick;a=a.seriesType;a("spline","line",{},{getPointSpline:function(a,G,q){var l=G.plotX,f=G.plotY,u=a[q-1];q=a[q+1];
var C,r,y,p;if(u&&!u.isNull&&!1!==u.doCurve&&!G.isCliff&&q&&!q.isNull&&!1!==q.doCurve&&!G.isCliff){a=u.plotY;y=q.plotX;q=q.plotY;var d=0;C=(1.5*l+u.plotX)/2.5;r=(1.5*f+a)/2.5;y=(1.5*l+y)/2.5;p=(1.5*f+q)/2.5;y!==C&&(d=(p-r)*(y-l)/(y-C)+f-p);r+=d;p+=d;r>a&&r>f?(r=Math.max(a,f),p=2*f-r):r<a&&r<f&&(r=Math.min(a,f),p=2*f-r);p>q&&p>f?(p=Math.max(q,f),r=2*f-p):p<q&&p<f&&(p=Math.min(q,f),r=2*f-p);G.rightContX=y;G.rightContY=p}G=["C",E(u.rightContX,u.plotX),E(u.rightContY,u.plotY),E(C,l),E(r,f),l,f];u.rightContX=
u.rightContY=null;return G}})})(J);(function(a){var E=a.seriesTypes.area.prototype,F=a.seriesType;F("areaspline","spline",a.defaultPlotOptions.area,{getStackPoints:E.getStackPoints,getGraphPath:E.getGraphPath,drawGraph:E.drawGraph,drawLegendSymbol:a.LegendSymbolMixin.drawRectangle})})(J);(function(a){var E=a.animObject,F=a.color,G=a.each,q=a.extend,l=a.isNumber,f=a.merge,u=a.pick,C=a.Series,r=a.seriesType,y=a.svg;r("column","line",{borderRadius:0,crisp:!0,groupPadding:.2,marker:null,pointPadding:.1,
minPointLength:0,cropThreshold:50,pointRange:null,states:{hover:{halo:!1,brightness:.1},select:{color:"#cccccc",borderColor:"#000000"}},dataLabels:{align:null,verticalAlign:null,y:null},softThreshold:!1,startFromThreshold:!0,stickyTracking:!1,tooltip:{distance:6},threshold:0,borderColor:"#ffffff"},{cropShoulder:0,directTouch:!0,trackerGroups:["group","dataLabelsGroup"],negStacks:!0,init:function(){C.prototype.init.apply(this,arguments);var a=this,d=a.chart;d.hasRendered&&G(d.series,function(d){d.type===
a.type&&(d.isDirty=!0)})},getColumnMetrics:function(){var a=this,d=a.options,e=a.xAxis,g=a.yAxis,m=e.options.reversedStacks,m=e.reversed&&!m||!e.reversed&&m,b,c={},f=0;!1===d.grouping?f=1:G(a.chart.series,function(d){var e=d.options,n=d.yAxis,h;d.type!==a.type||!d.visible&&a.chart.options.chart.ignoreHiddenSeries||g.len!==n.len||g.pos!==n.pos||(e.stacking?(b=d.stackKey,void 0===c[b]&&(c[b]=f++),h=c[b]):!1!==e.grouping&&(h=f++),d.columnIndex=h)});var l=Math.min(Math.abs(e.transA)*(e.ordinalSlope||
d.pointRange||e.closestPointRange||e.tickInterval||1),e.len),t=l*d.groupPadding,n=(l-2*t)/(f||1),d=Math.min(d.maxPointWidth||e.len,u(d.pointWidth,n*(1-2*d.pointPadding)));a.columnMetrics={width:d,offset:(n-d)/2+(t+((a.columnIndex||0)+(m?1:0))*n-l/2)*(m?-1:1)};return a.columnMetrics},crispCol:function(a,d,e,g){var m=this.chart,b=this.borderWidth,c=-(b%2?.5:0),b=b%2?.5:1;m.inverted&&m.renderer.isVML&&(b+=1);this.options.crisp&&(e=Math.round(a+e)+c,a=Math.round(a)+c,e-=a);g=Math.round(d+g)+b;c=.5>=Math.abs(d)&&
.5<g;d=Math.round(d)+b;g-=d;c&&g&&(--d,g+=1);return{x:a,y:d,width:e,height:g}},translate:function(){var a=this,d=a.chart,e=a.options,g=a.dense=2>a.closestPointRange*a.xAxis.transA,g=a.borderWidth=u(e.borderWidth,g?0:1),m=a.yAxis,b=e.threshold,c=a.translatedThreshold=m.getThreshold(b),f=u(e.minPointLength,5),l=a.getColumnMetrics(),t=l.width,n=a.barW=Math.max(t,1+2*g),r=a.pointXOffset=l.offset;d.inverted&&(c-=.5);e.pointPadding&&(n=Math.ceil(n));C.prototype.translate.apply(a);G(a.points,function(e){var g=
u(e.yBottom,c),h=999+Math.abs(g),h=Math.min(Math.max(-h,e.plotY),m.len+h),l=e.plotX+r,p=n,v=Math.min(h,g),w,k=Math.max(h,g)-v;f&&Math.abs(k)<f&&(k=f,w=!m.reversed&&!e.negative||m.reversed&&e.negative,e.y===b&&a.dataMax<=b&&m.min<b&&(w=!w),v=Math.abs(v-c)>f?g-f:c-(w?f:0));e.barX=l;e.pointWidth=t;e.tooltipPos=d.inverted?[m.len+m.pos-d.plotLeft-h,a.xAxis.len-l-p/2,k]:[l+p/2,h+m.pos-d.plotTop,k];e.shapeType="rect";e.shapeArgs=a.crispCol.apply(a,e.isNull?[l,c,p,0]:[l,v,p,k])})},getSymbol:a.noop,drawLegendSymbol:a.LegendSymbolMixin.drawRectangle,
drawGraph:function(){this.group[this.dense?"addClass":"removeClass"]("highcharts-dense-data")},pointAttribs:function(a,d){var e=this.options,g,m=this.pointAttrToOptions||{};g=m.stroke||"borderColor";var b=m["stroke-width"]||"borderWidth",c=a&&a.color||this.color,l=a&&a[g]||e[g]||this.color||c,p=a&&a[b]||e[b]||this[b]||0,m=e.dashStyle;a&&this.zones.length&&(c=a.getZone(),c=a.options.color||c&&c.color||this.color);d&&(a=f(e.states[d],a.options.states&&a.options.states[d]||{}),d=a.brightness,c=a.color||
void 0!==d&&F(c).brighten(a.brightness).get()||c,l=a[g]||l,p=a[b]||p,m=a.dashStyle||m);g={fill:c,stroke:l,"stroke-width":p};m&&(g.dashstyle=m);return g},drawPoints:function(){var a=this,d=this.chart,e=a.options,g=d.renderer,m=e.animationLimit||250,b;G(a.points,function(c){var p=c.graphic,B=p&&d.pointCount<m?"animate":"attr";if(l(c.plotY)&&null!==c.y){b=c.shapeArgs;if(p)p[B](f(b));else c.graphic=p=g[c.shapeType](b).add(c.group||a.group);e.borderRadius&&p.attr({r:e.borderRadius});p[B](a.pointAttribs(c,
c.selected&&"select")).shadow(e.shadow,null,e.stacking&&!e.borderRadius);p.addClass(c.getClassName(),!0)}else p&&(c.graphic=p.destroy())})},animate:function(a){var d=this,e=this.yAxis,g=d.options,m=this.chart.inverted,b={},c=m?"translateX":"translateY",f;y&&(a?(b.scaleY=.001,a=Math.min(e.pos+e.len,Math.max(e.pos,e.toPixels(g.threshold))),m?b.translateX=a-e.len:b.translateY=a,d.group.attr(b)):(f=d.group.attr(c),d.group.animate({scaleY:1},q(E(d.options.animation),{step:function(a,g){b[c]=f+g.pos*(e.pos-
f);d.group.attr(b)}})),d.animate=null))},remove:function(){var a=this,d=a.chart;d.hasRendered&&G(d.series,function(d){d.type===a.type&&(d.isDirty=!0)});C.prototype.remove.apply(a,arguments)}})})(J);(function(a){a=a.seriesType;a("bar","column",null,{inverted:!0})})(J);(function(a){var E=a.Series;a=a.seriesType;a("scatter","line",{lineWidth:0,findNearestPointBy:"xy",marker:{enabled:!0},tooltip:{headerFormat:'\x3cspan style\x3d"color:{point.color}"\x3e\u25cf\x3c/span\x3e \x3cspan style\x3d"font-size: 0.85em"\x3e {series.name}\x3c/span\x3e\x3cbr/\x3e',
pointFormat:"x: \x3cb\x3e{point.x}\x3c/b\x3e\x3cbr/\x3ey: \x3cb\x3e{point.y}\x3c/b\x3e\x3cbr/\x3e"}},{sorted:!1,requireSorting:!1,noSharedTooltip:!0,trackerGroups:["group","markerGroup","dataLabelsGroup"],takeOrdinalPosition:!1,drawGraph:function(){this.options.lineWidth&&E.prototype.drawGraph.call(this)}})})(J);(function(a){var E=a.deg2rad,F=a.isNumber,G=a.pick,q=a.relativeLength;a.CenteredSeriesMixin={getCenter:function(){var a=this.options,f=this.chart,u=2*(a.slicedOffset||0),C=f.plotWidth-2*u,
f=f.plotHeight-2*u,r=a.center,r=[G(r[0],"50%"),G(r[1],"50%"),a.size||"100%",a.innerSize||0],y=Math.min(C,f),p,d;for(p=0;4>p;++p)d=r[p],a=2>p||2===p&&/%$/.test(d),r[p]=q(d,[C,f,y,r[2]][p])+(a?u:0);r[3]>r[2]&&(r[3]=r[2]);return r},getStartAndEndRadians:function(a,f){a=F(a)?a:0;f=F(f)&&f>a&&360>f-a?f:a+360;return{start:E*(a+-90),end:E*(f+-90)}}}})(J);(function(a){var E=a.addEvent,F=a.CenteredSeriesMixin,G=a.defined,q=a.each,l=a.extend,f=F.getStartAndEndRadians,u=a.inArray,C=a.noop,r=a.pick,y=a.Point,
p=a.Series,d=a.seriesType,e=a.setAnimation;d("pie","line",{center:[null,null],clip:!1,colorByPoint:!0,dataLabels:{allowOverlap:!0,distance:30,enabled:!0,formatter:function(){return this.point.isNull?void 0:this.point.name},x:0},ignoreHiddenPoint:!0,legendType:"point",marker:null,size:null,showInLegend:!1,slicedOffset:10,stickyTracking:!1,tooltip:{followPointer:!0},borderColor:"#ffffff",borderWidth:1,states:{hover:{brightness:.1}}},{isCartesian:!1,requireSorting:!1,directTouch:!0,noSharedTooltip:!0,
trackerGroups:["group","dataLabelsGroup"],axisTypes:[],pointAttribs:a.seriesTypes.column.prototype.pointAttribs,animate:function(a){var d=this,b=d.points,c=d.startAngleRad;a||(q(b,function(a){var b=a.graphic,e=a.shapeArgs;b&&(b.attr({r:a.startR||d.center[3]/2,start:c,end:c}),b.animate({r:e.r,start:e.start,end:e.end},d.options.animation))}),d.animate=null)},updateTotals:function(){var a,d=0,b=this.points,c=b.length,e,f=this.options.ignoreHiddenPoint;for(a=0;a<c;a++)e=b[a],d+=f&&!e.visible?0:e.isNull?
0:e.y;this.total=d;for(a=0;a<c;a++)e=b[a],e.percentage=0<d&&(e.visible||!f)?e.y/d*100:0,e.total=d},generatePoints:function(){p.prototype.generatePoints.call(this);this.updateTotals()},translate:function(a){this.generatePoints();var d=0,b=this.options,c=b.slicedOffset,e=c+(b.borderWidth||0),g,t,n,l=f(b.startAngle,b.endAngle),z=this.startAngleRad=l.start,l=(this.endAngleRad=l.end)-z,p=this.points,h,q=b.dataLabels.distance,b=b.ignoreHiddenPoint,u,v=p.length,w;a||(this.center=a=this.getCenter());this.getX=
function(b,c,d){n=Math.asin(Math.min((b-a[1])/(a[2]/2+d.labelDistance),1));return a[0]+(c?-1:1)*Math.cos(n)*(a[2]/2+d.labelDistance)};for(u=0;u<v;u++){w=p[u];w.labelDistance=r(w.options.dataLabels&&w.options.dataLabels.distance,q);this.maxLabelDistance=Math.max(this.maxLabelDistance||0,w.labelDistance);g=z+d*l;if(!b||w.visible)d+=w.percentage/100;t=z+d*l;w.shapeType="arc";w.shapeArgs={x:a[0],y:a[1],r:a[2]/2,innerR:a[3]/2,start:Math.round(1E3*g)/1E3,end:Math.round(1E3*t)/1E3};n=(t+g)/2;n>1.5*Math.PI?
n-=2*Math.PI:n<-Math.PI/2&&(n+=2*Math.PI);w.slicedTranslation={translateX:Math.round(Math.cos(n)*c),translateY:Math.round(Math.sin(n)*c)};t=Math.cos(n)*a[2]/2;h=Math.sin(n)*a[2]/2;w.tooltipPos=[a[0]+.7*t,a[1]+.7*h];w.half=n<-Math.PI/2||n>Math.PI/2?1:0;w.angle=n;g=Math.min(e,w.labelDistance/5);w.labelPos=[a[0]+t+Math.cos(n)*w.labelDistance,a[1]+h+Math.sin(n)*w.labelDistance,a[0]+t+Math.cos(n)*g,a[1]+h+Math.sin(n)*g,a[0]+t,a[1]+h,0>w.labelDistance?"center":w.half?"right":"left",n]}},drawGraph:null,
drawPoints:function(){var a=this,d=a.chart.renderer,b,c,e,f,t=a.options.shadow;t&&!a.shadowGroup&&(a.shadowGroup=d.g("shadow").add(a.group));q(a.points,function(n){c=n.graphic;if(n.isNull)c&&(n.graphic=c.destroy());else{f=n.shapeArgs;b=n.getTranslate();var g=n.shadowGroup;t&&!g&&(g=n.shadowGroup=d.g("shadow").add(a.shadowGroup));g&&g.attr(b);e=a.pointAttribs(n,n.selected&&"select");c?c.setRadialReference(a.center).attr(e).animate(l(f,b)):(n.graphic=c=d[n.shapeType](f).setRadialReference(a.center).attr(b).add(a.group),
c.attr(e).attr({"stroke-linejoin":"round"}).shadow(t,g));c.attr({visibility:n.visible?"inherit":"hidden"});c.addClass(n.getClassName())}})},searchPoint:C,sortByAngle:function(a,d){a.sort(function(a,c){return void 0!==a.angle&&(c.angle-a.angle)*d})},drawLegendSymbol:a.LegendSymbolMixin.drawRectangle,getCenter:F.getCenter,getSymbol:C},{init:function(){y.prototype.init.apply(this,arguments);var a=this,d;a.name=r(a.name,"Slice");d=function(b){a.slice("select"===b.type)};E(a,"select",d);E(a,"unselect",
d);return a},isValid:function(){return a.isNumber(this.y,!0)&&0<=this.y},setVisible:function(a,d){var b=this,c=b.series,e=c.chart,g=c.options.ignoreHiddenPoint;d=r(d,g);a!==b.visible&&(b.visible=b.options.visible=a=void 0===a?!b.visible:a,c.options.data[u(b,c.data)]=b.options,q(["graphic","dataLabel","connector","shadowGroup"],function(c){if(b[c])b[c][a?"show":"hide"](!0)}),b.legendItem&&e.legend.colorizeItem(b,a),a||"hover"!==b.state||b.setState(""),g&&(c.isDirty=!0),d&&e.redraw())},slice:function(a,
d,b){var c=this.series;e(b,c.chart);r(d,!0);this.sliced=this.options.sliced=G(a)?a:!this.sliced;c.options.data[u(this,c.data)]=this.options;this.graphic.animate(this.getTranslate());this.shadowGroup&&this.shadowGroup.animate(this.getTranslate())},getTranslate:function(){return this.sliced?this.slicedTranslation:{translateX:0,translateY:0}},haloPath:function(a){var d=this.shapeArgs;return this.sliced||!this.visible?[]:this.series.chart.renderer.symbols.arc(d.x,d.y,d.r+a,d.r+a,{innerR:this.shapeArgs.r-
1,start:d.start,end:d.end})}})})(J);(function(a){var E=a.addEvent,F=a.arrayMax,G=a.defined,q=a.each,l=a.extend,f=a.format,u=a.map,C=a.merge,r=a.noop,y=a.pick,p=a.relativeLength,d=a.Series,e=a.seriesTypes,g=a.some,m=a.stableSort;a.distribute=function(b,c,d){function e(a,b){return a.target-b.target}var f,n=!0,l=b,z=[],p;p=0;var h=l.reducedLen||c;for(f=b.length;f--;)p+=b[f].size;if(p>h){m(b,function(a,b){return(b.rank||0)-(a.rank||0)});for(p=f=0;p<=h;)p+=b[f].size,f++;z=b.splice(f-1,b.length)}m(b,e);
for(b=u(b,function(a){return{size:a.size,targets:[a.target],align:y(a.align,.5)}});n;){for(f=b.length;f--;)n=b[f],p=(Math.min.apply(0,n.targets)+Math.max.apply(0,n.targets))/2,n.pos=Math.min(Math.max(0,p-n.size*n.align),c-n.size);f=b.length;for(n=!1;f--;)0<f&&b[f-1].pos+b[f-1].size>b[f].pos&&(b[f-1].size+=b[f].size,b[f-1].targets=b[f-1].targets.concat(b[f].targets),b[f-1].align=.5,b[f-1].pos+b[f-1].size>c&&(b[f-1].pos=c-b[f-1].size),b.splice(f,1),n=!0)}l.push.apply(l,z);f=0;g(b,function(b){var e=
0;if(g(b.targets,function(){l[f].pos=b.pos+e;if(Math.abs(l[f].pos-l[f].target)>d)return q(l.slice(0,f+1),function(a){delete a.pos}),l.reducedLen=(l.reducedLen||c)-.1*c,l.reducedLen>.1*c&&a.distribute(l,c,d),!0;e+=l[f].size;f++}))return!0});m(l,e)};d.prototype.drawDataLabels=function(){function b(a,b){var c=b.filter;return c?(b=c.operator,a=a[c.property],c=c.value,"\x3e"===b&&a>c||"\x3c"===b&&a<c||"\x3e\x3d"===b&&a>=c||"\x3c\x3d"===b&&a<=c||"\x3d\x3d"===b&&a==c||"\x3d\x3d\x3d"===b&&a===c?!0:!1):!0}
var c=this,d=c.chart,e=c.options,g=e.dataLabels,n=c.points,m,l,p=c.hasRendered||0,h,r,u=y(g.defer,!!e.animation),v=d.renderer;if(g.enabled||c._hasPointLabels)c.dlProcessOptions&&c.dlProcessOptions(g),r=c.plotGroup("dataLabelsGroup","data-labels",u&&!p?"hidden":"visible",g.zIndex||6),u&&(r.attr({opacity:+p}),p||E(c,"afterAnimate",function(){c.visible&&r.show(!0);r[e.animation?"animate":"attr"]({opacity:1},{duration:200})})),l=g,q(n,function(n){var k,w=n.dataLabel,t,p,z=n.connector,D=!w,x;m=n.dlOptions||
n.options&&n.options.dataLabels;(k=y(m&&m.enabled,l.enabled)&&!n.isNull)&&(k=!0===b(n,m||g));k&&(g=C(l,m),t=n.getLabelConfig(),x=g[n.formatPrefix+"Format"]||g.format,h=G(x)?f(x,t,d.time):(g[n.formatPrefix+"Formatter"]||g.formatter).call(t,g),x=g.style,t=g.rotation,x.color=y(g.color,x.color,c.color,"#000000"),"contrast"===x.color&&(n.contrastColor=v.getContrast(n.color||c.color),x.color=g.inside||0>y(n.labelDistance,g.distance)||e.stacking?n.contrastColor:"#000000"),e.cursor&&(x.cursor=e.cursor),p=
{fill:g.backgroundColor,stroke:g.borderColor,"stroke-width":g.borderWidth,r:g.borderRadius||0,rotation:t,padding:g.padding,zIndex:1},a.objectEach(p,function(a,b){void 0===a&&delete p[b]}));!w||k&&G(h)?k&&G(h)&&(w?p.text=h:(w=n.dataLabel=t?v.text(h,0,-9999,g.useHTML).addClass("highcharts-data-label"):v.label(h,0,-9999,g.shape,null,null,g.useHTML,null,"data-label"),w.addClass(" highcharts-data-label-color-"+n.colorIndex+" "+(g.className||"")+(g.useHTML?" highcharts-tracker":""))),w.attr(p),w.css(x).shadow(g.shadow),
w.added||w.add(r),c.alignDataLabel(n,w,g,null,D)):(n.dataLabel=w=w.destroy(),z&&(n.connector=z.destroy()))});a.fireEvent(this,"afterDrawDataLabels")};d.prototype.alignDataLabel=function(a,c,d,e,g){var b=this.chart,m=b.inverted,f=y(a.dlBox&&a.dlBox.centerX,a.plotX,-9999),t=y(a.plotY,-9999),h=c.getBBox(),p,x=d.rotation,v=d.align,w=this.visible&&(a.series.forceDL||b.isInsidePlot(f,Math.round(t),m)||e&&b.isInsidePlot(f,m?e.x+1:e.y+e.height-1,m)),k="justify"===y(d.overflow,"justify");if(w&&(p=d.style.fontSize,
p=b.renderer.fontMetrics(p,c).b,e=l({x:m?this.yAxis.len-t:f,y:Math.round(m?this.xAxis.len-f:t),width:0,height:0},e),l(d,{width:h.width,height:h.height}),x?(k=!1,f=b.renderer.rotCorr(p,x),f={x:e.x+d.x+e.width/2+f.x,y:e.y+d.y+{top:0,middle:.5,bottom:1}[d.verticalAlign]*e.height},c[g?"attr":"animate"](f).attr({align:v}),t=(x+720)%360,t=180<t&&360>t,"left"===v?f.y-=t?h.height:0:"center"===v?(f.x-=h.width/2,f.y-=h.height/2):"right"===v&&(f.x-=h.width,f.y-=t?0:h.height),c.placed=!0,c.alignAttr=f):(c.align(d,
null,e),f=c.alignAttr),k&&0<=e.height?a.isLabelJustified=this.justifyDataLabel(c,d,f,h,e,g):y(d.crop,!0)&&(w=b.isInsidePlot(f.x,f.y)&&b.isInsidePlot(f.x+h.width,f.y+h.height)),d.shape&&!x))c[g?"attr":"animate"]({anchorX:m?b.plotWidth-a.plotY:a.plotX,anchorY:m?b.plotHeight-a.plotX:a.plotY});w||(c.attr({y:-9999}),c.placed=!1)};d.prototype.justifyDataLabel=function(a,c,d,e,g,n){var b=this.chart,f=c.align,m=c.verticalAlign,h,l,t=a.box?0:a.padding||0;h=d.x+t;0>h&&("right"===f?c.align="left":c.x=-h,l=!0);
h=d.x+e.width-t;h>b.plotWidth&&("left"===f?c.align="right":c.x=b.plotWidth-h,l=!0);h=d.y+t;0>h&&("bottom"===m?c.verticalAlign="top":c.y=-h,l=!0);h=d.y+e.height-t;h>b.plotHeight&&("top"===m?c.verticalAlign="bottom":c.y=b.plotHeight-h,l=!0);l&&(a.placed=!n,a.align(c,null,g));return l};e.pie&&(e.pie.prototype.drawDataLabels=function(){var b=this,c=b.data,e,g=b.chart,f=b.options.dataLabels,n=y(f.connectorPadding,10),m=y(f.connectorWidth,1),l=g.plotWidth,p=g.plotHeight,h=Math.round(g.chartWidth/3),r,u=
b.center,v=u[2]/2,w=u[1],k,A,C,E,K=[[],[]],O,N,M,S,R=[0,0,0,0];b.visible&&(f.enabled||b._hasPointLabels)&&(q(c,function(a){a.dataLabel&&a.visible&&a.dataLabel.shortened&&(a.dataLabel.attr({width:"auto"}).css({width:"auto",textOverflow:"clip"}),a.dataLabel.shortened=!1)}),d.prototype.drawDataLabels.apply(b),q(c,function(a){a.dataLabel&&(a.visible?(K[a.half].push(a),a.dataLabel._pos=null,!G(f.style.width)&&!G(a.options.dataLabels&&a.options.dataLabels.style&&a.options.dataLabels.style.width)&&a.dataLabel.getBBox().width>
h&&(a.dataLabel.css({width:.7*h}),a.dataLabel.shortened=!0)):a.dataLabel=a.dataLabel.destroy())}),q(K,function(c,d){var h,m,t=c.length,z=[],D;if(t)for(b.sortByAngle(c,d-.5),0<b.maxLabelDistance&&(h=Math.max(0,w-v-b.maxLabelDistance),m=Math.min(w+v+b.maxLabelDistance,g.plotHeight),q(c,function(a){0<a.labelDistance&&a.dataLabel&&(a.top=Math.max(0,w-v-a.labelDistance),a.bottom=Math.min(w+v+a.labelDistance,g.plotHeight),D=a.dataLabel.getBBox().height||21,a.distributeBox={target:a.labelPos[1]-a.top+D/
2,size:D,rank:a.y},z.push(a.distributeBox))}),h=m+D-h,a.distribute(z,h,h/5)),S=0;S<t;S++)e=c[S],C=e.labelPos,k=e.dataLabel,M=!1===e.visible?"hidden":"inherit",N=h=C[1],z&&G(e.distributeBox)&&(void 0===e.distributeBox.pos?M="hidden":(E=e.distributeBox.size,N=e.top+e.distributeBox.pos)),delete e.positionIndex,O=f.justify?u[0]+(d?-1:1)*(v+e.labelDistance):b.getX(N<e.top+2||N>e.bottom-2?h:N,d,e),k._attr={visibility:M,align:C[6]},k._pos={x:O+f.x+({left:n,right:-n}[C[6]]||0),y:N+f.y-10},C.x=O,C.y=N,y(f.crop,
!0)&&(A=k.getBBox().width,h=null,O-A<n&&1===d?(h=Math.round(A-O+n),R[3]=Math.max(h,R[3])):O+A>l-n&&0===d&&(h=Math.round(O+A-l+n),R[1]=Math.max(h,R[1])),0>N-E/2?R[0]=Math.max(Math.round(-N+E/2),R[0]):N+E/2>p&&(R[2]=Math.max(Math.round(N+E/2-p),R[2])),k.sideOverflow=h)}),0===F(R)||this.verifyDataLabelOverflow(R))&&(this.placeDataLabels(),m&&q(this.points,function(a){var c;r=a.connector;if((k=a.dataLabel)&&k._pos&&a.visible&&0<a.labelDistance){M=k._attr.visibility;if(c=!r)a.connector=r=g.renderer.path().addClass("highcharts-data-label-connector  highcharts-color-"+
a.colorIndex+(a.className?" "+a.className:"")).add(b.dataLabelsGroup),r.attr({"stroke-width":m,stroke:f.connectorColor||a.color||"#666666"});r[c?"attr":"animate"]({d:b.connectorPath(a.labelPos)});r.attr("visibility",M)}else r&&(a.connector=r.destroy())}))},e.pie.prototype.connectorPath=function(a){var b=a.x,d=a.y;return y(this.options.dataLabels.softConnector,!0)?["M",b+("left"===a[6]?5:-5),d,"C",b,d,2*a[2]-a[4],2*a[3]-a[5],a[2],a[3],"L",a[4],a[5]]:["M",b+("left"===a[6]?5:-5),d,"L",a[2],a[3],"L",
a[4],a[5]]},e.pie.prototype.placeDataLabels=function(){q(this.points,function(a){var b=a.dataLabel;b&&a.visible&&((a=b._pos)?(b.sideOverflow&&(b._attr.width=b.getBBox().width-b.sideOverflow,b.css({width:b._attr.width+"px",textOverflow:(this.options.dataLabels.style||{}).textOverflow||"ellipsis"}),b.shortened=!0),b.attr(b._attr),b[b.moved?"animate":"attr"](a),b.moved=!0):b&&b.attr({y:-9999}))},this)},e.pie.prototype.alignDataLabel=r,e.pie.prototype.verifyDataLabelOverflow=function(a){var b=this.center,
d=this.options,e=d.center,g=d.minSize||80,n,f=null!==d.size;f||(null!==e[0]?n=Math.max(b[2]-Math.max(a[1],a[3]),g):(n=Math.max(b[2]-a[1]-a[3],g),b[0]+=(a[3]-a[1])/2),null!==e[1]?n=Math.max(Math.min(n,b[2]-Math.max(a[0],a[2])),g):(n=Math.max(Math.min(n,b[2]-a[0]-a[2]),g),b[1]+=(a[0]-a[2])/2),n<b[2]?(b[2]=n,b[3]=Math.min(p(d.innerSize||0,n),n),this.translate(b),this.drawDataLabels&&this.drawDataLabels()):f=!0);return f});e.column&&(e.column.prototype.alignDataLabel=function(a,c,e,g,f){var b=this.chart.inverted,
m=a.series,l=a.dlBox||a.shapeArgs,p=y(a.below,a.plotY>y(this.translatedThreshold,m.yAxis.len)),h=y(e.inside,!!this.options.stacking);l&&(g=C(l),0>g.y&&(g.height+=g.y,g.y=0),l=g.y+g.height-m.yAxis.len,0<l&&(g.height-=l),b&&(g={x:m.yAxis.len-g.y-g.height,y:m.xAxis.len-g.x-g.width,width:g.height,height:g.width}),h||(b?(g.x+=p?0:g.width,g.width=0):(g.y+=p?g.height:0,g.height=0)));e.align=y(e.align,!b||h?"center":p?"right":"left");e.verticalAlign=y(e.verticalAlign,b||h?"middle":p?"top":"bottom");d.prototype.alignDataLabel.call(this,
a,c,e,g,f);a.isLabelJustified&&a.contrastColor&&a.dataLabel.css({color:a.contrastColor})})})(J);(function(a){var E=a.Chart,F=a.each,G=a.objectEach,q=a.pick;a=a.addEvent;a(E,"render",function(){var a=[];F(this.labelCollectors||[],function(f){a=a.concat(f())});F(this.yAxis||[],function(f){f.options.stackLabels&&!f.options.stackLabels.allowOverlap&&G(f.stacks,function(f){G(f,function(f){a.push(f.label)})})});F(this.series||[],function(f){var l=f.options.dataLabels,C=f.dataLabelCollections||["dataLabel"];
(l.enabled||f._hasPointLabels)&&!l.allowOverlap&&f.visible&&F(C,function(l){F(f.points,function(f){f[l]&&f.visible&&(f[l].labelrank=q(f.labelrank,f.shapeArgs&&f.shapeArgs.height),a.push(f[l]))})})});this.hideOverlappingLabels(a)});E.prototype.hideOverlappingLabels=function(a){var f=a.length,l=this.renderer,q,r,y,p,d,e,g=function(a,b,c,d,e,g,n,f){return!(e>a+c||e+n<a||g>b+d||g+f<b)};y=function(a){var b,c,d,e=2*(a.box?0:a.padding||0);d=0;if(a&&(!a.alignAttr||a.placed))return b=a.alignAttr||{x:a.attr("x"),
y:a.attr("y")},c=a.parentGroup,a.width||(d=a.getBBox(),a.width=d.width,a.height=d.height,d=l.fontMetrics(null,a.element).h),{x:b.x+(c.translateX||0),y:b.y+(c.translateY||0)-d,width:a.width-e,height:a.height-e}};for(r=0;r<f;r++)if(q=a[r])q.oldOpacity=q.opacity,q.newOpacity=1,q.absoluteBox=y(q);a.sort(function(a,b){return(b.labelrank||0)-(a.labelrank||0)});for(r=0;r<f;r++)for(e=(y=a[r])&&y.absoluteBox,q=r+1;q<f;++q)if(d=(p=a[q])&&p.absoluteBox,e&&d&&y!==p&&0!==y.newOpacity&&0!==p.newOpacity&&(d=g(e.x,
e.y,e.width,e.height,d.x,d.y,d.width,d.height)))(y.labelrank<p.labelrank?y:p).newOpacity=0;F(a,function(a){var b,c;a&&(c=a.newOpacity,a.oldOpacity!==c&&(a.alignAttr&&a.placed?(c?a.show(!0):b=function(){a.hide()},a.alignAttr.opacity=c,a[a.isOld?"animate":"attr"](a.alignAttr,null,b)):a.attr({opacity:c})),a.isOld=!0)})}})(J);(function(a){var E=a.addEvent,F=a.Chart,G=a.createElement,q=a.css,l=a.defaultOptions,f=a.defaultPlotOptions,u=a.each,C=a.extend,r=a.fireEvent,y=a.hasTouch,p=a.inArray,d=a.isObject,
e=a.Legend,g=a.merge,m=a.pick,b=a.Point,c=a.Series,x=a.seriesTypes,B=a.svg,t;t=a.TrackerMixin={drawTrackerPoint:function(){var a=this,b=a.chart.pointer,c=function(a){var c=b.getPointFromEvent(a);void 0!==c&&(b.isDirectTouch=!0,c.onMouseOver(a))};u(a.points,function(a){a.graphic&&(a.graphic.element.point=a);a.dataLabel&&(a.dataLabel.div?a.dataLabel.div.point=a:a.dataLabel.element.point=a)});a._hasTracking||(u(a.trackerGroups,function(d){if(a[d]){a[d].addClass("highcharts-tracker").on("mouseover",c).on("mouseout",
function(a){b.onTrackerMouseOut(a)});if(y)a[d].on("touchstart",c);a.options.cursor&&a[d].css(q).css({cursor:a.options.cursor})}}),a._hasTracking=!0);r(this,"afterDrawTracker")},drawTrackerGraph:function(){var a=this,b=a.options,c=b.trackByArea,d=[].concat(c?a.areaPath:a.graphPath),e=d.length,g=a.chart,f=g.pointer,m=g.renderer,w=g.options.tooltip.snap,k=a.tracker,l,p=function(){if(g.hoverSeries!==a)a.onMouseOver()},t="rgba(192,192,192,"+(B?.0001:.002)+")";if(e&&!c)for(l=e+1;l--;)"M"===d[l]&&d.splice(l+
1,0,d[l+1]-w,d[l+2],"L"),(l&&"M"===d[l]||l===e)&&d.splice(l,0,"L",d[l-2]+w,d[l-1]);k?k.attr({d:d}):a.graph&&(a.tracker=m.path(d).attr({"stroke-linejoin":"round",stroke:t,fill:c?t:"none","stroke-width":a.graph.strokeWidth()+(c?0:2*w),visibility:a.visible?"visible":"hidden",zIndex:2}).addClass(c?"highcharts-tracker-area":"highcharts-tracker-line").add(a.group),u([a.tracker,a.markerGroup],function(a){a.addClass("highcharts-tracker").on("mouseover",p).on("mouseout",function(a){f.onTrackerMouseOut(a)});
b.cursor&&a.css({cursor:b.cursor});if(y)a.on("touchstart",p)}));r(this,"afterDrawTracker")}};x.column&&(x.column.prototype.drawTracker=t.drawTrackerPoint);x.pie&&(x.pie.prototype.drawTracker=t.drawTrackerPoint);x.scatter&&(x.scatter.prototype.drawTracker=t.drawTrackerPoint);C(e.prototype,{setItemEvents:function(a,c,d){var e=this,h=e.chart.renderer.boxWrapper,n="highcharts-legend-"+(a instanceof b?"point":"series")+"-active";(d?c:a.legendGroup).on("mouseover",function(){a.setState("hover");h.addClass(n);
c.css(e.options.itemHoverStyle)}).on("mouseout",function(){c.css(g(a.visible?e.itemStyle:e.itemHiddenStyle));h.removeClass(n);a.setState()}).on("click",function(b){var c=function(){a.setVisible&&a.setVisible()};h.removeClass(n);b={browserEvent:b};a.firePointEvent?a.firePointEvent("legendItemClick",b,c):r(a,"legendItemClick",b,c)})},createCheckboxForItem:function(a){a.checkbox=G("input",{type:"checkbox",className:"highcharts-legend-checkbox",checked:a.selected,defaultChecked:a.selected},this.options.itemCheckboxStyle,
this.chart.container);E(a.checkbox,"click",function(b){r(a.series||a,"checkboxClick",{checked:b.target.checked,item:a},function(){a.select()})})}});l.legend.itemStyle.cursor="pointer";C(F.prototype,{showResetZoom:function(){function a(){b.zoomOut()}var b=this,c=l.lang,d=b.options.chart.resetZoomButton,e=d.theme,g=e.states,f="chart"===d.relativeTo?null:"plotBox";r(this,"beforeShowResetZoom",null,function(){b.resetZoomButton=b.renderer.button(c.resetZoom,null,null,a,e,g&&g.hover).attr({align:d.position.align,
title:c.resetZoomTitle}).addClass("highcharts-reset-zoom").add().align(d.position,!1,f)})},zoomOut:function(){r(this,"selection",{resetSelection:!0},this.zoom)},zoom:function(a){var b,c=this.pointer,e=!1,h;!a||a.resetSelection?(u(this.axes,function(a){b=a.zoom()}),c.initiated=!1):u(a.xAxis.concat(a.yAxis),function(a){var d=a.axis;c[d.isXAxis?"zoomX":"zoomY"]&&(b=d.zoom(a.min,a.max),d.displayBtn&&(e=!0))});h=this.resetZoomButton;e&&!h?this.showResetZoom():!e&&d(h)&&(this.resetZoomButton=h.destroy());
b&&this.redraw(m(this.options.chart.animation,a&&a.animation,100>this.pointCount))},pan:function(a,b){var c=this,d=c.hoverPoints,e;d&&u(d,function(a){a.setState()});u("xy"===b?[1,0]:[1],function(b){b=c[b?"xAxis":"yAxis"][0];var d=b.horiz,h=a[d?"chartX":"chartY"],d=d?"mouseDownX":"mouseDownY",g=c[d],k=(b.pointRange||0)/2,n=b.reversed&&!c.inverted||!b.reversed&&c.inverted?-1:1,f=b.getExtremes(),m=b.toValue(g-h,!0)+k*n,n=b.toValue(g+b.len-h,!0)-k*n,l=n<m,g=l?n:m,m=l?m:n,n=Math.min(f.dataMin,k?f.min:
b.toValue(b.toPixels(f.min)-b.minPixelPadding)),k=Math.max(f.dataMax,k?f.max:b.toValue(b.toPixels(f.max)+b.minPixelPadding)),l=n-g;0<l&&(m+=l,g=n);l=m-k;0<l&&(m=k,g-=l);b.series.length&&g!==f.min&&m!==f.max&&(b.setExtremes(g,m,!1,!1,{trigger:"pan"}),e=!0);c[d]=h});e&&c.redraw(!1);q(c.container,{cursor:"move"})}});C(b.prototype,{select:function(a,b){var c=this,d=c.series,e=d.chart;a=m(a,!c.selected);c.firePointEvent(a?"select":"unselect",{accumulate:b},function(){c.selected=c.options.selected=a;d.options.data[p(c,
d.data)]=c.options;c.setState(a&&"select");b||u(e.getSelectedPoints(),function(a){a.selected&&a!==c&&(a.selected=a.options.selected=!1,d.options.data[p(a,d.data)]=a.options,a.setState(""),a.firePointEvent("unselect"))})})},onMouseOver:function(a){var b=this.series.chart,c=b.pointer;a=a?c.normalize(a):c.getChartCoordinatesFromPoint(this,b.inverted);c.runPointActions(a,this)},onMouseOut:function(){var a=this.series.chart;this.firePointEvent("mouseOut");u(a.hoverPoints||[],function(a){a.setState()});
a.hoverPoints=a.hoverPoint=null},importEvents:function(){if(!this.hasImportedEvents){var b=this,c=g(b.series.options.point,b.options).events;b.events=c;a.objectEach(c,function(a,c){E(b,c,a)});this.hasImportedEvents=!0}},setState:function(a,b){var c=Math.floor(this.plotX),d=this.plotY,e=this.series,g=e.options.states[a||"normal"]||{},n=f[e.type].marker&&e.options.marker,v=n&&!1===n.enabled,l=n&&n.states&&n.states[a||"normal"]||{},k=!1===l.enabled,p=e.stateMarkerGraphic,t=this.marker||{},x=e.chart,
q=e.halo,B,u=n&&e.markerAttribs;a=a||"";if(!(a===this.state&&!b||this.selected&&"select"!==a||!1===g.enabled||a&&(k||v&&!1===l.enabled)||a&&t.states&&t.states[a]&&!1===t.states[a].enabled)){u&&(B=e.markerAttribs(this,a));if(this.graphic)this.state&&this.graphic.removeClass("highcharts-point-"+this.state),a&&this.graphic.addClass("highcharts-point-"+a),this.graphic.animate(e.pointAttribs(this,a),m(x.options.chart.animation,g.animation)),B&&this.graphic.animate(B,m(x.options.chart.animation,l.animation,
n.animation)),p&&p.hide();else{if(a&&l){n=t.symbol||e.symbol;p&&p.currentSymbol!==n&&(p=p.destroy());if(p)p[b?"animate":"attr"]({x:B.x,y:B.y});else n&&(e.stateMarkerGraphic=p=x.renderer.symbol(n,B.x,B.y,B.width,B.height).add(e.markerGroup),p.currentSymbol=n);p&&p.attr(e.pointAttribs(this,a))}p&&(p[a&&x.isInsidePlot(c,d,x.inverted)?"show":"hide"](),p.element.point=this)}(c=g.halo)&&c.size?(q||(e.halo=q=x.renderer.path().add((this.graphic||p).parentGroup)),q.show()[b?"animate":"attr"]({d:this.haloPath(c.size)}),
q.attr({"class":"highcharts-halo highcharts-color-"+m(this.colorIndex,e.colorIndex)+(this.className?" "+this.className:""),zIndex:-1}),q.point=this,q.attr(C({fill:this.color||e.color,"fill-opacity":c.opacity},c.attributes))):q&&q.point&&q.point.haloPath&&q.animate({d:q.point.haloPath(0)},null,q.hide);this.state=a;r(this,"afterSetState")}},haloPath:function(a){return this.series.chart.renderer.symbols.circle(Math.floor(this.plotX)-a,this.plotY-a,2*a,2*a)}});C(c.prototype,{onMouseOver:function(){var a=
this.chart,b=a.hoverSeries;if(b&&b!==this)b.onMouseOut();this.options.events.mouseOver&&r(this,"mouseOver");this.setState("hover");a.hoverSeries=this},onMouseOut:function(){var a=this.options,b=this.chart,c=b.tooltip,d=b.hoverPoint;b.hoverSeries=null;if(d)d.onMouseOut();this&&a.events.mouseOut&&r(this,"mouseOut");!c||this.stickyTracking||c.shared&&!this.noSharedTooltip||c.hide();this.setState()},setState:function(a){var b=this,c=b.options,d=b.graph,e=c.states,g=c.lineWidth,c=0;a=a||"";if(b.state!==
a&&(u([b.group,b.markerGroup,b.dataLabelsGroup],function(c){c&&(b.state&&c.removeClass("highcharts-series-"+b.state),a&&c.addClass("highcharts-series-"+a))}),b.state=a,!e[a]||!1!==e[a].enabled)&&(a&&(g=e[a].lineWidth||g+(e[a].lineWidthPlus||0)),d&&!d.dashstyle))for(g={"stroke-width":g},d.animate(g,m(e[a||"normal"]&&e[a||"normal"].animation,b.chart.options.chart.animation));b["zone-graph-"+c];)b["zone-graph-"+c].attr(g),c+=1},setVisible:function(a,b){var c=this,d=c.chart,e=c.legendItem,g,f=d.options.chart.ignoreHiddenSeries,
n=c.visible;g=(c.visible=a=c.options.visible=c.userOptions.visible=void 0===a?!n:a)?"show":"hide";u(["group","dataLabelsGroup","markerGroup","tracker","tt"],function(a){if(c[a])c[a][g]()});if(d.hoverSeries===c||(d.hoverPoint&&d.hoverPoint.series)===c)c.onMouseOut();e&&d.legend.colorizeItem(c,a);c.isDirty=!0;c.options.stacking&&u(d.series,function(a){a.options.stacking&&a.visible&&(a.isDirty=!0)});u(c.linkedSeries,function(b){b.setVisible(a,!1)});f&&(d.isDirtyBox=!0);r(c,g);!1!==b&&d.redraw()},show:function(){this.setVisible(!0)},
hide:function(){this.setVisible(!1)},select:function(a){this.selected=a=void 0===a?!this.selected:a;this.checkbox&&(this.checkbox.checked=a);r(this,a?"select":"unselect")},drawTracker:t.drawTrackerGraph})})(J);(function(a){var E=a.Chart,F=a.each,G=a.inArray,q=a.isArray,l=a.isObject,f=a.pick,u=a.splat;E.prototype.setResponsive=function(f){var l=this.options.responsive,q=[],p=this.currentResponsive;l&&l.rules&&F(l.rules,function(d){void 0===d._id&&(d._id=a.uniqueKey());this.matchResponsiveRule(d,q,
f)},this);var d=a.merge.apply(0,a.map(q,function(d){return a.find(l.rules,function(a){return a._id===d}).chartOptions})),q=q.toString()||void 0;q!==(p&&p.ruleIds)&&(p&&this.update(p.undoOptions,f),q?(this.currentResponsive={ruleIds:q,mergedOptions:d,undoOptions:this.currentOptions(d)},this.update(d,f)):this.currentResponsive=void 0)};E.prototype.matchResponsiveRule=function(a,l){var q=a.condition;(q.callback||function(){return this.chartWidth<=f(q.maxWidth,Number.MAX_VALUE)&&this.chartHeight<=f(q.maxHeight,
Number.MAX_VALUE)&&this.chartWidth>=f(q.minWidth,0)&&this.chartHeight>=f(q.minHeight,0)}).call(this)&&l.push(a._id)};E.prototype.currentOptions=function(f){function r(f,d,e,g){var m;a.objectEach(f,function(a,c){if(!g&&-1<G(c,["series","xAxis","yAxis"]))for(a=u(a),e[c]=[],m=0;m<a.length;m++)d[c][m]&&(e[c][m]={},r(a[m],d[c][m],e[c][m],g+1));else l(a)?(e[c]=q(a)?[]:{},r(a,d[c]||{},e[c],g+1)):e[c]=d[c]||null})}var y={};r(f,this.options,y,0);return y}})(J);(function(a){var E=a.addEvent,F=a.Axis,G=a.Chart,
q=a.css,l=a.defined,f=a.each,u=a.extend,C=a.noop,r=a.pick,y=a.timeUnits,p=a.wrap;p(a.Series.prototype,"init",function(a){var d;a.apply(this,Array.prototype.slice.call(arguments,1));(d=this.xAxis)&&d.options.ordinal&&E(this,"updatedData",function(){delete d.ordinalIndex})});p(F.prototype,"getTimeTicks",function(a,e,g,f,b,c,p,q){var d=0,n,m,x={},r,h,B,u=[],v=-Number.MAX_VALUE,w=this.options.tickPixelInterval,k=this.chart.time;if(!this.options.ordinal&&!this.options.breaks||!c||3>c.length||void 0===
g)return a.call(this,e,g,f,b);h=c.length;for(n=0;n<h;n++){B=n&&c[n-1]>f;c[n]<g&&(d=n);if(n===h-1||c[n+1]-c[n]>5*p||B){if(c[n]>v){for(m=a.call(this,e,c[d],c[n],b);m.length&&m[0]<=v;)m.shift();m.length&&(v=m[m.length-1]);u=u.concat(m)}d=n+1}if(B)break}a=m.info;if(q&&a.unitRange<=y.hour){n=u.length-1;for(d=1;d<n;d++)k.dateFormat("%d",u[d])!==k.dateFormat("%d",u[d-1])&&(x[u[d]]="day",r=!0);r&&(x[u[0]]="day");a.higherRanks=x}u.info=a;if(q&&l(w)){q=k=u.length;n=[];var A;for(r=[];q--;)d=this.translate(u[q]),
A&&(r[q]=A-d),n[q]=A=d;r.sort();r=r[Math.floor(r.length/2)];r<.6*w&&(r=null);q=u[k-1]>f?k-1:k;for(A=void 0;q--;)d=n[q],f=Math.abs(A-d),A&&f<.8*w&&(null===r||f<.8*r)?(x[u[q]]&&!x[u[q+1]]?(f=q+1,A=d):f=q,u.splice(f,1)):A=d}return u});u(F.prototype,{beforeSetTickPositions:function(){var a,e=[],g,m=!1,b,c=this.getExtremes(),p=c.min,q=c.max,t,n=this.isXAxis&&!!this.options.breaks,c=this.options.ordinal,u=Number.MAX_VALUE,z=this.chart.options.chart.ignoreHiddenSeries;b="highcharts-navigator-xaxis"===this.options.className;
var D;!this.options.overscroll||this.max!==this.dataMax||this.chart.mouseIsDown&&!b||this.eventArgs&&(!this.eventArgs||"navigator"===this.eventArgs.trigger)||(this.max+=this.options.overscroll,!b&&l(this.userMin)&&(this.min+=this.options.overscroll));if(c||n){f(this.series,function(b,c){g=[];if(!(z&&!1===b.visible||!1===b.takeOrdinalPosition&&!n)&&(e=e.concat(b.processedXData),a=e.length,e.sort(function(a,b){return a-b}),u=Math.min(u,r(b.closestPointRange,u)),a)){for(c=0;c<a-1;)e[c]!==e[c+1]&&g.push(e[c+
1]),c++;g[0]!==e[0]&&g.unshift(e[0]);e=g}b.isSeriesBoosting&&(D=!0)});D&&(e.length=0);a=e.length;if(2<a){b=e[1]-e[0];for(t=a-1;t--&&!m;)e[t+1]-e[t]!==b&&(m=!0);!this.options.keepOrdinalPadding&&(e[0]-p>b||q-e[e.length-1]>b)&&(m=!0)}else this.options.overscroll&&(2===a?u=e[1]-e[0]:1===a?(u=this.options.overscroll,e=[e[0],e[0]+u]):u=this.overscrollPointsRange);m?(this.options.overscroll&&(this.overscrollPointsRange=u,e=e.concat(this.getOverscrollPositions())),this.ordinalPositions=e,b=this.ordinal2lin(Math.max(p,
e[0]),!0),t=Math.max(this.ordinal2lin(Math.min(q,e[e.length-1]),!0),1),this.ordinalSlope=q=(q-p)/(t-b),this.ordinalOffset=p-b*q):(this.overscrollPointsRange=r(this.closestPointRange,this.overscrollPointsRange),this.ordinalPositions=this.ordinalSlope=this.ordinalOffset=void 0)}this.isOrdinal=c&&m;this.groupIntervalFactor=null},val2lin:function(a,e){var d=this.ordinalPositions;if(d){var f=d.length,b,c;for(b=f;b--;)if(d[b]===a){c=b;break}for(b=f-1;b--;)if(a>d[b]||0===b){a=(a-d[b])/(d[b+1]-d[b]);c=b+
a;break}e=e?c:this.ordinalSlope*(c||0)+this.ordinalOffset}else e=a;return e},lin2val:function(a,e){var d=this.ordinalPositions;if(d){var f=this.ordinalSlope,b=this.ordinalOffset,c=d.length-1,l;if(e)0>a?a=d[0]:a>c?a=d[c]:(c=Math.floor(a),l=a-c);else for(;c--;)if(e=f*c+b,a>=e){f=f*(c+1)+b;l=(a-e)/(f-e);break}return void 0!==l&&void 0!==d[c]?d[c]+(l?l*(d[c+1]-d[c]):0):a}return a},getExtendedPositions:function(){var a=this,e=a.chart,g=a.series[0].currentDataGrouping,m=a.ordinalIndex,b=g?g.count+g.unitName:
"raw",c=a.options.overscroll,l=a.getExtremes(),p,t;m||(m=a.ordinalIndex={});m[b]||(p={series:[],chart:e,getExtremes:function(){return{min:l.dataMin,max:l.dataMax+c}},options:{ordinal:!0},val2lin:F.prototype.val2lin,ordinal2lin:F.prototype.ordinal2lin},f(a.series,function(b){t={xAxis:p,xData:b.xData.slice(),chart:e,destroyGroupedData:C};t.xData=t.xData.concat(a.getOverscrollPositions());t.options={dataGrouping:g?{enabled:!0,forced:!0,approximation:"open",units:[[g.unitName,[g.count]]]}:{enabled:!1}};
b.processData.apply(t);p.series.push(t)}),a.beforeSetTickPositions.apply(p),m[b]=p.ordinalPositions);return m[b]},getOverscrollPositions:function(){var d=this.options.overscroll,e=this.overscrollPointsRange,g=[],f=this.dataMax;if(a.defined(e))for(g.push(f);f<=this.dataMax+d;)f+=e,g.push(f);return g},getGroupIntervalFactor:function(a,e,g){var d;g=g.processedXData;var b=g.length,c=[];d=this.groupIntervalFactor;if(!d){for(d=0;d<b-1;d++)c[d]=g[d+1]-g[d];c.sort(function(a,b){return a-b});c=c[Math.floor(b/
2)];a=Math.max(a,g[0]);e=Math.min(e,g[b-1]);this.groupIntervalFactor=d=b*c/(e-a)}return d},postProcessTickInterval:function(a){var d=this.ordinalSlope;return d?this.options.breaks?this.closestPointRange||a:a/(d/this.closestPointRange):a}});F.prototype.ordinal2lin=F.prototype.val2lin;p(G.prototype,"pan",function(a,e){var d=this.xAxis[0],m=d.options.overscroll,b=e.chartX,c=!1;if(d.options.ordinal&&d.series.length){var l=this.mouseDownX,p=d.getExtremes(),t=p.dataMax,n=p.min,r=p.max,z=this.hoverPoints,
D=d.closestPointRange||d.overscrollPointsRange,l=(l-b)/(d.translationSlope*(d.ordinalSlope||D)),h={ordinalPositions:d.getExtendedPositions()},D=d.lin2val,u=d.val2lin,y;h.ordinalPositions?1<Math.abs(l)&&(z&&f(z,function(a){a.setState()}),0>l?(z=h,y=d.ordinalPositions?d:h):(z=d.ordinalPositions?d:h,y=h),h=y.ordinalPositions,t>h[h.length-1]&&h.push(t),this.fixedRange=r-n,l=d.toFixedRange(null,null,D.apply(z,[u.apply(z,[n,!0])+l,!0]),D.apply(y,[u.apply(y,[r,!0])+l,!0])),l.min>=Math.min(p.dataMin,n)&&
l.max<=Math.max(t,r)+m&&d.setExtremes(l.min,l.max,!0,!1,{trigger:"pan"}),this.mouseDownX=b,q(this.container,{cursor:"move"})):c=!0}else c=!0;c&&(m&&(d.max=d.dataMax+m),a.apply(this,Array.prototype.slice.call(arguments,1)))})})(J);(function(a){function E(){return Array.prototype.slice.call(arguments,1)}function F(a){a.apply(this);this.drawBreaks(this.xAxis,["x"]);this.drawBreaks(this.yAxis,q(this.pointArrayMap,["y"]))}var G=a.addEvent,q=a.pick,l=a.wrap,f=a.each,u=a.extend,C=a.isArray,r=a.fireEvent,
y=a.Axis,p=a.Series;u(y.prototype,{isInBreak:function(a,e){var d=a.repeat||Infinity,f=a.from,b=a.to-a.from;e=e>=f?(e-f)%d:d-(f-e)%d;return a.inclusive?e<=b:e<b&&0!==e},isInAnyBreak:function(a,e){var d=this.options.breaks,f=d&&d.length,b,c,l;if(f){for(;f--;)this.isInBreak(d[f],a)&&(b=!0,c||(c=q(d[f].showPoints,this.isXAxis?!1:!0)));l=b&&e?b&&!c:b}return l}});G(y,"afterSetTickPositions",function(){if(this.options.breaks){var a=this.tickPositions,e=this.tickPositions.info,g=[],f;for(f=0;f<a.length;f++)this.isInAnyBreak(a[f])||
g.push(a[f]);this.tickPositions=g;this.tickPositions.info=e}});G(y,"afterSetOptions",function(){this.options.breaks&&this.options.breaks.length&&(this.options.ordinal=!1)});G(y,"afterInit",function(){var a=this,e;e=this.options.breaks;a.isBroken=C(e)&&!!e.length;a.isBroken&&(a.val2lin=function(d){var e=d,b,c;for(c=0;c<a.breakArray.length;c++)if(b=a.breakArray[c],b.to<=d)e-=b.len;else if(b.from>=d)break;else if(a.isInBreak(b,d)){e-=d-b.from;break}return e},a.lin2val=function(d){var e,b;for(b=0;b<a.breakArray.length&&
!(e=a.breakArray[b],e.from>=d);b++)e.to<d?d+=e.len:a.isInBreak(e,d)&&(d+=e.len);return d},a.setExtremes=function(a,d,b,c,e){for(;this.isInAnyBreak(a);)a-=this.closestPointRange;for(;this.isInAnyBreak(d);)d-=this.closestPointRange;y.prototype.setExtremes.call(this,a,d,b,c,e)},a.setAxisTranslation=function(d){y.prototype.setAxisTranslation.call(this,d);d=a.options.breaks;var e=[],b=[],c=0,g,l,p=a.userMin||a.min,n=a.userMax||a.max,u=q(a.pointRangePadding,0),z,D;f(d,function(b){l=b.repeat||Infinity;a.isInBreak(b,
p)&&(p+=b.to%l-p%l);a.isInBreak(b,n)&&(n-=n%l-b.from%l)});f(d,function(a){z=a.from;for(l=a.repeat||Infinity;z-l>p;)z-=l;for(;z<p;)z+=l;for(D=z;D<n;D+=l)e.push({value:D,move:"in"}),e.push({value:D+(a.to-a.from),move:"out",size:a.breakSize})});e.sort(function(a,b){return a.value===b.value?("in"===a.move?0:1)-("in"===b.move?0:1):a.value-b.value});g=0;z=p;f(e,function(a){g+="in"===a.move?1:-1;1===g&&"in"===a.move&&(z=a.value);0===g&&(b.push({from:z,to:a.value,len:a.value-z-(a.size||0)}),c+=a.value-z-
(a.size||0))});a.breakArray=b;a.unitLength=n-p-c+u;r(a,"afterBreaks");a.options.staticScale?a.transA=a.options.staticScale:a.unitLength&&(a.transA*=(n-a.min+u)/a.unitLength);u&&(a.minPixelPadding=a.transA*a.minPointOffset);a.min=p;a.max=n})});l(p.prototype,"generatePoints",function(a){a.apply(this,E(arguments));var d=this.xAxis,f=this.yAxis,m=this.points,b,c=m.length,l=this.options.connectNulls,p;if(d&&f&&(d.options.breaks||f.options.breaks))for(;c--;)b=m[c],p=null===b.y&&!1===l,p||!d.isInAnyBreak(b.x,
!0)&&!f.isInAnyBreak(b.y,!0)||(m.splice(c,1),this.data[c]&&this.data[c].destroyElements())});a.Series.prototype.drawBreaks=function(a,e){var d=this,m=d.points,b,c,l,p;a&&f(e,function(e){b=a.breakArray||[];c=a.isXAxis?a.min:q(d.options.threshold,a.min);f(m,function(d){p=q(d["stack"+e.toUpperCase()],d[e]);f(b,function(b){l=!1;if(c<b.from&&p>b.to||c>b.from&&p<b.from)l="pointBreak";else if(c<b.from&&p>b.from&&p<b.to||c>b.from&&p>b.to&&p<b.from)l="pointInBreak";l&&r(a,l,{point:d,brk:b})})})})};a.Series.prototype.gappedPath=
function(){var d=this.currentDataGrouping,e=d&&d.totalRange,d=this.options.gapSize,f=this.points.slice(),l=f.length-1,b=this.yAxis;if(d&&0<l)for("value"!==this.options.gapUnit&&(d*=this.closestPointRange),e&&e>d&&(d=e);l--;)f[l+1].x-f[l].x>d&&(e=(f[l].x+f[l+1].x)/2,f.splice(l+1,0,{isNull:!0,x:e}),this.options.stacking&&(e=b.stacks[this.stackKey][e]=new a.StackItem(b,b.options.stackLabels,!1,e,this.stack),e.total=0));return this.getGraphPath(f)};l(a.seriesTypes.column.prototype,"drawPoints",F);l(a.Series.prototype,
"drawPoints",F)})(J);(function(a){var E=a.addEvent,F=a.arrayMax,G=a.arrayMin,q=a.Axis,l=a.defaultPlotOptions,f=a.defined,u=a.each,C=a.extend,r=a.format,y=a.isNumber,p=a.merge,d=a.pick,e=a.Point,g=a.Series,m=a.Tooltip,b=a.wrap,c=g.prototype,x=c.processData,B=c.generatePoints,t={approximation:"average",groupPixelWidth:2,dateTimeLabelFormats:{millisecond:["%A, %b %e, %H:%M:%S.%L","%A, %b %e, %H:%M:%S.%L","-%H:%M:%S.%L"],second:["%A, %b %e, %H:%M:%S","%A, %b %e, %H:%M:%S","-%H:%M:%S"],minute:["%A, %b %e, %H:%M",
"%A, %b %e, %H:%M","-%H:%M"],hour:["%A, %b %e, %H:%M","%A, %b %e, %H:%M","-%H:%M"],day:["%A, %b %e, %Y","%A, %b %e","-%A, %b %e, %Y"],week:["Week from %A, %b %e, %Y","%A, %b %e","-%A, %b %e, %Y"],month:["%B %Y","%B","-%B %Y"],year:["%Y","%Y","-%Y"]}},n={line:{},spline:{},area:{},areaspline:{},column:{approximation:"sum",groupPixelWidth:10},arearange:{approximation:"range"},areasplinerange:{approximation:"range"},columnrange:{approximation:"range",groupPixelWidth:10},candlestick:{approximation:"ohlc",
groupPixelWidth:10},ohlc:{approximation:"ohlc",groupPixelWidth:5}},L=a.defaultDataGroupingUnits=[["millisecond",[1,2,5,10,20,25,50,100,200,500]],["second",[1,2,5,10,15,30]],["minute",[1,2,5,10,15,30]],["hour",[1,2,3,4,6,8,12]],["day",[1]],["week",[1]],["month",[1,3,6]],["year",null]],z=a.approximations={sum:function(a){var b=a.length,c;if(!b&&a.hasNulls)c=null;else if(b)for(c=0;b--;)c+=a[b];return c},average:function(a){var b=a.length;a=z.sum(a);y(a)&&b&&(a/=b);return a},averages:function(){var a=
[];u(arguments,function(b){a.push(z.average(b))});return void 0===a[0]?void 0:a},open:function(a){return a.length?a[0]:a.hasNulls?null:void 0},high:function(a){return a.length?F(a):a.hasNulls?null:void 0},low:function(a){return a.length?G(a):a.hasNulls?null:void 0},close:function(a){return a.length?a[a.length-1]:a.hasNulls?null:void 0},ohlc:function(a,b,c,d){a=z.open(a);b=z.high(b);c=z.low(c);d=z.close(d);if(y(a)||y(b)||y(c)||y(d))return[a,b,c,d]},range:function(a,b){a=z.low(a);b=z.high(b);if(y(a)||
y(b))return[a,b];if(null===a&&null===b)return null}};c.groupData=function(a,b,c,d){var e=this,g=e.data,k=e.options.data,h=[],l=[],m=[],p=a.length,q,r,x=!!b,D=[];d="function"===typeof d?d:z[d]||n[e.type]&&z[n[e.type].approximation]||z[t.approximation];var B=e.pointArrayMap,C=B&&B.length,H=["x"].concat(B||["y"]),E=0,L=0,F,I;C?u(B,function(){D.push([])}):D.push([]);F=C||1;for(I=0;I<=p&&!(a[I]>=c[0]);I++);for(I;I<=p;I++){for(;void 0!==c[E+1]&&a[I]>=c[E+1]||I===p;){q=c[E];e.dataGroupInfo={start:L,length:D[0].length};
r=d.apply(e,D);f(e.dataGroupInfo.options)||(e.dataGroupInfo.options=e.pointClass.prototype.optionsToObject.call({series:e},e.options.data[L]),u(H,function(a){delete e.dataGroupInfo.options[a]}));void 0!==r&&(h.push(q),l.push(r),m.push(e.dataGroupInfo));L=I;for(q=0;q<F;q++)D[q].length=0,D[q].hasNulls=!1;E+=1;if(I===p)break}if(I===p)break;if(B){q=e.cropStart+I;r=g&&g[q]||e.pointClass.prototype.applyOptions.apply({series:e},[k[q]]);var G;for(q=0;q<C;q++)G=r[B[q]],y(G)?D[q].push(G):null===G&&(D[q].hasNulls=
!0)}else q=x?b[I]:null,y(q)?D[0].push(q):null===q&&(D[0].hasNulls=!0)}return[h,l,m]};c.processData=function(){var a=this.chart,b=this.options.dataGrouping,e=!1!==this.allowDG&&b&&d(b.enabled,a.options.isStock),g=this.visible||!a.options.chart.ignoreHiddenSeries,n,l=this.currentDataGrouping,k;this.forceCrop=e;this.groupPixelWidth=null;this.hasProcessed=!0;if(!1!==x.apply(this,arguments)&&e){this.destroyGroupedData();var m,p=b.groupAll?this.xData:this.processedXData,t=b.groupAll?this.yData:this.processedYData,
q=a.plotSizeX,a=this.xAxis,r=a.options.ordinal,z=this.groupPixelWidth=a.getGroupPixelWidth&&a.getGroupPixelWidth();if(z){this.isDirty=n=!0;this.points=null;e=a.getExtremes();k=e.min;e=e.max;r=r&&a.getGroupIntervalFactor(k,e,this)||1;z=z*(e-k)/q*r;q=a.getTimeTicks(a.normalizeTimeTickInterval(z,b.units||L),Math.min(k,p[0]),Math.max(e,p[p.length-1]),a.options.startOfWeek,p,this.closestPointRange);t=c.groupData.apply(this,[p,t,q,b.approximation]);p=t[0];r=t[1];if(b.smoothed&&p.length){m=p.length-1;for(p[m]=
Math.min(p[m],e);m--&&0<m;)p[m]+=z/2;p[0]=Math.max(p[0],k)}k=q.info;this.closestPointRange=q.info.totalRange;this.groupMap=t[2];if(f(p[0])&&p[0]<a.dataMin&&g){if(!f(a.options.min)&&a.min<=a.dataMin||a.min===a.dataMin)a.min=p[0];a.dataMin=p[0]}b.groupAll&&(b=this.cropData(p,r,a.min,a.max,1),p=b.xData,r=b.yData);this.processedXData=p;this.processedYData=r}else this.groupMap=null;this.hasGroupedData=n;this.currentDataGrouping=k;this.preventGraphAnimation=(l&&l.totalRange)!==(k&&k.totalRange)}};c.destroyGroupedData=
function(){var a=this.groupedData;u(a||[],function(b,c){b&&(a[c]=b.destroy?b.destroy():null)});this.groupedData=null};c.generatePoints=function(){B.apply(this);this.destroyGroupedData();this.groupedData=this.hasGroupedData?this.points:null};E(e,"update",function(){if(this.dataGroup)return a.error(24),!1});b(m.prototype,"tooltipFooterHeaderFormatter",function(a,b,c){var d=this.chart.time,e=b.series,f=e.tooltipOptions,k=e.options.dataGrouping,g=f.xDateFormat,h,n=e.xAxis;return n&&"datetime"===n.options.type&&
k&&y(b.key)?(a=e.currentDataGrouping,k=k.dateTimeLabelFormats,a?(n=k[a.unitName],1===a.count?g=n[0]:(g=n[1],h=n[2])):!g&&k&&(g=this.getXDateFormat(b,f,n)),g=d.dateFormat(g,b.key),h&&(g+=d.dateFormat(h,b.key+a.totalRange-1)),r(f[(c?"footer":"header")+"Format"],{point:C(b.point,{key:g}),series:e},d)):a.call(this,b,c)});E(g,"destroy",c.destroyGroupedData);E(g,"afterSetOptions",function(a){a=a.options;var b=this.type,c=this.chart.options.plotOptions,d=l[b].dataGrouping,e=this.useCommonDataGrouping&&t;
if(n[b]||e)d||(d=p(t,n[b])),a.dataGrouping=p(e,d,c.series&&c.series.dataGrouping,c[b].dataGrouping,this.userOptions.dataGrouping);this.chart.options.isStock&&(this.requireSorting=!0)});E(q,"afterSetScale",function(){u(this.series,function(a){a.hasProcessed=!1})});q.prototype.getGroupPixelWidth=function(){var a=this.series,b=a.length,c,d=0,e=!1,f;for(c=b;c--;)(f=a[c].options.dataGrouping)&&(d=Math.max(d,f.groupPixelWidth));for(c=b;c--;)(f=a[c].options.dataGrouping)&&a[c].hasProcessed&&(b=(a[c].processedXData||
a[c].data).length,a[c].groupPixelWidth||b>this.chart.plotSizeX/d||b&&f.forced)&&(e=!0);return e?d:0};q.prototype.setDataGrouping=function(a,b){var c;b=d(b,!0);a||(a={forced:!1,units:null});if(this instanceof q)for(c=this.series.length;c--;)this.series[c].update({dataGrouping:a},!1);else u(this.chart.options.series,function(b){b.dataGrouping=a},!1);this.ordinalSlope=null;b&&this.chart.redraw()}})(J);(function(a){var E=a.each,F=a.Point,G=a.seriesType,q=a.seriesTypes;G("ohlc","column",{lineWidth:1,tooltip:{pointFormat:'\x3cspan style\x3d"color:{point.color}"\x3e\u25cf\x3c/span\x3e \x3cb\x3e {series.name}\x3c/b\x3e\x3cbr/\x3eOpen: {point.open}\x3cbr/\x3eHigh: {point.high}\x3cbr/\x3eLow: {point.low}\x3cbr/\x3eClose: {point.close}\x3cbr/\x3e'},
threshold:null,states:{hover:{lineWidth:3}},stickyTracking:!0},{directTouch:!1,pointArrayMap:["open","high","low","close"],toYData:function(a){return[a.open,a.high,a.low,a.close]},pointValKey:"close",pointAttrToOptions:{stroke:"color","stroke-width":"lineWidth"},init:function(){q.column.prototype.init.apply(this,arguments);this.options.stacking=!1},pointAttribs:function(a,f){f=q.column.prototype.pointAttribs.call(this,a,f);var l=this.options;delete f.fill;!a.options.color&&l.upColor&&a.open<a.close&&
(f.stroke=l.upColor);return f},translate:function(){var a=this,f=a.yAxis,u=!!a.modifyValue,C=["plotOpen","plotHigh","plotLow","plotClose","yBottom"];q.column.prototype.translate.apply(a);E(a.points,function(l){E([l.open,l.high,l.low,l.close,l.low],function(q,p){null!==q&&(u&&(q=a.modifyValue(q)),l[C[p]]=f.toPixels(q,!0))});l.tooltipPos[1]=l.plotHigh+f.pos-a.chart.plotTop})},drawPoints:function(){var a=this,f=a.chart;E(a.points,function(l){var q,r,u,p,d=l.graphic,e,g=!d;void 0!==l.plotY&&(d||(l.graphic=
d=f.renderer.path().add(a.group)),d.attr(a.pointAttribs(l,l.selected&&"select")),r=d.strokeWidth()%2/2,e=Math.round(l.plotX)-r,u=Math.round(l.shapeArgs.width/2),p=["M",e,Math.round(l.yBottom),"L",e,Math.round(l.plotHigh)],null!==l.open&&(q=Math.round(l.plotOpen)+r,p.push("M",e,q,"L",e-u,q)),null!==l.close&&(q=Math.round(l.plotClose)+r,p.push("M",e,q,"L",e+u,q)),d[g?"attr":"animate"]({d:p}).addClass(l.getClassName(),!0))})},animate:null},{getClassName:function(){return F.prototype.getClassName.call(this)+
(this.open<this.close?" highcharts-point-up":" highcharts-point-down")}})})(J);(function(a){var E=a.defaultPlotOptions,F=a.each,G=a.merge,q=a.seriesType,l=a.seriesTypes;q("candlestick","ohlc",G(E.column,{states:{hover:{lineWidth:2}},tooltip:E.ohlc.tooltip,threshold:null,lineColor:"#000000",lineWidth:1,upColor:"#ffffff",stickyTracking:!0}),{pointAttribs:function(a,q){var f=l.column.prototype.pointAttribs.call(this,a,q),r=this.options,u=a.open<a.close,p=r.lineColor||this.color;f["stroke-width"]=r.lineWidth;
f.fill=a.options.color||(u?r.upColor||this.color:this.color);f.stroke=a.lineColor||(u?r.upLineColor||p:p);q&&(a=r.states[q],f.fill=a.color||f.fill,f.stroke=a.lineColor||f.stroke,f["stroke-width"]=a.lineWidth||f["stroke-width"]);return f},drawPoints:function(){var a=this,l=a.chart,q=a.yAxis.reversed;F(a.points,function(f){var r=f.graphic,p,d,e,g,m,b,c,x=!r;void 0!==f.plotY&&(r||(f.graphic=r=l.renderer.path().add(a.group)),r.attr(a.pointAttribs(f,f.selected&&"select")).shadow(a.options.shadow),m=r.strokeWidth()%
2/2,b=Math.round(f.plotX)-m,p=f.plotOpen,d=f.plotClose,e=Math.min(p,d),p=Math.max(p,d),c=Math.round(f.shapeArgs.width/2),d=q?p!==f.yBottom:Math.round(e)!==Math.round(f.plotHigh),g=q?Math.round(e)!==Math.round(f.plotHigh):p!==f.yBottom,e=Math.round(e)+m,p=Math.round(p)+m,m=[],m.push("M",b-c,p,"L",b-c,e,"L",b+c,e,"L",b+c,p,"Z","M",b,e,"L",b,d?Math.round(q?f.yBottom:f.plotHigh):e,"M",b,p,"L",b,g?Math.round(q?f.plotHigh:f.yBottom):p),r[x?"attr":"animate"]({d:m}).addClass(f.getClassName(),!0))})}})})(J);
ea=function(a){var E=a.each,F=a.defined,G=a.seriesTypes,q=a.stableSort;return{getPlotBox:function(){return a.Series.prototype.getPlotBox.call(this.options.onSeries&&this.chart.get(this.options.onSeries)||this)},translate:function(){G.column.prototype.translate.apply(this);var a=this.options,f=this.chart,u=this.points,C=u.length-1,r,y,p=a.onSeries,p=p&&f.get(p),a=a.onKey||"y",d=p&&p.options.step,e=p&&p.points,g=e&&e.length,m=f.inverted,b=this.xAxis,c=this.yAxis,x=0,B,t,n,L;if(p&&p.visible&&g)for(x=
(p.pointXOffset||0)+(p.barW||0)/2,r=p.currentDataGrouping,t=e[g-1].x+(r?r.totalRange:0),q(u,function(a,b){return a.x-b.x}),a="plot"+a[0].toUpperCase()+a.substr(1);g--&&u[C]&&!(B=e[g],r=u[C],r.y=B.y,B.x<=r.x&&void 0!==B[a]&&(r.x<=t&&(r.plotY=B[a],B.x<r.x&&!d&&(n=e[g+1])&&void 0!==n[a]&&(L=(r.x-B.x)/(n.x-B.x),r.plotY+=L*(n[a]-B[a]),r.y+=L*(n.y-B.y))),C--,g++,0>C)););E(u,function(a,d){var e;a.plotX+=x;if(void 0===a.plotY||m)0<=a.plotX&&a.plotX<=b.len?m?(a.plotY=b.translate(a.x,0,1,0,1),a.plotX=F(a.y)?
c.translate(a.y,0,0,0,1):0):a.plotY=f.chartHeight-b.bottom-(b.opposite?b.height:0)+b.offset-c.top:a.shapeArgs={};(y=u[d-1])&&y.plotX===a.plotX&&(void 0===y.stackIndex&&(y.stackIndex=0),e=y.stackIndex+1);a.stackIndex=e});this.onSeries=p}}}(J);(function(a,E){function F(a){d[a+"pin"]=function(e,f,b,c,l){var g=l&&l.anchorX;l=l&&l.anchorY;"circle"===a&&c>b&&(e-=Math.round((c-b)/2),b=c);e=d[a](e,f,b,c);g&&l&&(e.push("M","circle"===a?e[1]-e[4]:e[1]+e[4]/2,f>l?f:f+c,"L",g,l),e=e.concat(d.circle(g-1,l-1,2,
2)));return e}}var G=a.addEvent,q=a.each,l=a.merge,f=a.noop,u=a.Renderer,C=a.Series,r=a.seriesType,y=a.TrackerMixin,p=a.VMLRenderer,d=a.SVGRenderer.prototype.symbols;r("flags","column",{pointRange:0,allowOverlapX:!1,shape:"flag",stackDistance:12,textAlign:"center",tooltip:{pointFormat:"{point.text}\x3cbr/\x3e"},threshold:null,y:-30,fillColor:"#ffffff",lineWidth:1,states:{hover:{lineColor:"#000000",fillColor:"#ccd6eb"}},style:{fontSize:"11px",fontWeight:"bold"}},{sorted:!1,noSharedTooltip:!0,allowDG:!1,
takeOrdinalPosition:!1,trackerGroups:["markerGroup"],forceCrop:!0,init:C.prototype.init,pointAttribs:function(a,d){var e=this.options,b=a&&a.color||this.color,c=e.lineColor,f=a&&a.lineWidth;a=a&&a.fillColor||e.fillColor;d&&(a=e.states[d].fillColor,c=e.states[d].lineColor,f=e.states[d].lineWidth);return{fill:a||b,stroke:c||b,"stroke-width":f||e.lineWidth||0}},translate:E.translate,getPlotBox:E.getPlotBox,drawPoints:function(){var d=this.points,f=this.chart,m=f.renderer,b,c,p=f.inverted,r=this.options,
t=r.y,n,u,z,D,h,y,C=this.yAxis,v={},w=[];for(u=d.length;u--;)z=d[u],y=(p?z.plotY:z.plotX)>this.xAxis.len,b=z.plotX,D=z.stackIndex,n=z.options.shape||r.shape,c=z.plotY,void 0!==c&&(c=z.plotY+t-(void 0!==D&&D*r.stackDistance)),z.anchorX=D?void 0:z.plotX,h=D?void 0:z.plotY,D=z.graphic,void 0!==c&&0<=b&&!y?(D||(D=z.graphic=m.label("",null,null,n,null,null,r.useHTML).attr(this.pointAttribs(z)).css(l(r.style,z.style)).attr({align:"flag"===n?"left":"center",width:r.width,height:r.height,"text-align":r.textAlign}).addClass("highcharts-point").add(this.markerGroup),
z.graphic.div&&(z.graphic.div.point=z),D.shadow(r.shadow),D.isNew=!0),0<b&&(b-=D.strokeWidth()%2),n={y:c,anchorY:h},r.allowOverlapX&&(n.x=b,n.anchorX=z.anchorX),D.attr({text:z.options.title||r.title||"A"})[D.isNew?"attr":"animate"](n),r.allowOverlapX||(v[z.plotX]?v[z.plotX].size=Math.max(v[z.plotX].size,D.width):v[z.plotX]={align:0,size:D.width,target:b,anchorX:b}),z.tooltipPos=[b,c+C.pos-f.plotTop]):D&&(z.graphic=D.destroy());r.allowOverlapX||(a.objectEach(v,function(a){a.plotX=a.anchorX;w.push(a)}),
a.distribute(w,p?C.len:this.xAxis.len,100),q(d,function(a){var b=a.graphic&&v[a.plotX];b&&(a.graphic[a.graphic.isNew?"attr":"animate"]({x:b.pos,anchorX:a.anchorX}),b.pos?a.graphic.isNew=!1:(a.graphic.attr({x:-9999,anchorX:-9999}),a.graphic.isNew=!0))}));r.useHTML&&a.wrap(this.markerGroup,"on",function(b){return a.SVGElement.prototype.on.apply(b.apply(this,[].slice.call(arguments,1)),[].slice.call(arguments,1))})},drawTracker:function(){var a=this.points;y.drawTrackerPoint.apply(this);q(a,function(d){var e=
d.graphic;e&&G(e.element,"mouseover",function(){0<d.stackIndex&&!d.raised&&(d._y=e.y,e.attr({y:d._y-8}),d.raised=!0);q(a,function(a){a!==d&&a.raised&&a.graphic&&(a.graphic.attr({y:a._y}),a.raised=!1)})})})},animate:function(a){a?this.setClip():this.animate=null},setClip:function(){C.prototype.setClip.apply(this,arguments);!1!==this.options.clip&&this.sharedClipKey&&this.markerGroup.clip(this.chart[this.sharedClipKey])},buildKDTree:f,invertGroups:f});d.flag=function(a,f,l,b,c){var e=c&&c.anchorX||
a;c=c&&c.anchorY||f;return d.circle(e-1,c-1,2,2).concat(["M",e,c,"L",a,f+b,a,f,a+l,f,a+l,f+b,a,f+b,"Z"])};F("circle");F("square");u===p&&q(["flag","circlepin","squarepin"],function(a){p.prototype.symbols[a]=d[a]})})(J,ea);(function(a){function E(a,c,d){this.init(a,c,d)}var F=a.addEvent,G=a.Axis,q=a.correctFloat,l=a.defaultOptions,f=a.defined,u=a.destroyObjectProperties,C=a.each,r=a.fireEvent,y=a.hasTouch,p=a.merge,d=a.pick,e=a.removeEvent,g,m={height:a.isTouchDevice?20:14,barBorderRadius:0,buttonBorderRadius:0,
liveRedraw:void 0,margin:10,minWidth:6,step:.2,zIndex:3,barBackgroundColor:"#cccccc",barBorderWidth:1,barBorderColor:"#cccccc",buttonArrowColor:"#333333",buttonBackgroundColor:"#e6e6e6",buttonBorderColor:"#cccccc",buttonBorderWidth:1,rifleColor:"#333333",trackBackgroundColor:"#f2f2f2",trackBorderColor:"#f2f2f2",trackBorderWidth:1};l.scrollbar=p(!0,m,l.scrollbar);a.swapXY=g=function(a,c){var b=a.length,d;if(c)for(c=0;c<b;c+=3)d=a[c+1],a[c+1]=a[c+2],a[c+2]=d;return a};E.prototype={init:function(a,c,
e){this.scrollbarButtons=[];this.renderer=a;this.userOptions=c;this.options=p(m,c);this.chart=e;this.size=d(this.options.size,this.options.height);c.enabled&&(this.render(),this.initEvents(),this.addEvents())},render:function(){var a=this.renderer,c=this.options,d=this.size,e;this.group=e=a.g("scrollbar").attr({zIndex:c.zIndex,translateY:-99999}).add();this.track=a.rect().addClass("highcharts-scrollbar-track").attr({x:0,r:c.trackBorderRadius||0,height:d,width:d}).add(e);this.track.attr({fill:c.trackBackgroundColor,
stroke:c.trackBorderColor,"stroke-width":c.trackBorderWidth});this.trackBorderWidth=this.track.strokeWidth();this.track.attr({y:-this.trackBorderWidth%2/2});this.scrollbarGroup=a.g().add(e);this.scrollbar=a.rect().addClass("highcharts-scrollbar-thumb").attr({height:d,width:d,r:c.barBorderRadius||0}).add(this.scrollbarGroup);this.scrollbarRifles=a.path(g(["M",-3,d/4,"L",-3,2*d/3,"M",0,d/4,"L",0,2*d/3,"M",3,d/4,"L",3,2*d/3],c.vertical)).addClass("highcharts-scrollbar-rifles").add(this.scrollbarGroup);
this.scrollbar.attr({fill:c.barBackgroundColor,stroke:c.barBorderColor,"stroke-width":c.barBorderWidth});this.scrollbarRifles.attr({stroke:c.rifleColor,"stroke-width":1});this.scrollbarStrokeWidth=this.scrollbar.strokeWidth();this.scrollbarGroup.translate(-this.scrollbarStrokeWidth%2/2,-this.scrollbarStrokeWidth%2/2);this.drawScrollbarButton(0);this.drawScrollbarButton(1)},position:function(a,c,d,e){var b=this.options.vertical,f=0,g=this.rendered?"animate":"attr";this.x=a;this.y=c+this.trackBorderWidth;
this.width=d;this.xOffset=this.height=e;this.yOffset=f;b?(this.width=this.yOffset=d=f=this.size,this.xOffset=c=0,this.barWidth=e-2*d,this.x=a+=this.options.margin):(this.height=this.xOffset=e=c=this.size,this.barWidth=d-2*e,this.y+=this.options.margin);this.group[g]({translateX:a,translateY:this.y});this.track[g]({width:d,height:e});this.scrollbarButtons[1][g]({translateX:b?0:d-c,translateY:b?e-f:0})},drawScrollbarButton:function(a){var b=this.renderer,d=this.scrollbarButtons,e=this.options,f=this.size,
n;n=b.g().add(this.group);d.push(n);n=b.rect().addClass("highcharts-scrollbar-button").add(n);n.attr({stroke:e.buttonBorderColor,"stroke-width":e.buttonBorderWidth,fill:e.buttonBackgroundColor});n.attr(n.crisp({x:-.5,y:-.5,width:f+1,height:f+1,r:e.buttonBorderRadius},n.strokeWidth()));n=b.path(g(["M",f/2+(a?-1:1),f/2-3,"L",f/2+(a?-1:1),f/2+3,"L",f/2+(a?2:-2),f/2],e.vertical)).addClass("highcharts-scrollbar-arrow").add(d[a]);n.attr({fill:e.buttonArrowColor})},setRange:function(a,c){var b=this.options,
d=b.vertical,e=b.minWidth,g=this.barWidth,l,m,p=!this.rendered||this.hasDragged||this.chart.navigator&&this.chart.navigator.hasDragged?"attr":"animate";f(g)&&(a=Math.max(a,0),l=Math.ceil(g*a),this.calculatedWidth=m=q(g*Math.min(c,1)-l),m<e&&(l=(g-e+m)*a,m=e),e=Math.floor(l+this.xOffset+this.yOffset),g=m/2-.5,this.from=a,this.to=c,d?(this.scrollbarGroup[p]({translateY:e}),this.scrollbar[p]({height:m}),this.scrollbarRifles[p]({translateY:g}),this.scrollbarTop=e,this.scrollbarLeft=0):(this.scrollbarGroup[p]({translateX:e}),
this.scrollbar[p]({width:m}),this.scrollbarRifles[p]({translateX:g}),this.scrollbarLeft=e,this.scrollbarTop=0),12>=m?this.scrollbarRifles.hide():this.scrollbarRifles.show(!0),!1===b.showFull&&(0>=a&&1<=c?this.group.hide():this.group.show()),this.rendered=!0)},initEvents:function(){var a=this;a.mouseMoveHandler=function(b){var c=a.chart.pointer.normalize(b),d=a.options.vertical?"chartY":"chartX",e=a.initPositions;!a.grabbedCenter||b.touches&&0===b.touches[0][d]||(c=a.cursorToScrollbarPosition(c)[d],
d=a[d],d=c-d,a.hasDragged=!0,a.updatePosition(e[0]+d,e[1]+d),a.hasDragged&&r(a,"changed",{from:a.from,to:a.to,trigger:"scrollbar",DOMType:b.type,DOMEvent:b}))};a.mouseUpHandler=function(b){a.hasDragged&&r(a,"changed",{from:a.from,to:a.to,trigger:"scrollbar",DOMType:b.type,DOMEvent:b});a.grabbedCenter=a.hasDragged=a.chartX=a.chartY=null};a.mouseDownHandler=function(b){b=a.chart.pointer.normalize(b);b=a.cursorToScrollbarPosition(b);a.chartX=b.chartX;a.chartY=b.chartY;a.initPositions=[a.from,a.to];a.grabbedCenter=
!0};a.buttonToMinClick=function(b){var c=q(a.to-a.from)*a.options.step;a.updatePosition(q(a.from-c),q(a.to-c));r(a,"changed",{from:a.from,to:a.to,trigger:"scrollbar",DOMEvent:b})};a.buttonToMaxClick=function(b){var c=(a.to-a.from)*a.options.step;a.updatePosition(a.from+c,a.to+c);r(a,"changed",{from:a.from,to:a.to,trigger:"scrollbar",DOMEvent:b})};a.trackClick=function(b){var c=a.chart.pointer.normalize(b),d=a.to-a.from,e=a.y+a.scrollbarTop,f=a.x+a.scrollbarLeft;a.options.vertical&&c.chartY>e||!a.options.vertical&&
c.chartX>f?a.updatePosition(a.from+d,a.to+d):a.updatePosition(a.from-d,a.to-d);r(a,"changed",{from:a.from,to:a.to,trigger:"scrollbar",DOMEvent:b})}},cursorToScrollbarPosition:function(a){var b=this.options,b=b.minWidth>this.calculatedWidth?b.minWidth:0;return{chartX:(a.chartX-this.x-this.xOffset)/(this.barWidth-b),chartY:(a.chartY-this.y-this.yOffset)/(this.barWidth-b)}},updatePosition:function(a,c){1<c&&(a=q(1-q(c-a)),c=1);0>a&&(c=q(c-a),a=0);this.from=a;this.to=c},update:function(a){this.destroy();
this.init(this.chart.renderer,p(!0,this.options,a),this.chart)},addEvents:function(){var a=this.options.inverted?[1,0]:[0,1],c=this.scrollbarButtons,d=this.scrollbarGroup.element,e=this.mouseDownHandler,f=this.mouseMoveHandler,g=this.mouseUpHandler,a=[[c[a[0]].element,"click",this.buttonToMinClick],[c[a[1]].element,"click",this.buttonToMaxClick],[this.track.element,"click",this.trackClick],[d,"mousedown",e],[d.ownerDocument,"mousemove",f],[d.ownerDocument,"mouseup",g]];y&&a.push([d,"touchstart",e],
[d.ownerDocument,"touchmove",f],[d.ownerDocument,"touchend",g]);C(a,function(a){F.apply(null,a)});this._events=a},removeEvents:function(){C(this._events,function(a){e.apply(null,a)});this._events.length=0},destroy:function(){var a=this.chart.scroller;this.removeEvents();C(["track","scrollbarRifles","scrollbar","scrollbarGroup","group"],function(a){this[a]&&this[a].destroy&&(this[a]=this[a].destroy())},this);a&&this===a.scrollbar&&(a.scrollbar=null,u(a.scrollbarButtons))}};F(G,"afterInit",function(){var a=
this;a.options.scrollbar&&a.options.scrollbar.enabled&&(a.options.scrollbar.vertical=!a.horiz,a.options.startOnTick=a.options.endOnTick=!1,a.scrollbar=new E(a.chart.renderer,a.options.scrollbar,a.chart),F(a.scrollbar,"changed",function(b){var c=Math.min(d(a.options.min,a.min),a.min,a.dataMin),e=Math.max(d(a.options.max,a.max),a.max,a.dataMax)-c,f;a.horiz&&!a.reversed||!a.horiz&&a.reversed?(f=c+e*this.to,c+=e*this.from):(f=c+e*(1-this.from),c+=e*(1-this.to));a.setExtremes(c,f,!0,!1,b)}))});F(G,"afterRender",
function(){var a=Math.min(d(this.options.min,this.min),this.min,d(this.dataMin,this.min)),c=Math.max(d(this.options.max,this.max),this.max,d(this.dataMax,this.max)),e=this.scrollbar,g=this.titleOffset||0;if(e){this.horiz?(e.position(this.left,this.top+this.height+2+this.chart.scrollbarsOffsets[1]+(this.opposite?0:g+this.axisTitleMargin+this.offset),this.width,this.height),g=1):(e.position(this.left+this.width+2+this.chart.scrollbarsOffsets[0]+(this.opposite?g+this.axisTitleMargin+this.offset:0),this.top,
this.width,this.height),g=0);if(!this.opposite&&!this.horiz||this.opposite&&this.horiz)this.chart.scrollbarsOffsets[g]+=this.scrollbar.size+this.scrollbar.options.margin;isNaN(a)||isNaN(c)||!f(this.min)||!f(this.max)?e.setRange(0,0):(g=(this.min-a)/(c-a),a=(this.max-a)/(c-a),this.horiz&&!this.reversed||!this.horiz&&this.reversed?e.setRange(g,a):e.setRange(1-a,1-g))}});F(G,"afterGetOffset",function(){var a=this.horiz?2:1,c=this.scrollbar;c&&(this.chart.scrollbarsOffsets=[0,0],this.chart.axisOffset[a]+=
c.size+c.options.margin)});a.Scrollbar=E})(J);(function(a){function E(a){this.init(a)}var F=a.addEvent,G=a.Axis,q=a.Chart,l=a.color,f=a.defaultOptions,u=a.defined,C=a.destroyObjectProperties,r=a.each,y=a.erase,p=a.error,d=a.extend,e=a.grep,g=a.hasTouch,m=a.isArray,b=a.isNumber,c=a.isObject,x=a.isTouchDevice,B=a.merge,t=a.pick,n=a.removeEvent,L=a.Scrollbar,z=a.Series,D=a.seriesTypes,h=a.wrap,I=[].concat(a.defaultDataGroupingUnits),H=function(a){var c=e(arguments,b);if(c.length)return Math[a].apply(0,
c)};I[4]=["day",[1,2,3,4]];I[5]=["week",[1,2,3]];D=void 0===D.areaspline?"line":"areaspline";d(f,{navigator:{height:40,margin:25,maskInside:!0,handles:{width:7,height:15,symbols:["navigator-handle","navigator-handle"],enabled:!0,lineWidth:1,backgroundColor:"#f2f2f2",borderColor:"#999999"},maskFill:l("#6685c2").setOpacity(.3).get(),outlineColor:"#cccccc",outlineWidth:1,series:{type:D,fillOpacity:.05,lineWidth:1,compare:null,dataGrouping:{approximation:"average",enabled:!0,groupPixelWidth:2,smoothed:!0,
units:I},dataLabels:{enabled:!1,zIndex:2},id:"highcharts-navigator-series",className:"highcharts-navigator-series",lineColor:null,marker:{enabled:!1},pointRange:0,threshold:null},xAxis:{overscroll:0,className:"highcharts-navigator-xaxis",tickLength:0,lineWidth:0,gridLineColor:"#e6e6e6",gridLineWidth:1,tickPixelInterval:200,labels:{align:"left",style:{color:"#999999"},x:3,y:-4},crosshair:!1},yAxis:{className:"highcharts-navigator-yaxis",gridLineWidth:0,startOnTick:!1,endOnTick:!1,minPadding:.1,maxPadding:.1,
labels:{enabled:!1},crosshair:!1,title:{text:null},tickLength:0,tickWidth:0}}});a.Renderer.prototype.symbols["navigator-handle"]=function(a,b,c,d,e){a=e.width/2;b=Math.round(a/3)+.5;e=e.height;return["M",-a-1,.5,"L",a,.5,"L",a,e+.5,"L",-a-1,e+.5,"L",-a-1,.5,"M",-b,4,"L",-b,e-3,"M",b-1,4,"L",b-1,e-3]};E.prototype={drawHandle:function(a,b,c,d){var e=this.navigatorOptions.handles.height;this.handles[b][d](c?{translateX:Math.round(this.left+this.height/2),translateY:Math.round(this.top+parseInt(a,10)+
.5-e)}:{translateX:Math.round(this.left+parseInt(a,10)),translateY:Math.round(this.top+this.height/2-e/2-1)})},drawOutline:function(a,b,c,d){var e=this.navigatorOptions.maskInside,k=this.outline.strokeWidth(),f=k/2,k=k%2/2,g=this.outlineHeight,h=this.scrollbarHeight,n=this.size,l=this.left-h,m=this.top;c?(l-=f,c=m+b+k,b=m+a+k,a=["M",l+g,m-h-k,"L",l+g,c,"L",l,c,"L",l,b,"L",l+g,b,"L",l+g,m+n+h].concat(e?["M",l+g,c-f,"L",l+g,b+f]:[])):(a+=l+h-k,b+=l+h-k,m+=f,a=["M",l,m,"L",a,m,"L",a,m+g,"L",b,m+g,"L",
b,m,"L",l+n+2*h,m].concat(e?["M",a-f,m,"L",b+f,m]:[]));this.outline[d]({d:a})},drawMasks:function(a,b,c,d){var e=this.left,k=this.top,f=this.height,g,h,n,l;c?(n=[e,e,e],l=[k,k+a,k+b],h=[f,f,f],g=[a,b-a,this.size-b]):(n=[e,e+a,e+b],l=[k,k,k],h=[a,b-a,this.size-b],g=[f,f,f]);r(this.shades,function(a,b){a[d]({x:n[b],y:l[b],width:h[b],height:g[b]})})},renderElements:function(){var a=this,b=a.navigatorOptions,c=b.maskInside,d=a.chart,e=d.inverted,f=d.renderer,g;a.navigatorGroup=g=f.g("navigator").attr({zIndex:8,
visibility:"hidden"}).add();var h={cursor:e?"ns-resize":"ew-resize"};r([!c,c,!c],function(c,d){a.shades[d]=f.rect().addClass("highcharts-navigator-mask"+(1===d?"-inside":"-outside")).attr({fill:c?b.maskFill:"rgba(0,0,0,0)"}).css(1===d&&h).add(g)});a.outline=f.path().addClass("highcharts-navigator-outline").attr({"stroke-width":b.outlineWidth,stroke:b.outlineColor}).add(g);b.handles.enabled&&r([0,1],function(c){b.handles.inverted=d.inverted;a.handles[c]=f.symbol(b.handles.symbols[c],-b.handles.width/
2-1,0,b.handles.width,b.handles.height,b.handles);a.handles[c].attr({zIndex:7-c}).addClass("highcharts-navigator-handle highcharts-navigator-handle-"+["left","right"][c]).add(g);var e=b.handles;a.handles[c].attr({fill:e.backgroundColor,stroke:e.borderColor,"stroke-width":e.lineWidth}).css(h)})},update:function(a){r(this.series||[],function(a){a.baseSeries&&delete a.baseSeries.navigatorSeries});this.destroy();B(!0,this.chart.options.navigator,this.options,a);this.init(this.chart)},render:function(c,
d,e,f){var k=this.chart,g,h,n=this.scrollbarHeight,l,m=this.xAxis;g=m.fake?k.xAxis[0]:m;var p=this.navigatorEnabled,v,w=this.rendered;h=k.inverted;var q,r=k.xAxis[0].minRange,z=k.xAxis[0].options.maxRange;if(!this.hasDragged||u(e)){if(!b(c)||!b(d))if(w)e=0,f=t(m.width,g.width);else return;this.left=t(m.left,k.plotLeft+n+(h?k.plotWidth:0));this.size=v=l=t(m.len,(h?k.plotHeight:k.plotWidth)-2*n);k=h?n:l+2*n;e=t(e,m.toPixels(c,!0));f=t(f,m.toPixels(d,!0));b(e)&&Infinity!==Math.abs(e)||(e=0,f=k);c=m.toValue(e,
!0);d=m.toValue(f,!0);q=Math.abs(a.correctFloat(d-c));q<r?this.grabbedLeft?e=m.toPixels(d-r,!0):this.grabbedRight&&(f=m.toPixels(c+r,!0)):u(z)&&q>z&&(this.grabbedLeft?e=m.toPixels(d-z,!0):this.grabbedRight&&(f=m.toPixels(c+z,!0)));this.zoomedMax=Math.min(Math.max(e,f,0),v);this.zoomedMin=Math.min(Math.max(this.fixedWidth?this.zoomedMax-this.fixedWidth:Math.min(e,f),0),v);this.range=this.zoomedMax-this.zoomedMin;v=Math.round(this.zoomedMax);e=Math.round(this.zoomedMin);p&&(this.navigatorGroup.attr({visibility:"visible"}),
w=w&&!this.hasDragged?"animate":"attr",this.drawMasks(e,v,h,w),this.drawOutline(e,v,h,w),this.navigatorOptions.handles.enabled&&(this.drawHandle(e,0,h,w),this.drawHandle(v,1,h,w)));this.scrollbar&&(h?(h=this.top-n,g=this.left-n+(p||!g.opposite?0:(g.titleOffset||0)+g.axisTitleMargin),n=l+2*n):(h=this.top+(p?this.height:-n),g=this.left-n),this.scrollbar.position(g,h,k,n),this.scrollbar.setRange(this.zoomedMin/(l||1),this.zoomedMax/(l||1)));this.rendered=!0}},addMouseEvents:function(){var a=this,b=a.chart,
c=b.container,d=[],e,f;a.mouseMoveHandler=e=function(b){a.onMouseMove(b)};a.mouseUpHandler=f=function(b){a.onMouseUp(b)};d=a.getPartsEvents("mousedown");d.push(F(c,"mousemove",e),F(c.ownerDocument,"mouseup",f));g&&(d.push(F(c,"touchmove",e),F(c.ownerDocument,"touchend",f)),d.concat(a.getPartsEvents("touchstart")));a.eventsToUnbind=d;a.series&&a.series[0]&&d.push(F(a.series[0].xAxis,"foundExtremes",function(){b.navigator.modifyNavigatorAxisExtremes()}))},getPartsEvents:function(a){var b=this,c=[];
r(["shades","handles"],function(d){r(b[d],function(e,k){c.push(F(e.element,a,function(a){b[d+"Mousedown"](a,k)}))})});return c},shadesMousedown:function(a,b){a=this.chart.pointer.normalize(a);var c=this.chart,d=this.xAxis,e=this.zoomedMin,f=this.left,g=this.size,h=this.range,n=a.chartX,l,m;c.inverted&&(n=a.chartY,f=this.top);1===b?(this.grabbedCenter=n,this.fixedWidth=h,this.dragOffset=n-e):(a=n-f-h/2,0===b?a=Math.max(0,a):2===b&&a+h>=g&&(a=g-h,this.reversedExtremes?(a-=h,m=this.getUnionExtremes().dataMin):
l=this.getUnionExtremes().dataMax),a!==e&&(this.fixedWidth=h,b=d.toFixedRange(a,a+h,m,l),u(b.min)&&c.xAxis[0].setExtremes(Math.min(b.min,b.max),Math.max(b.min,b.max),!0,null,{trigger:"navigator"})))},handlesMousedown:function(a,b){this.chart.pointer.normalize(a);a=this.chart;var c=a.xAxis[0],d=this.reversedExtremes;0===b?(this.grabbedLeft=!0,this.otherHandlePos=this.zoomedMax,this.fixedExtreme=d?c.min:c.max):(this.grabbedRight=!0,this.otherHandlePos=this.zoomedMin,this.fixedExtreme=d?c.max:c.min);
a.fixedRange=null},onMouseMove:function(b){var c=this,d=c.chart,e=c.left,f=c.navigatorSize,g=c.range,h=c.dragOffset,n=d.inverted;b.touches&&0===b.touches[0].pageX||(b=d.pointer.normalize(b),d=b.chartX,n&&(e=c.top,d=b.chartY),c.grabbedLeft?(c.hasDragged=!0,c.render(0,0,d-e,c.otherHandlePos)):c.grabbedRight?(c.hasDragged=!0,c.render(0,0,c.otherHandlePos,d-e)):c.grabbedCenter&&(c.hasDragged=!0,d<h?d=h:d>f+h-g&&(d=f+h-g),c.render(0,0,d-h,d-h+g)),c.hasDragged&&c.scrollbar&&t(c.scrollbar.options.liveRedraw,
a.svg&&!x&&!this.chart.isBoosting)&&(b.DOMType=b.type,setTimeout(function(){c.onMouseUp(b)},0)))},onMouseUp:function(a){var b=this.chart,c=this.xAxis,d=this.scrollbar,e,f,g=a.DOMEvent||a;(!this.hasDragged||d&&d.hasDragged)&&"scrollbar"!==a.trigger||(d=this.getUnionExtremes(),this.zoomedMin===this.otherHandlePos?e=this.fixedExtreme:this.zoomedMax===this.otherHandlePos&&(f=this.fixedExtreme),this.zoomedMax===this.size&&(f=this.reversedExtremes?d.dataMin:d.dataMax),0===this.zoomedMin&&(e=this.reversedExtremes?
d.dataMax:d.dataMin),c=c.toFixedRange(this.zoomedMin,this.zoomedMax,e,f),u(c.min)&&b.xAxis[0].setExtremes(Math.min(c.min,c.max),Math.max(c.min,c.max),!0,this.hasDragged?!1:null,{trigger:"navigator",triggerOp:"navigator-drag",DOMEvent:g}));"mousemove"!==a.DOMType&&(this.grabbedLeft=this.grabbedRight=this.grabbedCenter=this.fixedWidth=this.fixedExtreme=this.otherHandlePos=this.hasDragged=this.dragOffset=null)},removeEvents:function(){this.eventsToUnbind&&(r(this.eventsToUnbind,function(a){a()}),this.eventsToUnbind=
void 0);this.removeBaseSeriesEvents()},removeBaseSeriesEvents:function(){var a=this.baseSeries||[];this.navigatorEnabled&&a[0]&&(!1!==this.navigatorOptions.adaptToUpdatedData&&r(a,function(a){n(a,"updatedData",this.updatedDataHandler)},this),a[0].xAxis&&n(a[0].xAxis,"foundExtremes",this.modifyBaseAxisExtremes))},init:function(a){var b=a.options,c=b.navigator,d=c.enabled,e=b.scrollbar,f=e.enabled,b=d?c.height:0,g=f?e.height:0;this.handles=[];this.shades=[];this.chart=a;this.setBaseSeries();this.height=
b;this.scrollbarHeight=g;this.scrollbarEnabled=f;this.navigatorEnabled=d;this.navigatorOptions=c;this.scrollbarOptions=e;this.outlineHeight=b+g;this.opposite=t(c.opposite,!d&&a.inverted);var h=this,d=h.baseSeries,e=a.xAxis.length,f=a.yAxis.length,n=d&&d[0]&&d[0].xAxis||a.xAxis[0]||{options:{}};a.isDirtyBox=!0;h.navigatorEnabled?(h.xAxis=new G(a,B({breaks:n.options.breaks,ordinal:n.options.ordinal},c.xAxis,{id:"navigator-x-axis",yAxis:"navigator-y-axis",isX:!0,type:"datetime",index:e,isInternal:!0,
offset:0,keepOrdinalPadding:!0,startOnTick:!1,endOnTick:!1,minPadding:0,maxPadding:0,zoomEnabled:!1},a.inverted?{offsets:[g,0,-g,0],width:b}:{offsets:[0,-g,0,g],height:b})),h.yAxis=new G(a,B(c.yAxis,{id:"navigator-y-axis",alignTicks:!1,offset:0,index:f,isInternal:!0,zoomEnabled:!1},a.inverted?{width:b}:{height:b})),d||c.series.data?h.updateNavigatorSeries(!1):0===a.series.length&&(h.unbindRedraw=F(a,"beforeRedraw",function(){0<a.series.length&&!h.series&&(h.setBaseSeries(),h.unbindRedraw())})),h.reversedExtremes=
a.inverted&&!h.xAxis.reversed||!a.inverted&&h.xAxis.reversed,h.renderElements(),h.addMouseEvents()):h.xAxis={translate:function(b,c){var d=a.xAxis[0],e=d.getExtremes(),f=d.len-2*g,k=H("min",d.options.min,e.dataMin),d=H("max",d.options.max,e.dataMax)-k;return c?b*d/f+k:f*(b-k)/d},toPixels:function(a){return this.translate(a)},toValue:function(a){return this.translate(a,!0)},toFixedRange:G.prototype.toFixedRange,fake:!0};a.options.scrollbar.enabled&&(a.scrollbar=h.scrollbar=new L(a.renderer,B(a.options.scrollbar,
{margin:h.navigatorEnabled?0:10,vertical:a.inverted}),a),F(h.scrollbar,"changed",function(b){var c=h.size,d=c*this.to,c=c*this.from;h.hasDragged=h.scrollbar.hasDragged;h.render(0,0,c,d);(a.options.scrollbar.liveRedraw||"mousemove"!==b.DOMType&&"touchmove"!==b.DOMType)&&setTimeout(function(){h.onMouseUp(b)})}));h.addBaseSeriesEvents();h.addChartEvents()},getUnionExtremes:function(a){var b=this.chart.xAxis[0],c=this.xAxis,d=c.options,e=b.options,f;a&&null===b.dataMin||(f={dataMin:t(d&&d.min,H("min",
e.min,b.dataMin,c.dataMin,c.min)),dataMax:t(d&&d.max,H("max",e.max,b.dataMax,c.dataMax,c.max))});return f},setBaseSeries:function(a,b){var c=this.chart,d=this.baseSeries=[];a=a||c.options&&c.options.navigator.baseSeries||0;r(c.series||[],function(b,c){b.options.isInternal||!b.options.showInNavigator&&(c!==a&&b.options.id!==a||!1===b.options.showInNavigator)||d.push(b)});this.xAxis&&!this.xAxis.fake&&this.updateNavigatorSeries(!0,b)},updateNavigatorSeries:function(b,c){var e=this,g=e.chart,h=e.baseSeries,
l,p,v=e.navigatorOptions.series,t,q={enableMouseTracking:!1,index:null,linkedTo:null,group:"nav",padXAxis:!1,xAxis:"navigator-x-axis",yAxis:"navigator-y-axis",showInLegend:!1,stacking:!1,isInternal:!0},w=e.series=a.grep(e.series||[],function(b){var c=b.baseSeries;return 0>a.inArray(c,h)?(c&&(n(c,"updatedData",e.updatedDataHandler),delete c.navigatorSeries),b.chart&&b.destroy(),!1):!0});h&&h.length&&r(h,function(a){var b=a.navigatorSeries,k=d({color:a.color,visible:a.visible},m(v)?f.navigator.series:
v);b&&!1===e.navigatorOptions.adaptToUpdatedData||(q.name="Navigator "+h.length,l=a.options||{},t=l.navigatorOptions||{},p=B(l,q,k,t),k=t.data||k.data,e.hasNavigatorData=e.hasNavigatorData||!!k,p.data=k||l.data&&l.data.slice(0),b&&b.options?b.update(p,c):(a.navigatorSeries=g.initSeries(p),a.navigatorSeries.baseSeries=a,w.push(a.navigatorSeries)))});if(v.data&&(!h||!h.length)||m(v))e.hasNavigatorData=!1,v=a.splat(v),r(v,function(a,b){q.name="Navigator "+(w.length+1);p=B(f.navigator.series,{color:g.series[b]&&
!g.series[b].options.isInternal&&g.series[b].color||g.options.colors[b]||g.options.colors[0]},q,a);p.data=a.data;p.data&&(e.hasNavigatorData=!0,w.push(g.initSeries(p)))});b&&this.addBaseSeriesEvents()},addBaseSeriesEvents:function(){var a=this,b=a.baseSeries||[];b[0]&&b[0].xAxis&&F(b[0].xAxis,"foundExtremes",this.modifyBaseAxisExtremes);r(b,function(b){F(b,"show",function(){this.navigatorSeries&&this.navigatorSeries.setVisible(!0,!1)});F(b,"hide",function(){this.navigatorSeries&&this.navigatorSeries.setVisible(!1,
!1)});!1!==this.navigatorOptions.adaptToUpdatedData&&b.xAxis&&F(b,"updatedData",this.updatedDataHandler);F(b,"remove",function(){this.navigatorSeries&&(y(a.series,this.navigatorSeries),u(this.navigatorSeries.options)&&this.navigatorSeries.remove(!1),delete this.navigatorSeries)})},this)},modifyNavigatorAxisExtremes:function(){var a=this.xAxis,b;a.getExtremes&&(!(b=this.getUnionExtremes(!0))||b.dataMin===a.min&&b.dataMax===a.max||(a.min=b.dataMin,a.max=b.dataMax))},modifyBaseAxisExtremes:function(){var a=
this.chart.navigator,c=this.getExtremes(),d=c.dataMin,e=c.dataMax,c=c.max-c.min,f=a.stickToMin,g=a.stickToMax,h=t(this.options.overscroll,0),n,l,m=a.series&&a.series[0],p=!!this.setExtremes;this.eventArgs&&"rangeSelectorButton"===this.eventArgs.trigger||(f&&(l=d,n=l+c),g&&(n=e+h,f||(l=Math.max(n-c,m&&m.xData?m.xData[0]:-Number.MAX_VALUE))),p&&(f||g)&&b(l)&&(this.min=this.userMin=l,this.max=this.userMax=n));a.stickToMin=a.stickToMax=null},updatedDataHandler:function(){var a=this.chart.navigator,c=
this.navigatorSeries;a.stickToMax=a.reversedExtremes?0===Math.round(a.zoomedMin):Math.round(a.zoomedMax)>=Math.round(a.size);a.stickToMin=b(this.xAxis.min)&&this.xAxis.min<=this.xData[0]&&(!this.chart.fixedRange||!a.stickToMax);c&&!a.hasNavigatorData&&(c.options.pointStart=this.xData[0],c.setData(this.options.data,!1,null,!1))},addChartEvents:function(){this.eventsToUnbind||(this.eventsToUnbind=[]);this.eventsToUnbind.push(F(this.chart,"redraw",function(){var a=this.navigator,b=a&&(a.baseSeries&&
a.baseSeries[0]&&a.baseSeries[0].xAxis||a.scrollbar&&this.xAxis[0]);b&&a.render(b.min,b.max)}),F(this.chart,"getMargins",function(){var a=this.navigator,b=a.opposite?"plotTop":"marginBottom";this.inverted&&(b=a.opposite?"marginRight":"plotLeft");this[b]=(this[b]||0)+(a.navigatorEnabled||!this.inverted?a.outlineHeight:0)+a.navigatorOptions.margin}))},destroy:function(){this.removeEvents();this.xAxis&&(y(this.chart.xAxis,this.xAxis),y(this.chart.axes,this.xAxis));this.yAxis&&(y(this.chart.yAxis,this.yAxis),
y(this.chart.axes,this.yAxis));r(this.series||[],function(a){a.destroy&&a.destroy()});r("series xAxis yAxis shades outline scrollbarTrack scrollbarRifles scrollbarGroup scrollbar navigatorGroup rendered".split(" "),function(a){this[a]&&this[a].destroy&&this[a].destroy();this[a]=null},this);r([this.handles],function(a){C(a)},this)}};a.Navigator=E;h(G.prototype,"zoom",function(a,b,c){var d=this.chart,e=d.options,f=e.chart.zoomType,k=e.chart.pinchType,g=e.navigator,e=e.rangeSelector,h;this.isXAxis&&
(g&&g.enabled||e&&e.enabled)&&(!x&&"x"===f||x&&"x"===k?d.resetZoomButton="blocked":"y"===f?h=!1:(!x&&"xy"===f||x&&"xy"===k)&&this.options.range&&(d=this.previousZoom,u(b)?this.previousZoom=[this.min,this.max]:d&&(b=d[0],c=d[1],delete this.previousZoom)));return void 0!==h?h:a.call(this,b,c)});F(q,"beforeRender",function(){var a=this.options;if(a.navigator.enabled||a.scrollbar.enabled)this.scroller=this.navigator=new E(this)});F(q,"afterSetChartSize",function(){var a=this.legend,b=this.navigator,c,
d,e,f;b&&(d=a&&a.options,e=b.xAxis,f=b.yAxis,c=b.scrollbarHeight,this.inverted?(b.left=b.opposite?this.chartWidth-c-b.height:this.spacing[3]+c,b.top=this.plotTop+c):(b.left=this.plotLeft+c,b.top=b.navigatorOptions.top||this.chartHeight-b.height-c-this.spacing[2]-(this.rangeSelector&&this.extraBottomMargin?this.rangeSelector.getHeight():0)-(d&&"bottom"===d.verticalAlign&&d.enabled&&!d.floating?a.legendHeight+t(d.margin,10):0)),e&&f&&(this.inverted?e.options.left=f.options.left=b.left:e.options.top=
f.options.top=b.top,e.setAxisSize(),f.setAxisSize()))});F(q,"update",function(a){var b=a.options.navigator||{},c=a.options.scrollbar||{};this.navigator||this.scroller||!b.enabled&&!c.enabled||(B(!0,this.options.navigator,b),B(!0,this.options.scrollbar,c),delete a.options.navigator,delete a.options.scrollbar)});F(q,"afterUpdate",function(){this.navigator||this.scroller||!this.options.navigator.enabled&&!this.options.scrollbar.enabled||(this.scroller=this.navigator=new E(this))});h(z.prototype,"addPoint",
function(a,b,d,e,f){var k=this.options.turboThreshold;k&&this.xData.length>k&&c(b,!0)&&this.chart.navigator&&p(20,!0);a.call(this,b,d,e,f)});F(q,"afterAddSeries",function(){this.navigator&&this.navigator.setBaseSeries(null,!1)});F(z,"afterUpdate",function(){this.chart.navigator&&!this.options.isInternal&&this.chart.navigator.setBaseSeries(null,!1)});q.prototype.callbacks.push(function(a){var b=a.navigator;b&&a.xAxis[0]&&(a=a.xAxis[0].getExtremes(),b.render(a.min,a.max))})})(J);(function(a){function E(a){this.init(a)}
var F=a.addEvent,G=a.Axis,q=a.Chart,l=a.css,f=a.createElement,u=a.defaultOptions,C=a.defined,r=a.destroyObjectProperties,y=a.discardElement,p=a.each,d=a.extend,e=a.fireEvent,g=a.isNumber,m=a.merge,b=a.pick,c=a.pInt,x=a.splat,B=a.wrap;d(u,{rangeSelector:{verticalAlign:"top",buttonTheme:{"stroke-width":0,width:28,height:18,padding:2,zIndex:7},floating:!1,x:0,y:0,height:void 0,inputPosition:{align:"right",x:0,y:0},buttonPosition:{align:"left",x:0,y:0},labelStyle:{color:"#666666"}}});u.lang=m(u.lang,
{rangeSelectorZoom:"Zoom",rangeSelectorFrom:"From",rangeSelectorTo:"To"});E.prototype={clickButton:function(a,c){var d=this,e=d.chart,f=d.buttonOptions[a],h=e.xAxis[0],n=e.scroller&&e.scroller.getUnionExtremes()||h||{},l=n.dataMin,m=n.dataMax,t,k=h&&Math.round(Math.min(h.max,b(m,h.max))),q=f.type,r,n=f._range,u,y,B,C=f.dataGrouping;if(null!==l&&null!==m){e.fixedRange=n;C&&(this.forcedDataGrouping=!0,G.prototype.setDataGrouping.call(h||{chart:this.chart},C,!1),this.frozenStates=f.preserveDataGrouping);
if("month"===q||"year"===q)h?(q={range:f,max:k,chart:e,dataMin:l,dataMax:m},t=h.minFromRange.call(q),g(q.newMax)&&(k=q.newMax)):n=f;else if(n)t=Math.max(k-n,l),k=Math.min(t+n,m);else if("ytd"===q)if(h)void 0===m&&(l=Number.MAX_VALUE,m=Number.MIN_VALUE,p(e.series,function(a){a=a.xData;l=Math.min(a[0],l);m=Math.max(a[a.length-1],m)}),c=!1),k=d.getYTDExtremes(m,l,e.time.useUTC),t=u=k.min,k=k.max;else{F(e,"beforeRender",function(){d.clickButton(a)});return}else"all"===q&&h&&(t=l,k=m);t+=f._offsetMin;
k+=f._offsetMax;d.setSelected(a);h?h.setExtremes(t,k,b(c,1),null,{trigger:"rangeSelectorButton",rangeSelectorButton:f}):(r=x(e.options.xAxis)[0],B=r.range,r.range=n,y=r.min,r.min=u,F(e,"load",function(){r.range=B;r.min=y}))}},setSelected:function(a){this.selected=this.options.selected=a},defaultButtons:[{type:"month",count:1,text:"1m"},{type:"month",count:3,text:"3m"},{type:"month",count:6,text:"6m"},{type:"ytd",text:"YTD"},{type:"year",count:1,text:"1y"},{type:"all",text:"All"}],init:function(a){var b=
this,c=a.options.rangeSelector,d=c.buttons||[].concat(b.defaultButtons),f=c.selected,g=function(){var a=b.minInput,c=b.maxInput;a&&a.blur&&e(a,"blur");c&&c.blur&&e(c,"blur")};b.chart=a;b.options=c;b.buttons=[];a.extraTopMargin=c.height;b.buttonOptions=d;this.unMouseDown=F(a.container,"mousedown",g);this.unResize=F(a,"resize",g);p(d,b.computeButtonRange);void 0!==f&&d[f]&&this.clickButton(f,!1);F(a,"load",function(){a.xAxis&&a.xAxis[0]&&F(a.xAxis[0],"setExtremes",function(c){this.max-this.min!==a.fixedRange&&
"rangeSelectorButton"!==c.trigger&&"updatedData"!==c.trigger&&b.forcedDataGrouping&&!b.frozenStates&&this.setDataGrouping(!1,!1)})})},updateButtonStates:function(){var a=this,b=this.chart,c=b.xAxis[0],d=Math.round(c.max-c.min),e=!c.hasVisibleSeries,f=b.scroller&&b.scroller.getUnionExtremes()||c,l=f.dataMin,m=f.dataMax,b=a.getYTDExtremes(m,l,b.time.useUTC),q=b.min,r=b.max,k=a.selected,u=g(k),x=a.options.allButtonsEnabled,y=a.buttons;p(a.buttonOptions,function(b,f){var g=b._range,h=b.type,n=b.count||
1,p=y[f],t=0;b=b._offsetMax-b._offsetMin;f=f===k;var v=g>m-l,w=g<c.minRange,z=!1,A=!1,g=g===d;("month"===h||"year"===h)&&d+36E5>=864E5*{month:28,year:365}[h]*n-b&&d-36E5<=864E5*{month:31,year:366}[h]*n+b?g=!0:"ytd"===h?(g=r-q+b===d,z=!f):"all"===h&&(g=c.max-c.min>=m-l,A=!f&&u&&g);h=!x&&(v||w||A||e);n=f&&g||g&&!u&&!z||f&&a.frozenStates;h?t=3:n&&(u=!0,t=2);p.state!==t&&p.setState(t)})},computeButtonRange:function(a){var c=a.type,d=a.count||1,e={millisecond:1,second:1E3,minute:6E4,hour:36E5,day:864E5,
week:6048E5};if(e[c])a._range=e[c]*d;else if("month"===c||"year"===c)a._range=864E5*{month:30,year:365}[c]*d;a._offsetMin=b(a.offsetMin,0);a._offsetMax=b(a.offsetMax,0);a._range+=a._offsetMax-a._offsetMin},setInputValue:function(a,b){var c=this.chart.options.rangeSelector,d=this.chart.time,e=this[a+"Input"];C(b)&&(e.previousValue=e.HCTime,e.HCTime=b);e.value=d.dateFormat(c.inputEditDateFormat||"%Y-%m-%d",e.HCTime);this[a+"DateBox"].attr({text:d.dateFormat(c.inputDateFormat||"%b %e, %Y",e.HCTime)})},
showInput:function(a){var b=this.inputGroup,c=this[a+"DateBox"];l(this[a+"Input"],{left:b.translateX+c.x+"px",top:b.translateY+"px",width:c.width-2+"px",height:c.height-2+"px",border:"2px solid silver"})},hideInput:function(a){l(this[a+"Input"],{border:0,width:"1px",height:"1px"});this.setInputValue(a)},drawInput:function(a){function b(){var a=w.value,b=(t.inputDateParser||Date.parse)(a),d=p.xAxis[0],f=p.scroller&&p.scroller.xAxis?p.scroller.xAxis:d,k=f.dataMin,f=f.dataMax;b!==w.previousValue&&(w.previousValue=
b,g(b)||(b=a.split("-"),b=Date.UTC(c(b[0]),c(b[1])-1,c(b[2]))),g(b)&&(p.time.useUTC||(b+=6E4*(new Date).getTimezoneOffset()),v?b>e.maxInput.HCTime?b=void 0:b<k&&(b=k):b<e.minInput.HCTime?b=void 0:b>f&&(b=f),void 0!==b&&d.setExtremes(v?b:d.min,v?d.max:b,void 0,void 0,{trigger:"rangeSelectorInput"})))}var e=this,p=e.chart,q=p.renderer.style||{},h=p.renderer,t=p.options.rangeSelector,r=e.div,v="min"===a,w,k,A=this.inputGroup;this[a+"Label"]=k=h.label(u.lang[v?"rangeSelectorFrom":"rangeSelectorTo"],this.inputGroup.offset).addClass("highcharts-range-label").attr({padding:2}).add(A);
A.offset+=k.width+5;this[a+"DateBox"]=h=h.label("",A.offset).addClass("highcharts-range-input").attr({padding:2,width:t.inputBoxWidth||90,height:t.inputBoxHeight||17,"text-align":"center",stroke:t.inputBoxBorderColor||"#cccccc","stroke-width":1}).on("click",function(){e.showInput(a);e[a+"Input"].focus()}).add(A);A.offset+=h.width+(v?10:0);this[a+"Input"]=w=f("input",{name:a,className:"highcharts-range-selector",type:"text"},{top:p.plotTop+"px"},r);k.css(m(q,t.labelStyle));h.css(m({color:"#333333"},
q,t.inputStyle));l(w,d({position:"absolute",border:0,width:"1px",height:"1px",padding:0,textAlign:"center",fontSize:q.fontSize,fontFamily:q.fontFamily,top:"-9999em"},t.inputStyle));w.onfocus=function(){e.showInput(a)};w.onblur=function(){e.hideInput(a)};w.onchange=b;w.onkeypress=function(a){13===a.keyCode&&b()}},getPosition:function(){var a=this.chart,b=a.options.rangeSelector,a="top"===b.verticalAlign?a.plotTop-a.axisOffset[0]:0;return{buttonTop:a+b.buttonPosition.y,inputTop:a+b.inputPosition.y-
10}},getYTDExtremes:function(a,b,c){var d=this.chart.time,e=new d.Date(a),f=d.get("FullYear",e);c=c?d.Date.UTC(f,0,1):+new d.Date(f,0,1);b=Math.max(b||0,c);e=e.getTime();return{max:Math.min(a||e,e),min:b}},render:function(a,c){var d=this,e=d.chart,g=e.renderer,h=e.container,l=e.options,n=l.exporting&&!1!==l.exporting.enabled&&l.navigation&&l.navigation.buttonOptions,m=u.lang,q=d.div,k=l.rangeSelector,t=b(l.chart.style&&l.chart.style.zIndex,0)+1,l=k.floating,r=d.buttons,q=d.inputGroup,x=k.buttonTheme,
y=k.buttonPosition,B=k.inputPosition,C=k.inputEnabled,E=x&&x.states,F=e.plotLeft,G,J=d.buttonGroup,X;X=d.rendered;var Y=d.options.verticalAlign,aa=e.legend,ba=aa&&aa.options,ca=y.y,Z=B.y,da=X||!1,fa=da?"animate":"attr",V=0,U=0,P;if(!1!==k.enabled){X||(d.group=X=g.g("range-selector-group").attr({zIndex:7}).add(),d.buttonGroup=J=g.g("range-selector-buttons").add(X),d.zoomText=g.text(m.rangeSelectorZoom,0,15).css(k.labelStyle).add(J),p(d.buttonOptions,function(a,b){r[b]=g.button(a.text,0,0,function(){var c=
a.events&&a.events.click,e;c&&(e=c.call(a));!1!==e&&d.clickButton(b);d.isActive=!0},x,E&&E.hover,E&&E.select,E&&E.disabled).attr({"text-align":"center"}).add(J)}),!1!==C&&(d.div=q=f("div",null,{position:"relative",height:0,zIndex:t}),h.parentNode.insertBefore(q,h),d.inputGroup=q=g.g("input-group").add(X),q.offset=0,d.drawInput("min"),d.drawInput("max")));d.zoomText[fa]({x:b(F+y.x,F)});G=b(F+y.x,F)+d.zoomText.getBBox().width+5;p(d.buttonOptions,function(a,c){r[c][fa]({x:G});G+=r[c].width+b(k.buttonSpacing,
5)});F=e.plotLeft-e.spacing[3];d.updateButtonStates();n&&this.titleCollision(e)&&"top"===Y&&"right"===y.align&&y.y+J.getBBox().height-12<(n.y||0)+n.height&&(V=-40);"left"===y.align?P=y.x-e.spacing[3]:"right"===y.align&&(P=y.x+V-e.spacing[1]);J.align({y:y.y,width:J.getBBox().width,align:y.align,x:P},!0,e.spacingBox);d.group.placed=da;d.buttonGroup.placed=da;!1!==C&&(V=n&&this.titleCollision(e)&&"top"===Y&&"right"===B.align&&B.y-q.getBBox().height-12<(n.y||0)+n.height+e.spacing[0]?-40:0,"left"===B.align?
P=F:"right"===B.align&&(P=-Math.max(e.axisOffset[1],-V)),q.align({y:B.y,width:q.getBBox().width,align:B.align,x:B.x+P-2},!0,e.spacingBox),h=q.alignAttr.translateX+q.alignOptions.x-V+q.getBBox().x+2,n=q.alignOptions.width,m=J.alignAttr.translateX+J.getBBox().x,P=J.getBBox().width+20,(B.align===y.align||m+P>h&&h+n>m&&ca<Z+q.getBBox().height)&&q.attr({translateX:q.alignAttr.translateX+(e.axisOffset[1]>=-V?0:-V),translateY:q.alignAttr.translateY+J.getBBox().height+10}),d.setInputValue("min",a),d.setInputValue("max",
c),d.inputGroup.placed=da);d.group.align({verticalAlign:Y},!0,e.spacingBox);a=d.group.getBBox().height+20;c=d.group.alignAttr.translateY;"bottom"===Y&&(aa=ba&&"bottom"===ba.verticalAlign&&ba.enabled&&!ba.floating?aa.legendHeight+b(ba.margin,10):0,a=a+aa-20,U=c-a-(l?0:k.y)-10);if("top"===Y)l&&(U=0),e.titleOffset&&(U=e.titleOffset+e.options.title.margin),U+=e.margin[0]-e.spacing[0]||0;else if("middle"===Y)if(Z===ca)U=0>Z?c+void 0:c;else if(Z||ca)U=0>Z||0>ca?U-Math.min(Z,ca):c-a+NaN;d.group.translate(k.x,
k.y+Math.floor(U));!1!==C&&(d.minInput.style.marginTop=d.group.translateY+"px",d.maxInput.style.marginTop=d.group.translateY+"px");d.rendered=!0}},getHeight:function(){var a=this.options,b=this.group,c=a.y,d=a.buttonPosition.y,a=a.inputPosition.y,b=b?b.getBBox(!0).height+13+c:0,c=Math.min(a,d);if(0>a&&0>d||0<a&&0<d)b+=Math.abs(c);return b},titleCollision:function(a){return!(a.options.title.text||a.options.subtitle.text)},update:function(a){var b=this.chart;m(!0,b.options.rangeSelector,a);this.destroy();
this.init(b);b.rangeSelector.render()},destroy:function(){var b=this,c=b.minInput,d=b.maxInput;b.unMouseDown();b.unResize();r(b.buttons);c&&(c.onfocus=c.onblur=c.onchange=null);d&&(d.onfocus=d.onblur=d.onchange=null);a.objectEach(b,function(a,c){a&&"chart"!==c&&(a.destroy?a.destroy():a.nodeType&&y(this[c]));a!==E.prototype[c]&&(b[c]=null)},this)}};G.prototype.toFixedRange=function(a,c,d,e){var f=this.chart&&this.chart.fixedRange;a=b(d,this.translate(a,!0,!this.horiz));c=b(e,this.translate(c,!0,!this.horiz));
d=f&&(c-a)/f;.7<d&&1.3>d&&(e?a=c-f:c=a+f);g(a)&&g(c)||(a=c=void 0);return{min:a,max:c}};G.prototype.minFromRange=function(){var a=this.range,c={month:"Month",year:"FullYear"}[a.type],d,e=this.max,f,h,l=function(a,b){var d=new Date(a),e=d["get"+c]();d["set"+c](e+b);e===d["get"+c]()&&d.setDate(0);return d.getTime()-a};g(a)?(d=e-a,h=a):(d=e+l(e,-a.count),this.chart&&(this.chart.fixedRange=e-d));f=b(this.dataMin,Number.MIN_VALUE);g(d)||(d=f);d<=f&&(d=f,void 0===h&&(h=l(d,a.count)),this.newMax=Math.min(d+
h,this.dataMax));g(e)||(d=void 0);return d};F(q,"afterGetContainer",function(){this.options.rangeSelector.enabled&&(this.rangeSelector=new E(this))});B(q.prototype,"render",function(a,b,c){var d=this.axes,e=this.rangeSelector;e&&(p(d,function(a){a.updateNames();a.setScale()}),this.getAxisMargins(),e.render(),d=e.options.verticalAlign,e.options.floating||("bottom"===d?this.extraBottomMargin=!0:"middle"!==d&&(this.extraTopMargin=!0)));a.call(this,b,c)});F(q,"update",function(a){var b=a.options.rangeSelector;
a=this.rangeSelector;var c=this.extraBottomMargin,d=this.extraTopMargin;b&&b.enabled&&!C(a)&&(this.options.rangeSelector.enabled=!0,this.rangeSelector=new E(this));this.extraTopMargin=this.extraBottomMargin=!1;a&&(a.render(),b=b&&b.verticalAlign||a.options&&a.options.verticalAlign,a.options.floating||("bottom"===b?this.extraBottomMargin=!0:"middle"!==b&&(this.extraTopMargin=!0)),this.extraBottomMargin!==c||this.extraTopMargin!==d)&&(this.isDirtyBox=!0)});B(q.prototype,"redraw",function(a,b,c){var d=
this.rangeSelector;d&&!d.options.floating&&(d.render(),d=d.options.verticalAlign,"bottom"===d?this.extraBottomMargin=!0:"middle"!==d&&(this.extraTopMargin=!0));a.call(this,b,c)});F(q,"getMargins",function(){var a=this.rangeSelector;a&&(a=a.getHeight(),this.extraTopMargin&&(this.plotTop+=a),this.extraBottomMargin&&(this.marginBottom+=a))});q.prototype.callbacks.push(function(a){function b(){c=a.xAxis[0].getExtremes();g(c.min)&&d.render(c.min,c.max)}var c,d=a.rangeSelector,e,f;d&&(f=F(a.xAxis[0],"afterSetExtremes",
function(a){d.render(a.min,a.max)}),e=F(a,"redraw",b),b());F(a,"destroy",function(){d&&(e(),f())})});a.RangeSelector=E})(J);(function(a){var E=a.addEvent,F=a.arrayMax,G=a.arrayMin,q=a.Axis,l=a.Chart,f=a.defined,u=a.each,C=a.extend,r=a.format,y=a.grep,p=a.inArray,d=a.isNumber,e=a.isString,g=a.map,m=a.merge,b=a.pick,c=a.Point,x=a.Renderer,B=a.Series,t=a.splat,n=a.SVGRenderer,J=a.VMLRenderer,z=a.wrap,D=B.prototype,h=D.init,I=D.processData,H=c.prototype.tooltipFormatter;a.StockChart=a.stockChart=function(c,
d,f){var k=e(c)||c.nodeName,h=arguments[k?1:0],n=h.series,p=a.getOptions(),q,r=b(h.navigator&&h.navigator.enabled,p.navigator.enabled,!0),v=r?{startOnTick:!1,endOnTick:!1}:null,u={marker:{enabled:!1,radius:2}},w={shadow:!1,borderWidth:0};h.xAxis=g(t(h.xAxis||{}),function(a,b){return m({minPadding:0,maxPadding:0,overscroll:0,ordinal:!0,title:{text:null},labels:{overflow:"justify"},showLastLabel:!0},p.xAxis,p.xAxis&&p.xAxis[b],a,{type:"datetime",categories:null},v)});h.yAxis=g(t(h.yAxis||{}),function(a,
c){q=b(a.opposite,!0);return m({labels:{y:-2},opposite:q,showLastLabel:!(!a.categories&&"category"!==a.type),title:{text:null}},p.yAxis,p.yAxis&&p.yAxis[c],a)});h.series=null;h=m({chart:{panning:!0,pinchType:"x"},navigator:{enabled:r},scrollbar:{enabled:b(p.scrollbar.enabled,!0)},rangeSelector:{enabled:b(p.rangeSelector.enabled,!0)},title:{text:null},tooltip:{split:b(p.tooltip.split,!0),crosshairs:!0},legend:{enabled:!1},plotOptions:{line:u,spline:u,area:u,areaspline:u,arearange:u,areasplinerange:u,
column:w,columnrange:w,candlestick:w,ohlc:w}},h,{isStock:!0});h.series=n;return k?new l(c,h,f):new l(h,d)};z(q.prototype,"autoLabelAlign",function(a){var b=this.chart,c=this.options,b=b._labelPanes=b._labelPanes||{},d=this.options.labels;return this.chart.options.isStock&&"yAxis"===this.coll&&(c=c.top+","+c.height,!b[c]&&d.enabled)?(15===d.x&&(d.x=0),void 0===d.align&&(d.align="right"),b[c]=this,"right"):a.apply(this,[].slice.call(arguments,1))});E(q,"destroy",function(){var a=this.chart,b=this.options&&
this.options.top+","+this.options.height;b&&a._labelPanes&&a._labelPanes[b]===this&&delete a._labelPanes[b]});z(q.prototype,"getPlotLinePath",function(c,h,k,l,m,n){var q=this,r=this.isLinked&&!this.series?this.linkedParent.series:this.series,v=q.chart,t=v.renderer,w=q.left,x=q.top,y,A,z,B,C=[],D=[],E,F;if("xAxis"!==q.coll&&"yAxis"!==q.coll)return c.apply(this,[].slice.call(arguments,1));D=function(a){var b="xAxis"===a?"yAxis":"xAxis";a=q.options[b];return d(a)?[v[b][a]]:e(a)?[v.get(a)]:g(r,function(a){return a[b]})}(q.coll);
u(q.isXAxis?v.yAxis:v.xAxis,function(a){if(f(a.options.id)?-1===a.options.id.indexOf("navigator"):1){var b=a.isXAxis?"yAxis":"xAxis",b=f(a.options[b])?v[b][a.options[b]]:v[b][0];q===b&&D.push(a)}});E=D.length?[]:[q.isXAxis?v.yAxis[0]:v.xAxis[0]];u(D,function(b){-1!==p(b,E)||a.find(E,function(a){return a.pos===b.pos&&a.len===b.len})||E.push(b)});F=b(n,q.translate(h,null,null,l));d(F)&&(q.horiz?u(E,function(a){var b;A=a.pos;B=A+a.len;y=z=Math.round(F+q.transB);if(y<w||y>w+q.width)m?y=z=Math.min(Math.max(w,
y),w+q.width):b=!0;b||C.push("M",y,A,"L",z,B)}):u(E,function(a){var b;y=a.pos;z=y+a.len;A=B=Math.round(x+q.height-F);if(A<x||A>x+q.height)m?A=B=Math.min(Math.max(x,A),q.top+q.height):b=!0;b||C.push("M",y,A,"L",z,B)}));return 0<C.length?t.crispPolyLine(C,k||1):null});n.prototype.crispPolyLine=function(a,b){var c;for(c=0;c<a.length;c+=6)a[c+1]===a[c+4]&&(a[c+1]=a[c+4]=Math.round(a[c+1])-b%2/2),a[c+2]===a[c+5]&&(a[c+2]=a[c+5]=Math.round(a[c+2])+b%2/2);return a};x===J&&(J.prototype.crispPolyLine=n.prototype.crispPolyLine);
z(q.prototype,"hideCrosshair",function(a,b){a.call(this,b);this.crossLabel&&(this.crossLabel=this.crossLabel.hide())});E(q,"afterDrawCrosshair",function(a){var c,d;if(f(this.crosshair.label)&&this.crosshair.label.enabled&&this.cross){var e=this.chart,g=this.options.crosshair.label,h=this.horiz;c=this.opposite;d=this.left;var l=this.top,m=this.crossLabel,n=g.format,p="",q="inside"===this.options.tickPosition,v=!1!==this.crosshair.snap,t=0,u=a.e||this.cross&&this.cross.e,x=a.point;a=this.lin2log;var y,
z;this.isLog?(y=a(this.min),z=a(this.max)):(y=this.min,z=this.max);a=h?"center":c?"right"===this.labelAlign?"right":"left":"left"===this.labelAlign?"left":"center";m||(m=this.crossLabel=e.renderer.label(null,null,null,g.shape||"callout").addClass("highcharts-crosshair-label"+(this.series[0]&&" highcharts-color-"+this.series[0].colorIndex)).attr({align:g.align||a,padding:b(g.padding,8),r:b(g.borderRadius,3),zIndex:2}).add(this.labelGroup),m.attr({fill:g.backgroundColor||this.series[0]&&this.series[0].color||
"#666666",stroke:g.borderColor||"","stroke-width":g.borderWidth||0}).css(C({color:"#ffffff",fontWeight:"normal",fontSize:"11px",textAlign:"center"},g.style)));h?(a=v?x.plotX+d:u.chartX,l+=c?0:this.height):(a=c?this.width+d:0,l=v?x.plotY+l:u.chartY);n||g.formatter||(this.isDatetimeAxis&&(p="%b %d, %Y"),n="{value"+(p?":"+p:"")+"}");p=v?x[this.isXAxis?"x":"y"]:this.toValue(h?u.chartX:u.chartY);m.attr({text:n?r(n,{value:p},e.time):g.formatter.call(this,p),x:a,y:l,visibility:p<y||p>z?"hidden":"visible"});
g=m.getBBox();if(h){if(q&&!c||!q&&c)l=m.y-g.height}else l=m.y-g.height/2;h?(c=d-g.x,d=d+this.width-g.x):(c="left"===this.labelAlign?d:0,d="right"===this.labelAlign?d+this.width:e.chartWidth);m.translateX<c&&(t=c-m.translateX);m.translateX+g.width>=d&&(t=-(m.translateX+g.width-d));m.attr({x:a+t,y:l,anchorX:h?a:this.opposite?0:e.chartWidth,anchorY:h?this.opposite?e.chartHeight:0:l+g.height/2})}});D.init=function(){h.apply(this,arguments);this.setCompare(this.options.compare)};D.setCompare=function(a){this.modifyValue=
"value"===a||"percent"===a?function(b,c){var d=this.compareValue;if(void 0!==b&&void 0!==d)return b="value"===a?b-d:b/d*100-(100===this.options.compareBase?0:100),c&&(c.change=b),b}:null;this.userOptions.compare=a;this.chart.hasRendered&&(this.isDirty=!0)};D.processData=function(){var a,b=-1,c,e,f=!0===this.options.compareStart?0:1,g,h;I.apply(this,arguments);if(this.xAxis&&this.processedYData)for(c=this.processedXData,e=this.processedYData,g=e.length,this.pointArrayMap&&(b=p("close",this.pointArrayMap),
-1===b&&(b=p(this.pointValKey||"y",this.pointArrayMap))),a=0;a<g-f;a++)if(h=e[a]&&-1<b?e[a][b]:e[a],d(h)&&c[a+f]>=this.xAxis.min&&0!==h){this.compareValue=h;break}};z(D,"getExtremes",function(a){var b;a.apply(this,[].slice.call(arguments,1));this.modifyValue&&(b=[this.modifyValue(this.dataMin),this.modifyValue(this.dataMax)],this.dataMin=G(b),this.dataMax=F(b))});q.prototype.setCompare=function(a,c){this.isXAxis||(u(this.series,function(b){b.setCompare(a)}),b(c,!0)&&this.chart.redraw())};c.prototype.tooltipFormatter=
function(c){c=c.replace("{point.change}",(0<this.change?"+":"")+a.numberFormat(this.change,b(this.series.tooltipOptions.changeDecimals,2)));return H.apply(this,[c])};z(B.prototype,"render",function(a){var b;this.chart.is3d&&this.chart.is3d()||this.chart.polar||!this.xAxis||this.xAxis.isRadial||(b=this.yAxis.len-(this.xAxis.axisLine?Math.floor(this.xAxis.axisLine.strokeWidth()/2):0),!this.clipBox&&this.animate?(this.clipBox=m(this.chart.clipBox),this.clipBox.width=this.xAxis.len,this.clipBox.height=
b):this.chart[this.sharedClipKey]?this.chart[this.sharedClipKey].attr({width:this.xAxis.len,height:b}):this.clipBox&&(this.clipBox.width=this.xAxis.len,this.clipBox.height=b));a.call(this)});z(l.prototype,"getSelectedPoints",function(a){var b=a.call(this);u(this.series,function(a){a.hasGroupedData&&(b=b.concat(y(a.points||[],function(a){return a.selected})))});return b});E(l,"update",function(a){a=a.options;"scrollbar"in a&&this.navigator&&(m(!0,this.options.scrollbar,a.scrollbar),this.navigator.update({},
!1),delete a.scrollbar)})})(J);return J});


},{}],89:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],90:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],91:[function(require,module,exports){
/* Protocol - protocol constants */

/* Command code => mnemonic */
module.exports.types = {
  0: 'reserved',
  1: 'connect',
  2: 'connack',
  3: 'publish',
  4: 'puback',
  5: 'pubrec',
  6: 'pubrel',
  7: 'pubcomp',
  8: 'subscribe',
  9: 'suback',
  10: 'unsubscribe',
  11: 'unsuback',
  12: 'pingreq',
  13: 'pingresp',
  14: 'disconnect',
  15: 'reserved'
};

/* Mnemonic => Command code */
module.exports.codes = {}
for(var k in module.exports.types) {
  var v = module.exports.types[k];
  module.exports.codes[v] = k;
}

/* Header */
module.exports.CMD_SHIFT = 4;
module.exports.CMD_MASK = 0xF0;
module.exports.DUP_MASK = 0x08;
module.exports.QOS_MASK = 0x03;
module.exports.QOS_SHIFT = 1;
module.exports.RETAIN_MASK = 0x01;

/* Length */
module.exports.LENGTH_MASK = 0x7F;
module.exports.LENGTH_FIN_MASK = 0x80;

/* Connack */
module.exports.SESSIONPRESENT_MASK = 0x01;

/* Connect */
module.exports.USERNAME_MASK = 0x80;
module.exports.PASSWORD_MASK = 0x40;
module.exports.WILL_RETAIN_MASK = 0x20;
module.exports.WILL_QOS_MASK = 0x18;
module.exports.WILL_QOS_SHIFT = 3;
module.exports.WILL_FLAG_MASK = 0x04;
module.exports.CLEAN_SESSION_MASK = 0x02;

},{}],92:[function(require,module,exports){
(function (Buffer){

'use strict';

var protocol = require('./constants')
  , empty = new Buffer(0)

function generate(packet) {

  switch (packet.cmd) {
    case 'connect':
      return connect(packet)
    case 'connack':
      return connack(packet)
    case 'publish':
      return publish(packet)
    case 'puback':
    case 'pubrec':
    case 'pubrel':
    case 'pubcomp':
    case 'unsuback':
      return confirmation(packet)
    case 'subscribe':
      return subscribe(packet)
    case 'suback':
      return suback(packet)
    case 'unsubscribe':
      return unsubscribe(packet)
    case 'pingreq':
    case 'pingresp':
    case 'disconnect':
      return emptyPacket(packet)
    default:
      throw new Error('unknown command')
  }
}

function connect(opts) {
  var opts = opts || {}
    , protocolId = opts.protocolId || 'MQTT'
    , protocolVersion = opts.protocolVersion || 4
    , will = opts.will
    , clean = opts.clean
    , keepalive = opts.keepalive || 0
    , clientId = opts.clientId || ""
    , username = opts.username
    , password = opts.password

  if (clean === undefined) {
    clean = true
  }

  var length = 0

  // Must be a string and non-falsy
  if (!protocolId ||
     (typeof protocolId !== "string" && !Buffer.isBuffer(protocolId))) {
    throw new Error('Invalid protocol id')
  } else {
    length += protocolId.length + 2
  }

  // Must be a 1 byte number
  if (!protocolVersion ||
      'number' !== typeof protocolVersion ||
      protocolVersion > 255 ||
      protocolVersion < 0) {

    throw new Error('Invalid protocol version')
  } else {
    length += 1
  }

  // ClientId might be omitted in 3.1.1, but only if cleanSession is set to 1
  if ((typeof clientId === "string" || Buffer.isBuffer(clientId)) &&
     (clientId || protocolVersion == 4) &&
     (clientId || clean)) {

    length += clientId.length + 2
  } else {

    if(protocolVersion < 4) {

      throw new Error('clientId must be supplied before 3.1.1');
    }

    if(clean == 0) {

      throw new Error('clientId must be given if cleanSession set to 0');
    }
  }

  // Must be a two byte number
  if ('number' !== typeof keepalive ||
      keepalive < 0 ||
      keepalive > 65535) {
    throw new Error('Invalid keepalive')
  } else {
    length += 2
  }

  // Connect flags
  length += 1

  // If will exists...
  if (will) {
    // It must be an object
    if ('object' !== typeof will) {
      throw new Error('Invalid will')
    }
    // It must have topic typeof string
    if (!will.topic || 'string' !== typeof will.topic) {
      throw new Error('Invalid will topic')
    } else {
      length += Buffer.byteLength(will.topic) + 2
    }

    // Payload
    if (will.payload && will.payload) {
      if (will.payload.length >= 0) {
        if ('string' === typeof will.payload) {
          length += Buffer.byteLength(will.payload) + 2
        } else {
          length += will.payload.length + 2
        }
      } else {
        throw new Error('Invalid will payload')
      }
    } else {
      length += 2
    }
  }

  // Username
  if (username) {
    if (username.length) {
      length += Buffer.byteLength(username) + 2
    } else {
      throw new Error('Invalid username')
    }
  }

  // Password
  if (password) {
    if (password.length) {
      length += byteLength(password) + 2
    } else {
      throw new Error('Invalid password')
    }
  }

  var buffer = new Buffer(1 + calcLengthLength(length) + length)
    , pos = 0

  // Generate header
  buffer.writeUInt8(protocol.codes['connect'] << protocol.CMD_SHIFT, pos++, true)

  // Generate length
  pos += writeLength(buffer, pos, length)

  // Generate protocol ID
  pos += writeStringOrBuffer(buffer, pos, protocolId)
  buffer.writeUInt8(protocolVersion, pos++, true)

  // Connect flags
  var flags = 0
  flags |= username ? protocol.USERNAME_MASK : 0
  flags |= password ? protocol.PASSWORD_MASK : 0
  flags |= (will && will.retain) ? protocol.WILL_RETAIN_MASK : 0
  flags |= (will && will.qos) ?
    will.qos << protocol.WILL_QOS_SHIFT : 0
  flags |= will ? protocol.WILL_FLAG_MASK : 0
  flags |= clean ? protocol.CLEAN_SESSION_MASK : 0

  buffer.writeUInt8(flags, pos++, true)

  // Keepalive
  pos += writeNumber(buffer, pos, keepalive)

  // Client ID
  pos += writeStringOrBuffer(buffer, pos, clientId)

  // Will
  if (will) {
  	pos += writeString(buffer, pos, will.topic)
    pos += writeStringOrBuffer(buffer, pos, will.payload)
  }

  // Username and password
  if (username)
    pos += writeStringOrBuffer(buffer, pos, username)

  if (password)
    pos += writeStringOrBuffer(buffer, pos, password)

  return buffer
}

function connack(opts) {
  var opts = opts || {}
    , rc = opts.returnCode;

  // Check return code
  if ('number' !== typeof rc)
    throw new Error('Invalid return code');

  var buffer = new Buffer(4)
    , pos = 0;

  buffer.writeUInt8(protocol.codes['connack'] << protocol.CMD_SHIFT, pos++, true);
  pos += writeLength(buffer, pos, 2);
  buffer.writeUInt8(opts.sessionPresent && protocol.SESSIONPRESENT_MASK || 0, pos++, true);
  buffer.writeUInt8(rc, pos++, true);

  return buffer;
}

function publish(opts) {
  var opts = opts || {}
    , dup = opts.dup ? protocol.DUP_MASK : 0
    , qos = opts.qos
    , retain = opts.retain ? protocol.RETAIN_MASK : 0
    , topic = opts.topic
    , payload = opts.payload || empty
    , id = opts.messageId;

  var length = 0;

  // Topic must be a non-empty string or Buffer
  if (typeof topic === "string")
    length += Buffer.byteLength(topic) + 2;
  else if (Buffer.isBuffer(topic))
    length += topic.length + 2;
  else
    throw new Error('Invalid topic');

  // get the payload length
  if (!Buffer.isBuffer(payload)) {
    length += Buffer.byteLength(payload);
  } else {
    length += payload.length;
  }

  // Message id must a number if qos > 0
  if (qos && 'number' !== typeof id) {
    throw new Error('Invalid message id')
  } else if (qos) {
    length += 2;
  }

  var buffer = new Buffer(1 + calcLengthLength(length) + length)
    , pos = 0;

  // Header
  buffer.writeUInt8(
    protocol.codes['publish'] << protocol.CMD_SHIFT |
    dup |
    qos << protocol.QOS_SHIFT |
    retain, pos++, true);

  // Remaining length
  pos += writeLength(buffer, pos, length);

  // Topic
  pos += writeStringOrBuffer(buffer, pos, topic);

  // Message ID
  if (qos > 0) {
    pos += writeNumber(buffer, pos, id);
  }

  // Payload
  if (!Buffer.isBuffer(payload)) {
    writeStringNoPos(buffer, pos, payload);
  } else {
    writeBuffer(buffer, pos, payload);
  }

  return buffer;
}

/* Puback, pubrec, pubrel and pubcomp */
function confirmation(opts) {
  var opts = opts || {}
    , type = opts.cmd || 'puback'
    , id = opts.messageId
    , dup = (opts.dup && type === 'pubrel') ? protocol.DUP_MASK : 0
    , qos = 0

  if (type === 'pubrel')
    qos = 1

  // Check message ID
  if ('number' !== typeof id)
    throw new Error('Invalid message id');

  var buffer = new Buffer(4)
    , pos = 0;

  // Header
  buffer[pos++] =
    protocol.codes[type] << protocol.CMD_SHIFT |
    dup |
    qos << protocol.QOS_SHIFT;

  // Length
  pos += writeLength(buffer, pos, 2);

  // Message ID
  pos += writeNumber(buffer, pos, id);

  return buffer;
}

function subscribe(opts) {
  var opts = opts || {}
    , dup = opts.dup ? protocol.DUP_MASK : 0
    , qos = opts.qos || 0
    , id = opts.messageId
    , subs = opts.subscriptions;

  var length = 0;

  // Check mid
  if ('number' !== typeof id) {
    throw new Error('Invalid message id');
  } else {
    length += 2;
  }
  // Check subscriptions
  if ('object' === typeof subs && subs.length) {
    for (var i = 0; i < subs.length; i += 1) {
      var topic = subs[i].topic
        , qos = subs[i].qos;

      if ('string' !== typeof topic) {
        throw new Error('Invalid subscriptions - invalid topic');
      }
      if ('number' !== typeof qos) {
        throw new Error('Invalid subscriptions - invalid qos');
      }

      length += Buffer.byteLength(topic) + 2 + 1;
    }
  } else {
    throw new Error('Invalid subscriptions');
  }

  var buffer = new Buffer(1 + calcLengthLength(length) + length)
    , pos = 0;

  // Generate header
  buffer.writeUInt8(
    protocol.codes['subscribe'] << protocol.CMD_SHIFT |
    dup |
    1 << protocol.QOS_SHIFT, pos++, true);

  // Generate length
  pos += writeLength(buffer, pos, length);

  // Generate message ID
  pos += writeNumber(buffer, pos, id);

  // Generate subs
  for (var i = 0; i < subs.length; i++) {
    var sub = subs[i]
      , topic = sub.topic
      , qos = sub.qos;

    // Write topic string
    pos += writeString(buffer, pos, topic);
    // Write qos
    buffer.writeUInt8(qos, pos++, true);
  }

  return buffer;
}

function suback(opts) {
  var opts = opts || {}
    , id = opts.messageId
    , granted = opts.granted;

  var length = 0;

  // Check message id
  if ('number' !== typeof id) {
    throw new Error('Invalid message id');
  } else {
    length += 2;
  }
  // Check granted qos vector
  if ('object' === typeof granted && granted.length) {
    for (var i = 0; i < granted.length; i += 1) {
      if ('number' !== typeof granted[i]) {
        throw new Error('Invalid qos vector');
      }
      length += 1;
    }
  } else {
    throw new Error('Invalid qos vector');
  }

  var buffer = new Buffer(1 + calcLengthLength(length) + length)
    , pos = 0;

  // Header
  buffer.writeUInt8(protocol.codes['suback'] << protocol.CMD_SHIFT, pos++, true);

  // Length
  pos += writeLength(buffer, pos, length);

  // Message ID
  pos += writeNumber(buffer, pos, id);

  // Subscriptions
  for (var i = 0; i < granted.length; i++) {
    buffer.writeUInt8(granted[i], pos++, true);
  }

  return buffer;
}

function unsubscribe(opts) {
  var opts = opts || {}
    , id = opts.messageId
    , dup = opts.dup ? protocol.DUP_MASK : 0
    , unsubs = opts.unsubscriptions;

  var length = 0;

  // Check message id
  if ('number' !== typeof id) {
    throw new Error('Invalid message id');
  } else {
    length += 2;
  }
  // Check unsubs
  if ('object' === typeof unsubs && unsubs.length) {
    for (var i = 0; i < unsubs.length; i += 1) {
      if ('string' !== typeof unsubs[i]) {
        throw new Error('Invalid unsubscriptions');
      }
      length += Buffer.byteLength(unsubs[i]) + 2;
    }
  } else {
    throw new Error('Invalid unsubscriptions');
  }

  var buffer = new Buffer(1 + calcLengthLength(length) + length)
    , pos = 0;

  // Header
  buffer[pos++] =
    protocol.codes['unsubscribe'] << protocol.CMD_SHIFT |
    dup |
    1 << protocol.QOS_SHIFT;

  // Length
  pos += writeLength(buffer, pos, length);

  // Message ID
  pos += writeNumber(buffer, pos, id);

  // Unsubs
  for (var i = 0; i < unsubs.length; i++) {
    pos += writeString(buffer, pos, unsubs[i]);
  }

  return buffer;
}

function emptyPacket(opts) {
  var buf = new Buffer(2);
  buf[0] = protocol.codes[opts.cmd] << 4;
  buf[1] = 0;
  return buf;
}

/**
 * calcLengthLength - calculate the length of the remaining
 * length field
 *
 * @api private
 */
function calcLengthLength(length) {
  if (length >= 0 && length < 128) {
    return 1
  } else if (length >= 128 && length < 16384) {
    return 2
  } else if (length >= 16384 && length < 2097152) {
    return 3
  } else if (length >= 2097152 && length < 268435456) {
    return 4
  } else {
    return 0
  }
}

/**
 * writeLength - write an MQTT style length field to the buffer
 *
 * @param <Buffer> buffer - destination
 * @param <Number> pos - offset
 * @param <Number> length - length (>0)
 * @returns <Number> number of bytes written
 *
 * @api private
 */

function writeLength(buffer, pos, length) {
  var digit = 0
    , origPos = pos

  do {
    digit = length % 128 | 0
    length = length / 128 | 0
    if (length > 0) {
        digit = digit | 0x80
    }
    buffer.writeUInt8(digit, pos++, true)
  } while (length > 0)

  return pos - origPos
}

/**
 * writeString - write a utf8 string to the buffer
 *
 * @param <Buffer> buffer - destination
 * @param <Number> pos - offset
 * @param <String> string - string to write
 * @return <Number> number of bytes written
 *
 * @api private
 */

function writeString(buffer, pos, string) {
  var strlen = Buffer.byteLength(string)
  writeNumber(buffer, pos, strlen)

  writeStringNoPos(buffer, pos + 2, string)

  return strlen + 2
}

function writeStringNoPos(buffer, pos, string) {
  buffer.write(string, pos)
}

/**
 * write_buffer - write buffer to buffer
 *
 * @param <Buffer> buffer - dest buffer
 * @param <Number> pos - offset
 * @param <Buffer> src - source buffer
 * @return <Number> number of bytes written
 *
 * @api private
 */

function writeBuffer(buffer, pos, src) {
  src.copy(buffer, pos)
  return src.length
}

/**
 * writeNumber - write a two byte number to the buffer
 *
 * @param <Buffer> buffer - destination
 * @param <Number> pos - offset
 * @param <String> number - number to write
 * @return <Number> number of bytes written
 *
 * @api private
 */
function writeNumber(buffer, pos, number) {
  buffer.writeUInt8(number >> 8, pos, true)
  buffer.writeUInt8(number & 0x00FF, pos + 1, true)

  return 2
}

/**
 * writeStringOrBuffer - write a String or Buffer with the its length prefix
 *
 * @param <Buffer> buffer - destination
 * @param <Number> pos - offset
 * @param <String> toWrite - String or Buffer
 * @return <Number> number of bytes written
 */
function writeStringOrBuffer(buffer, pos, toWrite) {
  var written = 0

  if (toWrite && typeof toWrite === 'string') {
    written += writeString(buffer, pos + written, toWrite)
  } else if (toWrite) {
    written += writeNumber(buffer, pos + written, toWrite.length)
    written += writeBuffer(buffer, pos + written, toWrite)
  } else {
    written += writeNumber(buffer, pos + written, 0)
  }

  return written
}

function byteLength(bufOrString) {
  if (Buffer.isBuffer(bufOrString)) {
    return bufOrString.length
  } else {
    return Buffer.byteLength(bufOrString)
  }
}

module.exports = generate

}).call(this,require("buffer").Buffer)
},{"./constants":91,"buffer":3}],93:[function(require,module,exports){

'use strict';

exports.parser          = require('./parser')
exports.generate        = require('./generate')

},{"./generate":92,"./parser":95}],94:[function(require,module,exports){

function Packet() {
  this.cmd = null
  this.retain = false
  this.qos = 0
  this.dup = false
  this.length = -1
  this.topic = null
  this.payload = null
}

module.exports = Packet

},{}],95:[function(require,module,exports){

var bl        = require('bl')
  , inherits  = require('inherits')
  , EE        = require('events').EventEmitter
  , Packet    = require('./packet')
  , constants = require('./constants')

function Parser() {
  if (!(this instanceof Parser)) {
    return new Parser()
  }

  this._states = [
      '_parseHeader'
    , '_parseLength'
    , '_parsePayload'
    , '_newPacket'
  ]

  this._resetState()
}

inherits(Parser, EE)

Parser.prototype._resetState = function () {
  this.packet = new Packet()
  this.error = null
  this._list = bl()
  this._stateCounter = 0
}

Parser.prototype.parse = function (buf) {
  if (this.error) {
    this._resetState()
  }

  this._list.append(buf)

  while ((this.packet.length != -1 || this._list.length > 0) &&
         this[this._states[this._stateCounter]]() &&
         !this.error) {
    this._stateCounter++

    if (this._stateCounter >= this._states.length) {
      this._stateCounter = 0
    }
  }

  return this._list.length
}

Parser.prototype._parseHeader = function () {

  // there is at least one byte in the buffer
  var zero = this._list.readUInt8(0)
  this.packet.cmd = constants.types[zero >> constants.CMD_SHIFT]
  this.packet.retain = (zero & constants.RETAIN_MASK) !== 0
  this.packet.qos = (zero >> constants.QOS_SHIFT) & constants.QOS_MASK
  this.packet.dup = (zero & constants.DUP_MASK) !== 0

  this._list.consume(1)

  return true
}


Parser.prototype._parseLength = function () {
  // there is at least one byte in the list
  var bytes    = 0
    , mul      = 1
    , length   = 0
    , result   = true
    , current

  while (bytes < 5) {
    current = this._list.readUInt8(bytes++)
    length += mul * (current & constants.LENGTH_MASK)
    mul *= 0x80

    if ((current & constants.LENGTH_FIN_MASK) === 0) {
      break
    }

    if (this._list.length <= bytes) {
      result = false
      break
    }
  }

  if (result) {
    this.packet.length = length
    this._list.consume(bytes)
  }

  return result
}

Parser.prototype._parsePayload = function () {
  var result = false

  // Do we have a payload? Do we have enough data to complete the payload?
  // PINGs have no payload
  if (this.packet.length === 0 || this._list.length >= this.packet.length) {

    this._pos = 0

    switch (this.packet.cmd) {
      case 'connect':
        this._parseConnect()
        break
      case 'connack':
        this._parseConnack()
        break
      case 'publish':
        this._parsePublish()
        break
      case 'puback':
      case 'pubrec':
      case 'pubrel':
      case 'pubcomp':
        this._parseMessageId()
        break
      case 'subscribe':
        this._parseSubscribe()
        break
      case 'suback':
        this._parseSuback()
        break
      case 'unsubscribe':
        this._parseUnsubscribe()
        break
      case 'unsuback':
        this._parseUnsuback()
        break
      case 'pingreq':
      case 'pingresp':
      case 'disconnect':
        // these are empty, nothing to do
        break
      default:
        this._emitError(new Error('not supported'))
    }

    result = true
  }

  return result
}

Parser.prototype._parseConnect = function () {
  var protocolId // constants id
    , clientId // Client id
    , topic // Will topic
    , payload // Will payload
    , password // Password
    , username // Username
    , flags = {}
    , packet = this.packet

  // Parse constants id
  protocolId = this._parseString()
  if (protocolId === null)
    return this._emitError(new Error('cannot parse protocol id'))

  if (protocolId != 'MQTT' && protocolId != 'MQIsdp') {

    return this._emitError(new Error('invalid protocol id'))
  }

  packet.protocolId = protocolId

  // Parse constants version number
  if(this._pos >= this._list.length)
    return this._emitError(new Error('packet too short'))

  packet.protocolVersion = this._list.readUInt8(this._pos)

  if(packet.protocolVersion != 3 && packet.protocolVersion != 4) {

    return this._emitError(new Error('invalid protocol version'))
  }

  this._pos++
  if(this._pos >= this._list.length)
    return this._emitError(new Error('packet too short'))

  // Parse connect flags
  flags.username  = (this._list.readUInt8(this._pos) & constants.USERNAME_MASK)
  flags.password  = (this._list.readUInt8(this._pos) & constants.PASSWORD_MASK)
  flags.will      = (this._list.readUInt8(this._pos) & constants.WILL_FLAG_MASK)

  if (flags.will) {
    packet.will         = {}
    packet.will.retain  = (this._list.readUInt8(this._pos) & constants.WILL_RETAIN_MASK) !== 0
    packet.will.qos     = (this._list.readUInt8(this._pos) &
                          constants.WILL_QOS_MASK) >> constants.WILL_QOS_SHIFT
  }

  packet.clean = (this._list.readUInt8(this._pos) & constants.CLEAN_SESSION_MASK) !== 0
  this._pos++

  // Parse keepalive
  packet.keepalive = this._parseNum()
  if(packet.keepalive === -1)
    return this._emitError(new Error('packet too short'))

  // Parse client ID
  clientId = this._parseString()
  if(clientId === null)
    return this._emitError(new Error('packet too short'))
  packet.clientId = clientId

  if (flags.will) {
    // Parse will topic
    topic = this._parseString()
    if (topic === null)
      return this._emitError(new Error('cannot parse will topic'))
    packet.will.topic = topic

    // Parse will payload
    payload = this._parseBuffer()
    if (payload === null)
      return this._emitError(new Error('cannot parse will payload'))
    packet.will.payload = payload
  }

  // Parse username
  if (flags.username) {
    username = this._parseString()
    if(username === null)
      return this._emitError(new Error('cannot parse username'))
    packet.username = username
  }

  // Parse password
  if(flags.password) {
    password = this._parseBuffer()
    if(password === null)
      return this._emitError(new Error('cannot parse username'))
    packet.password = password
  }

  return packet
}

Parser.prototype._parseConnack = function () {
  var packet = this.packet
  if (this._list.length < 2)
    return null
  packet.sessionPresent = !!(this._list.readUInt8(this._pos++) & constants.SESSIONPRESENT_MASK)
  packet.returnCode = this._list.readUInt8(this._pos)
  if(packet.returnCode === -1)
    return this._emitError(new Error('cannot parse return code'))
}

Parser.prototype._parsePublish = function () {
  var packet = this.packet
  packet.topic = this._parseString()

  if(packet.topic === null)
    return this._emitError(new Error('cannot parse topic'))

  // Parse message ID
  if (packet.qos > 0) {
    if (!this._parseMessageId()) { return }
  }

  packet.payload = this._list.slice(this._pos, packet.length)
}

Parser.prototype._parseSubscribe = function() {
  var packet = this.packet
    , topic
    , qos

  if (packet.qos != 1) {
    return this._emitError(new Error('wrong subscribe header'))
  }

  packet.subscriptions = []

  if (!this._parseMessageId()) { return }

  while (this._pos < packet.length) {

    // Parse topic
    topic = this._parseString()
    if (topic === null)
      return this._emitError(new Error('Parse error - cannot parse topic'))

    qos = this._list.readUInt8(this._pos++)

    // Push pair to subscriptions
    packet.subscriptions.push({ topic: topic, qos: qos });
  }
}

Parser.prototype._parseSuback = function() {
  this.packet.granted = []

  if (!this._parseMessageId()) { return }

  // Parse granted QoSes
  while (this._pos < this.packet.length) {
    this.packet.granted.push(this._list.readUInt8(this._pos++));
  }
}

Parser.prototype._parseUnsubscribe = function() {
  var packet = this.packet

  packet.unsubscriptions = []

  // Parse message ID
  if (!this._parseMessageId()) { return }

  while (this._pos < packet.length) {
    var topic;

    // Parse topic
    topic = this._parseString()
    if (topic === null)
      return this._emitError(new Error('cannot parse topic'))

    // Push topic to unsubscriptions
    packet.unsubscriptions.push(topic);
  }
}

Parser.prototype._parseUnsuback = function() {
  if (!this._parseMessageId())
    return this._emitError(new Error('cannot parse message id'))
}

Parser.prototype._parseMessageId = function() {
  var packet = this.packet

  packet.messageId = this._parseNum()

  if(packet.messageId === null) {
    this._emitError(new Error('cannot parse message id'))
    return false
  }

  return true
}

Parser.prototype._parseString = function(maybeBuffer) {
  var length = this._parseNum()
    , result
    , end = length + this._pos

  if(length === -1 || end > this._list.length || end > this.packet.length)
    return null

  result = this._list.toString('utf8', this._pos, end)

  this._pos += length

  return result
}

Parser.prototype._parseBuffer = function() {
  var length = this._parseNum()
    , result
    , end = length + this._pos

  if(length === -1 || end > this._list.length || end > this.packet.length)
    return null

  result = this._list.slice(this._pos, end)

  this._pos += length

  return result
}

Parser.prototype._parseNum = function() {
  if(this._list.length - this._pos < 2) return -1

  var result = this._list.readUInt16BE(this._pos)
  this._pos += 2
  return result
}

Parser.prototype._newPacket = function () {
  if (this.packet) {
    this._list.consume(this.packet.length)
    this.emit('packet', this.packet)
  }

  this.packet = new Packet()

  return true
}

Parser.prototype._emitError = function(err) {
  this.error = err
  this.emit('error', err)
}

module.exports = Parser

},{"./constants":91,"./packet":94,"bl":65,"events":5,"inherits":89}],96:[function(require,module,exports){
(function (process,global){
'use strict';
/**
 * Module dependencies
 */
/*global setImmediate:true*/
var events = require('events'),
  Store = require('./store'),
  eos = require('end-of-stream'),
  mqttPacket = require('mqtt-packet'),
  Writable = require('readable-stream').Writable,
  inherits = require('inherits'),
  reInterval = require('reinterval'),
  validations = require('./validations'),
  setImmediate = global.setImmediate || function (callback) {
    // works in node v0.8
    process.nextTick(callback);
  },
  defaultConnectOptions = {
    keepalive: 10,
    reschedulePings: true,
    protocolId: 'MQTT',
    protocolVersion: 4,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    clean: true
  };

function defaultId () {
  return 'mqttjs_' + Math.random().toString(16).substr(2, 8);
}

function sendPacket (client, packet, cb) {
  try {
    var buf = mqttPacket.generate(packet);

    client.emit('packetsend', packet);

    if (client.stream.write(buf) && cb) {
      cb();
    } else if (cb) {
      client.stream.once('drain', cb);
    }
  } catch (err) {
    if (cb) {
      cb(err);
    } else {
      client.emit('error', err);
    }
  }
}

function storeAndSend (client, packet, cb) {
  client.outgoingStore.put(packet, function storedPacket (err) {
    if (err) {
      return cb && cb(err);
    }
    sendPacket(client, packet, cb);
  });
}

function nop () {}

/**
 * MqttClient constructor
 *
 * @param {Stream} stream - stream
 * @param {Object} [options] - connection options
 * (see Connection#connect)
 */
function MqttClient (streamBuilder, options) {
  var k,
    that = this;

  if (!(this instanceof MqttClient)) {
    return new MqttClient(streamBuilder, options);
  }

  this.options = options || {};

  // Defaults
  for (k in defaultConnectOptions) {
    if ('undefined' === typeof this.options[k]) {
      this.options[k] = defaultConnectOptions[k];
    } else {
      this.options[k] = options[k];
    }
  }

  this.options.clientId = this.options.clientId || defaultId();

  this.streamBuilder = streamBuilder;

  // Inflight message storages
  this.outgoingStore = this.options.outgoingStore || new Store();
  this.incomingStore = this.options.incomingStore || new Store();

  // Should QoS zero messages be queued when the connection is broken?
  this.queueQoSZero = null == this.options.queueQoSZero ? true : this.options.queueQoSZero;

  // Ping timer, setup in _setupPingTimer
  this.pingTimer = null;
  // Is the client connected?
  this.connected = false;
  // Are we disconnecting?
  this.disconnecting = false;
  // Packet queue
  this.queue = [];
  // connack timer
  this.connackTimer = null;
  // Reconnect timer
  this.reconnectTimer = null;
  // MessageIDs starting with 1
  this.nextId = Math.floor(Math.random() * 65535);

  // Inflight callbacks
  this.outgoing = {};

  // Mark connected on connect
  this.on('connect', function () {
    if (this.disconnected) {
      return;
    }

    this.connected = true;
    var outStore = null;
    outStore = this.outgoingStore.createStream();

    // Control of stored messages
    outStore.once('readable', function () {
      function storeDeliver () {
        var packet = outStore.read(1),
          cb;
        if (!packet) {
          return;
        }
        // Avoid unnecesary stream read operations when disconnected
        if (!that.disconnecting && !that.reconnectTimer && (0 < that.options.reconnectPeriod)) {
          outStore.read(0);
          cb = that.outgoing[packet.messageId];
          that.outgoing[packet.messageId] = function () {
            // Ensure that the original callback passed in to publish gets invoked
            if (cb) {
              cb();
            }
            // Ensure that the next message will only be read after callback is issued
            storeDeliver();
          };
          that._sendPacket(packet);
        } else if (outStore.destroy) {
          outStore.destroy();
        }
      }
      storeDeliver();
    })
    .on('error', this.emit.bind(this, 'error'));
  });

  // Mark disconnected on stream close
  this.on('close', function () {
    this.connected = false;
    clearTimeout(this.connackTimer);
  });

  // Setup ping timer
  this.on('connect', this._setupPingTimer);

  // Send queued packets
  this.on('connect', function () {
    var queue = this.queue;

    function deliver () {
      var entry = queue.shift(),
        packet = null;

      if (!entry) {
        return;
      }

      packet = entry.packet;

      that._sendPacket(
        packet,
        function (err) {
          if (entry.cb) {
            entry.cb(err);
          }
          deliver();
        }
      );
    }

    deliver();
  });


  // Clear ping timer
  this.on('close', function () {
    if (null !== that.pingTimer) {
      that.pingTimer.clear();
      that.pingTimer = null;
    }
  });

  // Setup reconnect timer on disconnect
  this.on('close', this._setupReconnect);

  events.EventEmitter.call(this);

  this._setupStream();
}
inherits(MqttClient, events.EventEmitter);

/**
 * setup the event handlers in the inner stream.
 *
 * @api private
 */
MqttClient.prototype._setupStream = function () {
  var connectPacket,
    that = this,
    writable = new Writable(),
    parser = mqttPacket.parser(this.options),
    completeParse = null,
    packets = [];

  this._clearReconnect();

  this.stream = this.streamBuilder(this);

  parser.on('packet', function (packet) {
    packets.push(packet);
  });

  function process () {
    var packet = packets.shift(),
      done = completeParse;
    if (packet) {
      that._handlePacket(packet, process);
    } else {
      completeParse = null;
      done();
    }
  }

  writable._write = function (buf, enc, done) {
    completeParse = done;
    parser.parse(buf);
    process();
  };

  this.stream.pipe(writable);

  // Suppress connection errors
  this.stream.on('error', nop);

  // Echo stream close
  eos(this.stream, this.emit.bind(this, 'close'));

  // Send a connect packet
  connectPacket = Object.create(this.options);
  connectPacket.cmd = 'connect';
  // avoid message queue
  sendPacket(this, connectPacket);

  // Echo connection errors
  parser.on('error', this.emit.bind(this, 'error'));

  // many drain listeners are needed for qos 1 callbacks if the connection is intermittent
  this.stream.setMaxListeners(1000);

  clearTimeout(this.connackTimer);
  this.connackTimer = setTimeout(function () {
    that._cleanUp(true);
  }, this.options.connectTimeout);
};

MqttClient.prototype._handlePacket = function (packet, done) {
  this.emit('packetreceive', packet);

  switch (packet.cmd) {
    case 'publish':
      this._handlePublish(packet, done);
      break;
    case 'puback':
    case 'pubrec':
    case 'pubcomp':
    case 'suback':
    case 'unsuback':
      this._handleAck(packet);
      done();
      break;
    case 'pubrel':
      this._handlePubrel(packet, done);
      break;
    case 'connack':
      this._handleConnack(packet);
      done();
      break;
    case 'pingresp':
      this._handlePingresp(packet);
      done();
      break;
    default:
      // do nothing
      // maybe we should do an error handling
      // or just log it
      break;
  }
};

MqttClient.prototype._checkDisconnecting = function (callback) {
  if (this.disconnecting) {
    if (callback) {
      callback(new Error('client disconnecting'));
    } else {
      this.emit('error', new Error('client disconnecting'));
    }
  }
  return this.disconnecting;
};

/**
 * publish - publish <message> to <topic>
 *
 * @param {String} topic - topic to publish to
 * @param {String, Buffer} message - message to publish
 * @param {Object} [opts] - publish options, includes:
 *    {Number} qos - qos level to publish on
 *    {Boolean} retain - whether or not to retain the message
 * @param {Function} [callback] - function(err){}
 *    called when publish succeeds or fails
 * @returns {MqttClient} this - for chaining
 * @api public
 *
 * @example client.publish('topic', 'message');
 * @example
 *     client.publish('topic', 'message', {qos: 1, retain: true});
 * @example client.publish('topic', 'message', console.log);
 */
MqttClient.prototype.publish = function (topic, message, opts, callback) {
  var packet;

  // .publish(topic, payload, cb);
  if ('function' === typeof opts) {
    callback = opts;
    opts = null;
  }

  // Default opts
  if (!opts) {
    opts = {qos: 0, retain: false};
  }

  if (this._checkDisconnecting(callback)) {
    return this;
  }

  packet = {
    cmd: 'publish',
    topic: topic,
    payload: message,
    qos: opts.qos,
    retain: opts.retain,
    messageId: this._nextId()
  };

  switch (opts.qos) {
    case 1:
    case 2:

      // Add to callbacks
      this.outgoing[packet.messageId] = callback || nop;
      this._sendPacket(packet);
      break;
    default:
      this._sendPacket(packet, callback);
      break;
  }

  return this;
};

/**
 * subscribe - subscribe to <topic>
 *
 * @param {String, Array, Object} topic - topic(s) to subscribe to, supports objects in the form {'topic': qos}
 * @param {Object} [opts] - optional subscription options, includes:
 *    {Number} qos - subscribe qos level
 * @param {Function} [callback] - function(err, granted){} where:
 *    {Error} err - subscription error (none at the moment!)
 *    {Array} granted - array of {topic: 't', qos: 0}
 * @returns {MqttClient} this - for chaining
 * @api public
 * @example client.subscribe('topic');
 * @example client.subscribe('topic', {qos: 1});
 * @example client.subscribe({'topic': 0, 'topic2': 1}, console.log);
 * @example client.subscribe('topic', console.log);
 */
MqttClient.prototype.subscribe = function () {
  var packet,
    args = Array.prototype.slice.call(arguments),
    subs = [],
    obj = args.shift(),
    callback = args.pop() || nop,
    opts = args.pop(),
    invalidTopic;

  if ('string' === typeof obj) {
    obj = [obj];
  }

  if ('function' !== typeof callback) {
    opts = callback;
    callback = nop;
  }

  invalidTopic = validations.validateTopics(obj);
  if ( null !== invalidTopic ) {
    callback(new Error('Invalid topic ' + invalidTopic));
    return this;
  }

  if (this._checkDisconnecting(callback)) {
    return this;
  }

  if (!opts) {
    opts = { qos: 0 };
  }

  if (Array.isArray(obj)) {
    obj.forEach(function (topic) {
      subs.push({
        topic: topic,
        qos: opts.qos
      });
    });
  } else {
    Object
      .keys(obj)
      .forEach(function (k) {
        subs.push({
          topic: k,
          qos: obj[k]
        });
      });
  }

  packet = {
    cmd: 'subscribe',
    subscriptions: subs,
    qos: 1,
    retain: false,
    dup: false,
    messageId: this._nextId()
  };

  this.outgoing[packet.messageId] = callback;

  this._sendPacket(packet);

  return this;
};

/**
 * unsubscribe - unsubscribe from topic(s)
 *
 * @param {String, Array} topic - topics to unsubscribe from
 * @param {Function} [callback] - callback fired on unsuback
 * @returns {MqttClient} this - for chaining
 * @api public
 * @example client.unsubscribe('topic');
 * @example client.unsubscribe('topic', console.log);
 */
MqttClient.prototype.unsubscribe = function (topic, callback) {
  var packet = {
    cmd: 'unsubscribe',
    qos: 1,
    messageId: this._nextId()
  };

  callback = callback || nop;

  if (this._checkDisconnecting(callback)) {
    return this;
  }

  if ('string' === typeof topic) {
    packet.unsubscriptions = [topic];
  } else if ('object' === typeof topic && topic.length) {
    packet.unsubscriptions = topic;
  }

  this.outgoing[packet.messageId] = callback;

  this._sendPacket(packet);

  return this;
};

/**
 * end - close connection
 *
 * @returns {MqttClient} this - for chaining
 * @param {Boolean} force - do not wait for all in-flight messages to be acked
 * @param {Function} cb - called when the client has been closed
 *
 * @api public
 */
MqttClient.prototype.end = function (force, cb) {
  var that = this;

  if ('function' === typeof force) {
    cb = force;
    force = false;
  }

  function closeStores () {
    that.disconnected = true;
    that.incomingStore.close(function () {
      that.outgoingStore.close(cb);
    });
  }

  function finish () {
    // defer closesStores of an I/O cycle,
    // just to make sure things are
    // ok for websockets
    that._cleanUp(force, setImmediate.bind(null, closeStores));
  }

  if (this.disconnecting) {
    return this;
  }

  this._clearReconnect();

  this.disconnecting = true;

  if (!force && 0 < Object.keys(this.outgoing).length) {
    // wait 10ms, just to be sure we received all of it
    this.once('outgoingEmpty', setTimeout.bind(null, finish, 10));
  } else {
    finish();
  }

  return this;
};

/**
 * _reconnect - implement reconnection
 * @api privateish
 */
MqttClient.prototype._reconnect = function () {
  this.emit('reconnect');
  this._setupStream();
};

/**
 * _setupReconnect - setup reconnect timer
 */
MqttClient.prototype._setupReconnect = function () {
  var that = this;

  if (!that.disconnecting && !that.reconnectTimer && (0 < that.options.reconnectPeriod)) {
    if (!this.reconnecting) {
      this.emit('offline');
      this.reconnecting = true;
    }
    that.reconnectTimer = setInterval(function () {
      that._reconnect();
    }, that.options.reconnectPeriod);
  }
};

/**
 * _clearReconnect - clear the reconnect timer
 */
MqttClient.prototype._clearReconnect = function () {
  if (this.reconnectTimer) {
    clearInterval(this.reconnectTimer);
    this.reconnectTimer = null;
  }
};


/**
 * _cleanUp - clean up on connection end
 * @api private
 */
MqttClient.prototype._cleanUp = function (forced, done) {

  if (done) {
    this.stream.on('close', done);
  }

  if (forced) {
    this.stream.destroy();
  } else {
    this._sendPacket(
      { cmd: 'disconnect' },
      setImmediate.bind(
        null,
        this.stream.end.bind(this.stream)
      )
    );
  }

  if (!this.disconnecting) {
    this._clearReconnect();
    this._setupReconnect();
  }

  if (null !== this.pingTimer) {
    this.pingTimer.clear();
    this.pingTimer = null;
  }
};

/**
 * _sendPacket - send or queue a packet
 * @param {String} type - packet type (see `protocol`)
 * @param {Object} packet - packet options
 * @param {Function} cb - callback when the packet is sent
 * @api private
 */
MqttClient.prototype._sendPacket = function (packet, cb) {
  if (!this.connected) {
    if (0 < packet.qos || 'publish' !== packet.cmd || this.queueQoSZero) {
      this.queue.push({ packet: packet, cb: cb });
    } else if (cb) {
      cb(new Error('No connection to broker'));
    }

    return;
  }

  // When sending a packet, reschedule the ping timer
  this._shiftPingInterval();

  switch (packet.qos) {
    case 2:
    case 1:
      storeAndSend(this, packet, cb);
      break;
    /**
     * no need of case here since it will be caught by default
     * and jshint comply that before default it must be a break
     * anyway it will result in -1 evaluation
     */
    case 0:
      /* falls through */
    default:
      sendPacket(this, packet, cb);
      break;
  }
};

/**
 * _setupPingTimer - setup the ping timer
 *
 * @api private
 */
MqttClient.prototype._setupPingTimer = function () {
  var that = this;

  if (!this.pingTimer && this.options.keepalive) {
    this.pingResp = true;
    this.pingTimer = reInterval(function () {
      that._checkPing();
    }, this.options.keepalive * 1000);
  }
};

/**
 * _shiftPingInterval - reschedule the ping interval
 *
 * @api private
 */
MqttClient.prototype._shiftPingInterval = function () {
  if (this.pingTimer && this.options.keepalive && this.options.reschedulePings) {
    this.pingTimer.reschedule(this.options.keepalive * 1000);
  }
};
/**
 * _checkPing - check if a pingresp has come back, and ping the server again
 *
 * @api private
 */
MqttClient.prototype._checkPing = function () {
  if (this.pingResp) {
    this.pingResp = false;
    this._sendPacket({ cmd: 'pingreq' });
  } else {
    // do a forced cleanup since socket will be in bad shape
    this._cleanUp(true);
  }
};

/**
 * _handlePingresp - handle a pingresp
 *
 * @api private
 */
MqttClient.prototype._handlePingresp = function () {
  this.pingResp = true;
};

/**
 * _handleConnack
 *
 * @param {Object} packet
 * @api private
 */

MqttClient.prototype._handleConnack = function (packet) {
  var rc = packet.returnCode,
    // TODO: move to protocol
    errors = [
      '',
      'Unacceptable protocol version',
      'Identifier rejected',
      'Server unavailable',
      'Bad username or password',
      'Not authorized'
    ];

  clearTimeout(this.connackTimer);

  if (0 === rc) {
    this.reconnecting = false;
    this.emit('connect', packet);
  } else if (0 < rc) {
    this.emit('error',
        new Error('Connection refused: ' + errors[rc]));
  }
};

/**
 * _handlePublish
 *
 * @param {Object} packet
 * @api private
 */
/*
those late 2 case should be rewrite to comply with coding style:

case 1:
case 0:
  // do not wait sending a puback
  // no callback passed
  if (1 === qos) {
    this._sendPacket({
      cmd: 'puback',
      messageId: mid
    });
  }
  // emit the message event for both qos 1 and 0
  this.emit('message', topic, message, packet);
  this.handleMessage(packet, done);
  break;
default:
  // do nothing but every switch mus have a default
  // log or throw an error about unknown qos
  break;

for now i just suppressed the warnings
*/
MqttClient.prototype._handlePublish = function (packet, done) {
  var topic = packet.topic.toString(),
    message = packet.payload,
    qos = packet.qos,
    mid = packet.messageId,
    that = this;

  switch (qos) {
    case 2:
      this.incomingStore.put(packet, function () {
        that._sendPacket({cmd: 'pubrec', messageId: mid}, done);
      });
      break;
    case 1:
      // do not wait sending a puback
      // no callback passed
      this._sendPacket({
        cmd: 'puback',
        messageId: mid
      });
      /* falls through */
    case 0:
      // emit the message event for both qos 1 and 0
      this.emit('message', topic, message, packet);
      this.handleMessage(packet, done);
      break;
    default:
      // do nothing
      // log or throw an error about unknown qos
      break;
  }
};

/**
 * Handle messages with backpressure support, one at a time.
 * Override at will.
 *
 * @param Packet packet the packet
 * @param Function callback call when finished
 * @api public
 */
MqttClient.prototype.handleMessage = function (packet, callback) {
  callback();
};

/**
 * _handleAck
 *
 * @param {Object} packet
 * @api private
 */

MqttClient.prototype._handleAck = function (packet) {
  var mid = packet.messageId,
    type = packet.cmd,
    response = null,
    cb = this.outgoing[mid],
    that = this;

  if (!cb) {
    // Server sent an ack in error, ignore it.
    return;
  }

  // Process
  switch (type) {
    case 'pubcomp':
      // same thing as puback for QoS 2
    case 'puback':
      // Callback - we're done
      delete this.outgoing[mid];
      this.outgoingStore.del(packet, cb);
      break;
    case 'pubrec':
      response = {
        cmd: 'pubrel',
        qos: 2,
        messageId: mid
      };

      this._sendPacket(response);
      break;
    case 'suback':
      delete this.outgoing[mid];
      this.outgoingStore.del(packet, function (err, original) {
        if (err) {
          // missing packet, what should we do?
          return that.emit('error', err);
        }

        var i,
          origSubs = original.subscriptions,
          granted = packet.granted;

        for (i = 0; i < granted.length; i += 1) {
          origSubs[i].qos = granted[i];
        }

        cb(null, origSubs);
      });
      break;
    case 'unsuback':
      delete this.outgoing[mid];
      this.outgoingStore.del(packet, cb);
      break;
    default:
      that.emit('error', new Error('unrecognized packet type'));
  }

  if (this.disconnecting &&
      0 === Object.keys(this.outgoing).length) {
    this.emit('outgoingEmpty');
  }
};

/**
 * _handlePubrel
 *
 * @param {Object} packet
 * @api private
 */

MqttClient.prototype._handlePubrel = function (packet, callback) {
  var mid = packet.messageId,
    that = this;

  that.incomingStore.get(packet, function (err, pub) {
    if (err) {
      return that.emit('error', err);
    }

    if ('pubrel' !== pub.cmd) {
      that.emit('message', pub.topic, pub.payload, pub);
      that.incomingStore.put(packet);
    }

    that._sendPacket({cmd: 'pubcomp', messageId: mid}, callback);
  });
};

/**
 * _nextId
 */
MqttClient.prototype._nextId = function () {
  var id = this.nextId++;
  // Ensure 16 bit unsigned int:
  if (65535 === id) {
    this.nextId = 1;
  }
  return id;
};

module.exports = MqttClient;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./store":101,"./validations":102,"_process":11,"end-of-stream":86,"events":5,"inherits":89,"mqtt-packet":93,"readable-stream":112,"reinterval":113}],97:[function(require,module,exports){
(function (process){
'use strict';
var MqttClient = require('../client'),
  url = require('url'),
  xtend = require('xtend'),
  protocols = {},
  protocolList = [];

if ('browser' !== process.title) {
  protocols.mqtt = require('./tcp');
  protocols.tcp = require('./tcp');
  protocols.ssl = require('./tls');
  protocols.tls = require('./tls');
  protocols.mqtts = require('./tls');
}

protocols.ws = require('./ws');
protocols.wss = require('./ws');

protocolList = [
  'mqtt',
  'mqtts',
  'ws',
  'wss'
];


/**
 * Parse the auth attribute and merge username and password in the options object.
 *
 * @param {Object} [opts] option object
 */
function parseAuthOptions (opts) {
  var matches;
  if (opts.auth) {
    matches = opts.auth.match(/^(.+):(.+)$/);
    if (matches) {
      opts.username = matches[1];
      opts.password = matches[2];
    } else {
      opts.username = opts.auth;
    }
  }
}

/**
 * connect - connect to an MQTT broker.
 *
 * @param {String} [brokerUrl] - url of the broker, optional
 * @param {Object} opts - see MqttClient#constructor
 */
function connect (brokerUrl, opts) {

  if (('object' === typeof brokerUrl) && !opts) {
    opts = brokerUrl;
    brokerUrl = null;
  }

  opts = opts || {};

  if (brokerUrl) {
    opts = xtend(url.parse(brokerUrl, true), opts);
    opts.protocol = opts.protocol.replace(/\:$/, '');
  }

  // merge in the auth options if supplied
  parseAuthOptions(opts);

  // support clientId passed in the query string of the url
  if (opts.query && 'string' === typeof opts.query.clientId) {
    opts.clientId = opts.query.clientId;
  }

  if (opts.cert && opts.key) {
    if (opts.protocol) {
      if (-1 === ['mqtts', 'wss'].indexOf(opts.protocol)) {
        /*
         * jshint and eslint
         * complains that break from default cannot be reached after throw
         * it is a foced exit from a control structure
         * maybe add a check after switch to see if it went through default
         * and then throw the error
        */
        /*jshint -W027*/
        /*eslint no-unreachable:1*/
        switch (opts.protocol) {
          case 'mqtt':
            opts.protocol = 'mqtts';
            break;
          case 'ws':
            opts.protocol = 'wss';
            break;
          default:
            throw new Error('Unknown protocol for secure connection: "' + opts.protocol + '"!');
            break;
        }
        /*eslint no-unreachable:0*/
        /*jshint +W027*/
      }
    } else {
      // don't know what protocol he want to use, mqtts or wss
      throw new Error('Missing secure protocol key');
    }
  }

  if (!protocols[opts.protocol]) {
    opts.protocol = protocolList.filter(function (key) {
      return 'function' === typeof protocols[key];
    })[0];
  }

  if (false === opts.clean && !opts.clientId) {
    throw new Error('Missing clientId for unclean clients');
  }


  function wrapper (client) {
    if (opts.servers) {
      if (!client._reconnectCount || client._reconnectCount === opts.servers.length) {
        client._reconnectCount = 0;
      }

      opts.host = opts.servers[client._reconnectCount].host;
      opts.port = opts.servers[client._reconnectCount].port;
      opts.hostname = opts.host;

      client._reconnectCount++;
    }

    return protocols[opts.protocol](client, opts);
  }

  return new MqttClient(wrapper, opts);
}

module.exports = connect;
module.exports.connect = connect;
module.exports.MqttClient = MqttClient;

}).call(this,require('_process'))
},{"../client":96,"./tcp":98,"./tls":99,"./ws":100,"_process":11,"url":33,"xtend":131}],98:[function(require,module,exports){
'use strict';
var net = require('net');

/*
  variables port and host can be removed since
  you have all required information in opts object
*/
function buildBuilder (client, opts) {
  var port, host;
  opts.port = opts.port || 1883;
  opts.hostname = opts.hostname || opts.host || 'localhost';

  port = opts.port;
  host = opts.hostname;

  return net.createConnection(port, host);
}

module.exports = buildBuilder;

},{"net":2}],99:[function(require,module,exports){
'use strict';
var tls = require('tls');

function buildBuilder (mqttClient, opts) {
  var connection;
  opts.port = opts.port || 8883;
  opts.host = opts.hostname || opts.host || 'localhost';

  opts.rejectUnauthorized = false !== opts.rejectUnauthorized;

  connection = tls.connect(opts);
  /*eslint no-use-before-define: [2, "nofunc"]*/
  connection.on('secureConnect', function () {
    if (opts.rejectUnauthorized && !connection.authorized) {
      connection.emit('error', new Error('TLS not authorized'));
    } else {
      connection.removeListener('error', handleTLSerrors);
    }
  });

  /*
   * to comply with strict rules, a function must be
   * declared before it can be used
   * so i moved it has to be  moved before its first call
   * later on maybe we can move all of them to the top of the file
   * for now i just suppressed the warning
   */
  /*jshint latedef:false*/
  function handleTLSerrors (err) {
    // How can I get verify this error is a tls error?
    if (opts.rejectUnauthorized) {
      mqttClient.emit('error', err);
    }

    // close this connection to match the behaviour of net
    // otherwise all we get is an error from the connection
    // and close event doesn't fire. This is a work around
    // to enable the reconnect code to work the same as with
    // net.createConnection
    connection.end();
  }
  /*jshint latedef:false*/

  connection.on('error', handleTLSerrors);
  return connection;
}

module.exports = buildBuilder;

},{"tls":2}],100:[function(require,module,exports){
(function (process){
'use strict';

var websocket = require('websocket-stream'),
  _URL = require('url'),
  wssProperties = [
    'rejectUnauthorized',
    'ca',
    'cert',
    'key',
    'pfx',
    'passphrase'
  ];

function buildBuilder (client, opts) {
  var wsOpt = {
      protocol: 'mqtt'
    },
    host = opts.hostname || 'localhost',
    port = String(opts.port || 80),
    path = opts.path || '/',
    url = opts.protocol + '://' + host + ':' + port + path;
  if (('MQIsdp' === opts.protocolId) && (3 === opts.protocolVersion)) {
    wsOpt.protocol = 'mqttv3.1';
  }

  if ('wss' === opts.protocol) {
    wssProperties.forEach(function (prop) {
      if (opts.hasOwnProperty(prop)) {
        wsOpt[prop] = opts[prop];
      }
    });
  }

  return websocket(url, wsOpt);
}

function buildBuilderBrowser (mqttClient, opts) {
  var url, parsed;
  if ('undefined' !== typeof (document)) { // for Web Workers! P.S: typeof(document) !== undefined may be becoming the faster one these days.
    parsed = _URL.parse(document.URL);
  } else {
    throw new Error('Could not determine host. Specify host manually.');
  }

  if (!opts.protocol) {
    if ('https:' === parsed.protocol) {
      opts.protocol = 'wss';
    } else {
      opts.protocol = 'ws';
    }
  }

  if (!opts.hostname) {
    opts.hostname = opts.host;
  }

  if (!opts.hostname) {
    opts.hostname = parsed.hostname;
    if (!opts.port) {
      opts.port = parsed.port;
    }
  }

  if (!opts.port) {
    if ('wss' === opts.protocol) {
      opts.port = 443;
    } else {
      opts.port = 80;
    }
  }

  if (!opts.path) {
    opts.path = '/';
  }

  url = opts.protocol + '://' + opts.hostname + ':' + opts.port + opts.path;

  return websocket(url, 'mqttv3.1');
}

if ('browser' !== process.title) {
  module.exports = buildBuilder;
} else {
  module.exports = buildBuilderBrowser;
}

}).call(this,require('_process'))
},{"_process":11,"url":33,"websocket-stream":128}],101:[function(require,module,exports){
(function (process){
'use strict';
var Readable = require('readable-stream').Readable,
  streamsOpts = { objectMode: true };

/**
 * In-memory implementation of the message store
 * This can actually be saved into files.
 *
 */
function Store () {
  if (!(this instanceof Store)) {
    return new Store();
  }

  this._inflights = {};
}

/**
 * Adds a packet to the store, a packet is
 * anything that has a messageId property.
 *
 */
Store.prototype.put = function (packet, cb) {
  this._inflights[packet.messageId] = packet;

  if (cb) {
    cb();
  }

  return this;
};

/**
 * Creates a stream with all the packets in the store
 *
 */
Store.prototype.createStream = function () {
  var stream = new Readable(streamsOpts),
    inflights = this._inflights,
    ids = Object.keys(this._inflights),
    destroyed = false,
    i = 0;

  stream._read = function () {
    if (!destroyed && i < ids.length) {
      this.push(inflights[ids[i++]]);
    } else {
      this.push(null);
    }
  };

  stream.destroy = function () {
    if (destroyed) {
      return;
    }

    var self = this;

    destroyed = true;

    process.nextTick(function () {
      self.emit('close');
    });
  };

  return stream;
};

/**
 * deletes a packet from the store.
 */
Store.prototype.del = function (packet, cb) {
  packet = this._inflights[packet.messageId];
  if (packet) {
    delete this._inflights[packet.messageId];
    cb(null, packet);
  } else if (cb) {
    cb(new Error('missing packet'));
  }

  return this;
};

/**
 * get a packet from the store.
 */
Store.prototype.get = function (packet, cb) {
  packet = this._inflights[packet.messageId];
  if (packet) {
    cb(null, packet);
  } else if (cb) {
    cb(new Error('missing packet'));
  }

  return this;
};

/**
 * Close the store
 */
Store.prototype.close = function (cb) {
  this._inflights = null;
  if (cb) {
    cb();
  }
};

module.exports = Store;

}).call(this,require('_process'))
},{"_process":11,"readable-stream":112}],102:[function(require,module,exports){
'use strict';
/*eslint no-unused-expressions:0*/
/*jshint expr:true*/

/**
 * Validate a topic to see if it's valid or not.
 * A topic is valid if it follow below rules:
 * - Rule #1: If any part of the topic is not `+` or `#`, then it must not contain `+` and '#'
 * - Rule #2: Part `#` must be located at the end of the mailbox
 *
 * @param {String} topic - A topic
 * @returns {Boolean} If the topic is valid, returns true. Otherwise, returns false.
 */
function validateTopic (topic) {
  var parts = topic.split('/'),
    i = 0;

  for (i = 0; i < parts.length; i++) {
    if ('+' === parts[i]) {
      continue;
    }

    if ('#' === parts[i] ) {
      // for Rule #2
      return i === parts.length - 1;
    }

    if ( -1 !== parts[i].indexOf('+') || -1 !== parts[i].indexOf('#')) {
      return false;
    }
  }

  return true;
}

/**
 * Validate an array of topics to see if any of them is valid or not
  * @param {Array} topics - Array of topics
 * @returns {String} If the topics is valid, returns null. Otherwise, returns the invalid one
 */
function validateTopics (topics) {
  for (var i = 0; i < topics.length; i++) {
    if ( !validateTopic(topics[i]) ) {
      return topics[i];
    }
  }
  return null;
}

module.exports = {
  validateTopics: validateTopics
};

},{}],103:[function(require,module,exports){
var wrappy = require('wrappy')
module.exports = wrappy(once)
module.exports.strict = wrappy(onceStrict)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  var name = fn.name || 'Function wrapped with `once`'
  f.onceError = name + " shouldn't be called more than once"
  f.called = false
  return f
}

},{"wrappy":130}],104:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"_process":11,"dup":10}],105:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

module.exports = Duplex;

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
/*</replacement>*/


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

forEach(objectKeys(Writable.prototype), function(method) {
  if (!Duplex.prototype[method])
    Duplex.prototype[method] = Writable.prototype[method];
});

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  process.nextTick(this.end.bind(this));
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

}).call(this,require('_process'))
},{"./_stream_readable":107,"./_stream_writable":109,"_process":11,"core-util-is":74,"inherits":89}],106:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./_stream_transform":108,"core-util-is":74,"inherits":89}],107:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/


/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = require('events').EventEmitter;

/*<replacement>*/
if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

var Stream = require('stream');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var StringDecoder;

util.inherits(Readable, Stream);

function ReadableState(options, stream) {
  options = options || {};

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : 16 * 1024;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = false;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // In streams that never have any data, and do push(null) right away,
  // the consumer can miss the 'end' event if they do some I/O before
  // consuming the stream.  So, we don't emit('end') until some reading
  // happens.
  this.calledRead = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, becuase any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;


  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (typeof chunk === 'string' && !state.objectMode) {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null || chunk === undefined) {
    state.reading = false;
    if (!state.ended)
      onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      // update the buffer info.
      state.length += state.objectMode ? 1 : chunk.length;
      if (addToFront) {
        state.buffer.unshift(chunk);
      } else {
        state.reading = false;
        state.buffer.push(chunk);
      }

      if (state.needReadable)
        emitReadable(stream);

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}



// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
};

// Don't raise the hwm > 128MB
var MAX_HWM = 0x800000;
function roundUpToNextPowerOf2(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (n === null || isNaN(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = roundUpToNextPowerOf2(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else
      return state.length;
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  var state = this._readableState;
  state.calledRead = true;
  var nOrig = n;
  var ret;

  if (typeof n !== 'number' || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    ret = null;

    // In cases where the decoder did not receive enough data
    // to produce a full chunk, then immediately received an
    // EOF, state.buffer will contain [<Buffer >, <Buffer 00 ...>].
    // howMuchToRead will see this and coerce the amount to
    // read to zero (because it's looking at the length of the
    // first <Buffer > in state.buffer), and we'll end up here.
    //
    // This can only happen via state.decoder -- no other venue
    // exists for pushing a zero-length chunk into state.buffer
    // and triggering this behavior. In this case, we return our
    // remaining data and end the stream, if appropriate.
    if (state.length > 0 && state.decoder) {
      ret = fromList(n, state);
      state.length -= ret.length;
    }

    if (state.length === 0)
      endReadable(this);

    return ret;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;

  // if we currently have less than the highWaterMark, then also read some
  if (state.length - n <= state.highWaterMark)
    doRead = true;

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading)
    doRead = false;

  if (doRead) {
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read called its callback synchronously, then `reading`
  // will be false, and we need to re-evaluate how much data we
  // can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we happened to read() exactly the remaining amount in the
  // buffer, and the EOF has been seen at this point, then make sure
  // that we emit 'end' on the very next tick.
  if (state.ended && !state.endEmitted && state.length === 0)
    endReadable(this);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) &&
      'string' !== typeof chunk &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.decoder && !state.ended) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // if we've ended and we have some data left, then emit
  // 'readable' now to make sure it gets picked up.
  if (state.length > 0)
    emitReadable(stream);
  else
    endReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (state.emittedReadable)
    return;

  state.emittedReadable = true;
  if (state.sync)
    process.nextTick(function() {
      emitReadable_(stream);
    });
  else
    emitReadable_(stream);
}

function emitReadable_(stream) {
  stream.emit('readable');
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(function() {
      maybeReadMore_(stream, state);
    });
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    process.nextTick(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    if (readable !== src) return;
    cleanup();
  }

  function onend() {
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  function cleanup() {
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (!dest._writableState || dest._writableState.needDrain)
      ondrain();
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    unpipe();
    dest.removeListener('error', onerror);
    if (EE.listenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error)
    dest.on('error', onerror);
  else if (isArray(dest._events.error))
    dest._events.error.unshift(onerror);
  else
    dest._events.error = [onerror, dest._events.error];



  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    // the handler that waits for readable events after all
    // the data gets sucked out in flow.
    // This would be easier to follow with a .once() handler
    // in flow(), but that is too slow.
    this.on('readable', pipeOnReadable);

    state.flowing = true;
    process.nextTick(function() {
      flow(src);
    });
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var dest = this;
    var state = src._readableState;
    state.awaitDrain--;
    if (state.awaitDrain === 0)
      flow(src);
  };
}

function flow(src) {
  var state = src._readableState;
  var chunk;
  state.awaitDrain = 0;

  function write(dest, i, list) {
    var written = dest.write(chunk);
    if (false === written) {
      state.awaitDrain++;
    }
  }

  while (state.pipesCount && null !== (chunk = src.read())) {

    if (state.pipesCount === 1)
      write(state.pipes, 0, null);
    else
      forEach(state.pipes, write);

    src.emit('data', chunk);

    // if anyone needs a drain, then we have to wait for that.
    if (state.awaitDrain > 0)
      return;
  }

  // if every destination was unpiped, either before entering this
  // function, or in the while loop, then stop flowing.
  //
  // NB: This is a pretty rare edge case.
  if (state.pipesCount === 0) {
    state.flowing = false;

    // if there were data event listeners added, then switch to old mode.
    if (EE.listenerCount(src, 'data') > 0)
      emitDataEvents(src);
    return;
  }

  // at this point, no one needed a drain, so we just ran out of data
  // on the next readable event, start it over again.
  state.ranOut = true;
}

function pipeOnReadable() {
  if (this._readableState.ranOut) {
    this._readableState.ranOut = false;
    flow(this);
  }
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    this.removeListener('readable', pipeOnReadable);
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    this.removeListener('readable', pipeOnReadable);
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data' && !this._readableState.flowing)
    emitDataEvents(this);

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        this.read(0);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  emitDataEvents(this);
  this.read(0);
  this.emit('resume');
};

Readable.prototype.pause = function() {
  emitDataEvents(this, true);
  this.emit('pause');
};

function emitDataEvents(stream, startPaused) {
  var state = stream._readableState;

  if (state.flowing) {
    // https://github.com/isaacs/readable-stream/issues/16
    throw new Error('Cannot switch to old mode now.');
  }

  var paused = startPaused || false;
  var readable = false;

  // convert to an old-style stream.
  stream.readable = true;
  stream.pipe = Stream.prototype.pipe;
  stream.on = stream.addListener = Stream.prototype.on;

  stream.on('readable', function() {
    readable = true;

    var c;
    while (!paused && (null !== (c = stream.read())))
      stream.emit('data', c);

    if (c === null) {
      readable = false;
      stream._readableState.needReadable = true;
    }
  });

  stream.pause = function() {
    paused = true;
    this.emit('pause');
  };

  stream.resume = function() {
    paused = false;
    if (readable)
      process.nextTick(function() {
        stream.emit('readable');
      });
    else
      this.read(0);
    this.emit('resume');
  };

  // now make it start, just in case it hadn't already.
  stream.emit('readable');
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    if (state.decoder)
      chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    //if (state.objectMode && util.isNullOrUndefined(chunk))
    if (state.objectMode && (chunk === null || chunk === undefined))
      return;
    else if (!state.objectMode && (!chunk || !chunk.length))
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (typeof stream[i] === 'function' &&
        typeof this[i] === 'undefined') {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }}(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};



// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted && state.calledRead) {
    state.ended = true;
    process.nextTick(function() {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit('end');
      }
    });
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

}).call(this,require('_process'))
},{"_process":11,"buffer":3,"core-util-is":74,"events":5,"inherits":89,"isarray":110,"stream":31,"string_decoder/":111}],108:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);


function TransformState(options, stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined)
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  var ts = this._transformState = new TransformState(options, this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  this.once('finish', function() {
    if ('function' === typeof this._flush)
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var rs = stream._readableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./_stream_duplex":105,"core-util-is":74,"inherits":89}],109:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, cb), and it'll handle all
// the drain event emission and buffering.

module.exports = Writable;

/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Stream = require('stream');

util.inherits(Writable, Stream);

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
}

function WritableState(options, stream) {
  options = options || {};

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : 16 * 1024;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, becuase any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.buffer = [];

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;
}

function Writable(options) {
  var Duplex = require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, state, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  process.nextTick(function() {
    cb(er);
  });
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  if (!Buffer.isBuffer(chunk) &&
      'string' !== typeof chunk &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    process.nextTick(function() {
      cb(er);
    });
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (typeof cb !== 'function')
    cb = function() {};

  if (state.ended)
    writeAfterEnd(this, state, cb);
  else if (validChunk(this, state, chunk, cb))
    ret = writeOrBuffer(this, state, chunk, encoding, cb);

  return ret;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);
  if (Buffer.isBuffer(chunk))
    encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret)
    state.needDrain = true;

  if (state.writing)
    state.buffer.push(new WriteReq(chunk, encoding, cb));
  else
    doWrite(stream, state, len, chunk, encoding, cb);

  return ret;
}

function doWrite(stream, state, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  if (sync)
    process.nextTick(function() {
      cb(er);
    });
  else
    cb(er);

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(stream, state);

    if (!finished && !state.bufferProcessing && state.buffer.length)
      clearBuffer(stream, state);

    if (sync) {
      process.nextTick(function() {
        afterWrite(stream, state, finished, cb);
      });
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  cb();
  if (finished)
    finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;

  for (var c = 0; c < state.buffer.length; c++) {
    var entry = state.buffer[c];
    var chunk = entry.chunk;
    var encoding = entry.encoding;
    var cb = entry.callback;
    var len = state.objectMode ? 1 : chunk.length;

    doWrite(stream, state, len, chunk, encoding, cb);

    // if we didn't call the onwrite immediately, then
    // it means that we need to wait until it does.
    // also, that means that the chunk and cb are currently
    // being processed, so move the buffer counter past them.
    if (state.writing) {
      c++;
      break;
    }
  }

  state.bufferProcessing = false;
  if (c < state.buffer.length)
    state.buffer = state.buffer.slice(c);
  else
    state.buffer.length = 0;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (typeof chunk !== 'undefined' && chunk !== null)
    this.write(chunk, encoding);

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(stream, state) {
  return (state.ending &&
          state.length === 0 &&
          !state.finished &&
          !state.writing);
}

function finishMaybe(stream, state) {
  var need = needFinish(stream, state);
  if (need) {
    state.finished = true;
    stream.emit('finish');
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      process.nextTick(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

}).call(this,require('_process'))
},{"./_stream_duplex":105,"_process":11,"buffer":3,"core-util-is":74,"inherits":89,"stream":31}],110:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],111:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":3}],112:[function(require,module,exports){
(function (process){
var Stream = require('stream'); // hack to fix a circular dependency issue when used with browserify
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = Stream;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');
if (!process.browser && process.env.READABLE_STREAM === 'disable') {
  module.exports = require('stream');
}

}).call(this,require('_process'))
},{"./lib/_stream_duplex.js":105,"./lib/_stream_passthrough.js":106,"./lib/_stream_readable.js":107,"./lib/_stream_transform.js":108,"./lib/_stream_writable.js":109,"_process":11,"stream":31}],113:[function(require,module,exports){
'use strict'

function ReInterval (callback, interval, args) {
  var self = this;

  this._callback = callback;
  this._args = args;

  this._interval = setInterval(callback, interval, this._args);

  this.reschedule = function (interval) {
    // if no interval entered, use the interval passed in on creation
    if (!interval)
      interval = self._interval;

    if (self._interval)
      clearInterval(self._interval);
    self._interval = setInterval(self._callback, interval, self._args);
  };

  this.clear = function () {
    if (self._interval) {
      clearInterval(self._interval);
      self._interval = undefined;
    }
  };
  
  this.destroy = function () {
    if (self._interval) {
      clearInterval(self._interval);
    }
    self._callback = undefined;
    self._interval = undefined;
    self._args = undefined;
  };
}

function reInterval () {
  if (typeof arguments[0] !== 'function')
    throw new Error('callback needed');
  if (typeof arguments[1] !== 'number')
    throw new Error('interval needed');

  var args;

  if (arguments.length > 0) {
    args = new Array(arguments.length - 2);

    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i + 2];
    }
  }

  return new ReInterval(arguments[0], arguments[1], args);
}

module.exports = reInterval;

},{}],114:[function(require,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"buffer":3,"dup":30}],115:[function(require,module,exports){
module.exports = shift

function shift (stream) {
  var rs = stream._readableState
  if (!rs) return null
  return rs.objectMode ? stream.read() : stream.read(getStateLength(rs))
}

function getStateLength (state) {
  if (state.buffer.length) {
    // Since node 6.3.0 state.buffer is a BufferList not an array
    if (state.buffer.head) {
      return state.buffer.head.data.length
    }

    return state.buffer[0].length
  }

  return state.length
}

},{}],116:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"safe-buffer":114}],117:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"./_stream_readable":119,"./_stream_writable":121,"core-util-is":74,"dup":17,"inherits":89,"process-nextick-args":104}],118:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"./_stream_transform":120,"core-util-is":74,"dup":18,"inherits":89}],119:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"./_stream_duplex":117,"./internal/streams/BufferList":122,"./internal/streams/destroy":123,"./internal/streams/stream":124,"_process":11,"core-util-is":74,"dup":19,"events":5,"inherits":89,"isarray":90,"process-nextick-args":104,"safe-buffer":114,"string_decoder/":116,"util":2}],120:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"./_stream_duplex":117,"core-util-is":74,"dup":20,"inherits":89}],121:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"./_stream_duplex":117,"./internal/streams/destroy":123,"./internal/streams/stream":124,"_process":11,"core-util-is":74,"dup":21,"inherits":89,"process-nextick-args":104,"safe-buffer":114,"timers":32,"util-deprecate":127}],122:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22,"safe-buffer":114,"util":2}],123:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23,"process-nextick-args":104}],124:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"events":5}],125:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"./lib/_stream_duplex.js":117,"./lib/_stream_passthrough.js":118,"./lib/_stream_readable.js":119,"./lib/_stream_transform.js":120,"./lib/_stream_writable.js":121,"dup":27}],126:[function(require,module,exports){
(function (process){
var Transform = require('readable-stream').Transform
  , inherits  = require('util').inherits
  , xtend     = require('xtend')

function DestroyableTransform(opts) {
  Transform.call(this, opts)
  this._destroyed = false
}

inherits(DestroyableTransform, Transform)

DestroyableTransform.prototype.destroy = function(err) {
  if (this._destroyed) return
  this._destroyed = true
  
  var self = this
  process.nextTick(function() {
    if (err)
      self.emit('error', err)
    self.emit('close')
  })
}

// a noop _transform function
function noop (chunk, enc, callback) {
  callback(null, chunk)
}


// create a new export function, used by both the main export and
// the .ctor export, contains common logic for dealing with arguments
function through2 (construct) {
  return function (options, transform, flush) {
    if (typeof options == 'function') {
      flush     = transform
      transform = options
      options   = {}
    }

    if (typeof transform != 'function')
      transform = noop

    if (typeof flush != 'function')
      flush = null

    return construct(options, transform, flush)
  }
}


// main export, just make me a transform stream!
module.exports = through2(function (options, transform, flush) {
  var t2 = new DestroyableTransform(options)

  t2._transform = transform

  if (flush)
    t2._flush = flush

  return t2
})


// make me a reusable prototype that I can `new`, or implicitly `new`
// with a constructor call
module.exports.ctor = through2(function (options, transform, flush) {
  function Through2 (override) {
    if (!(this instanceof Through2))
      return new Through2(override)

    this.options = xtend(options, override)

    DestroyableTransform.call(this, this.options)
  }

  inherits(Through2, DestroyableTransform)

  Through2.prototype._transform = transform

  if (flush)
    Through2.prototype._flush = flush

  return Through2
})


module.exports.obj = through2(function (options, transform, flush) {
  var t2 = new DestroyableTransform(xtend({ objectMode: true, highWaterMark: 16 }, options))

  t2._transform = transform

  if (flush)
    t2._flush = flush

  return t2
})

}).call(this,require('_process'))
},{"_process":11,"readable-stream":125,"util":37,"xtend":131}],127:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],128:[function(require,module,exports){
(function (process,global,Buffer){
'use strict'

var through = require('through2')
var duplexify = require('duplexify')
var WS = require('ws')

module.exports = WebSocketStream

function WebSocketStream(target, protocols, options) {
  var stream, socket

  var isBrowser = process.title === 'browser'
  var isNative = !!global.WebSocket
  var socketWrite = isBrowser ? socketWriteBrowser : socketWriteNode
  var proxy = through.obj(socketWrite, socketEnd)

  if (protocols && !Array.isArray(protocols) && 'object' === typeof protocols) {
    // accept the "options" Object as the 2nd argument
    options = protocols
    protocols = null

    if (typeof options.protocol === 'string' || Array.isArray(options.protocol)) {
      protocols = options.protocol;
    }
  }

  if (!options) options = {}

  // browser only: sets the maximum socket buffer size before throttling
  var bufferSize = options.browserBufferSize || 1024 * 512

  // browser only: how long to wait when throttling
  var bufferTimeout = options.browserBufferTimeout || 1000

  // use existing WebSocket object that was passed in
  if (typeof target === 'object') {
    socket = target
  // otherwise make a new one
  } else {
    // special constructor treatment for native websockets in browsers, see
    // https://github.com/maxogden/websocket-stream/issues/82
    if (isNative && isBrowser) {
      socket = new WS(target, protocols)
    } else {
      socket = new WS(target, protocols, options)
    }

    socket.binaryType = 'arraybuffer'
  }

  // was already open when passed in
  if (socket.readyState === WS.OPEN) {
    stream = proxy
  } else {
    stream = duplexify.obj()
    socket.onopen = onopen
  }

  stream.socket = socket

  socket.onclose = onclose
  socket.onerror = onerror
  socket.onmessage = onmessage

  proxy.on('close', destroy)

  var coerceToBuffer = options.binary || options.binary === undefined

  function socketWriteNode(chunk, enc, next) {
    if (coerceToBuffer && typeof chunk === 'string') {
      chunk = new Buffer(chunk, 'utf8')
    }
    socket.send(chunk, next)
  }

  function socketWriteBrowser(chunk, enc, next) {
    if (socket.bufferedAmount > bufferSize) {
      setTimeout(socketWriteBrowser, bufferTimeout, chunk, enc, next)
      return
    }

    if (coerceToBuffer && typeof chunk === 'string') {
      chunk = new Buffer(chunk, 'utf8')
    }

    try {
      socket.send(chunk)
    } catch(err) {
      return next(err)
    }

    next()
  }

  function socketEnd(done) {
    socket.close()
    done()
  }

  function onopen() {
    stream.setReadable(proxy)
    stream.setWritable(proxy)
    stream.emit('connect')
  }

  function onclose() {
    stream.end()
    stream.destroy()
  }

  function onerror(err) {
    stream.destroy(err)
  }

  function onmessage(event) {
    var data = event.data
    if (data instanceof ArrayBuffer) data = new Buffer(new Uint8Array(data))
    else data = new Buffer(data)
    proxy.push(data)
  }

  function destroy() {
    socket.close()
  }

  return stream
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"_process":11,"buffer":3,"duplexify":76,"through2":126,"ws":129}],129:[function(require,module,exports){

var ws = null

if (typeof WebSocket !== 'undefined') {
  ws = WebSocket
} else if (typeof MozWebSocket !== 'undefined') {
  ws = MozWebSocket
} else {
  ws = window.WebSocket || window.MozWebSocket
}

module.exports = ws

},{}],130:[function(require,module,exports){
// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}

},{}],131:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[48]);
