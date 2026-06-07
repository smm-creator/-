# FIT VIDEO GENERATOR

Український Next.js застосунок для перевдягання фото через Gemini та генерації fit video через Seedance 2.0 на fal.ai.

## Технології

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Next.js API routes
- Gemini image generation
- Seedance 2.0 image-to-video через fal.ai
- Готовність до деплою на Vercel

## 1. Встановлення залежностей

```bash
npm install
```

## 2. Створення `.env.local`

Скопіюйте приклад:

```bash
cp .env.example .env.local
```

Файл `.env.local` має містити:

```env
GEMINI_API_KEY=your_gemini_api_key_here
FAL_KEY=your_fal_or_seedance_key_here
```

## 3. Куди вставити API ключі

- `GEMINI_API_KEY` — ключ Google Gemini API.
- `FAL_KEY` — ключ fal.ai для Seedance 2.0.

Ключі читаються тільки через `process.env` у server-side коді. Не вставляйте ключі у React-компоненти або клієнтський код.

Опційно можна додати:

```env
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image-preview
SEEDANCE_MODEL=bytedance/seedance-2.0/image-to-video
```

Це корисно, якщо Google або fal.ai змінять актуальну назву моделі. За замовчуванням Seedance модель задається в `lib/seedance.ts`, Gemini модель — у `lib/gemini.ts`.

## 4. Локальний запуск

```bash
npm run dev
```

Відкрийте:

```text
http://localhost:3000
```

## 5. Production build

```bash
npm run build
```

## 6. Деплой на Vercel

1. Імпортуйте репозиторій у Vercel.
2. Framework preset: `Next.js`.
3. Build command: `npm run build`.
4. Install command: `npm install`.
5. Output directory залиште стандартним для Next.js.
6. Додайте змінні середовища з `.env.local` у Vercel Project Settings.

## 7. Змінні середовища у Vercel

Обовʼязково додайте:

```env
GEMINI_API_KEY=...
FAL_KEY=...
```

Опційно:

```env
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image-preview
SEEDANCE_MODEL=bytedance/seedance-2.0/image-to-video
```

## API routes

### `POST /api/gemini-tryon`

Приймає `FormData`:

- `frontModel` — фото моделі спереду
- `backModel` — фото моделі ззаду
- `frontClothing` — фото одягу спереду
- `backClothing` — фото одягу ззаду
- `prompt` — промпт Gemini

Повертає:

```json
{
  "frontResult": "data:image/png;base64,...",
  "backResult": "data:image/png;base64,..."
}
```

### `POST /api/seedance-video`

Приймає JSON:

```json
{
  "frontImage": "data:image/png;base64,...",
  "backImage": "data:image/png;base64,...",
  "prompt": "Create a realistic fashion fit video..."
}
```

Повертає:

```json
{
  "videoUrl": "https://...",
  "requestId": "...",
  "raw": {}
}
```

## Примітки щодо інтеграцій

- Seedance 2.0 використовується через fal.ai endpoint `bytedance/seedance-2.0/image-to-video`.
- Front image передається як `image_url`, back image — як `end_image_url`.
- Якщо fal.ai змінить endpoint або потрібен інший режим, змініть `SEEDANCE_MODEL` у `.env.local` або `lib/seedance.ts`.
- Якщо Google змінить Gemini image generation endpoint/model, оновіть `GEMINI_IMAGE_MODEL` або відповідний виклик у `lib/gemini.ts`.
