export async function verifyAccessCode(code: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(code, hash);
}
