import { useNavigate } from 'react-router-dom'
import { Button, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

const { Title } = Typography

interface LegalPageLayoutProps {
  title: string
  children: React.ReactNode
}

/**
 * Общий каркас юридических страниц (политика, соглашение, оферта и т.п.).
 */
export default function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #F1F5F9 100%)',
        padding: '24px 24px 48px',
      }}
    >
      <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{ marginBottom: 24, color: '#64748B', paddingLeft: 0 }}
        >
          Назад
        </Button>
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
