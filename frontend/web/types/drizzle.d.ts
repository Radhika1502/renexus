declare module 'drizzle-orm' {
  export function relations(table: any, relationsFn: any): any;
}

declare module 'drizzle-orm/pg-core' {
  export function pgTable(tableName: string, columns: Record<string, any>): any;
  export function uuid(name: string): any;
  export function varchar(name: string, options?: { length?: number }): any;
  export function text(name: string): any;
  export function timestamp(name: string): any;
  export function boolean(name: string): any;
  export function integer(name: string): any;
  export function jsonb(name: string): any;
  export function numeric(name: string, options?: { precision?: number, scale?: number }): any;
}
