import 'server-only';
import { parseEnvironment } from './environment';
export function readEnvironment() {
  return parseEnvironment(process.env);
}
