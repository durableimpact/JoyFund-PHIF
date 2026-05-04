# Solidarity Health Bridge (JoyFund) - Project Overview

## 1. The Mission: Bridging the Gap in Maternal Healthcare

**The Problem:** Cameroon faces a critical maternal health crisis. With less than 2% of the population insured, the vast majority rely on out-of-pocket payments for healthcare. This forces thousands of vulnerable pregnant women to either forgo essential medical care or face detention in hospitals over unpaid bills.

**Our Solution:** JoyFund is a transparent, tech-driven crowdfunding platform that transforms personal celebrations (birthdays, promotions, weddings) into a life-saving **People's Health Insurance Fund**. We digitize the traditional Cameroonian solidarity concept of "Njangi" to pool small, frequent donations and direct them toward the most urgent health needs.

---

## 2. The Actors: Who Powers the Platform?

The JoyFund ecosystem is powered by six key actors, each with a vital role.

| Actor                     | Role in the System                                                                                                                        |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **1. The Donor**          | The person celebrating an event. They **start a campaign** to raise funds from their network.                                             |
| **2. The Contributor**    | Friends, family, and colleagues of the Donor. They **make small donations** to the campaign using Mobile Money.                           |
| **3. The Beneficiary**    | A vulnerable pregnant woman or elderly person. They are enrolled to **receive a digital voucher** for free medical care.                  |
| **4. The Social Worker**  | A trusted community health worker. They **find, verify, and enroll** eligible Beneficiaries into the platform.                            |
| **5. The Hospital Staff** | Receptionists and medical staff at partner hospitals. They **validate the voucher** and **confirm care was provided** to trigger payment. |
| **6. The System Admin**   | The JoyFund team. They **oversee the platform**, manage partnerships, and ensure the entire process runs smoothly.                        |

---

## 3. The Complete Workflow: From Donation to Delivery

This is the step-by-step journey that turns a celebratory gift into a safe childbirth.

### Phase 1: The Campaign (Raising Funds)

1.  **A Donor Starts a JoyFund**: A user celebrating a milestone (e.g., a new job) creates a campaign page with a personal story and an "Impact Goal" (e.g., "Sponsor 2 Safe Deliveries").
2.  **Contributors Donate**: The Donor shares the campaign link on WhatsApp. Friends and family contribute via MTN MoMo or Orange Money.
3.  **Funds are Pooled**: All donations are securely held in the JoyFund virtual escrow account, waiting to be matched with a person in need.

### Phase 2: The Enrollment (Finding a Beneficiary)

1.  **Identification & Verification**: A Social Worker identifies a pregnant woman in need (e.g., Mama Solange) and verifies her eligibility.
2.  **Digital ID Creation**: The Social Worker creates a `Beneficiary` profile in the system. The platform automatically generates a unique **Digital Health ID** (e.g., `BEN-0042`) for her.

### Phase 3: The Match & The "Instant-Care" Voucher

1.  **The Match**: The system's matching engine identifies Mama Solange as a high-priority case and assigns available funds from the escrow account.
2.  **The Approval**: A System Admin reviews and approves this match.
3.  **Voucher Generation**: Upon approval, the system creates a `CareVoucher` with two critical, secret codes:
    - A **6-digit Voucher Code** (e.g., `X9K3L2`) for check-in.
    - A **4-digit Patient PIN** for final confirmation (the "anti-fraud" key).
4.  **SMS Notification**: The system sends an SMS to Mama Solange with her Voucher Code, instructing her to present it at the designated partner hospital. The 4-digit PIN is kept secret for now.

### Phase 4: Receiving Care (The Hospital's Role)

1.  **Hospital Check-In**: Mama Solange arrives at the hospital and shows her SMS. The receptionist enters the 6-digit Voucher Code into the JoyFund Hospital Portal.
2.  **Funds Locked**: The system validates the code and "locks" the funds for her treatment. The Donor receives a real-time notification that their gift is now being used.
3.  **Care is Provided**: The hospital provides all necessary medical services to Mama Solange.

