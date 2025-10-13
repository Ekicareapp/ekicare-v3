import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales | Ekicare',
  description: 'Mentions légales du site Ekicare.',
}

export default function MentionsLegalesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 prose prose-neutral">
      <h1>Mentions légales</h1>
      <p>Contenu légal temporaire (placeholder). Ce contenu sera remplacé par les informations officielles.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec aliquam sapien nec bibendum interdum.</p>
    </main>
  )
}
