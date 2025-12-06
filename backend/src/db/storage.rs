//! Cloud Storage client for asset management

use crate::config::Config;
use anyhow::Result;

/// Cloud Storage client wrapper
#[derive(Clone)]
pub struct StorageClient {
    bucket: String,
    http_client: reqwest::Client,
}

impl StorageClient {
    /// Create a new Storage client
    pub async fn new(config: &Config) -> Result<Self> {
        Ok(Self {
            bucket: config.storage_bucket.clone(),
            http_client: reqwest::Client::new(),
        })
    }

    /// Generate a signed URL for uploading
    pub async fn get_upload_url(&self, object_name: &str, content_type: &str) -> Result<String> {
        // In production, use proper service account signing
        // For now, return a direct upload URL
        let url = format!(
            "https://storage.googleapis.com/upload/storage/v1/b/{}/o?uploadType=media&name={}",
            self.bucket, object_name
        );
        Ok(url)
    }

    /// Generate a signed URL for downloading
    pub async fn get_download_url(&self, object_name: &str) -> Result<String> {
        let url = format!(
            "https://storage.googleapis.com/{}/{}",
            self.bucket, object_name
        );
        Ok(url)
    }

    /// Upload bytes to storage
    pub async fn upload(&self, object_name: &str, data: Vec<u8>, content_type: &str) -> Result<String> {
        let url = format!(
            "https://storage.googleapis.com/upload/storage/v1/b/{}/o?uploadType=media&name={}",
            self.bucket, object_name
        );

        self.http_client
            .post(&url)
            .header("Content-Type", content_type)
            .body(data)
            .send()
            .await?;

        self.get_download_url(object_name).await
    }

    /// Delete an object
    pub async fn delete(&self, object_name: &str) -> Result<()> {
        let url = format!(
            "https://storage.googleapis.com/storage/v1/b/{}/o/{}",
            self.bucket,
            urlencoding::encode(object_name)
        );

        self.http_client.delete(&url).send().await?;
        Ok(())
    }
}
