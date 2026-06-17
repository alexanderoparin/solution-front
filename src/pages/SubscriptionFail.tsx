import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'

export default function SubscriptionFail() {
  const navigate = useNavigate()

  return (
    <>
      <Header />
      <div style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
        <Result
          status="error"
          title="Оплата не прошла"
          subTitle="Попробуйте снова или выберите другой способ оплаты (карта или СБП)."
          extra={[
            <Button key="profile" type="primary" onClick={() => navigate('/profile')}>
              В профиль
            </Button>,
            <Button key="retry" onClick={() => navigate('/advertising/campaign-manage')}>
              К управлению РК
            </Button>,
          ]}
        />
      </div>
    </>
  )
}
