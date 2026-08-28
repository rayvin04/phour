import { NextResponse } from 'next/server'
import { requireClerkUserId } from '@/lib/auth/require-user'
import { habitsRepository } from '@/lib/appwrite/repositories/habits.repository'
export async function GET() { try { return NextResponse.json(await habitsRepository.list(await requireClerkUserId())) } catch (error) { return fail(error) } }
export async function POST(request: Request) { try { const body = await request.json() as { title?: unknown }; const title = typeof body.title === 'string' ? body.title.trim() : ''; if (!title || title.length > 120) throw new Error('Habit title must be between 1 and 120 characters.'); return NextResponse.json(await habitsRepository.create(await requireClerkUserId(), { title, frequency: 'daily', streak: 0, completedDates: [] }), { status: 201 }) } catch (error) { return fail(error) } }
function fail(error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected server error.' }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 400 }) }
