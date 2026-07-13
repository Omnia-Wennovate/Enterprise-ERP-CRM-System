'use client'

import type { Lead, Customer, Quotation, Activity, Task } from '@/types'

// Storage keys
const STORAGE_KEYS = {
  LEADS: 'travelos_leads',
  CUSTOMERS: 'travelos_customers',
  QUOTATIONS: 'travelos_quotations',
  ACTIVITIES: 'travelos_activities',
  TASKS: 'travelos_tasks',
}

// Initialize with demo data
function initializeLeads(): Lead[] {
  return [
    {
      id: 'lead_001',
      company_name: 'Paradise Travel Corp',
      contact_name: 'John Smith',
      email: 'john@paradise.com',
      phone: '+1-555-0101',
      status: 'qualified',
      source: 'website',
      estimated_value: 50000,
      expected_close_date: '2026-07-15',
      assigned_to: 'user_001',
      assigned_to_name: 'Sarah Johnson',
      notes: 'High-value corporate client, interested in customized packages',
      created_at: '2026-06-01',
      updated_at: '2026-06-15',
      created_by: 'user_001',
    },
    {
      id: 'lead_002',
      company_name: 'Luxury Expeditions Ltd',
      contact_name: 'Emma Wilson',
      email: 'emma@luxury.com',
      phone: '+1-555-0102',
      status: 'proposal',
      source: 'referral',
      estimated_value: 75000,
      expected_close_date: '2026-07-30',
      assigned_to: 'user_001',
      assigned_to_name: 'Sarah Johnson',
      notes: 'Waiting for proposal review',
      created_at: '2026-05-20',
      updated_at: '2026-06-10',
      created_by: 'user_001',
    },
    {
      id: 'lead_003',
      company_name: 'Global Adventures Inc',
      contact_name: 'Michael Brown',
      email: 'michael@global.com',
      phone: '+1-555-0103',
      status: 'new',
      source: 'cold_call',
      estimated_value: 30000,
      expected_close_date: '2026-08-15',
      assigned_to: 'user_001',
      assigned_to_name: 'Sarah Johnson',
      notes: 'Initial contact, needs follow-up',
      created_at: '2026-06-14',
      updated_at: '2026-06-14',
      created_by: 'user_001',
    },
    {
      id: 'lead_004',
      company_name: 'Adventure Tours World',
      contact_name: 'Lisa Anderson',
      email: 'lisa@adventure.com',
      phone: '+1-555-0104',
      status: 'negotiation',
      source: 'email',
      estimated_value: 100000,
      expected_close_date: '2026-06-30',
      assigned_to: 'user_001',
      assigned_to_name: 'Sarah Johnson',
      notes: 'Major client, pricing negotiation in progress',
      created_at: '2026-04-15',
      updated_at: '2026-06-15',
      created_by: 'user_001',
    },
    {
      id: 'lead_005',
      company_name: 'Boutique Holidays',
      contact_name: 'David Miller',
      email: 'david@boutique.com',
      phone: '+1-555-0105',
      status: 'won',
      source: 'trade_show',
      estimated_value: 85000,
      expected_close_date: '2026-06-20',
      assigned_to: 'user_001',
      assigned_to_name: 'Sarah Johnson',
      notes: 'Signed contract, implementation starting',
      created_at: '2026-03-10',
      updated_at: '2026-06-12',
      created_by: 'user_001',
    },
  ]
}