### Phase 5: Closing the Loop (Transparency & Payment)

1.  **The Anti-Fraud PIN**: After care is complete, the system sends a **second SMS** to Mama Solange containing her secret 4-digit Patient PIN.
2.  **Service Confirmation**: She provides this PIN to the nurse, who enters it into the portal. This is the **proof of service** and her confirmation that she is satisfied.
3.  **Instant Payout**: The correct PIN triggers the final step: the `CareVoucher` is marked as "Redeemed," and the funds are instantly transferred from the escrow account directly to the hospital's business account.
4.  **Final Notification**: The Donor receives a final, emotional update confirming that their contribution successfully funded a safe delivery.

---

## 4. Core Technology & Features

- **Backend**: Built on Django, providing a robust and secure foundation for financial transactions and data management.
- **Database**: PostgreSQL, ensuring data integrity and reliable record-keeping.
- **Mobile Money Integration**: Connects with payment aggregators (like Flutterwave, Notch Pay) to handle seamless MTN MoMo and Orange Money transactions.
- **Real-Time Transparency Dashboard**: A public-facing dashboard showing live stats on funds raised and lives impacted, building trust.
- **SMS Gateway**: Uses services like Orange SMS API to deliver critical voucher codes and PINs to beneficiaries, ensuring accessibility even without a smartphone.
- **Closed-Loop Audit Trail**: Every single action—from donation to payout—is recorded in the `VoucherAuditLog`, creating an immutable record for ultimate transparency.

---

## 5. Local Development (Without Docker)

This guide lets you run the backend directly on your Linux machine — no Docker required.

### Prerequisites

| Tool               | Version                            |
| :----------------- | :--------------------------------- |
| Python             | 3.12 or 3.13                       |
| PostgreSQL         | 14 + (with PostGIS extension)      |
| Redis              | 6 + (for Celery / Django Channels) |
| GDAL / GEOS / PROJ | see below                          |

> **Why GDAL?** The project uses **GeoDjango** (`PointField`) which requires the GDAL, GEOS, and PROJ native shared libraries to be present on the host machine.

> **Broker note:** The project's default Celery broker is **RabbitMQ** (see `.env.example`). For a quick local test you can swap it for Redis, but the instructions below show both options.

---

### Step 1 — Install GDAL, GEOS, and PROJ

Pick the section that matches your distro.

#### Ubuntu / Debian (20.04 LTS and later)

```bash
sudo apt update
sudo apt install -y \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    python3-gdal
```

Verify the installation:

```bash
gdal-config --version   # e.g. 3.4.1
geos-config --version   # e.g. 3.10.2
proj --version          # e.g. Rel. 8.2.1
```

#### Fedora / RHEL / Rocky Linux / AlmaLinux

```bash
# Enable EPEL first if on RHEL-based distro
sudo dnf install -y epel-release      # skip on Fedora

sudo dnf install -y \
    gdal \
    gdal-devel \
    geos \
    geos-devel \
    proj \
    proj-devel
```

#### Arch Linux / Manjaro

```bash
sudo pacman -Syu gdal geos proj
```

---

### Step 2 — Set GeoDjango Library Paths

Django needs to know where the native `.so` files live. Add the following to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) **and** to the project's `.env` file.

First, find the exact paths on your machine:

```bash
# GDAL
python3 -c "from ctypes.util import find_library; print(find_library('gdal'))"
# or
find /usr -name "libgdal.so*" 2>/dev/null | head -5

# GEOS
find /usr -name "libgeos_c.so*" 2>/dev/null | head -5

# PROJ data directory
find /usr -type d -name "proj" 2>/dev/null | head -5
```

Then add the paths to your `.env` **only if Django cannot find them automatically**:

```dotenv
# GeoDjango — these are OPTIONAL; only set them if you get a "Could not find GDAL library" error.
# Adjust paths to match the output of the find commands above.
GDAL_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/libgdal.so
GEOS_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/libgeos_c.so
PROJ_LIB=/usr/share/proj
```

