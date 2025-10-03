export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function getOTPExpiry(): number {
  // OTP expires in 10 minutes
  return Date.now() + 10 * 60 * 1000
}