function initializeCustomers(): Customer[] {
  return [
    {
      id: 'cust_001',
      company_name: 'Wanderlust Adventures',
      contact_name: 'Rachel Green',
      email: 'rachel@wanderlust.com',
      phone: '+1-555-1001',
      address: '123 Travel Lane',
      city: 'Los Angeles',
      country: 'USA',
      customer_type: 'tour_operator',
      annual_value: 500000,
      is_active: true,
      created_at: '2025-01-15',
      updated_at: '2026-06-15',
      last_booking_date: '2026-06-10',
    },
    {
      id: 'cust_002',
      company_name: 'Corporate Escapes Inc',
      contact_name: 'James Wilson',
      email: 'james@corpescapes.com',
      phone: '+1-555-1002',
      address: '456 Business Ave',
      city: 'New York',
      country: 'USA',
      customer_type: 'corporate',
      annual_value: 750000,
      is_active: true,
      created_at: '2024-06-20',
      updated_at: '2026-06-15',
      last_booking_date: '2026-06-08',
    },
    {
      id: 'cust_003',
      company_name: 'Leisure Travels Co',
      contact_name: 'Maria Garcia',
      email: 'maria@leisuretravel.com',
      phone: '+1-555-1003',
      address: '789 Holiday Blvd',
      city: 'Miami',
      country: 'USA',
      customer_type: 'leisure',
      annual_value: 300000,
      is_active: true,
      created_at: '2025-03-10',
      updated_at: '2026-06-14',
      last_booking_date: '2026-06-02',
    },
  ]
}

function initializeQuotations(): Quotation[] {
  return [
    {
      id: 'quote_001',
      quote_number: 'QT-2026-001',
      customer_id: 'cust_001',
      customer_name: 'Wanderlust Adventures',
      status: 'sent',
      total_amount: 85000,
      currency: 'USD',
      trip_destination: 'Iceland & Greenland',
      trip_start_date: '2026-08-15',
      trip_end_date: '2026-08-29',
      num_travelers: 25,
      created_at: '2026-06-10',
      valid_until: '2026-06-30',
      sent_at: '2026-06-11',
      accepted_at: null,
      notes: 'Adventure-focused itinerary with glacier tours and kayaking',
      created_by: 'user_001',
    },
    {
      id: 'quote_002',
      quote_number: 'QT-2026-002',
      customer_id: 'cust_002',
      customer_name: 'Corporate Escapes Inc',
      status: 'viewed',
      total_amount: 150000,
      currency: 'USD',
      trip_destination: 'Swiss Alps Retreat',
      trip_start_date: '2026-09-01',
      trip_end_date: '2026-09-08',
      num_travelers: 50,
      created_at: '2026-06-12',
      valid_until: '2026-07-12',
      sent_at: '2026-06-12',
      accepted_at: null,
      notes: 'Corporate team building with hiking and wellness activities',
      created_by: 'user_001',
    },
    {
      id: 'quote_003',
      quote_number: 'QT-2026-003',
      customer_id: 'cust_003',
      customer_name: 'Leisure Travels Co',
      status: 'accepted',
      total_amount: 65000,
      currency: 'USD',
      trip_destination: 'Mediterranean Cruise',
      trip_start_date: '2026-07-20',
      trip_end_date: '2026-07-27',
      num_travelers: 30,
      created_at: '2026-06-05',
      valid_until: '2026-06-25',
      sent_at: '2026-06-05',
      accepted_at: '2026-06-13',
      notes: 'All-inclusive cruise with shore excursions',
      created_by: 'user_001',
    },
  ]
}

