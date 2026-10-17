// Encode UTF-16 code units losslessly, including JSON strings with lone surrogates.
// A hex segment avoids slash, percent, query and router-decoding ambiguity.
export function catalogHref(id: string): string {
  const token = id
    .split('')
    .map((unit) => unit.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');
  return `/catalog/${token}`;
}
export function catalogId(token: string): string | null {
  if (!/^(?:[0-9a-f]{4})+$/.test(token)) return null;
  return token
    .match(/.{4}/g)!
    .map((unit) => String.fromCharCode(parseInt(unit, 16)))
    .join('');
}
