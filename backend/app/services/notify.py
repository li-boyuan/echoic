import logging

from app.config import settings

logger = logging.getLogger(__name__)


def send_completion_email(email: str, filename: str, job_id: str):
    if not settings.resend_api_key or not email:
        return

    try:
        import resend
        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": "Echoic <support@echoic.studio>",
            "to": email,
            "subject": f"Your audiobook is ready: {filename}",
            "html": f"""
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                    <h2 style="color: #3b82f6;">Your audiobook is ready!</h2>
                    <p>Your audiobook <strong>{filename}</strong> has been generated successfully.</p>
                    <p>
                        <a href="{settings.frontend_url}/studio?job={job_id}"
                           style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
                            Listen & Download
                        </a>
                    </p>
                    <p style="color: #71717a; font-size: 12px; margin-top: 24px;">
                        echoic.studio — AI-powered audiobook generation
                    </p>
                </div>
            """,
        })
        logger.info("Completion email sent to %s for job %s", email, job_id)
    except Exception as e:
        logger.error("Failed to send completion email: %s", e)


def send_failure_email(email: str, filename: str, error: str):
    if not settings.resend_api_key or not email:
        return

    try:
        import resend
        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": "Echoic <support@echoic.studio>",
            "to": email,
            "subject": f"Audiobook generation failed: {filename}",
            "html": f"""
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                    <h2 style="color: #ef4444;">Something went wrong</h2>
                    <p>We couldn't generate the audiobook for <strong>{filename}</strong>.</p>
                    <p style="color: #71717a; font-size: 14px;">Error: {error}</p>
                    <p>You can try again from the studio — your credit has not been consumed.</p>
                    <p>
                        <a href="{settings.frontend_url}/studio"
                           style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
                            Go to Studio
                        </a>
                    </p>
                    <p style="color: #71717a; font-size: 12px; margin-top: 24px;">
                        echoic.studio — AI-powered audiobook generation
                    </p>
                </div>
            """,
        })
        logger.info("Failure email sent to %s", email)
    except Exception as e:
        logger.error("Failed to send failure email: %s", e)
