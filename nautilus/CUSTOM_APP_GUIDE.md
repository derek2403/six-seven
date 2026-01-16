# Nautilus Custom App Development Guide

## Complete Directory Structure

```
nautilus/
├── src/nautilus-server/src/
│   ├── main.rs                      # Server entry point (DO NOT MODIFY)
│   ├── common.rs                    # Shared utilities (DO NOT MODIFY)
│   ├── lib.rs                       # Module exports (MUST ADD YOUR APP HERE)
│   └── apps/
│       ├── weather-example/         # Example app
│       │   ├── mod.rs               # Rust logic
│       │   └── allowed_endpoints.yaml
│       └── YOUR-APP/                # ⭐ CREATE THIS
│           ├── mod.rs               # ⭐ Your computation logic
│           └── allowed_endpoints.yaml  # ⭐ External APIs whitelist
│
└── move/
    ├── enclave/                     # Shared enclave package (DO NOT MODIFY)
    └── YOUR-APP/                    # ⭐ CREATE THIS
        ├── Move.toml                # ⭐ Package configuration
        └── sources/
            └── your_app.move        # ⭐ On-chain verification logic
```

---

## File Purposes

| File | Purpose |
|------|---------|
| `allowed_endpoints.yaml` | Lists external APIs the enclave can access. Enclave has NO internet by default. |
| `mod.rs` | Contains your `process_data` function - fetches data, processes it, signs response |
| `Move.toml` | Move package configuration with dependencies |
| `your_app.move` | On-chain contract that verifies enclave signatures and uses the data |
| `lib.rs` | **MUST EDIT** to export your app module with feature flag |

---

## Step-by-Step: Create a New App

### Step 1: Create Rust Server Files

#### 1.1 Create directory
```bash
mkdir -p src/nautilus-server/src/apps/your-app
```

#### 1.2 Create `allowed_endpoints.yaml`
```yaml
# List ALL external domains your app needs to access
endpoints:
  - api.example.com
  - api.another-service.com
```

#### 1.3 Create `mod.rs`

**Required components:**

```rust
// 1. IMPORTS (copy these exactly)
use crate::common::{to_signed_response, IntentMessage, ProcessDataRequest, ProcessedDataResponse};
use crate::{AppState, EnclaveError};
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use std::sync::Arc;

// 2. INTENT SCOPE - each message type needs unique number
//    MUST match the constant in your Move contract
#[derive(Serialize_repr, Deserialize_repr, Debug)]
#[repr(u8)]
pub enum IntentScope {
    YourIntent = 0,  // Use 0, 1, 2... for different message types
}

// 3. RESPONSE STRUCT - what gets signed
//    Field names and types MUST match Move struct exactly
//    Order matters for BCS serialization
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct YourResponse {
    pub field1: String,
    pub field2: u64,
    // Add your fields here
}

// 4. REQUEST STRUCT - input from client
#[derive(Debug, Serialize, Deserialize)]
pub struct YourRequest {
    pub input1: String,
    // Add your input fields here
}

// 5. PROCESS_DATA FUNCTION - main endpoint
pub async fn process_data(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ProcessDataRequest<YourRequest>>,
) -> Result<Json<ProcessedDataResponse<IntentMessage<YourResponse>>>, EnclaveError> {
    
    // a) Fetch external data (if needed)
    let url = format!("https://api.example.com/data?q={}", request.payload.input1);
    let response = reqwest::get(&url).await
        .map_err(|e| EnclaveError::GenericError(format!("API error: {e}")))?;
    let json: serde_json::Value = response.json().await
        .map_err(|e| EnclaveError::GenericError(format!("Parse error: {e}")))?;
    
    // b) Process data
    let field1 = json["result"].as_str().unwrap_or("").to_string();
    let field2 = json["value"].as_u64().unwrap_or(0);
    
    // c) Get timestamp
    let timestamp_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;
    
    // d) Return signed response
    Ok(Json(to_signed_response(
        &state.eph_kp,
        YourResponse { field1, field2 },
        timestamp_ms,
        IntentScope::YourIntent as u8,
    )))
}
```

#### 1.4 Edit `lib.rs` to export your app

Open `src/nautilus-server/src/lib.rs` and add:

```rust
// Add feature flag for your app
#[cfg(feature = "your-app")]
pub mod your_app {
    include!("apps/your-app/mod.rs");
}

// Add to the app module export
#[cfg(feature = "your-app")]
pub use your_app as app;
```

#### 1.5 Edit `Cargo.toml` to add feature

Open `src/nautilus-server/Cargo.toml` and add your feature:

```toml
[features]
default = []
weather-example = []
twitter-example = []
your-app = []  # Add this line
```

---

### Step 2: Create Move Contract Files

#### 2.1 Create directory
```bash
mkdir -p move/your-app/sources
```

#### 2.2 Create `Move.toml`

