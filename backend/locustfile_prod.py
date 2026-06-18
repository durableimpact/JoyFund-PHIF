"""
Stress/load test for JoyFund.

Frontend users hit --host (e.g. https://joy-fund.com).
API users hit --api-host (e.g. https://api.joy-fund.com).

All credentials passed via CLI arguments — nothing hardcoded.

Usage (frontend only):
  locust -f locustfile_prod.py --host=https://joy-fund.com

Usage (frontend + API):
  locust -f locustfile_prod.py --host=https://joy-fund.com \
    --api-host=https://api.joy-fund.com \
    --client-id 'xPqWEK...' \
    --client-secret 'dsQ7Rl...' \
    --admin-user 'admin@joyfund.com:password' \
    --donor-users 'donor1@example.com:password,donor2@example.com:password'

Headless:
  locust -f locustfile_prod.py --host=https://joy-fund.com \
    --api-host=https://api.joy-fund.com \
    --client-id 'xPqWEK...' \
    --client-secret 'dsQ7Rl...' \
    --admin-user 'admin@joyfund.com:password' \
    --donor-users 'donor1@example.com:password,donor2@example.com:password' \
    --users 1000 --spawn-rate 50 --run-time 10m --headless \
    --html report.html --csv results
"""

import sys
from random import choice, randint

from locust import HttpUser, between, events, task
from locust.runners import MasterRunner, WorkerRunner

# ── Runtime config (populated by init_command_line_parser) ──────────────────
CLIENT_ID = None
CLIENT_SECRET = None
ADMIN_USER = None
DONOR_USERS = None
API_HOST = None


def _load_config(environment):
    global CLIENT_ID, CLIENT_SECRET, ADMIN_USER, DONOR_USERS, API_HOST

    opts = environment.parsed_options

    if opts.api_host:
        API_HOST = opts.api_host.rstrip("/")

    if opts.client_id:
        CLIENT_ID = opts.client_id
    if opts.client_secret:
        CLIENT_SECRET = opts.client_secret

    if opts.admin_user:
        parts = opts.admin_user.split(":", 1)
        if len(parts) != 2:
            print("error: --admin-user must be in format 'username:password'")
            sys.exit(1)
        ADMIN_USER = {"username": parts[0], "password": parts[1]}

    if opts.donor_users:
        DONOR_USERS = []
        for entry in opts.donor_users.split(","):
            entry = entry.strip()
            if not entry:
                continue
            parts = entry.split(":", 1)
            if len(parts) != 2:
                print(
                    f"error: donor entry '{entry}' must be in format 'username:password'"
                )
                sys.exit(1)
            DONOR_USERS.append({"username": parts[0], "password": parts[1]})

    _print_config_status()


def _print_config_status():
    if not API_HOST:
        print("INFO: --api-host not set — only JoyFundBrowserUser (frontend) will be available")
    if API_HOST and not (CLIENT_ID and CLIENT_SECRET and ADMIN_USER and DONOR_USERS):
        print("INFO: Auth args incomplete — authenticated user classes unavailable")


CAMPAIGN_SLUGS = [
    "education-for-all",
    "healthcare-access",
    "emergency-relief",
]

BENEFICIARY_IDS = list(range(1, 201))


@events.init_command_line_parser.add_listener
def _(parser):
    parser.add_argument(
        "--client-id",
        required=False,
        default=None,
        help="OAuth2 application client_id",
    )
    parser.add_argument(
        "--client-secret",
        required=False,
        default=None,
        help="OAuth2 application client_secret",
    )
    parser.add_argument(
        "--admin-user",
        required=False,
        default=None,
        help="Admin credentials as 'username:password'",
    )
    parser.add_argument(
        "--donor-users",
        required=False,
        default=None,
        help="Comma-separated donor credentials 'u1:p1,u2:p2'",
    )
    parser.add_argument(
        "--api-host",
        required=False,
        default=None,
        help="API base URL (e.g. https://api.joy-fund.com)",
    )


@events.init.add_listener
def _(environment, **_kwargs):
    _load_config(environment)
    if isinstance(environment.runner, (MasterRunner, WorkerRunner)):
        print(
            "Distributed mode detected. Ensure PgBouncer DEFAULT_POOL_SIZE "
            "is sized to handle all worker nodes × worker concurrency."
        )


def authenticate(client, username, password):
    resp = client.post(
        API_HOST + "/auth/token/",
        json={
            "grant_type": "password",
            "username": username,
            "password": password,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },
        name="auth:login",
    )
    if resp.status_code == 200:
        data = resp.json()
        return data["access_token"], data["refresh_token"]
    return None, None


class JoyFundBrowserUser(HttpUser):
    """Simulates a visitor browsing the Next.js frontend."""

    wait_time = between(3, 8)

    @task(8)
    def view_homepage(self):
        self.client.get("/", name="frontend:homepage")

    @task(6)
    def view_campaigns_list(self):
        self.client.get("/campaigns", name="frontend:campaigns_list")

    @task(4)
    def view_campaign_detail(self):
        slug = choice(CAMPAIGN_SLUGS)
        self.client.get(f"/campaigns/{slug}", name="frontend:campaign_detail")

    @task(3)
    def view_hospitals(self):
        self.client.get("/hospitals", name="frontend:hospitals")

    @task(2)
    def view_about(self):
        self.client.get("/about", name="frontend:about")

    @task(1)
    def view_contact(self):
        self.client.get("/contact", name="frontend:contact")

    @task(5)
    def view_beneficiaries(self):
        self.client.get("/beneficiaries", name="frontend:beneficiaries")


