# FIT VIDEO GENERATOR

Повноцінний вебзастосунок для генерації fit video / відео з приміркою одягу.

**Етап 1** — Перевдягання фото через Google Gemini AI  
**Етап 2** — Генерація відео через Seedance 2.0 (via fal.ai)

---

## Стек технологій

- **Next.js 15** (App Router)
- **React 19 + TypeScript**
- **Tailwind CSS v4**
- **Google Generative AI SDK** (`@google/generative-ai`)
- **fal.ai Client** (`@fal-ai/client`)

---

## Швидкий старт

### 1. Встановлення залежностей

```bash
npm install
```

### 2. Створення `.env.local`

Скопіюйте `.env.example` і заповніть реальними ключами:

```bash
cp .env.example .env.local
```

Відкрийте `.env.local` та вставте ваші ключі:

```env
GEMINI_API_KEY=ваш_gemini_ключ
FAL_KEY=ваш_fal_ключ
```

### 3. Де отримати API ключі

| Сервіс | Де отримати |
|--------|------------|
| **GEMINI_API_KEY** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — безкоштовно з лімітами |
| **FAL_KEY** | [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys) — потрібна реєстрація та поповнення балансу |

### 4. Запуск локально

```bash
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000)

### 5. Production build

```bash
npm run build
npm start
```

---

## Деплой на Vercel

### Крок 1 — Push на GitHub

```bash
git add .
git commit -m "feat: fit video generator"
git push origin main
```

### Крок 2 — Підключення до Vercel

1. Зайдіть на [vercel.com](https://vercel.com)
2. Натисніть **Add New → Project**
3. Імпортуйте ваш GitHub репозиторій
4. Натисніть **Deploy**

### Крок 3 — Змінні середовища у Vercel

У Vercel Dashboard → **Settings → Environment Variables** додайте:

| Ключ | Значення |
|------|---------|
| `GEMINI_API_KEY` | ваш Gemini API ключ |
| `FAL_KEY` | ваш fal.ai API ключ |

> ⚠️ **Важливо**: Ніколи не комітьте `.env.local` у git репозиторій.

---

## Структура проєкту

```
app/
  page.tsx                    # Головна сторінка (UI)
  layout.tsx                  # Кореневий layout
  globals.css                 # Глобальні стилі (чорно-червона тема)
  api/
    gemini-tryon/
      route.ts                # POST /api/gemini-tryon
    seedance-video/
      route.ts                # POST /api/seedance-video

components/
  FileUpload.tsx              # Компонент завантаження фото (drag & drop)
  ImagePreview.tsx            # Перегляд та завантаження результату
  PromptBox.tsx               # Textarea для промптів
  StepCard.tsx                # Картка кроку з індикатором статусу
  VideoPreview.tsx            # Відео + YouTube посилання

lib/
  gemini.ts                   # Інтеграція з Gemini API
  seedance.ts                 # Інтеграція з Seedance via fal.ai
  utils.ts                    # Утиліти (base64, download, validation)
```

---

## Зміна моделі Gemini або Seedance

### Gemini модель

Відкрийте `lib/gemini.ts` і змініть константу:

```typescript
export const GEMINI_MODEL = "gemini-2.0-flash-exp-image-generation";
```

### Seedance модель (fal.ai slug)

Відкрийте `lib/seedance.ts` і змініть константу:

```typescript
export const SEEDANCE_MODEL = "fal-ai/bytedance/seedance-1-5-image-to-video";
```

Актуальні моделі fal.ai: [fal.ai/models](https://fal.ai/models)

---

## Ліміти файлів

- Максимальний розмір: **10 МБ** на фото
- Формати: **JPG, PNG, WEBP**

---

## Змінні середовища

| Змінна | Обов'язкова | Опис |
|--------|-------------|------|
| `GEMINI_API_KEY` | ✅ | Google AI Studio API ключ |
| `FAL_KEY` | ✅ | fal.ai API ключ для Seedance |
