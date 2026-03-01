import { Link } from 'react-router-dom'
import { Button, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

const { Title } = Typography

interface LegalPageLayoutProps {
  title: string
  children: React.ReactNode
}

export default function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #F1F5F9 100%)',
        padding: '24px 24px 48px',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link to="/">
          <Button type="text" icon={<ArrowLeftOutlined />} style={{ marginBottom: 24, color: '#64748B' }}>
            На главную
          </Button>
        </Link>
        <Title level={2} style={{ color: '#1E293B', marginBottom: 32 }}>
          {title}
        </Title>
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: '#334155',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
