import mysql, { type Pool, type PoolConnection, type RowDataPacket } from 'mysql2/promise'

const globalForDb = globalThis as unknown as { mysqlPool?: Pool }

export const REQUIRED_TABLES = ['categorias', 'proveedores', 'productos', 'ventas', 'detalle_ventas'] as const

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

export function getPool(): Pool {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('La variable DATABASE_URL no está configurada')

  if (!globalForDb.mysqlPool) {
    globalForDb.mysqlPool = mysql.createPool({
      uri: url,
      connectionLimit: 5,
      waitForConnections: true,
      decimalNumbers: true,
      // Keep DATE/DATETIME as plain strings so they serialize cleanly to client components.
      dateStrings: true,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    })
  }
  return globalForDb.mysqlPool
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(sql, params)
  return rows as T[]
}

export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await getPool().getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

export type DbStatus =
  | { state: 'ok' }
  | { state: 'missing-config' }
  | { state: 'missing-tables' }
  | { state: 'error'; message: string }

export async function getDbStatus(): Promise<DbStatus> {
  if (!isDbConfigured()) return { state: 'missing-config' }
  try {
    const rows = await query<{ n: number }>(
      `SELECT COUNT(*) AS n FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name IN (?)`,
      [REQUIRED_TABLES],
    )
    return Number(rows[0]?.n) === REQUIRED_TABLES.length ? { state: 'ok' } : { state: 'missing-tables' }
  } catch (error) {
    return { state: 'error', message: error instanceof Error ? error.message : 'Error desconocido' }
  }
}
