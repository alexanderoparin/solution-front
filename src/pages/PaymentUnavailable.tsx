import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'

export default function PaymentUnavailable() {
  const navigate = useNavigate()

  return (
    <>
      <Header />
      <div style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
        <Result
          status="info"
          title="Оплата временно недоступна"
          subTitle="Сервис оплаты находится в разработке. Бесплатный тариф можно активировать в окне выбора планов."
          extra={
            <>
              <Button type="primary" onClick={() => navigate(-1)}>
                Назад
              </Button>
              <Button onClick={() => navigate('/analytics/products')}>К аналитике</Button>
            </>
          }
        />
      </div>
    </>
  )
}
