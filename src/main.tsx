import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, message } from 'antd'
import ruRU from 'antd/locale/ru_RU'
import type { ArgsProps } from 'antd/es/message/interface'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

type MessageMethod = typeof message.success

function isMessageArgsProps(content: Parameters<MessageMethod>[0]): content is ArgsProps {
  if (typeof content !== 'object' || content === null || Array.isArray(content)) {
    return false
  }
  return 'content' in content || 'key' in content || 'type' in content || 'onClick' in content
}

function withDefaultMessageDuration(method: MessageMethod, defaultDurationSeconds: number): MessageMethod {
  return ((content: Parameters<MessageMethod>[0], duration?: number, onClose?: Parameters<MessageMethod>[2]) => {
    if (isMessageArgsProps(content)) {
      return method({
        ...content,
        duration: content.duration ?? defaultDurationSeconds,
      })
    }
    return method(content, duration ?? defaultDurationSeconds, onClose)
  }) as MessageMethod
}

message.success = withDefaultMessageDuration(message.success.bind(message), 3)
message.error = withDefaultMessageDuration(message.error.bind(message), 6)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={ruRU}
        theme={{
          token: {
            colorPrimary: '#7C3AED',
            colorText: '#1E293B',
            colorTextSecondary: '#64748B',
            colorBorder: '#F1F5F9',
            borderRadius: 6,
          },
        }}
      >
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
)

