#!/bin/bash

# Load Testing Script for JoyFund
# Usage: ./run_load_test.sh [test_name]

set -e

BACKEND_DIR="/home/ivantom/Desktop/Code/Projects/durable impact/JoyFund-PHIF/backend"
cd "$BACKEND_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== JoyFund Load Testing Script ===${NC}\n"

# Check if docker-compose is running
echo -e "${BLUE}[1/4] Checking Docker services...${NC}"
if ! docker-compose ps | grep -q "web-worker-1"; then
    echo -e "${RED}ERROR: Docker services not running!${NC}"
    echo "Run: docker-compose up -d"
    exit 1
fi
echo -e "${GREEN}✓ Docker services are running${NC}\n"

# Check if locust is installed
echo -e "${BLUE}[2/4] Checking Locust installation...${NC}"
if ! python -c "import locust" 2>/dev/null; then
    echo -e "${YELLOW}Installing Locust...${NC}"
    pip install locust >/dev/null 2>&1
fi
echo -e "${GREEN}✓ Locust is installed${NC}\n"

# Select test type
TEST_TYPE=${1:-"interactive"}

case "$TEST_TYPE" in
    "baseline")
        echo -e "${BLUE}[3/4] Running BASELINE test (50 users)...${NC}"
        echo -e "Duration: 1 minute | Expected: 100-500 req/sec\n"
        locust -f locustfile.py --host=http://localhost --users=50 --spawn-rate=5 --run-time=1m --headless
        ;;
    
    "light")
        echo -e "${BLUE}[3/4] Running LIGHT LOAD test (500 users)...${NC}"
        echo -e "Duration: 2 minutes | Expected: 1,000-3,000 req/sec\n"
        locust -f locustfile.py --host=http://localhost --users=500 --spawn-rate=50 --run-time=2m --headless
        ;;
    
    "medium")
        echo -e "${BLUE}[3/4] Running MEDIUM LOAD test (2,000 users)...${NC}"
        echo -e "Duration: 2 minutes | Expected: 5,000-15,000 req/sec\n"
        locust -f locustfile.py --host=http://localhost --users=2000 --spawn-rate=200 --run-time=2m --headless
        ;;
    
    "heavy")
        echo -e "${BLUE}[3/4] Running HEAVY LOAD test (5,000 users)...${NC}"
        echo -e "Duration: 3 minutes | Expected: 15,000-35,000 req/sec\n"
        locust -f locustfile.py --host=http://localhost --users=5000 --spawn-rate=500 --run-time=3m --headless
        ;;
    
    "stress")
        echo -e "${BLUE}[3/4] Running STRESS test (10,000 users)...${NC}"
        echo -e "Duration: 2 minutes | Expected: 40,000-50,000+ req/sec\n"
        locust -f locustfile.py::QuickLoadUser --host=http://localhost --users=10000 --spawn-rate=1000 --run-time=2m --headless
        ;;
    
    "interactive")
        echo -e "${BLUE}[3/4] Starting INTERACTIVE load test...${NC}"
        echo -e "Opening browser at http://localhost:8089"
        echo -e "You can control users and spawn rate from the UI\n"
        
        # Try to open browser
        if command -v xdg-open >/dev/null; then
            xdg-open http://localhost:8089 >/dev/null 2>&1 &
        elif command -v open >/dev/null; then
            open http://localhost:8089 >/dev/null 2>&1 &
        fi
        
        locust -f locustfile.py --host=http://localhost
        ;;
    
    "suite")
        echo -e "${BLUE}[3/4] Running FULL TEST SUITE...${NC}\n"
        
        echo -e "${YELLOW}--- Baseline Test (50 users) ---${NC}"
        locust -f locustfile.py --host=http://localhost --users=50 --spawn-rate=5 --run-time=1m --headless
        sleep 10
        
        echo -e "\n${YELLOW}--- Light Load Test (500 users) ---${NC}"
        locust -f locustfile.py --host=http://localhost --users=500 --spawn-rate=50 --run-time=2m --headless
        sleep 10
        
        echo -e "\n${YELLOW}--- Medium Load Test (2,000 users) ---${NC}"
        locust -f locustfile.py --host=http://localhost --users=2000 --spawn-rate=200 --run-time=2m --headless
        sleep 10
        
        echo -e "\n${YELLOW}--- Heavy Load Test (5,000 users) ---${NC}"
        locust -f locustfile.py --host=http://localhost --users=5000 --spawn-rate=500 --run-time=3m --headless
        sleep 10
        
        echo -e "\n${YELLOW}--- Stress Test (10,000 users) ---${NC}"
        locust -f locustfile.py::QuickLoadUser --host=http://localhost --users=10000 --spawn-rate=1000 --run-time=2m --headless
        ;;
    
    *)
        echo -e "${RED}Unknown test type: $TEST_TYPE${NC}\n"
        echo "Usage: ./run_load_test.sh [test_type]"
        echo ""
        echo "Available test types:"
        echo "  baseline    - 50 users, 1 minute (warm-up)"
        echo "  light       - 500 users, 2 minutes"
        echo "  medium      - 2,000 users, 2 minutes"
        echo "  heavy       - 5,000 users, 3 minutes"
        echo "  stress      - 10,000 users, 2 minutes (max load)"
        echo "  interactive - Web UI at http://localhost:8089"
        echo "  suite       - Run all tests sequentially"
        exit 1
        ;;
esac

echo -e "\n${BLUE}[4/4] Load test complete!${NC}\n"

# Show monitoring tips
echo -e "${GREEN}=== Monitoring Tips ===${NC}"
echo -e "While test is running, in another terminal run:"
echo -e "  ${YELLOW}docker stats${NC} - View CPU/Memory usage"
echo -e "  ${YELLOW}docker-compose logs -f web-worker-1${NC} - View Django logs"
echo -e "  ${YELLOW}docker-compose exec db psql -U joyfund -d joyfund -c \"SELECT count(*) FROM pg_stat_activity;\"${NC} - Check DB connections"
echo -e "  ${YELLOW}open http://localhost:15672${NC} - RabbitMQ admin (guest/guest)"
echo ""
