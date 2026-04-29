from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.config import settings
from app.services.credits import (
    activate_pro,
    add_single_credit,
    can_convert,
    get_user,
    set_stripe_customer,
)

router = APIRouter()

PRODUCTS = {
    "single": {
        "name": "Single Book",
        "price_cents": 999,
        "description": "Convert 1 book (unlimited words)",
    },
    "pro": {
        "name": "Pro Monthly",
        "price_cents": 2999,
        "description": "Unlimited conversions for 30 days",
    },
}


class CheckoutRequest(BaseModel):
    product: str
    user_id: str


class UserStatusResponse(BaseModel):
    free_available: bool
    single_credits: int
    pro_active: bool
    free_word_limit: int


@router.get("/user/{user_id}/credits", response_model=UserStatusResponse)
async def get_credits(user_id: str):
    user = get_user(user_id)
    pro_active = user.pro_subscription and (
        user.pro_expires is not None and user.pro_expires > datetime.utcnow()
    )
    return UserStatusResponse(
        free_available=not user.free_used,
        single_credits=user.single_credits,
        pro_active=pro_active,
        free_word_limit=settings.free_word_limit,
    )


@router.post("/checkout")
async def create_checkout(req: CheckoutRequest):
    if req.product not in PRODUCTS:
        raise HTTPException(400, f"Unknown product. Available: {list(PRODUCTS.keys())}")

    if not settings.stripe_secret_key:
        raise HTTPException(500, "Stripe not configured")

    import stripe
    stripe.api_key = settings.stripe_secret_key
    product = PRODUCTS[req.product]

    if req.product == "pro":
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": product["name"]},
                    "unit_amount": product["price_cents"],
                    "recurring": {"interval": "month"},
                },
                "quantity": 1,
            }],
            metadata={"user_id": req.user_id, "product": req.product},
            success_url=f"{settings.frontend_url}/studio?payment=success",
            cancel_url=f"{settings.frontend_url}/studio?payment=cancelled",
        )
    else:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": product["name"]},
                    "unit_amount": product["price_cents"],
                },
                "quantity": 1,
            }],
            metadata={"user_id": req.user_id, "product": req.product},
            success_url=f"{settings.frontend_url}/studio?payment=success",
            cancel_url=f"{settings.frontend_url}/studio?payment=cancelled",
        )

    return {"checkout_url": session.url}


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if not settings.stripe_webhook_secret:
        raise HTTPException(500, "Webhook secret not configured")

    import stripe
    stripe.api_key = settings.stripe_secret_key

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(400, "Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"]["user_id"]
        product = session["metadata"]["product"]

        if session.get("customer"):
            set_stripe_customer(user_id, session["customer"])

        if product == "single":
            add_single_credit(user_id)
        elif product == "pro":
            activate_pro(user_id, datetime.utcnow() + timedelta(days=30))

    elif event["type"] == "invoice.paid":
        subscription = event["data"]["object"]
        if subscription.get("metadata", {}).get("user_id"):
            user_id = subscription["metadata"]["user_id"]
            activate_pro(user_id, datetime.utcnow() + timedelta(days=30))

    return {"status": "ok"}


@router.get("/pricing")
async def get_pricing():
    return {
        "free": {
            "name": "Free",
            "price": "$0",
            "description": f"1 free conversion up to {settings.free_word_limit:,} words",
        },
        "single": {
            "name": "Single Book",
            "price": "$9.99",
            "description": "1 book conversion, unlimited words",
        },
        "pro": {
            "name": "Pro",
            "price": "$29.99/mo",
            "description": "Unlimited conversions",
        },
    }
