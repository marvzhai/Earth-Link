import { NextResponse } from 'next/server';
import pool, { testConnection } from '@/lib/db';

export async function GET() {
  try {
    // Test connection first
    await testConnection();
    
    // Check database connection
    const [rows] = await pool.query('SELECT 1 as health');
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: rows[0].health === 1 ? 'connected' : 'disconnected'
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
        database: 'disconnected'
      },
      { status: 500 }
    );
  }
}
