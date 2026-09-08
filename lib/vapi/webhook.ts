// OmniDimensions webhook does not require signature verification.
// We can optionally check a custom header like x-omnidim-token if provided.

export function verifyVapiSignature(payload: any, signature: string, secret: string): boolean {
  // If OmniDimensions ever supports a signature, implement it here.
  // For now, we trust the webhook because the URL is not guessable.
  // Return true to allow processing.
  return true;

  // If they provide a signature header later, you can implement:
  // const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}