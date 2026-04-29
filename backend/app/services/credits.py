from dataclasses import dataclass, field
from datetime import datetime

from app.config import settings


@dataclass
class UserCredits:
    user_id: str
    free_used: bool = False
    single_credits: int = 0
    pro_subscription: bool = False
    pro_expires: datetime | None = None
    stripe_customer_id: str | None = None


_users: dict[str, UserCredits] = {}


def get_user(user_id: str) -> UserCredits:
    if user_id not in _users:
        _users[user_id] = UserCredits(user_id=user_id)
    return _users[user_id]


def can_convert(user_id: str, word_count: int) -> tuple[bool, str]:
    user = get_user(user_id)

    if user.pro_subscription:
        if user.pro_expires and user.pro_expires > datetime.utcnow():
            return True, "pro"
        user.pro_subscription = False

    if not user.free_used and word_count <= settings.free_word_limit:
        return True, "free"

    if user.single_credits > 0:
        return True, "single"

    return False, "none"


def consume_credit(user_id: str, tier: str):
    user = get_user(user_id)
    if tier == "free":
        user.free_used = True
    elif tier == "single":
        user.single_credits -= 1


def add_single_credit(user_id: str):
    user = get_user(user_id)
    user.single_credits += 1


def activate_pro(user_id: str, expires: datetime):
    user = get_user(user_id)
    user.pro_subscription = True
    user.pro_expires = expires


def set_stripe_customer(user_id: str, customer_id: str):
    user = get_user(user_id)
    user.stripe_customer_id = customer_id
