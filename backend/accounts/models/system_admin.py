from .base import BaseProfile


class SystemAdmin(BaseProfile):

    def __str__(self):
        return "System Admin: " + self.user.username
