'use client'

/**
 * NewCustomerModal — thin wrapper around CustomerFormModal for backwards compatibility.
 * Any existing imports of this component continue to work unchanged.
 */
import { CustomerFormModal } from './CustomerFormModal'
import type { Customer } from '@/types'

interface NewCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function NewCustomerModal({ isOpen, onClose, onSuccess }: NewCustomerModalProps) {
  return (
    <CustomerFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={(_customer: Customer) => {
        onClose()
        onSuccess()
      }}
    />
  )
}
