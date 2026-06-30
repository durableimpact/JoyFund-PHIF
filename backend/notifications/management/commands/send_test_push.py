from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import json

User = get_user_model()


class Command(BaseCommand):
    help = "Send a test web push notification to all subscribed users or a specific user"

    def add_arguments(self, parser):
        parser.add_argument("--title", default="Test Notification", help="Notification title")
        parser.add_argument("--body", default="Test ivan", help="Notification body")
        parser.add_argument(
            "--user", type=int, default=None, help="User ID to send to (sends to all if omitted)"
        )
        parser.add_argument(
            "--image", default=None, help="Optional image URL to display in the push notification"
        )
        parser.add_argument(
            "--actions",
            default=None,
            help='Optional JSON list of action buttons, e.g. \'[{"action":"open","title":"Open"}]\'',
        )

    def handle(self, *args, **options):
        from notifications.webpush import send_push_notification_to_user, send_push_notification_to_all_users

        title = options["title"]
        body = options["body"]
        user_id = options["user"]
        image = options["image"] or None
        actions = None
        if options["actions"]:
            try:
                actions = json.loads(options["actions"])
            except json.JSONDecodeError:
                self.stderr.write(self.style.ERROR("Invalid JSON for --actions"))
                return

        if user_id:
            try:
                user = User.objects.get(id=user_id)
                count = send_push_notification_to_user(
                    user, title=title, body=body, image=image, actions=actions, tag="test"
                )
                self.stdout.write(
                    self.style.SUCCESS(f"Sent to user {user.email}: {count} subscription(s)")
                )
            except User.DoesNotExist:
                self.stderr.write(self.style.ERROR(f"User with id {user_id} not found"))
        else:
            count = send_push_notification_to_all_users(
                title=title, body=body, image=image, actions=actions, tag="test"
            )
            self.stdout.write(self.style.SUCCESS(f"Sent to all users: {count} subscription(s)"))
