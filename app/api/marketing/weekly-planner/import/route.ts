// ============================================================================
// CONTENT CALENDAR PDF IMPORT — API Route
// POST /api/marketing/weekly-planner/import  (multipart form, field "file")
// Returns the extracted calendar for preview; the client saves it.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { extractContentCalendarFromPdf } from '@/lib/services/content-calendar-import'

export const maxDuration = 60

// Vercel rejects request bodies over 4.5 MB
const MAX_BYTES = 4 * 1024 * 1024

export async function POST(request: NextRequest) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected a file upload' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'PDF is too large (max 4 MB)' }, { status: 413 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  if (bytes.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return NextResponse.json({ error: 'That file is not a PDF' }, { status: 400 })
  }

  try {
    const { calendar, provider, model } = await extractContentCalendarFromPdf(
      bytes.toString('base64'),
      request.signal
    )

    if (calendar.entries.length === 0 && calendar.backlog.length === 0) {
      return NextResponse.json(
        { error: "Couldn't find a content calendar in this PDF." },
        { status: 422 }
      )
    }

    return NextResponse.json({ calendar, provider, model })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[WeeklyPlanner/Import] Extraction failed:', message)
    return NextResponse.json(
      { error: `Couldn't read the PDF: ${message.substring(0, 300)}` },
      { status: 500 }
    )
  }
}
