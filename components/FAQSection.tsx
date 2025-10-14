'use client'

import { useState } from 'react'

export type FAQItem = {
  question: string
  answer: string
}

type FAQSectionProps = {
  items: FAQItem[]
}

export default function FAQSection({ items }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section className="pt-10 md:pt-12 pb-16 md:pb-20 bg-[#F9FAFB]">
      <div className="max-w-[720px] mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#1B263B] text-center mb-8 md:mb-12">
          Questions fréquentes
        </h2>

        <div className="space-y-3">
          {items.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div key={index} className="bg-white border border-gray-100 rounded-sm">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between text-left px-4 md:px-5 py-4"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                >
                  <span className="text-base md:text-lg font-medium text-[#1B263B]">
                    {item.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div
                  id={`faq-panel-${index}`}
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 md:px-5 pb-4 pt-0 text-sm md:text-base text-[#6B7280]">
                      {item.answer}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}


