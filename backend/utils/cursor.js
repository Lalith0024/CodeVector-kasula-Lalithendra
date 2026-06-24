class InvalidCursorError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidCursorError';
  }
}

// Cursor encodes the sort position of the last seen row (created_at, id) 
// so the next query starts exactly after it instead of relying on a page offset.
function encodeCursor({ created_at, id }) {
  const jsonStr = JSON.stringify({ created_at, id });
  return Buffer.from(jsonStr).toString('base64url');
}

function decodeCursor(str) {
  try {
    const jsonStr = Buffer.from(str, 'base64url').toString('utf8');
    const decoded = JSON.parse(jsonStr);

    if (
      typeof decoded.created_at !== 'number' ||
      typeof decoded.id !== 'number'
    ) {
      throw new InvalidCursorError('Invalid cursor payload structure');
    }

    return decoded;
  } catch (err) {
    if (err instanceof InvalidCursorError) {
      throw err;
    }
    throw new InvalidCursorError('Malformed cursor string');
  }
}

module.exports = {
  InvalidCursorError,
  encodeCursor,
  decodeCursor
};
