# Gemini TTS Playground

A modern, interactive playground for testing Gemini Text-to-Speech (TTS) capabilities with multi-language support and advanced markup tags.

## Features

- **Multi-Language Support**: Supports Korean (KO), English (EN), Japanese (JA), and Chinese (ZH) with curated tag libraries for each.
- **Interactive Editor**: A dedicated "Editor" tab with a premium glassmorphic UI.
- **Autocomplete**: Type `[` in the editor to trigger a floating autocomplete dropdown for tags, showing category and description.
- **Real-time Speed Control**: Adjust the speaking rate from 0.5x to 2.0x with a slider that updates in real-time.
- **Tag Highlighting**: Automatically highlights tags in the preview area.

## Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Backend**: Node.js, Express
- **API**: Google Cloud Text-to-Speech API (v1beta1)

## How to Run Locally

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file by copying `.env.example` and edit it if needed:
    ```bash
    cp .env.example .env
    ```
4.  Set up Google Cloud authentication (ensure you have access to Vertex AI or Cloud TTS API).
5.  Start the server:
    ```bash
    npm start
    ```
6.  Open `http://localhost:8080` in your browser.

## Environment Variables

You can configure the default behavior by setting the following environment variables:

-   `TTS_PROMPT`: The system prompt sent to the API (default: "Read aloud in a warm, welcoming tone...").
-   `TTS_MODEL`: The default model to use (default: `gemini-3.1-flash-tts-preview`).
-   `TTS_VOICE`: The default voice to use (default: `Achernar`).
-   `TTS_LANG`: The default language code (default: `ko-kr`).

## Deployment

This project is configured for deployment on Google Cloud Run. Follow these steps to build and deploy:

### 1. Build and Push Image using Cloud Build

Replace `[PROJECT_ID]`, `[REPO_NAME]`, `[IMAGE_NAME]`, and `[TAG]` with your actual values.

```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/[PROJECT_ID]/[REPO_NAME]/[IMAGE_NAME]:[TAG] .
```

Example:
```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/tts-testing-493601/tts-testing/tts-testing:v34 .
```

### 2. Deploy to Cloud Run

Replace `[SERVICE_NAME]`, `[PROJECT_ID]`, `[REPO_NAME]`, `[IMAGE_NAME]`, and `[TAG]` with your actual values.

```bash
gcloud run deploy [SERVICE_NAME] \
  --image us-central1-docker.pkg.dev/[PROJECT_ID]/[REPO_NAME]/[IMAGE_NAME]:[TAG] \
  --region us-central1 \
  --allow-unauthenticated
```

Example:
```bash
gcloud run deploy tts-testing \
  --image us-central1-docker.pkg.dev/tts-testing-493601/tts-testing/tts-testing:v34 \
  --region us-central1
```

> [!NOTE]
> Ensure that the service account used by Cloud Run has the `Vertex AI User` role to call the Vertex AI TTS API.

## References

This project references and was inspired by the following resources:

-   [Google Cloud Gemini TTS Documentation](https://docs.cloud.google.com/text-to-speech/docs/gemini-tts)
-   [Take3Bounce Showcase](https://take3bounce.app/showcase/)
