import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, message } from 'antd'
import { ArrowLeftOutlined, CopyOutlined, RightOutlined } from '@ant-design/icons'
import { LEGAL_OPERATOR } from '../constants/legalOperator'

type Field = { label: string; value: string }

/**
 * Публичная страница с реквизитами ИП — по макету «Реквизиты».
 */
export default function Requisites() {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const generalFields: Field[] = [
    { label: 'Полное наименование', value: LEGAL_OPERATOR.shortName },
    { label: 'ИНН', value: LEGAL_OPERATOR.inn },
    { label: 'ОГРНИП', value: LEGAL_OPERATOR.ogrnip },
  ]

  const bankFields: Field[] = [
    { label: 'Банк', value: LEGAL_OPERATOR.bankName },
    { label: 'БИК', value: LEGAL_OPERATOR.bik },
    { label: 'Расчётный счёт', value: LEGAL_OPERATOR.checkingAccount },
    { label: 'Корреспондентский счёт', value: LEGAL_OPERATOR.correspondentAccount },
  ]

  const copyText = [
    `Наименование: ${LEGAL_OPERATOR.shortName}`,
    `ИНН: ${LEGAL_OPERATOR.inn}`,
    `ОГРНИП: ${LEGAL_OPERATOR.ogrnip}`,
    `Банк: ${LEGAL_OPERATOR.bankName}`,
    `БИК: ${LEGAL_OPERATOR.bik}`,
    `Расчётный счёт: ${LEGAL_OPERATOR.checkingAccount}`,
    `Корреспондентский счёт: ${LEGAL_OPERATOR.correspondentAccount}`,
  ].join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      message.success('Реквизиты скопированы')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      message.error('Не удалось скопировать. Выделите текст вручную.')
    }
  }

  return (
    <div className="requisites-page">
      <style>{`
        .requisites-page {
          background: #FFFFFF;
          padding: 36px 24px 8px;
          color: #111827;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow-x: hidden;
        }
        .requisites-page * { box-sizing: border-box; }
        .requisites-page .wrap {
          max-width: 1240px;
          margin: 0 auto;
        }
        .requisites-page h1 {
          margin: 0 0 10px;
          font-size: 42px;
          line-height: 1.12;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #111827;
        }
        .requisites-page .lead {
          margin: 0 0 36px;
          max-width: none;
          white-space: nowrap;
          font-size: 15px;
          line-height: 1.55;
          color: #6B7280;
        }
        @media (max-width: 720px) {
          .requisites-page .lead {
            white-space: normal;
          }
        }

        /* Карточка шире, картинка крупнее и заезжает под правый край карточки */
        .requisites-page .stage {
          position: relative;
          margin-bottom: 48px;
          padding-right: min(38%, 360px);
        }
        .requisites-page .hero {
          position: absolute;
          right: -40px;
          top: 22%;
          transform: translateY(-50%);
          width: min(58%, 620px);
          z-index: 1;
          pointer-events: none;
        }
        .requisites-page .hero-blob {
          position: absolute;
          inset: 4% -2% 6% 4%;
          border-radius: 50%;
          background:
            radial-gradient(circle at 40% 45%, rgba(196, 181, 253, 0.9) 0%, rgba(237, 233, 254, 0.5) 45%, transparent 72%),
            radial-gradient(circle at 72% 58%, rgba(221, 214, 254, 0.75) 0%, transparent 62%);
          filter: blur(6px);
          z-index: 0;
        }
        .requisites-page .hero-img {
          position: relative;
          z-index: 1;
          width: 100%;
          height: auto;
          display: block;
          /* чёрный фон PNG становится «прозрачным» без контура от вырезания */
          mix-blend-mode: lighten;
        }
        .requisites-page .card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 760px;
          background: #FFFFFF;
          border: 1px solid #EEF0F4;
          border-radius: 22px;
          padding: 32px 32px 22px;
          box-shadow: 0 10px 36px rgba(17, 24, 39, 0.06);
        }
        .requisites-page .cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          margin-bottom: 22px;
        }
        .requisites-page .col {
          padding: 0 24px;
        }
        .requisites-page .col:first-child {
          padding-left: 4px;
          padding-right: 28px;
          border-right: 1px solid #E8ECF2;
        }
        .requisites-page .col:last-child {
          padding-left: 28px;
          padding-right: 4px;
        }
        .requisites-page .col-title {
          margin: 0 0 18px;
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }
        .requisites-page .row {
          display: grid;
          grid-template-columns: minmax(108px, 0.95fr) minmax(0, 1.25fr);
          gap: 10px 12px;
          align-items: start;
          margin-bottom: 14px;
        }
        .requisites-page .row:last-child { margin-bottom: 0; }
        .requisites-page .field-label {
          margin: 0;
          font-size: 13px;
          line-height: 1.4;
          color: #8B95A8;
        }
        .requisites-page .field-value {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
          font-weight: 500;
          color: #111827;
          word-break: break-word;
        }
        .requisites-page .copy-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 48px;
          padding: 0 16px;
          border: none;
          border-radius: 12px;
          background: #F3F4F6;
          color: #111827;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .requisites-page .copy-btn:hover { background: #E5E7EB; }
        .requisites-page .copy-btn-left {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .requisites-page .copy-btn .anticon { font-size: 15px; color: #6B7280; }
        .requisites-page .info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 15px 18px;
          border-radius: 14px;
          background: #F3F5FC;
          color: #4B5563;
          font-size: 14px;
          line-height: 1.55;
        }
        .requisites-page .info-icon {
          flex: 0 0 auto;
          width: 20px;
          height: 20px;
          margin-top: 2px;
          border-radius: 50%;
          background: #3B82F6;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          font-style: italic;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .requisites-page .info a {
          color: #4F46E5;
          font-weight: 600;
          text-decoration: none;
        }
        .requisites-page .info a:hover { text-decoration: underline; }
        @media (max-width: 980px) {
          .requisites-page { padding: 24px 16px 40px; }
          .requisites-page h1 { font-size: 32px; }
          .requisites-page .stage {
            padding-right: 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .requisites-page .hero {
            position: relative;
            right: auto;
            top: auto;
            transform: none;
            width: min(100%, 420px);
            margin: 0 auto;
            order: -1;
          }
          .requisites-page .card {
            max-width: none;
          }
          .requisites-page .cols { grid-template-columns: 1fr; }
          .requisites-page .col:first-child,
          .requisites-page .col:last-child {
            padding: 0;
            border-right: none;
          }
          .requisites-page .col:first-child {
            padding-bottom: 20px;
            margin-bottom: 20px;
            border-bottom: 1px solid #E8ECF2;
          }
        }
        @media (max-width: 520px) {
          .requisites-page .row {
            grid-template-columns: 1fr;
            gap: 2px;
            margin-bottom: 14px;
          }
        }
      `}</style>

      <div className="wrap">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{ marginBottom: 24, color: '#64748B', paddingLeft: 0 }}
        >
          Назад
        </Button>

        <h1>Реквизиты</h1>
        <p className="lead">
          Официальные данные компании. Используем их для оформления договоров и оплат.
        </p>

        <div className="stage">
          <div className="hero" aria-hidden>
            <div className="hero-blob" />
            <img className="hero-img" src="/legal/requisites-hero.png" alt="" />
          </div>

          <section className="card" aria-label="Реквизиты компании">
            <div className="cols">
              <div className="col">
                <h2 className="col-title">Общие сведения</h2>
                {generalFields.map((field) => (
                  <div key={field.label} className="row">
                    <p className="field-label">{field.label}</p>
                    <p className="field-value">{field.value}</p>
                  </div>
                ))}
              </div>
              <div className="col">
                <h2 className="col-title">Банковские реквизиты</h2>
                {bankFields.map((field) => (
                  <div key={field.label} className="row">
                    <p className="field-label">{field.label}</p>
                    <p className="field-value">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" className="copy-btn" onClick={handleCopy}>
              <span className="copy-btn-left">
                <CopyOutlined />
                {copied ? 'Скопировано' : 'Скопировать реквизиты'}
              </span>
              <RightOutlined />
            </button>
          </section>
        </div>

        <aside className="info">
          <span className="info-icon" aria-hidden>
            i
          </span>
          <div>
            Если у вас остались вопросы по реквизитам или нужна копия договора, напишите нам на почту{' '}
            <a href={`mailto:${LEGAL_OPERATOR.email}`}>{LEGAL_OPERATOR.email}</a> или в Telegram{' '}
            <a href={LEGAL_OPERATOR.telegramUrl} target="_blank" rel="noopener noreferrer">
              {LEGAL_OPERATOR.telegram}
            </a>
            .
          </div>
        </aside>
      </div>
    </div>
  )
}
