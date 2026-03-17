from celery import shared_task
from .engine import run_matching_engine

@shared_task(name="vouchers.run_matching_engine_task")
def run_matching_engine_task():
    """
    A Celery task wrapper for the matching engine logic.
    """
    print("--- Running Matching Engine Task ---")
    assignment, message = run_matching_engine()
    print(f"--- Matching Engine Task Finished: {message} ---")
    return message
