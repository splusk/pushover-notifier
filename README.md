# Pushover Notifier
Basic node app using Google Cloud Tasks to schedule when notifications should occur.

## Deployment instructions
### Local setup
These instructions are going to leverage the capabilities of the tool `glcoud`

1. `brew install --cask google-cloud-sdk`
2. `gcloud init`
3. `gcloud auth login`
4. `gcloud config set project <YOUR_PROJECT_ID>`
5. `https://console.cloud.google.com/billing/` (enable billing for app)
6. `gcloud services enable run.googleapis.com cloudbuild.googleapis.com cloudtasks.googleapis.com`

### Build
1. `gcloud builds submit --tag gcr.io/pushover-notifier/image`

### Deploy and run
```sh
PROJECT_NAME=""
gcloud run deploy $PROJECT_NAME \
  --image gcr.io/$PROJECT_NAME/image \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars API_KEY= \
  --set-env-vars PUSHOVER_USER_KEY= \
  --set-env-vars PUSHOVER_TOKEN_KEY= \
  --set-env-vars PROJECT_ID=$PROJECT_NAME \
  --set-env-vars PROJECT_NUMBER= \
  --set-env-vars PROJECT_REGION=
```
