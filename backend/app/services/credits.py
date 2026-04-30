import json
import logging
import os
import threading
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta

from app.config import settings

logger = logging.getLogger(__name__)

CREDITS_FILE = os.environ.get("CREDITS_FILE", "data/credits.json")


@dataclass
class UserCredits:
    user_id: str
    free_used: bool = False
    single_credits: int = 0
    pro_subscription: bool = False
    pro_expires: str | None = None
    stripe_customer_id: str | None = None


_users: dict[str, UserCredits] = {}
_lock = threading.Lock()


def _load():
    global _users
    if os.path.exists(CREDITS_FILE):
        with open(CREDITS_FILE, "r") as f:
            data = json.load(f)
        _users = {uid: UserCredits(**rec) for uid, rec in data.items()}


def _save():
    os.makedirs(os.path.dirname(CREDITS_FILE) or ".", exist_ok=True)
    tmp = CREDITS_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump({uid: asdict(u) for uid, u in _users.items()}, f)
    os.replace(tmp, CREDITS_FILE)


_load()


def get_user(user_id: str) -> UserCredits:
    with _lock:
        if user_id not in _users:
            _users[user_id] = UserCredits(user_id=user_id)
            _save()
        return _users[user_id]


def can_convert(user_id: str, word_count: int) -> tuple[bool, str]:
    user = get_user(user_id)

    if user.pro_subscription:
        if user.pro_expires is None or datetime.fromisoformat(user.pro_expires) > datetime.utcnow():
            return True, "pro"
        with _lock:
            user.pro_subscription = False
            _save()

    if not user.free_used and word_count <= settings.free_word_limit:
        return True, "free"

    if user.single_credits > 0:
        return True, "single"

    return False, "none"


def consume_credit(user_id: str, tier: str):
    user = get_user(user_id)
    with _lock:
        if tier == "free":
            user.free_used = True
        elif tier == "single":
            user.single_credits -= 1
        _save()


def add_single_credit(user_id: str):
    user = get_user(user_id)
    with _lock:
        user.single_credits += 1
        _save()


def activate_pro(user_id: str, expires: datetime):
    user = get_user(user_id)
    with _lock:
        user.pro_subscription = True
        user.pro_expires = expires.isoformat()
        _save()


def set_stripe_customer(user_id: str, customer_id: str):
    user = get_user(user_id)
    with _lock:
        user.stripe_customer_id = customer_id
        _save()


def grant_admin_access():
    for uid in settings.admin_user_ids:
        user = get_user(uid)
        if not user.pro_subscription:
            with _lock:
                user.pro_subscription = True
                user.pro_expires = None
                _save()
            logger.info("Granted admin access to %s", uid)


def sync_from_stripe():
    if not settings.stripe_secret_key:
        logger.warning("Stripe not configured, skipping credit sync")
        return

    if os.path.exists(CREDITS_FILE):
        logger.info("Credits file exists, skipping Stripe sync")
        return

    import stripe
    stripe.api_key = settings.stripe_secret_key

    logger.info("No credits file found — rebuilding from Stripe payment history")
    restored = 0

    sessions = stripe.checkout.Session.list(status="complete", limit=100)
    for session in sessions.auto_paging_iter():
        meta = session.get("metadata", {})
        user_id = meta.get("user_id")
        product = meta.get("product")
        if not user_id or not product:
            continue

        if session.get("customer"):
            set_stripe_customer(user_id, session["customer"])

        if product == "single":
            add_single_credit(user_id)
            restored += 1
        elif product == "pro":
            activate_pro(user_id, datetime.utcnow() + timedelta(days=30))
            restored += 1

    logger.info("Restored credits for %d payments from Stripe", restored)
