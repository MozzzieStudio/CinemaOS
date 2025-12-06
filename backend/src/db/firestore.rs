//! Firestore client for user data and credits

use crate::config::Config;
use serde::{Deserialize, Serialize};
use anyhow::Result;

/// User document in Firestore
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: Option<String>,
    pub credits: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

/// Credit transaction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreditTransaction {
    pub id: String,
    pub user_id: String,
    pub amount: i64,
    pub reason: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Firestore client wrapper
#[derive(Clone)]
pub struct FirestoreClient {
    project_id: String,
    database: String,
    http_client: reqwest::Client,
}

impl FirestoreClient {
    /// Create a new Firestore client
    pub async fn new(config: &Config) -> Result<Self> {
        Ok(Self {
            project_id: config.gcp_project_id.clone(),
            database: config.firestore_database.clone(),
            http_client: reqwest::Client::new(),
        })
    }

    /// Get or create a user
    pub async fn get_or_create_user(&self, user_id: &str, email: Option<&str>) -> Result<User> {
        // Try to get existing user
        if let Some(user) = self.get_user(user_id).await? {
            return Ok(user);
        }

        // Create new user with initial credits
        let user = User {
            id: user_id.to_string(),
            email: email.map(String::from),
            credits: 100, // Free initial credits
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        self.save_user(&user).await?;
        Ok(user)
    }

    /// Get user by ID
    pub async fn get_user(&self, user_id: &str) -> Result<Option<User>> {
        let url = format!(
            "https://firestore.googleapis.com/v1/projects/{}/databases/{}/documents/users/{}",
            self.project_id, self.database, user_id
        );

        let response = self.http_client
            .get(&url)
            .send()
            .await?;

        if response.status() == reqwest::StatusCode::NOT_FOUND {
            return Ok(None);
        }

        let doc: serde_json::Value = response.json().await?;
        let user = self.parse_user_doc(&doc)?;
        Ok(Some(user))
    }

    /// Save user
    pub async fn save_user(&self, user: &User) -> Result<()> {
        let url = format!(
            "https://firestore.googleapis.com/v1/projects/{}/databases/{}/documents/users/{}",
            self.project_id, self.database, user.id
        );

        let doc = self.user_to_doc(user);
        
        self.http_client
            .patch(&url)
            .json(&doc)
            .send()
            .await?;

        Ok(())
    }

    /// Deduct credits from user
    pub async fn deduct_credits(&self, user_id: &str, amount: i64, reason: &str) -> Result<bool> {
        let Some(mut user) = self.get_user(user_id).await? else {
            return Ok(false);
        };

        if user.credits < amount {
            return Ok(false);
        }

        user.credits -= amount;
        user.updated_at = chrono::Utc::now();
        self.save_user(&user).await?;

        // Log transaction
        let transaction = CreditTransaction {
            id: uuid::Uuid::new_v4().to_string(),
            user_id: user_id.to_string(),
            amount: -amount,
            reason: reason.to_string(),
            created_at: chrono::Utc::now(),
        };
        self.save_transaction(&transaction).await?;

        Ok(true)
    }

    /// Add credits to user
    pub async fn add_credits(&self, user_id: &str, amount: i64, reason: &str) -> Result<()> {
        let Some(mut user) = self.get_user(user_id).await? else {
            anyhow::bail!("User not found");
        };

        user.credits += amount;
        user.updated_at = chrono::Utc::now();
        self.save_user(&user).await?;

        let transaction = CreditTransaction {
            id: uuid::Uuid::new_v4().to_string(),
            user_id: user_id.to_string(),
            amount,
            reason: reason.to_string(),
            created_at: chrono::Utc::now(),
        };
        self.save_transaction(&transaction).await?;

        Ok(())
    }

    /// Save transaction
    async fn save_transaction(&self, tx: &CreditTransaction) -> Result<()> {
        let url = format!(
            "https://firestore.googleapis.com/v1/projects/{}/databases/{}/documents/transactions/{}",
            self.project_id, self.database, tx.id
        );

        let doc = serde_json::json!({
            "fields": {
                "user_id": { "stringValue": tx.user_id },
                "amount": { "integerValue": tx.amount.to_string() },
                "reason": { "stringValue": tx.reason },
                "created_at": { "timestampValue": tx.created_at.to_rfc3339() }
            }
        });

        self.http_client
            .patch(&url)
            .json(&doc)
            .send()
            .await?;

        Ok(())
    }

    fn parse_user_doc(&self, doc: &serde_json::Value) -> Result<User> {
        let fields = doc.get("fields").ok_or_else(|| anyhow::anyhow!("Missing fields"))?;
        
        Ok(User {
            id: fields["id"]["stringValue"].as_str().unwrap_or_default().to_string(),
            email: fields["email"]["stringValue"].as_str().map(String::from),
            credits: fields["credits"]["integerValue"]
                .as_str()
                .and_then(|s| s.parse().ok())
                .unwrap_or(0),
            created_at: fields["created_at"]["timestampValue"]
                .as_str()
                .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .unwrap_or_else(chrono::Utc::now),
            updated_at: fields["updated_at"]["timestampValue"]
                .as_str()
                .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .unwrap_or_else(chrono::Utc::now),
        })
    }

    fn user_to_doc(&self, user: &User) -> serde_json::Value {
        serde_json::json!({
            "fields": {
                "id": { "stringValue": user.id },
                "email": { "stringValue": user.email.as_deref().unwrap_or("") },
                "credits": { "integerValue": user.credits.to_string() },
                "created_at": { "timestampValue": user.created_at.to_rfc3339() },
                "updated_at": { "timestampValue": user.updated_at.to_rfc3339() }
            }
        })
    }
}
