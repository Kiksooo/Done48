/** Бонус пригласившему за регистрацию по ссылке (согласовано с копирайтом в кабинете). */
export const REFERRAL_REWARD_RUBLES = 50;
export const REFERRAL_REWARD_CENTS = REFERRAL_REWARD_RUBLES * 100;

export function maskInviteeEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length <= 1) return `*@${domain}`;
  const visible = local.slice(0, 1);
  const stars = "*".repeat(Math.min(local.length - 1, 5));
  return `${visible}${stars}@${domain}`;
}
