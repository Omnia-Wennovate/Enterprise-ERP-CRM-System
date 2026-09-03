import { CommunicationLayoutClient } from './CommunicationLayoutClient'

export default function CommunicationLayout({ children }: { children: React.ReactNode }) {
  return <CommunicationLayoutClient>{children}</CommunicationLayoutClient>
}
