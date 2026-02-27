import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'

export default function SubscriptionSuccess() {
  const navigate = useNavigate()

  return (
    <>
      <Header />
      <div style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
        <Result
          status="success"
          title="Оплата прошла успешно"
          subTitle="Подписка активирована. Спасибо!"
          extra={
            <Button type="primary" onClick={() => navigate('/profile')}>
              В профиль
            </Button>
          }
        />
      </div>
    </>
  )
}
