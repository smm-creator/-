# FIT VIDEO GENERATOR

Перевдягання фото через **Gemini** та генерація fit-відео через **Seedance 2.0 (fal.ai queue)**.

## Технології

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Next.js API Routes
- Готово до деплою на Vercel

## 1) Встановити залежності

```bash
npm install
```

## 2) Створити `.env.local`

Скопіюйте приклад:

```bash
cp .env.example .env.local
```

## 3) Куди вставити API ключі

В `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
FAL_KEY=your_fal_or_seedance_key_here
```

Опційно можна змінити модель/endpoint:

```env
GEMINI_MODEL=gemini-2.0-flash-preview-image-generation
SEEDANCE_MODEL_ID=fal-ai/seedance/v1/video-generation
```

> Увага: ключі не хардкодяться в коді. Усі ключі читаються тільки через `process.env`.

## 4) Запуск локально

```bash
npm run dev
```

Відкрити у браузері: [http://localhost:3000](http://localhost:3000)

## 5) Production build

```bash
npm run build
```

## 6) Деплой на Vercel

1. Запуште репозиторій у GitHub.
2. Імпортуйте проєкт у Vercel.
3. Додайте environment variables:
   - `GEMINI_API_KEY`
   - `FAL_KEY` (або `SEEDANCE_API_KEY`)
   - (опційно) `GEMINI_MODEL`
   - (опційно) `SEEDANCE_MODEL_ID`
4. Запустіть deploy.

## API routes

- `POST /api/gemini-tryon`
  - Приймає `FormData`:
    - `modelFront`
    - `modelBack`
    - `clothFront`
    - `clothBack`
    - `prompt`
  - Повертає:
    - `frontResult`
    - `backResult`

- `POST /api/seedance-video`
  - Приймає JSON:
    - `frontImage`
    - `backImage`
    - `prompt`
  - Повертає:
    - `videoUrl`

## Структура проєкту

```text
app/page.tsx
app/api/gemini-tryon/route.ts
app/api/seedance-video/route.ts
components/FileUpload.tsx
components/ImagePreview.tsx
components/PromptBox.tsx
components/StepCard.tsx
components/VideoPreview.tsx
lib/gemini.ts
lib/seedance.ts
lib/utils.ts
.env.example
README.md
```

## Нотатка по інтеграції Gemini / Seedance

- У `lib/gemini.ts` зроблено адаптивний виклик `generateContent` з image output.
  Якщо Google оновить модель/endpoint, достатньо змінити `GEMINI_MODEL` або `GEMINI_BASE_URL`.
- У `lib/seedance.ts` винесено `SEEDANCE_MODEL_ID` як окрему константу/env.
  Якщо потрібен інший fal.ai model slug, можна швидко замінити без змін UI.
