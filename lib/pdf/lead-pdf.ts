import type { LeadWithAgent } from '@/types/leads'
import { getLeadSummarySections, type LeadRequestInfo } from '@/lib/lead-summary'

// ============================================================================
// LEAD PDF — downloadable lead summary for the Operations team
// ============================================================================

const GOLD: [number, number, number] = [200, 169, 81]
const DARK: [number, number, number] = [30, 30, 30]
const MUTED: [number, number, number] = [110, 110, 110]

async function loadImage(src: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const blob = await (await fetch(src)).blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = reject
      img.src = dataUrl
    })
    return { dataUrl, width, height }
  } catch {
    return null
  }
}

export async function downloadLeadPdf(lead: LeadWithAgent, request?: LeadRequestInfo): Promise<void> {
  const doc = await buildLeadPdf(lead, request)
  const safeName = lead.lead_name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'lead'
  doc.save(`Lead-${safeName}.pdf`)
}

export async function buildLeadPdf(lead: LeadWithAgent, request?: LeadRequestInfo) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 48
  const contentW = pageW - margin * 2
  const labelW = 130
  let y = margin

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin - 20) {
      doc.addPage()
      y = margin
    }
  }

  // ── Header ──
  const logo = await loadImage('/omnia-logo.png')
  if (logo) {
    const h = 54
    const w = (logo.width / logo.height) * h
    doc.addImage(logo.dataUrl, 'PNG', margin, y, w, h)
  }
  doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(...DARK)
  doc.text('LEAD SUMMARY', pageW - margin, y + 20, { align: 'right' })
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTED)
  doc.text('Booking request for Operations', pageW - margin, y + 35, { align: 'right' })
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`,
    pageW - margin, y + 48, { align: 'right' })
  y += 66
  doc.setDrawColor(...GOLD).setLineWidth(2).line(margin, y, pageW - margin, y)
  y += 28

  // ── Title ──
  doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(...DARK)
  doc.text(doc.splitTextToSize(lead.lead_name, contentW), margin, y)
  y += 18
  const subtitle = [lead.company, lead.destination].filter(Boolean).join('  |  ')
  if (subtitle) {
    doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(...MUTED)
    doc.text(subtitle, margin, y)
    y += 10
  }
  y += 16

  // ── Sections ──
  for (const section of getLeadSummarySections(lead, request)) {
    ensureSpace(48)
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...GOLD)
    doc.text(section.title.toUpperCase(), margin, y)
    y += 6
    doc.setDrawColor(230, 230, 230).setLineWidth(0.75).line(margin, y, pageW - margin, y)
    y += 16

    doc.setFontSize(10)
    for (const row of section.rows) {
      const lines = doc.splitTextToSize(row.value, contentW - labelW)
      ensureSpace(lines.length * 13 + 4)
      doc.setFont('helvetica', 'normal').setTextColor(...MUTED)
      doc.text(row.label, margin, y)
      doc.setFont('helvetica', 'bold').setTextColor(...DARK)
      doc.text(lines, margin + labelW, y)
      y += lines.length * 13 + 4
    }

    if (section.paragraph?.trim()) {
      doc.setFont('helvetica', 'normal').setTextColor(...DARK)
      for (const line of doc.splitTextToSize(section.paragraph, contentW)) {
        ensureSpace(14)
        doc.text(line, margin, y)
        y += 14
      }
    }
    y += 14
  }

  // ── Footer on every page ──
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED)
    doc.text('Omnia Business and Leisure Travel', margin, pageH - 24)
    doc.text(`Page ${i} of ${pages}`, pageW - margin, pageH - 24, { align: 'right' })
  }

  return doc
}