```toml
[package]
name = "your_app"
edition = "2024"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "61dcfdbe2ddc7ad05d27fc10cd09d4c6cc151acd" }
enclave = { local = "../enclave" }

[addresses]
app = "0x0"
```

#### 2.3 Create `sources/your_app.move`

```move
module app::your_app {
    use enclave::enclave::{Self, Enclave};
    use std::string::String;

    // 1. INTENT CONSTANT - MUST match Rust IntentScope value
    const YOUR_INTENT: u8 = 0;
    const EInvalidSignature: u64 = 1;

    // 2. RESULT OBJECT - what you create after verification
    public struct YourNFT has key, store {
        id: UID,
        field1: String,
        field2: u64,
        timestamp_ms: u64,
    }

    // 3. RESPONSE STRUCT - MUST match Rust YourResponse exactly
    //    Same field names, same order, same types
    public struct YourResponse has copy, drop {
        field1: String,
        field2: u64,
    }

    // 4. ONE-TIME WITNESS
    public struct YOUR_APP has drop {}

    // 5. INIT - creates enclave config on deploy
    fun init(otw: YOUR_APP, ctx: &mut TxContext) {
        let cap = enclave::new_cap(otw, ctx);
        cap.create_enclave_config(
            b"your app enclave".to_string(),
            x"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            x"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            x"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            ctx,
        );
        transfer::public_transfer(cap, ctx.sender())
    }

    // 6. VERIFY AND USE - your main function
    public fun verify_and_use<T>(
        field1: String,
        field2: u64,
        timestamp_ms: u64,
        sig: &vector<u8>,
        enclave: &Enclave<T>,
        ctx: &mut TxContext,
    ): YourNFT {
        // Verify signature
        let verified = enclave.verify_signature(
            YOUR_INTENT,
            timestamp_ms,
            YourResponse { field1, field2 },
            sig,
        );
        assert!(verified, EInvalidSignature);
        
        // Create result object
        YourNFT {
            id: object::new(ctx),
            field1,
            field2,
            timestamp_ms,
        }
    }
}
```

---

### Step 3: Build and Deploy

```bash
# 1. Configure enclave (generates traffic forwarding code)
export KEY_PAIR=nautilus-key
sh configure_enclave.sh your-app

# 2. Start EC2 instance
aws ec2 start-instances --instance-ids i-0cca612bd8432aae5 --region us-east-1
# Wait for public IP, then:

# 3. Copy to EC2
rsync -avz -e "ssh -i ~/.ssh/nautilus-key.pem" . ec2-user@<IP>:~/nautilus/

# 4. SSH and build
ssh -i ~/.ssh/nautilus-key.pem ec2-user@<IP>
cd nautilus
make ENCLAVE_APP=your-app && make run
sh expose_enclave.sh

# 5. Test endpoint
curl http://<IP>:3000/health_check
curl -d '{"payload":{"input1":"test"}}' -X POST http://<IP>:3000/process_data

# 6. Deploy Move packages (from local machine)
cd move/enclave && sui client publish
cd ../your-app && sui client publish
# Save the package IDs from output

# 7. Update PCRs (get from EC2 build output: cat out/nitro.pcrs)
sui client call --function update_pcrs --module enclave --package <ENCLAVE_PKG> \
  --type-args "<APP_PKG>::your_app::YOUR_APP" \
  --args <CONFIG_OBJ> <CAP_OBJ> 0x<PCR0> 0x<PCR1> 0x<PCR2>

# 8. Register enclave
sh register_enclave.sh <ENCLAVE_PKG> <APP_PKG> <CONFIG_OBJ> http://<IP>:3000 your_app YOUR_APP

# 9. Stop EC2 when done
aws ec2 stop-instances --instance-ids i-0cca612bd8432aae5 --region us-east-1
```

---

## Critical Rules

1. **IntentScope number** in Rust MUST equal **intent constant** in Move
2. **Response struct fields** MUST be identical (name, type, order) in both Rust and Move
3. **allowed_endpoints.yaml** MUST list ALL external APIs - enclave has no internet otherwise
4. **lib.rs** MUST be updated to export your new app module
5. **Cargo.toml** MUST have your feature flag added

---

## Checklist for New App

- [ ] Create `src/nautilus-server/src/apps/YOUR-APP/allowed_endpoints.yaml`
- [ ] Create `src/nautilus-server/src/apps/YOUR-APP/mod.rs`
- [ ] Edit `src/nautilus-server/src/lib.rs` to add feature export
- [ ] Edit `src/nautilus-server/Cargo.toml` to add feature flag
- [ ] Create `move/YOUR-APP/Move.toml`
- [ ] Create `move/YOUR-APP/sources/your_app.move`
- [ ] Run `sh configure_enclave.sh YOUR-APP`
- [ ] Build on EC2 with `make ENCLAVE_APP=YOUR-APP`
- [ ] Deploy Move packages
- [ ] Register enclave on-chain
