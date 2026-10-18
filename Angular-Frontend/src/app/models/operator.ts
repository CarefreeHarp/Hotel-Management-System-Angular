import type { Administrator } from './administrator';

export interface Operator {
  operatorId: number;
  name: string;
  lastName: string;
  email: string;
  password: string;
  admin: Administrator;
}
