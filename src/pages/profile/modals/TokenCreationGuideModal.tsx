import { Modal, Typography } from 'antd'

const { Paragraph, Text, Title } = Typography

interface TokenCreationGuideModalProps {
  open: boolean
  onClose: () => void
}

interface GuideStepProps {
  number: number
  children: React.ReactNode
  image?: string
  imageAlt?: string
}

function GuideStep({ number, children, image, imageAlt }: GuideStepProps) {
  return (
    <section style={{ marginBottom: 28 }}>
      <Title level={4} style={{ margin: '0 0 10px', fontSize: 17 }}>
        {number}. {children}
      </Title>
      {image ? (
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          style={{
            display: 'block',
            width: '100%',
            maxHeight: 520,
            objectFit: 'contain',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            backgroundColor: '#F8FAFC',
          }}
        />
      ) : null}
    </section>
  )
}

/**
 * Пошаговая инструкция по созданию API-токена в кабинете Wildberries.
 */
export default function TokenCreationGuideModal({ open, onClose }: TokenCreationGuideModalProps) {
  return (
    <Modal
      title="Как создать токен WB"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      destroyOnClose
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto', paddingRight: 8 } }}
    >
      <Paragraph style={{ fontSize: 15, marginBottom: 24 }}>
        Чтобы начать работу с Clicki, создайте API-токен в кабинете Wildberries.
      </Paragraph>

      <GuideStep number={1}>
        Войдите в кабинет на{' '}
        <a href="https://seller.wildberries.ru/" target="_blank" rel="noreferrer">
          seller.wildberries.ru
        </a>
      </GuideStep>

      <GuideStep
        number={2}
        image="/token-guide/step-1.png"
        imageAlt="Переход в раздел Интеграции по API"
      >
        Нажмите на название кабинета в правом верхнем углу и выберите «Интеграции по API»
      </GuideStep>

      <GuideStep
        number={3}
        image="/token-guide/step-2.png"
        imageAlt="Кнопка создания токена Wildberries"
      >
        На открывшейся странице нажмите «Создать токен»
      </GuideStep>

      <GuideStep
        number={4}
        image="/token-guide/step-3.png"
        imageAlt="Настройки нового API-токена Wildberries"
      >
        Выберите «Для интеграции вручную» и тип токена
        <Paragraph style={{ margin: '10px 0 0', fontSize: 14, fontWeight: 400 }}>
          Для более быстрой и комфортной работы рекомендуем{' '}
          <Text strong>персональный токен</Text>. Укажите название и включите категории:
          «Контент», «Маркетплейс», «Статистика», «Аналитика», «Продвижение»,
          «Цены и скидки». Уровень доступа — <Text strong>«Чтение и запись»</Text>.
          Поставьте галочку о правилах передачи токена.
        </Paragraph>
      </GuideStep>

      <GuideStep
        number={5}
        image="/token-guide/step-4.png"
        imageAlt="Окно с созданным API-токеном Wildberries"
      >
        Скопируйте и сохраните созданный токен
        <Paragraph style={{ margin: '10px 0 0', fontSize: 14, fontWeight: 400 }}>
          Wildberries показывает токен только один раз. Скопируйте его сразу после создания.
        </Paragraph>
      </GuideStep>

      <GuideStep
        number={6}
        image="/token-guide/step-5.png"
        imageAlt="Созданный токен в разделе Интеграции по API"
      >
        Убедитесь, что токен появился в разделе «Интеграции по API»
      </GuideStep>
    </Modal>
  )
}