function initializeActivities(): Activity[] {
  return [
    {
      id: 'act_001',
      type: 'call',
      title: 'Follow-up call with Paradise Travel',
      description: 'Discussed custom package requirements and timeline',
      related_to: 'lead_001',
      related_to_type: 'lead',
      assigned_to: 'user_001',
      assigned_to_name: 'Sarah Johnson',
      due_date: null,
      completed_at: '2026-06-14T14:30:00Z',
      created_at: '2026-06-14T14:00:00Z',
      created_by: 'user_001',
      duration_minutes: 30,
    },
    {
      id: 'act_002',
      type: 'email',
      title: 'Sent proposal to Luxury Expeditions',
      description: 'Sent detailed proposal with pricing and inclusions',
      related_to: 'lead_002',
      related_to_type: 'lead',
      assigned_to: 'user_001',
      assigned_to_name: 'Sarah Johnson',
      due_date: null,
      completed_at: '2026-06-10T10:15:00Z',
      created_at: '2026-06-10T10:00:00Z',
      created_by: 'user_001',
      duration_minutes: null,
    },
    {
      id: 'act_003',
      type: 'meeting',
      title: 'Client meeting with Adventure Tours World',
      description: 'In-person meeting to finalize contract terms',
      related_to: 'lead_004',
      related_to_type: 'lead',
      assigned_to: 'user_001',
      assigned_to_name: 'Sarah Johnson',
      due_date: '2026-06-20T10:00:00Z',
      completed_at: null,
      created_at: '2026-06-15T09:00:00Z',
      created_by: 'user_001',
      duration_minutes: null,
    },
    {
      id: 'act_004',
      type: 'note',
      title: 'Quotation review note',
      description: 'Reviewed pricing for Mediterranean cruise - all looks good',
      related_to: 'quote_003',
      related_to_type: 'quotation',
      assigned_to: 'user_001',
      assigned_to_name: 'Sarah Johnson',
      due_date: null,
      completed_at: '2026-06-13T16:45:00Z',
      created_at: '2026-06-13T16:45:00Z',
      created_by: 'user_001',
      duration_minutes: null,
    },
  ]
}

function initializeTasks(): Task[] {
  return [
    {
      id: 'task_001',
      title: 'Prepare detailed itinerary for Paradise Travel',
      description: 'Create day-by-day itinerary with accommodation and activity details',
      status: 'in_progress',
      priority: 'high',
      assigned_to: 'user_001',
      assigned_to_name: 'Sarah Johnson',
      due_date: '2026-06-20',
      completed_at: null,
      related_to: 'lead_001',
      related_to_type: 'lead',
      created_at: '2026-06-14',
      created_by: 'user_001',
      is_reminder_set: true,
    },
    {
      id: 'task_002',
      title: 'Follow up with Luxury Expeditions on proposal',
      description: 'Check if they have any questions about the proposal sent last week',
      status: 'to_do',
      priority: 'medium',
      assigned_to: 'user_001',
      assigned_to_name: 'Sarah Johnson',
      due_date: '2026-06-18',
      completed_at: null,
      related_to: 'lead_002',
      related_to_type: 'lead',
      created_at: '2026-06-15',
      created_by: 'user_001',
      is_reminder_set: true,
    },
    {
      id: 'task_003',
      title: 'Send contract to Adventure Tours World',
      description: 'Send finalized contract after legal review',
      status: 'completed',
      priority: 'high',
      assigned_to: 'user_001',
      assigned_to_name: 'Sarah Johnson',
      due_date: '2026-06-12',
      completed_at: '2026-06-12T14:00:00Z',
      related_to: 'lead_004',
      related_to_type: 'lead',
      created_at: '2026-06-10',
      created_by: 'user_001',
      is_reminder_set: false,
    },
  ]
}

// Storage utilities
export const storage = {
  // Leads
  getLeads(): Lead[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.LEADS)
    return data ? JSON.parse(data) : initializeLeads()
  },

  setLeads(leads: Lead[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads))
    }
  },

  // Customers
  getCustomers(): Customer[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS)
    return data ? JSON.parse(data) : initializeCustomers()
  },

  setCustomers(customers: Customer[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers))
    }
  },

  // Quotations
  getQuotations(): Quotation[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.QUOTATIONS)
    return data ? JSON.parse(data) : initializeQuotations()
  },

  setQuotations(quotations: Quotation[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(quotations))
    }
  },

  // Activities
  getActivities(): Activity[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES)
    return data ? JSON.parse(data) : initializeActivities()
  },

  setActivities(activities: Activity[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities))
    }
  },

  // Tasks
  getTasks(): Task[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEYS.TASKS)
    return data ? JSON.parse(data) : initializeTasks()
  },

  setTasks(tasks: Task[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
    }
  },
}