class JoyFundPublicAPIUser(HttpUser):
    """Hits public API endpoints (no auth required)."""

    wait_time = between(1, 3)

    def on_start(self):
        if not API_HOST:
            print("WARNING: JoyFundPublicAPIUser skipped (--api-host not set)")
            self.environment.runner.quit()
            return

    @task(10)
    def list_campaigns(self):
        self.client.get(
            API_HOST + "/api/campaigns/?page=1", name="api:public:campaigns"
        )

    @task(6)
    def campaign_detail(self):
        slug = choice(CAMPAIGN_SLUGS)
        self.client.get(
            API_HOST + f"/api/campaigns/{slug}/", name="api:public:campaign_detail"
        )

    @task(4)
    def platform_stats(self):
        self.client.get(
            API_HOST + "/api/platform-stats/", name="api:public:platform_stats"
        )

    @task(3)
    def leaderboard(self):
        self.client.get(
            API_HOST + "/api/campaigns/leaderboard/", name="api:public:leaderboard"
        )

    @task(2)
    def health_check(self):
        self.client.get(API_HOST + "/health/", name="api:public:health")

    @task(1)
    def donor_register_page(self):
        self.client.get(
            API_HOST + "/api/accounts/donors/register/",
            name="api:public:register_get",
        )


class JoyFundDonorUser(HttpUser):
    """Authenticated donor — browses campaigns, creates campaigns."""

    wait_time = between(2, 6)

    def on_start(self):
        if not API_HOST or not DONOR_USERS or not CLIENT_ID or not CLIENT_SECRET:
            print("WARNING: JoyFundDonorUser skipped (missing --api-host or auth args)")
            self.environment.runner.quit()
            return

        creds = choice(DONOR_USERS)
        self.token, self.refresh = authenticate(
            self.client, creds["username"], creds["password"]
        )
        if not self.token:
            self.environment.runner.quit()
            return

        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    @task(8)
    def list_campaigns(self):
        self.client.get(
            API_HOST + "/api/campaigns/?page=1",
            headers=self.headers,
            name="api:donor:campaigns",
        )

    @task(5)
    def my_campaigns(self):
        self.client.get(
            API_HOST + "/api/campaigns/my-campaigns/",
            headers=self.headers,
            name="api:donor:my_campaigns",
        )

    @task(4)
    def campaign_detail(self):
        slug = choice(CAMPAIGN_SLUGS)
        self.client.get(
            API_HOST + f"/api/campaigns/{slug}/",
            headers=self.headers,
            name="api:donor:campaign_detail",
        )

    @task(3)
    def donor_info(self):
        self.client.get(
            API_HOST + "/api/accounts/donor/info/",
            headers=self.headers,
            name="api:donor:info",
        )

    @task(2)
    def list_hospitals(self):
        self.client.get(
            API_HOST + "/api/hospitals/?page=1",
            headers=self.headers,
            name="api:donor:hospitals",
        )

    @task(1)
    def create_campaign(self):
        self.client.post(
            API_HOST + "/api/campaigns/",
            headers=self.headers,
            json={
                "title": f"Load Test Campaign {randint(1, 99999)}",
                "description": "Created during load test",
                "target_amount": str(randint(10000, 500000)),
            },
            name="api:donor:create_campaign",
        )


class JoyFundAdminUser(HttpUser):
    """Authenticated system admin — heavier reads on admin endpoints."""

    wait_time = between(2, 6)

    def on_start(self):
        if not API_HOST or not ADMIN_USER or not CLIENT_ID or not CLIENT_SECRET:
            print("WARNING: JoyFundAdminUser skipped (missing --api-host or auth args)")
            self.environment.runner.quit()
            return

        self.token, self.refresh = authenticate(
            self.client, ADMIN_USER["username"], ADMIN_USER["password"]
        )
        if not self.token:
            self.environment.runner.quit()
            return

        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    @task(10)
    def list_beneficiaries(self):
        self.client.get(
            API_HOST + "/api/beneficiaries/?page=1",
            headers=self.headers,
            name="api:admin:beneficiaries",
        )

    @task(8)
    def list_campaigns(self):
        self.client.get(
            API_HOST + "/api/campaigns/?page=1",
            headers=self.headers,
            name="api:admin:campaigns",
        )

    @task(6)
    def list_hospitals(self):
        self.client.get(
            API_HOST + "/api/hospitals/?page=1",
            headers=self.headers,
            name="api:admin:hospitals",
        )

    @task(5)
    def list_users(self):
        self.client.get(
            API_HOST + "/api/users/?page=1",
            headers=self.headers,
            name="api:admin:users",
        )

    @task(4)
    def beneficiary_detail(self):
        bid = choice(BENEFICIARY_IDS)
        self.client.get(
            API_HOST + f"/api/beneficiaries/{bid}/",
            headers=self.headers,
            name="api:admin:beneficiary_detail",
        )

    @task(3)
    def campaign_balances(self):
        self.client.get(
            API_HOST + "/api/campaigns/available-balances/",
            headers=self.headers,
            name="api:admin:campaign_balances",
        )

    @task(2)
    def donor_list(self):
        self.client.get(
            API_HOST + "/api/accounts/donors/",
            headers=self.headers,
            name="api:admin:donors",
        )

    @task(1)
    def admin_info(self):
        self.client.get(
            API_HOST + "/api/accounts/system-admin/info/",
            headers=self.headers,
            name="api:admin:info",
        )
