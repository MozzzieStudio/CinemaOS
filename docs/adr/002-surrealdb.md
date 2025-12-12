# ADR-002: SurrealDB for The Vault

**Status**: Accepted  
**Date**: 2025-12-05  
**Deciders**: Tech Lead, Data Architect

## Context

We needed a database for "The Vault" - our Single Source of Truth for:

- Script content
- Tokens (characters, locations, props)
- Visual references
- Project metadata
- Collaboration state

### Requirements

1. **Graph Relations**: Link tokens to scenes, assets to tokens
2. **Hybrid Mode**: Work offline (local) and online (cloud)
3. **Real-time Sync**: Multi-user collaboration
4. **Type Safety**: Strong typing for Rust integration
5. **Flexible Schema**: Evolve without migrations

## Decision

We chose **SurrealDB** in **Hybrid Mode** (local embedded + cloud).

## Rationale

### ✅ Advantages

1. **Multi-Model**:

   ```surql
   -- Documents
   CREATE token:character_01 CONTENT { name: "John", type: "Character" }

   -- Graphs
   RELATE token:character_01->appears_in->scene:beach_01

   -- Time Series
   SELECT * FROM metrics WHERE time > time::now() - 1h
   ```

2. **Hybrid Deployment**:

   - **Local**: Embedded RocksDB/SurrealKV (offline editing)
   - **Cloud**: SurrealDB Cloud (collaboration + backup)
   - **Seamless sync** between modes

3. **SurrealQL**: Modern query language

   ```surql
   -- Get all characters in beach scenes
   SELECT * FROM character WHERE ->appears_in->scene[WHERE name ~ "BEACH"]
   ```

4. **Native Rust Client**: Type-safe integration

   ```rust
   let db: Surreal<Any> = Surreal::init();
   let token: Token = db.select(("token", id)).await?;
   ```

5. **Real-time subscriptions**:
   ```rust
   let mut stream = db.select("token").live().await?;
   while let Some(notification) = stream.next().await {
       // Handle change
   }
   ```

### ⚠️ Trade-offs

1. **Young Ecosystem**: Less mature than PostgreSQL/MongoDB

   - Mitigated by: Active development, good docs

2. **Cloud Vendor Lock-in**: SurrealDB Cloud

   - Mitigated by: Can self-host on GCP/AWS if needed

3. **Learning Curve**: New query language (SurrealQL)
   - Mitigated by: SQL-like syntax, good documentation

## Consequences

### Positive

- Graph queries for token relationships
- Offline-first editing without sync conflicts
- Single database for all data types
- Real-time multiplayer with LIVE queries

### Negative

- Team needs to learn SurrealQL
- Fewer ORMs/tools than PostgreSQL
- Debugging tools less mature

### Neutral

- Can always migrate to PostgreSQL if needed (export/import)
- SurrealDB evolving rapidly (v2.1+)

## Alternatives Considered

### PostgreSQL + Postgraphile

- **Pros**: Mature, huge ecosystem, proven
- **Cons**: Complex setup for graph queries, no embedded mode
- **Verdict**: Too heavyweight for hybrid use case

### SQLite (local) + Supabase (cloud)

- **Pros**: Simple, well-known
- **Cons**: Two different databases, no graph relations, manual sync
- **Verdict**: Sync complexity too high

### Dexie.js + Firebase

- **Pros**: Great offline support
- **Cons**: JavaScript-only, no Rust client, limited graph queries
- **Verdict**: Not suitable for Rust backend

## Implementation Notes

### Local Schema

```surql
DEFINE TABLE token SCHEMAFULL;
DEFINE FIELD project_id ON token TYPE string;
DEFINE FIELD token_type ON token TYPE string;
DEFINE FIELD name ON token TYPE string;
DEFINE FIELD visual_refs ON token TYPE array;
DEFINE INDEX idx_token_name ON token FIELDS name;
```

### Sync Strategy

- **Write**: Always write to local DB first (optimistic)
- **Sync**: Background worker syncs to cloud every 5s
- **Conflict Resolution**: Loro CRDTs for text, Last-Write-Wins for metadata

## References

- [SurrealDB Docs](https://surrealdb.com/docs)
- [SurrealDB Hybrid Mode](https://surrealdb.com/docs/cloud/hybrid)
- [Rust Client](https://github.com/surrealdb/surrealdb)
