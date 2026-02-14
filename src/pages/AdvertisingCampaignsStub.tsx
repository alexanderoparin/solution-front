import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'

export default function AdvertisingCampaignsStub() {
  return (
    <>
      <Header />
      <Breadcrumbs />
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#64748B', marginTop: '48px' }}>
          Скоро
        </div>
        <div style={{ fontSize: '14px', color: '#94A3B8', marginTop: '8px' }}>
          Раздел «Рекламные компании» в разработке
        </div>
      </div>
    </>
  )
}