> **How it works:** `settings.py` only applies `GDAL_LIBRARY_PATH` / `GEOS_LIBRARY_PATH` when those env vars are explicitly set. On most modern distros (Ubuntu 22.04+, Fedora 38+, Arch) GeoDjango finds the libraries automatically — you don't need to set them at all.

> **Path tips by distro:**
>
> - Ubuntu/Debian → `/usr/lib/x86_64-linux-gnu/`
> - Fedora/RHEL → `/usr/lib64/`
> - Arch Linux → `/usr/lib/`

---

### Step 3 — Install PostGIS

GeoDjango also requires the **PostGIS** extension on your PostgreSQL database.

```bash
# Ubuntu / Debian
sudo apt install -y postgis postgresql-14-postgis-3

# Fedora / RHEL
sudo dnf install -y postgis33_14   # adjust version suffix as needed

# Arch
sudo pacman -Syu postgis
```

Then enable it in your database:

```sql
-- run as the postgres superuser
CREATE EXTENSION postgis;
```

---

### Step 4 — Create and Activate a Virtual Environment

```bash
cd backend/

python3 -m venv env
source env/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 5 — Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

After copying `.env.example` to `.env`, update the following values — the example file is pre-configured for Docker service names, so you must adjust them for a local run:

```dotenv
SECRET_KEY=your-secret-key-here
DEBUG=True

# ⚠️ DB_HOST is 'db' in .env.example (Docker service name) — change it to localhost:
DB_HOST=localhost
DB_USER=joyfund       # or postgres, depending on your local pg setup
DB_PASSWORD=joyfund   # match whatever you created in PostgreSQL

# ⚠️ Broker URLs use Docker hostnames in .env.example — change them:
# Option A — RabbitMQ (default, matches .env.example)
CELERY_BROKER_URL=amqp://guest:guest@localhost:5672//
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Option B — Redis only (simpler for local testing, no RabbitMQ needed)
# CELERY_BROKER_URL=redis://localhost:6379/0
# CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Redis cache
CACHE_LOCATION=redis://localhost:6379/2
REDIS_HOST=localhost
```

> **RabbitMQ quick install** (if using Option A):
>
> ```bash
> # Ubuntu/Debian
> sudo apt install -y rabbitmq-server
> sudo systemctl enable --now rabbitmq-server
>
> # Fedora/RHEL
> sudo dnf install -y rabbitmq-server
> sudo systemctl enable --now rabbitmq-server
>
> # Arch
> sudo pacman -Syu rabbitmq
> sudo systemctl enable --now rabbitmq
> ```

---

### Step 6 — Run Migrations and Start the Server

```bash
# Apply migrations
python manage.py migrate

# (Optional) Create a superuser
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

The API will be available at **http://127.0.0.1:8000/**.  
The Swagger docs are at **http://127.0.0.1:8000/swagger/**.

---

### Step 7 — (Optional) Start Celery Workers

Open two additional terminals (with the virtualenv activated):

```bash
# Terminal 2 — Celery worker
celery -A backend worker --loglevel=info

# Terminal 3 — Celery beat scheduler
celery -A backend beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

---

### Troubleshooting

| Error                                                           | Likely Cause & Fix                                                                                                          |
| :-------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| `Could not find the GDAL library`                               | `GDAL_LIBRARY_PATH` in `.env` is wrong or GDAL is not installed. Run the `find` command in Step 2 and update the path.      |
| `cannot import name 'GEOSGeometry'`                             | GEOS library not found. Check `GEOS_LIBRARY_PATH`.                                                                          |
| `django.db.utils.OperationalError: could not connect to server` | PostgreSQL is not running or `DB_*` credentials are incorrect.                                                              |
| `ModuleNotFoundError: No module named 'gdal'`                   | `python3-gdal` (Ubuntu) or equivalent Python binding is missing. Install it, then re-run `pip install -r requirements.txt`. |
