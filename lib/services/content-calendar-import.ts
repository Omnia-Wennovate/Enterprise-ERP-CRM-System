// ============================================================================
// CONTENT CALENDAR PDF IMPORT — server only
// Reads a content calendar PDF with the configured AI provider and returns
// structured entries for the Weekly Planner. Nothing is written to the DB here.
// ============================================================================

import { z } from 'zod'
import { generateWithFallback } from './ai-provider'
import type { ImportedCalendar, ImportedCalendarEntry } from '@/types/marketing'

const PLATFORMS = ['tiktok', 'instagram', 'facebook'] as const
const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const EntrySchema = z.object({
  date: DATE,
  content: z.string().catch(''),
  platform: z.enum(PLATFORMS).catch('tiktok'),
  cross_post_platforms: z.array(z.string()).catch([]),
  host: z.string().nullable().catch(null),
  is_featured: z.boolean().catch(false),
  is_gap_day: z.boolean().catch(false),
  recording: z.enum(['recorded', 'scheduled', 'none']).catch('none'),
  recording_date: DATE.nullable().catch(null),
})

const BacklogSchema = z.object({
  title: z.string().min(1),
  category: z.enum(['recorded', 'to_record', 'idea', 'coming_up']).catch('idea'),
  host: z.string().nullable().catch(null),
  status: z.string().nullable().catch(null),
})

const SYSTEM_PROMPT = `You extract a social media content calendar from a PDF so it can be loaded into a planning tool.

Return ONE JSON object with exactly this shape:
{
  "cycle_start": "YYYY-MM-DD" or null,
  "entries": [{
    "date": "YYYY-MM-DD",
    "content": string,
    "platform": "tiktok" | "instagram" | "facebook",
    "cross_post_platforms": string[],
    "host": string or null,
    "is_featured": boolean,
    "is_gap_day": boolean,
    "recording": "recorded" | "scheduled" | "none",
    "recording_date": "YYYY-MM-DD" or null
  }],
  "notes": string[],
  "backlog": [{
    "title": string,
    "category": "recorded" | "to_record" | "idea" | "coming_up",
    "host": string or null,
    "status": string or null
  }]
}

Field rules:
- cycle_start: the first date the calendar covers.
- entries: one per calendar row (one row = one day). "date" is the day it airs.
- content: the text in the main platform's column, verbatim. Drop decorative symbols like ★ but keep arrows and quotes.
- platform: the column that holds the actual content (usually TikTok).
- cross_post_platforms: the other platforms whose cell says "Same as <main platform>". A cell of "—", "-" or blank means that platform does not post; leave it out.
- host: the Host column as written (e.g. "Alamin", "Blen + Staff", "No host"); null when it is "—" or blank.
- is_featured: true for rows the document highlights as special (e.g. coloured/bold rows the legend explains, such as a featured presenter's content).
- is_gap_day: true when the row is a gap/rest day with no posting; set content to "Gap day".
- recording: recording details usually live in a separate "Recording Schedule" table. Match its rows to entries by content and air date. "Already recorded" → "recorded". A specific recording day → "scheduled" with recording_date set. Entries not listed there → "none".
- notes: each bullet in the "Notes" section, verbatim.
- backlog: every item in leftover/backlog sections. Category: recorded but not yet used → "recorded"; still needs recording/filming, or pending footage → "to_record"; ideas to confirm, research or retire → "idea"; upcoming launches, products, events or plans → "coming_up". If a section heading names a person (e.g. "Alamin: still to record"), use that person as host for its items. status is the status/plan column text, verbatim.

Never invent content. Use [] when a section is missing.`

export async function extractContentCalendarFromPdf(
  pdfBase64: string,
  signal?: AbortSignal
): Promise<{ calendar: ImportedCalendar; provider: string; model: string }> {
  const today = new Date().toISOString().slice(0, 10)
  const userPrompt =
    `Extract the content calendar from the attached PDF. Today is ${today}. ` +
    `If a date has no year, use the year stated in the document, otherwise ${today.slice(0, 4)}.`

  const { result, provider, model } = await generateWithFallback(SYSTEM_PROMPT, userPrompt, signal, {
    attachment: { mimeType: 'application/pdf', base64: pdfBase64 },
    temperature: 0,
  })

  const raw = (result ?? {}) as Record<string, unknown>

  // Validate item by item so one malformed row doesn't sink the whole import
  const entries = (Array.isArray(raw.entries) ? raw.entries : [])
    .map((e) => EntrySchema.safeParse(e))
    .filter((r) => r.success)
    .map((r) => r.data as ImportedCalendarEntry)
    .map((e) => ({
      ...e,
      content: e.is_gap_day ? 'Gap day' : e.content.trim(),
      host: e.host?.trim() && !/^[—–-]$/.test(e.host.trim()) ? e.host.trim() : null,
      cross_post_platforms: e.cross_post_platforms.filter(
        (p) => (PLATFORMS as readonly string[]).includes(p) && p !== e.platform
      ),
      recording_date: e.recording === 'scheduled' ? e.recording_date : null,
    }))
    .filter((e) => e.is_gap_day || e.content)
    .sort((a, b) => a.date.localeCompare(b.date))

  const backlog = (Array.isArray(raw.backlog) ? raw.backlog : [])
    .map((b) => BacklogSchema.safeParse(b))
    .filter((r) => r.success)
    .map((r) => r.data!)

  const notes = (Array.isArray(raw.notes) ? raw.notes : [])
    .filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
    .map((n) => n.trim())

  const cycleStart = DATE.safeParse(raw.cycle_start).success ? (raw.cycle_start as string) : entries[0]?.date ?? null

  return {
    calendar: { cycle_start: cycleStart, entries, notes, backlog },
    provider,
    model,
  }
}
