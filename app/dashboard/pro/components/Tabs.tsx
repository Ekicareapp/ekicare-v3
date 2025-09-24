import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills';
}

export default function Tabs({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = '',
  variant = 'default'
}: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className={`flex ${className}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none
              ${activeTab === tab.id
                ? 'bg-[#f86f4d15] text-[#f86f4d]'
                : 'text-[#6b7280] hover:bg-[#f86f4d10]'
              }
            `}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`
                ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                ${activeTab === tab.id
                  ? 'bg-[#f86f4d] text-white'
                  : 'bg-[#f3f4f6] text-[#6b7280]'
                }
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`border-b border-[#e5e7eb] ${className}`}>
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 inline-flex items-center focus:outline-none
              ${activeTab === tab.id
                ? 'border-[#f86f4d] text-[#f86f4d]'
                : 'border-transparent text-[#6b7280]'
              }
            `}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`
                ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                ${activeTab === tab.id
                  ? 'bg-[#f86f4d] text-white'
                  : 'bg-[#f3f4f6] text-[#6b7280]'
                }
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
